# Test Workflow: Highlight Medication Conflicts

## Metadata
| Field | Value |
|-------|-------|
| Feature | Medication Conflict Detection |
| Source | .propel/context/docs/spec.md |
| Use Case | UC-010 |
| Base URL | http://localhost:3000 |

## Test Cases

### TC-UC-010-HP-001: Detect and Highlight Medication Conflicts
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Staff member is logged in and authorized
- Patient clinical data has been aggregated
- Patient is taking multiple medications with potential interactions

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/staff/patient-profile/PAT-001"
    expect: "patient profile page loads successfully"

  - step_id: "002"
    action: verify
    target: "getByRole('region', {name: 'Medications'})"
    expect: "medications section visible"

  - step_id: "003"
    action: verify
    target: "getByText('Current Medications (5)')"
    expect: "medication count displayed"

  - step_id: "004"
    action: verify
    target: "getByRole('alert', {name: 'Conflict Warning'})"
    expect: "conflict alert visible"

  - step_id: "005"
    action: verify
    target: "getByText('2 medication conflicts detected')"
    expect: "conflict count visible"

  - step_id: "006"
    action: click
    target: "getByRole('button', {name: 'View Conflicts'})"
    expect: "conflict details panel expands"

  - step_id: "007"
    action: verify
    target: "getByText('Warfarin + Aspirin: Increased risk of bleeding')"
    expect: "first conflict detail visible"

  - step_id: "008"
    action: verify
    target: "getByText('Lisinopril + Ibuprofen: May reduce effectiveness of blood pressure medication')"
    expect: "second conflict detail visible"

  - step_id: "009"
    action: verify
    target: "getByText('Severity: High')"
    expect: "conflict severity displayed"

  - step_id: "010"
    action: verify
    target: "getByRole('button', {name: 'Resolve Conflict'})"
    expect: "resolve button available for staff action"
```

**Test Data:**
```yaml
test_data:
  patient_id: "PAT-001"
  medications:
    - name: "Warfarin"
      dosage: "5mg daily"
    - name: "Aspirin"
      dosage: "81mg daily"
    - name: "Lisinopril"
      dosage: "10mg daily"
    - name: "Ibuprofen"
      dosage: "200mg as needed"
    - name: "Metformin"
      dosage: "500mg twice daily"
  conflicts:
    - medications: ["Warfarin", "Aspirin"]
      severity: "High"
      description: "Increased risk of bleeding"
    - medications: ["Lisinopril", "Ibuprofen"]
      severity: "Medium"
      description: "May reduce effectiveness of blood pressure medication"
```

---

### TC-UC-010-HP-002: Staff Reviews and Resolves Medication Conflict
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Staff member is viewing patient profile with detected conflicts
- Conflict details are visible
- Staff has authority to resolve conflicts

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/staff/patient-profile/PAT-001"
    expect: "patient profile loads"

  - step_id: "002"
    action: click
    target: "getByRole('button', {name: 'View Conflicts'})"
    expect: "conflict details panel expands"

  - step_id: "003"
    action: click
    target: "getByRole('button', {name: 'Resolve Conflict'})"
    expect: "conflict resolution form opens"

  - step_id: "004"
    action: verify
    target: "getByText('Conflict: Warfarin + Aspirin')"
    expect: "conflict being resolved is displayed"

  - step_id: "005"
    action: fill
    target: "getByLabel('Resolution Action')"
    value: "Discontinue Aspirin, consult with cardiologist"
    expect: "resolution action entered"

  - step_id: "006"
    action: fill
    target: "getByLabel('Staff Notes')"
    value: "Discussed with patient. Alternative pain management plan in place."
    expect: "staff notes entered"

  - step_id: "007"
    action: click
    target: "getByRole('button', {name: 'Save Resolution'})"
    expect: "resolution saved"

  - step_id: "008"
    action: verify
    target: "getByText('Conflict resolution saved successfully')"
    expect: "visible"

  - step_id: "009"
    action: verify
    target: "getByText('Status: Resolved')"
    expect: "conflict status updated"

  - step_id: "010"
    action: verify
    target: "getByText('1 medication conflict remaining')"
    expect: "conflict count decremented"
```

