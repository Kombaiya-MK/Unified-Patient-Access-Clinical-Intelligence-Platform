/**
 * Risk Assessment Controller
 *
 * API endpoints for no-show risk calculation and retrieval.
 *
 * @module risk.controller
 * @task US_038 TASK_002
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import {
  calculateRiskScore,
  getAppointmentRisk,
  getHighRiskPatients,
  getRiskTrend,
  getAttendanceSummary,
} from '../services/noshow-risk.service';
import logger from '../utils/logger';


/**
 * POST /api/admin/risk/calculate-noshow
 * Trigger risk calculation for a specific appointment.
 */
export async function calculateNoshow(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId || isNaN(Number(appointmentId))) {
      res.status(400).json({ success: false, message: 'Valid appointmentId is required' });
      return;
    }

    const risk = await calculateRiskScore(Number(appointmentId));
    res.json({ success: true, data: risk });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Risk calculation failed';
    logger.error('calculateNoshow error:', error);
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    res.status(statusCode).json({ success: false, message });
  }
}

/**
 * GET /api/admin/risk/appointment/:id
 * Get current risk data for an appointment.
 */
export async function getAppointmentRiskHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const raw = req.params.id;
    const appointmentId = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
    if (isNaN(appointmentId)) {
      res.status(400).json({ success: false, message: 'Invalid appointment ID' });
      return;
    }

    const risk = await getAppointmentRisk(appointmentId);
    if (!risk) {
      res.status(404).json({ success: false, message: 'Risk data not calculated for this appointment' });
      return;
    }

    res.json({ success: true, data: risk });
  } catch (error) {
    logger.error('getAppointmentRisk error:', error);
    res.status(500).json({ success: false, message: 'Failed to get risk data' });
  }
}

/**
 * GET /api/admin/risk/high-risk-patients
 * Get list of high-risk appointments in next 7 days.
 */
export async function getHighRiskPatientsHandler(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const patients = await getHighRiskPatients();
    res.json({ success: true, data: patients });
  } catch (error) {
    logger.error('getHighRiskPatients error:', error);
    res.status(500).json({ success: false, message: 'Failed to get high risk patients' });
  }
}

/**
 * GET /api/admin/risk/trend/:patientId
 * Get risk trend for a patient (12 months).
 */
export async function getRiskTrendHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const raw = req.params.patientId;
    const patientId = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ success: false, message: 'Invalid patient ID' });
      return;
    }

    const trend = await getRiskTrend(patientId);
    res.json({ success: true, data: trend });
  } catch (error) {
    logger.error('getRiskTrend error:', error);
    res.status(500).json({ success: false, message: 'Failed to get risk trend' });
  }
}

/**
 * GET /api/admin/risk/attendance/:patientId
 * Get attendance summary for a patient.
 */
export async function getAttendanceSummaryHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const raw = req.params.patientId;
    const patientId = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ success: false, message: 'Invalid patient ID' });
      return;
    }

    const summary = await getAttendanceSummary(patientId);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('getAttendanceSummary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance summary' });
  }
}
