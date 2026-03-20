# Task - TASK_005_BE_CALENDAR_SYNC_INTEGRATION

## Requirement Reference
- User Story: US_013  
- Story Location: `.propel/context/tasks/us_013/us_013.md`
- Acceptance Criteria:
    - AC2: System triggers calendar sync (Google/Outlook) after booking
- Edge Cases:
    - Calendar sync fails: Complete booking anyway, show warning "Calendar sync failed - add manually" with retry button

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Backend calendar API integration - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | googleapis | 130.x |
| Backend | @microsoft/microsoft-graph-client | 3.x |
| External | Google Calendar API | v3 |
| External | Microsoft Graph API | v1.0 |
| Database | PostgreSQL | 15+ |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Calendar API integration only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend service only

## Task Overview
Implement calendar sync integration with Google Calendar and Microsoft Outlook using their respective APIs. Create calendarSyncService with methods to sync appointments to user's calendar. Implement OAuth2 flow for calendar authorization (store tokens in database). Create syncAppointmentToCalendar(appointmentId, calendarProvider) method that creates calendar event with appointment details. Handle token refresh for expired OAuth tokens. Implement retry logic with graceful failure (don't block booking if sync fails). Support both Google Calendar API and Microsoft Graph API for Outlook. Store calendar event IDs for future updates/cancellations.

## Dependent Tasks
- US_013 TASK_002: Appointment booking API must create appointment
- US_009: User authentication (for associating calendar OAuth tokens)

## Impacted Components
**Modified:**
- database/migrations/XXX_add_calendar_tokens_table.sql (Store OAuth tokens)
- server/src/controllers/appointmentController.ts (Call calendar sync after booking)

**New:**
- server/src/services/calendarSyncService.ts (Core calendar sync service)
- server/src/services/googleCalendarService.ts (Google Calendar API integration)
- server/src/services/outlookCalendarService.ts (Microsoft Graph API integration)
- server/src/routes/calendar.routes.ts (OAuth callback endpoints)
- server/src/controllers/calendarController.ts (Handle OAuth flow)
- server/src/config/calendar.config.ts (OAuth credentials and scopes)
- server/tests/unit/calendarSyncService.test.ts (Unit tests)

## Implementation Plan
1. **OAuth Configuration**: Set up Google and Microsoft OAuth2 credentials
2. **Database Schema**: Create calendar_tokens table (user_id, provider, access_token, refresh_token, expiry)
3. **OAuth Flow**: Implement authorization URL generation and callback handling
4. **Token Storage**: Store OAuth tokens securely (encrypted) in database
5. **Google Calendar**: Implement createEvent using googleapis library
6. **Outlook Calendar**: Implement createEvent using microsoft-graph-client
7. **Sync Service**: Create unified sync method that calls appropriate provider
8. **Token Refresh**: Automatically refresh expired tokens before API calls
9. **Event Mapping**: Map appointment data to calendar event format
10. **Error Handling**: Graceful failure - log error, continue booking, notify user
11. **Retry Logic**: 2 retry attempts on transient failures
12. **Testing**: Unit tests with mocked API responses

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend API
│   ├── src/
│   │   ├── services/
│   │   │   ├── emailService.ts (US_013 TASK_004)
│   │   │   └── pdfService.ts (US_013 TASK_003)
│   │   └── routes/
│   │       └── appointments.routes.ts (US_013 TASK_002)
└── database/
    └── migrations/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/XXX_calendar_tokens_table.sql | Store OAuth tokens for calendar sync |
| CREATE | server/src/services/calendarSyncService.ts | Unified calendar sync service |
| CREATE | server/src/services/googleCalendarService.ts | Google Calendar API integration |
| CREATE | server/src/services/outlookCalendarService.ts | Microsoft Graph API integration |
| CREATE | server/src/routes/calendar.routes.ts | OAuth endpoints: /auth/google, /auth/outlook |
| CREATE | server/src/controllers/calendarController.ts | Handle OAuth callbacks |
| CREATE | server/src/config/calendar.config.ts | OAuth credentials and scopes |
| CREATE | server/tests/unit/calendarSyncService.test.ts | Unit tests |
| MODIFY | server/src/controllers/appointmentController.ts | Call calendarSyncService after booking |

