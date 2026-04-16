# Task - task_001_fe_notification_ui_components

## Requirement Reference
- User Story: us_046
- Story Location: .propel/context/tasks/us_046/us_046.md
- Acceptance Criteria:
    - **AC-1 Real-time Popup**: Notification popup appears in top-right corner with icon (info/warning/critical), title, message, timestamp, dismiss button without page reload via WebSocket
    - **AC-2 Bell Icon Badge**: Bell icon in header with red badge showing unread notification count, clicking opens notification history panel
    - **AC-3 Actionable Notifications**: Clicking notification navigates to relevant page or triggers action, marks as read, decrements badge count
    - **AC-4 Critical Notifications**: Critical notifications require manual "Acknowledge" button, use red color scheme, remain visible until acknowledged
- Edge Case:
    - **Offline/Reconnection**: On reconnection, fetch missed notifications from last sync timestamp and display catch-up banner
    - **Stacking Limit**: Max 3 visible popups, older auto-dismiss after 10s for info priority, queue additional notifications
    - **History Pagination**: Paginate 20 notifications per page with infinite scroll, "Mark All as Read" and "Clear Read" buttons

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-notification-popup.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#notification-component |
| **UXR Requirements** | UXR-101 (WCAG AA compliance), UXR-102 (Screen reader ARIA live regions), UXR-103 (Full keyboard navigation), UXR-201 (Mobile-first responsive), UXR-401 (Popup appears <200ms after WebSocket message) |
| **Design Tokens** | .propel/context/docs/designsystem.md#color-palette (error-600 for critical, warning-600 for warnings, info-600 for info), designsystem.md#typography (body text 12px, title 14px bold) |

> **Wireframe Status Legend:**
> - **AVAILABLE**: Local wireframe file exists with complete notification popup, bell icon, and history panel layout

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference designsystem.md for all color tokens (error-600, warning-600, info-600) and typography
- **MUST** implement ARIA live regions (role="alert" for critical, role="status" for info) per UXR-102
- **MUST** validate keyboard navigation (Tab to focus, Enter to dismiss, ESC to close panel) per UXR-103
- **MUST** implement responsive design (320px width popup mobile, 400px panel desktop) per UXR-201
- Run `/analyze-ux` after implementation to verify UXR-101, UXR-102, UXR-103, UXR-401 compliance

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| WebSocket Client | socket.io-client | latest |
| State Management | React Context / Redux (if existing) | latest |
| UI Library | (custom or existing: Material-UI, Ant Design) | latest |
| Date Formatting | dayjs | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

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
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement real-time notification UI components for all role-specific dashboards (Patient SCR-002, Staff SCR-003, Admin SCR-004) including notification popup, bell icon with unread badge, and notification history panel. The notification popup displays in the top-right corner (desktop) or top-center (mobile) with icon-based severity (info/warning/critical), title, message, timestamp, and dismiss button. Popups auto-dismiss after 10s (info), 15s (warning), or require manual acknowledgement (critical). Bell icon in header navigation shows red badge with unread count and opens a slide-in history panel (400px desktop, full-screen mobile) displaying past notifications grouped by date with pagination (20 per page, infinite scroll). WebSocket client integration using socket.io-client connects to backend service (task_002) for real-time notification delivery without page reload. Implements accessibility features: ARIA live regions (role="alert"/"status"), screen reader announcements, full keyboard navigation, and focus trap in history panel.

## Dependent Tasks
- task_002_be_websocket_notification_service (provides WebSocket server and event broadcasting)
- task_003_be_notification_rest_api (provides REST endpoints for fetching missed notifications and marking as read)
- task_004_db_notifications_schema (provides database schema for notification storage)
- US-012 (Login and dashboards to integrate notification components)

## Impacted Components
- **NEW**: `app/src/components/notifications/NotificationPopup.tsx` - Popup component with auto-dismiss logic
- **NEW**: `app/src/components/notifications/NotificationBellIcon.tsx` - Bell icon with badge count in header
- **NEW**: `app/src/components/notifications/NotificationPanel.tsx` - Slide-in history panel with pagination
- **NEW**: `app/src/components/notifications/NotificationItem.tsx` - Individual notification list item
- **NEW**: `app/src/hooks/useWebSocket.ts` - Custom hook for WebSocket connection management
- **NEW**: `app/src/hooks/useNotifications.ts` - Custom hook for notification state management
- **NEW**: `app/src/contexts/NotificationContext.tsx` - Context provider for global notification state
- **NEW**: `app/src/services/notificationService.ts` - Service for REST API calls (fetch missed, mark as read)
- **MODIFY**: `app/src/layouts/DashboardLayout.tsx` - Add NotificationBellIcon to header navigation
- **MODIFY**: `app/src/App.tsx` - Wrap with NotificationProvider context

