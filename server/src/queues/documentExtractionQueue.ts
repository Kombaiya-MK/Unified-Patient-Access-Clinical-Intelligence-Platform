/**
 * Document Extraction Queue
 * Bull-based queue for background document extraction processing.
 * @module queues/documentExtractionQueue
 * @task US_029 TASK_002
 */

import logger from '../utils/logger';

interface ExtractionJob {
  documentId: number;
  patientId: number;
  filePath: string;
  mimeType: string;
  documentType: string;
}

const pendingJobs: ExtractionJob[] = [];
let isProcessing = false;

export async function addExtractionJob(job: ExtractionJob): Promise<string> {
  const jobId = `extraction-${job.documentId}-${Date.now()}`;
  pendingJobs.push(job);
  logger.info('Extraction job queued', { jobId, documentId: job.documentId });

  if (!isProcessing) {
    processNextJob();
  }

  return jobId;
}

async function processNextJob(): Promise<void> {
  if (pendingJobs.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const job = pendingJobs.shift()!;

  try {
    const { processExtractionJob } = await import('../workers/extractionWorker');
    await processExtractionJob(job.documentId, job.patientId, job.filePath, job.mimeType, job.documentType);
  } catch (error) {
    logger.error('Extraction job failed', { documentId: job.documentId, error });
  }

  // Process next job
  setImmediate(() => processNextJob());
}

export function getQueueLength(): number {
  return pendingJobs.length;
}
