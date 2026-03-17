# Information Architecture - Unified Patient Access & Clinical Intelligence Platform

## 1. Wireframe Specification

**Fidelity Level**: High  
**Screen Type**: Web (Responsive)  
**Viewport**: 1440 x 900  

## 2. System Overview

The Unified Patient Access & Clinical Intelligence Platform is a healthcare web application that enables patients to book appointments, complete AI-assisted intake, and upload documents, while staff manage queues, review clinical data, and resolve medication conflicts. Administrators manage users and audit system activity. The platform leverages AI for clinical data extraction and medical coding.

## 3. Wireframe References

### Generated Wireframes

**HTML Wireframes**:
| Screen/Feature | File Path | Description | Fidelity | Date Created |
|---------------|-----------|-------------|----------|--------------|
| SCR-001 Login/Register | [./Hi-Fi/wireframe-SCR-001-login.html](./Hi-Fi/wireframe-SCR-001-login.html) | Authentication screen with login/register forms | High | 2026-03-17 |
| SCR-002 Patient Dashboard | [./Hi-Fi/wireframe-SCR-002-patient-dashboard.html](./Hi-Fi/wireframe-SCR-002-patient-dashboard.html) | Patient home with appointments, quick actions, notifications | High | 2026-03-17 |
| SCR-003 Staff Dashboard | [./Hi-Fi/wireframe-SCR-003-staff-dashboard.html](./Hi-Fi/wireframe-SCR-003-staff-dashboard.html) | Staff home with today's appointments, queue overview, alerts | High | 2026-03-17 |
| SCR-004 Admin Dashboard | [./Hi-Fi/wireframe-SCR-004-admin-dashboard.html](./Hi-Fi/wireframe-SCR-004-admin-dashboard.html) | Admin home with system stats and audit summary | High | 2026-03-17 |
| SCR-005 Profile & Settings | [./Hi-Fi/wireframe-SCR-005-profile-settings.html](./Hi-Fi/wireframe-SCR-005-profile-settings.html) | User profile management for all personas | High | 2026-03-17 |
| SCR-006 Appointment Booking | [./Hi-Fi/wireframe-SCR-006-appointment-booking.html](./Hi-Fi/wireframe-SCR-006-appointment-booking.html) | Calendar-based slot selection and booking flow | High | 2026-03-17 |
| SCR-007 Patient Intake | [./Hi-Fi/wireframe-SCR-007-patient-intake.html](./Hi-Fi/wireframe-SCR-007-patient-intake.html) | AI-assisted and manual intake forms | High | 2026-03-17 |
| SCR-008 Document Upload | [./Hi-Fi/wireframe-SCR-008-document-upload.html](./Hi-Fi/wireframe-SCR-008-document-upload.html) | File upload with extraction progress | High | 2026-03-17 |
| SCR-009 Queue Management | [./Hi-Fi/wireframe-SCR-009-queue-management.html](./Hi-Fi/wireframe-SCR-009-queue-management.html) | Real-time queue with walk-in and arrival marking | High | 2026-03-17 |
| SCR-010 Clinical Data Review | [./Hi-Fi/wireframe-SCR-010-clinical-data-review.html](./Hi-Fi/wireframe-SCR-010-clinical-data-review.html) | Unified patient profile with conflict resolution | High | 2026-03-17 |
| SCR-011 Appointment Management | [./Hi-Fi/wireframe-SCR-011-appointment-management.html](./Hi-Fi/wireframe-SCR-011-appointment-management.html) | Staff appointment operations including no-show marking | High | 2026-03-17 |
| SCR-012 Audit Logs | [./Hi-Fi/wireframe-SCR-012-audit-logs.html](./Hi-Fi/wireframe-SCR-012-audit-logs.html) | Searchable audit trail viewer | High | 2026-03-17 |
| SCR-013 User Management | [./Hi-Fi/wireframe-SCR-013-user-management.html](./Hi-Fi/wireframe-SCR-013-user-management.html) | Admin CRUD for users with role assignment | High | 2026-03-17 |

### Component Inventory
**Reference**: See [Component Inventory](./component-inventory.md) for detailed component documentation including:
- Complete component specifications
- Component states and variants
- Responsive behavior details
- Reusability analysis
- Implementation priorities

