# Task - TASK_001_BE_CALENDAR_SYNC_INTEGRATION

## Requirement Reference
- User Story: US_017
- Story Location: `.propel/context/tasks/us_017/us_017.md`
- Acceptance Criteria:
    - AC1: OAuth2 PKCE flow for Google/Outlook calendar access, creates/updates/deletes calendar events on booking/reschedule/cancel, logs sync status, retries 2 times with exponential backoff
- Edge Cases:
    - OAuth token expires: Detect 401, mark calendar_sync_enabled=false, notify patient "Calendar sync disconnected"
    - Initial provider selection: Modal on first booking "Sync to calendar?" with Google + Outlook buttons
    - Rate limit exceeded: Queue sync operations in Redis, batch process every 5 min

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (OAuth modal + sync status indicator) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-002 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | SCR-002 (Dashboard with sync status), OAuth modal (first booking) |
| **UXR Requirements** | UXR-001 (Quick authorization), UXR-502 (Clear error messages) |
| **Design Tokens** | Google button: white bg + Google logo, Outlook button: blue #0078D4 + Outlook logo, Sync indicator: green checkmark icon |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | googleapis | 118.x (Google Calendar API) |
| Backend | @microsoft/microsoft-graph-client | 3.x (Outlook) |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive OAuth flow) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement calendar sync: (1) Frontend OAuth modal on first booking (Google/Outlook buttons), (2) Backend OAuth2 PKCE flow handlers (GET /auth/calendar/google, GET /auth/calendar/outlook callbacks), (3) Token storage in users table (calendar_provider, calendar_access_token, calendar_refresh_token), (4) CalendarService: createEvent, updateEvent, deleteEvent with retry logic, (5) Integration hooks in booking/reschedule/cancel APIs, (6) Rate limit handling (queue in Redis, batch process), (7) Token refresh on 401 errors. Supports Google Calendar API + Microsoft Graph API.

## Dependent Tasks
- US_009 Task 001: Authentication (OAuth flow patterns)
- US_013 Task 002: Booking API (trigger calendar sync)
- US_014 Task 002: Reschedule API (trigger calendar update)

## Impacted Components
**New:**
- app/src/components/CalendarSyncModal.tsx (OAuth provider selection modal)
- server/src/routes/calendar.routes.ts (OAuth callbacks)
- server/src/services/calendar.service.ts (Google/Outlook API integration)
- server/src/config/oauth.ts (OAuth client IDs + secrets)
- server/db/schema.sql (Add calendar_* columns to users table)

## Implementation Plan
1. Add columns to users: calendar_provider, calendar_access_token, calendar_refresh_token, calendar_sync_enabled
2. Register OAuth apps: Google Cloud Console + Microsoft Azure AD, get client IDs
3. Implement OAuth flow: GET /auth/calendar/google → redirect to Google consent → callback saves tokens
4. Implement CalendarService: createEvent, updateEvent, deleteEvent for Google Calendar API + Microsoft Graph API
5. Add retry logic: 2 attempts with exponential backoff (5s, 15s)
6. Token refresh: On 401, use refresh_token to get new access_token
7. Integrate with booking: After successful booking, call calendarService.createEvent
8. Rate limit handling: Queue operations in Redis, process batch every 5 min
9. Frontend modal: Show on first booking, allow provider selection
10. Sync status indicator: Green checkmark on appointment cards if synced

## Current Project State
```
ASSIGNMENT/
├── app/src/ (booking UI exists)
├── server/src/
│   ├── services/appointments.service.ts (booking logic exists)
│   └── (calendar service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/CalendarSyncModal.tsx | OAuth provider selection UI |
| CREATE | server/src/routes/calendar.routes.ts | OAuth flow routes |
| CREATE | server/src/services/calendar.service.ts | Google/Outlook API integration |
| CREATE | server/src/config/oauth.ts | OAuth client configuration |
| UPDATE | server/db/schema.sql | Add calendar columns to users |
| UPDATE | server/package.json | Add googleapis, @microsoft/microsoft-graph-client |
| UPDATE | server/.env.example | Add GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID |

## External References
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Microsoft Graph Calendar](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [OAuth2 PKCE Flow](https://oauth.net/2/pkce/)
- [TR-018 Calendar Integration](../../../.propel/context/docs/spec.md#TR-018)

## Build Commands
```bash
cd server
npm install googleapis @microsoft/microsoft-graph-client
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: calendarService.createEvent calls Google Calendar API
- [ ] Integration tests: Book appointment → calendar event created in Google Calendar
- [ ] googleapis installed: package.json shows googleapis@118.x
- [ ] OAuth modal displays: First booking → see "Sync to calendar?" modal
- [ ] Google OAuth flow: Click Google → redirect to consent → callback saves tokens
- [ ] Outlook OAuth flow: Click Outlook → redirect to Microsoft → callback saves tokens
- [ ] Calendar event created: Book appointment → verify event in Google/Outlook calendar
- [ ] Event update: Reschedule → calendar event updated with new time
- [ ] Event deletion: Cancel appointment → calendar event deleted
- [ ] Token refresh: Simulate 401 → verify refresh_token used to get new access_token
- [ ] Retry logic: Simulate API failure → verify 2 retry attempts logged
- [ ] Rate limit handling: Book 100 appointments → verify queued and batched
- [ ] Sync status: Dashboard appointment card shows green checkmark if synced

## Implementation Checklist
- [ ] Install calendar APIs: `npm install googleapis @microsoft/microsoft-graph-client`
- [ ] Register OAuth apps (Google Cloud Console + Azure AD)
- [ ] Add calendar columns to users table
- [ ] Implement OAuth routes and callback handlers
- [ ] Implement calendarService with Google + Outlook methods
- [ ] Integrate with booking/reschedule/cancel APIs
- [ ] Create CalendarSyncModal frontend component
- [ ] Test OAuth flow + calendar event creation
- [ ] Document calendar integration setup
