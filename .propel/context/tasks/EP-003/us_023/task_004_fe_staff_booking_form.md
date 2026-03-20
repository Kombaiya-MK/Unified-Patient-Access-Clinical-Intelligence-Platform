# Task - TASK_004: Frontend Staff Booking Form with Override Options

## Requirement Reference
- User Story: [us_023]
- Story Location: [.propel/context/tasks/us_023/us_023.md]
- Acceptance Criteria:
    - AC1: Choose appointment date/time/provider on booking interface (same as patient self-booking but with staff override options), click "Book Appointment", display success message "Appointment booked for [patient name] on [date/time]"
- Edge Case:
    - EC2: Staff can book past same-day cutoff time, override full slots with "Override Capacity" checkbox if urgent

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-006 |
| **UXR Requirements** | UXR-001 (Quick booking flow), UXR-501 (Inline validation) |
| **Design Tokens** | .propel/context/docs/designsystem.md#forms, #buttons, #colors |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference the wireframe file/URL during UI implementation
- **MUST** match layout, spacing, typography, and colors from the wireframe
- **MUST** implement all states shown in wireframe (default, hover, focus, error, loading)
- **MUST** validate implementation against wireframe at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Hook Form | 7.x |
| Frontend | CSS Modules | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create StaffBookingPage with PatientSearchBox at top, then booking form (reuses US_013 booking components with enhancements). Add staff-specific fields: "Override Capacity" checkbox (labeled "Override slot capacity (urgent cases only)"), "Priority" dropdown (Normal/Urgent), "Booking Notes" textarea (max 500 chars, internal staff notes). Form submissions POST to /api/staff/appointments/book with patient_id, appointment_datetime, provider_id, reason_for_visit, override_capacity, booking_priority, staff_booking_notes. Display success toast "Appointment booked for [patient name] on [date/time]. Confirmation sent to patient." Form disabled until patient selected from search. After successful booking, clear form and reset patient selection.

## Dependent Tasks
- TASK_001: Backend Patient Search API (patient search functionality)
- TASK_002: Backend Staff Booking Enhancement (POST /api/staff/appointments/book endpoint)
- TASK_003: Frontend Patient Search Component (PatientSearchBox to integrate)
- US_013: Patient booking form components (reuse date/time picker, provider selector)

## Impacted Components
- **CREATE** app/src/pages/StaffBookingPage.tsx - Main page integrating patient search + booking form
- **CREATE** app/src/components/staff/StaffBookingForm.tsx - Booking form with staff override fields
- **MODIFY** app/src/components/booking/AppointmentForm.tsx - Extract reusable date/time/provider selection (if not already extracted)
- **CREATE** app/src/hooks/useStaffBooking.ts - Custom hook for staff booking submission
- **MODIFY** app/src/types/appointment.types.ts - Add StaffBookingFormData interface
- **CREATE** app/src/components/staff/OverrideCapacityCheckbox.tsx - Checkbox with warning message for override
- **CREATE** app/src/components/staff/BookingNotesTextarea.tsx - Textarea for internal staff notes

## Implementation Plan
1. **Modify appointment.types.ts**: Add StaffBookingFormData interface (patient_id, appointment_datetime, provider_id, reason_for_visit, override_capacity, booking_priority: 'normal' | 'urgent', staff_booking_notes?)
2. **Create StaffBookingPage.tsx**: Render PatientSearchBox at top with h2 "Book Appointment for Patient", display selected patient info card below search (name, DOB, phone), render StaffBookingForm (disabled if !selectedPatient), add route /staff/appointments/book
3. **Create StaffBookingForm.tsx**: Use React Hook Form, reuse date/time picker and provider selector from US_013 AppointmentForm, add reason_for_visit textarea, add Priority dropdown (options: Normal, Urgent), add OverrideCapacityCheckbox, add BookingNotesTextarea, "Book Appointment" submit button (primary style), onSubmit calls useStaffBooking hook
4. **Create useStaffBooking hook**: Accept form data and patient ID, call POST /api/staff/appointments/book with axios, return { bookAppointment, loading, error, success }, on success show toast "Appointment booked for [patient name]", on 409 error (slot conflict without override) show toast "Slot unavailable. Enable override if urgent."
5. **Create OverrideCapacityCheckbox.tsx**: Checkbox with label "Override slot capacity (urgent cases only)", when checked display warning icon + text "This will book over the provider's capacity limit", controlled component with onChange handler
6. **Create BookingNotesTextarea.tsx**: Textarea with label "Booking Notes (Internal)", placeholder "Add notes about this booking (visible to staff only)", maxLength 500, character counter "X/500 characters"
7. **Add Form Validation**: appointment_datetime required and future date, provider_id required, reason_for_visit min 10 chars, booking_notes max 500 chars, priority required (default 'normal')
8. **Add Success/Error Handling**: On success clear form + patient selection, show green success toast with confirmation message, on error show red error toast with API error message, handle 400/409/500 responses

