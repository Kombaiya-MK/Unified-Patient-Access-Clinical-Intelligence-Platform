# Test Workflow: Patient Dashboard Access

## Metadata
| Field | Value |
|-------|-------|
| Feature | Patient Dashboard Access |
| Source | .propel/context/docs/spec.md |
| Use Case | UC-012 |
| Base URL | http://localhost:3000 |

## Test Cases

### TC-UC-012-HP-001: Access Dashboard and View Appointments
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Patient is registered and authenticated
- Patient has at least one upcoming appointment
- Patient has view permissions to dashboard

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/patient/dashboard"
    expect: "patient dashboard page loads successfully"

  - step_id: "002"
    action: verify
    target: "getByRole('heading', {name: 'Welcome, John'})"
    expect: "personalized greeting visible"

  - step_id: "003"
    action: verify
    target: "getByRole('region', {name: 'Upcoming Appointments'})"
    expect: "appointments section visible"

  - step_id: "004"
    action: verify
    target: "getByText(/Appointment on March 25, 2026/)"
    expect: "appointment details visible"

  - step_id: "005"
    action: verify
    target: "getByRole('region', {name: 'Quick Actions'})"
    expect: "quick actions panel visible"

  - step_id: "006"
    action: verify
    target: "getByRole('link', {name: 'Book Appointment'})"
    expect: "book appointment link present"

  - step_id: "007"
    action: verify
    target: "getByRole('link', {name: 'Upload Documents'})"
    expect: "upload documents link present"

  - step_id: "008"
    action: verify
    target: "getByRole('region', {name: 'Notifications'})"
    expect: "notifications panel visible"
```

**Test Data:**
```yaml
test_data:
  patient_name: "John"
  upcoming_appointment_date: "2026-03-25"
  appointment_type: "General Consultation"
```

---

### TC-UC-012-HP-002: Upload Clinical Documents
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Patient is logged in and on dashboard
- Patient has appointment scheduled
- File upload functionality is enabled

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/patient/dashboard"
    expect: "dashboard loads"

  - step_id: "002"
    action: click
    target: "getByRole('link', {name: 'Upload Documents'})"
    expect: "document upload page opens"

  - step_id: "003"
    action: verify
    target: "getByRole('heading', {name: 'Upload Clinical Documents'})"
    expect: "visible"

  - step_id: "004"
    action: upload
    target: "getByLabel('Select File')"
    value: "./test-data/sample-lab-report.pdf"
    expect: "file selected successfully"

  - step_id: "005"
    action: fill
    target: "getByLabel('Document Type')"
    value: "Lab Report"
    expect: "document type selected"

  - step_id: "006"
    action: fill
    target: "getByLabel('Description (Optional)')"
    value: "Blood test results from March 10, 2026"
    expect: "description entered"

  - step_id: "007"
    action: click
    target: "getByRole('button', {name: 'Upload'})"
    expect: "upload initiated"

  - step_id: "008"
    action: verify
    target: "getByText('Document uploaded successfully')"
    expect: "visible"

  - step_id: "009"
    action: verify
    target: "getByText('AI extraction in progress')"
    expect: "visible"
```

**Test Data:**
```yaml
test_data:
  file_path: "./test-data/sample-lab-report.pdf"
  document_type: "Lab Report"
  description: "Blood test results from March 10, 2026"
```

---

### TC-UC-012-HP-003: Complete Intake from Dashboard
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Patient is logged in
- Patient has pending intake for upcoming appointment
- Intake link is visible on dashboard

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/patient/dashboard"
    expect: "dashboard loads"

  - step_id: "002"
    action: verify
    target: "getByRole('alert', {name: 'Reminder'})"
    expect: "intake reminder visible"

  - step_id: "003"
    action: verify
    target: "getByText('Please complete your intake before your appointment on March 25.')"
    expect: "visible"

  - step_id: "004"
    action: click
    target: "getByRole('link', {name: 'Complete Intake Now'})"
    expect: "redirected to intake page"

  - step_id: "005"
    action: verify
    target: "getByRole('heading', {name: 'Patient Intake'})"
    expect: "intake page loaded"

  - step_id: "006"
    action: click
    target: "getByRole('button', {name: 'Start AI-Assisted Intake'})"
    expect: "intake process begins"
```

**Test Data:**
```yaml
test_data:
  appointment_date: "2026-03-25"
  intake_status: "pending"
```

---

### TC-UC-012-HP-004: View and Dismiss Notifications
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Patient is logged in
- Patient has unread notifications
- Dashboard notifications panel is visible

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/patient/dashboard"
    expect: "dashboard loads"

  - step_id: "002"
    action: verify
    target: "getByRole('region', {name: 'Notifications'})"
    expect: "notifications panel visible"

  - step_id: "003"
    action: verify
    target: "getByText('Badge: 3')"
    expect: "notification count badge shows 3 unread"

  - step_id: "004"
    action: click
    target: "getByRole('button', {name: 'View All Notifications'})"
    expect: "notifications panel expands"

  - step_id: "005"
    action: verify
    target: "getByText('Appointment reminder: March 25, 2026 at 10:00 AM')"
    expect: "notification visible"

  - step_id: "006"
    action: click
    target: "getByRole('button', {name: 'Dismiss'})"
    expect: "notification dismissed"

  - step_id: "007"
    action: verify
    target: "getByText('Badge: 2')"
    expect: "notification count decremented"
```