## 4. User Personas & Flows

### Persona 1: Patient
- **Role**: Patient user
- **Goals**: Book appointments, complete intake, upload documents, view dashboard
- **Key Screens**: SCR-001, SCR-002, SCR-005, SCR-006, SCR-007, SCR-008
- **Primary Flow (FL-001)**: SCR-002 Dashboard → SCR-006 Booking → SCR-002 Dashboard (Success Toast)
- **Secondary Flow (FL-002)**: SCR-002 Dashboard → SCR-007 Intake (AI/Manual) → SCR-002 Dashboard (Success Toast)
- **Wireframe References**: wireframe-SCR-002, wireframe-SCR-006, wireframe-SCR-007, wireframe-SCR-008
- **Decision Points**: Slot selection, waitlist opt-in, AI vs manual intake mode

### Persona 2: Staff
- **Role**: Clinical staff member
- **Goals**: Manage queue, review clinical data, resolve conflicts, manage appointments
- **Key Screens**: SCR-001, SCR-003, SCR-005, SCR-009, SCR-010, SCR-011
- **Primary Flow (FL-003)**: SCR-003 Dashboard → SCR-009 Queue Management → Add Walk-in / Mark Arrival
- **Secondary Flow (FL-004)**: SCR-003 Dashboard → SCR-010 Clinical Review → Conflict Resolution → SCR-003 Dashboard
- **Tertiary Flow (FL-006)**: SCR-003 Dashboard → SCR-011 Appointment Mgmt → Mark No Show
- **Wireframe References**: wireframe-SCR-003, wireframe-SCR-009, wireframe-SCR-010, wireframe-SCR-011
- **Decision Points**: Walk-in vs arrival marking, conflict resolution, no-show grace period

### Persona 3: Admin
- **Role**: System administrator
- **Goals**: Manage users, review audit logs, monitor system health
- **Key Screens**: SCR-001, SCR-004, SCR-005, SCR-012, SCR-013
- **Primary Flow (FL-005)**: SCR-004 Dashboard → SCR-013 User Management → Add/Edit/Deactivate User
- **Wireframe References**: wireframe-SCR-004, wireframe-SCR-012, wireframe-SCR-013
- **Decision Points**: User creation vs edit, role assignment, deactivation confirmation

### User Flow Diagrams
- **FL-001**: Patient Appointment Booking — SCR-002 → SCR-006 → SCR-002
- **FL-002**: Patient Intake AI-Assisted — SCR-002 → SCR-007 → SCR-002
- **FL-003**: Staff Queue Management — SCR-003 → SCR-009 → Modal (Walk-in) / Queue Update
- **FL-004**: Staff Clinical Data Review — SCR-003 → SCR-010 → Modal (Conflict) → SCR-003
- **FL-005**: Admin User Management — SCR-004 → SCR-013 → Drawer (User Form) → SCR-013
- **FL-006**: Staff Mark No Show — SCR-003 → SCR-011 → Modal (Confirm) → SCR-011

## 5. Screen Hierarchy

### Level 1: Authentication
- **SCR-001 Login/Register** (P0 - Critical) — [wireframe-SCR-001-login.html](./Hi-Fi/wireframe-SCR-001-login.html)
  - Description: Authentication entry point for all personas
  - User Entry Point: Yes
  - Key Components: TextField, Button, Link, Checkbox, Alert

### Level 2: Dashboards (Role-Based Entry Points)
- **SCR-002 Patient Dashboard** (P0 - Critical) — [wireframe-SCR-002-patient-dashboard.html](./Hi-Fi/wireframe-SCR-002-patient-dashboard.html)
  - Description: Patient's home with upcoming appointments and quick actions
  - User Entry Point: Yes (post-login for Patient)
  - Key Components: Card, Button, Avatar, Badge, Sidebar

- **SCR-003 Staff Dashboard** (P0 - Critical) — [wireframe-SCR-003-staff-dashboard.html](./Hi-Fi/wireframe-SCR-003-staff-dashboard.html)
  - Description: Staff home with today's appointments, queue overview, high-risk alerts
  - User Entry Point: Yes (post-login for Staff)
  - Key Components: Card, Table, Button, Badge, Sidebar

