/**
 * Extraction Controller
 * Handles extraction management: trigger, retrieve, review, and logs.
 * @module controllers/extractionController
 * @task US_029 TASK_003
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiError } from '../types';
import { addExtractionJob } from '../queues/documentExtractionQueue';
import pool from '../config/database';

export const triggerExtraction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'Authentication required');

    const docResult = await pool.query(
      `SELECT id, patient_id, extraction_status, file_url, mime_type, document_type
       FROM app.clinical_documents WHERE id = $1`,
      [id],
    );

    if (docResult.rows.length === 0) {
      throw new ApiError(404, 'Document not found');
    }

    const doc = docResult.rows[0];

    if (doc.extraction_status === 'Processing') {
      throw new ApiError(409, 'Extraction already in progress');
    }

    const jobId = await addExtractionJob({
      documentId: Number(doc.id),
      patientId: Number(doc.patient_id),
      filePath: doc.file_url,
      mimeType: doc.mime_type,
      documentType: doc.document_type,
    });

    await pool.query(
      `UPDATE app.clinical_documents SET extraction_status = 'Processing' WHERE id = $1`,
      [id],
    );

    res.status(202).json({
      success: true,
      data: { jobId, documentId: Number(id) },
      message: 'Extraction started',
    });
  } catch (error) {
    next(error);
  }
};

export const getExtractedData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT cd.id AS document_id, cd.patient_id, cd.extraction_status,
              cd.extraction_confidence, cd.needs_manual_review,
              cd.extraction_completed_at, cd.extraction_error,
              pp.extracted_data
       FROM app.clinical_documents cd
       LEFT JOIN app.patient_profiles pp ON pp.source_document_id = cd.id
       WHERE cd.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Document not found');
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        documentId: Number(row.document_id),
        patientId: Number(row.patient_id),
        extractionStatus: row.extraction_status,
        extractionConfidence: row.extraction_confidence,
        needsManualReview: row.needs_manual_review,
        extractedData: row.extracted_data,
        extractionCompletedAt: row.extraction_completed_at,
        extractionError: row.extraction_error,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reviewExtractedData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) throw new ApiError(401, 'Authentication required');
    if (role !== 'staff' && role !== 'admin') {
      throw new ApiError(403, 'Staff access required');
    }

    const { correctedData, reviewNotes } = req.body;
    if (!correctedData) {
      throw new ApiError(400, 'correctedData is required');
    }

    // Update patient_profiles with corrected data
    await pool.query(
      `UPDATE app.patient_profiles
       SET extracted_data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE source_document_id = $2`,
      [JSON.stringify(correctedData), id],
    );

    // Update clinical_documents
    await pool.query(
      `UPDATE app.clinical_documents
       SET needs_manual_review = false, extraction_status = 'Processed'
       WHERE id = $1`,
      [id],
    );

    // Log the review
    await pool.query(
      `INSERT INTO app.extraction_logs
        (document_id, extraction_attempt, status, reviewed_by_staff_id, review_notes)
       VALUES ($1, (SELECT COALESCE(MAX(extraction_attempt), 0) + 1 FROM app.extraction_logs WHERE document_id = $1), 'Manually Reviewed', $2, $3)`,
      [id, userId, reviewNotes || null],
    );

    res.json({
      success: true,
      data: { extractedData: correctedData },
      message: 'Review saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getExtractionLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, document_id, extraction_attempt, attempted_at, status,
              confidence_scores, error_message, processing_duration_ms,
              reviewed_by_staff_id, review_notes
       FROM app.extraction_logs
       WHERE document_id = $1
       ORDER BY attempted_at DESC`,
      [id],
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
