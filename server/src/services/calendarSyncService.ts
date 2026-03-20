/**
 * Calendar Sync Service
 * 
 * Unified service for synchronizing appointments to Google Calendar or Microsoft Outlook.
 * Provides retry logic, error handling, and audit logging for calendar sync operations.
 * 
 * Features:
 * - Sync appointments to Google Calendar or Microsoft Outlook
 * - Automatic retry on transient failures
 * - Store calendar event IDs in appointments table
 * - Comprehensive audit logging
 * - Error handling with user-friendly messages
 * 
 * @module calendarSyncService
 * @created 2026-03-19
 * @task US_013 TASK_005
 */

import { pool } from '../config/database';
import { calendarConfig } from '../config/calendar.config';
import { 
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  GoogleCalendarEventData 
} from './googleCalendarService';
import { 
  createOutlookCalendarEvent,
  updateOutlookCalendarEvent,
  deleteOutlookCalendarEvent,
  OutlookCalendarEventData 
} from './outlookCalendarService';
import logger from '../utils/logger';

/**
 * Calendar sync result
 */
export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
  provider?: 'google' | 'outlook';
  retries?: number;
  queued?: boolean;  // Indicates if operation was queued due to rate limiting
}

/**
 * Appointment data for calendar sync
 */
interface AppointmentForSync {
  appointment_id: string;
  patient_id: number;
  provider_id: number;
  department_id: number;
  appointment_date: Date;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  provider_name: string;
  department_name: string;
  location: string;
  patient_name: string;
}

/**
 * Check if error is retryable (transient failure)
 * 
 * @param error - Error object
 * @returns true if error is retryable
 */
const isRetryableError = (error: any): boolean => {
  // Network errors (connection issues)
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
    return true;
  }
  
  // Server errors (5xx)
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }
  
  // Rate limit errors
  if (error.statusCode === 429) {
    return true;
  }
  
  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return true;
  }
  
  return false;
};

/**
 * Delay execution for specified milliseconds
 * 
 * @param ms - Milliseconds to delay
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Fetch appointment data for calendar sync
 * Includes JOIN to get provider, department, and patient names
 * 
 * @param appointmentId - Appointment ID
 * @returns Appointment data or null if not found
 */
const fetchAppointmentForSync = async (
  appointmentId: string
): Promise<AppointmentForSync | null> => {
  const query = `
    SELECT 
      a.appointment_id,
      a.patient_id,
      a.provider_id,
      a.department_id,
      a.appointment_date,
      a.start_time,
      a.end_time,
      a.status,
      a.notes,
      u.full_name AS provider_name,
      d.department_name,
      d.location,
      p.full_name AS patient_name
    FROM appointments a
    INNER JOIN users u ON a.provider_id = u.user_id
    INNER JOIN departments d ON a.department_id = d.department_id
    INNER JOIN users p ON a.patient_id = p.user_id
    WHERE a.appointment_id = $1
  `;
  
  const result = await pool.query(query, [appointmentId]);
  
  if (result.rows.length === 0) {
    logger.warn('Appointment not found for calendar sync', { appointmentId });
    return null;
  }
  
  return result.rows[0] as AppointmentForSync;
};

/**
 * Store calendar event ID in appointments table
 * 
 * @param appointmentId - Appointment ID
 * @param eventId - Calendar event ID
 * @param provider - Calendar provider ('google' or 'outlook')
 */
const storeCalendarEventId = async (
  appointmentId: string,
  eventId: string,
  provider: 'google' | 'outlook'
): Promise<void> => {
  const query = `
    UPDATE appointments
    SET 
      calendar_event_id = $1,
      calendar_provider = $2,
      calendar_synced_at = NOW()
    WHERE appointment_id = $3
  `;
  
  await pool.query(query, [eventId, provider, appointmentId]);
  
  logger.debug('Stored calendar event ID in appointments table', {
    appointmentId,
    eventId,
    provider,
  });
};

/**
 * Log calendar sync to audit_logs table
 * 
 * @param userId - User ID
 * @param action - Audit action (CALENDAR_SYNC_SUCCESS or CALENDAR_SYNC_FAILED)
 * @param details - Additional details
 */
const logCalendarSyncAudit = async (
  userId: number,
  action: 'CALENDAR_SYNC_SUCCESS' | 'CALENDAR_SYNC_FAILED',
  details: Record<string, any>
): Promise<void> => {
  try {
    const query = `
      INSERT INTO audit_logs (user_id, action, details)
      VALUES ($1, $2, $3)
    `;
    
    await pool.query(query, [userId, action, JSON.stringify(details)]);
  } catch (error) {
    // Don't let audit logging failure break the sync operation
    logger.error('Failed to log calendar sync audit:', error);
  }
};

