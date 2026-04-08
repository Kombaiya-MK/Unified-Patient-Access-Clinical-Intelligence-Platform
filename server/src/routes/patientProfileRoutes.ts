/**
 * Patient Profile Routes
 * @module routes/patientProfileRoutes
 * @description Routes for unified patient profile generation and conflict detection
 * @epic EP-006
 * @story US-031
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPatientProfile,
  detectProfileConflicts,
  refreshProfile,
} from '../controllers/patientProfileController';

const router = Router();

router.get('/:patientId/profile', authenticate, getPatientProfile);
router.get('/:patientId/profile/conflicts', authenticate, detectProfileConflicts);
router.post('/:patientId/profile/refresh', authenticate, refreshProfile);

export default router;
