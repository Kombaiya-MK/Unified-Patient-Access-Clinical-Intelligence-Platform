/**
 * Clinical Profile Controller
 * @module controllers/clinicalProfileController
 * @description Handles unified clinical profile retrieval and conflict resolution
 * @epic EP-006
 * @story US-034
 * @task task_001_be_unified_profile_api
 */

import { Response } from 'express';
import { profileAggregationService } from '../services/profileAggregationService';
import { ApiError, AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

export const getClinicalProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const includeHistory = req.query.include_history === 'true';
    const includeAllDocuments = req.query.include_all_documents === 'true';

    if (!id) {
      throw new ApiError(400, 'Patient ID is required');
    }

    const profile = await profileAggregationService.getAggregatedProfile(String(id), {
      includeHistory,
      includeAllDocuments,
    });

    res.json({ success: true, data: profile, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to get clinical profile:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get clinical profile', timestamp: new Date().toISOString() });
    }
  }
};

export const resolveFieldConflict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, fieldName } = req.params;
    const { selected_value, resolution_notes } = req.body;

    if (!id || !fieldName) {
      throw new ApiError(400, 'Patient ID and field name are required');
    }

    if (!selected_value) {
      throw new ApiError(400, 'Selected value is required');
    }

    if (!resolution_notes || typeof resolution_notes !== 'string' || resolution_notes.length < 10) {
      throw new ApiError(400, 'Resolution notes must be at least 10 characters');
    }

    const staffId = req.user?.id || '';

    await profileAggregationService.resolveConflict(String(id), String(fieldName), selected_value, resolution_notes, staffId);

    // Get updated profile
    const updatedProfile = await profileAggregationService.getAggregatedProfile(String(id));

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Conflict resolved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to resolve conflict:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to resolve conflict', timestamp: new Date().toISOString() });
    }
  }
};

export const getProfileHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!id) {
      throw new ApiError(400, 'Patient ID is required');
    }

    const history = await profileAggregationService.getProfileHistory(String(id), limit, offset);

    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get profile history:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile history', timestamp: new Date().toISOString() });
  }
};
