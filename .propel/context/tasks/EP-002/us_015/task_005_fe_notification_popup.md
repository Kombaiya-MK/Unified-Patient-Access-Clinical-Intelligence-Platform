# Task - TASK_005_FE_NOTIFICATION_POPUP

## Requirement Reference
- User Story: US_015  
- Story Location: `.propel/context/tasks/us_015/us_015.md`
- Acceptance Criteria:
    - AC1: When slot becomes available, display notification (email + dashboard popup) "Your preferred slot [date/time] is now available! Click to book (expires in 2 hours)"
- Edge Cases:
    - Multiple notifications: Stack them vertically, dismiss individually
    - User already on another page: Notification persists across navigation

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-002 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | SCR-002 (Patient Dashboard) |
| **UXR Requirements** | UXR-401 (Fast notification), FR-023 (Notification popup) |
| **Design Tokens** | Blue background, white text, Book Now button |

> **Wireframe Components:**
> - Notification popup: Blue box, top-right corner, stacked vertically
> - Content: Title "Appointment Available!", message with date/time, countdown timer
> - Actions: "Book Now" button (green), "Dismiss" button (gray), "x" close icon

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Axios | 1.x |
| Backend | N/A | N/A |
| Database | N/A | N/A |

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

> **Note**: UI component only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive web) |
| **Platform Target** | Web (Mobile-first) |
| **Min OS Version** | N/A |
| **Mobile Framework** | Responsive CSS |

> **Note**: Mobile-first responsive notifications

## Task Overview
Implement real-time notification popup system for waitlist slot availability. Poll notifications API (GET /api/notifications) every 30 seconds for unread notifications. When new 'waitlist_available' notification received: Display NotificationPopup component in top-right corner with blue background, slot details (date/time), countdown timer showing minutes until expiration (2 hours from notified_at), "Book Now" button (navigates to booking page with auto-filled slot), "Dismiss" button (marks notification as read), close icon. Stack multiple notifications vertically. Persist across page navigation using NotificationContext. Implement countdown timer that updates every minute. Auto-dismiss when hold expires (countdown reaches 0). Mark as read when dismissed or booking page clicked. WCAG 2.2 AA compliance: keyboard navigation, ARIA live region for screen readers, 4.5:1 contrast ratio.

## Dependent Tasks
- US_015 TASK_004: Notifications table and API must exist

## Impacted Components
**Modified:**
- app/src/App.tsx (Add NotificationProvider wrapper)

**New:**
- app/src/components/notifications/NotificationPopup.tsx (Popup component)
- app/src/components/notifications/NotificationCenter.tsx (Manages multiple popups)
- app/src/context/NotificationContext.tsx (Global notification state)
- app/src/hooks/useNotifications.ts (Polling and API integration)
- app/src/api/notificationsApi.ts (API endpoints)
- app/src/styles/Notifications.module.css (Notification styling)

## Implementation Plan
1. **Notifications API**: Create GET /api/notifications, PUT /api/notifications/:id/read endpoints
2. **Polling Hook**: useNotifications hook polls every 30 seconds for unread notifications
3. **Notification Context**: Global state for managing notification list
4. **Notification Popup**: Component displaying slot details, countdown, actions
5. **Countdown Timer**: Calculate minutes remaining (expires_at - NOW()), update every minute
6. **Book Now Button**: Navigate to booking page with query params (?date=X&time=Y&auto_fill=true)
7. **Dismiss Button**: Call API to mark as read, remove from UI
8. **Notification Center**: Container component stacking multiple popups
9. **Auto-Dismiss**: Remove notification when countdown reaches 0
10. **Persistence**: Notifications persist across page navigation using context
11. **Accessibility**: ARIA live region, role="alert", keyboard navigation

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   └── waitlist/
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── AppointmentContext.tsx
│   │   │   └── WaitlistContext.tsx
│   │   └── hooks/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/routes/notificationRoutes.ts | Notification API routes |
| CREATE | server/src/controllers/notificationController.ts | Get, mark read controllers |
| CREATE | app/src/components/notifications/NotificationPopup.tsx | Individual notification popup |
| CREATE | app/src/components/notifications/NotificationCenter.tsx | Container for multiple popups |
| CREATE | app/src/context/NotificationContext.tsx | Global notification state |
| CREATE | app/src/hooks/useNotifications.ts | Polling and API hook |
| CREATE | app/src/api/notificationsApi.ts | API client functions |
| CREATE | app/src/styles/Notifications.module.css | Notification styles |
| MODIFY | app/src/App.tsx | Add NotificationProvider, NotificationCenter |
| MODIFY | server/src/routes/index.ts | Register notification routes |

