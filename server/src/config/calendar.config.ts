/**
 * Calendar Configuration
 * 
 * Configuration settings for calendar sync integration including:
 * - Google Calendar OAuth2 credentials and scopes
 * - Microsoft Outlook OAuth2 credentials and scopes
 * - Retry logic settings
 * - API timeout configuration
 * 
 * @module calendar.config
 * @created 2026-03-19
 * @task US_013 TASK_005
 */

/**
 * Calendar provider types
 */
export type CalendarProvider = 'google' | 'outlook';

/**
 * Google Calendar configuration interface
 */
export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * Microsoft Outlook configuration interface
 */
export interface MicrosoftOutlookConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  tenantId: string;
}

/**
 * Calendar configuration interface
 */
export interface CalendarConfig {
  google: GoogleCalendarConfig;
  microsoft: MicrosoftOutlookConfig;
  retries: number; // Number of retry attempts on transient failures
  timeout: number; // API request timeout in milliseconds
  enabled: boolean; // Global feature flag
}

/**
 * Calendar configuration with environment variable fallbacks
 * 
 * Environment variables:
 * - CALENDAR_SYNC_ENABLED: Enable/disable calendar sync feature ('true' | 'false')
 * 
 * Google Calendar:
 * - GOOGLE_CLIENT_ID: OAuth2 client ID from Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: OAuth2 client secret
 * - GOOGLE_REDIRECT_URI: OAuth2 callback URL (default: http://localhost:3001/api/calendar/google/callback)
 * 
 * Microsoft Outlook:
 * - MICROSOFT_CLIENT_ID: OAuth2 application (client) ID from Azure AD
 * - MICROSOFT_CLIENT_SECRET: OAuth2 client secret
 * - MICROSOFT_TENANT_ID: Azure AD tenant ID (default: 'common' for multi-tenant)
 * - MICROSOFT_REDIRECT_URI: OAuth2 callback URL (default: http://localhost:3001/api/calendar/outlook/callback)
 * 
 * Setup Instructions:
 * 
 * Google Calendar:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select existing
 * 3. Enable Google Calendar API
 * 4. Create OAuth2 credentials (Web application type)
 * 5. Add authorized redirect URI
 * 6. Copy Client ID and Client Secret to .env
 * 
 * Microsoft Outlook:
 * 1. Go to Azure Portal (https://portal.azure.com/)
 * 2. Navigate to Azure Active Directory > App registrations
 * 3. Create new registration or select existing
 * 4. Add redirect URI (Web platform)
 * 5. Create client secret in "Certificates & secrets"
 * 6. Add API permissions: Calendars.ReadWrite (delegated)
 * 7. Copy Application (client) ID, Tenant ID, and Client Secret to .env
 */
export const calendarConfig: CalendarConfig = {
  // Google Calendar configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3001/api/calendar/google/callback',
    scopes: [
      'https://www.googleapis.com/auth/calendar.events', // Create, read, update, and delete events
    ],
  },

  // Microsoft Outlook configuration
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    redirectUri:
      process.env.MICROSOFT_REDIRECT_URI ||
      'http://localhost:3001/api/calendar/outlook/callback',
    scopes: [
      'Calendars.ReadWrite', // Create, read, update, and delete user calendars
      'offline_access', // Required to get refresh token
    ],
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common', // 'common' for multi-tenant apps
  },

  // Retry configuration (transient errors: network failures, rate limits, 5xx errors)
  retries: 2, // Number of retry attempts (0 = no retries, 1 = retry once, 2 = retry twice)
  
  // API timeout (milliseconds)
  timeout: 10000, // 10 seconds

  // Feature flag - enable/disable calendar sync globally
  enabled: process.env.CALENDAR_SYNC_ENABLED === 'true',
};

/**
 * Validate calendar configuration
 * Ensures required credentials are provided for enabled providers
 * 
 * @throws Error if configuration is invalid
 */
export const validateCalendarConfig = (): void => {
  // If calendar sync is disabled, don't validate
  if (!calendarConfig.enabled) {
    return;
  }

  const errors: string[] = [];

  // Validate Google Calendar configuration (optional - only if user wants to use it)
  if (
    calendarConfig.google.clientId &&
    !calendarConfig.google.clientSecret
  ) {
    errors.push(
      'Google Calendar: GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set'
    );
  }

  // Validate Microsoft Outlook configuration (optional - only if user wants to use it)
  if (
    calendarConfig.microsoft.clientId &&
    !calendarConfig.microsoft.clientSecret
  ) {
    errors.push(
      'Microsoft Outlook: MICROSOFT_CLIENT_SECRET is required when MICROSOFT_CLIENT_ID is set'
    );
  }

  // Check if at least one provider is configured
  const hasGoogleConfig =
    calendarConfig.google.clientId && calendarConfig.google.clientSecret;
  const hasMicrosoftConfig =
    calendarConfig.microsoft.clientId &&
    calendarConfig.microsoft.clientSecret;

  if (!hasGoogleConfig && !hasMicrosoftConfig) {
    errors.push(
      'Calendar sync enabled but no provider configured. Set up Google Calendar or Microsoft Outlook credentials.'
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Calendar configuration validation failed:\n${errors.join('\n')}`
    );
  }
};

/**
 * Check if a specific calendar provider is configured
 * 
 * @param provider - Calendar provider to check
 * @returns true if provider is configured, false otherwise
 */
export const isProviderConfigured = (provider: CalendarProvider): boolean => {
  if (!calendarConfig.enabled) {
    return false;
  }

  if (provider === 'google') {
    return !!(
      calendarConfig.google.clientId && calendarConfig.google.clientSecret
    );
  }

  if (provider === 'outlook') {
    return !!(
      calendarConfig.microsoft.clientId &&
      calendarConfig.microsoft.clientSecret
    );
  }

  return false;
};

/**
 * Get configured calendar providers
 * 
 * @returns Array of configured provider names
 */
export const getConfiguredProviders = (): CalendarProvider[] => {
  const providers: CalendarProvider[] = [];

  if (isProviderConfigured('google')) {
    providers.push('google');
  }

  if (isProviderConfigured('outlook')) {
    providers.push('outlook');
  }

  return providers;
};

/**
 * Get calendar configuration summary (without credentials)
 * Useful for logging and debugging
 * 
 * @returns Configuration summary object
 */
export const getCalendarConfigSummary = (): Record<string, any> => {
  return {
    enabled: calendarConfig.enabled,
    providers: {
      google: {
        configured: isProviderConfigured('google'),
        redirectUri: calendarConfig.google.redirectUri,
        scopes: calendarConfig.google.scopes,
      },
      outlook: {
        configured: isProviderConfigured('outlook'),
        redirectUri: calendarConfig.microsoft.redirectUri,
        scopes: calendarConfig.microsoft.scopes,
        tenantId: calendarConfig.microsoft.tenantId,
      },
    },
    retries: calendarConfig.retries,
    timeout: calendarConfig.timeout,
  };
};
