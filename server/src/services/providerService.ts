/**
 * Provider Management Service
 *
 * Business logic for admin provider CRUD, scheduling, and conflict detection.
 *
 * @module providerService
 * @task US_036 TASK_003
 */

import { pool } from '../config/database';
import { logAuditEntry } from '../utils/auditLogger';
import { AuditAction } from '../types/audit.types';
import { ApiError } from '../types';
import logger from '../utils/logger';
import redisClient from '../utils/redisClient';

async function invalidateProviderCache(): Promise<void> {
  try {
    await redisClient.del('providers:list');
    await redisClient.del('appointment-availability:all');
  } catch (err) {
    logger.warn('Failed to invalidate provider cache', err);
  }
}

interface ScheduleEntry {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
}

function detectScheduleOverlap(
  schedules: ScheduleEntry[],
): { hasOverlap: boolean; conflicts: ScheduleEntry[] } {
  const byDay: Record<number, ScheduleEntry[]> = {};
  for (const s of schedules) {
    if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
    byDay[s.day_of_week].push(s);
  }
  for (const day in byDay) {
    const sorted = byDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end_time > sorted[i + 1].start_time) {
        return { hasOverlap: true, conflicts: [sorted[i], sorted[i + 1]] };
      }
    }
  }
  return { hasOverlap: false, conflicts: [] };
}

export interface GetAllProvidersParams {
  page: number;
  limit: number;
  department_id?: number;
  specialty?: string;
  status?: string;
}