/**
 * Sync appointment to Google Calendar
 * 
 * @param appointment - Appointment data
 * @param userId - User ID (patient or provider)
 * @returns Calendar event ID
 */
const syncToGoogleCalendar = async (
  appointment: AppointmentForSync,
  userId: number
): Promise<string> => {
  // Build start and end datetime in ISO 8601 format
  const appointmentDate = new Date(appointment.appointment_date);
  const startDateTime = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
    parseInt(appointment.start_time.split(':')[0]),
    parseInt(appointment.start_time.split(':')[1])
  );
  const endDateTime = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
    parseInt(appointment.end_time.split(':')[0]),
    parseInt(appointment.end_time.split(':')[1])
  );
  
  const eventData: GoogleCalendarEventData = {
    appointmentId: appointment.appointment_id,
    providerName: appointment.provider_name,
    departmentName: appointment.department_name,
    location: appointment.location,
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    patientName: appointment.patient_name,
    notes: appointment.notes || undefined,
  };
  
  return await createGoogleCalendarEvent(userId, eventData);
};

/**
 * Sync appointment to Outlook Calendar
 * 
 * @param appointment - Appointment data
 * @param userId - User ID (patient or provider)
 * @returns Calendar event ID
 */
const syncToOutlookCalendar = async (
  appointment: AppointmentForSync,
  userId: number
): Promise<string> => {
  // Build start and end datetime in ISO 8601 format
  const appointmentDate = new Date(appointment.appointment_date);
  const startDateTime = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
    parseInt(appointment.start_time.split(':')[0]),
    parseInt(appointment.start_time.split(':')[1])
  );
  const endDateTime = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
    parseInt(appointment.end_time.split(':')[0]),
    parseInt(appointment.end_time.split(':')[1])
  );
  
  const eventData: OutlookCalendarEventData = {
    appointmentId: appointment.appointment_id,
    providerName: appointment.provider_name,
    departmentName: appointment.department_name,
    location: appointment.location,
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    patientName: appointment.patient_name,
    notes: appointment.notes || undefined,
  };
  
  return await createOutlookCalendarEvent(userId, eventData);
};

/**
 * Sync appointment to calendar with retry logic
 * 
 * Main entry point for calendar sync operations.
 * Supports both Google Calendar and Microsoft Outlook.
 * Implements retry logic for transient failures.
 * 
 * @param appointmentId - Appointment ID
 * @param userId - User ID (patient or provider)
 * @param provider - Calendar provider ('google' or 'outlook')
 * @param retryCount - Current retry count (internal use)
 * @returns Calendar sync result
 */
