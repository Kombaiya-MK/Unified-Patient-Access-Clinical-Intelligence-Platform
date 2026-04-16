/**
 * Staff Appointment Controller
 * 
 * Handles HTTP requests for staff-assisted appointment booking.
 * POST /api/staff/appointments/book — book appointment on behalf of patient.
 * 
 * @module staffAppointmentController
 * @created 2026-04-01
 * @task US_023 TASK_002
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import staffBookingService from '../services/staffBookingService';
import { logAuditEntry } from '../utils/auditLogger';
import logger from '../utils/logger';

/**
 * POST /api/staff/appointments/book
 * Book an appointment on behalf of a patient.
 */
export const bookForPatient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const staffUserId = req.user?.userId;

    if (!staffUserId) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const {
      patientId,
      slotId,
      appointmentType,
      reasonForVisit,
      staffBookingNotes,
      bookingPriority = 'normal',
      overrideCapacity = false,
    } = req.body;

    // Validate required fields
    if (!patientId || !slotId || !appointmentType) {
      return next(new ApiError(400, 'patientId, slotId, and appointmentType are required'));
    }

    // Validate staffBookingNotes length
    if (staffBookingNotes && staffBookingNotes.length > 500) {
      return next(new ApiError(400, 'Staff booking notes must not exceed 500 characters'));
    }

    // Validate bookingPriority
    if (!['normal', 'urgent'].includes(bookingPriority)) {
      return next(new ApiError(400, 'bookingPriority must be "normal" or "urgent"'));
    }

    const result = await staffBookingService.createStaffBooking(String(staffUserId), {
      patientId: String(patientId),
      slotId: String(slotId),
      appointmentType: String(appointmentType),
      reasonForVisit: reasonForVisit ? String(reasonForVisit) : undefined,
      staffBookingNotes: staffBookingNotes ? String(staffBookingNotes) : undefined,
      bookingPriority,
      overrideCapacity: Boolean(overrideCapacity),
    });

    // Audit log
    await logAuditEntry({
      user_id: Number(staffUserId),
      action: 'INSERT',
      table_name: 'appointments',
      record_id: result.appointmentId,
      new_values: {
        patientId: String(patientId),
        slotId: String(slotId),
        appointmentType,
        bookingPriority,
        overrideCapacity,
        patientName: result.patientName,
        bookedByStaff: true,
      },
      ip_address: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const typed = error as { code: number | string; message: string };
      const httpCode = typeof typed.code === 'number' && typed.code >= 100 && typed.code < 600
        ? typed.code
        : 500;
      return next(new ApiError(httpCode, typed.message));
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error booking appointment for patient:', { error: errorMessage });
    next(new ApiError(500, 'Failed to book appointment'));
  }
};
