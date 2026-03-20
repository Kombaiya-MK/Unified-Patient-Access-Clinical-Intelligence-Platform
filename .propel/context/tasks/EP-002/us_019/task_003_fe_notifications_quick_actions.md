# Task - TASK_003: Frontend Notifications Panel & Quick Actions

## Requirement Reference
- User Story: [us_019]
- Story Location: [.propel/context/tasks/us_019/us_019.md]
- Acceptance Criteria:
    - AC1: Notifications panel (right sidebar) showing unread notifications with count badge
    - AC1: Each notification displays icon, title, time, with unread highlighting
    - AC1: "View All" link at bottom of notifications panel
    - AC1: Quick actions (Upload Documents, Complete Intake, Update Profile, View Lab Results) as icon grid
    - AC1: "Book New Appointment" prominent button in dashboard
- Edge Case:
    - N/A (UI presentation concerns)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-002 |
| **UXR Requirements** | UXR-001 (Max 3 clicks to book), UXR-002 (Clear visual hierarchy), UXR-201 (Mobile-first responsive) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #typography, #spacing, #icons |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference the wireframe file/URL during UI implementation
- **MUST** match layout, spacing, typography, and colors from the wireframe
- **MUST** implement all states shown in wireframe (default, hover, focus, error, loading)
- **MUST** validate implementation against wireframe at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | React Router | 6.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | CSS Modules | N/A |

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

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create the notifications panel for the right sidebar with unread badge counter, notification list with icons and timestamps, and "View All" link. Implement quick actions icon grid with 4 actions (Upload, Intake, Profile, Lab Results) that navigate to respective pages. Integrate both components into the DashboardLayout from TASK_001.

## Dependent Tasks
- TASK_001: Frontend Dashboard Layout & Navigation (provides right sidebar slot for notifications panel)
- US-046: Notifications data structure (dependency mentioned in user story, may need mock data for now)

## Impacted Components
- **CREATE** app/src/components/dashboard/NotificationsPanel.tsx - Right sidebar notifications panel
- **CREATE** app/src/components/dashboard/NotificationItem.tsx - Individual notification list item
- **CREATE** app/src/components/dashboard/QuickActions.tsx - Quick actions icon grid component
- **CREATE** app/src/components/dashboard/NotificationsPanel.css - Notifications panel styles
- **CREATE** app/src/components/dashboard/QuickActions.css - Quick actions grid styles
- **MODIFY** app/src/pages/PatientDashboard.tsx - Add NotificationsPanel and QuickActions to layout
- **CREATE** app/src/types/notification.types.ts - TypeScript interfaces for notifications
- **CREATE** app/src/hooks/useNotifications.ts - Hook for fetching/managing notifications (placeholder, returns mock data until US-046)

## Implementation Plan
1. **Create notification.types.ts**: Define `Notification` interface with id, title, message, type (appointment/document/system), read (boolean), timestamp, icon
2. **Create useNotifications.ts**: Hook returning notifications array, unread count, markAsRead function (mock data for now: 3 notifications with mix of read/unread)
3. **Create NotificationItem.tsx**: Component displaying notification with icon (color-coded by type), title, message excerpt, timestamp (relative: "2h ago"), unread indicator (background highlight)
4. **Create NotificationsPanel.tsx**: Panel component with header (bell icon + unread count badge), scrollable notification list (latest 5), "View All Notifications" link at bottom, empty state if 0 notifications
5. **Create QuickActions.tsx**: Grid component with 4 action buttons (Upload Documents, Complete Intake, Update Profile, View Lab Results), each with icon + label, onClick navigates to respective route
6. **Create NotificationsPanel.css**: Panel styling (320px width, max-height with scroll, unread highlight background, notification item hover effect, badge styles)
7. **Create QuickActions.css**: Grid layout (2x2 on desktop, 4x1 on mobile), icon button styles with hover/focus states, centered icon + label vertically
8. **Modify PatientDashboard.tsx**: Pass NotificationsPanel to DashboardLayout's right sidebar slot, add QuickActions section below welcome banner in main content area

