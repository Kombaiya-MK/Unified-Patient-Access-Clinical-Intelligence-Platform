# Task - TASK_004_FE_CALENDAR_SYNC_UI

## Requirement Reference
- User Story: US_017  
- Story Location: `.propel/context/tasks/us_017/us_017.md`
- Acceptance Criteria:
    - AC2: Users select calendar provider (Google Calendar or Microsoft Outlook) on first booking
    - AC2: Upon selection, OAuth consent screen opens in popup window
    - AC2: After authorization, future appointments automatically sync to user's calendar
    - AC2: Settings page: Button to connect/disconnect calendar sync
    - AC2: Settings page: Shows current sync status (Connected to Google/Outlook, or Not Connected)
- Frontend Behavior:
    - Calendar selection modal appears after clicking "Book Appointment" on first booking
    - Modal has option to skip if user doesn't want sync
    - OAuth flow opens in popup window (400x600px)
    - Window polls for completion, closes automatically after callback
    - Calendar status displays in settings page with connect/disconnect button
    - Error handling: Display user-friendly messages for auth failures

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | Inferred from AC |
| **Wireframe Type** | Acceptance Criteria |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | Use existing design system |

> **Note**: Using existing design system from US_001-US_016

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Fetch API | Native |
| Backend | Express | 4.x |
| Backend | Node.js | 20.x |

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

> **Note**: Frontend UI - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Web application only

## Task Overview
Implement frontend UI for calendar synchronization. Components: (1) CalendarSyncModal - Appears after booking confirmation when calendar_sync_enabled=false. Displays: "Connect Your Calendar" heading, description "Automatically add appointments to your calendar", two provider buttons (Google Calendar with Google icon, Microsoft Outlook with Outlook icon), "Skip for now" option. (2) useCalendarAuth hook - Manages OAuth popup flow. Opens 400x600px centered popup window with /api/calendar/auth/:provider URL, polls window.closed every 500ms, listens for window.postMessage from callback page, closes popup on success/error. (3) CalendarSyncSettings component - Settings page section displaying current sync status. Shows: "Calendar Sync" heading, status badge (Connected to Google/Outlook or Not Connected), connect button (if not connected), disconnect button (if connected), last sync timestamp. (4) Integration with booking flow - BookingConfirmationPage checks patient.calendar_sync_enabled, shows CalendarSyncModal if false. (5) Error handling: Display toast notifications for auth errors, token refresh errors.

## Dependent Tasks
- US_017 TASK_002: OAuth2 endpoints must be implemented
- US_013 TASK_001: Booking confirmation page must exist
- US_002 TASK_001: Settings page structure must exist

## Impacted Components
**Modified:**
- client/src/pages/BookingConfirmation.tsx (Add calendar sync modal)
- client/src/pages/Settings.tsx (Add calendar sync section)

**New:**
- client/src/components/CalendarSyncModal.tsx (Modal for provider selection)
- client/src/hooks/useCalendarAuth.tsx (OAuth popup flow logic)
- client/src/components/CalendarSyncSettings.tsx (Settings page component)
- client/src/utils/calendarSync.ts (Helper functions)

## Implementation Plan
1. **Calendar Sync Modal**: Create modal component with provider selection
2. **OAuth Popup Hook**: Implement hook for managing popup window and callbacks
3. **Calendar Settings**: Create settings page component for status and disconnect
4. **Booking Integration**: Add modal trigger after first booking
5. **Error Handling**: Toast notifications for failures
6. **OAuth Window Communication**: postMessage between popup and parent
7. **Loading States**: Show loading during OAuth flow
8. **WCAG Compliance**: Keyboard navigation, ARIA labels, focus management
9. **Testing**: Unit tests for components, integration tests for OAuth flow

## Current Project State
```
ASSIGNMENT/
├── client/                  # Frontend (US_001)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── BookingConfirmation.tsx (US_013 TASK_001)
│   │   │   └── Settings.tsx (US_002 TASK_001)
│   │   ├── components/
│   │   └── hooks/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | client/src/components/CalendarSyncModal.tsx | Provider selection modal |
| CREATE | client/src/hooks/useCalendarAuth.tsx | OAuth popup management hook |
| CREATE | client/src/components/CalendarSyncSettings.tsx | Settings page sync status |
| CREATE | client/src/utils/calendarSync.ts | Calendar sync helpers |
| MODIFY | client/src/pages/BookingConfirmation.tsx | Add modal trigger |
| MODIFY | client/src/pages/Settings.tsx | Add calendar sync section |

> 2 modified files, 4 new files created

## External References
- [OAuth 2.0 Best Practices - Popup Flow](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1)
- [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
- [WCAG 2.2 Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Build Commands
```bash
# Start frontend
cd client
npm run dev

