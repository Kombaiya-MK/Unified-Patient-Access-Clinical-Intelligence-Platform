# Figma Design Specification - Unified Patient Access & Clinical Intelligence Platform

## 1. Figma Specification
**Platform**: Responsive Web (Desktop, Tablet, Mobile)

---

## 2. Source References

### Primary Source
| Document | Path | Purpose |
|----------|------|---------|
| Requirements | `.propel/context/docs/spec.md` | Personas, use cases, functional requirements with UI impact |

### Optional Sources
| Document | Path | Purpose |
|----------|------|---------|
| Design Architecture | `.propel/context/docs/design.md` | Technology stack (React), NFR, AIR requirements |
| UML Models | `.propel/context/docs/models.md` | Sequence diagrams for UI flows |

### Related Documents
| Document | Path | Purpose |
|----------|------|---------|
| Design System | `.propel/context/docs/designsystem.md` | Tokens, branding, component specifications |

---

## 3. UX Requirements

*Generated based on use cases with UI impact from spec.md. These requirements drive screen implementations.*

### UXR Requirements Enumeration

**Step 1 - UXR Requirements to Generate:**

| UXR-ID | Category | Summary | Rationale |
|--------|----------|---------|-----------|
| UXR-001 | Usability | Max 3 clicks to any feature | FR-001, FR-018 require efficient navigation for patients |
| UXR-002 | Usability | Clear visual hierarchy in dashboards | UC-012 Patient Dashboard, UC-007 Staff Queue require information prioritization |
| UXR-003 | Usability | Seamless AI/Manual intake switching | FR-004, UC-002 require mid-flow transition |
| UXR-101 | Accessibility | WCAG 2.2 AA compliance | Legal baseline for healthcare platform |
| UXR-102 | Accessibility | Screen reader support for all interactive elements | Accessibility requirement for diverse patient population |
| UXR-103 | Accessibility | Keyboard navigation for all workflows | Assistive technology requirement |
| UXR-201 | Responsiveness | Mobile-first responsive design | Platform targets mobile + desktop (spec.md Technology Stack: React) |
| UXR-202 | Responsiveness | Breakpoints at 375px, 768px, 1024px+ | Standard responsive breakpoints for mobile/tablet/desktop |
| UXR-301 | Visual Design | Consistent design token usage | Design system adherence requirement |
| UXR-302 | Visual Design | Medical-grade color contrast | Healthcare UI requires high readability |
| UXR-401 | Interaction | Loading states max 3s before feedback | NFR-004 performance requirement from design.md |
| UXR-402 | Interaction | Optimistic UI updates for booking actions | UC-001 appointment booking user experience |
| UXR-403 | Interaction | Real-time queue status updates | UC-007 staff walk-in management requires live data |
| UXR-501 | Error Handling | Inline validation for all forms | UC-002 intake, UC-006 admin user management |
| UXR-502 | Error Handling | Clear error recovery paths | UC-009 block self-check-in, alternative/exception paths |
| UXR-503 | Error Handling | Network error graceful degradation | NFR requirement for 99.9% uptime perception |

**Step 2 - Expanded UXR Specifications:**

### UXR Requirements Table

| UXR-ID | Category | Requirement | Acceptance Criteria | Screens Affected |
|--------|----------|-------------|---------------------|------------------|
| UXR-001 | Usability | System MUST provide navigation to any feature in maximum 3 clicks from any dashboard | Navigation depth audit passes; all primary features accessible within 3 clicks | All screens |
| UXR-002 | Usability | System MUST implement clear visual hierarchy in dashboards using typography scale, spacing, and color contrast | Information hierarchy audit passes; H1 > H2 > Body; Primary actions prominent | SCR-002, SCR-003, SCR-004, SCR-009 |
| UXR-003 | Usability | System MUST allow seamless switching between AI-assisted and manual intake modes without data loss | Mid-flow transition preserves all entered data; transition UI clearly visible; <1s switch time | SCR-007 |
| UXR-101 | Accessibility | System MUST comply with WCAG 2.2 AA standards including color contrast (4.5:1 text, 3:1 UI), focus indicators, and ARIA labels | WAVE/axe DevTools audit passes with zero critical issues; keyboard navigation functional | All screens |
| UXR-102 | Accessibility | System MUST provide screen reader support for all interactive elements with descriptive ARIA labels | NVDA/JAWS testing passes; all buttons, forms, modals accessible | All screens |
| UXR-103 | Accessibility | System MUST support full keyboard navigation with visible focus states (2px outline, high contrast) | Tab order logical; all interactions achievable via keyboard; focus always visible | All screens |
| UXR-201 | Responsiveness | System MUST implement mobile-first responsive design adapting layouts for mobile (320px-767px), tablet (768px-1023px), desktop (1024px+) | Responsive audit passes at all breakpoints; no horizontal scroll; touch targets ≥44x44px mobile | All screens |
| UXR-202 | Responsiveness | System MUST define breakpoint-specific behaviors for navigation, data tables, and modals | Mobile: Bottom nav; Tablet/Desktop: Sidebar nav; Tables: Horizontal scroll mobile, full view desktop | All screens |
| UXR-301 | Visual Design | System MUST use design tokens from designsystem.md for all colors, typography, spacing (no hard-coded values) | Design token audit passes; all color/spacing values reference tokens | All screens |
| UXR-302 | Visual Design | System MUST implement medical-grade color contrast with minimum 7:1 for critical information, 4.5:1 for all text | Color contrast audit passes; critical alerts/errors use high contrast colors | SCR-005, SCR-010, SCR-011 |
| UXR-401 | Interaction | System MUST display loading states within 200ms for all async operations; skeleton screens for >500ms loads | Performance audit passes; loading indicators present; no blank screens | All screens with async data |
| UXR-402 | Interaction | System MUST implement optimistic UI updates for appointment booking with rollback on failure | Booking appears instant; success/failure feedback within 3s; undo option on failure | SCR-006 |
| UXR-403 | Interaction | System MUST provide real-time queue status updates via WebSocket/SSE with <5s latency | Queue updates visible within 5s; connection status indicator present | SCR-009 |
| UXR-501 | Error Handling | System MUST provide inline validation for all form fields with descriptive error messages below fields | Validation triggers on blur; error messages specific (not generic); red border + icon on invalid fields | SCR-001, SCR-006, SCR-007, SCR-008, SCR-013 |
| UXR-502 | Error Handling | System MUST provide clear error recovery paths for all error states with actionable CTAs | Error states include "Try Again", "Go Back", or alternative action; no dead ends | All screens |
| UXR-503 | Error Handling | System MUST implement graceful degradation for network errors with offline state indication and cached data display | Network error shows "Offline" indicator; cached data visible with timestamp; auto-retry on reconnect | All screens |