**Focus on how to implement**: Notifications panel should use overflow-y: auto for scrolling. Unread count badge should use absolute positioning on bell icon. Notification type icons should use consistent color scheme (blue for appointments, green for documents, gray for system). Quick actions should use React Router's `navigate()` for routing. Empty state for notifications should have friendly message.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── PatientDashboard.tsx (has DashboardLayout with empty right sidebar slot)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx (TASK_001, has right sidebar slot)
│   │   │   ├── NavigationSidebar.tsx (TASK_001)
│   │   │   ├── WelcomeBanner.tsx (TASK_001)
│   │   │   ├── UpcomingAppointments.tsx (TASK_002)
│   │   │   ├── PastAppointments.tsx (TASK_002)
│   │   │   └── (new components to be added)
│   │   └── common/
│   │       └── LoadingSpinner.tsx
│   ├── context/
│   │   └── AppointmentContext.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── types/
│   │   ├── appointment.types.ts
│   │   └── (notification.types.ts to be added)
│   └── App.tsx
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/dashboard/NotificationsPanel.tsx | Right sidebar panel with header (bell icon + badge), scrollable notification list (latest 5), "View All" link |
| CREATE | app/src/components/dashboard/NotificationItem.tsx | Individual notification component with icon (color by type), title, message, timestamp, unread highlight |
| CREATE | app/src/components/dashboard/QuickActions.tsx | 2x2 icon grid with 4 actions (Upload, Intake, Profile, Lab Results) that navigate on click |
| CREATE | app/src/components/dashboard/NotificationsPanel.css | Panel styles (320px width, scroll container, badge positioning, unread highlight, hover effects) |
| CREATE | app/src/components/dashboard/QuickActions.css | Grid layout styles (2x2 desktop, 4x1 mobile), icon button with centered label, hover/focus states |
| CREATE | app/src/types/notification.types.ts | TypeScript interfaces: Notification (id, title, message, type, read, timestamp, icon) |
| CREATE | app/src/hooks/useNotifications.ts | Hook returning { notifications, unreadCount, markAsRead, loading } with mock data until US-046 API ready |
| MODIFY | app/src/pages/PatientDashboard.tsx | Add NotificationsPanel to DashboardLayout right sidebar, add QuickActions section below WelcomeBanner |
| MODIFY | app/src/components/index.ts | Export new dashboard components (NotificationsPanel, NotificationItem, QuickActions) |

## External References
- **Badge Component Patterns**: https://www.w3.org/WAI/ARIA/apg/patterns/badge/ - Accessible badge implementation
- **Relative Time Formatting**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat - Format timestamps as "2h ago"
- **Scrollable Containers**: https://css-tricks.com/custom-scrollbars-in-webkit/ - Custom scrollbar styling
- **React useNavigate**: https://reactrouter.com/en/main/hooks/use-navigate - Programmatic navigation for quick actions
- **Empty State Design**: https://www.nngroup.com/articles/empty-state-ux/ - Best practices for empty notification state
- **Icon Button Accessibility**: https://www.a11ymatters.com/pattern/accessible-icon-button/ - Making icon buttons accessible

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for notifications and quick actions components)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for NotificationsPanel, NotificationItem, QuickActions components
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Unread count badge displays correctly on bell icon
- [x] Notification list scrolls correctly when >5 notifications
- [x] Unread notifications have distinct visual highlight (different background color)
- [x] Quick actions navigation works (click Upload → navigates to /documents/upload)
- [x] Relative timestamps display correctly ("2h ago", "1d ago")
- [x] Empty state displays when no notifications exist
- [x] Accessibility validation: keyboard navigation, ARIA labels, screen reader compatibility

## Implementation Checklist
- [x] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html during implementation
- [x] Create notification.types.ts with Notification interface (id, title, message, type: 'appointment'|'document'|'system', read: boolean, timestamp: Date, icon: string)
- [x] Create useNotifications.ts hook returning { notifications: Notification[], unreadCount: number, markAsRead: (id) => void, loading: boolean } with mock data (3 sample notifications, 2 unread)
- [x] Create NotificationItem.tsx component (props: notification, onMarkRead) with icon (color-coded: blue=appointment, green=document, gray=system), title, message truncated to 2 lines, relative timestamp using Intl.RelativeTimeFormat
- [x] Create NotificationsPanel.tsx with header (bell icon + unread badge positioned absolute), scrollable container (max-height: 400px, overflow-y: auto), list of latest 5 notifications using NotificationItem, "View All Notifications" link, empty state if notifications.length = 0
- [x] Create QuickActions.tsx with 2x2 grid (grid-template-columns: repeat(2, 1fr) on desktop) containing 4 buttons (Upload Documents → /documents/upload, Complete Intake → /intake, Update Profile → /profile, View Lab Results → /lab-results) using useNavigate
- [x] Create NotificationsPanel.css with panel width 320px, padding, border-left, badge styles (position: absolute, top: -4px, right: -4px, background: red, border-radius: 50%), unread notification highlight background (#E6F0FA)
- [x] Create QuickActions.css with grid layout, icon buttons (min-height: 100px, flex column, icon + label stacked), hover effect (transform: translateY(-2px)), responsive breakpoint at 768px (switch to 4x1 grid)