# Navigate to booking flow
# Book an appointment (if first booking)
# Expected: CalendarSyncModal appears after booking confirmation

# Select Google Calendar or Microsoft Outlook
# Expected: Popup window opens (400x600px) with OAuth consent screen

# Authorize in popup
# Expected: Popup closes, modal shows success, calendar connected

# Navigate to Settings page
# Expected: "Calendar Sync" section shows "Connected to Google"

# Click "Disconnect"
# Expected: Confirmation dialog, then status changes to "Not Connected"

# Book another appointment (after connecting calendar)
# Expected: No modal shown, appointment automatically synced

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] CalendarSyncModal appears after first booking completion
- [ ] Modal displays: heading, description, Google Calendar button, Outlook button, "Skip" option
- [ ] OAuth popup opens (400x600px, centered) when provider selected
- [ ] Popup has focus, parent window waits
- [ ] postMessage received from callback page closes popup
- [ ] Success message displayed after authorization
- [ ] CalendarSyncSettings component in settings page
- [ ] Status badge shows "Connected to [Provider]" or "Not Connected"
- [ ] Connect button visible when not connected
- [ ] Disconnect button visible when connected
- [ ] Disconnect triggers confirmation dialog
- [ ] After disconnect, status updates to "Not Connected"
- [ ] After connection, future bookings skip modal
- [ ] Error toast displayed on auth failure
- [ ] WCAG 2.2 AA compliant: keyboard navigation, ARIA roles, focus trap

## Implementation Checklist

### Calendar Sync Modal (client/src/components/CalendarSyncModal.tsx)
- [ ] Import: React, useState, useCalendarAuth, Button, Modal, Icons
- [ ] interface CalendarSyncModalProps {
- [ ]   isOpen: boolean;
- [ ]   onClose: () => void;
- [ ]   onSuccess: () => void;
- [ ] }
- [ ] export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({ isOpen, onClose, onSuccess }) => {
- [ ]   const { initiateAuth, isLoading, error } = useCalendarAuth();
- [ ]   const handleGoogleAuth = async () => {
- [ ]     try {
- [ ]       await initiateAuth('google');
- [ ]       onSuccess();
- [ ]     } catch (error) {
- [ ]       console.error('Google auth failed:', error);
- [ ]     }
- [ ]   };
- [ ]   const handleMicrosoftAuth = async () => {
- [ ]     try {
- [ ]       await initiateAuth('outlook');
- [ ]       onSuccess();
- [ ]     } catch (error) {
- [ ]       console.error('Microsoft auth failed:', error);
- [ ]     }
- [ ]   };
- [ ]   return (
- [ ]     <Modal isOpen={isOpen} onClose={onClose} aria-labelledby="calendar-sync-title" role="dialog">
- [ ]       <div className="calendar-sync-modal">
- [ ]         <h2 id="calendar-sync-title">Connect Your Calendar</h2>
- [ ]         <p>Automatically add your appointments to your calendar. We'll send reminders 24 hours before.</p>
- [ ]         <div className="provider-buttons">
- [ ]           <button
- [ ]             onClick={handleGoogleAuth}
- [ ]             disabled={isLoading}
- [ ]             aria-label="Connect Google Calendar"
- [ ]             className="provider-button google"
- [ ]           >
- [ ]             <GoogleIcon />
- [ ]             <span>Google Calendar</span>
- [ ]           </button>
- [ ]           <button
- [ ]             onClick={handleMicrosoftAuth}
- [ ]             disabled={isLoading}
- [ ]             aria-label="Connect Microsoft Outlook"
- [ ]             className="provider-button outlook"
- [ ]           >
- [ ]             <OutlookIcon />
- [ ]             <span>Microsoft Outlook</span>
- [ ]           </button>
- [ ]         </div>
- [ ]         {error && <div className="error-message" role="alert">{error}</div>}
- [ ]         <button onClick={onClose} className="skip-button">Skip for now</button>
- [ ]       </div>
- [ ]     </Modal>
- [ ]   );
- [ ] };

