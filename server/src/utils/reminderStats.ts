/**
 * Reminder Job Statistics Utility
 * 
 * Tracks and logs statistics for the appointment reminder cron job.
 * 
 * @module reminderStats
 * @created 2026-03-20
 * @task US_016 TASK_004 - Reminder Cron Job
 */

import logger from '../utils/logger';

/**
 * Reminder Job Statistics Interface
 */
export interface ReminderJobStats {
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  appointmentsProcessed: number;
  patientsNotified: number;
  smsSuccessCount: number;
  smsFailureCount: number;
  emailSuccessCount: number;
  emailFailureCount: number;
  errors: Array<{
    appointmentId: number;
    type: 'sms' | 'email';
    error: string;
  }>;
}

/**
 * Create new stats object
 */
export function createStats(): ReminderJobStats {
  return {
    startTime: new Date(),
    appointmentsProcessed: 0,
    patientsNotified: 0,
    smsSuccessCount: 0,
    smsFailureCount: 0,
    emailSuccessCount: 0,
    emailFailureCount: 0,
    errors: [],
  };
}

/**
 * Finalize stats (calculate duration)
 */
export function finalizeStats(stats: ReminderJobStats): ReminderJobStats {
  stats.endTime = new Date();
  stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
  return stats;
}

/**
 * Log job statistics
 */
export function logStats(stats: ReminderJobStats): void {
  const duration = stats.duration ? (stats.duration / 1000).toFixed(2) : 'N/A';

  logger.info('Reminder job completed', {
    startTime: stats.startTime.toISOString(),
    endTime: stats.endTime?.toISOString(),
    duration: `${duration}s`,
    appointmentsProcessed: stats.appointmentsProcessed,
    patientsNotified: stats.patientsNotified,
    smsSuccess: stats.smsSuccessCount,
    smsFailed: stats.smsFailureCount,
    emailSuccess: stats.emailSuccessCount,
    emailFailed: stats.emailFailureCount,
    totalErrors: stats.errors.length,
  });

  // Log individual errors if any
  if (stats.errors.length > 0) {
    logger.warn('Reminder job encountered errors', {
      errorCount: stats.errors.length,
      errors: stats.errors,
    });
  }

  // Log summary metrics
  const smsSuccessRate = stats.smsSuccessCount + stats.smsFailureCount > 0
    ? ((stats.smsSuccessCount / (stats.smsSuccessCount + stats.smsFailureCount)) * 100).toFixed(1)
    : 'N/A';

  const emailSuccessRate = stats.emailSuccessCount + stats.emailFailureCount > 0
    ? ((stats.emailSuccessCount / (stats.emailSuccessCount + stats.emailFailureCount)) * 100).toFixed(1)
    : 'N/A';

  logger.info('Reminder job success rates', {
    smsSuccessRate: `${smsSuccessRate}%`,
    emailSuccessRate: `${emailSuccessRate}%`,
  });
}

/**
 * Record SMS result
 */
export function recordSmsResult(
  stats: ReminderJobStats,
  success: boolean,
  appointmentId?: number,
  error?: string
): void {
  if (success) {
    stats.smsSuccessCount++;
  } else {
    stats.smsFailureCount++;
    if (appointmentId && error) {
      stats.errors.push({
        appointmentId,
        type: 'sms',
        error,
      });
    }
  }
}

/**
 * Record email result
 */
export function recordEmailResult(
  stats: ReminderJobStats,
  success: boolean,
  appointmentId?: number,
  error?: string
): void {
  if (success) {
    stats.emailSuccessCount++;
  } else {
    stats.emailFailureCount++;
    if (appointmentId && error) {
      stats.errors.push({
        appointmentId,
        type: 'email',
        error,
      });
    }
  }
}

export default {
  createStats,
  finalizeStats,
  logStats,
  recordSmsResult,
  recordEmailResult,
};
