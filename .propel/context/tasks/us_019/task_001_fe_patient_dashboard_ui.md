# Task - TASK_001_FE_PATIENT_DASHBOARD_UI

## Requirement Reference
- User Story: US_019
- Story Location: `.propel/context/tasks/us_019/us_019.md`
- Acceptance Criteria:
    - AC1: Patient dashboard (SCR-002) displays welcome message, upcoming appointments (next 3) as cards, "Book New Appointment" button, past appointments (last 5), notifications panel, quick actions
- Edge Cases:
    - No upcoming appointments: Display empty state with "No upcoming appointments" + "Book Appointment" CTA
    - Cancelled appointments: Show in "Past Appointments" with status="Cancelled" and reason
    - >3 upcoming appointments: Show "View All Appointments" link

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-002 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | SCR-002 (Patient Dashboard) |
| **UXR Requirements** | UXR-001 (Max 3 clicks to book), UXR-002 (Clear hierarchy: upcoming > past > actions), UXR-201 (Mobile-first) |
| **Design Tokens** | Status badges: Scheduled (blue #007BFF), Confirmed (green #28A745), Arrived (orange #FD7E14), Completed (gray #6C757D), Cancelled (red #DC3545); Card style: white bg, border-radius 8px, box-shadow 0 2px 4px rgba(0,0,0,0.1) |

> **Wireframe Components (SCR-002):**
> - Header: "Welcome back, [Patient Name]!" banner with profile photo circle (top-right)
> - Nav sidebar (left): Dashboard, Appointments, Documents, Intake, Profile, Settings icons + labels
> - Upcoming Appointments: Grid (3 cols desktop, 1 col mobile), cards show date (large), time, provider avatar + name, department, status badge, actions dropdown (View/Reschedule/Cancel)
> - Book Appointment button: Primary (blue), top-right, prominent
> - Past Appointments: Table (date, provider, department, status, View Details link)
> - Notifications panel: Right sidebar, bell icon + badge count, notification list (icon, title, time), "View All"
> - Quick actions: Icon grid (Upload Docs, Complete Intake, Update Profile, View Lab Results)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Frontend | Axios | 1.x |
| Backend | Express (API) | 4.x |
| Database | N/A (FE only) | N/A |
| AI/ML | N/A | N/A |

**Note**: All components MUST follow React 18.2, TypeScript 5.3, WCAG 2.2 AA

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI features - dashboard UI only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive Web - Mobile-first) |
| **Platform Target** | Web (Responsive) |
| **Min OS Version** | iOS 14+, Android 10+ (browser support) |
| **Mobile Framework** | React (Responsive Web App) |

> **Note**: Mobile-first design: Single-column layout mobile, tabs for sections, collapsible sidebar

## Task Overview
Implement Patient Dashboard (SCR-002) with: (1) Welcome banner (user name + profile photo), (2) Nav sidebar (Dashboard, Appointments, Documents, Intake, Profile, Settings), (3) Upcoming Appointments section (grid of cards: date/time, provider, status badge, actions), (4) "Book Appointment" primary button, (5) Past Appointments table, (6) Notifications panel (right sidebar), (7) Quick actions icon grid. Responsive (mobile stacked, tablet 2-col, desktop 3-col with sidebars). Empty states for no appointments. Status badges color-coded. WCAG 2.2 AA compliant.

## Dependent Tasks
- US_001: React frontend setup
- US_009 Task 001: Authentication (protected route)
- US_012 Task 001: Login redirects to dashboard
- US_013Task 001: Booking API endpoints (for "Book Appointment" button)

## Impacted Components
**New:**
- app/src/pages/PatientDashboardPage.tsx (Main dashboard layout)
- app/src/components/AppointmentCard.tsx (Individual appointment card)
- app/src/components/AppointmentsList.tsx (Upcoming appointments grid)
- app/src/components/PastAppointmentsTable.tsx (Past appointments table)
- app/src/components/NotificationsPanel.tsx (Right sidebar notifications)
- app/src/components/QuickActions.tsx (Icon grid for quick actions)
- app/src/components/DashboardSidebar.tsx (Left nav sidebar)
- app/src/hooks/useAppointments.ts (Fetch appointments: upcoming + past)
- app/src/services/dashboardService.ts (API calls: getUpcomingAppointments, getPastAppointments)
- app/src/styles/PatientDashboardPage.module.css (Dashboard responsive layout)