## Implementation Plan
1. **Create NotificationContext**: Global state for notifications (unread count, notification list, WebSocket connection status), provide actions (addNotification, markAsRead, clearNotifications)
2. **Implement useWebSocket hook**: Connect to WebSocket server using socket.io-client, listen for "notification" events, handle connection/disconnection/reconnection, emit "user_join" event with userId on connection
3. **Build NotificationPopup component**: Display popup with icon (info/warning/critical), title (14px bold, truncated 40 chars), message (12px, max 2 lines, "Read more" link), timestamp (relative time "2 min ago" using dayjs), dismiss button (X icon), auto-dismiss timer (10s info, 15s warning, manual critical), ARIA live region (role="alert" critical, role="status" info)
4. **Create NotificationBellIcon**: Bell icon in header with red badge (white number), hover tooltip ("You have 3 unread notifications"), onClick opens NotificationPanel, active state when panel open
5. **Implement NotificationPanel**: Slide-in from right (400px desktop, full-screen mobile), header ("Notifications" title, "Mark All Read" + "Settings" icons, close button), scrollable list grouped by date (Today, Yesterday, This Week), pagination (20 per page, infinite scroll with IntersectionObserver), empty state ("No notifications" + illustration), focus trap (Tab cycles within panel, ESC closes)
6. **Build NotificationItem**: Icon, title, message preview (truncated 2 lines), timestamp, unread indicator (bold + dot), onClick navigates to relevant page (e.g., /appointments/:id) and marks as read
7. **Handle notification stacking**: Max 3 visible popups, queue additional in array, auto-dismiss oldest info/warning popups after timeout, critical popups push to front
8. **Implement offline reconnection**: On WebSocket reconnect, call REST API `GET /api/notifications/missed?since={lastSyncTimestamp}`, display catch-up banner ("You have 5 new notifications"), merge with existing notifications, deduplicate by notification ID
9. **Add keyboard navigation**: Tab to focus popup/panel items, Enter to dismiss/click notification, ESC to close panel, arrow keys to navigate list, focus first item when panel opens
10. **Integrate with dashboards**: Add NotificationBellIcon to DashboardLayout header navigation (Patient SCR-002, Staff SCR-003, Admin SCR-004), render NotificationPopup stack in fixed position container, initialize WebSocket connection on dashboard mount

**Focus on how to implement**:
- WebSocket connection: `const socket = io('ws://localhost:3000'); socket.emit('user_join', { userId }); socket.on('notification', (data) => { addNotification(data) });`
- Auto-dismiss logic: `useEffect(() => { if (priority === 'info') { setTimeout(() => onDismiss(), 10000) } }, [priority]);`
- ARIA live region: `<div role={priority === 'critical' ? 'alert' : 'status'} aria-live={priority === 'critical' ? 'assertive' : 'polite'}>{message}</div>`
- Badge count: `{unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}`
- Infinite scroll: `const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { loadMore() } });`
- Focus trap: `onKeyDown={(e) => { if (e.key === 'Tab') { trapFocus(e) } if (e.key === 'Escape') { closePanel() } }}`
- Relative timestamp: `dayjs(notification.timestamp).fromNow()` → "2 min ago"
- Design tokens: Use `error-600` for critical, `warning-600` for warnings, `info-600` for info, `neutral-900` for text