export const syncAppointmentToCalendar = async (
  appointmentId: string,
  userId: number,
  provider: 'google' | 'outlook',
  retryCount: number = 0
): Promise<CalendarSyncResult> => {
  // Check if calendar sync is enabled
  if (!calendarConfig.enabled) {
    logger.debug('Calendar sync is disabled', { appointmentId, userId, provider });
    return {
      success: false,
      error: 'Calendar sync is not enabled',
    };
  }
  
  logger.info('Starting calendar sync', {
    appointmentId,
    userId,
    provider,
    retryCount,
  });
  
  try {
    // Fetch appointment data
    const appointment = await fetchAppointmentForSync(appointmentId);
    
    if (!appointment) {
      logger.error('Appointment not found', { appointmentId });
      return {
        success: false,
        error: 'Appointment not found',
      };
    }
    
    // Validate appointment status (only sync confirmed appointments)
    if (appointment.status !== 'confirmed') {
      logger.warn('Cannot sync appointment with status other than confirmed', {
        appointmentId,
        status: appointment.status,
      });
      return {
        success: false,
        error: `Cannot sync appointment with status: ${appointment.status}`,
      };
    }
    
    // Call appropriate calendar service
    let eventId: string;
    
    if (provider === 'google') {
      eventId = await syncToGoogleCalendar(appointment, userId);
    } else if (provider === 'outlook') {
      eventId = await syncToOutlookCalendar(appointment, userId);
    } else {
      throw new Error(`Unsupported calendar provider: ${provider}`);
    }
    
    // Store calendar event ID in appointments table
    await storeCalendarEventId(appointmentId, eventId, provider);
    
    // Log success to audit_logs
    await logCalendarSyncAudit(userId, 'CALENDAR_SYNC_SUCCESS', {
      appointmentId,
      provider,
      eventId,
      retries: retryCount,
    });
    
    logger.info('Calendar sync successful', {
      appointmentId,
      userId,
      provider,
      eventId,
      retries: retryCount,
    });
    
    return {
      success: true,
      eventId,
      provider,
      retries: retryCount,
    };
  } catch (error: any) {
    logger.error('Calendar sync failed', {
      appointmentId,
      userId,
      provider,
      retryCount,
      error: error.message,
    });
    
    // Check if error is retryable and retry limit not reached
    const maxRetries = calendarConfig.retries || 2;
    
    if (isRetryableError(error) && retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      const delayMs = 2000 * nextRetryCount; // 2s, 4s
      
      logger.info('Retrying calendar sync after delay', {
        appointmentId,
        userId,
        provider,
        nextRetryCount,
        delayMs,
      });
      
      await delay(delayMs);
      
      // Recursive retry
      return await syncAppointmentToCalendar(
        appointmentId,
        userId,
        provider,
        nextRetryCount
      );
    }
    
    // All retries exhausted or non-retryable error
    
    // If rate limit error (429), queue the operation for later processing
    if (error.response?.status === 429 || error.statusCode === 429) {
      logger.info('Rate limit error, queueing operation', {
        appointmentId,
        userId,
        provider,
        operation: 'create',
      });
      
      try {
        await pool.query(
          `INSERT INTO calendar_sync_queue (appointment_id, operation, payload, status)
           VALUES ($1, $2, $3, $4)`,
          [appointmentId, 'create', JSON.stringify({ appointmentId, userId, provider }), 'pending']
        );
        
        logger.info('Operation queued successfully', {
          appointmentId,
          operation: 'create',
        });
        
        return {
          success: false,
          error: 'Rate limit exceeded, operation queued for retry',
          provider,
          retries: retryCount,
          queued: true,
        };
      } catch (queueError: any) {
        logger.error('Failed to queue operation', {
          appointmentId,
          error: queueError.message,
        });
      }
    }
    
    await logCalendarSyncAudit(userId, 'CALENDAR_SYNC_FAILED', {
      appointmentId,
      provider,
      error: error.message,
      retries: retryCount,
      isRetryable: isRetryableError(error),
    });
    
    return {
      success: false,
      error: error.message,
      provider,
      retries: retryCount,
    };
  }
};

/**
 * Sync appointment to calendar (fire-and-forget)
 * Use this when you don't need to wait for the result
 * 
 * @param appointmentId - Appointment ID
 * @param userId - User ID
 * @param provider - Calendar provider
 */
export const syncAppointmentToCalendarAsync = (
  appointmentId: string,
  userId: number,
  provider: 'google' | 'outlook'
): void => {
  syncAppointmentToCalendar(appointmentId, userId, provider)
    .then((result) => {
      if (result.success) {
        logger.info('Async calendar sync completed successfully', {
          appointmentId,
          userId,
          provider,
          eventId: result.eventId,
        });
      } else {
        logger.error('Async calendar sync failed', {
          appointmentId,
          userId,
          provider,
          error: result.error,
        });
      }
    })
    .catch((error) => {
      logger.error('Async calendar sync threw exception', {
        appointmentId,
        userId,
        provider,
        error: error.message,
      });
    });
};

/**
 * Update calendar event (reschedule operation)
 * 
 * Updates an existing calendar event with new appointment details.
 * Implements retry logic for transient failures.
 * 
 * @param appointmentId - Appointment ID
 * @param userId - User ID
 * @param provider - Calendar provider
 * @param retryCount - Current retry count (internal use)
 * @returns Calendar sync result
 */
