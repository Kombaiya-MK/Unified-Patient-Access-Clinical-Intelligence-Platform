/**
 * Document Extraction Worker
 * Processes extraction jobs: reads document, calls AI, stores results.
 * @module workers/extractionWorker
 * @task US_029 TASK_002
 */

import pool from '../config/database';
import { extractDataFromDocument } from '../services/aiExtractionService';
import { EXTRACTION_CONFIG } from '../config/extraction.config';
import logger from '../utils/logger';

export async function processExtractionJob(
  documentId: number,
  patientId: number,
  filePath: string,
  mimeType: string,
  documentType: string,
): Promise<void> {
  const startTime = Date.now();
  let attempt = 1;

  // Get current attempt count
  const attemptResult = await pool.query(
    `SELECT COALESCE(MAX(extraction_attempt), 0) AS max_attempt
     FROM app.extraction_logs WHERE document_id = $1`,
    [documentId],
  );
  attempt = (attemptResult.rows[0]?.max_attempt || 0) + 1;

  // Update status to Processing
  await pool.query(
    `UPDATE app.clinical_documents SET extraction_status = 'Processing' WHERE id = $1`,
    [documentId],
  );

  try {
    const result = await extractDataFromDocument(filePath, mimeType, documentType);
    const processingDurationMs = Date.now() - startTime;
    const confidencePercent = Math.round(result.confidence * 100);
    const status = result.needsReview ? 'Needs Review' : 'Processed';

    // Update clinical_documents
    await pool.query(
      `UPDATE app.clinical_documents
       SET extraction_status = $1,
           extraction_completed_at = CURRENT_TIMESTAMP,
           extraction_confidence = $2,
           needs_manual_review = $3,
           extraction_error = NULL
       WHERE id = $4`,
      [status, confidencePercent, result.needsReview, documentId],
    );

    // Update patient_profiles extracted_data
    await pool.query(
      `UPDATE app.patient_profiles
       SET extracted_data = $1,
           source_document_id = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [JSON.stringify(result.extractedData), documentId, patientId],
    );

    // Log extraction attempt
    await pool.query(
      `INSERT INTO app.extraction_logs
        (document_id, extraction_attempt, status, confidence_scores, processing_duration_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [documentId, attempt, status, JSON.stringify(result.fieldConfidences), processingDurationMs],
    );

    logger.info('Document extraction completed', {
      documentId,
      status,
      confidence: confidencePercent,
      needsReview: result.needsReview,
      durationMs: processingDurationMs,
    });

    // Trigger deduplication after successful extraction
    try {
      const { addDeduplicationJob } = await import('../queues/deduplicationQueue');
      await addDeduplicationJob({ patientId, newDocumentId: documentId });
    } catch (err) {
      logger.warn('Could not trigger deduplication after extraction', { err });
    }
  } catch (error) {
    const processingDurationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';

    const finalStatus = attempt >= EXTRACTION_CONFIG.maxRetryAttempts
      ? 'Extraction Failed'
      : 'Uploaded'; // Reset to allow retry

    await pool.query(
      `UPDATE app.clinical_documents
       SET extraction_status = $1,
           extraction_error = $2,
           needs_manual_review = CASE WHEN $1 = 'Extraction Failed' THEN true ELSE needs_manual_review END
       WHERE id = $3`,
      [finalStatus, errorMessage, documentId],
    );

    await pool.query(
      `INSERT INTO app.extraction_logs
        (document_id, extraction_attempt, status, error_message, processing_duration_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [documentId, attempt, 'Extraction Failed', errorMessage, processingDurationMs],
    );

    logger.error('Document extraction failed', {
      documentId,
      attempt,
      maxAttempts: EXTRACTION_CONFIG.maxRetryAttempts,
      error: errorMessage,
    });

    if (attempt < EXTRACTION_CONFIG.maxRetryAttempts) {
      throw error; // Let queue retry
    }
  }
}
