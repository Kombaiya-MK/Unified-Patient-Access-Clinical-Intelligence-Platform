/**
 * AI Intake Routes
 * 
 * File: server/src/routes/aiIntakeRoutes.ts
 * Task: US_025 TASK_002 - Backend AI Intake API Endpoints
 * 
 * REST endpoints for AI-assisted patient intake conversations.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as aiIntakeController from '../controllers/aiIntakeController';

const router = Router();

/**
 * POST /api/intake/ai/start
 * Start a new AI intake conversation
 * @access Authenticated (patient, staff, admin)
 */
router.post('/start', authenticate, aiIntakeController.startConversation);

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