export async function getAllProviders(params: GetAllProvidersParams) {
  const { page, limit, department_id, specialty, status } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (number | string | boolean)[] = [];
  let paramIndex = 1;

  if (department_id) {
    conditions.push(`pd.department_id = $${paramIndex++}`);
    values.push(department_id);
  }
  if (specialty) {
    conditions.push(`pp.specialty ILIKE $${paramIndex++}`);
    values.push(`%${specialty}%`);
  }
  if (status === 'active') {
    conditions.push(`u.is_active = $${paramIndex++}`);
    values.push(true);
  } else if (status === 'inactive') {
    conditions.push(`u.is_active = $${paramIndex++}`);
    values.push(false);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(DISTINCT pp.id)
    FROM provider_profiles pp
    JOIN users u ON pp.user_id = u.id
    LEFT JOIN provider_departments pd ON pp.id = pd.provider_id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataQuery = `
    SELECT pp.id, pp.user_id, pp.specialty, pp.license_number,
           u.first_name, u.last_name, u.email, u.phone_number, u.is_active,
           STRING_AGG(DISTINCT d.name, ', ' ORDER BY d.name) AS departments,
           COALESCE(SUM(
             CASE WHEN ps.is_available THEN
               EXTRACT(EPOCH FROM (ps.end_time - ps.start_time)) / 3600
             ELSE 0 END
           ), 0)::numeric(5,1) AS total_weekly_hours
    FROM provider_profiles pp
    JOIN users u ON pp.user_id = u.id
    LEFT JOIN provider_departments pd ON pp.id = pd.provider_id
    LEFT JOIN departments d ON pd.department_id = d.id
    LEFT JOIN provider_schedules ps ON pp.id = ps.provider_id
    ${whereClause}
    GROUP BY pp.id, u.id
    ORDER BY u.last_name, u.first_name
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  values.push(limit, offset);

  const result = await pool.query(dataQuery, values);

  return {
    providers: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProviderById(providerId: number) {
  const query = `
    SELECT pp.id, pp.user_id, pp.specialty, pp.license_number,
           u.first_name, u.last_name, u.email, u.phone_number, u.is_active,
           STRING_AGG(DISTINCT d.name, ', ' ORDER BY d.name) AS departments
    FROM provider_profiles pp
    JOIN users u ON pp.user_id = u.id
    LEFT JOIN provider_departments pd ON pp.id = pd.provider_id
    LEFT JOIN departments d ON pd.department_id = d.id
    WHERE pp.id = $1
    GROUP BY pp.id, u.id
  `;
  const result = await pool.query(query, [providerId]);
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Provider not found');
  }
  return result.rows[0];
}

export async function createProvider(
  data: {
    user_id: number;
    specialty: string;
    license_number?: string;
    department_assignments: { department_id: number; primary_department: boolean }[];
    weekly_schedule: ScheduleEntry[];
  },
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  const userCheck = await pool.query(
    "SELECT id, role FROM users WHERE id = $1 AND role IN ('doctor', 'staff')",
    [data.user_id],
  );
  if (userCheck.rows.length === 0) {
    throw new ApiError(400, 'User not found or does not have doctor/staff role');
  }

  const existingProvider = await pool.query(
    'SELECT id FROM provider_profiles WHERE user_id = $1',
    [data.user_id],
  );
  if (existingProvider.rows.length > 0) {
    throw new ApiError(409, 'User already has a provider profile');
  }

  if (data.weekly_schedule.length > 0) {
    const overlap = detectScheduleOverlap(data.weekly_schedule);
    if (overlap.hasOverlap) {
      throw new ApiError(400, 'Schedule has overlapping time slots');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const providerResult = await client.query(
      'INSERT INTO provider_profiles (user_id, specialty, license_number) VALUES ($1, $2, $3) RETURNING *',
      [data.user_id, data.specialty, data.license_number || null],
    );
    const provider = providerResult.rows[0];

    for (const dept of data.department_assignments) {
      await client.query(
        'INSERT INTO provider_departments (provider_id, department_id, primary_department) VALUES ($1, $2, $3)',
        [provider.id, dept.department_id, dept.primary_department],
      );
    }

    for (const sched of data.weekly_schedule) {
      await client.query(
        'INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, is_available) VALUES ($1, $2, $3, $4, $5)',
        [provider.id, sched.day_of_week, sched.start_time, sched.end_time, sched.is_available ?? true],
      );
    }

    await client.query('COMMIT');

    await logAuditEntry({
      user_id: adminId,
      action: AuditAction.CREATE,
      table_name: 'provider_profiles',
      record_id: String(provider.id),
      new_values: { ...provider, department_assignments: data.department_assignments },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await invalidateProviderCache();

    return await getProviderById(provider.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateProvider(
  providerId: number,
  data: {
    specialty?: string;
    license_number?: string;
    department_assignments?: { department_id: number; primary_department: boolean }[];
  },
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  const oldProvider = await getProviderById(providerId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.specialty !== undefined) {
      setClauses.push(`specialty = $${paramIndex++}`);
      values.push(data.specialty);
    }
    if (data.license_number !== undefined) {
      setClauses.push(`license_number = $${paramIndex++}`);
      values.push(data.license_number);
    }

    if (setClauses.length > 0) {
      setClauses.push('updated_at = NOW()');
      values.push(providerId);
      await client.query(
        `UPDATE provider_profiles SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    if (data.department_assignments) {
      await client.query('DELETE FROM provider_departments WHERE provider_id = $1', [providerId]);
      for (const dept of data.department_assignments) {
        await client.query(
          'INSERT INTO provider_departments (provider_id, department_id, primary_department) VALUES ($1, $2, $3)',
          [providerId, dept.department_id, dept.primary_department],
        );
      }
    }

    await client.query('COMMIT');

    await logAuditEntry({
      user_id: adminId,
      action: AuditAction.UPDATE,
      table_name: 'provider_profiles',
      record_id: String(providerId),
      old_values: oldProvider,
      new_values: data,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await invalidateProviderCache();

    return await getProviderById(providerId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getProviderSchedule(providerId: number) {
  await getProviderById(providerId);

  const scheduleResult = await pool.query(
    'SELECT id, day_of_week, start_time::text, end_time::text, is_available FROM provider_schedules WHERE provider_id = $1 ORDER BY day_of_week, start_time',
    [providerId],
  );

  const blockedResult = await pool.query(
    'SELECT id, blocked_date, start_time::text, end_time::text, reason FROM provider_blocked_times WHERE provider_id = $1 AND blocked_date >= CURRENT_DATE ORDER BY blocked_date',
    [providerId],
  );

  const appointmentsResult = await pool.query(
    `SELECT a.id, a.appointment_date, a.duration_minutes, a.status
     FROM appointments a
     WHERE a.doctor_id = (SELECT user_id FROM provider_profiles WHERE id = $1)
       AND a.appointment_date >= NOW()
       AND a.status NOT IN ('cancelled', 'completed')
     ORDER BY a.appointment_date`,
    [providerId],
  );

  return {
    weekly_schedule: scheduleResult.rows,
    blocked_times: blockedResult.rows,
    existing_appointments: appointmentsResult.rows,
  };
}

export async function updateProviderSchedule(
  providerId: number,
  scheduleEntries: ScheduleEntry[],
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  await getProviderById(providerId);

  if (scheduleEntries.length > 0) {
    for (const entry of scheduleEntries) {
      if (entry.start_time >= entry.end_time) {
        throw new ApiError(400, `Schedule entry start_time must be before end_time (day ${entry.day_of_week})`);
      }
    }

    const overlap = detectScheduleOverlap(scheduleEntries);
    if (overlap.hasOverlap) {
      throw new ApiError(400, 'Schedule has overlapping time slots');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM provider_schedules WHERE provider_id = $1', [providerId]);

    for (const entry of scheduleEntries) {
      await client.query(
        'INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, is_available) VALUES ($1, $2, $3, $4, $5)',
        [providerId, entry.day_of_week, entry.start_time, entry.end_time, entry.is_available ?? true],
      );
    }

    await client.query('COMMIT');

    await logAuditEntry({
      user_id: adminId,
      action: AuditAction.UPDATE,
      table_name: 'provider_schedules',
      record_id: String(providerId),
      new_values: { schedule_count: scheduleEntries.length },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await invalidateProviderCache();

    return await getProviderSchedule(providerId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function createBlockedTime(
  providerId: number,
  data: {
    blocked_date: string;
    start_time: string;
    end_time: string;
    reason: string;
  },
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  await getProviderById(providerId);

  if (data.start_time >= data.end_time) {
    throw new ApiError(400, 'Start time must be before end time');
  }

  const providerUserResult = await pool.query(
    'SELECT user_id FROM provider_profiles WHERE id = $1',
    [providerId],
  );
  const providerUserId = providerUserResult.rows[0].user_id;

  const conflicts = await pool.query(
    `SELECT a.id, a.appointment_date, a.duration_minutes, a.status
     FROM appointments a
     WHERE a.doctor_id = $1
       AND a.appointment_date::date = $2
       AND a.appointment_date::time >= $3::time
       AND a.appointment_date::time < $4::time
       AND a.status NOT IN ('cancelled', 'completed')`,
    [providerUserId, data.blocked_date, data.start_time, data.end_time],
  );

  if (conflicts.rows.length > 0) {
    throw new ApiError(409, 'Blocked time conflicts with existing appointments');
  }

  const result = await pool.query(
    `INSERT INTO provider_blocked_times (provider_id, blocked_date, start_time, end_time, reason, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [providerId, data.blocked_date, data.start_time, data.end_time, data.reason, adminId],
  );

  await logAuditEntry({
    user_id: adminId,
    action: AuditAction.CREATE,
    table_name: 'provider_blocked_times',
    record_id: String(result.rows[0].id),
    new_values: result.rows[0],
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  await invalidateProviderCache();

  return result.rows[0];
}

export async function deleteProvider(
  providerId: number,
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  const provider = await getProviderById(providerId);

  const providerUserResult = await pool.query(
    'SELECT user_id FROM provider_profiles WHERE id = $1',
    [providerId],
  );
  const providerUserId = providerUserResult.rows[0].user_id;

  const futureResult = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM appointments a
     WHERE a.doctor_id = $1
       AND a.appointment_date >= NOW()
       AND a.status NOT IN ('cancelled', 'completed')`,
    [providerUserId],
  );

  if (futureResult.rows[0].count > 0) {
    throw new ApiError(
      409,
      'Provider has future appointments. Reassign appointments before deletion.',
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE appointments SET is_reassignment_required = TRUE, original_provider_id = $1, reassignment_reason = 'provider_deleted'
       WHERE doctor_id = $2 AND status NOT IN ('cancelled', 'completed')`,
      [providerId, providerUserId],
    );

    await client.query('DELETE FROM provider_blocked_times WHERE provider_id = $1', [providerId]);
    await client.query('DELETE FROM provider_schedules WHERE provider_id = $1', [providerId]);
    await client.query('DELETE FROM provider_departments WHERE provider_id = $1', [providerId]);
    await client.query('DELETE FROM provider_profiles WHERE id = $1', [providerId]);

    await client.query('COMMIT');

    await logAuditEntry({
      user_id: adminId,
      action: AuditAction.DELETE,
      table_name: 'provider_profiles',
      record_id: String(providerId),
      old_values: provider,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await invalidateProviderCache();

    return { message: 'Provider deleted successfully' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getProviderAppointments(providerId: number) {
  const providerUserResult = await pool.query(
    'SELECT user_id FROM provider_profiles WHERE id = $1',
    [providerId],
  );
  if (providerUserResult.rows.length === 0) {
    throw new ApiError(404, 'Provider not found');
  }
  const providerUserId = providerUserResult.rows[0].user_id;

  const result = await pool.query(
    `SELECT a.id, a.appointment_date, a.duration_minutes, a.status, a.appointment_type,
            u.first_name AS patient_first_name, u.last_name AS patient_last_name, u.phone_number AS patient_phone
     FROM appointments a
     LEFT JOIN users u ON a.patient_id = u.id
     WHERE a.doctor_id = $1
       AND a.appointment_date >= NOW()
       AND a.status NOT IN ('cancelled', 'completed')
     ORDER BY a.appointment_date`,
    [providerUserId],
  );

  return result.rows;
}
