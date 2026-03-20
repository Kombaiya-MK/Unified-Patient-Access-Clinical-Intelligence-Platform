/**
 * Calendar Sync Queue Processor
 * 
 * Scheduled task that processes queued calendar sync operations with rate limiting.
 * Handles retry logic, exponential backoff, and automatic cleanup.
 * 
 * Schedule: every 5 minutes ('* /5 * * * *' without the space)
 * 
 * Process:
 * 1. Fetch pending operations from calendar_sync_queue (FIFO order)
 * 2. Check rate limits before processing
 * 3. Apply exponential backoff for retries (5s, 15s)
 * 4. Execute calendar sync operation (create/update/delete)
 * 5. Update operation status (completed/failed)
 * 6. Increment retry_count on failures
 * 7. Mark as 'failed' after 3 retries
 * 8. Cleanup completed operations older than 7 days
 * 
 * @module calendarSyncQueueJob
 * @created 2026-03-20
 * @task US_017 TASK_005
 */

import cron, { ScheduledTask } from 'node-cron';
import { pool } from '../config/database';
import {
  syncAppointmentToCalendar,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/calendarSyncService';
import {
  canMakeRequest,
  recordRequest,
  getDelayUntilNextRequest,
  getCurrentRequestCount,
} from '../utils/rateLimiter';
import logger from '../utils/logger';

/**
 * Cron job instance
 */
let cronTask: ScheduledTask | null = null;

/**
 * Job running flag to prevent overlapping executions
 */
let isJobRunning = false;

/**
 * Queue operation data structure
 */
interface QueueOperation {
  id: number;
  appointment_id: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  status: string;
  retry_count: number;
  user_id: number;
  provider: 'google' | 'outlook';
  error_message: string | null;
}

/**
 * Sleep utility for delays
 * 
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay based on retry count
 * 
 * @param retryCount - Number of retries so far
 * @returns Delay in milliseconds
 */
const calculateBackoffDelay = (retryCount: number): number => {
  if (retryCount === 1) return 5000;   // 5 seconds
  if (retryCount === 2) return 15000;  // 15 seconds
  return 0;  // No delay for first attempt or after max retries
};

/**
 * Process a single queue operation
 * 
 * @param operation - Queue operation to process
 */
const processQueueOperation = async (operation: QueueOperation): Promise<void> => {
  const { id, appointment_id, operation: opType, retry_count, user_id, provider } = operation;
  
  logger.info('Processing queue operation', {
    queueId: id,
    appointmentId: appointment_id,
    operation: opType,
    retryCount: retry_count,
    provider,
  });
  
  try {
    // Check rate limit before processing
    if (!canMakeRequest(provider)) {
      const delay = getDelayUntilNextRequest(provider);
      logger.info('Rate limit reached, delaying operation', {
        queueId: id,
        provider,
        delayMs: delay,
        currentCount: getCurrentRequestCount(provider),
      });
      await sleep(delay);
    }
    
    // Apply exponential backoff if this is a retry
    if (retry_count > 0) {
      const backoffDelay = calculateBackoffDelay(retry_count);
      logger.info('Applying exponential backoff', {
        queueId: id,
        retryCount: retry_count,
        backoffMs: backoffDelay,
      });
      await sleep(backoffDelay);
    }
    
    // Update status to 'processing'
    await pool.query(
      'UPDATE calendar_sync_queue SET status = $1, processed_at = NOW() WHERE id = $2',
      ['processing', id]
    );
    
    // Execute the calendar sync operation
    recordRequest(provider);  // Record before making the request
    
    let result;
    if (opType === 'create') {
      result = await syncAppointmentToCalendar(appointment_id, user_id, provider);
    } else if (opType === 'update') {
      result = await updateCalendarEvent(appointment_id, user_id, provider);
    } else if (opType === 'delete') {
      result = await deleteCalendarEvent(appointment_id, user_id, provider);
    } else {
      throw new Error(`Unknown operation type: ${opType}`);
    }
    
    // Check if operation was successful
    if (result.success) {
      // Mark as completed
      await pool.query(
        'UPDATE calendar_sync_queue SET status = $1, completed_at = NOW() WHERE id = $2',
        ['completed', id]
      );
      
      logger.info('Queue operation completed successfully', {
        queueId: id,
        appointmentId: appointment_id,
        operation: opType,
        eventId: result.eventId,
      });
    } else {
      // Operation failed, will be handled in catch block
      throw new Error(result.error || 'Calendar sync operation failed');
    }
  } catch (error: any) {
    logger.error('Queue operation failed', {
      queueId: id,
      appointmentId: appointment_id,
      operation: opType,
      retryCount: retry_count,
      error: error.message,
    });
    
    // Increment retry count
    const newRetryCount = retry_count + 1;
    
    // Check if we've exceeded max retries
    if (newRetryCount >= 3) {
      // Mark as failed
      await pool.query(
        `UPDATE calendar_sync_queue 
         SET status = $1, retry_count = $2, error_message = $3 
         WHERE id = $4`,
        ['failed', newRetryCount, error.message, id]
      );
      
      logger.warn('Queue operation marked as failed after max retries', {
        queueId: id,
        appointmentId: appointment_id,
        retryCount: newRetryCount,
        error: error.message,
      });
    } else {
      // Reset to pending for retry
      await pool.query(
        `UPDATE calendar_sync_queue 
         SET status = $1, retry_count = $2, error_message = $3 
         WHERE id = $4`,
        ['pending', newRetryCount, error.message, id]
      );
      
      logger.info('Queue operation will retry', {
        queueId: id,
        appointmentId: appointment_id,
        retryCount: newRetryCount,
        nextBackoff: calculateBackoffDelay(newRetryCount),
      });
    }
  }
};

/**
 * Get queue statistics
 * 
 * @returns Array of status counts
 */
const getQueueStats = async (): Promise<Array<{ status: string; count: number }>> => {
  const result = await pool.query(
    `SELECT status, COUNT(*) as count
     FROM calendar_sync_queue
     GROUP BY status`
  );
  
  return result.rows.map(row => ({
    status: row.status,
    count: parseInt(row.count, 10),
  }));
};

/**
 * Process the calendar sync queue
 * Main job execution function
 */
export const processCalendarSyncQueue = async (): Promise<void> => {
  if (isJobRunning) {
    logger.warn('[CalendarSyncQueue] Job already running, skipping execution');
    return;
  }
  
  isJobRunning = true;
  
  try {
    logger.info('[CalendarSyncQueue] Starting queue processing');
    
    // Log queue statistics
    const stats = await getQueueStats();
    logger.info('[CalendarSyncQueue] Queue statistics', { stats });
    
    // Fetch pending operations (FIFO order)
    const result = await pool.query(
      `SELECT 
        csq.id,
        csq.appointment_id,
        csq.operation,
        csq.payload,
        csq.status,
        csq.retry_count,
        csq.error_message,
        a.patient_id as user_id,
        ct.provider
       FROM calendar_sync_queue csq
       JOIN appointments a ON csq.appointment_id = a.id
       JOIN calendar_tokens ct ON a.patient_id = ct.user_id
       WHERE csq.status = 'pending'
       ORDER BY csq.created_at ASC
       LIMIT 50`  // Process in batches of 50
    );
    
    const operations: QueueOperation[] = result.rows;
    
    if (operations.length === 0) {
      logger.info('[CalendarSyncQueue] No pending operations');
      return;
    }
    
    logger.info('[CalendarSyncQueue] Found pending operations', {
      count: operations.length,
    });
    
    // Process operations sequentially to respect rate limits
    for (const operation of operations) {
      await processQueueOperation(operation);
    }
    
    // Cleanup old completed operations (older than 7 days)
    const deleteResult = await pool.query(
      `DELETE FROM calendar_sync_queue
       WHERE status = 'completed'
       AND completed_at < NOW() - INTERVAL '7 days'
       RETURNING id`
    );
    
    if (deleteResult.rowCount && deleteResult.rowCount > 0) {
      logger.info('[CalendarSyncQueue] Cleaned up old completed operations', {
        count: deleteResult.rowCount,
      });
    }
    
    logger.info('[CalendarSyncQueue] Queue processing complete');
  } catch (error: any) {
    logger.error('[CalendarSyncQueue] Error processing queue', {
      error: error.message,
      stack: error.stack,
    });
  } finally {
    isJobRunning = false;
  }
};

/**
 * Start the calendar sync queue cron job
 * Schedule: Every 5 minutes
 * 
 * @returns Scheduled task instance
 */
export const startCalendarSyncQueueJob = (): ScheduledTask => {
  if (cronTask) {
    logger.warn('[CalendarSyncQueue] Job already started');
    return cronTask;
  }
  
  // Schedule: */5 * * * * = Every 5 minutes
  cronTask = cron.schedule('*/5 * * * *', async () => {
    logger.debug('[CalendarSyncQueue] Cron job triggered');
    try {
      await processCalendarSyncQueue();
    } catch (error: any) {
      logger.error('[CalendarSyncQueue] Cron job execution failed', {
        error: error.message,
      });
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York',
  });
  
  logger.info('[CalendarSyncQueue] Job started', {
    schedule: 'Every 5 minutes',
    timezone: 'America/New_York',
  });
  
  return cronTask;
};

/**
 * Stop the calendar sync queue cron job
 */
export const stopCalendarSyncQueueJob = (): void => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[CalendarSyncQueue] Job stopped');
  }
};

/**
 * Manually trigger queue processing
 * Useful for testing or manual interventions
 * 
 * @returns Promise that resolves when processing is complete
 */
export const triggerQueueProcess = async (): Promise<void> => {
  logger.info('[CalendarSyncQueue] Manual trigger requested');
  await processCalendarSyncQueue();
};
