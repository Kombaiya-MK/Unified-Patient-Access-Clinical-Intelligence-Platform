# Test Workflow: Patient Intake

## Metadata
| Field | Value |
|-------|-------|
| Feature | Patient Intake |
| Source | .propel/context/docs/spec.md |
| Use Case | UC-002 |
| Base URL | http://localhost:3000 |

## Test Cases

### TC-UC-002-HP-001: Complete AI-Assisted Intake
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Patient is logged in
- Patient has a confirmed appointment
- AI conversational intake is available

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/intake/start"
    expect: "intake page loads with AI and manual options"

  - step_id: "002"
    action: click
    target: "getByRole('button', {name: 'Start AI-Assisted Intake'})"
    expect: "AI chat interface opens"

  - step_id: "003"
    action: verify
    target: "getByText('Hello! I will help you complete your intake.')"
    expect: "visible"

  - step_id: "004"
    action: fill
    target: "getByLabel('Type your response')"
    value: "I have had a persistent cough for 3 weeks"
    expect: "response entered in chat"

  - step_id: "005"
    action: click
    target: "getByRole('button', {name: 'Send'})"
    expect: "AI processes response and asks follow-up question"

  - step_id: "006"
    action: verify
    target: "getByText('How severe is the cough?')"
    expect: "visible"

  - step_id: "007"
    action: fill
    target: "getByLabel('Type your response')"
    value: "Moderate, worse at night"
    expect: "response entered"

  - step_id: "008"
    action: click
    target: "getByRole('button', {name: 'Send'})"
    expect: "AI continues conversation"

  - step_id: "009"
    action: click
    target: "getByRole('button', {name: 'Complete Intake'})"
    expect: "intake summary is displayed"

  - step_id: "010"
    action: verify
    target: "getByText('Intake completed successfully')"
    expect: "visible"

  - step_id: "011"
    action: verify
    target: "getByText('Your responses have been saved')"
    expect: "visible"
```

**Test Data:**
```yaml
test_data:
  chief_complaint: "Persistent cough for 3 weeks"
  severity: "Moderate, worse at night"
  intake_method: "AI-assisted"
```

---

### TC-UC-002-HP-002: Complete Manual Form Intake
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Patient is logged in
- Patient has a confirmed appointment

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/intake/start"
    expect: "intake page loads with AI and manual options"

  - step_id: "002"
    action: click
    target: "getByRole('button', {name: 'Use Manual Form'})"
    expect: "manual intake form opens"

  - step_id: "003"
    action: fill
    target: "getByLabel('Chief Complaint')"
    value: "Persistent cough for 3 weeks"
    expect: "field accepts input"

  - step_id: "004"
    action: fill
    target: "getByLabel('Duration (days)')"
    value: "21"
    expect: "numeric field accepts valid number"

  - step_id: "005"
    action: fill
    target: "getByLabel('Severity')"
    value: "Moderate"
    expect: "severity selected"

  - step_id: "006"
    action: fill
    target: "getByLabel('Additional Notes')"
    value: "Worse at night, no fever"
    expect: "textarea accepts input"

  - step_id: "007"
    action: click
    target: "getByRole('button', {name: 'Submit Intake'})"
    expect: "intake form is submitted"

  - step_id: "008"
    action: verify
    target: "getByText('Intake completed successfully')"
    expect: "visible"
```

**Test Data:**
```yaml
test_data:
  chief_complaint: "Persistent cough for 3 weeks"
  duration_days: 21
  severity: "Moderate"
  additional_notes: "Worse at night, no fever"
  intake_method: "Manual"
```

---

### TC-UC-002-EC-001: Switch from AI to Manual Mid-Process
**Type:** edge_case | **Priority:** P1

**Scenario:** Patient starts with AI-assisted intake but switches to manual form before completing

**Steps:**
```yaml
steps:
  - step_id: "EC001"
    action: navigate
    target: "/intake/start"
    expect: "intake page loads"

  - step_id: "EC002"
    action: click
    target: "getByRole('button', {name: 'Start AI-Assisted Intake'})"
    expect: "AI chat interface opens"

  - step_id: "EC003"
    action: fill
    target: "getByLabel('Type your response')"
    value: "I have a headache"
    expect: "response entered"

  - step_id: "EC004"
    action: click
    target: "getByRole('button', {name: 'Send'})"
    expect: "AI processes response"

  - step_id: "EC005"
    action: click
    target: "getByRole('button', {name: 'Switch to Manual Form'})"
    expect: "confirmation dialog appears"

  - step_id: "EC006"
    action: verify
    target: "getByText('Your progress will be saved. Continue?')"
    expect: "visible"

  - step_id: "EC007"
    action: click
    target: "getByRole('button', {name: 'Yes, Switch'})"
    expect: "manual form loads with saved data"

  - step_id: "EC008"
    action: verify
    target: "getByLabel('Chief Complaint')"
    expect: "field is pre-filled with 'I have a headache'"

  - step_id: "EC009"
    action: fill
    target: "getByLabel('Duration (days)')"
    value: "2"
    expect: "additional field completed"

  - step_id: "EC010"
    action: click
    target: "getByRole('button', {name: 'Submit Intake'})"
    expect: "intake submitted successfully"
```