### Calendar Auth Hook (client/src/hooks/useCalendarAuth.tsx)
- [ ] Import: useState, useEffect
- [ ] interface UseCalendarAuthReturn {
- [ ]   initiateAuth: (provider: 'google' | 'outlook') => Promise<void>;
- [ ]   isLoading: boolean;
- [ ]   error: string | null;
- [ ] }
- [ ] export const useCalendarAuth = (): UseCalendarAuthReturn => {
- [ ]   const [isLoading, setIsLoading] = useState(false);
- [ ]   const [error, setError] = useState<string | null>(null);
- [ ]   const initiateAuth = async (provider: 'google' | 'outlook') => {
- [ ]     setIsLoading(true);
- [ ]     setError(null);
- [ ]     try {
- [ ]       const authUrl = `${process.env.REACT_APP_API_BASE_URL}/api/calendar/auth/${provider}`;
- [ ]       const width = 400;
- [ ]       const height = 600;
- [ ]       const left = (window.screen.width - width) / 2;
- [ ]       const top = (window.screen.height - height) / 2;
- [ ]       const popup = window.open(
- [ ]         authUrl,
- [ ]         `${provider}Auth`,
- [ ]         `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,menubar=no`
- [ ]       );
- [ ]       if (!popup) {
- [ ]         throw new Error('Popup blocked. Please allow popups for this site.');
- [ ]       }
- [ ]       // Poll for window closed or message
- [ ]       return new Promise((resolve, reject) => {
- [ ]         const messageListener = (event: MessageEvent) => {
- [ ]           if (event.origin !== window.location.origin) return;
- [ ]           if (event.data.type === 'CALENDAR_AUTH_SUCCESS') {
- [ ]             popup?.close();
- [ ]             window.removeEventListener('message', messageListener);
- [ ]             clearInterval(pollTimer);
- [ ]             setIsLoading(false);
- [ ]             resolve();
- [ ]           } else if (event.data.type === 'CALENDAR_AUTH_ERROR') {
- [ ]             popup?.close();
- [ ]             window.removeEventListener('message', messageListener);
- [ ]             clearInterval(pollTimer);
- [ ]             setIsLoading(false);
- [ ]             setError(event.data.error || 'Authorization failed');
- [ ]             reject(new Error(event.data.error));
- [ ]           }
- [ ]         };
- [ ]         window.addEventListener('message', messageListener);
- [ ]         // Poll for popup closed (user closed manually)
- [ ]         const pollTimer = setInterval(() => {
- [ ]           if (popup.closed) {
- [ ]             window.removeEventListener('message', messageListener);
- [ ]             clearInterval(pollTimer);
- [ ]             setIsLoading(false);
- [ ]             setError('Authorization cancelled');
- [ ]             reject(new Error('Authorization cancelled'));
- [ ]           }
- [ ]         }, 500);
- [ ]       });
- [ ]     } catch (error) {
- [ ]       setIsLoading(false);
- [ ]       setError(error.message);
- [ ]       throw error;
- [ ]     }
- [ ]   };
- [ ]   return { initiateAuth, isLoading, error };
- [ ] };

### Calendar Sync Settings (client/src/components/CalendarSyncSettings.tsx)
- [ ] Import: React, useState, useEffect, Button, Badge
- [ ] interface CalendarSyncStatus {
- [ ]   enabled: boolean;
- [ ]   provider: 'google' | 'outlook' | null;
- [ ]   lastSyncedAt: string | null;
- [ ] }
- [ ] export const CalendarSyncSettings: React.FC = () => {
- [ ]   const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
- [ ]   const [isLoading, setIsLoading] = useState(true);
- [ ]   const { initiateAuth } = useCalendarAuth();
- [ ]   useEffect(() => {
- [ ]     fetchSyncStatus();
- [ ]   }, []);
- [ ]   const fetchSyncStatus = async () => {
- [ ]     try {
- [ ]       const response = await fetch('/api/calendar/status', {
- [ ]         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
- [ ]       });
- [ ]       const data = await response.json();
- [ ]       setSyncStatus(data);
- [ ]     } catch (error) {
- [ ]       console.error('Failed to fetch sync status:', error);
- [ ]     } finally {
- [ ]       setIsLoading(false);
- [ ]     }
- [ ]   };
- [ ]   const handleConnect = async (provider: 'google' | 'outlook') => {
- [ ]     try {
- [ ]       await initiateAuth(provider);
- [ ]       await fetchSyncStatus();
- [ ]     } catch (error) {
- [ ]       console.error('Connection failed:', error);
- [ ]     }
- [ ]   };
- [ ]   const handleDisconnect = async () => {
- [ ]     if (!window.confirm('Disconnect your calendar? You can reconnect anytime.')) return;
- [ ]     try {
- [ ]       await fetch('/api/calendar/disconnect', {
- [ ]         method: 'DELETE',
- [ ]         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
- [ ]       });
- [ ]       await fetchSyncStatus();
- [ ]     } catch (error) {
- [ ]       console.error('Disconnect failed:', error);
- [ ]     }
- [ ]   };
- [ ]   if (isLoading) return <div>Loading...</div>;
- [ ]   return (
- [ ]     <div className="calendar-sync-settings">
- [ ]       <h3>Calendar Sync</h3>
- [ ]       <div className="sync-status">
- [ ]         {syncStatus?.enabled ? (
- [ ]           <>
- [ ]             <Badge variant="success">Connected to {syncStatus.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}</Badge>
- [ ]             {syncStatus.lastSyncedAt && (
- [ ]               <p className="last-synced">Last synced: {new Date(syncStatus.lastSyncedAt).toLocaleString()}</p>
- [ ]             )}
- [ ]             <button onClick={handleDisconnect} className="disconnect-button">Disconnect</button>
- [ ]           </>
- [ ]         ) : (
- [ ]           <>
- [ ]             <Badge variant="neutral">Not Connected</Badge>
- [ ]             <p>Connect your calendar to automatically sync appointments.</p>
- [ ]             <div className="connect-buttons">
- [ ]               <button onClick={() => handleConnect('google')} className="connect-button">
- [ ]                 <GoogleIcon /> Connect Google Calendar
- [ ]               </button>
- [ ]               <button onClick={() => handleConnect('outlook')} className="connect-button">
- [ ]                 <OutlookIcon /> Connect Microsoft Outlook
- [ ]               </button>
- [ ]             </div>
- [ ]           </>
- [ ]         )}
- [ ]       </div>
- [ ]     </div>
- [ ]   );
- [ ] };

