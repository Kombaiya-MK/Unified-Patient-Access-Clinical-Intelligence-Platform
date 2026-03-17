# Task - TASK_001_FE_STAFF_BOOKING_UI

## Requirement Reference
- User Story: US_023
- Story Location: `.propel/context/tasks/us_023/us_023.md`
- Acceptance Criteria:
    - AC1: Staff searches patient by phone/email/name, selects from results, uses same booking interface as patient self-service but with staff override options (book past cutoff, override capacity), logs booked_by_staff=true
- Edge Cases:
    - Patient not found: "Register New Patient" button opens registration form
    - Staff override: "Override Capacity" checkbox for urgent bookings past full slots
    - Staff calendar conflict: System allows (staff manages own schedule separately)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-006 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html |
| **Screen Spec** | SCR-006 (Booking - staff view with patient search), SCR-003 (Staff dashboard) |
| **UXR Requirements** | UXR-001 (Quick booking <3 clicks), UXR-501 (Inline validation for patient search) |
| **Design Tokens** | Patient search: autocomplete dropdown, Override checkbox: orange warning border, Staff badge: blue "Booked by Staff" pill |

> **Wireframe Components:**
> - Patient search box: Top section, autocomplete dropdown showing (Name, DOB, Phone)
> - Selected patient banner: Shows selected patient details, "Change Patient" button
> - Booking interface: Same calendar + slot picker as US_013, plus staff-only options
> - Staff options panel: "Override Capacity" checkbox (orange border), "Booking Notes" textarea (internal only), "Priority" dropdown (Normal/Urgent)
> - Success: "Appointment booked for [patient name]. Confirmation sent."

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

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
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement staff booking UI: (1) StaffBooking page with patient search (autocomplete by name/phone/email), (2) Reuse AppointmentCalendar + TimeSlotsGrid from US_013, (3) Add staff-only controls panel: "Override Capacity" checkbox (allows booking full slots), "Booking Notes" textarea (internal notes), "Priority" dropdown (Normal/Urgent), (4) useStaffBooking hook: POST /api/staff/appointments with {patientId, slotId, overrideCapacity, notes, priority}, (5) Success handling: Display confirmation with "Confirmation sent to [patient email/phone]", (6) "Register New Patient" flow if search returns no results, (7) Show "Booked by Staff" blue badge on appointment cards, (8) WCAG AA compliant.

## Dependent Tasks
- US_013 Task 001: Booking UI components (reuse calendar + slots)
- US_023 Task 002: Staff booking API endpoint (POST /api/staff/appointments)

## Impacted Components
**New:**
- app/src/pages/StaffBooking.tsx (Staff booking page)
- app/src/components/PatientSearch.tsx (Autocomplete search)
- app/src/components/StaffBookingOptions.tsx (Override + notes + priority)
- app/src/hooks/useStaffBooking.ts (POST mutation)

**Modified:**
- app/src/components/AppointmentCalendar.tsx (Reuse)
- app/src/components/TimeSlotsGrid.tsx (Reuse, show full slots if override checked)

## Implementation Plan
1. Create PatientSearch component: Input with debounced autocomplete (300ms), calls GET /api/patients/search?q={query}, displays dropdown with name, DOB, phone
2. Selected patient banner: Shows patient details (name, MRN, DOB, phone), "Change Patient" button clears selection
3. StaffBookingOptions panel: "Override Capacity" checkbox (orange warning: "Allows booking full slots"), "Booking Notes" textarea (500 chars), "Priority" dropdown (Normal/Urgent)
4. Reuse calendar + slots: Pass staffMode=true prop → slots marked full still selectable if override checked
5. useStaffBooking hook: POST /api/staff/appointments with staff-specific fields
6. Success confirmation: Modal with appointment details, "Confirmation sent to [patient email]", "View in Queue" button
7. Register New Patient: If search empty, show "Register New Patient" button → opens registration modal (reuse from US_021)
8. Test: Search patient → select → book → verify "Booked by Staff" badge appears

## Current Project State
```
ASSIGNMENT/app/src/
├── components/AppointmentCalendar.tsx (exists)
├── components/TimeSlotsGrid.tsx (exists)
└── (staff booking components to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/StaffBooking.tsx | Staff booking page |
| CREATE | app/src/components/PatientSearch.tsx | Autocomplete patient search |
| CREATE | app/src/components/StaffBookingOptions.tsx | Staff override options |
| CREATE | app/src/hooks/useStaffBooking.ts | Staff booking mutation |
| UPDATE | app/src/components/TimeSlotsGrid.tsx | Support staffMode prop |

## External References
- [React Autocomplete](https://www.npmjs.com/package/react-autocomplete)
- [FR-021 Staff Booking](../../../.propel/context/docs/spec.md#FR-021)
- [UC-001 Appointment Booking (staff variant)](../../../.propel/context/docs/spec.md#UC-001)

## Build Commands
```bash
cd app
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: PatientSearch debounces input 300ms
- [ ] Integration tests: Staff booking creates appointment with booked_by_staff=true
- [ ] Staff booking page renders: Navigate to /staff/booking → see patient search
- [ ] Patient search: Type name → autocomplete shows results
- [ ] Select patient: Click result → banner displays patient details
- [ ] Calendar renders: Selected patient → calendar + slots appear
- [ ] Override capacity: Check "Override Capacity" → full slots become selectable
- [ ] Booking notes: Enter notes → saved with appointment
- [ ] Priority: Select "Urgent" → saved as priority=urgent
- [ ] Book appointment: Submit → success confirmation + "Booked by Staff" badge
- [ ] Email sent: Patient receives confirmation email
- [ ] Register new: Search returns empty → "Register New Patient" button appears
- [ ] Responsive: Mobile → search + calendar stack vertically
- [ ] WCAG AA: Keyboard navigation, ARIA labels for autocomplete

## Implementation Checklist
- [ ] Create PatientSearch.tsx with debounced autocomplete
- [ ] Create StaffBookingOptions.tsx panel
- [ ] Create StaffBooking.tsx page container
- [ ] Create useStaffBooking.ts hook
- [ ] Update TimeSlotsGrid.tsx: Add staffMode prop logic
- [ ] Add routing: /staff/booking → StaffBooking (requireRole staff/admin)
- [ ] Test staff booking flow end-to-end
- [ ] Validate WCAG AA compliance
- [ ] Document staff booking in app/README.md
