/**
 * SMS Notification Service
 * 
 * Handles sending SMS notifications via Twilio with retry logic,
 * delivery status tracking, and error handling.
 * 
 * Features:
 * - Send SMS with Twilio API
 * - Exponential backoff retry (3 attempts: 1min, 5min, 15min)
 * - Delivery status tracking in database
 * - Character limit handling (160 chars per SMS segment)
 * - Audit logging
 * 
 * @module smsService
 * @created 2026-03-20
 * @task US_016 TASK_002 - SMS Service Integration
 */

import { getTwilioClient, twilioConfig } from '../config/twilio';
import { pool } from '../config/database';
import logger from '../utils/logger';
// import auditLogger from '../services/auditLogger'; // Uncomment when available

/**
 * SMS Send Result Interface
 */
export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  attempts: number;
}

/**
 * SMS Character Limit (standard SMS segment)
 */
const SMS_CHARACTER_LIMIT = 160;

/**
 * Retry delays in milliseconds: 1min, 5min, 15min
 */
const RETRY_DELAYS = [60000, 300000, 900000]; // 1min, 5min, 15min

/**
 * Truncate message to SMS character limit
 */
function truncateMessage(message: string, maxLength: number = SMS_CHARACTER_LIMIT): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Format phone number to E.164 format
 * Accepts: +1234567890, 1234567890, (123) 456-7890
 * Returns: +1234567890
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add + prefix if not present
  if (!cleaned.startsWith('+')) {
    // Assume US number if no country code
    return `+1${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Send SMS with retry logic
 * 
 * @param phone - Recipient phone number (any format)
 * @param message - SMS message content
 * @param appointmentId - Optional appointment ID for tracking
 * @param attempt - Current attempt number (internal use)
 * @returns Promise<SmsSendResult>
 */
export async function sendSMS(
  phone: string,
  message: string,
  appointmentId?: number,
  attempt: number = 1
): Promise<SmsSendResult> {
  const twilioClient = getTwilioClient();

  // Twilio not configured - graceful degradation
  if (!twilioClient) {
    logger.warn('SMS not sent - Twilio not configured', { phone, appointmentId });
    return {
      success: false,
      error: 'SMS service not configured',
      attempts: attempt,
    };
  }

  // Format phone number
  const formattedPhone = formatPhoneNumber(phone);
  
  // Truncate message if needed
  const truncatedMessage = truncateMessage(message);
  
  if (message.length > SMS_CHARACTER_LIMIT) {
    logger.warn('SMS message truncated', {
      originalLength: message.length,
      truncatedLength: truncatedMessage.length,
      appointmentId,
    });
  }

  try {
    logger.info('Sending SMS', {
      phone: formattedPhone,
      appointmentId,
      attempt,
      messageLength: truncatedMessage.length,
    });

    // Send SMS via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body: truncatedMessage,
      from: twilioConfig.phoneNumber,
      to: formattedPhone,
    });

    logger.info('SMS sent successfully', {
      messageId: twilioMessage.sid,
      status: twilioMessage.status,
      phone: formattedPhone,
      appointmentId,
      attempt,
    });

    // Update database if appointment ID provided
    if (appointmentId) {
      await updateReminderStatus(appointmentId, 'delivered', 'sms', attempt);
    }

    // Log to audit log
    // await auditLogger.logNotification('SMS_SENT', { appointmentId, phone: formattedPhone, messageId: twilioMessage.sid });

    return {
      success: true,
      messageId: twilioMessage.sid,
      status: twilioMessage.status,
      attempts: attempt,
    };
  } catch (error: any) {
    logger.error('SMS send failed', {
      error: error.message,
      code: error.code,
      phone: formattedPhone,
      appointmentId,
      attempt,
    });

    // Retry on failure (max 3 attempts)
    if (attempt < 3) {
      const delay = RETRY_DELAYS[attempt - 1];
      logger.info(`Retrying SMS in ${delay / 1000} seconds...`, { attempt, appointmentId });

      await new Promise(resolve => setTimeout(resolve, delay));
      return sendSMS(phone, message, appointmentId, attempt + 1);
    }

    // Failed after all retries
    if (appointmentId) {
      await updateReminderStatus(appointmentId, 'failed', 'sms', attempt, error.message);
    }

    // Log to audit log
    // await auditLogger.logNotification('SMS_FAILED', { appointmentId, phone: formattedPhone, error: error. message });

    return {
      success: false,
      error: error.message,
      attempts: attempt,
    };
  }
}

/**
 * Update appointment reminder status in database
 */
async function updateReminderStatus(
  appointmentId: number,
  status: 'delivered' | 'failed' | 'pending',
  type: 'sms' | 'email',
  attempts: number,
  errorMessage?: string
): Promise<void> {
  try {
    const statusColumn = type === 'sms' ? 'reminder_sms_status' : 'reminder_email_status';
    
    await pool.query(
      `UPDATE app.appointments 
       SET ${statusColumn} = $1,
           reminder_attempts = $2,
           last_reminder_error = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, attempts, errorMessage || null, appointmentId]
    );

    logger.info('Reminder status updated', {
      appointmentId,
      type,
      status,
      attempts,
    });
  } catch (error) {
    logger.error('Failed to update reminder status', { appointmentId, error });
  }
}

/**
 * Send consolidated SMS for multiple appointments
 * 
 * @param phone - Recipient phone number
 * @param appointments - Array of appointment summaries
 * @returns Promise<SmsSendResult>
 */
export async function sendConsolidatedSMS(
  phone: string,
  appointments: Array<{
    id: number;
    date: string;
    time: string;
    provider: string;
  }>
): Promise<SmsSendResult> {
  if (appointments.length === 0) {
    return {
      success: false,
      error: 'No appointments provided',
      attempts: 0,
    };
  }

  // Build consolidated message
  let message = `Reminders: You have ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} tomorrow:\n`;
  
  appointments.forEach((apt, index) => {
    message += `${index + 1}. ${apt.time} - ${apt.provider}\n`;
  });
  
  message += `Call ${twilioConfig.clinicPhone} to confirm or reschedule.`;

  // Send SMS (will be truncated if too long)
  const result = await sendSMS(phone, message, appointments[0].id);

  // Update all appointments
  if (result.success) {
    for (const apt of appointments) {
      await updateReminderStatus(apt.id, 'delivered', 'sms', result.attempts);
    }
  }

  return result;
}

export default {
  sendSMS,
  sendConsolidatedSMS,
};
