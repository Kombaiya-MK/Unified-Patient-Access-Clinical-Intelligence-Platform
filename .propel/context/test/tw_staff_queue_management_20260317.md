# Test Workflow: Staff Walk-in and Queue Management

## Metadata
| Field | Value |
|-------|-------|
| Feature | Staff Walk-in and Queue Management |
| Source | .propel/context/docs/spec.md |
| Use Case | UC-007 |
| Base URL | http://localhost:3000 |

## Test Cases

### TC-UC-007-HP-001: Add Walk-in Patient to Queue
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Staff member is logged in and authorized
- Queue management interface is accessible
- Patient has not pre-booked an appointment

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/staff/queue-management"
    expect: "queue management page loads successfully"

  - step_id: "002"
    action: click
    target: "getByRole('button', {name: 'Add Walk-in Patient'})"
    expect: "walk-in patient form modal opens"

  - step_id: "003"
    action: fill
    target: "getByLabel('Patient Name')"
    value: "John Smith"
    expect: "name field accepts input"

  - step_id: "004"
    action: fill
    target: "getByLabel('Date of Birth')"
    value: "1985-05-15"
    expect: "DOB field accepts valid date"

  - step_id: "005"
    action: fill
    target: "getByLabel('Reason for Visit')"
    value: "Fever and sore throat"
    expect: "reason field accepts input"

  - step_id: "006"
    action: click
    target: "getByRole('button', {name: 'Add to Queue'})"
    expect: "patient added to same-day queue"

  - step_id: "007"
    action: verify
    target: "getByText('Walk-in patient added to queue successfully')"
    expect: "visible"

  - step_id: "008"
    action: verify
    target: "getByRole('row', {name: /John Smith/})"
    expect: "patient appears in queue list"
```

**Test Data:**
```yaml
test_data:
  patient_name: "John Smith"
  date_of_birth: "1985-05-15"
  reason_for_visit: "Fever and sore throat"
  queue_type: "same-day"
```

---

### TC-UC-007-HP-002: Mark Patient as Arrived
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Staff member is logged in
- Patient has a scheduled or walk-in appointment
- Appointment status is "Scheduled" or "In Queue"

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/staff/queue-management"
    expect: "queue management page loads"

  - step_id: "002"
    action: click
    target: "getByRole('row', {name: /John Smith/})"
    expect: "patient row is selected"

  - step_id: "003"
    action: click
    target: "getByRole('button', {name: 'Mark as Arrived'})"
    expect: "arrival confirmation dialog appears"

  - step_id: "004"
    action: verify
    target: "getByText('Confirm patient John Smith has arrived?')"
    expect: "visible"

  - step_id: "005"
    action: click
    target: "getByRole('button', {name: 'Confirm'})"
    expect: "patient marked as arrived"

  - step_id: "006"
    action: verify
    target: "getByText('Patient marked as arrived successfully')"
    expect: "visible"

  - step_id: "007"
    action: verify
    target: "getByText('Status: Arrived')"
    expect: "visible in patient row"
```

**Test Data:**
```yaml
test_data:
  patient_name: "John Smith"
  appointment_status: "Scheduled"
  action: "mark_arrived"
```

---

### TC-UC-007-HP-003: Update Appointment Status to In Progress
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Staff member is logged in
- Patient status is "Arrived"
- Clinical consultation is about to begin

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/staff/queue-management"
    expect: "queue management page loads"

  - step_id: "002"
    action: click
    target: "getByRole('row', {name: /John Smith/})"
    expect: "patient row is selected"

  - step_id: "003"
    action: verify
    target: "getByText('Status: Arrived')"
    expect: "visible"

  - step_id: "004"
    action: click
    target: "getByRole('button', {name: 'Mark as In Progress'})"
    expect: "status update confirmation appears"

  - step_id: "005"
    action: click
    target: "getByRole('button', {name: 'Confirm'})"
    expect: "status updated to In Progress"

  - step_id: "006"
    action: verify
    target: "getByText('Appointment status updated to In Progress')"
    expect: "visible"

  - step_id: "007"
    action: verify
    target: "getByText('Status: In Progress')"
    expect: "visible in patient row"
```

**Test Data:**
```yaml
test_data:
  patient_name: "John Smith"
  current_status: "Arrived"
  new_status: "In Progress"
```

---

### TC-UC-007-HP-004: Update Appointment Status to Completed
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Staff member is logged in
- Patient status is "In Progress"
- Clinical consultation has concluded

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/staff/queue-management"
    expect: "queue management page loads"

  - step_id: "002"
    action: click
    target: "getByRole('row', {name: /John Smith/})"
    expect: "patient row is selected"

  - step_id: "003"
    action: verify
    target: "getByText('Status: In Progress')"
    expect: "visible"

  - step_id: "004"
    action: click
    target: "getByRole('button', {name: 'Mark as Completed'})"
    expect: "completion confirmation dialog appears"

  - step_id: "005"
    action: click
    target: "getByRole('button', {name: 'Confirm'})"
    expect: "status updated to Completed"

  - step_id: "006"
    action: verify
    target: "getByText('Appointment status updated to Completed')"
    expect: "visible"

  - step_id: "007"
    action: verify
    target: "getByText('Status: Completed')"
    expect: "visible in patient row"

  - step_id: "008"
    action: verify
    target: "getByRole('row', {name: /John Smith/})"
    expect: "patient row moves to completed appointments section"
```

