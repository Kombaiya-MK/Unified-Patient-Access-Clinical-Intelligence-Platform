import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Configuration interface for environment variables
 */
interface Config {
  // Server
  port: number;
  nodeEnv: string;

  // Database
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    url: string;
    ssl: boolean;
    maxConnections: number;
  };

  // Redis (Upstash)
  redis: {
    url: string;
    token?: string;
    tls: boolean;
    maxRetries: number;
  };

  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };

  // Frontend
  frontendUrl: string;

  // OpenAI (optional - for AI features)
  openai?: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };

  // Email (optional - for notifications)
  email?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpFrom: string;
  };

  // Twilio (optional - for SMS)
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // Logging
  logging: {
    level: string;
    filePath: string;
  };

  // PDF Storage
  pdfStorage: {
    basePath: string;
    downloadUrlExpiryDays: number;
    pdfRetentionDays: number;
    baseUrl: string;
  };
}

/**
 * Validates that required environment variables are present
 * @param varName - Name of the environment variable
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws Error if required variable is missing
 */
function getEnvVar(varName: string, defaultValue?: string): string {
  const value = process.env[varName] || defaultValue;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${varName}. Please check your .env file.`,
    );
  }
  return value;
}

/**
 * Validates and exports application configuration
 */
export const config: Config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: getEnvVar('DB_NAME', 'upaci'),
    user: getEnvVar('DB_USER', 'postgres'),
    password: process.env.DB_PASSWORD || '',
    url: getEnvVar('DB_URL'),
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '50', 10),
  },

  // Redis configuration (Upstash with TLS)
  redis: {
    url: getEnvVar('REDIS_URL'),
    token: process.env.REDIS_TOKEN,
    tls: process.env.REDIS_TLS === 'true',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
  },

  // JWT configuration
  jwt: {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Frontend URL for CORS
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),

  // OpenAI configuration (optional)
  openai: process.env.OPENAI_API_KEY
    ? {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
      }
    : undefined,

  // Email configuration (optional)
  email: process.env.SMTP_HOST
    ? {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        smtpFrom: process.env.SMTP_FROM || 'noreply@clinic.com',
      }
    : undefined,

  // Twilio configuration (optional)
  twilio: process.env.TWILIO_ACCOUNT_SID
    ? {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      }
    : undefined,

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },

  // PDF Storage configuration
  pdfStorage: {
    basePath: path.join(__dirname, '../../storage/pdfs'),
    downloadUrlExpiryDays: parseInt(process.env.PDF_DOWNLOAD_URL_EXPIRY_DAYS || '7', 10),
    pdfRetentionDays: parseInt(process.env.PDF_RETENTION_DAYS || '30', 10),
    baseUrl: process.env.API_BASE_URL || `http://localhost:${parseInt(process.env.PORT || '3001', 10)}`,
  },
};

// Validate JWT secret length
if (config.jwt.secret.length < 32) {
  throw new Error(
    'JWT_SECRET must be at least 32 characters long for security.',
  );
}

console.log('✓ Environment variables validated successfully');

export default config;