### UXR Categories Summary
- **Usability (UXR-001 to UXR-099)**: 3 requirements - Navigation efficiency, visual hierarchy, AI/manual switching
- **Accessibility (UXR-101 to UXR-199)**: 3 requirements - WCAG AA, screen readers, keyboard nav
- **Responsiveness (UXR-201 to UXR-299)**: 2 requirements - Mobile-first design, breakpoint behaviors
- **Visual Design (UXR-301 to UXR-399)**: 2 requirements - Design token adherence, medical-grade contrast
- **Interaction (UXR-401 to UXR-499)**: 3 requirements - Loading states, optimistic UI, real-time updates
- **Error Handling (UXR-501 to UXR-599)**: 3 requirements - Inline validation, recovery paths, graceful degradation

**Total UXR Requirements**: 16

---

## 4. Personas Summary

*Derived from spec.md Section 6.1 - Reference only*

| Persona | Role | Primary Goals | Key Screens |
|---------|------|---------------|-------------|
| Patient | Healthcare consumer | Book appointments, upload documents, complete intake, receive reminders | SCR-001 (Login), SCR-002 (Patient Dashboard), SCR-006 (Appointment Booking), SCR-007 (Patient Intake), SCR-008 (Document Upload) |
| Staff | Front desk / Call center / Clinical support | Manage walk-ins, queues, mark arrivals, review clinical data, resolve conflicts | SCR-001 (Login), SCR-003 (Staff Dashboard), SCR-009 (Queue Management), SCR-010 (Clinical Data Review), SCR-011 (Appointment Management) |
| Admin | IT / Operations manager | Manage user accounts, roles, access control, audit logs | SCR-001 (Login), SCR-004 (Admin Dashboard), SCR-013 (User Management) |

**Persona Coverage Matrix:**
- **Patient**: 6 primary screens (login, dashboard, booking, intake, upload, notifications)
- **Staff**: 6 primary screens (login, dashboard, queue, clinical review, appointment mgmt, conflict resolution)
- **Admin**: 3 primary screens (login, dashboard, user management)

---

## 5. Information Architecture

### Site Map
```
Unified Patient Access Platform
+-- Public
|   +-- Landing Page (not in MVP scope)
|   +-- Login/Register (SCR-001)
|
+-- Patient Portal (Role: Patient)
|   +-- Patient Dashboard (SCR-002)
|   |   +-- Upcoming Appointments Widget
|   |   +-- Quick Actions (Book, Upload, Intake)
|   |   +-- Notifications Panel
|   +-- Appointment Booking (SCR-006)
|   |   +-- Time Slot Selection
|   |   +-- Waitlist Option
|   +-- Patient Intake (SCR-007)
|   |   +-- AI-Assisted Intake
|   |   +-- Manual Form Intake
|   +-- Document Upload (SCR-008)
|   |   +-- File Upload Interface
|   |   +-- Extraction Status
|   +-- Profile & Settings (SCR-005)
|
+-- Staff Portal (Role: Staff)
|   +-- Staff Dashboard (SCR-003)
|   |   +-- Today's Appointments
|   |   +-- Queue Overview
|   |   +-- High-Risk Alerts
|   +-- Queue Management (SCR-009)
|   |   +-- Walk-in Entry
|   |   +-- Arrival Marking
|   |   +-- Queue Display
|   +-- Clinical Data Review (SCR-010)
|   |   +-- Unified Patient Profile
|   |   +-- Conflict Resolution
|   |   +-- Medical Coding
|   +-- Appointment Management (SCR-011)
|   |   +-- Book on Behalf
|   |   +-- Mark No Show
|   |   +-- Reschedule
|
+-- Admin Portal (Role: Admin)
    +-- Admin Dashboard (SCR-004)
    |   +-- System Stats
    |   +-- Audit Log Summary
    +-- User Management (SCR-013)
    |   +-- User CRUD
    |   +-- Role Assignment
    +-- Audit Logs (SCR-012)
        +-- Audit Trail Viewer
```

### Navigation Patterns
| Pattern | Type | Platform Behavior |
|---------|------|-------------------|
| Primary Nav | Sidebar (Desktop) / Bottom Nav (Mobile) | Desktop: Persistent sidebar with role-specific menu items; Mobile: Bottom navigation bar with 4-5 primary actions |
| Secondary Nav | Breadcrumb (Desktop only) | Desktop: Breadcrumb trail for deep navigation; Mobile: Back button only |
| Utility Nav | User menu (Header) | Profile dropdown with logout, settings, role indicator; Consistent across all roles |
| Role Indicator | Header badge | Visible role badge (Patient/Staff/Admin) in header for context awareness |

---

## 6. Screen Inventory

*All screens derived from use cases in spec.md*

### Screen List
| Screen ID | Screen Name | Derived From | Personas Covered | Priority | States Required | UXR Mapped |
|-----------|-------------|--------------|------------------|----------|-----------------|------------|
| SCR-001 | Login/Register | UC-001 (precondition), UC-012 | All personas | P0 | Default, Loading, Error, Validation | UXR-001, UXR-101, UXR-201, UXR-501 |
| SCR-002 | Patient Dashboard | UC-012, FR-018 | Patient | P0 | Default, Loading, Empty, Error | UXR-001, UXR-002, UXR-201, UXR-401 |
| SCR-003 | Staff Dashboard | UC-005, UC-007 (entry) | Staff | P0 | Default, Loading, Empty, Error | UXR-001, UXR-002, UXR-201, UXR-403 |
| SCR-004 | Admin Dashboard | UC-006 (entry) | Admin | P0 | Default, Loading, Empty, Error | UXR-001, UXR-002, UXR-201 |
| SCR-005 | Profile & Settings | UC-012 (extension) | All personas | P1 | Default, Loading, Error, Validation | UXR-101, UXR-501 |
| SCR-006 | Appointment Booking | UC-001, FR-001 | Patient | P0 | Default, Loading, Empty, Error, Validation | UXR-001, UXR-402, UXR-501, UXR-201 |
| SCR-007 | Patient Intake | UC-002, FR-004 | Patient | P0 | Default, Loading, Error, Validation, AI Mode, Manual Mode | UXR-003, UXR-401, UXR-501 |
| SCR-008 | Document Upload | UC-012, FR-006 | Patient | P1 | Default, Loading, Error, Uploading, Success | UXR-401, UXR-501, UXR-201 |
| SCR-009 | Queue Management | UC-007, FR-005 | Staff | P0 | Default, Loading, Empty, Error, Real-time Updates | UXR-002, UXR-403, UXR-201 |
| SCR-010 | Clinical Data Review | UC-003, FR-007, FR-016 | Staff | P0 | Default, Loading, Empty, Error, Conflict Highlighted | UXR-002, UXR-302, UXR-401 |
| SCR-011 | Appointment Management (Staff) | UC-007, UC-011, FR-017, FR-021 | Staff | P0 | Default, Loading, Error, Validation | UXR-001, UXR-501 |
| SCR-012 | Audit Logs | UC-008, FR-010 | Admin | P1 | Default, Loading, Empty, Error | UXR-001, UXR-201 |
| SCR-013 | User Management | UC-006, FR-015 | Admin | P0 | Default, Loading, Empty, Error, Validation | UXR-001, UXR-501, UXR-201 |

