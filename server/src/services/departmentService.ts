/**
 * Department Management Service
 *
 * Business logic for admin department CRUD operations.
 * Handles listing, creation, updating, and deactivation
 * with audit logging and Redis cache invalidation.
 *
 * @module departmentService
 * @task US_036 TASK_002
 */

import { pool } from '../config/database';
import { logAuditEntry } from '../utils/auditLogger';
import { AuditAction } from '../types/audit.types';
import { ApiError } from '../types';
import logger from '../utils/logger';
import redisClient from '../utils/redisClient';

async function invalidateDepartmentCache(): Promise<void> {
  try {
    await redisClient.del('departments:list');
    await redisClient.del('appointment-availability:all');
  } catch (err) {
    logger.warn('Failed to invalidate department cache', err);
  }
}

export interface GetAllDepartmentsParams {
  page: number;
  limit: number;
  status?: string;
}

export async function getAllDepartments(params: GetAllDepartmentsParams) {
  const { page, limit, status } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: (boolean | number)[] = [];
  let paramIndex = 1;

  if (status === 'active') {
    conditions.push(`d.is_active = $${paramIndex++}`);
    values.push(true);
  } else if (status === 'inactive') {
    conditions.push(`d.is_active = $${paramIndex++}`);
    values.push(false);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM departments d ${whereClause}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataQuery = `
    SELECT d.id, d.name, d.code, d.description, d.is_active,
           d.operating_hours, d.location, d.phone_number, d.email,
           d.created_at, d.updated_at,
           COUNT(DISTINCT pd.provider_id)::int AS provider_count,
           COUNT(DISTINCT a.id)::int AS appointment_count
    FROM departments d
    LEFT JOIN provider_departments pd ON d.id = pd.department_id
    LEFT JOIN appointments a ON a.department_id = d.id
    ${whereClause}
    GROUP BY d.id
    ORDER BY d.name
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  values.push(limit, offset);

  const result = await pool.query(dataQuery, values);

  return {
    departments: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDepartmentById(departmentId: number) {
  const query = `
    SELECT d.id, d.name, d.code, d.description, d.is_active,
           d.operating_hours, d.location, d.phone_number, d.email,
           d.created_at, d.updated_at,
           COUNT(DISTINCT pd.provider_id)::int AS provider_count,
           COUNT(DISTINCT a.id)::int AS appointment_count
    FROM departments d
    LEFT JOIN provider_departments pd ON d.id = pd.department_id
    LEFT JOIN appointments a ON a.department_id = d.id
    WHERE d.id = $1
    GROUP BY d.id
  `;
  const result = await pool.query(query, [departmentId]);
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Department not found');
  }
  return result.rows[0];
}

export async function createDepartment(
  data: {
    name: string;
    code: string;
    description?: string;
    operating_hours?: Record<string, unknown>;
    location?: string;
    phone_number?: string;
    email?: string;
  },
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  const existing = await pool.query('SELECT id FROM departments WHERE code = $1', [data.code]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'Department code already exists');
  }

  const insertQuery = `
    INSERT INTO departments (name, code, description, operating_hours, location, phone_number, email)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await pool.query(insertQuery, [
    data.name,
    data.code,
    data.description || null,
    data.operating_hours ? JSON.stringify(data.operating_hours) : null,
    data.location || null,
    data.phone_number || null,
    data.email || null,
  ]);

  const department = result.rows[0];

  await logAuditEntry({
    user_id: adminId,
    action: AuditAction.CREATE,
    table_name: 'departments',
    record_id: String(department.id),
    new_values: department,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  await invalidateDepartmentCache();

  return department;
}

export async function updateDepartment(
  departmentId: number,
  data: Record<string, unknown>,
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  const oldResult = await pool.query('SELECT * FROM departments WHERE id = $1', [departmentId]);
  if (oldResult.rows.length === 0) {
    throw new ApiError(404, 'Department not found');
  }
  const oldValues = oldResult.rows[0];

  if (data.code) {
    const dup = await pool.query('SELECT id FROM departments WHERE code = $1 AND id != $2', [
      data.code,
      departmentId,
    ]);
    if (dup.rows.length > 0) {
      throw new ApiError(409, 'Department code already exists');
    }
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fields = ['name', 'code', 'description', 'location', 'phone_number', 'email'];
  for (const field of fields) {
    if (data[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex++}`);
      values.push(data[field]);
    }
  }

  if (data.operating_hours !== undefined) {
    setClauses.push(`operating_hours = $${paramIndex++}`);
    values.push(JSON.stringify(data.operating_hours));
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(departmentId);

  const updateQuery = `
    UPDATE departments SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, values);
  const department = result.rows[0];

  await logAuditEntry({
    user_id: adminId,
    action: AuditAction.UPDATE,
    table_name: 'departments',
    record_id: String(departmentId),
    old_values: oldValues,
    new_values: department,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  await invalidateDepartmentCache();

  return department;
}

export async function deactivateDepartment(
  departmentId: number,
  adminId: number,
  ipAddress: string,
  userAgent: string,
) {
  const deptResult = await pool.query('SELECT * FROM departments WHERE id = $1', [departmentId]);
  if (deptResult.rows.length === 0) {
    throw new ApiError(404, 'Department not found');
  }

  const futureQuery = `
    SELECT COUNT(*)::int AS count
    FROM appointments a
    WHERE a.department_id = $1
      AND a.appointment_date >= NOW()
      AND a.status NOT IN ('cancelled', 'completed')
  `;
  const futureResult = await pool.query(futureQuery, [departmentId]);
  const { count } = futureResult.rows[0];

  if (count > 0) {
    throw new ApiError(
      409,
      'Department has future appointments. Reassign or notify patients before deactivating.',
    );
  }

  await pool.query('UPDATE departments SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [
    departmentId,
  ]);

  await logAuditEntry({
    user_id: adminId,
    action: AuditAction.UPDATE,
    table_name: 'departments',
    record_id: String(departmentId),
    old_values: { is_active: true },
    new_values: { is_active: false },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  await invalidateDepartmentCache();

  return { message: 'Department deactivated successfully' };
}
