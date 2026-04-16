/**
 * Extraction Management Routes
 * @module routes/extractionRoutes
 * @task US_029 TASK_003
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getExtractedData,
  reviewExtractedData,
  getExtractionLogs,
} from '../controllers/extractionController';
import { extractDocumentWithFlags } from '../services/aiExtractionService';
import { AuthRequest } from '../types/auth.types';
import pool from '../config/database';

const router = Router();

/**
 * POST /api/documents/:id/extract
 * Flag-aware extraction trigger.
 * When ai_extraction_enabled=false, returns queued-for-manual response.
 */
router.post('/:id/extract', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role ?? 'patient';
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const docResult = await pool.query(
      `SELECT id, patient_id, file_url, mime_type, document_type
       FROM app.clinical_documents WHERE id = $1`,
      [id],
    );

    if (docResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const doc = docResult.rows[0];

    const result = await extractDocumentWithFlags(
      userId,
      role,
      doc.file_url,
      doc.mime_type,
      doc.document_type,
      Number(doc.id),
    );

    if (!result.aiEnabled) {
      res.status(200).json({
        success: true,
        aiAvailable: false,
        message: 'Document queued for manual data entry',
        status: 'queued_for_manual',
        documentId: Number(id),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      aiAvailable: true,
      data: result.data,
      model: result.model,
      documentId: Number(id),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/extracted-data', authenticate, getExtractedData);
router.patch('/:id/review', authenticate, reviewExtractedData);
router.get('/:id/extraction-logs', authenticate, getExtractionLogs);

export default router;