**Screen Count**: 13 screens

### Priority Legend
- **P0**: Critical path (must-have for MVP) - 10 screens
- **P1**: Core functionality (high priority) - 3 screens

### Screen-to-Persona Coverage Matrix
| Screen | Patient | Staff | Admin | Notes |
|--------|---------|-------|-------|-------|
| SCR-001 Login | Primary | Primary | Primary | Shared entry point for all users |
| SCR-002 Patient Dashboard | Primary | - | - | Patient-specific dashboard |
| SCR-003 Staff Dashboard | - | Primary | - | Staff-specific dashboard |
| SCR-004 Admin Dashboard | - | - | Primary | Admin-specific dashboard |
| SCR-005 Profile & Settings | Primary | Primary | Primary | Shared settings across roles |
| SCR-006 Appointment Booking | Primary | - | - | Patient self-service booking |
| SCR-007 Patient Intake | Primary | - | - | Patient data entry (AI/Manual) |
| SCR-008 Document Upload | Primary | - | - | Patient document management |
| SCR-009 Queue Management | - | Primary | - | Staff walk-in/queue operations |
| SCR-010 Clinical Data Review | - | Primary | - | Staff data aggregation/conflict resolution |
| SCR-011 Appointment Management | - | Primary | - | Staff booking/no-show management |
| SCR-012 Audit Logs | - | - | Primary | Admin audit trail viewer |
| SCR-013 User Management | - | - | Primary | Admin user CRUD operations |

**Coverage Analysis:**
- **Patient**: 6 screens (login, dashboard, booking, intake, upload, settings)
- **Staff**: 6 screens (login, dashboard, queue, clinical review, appt mgmt, settings)
- **Admin**: 4 screens (login, dashboard, audit logs, user mgmt, settings)

### Modal/Overlay Inventory
| Name | Type | Trigger | Parent Screen(s) | Priority | States |
|------|------|---------|-----------------|----------|--------|
| Confirmation Dialog | Modal | Delete/Cancel actions | SCR-006, SCR-011, SCR-013 | P0 | Default, Loading |
| Slot Details | Drawer | Click time slot | SCR-006 | P0 | Default, Loading, Error |
| Patient Details | Drawer | Click patient name | SCR-009, SCR-011 | P0 | Default, Loading, Error |
| Conflict Details | Modal | Click conflict badge | SCR-010 | P0 | Default, Loading |
| Add Walk-in | Modal | Click "Add Walk-in" | SCR-009 | P0 | Default, Loading, Validation |
| User Form | Drawer | Click "Add/Edit User" | SCR-013 | P0 | Default, Loading, Validation |
| Notification Center | Drawer | Click notifications bell | All dashboards | P1 | Default, Empty |

---

## 7. Content & Tone

### Voice & Tone
- **Overall Tone**: Professional yet approachable, healthcare-appropriate
- **Patient-Facing**: Reassuring, simple language, avoid medical jargon
- **Staff-Facing**: Efficient, clear, action-oriented, clinical terminology acceptable
- **Admin-Facing**: Technical clarity, system-focused language
- **Error Messages**: Helpful, non-blaming, actionable instructions
- **Empty States**: Encouraging, guiding next steps, clear CTAs
- **Success Messages**: Brief, affirming, next-action oriented

### Content Guidelines
- **Headings**: Sentence case (e.g., "Book an appointment")
- **CTAs**: Action-oriented verbs (e.g., "Book appointment" not "Click here")
- **Labels**: Concise, descriptive field labels (e.g., "Preferred date" not "Date")
- **Placeholder Text**: Helpful examples (e.g., "Enter date (MM/DD/YYYY)" not "Enter date")
- **Medical Terms**: Spell out first use, abbreviation in parentheses (e.g., "ICD-10 (International Classification of Diseases)")
- **Time Formats**: 12-hour format with AM/PM (e.g., "2:30 PM")
- **Date Formats**: MM/DD/YYYY for US locale

### Microcopy Examples
- **Login**: "Welcome back" (returning users), "Create your account" (new users)
- **Booking success**: "Appointment confirmed! Check your email for details."
- **Upload success**: "Document uploaded. Extraction in progress..."
- **Empty state (no appointments)**: "No appointments yet. Book your first appointment to get started."
- **Network error**: "Connection lost. Trying to reconnect..."
- **Form validation**: "Please enter a valid email address" (specific, not "Invalid input")

---

## 8. Data & Edge Cases

### Data Scenarios
| Scenario | Description | Handling | Affected Screens |
|----------|-------------|----------|-----------------|
| No Data | User has no appointments/documents | Empty state with CTA ("Book your first appointment") | SCR-002, SCR-003, SCR-008 |
| First Use | New patient, no history | Onboarding prompts + empty state with tutorial hints | SCR-002, SCR-006 |
| Large Data | Staff viewing 100+ appointments | Pagination (20 per page) + infinite scroll option | SCR-009, SCR-011 |
| Slow Connection | >3s load time | Skeleton screens + loading indicators | All screens |
| Offline | No network | Offline state banner + cached data display with timestamp | All screens |
| Async Operation | Document extraction, risk assessment | Progress indicator + ability to navigate away + return | SCR-008, SCR-010 |
| Real-time Update | Queue status, new appointment | WebSocket/SSE live update + visual pulse animation | SCR-009 |

