# Test Workflow: Appointment Booking

## Metadata
| Field | Value |
|-------|-------|
| Feature | Appointment Booking |
| Source | .propel/context/docs/spec.md |
| Use Case | UC-001 |
| Base URL | http://localhost:3000 |

## Test Cases

### TC-UC-001-HP-001: Book Available Appointment Slot
**Type:** happy_path | **Priority:** P0

**Preconditions:**
- Patient is logged in
- At least one available appointment slot exists
- Patient has completed registration

**Steps:**
```yaml
steps:
  - step_id: "001"
    action: navigate
    target: "/appointments/book"
    expect: "appointment booking page loads successfully"

  - step_id: "002"
    action: fill
    target: "getByLabel('Appointment Type')"
    value: "General Consultation"
    expect: "appointment type selected"

  - step_id: "003"
    action: fill
    target: "getByLabel('Preferred Date')"
    value: "2026-03-25"
    expect: "date picker accepts valid future date"

  - step_id: "004"
    action: click
    target: "getByRole('button', {name: 'Search Available Slots'})"
    expect: "available slots are displayed"

  - step_id: "005"
    action: click
    target: "getByRole('button', {name: '10:00 AM'})"
    expect: "slot is selected"

  - step_id: "006"
    action: click
    target: "getByRole('button', {name: 'Confirm Booking'})"
    expect: "booking confirmation modal appears"

  - step_id: "007"
    action: verify
    target: "getByText('Appointment booked successfully')"
    expect: "visible"

  - step_id: "008"
    action: verify
    target: "getByText('Confirmation email sent with PDF attachment')"
    expect: "visible"
```

**Test Data:**
```yaml
test_data:
  appointment_type: "General Consultation"
  preferred_date: "2026-03-25"
  time_slot: "10:00 AM"
  patient_email: "patient@example.com"
```

---

### TC-UC-001-EC-001: Join Waitlist When Preferred Slot Unavailable
**Type:** edge_case | **Priority:** P1

**Scenario:** Patient selects a preferred time slot that is already fully booked and joins the waitlist

**Steps:**
```yaml
steps:
  - step_id: "EC001"
    action: navigate
    target: "/appointments/book"
    expect: "appointment booking page loads"

  - step_id: "EC002"
    action: fill
    target: "getByLabel('Preferred Date')"
    value: "2026-03-25"
    expect: "date selected"

  - step_id: "EC003"
    action: click
    target: "getByRole('button', {name: 'Search Available Slots'})"
    expect: "system displays available and unavailable slots"

  - step_id: "EC004"
    action: verify
    target: "getByText('10:00 AM - Fully Booked')"
    expect: "slot marked as unavailable"

  - step_id: "EC005"
    action: click
    target: "getByRole('button', {name: 'Join Waitlist for 10:00 AM'})"
    expect: "waitlist confirmation dialog appears"

  - step_id: "EC006"
    action: click
    target: "getByRole('button', {name: 'Confirm Waitlist'})"
    expect: "patient added to waitlist"

  - step_id: "EC007"
    action: verify
    target: "getByText('Added to waitlist. You will be notified if this slot becomes available.')"
    expect: "visible"
```

---

### TC-UC-001-ER-001: Booking Fails with Past Date
**Type:** error | **Priority:** P1

**Trigger:** Patient attempts to book an appointment for a date in the past

**Steps:**
```yaml
steps:
  - step_id: "ER001"
    action: navigate
    target: "/appointments/book"
    expect: "appointment booking page loads"

  - step_id: "ER002"
    action: fill
    target: "getByLabel('Preferred Date')"
    value: "2026-03-01"
    expect: "past date entered"

  - step_id: "ER003"
    action: click
    target: "getByRole('button', {name: 'Search Available Slots'})"
    expect: "validation error triggered"

  - step_id: "ER004"
    action: verify
    target: "getByRole('alert')"
    expect: "visible"

  - step_id: "ER005"
    action: verify
    target: "getByText('Please select a future date. Past dates are not allowed.')"
    expect: "visible"

  - step_id: "ER006"
    action: verify
    target: "getByRole('button', {name: 'Confirm Booking'})"
    expect: "disabled"
```

---

### TC-UC-001-EC-002: Reschedule Existing Appointment
**Type:** edge_case | **Priority:** P1

**Scenario:** Patient reschedules an existing confirmed appointment to a different date and time

