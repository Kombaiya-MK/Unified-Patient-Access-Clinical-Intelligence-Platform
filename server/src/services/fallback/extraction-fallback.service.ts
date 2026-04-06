/**
 * Extraction Fallback Service
 *
 * Queues a document extraction job to ai_extraction_jobs_queue when the
 * GPT-4 Vision circuit breaker is open.
 *
 * @module services/fallback/extraction-fallback.service
 * @task US_041 TASK_001
 */
import { pool } from '../../config/database';
import { fallbackActivationCounter } from '../../config/circuit-breaker.config';
import logger from '../../utils/logger';

export interface ExtractionFallbackResponse {
  queued: boolean;
  message: string;
  estimatedRetry: Date;
}

export async function queueForRetry(
  documentId: number,
  jobType: 'ocr_extraction' | 'data_extraction' | 'classification',
): Promise<ExtractionFallbackResponse> {
  await pool.query(
    `INSERT INTO app.ai_extraction_jobs_queue (document_id, job_type, status)
     VALUES ($1, $2, 'queued')
     ON CONFLICT DO NOTHING`,
    [documentId, jobType],
  );

  fallbackActivationCounter.inc({ service: 'extraction', fallback_type: 'queue' });
  logger.warn(`Extraction fallback – document ${documentId} queued for later processing`);

  return {
    queued: true,
    message: 'Document queued for extraction when AI service recovers.',
    estimatedRetry: new Date(Date.now() + 60_000),
  };
}