- **SCR-004 Admin Dashboard** (P0 - Critical) — [wireframe-SCR-004-admin-dashboard.html](./Hi-Fi/wireframe-SCR-004-admin-dashboard.html)
  - Description: Admin home with system stats and audit log summary
  - User Entry Point: Yes (post-login for Admin)
  - Key Components: Card, Table, Button, Sidebar

### Level 3: Core Functionality
- **SCR-006 Appointment Booking** (P0 - Critical) — [wireframe-SCR-006-appointment-booking.html](./Hi-Fi/wireframe-SCR-006-appointment-booking.html)
  - Description: Calendar-based appointment slot selection and booking
  - Parent Screen: SCR-002
  - Key Components: Calendar, RadioGroup, Button, Alert

- **SCR-007 Patient Intake** (P0 - Critical) — [wireframe-SCR-007-patient-intake.html](./Hi-Fi/wireframe-SCR-007-patient-intake.html)
  - Description: AI-assisted and manual patient intake form
  - Parent Screen: SCR-002
  - Key Components: TextField, Button, RadioGroup, Toggle, Chat Bubbles

- **SCR-009 Queue Management** (P0 - Critical) — [wireframe-SCR-009-queue-management.html](./Hi-Fi/wireframe-SCR-009-queue-management.html)
  - Description: Real-time queue with walk-in addition and arrival marking
  - Parent Screen: SCR-003
  - Key Components: Table, Button, Badge, Drawer, Modal

- **SCR-010 Clinical Data Review** (P0 - Critical) — [wireframe-SCR-010-clinical-data-review.html](./Hi-Fi/wireframe-SCR-010-clinical-data-review.html)
  - Description: Unified patient profile with conflict detection and resolution
  - Parent Screen: SCR-003
  - Key Components: Card, Badge, Button, Alert, Modal

- **SCR-011 Appointment Management** (P0 - Critical) — [wireframe-SCR-011-appointment-management.html](./Hi-Fi/wireframe-SCR-011-appointment-management.html)
  - Description: Staff appointment operations including no-show and reschedule
  - Parent Screen: SCR-003
  - Key Components: Table, Button, Badge, Modal

- **SCR-013 User Management** (P0 - Critical) — [wireframe-SCR-013-user-management.html](./Hi-Fi/wireframe-SCR-013-user-management.html)
  - Description: Admin CRUD for system users with role assignment
  - Parent Screen: SCR-004
  - Key Components: Table, Button, Drawer, Badge, Modal

### Level 4: Supporting Screens
- **SCR-005 Profile & Settings** (P1 - High Priority) — [wireframe-SCR-005-profile-settings.html](./Hi-Fi/wireframe-SCR-005-profile-settings.html)
  - Description: User profile and settings management for all roles
  - Parent Screen: Any Dashboard
  - Key Components: TextField, Button, Avatar

- **SCR-008 Document Upload** (P1 - High Priority) — [wireframe-SCR-008-document-upload.html](./Hi-Fi/wireframe-SCR-008-document-upload.html)
  - Description: File upload with AI extraction and progress tracking
  - Parent Screen: SCR-002
  - Key Components: FileUpload, ProgressBar, Button

- **SCR-012 Audit Logs** (P1 - High Priority) — [wireframe-SCR-012-audit-logs.html](./Hi-Fi/wireframe-SCR-012-audit-logs.html)
  - Description: Searchable and filterable audit trail viewer
  - Parent Screen: SCR-004
  - Key Components: Table, TextField, Select, Button, Pagination

### Screen Priority Legend
- **P0**: Critical path screens (must-have) — 10 screens
- **P1**: High-priority screens (core functionality) — 3 screens

### Modal/Dialog/Overlay Inventory

| Modal/Dialog Name | Type | Trigger Context | Parent Screen | Priority |
|------------------|------|----------------|---------------|----------|
| Confirmation Dialog | Dialog | Booking confirm, Delete, No-show | SCR-006, SCR-011, SCR-013 | P0 |
| Slot Details Drawer | Drawer | Click time slot | SCR-006 | P0 |
| Patient Details Drawer | Drawer | Click patient in queue | SCR-009 | P0 |
| Conflict Details Modal | Modal | Click conflict badge | SCR-010 | P0 |
| Add Walk-in Modal | Modal | Click "Add Walk-in" | SCR-009 | P0 |
| User Form Drawer | Drawer | Add/Edit user | SCR-013 | P0 |
| Notification Center Drawer | Drawer | Click notification bell | SCR-002, SCR-003, SCR-004 | P1 |

