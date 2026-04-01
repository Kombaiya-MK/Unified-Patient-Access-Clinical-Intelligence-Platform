/**
 * Staff Patient Controller
 * 
 * Handles HTTP requests for staff patient search operations.
 * GET /api/staff/patients/search — search patients by name, phone, or email.
 * 
 * @module staffPatientController
 * @created 2026-04-01
 * @task US_023 TASK_001
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import patientSearchService from '../services/patientSearchService';
import logger from '../utils/logger';

/**
 * GET /api/staff/patients/search
 * Search patients by name, phone, or email.
 * At least one query parameter required.
 */
export const searchPatients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const name = String(req.query.name || '').trim();
    const phone = String(req.query.phone || '').trim();
    const email = String(req.query.email || '').trim();

    if (!name && !phone && !email) {
      return next(new ApiError(400, 'At least one search parameter (name, phone, or email) is required'));
    }

    const query = {
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
    };

    const patients = await patientSearchService.searchPatients(query);

    res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error searching patients:', { error: errorMessage });
    next(new ApiError(500, 'Failed to search patients'));
  }
};
