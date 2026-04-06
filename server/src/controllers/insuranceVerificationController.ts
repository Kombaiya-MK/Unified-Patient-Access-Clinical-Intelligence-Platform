/**
 * Insurance Verification Controller
 *
 * API endpoint handlers for insurance verification operations.
 *
 * @module insuranceVerificationController
 * @task US_037 TASK_002
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import {
  verifyEligibility,
  getLatestVerification,
  getVerificationHistory,
} from '../services/insuranceVerificationService';
import logger from '../utils/logger';

function parseParamId(req: AuthRequest, paramName: string): number {
  const raw = req.params[paramName];
  const val = Array.isArray(raw) ? raw[0] : raw;
  const id = parseInt(val, 10);
  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid ${paramName}`);
  }
  return id;
}

/**
 * GET /api/admin/insurance/verifications/:patientId
 * Get latest insurance verification for a patient.
 */
export async function getVerification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const patientId = parseParamId(req, 'patientId');
    const verification = await getLatestVerification(patientId);

    if (!verification) {
      res.status(404).json({ success: false, message: 'No verification found for this patient' });
      return;
    }

    res.json({ success: true, data: verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get verification';
    logger.error('getVerification error:', error);
    res.status(500).json({ success: false, message });
  }
}

/**
 * POST /api/admin/insurance/verifications/verify/:appointmentId
 * Trigger manual insurance verification for an appointment.
 */
export async function manualVerify(req: AuthRequest, res: Response): Promise<void> {
  try {
    const appointmentIdRaw = req.params.appointmentId;
    const appointmentId = parseInt(Array.isArray(appointmentIdRaw) ? appointmentIdRaw[0] : appointmentIdRaw, 10);
    if (isNaN(appointmentId) || appointmentId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid appointment ID' });
      return;
    }

    // Look up patient from appointment
    const { pool } = await import('../config/database');
    const apptResult = await pool.query(
      'SELECT patient_id FROM appointments WHERE id = $1',
      [appointmentId],
    );

    if (apptResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    const patientId = apptResult.rows[0].patient_id;
    const userId = req.user?.userId;
    const verification = await verifyEligibility(patientId, appointmentId, userId);

    res.status(201).json({ success: true, data: verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    logger.error('manualVerify error:', error);
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    res.status(statusCode).json({ success: false, message });
  }
}

/**
 * GET /api/admin/insurance/verifications/:patientId/history
 * Get verification history with pagination.
 */
export async function getVerificationHistoryHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const patientId = parseParamId(req, 'patientId');
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

    const result = await getVerificationHistory(patientId, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get history';
    logger.error('getVerificationHistory error:', error);
    res.status(500).json({ success: false, message });
  }
}
