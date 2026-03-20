/**
 * Calendar Controller
 * 
 * Handlers for calendar OAuth flow and sync operations.
 * 
 * @module calendarController
 * @created 2026-03-19
 * @task US_013 TASK_005
 */

import { Request, Response } from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback as handleGoogleOAuthCallback,
  isGoogleCalendarAuthorized,
  revokeGoogleCalendar,
} from '../services/googleCalendarService';
import {
  getOutlookAuthUrl,
  handleOutlookCallback as handleOutlookOAuthCallback,
  isOutlookCalendarAuthorized,
  revokeOutlookCalendar,
} from '../services/outlookCalendarService';
import { syncAppointmentToCalendar } from '../services/calendarSyncService';
import logger from '../utils/logger';

/**
 * Extended Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

// ===============================================
// Google Calendar OAuth Handlers
// ===============================================

/**
 * Initiate Google Calendar OAuth flow
 * Returns authorization URL for user to grant access
 * 
 * GET /api/calendar/google/auth
 */
export const initiateGoogleAuth = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const authUrl = getGoogleAuthUrl(userId);
    
    logger.info('Generated Google Calendar auth URL', { userId });
    
    res.status(200).json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    logger.error('Failed to initiate Google Calendar auth:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Google Calendar authorization',
      error: error.message,
    });
  }
};

/**
 * Handle Google OAuth callback
 * Receives authorization code from Google and exchanges for tokens
 * 
 * GET /api/calendar/google/callback?code=...&state=...
 */
export const handleGoogleCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
      res.redirect('/error?message=Missing authorization code');
      return;
    }
    
    if (!state || typeof state !== 'string') {
      res.redirect('/error?message=Missing state parameter');
      return;
    }
    
    const userId = parseInt(state, 10);
    
    if (isNaN(userId)) {
      res.redirect('/error?message=Invalid state parameter');
      return;
    }
    
    // Exchange authorization code for tokens
    await handleGoogleOAuthCallback(code, userId);
    
    logger.info('Google Calendar authorization successful', { userId });
    
    // Redirect to settings page with success message
    res.redirect('/patient/settings?calendar=connected&provider=google');
  } catch (error: any) {
    logger.error('Failed to handle Google Calendar callback:', error);
    
    // Redirect to error page with message
    const errorMessage = encodeURIComponent(error.message || 'Calendar authorization failed');
    res.redirect(`/error?message=${errorMessage}`);
  }
};

// ===============================================
// Microsoft Outlook Calendar OAuth Handlers
// ===============================================

/**
 * Initiate Outlook Calendar OAuth flow
 * Returns authorization URL for user to grant access
 * 
 * GET /api/calendar/outlook/auth
 */
export const initiateOutlookAuth = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const authUrl = getOutlookAuthUrl(userId);
    
    logger.info('Generated Outlook Calendar auth URL', { userId });
    
    res.status(200).json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    logger.error('Failed to initiate Outlook Calendar auth:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Outlook Calendar authorization',
      error: error.message,
    });
  }
};

/**
 * Handle Outlook OAuth callback
 * Receives authorization code from Microsoft and exchanges for tokens
 * 
 * GET /api/calendar/outlook/callback?code=...&state=...
 */
export const handleOutlookCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
      res.redirect('/error?message=Missing authorization code');
      return;
    }
    
    if (!state || typeof state !== 'string') {
      res.redirect('/error?message=Missing state parameter');
      return;
    }
    
    const userId = parseInt(state, 10);
    
    if (isNaN(userId)) {
      res.redirect('/error?message=Invalid state parameter');
      return;
    }
    
    // Exchange authorization code for tokens
    await handleOutlookOAuthCallback(code, userId);
    
    logger.info('Outlook Calendar authorization successful', { userId });
    
    // Redirect to settings page with success message
    res.redirect('/patient/settings?calendar=connected&provider=outlook');
  } catch (error: any) {
    logger.error('Failed to handle Outlook Calendar callback:', error);
    
    // Redirect to error page with message
    const errorMessage = encodeURIComponent(error.message || 'Calendar authorization failed');
    res.redirect(`/error?message=${errorMessage}`);
  }
};

// ===============================================
// Calendar Sync Handlers
// ===============================================

/**
 * Sync appointment to calendar
 * Manually sync an appointment to user's connected calendar
 * 
 * POST /api/calendar/sync
 * Body: { appointmentId: string, provider: 'google' | 'outlook' }
 */
export const syncToCalendar = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const { appointmentId, provider } = req.body;
    
    // Validate request body
    if (!appointmentId || typeof appointmentId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid appointmentId',
      });
      return;
    }
    
    if (!provider || (provider !== 'google' && provider !== 'outlook')) {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid provider (must be "google" or "outlook")',
      });
      return;
    }
    
    // Sync appointment to calendar
    const result = await syncAppointmentToCalendar(appointmentId, userId, provider);
    
    if (result.success) {
      logger.info('Manual calendar sync successful', {
        userId,
        appointmentId,
        provider,
        eventId: result.eventId,
      });
      
      res.status(200).json({
        success: true,
        message: 'Appointment synced to calendar successfully',
        eventId: result.eventId,
        provider: result.provider,
      });
    } else {
      logger.error('Manual calendar sync failed', {
        userId,
        appointmentId,
        provider,
        error: result.error,
      });
      
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to sync appointment to calendar',
      });
    }
  } catch (error: any) {
    logger.error('Failed to sync appointment to calendar:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to sync appointment to calendar',
      error: error.message,
    });
  }
};

/**
 * Revoke calendar authorization
 * Disconnect user's calendar and delete stored tokens
 * 
 * DELETE /api/calendar/:provider/revoke
 */
export const revokeCalendar = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const { provider } = req.params;
    
    // Validate provider parameter
    if (provider !== 'google' && provider !== 'outlook') {
      res.status(400).json({
        success: false,
        message: 'Invalid provider (must be "google" or "outlook")',
      });
      return;
    }
    
    // Revoke calendar authorization
    if (provider === 'google') {
      await revokeGoogleCalendar(userId);
    } else {
      await revokeOutlookCalendar(userId);
    }
    
    logger.info('Calendar authorization revoked', { userId, provider });
    
    res.status(200).json({
      success: true,
      message: `${provider === 'google' ? 'Google' : 'Outlook'} Calendar authorization revoked successfully`,
    });
  } catch (error: any) {
    logger.error('Failed to revoke calendar authorization:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to revoke calendar authorization',
      error: error.message,
    });
  }
};

/**
 * Check calendar authorization status
 * Check if user has authorized the specified calendar provider
 * 
 * GET /api/calendar/:provider/status
 */
export const getCalendarStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    
    const { provider } = req.params;
    
    // Validate provider parameter
    if (provider !== 'google' && provider !== 'outlook') {
      res.status(400).json({
        success: false,
        message: 'Invalid provider (must be "google" or "outlook")',
      });
      return;
    }
    
    // Check authorization status
    let authorized = false;
    
    if (provider === 'google') {
      authorized = await isGoogleCalendarAuthorized(userId);
    } else {
      authorized = await isOutlookCalendarAuthorized(userId);
    }
    
    logger.debug('Calendar authorization status checked', {
      userId,
      provider,
      authorized,
    });
    
    res.status(200).json({
      success: true,
      authorized,
      provider,
    });
  } catch (error: any) {
    logger.error('Failed to check calendar authorization status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to check calendar authorization status',
      error: error.message,
    });
  }
};
