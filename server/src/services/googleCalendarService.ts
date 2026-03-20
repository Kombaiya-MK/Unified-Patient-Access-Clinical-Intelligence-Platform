/**
 * Google Calendar Service
 * 
 * Service for integrating with Google Calendar API to sync appointments.
 * 
 * Features:
 * - OAuth2 authorization flow
 * - Access token and refresh token management
 * - Automatic token refresh when expired
 * - Create calendar events from appointment data
 * - Encrypted token storage
 * - Error handling with retries
 * 
 * @module googleCalendarService
 * @created 2026-03-19
 * @task US_013 TASK_005
 */

import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../config/database';
import { calendarConfig } from '../config/calendar.config';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * Calendar token data from database
 */
interface CalendarToken {
  id: number;
  user_id: number;
  provider: string;
  access_token: string; // Encrypted
  refresh_token: string | null; // Encrypted
  token_expiry: Date;
  scope: string | null;
}

/**
 * Google Calendar event data
 */
export interface GoogleCalendarEventData {
  appointmentId: string;
  providerName: string;
  departmentName: string;
  location: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  patientName?: string;
  notes?: string;
}

/**
 * Encryption key for tokens (should be stored in environment variable)
 * In production: Use AWS KMS, Azure Key Vault, or similar
 */
const ENCRYPTION_KEY = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32-chars!!!';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive data (access tokens, refresh tokens)
 * Uses AES-256-GCM for encryption
 * 
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:encryptedData
 */
const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt encrypted data
 * 
 * @param encryptedText - Encrypted text in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
const decrypt = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Create OAuth2 client with Google Calendar configuration
 * 
 * @returns Configured OAuth2 client
 */
const createOAuth2Client = (): OAuth2Client => {
  return new google.auth.OAuth2(
    calendarConfig.google.clientId,
    calendarConfig.google.clientSecret,
    calendarConfig.google.redirectUri
  );
};

/**
 * Generate Google Calendar authorization URL
 * User should be redirected to this URL to grant calendar access
 * 
 * @param userId - User ID to encode in state parameter
 * @returns Authorization URL
 */
export const getGoogleAuthUrl = (userId: number): string => {
  const oauth2Client = createOAuth2Client();
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh token
    scope: calendarConfig.google.scopes,
    state: userId.toString(), // Pass user ID in state for callback
    prompt: 'consent', // Force consent screen to get refresh token
  });
  
  logger.info('Generated Google Calendar authorization URL', { userId });
  
  return authUrl;
};

/**
 * Handle OAuth2 callback from Google
 * Exchange authorization code for access token and refresh token
 * Store tokens in database (encrypted)
 * 
 * @param code - Authorization code from callback
 * @param userId - User ID from state parameter
 * @throws Error if token exchange fails or database error
 */
export const handleGoogleCallback = async (
  code: string,
  userId: number
): Promise<void> => {
  const oauth2Client = createOAuth2Client();
  
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }
    
    logger.info('Received tokens from Google', {
      userId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });
    
    // Calculate token expiry
    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default: 1 hour from now
    
    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : null;
    
    // Store tokens in database (upsert)
    const query = `
      INSERT INTO calendar_tokens (user_id, provider, access_token, refresh_token, token_expiry, scope)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        scope = EXCLUDED.scope,
        updated_at = NOW()
    `;
    
    await pool.query(query, [
      userId,
      'google',
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiry,
      tokens.scope || calendarConfig.google.scopes.join(' '),
    ]);
    
    logger.info('Stored Google Calendar tokens in database', { userId });
  } catch (error) {
    logger.error('Failed to handle Google Calendar callback:', error);
    throw new Error(`Google Calendar authorization failed: ${(error as Error).message}`);
  }
};

/**
 * Load calendar tokens from database
 * 
 * @param userId - User ID
 * @returns Calendar token record or null if not found
 */
