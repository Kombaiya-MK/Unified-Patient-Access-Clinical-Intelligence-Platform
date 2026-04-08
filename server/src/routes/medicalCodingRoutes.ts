/**
 * Medical Coding Routes
 * @module routes/medicalCodingRoutes
 * @description Routes for ICD-10/CPT code generation, review, and search
 * @epic EP-006
 * @story US-032
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateCodes,
  getSuggestions,
  reviewCode,
  bulkApprove,
  searchCodes,
} from '../controllers/medicalCodingController';

const router = Router();

router.post('/:appointmentId/codes/generate', authenticate, generateCodes);
router.get('/:appointmentId/codes', authenticate, getSuggestions);
router.patch('/codes/:suggestionId/review', authenticate, reviewCode);
router.post('/codes/bulk-approve', authenticate, bulkApprove);
router.get('/codes/search', authenticate, searchCodes);

export default router;
