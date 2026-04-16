# E2E Test Workflow: Staff Queue Management Journey

## Metadata
| Field | Value |
|-------|-------|
| Journey | Staff Queue Management Journey |
| Source | .propel/context/docs/spec.md |
| UC Chain | UC-008 → UC-007 → UC-011 |
| Base URL | http://localhost:3000 |

## Journey Overview

### TC-E2E-STAFF-001: Complete Staff Queue Management Workflow
**Type:** e2e | **Priority:** P0

**Journey Flow:**
| Step | Use Case | Action | Expected State |
|------|----------|--------|----------------|
| 1 | UC-008 | Staff logs in with valid credentials | Authenticated staff session created |
| 2 | UC-007 | Add walk-in patient to queue | Patient added to same-day queue |
| 3 | UC-007 | Mark patient as arrived | Status updated to Arrived |
| 4 | UC-007 | Update status to In Progress | Consultation started |
| 5 | UC-007 | Mark appointment as Completed | Visit successfully completed |
| 6 | UC-011 | Mark no-show for another patient | No-show logged immutably |

**Session Requirements:**
- Authentication: REQUIRED (staff role)
- State Persistence: COOKIES and SESSION
- Cleanup: Remove test patient data and queue entries after test

**Steps:**
```yaml
e2e_steps:
  - phase: "UC-008: Staff Login and Authentication"
    steps:
      - step_id: "E2E-001"
        action: navigate
        target: "/login"
        expect: "login page loads successfully"

      - step_id: "E2E-002"
        action: fill
        target: "getByLabel('Email')"
        value: "staff.testuser@example.com"
        expect: "email field accepts input"

      - step_id: "E2E-003"
        action: fill
        target: "getByLabel('Password')"
        value: "StaffSecure123!"
        expect: "password field accepts input"

      - step_id: "E2E-004"
        action: click
        target: "getByRole('button', {name: 'Log In'})"
        expect: "login submitted"

      - step_id: "E2E-005"
        action: verify
        target: "url contains '/staff/dashboard'"
        expect: "redirected to staff dashboard"
        checkpoint: true

  - phase: "UC-007: Add Walk-in Patient to Queue"
    steps:
      - step_id: "E2E-006"
        action: navigate
        target: "/staff/queue-management"
        expect: "queue management page loads"

      - step_id: "E2E-007"
        action: verify
        target: "getByRole('heading', {name: 'Queue Management'})"
        expect: "page heading visible"

      - step_id: "E2E-008"
        action: click
        target: "getByRole('button', {name: 'Add Walk-in Patient'})"
        expect: "walk-in patient form opens"

      - step_id: "E2E-009"
        action: fill
        target: "getByLabel('Patient Name')"
        value: "Emma Johnson"
        expect: "name entered"

      - step_id: "E2E-010"
        action: fill
        target: "getByLabel('Date of Birth')"
        value: "1990-08-22"
        expect: "DOB entered"

      - step_id: "E2E-011"
        action: fill
        target: "getByLabel('Reason for Visit')"
        value: "Persistent cough and fever"
        expect: "reason entered"

      - step_id: "E2E-012"
        action: click
        target: "getByRole('button', {name: 'Add to Queue'})"
        expect: "patient added to queue"

      - step_id: "E2E-013"
        action: verify
        target: "getByText('Walk-in patient added to queue successfully')"
        expect: "visible"

      - step_id: "E2E-014"
        action: verify
        target: "getByRole('row', {name: /Emma Johnson/})"
        expect: "patient visible in queue list"
        checkpoint: true

  - phase: "UC-007: Mark Patient as Arrived"
    steps:
      - step_id: "E2E-015"
        action: click
        target: "getByRole('row', {name: /Emma Johnson/})"
        expect: "patient row selected"

      - step_id: "E2E-016"
        action: verify
        target: "getByText('Status: In Queue')"
        expect: "initial status visible"

      - step_id: "E2E-017"
        action: click
        target: "getByRole('button', {name: 'Mark as Arrived'})"
        expect: "arrival confirmation dialog appears"

      - step_id: "E2E-018"
        action: verify
        target: "getByText('Confirm patient Emma Johnson has arrived?')"
        expect: "confirmation message visible"

      - step_id: "E2E-019"
        action: click
        target: "getByRole('button', {name: 'Confirm'})"
        expect: "status updated"

      - step_id: "E2E-020"
        action: verify
        target: "getByText('Patient marked as arrived successfully')"
        expect: "visible"

      - step_id: "E2E-021"
        action: verify
        target: "getByText('Status: Arrived')"
        expect: "status updated in patient row"
        checkpoint: true

  - phase: "UC-007: Update Status to In Progress"
    steps:
      - step_id: "E2E-022"
        action: verify
        target: "getByRole('row', {name: /Emma Johnson/})"
        expect: "patient row still selected"

      - step_id: "E2E-023"
        action: click
        target: "getByRole('button', {name: 'Mark as In Progress'})"
        expect: "status update confirmation appears"

      - step_id: "E2E-024"
        action: click
        target: "getByRole('button', {name: 'Confirm'})"
        expect: "status updated to In Progress"

      - step_id: "E2E-025"
        action: verify
        target: "getByText('Appointment status updated to In Progress')"
        expect: "visible"

      - step_id: "E2E-026"
        action: verify
        target: "getByText('Status: In Progress')"
        expect: "status updated in patient row"
        checkpoint: true

  - phase: "UC-007: Mark Appointment as Completed"
    steps:
      - step_id: "E2E-027"
        action: click
        target: "getByRole('button', {name: 'Mark as Completed'})"
        expect: "completion confirmation dialog appears"

      - step_id: "E2E-028"
        action: click
        target: "getByRole('button', {name: 'Confirm'})"
        expect: "status updated to Completed"

      - step_id: "E2E-029"
        action: verify
        target: "getByText('Appointment status updated to Completed')"
        expect: "visible"

      - step_id: "E2E-030"
        action: verify
        target: "getByText('Status: Completed')"
        expect: "status updated"

      - step_id: "E2E-031"
        action: verify
        target: "getByRole('region', {name: 'Completed Appointments'})"
        expect: "patient moved to completed section"
        checkpoint: true

  - phase: "UC-011: Mark No-Show for Another Patient"
    steps:
      - step_id: "E2E-032"
        action: navigate
        target: "/staff/queue-management"
        expect: "refresh queue management page"

      - step_id: "E2E-033"
        action: click
        target: "getByRole('row', {name: /Michael Brown/})"
        expect: "select scheduled patient who did not arrive"

      - step_id: "E2E-034"
        action: verify
        target: "getByText('Status: Scheduled')"
        expect: "patient has scheduled status"

      - step_id: "E2E-035"
        action: click
        target: "getByRole('button', {name: 'Mark as No Show'})"
        expect: "no-show confirmation dialog appears"

      - step_id: "E2E-036"
        action: verify
        target: "getByText('Mark Michael Brown as No Show?')"
        expect: "confirmation message visible"

      - step_id: "E2E-037"
        action: fill
        target: "getByLabel('Reason (Optional)')"
        value: "Patient did not arrive 15 minutes past scheduled time"
        expect: "reason entered"

      - step_id: "E2E-038"
        action: click
        target: "getByRole('button', {name: 'Confirm No Show'})"
        expect: "no-show status updated"

      - step_id: "E2E-039"
        action: verify
        target: "getByText('Appointment marked as No Show and logged immutably')"
        expect: "visible"

      - step_id: "E2E-040"
        action: verify
        target: "getByText('Status: No Show')"
        expect: "status updated in patient row"

      - step_id: "E2E-041"
        action: verify
        target: "getByText('Risk assessment updated')"
        expect: "no-show risk data updated"
        checkpoint: true
```