const loadTokens = async (userId: number): Promise<CalendarToken | null> => {
  const query = `
    SELECT id, user_id, provider, access_token, refresh_token, token_expiry, scope
    FROM calendar_tokens
    WHERE user_id = $1 AND provider = 'google'
  `;
  
  const result = await pool.query(query, [userId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0] as CalendarToken;
};

/**
 * Update tokens in database after refresh
 * 
 * @param userId - User ID
 * @param accessToken - New access token
 * @param expiryDate - Token expiry timestamp
 */
const updateTokens = async (
  userId: number,
  accessToken: string,
  expiryDate: number
): Promise<void> => {
  const encryptedAccessToken = encrypt(accessToken);
  const tokenExpiry = new Date(expiryDate);
  
  const query = `
    UPDATE calendar_tokens
    SET access_token = $1, token_expiry = $2, updated_at = NOW()
    WHERE user_id = $3 AND provider = 'google'
  `;
  
  await pool.query(query, [encryptedAccessToken, tokenExpiry, userId]);
  
  logger.debug('Updated Google Calendar access token', {
    userId,
    newExpiry: tokenExpiry,
  });
};

/**
 * Get valid access token for API calls
 * Automatically refreshes expired tokens using refresh token
 * 
 * @param userId - User ID
 * @returns Valid access token
 * @throws Error if no tokens found or refresh fails
 */
const getValidAccessToken = async (userId: number): Promise<string> => {
  const tokens = await loadTokens(userId);
  
  if (!tokens) {
    throw new Error('No Google Calendar authorization found. Please authorize calendar access first.');
  }
  
  // Check if token is expired or will expire in next 5 minutes
  const now = Date.now();
  const expiryTime = new Date(tokens.token_expiry).getTime();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  
  if (now >= expiryTime - bufferTime) {
    // Token expired or expiring soon - refresh it
    logger.info('Google Calendar access token expired, refreshing', { userId });
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token available. Please re-authorize calendar access.');
    }
    
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: decrypt(tokens.refresh_token),
    });
    
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error('Failed to refresh token: No access token or expiry date received');
      }
      
      await updateTokens(userId, credentials.access_token, credentials.expiry_date);
      
      logger.info('Google Calendar access token refreshed successfully', { userId });
      
      return credentials.access_token;
    } catch (error) {
      logger.error('Failed to refresh Google Calendar token:', error);
      throw new Error(`Token refresh failed: ${(error as Error).message}`);
    }
  }
  
  // Token is still valid
  return decrypt(tokens.access_token);
};

/**
 * Create calendar event in Google Calendar
 * 
 * @param userId - User ID
 * @param eventData - Event data from appointment
 * @returns Google Calendar event ID
 * @throws Error if event creation fails
 */
export const createGoogleCalendarEvent = async (
  userId: number,
  eventData: GoogleCalendarEventData
): Promise<string> => {
  logger.info('Creating Google Calendar event', {
    userId,
    appointmentId: eventData.appointmentId,
  });
  
  try {
    // Get valid access token (with automatic refresh if needed)
    const accessToken = await getValidAccessToken(userId);
    
    // Configure OAuth2 client with access token
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Create Google Calendar API client
    const calendarAPI = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Build event object
    const event: calendar_v3.Schema$Event = {
      summary: `Appointment with ${eventData.providerName}`,
      description: `
Department: ${eventData.departmentName}
Appointment ID: ${eventData.appointmentId}
${eventData.notes ? `\nNotes: ${eventData.notes}` : ''}

Please arrive 15 minutes early.
If you need to cancel or reschedule, please contact us at least 24 hours in advance.
      `.trim(),
      location: eventData.location,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'America/New_York', // TODO: Make configurable or detect from user profile
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
      colorId: '5', // Yellow color (appointment)
    };
    
    // Create event in user's primary calendar
    const response = await calendarAPI.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    if (!response.data.id) {
      throw new Error('No event ID returned from Google Calendar');
    }
    
    logger.info('Google Calendar event created successfully', {
      userId,
      appointmentId: eventData.appointmentId,
      eventId: response.data.id,
    });
    
    return response.data.id;
  } catch (error: any) {
    logger.error('Failed to create Google Calendar event:', {
      userId,
      appointmentId: eventData.appointmentId,
      error: error.message,
      errorCode: error.code,
    });
    
    // Provide user-friendly error messages
    if (error.code === 401) {
      throw new Error('Calendar authorization expired. Please re-authorize calendar access.');
    } else if (error.code === 403) {
      throw new Error('Insufficient permissions to create calendar events. Please re-authorize with proper permissions.');
    } else if (error.code === 429) {
      throw new Error('Too many requests to Google Calendar. Please try again later.');
    }
    
    throw new Error(`Failed to create Google Calendar event: ${error.message}`);
  }
};

/**
 * Update existing calendar event in Google Calendar
 * Used for reschedule operations
 * 
 * @param userId - User ID
 * @param eventId - Google Calendar event ID to update
 * @param eventData - Updated event data from appointment
 * @returns Google Calendar event ID
 * @throws Error if event update fails
 */
