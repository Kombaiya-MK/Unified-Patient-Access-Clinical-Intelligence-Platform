/**
 * No-Show Controller
 * 
 * Handles HTTP requests for no-show marking and undo operations.
 * PATCH /api/staff/queue/:id/mark-noshow — mark appointment as no-show
 * POST  /api/staff/queue/:id/undo-noshow — undo no-show within 2 hours
 * 
 * @module noShowController
 * @created 2026-04-01
 * @task US_024 TASK_002
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import noShowService from '../services/noShowService';
import { logAuditEntry } from '../utils/auditLogger';
import logger from '../utils/logger';

/**
 * PATCH /api/staff/queue/:id/mark-noshow
 * Mark an appointment as no-show.
 */
export const markNoShow = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const staffId = req.user?.userId;
    if (!staffId) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const appointmentId = String(req.params.id);
    const { notes, excusedNoShow } = req.body || {};

    // Validate notes length
    if (notes && typeof notes === 'string' && notes.length > 500) {
      return next(new ApiError(400, 'Notes must not exceed 500 characters'));
    }

    const result = await noShowService.markNoShow(
      appointmentId,
      String(staffId),
      notes ? String(notes) : undefined,
      Boolean(excusedNoShow),
    );

    // Audit log
    try {
      await logAuditEntry({
        user_id: Number(staffId),
        action: 'UPDATE',
        table_name: 'appointments',
        record_id: appointmentId,
        old_values: { status: 'scheduled' },
        new_values: {
          status: 'no_show',
          excused: result.excused,
          riskScore: result.patientRiskScore,
        },
        ip_address: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
      });
    } catch (auditError) {
      logger.warn('Failed to write audit log for no-show marking', { auditError });
    }

    // Broadcast WebSocket event
    try {
      const { broadcastQueueUpdate } = await import('../services/websocketService');
      broadcastQueueUpdate({
        type: 'status_change',
        appointmentId,
        newStatus: 'no_show',
        staffName: `Staff #${staffId}`,
        timestamp: new Date(),
      });
    } catch {
      // WebSocket broadcast is non-critical
    }

    res.json(result);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const typed = error as { code: number; message: string };
      return next(new ApiError(typed.code, typed.message));
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error marking no-show:', { error: errorMessage });
    next(new ApiError(500, 'Failed to mark no-show'));
  }
};

/**
 * POST /api/staff/queue/:id/undo-noshow
 * Undo a no-show marking within the 2-hour window.
 */
export const undoNoShow = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const staffId = req.user?.userId;
    if (!staffId) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const appointmentId = String(req.params.id);

    const result = await noShowService.undoNoShow(appointmentId, String(staffId));

    // Audit log
    try {
      await logAuditEntry({
        user_id: Number(staffId),
        action: 'UPDATE',
        table_name: 'appointments',
        record_id: appointmentId,
        old_values: { status: 'no_show' },
        new_values: {
          status: 'arrived',
          riskScore: result.patientRiskScore,
        },
        ip_address: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
      });
    } catch (auditError) {
      logger.warn('Failed to write audit log for undo no-show', { auditError });
    }

    // Broadcast WebSocket event
    try {
      const { broadcastQueueUpdate } = await import('../services/websocketService');
      broadcastQueueUpdate({
        type: 'status_change',
        appointmentId,
        newStatus: 'arrived',
        staffName: `Staff #${staffId}`,
        timestamp: new Date(),
      });
    } catch {
      // WebSocket broadcast is non-critical
    }

    res.json(result);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const typed = error as { code: number; message: string };
      return next(new ApiError(typed.code, typed.message));
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error undoing no-show:', { error: errorMessage });
    next(new ApiError(500, 'Failed to undo no-show'));
  }
};
