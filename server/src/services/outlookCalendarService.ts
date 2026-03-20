/**
 * Outlook Calendar Service
 * 
 * Service for integrating with Microsoft Outlook Calendar via Microsoft Graph API.
 * 
 * Features:
 * - OAuth2 authorization flow (Microsoft Identity Platform)
 * - Access token and refresh token management
 * - Automatic token refresh when expired
 * - Create calendar events from appointment data
 * - Encrypted token storage
 * - Error handling with retries
 * 
 * @module outlookCalendarService
 * @created 2026-03-19
 * @task US_013 TASK_005
 */

import {Client} from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch'; // Required for Graph client
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
 * Outlook Calendar event data
 */
export interface OutlookCalendarEventData {
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
 * Microsoft OAuth2 token response
 */
interface MicrosoftTokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
  refresh_token?: string;
}

/**
 * Encryption key for tokens (same as Google Calendar service)
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
 * Generate Microsoft Outlook authorization URL
 * User should be redirected to this URL to grant calendar access
 * 
 * @param userId - User ID to encode in state parameter
 * @returns Authorization URL
 */
export const getOutlookAuthUrl = (userId: number): string => {
  const { microsoft } = calendarConfig;
  
  const authUrl = new URL(`https://login.microsoftonline.com/${microsoft.tenantId}/oauth2/v2.0/authorize`);
  
  authUrl.searchParams.append('client_id', microsoft.clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', microsoft.redirectUri);
  authUrl.searchParams.append('scope', microsoft.scopes.join(' '));
  authUrl.searchParams.append('state', userId.toString());
  authUrl.searchParams.append('response_mode', 'query');
  authUrl.searchParams.append('prompt', 'consent'); // Force consent to get refresh token
  
  logger.info('Generated Outlook Calendar authorization URL', { userId });
  
  return authUrl.toString();
};

/**
 * Exchange authorization code for access token
 * 
 * @param code - Authorization code from callback
 * @returns Token response with access token and refresh token
 */
const exchangeCodeForTokens = async (code: string): Promise<MicrosoftTokenResponse> => {
  const { microsoft } = calendarConfig;
  
  const tokenEndpoint = `https://login.microsoftonline.com/${microsoft.tenantId}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: microsoft.clientId,
    client_secret: microsoft.clientSecret,
    code: code,
    redirect_uri: microsoft.redirectUri,
    grant_type: 'authorization_code',
  });
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
  }
  
  return (await response.json()) as MicrosoftTokenResponse;
};

/**
 * Refresh access token using refresh token
 * 
 * @param refreshToken - Refresh token
 * @returns Token response with new access token
 */
const refreshAccessToken = async (refreshToken: string): Promise<MicrosoftTokenResponse> => {
  const { microsoft } = calendarConfig;
  
  const tokenEndpoint = `https://login.microsoftonline.com/${microsoft.tenantId}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: microsoft.clientId,
    client_secret: microsoft.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.statusText} - ${errorText}`);
  }
  
  return (await response.json()) as MicrosoftTokenResponse;
};

/**
 * Handle OAuth2 callback from Microsoft
 * Exchange authorization code for access token and refresh token
 * Store tokens in database (encrypted)
 * 
 * @param code - Authorization code from callback
 * @param userId - User ID from state parameter
 * @throws Error if token exchange fails or database error
 */
export const handleOutlookCallback = async (
  code: string,
  userId: number
): Promise<void> => {
  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    logger.info('Received tokens from Microsoft', {
      userId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
    
    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
    
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
      'outlook',
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiry,
      tokens.scope,
    ]);
    
    logger.info('Stored Outlook Calendar tokens in database', { userId });
  } catch (error) {
    logger.error('Failed to handle Outlook Calendar callback:', error);
    throw new Error(`Outlook Calendar authorization failed: ${(error as Error).message}`);
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
    WHERE user_id = $1 AND provider = 'outlook'
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
 * @param expiryDate - Token expiry timestamp (milliseconds)
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
    WHERE user_id = $3 AND provider = 'outlook'
  `;
  
  await pool.query(query, [encryptedAccessToken, tokenExpiry, userId]);
  
  logger.debug('Updated Outlook Calendar access token', {
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
    throw new Error('No Outlook Calendar authorization found. Please authorize calendar access first.');
  }
  
  // Check if token is expired or will expire in next 5 minutes
  const now = Date.now();
  const expiryTime = new Date(tokens.token_expiry).getTime();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  
  if (now >= expiryTime - bufferTime) {
    // Token expired or expiring soon - refresh it
    logger.info('Outlook Calendar access token expired, refreshing', { userId });
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token available. Please re-authorize calendar access.');
    }
    
    try {
      const newTokens = await refreshAccessToken(decrypt(tokens.refresh_token));
      
      const newExpiry = Date.now() + newTokens.expires_in * 1000;
      await updateTokens(userId, newTokens.access_token, newExpiry);
      
      logger.info('Outlook Calendar access token refreshed successfully', { userId });
      
      return newTokens.access_token;
    } catch (error) {
      logger.error('Failed to refresh Outlook Calendar token:', error);
      throw new Error(`Token refresh failed: ${(error as Error).message}`);
    }
  }
  
  // Token is still valid
  return decrypt(tokens.access_token);
};

