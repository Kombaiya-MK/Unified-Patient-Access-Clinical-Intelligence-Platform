# E2E Test Workflow: Patient Complete Journey

## Metadata
| Field | Value |
|-------|-------|
| Journey | Patient Complete Journey |
| Source | .propel/context/docs/spec.md |
| UC Chain | UC-008 → UC-001 → UC-002 → UC-012 |
| Base URL | http://localhost:3000 |

## Journey Overview

### TC-E2E-PATIENT-001: Complete Patient Onboarding and Appointment Journey
**Type:** e2e | **Priority:** P0

**Journey Flow:**
| Step | Use Case | Action | Expected State |
|------|----------|--------|----------------|
| 1 | UC-008 | Patient logs in with valid credentials | Authenticated session created |
| 2 | UC-012 | Access patient dashboard | Dashboard loaded with personalized view |
| 3 | UC-001 | Book appointment for future date | Appointment confirmed with PDF sent |
| 4 | UC-002 | Complete AI-assisted intake | Intake data saved and visible to staff |
| 5 | UC-012 | Upload clinical document | Document uploaded and AI extraction initiated |
| 6 | UC-001 | Verify appointment in dashboard | Appointment visible in upcoming appointments |

**Session Requirements:**
- Authentication: REQUIRED (patient role)
- State Persistence: COOKIES and SESSION
- Cleanup: Delete test patient data and appointments after test

**Steps:**
```yaml
e2e_steps:
  - phase: "UC-008: Patient Login and Authentication"
    steps:
      - step_id: "E2E-001"
        action: navigate
        target: "/login"
        expect: "login page loads successfully"

      - step_id: "E2E-002"
        action: fill
        target: "getByLabel('Email')"
        value: "patient.testuser@example.com"
        expect: "email field accepts input"

      - step_id: "E2E-003"
        action: fill
        target: "getByLabel('Password')"
        value: "SecurePass123!"
        expect: "password field accepts input"

      - step_id: "E2E-004"
        action: click
        target: "getByRole('button', {name: 'Log In'})"
        expect: "login submitted"

      - step_id: "E2E-005"
        action: verify
        target: "url contains '/patient/dashboard'"
        expect: "redirected to patient dashboard"
        checkpoint: true

  - phase: "UC-012: Access Patient Dashboard"
    steps:
      - step_id: "E2E-006"
        action: verify
        target: "getByRole('heading', {name: /Welcome/})"
        expect: "personalized dashboard greeting visible"

      - step_id: "E2E-007"
        action: verify
        target: "getByRole('region', {name: 'Quick Actions'})"
        expect: "quick actions panel visible"

      - step_id: "E2E-008"
        action: verify
        target: "getByRole('link', {name: 'Book Appointment'})"
        expect: "book appointment link present"
        checkpoint: true

  - phase: "UC-001: Book Appointment"
    steps:
      - step_id: "E2E-009"
        action: click
        target: "getByRole('link', {name: 'Book Appointment'})"
        expect: "navigate to appointment booking page"

      - step_id: "E2E-010"
        action: fill
        target: "getByLabel('Appointment Type')"
        value: "General Consultation"
        expect: "appointment type selected"

      - step_id: "E2E-011"
        action: fill
        target: "getByLabel('Preferred Date')"
        value: "2026-04-15"
        expect: "future date selected"

      - step_id: "E2E-012"
        action: click
        target: "getByRole('button', {name: 'Search Available Slots'})"
        expect: "available slots displayed"

      - step_id: "E2E-013"
        action: click
        target: "getByRole('button', {name: '10:00 AM'})"
        expect: "slot selected"

      - step_id: "E2E-014"
        action: click
        target: "getByRole('button', {name: 'Confirm Booking'})"
        expect: "booking confirmed"

      - step_id: "E2E-015"
        action: verify
        target: "getByText('Appointment booked successfully')"
        expect: "visible"

      - step_id: "E2E-016"
        action: verify
        target: "getByText('Confirmation email sent with PDF attachment')"
        expect: "visible"
        checkpoint: true

  - phase: "UC-002: Complete AI-Assisted Intake"
    steps:
      - step_id: "E2E-017"
        action: navigate
        target: "/intake/start"
        expect: "intake page loads"

      - step_id: "E2E-018"
        action: click
        target: "getByRole('button', {name: 'Start AI-Assisted Intake'})"
        expect: "AI chat interface opens"

      - step_id: "E2E-019"
        action: verify
        target: "getByText('Hello! I will help you complete your intake.')"
        expect: "AI greeting visible"

      - step_id: "E2E-020"
        action: fill
        target: "getByLabel('Type your response')"
        value: "I have been experiencing frequent headaches for 2 weeks"
        expect: "response entered"

      - step_id: "E2E-021"
        action: click
        target: "getByRole('button', {name: 'Send'})"
        expect: "AI processes and responds"

      - step_id: "E2E-022"
        action: verify
        target: "getByText(/How severe/)"
        expect: "follow-up question visible"

      - step_id: "E2E-023"
        action: fill
        target: "getByLabel('Type your response')"
        value: "Moderate, usually in the morning"
        expect: "response entered"

      - step_id: "E2E-024"
        action: click
        target: "getByRole('button', {name: 'Send'})"
        expect: "AI continues intake"

      - step_id: "E2E-025"
        action: click
        target: "getByRole('button', {name: 'Complete Intake'})"
        expect: "intake completed"

      - step_id: "E2E-026"
        action: verify
        target: "getByText('Intake completed successfully')"
        expect: "visible"
        checkpoint: true

  - phase: "UC-012: Upload Clinical Document"
    steps:
      - step_id: "E2E-027"
        action: navigate
        target: "/patient/dashboard"
        expect: "return to dashboard"

      - step_id: "E2E-028"
        action: click
        target: "getByRole('link', {name: 'Upload Documents'})"
        expect: "navigate to document upload page"

      - step_id: "E2E-029"
        action: upload
        target: "getByLabel('Select File')"
        value: "./test-data/sample-medical-history.pdf"
        expect: "file selected"

      - step_id: "E2E-030"
        action: fill
        target: "getByLabel('Document Type')"
        value: "Medical History"
        expect: "document type selected"

      - step_id: "E2E-031"
        action: click
        target: "getByRole('button', {name: 'Upload'})"
        expect: "upload initiated"

      - step_id: "E2E-032"
        action: verify
        target: "getByText('Document uploaded successfully')"
        expect: "visible"

      - step_id: "E2E-033"
        action: verify
        target: "getByText('AI extraction in progress')"
        expect: "visible"
        checkpoint: true

  - phase: "UC-001: Verify Appointment in Dashboard"
    steps:
      - step_id: "E2E-034"
        action: navigate
        target: "/patient/dashboard"
        expect: "return to dashboard"

      - step_id: "E2E-035"
        action: verify
        target: "getByRole('region', {name: 'Upcoming Appointments'})"
        expect: "appointments section visible"

      - step_id: "E2E-036"
        action: verify
        target: "getByText(/Appointment on April 15, 2026 at 10:00 AM/)"
        expect: "booked appointment visible"

      - step_id: "E2E-037"
        action: verify
        target: "getByText('Status: Confirmed')"
        expect: "appointment status confirmed"
        checkpoint: true
```