**Journey Test Data:**
```yaml
journey_data:
  staff:
    email: "staff.testuser@example.com"
    password: "StaffSecure123!"
    name: "Test Staff Member"
  walkin_patient:
    name: "Emma Johnson"
    date_of_birth: "1990-08-22"
    reason: "Persistent cough and fever"
  noshow_patient:
    name: "Michael Brown"
    appointment_id: "APT-20260317-001"
    scheduled_time: "10:00 AM"
    noshow_reason: "Patient did not arrive 15 minutes past scheduled time"
```

---

## Page Objects
```yaml
pages:
  - name: "LoginPage"
    file: "pages/login.page.ts"
    elements:
      - emailInput: "getByLabel('Email')"
      - passwordInput: "getByLabel('Password')"
      - loginButton: "getByRole('button', {name: 'Log In'})"
    actions:
      - login(email, password): "Submit login credentials"

  - name: "StaffDashboardPage"
    file: "pages/staff-dashboard.page.ts"
    elements:
      - queueManagementLink: "getByRole('link', {name: 'Queue Management'})"
      - dashboardHeading: "getByRole('heading', {name: 'Staff Dashboard'})"
    actions:
      - navigateToQueueManagement(): "Navigate to queue management page"

  - name: "QueueManagementPage"
    file: "pages/queue-management.page.ts"
    elements:
      - addWalkinButton: "getByRole('button', {name: 'Add Walk-in Patient'})"
      - patientNameInput: "getByLabel('Patient Name')"
      - dateOfBirthInput: "getByLabel('Date of Birth')"
      - reasonForVisitInput: "getByLabel('Reason for Visit')"
      - addToQueueButton: "getByRole('button', {name: 'Add to Queue'})"
      - markArrivedButton: "getByRole('button', {name: 'Mark as Arrived'})"
      - markInProgressButton: "getByRole('button', {name: 'Mark as In Progress'})"
      - markCompletedButton: "getByRole('button', {name: 'Mark as Completed'})"
      - markNoShowButton: "getByRole('button', {name: 'Mark as No Show'})"
      - patientRow: "getByRole('row', {name: /Patient Name/})"
      - confirmButton: "getByRole('button', {name: 'Confirm'})"
      - noShowReasonInput: "getByLabel('Reason (Optional)')"
    actions:
      - addWalkinPatient(name, dob, reason): "Add walk-in patient to queue"
      - markPatientArrived(patientName): "Mark patient as arrived"
      - updateStatusToInProgress(patientName): "Update status to In Progress"
      - markAppointmentCompleted(patientName): "Mark appointment as completed"
      - markPatientNoShow(patientName, reason): "Mark patient as No Show"
```

## Success Criteria
- [x] All journey phases complete without errors
- [x] Session state maintained across all phases
- [x] Checkpoints validate intermediate states
- [x] Journey runs independently with test data cleanup
- [x] All assertions use web-first patterns
- [x] Staff authentication persists throughout journey
- [x] Walk-in patient successfully added to queue
- [x] Status transitions follow correct workflow (In Queue → Arrived → In Progress → Completed)
- [x] No-show is logged immutably for audit
- [x] Risk assessment data is updated after no-show
- [x] All staff actions are immutably logged

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('button', {name: 'Mark as Arrived'})` |
| 2nd | getByTestId | `getByTestId('queue-patient-row')` |
| 3rd | getByLabel | `getByLabel('Patient Name')` |
| AVOID | CSS | `.queue-table`, `#patient-row-123` |

---
*Template: automated-e2e-template.md | Output: .propel/context/test/e2e_staff_queue_management.md*
