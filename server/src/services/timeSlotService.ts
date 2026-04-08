/**
 * Time Slot Service
 *
 * Database access layer for time slot availability queries.
 * Decoupled from caching; the cache wrapper calls this for misses.
 *
 * @module timeSlotService
 * @task US_004 TASK_002
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import type { TimeSlot, TimeSlotQuery } from '../types/timeSlot.types';

/**
 * Fetch available time slots from the database.
 *
 * @param query - Filter parameters (date, providerId, departmentId)
 * @returns Array of available time slots
 */
export async function getAvailableTimeSlots(
  query: TimeSlotQuery,
): Promise<TimeSlot[]> {
  const { date, providerId, departmentId } = query;
  const params: (string | number)[] = [];
  let idx = 1;

  let sql = `
    SELECT
      ts.id,
      ts.slot_date    AS "slotDate",
      (ts.slot_date || 'T' || ts.slot_start)::text AS "startTime",
      (ts.slot_date || 'T' || ts.slot_end)::text   AS "endTime",
      ts.is_available AS "isAvailable",
      ts.doctor_id    AS "providerId",
      ts.department_id AS "departmentId",
      u.first_name || ' ' || u.last_name AS "providerName",
      d.name AS "departmentName"
    FROM time_slots ts
    LEFT JOIN users u ON ts.doctor_id = u.id
    JOIN departments d ON ts.department_id = d.id
    WHERE ts.is_available = true
      AND ts.booked_count < ts.max_appointments
  `;

  // Always filter by date
  sql += ` AND ts.slot_date = $${idx++}`;
  params.push(date);

  if (providerId) {
    sql += ` AND ts.doctor_id = $${idx++}`;
    params.push(providerId);
  }

  if (departmentId) {
    sql += ` AND ts.department_id = $${idx++}`;
    params.push(departmentId);
  }

  sql += ` ORDER BY ts.slot_date ASC, ts.slot_start ASC`;

  const result = await pool.query(sql, params);
  logger.debug(`timeSlotService: fetched ${result.rows.length} slots from DB`);

  return result.rows as TimeSlot[];
}