---

### TC-UC-002-ER-001: Incomplete Intake Submission Blocked
**Type:** error | **Priority:** P1

**Trigger:** Patient attempts to submit intake form without completing required fields

**Steps:**
```yaml
steps:
  - step_id: "ER001"
    action: navigate
    target: "/intake/start"
    expect: "intake page loads"

  - step_id: "ER002"
    action: click
    target: "getByRole('button', {name: 'Use Manual Form'})"
    expect: "manual form opens"

  - step_id: "ER003"
    action: fill
    target: "getByLabel('Chief Complaint')"
    value: ""
    expect: "field left empty"

  - step_id: "ER004"
    action: click
    target: "getByRole('button', {name: 'Submit Intake'})"
    expect: "validation error triggered"

  - step_id: "ER005"
    action: verify
    target: "getByRole('alert')"
    expect: "visible"

  - step_id: "ER006"
    action: verify
    target: "getByText('Chief Complaint is required')"
    expect: "visible"

  - step_id: "ER007"
    action: verify
    target: "getByLabel('Chief Complaint')"
    expect: "has error styling (red border or error state)"
```

---

### TC-UC-002-EC-002: Switch from Manual to AI Mid-Process
**Type:** edge_case | **Priority:** P1

**Scenario:** Patient starts with manual form but switches to AI-assisted intake before completing

**Steps:**
```yaml
steps:
  - step_id: "EC011"
    action: navigate
    target: "/intake/start"
    expect: "intake page loads"

  - step_id: "EC012"
    action: click
    target: "getByRole('button', {name: 'Use Manual Form'})"
    expect: "manual form opens"

  - step_id: "EC013"
    action: fill
    target: "getByLabel('Chief Complaint')"
    value: "Fever and chills"
    expect: "field filled"

  - step_id: "EC014"
    action: click
    target: "getByRole('button', {name: 'Switch to AI-Assisted Intake'})"
    expect: "confirmation dialog appears"

  - step_id: "EC015"
    action: click
    target: "getByRole('button', {name: 'Yes, Switch'})"
    expect: "AI chat interface loads"

  - step_id: "EC016"
    action: verify
    target: "getByText('I see you mentioned: Fever and chills. Let me ask you a few more questions.')"
    expect: "AI acknowledges previous data"

  - step_id: "EC017"
    action: verify
    target: "getByText('How long have you had these symptoms?')"
    expect: "AI continues intake process"
```

---

## Page Objects
```yaml
pages:
  - name: "PatientIntakePage"
    file: "pages/patient-intake.page.ts"
    elements:
      - aiIntakeButton: "getByRole('button', {name: 'Start AI-Assisted Intake'})"
      - manualFormButton: "getByRole('button', {name: 'Use Manual Form'})"
      - switchToManualButton: "getByRole('button', {name: 'Switch to Manual Form'})"
      - switchToAIButton: "getByRole('button', {name: 'Switch to AI-Assisted Intake'})"
      - chatInput: "getByLabel('Type your response')"
      - sendButton: "getByRole('button', {name: 'Send'})"
      - chiefComplaintInput: "getByLabel('Chief Complaint')"
      - durationInput: "getByLabel('Duration (days)')"
      - severitySelect: "getByLabel('Severity')"
      - additionalNotesTextarea: "getByLabel('Additional Notes')"
      - submitButton: "getByRole('button', {name: 'Submit Intake'})"
      - completeIntakeButton: "getByRole('button', {name: 'Complete Intake'})"
      - successMessage: "getByText('Intake completed successfully')"
      - errorAlert: "getByRole('alert')"
    actions:
      - startAIIntake(): "Initiate AI-assisted conversational intake"
      - startManualIntake(): "Open manual form intake"
      - switchIntakeMethod(toMethod): "Switch between AI and manual intake methods"
      - submitIntakeForm(data): "Complete and submit intake form"
      - sendAIResponse(message): "Send message to AI chat"
```

## Success Criteria
- [ ] All happy path steps execute without errors (AI and manual)
- [ ] Edge case validations pass (method switching with data preservation)
- [ ] Error scenarios handled correctly (required field validation)
- [ ] Test runs independently (no shared state)
- [ ] All assertions use web-first patterns
- [ ] AI chat is responsive and context-aware
- [ ] Manual form validates all required fields
- [ ] Switching methods preserves entered data

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('button', {name: 'Start AI-Assisted Intake'})` |
| 2nd | getByTestId | `getByTestId('intake-chat-input')` |
| 3rd | getByLabel | `getByLabel('Chief Complaint')` |
| AVOID | CSS | `.intake-form`, `#ai-chat-123` |

---
*Template: automated-testing-template.md | Output: .propel/context/test/tw_patient_intake_20260317.md*
