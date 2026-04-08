/**
 * Manual Intake Controller
 * 
 * File: server/src/controllers/manualIntakeController.ts
 * Task: US_026 TASK_001 - Backend Draft Auto-Save and Submission API
 * 
 * Handles HTTP requests for manual patient intake form drafts.
 */
import { Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { AuthRequest } from '../types/auth.types';
import * as manualIntakeService from '../services/manualIntakeService';

/**
 * POST /api/intake/manual/draft
 * Create or update a manual intake draft
 */
export async function saveDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { patientId, appointmentId, draftData } = req.body;

    if (!patientId) {
      throw new ApiError(400, 'patientId is required');
    }
    if (!draftData || typeof draftData !== 'object') {
      throw new ApiError(400, 'draftData is required');
    }

    const result = await manualIntakeService.saveDraft(
      Number(patientId),
      userId,
      draftData,
      appointmentId ? Number(appointmentId) : undefined,
    );

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/intake/manual/draft/:id
 * Update an existing draft
 */
export async function updateDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const draftId = Number(req.params.id);
    if (isNaN(draftId)) {
      throw new ApiError(400, 'Invalid draft ID');
    }

    const { draftData } = req.body;
    if (!draftData || typeof draftData !== 'object') {
      throw new ApiError(400, 'draftData is required');
    }

    const result = await manualIntakeService.updateDraft(draftId, draftData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/intake/manual/draft/:appointmentId
 * Get a draft by appointment ID
 */
export async function getDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointmentId = Number(req.params.appointmentId);
    if (isNaN(appointmentId)) {
      throw new ApiError(400, 'Invalid appointment ID');
    }

    const result = await manualIntakeService.getDraftByAppointment(appointmentId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/intake/manual/submit
 * Submit a draft as a finalized clinical document
 */
export async function submitDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { draftId, intakeMode } = req.body;

    if (!draftId) {
      throw new ApiError(400, 'draftId is required');
    }

    const result = await manualIntakeService.submitDraft(
      Number(draftId),
      userId,
      intakeMode || 'manual',
    );

    res.json({
      success: true,
      data: result,
      message: 'Intake submitted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