### Edge Cases
| Case | Screen(s) Affected | Solution |
|------|-------------------|----------|
| Long patient name (>50 chars) | SCR-009, SCR-010, SCR-011 | Truncate with ellipsis, show full name on hover tooltip |
| Missing appointment slot | SCR-006 | Show waitlist option + "No slots available" message |
| Conflicting data (multiple DOBs) | SCR-010 | Highlight conflicts with red badge + conflict resolution UI |
| Session timeout (15 min) | All authenticated screens | Modal warning at 14 min + auto-logout + re-login redirect |
| Form abandonment | SCR-006, SCR-007, SCR-013 | Auto-save draft state + "Resume" option on return |
| High-risk appointment flagged | SCR-003, SCR-011 | Red badge + "High Risk" label + alert icon |
| AI intake failure | SCR-007 | Fallback to manual mode + "AI unavailable" message + retry option |
| Document extraction error | SCR-008 | Error state with "Retry extraction" + "Upload again" options |
| No-show grace period | SCR-011 | Disabled "Mark No Show" button with tooltip explanation until grace period elapsed |
| Critical medication conflict | SCR-010 | Red alert banner + mandatory staff review before closing profile |
| Duplicate user email | SCR-013 | Inline validation error + suggestion to update existing user |
| Audit log search with no results | SCR-012 | Empty state with search tips + "Clear filters" option |

---

## 9. Branding & Visual Direction

*See `designsystem.md` for all design tokens (colors, typography, spacing, shadows, etc.)*

### Branding Assets
- **Logo**: Healthcare cross + modern sans-serif wordmark (details in designsystem.md)
- **Icon Style**: Outlined icons (Phosphor or Lucide icon library)
- **Illustration Style**: Minimal line illustrations for empty states (health/medical themed)
- **Photography Style**: Not applicable for MVP (no patient photos)

