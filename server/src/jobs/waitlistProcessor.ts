/**
 * Waitlist Processor Cron Job
 * 
 * Scheduled job that runs every 5 minutes to:
 * 1. Find newly cancelled appointments (slots that became available)
 * 2. Notify waitlist patients about available slots
 * 3. Release expired reservations (>2 hours old)
 * 4. Expire old waitlist entries (past requested_date)
 * 
 * Cron Schedule: star-slash-5 star star star star (every 5 minutes)
 * 
 * Business Rules:
 * - First-come-first-served waitlist processing (ORDER BY created_at)
 * - 2-hour hold for notified patients
 * - Auto-release to next patient if not booked
 * - Expire waitlist entries after requested_date passes
 * - Audit all operations for compliance
 * 
 * @module waitlistProcessor
 * @created 2026-03-19
 * @task US_015 TASK_001
 */

import cron from 'node-cron';
import { pool } from '../config/database';
import waitlistNotificationService from '../services/waitlistNotificationService';
import logger from '../utils/logger';

/**
 * Cancelled slot data
 */
interface CancelledSlot {
  slotId: number;
  appointmentId: string;
  cancelledAt: Date;
  startTime: Date;
  endTime: Date;
  doctorId: number;
  departmentId: number;
}

/**
 * Find cancelled appointments that created available slots
 * 
 * Looks for appointments that:
 * - Were cancelled recently (within last 10 minutes to avoid duplicates)
 * - Have not been processed yet (no active waitlist_reservations)
 * - Are in the future (slot not yet passed)
 * 
 * @returns Array of cancelled slots
 */
const findCancelledSlots = async (): Promise<CancelledSlot[]> => {
  try {
    const query = `
      SELECT DISTINCT
        ts.id AS slot_id,
        a.id AS appointment_id,
        a.updated_at AS cancelled_at,
        ts.start_time,
        ts.end_time,
        ts.doctor_id,
        ts.department_id
      FROM appointments a
      JOIN time_slots ts ON a.slot_id = ts.id
      WHERE a.status = 'cancelled'
        AND a.updated_at >= NOW() - INTERVAL '10 minutes'
        AND ts.start_time > NOW()
        AND NOT EXISTS (
          SELECT 1 FROM waitlist_reservations wr
          WHERE wr.slot_id = ts.id
            AND wr.status = 'active'
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointments a2
          WHERE a2.slot_id = ts.id
            AND a2.status IN ('scheduled', 'confirmed')
        )
      ORDER BY ts.start_time ASC
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map((row) => ({
      slotId: row.slot_id,
      appointmentId: row.appointment_id,
      cancelledAt: row.cancelled_at,
      startTime: row.start_time,
      endTime: row.end_time,
      doctorId: row.doctor_id,
      departmentId: row.department_id,
    }));
  } catch (error) {
    logger.error('Error finding cancelled slots:', error);
    throw error;
  }
};

/**
 * Process cancelled slots and notify waitlist
 * 
 * For each available slot:
 * 1. Find next eligible waitlist patient
 * 2. Create 2-hour reservation
 * 3. Send notification email
 * 
 * @returns Number of notifications sent
 */
const processCancelledSlots = async (): Promise<number> => {
  try {
    const cancelledSlots = await findCancelledSlots();
    
    if (cancelledSlots.length === 0) {
      logger.debug('No cancelled slots to process');
      return 0;
    }
    
    logger.info(`Found ${cancelledSlots.length} cancelled slots to process`);
    
    const slotIds = cancelledSlots.map((slot) => slot.slotId);
    const notifiedCount = await waitlistNotificationService.processAvailableSlots(slotIds);
    
    logger.info(`Notified ${notifiedCount} waitlist patients about available slots`);
    
    return notifiedCount;
  } catch (error) {
    logger.error('Error processing cancelled slots:', error);
    return 0;
  }
};

/**
 * Main cron job function
 * Runs every 5 minutes to process waitlist
 */
const runWaitlistProcessor = async (): Promise<void> => {
  const startTime = Date.now();
  
  logger.info('Starting waitlist processor job');
  
  try {
    // 1. Process cancelled slots (notify waitlist)
    const notifiedCount = await processCancelledSlots();
    
    // 2. Release expired reservations (>2 hours)
    const releasedCount = await waitlistNotificationService.releaseExpiredReservations();
    
    // 3. Expire old waitlist entries (past requested_date)
    const expiredCount = await waitlistNotificationService.expireOldWaitlistEntries();
    
    const duration = Date.now() - startTime;
    
    logger.info('Waitlist processor job completed', {
      duration: `${duration}ms`,
      notifiedPatients: notifiedCount,
      releasedReservations: releasedCount,
      expiredWaitlistEntries: expiredCount,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Waitlist processor job failed', {
      duration: `${duration}ms`,
      error: (error as Error).message,
    });
  }
};

/**
 * Start the waitlist processor cron job
 * Schedule: Every 5 minutes
 * 
 * @returns cron.ScheduledTask instance
 */
export const startWaitlistProcessor = (): cron.ScheduledTask => {
  // Validate cron expression
  const cronExpression = '*/5 * * * *'; // Every 5 minutes
  
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }
  
  logger.info('Starting waitlist processor cron job', {
    schedule: cronExpression,
    description: 'Every 5 minutes',
  });
  
  // Schedule the job
  const task = cron.schedule(cronExpression, async () => {
    await runWaitlistProcessor();
  }, {
    scheduled: true,
    timezone: 'America/New_York', // Use system timezone or configure as needed
  });
  
  logger.info('Waitlist processor cron job started successfully');
  
  // Run once immediately on startup (optional)
  // runWaitlistProcessor().catch((error) => {
  //   logger.error('Initial waitlist processor run failed:', error);
  // });
  
  return task;
};

/**
 * Stop the waitlist processor cron job
 * Called during graceful shutdown
 * 
 * @param task - The cron task instance to stop
 */
export const stopWaitlistProcessor = (task: cron.ScheduledTask): void => {
  logger.info('Stopping waitlist processor cron job');
  task.stop();
  logger.info('Waitlist processor cron job stopped');
};

/**
 * Manual trigger for testing/debugging
 * Run the waitlist processor immediately
 * 
 * @example
 * // In development/testing
 * await runWaitlistProcessorManually();
 */
export const runWaitlistProcessorManually = async (): Promise<void> => {
  logger.info('Manual trigger: Running waitlist processor');
  await runWaitlistProcessor();
};

export default {
  startWaitlistProcessor,
  stopWaitlistProcessor,
  runWaitlistProcessorManually,
};
