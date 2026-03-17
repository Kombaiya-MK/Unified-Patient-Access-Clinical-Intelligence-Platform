# Task - TASK_002_BE_STAFF_BOOKING_API

## Requirement Reference
- User Story: US_023
- Story Location: `.propel/context/tasks/us_023/us_023.md`
- Acceptance Criteria:
    - AC1: POST /api/staff/appointments creates appointment with booked_by_staff=true, booked_by_staff_id, supports override options (past cutoff, full slots), sends confirmation to patient, logs audit
- Edge Cases:
    - Patient not in system: Return 404 with "Register patient first"
    - Override capacity: overrideCapacity=true bypasses slot availability check
    - Staff own conflict: Allow (staff manages own schedule separately)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
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
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement staff booking API: (1) GET /api/patients/search?q={query} searches by name/phone/email with fuzzy matching, (2) POST /api/staff/appointments creates appointment with staff-specific fields (booked_by_staff=true, booked_by_staff_id from JWT, booking_notes, priority), (3) Override logic: If overrideCapacity=true, skip slot availability check, (4) Business rules: Staff can book past same-day cutoff (e.g., 30 min notice instead of 2 hours), (5) Send patient confirmation via email/SMS, (6) Generate PDF, (7) Log audit with action_type='staff_booking', includes staff_id and patient_id, (8) Return appointment + confirmation status.

## Dependent Tasks
- US_013 Task 002: Booking API (reuse slot validation)
- US_018: PDF generation service
- US_016: Notification service (email/SMS)

## Impacted Components
**New:**
- server/src/controllers/staff-booking.controller.ts (Staff booking logic)
- server/src/routes/staff-booking.routes.ts (POST /api/staff/appointments, GET /api/patients/search)
- server/src/services/staff-booking.service.ts (Business logic with override)

**Modified:**
- server/db/schema.sql (Add booked_by_staff, booked_by_staff_id, booking_notes, priority columns)

## Implementation Plan
1. Add columns: ALTER TABLE appointments ADD COLUMN booked_by_staff BOOLEAN DEFAULT false, ADD COLUMN booked_by_staff_id UUID REFERENCES users(id), ADD COLUMN booking_notes TEXT, ADD COLUMN priority VARCHAR(20) DEFAULT 'normal'
2. Implement GET /api/patients/search: Query users WHERE role='patient' AND (first_name ILIKE %q% OR last_name ILIKE %q% OR email ILIKE %q% OR phone ILIKE %q%), LIMIT 10
3. Implement staffBookingService.bookForPatient: Validate patientId exists, check staff role, if overrideCapacity=false validate slot availability, else skip check, create appointment with staff fields, send notification, generate PDF
4. Override validation: Staff can book slots even if time_slots.is_available=false when overrideCapacity=true
5. Relaxed cutoff: Staff can book appointments with <2 hours notice
6. Add POST /api/staff/appointments route: requireRole('staff', 'admin'), Joi validation
7. Audit log: Include booked_by_staff_id, patient_id, override_used boolean
8. Test: Staff booking with override → slot full but appointment created

## Current Project State
```
ASSIGNMENT/server/src/
├── services/appointments.service.ts (patient booking exists)
└── (staff booking service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/staff-booking.controller.ts | Staff booking handler |
| CREATE | server/src/routes/staff-booking.routes.ts | POST /staff/appointments, GET /patients/search |
| CREATE | server/src/services/staff-booking.service.ts | Booking logic with override |
| UPDATE | server/db/schema.sql | Add booked_by_staff columns |

## External References
- [PostgreSQL ILIKE](https://www.postgresql.org/docs/current/functions-matching.html)
- [FR-021 Staff Booking](../../../.propel/context/docs/spec.md#FR-021)

## Build Commands
```bash
cd server
npm run dev

# Test patient search
curl -X GET "http://localhost:3001/api/patients/search?q=john" \
  -H "Authorization: Bearer <staff-token>"

# Test staff booking
curl -X POST http://localhost:3001/api/staff/appointments \
  -H "Authorization: Bearer <staff-token>" \
  -d '{
    "patientId": "patient-uuid",
    "slotId": "slot-uuid",
    "overrideCapacity": true,
    "bookingNotes": "Urgent case",
    "priority": "urgent"
  }' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: patientSearch fuzzy matches names
- [ ] Integration tests: Staff booking with override creates appointment
- [ ] booked_by_staff columns exist: \d appointments shows columns
- [ ] Patient search endpoint protected: Try GET without staff token → 403
- [ ] Fuzzy search works: GET /patients/search?q=joh → returns "John Doe"
- [ ] Staff booking: POST /staff/appointments → appointment created with booked_by_staff=true
- [ ] booked_by_staff_id recorded: Query appointments → matches staff JWT user_id
- [ ] Override works: overrideCapacity=true on full slot → appointment created despite is_available=false
- [ ] Booking notes saved: Query appointments.booking_notes → matches submitted notes
- [ ] Priority saved: priority='urgent' stored in database
- [ ] Patient notification: Verify email + SMS sent to patient
- [ ] PDF generated: pdfService called, PDF attached to email
- [ ] Audit logged: action_type='staff_booking', includes staff_id and patient_id

## Implementation Checklist
- [ ] Add booked_by_staff columns to appointments table
- [ ] Implement staff-booking.service.ts with override logic
- [ ] Create staff-booking.controller.ts handlers
- [ ] Create staff-booking.routes.ts with POST + GET routes
- [ ] Add patient search endpoint
- [ ] Mount /api/staff routes in app.ts
- [ ] Test staff booking with override
- [ ] Document staff booking API in server/README.md
