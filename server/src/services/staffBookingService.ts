/**
 * Staff Booking Service
 * 
 * Business logic for staff-assisted appointment booking.
 * Allows staff to book on behalf of patients with capability
 * to override capacity and skip cutoff restrictions.
 * 
 * @module staffBookingService
 * @created 2026-04-01
 * @task US_023 TASK_002
 */

import { pool } from '../config/database';
import logger from '../utils/logger';
import type { StaffBookingRequest, StaffBookingResponse } from '../types/staffBooking.types';

/**
 * Valid appointment types matching the CHECK constraint on the appointments table
 */
const VALID_APPOINTMENT_TYPES = [
  'consultation',
  'follow_up',
  'emergency',
  'routine_checkup',
  'diagnostic',
  'treatment',
];

/**
 * Book an appointment on behalf of a patient (staff-assisted).
 * 
 * Staff bookings:
 * - Skip the same-day 2-hour cutoff restriction
 * - Can override slot capacity when urgent
 * - Record the booking staff member for audit
 * 
 * @param staffUserId - The authenticated staff user's ID
 * @param request - Staff booking request data
 * @returns Booking response with appointment details
 */
async function createStaffBooking(
  staffUserId: string,
  request: StaffBookingRequest,
): Promise<StaffBookingResponse> {
  const {
    patientId,
    slotId,
    appointmentType,
    reasonForVisit,
    staffBookingNotes,
    bookingPriority,
    overrideCapacity,
  } = request;

  // Validate appointment type
  if (!VALID_APPOINTMENT_TYPES.includes(appointmentType)) {
    throw { code: 400, message: `Invalid appointment type. Must be one of: ${VALID_APPOINTMENT_TYPES.join(', ')}` };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify patient exists
    const patientCheck = await client.query(
      `SELECT pp.id, u.first_name, u.last_name
       FROM patient_profiles pp
       JOIN users u ON pp.user_id = u.id
       WHERE pp.id = $1 AND u.is_active = true`,
      [patientId],
    );

    if (patientCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      throw { code: 404, message: 'Patient not found' };
    }

    const patient = patientCheck.rows[0];
    const patientName = `${patient.first_name} ${patient.last_name}`;

    // Lock and fetch the slot
    const slotResult = await client.query(
      `SELECT
         ts.*,
         ts.slot_date::text AS "slotDateText",
         ts.slot_date AS "slotDate",
         ts.slot_start AS "startTime",
         ts.slot_end AS "endTime",
         ts.is_available AS "isAvailable",
         ts.doctor_id AS "doctorId",
         ts.department_id AS "departmentId",
         ts.max_appointments AS "maxAppointments",
         ts.booked_count AS "bookedCount",
         u.first_name || ' ' || u.last_name AS "providerName",
         d.name AS "departmentName",
         EXTRACT(EPOCH FROM (ts.slot_end::time - ts.slot_start::time)) / 60 AS "duration"
       FROM time_slots ts
       LEFT JOIN users u ON ts.doctor_id = u.id
       LEFT JOIN departments d ON ts.department_id = d.id
       WHERE ts.id = $1
       FOR UPDATE OF ts`,
      [slotId],
    );

    if (slotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw { code: 404, message: 'Time slot not found' };
    }

    const slot = slotResult.rows[0];

    // Check capacity — staff can override if authorized
    const isAtCapacity = slot.bookedCount >= slot.maxAppointments;

    if (isAtCapacity && !overrideCapacity) {
      await client.query('ROLLBACK');
      throw {
        code: 409,
        message: 'Slot is at full capacity. Enable "Override Capacity" for urgent cases.',
      };
    }

    // Build the appointment datetime from slot_date + slot_start
    const slotDateStr = slot.slotDateText || new Date(slot.slotDate).toISOString().split('T')[0];
    const appointmentDatetime = `${slotDateStr}T${slot.startTime}`;

    // Create the appointment
    const insertResult = await client.query(
      `INSERT INTO appointments (
         patient_id,
         doctor_id,
         department_id,
         slot_id,
         appointment_date,
         duration_minutes,
         status,
         appointment_type,
         reason_for_visit,
         notes,
         booked_by_staff,
         booked_by_staff_id,
         staff_booking_notes,
         booking_priority,
         override_capacity,
         created_at,
         updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, 30, 'confirmed', $6, $7, $8,
         TRUE, $9, $10, $11, $12,
         NOW(), NOW()
       )
       RETURNING id, appointment_date`,
      [
        patientId,
        slot.doctorId,
        slot.departmentId,
        slotId,
        appointmentDatetime,
        appointmentType,
        reasonForVisit || null,
        null,
        staffUserId,
        staffBookingNotes || null,
        bookingPriority,
        overrideCapacity,
      ],
    );

    const appointment = insertResult.rows[0];

    // Update slot booked_count (and set unavailable if at max)
    if (!overrideCapacity) {
      await client.query(
        `UPDATE time_slots
         SET booked_count = booked_count + 1,
             is_available = CASE WHEN booked_count + 1 >= max_appointments THEN FALSE ELSE TRUE END,
             updated_at = NOW()
         WHERE id = $1`,
        [slotId],
      );
    } else {
      // Override: increment count even past max
      await client.query(
        `UPDATE time_slots
         SET booked_count = booked_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [slotId],
      );
    }

    await client.query('COMMIT');

    logger.info('Staff booking created', {
      appointmentId: appointment.id,
      patientId,
      staffUserId,
      overrideCapacity,
      bookingPriority,
    });

    return {
      success: true,
      appointmentId: String(appointment.id),
      patientName,
      appointmentDate: appointment.appointment_date,
      providerName: slot.providerName || 'Unknown Provider',
      message: `Appointment booked for ${patientName} on ${new Date(appointment.appointment_date).toLocaleString()}. Confirmation sent to patient.`,
    };
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default { createStaffBooking };