**Test Data:**
```yaml
test_data:
  conflict_id: "CONF-001"
  medications: ["Warfarin", "Aspirin"]
  resolution_action: "Discontinue Aspirin, consult with cardiologist"
  staff_notes: "Discussed with patient. Alternative pain management plan in place."
  resolved_by: "Staff Member Name"
  resolved_date: "2026-03-17"
```

---

### TC-UC-010-EC-001: No Conflicts Detected for Patient
**Type:** edge_case | **Priority:** P1

**Scenario:** Patient is taking medications with no known interactions

**Steps:**
```yaml
steps:
  - step_id: "EC001"
    action: navigate
    target: "/staff/patient-profile/PAT-002"
    expect: "patient profile loads"

  - step_id: "EC002"
    action: verify
    target: "getByRole('region', {name: 'Medications'})"
    expect: "medications section visible"

  - step_id: "EC003"
    action: verify
    target: "getByText('Current Medications (3)')"
    expect: "medication count displayed"

  - step_id: "EC004"
    action: verify
    target: "getByText('No medication conflicts detected')"
    expect: "visible"

  - step_id: "EC005"
    action: verify
    target: "getByRole('status', {name: 'All Clear'})"
    expect: "positive status indicator visible"

  - step_id: "EC006"
    action: verify
    target: "getByText('Last checked: March 17, 2026 at 10:30 AM')"
    expect: "timestamp of last conflict check visible"
```

---

### TC-UC-010-ER-001: Conflict Detection Fails Due to Missing Medication Data
**Type:** error | **Priority:** P1

**Trigger:** System attempts conflict detection but patient medication list is incomplete or unavailable

**Steps:**
```yaml
steps:
  - step_id: "ER001"
    action: navigate
    target: "/staff/patient-profile/PAT-003"
    expect: "patient profile loads"

  - step_id: "ER002"
    action: verify
    target: "getByRole('region', {name: 'Medications'})"
    expect: "medications section visible"

  - step_id: "ER003"
    action: verify
    target: "getByText('Medication data incomplete')"
    expect: "visible"

  - step_id: "ER004"
    action: verify
    target: "getByRole('alert')"
    expect: "warning alert visible"

  - step_id: "ER005"
    action: verify
    target: "getByText('Unable to perform conflict detection. Please complete medication history.')"
    expect: "visible"

  - step_id: "ER006"
    action: verify
    target: "getByRole('button', {name: 'Add Medications'})"
    expect: "button available to complete medication data"
```

---

### TC-UC-010-EC-002: High Severity Conflict Triggers Immediate Alert
**Type:** edge_case | **Priority:** P1

**Scenario:** System detects a critical high-severity medication conflict that requires immediate attention

**Steps:**
```yaml
steps:
  - step_id: "EC007"
    action: navigate
    target: "/staff/patient-profile/PAT-004"
    expect: "patient profile loads"

  - step_id: "EC008"
    action: verify
    target: "getByRole('dialog', {name: 'Critical Conflict Alert'})"
    expect: "modal dialog appears immediately"

  - step_id: "EC009"
    action: verify
    target: "getByText('CRITICAL: High-risk medication interaction detected')"
    expect: "visible"

  - step_id: "EC010"
    action: verify
    target: "getByText('Warfarin + Aspirin + Clopidogrel: Extreme bleeding risk')"
    expect: "conflict details visible"

  - step_id: "EC011"
    action: verify
    target: "getByText('Severity: Critical')"
    expect: "severity highlighted in red"

  - step_id: "EC012"
    action: verify
    target: "getByText('Immediate physician consultation required')"
    expect: "recommendation visible"

  - step_id: "EC013"
    action: verify
    target: "getByRole('button', {name: 'Acknowledge and Review'})"
    expect: "staff must acknowledge before proceeding"

  - step_id: "EC014"
    action: click
    target: "getByRole('button', {name: 'Acknowledge and Review'})"
    expect: "dialog dismissed and staff logged action"

  - step_id: "EC015"
    action: verify
    target: "getByText('Critical conflict acknowledged by [Staff Name]')"
    expect: "acknowledgment logged immutably"
```