/**
 * Create calendar event in Outlook Calendar via Microsoft Graph API
 * 
 * @param userId - User ID
 * @param eventData - Event data from appointment
 * @returns Outlook Calendar event ID
 * @throws Error if event creation fails
 */
export const createOutlookCalendarEvent = async (
  userId: number,
  eventData: OutlookCalendarEventData
): Promise<string> => {
  logger.info('Creating Outlook Calendar event', {
    userId,
    appointmentId: eventData.appointmentId,
  });
  
  try {
    // Get valid access token (with automatic refresh if needed)
    const accessToken = await getValidAccessToken(userId);
    
    // Create Microsoft Graph API client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    
    // Build event object (Microsoft Graph format)
    const event = {
      subject: `Appointment with ${eventData.providerName}`,
      body: {
        contentType: 'HTML',
        content: `
          <h3>Appointment Details</h3>
          <p><strong>Department:</strong> ${eventData.departmentName}</p>
          <p><strong>Appointment ID:</strong> ${eventData.appointmentId}</p>
          ${eventData.notes ? `<p><strong>Notes:</strong> ${eventData.notes}</p>` : ''}
          <hr>
          <p>Please arrive 15 minutes early.</p>
          <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
        `,
      },
      start: {
        dateTime: eventData.startTime,
        timeZone: 'Eastern Standard Time', // TODO: Make configurable or detect from user profile
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'Eastern Standard Time',
      },
      location: {
        displayName: eventData.location,
      },
      isReminderOn: true,
      reminderMinutesBeforeStart: 30,
      categories: ['Appointment'],
      importance: 'normal',
    };
    
    // Create event in user's default calendar
    const result = await client.api('/me/events').post(event);
    
    if (!result.id) {
      throw new Error('No event ID returned from Outlook Calendar');
    }
    
    logger.info('Outlook Calendar event created successfully', {
      userId,
      appointmentId: eventData.appointmentId,
      eventId: result.id,
    });
    
    return result.id;
  } catch (error: any) {
    logger.error('Failed to create Outlook Calendar event:', {
      userId,
      appointmentId: eventData.appointmentId,
      error: error.message,
      statusCode: error.statusCode,
    });
    
    // Provide user-friendly error messages
    if (error.statusCode === 401) {
      throw new Error('Calendar authorization expired. Please re-authorize calendar access.');
    } else if (error.statusCode === 403) {
      throw new Error('Insufficient permissions to create calendar events. Please re-authorize with proper permissions.');
    } else if (error.statusCode === 429) {
      throw new Error('Too many requests to Outlook Calendar. Please try again later.');
    }
    
    throw new Error(`Failed to create Outlook Calendar event: ${error.message}`);
  }
};

/**
 * Update existing calendar event in Outlook Calendar
 * Used for reschedule operations
 * 
 * @param userId - User ID
 * @param eventId - Outlook Calendar event ID to update
 * @param eventData - Updated event data from appointment
 * @returns Outlook Calendar event ID
 * @throws Error if event update fails
 */
