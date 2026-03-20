/**
 * Waitlist Acceptance Service
 * 
 * Business logic for accepting waitlist slots and booking appointments.
 * Handles the complete workflow when a patient accepts a waitlist notification.
 * 
 * Features:
 * - Database transaction safety (all-or-nothing)
 * - Acquire FOR UPDATE lock on waitlist entry and reservation
 * - Validate hold expiration (race condition protection)
 * - Verify slot still available (concurrency check)
 * - Book appointment atomically
 * - Update waitlist status to 'scheduled'
 * - Update reservation status to 'booked'
 * - Store appointment_id reference
 * - Cancel other active waitlist entries for patient
 * - Comprehensive audit logging
 * - Proper error handling with rollback
 * 
 * Business Rules:
 * - Must have valid active reservation
 * - Hold must not be expired (reserved_until > NOW())
 * - Slot must still be available (no double booking)
 * - All operations atomic (transaction)
 * - Other patient waitlist entries auto-cancelled
 * 
 * Error Codes:
 * - 409: Slot taken by another patient
 * - 410: Hold expired between validation and booking
 * - 500: Database error
 * 
 * @module waitlistAcceptanceService
 * @created 2026-03-19
 * @task US_015 TASK_006
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import type { PoolClient } from 'pg';

/**
 * Waitlist acceptance data
 */
export interface AcceptWaitlistData {
  /** Waitlist entry ID */
  waitlistId: number;
  /** Reservation ID */
  reservationId: number;
  /** Patient ID */
  patientId: string;
  /** Slot ID */
  slotId: string;
  /** Appointment notes from booking request */
  notes?: string;
}

/**
 * Waitlist acceptance result
 */
export interface AcceptWaitlistResult {
  /** Created appointment ID */
  appointmentId: string;
  /** Appointment status */
  status: string;
  /** Success message */
  message: string;
  /** Indicates this was a waitlist acceptance */
  waitlistAccepted: boolean;
  /** Complete appointment details */
  appointment: any;
}

/**
 * Accept waitlist slot and book appointment
 * 
 * Complete atomic workflow:
 * 1. Start transaction
 * 2. Lock waitlist entry and reservation (FOR UPDATE)
 * 3. Re-validate hold not expired (race condition protection)
 * 4. Verify slot still available
 * 5. Book appointment
 * 6. Update waitlist status to 'scheduled'
 * 7. Update reservation status to 'booked'
 * 8. Store appointment_id in waitlist
 * 9. Cancel other active waitlist entries for patient
 * 10. Log ACCEPT_WAITLIST audit event
 * 11. Commit transaction
 * 
 * @param data - Waitlist acceptance data
 * @returns Appointment booking result
 * @throws Error with status, code, message for specific failures
 */
