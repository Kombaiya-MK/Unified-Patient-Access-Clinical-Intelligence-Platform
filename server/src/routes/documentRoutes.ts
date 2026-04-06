/**
 * Document Upload Routes
 * @module routes/documentRoutes
 * @task US_028 TASK_001
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMultiple, handleUploadErrors } from '../middleware/uploadMiddleware';
import {
  uploadDocuments,
  checkDuplicateHash,
  getDocuments,
  deleteDocument,
} from '../controllers/documentController';

const router = Router();

router.post('/upload', authenticate, uploadMultiple, handleUploadErrors, uploadDocuments);
router.post('/check-duplicate', authenticate, checkDuplicateHash);
router.get('/patient/:patientId', authenticate, getDocuments);
router.delete('/:id', authenticate, deleteDocument);

export default router;