export const updateGoogleCalendarEvent = async (
  userId: number,
  eventId: string,
  eventData: GoogleCalendarEventData
): Promise<string> => {
  logger.info('Updating Google Calendar event', {
    userId,
    eventId,
    appointmentId: eventData.appointmentId,
  });
  
  try {
    // Get valid access token (with automatic refresh if needed)
    const accessToken = await getValidAccessToken(userId);
    
    // Configure OAuth2 client with access token
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Create Google Calendar API client
    const calendarAPI = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Build updated event object
    const event: calendar_v3.Schema$Event = {
      summary: `Appointment with ${eventData.providerName}`,
      description: `
Department: ${eventData.departmentName}
Appointment ID: ${eventData.appointmentId}
${eventData.notes ? `\nNotes: ${eventData.notes}` : ''}

Please arrive 15 minutes early.
If you need to cancel or reschedule, please contact us at least 24 hours in advance.
      `.trim(),
      location: eventData.location,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
      colorId: '5', // Yellow color (appointment)
    };
    
    // Update event in user's primary calendar using patch (partial update)
    const response = await calendarAPI.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });
    
    if (!response.data.id) {
      throw new Error('No event ID returned from Google Calendar after update');
    }
    
    logger.info('Google Calendar event updated successfully', {
      userId,
      appointmentId: eventData.appointmentId,
      eventId: response.data.id,
    });
    
    return response.data.id;
  } catch (error: any) {
    logger.error('Failed to update Google Calendar event:', {
      userId,
      eventId,
      appointmentId: eventData.appointmentId,
      error: error.message,
      errorCode: error.code,
    });
    
    // Provide user-friendly error messages
    if (error.code === 401) {
      throw new Error('Calendar authorization expired. Please re-authorize calendar access.');
    } else if (error.code === 403) {
      throw new Error('Insufficient permissions to update calendar events. Please re-authorize with proper permissions.');
    } else if (error.code === 404) {
      throw new Error('Calendar event not found. It may have been deleted.');
    } else if (error.code === 429) {
      throw new Error('Too many requests to Google Calendar. Please try again later.');
    }
    
    throw new Error(`Failed to update Google Calendar event: ${error.message}`);
  }
};

/**
 * Delete calendar event from Google Calendar
 * Used for cancellation operations
 * 
 * @param userId - User ID
 * @param eventId - Google Calendar event ID to delete
 * @throws Error if event deletion fails
 */
export const deleteGoogleCalendarEvent = async (
  userId: number,
  eventId: string
): Promise<void> => {
  logger.info('Deleting Google Calendar event', {
    userId,
    eventId,
  });
  
  try {
    // Get valid access token (with automatic refresh if needed)
    const accessToken = await getValidAccessToken(userId);
    
    // Configure OAuth2 client with access token
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Create Google Calendar API client
    const calendarAPI = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Delete event from user's primary calendar
    await calendarAPI.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    logger.info('Google Calendar event deleted successfully', {
      userId,
      eventId,
    });
  } catch (error: any) {
    logger.error('Failed to delete Google Calendar event:', {
      userId,
      eventId,
      error: error.message,
      errorCode: error.code,
    });
    
    // Provide user-friendly error messages
    if (error.code === 401) {
      throw new Error('Calendar authorization expired. Please re-authorize calendar access.');
    } else if (error.code === 403) {
      throw new Error('Insufficient permissions to delete calendar events. Please re-authorize with proper permissions.');
    } else if (error.code === 404) {
      // Event not found is not a critical error for deletion
      logger.warn('Calendar event not found during deletion (may have been already deleted)', {
        userId,
        eventId,
      });
      return; // Success - event doesn't exist
    } else if (error.code === 429) {
      throw new Error('Too many requests to Google Calendar. Please try again later.');
    }
    
    throw new Error(`Failed to delete Google Calendar event: ${error.message}`);
  }
};

/**
 * Revoke Google Calendar authorization
 * Deletes tokens from database
 * 
 * @param userId - User ID
 */
export const revokeGoogleCalendar = async (userId: number): Promise<void> => {
  const query = `
    DELETE FROM calendar_tokens
    WHERE user_id = $1 AND provider = 'google'
  `;
  
  await pool.query(query, [userId]);
  
  logger.info('Revoked Google Calendar authorization', { userId });
};

/**
 * Check if user has authorized Google Calendar
 * 
 * @param userId - User ID
 * @returns true if authorized, false otherwise
 */
export const isGoogleCalendarAuthorized = async (userId: number): Promise<boolean> => {
  const tokens = await loadTokens(userId);
  return tokens !== null;
};