**Modal Behavior Notes:**
- **Responsive Behavior:** Desktop modals → mobile full-screen sheets
- **Trigger Actions:** User button clicks or row-level actions
- **Dismissal Actions:** Close button, overlay click, ESC key
- **Focus Management:** Tab trap within modal, return focus on close
- **Accessibility:** ARIA role="dialog", aria-labelledby, aria-describedby

## 6. Navigation Architecture

```
SCR-001 Login/Register
+-- [Patient] SCR-002 Patient Dashboard
|   +-- SCR-006 Appointment Booking
|   +-- SCR-007 Patient Intake
|   +-- SCR-008 Document Upload
|   +-- SCR-005 Profile & Settings
|
+-- [Staff] SCR-003 Staff Dashboard
|   +-- SCR-009 Queue Management
|   +-- SCR-010 Clinical Data Review
|   +-- SCR-011 Appointment Management
|   +-- SCR-005 Profile & Settings
|
+-- [Admin] SCR-004 Admin Dashboard
    +-- SCR-013 User Management
    +-- SCR-012 Audit Logs
    +-- SCR-005 Profile & Settings
```

### Navigation Patterns
- **Primary Navigation**: Sidebar (Desktop) — Persistent left sidebar with role-specific menu items, icons and labels, active state highlight
- **Primary Navigation (Mobile)**: Bottom Navigation — 4-5 primary actions with icons
- **Secondary Navigation**: Breadcrumb trail (Desktop) — for deep navigation; Back button (Mobile)
- **Utility Navigation**: User menu in header — Profile dropdown with logout, settings, role indicator badge

## 7. Interaction Patterns

### Pattern 1: Appointment Booking (FL-001)
- **Trigger**: Patient clicks "Book Appointment" CTA on dashboard
- **Flow**: SCR-002 → SCR-006 (select date → select slot → confirm) → SCR-002 (toast)
- **Screens Involved**: SCR-002, SCR-006
- **Feedback**: Loading spinner on submit, success toast on completion
- **Components Used**: Calendar, RadioGroup, Button, Alert, Toast

### Pattern 2: AI Intake with Mode Switch (FL-002)
- **Trigger**: Patient clicks "Complete Intake" on dashboard
- **Flow**: SCR-002 → SCR-007 AI Mode → (optional switch to Manual Mode) → SCR-002 (toast)
- **Screens Involved**: SCR-002, SCR-007
- **Feedback**: AI typing indicator, form validation inline, success toast
- **Components Used**: Toggle, Chat Bubbles, TextField, Button, Toast

### Pattern 3: Queue Walk-in (FL-003)
- **Trigger**: Staff clicks "Add Walk-in" on queue screen
- **Flow**: SCR-009 → Modal (search patient, fill form) → SCR-009 (queue update with animation)
- **Screens Involved**: SCR-009
- **Feedback**: Queue row pulse animation, success toast
- **Components Used**: Modal, TextField (autocomplete), Button, Table, Toast

### Pattern 4: Conflict Resolution (FL-004)
- **Trigger**: Staff clicks conflict badge on clinical data card
- **Flow**: SCR-010 → Modal (side-by-side comparison, select resolution) → SCR-010 (badge removed)
- **Screens Involved**: SCR-010
- **Feedback**: Conflict badge removed, toast confirmation
- **Components Used**: Modal, RadioGroup, Button, Badge, Alert, Toast

### Pattern 5: User CRUD (FL-005)
- **Trigger**: Admin clicks "Add User" or row edit icon
- **Flow**: SCR-013 → Drawer (form) → SCR-013 (table update)
- **Screens Involved**: SCR-013
- **Feedback**: Table row added/updated, success toast
- **Components Used**: Drawer, TextField, Select, Button, Table, Toast

