/**
 * Waitlist Acceptance Validation Middleware
 * 
 * Middleware to validate waitlist acceptance booking requests.
 * Ensures waitlist entry exists, belongs to patient, has valid hold, and is not expired.
 * 
 * Business Rules:
 * - Waitlist entry must exist
 * - Patient must own the waitlist entry
 * - Waitlist status must be 'contacted' (patient was notified)
 * - Active reservation must exist
 * - Reservation must not be expired (reserved_until > NOW())
 * 
 * Error Codes:
 * - 400: Waitlist ID not provided or invalid status
 * - 403: Unauthorized (different patient)
 * - 404: Waitlist entry not found or no active reservation
 * - 410: Slot hold has expired
 * - 500: Server error
 * 
 * @module validateWaitlistAcceptance
 * @created 2026-03-19
 * @task US_015 TASK_006
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';

/**
 * Extended request with authenticated user and waitlist entry
 */
export interface WaitlistAcceptanceRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  waitlistEntry?: {
    id: number;
    patientId: number;
    slotId: number;
    departmentId: number;
    doctorId: number | null;
    requestedDate: Date;
    status: string;
    createdAt: Date;
  };
  reservation?: {
    id: number;
    waitlistId: number;
    slotId: number;
    reservedUntil: Date;
    status: string;
  };
}

/**
 * Validate waitlist acceptance booking
 * 
 * Checks if patient can accept waitlist slot based on:
 * - Waitlist entry ownership
 * - Notification status
 * - Reservation validity
 * - Hold expiration
 * 
 * @param req - Express request with authenticated user
 * @param res - Express response
 * @param next - Express next function
 */
export async function validateWaitlistAcceptance(
  req: WaitlistAcceptanceRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if waitlist_id is provided in query params
    const waitlistIdParam = req.query.waitlist_id as string;

    // If no waitlist_id, this is a regular booking - skip validation
    if (!waitlistIdParam) {
      logger.debug('No waitlist_id provided - proceeding with regular booking');
      return next();
    }

    const waitlistId = parseInt(waitlistIdParam, 10);

    // Validate waitlist_id is a valid number
    if (isNaN(waitlistId)) {
      logger.warn(`Invalid waitlist_id parameter: ${waitlistIdParam}`);
      res.status(400).json({
        success: false,
        message: 'Invalid waitlist_id parameter',
        code: 'INVALID_WAITLIST_ID',
      });
      return;
    }

    // Get patient ID from authenticated user
    const patientId = req.user?.id;

    if (!patientId) {
      logger.warn('Unauthenticated request to accept waitlist');
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
      });
      return;
    }

    // Fetch waitlist entry and active reservation in a single query
    const query = `
      SELECT 
        w.id AS waitlist_id,
        w.patient_id,
        w.department_id,
        w.doctor_id,
        w.requested_date,
        w.status AS waitlist_status,
        w.created_at,
        wr.id AS reservation_id,
        wr.slot_id,
        wr.reserved_until,
        wr.status AS reservation_status
      FROM waitlist w
      LEFT JOIN waitlist_reservations wr ON w.id = wr.waitlist_id AND wr.status = 'active'
      WHERE w.id = $1
    `;

    const result = await pool.query(query, [waitlistId]);

    // Check if waitlist entry exists
    if (result.rows.length === 0) {
      logger.warn(`Waitlist entry not found: ${waitlistId}`);
      res.status(404).json({
        success: false,
        message: 'Waitlist entry not found',
        code: 'WAITLIST_NOT_FOUND',
      });
      return;
    }

    const entry = result.rows[0];

    // Verify ownership - patient must own the waitlist entry
    if (entry.patient_id.toString() !== patientId) {
      logger.warn(`Unauthorized waitlist acceptance attempt: patient ${patientId} tried to accept waitlist ${waitlistId} owned by patient ${entry.patient_id}`);
      res.status(403).json({
        success: false,
        message: 'Unauthorized to accept this waitlist entry',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Verify waitlist status is 'contacted' (patient was notified)
    if (entry.waitlist_status !== 'contacted') {
      logger.warn(`Invalid waitlist status: expected 'contacted', got '${entry.waitlist_status}' for waitlist ${waitlistId}`);
      res.status(400).json({
        success: false,
        message: `Waitlist entry must be in 'contacted' status to accept. Current status: ${entry.waitlist_status}`,
        code: 'INVALID_STATUS',
        currentStatus: entry.waitlist_status,
      });
      return;
    }

    // Check if active reservation exists
    if (!entry.reservation_id) {
      logger.warn(`No active reservation found for waitlist ${waitlistId}`);
      res.status(404).json({
        success: false,
        message: 'No active slot reservation found for this waitlist entry',
        code: 'NO_RESERVATION',
      });
      return;
    }

    // Verify hold has not expired
    const reservedUntil = new Date(entry.reserved_until);
    const now = new Date();

    if (reservedUntil <= now) {
      logger.warn(`Expired slot hold for waitlist ${waitlistId}: reserved_until ${reservedUntil.toISOString()} is in the past`);
      res.status(410).json({
        success: false,
        message: 'This slot hold has expired. Please join the waitlist again.',
        code: 'HOLD_EXPIRED',
        expiredAt: reservedUntil.toISOString(),
      });
      return;
    }

    // All validations passed - attach waitlist entry and reservation to request
    req.waitlistEntry = {
      id: entry.waitlist_id,
      patientId: entry.patient_id,
      slotId: entry.slot_id,
      departmentId: entry.department_id,
      doctorId: entry.doctor_id,
      requestedDate: entry.requested_date,
      status: entry.waitlist_status,
      createdAt: entry.created_at,
    };

    req.reservation = {
      id: entry.reservation_id,
      waitlistId: entry.waitlist_id,
      slotId: entry.slot_id,
      reservedUntil: reservedUntil,
      status: entry.reservation_status,
    };

    logger.info(`Waitlist acceptance validated for patient ${patientId}, waitlist ${waitlistId}`);
    next();
  } catch (error: any) {
    logger.error('Waitlist acceptance validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate waitlist acceptance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