**Journey Test Data:**
```yaml
journey_data:
  patient:
    email: "patient.testuser@example.com"
    password: "SecurePass123!"
    name: "Test Patient"
  appointment:
    type: "General Consultation"
    date: "2026-04-15"
    time: "10:00 AM"
  intake:
    chief_complaint: "Frequent headaches for 2 weeks"
    severity: "Moderate, usually in the morning"
  document:
    file_path: "./test-data/sample-medical-history.pdf"
    type: "Medical History"
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

  - name: "PatientDashboardPage"
    file: "pages/patient-dashboard.page.ts"
    elements:
      - welcomeHeading: "getByRole('heading', {name: /Welcome/})"
      - bookAppointmentLink: "getByRole('link', {name: 'Book Appointment'})"
      - uploadDocumentsLink: "getByRole('link', {name: 'Upload Documents'})"
      - upcomingAppointmentsSection: "getByRole('region', {name: 'Upcoming Appointments'})"
    actions:
      - navigateToBookAppointment(): "Navigate to appointment booking"
      - navigateToUploadDocuments(): "Navigate to document upload"

  - name: "AppointmentBookingPage"
    file: "pages/appointment-booking.page.ts"
    elements:
      - appointmentTypeSelect: "getByLabel('Appointment Type')"
      - preferredDatePicker: "getByLabel('Preferred Date')"
      - searchSlotsButton: "getByRole('button', {name: 'Search Available Slots'})"
      - confirmBookingButton: "getByRole('button', {name: 'Confirm Booking'})"
    actions:
      - bookAppointment(type, date, time): "Complete appointment booking flow"

  - name: "PatientIntakePage"
    file: "pages/patient-intake.page.ts"
    elements:
      - aiIntakeButton: "getByRole('button', {name: 'Start AI-Assisted Intake'})"
      - chatInput: "getByLabel('Type your response')"
      - sendButton: "getByRole('button', {name: 'Send'})"
      - completeIntakeButton: "getByRole('button', {name: 'Complete Intake'})"
    actions:
      - completeAIIntake(responses): "Complete AI-assisted intake with given responses"

  - name: "DocumentUploadPage"
    file: "pages/document-upload.page.ts"
    elements:
      - fileInput: "getByLabel('Select File')"
      - documentTypeSelect: "getByLabel('Document Type')"
      - uploadButton: "getByRole('button', {name: 'Upload'})"
    actions:
      - uploadDocument(filePath, type): "Upload clinical document"
```

## Success Criteria
- [x] All journey phases complete without errors
- [x] Session state maintained across all phases
- [x] Checkpoints validate intermediate states
- [x] Journey runs independently with test data cleanup
- [x] All assertions use web-first patterns
- [x] Authentication persists throughout journey
- [x] Appointment is successfully created and visible
- [x] Intake data is saved and available to staff
- [x] Document upload triggers AI extraction
- [x] All actions are immutably logged for audit

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('button', {name: 'Log In'})` |
| 2nd | getByTestId | `getByTestId('appointment-booking-form')` |
| 3rd | getByLabel | `getByLabel('Email')` |
| AVOID | CSS | `.login-form`, `#dashboard-123` |

---
*Template: automated-e2e-template.md | Output: .propel/context/test/e2e_patient_complete_journey.md*
