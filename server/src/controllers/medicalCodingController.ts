/**
 * Medical Coding Controller
 * @module controllers/medicalCodingController
 * @description Handles ICD-10/CPT code generation, review, and search
 * @epic EP-006
 * @story US-032
 * @task task_003_be_medical_coding_api
 */

import { Response } from 'express';
import { medicalCodingService } from '../services/medicalCodingService';
import { ApiError, AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

export const generateCodes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { patient_id, clinical_notes, chief_complaint, diagnoses, procedures } = req.body;

    if (!appointmentId || !clinical_notes) {
      throw new ApiError(400, 'Appointment ID and clinical notes are required');
    }

    const result = await medicalCodingService.generateCodes({
      appointment_id: appointmentId as string,
      patient_id: patient_id || '',
      clinical_notes,
      chief_complaint,
      diagnoses,
      procedures,
    });

    res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to generate codes:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to generate medical codes', timestamp: new Date().toISOString() });
    }
  }
};

export const getSuggestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      throw new ApiError(400, 'Appointment ID is required');
    }

    const suggestions = await medicalCodingService.getSuggestions(appointmentId as string);
    res.json({ success: true, data: suggestions, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to get code suggestions:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get suggestions', timestamp: new Date().toISOString() });
    }
  }
};

export const reviewCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { suggestionId } = req.params;
    const { action, modified_code, modified_description, modification_reason } = req.body;

    if (!suggestionId || !action) {
      throw new ApiError(400, 'Suggestion ID and action are required');
    }
    const resolvedSuggestionId = suggestionId as string;

    if (!['approve', 'reject', 'modify'].includes(action)) {
      throw new ApiError(400, 'Action must be approve, reject, or modify');
    }

    if (action === 'modify' && !modified_code) {
      throw new ApiError(400, 'Modified code is required for modify action');
    }

    const staffId = req.user?.id || '';
    const result = await medicalCodingService.reviewCode({
      suggestion_id: resolvedSuggestionId,
      action,
      modified_code,
      modified_description,
      modification_reason,
      staff_id: staffId,
    });

    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to review code:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to review code', timestamp: new Date().toISOString() });
    }
  }
};

export const bulkApprove = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { suggestion_ids } = req.body;

    if (!Array.isArray(suggestion_ids) || suggestion_ids.length === 0) {
      throw new ApiError(400, 'Suggestion IDs array is required');
    }

    if (suggestion_ids.length > 50) {
      throw new ApiError(400, 'Cannot bulk approve more than 50 suggestions at once');
    }

    const staffId = req.user?.id || '';
    const approvedCount = await medicalCodingService.bulkApprove({
      suggestion_ids,
      staff_id: staffId,
    });

    res.json({ success: true, data: { approved_count: approvedCount }, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to bulk approve codes:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to bulk approve', timestamp: new Date().toISOString() });
    }
  }
};

export const searchCodes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { q, code_type } = req.query;

    if (!q || typeof q !== 'string') {
      throw new ApiError(400, 'Search query is required');
    }

    const results = await medicalCodingService.searchCodes(q, code_type as string | undefined);
    res.json({ success: true, data: results, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Failed to search codes:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, error: 'Failed to search codes', timestamp: new Date().toISOString() });
    }
  }
};