> 2 modified files, 8 new files created

## External References
- [ARIA Live Regions](https://www.w3.org/WAI/ARIA/apg/practices/aria-live-regions/)
- [React Polling Patterns](https://dmitripavlutin.com/react-useeffect-polling/)
- [Notification Best Practices](https://www.nngroup.com/articles/notifications/)

## Build Commands
```bash
# Start development servers
cd server
npm run dev

cd app
npm start

# Test notification flow
# 1. Login as Patient A, navigate to dashboard
# 2. In separate session: Patient A joins waitlist for 2026-03-25 10:00
# 3. In another session: Patient B cancels appointment for 2026-03-25 10:00
# Expected: Within 5 minutes (polling cycle), notification popup appears top-right

# Expected popup content:
# - Title: "Appointment Available!"
# - Message: "Your preferred slot March 25, 2026 at 10:00 AM is now available!"
# - Countdown: "Expires in: 119 minutes"
# - Book Now button (green)
# - Dismiss button (gray)
# - × close icon

# Test Book Now
# Click "Book Now" button
# Expected: Navigate to /patient/book-appointment?date=2026-03-25&time=10:00:00&auto_fill=true
# Expected: Booking form auto-filled with slot details
# Expected: Notification marked as read, removed from UI

# Test Dismiss
# Click "Dismiss" button
# Expected: Notification removed from UI, marked as read in database

# Test countdown
# Wait 1 minute
# Expected: Countdown updates: "Expires in: 118 minutes"

# Test expiration
# Manually set expires_at to NOW() + 1 minute
# Wait 2 minutes
# Expected: Notification auto-dismissed

# Test multiple notifications
# Create multiple waitlist entries, trigger multiple notifications
# Expected: Notifications stack vertically, each dismissible independently

# Test persistence
# With notification visible, navigate to different page
# Expected: Notification persists across navigation

# Test accessibility
# Tab to notification, Enter on Book Now/Dismiss
# Screen reader: Announces notification content

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Polling hook requests /api/notifications every 30 seconds
- [ ] New unread notifications added to notification state
- [ ] NotificationPopup displays in top-right corner
- [ ] Popup shows slot date, time, countdown timer
- [ ] Countdown calculates: (expires_at - NOW()) / 60 in minutes
- [ ] Countdown updates every minute
- [ ] "Book Now" button navigates with query params
- [ ] Booking page auto-fills slot from query params
- [ ] Click "Book Now" marks notification as read
- [ ] "Dismiss" button calls PUT /api/notifications/:id/read
- [ ] Dismiss removes notification from UI
- [ ] Auto-dismiss when countdown reaches 0
- [ ] Multiple notifications stack vertically
- [ ] Notifications persist across page navigation
- [ ] ARIA live region announces new notifications
- [ ] Keyboard accessible: Tab, Enter/Space to activate buttons

## Implementation Checklist

### Backend: Notification Routes (server/src/routes/notificationRoutes.ts)
- [ ] Import: Router, authenticate, getNotifications, markNotificationRead
- [ ] const router = Router();
- [ ] router.get('/', authenticate, getNotifications);
- [ ] router.put('/:id/read', authenticate, markNotificationRead);
- [ ] export default router;

### Backend: Notification Controller (server/src/controllers/notificationController.ts)
- [ ] Import: Request, Response, pool (pg)
- [ ] export const getNotifications = async (req: Request, res: Response) => {
- [ ]   try {
- [ ]     const user_id = req.user.id;
- [ ]     const result = await pool.query(
- [ ]       'SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC',
- [ ]       [user_id]
- [ ]     );
- [ ]     res.status(200).json(result.rows);
- [ ]   } catch (error) {
- [ ]     console.error('Get notifications error:', error);
- [ ]     res.status(500).json({ error: 'Failed to retrieve notifications' });
- [ ]   }
- [ ] };
- [ ] export const markNotificationRead = async (req: Request, res: Response) => {
- [ ]   try {
- [ ]     const notification_id = parseInt(req.params.id);
- [ ]     const user_id = req.user.id;
- [ ]     // Verify ownership
- [ ]     const ownershipCheck = await pool.query('SELECT user_id FROM notifications WHERE id = $1', [notification_id]);
- [ ]     if (ownershipCheck.rows.length === 0) {
- [ ]       return res.status(404).json({ error: 'Notification not found' });
- [ ]     }
- [ ]     if (ownershipCheck.rows[0].user_id !== user_id) {
- [ ]       return res.status(403).json({ error: 'Unauthorized' });
- [ ]     }
- [ ]     await pool.query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1', [notification_id]);
- [ ]     res.status(200).json({ message: 'Notification marked as read' });
- [ ]   } catch (error) {
- [ ]     console.error('Mark read error:', error);
- [ ]     res.status(500).json({ error: 'Failed to mark notification as read' });
- [ ]   }
- [ ] };

### Update Server Routes (server/src/routes/index.ts)
- [ ] Import: notificationRoutes from './notificationRoutes'
- [ ] router.use('/api/notifications', notificationRoutes);

### Frontend: Notifications API (app/src/api/notificationsApi.ts)
- [ ] Import: axios
- [ ] export const fetchNotifications = async () => {
- [ ]   const response = await axios.get('/api/notifications');
- [ ]   return response.data;
- [ ] };
- [ ] export const markNotificationAsRead = async (id: number) => {
- [ ]   await axios.put(`/api/notifications/${id}/read`);
- [ ] };

### Notifications Hook (app/src/hooks/useNotifications.ts)
- [ ] Import: useState, useEffect, fetchNotifications, markNotificationAsRead
- [ ] export const useNotifications = () => {
- [ ]   const [notifications, setNotifications] = useState<Notification[]>([]);
- [ ]   const [loading, setLoading] = useState(false);
- [ ]   const pollNotifications = async () => {
- [ ]     try {
- [ ]       const data = await fetchNotifications();
- [ ]       setNotifications(data);
- [ ]     } catch (error) {
- [ ]       console.error('Failed to fetch notifications:', error);
- [ ]     }
- [ ]   };
- [ ]   const markAsRead = async (id: number) => {
- [ ]     try {
- [ ]       await markNotificationAsRead(id);
- [ ]       setNotifications(prev => prev.filter(n => n.id !== id));
- [ ]     } catch (error) {
- [ ]       console.error('Failed to mark as read:', error);
- [ ]     }
- [ ]   };
- [ ]   useEffect(() => {
- [ ]     pollNotifications(); // Initial fetch
- [ ]     const interval = setInterval(pollNotifications, 30000); // Poll every 30 seconds
- [ ]     return () => clearInterval(interval);
- [ ]   }, []);
- [ ]   return { notifications, loading, markAsRead, refresh: pollNotifications };
- [ ] };

### Notification Context (app/src/context/NotificationContext.tsx)
- [ ] Import: createContext, useContext, ReactNode, useNotifications
- [ ] interface NotificationContextType { notifications: Notification[]; markAsRead: (id: number) => Promise<void>; refresh: () => Promise<void>; }
- [ ] const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
- [ ] export const NotificationProvider = ({ children }: { children: ReactNode }) => {
- [ ]   const notificationData = useNotifications();
- [ ]   return <NotificationContext.Provider value={notificationData}>{children}</NotificationContext.Provider>;
- [ ] };
- [ ] export const useNotificationContext = () => {
- [ ]   const context = useContext(NotificationContext);
- [ ]   if (!context) throw new Error('useNotificationContext must be used within NotificationProvider');
- [ ]   return context;
- [ ] };

### Notification Popup (app/src/components/notifications/NotificationPopup.tsx)
- [ ] Import: useState, useEffect, useNavigate, formatDate, formatTime
- [ ] Props: { notification: Notification; onDismiss: (id: number) => void; }
- [ ] Calculate countdown: const calculateMinutesRemaining = () => {
- [ ]   const expiresAt = new Date(notification.data.expires_at);
- [ ]   const now = new Date();
- [ ]   const diffMs = expiresAt.getTime() - now.getTime();
- [ ]   return Math.max(0, Math.floor(diffMs / 60000)); // Convert to minutes
- [ ] };
- [ ] State: const [minutesRemaining, setMinutesRemaining] = useState(calculateMinutesRemaining())
- [ ] const navigate = useNavigate()
- [ ] useEffect(() => {
- [ ]   const interval = setInterval(() => {
- [ ]     const remaining = calculateMinutesRemaining();
- [ ]     setMinutesRemaining(remaining);
- [ ]     if (remaining <= 0) {
- [ ]       onDismiss(notification.id); // Auto-dismiss when expired
- [ ]     }
- [ ]   }, 60000); // Update every minute
- [ ]   return () => clearInterval(interval);
- [ ] }, []);
- [ ] const handleBookNow = () => {
- [ ]   const { appointment_date, start_time } = notification.data;
- [ ]   onDismiss(notification.id);
- [ ]   navigate(`/patient/book-appointment?date=${appointment_date}&time=${start_time}&auto_fill=true`);
- [ ] };
- [ ] Render: <div className="notification-popup" role="alert" aria-live="polite">
- [ ]   <div className="notification-header"><h3>{notification.title}</h3><button onClick={() => onDismiss(notification.id)} aria-label="Close notification" className="close-button">×</button></div>
- [ ]   <div className="notification-body"><p>{notification.message}</p><p className="countdown">Expires in: <strong>{minutesRemaining} minutes</strong></p></div>
- [ ]   <div className="notification-actions"><button onClick={handleBookNow} className="btn-book-now">Book Now</button><button onClick={() => onDismiss(notification.id)} className="btn-dismiss">Dismiss</button></div>
- [ ] </div>

### Notification Center (app/src/components/notifications/NotificationCenter.tsx)
- [ ] Import: useNotificationContext, NotificationPopup
- [ ] const { notifications, markAsRead } = useNotificationContext()
- [ ] Filter waitlist notifications: const waitlistNotifications = notifications.filter(n => n.type === 'waitlist_available')
- [ ] Render: <div className="notification-center" aria-label="Notifications">
- [ ]   {waitlistNotifications.map(notification => (
- [ ]     <NotificationPopup key={notification.id} notification={notification} onDismiss={markAsRead} />
- [ ]   ))}
- [ ] </div>

### Update App.tsx (app/src/App.tsx)
- [ ] Import: NotificationProvider, NotificationCenter
- [ ] Wrap App with NotificationProvider:
- [ ] <AuthProvider>
- [ ]   <AppointmentProvider>
- [ ]     <WaitlistProvider>
- [ ]       <NotificationProvider>
- [ ]         <NotificationCenter />
- [ ]         <Router>
- [ ]           <Routes>...</Routes>
- [ ]         </Router>
- [ ]       </NotificationProvider>
- [ ]     </WaitlistProvider>
- [ ]   </AppointmentProvider>
- [ ] </AuthProvider>

### Styles (app/src/styles/Notifications.module.css)
- [ ] .notification-center { position: fixed; top: 80px; right: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 12px; max-width: 400px; }
- [ ] .notification-popup { background: #1976D2; color: white; border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease-out; }
- [ ] @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
- [ ] .notification-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
- [ ] .notification-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
- [ ] .close-button { background: transparent; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; }
- [ ] .notification-body p { margin: 8px 0; line-height: 1.5; }
- [ ] .countdown { background: rgba(255,255,255,0.2); padding: 8px; border-radius: 4px; margin-top: 12px; }
- [ ] .notification-actions { display: flex; gap: 8px; margin-top: 12px; }
- [ ] .btn-book-now { background: #4CAF50; border: none; color: white; font-weight: 600; padding: 10px 20px; border-radius: 6px; cursor: pointer; flex: 1; }
- [ ] .btn-book-now:hover { background: #45A049; }
- [ ] .btn-dismiss { background: rgba(255,255,255,0.2); border: 1px solid white; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; flex: 1; }

### Validation and Testing
- [ ] Start servers, login as patient
- [ ] Trigger notification (via waitlist flow)
- [ ] Expected: Popup appears top-right within 30 seconds (polling cycle)
- [ ] Verify: Title "Appointment Available!", slot details, countdown
- [ ] Verify: Countdown updates every minute
- [ ] Click "Book Now" → Navigate to booking page with auto-filled slot
- [ ] Verify: Notification marked as read, removed from UI
- [ ] Test "Dismiss" button → Notification removed
- [ ] Test multiple notifications → Stack vertically
- [ ] Test navigation persistence → Notification persists across pages
- [ ] Test expiration → Auto-dismiss when countdown reaches 0
- [ ] Test accessibility: Tab through elements, Enter activates buttons
- [ ] Screen reader: Announces notification content
- [ ] Verify contrast ratio: Blue background (#1976D2) with white text meets 4.5:1
