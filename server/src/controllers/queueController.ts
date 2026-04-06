/**
 * Queue Management Controller
 * 
 * Handles HTTP requests for queue management endpoints:
 * - GET /api/staff/queue/today — fetch today's appointment queue
 * - PATCH /api/staff/queue/:id/status — update appointment status
 * 
 * @module queueController
 * @created 2026-03-31
 * @task US_020 TASK_003
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import queueService from '../services/queueService';
import { logAuditEntry } from '../utils/auditLogger';
import logger from '../utils/logger';
import type { QueueStatus } from '../types/queue.types';

const VALID_STATUSES: QueueStatus[] = ['arrived', 'in_progress', 'completed', 'no_show'];

/**
 * GET /api/staff/queue/today
 * Fetch today's appointment queue with optional filters
 */
export const getTodayQueue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filters = {
      status: String(req.query.status || ''),
      providerId: String(req.query.providerId || ''),
      departmentId: String(req.query.departmentId || ''),
      search: String(req.query.search || ''),
    };

    // Remove empty strings so service treats them as unset
    const cleanFilters = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.providerId ? { providerId: filters.providerId } : {}),
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    };

    const result = await queueService.getTodayQueue(cleanFilters);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching today queue', { error });
    next(new ApiError(500, 'Failed to fetch queue data'));
  }
};

/**
 * PATCH /api/staff/queue/:id/status
 * Update appointment status with optimistic locking
 */
export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const appointmentId = parseInt(String(req.params.id), 10);
    if (isNaN(appointmentId)) {
      return next(new ApiError(400, 'Invalid appointment ID'));
    }

    const { newStatus, version } = req.body;

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return next(new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`));
    }

    if (version === undefined || version === null || typeof version !== 'number') {
      return next(new ApiError(400, 'Version number is required for optimistic locking'));
    }

    const staffId = req.user?.userId;
    if (!staffId) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const result = await queueService.updateAppointmentStatus(
      appointmentId,
      newStatus,
      staffId,
      version,
    );

    if (!result.success) {
      // Conflict or invalid transition
      res.status(409).json({
        success: false,
        error: result.conflict?.message || 'Status update conflict',
        conflict: result.conflict,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Log audit entry
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await logAuditEntry({
        user_id: staffId,
        action: 'UPDATE',
        table_name: 'appointments',
        record_id: appointmentId.toString(),
        old_values: { status: 'previous' },
        new_values: {
          status: newStatus,
          ...(result.isLateArrival !== undefined ? { isLateArrival: result.isLateArrival } : {}),
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (auditError) {
      logger.warn('Failed to write audit log for status update', { auditError });
    }

    // Broadcast WebSocket event (TASK_004 integration point)
    try {
      const { broadcastQueueUpdate } = await import('../services/websocketService');
      const staffName = await queueService.getStaffName(staffId);
      broadcastQueueUpdate({
        type: 'status_change',
        appointmentId: appointmentId.toString(),
        newStatus,
        staffName,
        timestamp: new Date(),
      });
    } catch {
      // WebSocket not yet available (TASK_004) — silently skip
    }

    res.json({
      success: true,
      data: result.appointment,
      isLateArrival: result.isLateArrival || false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating appointment status', { error });
    next(new ApiError(500, 'Failed to update appointment status'));
  }
};