**Focus on how to implement**: StaffBookingPage uses useState for selectedPatient. PatientSearchBox onPatientSelect updates selectedPatient state. StaffBookingForm receives selectedPatient prop and extracts patient_id for submission. Form uses React Hook Form register/handleSubmit. POST body: { patient_id, appointment_datetime, provider_id, reason_for_visit, override_capacity, booking_priority, staff_booking_notes }. Success response: { appointment: {...}, message: "Confirmation sent" }. Date/time picker reuses existing US_013 components. Override checkbox shows confirmation dialog "Are you sure?" before enabling. Priority dropdown uses <select> with 2 options.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   ├── AppointmentBookingPage.tsx (US_013, patient self-booking)
│   │   └── (StaffBookingPage.tsx to be created)
│   ├── components/
│   │   ├── booking/
│   │   │   ├── AppointmentForm.tsx (US_013, to potentially extract date/time picker)
│   │   │   ├── DateTimePicker.tsx (US_013, reusable)
│   │   │   └── ProviderSelector.tsx (US_013, reusable)
│   │   ├── staff/
│   │   │   ├── PatientSearchBox.tsx (US_023 TASK_003)
│   │   │   ├── PatientSearchResult.tsx (US_023 TASK_003)
│   │   │   └── (StaffBookingForm.tsx, OverrideCapacityCheckbox.tsx, BookingNotesTextarea.tsx to be created)
│   │   └── common/
│   │       ├── Toast.tsx (US_022 TASK_002)
│   │       └── Button.tsx (existing)
│   ├── hooks/
│   │   ├── usePatientSearch.ts (US_023 TASK_003)
│   │   └── (useStaffBooking.ts to be created)
│   ├── types/
│   │   ├── patient.types.ts (US_023 TASK_003)
│   │   └── appointment.types.ts (US_013, to be modified)
│   └── App.tsx (add route for StaffBookingPage)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/StaffBookingPage.tsx | Main page with PatientSearchBox + StaffBookingForm, manages selectedPatient state |
| CREATE | app/src/components/staff/StaffBookingForm.tsx | Booking form with date/time/provider + staff override fields (priority, override, notes) |
| CREATE | app/src/components/staff/OverrideCapacityCheckbox.tsx | Checkbox with warning message for overriding slot capacity |
| CREATE | app/src/components/staff/BookingNotesTextarea.tsx | Textarea for internal staff notes with character counter |
| CREATE | app/src/hooks/useStaffBooking.ts | Hook for POST /api/staff/appointments/book with success/error handling |
| MODIFY | app/src/types/appointment.types.ts | Add StaffBookingFormData interface with staff-specific fields |
| MODIFY | app/src/App.tsx | Add route /staff/appointments/book for StaffBookingPage |

## External References
- **React Hook Form**: https://react-hook-form.com/get-started - Form handling with validation
- **Form Validation**: https://react-hook-form.com/api/useform/register - Field registration and validation rules
- **Textarea Character Counter**: https://www.w3schools.com/howto/howto_js_character_count.asp - Character counting pattern
- **Checkbox Components**: https://react-spectrum.adobe.com/react-aria/useCheckbox.html - Accessible checkbox patterns
- **Toast Notifications**: https://www.npmjs.com/package/react-hot-toast - Success/error toast display

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for staff booking form)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for useStaffBooking hook
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Form disabled until patient selected from search
- [x] All fields validate correctly (required, min/max length)
- [x] Override capacity checkbox shows warning message
- [x] Character counter updates as user types in booking notes
- [x] Success toast displays after booking with patient name and date/time
- [x] Error toast displays for API errors (409 slot conflict, 400 validation)
- [x] Form clears and patient resets after successful booking

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html during implementation
- [ ] Modify appointment.types.ts (add StaffBookingFormData interface with patient_id: string, appointment_datetime: Date, provider_id: string, reason_for_visit: string, override_capacity: boolean, booking_priority: 'normal' | 'urgent', staff_booking_notes?: string)
- [ ] Create BookingNotesTextarea.tsx component (textarea with label, maxLength 500, display character counter using value.length, controlled component with value and onChange props)
- [ ] Create OverrideCapacityCheckbox.tsx component (checkbox with label "Override slot capacity (urgent cases only)", conditional warning div with icon and text when checked, controlled with checked and onChange props)
- [ ] Create useStaffBooking.ts hook (async bookAppointment function: axios.post('/api/staff/appointments/book', formData), return {bookAppointment, loading, error, success}, on success extract patient name from response, on error extract error.response.data.message)
- [ ] Create StaffBookingForm.tsx component (React Hook Form setup, render DateTimePicker, ProviderSelector, reason_for_visit textarea, Priority dropdown with options Normal/Urgent, OverrideCapacityCheckbox, BookingNotesTextarea, submit button, onSubmit calls useStaffBooking, display success/error toasts, props: selectedPatient, onBookingSuccess)
- [ ] Create StaffBookingPage.tsx page (useState for selectedPatient, render h1 "Book Appointment for Patient", PatientSearchBox with onPatientSelect handler, conditional selected patient info card, StaffBookingForm with disabled={!selectedPatient}, onBookingSuccess clears patient)
- [ ] Modify App.tsx (add <Route path="/staff/appointments/book" element={<StaffBookingPage />} />, ensure protected route with staff role check)
