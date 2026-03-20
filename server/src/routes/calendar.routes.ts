/**
 * Calendar Routes
 * 
 * Routes for calendar integration (OAuth flow and sync operations).
 * 
 * Endpoints:
 * - GET /api/calendar/google/auth - Initiate Google OAuth
 * - GET /api/calendar/google/callback - Handle Google OAuth callback
 * - GET /api/calendar/outlook/auth - Initiate Outlook OAuth
 * - GET /api/calendar/outlook/callback - Handle Outlook OAuth callback
 * - POST /api/calendar/sync - Sync appointment to calendar
 * - DELETE /api/calendar/:provider/revoke - Revoke calendar authorization
 * - GET /api/calendar/:provider/status - Check authorization status
 * 
 * @module calendarRoutes
 * @created 2026-03-19
 * @task US_013 TASK_005
 */

import express from 'express';
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateOutlookAuth,
  handleOutlookCallback,
  syncToCalendar,
  revokeCalendar,
  getCalendarStatus,
} from '../controllers/calendarController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// ===============================================
// Google Calendar OAuth Routes
// ===============================================

/**
 * GET /api/calendar/google/auth
 * Initiate Google Calendar OAuth flow
 * 
 * Returns authorization URL for user to grant access
 * 
 * @auth Required
 * @returns { authUrl: string }
 */
router.get('/google/auth', authenticate, initiateGoogleAuth);

/**
 * GET /api/calendar/google/callback?code=...&state=...
 * Handle Google OAuth callback
 * 
 * Receives authorization code from Google and exchanges for tokens
 * Redirects to settings page with success/error message
 * 
 * @query code - Authorization code from Google
 * @query state - User ID encoded in state parameter
 * @redirects /patient/settings or /error
 */
router.get('/google/callback', handleGoogleCallback);

// ===============================================
// Microsoft Outlook Calendar OAuth Routes
// ===============================================

/**
 * GET /api/calendar/outlook/auth
 * Initiate Outlook Calendar OAuth flow
 * 
 * Returns authorization URL for user to grant access
 * 
 * @auth Required
 * @returns { authUrl: string }
 */
router.get('/outlook/auth', authenticate, initiateOutlookAuth);

/**
 * GET /api/calendar/outlook/callback?code=...&state=...
 * Handle Outlook OAuth callback
 * 
 * Receives authorization code from Microsoft and exchanges for tokens
 * Redirects to settings page with success/error message
 * 
 * @query code - Authorization code from Microsoft
 * @query state - User ID encoded in state parameter
 * @redirects /patient/settings or /error
 */
router.get('/outlook/callback', handleOutlookCallback);

// ===============================================
// Calendar Sync Routes
// ===============================================

/**
 * POST /api/calendar/sync
 * Sync appointment to calendar
 * 
 * Manually sync an appointment to user's connected calendar
 * 
 * @auth Required
 * @body { appointmentId: string, provider: 'google' | 'outlook' }
 * @returns { success: boolean, eventId?: string, error?: string }
 */
router.post('/sync', authenticate, syncToCalendar);

/**
 * DELETE /api/calendar/:provider/revoke
 * Revoke calendar authorization
 * 
 * Disconnect user's calendar and delete stored tokens
 * 
 * @auth Required
 * @param provider - Calendar provider ('google' or 'outlook')
 * @returns { success: boolean, message: string }
 */
router.delete('/:provider/revoke', authenticate, revokeCalendar);

/**
 * GET /api/calendar/:provider/status
 * Check calendar authorization status
 * 
 * Check if user has authorized the specified calendar provider
 * 
 * @auth Required
 * @param provider - Calendar provider ('google' or 'outlook')
 * @returns { authorized: boolean, provider: string }
 */
router.get('/:provider/status', authenticate, getCalendarStatus);

export default router;