export const updateCalendarEvent = async (
  appointmentId: string,
  userId: number,
  provider: 'google' | 'outlook',
  retryCount: number = 0
): Promise<CalendarSyncResult> => {
  // Check if calendar sync is enabled
  if (!calendarConfig.enabled) {
    logger.debug('Calendar sync is disabled', { appointmentId, userId, provider });
    return {
      success: false,
      error: 'Calendar sync is not enabled',
    };
  }
  
  logger.info('Updating calendar event', {
    appointmentId,
    userId,
    provider,
    retryCount,
  });
  
  try {
    // Fetch appointment data
    const appointment = await fetchAppointmentForSync(appointmentId);
    
    if (!appointment) {
      logger.error('Appointment not found', { appointmentId });
      return {
        success: false,
        error: 'Appointment not found',
      };
    }
    
    // Get existing calendar event ID
    const eventQuery = `
      SELECT calendar_event_id
      FROM appointments
      WHERE appointment_id = $1
    `;
    const eventResult = await pool.query(eventQuery, [appointmentId]);
    
    if (eventResult.rows.length === 0 || !eventResult.rows[0].calendar_event_id) {
      logger.warn('No calendar event ID found for update', { appointmentId });
      return {
        success: false,
        error: 'No calendar event ID found. Event may not have been synced.',
      };
    }
    
    const eventId = eventResult.rows[0].calendar_event_id;
    
    // Build start and end datetime in ISO 8601 format
    const appointmentDate = new Date(appointment.appointment_date);
    const startDateTime = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate(),
      parseInt(appointment.start_time.split(':')[0]),
      parseInt(appointment.start_time.split(':')[1])
    );
    const endDateTime = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate(),
      parseInt(appointment.end_time.split(':')[0]),
      parseInt(appointment.end_time.split(':')[1])
    );
    
    const eventData: GoogleCalendarEventData | OutlookCalendarEventData = {
      appointmentId: appointment.appointment_id,
      providerName: appointment.provider_name,
      departmentName: appointment.department_name,
      location: appointment.location,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      patientName: appointment.patient_name,
      notes: appointment.notes || undefined,
    };
    
    // Call appropriate calendar service
    let updatedEventId: string;
    
    if (provider === 'google') {
      updatedEventId = await updateGoogleCalendarEvent(userId, eventId, eventData as GoogleCalendarEventData);
    } else if (provider === 'outlook') {
      updatedEventId = await updateOutlookCalendarEvent(userId, eventId, eventData as OutlookCalendarEventData);
    } else {
      throw new Error(`Unsupported calendar provider: ${provider}`);
    }
    
    // Update calendar_synced_at timestamp
    await pool.query(
      'UPDATE appointments SET calendar_synced_at = NOW() WHERE appointment_id = $1',
      [appointmentId]
    );
    
    // Log success to audit_logs
    await logCalendarSyncAudit(userId, 'CALENDAR_SYNC_SUCCESS', {
      appointmentId,
      provider,
      eventId: updatedEventId,
      retries: retryCount,
      operation: 'update',
    });
    
    logger.info('Calendar event updated successfully', {
      appointmentId,
      userId,
      provider,
      eventId: updatedEventId,
      retries: retryCount,
    });
    
    return {
      success: true,
      eventId: updatedEventId,
      provider,
      retries: retryCount,
    };
  } catch (error: any) {
    logger.error('Calendar event update failed', {
      appointmentId,
      userId,
      provider,
      retryCount,
      error: error.message,
    });
    
    // Check if error is retryable and retry limit not reached
    const maxRetries = calendarConfig.retries || 2;
    
    if (isRetryableError(error) && retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      const delayMs = 2000 * nextRetryCount; // 2s, 4s
      
      logger.info('Retrying calendar event update after delay', {
        appointmentId,
        userId,
        provider,
        nextRetryCount,
        delayMs,
      });
      
      await delay(delayMs);
      
      // Recursive retry
      return await updateCalendarEvent(
        appointmentId,
        userId,
        provider,
        nextRetryCount
      );
    }
    
    // All retries exhausted or non-retryable error
    
    // If rate limit error (429), queue the operation for later processing
    if (error.response?.status === 429 || error.statusCode === 429) {
      logger.info('Rate limit error, queueing operation', {
        appointmentId,
        userId,
        provider,
        operation: 'update',
      });
      
      try {
        await pool.query(
          `INSERT INTO calendar_sync_queue (appointment_id, operation, payload, status)
           VALUES ($1, $2, $3, $4)`,
          [appointmentId, 'update', JSON.stringify({ appointmentId, userId, provider }), 'pending']
        );
        
        logger.info('Operation queued successfully', {
          appointmentId,
          operation: 'update',
        });
        
        return {
          success: false,
          error: 'Rate limit exceeded, operation queued for retry',
          provider,
          retries: retryCount,
          queued: true,
        };
      } catch (queueError: any) {
        logger.error('Failed to queue operation', {
          appointmentId,
          error: queueError.message,
        });
      }
    }
    
    await logCalendarSyncAudit(userId, 'CALENDAR_SYNC_FAILED', {
      appointmentId,
      provider,
      error: error.message,
      retries: retryCount,
      isRetryable: isRetryableError(error),
      operation: 'update',
    });
    
    return {
      success: false,
      error: error.message,
      provider,
      retries: retryCount,
    };
  }
};

