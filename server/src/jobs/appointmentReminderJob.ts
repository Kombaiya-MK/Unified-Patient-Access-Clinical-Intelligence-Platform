/**
 * Appointment Reminder Cron Job
 * 
 * Scheduled task that runs every hour to send appointment reminders
 * 24 hours before appointments.
 * 
 * Schedule: 0 * * * * (every hour at minute 0)
 * 
 * Process:
 * 1. Query appointments 23-25 hours ahead without reminders sent
 * 2. Group appointments by patient (consolidated messages)
 * 3. Check notification preferences (opt-out)
 * 4. Send SMS via Twilio (if enabled)
 * 5. Send email with .ics calendar attachment (if enabled)
 * 6. Update reminders_sent_at timestamp
 * 7. Log job statistics
 * 
 * @module appointmentReminderJob
 * @created 2026-03-20
 * @task US_016 TASK_004 - Reminder Cron Job
 */

import cron, { ScheduledTask } from 'node-cron';
import logger from '../utils/logger';
import {
  createStats,
  finalizeStats,
  logStats,
  ReminderJobStats,
} from '../utils/reminderStats';
import {
  fetchAppointmentsNeedingReminders,
  groupAppointmentsByPatient,
  processAppointmentsInBatches,
} from '../services/reminderService';

/**
 * Cron job instance
 */
let cronTask: ScheduledTask | null = null;

/**
 * Job running flag to prevent overlapping executions
 */
let isJobRunning = false;

/**
 * Run the reminder job (can be called manually or by cron)
 */
export async function runReminderJob(): Promise<ReminderJobStats> {
  // Prevent overlapping job executions
  if (isJobRunning) {
    logger.warn('Reminder job already running, skipping this execution');
    return createStats();
  }

  isJobRunning = true;
  const stats = createStats();

  try {
    logger.info('Reminder job started', {
      startTime: stats.startTime.toISOString(),
    });

    // Step 1: Fetch appointments needing reminders
    const appointments = await fetchAppointmentsNeedingReminders();

    if (appointments.length === 0) {
      logger.info('No appointments need reminders at this time');
      return finalizeStats(stats);
    }

    logger.info('Found appointments needing reminders', {
      count: appointments.length,
    });

    // Step 2: Group appointments by patient
    const patientGroups = groupAppointmentsByPatient(appointments);

    logger.info('Grouped appointments by patient', {
      patientCount: patientGroups.length,
      appointmentCount: appointments.length,
    });

    // Step 3: Process appointments in batches
    await processAppointmentsInBatches(patientGroups, stats, 50);

    // Finalize and log stats
    finalizeStats(stats);
    logStats(stats);

    return stats;
  } catch (error: any) {
    logger.error('Reminder job failed', {
      error: error.message,
      stack: error.stack,
    });

    finalizeStats(stats);
    logStats(stats);

    throw error;
  } finally {
    isJobRunning = false;
  }
}

/**
 * Start the reminder cron job
 * Schedule: Every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
 */
export function startReminderJob(): ScheduledTask {
  if (cronTask) {
    logger.warn('Reminder job already started');
    return cronTask;
  }

  // Schedule: 0 * * * * = At minute 0 of every hour
  cronTask = cron.schedule('0 * * * *', async () => {
    logger.info('Reminder cron job triggered');
    try {
      await runReminderJob();
    } catch (error) {
      logger.error('Reminder cron job execution failed', { error });
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York',
  });

  logger.info('Appointment reminder job started', {
    schedule: 'Every hour at minute 0',
    timezone: 'America/New_York',
    nextRun: getNextRunTime(),
  });

  return cronTask;
}

/**
 * Stop the reminder cron job
 */
export function stopReminderJob(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('Appointment reminder job stopped');
  }
}

/**
 * Get next scheduled run time
 */
function getNextRunTime(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next.toISOString();
}

/**
 * Check if job is running
 */
export function isReminderJobRunning(): boolean {
  return isJobRunning;
}

/**
 * Get cron job status
 */
export function getReminderJobStatus(): {
  isScheduled: boolean;
  isRunning: boolean;
  nextRun: string | null;
} {
  return {
    isScheduled: cronTask !== null,
    isRunning: isJobRunning,
    nextRun: cronTask ? getNextRunTime() : null,
  };
}

export default {
  runReminderJob,
  startReminderJob,
  stopReminderJob,
  isReminderJobRunning,
  getReminderJobStatus,
};
