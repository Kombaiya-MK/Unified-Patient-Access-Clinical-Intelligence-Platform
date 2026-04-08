/**
 * AI Intake Controller
 * 
 * File: server/src/controllers/aiIntakeController.ts
 * Task: US_025 TASK_002 - Backend AI Intake API Endpoints
 * 
 * Handles HTTP requests for AI-assisted patient intake.
 */
import { Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { AuthRequest } from '../types/auth.types';
import * as aiIntakeService from '../services/aiIntakeService';

/**
 * POST /api/intake/ai/start
 * Start a new AI intake conversation
 */
export async function startConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { patientId, appointmentId } = req.body;

    if (!patientId) {
      throw new ApiError(400, 'patientId is required');
    }

    const result = await aiIntakeService.createConversation(
      Number(patientId),
      userId,
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
 * POST /api/intake/ai/message
 * Send a message in an existing conversation
 */
export async function sendMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { conversationId, message } = req.body;

    if (!conversationId) {
      throw new ApiError(400, 'conversationId is required');
    }
    if (!message || typeof message !== 'string') {
      throw new ApiError(400, 'message is required and must be a string');
    }

    const result = await aiIntakeService.sendMessage(
      Number(conversationId),
      message,
      userId,
    );

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
 * GET /api/intake/ai/conversation/:id
 * Get conversation details
 */
export async function getConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const conversationId = Number(req.params.id);
    if (isNaN(conversationId)) {
      throw new ApiError(400, 'Invalid conversation ID');
    }

    const result = await aiIntakeService.getConversation(conversationId);

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
 * POST /api/intake/ai/submit
 * Submit a completed conversation
 */
export async function submitConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { conversationId, intakeMode } = req.body;

    if (!conversationId) {
      throw new ApiError(400, 'conversationId is required');
    }

    const result = await aiIntakeService.submitConversation(
      Number(conversationId),
      userId,
      intakeMode || 'ai',
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
