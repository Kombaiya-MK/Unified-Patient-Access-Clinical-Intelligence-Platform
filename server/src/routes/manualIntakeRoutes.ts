/**
 * Manual Intake Routes
 * 
 * File: server/src/routes/manualIntakeRoutes.ts
 * Task: US_026 TASK_001 - Backend Draft Auto-Save and Submission API
 * 
 * REST endpoints for manual patient intake form drafts.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as manualIntakeController from '../controllers/manualIntakeController';

const router = Router();

/**
 * POST /api/intake/manual/draft
 * Create or update a manual intake draft
 * @access Authenticated (patient, staff, admin)
 */
router.post('/draft', authenticate, manualIntakeController.saveDraft);

/**
 * PUT /api/intake/manual/draft/:id
 * Update an existing draft by ID
 * @access Authenticated (patient, staff, admin)
 */
router.put('/draft/:id', authenticate, manualIntakeController.updateDraft);

/**
 * GET /api/intake/manual/draft/:appointmentId
 * Get draft by appointment ID
 * @access Authenticated (patient, staff, admin)
 */
router.get('/draft/:appointmentId', authenticate, manualIntakeController.getDraft);

/**
 * POST /api/intake/manual/submit
 * Submit a draft as a finalized clinical document
 * @access Authenticated (patient, staff, admin)
 */
router.post('/submit', authenticate, manualIntakeController.submitDraft);

export default router;