> 1 modified file, 8 new files created

## External References
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth2 for Web](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Microsoft Graph Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [Microsoft OAuth2 Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
- [microsoft-graph-client npm](https://www.npmjs.com/package/@microsoft/microsoft-graph-client)

## Build Commands
```bash
# Install dependencies
cd server
npm install googleapis @microsoft/microsoft-graph-client

# Set up OAuth credentials (Google Cloud Console + Azure AD)
export GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="xxxxx"
export GOOGLE_REDIRECT_URI="http://localhost:3001/api/calendar/google/callback"

export MICROSOFT_CLIENT_ID="xxxxx"
export MICROSOFT_CLIENT_SECRET="xxxxx"
export MICROSOFT_REDIRECT_URI="http://localhost:3001/api/calendar/outlook/callback"

# Run migration
npm run migrate up

# Test OAuth flow
# 1. Navigate to authorization URL
curl http://localhost:3001/api/calendar/google/auth?user_id=1
# Returns: { authUrl: "https://accounts.google.com/o/oauth2/v2/auth?..." }

# 2. User authorizes in browser → redirects to callback
# Callback stores tokens in calendar_tokens table

# 3. Test calendar sync
# Create appointment, then sync:
curl -X POST http://localhost:3001/api/calendar/sync \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": 123, "provider": "google"}'

# Expected: Calendar event created in Google Calendar

# Verify event in Google Calendar UI

# Test Outlook sync
curl -X POST http://localhost:3001/api/calendar/sync \
  -d '{"appointmentId": 123, "provider": "outlook"}'

# Test token refresh
# Manually expire token in database → Make sync call
# Expected: Token auto-refreshes, sync succeeds

# Test sync failure
# Invalid token → Sync fails gracefully
# Expected: Booking completes, error logged, user notified

# Run unit tests
npm test -- calendarSyncService.test.ts
```

## Implementation Validation Strategy
- [ ] OAuth configuration set up for Google and Outlook
- [ ] calendar_tokens table created in database
- [ ] OAuth authorization URL generated correctly
- [ ] OAuth callback stores tokens in database
- [ ] Tokens encrypted before storage
- [ ] Google Calendar event created successfully
- [ ] Outlook Calendar event created successfully
- [ ] Event includes: title, description, start/end time, location
- [ ] Token refresh works for expired tokens
- [ ] Sync failure doesn't block booking
- [ ] Error logged when sync fails
- [ ] Retry logic: 2 attempts on transient failures
- [ ] Calendar event ID stored with appointment
- [ ] Unit tests pass with mocked APIs
- [ ] Integration test: Real calendar event created

## Implementation Checklist

### Database Migration (database/migrations/XXX_calendar_tokens_table.sql)
- [ ] CREATE TABLE calendar_tokens (
- [ ]   id SERIAL PRIMARY KEY,
- [ ]   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
- [ ]   provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'outlook')),
- [ ]   access_token TEXT NOT NULL, -- Encrypted
- [ ]   refresh_token TEXT, -- Encrypted
- [ ]   token_expiry TIMESTAMPTZ NOT NULL,
- [ ]   scope TEXT,
- [ ]   created_at TIMESTAMPTZ DEFAULT NOW(),
- [ ]   updated_at TIMESTAMPTZ DEFAULT NOW(),
- [ ]   UNIQUE(user_id, provider)
- [ ] );
- [ ] CREATE INDEX idx_calendar_tokens_user_id ON calendar_tokens(user_id);
- [ ] -- Store calendar event IDs in appointments table
- [ ] ALTER TABLE appointments ADD COLUMN calendar_event_id VARCHAR(255);
- [ ] ALTER TABLE appointments ADD COLUMN calendar_provider VARCHAR(20);

### Calendar Configuration (server/src/config/calendar.config.ts)
- [ ] export const calendarConfig = {
- [ ]   google: {
- [ ]     clientId: process.env.GOOGLE_CLIENT_ID,
- [ ]     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
- [ ]     redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/google/callback',
- [ ]     scopes: ['https://www.googleapis.com/auth/calendar.events']
- [ ]   },
- [ ]   microsoft: {
- [ ]     clientId: process.env.MICROSOFT_CLIENT_ID,
- [ ]     clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
- [ ]     redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/calendar/outlook/callback',
- [ ]     scopes: ['Calendars.ReadWrite']
- [ ]   },
- [ ]   retries: 2,
- [ ]   timeout: 10000 // 10 seconds
- [ ] }

### Google Calendar Service (server/src/services/googleCalendarService.ts)
- [ ] Import { google } from 'googleapis'
- [ ] Import calendarConfig, encrypt/decrypt utilities
- [ ] const oauth2Client = new google.auth.OAuth2(calendarConfig.google.clientId, calendarConfig.google.clientSecret, calendarConfig.google.redirectUri)
- [ ] export const getGoogleAuthUrl = (userId: number): string => {
- [ ]   return oauth2Client.generateAuthUrl({ access_type: 'offline', scope: calendarConfig.google.scopes, state: userId.toString() });
- [ ] }
- [ ] export const handleGoogleCallback = async (code: string, userId: number): Promise<void> => {
- [ ]   const { tokens } = await oauth2Client.getToken(code);
- [ ]   await saveTokens(userId, 'google', tokens.access_token, tokens.refresh_token, tokens.expiry_date);
- [ ] }
- [ ] const getValidAccessToken = async (userId: number): Promise<string> => {
- [ ]   const tokens = await loadTokens(userId, 'google');
- [ ]   if (!tokens) throw new Error('No Google Calendar authorization found');
- [ ]   if (Date.now() >= tokens.token_expiry) {
- [ ]     oauth2Client.setCredentials({ refresh_token: decrypt(tokens.refresh_token) });
- [ ]     const { credentials } = await oauth2Client.refreshAccessToken();
- [ ]     await updateTokens(userId, 'google', credentials.access_token, credentials.expiry_date);
- [ ]     return credentials.access_token;
- [ ]   }
- [ ]   return decrypt(tokens.access_token);
- [ ] }
- [ ] export const createGoogleCalendarEvent = async (userId: number, eventData: any): Promise<string> => {
- [ ]   const accessToken = await getValidAccessToken(userId);
- [ ]   oauth2Client.setCredentials({ access_token: accessToken });
- [ ]   const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
- [ ]   const event = {
- [ ]     summary: `Appointment with ${eventData.providerName}`,
- [ ]     description: `Department: ${eventData.departmentName}\nAppointment ID: ${eventData.appointmentId}`,
- [ ]     location: eventData.location,
- [ ]     start: { dateTime: eventData.startTime, timeZone: 'America/New_York' },
- [ ]     end: { dateTime: eventData.endTime, timeZone: 'America/New_York' },
- [ ]     reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 24 * 60 }, { method: 'popup', minutes: 30 }] }
- [ ]   };
- [ ]   const response = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
- [ ]   return response.data.id;
- [ ] }

