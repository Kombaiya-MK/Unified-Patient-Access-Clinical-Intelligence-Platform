/**
 * Deduplication Management Routes
 * @module routes/deduplicationRoutes
 * @task US_030 TASK_003
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  manualDeduplicate,
  getMergeHistory,
  getConflicts,
  resolveConflict,
} from '../controllers/deduplicationController';

const router = Router();

router.post('/:id/deduplicate', authenticate, manualDeduplicate);
router.get('/:id/merge-history', authenticate, getMergeHistory);
router.get('/:id/conflicts', authenticate, getConflicts);
router.patch('/:id/conflicts/:conflictId/resolve', authenticate, resolveConflict);

export default router;
