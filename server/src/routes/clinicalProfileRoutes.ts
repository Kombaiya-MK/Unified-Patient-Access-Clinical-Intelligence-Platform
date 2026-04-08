/**
 * Clinical Profile Routes
 * @module routes/clinicalProfileRoutes
 * @description Routes for unified clinical profile retrieval and conflict resolution
 * @epic EP-006
 * @story US-034
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getClinicalProfile,
  resolveFieldConflict,
  getProfileHistory,
} from '../controllers/clinicalProfileController';

const router = Router();

router.get('/:id/clinical-profile', authenticate, getClinicalProfile);
router.patch('/:id/conflicts/:fieldName/resolve', authenticate, resolveFieldConflict);
router.get('/:id/clinical-profile/history', authenticate, getProfileHistory);

export default router;
