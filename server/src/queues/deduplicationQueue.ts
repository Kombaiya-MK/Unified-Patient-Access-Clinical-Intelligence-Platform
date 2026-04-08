/**
 * Deduplication Queue
 * Queue for background deduplication processing triggered after extraction.
 * @module queues/deduplicationQueue
 * @task US_030 TASK_003
 */

import logger from '../utils/logger';

interface DeduplicationJob {
  patientId: number;
  newDocumentId: number;
}

const pendingJobs: DeduplicationJob[] = [];
let isProcessing = false;

export async function addDeduplicationJob(job: DeduplicationJob): Promise<string> {
  const jobId = `dedup-${job.patientId}-${job.newDocumentId}-${Date.now()}`;
  pendingJobs.push(job);
  logger.info('Deduplication job queued', { jobId, patientId: job.patientId, documentId: job.newDocumentId });

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
    const { performDeduplication } = await import('../services/mergeService');
    await performDeduplication(job.patientId, job.newDocumentId);
  } catch (error) {
    logger.error('Deduplication job failed', {
      patientId: job.patientId,
      documentId: job.newDocumentId,
      error,
    });
  }

  setImmediate(() => processNextJob());
}

export function getQueueLength(): number {
  return pendingJobs.length;
}
