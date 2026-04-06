/**
 * Conflict Check Routes
 * @module routes/conflictCheckRoutes
 * @description Routes for medication conflict checking, overriding, and validation
 * @epic EP-006
 * @story US-033
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  checkConflicts,
  getActiveConflicts,
  overrideConflict,
  getConflictHistory,
  validateMedication,
} from '../controllers/conflictCheckController';

const router = Router();

// Medication conflict checking
router.post('/:id/medications/check-conflicts', authenticate, checkConflicts);
router.get('/:id/conflicts', authenticate, getActiveConflicts);
router.patch('/:id/conflicts/:conflictId/override', authenticate, overrideConflict);
router.get('/:id/conflicts/history', authenticate, getConflictHistory);

// Medication validation (not patient-specific)
router.post('/medications/validate', authenticate, validateMedication);

export default router;