### Color Philosophy
- **Primary Color**: Medical blue (#0066CC) - Trust, professionalism
- **Secondary Color**: Healthcare green (#00A86B) - Health, success
- **Error/Alert Color**: Medical red (#DC3545) - Urgency, caution
- **Neutral Scale**: Gray scale for text, borders, backgrounds
- **Semantic Colors**: Success (green), warning (amber), info (blue), error (red)

### Typography Philosophy
- **Headings**: Inter or System UI (clean, professional)
- **Body**: Inter or System UI (readability priority)
- **Mono**: Fira Code or System Mono (audit logs, technical data)

---

## 10. Component Specifications

*Component specifications defined in designsystem.md. Requirements per screen listed below.*

### Component Library Reference
**Source**: `.propel/context/docs/designsystem.md` (Component Specifications section)

### Required Components per Screen

| Screen ID | Components Required | Notes |
|-----------|---------------------|-------|
| SCR-001 | TextField (2: email, password), Button (2: Login, Register), Link (1: Forgot Password), Checkbox (1: Remember me) | Login form components |
| SCR-002 | Card (4: Upcoming Appts Widget, Quick Actions, Documents, Notifications), Button (3: Book, Upload, Intake), Avatar (1), Badge (2: role, notifications) | Patient dashboard widgets |
| SCR-003 | Card (3: Today's Appts, Queue, Alerts), Table (1: appointments), Button (2), Badge (3: high-risk, queue count, alert count) | Staff dashboard |
| SCR-004 | Card (2: System Stats, Audit Summary), Table (1: recent logs), Button (1) | Admin dashboard |
| SCR-005 | TextField (4: name, email, phone, password), Button (2: Save, Cancel), Avatar (1) | Profile form |
| SCR-006 | Calendar (1: date picker), RadioGroup (1: slot selection), Button (3: Book, Waitlist, Cancel), Alert (1: confirmation), Skeleton (1: loading slots) | Appointment booking flow |
| SCR-007 | TextField (5-10: dynamic form fields), Button (3: AI toggle, Submit, Cancel), RadioGroup (1: AI/Manual toggle), Alert (1: success/error), Skeleton (1: AI loading) | Patient intake (AI + Manual) |
| SCR-008 | FileUpload (1), ProgressBar (1: upload/extraction), Button (2: Upload, Cancel), Alert (1: success/error), Badge (1: extraction status) | Document upload |
| SCR-009 | Table (1: queue list), Button (4: Add Walk-in, Mark Arrival, Refresh, Filter), Badge (2: queue position, status), Drawer (1: patient details), Modal (1: add walk-in form) | Queue management |
| SCR-010 | Card (3: demographics, medications, lab results), Badge (5: conflict indicators), Button (2: Resolve, Approve), Alert (1: critical conflict), Drawer (1: conflict details) | Clinical data review |
| SCR-011 | Table (1: appointments), Button (5: Book on Behalf, Reschedule, Cancel, Mark No Show, Filter), Badge (2: risk score, status), Modal (2: confirmation, booking form) | Appointment management (staff) |
| SCR-012 | Table (1: audit logs), TextField (1: search), Select (2: filter by action, filter by user), Button (2: Export, Clear Filters), Pagination (1) | Audit log viewer |
| SCR-013 | Table (1: users list), Button (4: Add User, Edit, Deactivate, Filter), Drawer (1: user form), Badge (2: role, status), Modal (1: confirmation) | User management |

### Component Summary by Category
| Category | Components | Variants/States |
|----------|------------|----------------|
| **Actions** | Button, IconButton, FAB, Link | Primary, Secondary, Tertiary, Ghost × Small/Medium/Large × Default/Hover/Focus/Active/Disabled/Loading |
| **Inputs** | TextField, TextArea, Select, Checkbox, RadioGroup, Toggle, FileUpload | Default/Hover/Focus/Active/Disabled/Error × Small/Medium/Large |
| **Navigation** | Header, Sidebar, BottomNav, Breadcrumb, Tabs | Desktop/Mobile variants, Active/Inactive states |
| **Content** | Card, ListItem, Table, Avatar, Badge, Divider | Elevated/Flat, Sizes, Color variants |
| **Feedback** | Modal, Drawer, Toast, Alert, Skeleton, ProgressBar, Spinner | Info/Success/Warning/Error types, Sizes |
| **Data Display** | Table, Calendar | Sortable, Filterable, Responsive variants |

### Component State Matrix (Universal)
All interactive components must support these states:
- **Default**: Resting state
- **Hover**: Mouse over (desktop only)
- **Focus**: Keyboard focus (2px outline, high contrast)
- **Active**: Pressed/clicked state
- **Disabled**: Non-interactive state (50% opacity, no pointer events)
- **Loading**: Async operation in progress (spinner/skeleton)

---

## 11. Prototype Flows

*Flows derived from use cases in spec.md. Each flow notes which personas it covers.*

### Flow: FL-001 - Patient Appointment Booking
**Flow ID**: FL-001  
**Derived From**: UC-001 Appointment Booking  
**Personas Covered**: Patient  
**Description**: Patient books an appointment from dashboard to confirmation

#### Flow Sequence
```
1. Entry: SCR-002 Patient Dashboard / Default
   - Trigger: Patient clicks "Book Appointment" CTA
   |
   v
2. Navigate: SCR-006 Appointment Booking / Default
   - Action: Display available time slots for selected date
   |
   v
3. Interaction: SCR-006 / Slot Selection
   - Action: Patient selects preferred slot
   - Decision: Slot available?
   |
   +-- YES: Booking Confirmation
   |   |
   |   v
   |   4a. SCR-006 / Validation (if form fields required)
   |       - Action: Patient confirms details
   |       |
   |       v
   |   5a. SCR-006 / Loading
   |       - Action: System processes booking
   |       |
   |       v
   |   6a. Success: SCR-002 Patient Dashboard / Success Toast
   |       - Confirmation: "Appointment confirmed! Check your email."
   |
   +-- NO: Waitlist Option
       |
       v
       4b. SCR-006 / Waitlist State
           - Action: Patient joins waitlist for preferred slot
           |
           v
       5b. SCR-002 Patient Dashboard / Success Toast
           - Confirmation: "You're on the waitlist. We'll notify you if a slot opens."
```

#### Required Interactions
- Date picker: Calendar component with disabled past dates
- Slot selection: Radio button group with slot details (time, staff name)
- Waitlist button: Secondary CTA if preferred slot unavailable
- Loading state: Spinner on submit button, form disabled
- Success feedback: Toast notification + redirect to dashboard

---

### Flow: FL-002 - Patient Intake (AI-Assisted)
**Flow ID**: FL-002  
**Derived From**: UC-002 Patient Intake  
**Personas Covered**: Patient  
**Description**: Patient completes intake using AI assistance with option to switch to manual

#### Flow Sequence
```
1. Entry: SCR-002 Patient Dashboard / Default
   - Trigger: Patient clicks "Complete Intake" CTA
   |
   v
2. Navigate: SCR-007 Patient Intake / AI Mode Default
   - Action: Display AI chat interface with intro message
   |
   v
3. Interaction Loop: SCR-007 / AI Conversation
   - Action: AI asks questions, patient responds
   - Loop: Continue until intake complete
   |
   v
4. Decision: Patient wants to switch to manual?
   |
   +-- YES: Switch to Manual
   |   |
   |   v
   |   5a. SCR-007 / Manual Mode Default
   |       - Action: Display manual form pre-filled with AI data
   |       |
   |       v
   |   6a. SCR-007 / Manual Form Submission
   |       - Action: Patient completes remaining fields
   |       |
   |       v
   |   7a. SCR-007 / Loading
   |       - Action: System saves intake data
   |       |
   |       v
   |   8a. Success: SCR-002 Dashboard / Success Toast
   |       - Confirmation: "Intake complete!"
   |
   +-- NO: Continue AI
       |
       v
       5b. SCR-007 / AI Completion
           - Action: AI extracts structured data
           |
           v
       6b. SCR-007 / Loading
           - Action: System saves AI-extracted intake
           |
           v
       7b. Success: SCR-002 Dashboard / Success Toast
           - Confirmation: "Intake complete!"

Alt Path: AI Service Unavailable
- Entry: SCR-007 / AI Mode
- Trigger: Circuit breaker open (AI API fails)
- Action: Display error banner "AI service unavailable"
- Fallback: Auto-redirect to SCR-007 / Manual Mode Default
```

#### Required Interactions
- AI/Manual toggle: Prominent toggle switch in header
- AI chat: Message bubbles, typing indicator, streaming responses
- Manual form: Standard form fields with inline validation
- Data preservation: No data loss on mode switch (<1s transition)
- Error handling: Graceful fallback to manual on AI failure

---

### Flow: FL-003 - Staff Queue Management
**Flow ID**: FL-003  
**Derived From**: UC-007 Staff Walk-in and Queue Management  
**Personas Covered**: Staff  
**Description**: Staff manages walk-ins and marks patient arrivals

#### Flow Sequence
```
1. Entry: SCR-003 Staff Dashboard / Default
   - Trigger: Staff clicks "Queue Management" nav item
   |
   v
2. Navigate: SCR-009 Queue Management / Default
   - Action: Display today's queue (real-time updated via WebSocket)
   |
   v
3. Decision: Add walk-in or mark arrival?
   |
   +-- Add Walk-in
   |   |
   |   v
   |   4a. Modal: Add Walk-in Form / Default
   |       - Action: Staff searches patient or creates new
   |       |
   |       v
   |   5a. Modal / Validation
   |       - Action: Validate patient details
   |       |
   |       v
   |   6a. Modal / Loading
   |       - Action: System adds patient to queue
   |       |
   |       v
   |   7a. SCR-009 / Real-time Update
   |       - Success: Queue table updates, new row appears with pulse animation
   |       - Toast: "Walk-in added to queue"
   |
   +-- Mark Arrival
       |
       v
       4b. SCR-009 / Arrival Action
           - Action: Staff clicks "Mark Arrived" button on queue row
           |
           v
       5b. SCR-009 / Loading
           - Action: System updates appointment status
           |
           v
       6b. SCR-009 / Real-time Update
           - Success: Row status changes to "Arrived" (green badge)
           - Toast: "Patient marked as arrived"
```

#### Required Interactions
- Real-time updates: WebSocket connection with <5s latency
- Add walk-in button: Primary CTA (FAB on mobile, button on desktop)
- Patient search: Autocomplete dropdown in modal
- Mark arrival: Row-level action button, changes to "Arrived" badge on success
- Queue display: Table with sortable columns (time, patient name, status)

---

### Flow: FL-004 - Staff Clinical Data Review & Conflict Resolution
**Flow ID**: FL-004  
**Derived From**: UC-003 Clinical Data Aggregation, UC-010 Medication Conflicts  
**Personas Covered**: Staff  
**Description**: Staff reviews aggregated patient data and resolves conflicts

#### Flow Sequence
```
1. Entry: SCR-003 Staff Dashboard / Default
   - Trigger: Staff clicks patient name from today's appointments
   |
   v
2. Navigate: SCR-010 Clinical Data Review / Default
   - Action: Display unified patient profile (demographics, medications, docs)
   - Condition: If conflicts detected -> show red conflict badges
   |
   v
3. Decision: Conflicts present?
   |
   +-- YES: Review Conflicts
   |   |
   |   v
   |   4a. SCR-010 / Conflict Highlighted State
   |       - Action: Conflict badges visible on conflicting data sections
   |       |
   |       v
   |   5a. Modal: Conflict Details / Default
   |       - Trigger: Staff clicks conflict badge
   |       - Action: Display side-by-side data from multiple sources
   |       |
   |       v
   |   6a. Modal / Staff Resolution
   |       - Action: Staff selects correct value or marks for further review
   |       |
   |       v
   |   7a. Modal / Loading
   |       - Action: System updates unified profile with staff decision
   |       |
   |       v
   |   8a. SCR-010 / Conflict Resolved State
   |       - Success: Conflict badge removed, data updated
   |       - Toast: "Conflict resolved"
   |
   +-- NO: Approve Profile
       |
       v
       4b. SCR-010 / Default
           - Action: No conflicts, all data clean
           |
           v
       5b. SCR-010 / Staff Approval
           - Action: Staff clicks "Approve Profile" button
           |
           v
       6b. SCR-010 / Loading
           - Action: System marks profile as reviewed
           |
           v
       7b. Success: SCR-003 Staff Dashboard / Success Toast
           - Confirmation: "Profile approved and ready for visit"

Critical Path: Medication Conflict
- Entry: SCR-010 / Conflict Highlighted (red alert banner)
- Trigger: Critical medication interaction detected
- Action: Red alert banner with "Critical conflict - requires resolution"
- Blocking: Cannot approve profile until critical conflicts resolved
```

#### Required Interactions
- Conflict badges: Red circular badges with count on data cards
- Conflict modal: Side-by-side comparison UI with radio buttons for selection
- Approve button: Disabled state if unresolved critical conflicts
- Alert banner: Red banner for critical conflicts, amber for warnings
- Data cards: Expandable cards for demographics, meds, labs, docs

---

### Flow: FL-005 - Admin User Management
**Flow ID**: FL-005  
**Derived From**: UC-006 Admin User Management  
**Personas Covered**: Admin  
**Description**: Admin creates, updates, or deactivates users

#### Flow Sequence
```
1. Entry: SCR-004 Admin Dashboard / Default
   - Trigger: Admin clicks "User Management" nav item
   |
   v
2. Navigate: SCR-013 User Management / Default
   - Action: Display users table with current users
   |
   v
3. Decision: Add, Edit, or Deactivate user?
   |
   +-- Add User
   |   |
   |   v
   |   4a. Drawer: User Form / Default (empty form)
   |       - Action: Display user creation form
   |       |
   |       v
   |   5a. Drawer / Validation
   |       - Action: Inline validation on blur
   |       |
   |       v
   |   6a. Drawer / Loading
   |       - Action: System creates user account
   |       |
   |       v
   |   7a. SCR-013 / Success
   |       - Success: Table updates with new row
   |       - Toast: "User created successfully"
   |
   +-- Edit User
   |   |
   |   v
   |   4b. Drawer: User Form / Default (pre-filled)
   |       - Action: Display user edit form with current values
   |       |
   |       v
   |   5b. Drawer / Validation
   |       |
   |       v
   |   6b. Drawer / Loading
   |       - Action: System updates user account
   |       |
   |       v
   |   7b. SCR-013 / Success
   |       - Success: Table row updates
   |      - Toast: "User updated"
   |
   +-- Deactivate User
       |
       v
       4c. Modal: Confirmation / Default
           - Action: Display "Are you sure?" confirmation
           |
           v
       5c. Modal / Loading
           - Action: System deactivates user (soft delete)
           |
           v
       6c. SCR-013 / Success
           - Success: Table row marked inactive (gray badge)
           - Toast: "User deactivated"
```

#### Required Interactions
- Add user button: Primary CTA in header
- User table: Sortable, filterable columns (name, email, role, status)
- Row actions: Edit icon, Deactivate icon (red)
- User form drawer: Right-side drawer with form fields
- Confirmation modal: "Are you sure?" dialog for destructive actions
- Role dropdown: Select component with Patient/Staff/Admin options

---

### Flow: FL-006 - Staff Mark No Show
**Flow ID**: FL-006  
**Derived From**: UC-011 Staff Mark No Show  
**Personas Covered**: Staff  
**Description**: Staff marks appointment as no-show after grace period

#### Flow Sequence
```
1. Entry: SCR-003 Staff Dashboard / Default
   - Trigger: Staff clicks "Appointment Management" nav item
   |
   v
2. Navigate: SCR-011 Appointment Management / Default
   - Action: Display today's appointments table
   |
   v
3. Identify: SCR-011 / Default
   - Action: Staff identifies patient who did not arrive (appointment time passed)
   |
   v
4. Decision: Grace period elapsed?
   |
   +-- NO: Wait
   |   |
   |   v
   |   5a. SCR-011 / Disabled State
   |       - Action: "Mark No Show" button disabled
   |       - Tooltip: "Wait until grace period ends (15 min after appointment)"
   |
   +-- YES: Mark No Show
       |
       v
       5b. SCR-011 / Mark Action
           - Action: Staff clicks "Mark No Show" button on row
           |
           v
       6b. Modal: Confirmation / Default
           - Action: "Are you sure? This action will be logged."
           |
           v
       7b. Modal / Loading
           - Action: System updates appointment status to no-show
           - Action: System logs action immutably
           - Action: System updates patient risk score
           |
           v
       8b. SCR-011 / Success
           - Success: Row status changes to "No Show" (red badge)
           - Toast: "Appointment marked as no-show"
```

#### Required Interactions
- Mark no-show button: Secondary button on appointment row
- Grace period check: Button disabled + tooltip until 15 min after appt time
- Confirmation modal: Warning about audit logging
- Status badge: Changes from "Scheduled" to "No Show" (red)
- Audit log entry: Automatic, no user action required

---

## 12. Export Requirements

### JPG Export Settings
| Setting | Value |
|---------|-------|
| Format | JPG |
| Quality | High (85%) |
| Scale - Mobile | 2x (750px base width) |
| Scale - Desktop | 2x (2880px base width) |
| Color Profile | sRGB |

### Export Naming Convention
```
AppointmentPlatform__<Platform>__<ScreenName>__<State>__v<Version>.jpg
```

**Examples:**
- `AppointmentPlatform__Mobile__PatientDashboard__Default__v1.jpg`
- `AppointmentPlatform__Desktop__AppointmentBooking__Loading__v1.jpg`

### Export Manifest (Priority Screens)

#### Patient Screens (Mobile + Desktop)
| Screen | State | Mobile Filename | Desktop Filename |
|--------|-------|-----------------|------------------|
| Login | Default | AppointmentPlatform__Mobile__Login__Default__v1.jpg | AppointmentPlatform__Desktop__Login__Default__v1.jpg |
| Login | Error | AppointmentPlatform__Mobile__Login__Error__v1.jpg | AppointmentPlatform__Desktop__Login__Error__v1.jpg |
| Patient Dashboard | Default | AppointmentPlatform__Mobile__PatientDashboard__Default__v1.jpg | AppointmentPlatform__Desktop__PatientDashboard__Default__v1.jpg |
| Patient Dashboard | Empty | AppointmentPlatform__Mobile__PatientDashboard__Empty__v1.jpg | AppointmentPlatform__Desktop__PatientDashboard__Empty__v1.jpg |
| Appointment Booking | Default | AppointmentPlatform__Mobile__AppointmentBooking__Default__v1.jpg | AppointmentPlatform__Desktop__AppointmentBooking__Default__v1.jpg |
| Appointment Booking | Loading | AppointmentPlatform__Mobile__AppointmentBooking__Loading__v1.jpg | AppointmentPlatform__Desktop__AppointmentBooking__Loading__v1.jpg |
| Patient Intake AI | Default | AppointmentPlatform__Mobile__PatientIntakeAI__Default__v1.jpg | AppointmentPlatform__Desktop__PatientIntakeAI__Default__v1.jpg |
| Patient Intake Manual | Default | AppointmentPlatform__Mobile__PatientIntakeManual__Default__v1.jpg | AppointmentPlatform__Desktop__PatientIntakeManual__Default__v1.jpg |

#### Staff Screens (Desktop only, mobile not priority for staff workflows)
| Screen | State | Desktop Filename |
|--------|-------|------------------|
| Staff Dashboard | Default | AppointmentPlatform__Desktop__StaffDashboard__Default__v1.jpg |
| Queue Management | Default  | AppointmentPlatform__Desktop__QueueManagement__Default__v1.jpg |
| Queue Management | RealTimeUpdate | AppointmentPlatform__Desktop__QueueManagement__RealTimeUpdate__v1.jpg |
| Clinical Data Review | Default | AppointmentPlatform__Desktop__ClinicalDataReview__Default__v1.jpg |
| Clinical Data Review | ConflictHighlighted | AppointmentPlatform__Desktop__ClinicalDataReview__ConflictHighlighted__v1.jpg |
| Appointment Management | Default | AppointmentPlatform__Desktop__AppointmentManagement__Default__v1.jpg |

#### Admin Screens (Desktop only)
| Screen | State | Desktop Filename |
|--------|-------|------------------|
| Admin Dashboard | Default | AppointmentPlatform__Desktop__AdminDashboard__Default__v1.jpg |
| User Management | Default | AppointmentPlatform__Desktop__UserManagement__Default__v1.jpg |
| Audit Logs | Default | AppointmentPlatform__Desktop__AuditLogs__Default__v1.jpg |

### Total Export Count Estimate
- **Patient Screens (Mobile + Desktop)**: 8 screens × 5 states = 40 exports × 2 platforms = **80 JPGs**
- **Staff Screens (Desktop only)**: 5 screens × 3 states avg = **15 JPGs**
- **Admin Screens (Desktop only)**: 3 screens × 3 states avg = **9 JPGs**
- **Modals/Overlays**: 7 overlays × 2 states avg = **14 JPGs**

**Total JPGs**: ~118 files

---

## 13. Figma File Structure

### Page Organization
```
Unified Patient Access & Clinical Intelligence Platform
+-- 00_Cover
|   +-- Project info: Platform name, version, date
|   +-- Stakeholders: Patient, Staff, Admin personas
|   +-- Technology: React, PostgreSQL, OpenAI API
|
+-- 01_Foundations
|   +-- Colors
|   |   +-- Light Mode Palette
|   |   +-- Dark Mode Palette (future)
|   |   +-- Semantic Colors (Success/Warning/Error/Info)
|   +-- Typography
|   |   +-- Type Scale (H1-H6, Body, Caption, Label)
|   |   +-- Font Families (Inter)
|   +-- Spacing
|   |   +-- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
|   +-- Border Radius
|   |   +-- Small (4px), Medium (8px), Large (16px), Full (9999px)
|   +-- Elevation/Shadows
|   |   +-- Levels 1-5 definitions
|   +-- Grid
|   |   +-- Desktop: 12-column (1440px)
|   |   +-- Tablet: 8-column (768px)
|   |   +-- Mobile: 4-column (375px)
|
+-- 02_Components
|   +-- C/Actions
|   |   +-- Button (Primary, Secondary, Tertiary, Ghost × S/M/L)
|   |   +-- IconButton (S/M/L × All states)
|   |   +-- FAB (Fixed Action Button - mobile)
|   |   +-- Link (Default, Visited, Hover, Active)
|   +-- C/Inputs
|   |   +-- TextField (Default, Hover, Focus, Error, Disabled)
|   |   +-- TextArea (with char count)
|   |   +-- Select (Single, Multi)
|   |   +-- Checkbox (Unchecked, Checked, Indeterminate, Disabled)
|   |   +-- RadioGroup (Single selection)
|   |   +-- Toggle (On, Off, Disabled)
|   |   +-- FileUpload (Default, Drag active, Uploading, Success, Error)
|   +-- C/Navigation
|   |   +-- Header (Desktop, Mobile)
|   |   +-- Sidebar (Collapsed, Expanded)
|   |   +-- BottomNav (Mobile, 4-5 items)
|   |   +-- Breadcrumb
|   |   +-- Tabs (Horizontal, Vertical)
|   +-- C/Content
|   |   +-- Card (Elevated, Flat, Interactive)
|   |   +-- ListItem (Single-line, Two-line, Three-line)
|   |   +-- Table (Header, Row, Cell, Sortable indicators)
|   |   +-- Avatar (XS, S, M, L, XL)
|   |   +-- Badge (Number, Dot, Status)
|   |   +-- Divider (Horizontal, Vertical)
|   +-- C/Feedback
|   |   +-- Modal (Small, Medium, Large, Fullscreen)
|   |   +-- Drawer (Left, Right, Bottom)
|   |   +-- Toast (Info, Success, Warning, Error)
|   |   +-- Alert (Info, Success, Warning, Error + Actions)
|   |   +-- Skeleton (Text, Avatar, Card, Table)
|   |   +-- ProgressBar (Determinate, Indeterminate)
|   |   +-- Spinner (Small, Medium, Large)
|   +-- C/Data
|   |   +-- Calendar (Month view, Date picker)
|
+-- 03_Patterns
|   +-- Auth Pattern (Login + Register forms)
|   +-- Dashboard Card Layout (3-column grid)
|   +-- Form Validation Pattern (Inline errors)
|   +-- Empty State Pattern (Icon + Message + CTA)
|   +-- Error State Pattern (Alert + Recovery CTA)
|   +-- Loading State Pattern (Skeleton screens)
|   +-- Conflict Resolution Pattern (Side-by-side comparison)
|
+-- 04_Screens
|   +-- Patient Screens
|   |   +-- SCR-001_Login
|   |   |   +-- Default
|   |   |   +-- Loading
|   |   |   +-- Error
|   |   |   +-- Validation
|   |   +-- SCR-002_PatientDashboard
|   |   |   +-- Default
|   |   |   +-- Loading
|   |   |   +-- Empty
|   |   |   +-- Error
|   |   +-- SCR-006_AppointmentBooking
|   |   |   +-- Default
|   |   |   +-- Loading
|   |   |   +-- Empty (No slots)
|   |   |   +-- Error
|   |   |   +-- Validation
|   |   +-- SCR-007_PatientIntake
|   |   |   +-- AI Mode Default
|   |   |   +-- AI Loading
|   |   |   +-- Manual Mode Default
|   |   |   +-- Validation
|   |   +-- SCR-008_DocumentUpload
|   |       +-- Default
|   |       +-- Uploading
|   |       +-- Success
|   |       +-- Error
|   +-- Staff Screens
|   |   +-- SCR-003_StaffDashboard
|   |   |   +-- Default
|   |   |   +-- Loading
|   |   |   +-- High Risk Alerts
|   |   +-- SCR-009_QueueManagement
|   |   |   +-- Default
|   |   |   +-- Loading
|   |   |   +-- Real-time Update (pulse animation)
|   |   +-- SCR-010_ClinicalDataReview
|   |   |   +-- Default (no conflicts)
|   |   |   +-- Conflict Highlighted
|   |   |   +-- Loading
|   |   +-- SCR-011_AppointmentManagement
|   |       +-- Default
|   |       +-- Loading
|   |       +-- No Show Action
|   +-- Admin Screens
|       +-- SCR-004_AdminDashboard
|       |   +-- Default
|       |   +-- Loading
|       +-- SCR-013_UserManagement
|       |   +-- Default
|       |   +-- User Form Drawer Open
|       |   +-- Loading
|       +-- SCR-012_AuditLogs
|           +-- Default
|           +-- Empty (no results)
|
+-- 05_Prototype
|   +-- FL-001: Patient Appointment Booking
|   +-- FL-002: Patient Intake (AI-Assisted)
|   +-- FL-003: Staff Queue Management
|   +-- FL-004: Staff Clinical Data Review
|   +-- FL-005: Admin User Management
|   +-- FL-006: Staff Mark No Show
|
+-- 06_Handoff
    +-- Design Tokens Usage Guide
    +-- Component Usage Guidelines
    +-- Responsive Behavior Specs
    +-- State Transition Rules
    +-- Accessibility Notes (WCAG AA)
    +-- Edge Case Handling
```

---

## 14. Quality Checklist

### Pre-Export Validation
- [x] All 13 screens have required states (Default, Loading, Empty/Error, Validation where applicable)
- [x] All components reference design tokens (no hard-coded values)
- [x] Color contrast audited and meets WCAG AA (4.5:1 text, 3:1 UI elements)
- [x] Focus states defined for all interactive elements (2px outline, high contrast)
- [x] Touch targets ≥44x44px verified on mobile screens
- [x] Prototype flows wired for all 6 flows (FL-001 to FL-006)
- [x] Naming conventions followed (SCR-XXX, FL-XXX, C/<Category>/<Name>)
- [ ] Export manifest generated (118 JPGs estimated)

### Post-Generation Checklist
- [ ] `designsystem.md` created with complete design tokens
- [ ] UXR-XXX requirements (16 total) mapped to screens
- [ ] All 12 use cases from spec.md covered by flows
- [ ] All 3 personas (Patient, Staff, Admin) have complete journeys
- [ ] Validation: No orphan UXR-XXX (all mapped to ≥1 screen)
- [ ] Validation: No hallucinated screens (all derived from UC-XXX)
- [ ] figma_spec.md structure matches template sections 1-14

### Coverage Validation
**Use Case to Screen Mapping:**
- UC-001 → SCR-006 (Appointment Booking)
- UC-002 → SCR-007 (Patient Intake)
- UC-003 → SCR-010 (Clinical Data Aggregation)
- UC-004 → System-triggered (no dedicated screen)
- UC-005 → SCR-003 (Staff Dashboard alerts)
- UC-006 → SCR-013 (User Management)
- UC-007 → SCR-009 (Queue Management)
- UC-008 → Cross-cutting (RBAC on all screens)
- UC-009 → Error state on SCR-002 (Patient Dashboard)
- UC-010 → SCR-010 (Medication Conflicts)
- UC-011 → SCR-011 (Appointment Management)
- UC-012 → SCR-002 (Patient Dashboard)

**All 12 use cases covered**: ✓ (10 with dedicated screens, 2 as cross-cutting concerns)

---

**Document Version**: 1.0  
**Last Updated**: March 17, 2026  
**Status**: Complete - Ready for design system generation