/**
 * Delete calendar event (cancellation operation)
 * 
 * Deletes calendar event when appointment is cancelled.
 * Implements retry logic for transient failures.
 * 
 * @param appointmentId - Appointment ID
 * @param userId - User ID
 * @param provider - Calendar provider
 * @param retryCount - Current retry count (internal use)
 * @returns Calendar sync result
 */
export const deleteCalendarEvent = async (
  appointmentId: string,
  userId: number,
  provider: 'google' | 'outlook',
  retryCount: number = 0
): Promise<CalendarSyncResult> => {
  // Check if calendar sync is enabled
  if (!calendarConfig.enabled) {
    logger.debug('Calendar sync is disabled', { appointmentId, userId, provider });
    return {
      success: false,
      error: 'Calendar sync is not enabled',
    };
  }
  
  logger.info('Deleting calendar event', {
    appointmentId,
    userId,
    provider,
    retryCount,
  });
  
  try {
    // Get existing calendar event ID
    const eventQuery = `
      SELECT calendar_event_id
      FROM appointments
      WHERE appointment_id = $1
    `;
    const eventResult = await pool.query(eventQuery, [appointmentId]);
    
    if (eventResult.rows.length === 0 || !eventResult.rows[0].calendar_event_id) {
      logger.warn('No calendar event ID found for deletion', { appointmentId });
      return {
        success: true, // Not an error - event doesn't exist
        provider,
        retries: retryCount,
      };
    }
    
    const eventId = eventResult.rows[0].calendar_event_id;
    
    // Call appropriate calendar service
    if (provider === 'google') {
      await deleteGoogleCalendarEvent(userId, eventId);
    } else if (provider === 'outlook') {
      await deleteOutlookCalendarEvent(userId, eventId);
    } else {
      throw new Error(`Unsupported calendar provider: ${provider}`);
    }
    
    // Clear calendar event ID from appointments table
    await pool.query(
      'UPDATE appointments SET calendar_event_id = NULL, calendar_provider = NULL WHERE appointment_id = $1',
      [appointmentId]
    );
    
    // Log success to audit_logs
    await logCalendarSyncAudit(userId, 'CALENDAR_SYNC_SUCCESS', {
      appointmentId,
      provider,
      eventId,
      retries: retryCount,
      operation: 'delete',
    });
    
    logger.info('Calendar event deleted successfully', {
      appointmentId,
      userId,
      provider,
      eventId,
      retries: retryCount,
    });
    
    return {
      success: true,
      eventId,
      provider,
      retries: retryCount,
    };
  } catch (error: any) {
    logger.error('Calendar event deletion failed', {
      appointmentId,
      userId,
      provider,
      retryCount,
      error: error.message,
    });
    
    // Check if error is retryable and retry limit not reached
    const maxRetries = calendarConfig.retries || 2;
    
    if (isRetryableError(error) && retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      const delayMs = 2000 * nextRetryCount; // 2s, 4s
      
      logger.info('Retrying calendar event deletion after delay', {
        appointmentId,
        userId,
        provider,
        nextRetryCount,
        delayMs,
      });
      
      await delay(delayMs);
      
      // Recursive retry
      return await deleteCalendarEvent(
        appointmentId,
        userId,
        provider,
        nextRetryCount
      );
    }
    
    // All retries exhausted or non-retryable error
    
    // If rate limit error (429), queue the operation for later processing
    if (error.response?.status === 429 || error.statusCode === 429) {
      logger.info('Rate limit error, queueing operation', {
        appointmentId,
        userId,
        provider,
        operation: 'delete',
      });
      
      try {
        await pool.query(
          `INSERT INTO calendar_sync_queue (appointment_id, operation, payload, status)
           VALUES ($1, $2, $3, $4)`,
          [appointmentId, 'delete', JSON.stringify({ appointmentId, userId, provider }), 'pending']
        );
        
        logger.info('Operation queued successfully', {
          appointmentId,
          operation: 'delete',
        });
        
        return {
          success: false,
          error: 'Rate limit exceeded, operation queued for retry',
          provider,
          retries: retryCount,
          queued: true,
        };
      } catch (queueError: any) {
        logger.error('Failed to queue operation', {
          appointmentId,
          error: queueError.message,
        });
      }
    }
    
    await logCalendarSyncAudit(userId, 'CALENDAR_SYNC_FAILED', {
      appointmentId,
      provider,
      error: error.message,
      retries: retryCount,
      isRetryable: isRetryableError(error),
      operation: 'delete',
    });
    
    return {
      success: false,
      error: error.message,
      provider,
      retries: retryCount,
    };
  }
};