### Calendar Sync Utilities (client/src/utils/calendarSync.ts)
- [ ] export const openOAuthPopup = (url: string, windowName: string) => {
- [ ]   const width = 400;
- [ ]   const height = 600;
- [ ]   const left = (window.screen.width - width) / 2;
- [ ]   const top = (window.screen.height - height) / 2;
- [ ]   return window.open(
- [ ]     url,
- [ ]     windowName,
- [ ]     `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,menubar=no`
- [ ]   );
- [ ] };
- [ ] export const sendAuthMessage = (type: 'success' | 'error', data?: any) => {
- [ ]   if (window.opener) {
- [ ]     window.opener.postMessage({
- [ ]       type: type === 'success' ? 'CALENDAR_AUTH_SUCCESS' : 'CALENDAR_AUTH_ERROR',
- [ ]       ...data
- [ ]     }, window.location.origin);
- [ ]   }
- [ ] };

### Integrate with Booking Confirmation (client/src/pages/BookingConfirmation.tsx)
- [ ] Import: CalendarSyncModal, useState, useEffect
- [ ] const [showCalendarModal, setShowCalendarModal] = useState(false);
- [ ] useEffect(() => {
- [ ]   // Check if calendar sync already enabled
- [ ]   const checkCalendarSync = async () => {
- [ ]     try {
- [ ]       const response = await fetch('/api/calendar/status', {
- [ ]         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
- [ ]       });
- [ ]       const data = await response.json();
- [ ]       if (!data.enabled) {
- [ ]         setShowCalendarModal(true);
- [ ]       }
- [ ]     } catch (error) {
- [ ]       console.error('Failed to check calendar status:', error);
- [ ]     }
- [ ]   };
- [ ]   checkCalendarSync();
- [ ] }, []);
- [ ] const handleCalendarSyncSuccess = () => {
- [ ]   setShowCalendarModal(false);
- [ ]   // Optionally show success toast
- [ ] };
- [ ] // In JSX
- [ ] <CalendarSyncModal
- [ ]   isOpen={showCalendarModal}
- [ ]   onClose={() => setShowCalendarModal(false)}
- [ ]   onSuccess={handleCalendarSyncSuccess}
- [ ] />

### Integrate with Settings Page (client/src/pages/Settings.tsx)
- [ ] Import: CalendarSyncSettings
- [ ] // Add section after other settings
- [ ] <section className="settings-section">
- [ ]   <CalendarSyncSettings />
- [ ] </section>

### OAuth Callback Page (client/src/pages/OAuthCallback.tsx)
- [ ] Import: useEffect, useSearchParams, sendAuthMessage
- [ ] export const OAuthCallback: React.FC = () => {
- [ ]   const [searchParams] = useSearchParams();
- [ ]   useEffect(() => {
- [ ]     const error = searchParams.get('error');
- [ ]     const success = searchParams.get('success');
- [ ]     if (error) {
- [ ]       sendAuthMessage('error', { error });
- [ ]       window.close();
- [ ]     } else if (success) {
- [ ]       sendAuthMessage('success');
- [ ]       window.close();
- [ ]     }
- [ ]   }, [searchParams]);
- [ ]   return (
- [ ]     <div className="oauth-callback">
- [ ]       <p>Completing authorization...</p>
- [ ]     </div>
- [ ]   );
- [ ] };

