/**
 * Queue Management Service
 * 
 * Business logic for queue management including fetching today's
 * appointments and updating statuses with optimistic locking.
 * 
 * @module queueService
 * @created 2026-03-31
 * @task US_020 TASK_003
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import type { QueueAppointment, QueueFilters, StatusUpdateResult, QueueStatus } from '../types/queue.types';

/**
 * Valid status transitions for queue management
 */
const VALID_TRANSITIONS: Record<string, QueueStatus[]> = {
  pending: ['arrived', 'no_show'],
  confirmed: ['arrived', 'no_show'],
  arrived: ['in_progress', 'no_show'],
  in_progress: ['completed', 'no_show'],
};

class QueueService {
  /**
   * Get today's appointment queue with optional filters
   */
  async getTodayQueue(filters: QueueFilters = {}): Promise<{
    appointments: QueueAppointment[];
    totalCount: number;
    providers: { id: number; name: string }[];
    departments: { id: number; name: string }[];
  }> {
    const params: any[] = [];
    let paramIndex = 1;

    let whereClause = `
      WHERE a.appointment_date::date = CURRENT_DATE
        AND a.status NOT IN ('cancelled', 'rescheduled')
    `;

    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      whereClause += ` AND a.status = ANY($${paramIndex}::text[])`;
      params.push(statuses);
      paramIndex++;
    }

    if (filters.providerId) {
      whereClause += ` AND a.doctor_id = $${paramIndex}`;
      params.push(parseInt(filters.providerId, 10));
      paramIndex++;
    }

    if (filters.departmentId) {
      whereClause += ` AND a.department_id = $${paramIndex}`;
      params.push(parseInt(filters.departmentId, 10));
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (
        pu.first_name ILIKE $${paramIndex} OR
        pu.last_name ILIKE $${paramIndex} OR
        CONCAT(pu.first_name, ' ', pu.last_name) ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const query = `
      SELECT
        a.id,
        a.patient_id,
        CONCAT(pu.first_name, ' ', pu.last_name) AS patient_name,
        a.appointment_date AS appointment_time,
        a.status,
        CONCAT(du.first_name, ' ', du.last_name) AS provider_name,
        a.doctor_id AS provider_id,
        d.name AS department_name,
        a.department_id,
        a.appointment_type,
        a.duration_minutes,
        a.version,
        a.arrived_at,
        a.started_at,
        a.completed_at,
        a.checked_in_at,
        a.created_at,
        CASE
          WHEN a.status = 'arrived' AND a.arrived_at IS NOT NULL
               AND a.arrived_at > a.appointment_date + INTERVAL '15 minutes'
          THEN true
          ELSE false
        END AS is_late_arrival
      FROM appointments a
      LEFT JOIN users pu ON a.patient_id = pu.id
      LEFT JOIN users du ON a.doctor_id = du.id
      LEFT JOIN departments d ON a.department_id = d.id
      ${whereClause}
      ORDER BY
        CASE a.status
          WHEN 'in_progress' THEN 0
          WHEN 'arrived' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'no_show' THEN 4
          WHEN 'completed' THEN 5
          ELSE 6
        END,
        a.appointment_date ASC
    `;

    const result = await pool.query(query, params);

    // Get distinct providers for today's appointments
    const providersQuery = `
      SELECT DISTINCT u.id, CONCAT(u.first_name, ' ', u.last_name) AS name
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.appointment_date::date = CURRENT_DATE
        AND a.status NOT IN ('cancelled', 'rescheduled')
      ORDER BY name
    `;
    const providersResult = await pool.query(providersQuery);

    // Get distinct departments for today's appointments
    const departmentsQuery = `
      SELECT DISTINCT d.id, d.name
      FROM appointments a
      JOIN departments d ON a.department_id = d.id
      WHERE a.appointment_date::date = CURRENT_DATE
        AND a.status NOT IN ('cancelled', 'rescheduled')
      ORDER BY d.name
    `;
    const departmentsResult = await pool.query(departmentsQuery);

    return {
      appointments: result.rows,
      totalCount: result.rowCount ?? 0,
      providers: providersResult.rows,
      departments: departmentsResult.rows,
    };
  }

  /**
   * Update appointment status with optimistic locking
   */
  async updateAppointmentStatus(
    appointmentId: number,
    newStatus: QueueStatus,
    staffId: number,
    version: number,
  ): Promise<StatusUpdateResult> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current appointment state
      const currentQuery = `
        SELECT a.status, a.version, a.arrived_at, a.appointment_date,
          CONCAT(u.first_name, ' ', u.last_name) AS updated_by_name,
          a.updated_at
        FROM appointments a
        LEFT JOIN users u ON a.updated_by = u.id
        WHERE a.id = $1
      `;
      const currentResult = await client.query(currentQuery, [appointmentId]);

      if (currentResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          conflict: {
            message: 'Appointment not found',
            currentStatus: '',
            updatedBy: '',
            updatedAt: '',
          },
        };
      }

