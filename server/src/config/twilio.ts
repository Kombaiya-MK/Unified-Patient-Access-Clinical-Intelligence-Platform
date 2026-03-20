/**
 * Twilio Configuration
 * 
 * Twilio client initialization and configuration for SMS notifications.
 * Used for sending appointment reminders and other patient notifications.
 * 
 * @module twilioConfig
 * @created 2026-03-20
 * @task US_016 TASK_002 - SMS Service Integration
 */

import twilio from 'twilio';
import logger from '../utils/logger';

/**
 * Twilio Configuration Interface
 */
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  clinicPhone: string;
  clinicName: string;
}

/**
 * Load Twilio configuration from environment variables
 */
export const twilioConfig: TwilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  clinicPhone: process.env.CLINIC_PHONE_NUMBER || '+1-800-CLINIC',
  clinicName: process.env.CLINIC_NAME || 'Clinic',
};

/**
 * Validate Twilio configuration
 */
function validateTwilioConfig(): void {
  const missingVars: string[] = [];

  if (!twilioConfig.accountSid) missingVars.push('TWILIO_ACCOUNT_SID');
  if (!twilioConfig.authToken) missingVars.push('TWILIO_AUTH_TOKEN');
  if (!twilioConfig.phoneNumber) missingVars.push('TWILIO_PHONE_NUMBER');

  if (missingVars.length > 0) {
    logger.warn(`Twilio configuration incomplete. Missing: ${missingVars.join(', ')}`);
    logger.warn('SMS notifications will be disabled');
  }
}

/**
 * Create and export Twilio client
 * Returns null if configuration is incomplete (allows graceful degradation)
 */
export const createTwilioClient = (): twilio.Twilio | null => {
  validateTwilioConfig();

  if (!twilioConfig.accountSid || !twilioConfig.authToken) {
    logger.warn('Twilio client not initialized - configuration incomplete');
    return null;
  }

  try {
    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    logger.info('Twilio client initialized successfully');
    return client;
  } catch (error) {
    logger.error('Failed to initialize Twilio client:', error);
    return null;
  }
};

/**
 * Twilio client singleton
 * Initialized lazily on first use
 */
let twilioClientInstance: twilio.Twilio | null | undefined;

/**
 * Get Twilio client instance (singleton pattern)
 */
export const getTwilioClient = (): twilio.Twilio | null => {
  if (twilioClientInstance === undefined) {
    twilioClientInstance = createTwilioClient();
  }
  return twilioClientInstance;
};

export default {
  config: twilioConfig,
  getClient: getTwilioClient,
  createClient: createTwilioClient,
};