### Outlook Calendar Service (server/src/services/outlookCalendarService.ts)
- [ ] Import { Client } from '@microsoft/microsoft-graph-client'
- [ ] Import 'isomorphic-fetch' (required for Graph client)
- [ ] Import calendarConfig, encrypt/decrypt utilities
- [ ] Similar structure to Google Calendar service
- [ ] export const getOutlookAuthUrl = (userId: number): string => {
- [ ]   const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${calendarConfig.microsoft.clientId}&response_type=code&redirect_uri=${calendarConfig.microsoft.redirectUri}&scope=${calendarConfig.microsoft.scopes.join(' ')}&state=${userId}`;
- [ ]   return authUrl;
- [ ] }
- [ ] export const handleOutlookCallback = async (code: string, userId: number): Promise<void> => {
- [ ]   const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
- [ ]   const response = await fetch(tokenEndpoint, { method: 'POST', body: new URLSearchParams({ client_id: calendarConfig.microsoft.clientId, client_secret: calendarConfig.microsoft.clientSecret, code, redirect_uri: calendarConfig.microsoft.redirectUri, grant_type: 'authorization_code' }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
- [ ]   const tokens = await response.json();
- [ ]   await saveTokens(userId, 'outlook', tokens.access_token, tokens.refresh_token, Date.now() + tokens.expires_in * 1000);
- [ ] }
- [ ] export const createOutlookCalendarEvent = async (userId: number, eventData: any): Promise<string> => {
- [ ]   const accessToken = await getValidAccessToken(userId); // Similar token refresh logic
- [ ]   const client = Client.init({ authProvider: (done) => { done(null, accessToken); } });
- [ ]   const event = {
- [ ]     subject: `Appointment with ${eventData.providerName}`,
- [ ]     body: { contentType: 'HTML', content: `<p>Department: ${eventData.departmentName}</p><p>Appointment ID: ${eventData.appointmentId}</p>` },
- [ ]     start: { dateTime: eventData.startTime, timeZone: 'Eastern Standard Time' },
- [ ]     end: { dateTime: eventData.endTime, timeZone: 'Eastern Standard Time' },
- [ ]     location: { displayName: eventData.location }
- [ ]   };
- [ ]   const result = await client.api('/me/events').post(event);
- [ ]   return result.id;
- [ ] }

### Unified Calendar Sync Service (server/src/services/calendarSyncService.ts)
- [ ] Import googleCalendarService, outlookCalendarService, auditLogger
- [ ] Import pg Client for database queries
- [ ] const fetchAppointmentForSync = async (appointmentId: number): Promise<any> => {
- [ ]   // Query appointment with all details needed for calendar event
- [ ] }
- [ ] export const syncAppointmentToCalendar = async (appointmentId: number, userId: number, provider: 'google' | 'outlook', retryCount = 0): Promise<{ success: boolean, eventId?: string, error?: string }> => {
- [ ]   try {
- [ ]     const appointment = await fetchAppointmentForSync(appointmentId);
- [ ]     const eventData = {
- [ ]       appointmentId: appointment.id,
- [ ]       providerName: appointment.provider_name,
- [ ]       departmentName: appointment.department_name,
- [ ]       location: appointment.location,
- [ ]       startTime: appointment.appointment_date + 'T' + appointment.start_time,
- [ ]       endTime: appointment.appointment_date + 'T' + appointment.end_time
- [ ]     };
- [ ]     let eventId: string;
- [ ]     if (provider === 'google') {
- [ ]       eventId = await createGoogleCalendarEvent(userId, eventData);
- [ ]     } else if (provider === 'outlook') {
- [ ]       eventId = await createOutlookCalendarEvent(userId, eventData);
- [ ]     } else {
- [ ]       throw new Error(`Unsupported calendar provider: ${provider}`);
- [ ]     }
- [ ]     // Store event ID in appointments table
- [ ]     await updateAppointmentCalendarEvent(appointmentId, eventId, provider);
- [ ]     // Log success
- [ ]     await auditLogger.logSecurityEvent(userId, 'CALENDAR_SYNC_SUCCESS', { appointmentId, provider, eventId }, { ip: '0.0.0.0', userAgent: 'calendar-sync' });
- [ ]     return { success: true, eventId };
- [ ]   } catch (error) {
- [ ]     // Retry logic
- [ ]     if (retryCount < calendarConfig.retries && isRetryableError(error)) {
- [ ]       await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
- [ ]       return syncAppointmentToCalendar(appointmentId, userId, provider, retryCount + 1);
- [ ]     }
- [ ]     // Log failure
- [ ]     await auditLogger.logSecurityEvent(userId, 'CALENDAR_SYNC_FAILED', { appointmentId, provider, error: error.message }, { ip: '0.0.0.0', userAgent: 'calendar-sync' });
- [ ]     return { success: false, error: error.message };
- [ ]   }
- [ ] }
- [ ] const isRetryableError = (error: any): boolean => {
- [ ]   // Network errors, 5xx errors, rate limits
- [ ]   return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.status >= 500;
- [ ] }

### Calendar Routes (server/src/routes/calendar.routes.ts)
- [ ] Import express, calendarController
- [ ] const router = express.Router()
- [ ] router.get('/google/auth', calendarController.initiateGoogleAuth)
- [ ] router.get('/google/callback', calendarController.handleGoogleCallback)
- [ ] router.get('/outlook/auth', calendarController.initiateOutlookAuth)
- [ ] router.get('/outlook/callback', calendarController.handleOutlookCallback)
- [ ] router.post('/sync', authenticate, calendarController.syncToCalendar)
- [ ] export default router

### Calendar Controller (server/src/controllers/calendarController.ts)
- [ ] Import googleCalendarService, outlookCalendarService, calendarSyncService
- [ ] export const initiateGoogleAuth = (req: Request, res: Response) => {
- [ ]   const userId = req.query.user_id; // Or from JWT
- [ ]   const authUrl = getGoogleAuthUrl(userId);
- [ ]   res.json({ authUrl });
- [ ] }
- [ ] export const handleGoogleCallback = async (req: Request, res: Response) => {
- [ ]   const { code, state } = req.query;
- [ ]   const userId = parseInt(state);
- [ ]   await handleGoogleCallback(code, userId);
- [ ]   res.redirect('/patient/settings?calendar=connected');
- [ ] }
- [ ] export const syncToCalendar = async (req: AuthRequest, res: Response) => {
- [ ]   const { appointmentId, provider } = req.body;
- [ ]   const userId = req.user.userId;
- [ ]   const result = await syncAppointmentToCalendar(appointmentId, userId, provider);
- [ ]   if (result.success) {
- [ ]     res.json({ success: true, eventId: result.eventId });
- [ ]   } else {
- [ ]     res.status(500).json({ success: false, error: result.error });
- [ ]   }
- [ ] }

### Update Appointment Controller (server/src/controllers/appointmentController.ts)
- [ ] Import syncAppointmentToCalendar
- [ ] In createAppointment, after email send:
- [ ] // Attempt calendar sync (don't block on failure)
- [ ] if (req.body.syncCalendar && req.body.calendarProvider) {
- [ ]   syncAppointmentToCalendar(newAppointment.id, req.user.userId, req.body.calendarProvider)
- [ ]     .then(result => {
- [ ]       if (!result.success) console.log('Calendar sync failed:', result.error);
- [ ]     })
- [ ]     .catch(err => console.error('Calendar sync error:', err));
- [ ] }
- [ ] Return appointment with calendarSyncStatus: { attempted: true, success: result?.success || false }

### Unit Tests (server/tests/unit/calendarSyncService.test.ts)
- [ ] Mock googleCalendarService and outlookCalendarService
- [ ] Test: "syncAppointmentToCalendar creates Google Calendar event"
- [ ] Test: "syncAppointmentToCalendar creates Outlook Calendar event"
- [ ] Test: "stores calendar event ID in database"
- [ ] Test: "retries on transient failures (2 attempts)"
- [ ] Test: "returns error after all retries exhausted"
- [ ] Test: "logs success to audit_logs"
- [ ] Test: "logs failure to audit_logs"

### Validation and Testing
- [ ] Set up OAuth credentials in Google Cloud Console and Azure AD
- [ ] Run migration: calendar_tokens table created
- [ ] Start server with OAuth environment variables
- [ ] Initiate Google auth: GET /api/calendar/google/auth?user_id=1 → returns authUrl
- [ ] Complete OAuth flow in browser → callback stores tokens
- [ ] Verify tokens stored in calendar_tokens table (encrypted)
- [ ] Create appointment, sync to Google Calendar
- [ ] Verify event appears in Google Calendar
- [ ] Test Outlook sync: Same process for Microsoft
- [ ] Test token refresh: Expire token, make sync call → auto-refreshes
- [ ] Test sync failure: Invalid token → booking completes, error logged
- [ ] Run unit tests: npm test -- calendarSyncService.test.ts → all pass