      const current = currentResult.rows[0];

      // Validate status transition
      const allowedTransitions = VALID_TRANSITIONS[current.status];
      if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        await client.query('ROLLBACK');

        // Duplicate arrival check: provide specific message
        if (newStatus === 'arrived' && current.status === 'arrived') {
          const arrivedAt = current.arrived_at
            ? new Date(current.arrived_at).toLocaleString()
            : 'unknown time';
          return {
            success: false,
            conflict: {
              message: `Already marked as arrived at ${arrivedAt}`,
              currentStatus: current.status,
              updatedBy: current.updated_by_name || 'System',
              updatedAt: current.updated_at,
            },
          };
        }

        return {
          success: false,
          conflict: {
            message: `Cannot transition from '${current.status}' to '${newStatus}'`,
            currentStatus: current.status,
            updatedBy: current.updated_by_name || 'System',
            updatedAt: current.updated_at,
          },
        };
      }

      // Build timestamp column update based on new status
      let timestampColumn = '';
      switch (newStatus) {
        case 'arrived':
          timestampColumn = ', arrived_at = NOW()';
          break;
        case 'in_progress':
          timestampColumn = ', started_at = NOW()';
          break;
        case 'completed':
          timestampColumn = ', completed_at = NOW()';
          break;
        default:
          break;
      }

      // Optimistic locking: UPDATE only if version matches
      const updateQuery = `
        UPDATE appointments
        SET
          status = $1,
          version = version + 1,
          updated_by = $2,
          updated_at = NOW()
          ${timestampColumn}
        WHERE id = $3 AND version = $4
        RETURNING
          id, patient_id, appointment_date AS appointment_time,
          status, doctor_id AS provider_id, department_id,
          appointment_type, duration_minutes, version,
          arrived_at, started_at, completed_at, checked_in_at, created_at
      `;

      const updateResult = await client.query(updateQuery, [
        newStatus,
        staffId,
        appointmentId,
        version,
      ]);

      if (updateResult.rowCount === 0) {
        // Version mismatch — concurrent update detected
        await client.query('ROLLBACK');

        // Re-read to get who updated it
        const conflictQuery = `
          SELECT a.status, a.version,
            CONCAT(u.first_name, ' ', u.last_name) AS updated_by_name,
            a.updated_at
          FROM appointments a
          LEFT JOIN users u ON a.updated_by = u.id
          WHERE a.id = $1
        `;
        const conflictResult = await pool.query(conflictQuery, [appointmentId]);
        const conflict = conflictResult.rows[0];

        return {
          success: false,
          conflict: {
            message: `Already marked as '${conflict.status}' by ${conflict.updated_by_name || 'another staff member'}`,
            currentStatus: conflict.status,
            updatedBy: conflict.updated_by_name || 'Unknown',
            updatedAt: conflict.updated_at,
          },
        };
      }

      // Enrich with patient + provider + department names
      const enrichQuery = `
        SELECT
          CONCAT(pu.first_name, ' ', pu.last_name) AS patient_name,
          CONCAT(du.first_name, ' ', du.last_name) AS provider_name,
          d.name AS department_name
        FROM appointments a
        LEFT JOIN users pu ON a.patient_id = pu.id
        LEFT JOIN users du ON a.doctor_id = du.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.id = $1
      `;
      const enrichResult = await client.query(enrichQuery, [appointmentId]);

      await client.query('COMMIT');

      const updatedRow = updateResult.rows[0];
      const enriched = enrichResult.rows[0] || {};

      // Calculate late arrival flag when status transitions to arrived
      let isLateArrival = false;
      if (newStatus === 'arrived' && updatedRow.arrived_at && current.appointment_date) {
        const arrivedAt = new Date(updatedRow.arrived_at).getTime();
        const appointmentTime = new Date(current.appointment_date).getTime();
        const fifteenMinMs = 15 * 60 * 1000;
        isLateArrival = arrivedAt > appointmentTime + fifteenMinMs;
      }

      return {
        success: true,
        appointment: {
          ...updatedRow,
          patient_name: enriched.patient_name || '',
          provider_name: enriched.provider_name || '',
          department_name: enriched.department_name || '',
          is_late_arrival: isLateArrival,
        },
        isLateArrival,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating appointment status', { error, appointmentId, newStatus });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get staff member name by userId
   */
  async getStaffName(userId: number): Promise<string> {
    const result = await pool.query(
      `SELECT CONCAT(first_name, ' ', last_name) AS name FROM users WHERE id = $1`,
      [userId],
    );
    return result.rows[0]?.name || 'Staff';
  }
}

export default new QueueService();