## Implementation Plan
1. **Install dependencies**: (reuse existing: react-router-dom, axios)
2. **Create types**: Appointment {id, date, time, provider, department, status, notes}, DashboardData {upcomingAppointments[], pastAppointments[], notifications[]}
3. **Create dashboardService**:
   - getUpcomingAppointments(): GET /api/patients/me/appointments?status=upcoming&limit=3
   - getPastAppointments(): GET /api/patients/me/appointments?status=past&limit=5
   - getNotifications(): GET /api/patients/me/notifications?unread=true
4. **Create useAppointments hook**: React Query for fetching dashboard data, caching, automatic refetch on window focus
5. **Create AppointmentCard component**:
   - Props: appointment {date, time, provider, status}
   - Display: Date (large), time, provider name + avatar, department, status badge (color-coded)
   - Actions dropdown: View Details, Reschedule, Cancel
   - Responsive: Full width mobile, card mobile, card layout desktop
6. **Create AppointmentsList component**: Grid of AppointmentCard (3 cols desktop, 2 cols tablet, 1 col mobile), empty state if no appointments
7. **Create PastAppointmentsTable component**: Table with columns (date, provider, department, status, View Details link), pagination (future enhancement)
8. **Create NotificationsPanel component**: Right sidebar, bell icon + badge count, list (icon, title, timestamp), "View All" link
9. **Create QuickActions component**: Icon grid (4 actions: Upload Docs, Complete Intake, Update Profile, View Lab Results), navigate to respective pages
10. **Create DashboardSidebar component**: Left nav (icons + labels), active state indicator, collapsible on mobile (hamburger menu)
11. **Create PatientDashboardPage layout**: Welcome banner, sidebar (left), main content (appointments + quick actions), notifications panel (right)
12. **Implement empty states**: No upcoming appointments → illustration + "Book Appointment" CTA
13. **Add loading states**: Skeleton cards during data fetch
14. **Configure routing**: /dashboard → PatientDashboardPage (protected, patient role only)

## Current Project State
```
ASSIGNMENT/
├── app/
│   ├── src/
│   │   ├── pages/ (LoginPage, AppointmentBookingPage exist)
│   │   ├── components/ (LoginForm, AppointmentCalendar exist)
│   │   ├── hooks/ (useAuth, useSlots exist)
│   │   └── services/ (authService, appointmentService exist)
│   └── package.json
└── server/ (dashboard API endpoints to be created in separate BE task)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/PatientDashboardPage.tsx | Main dashboard with welcome banner, sidebar, appointments, notifications |
| CREATE | app/src/components/AppointmentCard.tsx | Card component: date, time, provider, status badge, actions |
| CREATE | app/src/components/AppointmentsList.tsx| Upcoming appointments grid (3 cards) with empty state |
| CREATE | app/src/components/PastAppointmentsTable.tsx | Past appointments table (5 rows) |
| CREATE | app/src/components/NotificationsPanel.tsx | Right sidebar: bell icon, notification list, "View All" |
| CREATE | app/src/components/QuickActions.tsx | Icon grid: 4 quick action buttons |
| CREATE | app/src/components/DashboardSidebar.tsx | Left nav: Dashboard, Appointments, Documents, Intake, Profile, Settings |
| CREATE | app/src/hooks/useAppointments.ts | React Query hook: fetch upcoming + past appointments |
| CREATE | app/src/services/dashboardService.ts | API calls: getUpcomingAppointments, getPastAppointments, getNotifications |
| CREATE | app/src/styles/PatientDashboardPage.module.css | Responsive layout: 3-col desktop, 2-col tablet, 1-col mobile |
| UPDATE | app/src/App.tsx | Add route: /dashboard → PatientDashboardPage (protected) |
| UPDATE | app/src/types/appointment.types.ts | Add DashboardData, Notification types |

> Creates 10 new files, updates 2 existing files

## External References
- [React Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Responsive Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Responsive_web_design)
- [WCAG 2.2 Color Contrast](https://www.w3.org/WAI/WCAG22/quickref/#contrast-minimum)
- [Wireframe SCR-002](../../../.propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html)
- [UXR-001 Max 3 Clicks](../../../.propel/context/docs/spec.md#UXR-001)

## Build Commands
```bash
# Install dependencies (if needed)
cd app
npm install @tanstack/react-query

# Development server
npm run dev  # Opens http://localhost:3000/dashboard

# Build
npm run build