---

### TC-UC-010-ER-002: Conflict Detection Service Unavailable
**Type:** error | **Priority:** P1

**Trigger:** AI-based conflict detection service is temporarily unavailable or experiencing errors

**Steps:**
```yaml
steps:
  - step_id: "ER007"
    action: navigate
    target: "/staff/patient-profile/PAT-005"
    expect: "patient profile loads"

  - step_id: "ER008"
    action: verify
    target: "getByRole('region', {name: 'Medications'})"
    expect: "medications section visible"

  - step_id: "ER009"
    action: verify
    target: "getByRole('alert', {name: 'Service Error'})"
    expect: "error alert visible"

  - step_id: "ER010"
    action: verify
    target: "getByText('Conflict detection service is temporarily unavailable')"
    expect: "visible"

  - step_id: "ER011"
    action: verify
    target: "getByText('Please manually review medications for potential interactions or try again later.')"
    expect: "fallback instruction visible"

  - step_id: "ER012"
    action: verify
    target: "getByRole('button', {name: 'Retry Conflict Detection'})"
    expect: "retry button available"

  - step_id: "ER013"
    action: verify
    target: "getByRole('button', {name: 'Manual Review'})"
    expect: "manual review option available"
```

---

## Page Objects
```yaml
pages:
  - name: "PatientProfilePage"
    file: "pages/patient-profile.page.ts"
    elements:
      - medicationsSection: "getByRole('region', {name: 'Medications'})"
      - conflictAlert: "getByRole('alert', {name: 'Conflict Warning'})"
      - viewConflictsButton: "getByRole('button', {name: 'View Conflicts'})"
      - conflictDetailsPanel: "getByRole('region', {name: 'Conflict Details'})"
      - resolveConflictButton: "getByRole('button', {name: 'Resolve Conflict'})"
      - resolutionActionInput: "getByLabel('Resolution Action')"
      - staffNotesInput: "getByLabel('Staff Notes')"
      - saveResolutionButton: "getByRole('button', {name: 'Save Resolution'})"
      - criticalConflictDialog: "getByRole('dialog', {name: 'Critical Conflict Alert'})"
      - acknowledgeButton: "getByRole('button', {name: 'Acknowledge and Review'})"
      - addMedicationsButton: "getByRole('button', {name: 'Add Medications'})"
      - retryDetectionButton: "getByRole('button', {name: 'Retry Conflict Detection'})"
      - manualReviewButton: "getByRole('button', {name: 'Manual Review'})"
    actions:
      - viewConflictDetails(): "Expand conflict details panel"
      - resolveConflict(conflictId, action, notes): "Resolve a medication conflict"
      - acknowledgeeCriticalConflict(): "Acknowledge critical conflict alert"
      - retryConflictDetection(): "Retry conflict detection if service failed"
```

## Success Criteria
- [x] All happy path steps execute without errors
- [x] Edge case validations pass (no conflicts, high severity alerts)
- [x] Error scenarios handled correctly (missing data, service unavailable)
- [x] Test runs independently (no shared state)
- [x] All assertions use web-first patterns
- [x] Medication conflicts are accurately detected and highlighted
- [x] Conflict severity is appropriately displayed (High, Medium, Low, Critical)
- [x] Staff can review and resolve conflicts with documented actions
- [x] Critical conflicts trigger immediate alerts requiring acknowledgment
- [x] All conflict resolutions are logged immutably for audit
- [x] Fallback to manual review available when AI service fails

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('alert', {name: 'Conflict Warning'})` |
| 2nd | getByTestId | `getByTestId('medication-conflict-panel')` |
| 3rd | getByLabel | `getByLabel('Resolution Action')` |
| AVOID | CSS | `.conflict-alert`, `#medication-123` |

---
*Template: automated-testing-template.md | Output: .propel/context/test/tw_medication_conflicts_20260317.md*