### Pattern 6: Mark No Show (FL-006)
- **Trigger**: Staff clicks "Mark No Show" on appointment row (enabled after grace period)
- **Flow**: SCR-011 → Modal (confirmation) → SCR-011 (status badge update)
- **Screens Involved**: SCR-011
- **Feedback**: Status badge changes to red "No Show", toast confirmation
- **Components Used**: Button, Modal, Badge, Toast

## 8. Error Handling

### Error Scenario 1: Network Error
- **Trigger**: API request fails (timeout, server error)
- **Error Screen/State**: Toast error notification with retry option
- **User Action**: Click "Retry" or refresh page
- **Recovery Flow**: Optimistic UI rollback → error toast → retry action

### Error Scenario 2: Form Validation Error
- **Trigger**: User submits form with invalid data
- **Error Screen/State**: Inline field-level error messages (red text below field)
- **User Action**: Correct invalid fields
- **Recovery Flow**: Error text clears on valid input → re-submit

### Error Scenario 3: AI Service Unavailable
- **Trigger**: AI API circuit breaker opens (FL-002)
- **Error Screen/State**: Error banner on SCR-007 "AI service unavailable"
- **User Action**: Automatic redirect to manual mode
- **Recovery Flow**: SCR-007 AI Mode → Error Banner → SCR-007 Manual Mode (data preserved)

### Error Scenario 4: Slot Conflict
- **Trigger**: Selected appointment slot no longer available
- **Error Screen/State**: Alert on SCR-006 with waitlist option
- **User Action**: Select different slot or join waitlist
- **Recovery Flow**: Alert → new slot selection or waitlist confirmation

## 9. Responsive Strategy

| Breakpoint | Width | Layout Changes | Navigation Changes | Component Adaptations |
|-----------|-------|----------------|-------------------|---------------------|
| Mobile | 375px | Single column, stacked cards | Bottom nav (4-5 icons) | Full-width buttons, stacked forms |
| Tablet | 768px | 2-column grid | Collapsible sidebar | Condensed tables, side-by-side cards |
| Desktop | 1440px | 12-column grid with sidebar | Persistent left sidebar | Full tables, multi-column layouts |

### Responsive Wireframe Variants
All wireframes are designed at 1440px desktop viewport with responsive CSS media queries for tablet (768px) and mobile (375px) adaptation noted in component specifications.

## 10. Accessibility

### WCAG Compliance
- **Target Level**: AA (WCAG 2.2)
- **Color Contrast**: All text meets 4.5:1 minimum; critical health data meets 7:1
- **Keyboard Navigation**: Full keyboard operability across all screens
- **Screen Reader Support**: ARIA labels, roles, and live regions throughout

### Accessibility Considerations by Screen
| Screen | Key Accessibility Features | Notes |
|--------|---------------------------|-------|
| SCR-001 Login | Focus management, error announcements | Auto-focus on email field |
| SCR-006 Booking | Calendar keyboard nav, slot aria-labels | Arrow keys for date selection |
| SCR-007 Intake | AI chat aria-live, form labels | Live region for AI responses |
| SCR-009 Queue | Live region for queue updates | aria-live="polite" for new entries |
| SCR-010 Clinical Review | Conflict badge aria-labels | aria-describedby for conflict details |

### Focus Order
Tab order follows visual hierarchy: Header → Sidebar/Nav → Main Content (top-to-bottom, left-to-right) → Modals trap focus when open → Return focus to trigger on close.

## 11. Content Strategy

### Content Hierarchy
- **H1**: Page titles (one per screen, e.g., "Patient Dashboard")
- **H2**: Section titles within page (e.g., "Upcoming Appointments")
- **H3**: Card/subsection titles
- **Body Text**: Inter 16px regular for primary content
- **Placeholder Content**: Realistic healthcare data placeholders for wireframes

### Content Types by Screen
| Screen | Content Types | Wireframe Reference |
|--------|--------------|-------------------|
| SCR-002 | Cards, Badges, Text, Buttons | wireframe-SCR-002 |
| SCR-006 | Calendar, Radio options, Alerts | wireframe-SCR-006 |
| SCR-007 | Chat messages, Form fields, Toggles | wireframe-SCR-007 |
| SCR-010 | Data cards, Badges, Alerts, Tables | wireframe-SCR-010 |
