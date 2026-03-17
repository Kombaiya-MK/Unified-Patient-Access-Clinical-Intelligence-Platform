# Task - TASK_001_FE_APPOINTMENT_RESCHEDULE

## Requirement Reference
- User Story: US_014
- Story Location: `.propel/context/tasks/us_014/us_014.md`
- Acceptance Criteria:
    - AC1: "Reschedule" button on dashboard (SCR-002) allows selecting new slot, updates appointment, sends new PDF, triggers calendar sync update
- Edge Cases:
    - Reschedule within 2 hours: Display error "Cannot reschedule within 2 hours of start time. Please call office."
    - Max 3 reschedules: Track reschedule_count, block after 3 attempts
    - New slot unavailable: Use optimistic locking, display "Slot no longer available", reload slots

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-002 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | SCR-002 (Patient Dashboard), SCR-006 (Appointment selection modal) |
| **UXR Requirements** | UXR-001 (Max 3 clicks), UXR-402 (Optimistic UI), UXR-501 (Inline validation for past dates) |
| **Design Tokens** | Reschedule button: secondary (outlined blue), Modal: same as booking, Conflict warning: red banner |

> **Wireframe Components:**
> - Reschedule button on appointment card hover/actions dropdown
> - Modal: Shows current appointment, calendar picker, time slot selector, Confirm + Cancel
> - Loading: "Updating appointment..." spinner
> - Success: Green toast + updated appointment card

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
| **Mobile Impact** | Yes (Responsive Web) |
| **Platform Target** | Web (Responsive) |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement reschedule modal component with calendar/slot picker (reuses AppointmentCalendar + TimeSlotsGrid from US_013), business logic validation (2-hour minimum notice, max 3 reschedules), optimistic UI updates, integration with PUT /api/appointments/:id endpoint. Displays current appointment details, prevents reschedule to same slot, tracks reschedule_count in database, triggers calendar sync and PDF regeneration.

## Dependent Tasks
- US_013 Task 001: Booking UI components (reuse calendar + slots)
- US_019 Task 001: Patient dashboard (Reschedule button location)
- US_014 Task 002: Rescheduling API endpoint (to be created)

## Impacted Components
**New:**
- app/src/components/RescheduleModal.tsx (Modal with calendar + slot picker)
- app/src/hooks/useReschedule.ts (PUT /appointments/:id mutation)

**Modified:**
- app/src/components/AppointmentCard.tsx (Add Reschedule action to dropdown)
- app/src/services/appointmentService.ts (Add rescheduleAppointment method)

## Implementation Plan
1. Create RescheduleModal component: Current appointment details, calendar picker, slot grid, validation (2-hour notice, prevent same slot)
2. Create useReschedule hook: PUT mutation with optimistic updates, rollback on error
3. Add Reschedule action to AppointmentCard dropdown
4. Validate business rules: Check appointment.datetime - now >= 2 hours, check reschedule_count < 3
5. Handle conflicts: 409 response → display "Slot unavailable", reload slots
6. Test reschedule flow: Select new slot → confirm → verify updated on dashboard

## Current Project State
```
ASSIGNMENT/
├── app/src/
│   ├── components/AppointmentCard.tsx (exists, needs Reschedule action)
│   ├── components/AppointmentCalendar.tsx (exists, reusable)
│   └── components/TimeSlotsGrid.tsx (exists, reusable)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/RescheduleModal.tsx | Modal with calendar picker, slot selector, confirm/cancel |
| CREATE | app/src/hooks/useReschedule.ts | PUT /appointments/:id mutation with optimistic updates |
| UPDATE | app/src/components/AppointmentCard.tsx | Add "Reschedule" to actions dropdown, trigger modal |
| UPDATE | app/src/services/appointmentService.ts | Add rescheduleAppointment(id, newSlotId) method |

## External References
- [Optimistic UI Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [React Modal](https://www.npmjs.com/package/react-modal)
- [UXR-402 Optimistic UI](../../../.propel/context/docs/spec.md#UXR-402)

## Build Commands
```bash
cd app
npm install react-modal  # If not already installed
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: RescheduleModal validates 2-hour minimum notice
- [ ] Integration tests: Reschedule appointment → updated in database
- [ ] Reschedule button visible: Hover appointment card → see "Reschedule" in actions
- [ ] Modal opens: Click Reschedule → modal shows current appointment + calendar
- [ ] Calendar pre-selected: Current appointment date highlighted
- [ ] Slot picker pre-filtered: Shows only available slots for selected date
- [ ] 2-hour validation: Try reschedule <2 hours → error "Cannot reschedule within 2 hours"
- [ ] Max reschedule check: Reschedule 3 times → 4th attempt → error "Maximum 3 reschedules reached"
- [ ] Same slot prevention: Select same date/time → error "Appointment already at this time"
- [ ] Optimistic update: Confirm → appointment card updates immediately before API response
- [ ] Conflict handling: Slot taken (409) → revert optimistic update, show error, reload slots
- [ ] Success flow: Reschedule → dashboard updated → PDF email sent → calendar synced

## Implementation Checklist
- [ ] Install react-modal: `npm install react-modal @types/react-modal`
- [ ] Create app/src/components/RescheduleModal.tsx
- [ ] Create app/src/hooks/useReschedule.ts with optimistic mutation
- [ ] Update AppointmentCard.tsx: Add Reschedule button to actions dropdown
- [ ] Update appointmentService.ts: Add rescheduleAppointment method
- [ ] Test reschedule flow end-to-end
- [ ] Document reschedule constraints in app/README.md