**Steps:**
```yaml
steps:
  - step_id: "EC008"
    action: navigate
    target: "/appointments/my-appointments"
    expect: "patient dashboard shows upcoming appointments"

  - step_id: "EC009"
    action: click
    target: "getByRole('button', {name: 'Reschedule'})"
    expect: "reschedule modal opens"

  - step_id: "EC010"
    action: fill
    target: "getByLabel('New Date')"
    value: "2026-03-26"
    expect: "new date selected"

  - step_id: "EC011"
    action: click
    target: "getByRole('button', {name: 'Search Available Slots'})"
    expect: "available slots for new date displayed"

  - step_id: "EC012"
    action: click
    target: "getByRole('button', {name: '2:00 PM'})"
    expect: "new slot selected"

  - step_id: "EC013"
    action: click
    target: "getByRole('button', {name: 'Confirm Reschedule'})"
    expect: "appointment rescheduled successfully"

  - step_id: "EC014"
    action: verify
    target: "getByText('Appointment rescheduled successfully')"
    expect: "visible"

  - step_id: "EC015"
    action: verify
    target: "getByText('Confirmation email sent with updated PDF')"
    expect: "visible"
```

---

### TC-UC-001-EC-003: Cancel Appointment
**Type:** edge_case | **Priority:** P1

**Scenario:** Patient cancels an upcoming appointment

**Steps:**
```yaml
steps:
  - step_id: "EC016"
    action: navigate
    target: "/appointments/my-appointments"
    expect: "patient dashboard shows upcoming appointments"

  - step_id: "EC017"
    action: click
    target: "getByRole('button', {name: 'Cancel Appointment'})"
    expect: "cancellation confirmation dialog appears"

  - step_id: "EC018"
    action: fill
    target: "getByLabel('Cancellation Reason (Optional)')"
    value: "Personal emergency"
    expect: "reason entered"

  - step_id: "EC019"
    action: click
    target: "getByRole('button', {name: 'Confirm Cancellation'})"
    expect: "appointment cancelled"

  - step_id: "EC020"
    action: verify
    target: "getByText('Appointment cancelled successfully')"
    expect: "visible"

  - step_id: "EC021"
    action: verify
    target: "getByText('An email confirmation has been sent')"
    expect: "visible"
```

---

## Page Objects
```yaml
pages:
  - name: "AppointmentBookingPage"
    file: "pages/appointment-booking.page.ts"
    elements:
      - appointmentTypeSelect: "getByLabel('Appointment Type')"
      - preferredDatePicker: "getByLabel('Preferred Date')"
      - searchSlotsButton: "getByRole('button', {name: 'Search Available Slots'})"
      - confirmBookingButton: "getByRole('button', {name: 'Confirm Booking'})"
      - successMessage: "getByText('Appointment booked successfully')"
      - errorAlert: "getByRole('alert')"
      - waitlistButton: "getByRole('button', {name: /Join Waitlist/})"
    actions:
      - bookAppointment(type, date, time): "Select appointment type, date, time and confirm booking"
      - joinWaitlist(date, time): "Join waitlist for unavailable slot"
      - rescheduleAppointment(newDate, newTime): "Reschedule existing appointment"
      - cancelAppointment(reason): "Cancel appointment with optional reason"

  - name: "MyAppointmentsPage"
    file: "pages/my-appointments.page.ts"
    elements:
      - appointmentList: "getByRole('list', {name: 'My Appointments'})"
      - rescheduleButton: "getByRole('button', {name: 'Reschedule'})"
      - cancelButton: "getByRole('button', {name: 'Cancel Appointment'})"
    actions:
      - viewAppointments(): "Navigate to my appointments page"
      - selectAppointment(appointmentId): "Select specific appointment from list"
```

## Success Criteria
- [ ] All happy path steps execute without errors
- [ ] Edge case validations pass (waitlist joining, rescheduling, cancellation)
- [ ] Error scenarios handled correctly (past dates, invalid inputs)
- [ ] Test runs independently (no shared state)
- [ ] All assertions use web-first patterns
- [ ] Confirmation emails and PDFs are triggered (verified by UI messages)
- [ ] Calendar sync options are available (Google/Outlook)
- [ ] Automated reminders are scheduled (verified by system logs)

## Locator Reference
| Priority | Method | Example |
|----------|--------|---------|
| 1st | getByRole | `getByRole('button', {name: 'Search Available Slots'})` |
| 2nd | getByTestId | `getByTestId('appointment-slot-10am')` |
| 3rd | getByLabel | `getByLabel('Preferred Date')` |
| AVOID | CSS | `.appointment-card`, `#slot-123` |

---
*Template: automated-testing-template.md | Output: .propel/context/test/tw_appointment_booking_20260317.md*