export async function acceptWaitlistSlot(
  data: AcceptWaitlistData
): Promise<AcceptWaitlistResult> {
  const client: PoolClient = await pool.connect();

  try {
    // Start transaction for atomic operations
    await client.query('BEGIN');

    logger.info(`Starting waitlist acceptance: waitlist ${data.waitlistId}, patient ${data.patientId}`);

    // ============================================================================
    // Step 1: Acquire locks on waitlist entry and reservation
    // ============================================================================

    const lockQuery = `
      SELECT 
        w.id AS waitlist_id,
        w.patient_id,
        w.department_id,
        w.doctor_id,
        w.requested_date,
        w.status AS waitlist_status,
        wr.id AS reservation_id,
        wr.slot_id,
        wr.reserved_until,
        wr.status AS reservation_status
      FROM waitlist w
      JOIN waitlist_reservations wr ON w.id = wr.waitlist_id
      WHERE w.id = $1 AND wr.id = $2
      FOR UPDATE OF w, wr
    `;

    const lockResult = await client.query(lockQuery, [data.waitlistId, data.reservationId]);

    if (lockResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'WAITLIST_NOT_FOUND',
        message: 'Waitlist entry or reservation not found',
      };
    }

    const waitlistEntry = lockResult.rows[0];

    // ============================================================================
    // Step 2: Re-validate hold not expired (race condition protection)
    // ============================================================================

    const reservedUntil = new Date(waitlistEntry.reserved_until);
    const now = new Date();

    if (reservedUntil <= now) {
      logger.warn(`Hold expired during booking: waitlist ${data.waitlistId}, expired at ${reservedUntil.toISOString()}`);
      throw {
        status: 410,
        code: 'HOLD_EXPIRED',
        message: 'This slot hold has expired',
      };
    }

    // ============================================================================
    // Step 3: Verify slot still available (concurrency check)
    // ============================================================================

    const slotCheckQuery = `
      SELECT 
        ts.id,
        ts.is_available,
        ts.doctor_id,
        ts.department_id,
        ts.slot_date,
        ts.slot_start,
        ts.slot_end,
        COUNT(a.id) AS booking_count
      FROM time_slots ts
      LEFT JOIN appointments a ON ts.id = a.slot_id AND a.status != 'cancelled'
      WHERE ts.id = $1
      GROUP BY ts.id
      FOR UPDATE OF ts
    `;

    const slotResult = await client.query(slotCheckQuery, [waitlistEntry.slot_id]);

    if (slotResult.rows.length === 0) {
      logger.error(`Slot not found: ${waitlistEntry.slot_id}`);
      throw {
        status: 404,
        code: 'SLOT_NOT_FOUND',
        message: 'Time slot not found',
      };
    }

    const slot = slotResult.rows[0];
    const bookingCount = parseInt(slot.booking_count, 10);

    // Check if slot was taken by someone else
    if (bookingCount > 0) {
      logger.warn(`Slot taken by another patient: slot ${waitlistEntry.slot_id}, bookings: ${bookingCount}`);
      throw {
        status: 409,
        code: 'SLOT_TAKEN',
        message: 'Slot no longer available',
      };
    }

    // ============================================================================
    // Step 4: Book appointment
    // ============================================================================

    const appointmentQuery = `
      INSERT INTO appointments (
        patient_id,
        doctor_id,
        department_id,
        appointment_date,
        duration_minutes,
        status,
        appointment_type,
        reason_for_visit,
        notes,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, 
        (DATE($4) + $5::TIME),
        EXTRACT(EPOCH FROM ($6::TIME - $5::TIME))/60,
        'confirmed',
        'consultation',
        'Waitlist acceptance',
        $7,
        NOW(),
        NOW()
      )
      RETURNING 
        id,
        patient_id,
        doctor_id,
        department_id,
        appointment_date,
        duration_minutes,
        status,
        appointment_type,
        reason_for_visit,
        notes,
        created_at,
        updated_at
    `;

    const appointmentResult = await client.query(appointmentQuery, [
      data.patientId,
      slot.doctor_id,
      slot.department_id,
      slot.slot_date,
      slot.slot_start,
      slot.slot_end,
      data.notes || 'Booked from waitlist',
    ]);

    const appointment = appointmentResult.rows[0];

    logger.info(`Appointment created: ${appointment.id} for patient ${data.patientId}`);

    // ============================================================================
    // Step 5: Update slot availability
    // ============================================================================

    await client.query(
      `UPDATE time_slots SET is_available = false, booked_count = booked_count + 1, updated_at = NOW() WHERE id = $1`,
      [waitlistEntry.slot_id]
    );

    // ============================================================================
    // Step 6: Update waitlist status to 'scheduled'
    // ============================================================================

    await client.query(
      `UPDATE waitlist SET status = $1, scheduled_appointment_id = $2, updated_at = NOW() WHERE id = $3`,
      ['scheduled', appointment.id, data.waitlistId]
    );

    logger.debug(`Waitlist ${data.waitlistId} updated to 'scheduled'`);

    // ============================================================================
    // Step 7: Update reservation status to 'booked'
    // ============================================================================

    await client.query(
      `UPDATE waitlist_reservations SET status = $1, booked_at = NOW(), updated_at = NOW() WHERE id = $2`,
      ['booked', data.reservationId]
    );

    logger.debug(`Reservation ${data.reservationId} updated to 'booked'`);

    // ============================================================================
    // Step 8: Cancel other active waitlist entries for this patient
    // ============================================================================

    const cancelOthersQuery = `
      UPDATE waitlist 
      SET status = 'cancelled', updated_at = NOW()
      WHERE patient_id = $1 
        AND id != $2 
        AND status IN ('waiting', 'contacted')
    `;

    const cancelResult = await client.query(cancelOthersQuery, [
      data.patientId,
      data.waitlistId,
    ]);

    const cancelledCount = cancelResult.rowCount || 0;

    if (cancelledCount > 0) {
      logger.info(`Cancelled ${cancelledCount} other waitlist entries for patient ${data.patientId}`);
    }

    // ============================================================================
    // Step 9: Release other active reservations for this patient
    // ============================================================================

    await client.query(
      `UPDATE waitlist_reservations 
       SET status = 'released', released_at = NOW(), updated_at = NOW()
       WHERE patient_id = $1 
         AND id != $2 
         AND status = 'active'`,
      [data.patientId, data.reservationId]
    );

    // ============================================================================
    // Step 10: Log ACCEPT_WAITLIST audit event
    // ============================================================================

    const auditQuery = `
      INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await client.query(auditQuery, [
      parseInt(data.patientId, 10),
      'ACCEPT_WAITLIST',
      'waitlist',
      data.waitlistId,
      { status: 'contacted' },
      {
        status: 'scheduled',
        appointment_id: appointment.id,
        appointment_details: {
          date: slot.slot_date,
          start_time: slot.slot_start,
          end_time: slot.slot_end,
        },
      },
      'server-internal',
      'waitlist-acceptance-service',
    ]);

    logger.debug(`Audit log created for ACCEPT_WAITLIST action`);

    // ============================================================================
    // Step 11: Commit transaction
    // ============================================================================

    await client.query('COMMIT');

    logger.info(`Waitlist acceptance completed successfully: appointment ${appointment.id}`);

    return {
      appointmentId: appointment.id.toString(),
      status: appointment.status,
      message: 'Appointment booked successfully from waitlist',
      waitlistAccepted: true,
      appointment,
    };
  } catch (error: any) {
    // Rollback transaction on any error
    await client.query('ROLLBACK');

    logger.error('Waitlist acceptance error (rolled back):', {
      waitlistId: data.waitlistId,
      patientId: data.patientId,
      error: error.message,
      stack: error.stack,
    });

    // Re-throw custom errors with status codes
    if (error.status && error.code && error.message) {
      throw error;
    }

    // Generic error
    throw {
      status: 500,
      code: 'BOOKING_FAILED',
      message: 'Failed to book appointment from waitlist',
    };
  } finally {
    // Release client back to pool
    client.release();
  }
}
