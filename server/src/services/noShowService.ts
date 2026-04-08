/**
 * No-Show Service
 * 
 * Business logic for marking appointments as no-show and undoing
 * no-show within the 2-hour undo window. Handles transaction safety,
 * patient no-show count, and risk score recalculation.
 * 
 * @module noShowService
 * @created 2026-04-01
 * @task US_024 TASK_002
 */

import { pool } from '../config/database';
import riskScoreService from './riskScoreService';
import logger from '../utils/logger';
import type { NoShowResponse, UndoNoShowResponse } from '../types/noShow.types';

/**
 * Mark an appointment as no-show.
 * 
 * Validates:
 * - Appointment exists and status is schedulable (pending/confirmed/scheduled)
 * - Appointment time is >30 minutes past
 * - No concurrent status change (FOR UPDATE lock)
 * 
 * If NOT excused: increments patient no_show_count and recalculates risk score.
 * 
 * @param appointmentId - Appointment ID
 * @param staffId - Staff user marking the no-show
 * @param notes - Optional no-show notes
 * @param excusedNoShow - Whether the no-show is excused
 * @returns NoShowResponse
 */
async function markNoShow(
  appointmentId: string,
  staffId: string,
  notes?: string,
  excusedNoShow = false,
): Promise<NoShowResponse> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock and fetch the appointment
    const apptResult = await client.query(
      `SELECT a.id, a.patient_id, a.status, a.appointment_date, a.version
       FROM appointments a
       WHERE a.id = $1
       FOR UPDATE`,
      [appointmentId],
    );

    if (apptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw { code: 404, message: 'Appointment not found' };
    }

    const appointment = apptResult.rows[0];

    // Conflict detection: check status hasn't changed
    const allowedStatuses = ['pending', 'confirmed', 'scheduled'];
    if (!allowedStatuses.includes(appointment.status)) {
      await client.query('ROLLBACK');
      throw {
        code: 409,
        message: appointment.status === 'cancelled'
          ? 'Patient cancelled this appointment'
          : `Cannot mark no-show: appointment status is "${appointment.status}"`,
      };
    }

    // Validate 30-minute window
    const appointmentTime = new Date(appointment.appointment_date);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (appointmentTime > thirtyMinutesAgo) {
      await client.query('ROLLBACK');
      throw {
        code: 422,
        message: 'Appointment not past 30 minutes yet. Cannot mark as no-show.',
      };
    }

    // Update appointment to no_show
    await client.query(
      `UPDATE appointments
       SET status = 'no_show',
           no_show_marked_at = NOW(),
           marked_by_staff_id = $2,
           no_show_notes = $3,
           excused_no_show = $4,
           updated_at = NOW(),
           version = version + 1
       WHERE id = $1`,
      [appointmentId, staffId, notes || null, excusedNoShow],
    );

    let riskScore = 0;

    // If NOT excused, increment patient counter and recalculate risk
    if (!excusedNoShow) {
      await client.query(
        `UPDATE patient_profiles
         SET no_show_count = no_show_count + 1, updated_at = NOW()
         WHERE id = $1`,
        [appointment.patient_id],
      );

      riskScore = await riskScoreService.calculateRiskScore(
        String(appointment.patient_id),
        client,
      );
    } else {
      // Fetch current risk score for excused (unchanged)
      const riskResult = await client.query(
        'SELECT risk_score FROM patient_profiles WHERE id = $1',
        [appointment.patient_id],
      );
      riskScore = riskResult.rows[0]?.risk_score || 0;
    }

    await client.query('COMMIT');

    logger.info('Appointment marked as no-show', {
      appointmentId,
      staffId,
      excused: excusedNoShow,
      riskScore,
    });

    return {
      success: true,
      appointmentId: String(appointmentId),
      patientRiskScore: riskScore,
      excused: excusedNoShow,
      message: 'Appointment marked as No Show',
    };
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Undo a no-show marking within the 2-hour undo window.
 * 
 * Validates:
 * - Appointment exists and status is no_show
 * - no_show_marked_at is within 2 hours
 * 
 * If original was NOT excused: decrements patient no_show_count and recalculates risk.
 * 
 * @param appointmentId - Appointment ID
 * @param staffId - Staff user performing the undo
 * @returns UndoNoShowResponse
 */
async function undoNoShow(
  appointmentId: string,
  staffId: string,
): Promise<UndoNoShowResponse> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock and fetch
    const apptResult = await client.query(
      `SELECT a.id, a.patient_id, a.status, a.no_show_marked_at,
              a.excused_no_show
       FROM appointments a
       WHERE a.id = $1
       FOR UPDATE`,
      [appointmentId],
    );

    if (apptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw { code: 404, message: 'Appointment not found' };
    }

    const appointment = apptResult.rows[0];

    if (appointment.status !== 'no_show') {
      await client.query('ROLLBACK');
      throw {
        code: 409,
        message: `Cannot undo: appointment status is "${appointment.status}"`,
      };
    }

    // Validate undo window (2 hours)
    const markedAt = new Date(appointment.no_show_marked_at);
    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (Date.now() - markedAt.getTime() > twoHoursMs) {
      await client.query('ROLLBACK');
      throw {
        code: 400,
        message: 'Undo window expired (>2 hours)',
      };
    }

    // Revert appointment to arrived status
    await client.query(
      `UPDATE appointments
       SET status = 'arrived',
           no_show_marked_at = NULL,
           marked_by_staff_id = NULL,
           no_show_notes = NULL,
           excused_no_show = FALSE,
           arrived_at = NOW(),
           updated_at = NOW(),
           version = version + 1
       WHERE id = $1`,
      [appointmentId],
    );

    let riskScore = 0;

    // If original was NOT excused, decrement counter and recalculate
    if (!appointment.excused_no_show) {
      await client.query(
        `UPDATE patient_profiles
         SET no_show_count = GREATEST(0, no_show_count - 1), updated_at = NOW()
         WHERE id = $1`,
        [appointment.patient_id],
      );

      riskScore = await riskScoreService.calculateRiskScore(
        String(appointment.patient_id),
        client,
      );
    } else {
      const riskResult = await client.query(
        'SELECT risk_score FROM patient_profiles WHERE id = $1',
        [appointment.patient_id],
      );
      riskScore = riskResult.rows[0]?.risk_score || 0;
    }

    await client.query('COMMIT');

    logger.info('No-show undone', {
      appointmentId,
      staffId,
      riskScore,
    });

    return {
      success: true,
      appointmentId: String(appointmentId),
      patientRiskScore: riskScore,
      message: 'No-show undone. Status changed to Arrived.',
    };
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default { markNoShow, undoNoShow };