## Current Project State
```
app/src/
├── components/
│   └── (to create: notifications/ directory with NotificationPopup, NotificationBellIcon, NotificationPanel components)
├── hooks/
│   └── (to create: useWebSocket.ts, useNotifications.ts)
├── contexts/
│   └── (to create: NotificationContext.tsx)
├── services/
│   └── (to create: notificationService.ts)
├── layouts/
│   └── DashboardLayout.tsx (to modify: add NotificationBellIcon)
└── App.tsx (to modify: wrap with NotificationProvider)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/contexts/NotificationContext.tsx | Context provider: state (notifications[], unreadCount), actions (addNotification, markAsRead, clearAll, setUnreadCount), WebSocket status (connected, disconnected) |
| CREATE | app/src/hooks/useWebSocket.ts | Custom hook: socket.io-client connection, user_join emit with userId, listen "notification" event, handle reconnection with exponential backoff, return { socket, isConnected } |
| CREATE | app/src/hooks/useNotifications.ts | Custom hook: useContext(NotificationContext), provide { notifications, unreadCount, addNotification, markAsRead, clearAll } interface |
| CREATE | app/src/components/notifications/NotificationPopup.tsx | Popup component: icon (info/warning/critical), title (14px bold, truncated), message (12px, 2 lines), timestamp (relative), dismiss button, auto-dismiss timer, ARIA role="alert"/"status", position fixed top-right |
| CREATE | app/src/components/notifications/NotificationBellIcon.tsx | Bell icon: SVG bell, red badge with count (99+ cap), hover tooltip, onClick open NotificationPanel, active state styling |
| CREATE | app/src/components/notifications/NotificationPanel.tsx | Slide-in panel: 400px width (desktop), full-screen (mobile), header (title, Mark All Read, Settings, close), scrollable list, date grouping (Today, Yesterday, This Week), infinite scroll (IntersectionObserver), focus trap, empty state |
| CREATE | app/src/components/notifications/NotificationItem.tsx | List item: icon, title, message preview (truncated), timestamp, unread indicator (bold + blue dot), onClick navigate to action URL + mark as read, hover effect |
| CREATE | app/src/services/notificationService.ts | Service: `fetchMissedNotifications(since: timestamp)`: axios.get('/api/notifications/missed?since='), `markAsRead(id)`: axios.put('/api/notifications/:id/read'), `markAllAsRead()`: axios.put('/api/notifications/read-all') |
| MODIFY | app/src/layouts/DashboardLayout.tsx | Add NotificationBellIcon to header navigation (right side, before user profile), initialize WebSocket connection on mount, cleanup on unmount |
| MODIFY | app/src/App.tsx | Wrap application with NotificationProvider context, render NotificationPopup stack container (fixed position, z-index 9999) |

## External References
- **Socket.io Client**: https://socket.io/docs/v4/client-api/ (WebSocket client for real-time notifications)
- **React Context API**: https://react.dev/reference/react/useContext (Global notification state management)
- **IntersectionObserver**: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API (Infinite scroll implementation)
- **ARIA Live Regions**: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions (Accessibility for dynamic notifications)
- **dayjs**: https://day.js.org/en/ (Relative timestamp formatting: fromNow())
- **Focus Trap**: https://www.npmjs.com/package/focus-trap-react (Accessibility focus management for modal panels)
- **Design System**: .propel/context/docs/designsystem.md (Color tokens: error-600, warning-600, info-600; Typography: 12px body, 14px bold title)
- **UXR Requirements**: figma_spec.md#UXR-101 (WCAG AA), #UXR-102 (Screen readers), #UXR-103 (Keyboard nav), #UXR-401 (200ms latency)

## Build Commands
```bash
# Development server
cd app
npm run dev

# Install socket.io-client
npm install socket.io-client dayjs

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Implementation Checklist
- [x] Create NotificationContext with state (notifications[], unreadCount, WebSocket status) and actions (addNotification, markAsRead, clearAll)
- [x] Implement useWebSocket hook with socket.io-client connection, user_join emit, "notification" event listener, reconnection with exponential backoff
- [x] Build NotificationPopup component with icon (info/warning/critical), title/message/timestamp, auto-dismiss timer (10s info, 15s warning, manual critical), ARIA live region (role="alert"/"status")
- [x] Create NotificationBellIcon with red badge showing unread count (99+ cap), hover tooltip, onClick open NotificationPanel, active state styling
- [x] Implement NotificationPanel slide-in (400px desktop, full-screen mobile) with header (Mark All Read, Settings, close), scrollable list, date grouping, infinite scroll (IntersectionObserver)
- [x] Build NotificationItem with icon, title, message preview, timestamp, unread indicator (bold + dot), onClick navigate to action URL + mark as read
- [x] Handle notification stacking (max 3 visible popups, queue additional, auto-dismiss oldest), offline reconnection (fetch missed via REST API, display catch-up banner)
- [x] Add keyboard navigation (Tab to focus, Enter to dismiss, ESC to close panel, arrow keys for list), focus trap in NotificationPanel, ARIA live regions for screen readers