**Test Data:**
```yaml
test_data:
  notification_count: 3
  notification_types: ["appointment_reminder", "intake_reminder", "waitlist_update"]
```

---

### TC-UC-012-EC-001: Dashboard with No Appointments
**Type:** edge_case | **Priority:** P1

**Scenario:** New patient with no scheduled appointments accesses dashboard

**Steps:**
```yaml
steps:
  - step_id: "EC001"
    action: navigate
    target: "/patient/dashboard"
    expect: "dashboard loads"

  - step_id: "EC002"
    action: verify
    target: "getByRole('region', {name: 'Upcoming Appointments'})"
    expect: "visible"

  - step_id: "EC003"
    action: verify
    target: "getByText('You have no upcoming appointments.')"
    expect: "visible"

  - step_id: "EC004"
    action: verify
    target: "getByRole('link', {name: 'Book Your First Appointment'})"
    expect: "visible and emphasized"

  - step_id: "EC005"
    action: click
    target: "getByRole('link', {name: 'Book Your First Appointment'})"
    expect: "redirected to appointment booking page"
```

---

### TC-UC-012-ER-001: Unauthorized Dashboard Access
**Type:** error | **Priority:** P1

**Trigger:** Unauthenticated user attempts to access patient dashboard

**Steps:**
```yaml
steps:
  - step_id: "ER001"
    action: navigate
    target: "/patient/dashboard"
    expect: "access denied"

  - step_id: "ER002"
    action: verify
    target: "url contains '/login'"
    expect: "redirected to login page"

  - step_id: "ER003"
    action: verify
    target: "getByRole('alert')"
    expect: "visible"

  - step_id: "ER004"
    action: verify
    target: "getByText('Please log in to access your dashboard.')"
    expect: "visible"

  - step_id: "ER005"
    action: verify
    target: "getByLabel('Email')"
    expect: "login form visible"
```

---

### TC-UC-012-EC-002: Dashboard Session Timeout
**Type:** edge_case | **Priority:** P1

**Scenario:** Patient's session expires after 15 minutes of inactivity while on dashboard

**Steps:**
```yaml
steps:
  - step_id: "EC006"
    action: navigate
    target: "/patient/dashboard"
    expect: "dashboard loads"

  - step_id: "EC007"
    action: wait
    target: "15 minutes (simulated via test config)"
    expect: "session timeout triggered"

  - step_id: "EC008"
    action: verify
    target: "getByRole('dialog', {name: 'Session Expired'})"
    expect: "timeout modal visible"

  - step_id: "EC009"
    action: verify
    target: "getByText('Your session has expired due to inactivity. Please log in again.')"
    expect: "visible"

  - step_id: "EC010"
    action: click
    target: "getByRole('button', {name: 'Log In Again'})"
    expect: "redirected to login page"
```

---

## Page Objects
```yaml
pages:
  - name: "PatientDashboardPage"
    file: "pages/patient-dashboard.page.ts"
    elements:
      - welcomeHeading: "getByRole('heading', {name: /Welcome/})"
      - upcomingAppointmentsSection: "getByRole('region', {name: 'Upcoming Appointments'})"
      - quickActionsPanel: "getByRole('region', {name: 'Quick Actions'})"
      - notificationsPanel: "getByRole('region', {name: 'Notifications'})"
      - bookAppointmentLink: "getByRole('link', {name: 'Book Appointment'})"
      - uploadDocumentsLink: "getByRole('link', {name: 'Upload Documents'})"
      - completeIntakeLink: "getByRole('link', {name: 'Complete Intake Now'})"
      - viewAllNotificationsButton: "getByRole('button', {name: 'View All Notifications'})"
      - notificationBadge: "getByText(/Badge:/)"
      - dismissNotificationButton: "getByRole('button', {name: 'Dismiss'})"
      - noAppointmentsMessage: "getByText('You have no upcoming appointments.')"
      - sessionExpiredDialog: "getByRole('dialog', {name: 'Session Expired'})"
    actions:
      - navigateToBookAppointment(): "Navigate to appointment booking from dashboard"
      - uploadDocument(filePath, type, description): "Upload clinical document"
      - viewNotifications(): "Expand and view all notifications"
      - dismissNotification(notificationId): "Dismiss a specific notification"
```

## Success Criteria
- [ ] All happy path steps execute without errors
- [ ] Edge case validations pass (no appointments, session timeout)
- [ ] Error scenarios handled correctly (unauthorized access)
- [ ] Test runs independently (no shared state)
- [ ] All assertions use web-first patterns
- [ ] Dashboard is personalized with patient name
- [ ] Notifications are displayed with count badge
- [ ] Quick actions provide easy navigation to key features
- [ ] Session management enforces 15-minute timeout
- [ ] All actions are logged immutably

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('region', {name: 'Upcoming Appointments'})` |
| 2nd | getByTestId | `getByTestId('dashboard-appointments-section')` |
| 3rd | getByLabel | `getByLabel('Select File')` |
| AVOID | CSS | `.dashboard-card`, `#notifications-123` |

---
*Template: automated-testing-template.md | Output: .propel/context/test/tw_patient_dashboard_20260317.md*
