/**
 * AI Extraction Retry Worker
 *
 * Polls ai_extraction_jobs_queue every minute for queued jobs and
 * processes them through the GPT-4 Vision circuit breaker.
 *
 * Rate limit : 10 jobs / minute
 * Backoff    : 1 min → 5 min → 15 min per document
 * Max retries: 3
 *
 * @module workers/ai-extraction-retry-worker
 * @task US_041 TASK_001
 */
import cron from 'node-cron';
import { pool } from '../config/database';
import { gpt4VisionExtractionBreaker } from '../config/circuit-breaker.config';
import { extractDataFromDocument } from '../services/aiExtractionService';
import logger from '../utils/logger';

const JOBS_PER_TICK = 10; // rate-limit: max 10 per minute
const BACKOFF_MS = [60_000, 300_000, 900_000]; // 1 min, 5 min, 15 min
const MAX_RETRIES = 3;

interface QueuedJob {
  id: number;
  document_id: number;
  job_type: string;
  retry_count: number;
}

async function processJob(job: QueuedJob): Promise<void> {
  const { id, document_id, retry_count } = job;

  // Mark processing
  await pool.query(
    `UPDATE app.ai_extraction_jobs_queue SET status = 'processing' WHERE id = $1`,
    [id],
  );

  try {
    // Fetch document details
    const docResult = await pool.query(
      `SELECT file_path, mime_type, document_type FROM app.clinical_documents WHERE id = $1`,
      [document_id],
    );

    if (docResult.rows.length === 0) {
      throw new Error(`Document ${document_id} not found`);
    }

    const { file_path, mime_type, document_type } = docResult.rows[0];

    // Attempt extraction via circuit breaker
    await gpt4VisionExtractionBreaker.fire(async () => {
      return extractDataFromDocument(file_path, mime_type, document_type);
    });

    // Mark completed
    await pool.query(
      `UPDATE app.ai_extraction_jobs_queue
       SET status = 'completed', processed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id],
    );

    logger.info(`Queued extraction completed for document ${document_id}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const newRetry = retry_count + 1;

    if (newRetry >= MAX_RETRIES) {
      await pool.query(
        `UPDATE app.ai_extraction_jobs_queue
         SET status = 'failed',
             retry_count = $1,
             error_details = $2
         WHERE id = $3`,
        [newRetry, JSON.stringify({ error: errMsg, retries: newRetry }), id],
      );
      logger.error(`Document ${document_id} failed after ${MAX_RETRIES} retries: ${errMsg}`);
    } else {
      const nextRun = new Date(Date.now() + BACKOFF_MS[newRetry - 1]);
      await pool.query(
        `UPDATE app.ai_extraction_jobs_queue
         SET status = 'queued',
             retry_count = $1,
             scheduled_at = $2
         WHERE id = $3`,
        [newRetry, nextRun, id],
      );
      logger.warn(`Document ${document_id} retry ${newRetry} scheduled at ${nextRun.toISOString()}`);
    }
  }
}

/**
 * Start the extraction retry worker (cron: every minute).
 */
export function startExtractionRetryWorker(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const { rows } = await pool.query<QueuedJob>(
        `SELECT id, document_id, job_type, retry_count
         FROM app.ai_extraction_jobs_queue
         WHERE status = 'queued' AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT $1`,
        [JOBS_PER_TICK],
      );

      if (rows.length === 0) return;

      logger.info(`Processing ${rows.length} queued extraction job(s)`);
      for (const job of rows) {
        await processJob(job);
      }
    } catch (error) {
      logger.error('Extraction retry worker error:', error);
    }
  });

  logger.info('AI extraction retry worker started (cron: every minute, rate: 10/min)');
}
