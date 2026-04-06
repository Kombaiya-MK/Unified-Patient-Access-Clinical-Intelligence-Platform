/**
 * Patient Profile Controller
 * @module controllers/patientProfileController
 * @description Handles unified patient profile generation and conflict detection
 * @epic EP-006
 * @story US-031
 * @task task_002_be_patient_profile_generation_api, task_003_be_conflict_detection_service
 */

import { Response } from 'express';
import { profileGenerationService } from '../services/profileGenerationService';
import { profileConflictDetectionService } from '../services/profileConflictDetectionService';
import { ApiError, AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

export const getPatientProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      throw new ApiError(400, 'Patient ID is required');
    }

    const profile = await profileGenerationService.generateProfile(String(patientId));
    res.json({ success: true, data: profile, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to get patient profile:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to generate patient profile', timestamp: new Date().toISOString() });
    }
  }
};

export const detectProfileConflicts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      throw new ApiError(400, 'Patient ID is required');
    }

    const conflicts = await profileConflictDetectionService.detectConflicts(patientId as string);
    res.json({ success: true, data: { conflicts, total: conflicts.length }, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to detect profile conflicts:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to detect conflicts', timestamp: new Date().toISOString() });
    }
  }
};

export const refreshProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      throw new ApiError(400, 'Patient ID is required');
    }

    await profileGenerationService.invalidateCache(patientId as string);
    const profile = await profileGenerationService.generateProfile(String(patientId));
    res.json({ success: true, data: profile, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to refresh patient profile:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh profile', timestamp: new Date().toISOString() });
  }
};
