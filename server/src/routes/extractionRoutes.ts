/**
 * Extraction Management Routes
 * @module routes/extractionRoutes
 * @task US_029 TASK_003
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  triggerExtraction,
  getExtractedData,
  reviewExtractedData,
  getExtractionLogs,
} from '../controllers/extractionController';

const router = Router();

router.post('/:id/extract', authenticate, triggerExtraction);
router.get('/:id/extracted-data', authenticate, getExtractedData);
router.patch('/:id/review', authenticate, reviewExtractedData);
router.get('/:id/extraction-logs', authenticate, getExtractionLogs);

export default router;
