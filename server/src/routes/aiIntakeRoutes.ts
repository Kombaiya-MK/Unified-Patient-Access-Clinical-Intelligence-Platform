/**
 * AI Intake Routes
 * 
 * File: server/src/routes/aiIntakeRoutes.ts
 * Task: US_025 TASK_002 - Backend AI Intake API Endpoints
 * 
 * REST endpoints for AI-assisted patient intake conversations.
 */
import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as aiIntakeController from '../controllers/aiIntakeController';
import { processIntakeWithFlags } from '../services/aiIntakeService';
import { AuthRequest } from '../types/auth.types';

const router = Router();

/**
 * POST /api/intake/ai/start
 * Start a new AI intake conversation (flag-aware).
 * When ai_intake_enabled=false, returns redirect to manual form.
 * @access Authenticated (patient, staff, admin)
 */
router.post('/start', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { patientId, appointmentId } = req.body;

    if (!patientId) {
      res.status(400).json({ success: false, message: 'patientId is required' });
      return;
    }

    const result = await processIntakeWithFlags(
      userId,
      role,
      Number(patientId),
      appointmentId ? Number(appointmentId) : undefined,
    );

    if (!result.aiEnabled) {
      res.status(200).json({
        success: true,
        aiAvailable: false,
        message: 'AI intake disabled, please use manual form',
        redirectTo: result.redirectTo,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(201).json({
      success: true,
      aiAvailable: true,
      data: result.data,
      model: result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/intake/ai/message
 * Send a message in the conversation
 * @access Authenticated (patient, staff, admin)
 */
router.post('/message', authenticate, aiIntakeController.sendMessage);

/**
 * GET /api/intake/ai/conversation/:id
 * Get conversation details
 * @access Authenticated (patient, staff, admin)
 */
router.get('/conversation/:id', authenticate, aiIntakeController.getConversation);

/**
 * POST /api/intake/ai/submit
 * Submit a completed conversation as a clinical document
 * @access Authenticated (patient, staff, admin)
 */
router.post('/submit', authenticate, aiIntakeController.submitConversation);

export default router;
