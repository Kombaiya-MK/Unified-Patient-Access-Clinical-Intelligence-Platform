/**
 * Email Configuration
 * 
 * Configuration settings for email service including:
 * - Email provider selection (SMTP, SendGrid, AWS SES)
 * - SMTP credentials and connection settings
 * - SendGrid API key configuration
 * - AWS SES credentials and region
 * - Retry logic settings
 * - HIPAA-compliant defaults (TLS encryption)
 * 
 * @module email.config
 * @created 2026-03-19
 * @task US_013 TASK_004
 */

/**
 * Email provider types
 */
export type EmailProvider = 'smtp' | 'sendgrid' | 'ses';

/**
 * SMTP configuration interface
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

/**
 * SendGrid configuration interface
 */
export interface SendGridConfig {
  apiKey: string;
}

/**
 * AWS SES configuration interface
 */
export interface SESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Email configuration interface
 */
export interface EmailConfig {
  provider: EmailProvider;
  from: string;
  fromName: string;
  smtp: SMTPConfig;
  sendgrid: SendGridConfig;
  ses: SESConfig;
  retries: number;
  retryDelay: number; // Base delay in milliseconds
  portalUrl: string;
}

/**
 * Email configuration with environment variable fallbacks
 * 
 * Environment variables:
 * - EMAIL_PROVIDER: Email provider to use ('smtp' | 'sendgrid' | 'ses')
 * - EMAIL_FROM: From email address
 * - EMAIL_FROM_NAME: From name displayed in email client
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (587 for TLS, 465 for SSL)
 * - SMTP_SECURE: Use SSL ('true' for 465, 'false' for 587)
 * - SMTP_USER: SMTP username (email address)
 * - SMTP_PASS: SMTP password (app-specific password for Gmail)
 * - SENDGRID_API_KEY: SendGrid API key
 * - AWS_REGION: AWS region for SES
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - PORTAL_URL: Patient portal URL for email links
 */
export const emailConfig: EmailConfig = {
  provider: (process.env.EMAIL_PROVIDER || 'smtp') as EmailProvider,
  from: process.env.EMAIL_FROM || 'no-reply@upaci.health',
  fromName: process.env.EMAIL_FROM_NAME || 'UPACI Health Platform',
  
  // SMTP configuration (Gmail, Outlook, custom SMTP server)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates in development
    },
  },
  
  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },
  
  // AWS SES configuration
  ses: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  
  // Retry configuration (exponential backoff)
  retries: 3, // Number of retry attempts
  retryDelay: 5000, // Base delay: 5 seconds (2^0 * 5s, 2^1 * 5s, 2^2 * 5s)
  
  // Patient portal URL (for email links)
  portalUrl: process.env.PORTAL_URL || 'https://upaci.health',
};

/**
 * Validate email configuration
 * Ensures required credentials are provided for the selected provider
 * @throws Error if configuration is invalid
 */
export const validateEmailConfig = (): void => {
  const { provider, smtp, sendgrid, ses } = emailConfig;
  
  if (provider === 'smtp') {
    if (!smtp.auth.user || !smtp.auth.pass) {
      throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    }
  } else if (provider === 'sendgrid') {
    if (!sendgrid.apiKey) {
      throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.');
    }
  } else if (provider === 'ses') {
    if (!ses.accessKeyId || !ses.secretAccessKey) {
      throw new Error('AWS SES credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }
  }
};

/**
 * Get email configuration summary (without credentials)
 * Useful for logging and debugging
 */
export const getEmailConfigSummary = (): Record<string, any> => {
  return {
    provider: emailConfig.provider,
    from: emailConfig.from,
    fromName: emailConfig.fromName,
    host: emailConfig.provider === 'smtp' ? emailConfig.smtp.host : 'N/A',
    port: emailConfig.provider === 'smtp' ? emailConfig.smtp.port : 'N/A',
    secure: emailConfig.provider === 'smtp' ? emailConfig.smtp.secure : 'N/A',
    retries: emailConfig.retries,
    retryDelay: emailConfig.retryDelay,
    portalUrl: emailConfig.portalUrl,
  };
};