### Backend Callback Endpoint Update (server/src/routes/calendarAuthRoutes.ts)
- [ ] // After successful OAuth token exchange
- [ ] // Redirect to callback page with success flag
- [ ] res.redirect(`${process.env.CLIENT_URL}/oauth/callback?success=true`);
- [ ] // On error
- [ ] res.redirect(`${process.env.CLIENT_URL}/oauth/callback?error=${encodeURIComponent(error.message)}`);

### Backend Status Endpoint (server/src/routes/calendarAuthRoutes.ts)
- [ ] router.get('/status', authenticateToken, async (req, res) => {
- [ ]   try {
- [ ]     const result = await pool.query(
- [ ]       'SELECT calendar_sync_enabled, calendar_provider FROM patients WHERE id = $1',
- [ ]       [req.user.patientId]
- [ ]     );
- [ ]     const patient = result.rows[0];
- [ ]     // Get last synced appointment
- [ ]     const lastSyncResult = await pool.query(
- [ ]       'SELECT calendar_synced_at FROM appointments WHERE patient_id = $1 AND calendar_synced_at IS NOT NULL ORDER BY calendar_synced_at DESC LIMIT 1',
- [ ]       [req.user.patientId]
- [ ]     );
- [ ]     res.json({
- [ ]       enabled: patient.calendar_sync_enabled || false,
- [ ]       provider: patient.calendar_provider,
- [ ]       lastSyncedAt: lastSyncResult.rows[0]?.calendar_synced_at || null
- [ ]     });
- [ ]   } catch (error) {
- [ ]     res.status(500).json({ error: 'Failed to fetch sync status' });
- [ ]   }
- [ ] });

### Styling (client/src/components/CalendarSyncModal.css)
- [ ] .calendar-sync-modal {
- [ ]   max-width: 500px;
- [ ]   padding: 32px;
- [ ]   text-align: center;
- [ ] }
- [ ] .provider-buttons {
- [ ]   display: flex;
- [ ]   gap: 16px;
- [ ]   margin: 24px 0;
- [ ] }
- [ ] .provider-button {
- [ ]   flex: 1;
- [ ]   display: flex;
- [ ]   align-items: center;
- [ ]   gap: 8px;
- [ ]   padding: 12px 16px;
- [ ]   border: 2px solid #e0e0e0;
- [ ]   border-radius: 8px;
- [ ]   background: white;
- [ ]   cursor: pointer;
- [ ]   transition: all 0.2s;
- [ ] }
- [ ] .provider-button:hover:not(:disabled) {
- [ ]   border-color: #4285f4;
- [ ]   box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2);
- [ ] }
- [ ] .provider-button:disabled {
- [ ]   opacity: 0.5;
- [ ]   cursor: not-allowed;
- [ ] }
- [ ] .skip-button {
- [ ]   color: #666;
- [ ]   background: none;
- [ ]   border: none;
- [ ]   text-decoration: underline;
- [ ]   cursor: pointer;
- [ ] }

### WCAG Compliance
- [ ] Modal has role="dialog" and aria-labelledby
- [ ] Provider buttons have descriptive aria-label attributes
- [ ] Focus trapped within modal when open (Tab navigation cycles within modal)
- [ ] Escape key closes modal
- [ ] Error messages have role="alert" for screen reader announcement
- [ ] Connect/disconnect buttons have clear labels
- [ ] Status badge has accessible text
- [ ] Confirmation dialog for disconnect action
- [ ] Keyboard navigation: Tab, Enter, Escape keys work correctly

### Testing Checklist
- [ ] Unit test: CalendarSyncModal renders correctly
- [ ] Unit test: useCalendarAuth initiateAuth opens popup
- [ ] Unit test: postMessage received closes popup
- [ ] Unit test: CalendarSyncSettings displays status
- [ ] Integration test: Booking → Modal appears → Select provider → Popup opens
- [ ] Integration test: OAuth success → Popup closes → Modal updates
- [ ] Integration test: Settings page → Connect → Auth flow → Status updates
- [ ] Integration test: Disconnect → Confirmation → Status updates
- [ ] E2E test: Complete flow from booking to calendar connection
- [ ] Accessibility test: Keyboard navigation, screen reader compatibility