# Test
npm run test
```

## Implementation Validation Strategy
- [ ] Unit tests: AppointmentCard renders with correct status badge color
- [ ] Unit tests: AppointmentsList shows empty state when no appointments
- [ ] Integration tests: Dashboard loads upcoming + past appointments from API
- [ ] Dashboard page renders: Navigate to /dashboard → see welcome banner, sidebar, appointments grid
- [ ] Upcoming appointments displayed: Shows next 3 appointments as cards
- [ ] Appointment cards correct: Date (large), time, provider name, department, status badge (color-coded)
- [ ] Status badge colors: Scheduled (blue), Confirmed (green), Arrived (orange), Completed (gray), Cancelled (red)
- [ ] Actions dropdown: Hover card → see View Details, Reschedule, Cancel
- [ ] Past appointments table: Shows last 5 completed appointments with View Details link
- [ ] Empty state: No upcoming appointments → see illustration + "Book Appointment" button
- [ ] Book Appointment button: Click → navigate to /appointments/book
- [ ] Notifications panel: Right sidebar shows unread notifications with count badge
- [ ] Quick actions: Click "Upload Documents" → navigate to /documents/upload
- [ ] Sidebar navigation: Click "Appointments" → navigate to /appointments
- [ ] Active nav indicator: Dashboard menu item highlighted (blue background)
- [ ] Responsive mobile: 375px width → single column, sidebar collapsible (hamburger menu)
- [ ] Responsive tablet: 768px width → 2-column layout
- [ ] Responsive desktop: 1024px width → 3-column layout (sidebar, main, notifications)
- [ ] Keyboard navigation: Tab through appointments → actions dropdown accessible via Enter
- [ ] Color contrast: Browser DevTools → verify 4.5:1 minimum for all text/badges
- [ ] Loading skeleton: Dashboard loading → see skeleton cards (gray animated)

## Implementation Checklist
- [ ] Install @tanstack/react-query: `cd app && npm install @tanstack/react-query`
- [ ] Update app/src/types/appointment.types.ts:
  - [ ] Add `export interface DashboardData { upcomingAppointments: Appointment[]; pastAppointments: Appointment[]; unreadNotificationsCount: number; }`
  - [ ] Add `export interface Notification { id: string; type: string; message: string; createdAt: Date; isRead: boolean; }`
- [ ] Create app/src/services/dashboardService.ts:
  - [ ] Import axios, authService.getToken
  - [ ] `export async function getUpcomingAppointments() { return axios.get('${API_URL}/patients/me/appointments', { params: { status: 'upcoming', limit: 3 }, headers: { Authorization: 'Bearer ${getToken()}' } }); }`
  - [ ] `export async function getPastAppointments() { return axios.get('${API_URL}/patients/me/appointments', { params: { status: 'past', limit: 5 }, headers: { Authorization: 'Bearer ${getToken()}' } }); }`
  - [ ] `export async function getNotifications() { return axios.get('${API_URL}/patients/me/notifications', { params: { unread: true }, headers: { Authorization: 'Bearer ${getToken()}' } }); }`
- [ ] Create app/src/hooks/useAppointments.ts:
  - [ ] Import useQuery from @tanstack/react-query
  - [ ] `export function useUpcomingAppointments() { return useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: dashboardService.getUpcomingAppointments, staleTime: 2 * 60 * 1000 }); }`
  - [ ] `export function usePastAppointments() { return useQuery({ queryKey: ['appointments', 'past'], queryFn: dashboardService.getPastAppointments }); }`
- [ ] Create app/src/components/AppointmentCard.tsx:
  - [ ] Props: appointment: Appointment
  - [ ] Render card:
    - [ ] Date (large font, bold): `format(appointment.date, 'MMM dd')`
    - [ ] Time: `format(appointment.time, 'h:mm a')`
    - [ ] Provider: Avatar (circle) + name
    - [ ] Department: Small gray text
    - [ ] Status badge: Pill shape, color-coded (blue/green/orange/gray/red)
    - [ ] Actions dropdown: Three-dot icon → menu (View Details, Reschedule, Cancel)
  - [ ] Styles: Card (white, rounded corners, shadow), responsive (full-width mobile)
- [ ] Create app/src/components/AppointmentsList.tsx:
  - [ ] Props: appointments: Appointment[]
  - [ ] Render grid: CSS Grid (3 cols desktop, 2 cols tablet, 1 col mobile)
  - [ ] Map appointments to AppointmentCard components
  - [ ] Empty state: if appointments.length === 0 → show illustration + "No upcoming appointments" + "Book Appointment" button
- [ ] Create app/src/components/PastAppointmentsTable.tsx:
  - [ ] Props: appointments: Appointment[]
  - [ ] Render table: <table> with <thead> (Date, Provider, Department, Status, Actions) and <tbody> (map appointments to rows)
  - [ ] Each row: Date, Provider name, Department, Status badge, "View Details" link
  - [ ] Responsive: Horizontal scroll on mobile
- [ ] Create app/src/components/NotificationsPanel.tsx:
  - [ ] Fetch notifications: useNotifications hook (similar to useAppointments)
  - [ ] Render: Bell icon + badge count (unread)
  - [ ] List: Icon (based on notification type), title, timestamp ("2 hours ago")
  - [ ] "View All" link at bottom
  - [ ] Styles: Right sidebar (fixed width 300px), white bg, border-left
- [ ] Create app/src/components/QuickActions.tsx:
  - [ ] Render: 2x2 grid (or 4 cols desktop, 2 cols tablet, 2 cols mobile)
  - [ ] Each action: Icon (upload, form, profile, lab) + label + navigate on click
  - [ ] Actions: Upload Documents (/documents/upload), Complete Intake (/intake), Update Profile (/profile), View Lab Results (/lab-results)
- [ ] Create app/src/components/DashboardSidebar.tsx:
  - [ ] Nav items: Dashboard, Appointments, Documents, Intake, Profile, Settings
  - [ ] Each item: Icon + label + Link from react-router-dom
  - [ ] Active state: Check useLocation().pathname, highlight active item (blue bg)
  - [ ] Responsive: Collapsible on mobile (hamburger menu)
- [ ] Create app/src/pages/PatientDashboardPage.tsx:
  - [ ] Fetch data: useUpcomingAppointments, usePastAppointments, useNotifications
  - [ ] Layout: Grid (sidebar 200px, main 1fr, notifications 300px desktop)
  - [ ] Welcome banner: "Welcome back, {user.firstName}!" + profile photo
  - [ ] Section 1: "Upcoming Appointments" (h2) + AppointmentsList + "Book New Appointment" button
  - [ ] Section 2: "Past Appointments" (h2) + PastAppointmentsTable
  - [ ] Section 3: QuickActions grid
  - [ ] Loading state: Skeleton cards while fetching
  - [ ] Error state: If fetch fails → "Unable to load appointments. Please try again."
- [ ] Create app/src/styles/PatientDashboardPage.module.css:
  - [ ] Layout: `display: grid; grid-template-columns: 200px 1fr 300px; gap: 2rem;`
  - [ ] Media query @media (max-width: 1024px): 2 columns (sidebar + main, notifications below)
  - [ ] Media query @media (max-width: 768px): 1 column (stacked), sidebar hamburger menu
  - [ ] Status badges: .scheduled {background: #007BFF;}, .confirmed {background: #28A745;}, .arrived {background: #FD7E14;}, etc.
  - [ ] Cards: `.appointmentCard { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 1.5rem; }`
- [ ] Update app/src/App.tsx:
  - [ ] Import PatientDashboardPage
  - [ ] Add route: `<Route path="/dashboard" element={<ProtectedRoute role="patient"><PatientDashboardPage /></ProtectedRoute>} />`
  - [ ] Update login success redirect: Navigate to /dashboard after login
- [ ] Test dashboard page:
  - [ ] `npm run dev` → login as patient → verify redirect to /dashboard
  - [ ] Verify welcome banner: "Welcome back, John Doe!"
  - [ ] Verify upcoming appointments: Shows 3 cards with correct data
  - [ ] Verify past appointments: Table shows 5 completed appointments
  - [ ] Verify empty state: Remove all appointments → see "No upcoming appointments" + CTA
- [ ] Test responsive:
  - [ ] 375px (mobile): Single column, sidebar hamburger menu, cards stacked
  - [ ] 768px (tablet): 2 columns, sidebar visible, cards in 2-col grid
  - [ ] 1024px+ (desktop): 3 columns, sidebar + main + notifications panel
- [ ] Test navigation:
  - [ ] Click "Book New Appointment" → navigate to /appointments/book
  - [ ] Click sidebar "Appointments" → navigate to /appointments
  - [ ] Click "Upload Documents" quick action → navigate to /documents/upload
- [ ] Test keyboard navigation: Tab through cards → actions dropdown accessible via Enter
- [ ] Document dashboard in app/README.md: Patient dashboard components, API endpoints used, responsive breakpoints