**Test Data:**
```yaml
test_data:
  patient_name: "John Smith"
  current_status: "In Progress"
  new_status: "Completed"
```

---

### TC-UC-007-EC-001: Queue Full Warning
**Type:** edge_case | **Priority:** P1

**Scenario:** Staff attempts to add a walk-in patient when same-day queue is at capacity

**Steps:**
```yaml
steps:
  - step_id: "EC001"
    action: navigate
    target: "/staff/queue-management"
    expect: "queue management page loads"

  - step_id: "EC002"
    action: verify
    target: "getByText(/Queue Capacity: 20\/20/)"
    expect: "queue at full capacity"

  - step_id: "EC003"
    action: click
    target: "getByRole('button', {name: 'Add Walk-in Patient'})"
    expect: "warning dialog appears"

  - step_id: "EC004"
    action: verify
    target: "getByText('Queue is at full capacity. Add to waitlist instead?')"
    expect: "visible"

  - step_id: "EC005"
    action: click
    target: "getByRole('button', {name: 'Add to Waitlist'})"
    expect: "patient added to waitlist instead of queue"

  - step_id: "EC006"
    action: verify
    target: "getByText('Patient added to waitlist successfully')"
    expect: "visible"
```

---

### TC-UC-007-ER-001: Mark Arrival with Invalid Patient ID
**Type:** error | **Priority:** P1

**Trigger:** Staff attempts to mark a patient as arrived using an invalid or non-existent patient ID

**Steps:**
```yaml
steps:
  - step_id: "ER001"
    action: navigate
    target: "/staff/queue-management"
    expect: "queue management page loads"

  - step_id: "ER002"
    action: fill
    target: "getByLabel('Search Patient ID')"
    value: "INVALID-ID-999"
    expect: "invalid ID entered"

  - step_id: "ER003"
    action: click
    target: "getByRole('button', {name: 'Search'})"
    expect: "search executes"

  - step_id: "ER004"
    action: verify
    target: "getByRole('alert')"
    expect: "visible"

  - step_id: "ER005"
    action: verify
    target: "getByText('Patient not found. Please verify the Patient ID.')"
    expect: "visible"

  - step_id: "ER006"
    action: verify
    target: "getByRole('button', {name: 'Mark as Arrived'})"
    expect: "disabled"
```

---

### TC-UC-007-EC-002: Status Transition Validation
**Type:** edge_case | **Priority:** P1

**Scenario:** System prevents invalid status transitions (e.g., Scheduled → Completed without Arrived → In Progress)

**Steps:**
```yaml
steps:
  - step_id: "EC007"
    action: navigate
    target: "/staff/queue-management"
    expect: "queue management page loads"

  - step_id: "EC008"
    action: click
    target: "getByRole('row', {name: /Jane Doe/})"
    expect: "patient with Scheduled status selected"

  - step_id: "EC009"
    action: verify
    target: "getByText('Status: Scheduled')"
    expect: "visible"

  - step_id: "EC010"
    action: verify
    target: "getByRole('button', {name: 'Mark as Completed'})"
    expect: "disabled"

  - step_id: "EC011"
    action: verify
    target: "getByRole('button', {name: 'Mark as In Progress'})"
    expect: "disabled"

  - step_id: "EC012"
    action: verify
    target: "getByRole('button', {name: 'Mark as Arrived'})"
    expect: "enabled (only valid next action)"
```

---

## Page Objects
```yaml
pages:
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
      - patientRow: "getByRole('row', {name: /Patient Name/})"
      - queueCapacityLabel: "getByText(/Queue Capacity:/)"
      - successMessage: "getByText(/successfully/)"
      - errorAlert: "getByRole('alert')"
      - searchPatientInput: "getByLabel('Search Patient ID')"
      - searchButton: "getByRole('button', {name: 'Search'})"
    actions:
      - addWalkinPatient(name, dob, reason): "Add a walk-in patient to the queue"
      - markPatientArrived(patientName): "Mark a patient as arrived"
      - updateAppointmentStatus(patientName, status): "Update appointment status (In Progress/Completed)"
      - searchPatientById(patientId): "Search for a patient by ID"
```

## Success Criteria
- [ ] All happy path steps execute without errors
- [ ] Edge case validations pass (queue capacity, status transitions)
- [ ] Error scenarios handled correctly (invalid patient IDs)
- [ ] Test runs independently (no shared state)
- [ ] All assertions use web-first patterns
- [ ] Status transition workflow is enforced (Scheduled → Arrived → In Progress → Completed)
- [ ] Queue capacity limits are respected
- [ ] All actions are immutably logged for audit

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('button', {name: 'Add Walk-in Patient'})` |
| 2nd | getByTestId | `getByTestId('queue-patient-row-123')` |
| 3rd | getByLabel | `getByLabel('Patient Name')` |
| AVOID | CSS | `.queue-row`, `#patient-123` |

---
*Template: automated-testing-template.md | Output: .propel/context/test/tw_staff_queue_management_20260317.md*