export const updateOutlookCalendarEvent = async (
  userId: number,
  eventId: string,
  eventData: OutlookCalendarEventData
): Promise<string> => {
  logger.info('Updating Outlook Calendar event', {
    userId,
    eventId,
    appointmentId: eventData.appointmentId,
  });
  
  try {
    // Get valid access token (with automatic refresh if needed)
    const accessToken = await getValidAccessToken(userId);
    
    // Create Microsoft Graph client
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    
    // Build updated event object
    const event = {
      subject: `Appointment with ${eventData.providerName}`,
      body: {
        contentType: 'text',
        content: `
Department: ${eventData.departmentName}
Appointment ID: ${eventData.appointmentId}
${eventData.notes ? `\nNotes: ${eventData.notes}` : ''}

Please arrive 15 minutes early.
If you need to cancel or reschedule, please contact us at least 24 hours in advance.
        `.trim(),
      },
      location: {
        displayName: eventData.location,
      },
      start: {
        dateTime: eventData.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'America/New_York',
      },
      isReminderOn: true,
      reminderMinutesBeforeStart: 24 * 60, // 1 day
      categories: ['Health', 'Appointment'],
    };
    
    // Update event using PATCH method
    const updatedEvent = await graphClient
      .api(`/me/events/${eventId}`)
      .patch(event);
    
    if (!updatedEvent.id) {
      throw new Error('No event ID returned from Outlook Calendar after update');
    }
    
    logger.info('Outlook Calendar event updated successfully', {
      userId,
      appointmentId: eventData.appointmentId,
      eventId: updatedEvent.id,
    });
    
    return updatedEvent.id;
  } catch (error: any) {
    logger.error('Failed to update Outlook Calendar event:', {
      userId,
      eventId,
      appointmentId: eventData.appointmentId,
      error: error.message,
      statusCode: error.statusCode,
    });
    
    // Provide user-friendly error messages
    if (error.statusCode === 401) {
      throw new Error('Calendar authorization expired. Please re-authorize calendar access.');
    } else if (error.statusCode === 403) {
      throw new Error('Insufficient permissions to update calendar events. Please re-authorize with proper permissions.');
    } else if (error.statusCode === 404) {
      throw new Error('Calendar event not found. It may have been deleted.');
    } else if (error.statusCode === 429) {
      throw new Error('Too many requests to Outlook Calendar. Please try again later.');
    }
    
    throw new Error(`Failed to update Outlook Calendar event: ${error.message}`);
  }
};

/**
 * Delete calendar event from Outlook Calendar
 * Used for cancellation operations
 * 
 * @param userId - User ID
 * @param eventId - Outlook Calendar event ID to delete
 * @throws Error if event deletion fails
 */
export const deleteOutlookCalendarEvent = async (
  userId: number,
  eventId: string
): Promise<void> => {
  logger.info('Deleting Outlook Calendar event', {
    userId,
    eventId,
  });
  
  try {
    // Get valid access token (with automatic refresh if needed)
    const accessToken = await getValidAccessToken(userId);
    
    // Create Microsoft Graph client
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    
    // Delete event using DELETE method
    await graphClient
      .api(`/me/events/${eventId}`)
      .delete();
    
    logger.info('Outlook Calendar event deleted successfully', {
      userId,
      eventId,
    });
  } catch (error: any) {
    logger.error('Failed to delete Outlook Calendar event:', {
      userId,
      eventId,
      error: error.message,
      statusCode: error.statusCode,
    });
    
    // Provide user-friendly error messages
    if (error.statusCode === 401) {
      throw new Error('Calendar authorization expired. Please re-authorize calendar access.');
    } else if (error.statusCode === 403) {
      throw new Error('Insufficient permissions to delete calendar events. Please re-authorize with proper permissions.');
    } else if (error.statusCode === 404) {
      // Event not found is not a critical error for deletion
      logger.warn('Calendar event not found during deletion (may have been already deleted)', {
        userId,
        eventId,
      });
      return; // Success - event doesn't exist
    } else if (error.statusCode === 429) {
      throw new Error('Too many requests to Outlook Calendar. Please try again later.');
    }
    
    throw new Error(`Failed to delete Outlook Calendar event: ${error.message}`);
  }
};

/**
 * Revoke Outlook Calendar authorization
 * Deletes tokens from database
 * 
 * @param userId - User ID
 */
export const revokeOutlookCalendar = async (userId: number): Promise<void> => {
  const query = `
    DELETE FROM calendar_tokens
    WHERE user_id = $1 AND provider = 'outlook'
  `;
  
  await pool.query(query, [userId]);
  
  logger.info('Revoked Outlook Calendar authorization', { userId });
};

/**
 * Check if user has authorized Outlook Calendar
 * 
 * @param userId - User ID
 * @returns true if authorized, false otherwise
 */
export const isOutlookCalendarAuthorized = async (userId: number): Promise<boolean> => {
  const tokens = await loadTokens(userId);
  return tokens !== null;
};
