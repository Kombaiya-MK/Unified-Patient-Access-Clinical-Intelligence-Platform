# Task - TASK_002_BE_APPOINTMENT_RESCHEDULE_API

## Requirement Reference
- User Story: US_014
- Story Location: `.propel/context/tasks/us_014/us_014.md`
- Acceptance Criteria:
    - AC1: PUT /api/appointments/:id updates appointment date/time, sends new PDF, triggers calendar sync, logs to audit
- Edge Cases:
    - Reschedule within 2 hours: Return 400 "Cannot reschedule within 2 hours of appointment"
    - Max 3 reschedules per appointment: Track reschedule_count, return 400 "Maximum reschedules exceeded"
    - New slot unavailable: Use SELECT FOR UPDATE, return 409 if concurrent booking

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
| Cache | Redis | 5.x |
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
Implement PUT /api/appointments/:id endpoint for rescheduling with: (1) Validate 2-hour minimum notice, (2) Check reschedule_count < 3, (3) Use database transaction with SELECT FOR UPDATE to lock slots, (4) Update appointment and time_slots tables, (5) Increment reschedule_count, (6) Invalidate Redis cache, (7) Trigger PDF regeneration, (8) Trigger calendar sync update, (9) Log to audit, (10) Send email with new confirmation. Returns 400/409 for validation/conflict errors.

## Dependent Tasks
- US_013 Task 002: Booking API (reuse slot validation logic)
- US_017: Calendar sync service (trigger update)
- US_018: PDF generation service (regenerate PDF)

## Impacted Components
**New:**
- server/src/controllers/appointments.controller.ts (Add rescheduleAppointment method)
- server/src/services/appointments.service.ts (Add reschedule logic)

**Modified:**
- server/src/routes/appointments.routes.ts (Add PUT /:id route)
- server/db/schema.sql (Add reschedule_count column to appointments table if missing)

## Implementation Plan
1. Add reschedule_count column to appointments table: ALTER TABLE appointments ADD COLUMN reschedule_count INTEGER DEFAULT 0
2. Implement rescheduleAppointment service method: Start transaction, validate 2-hour notice, check reschedule_count < 3, lock old + new slots, update appointment, increment counter, invalidate cache, commit
3. Add PUT /:id route: verifyToken, requireRole('patient'), validate ownership, call rescheduleAppointment
4. Trigger downstream: Call PDF service, calendar sync service
5. Test validation: Try reschedule <2 hours → 400, try 4th reschedule → 400
6. Test concurrency: Simulate race condition → verify only one succeeds

## Current Project State
```
ASSIGNMENT/server/src/
├── routes/appointments.routes.ts (GET /slots, POST / exist)
├── services/appointments.service.ts (bookAppointment exists)
└── (reschedule logic to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| UPDATE | server/src/routes/appointments.routes.ts | Add PUT /:id for reschedule |
| UPDATE | server/src/controllers/appointments.controller.ts | Add rescheduleAppointment method |
| UPDATE | server/src/services/appointments.service.ts | Add reschedule business logic with transaction |
| UPDATE | server/db/schema.sql | Add reschedule_count column to appointments |

## External References
- [PostgreSQL SELECT FOR UPDATE](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [FR-001 Reschedule Requirements](../../../.propel/context/docs/spec.md#FR-001)

## Build Commands
```bash
cd server
npm run dev

# Test reschedule
curl -X PUT http://localhost:3001/api/appointments/appt-id \
  -H "Authorization: Bearer <token>" \
  -d '{"newSlotId":"new-slot-uuid"}' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: rescheduleAppointment validates 2-hour notice
- [ ] Integration tests: PUT /appointments/:id updates appointment
- [ ] reschedule_count column exists: `\d appointments` shows column
- [ ] 2-hour validation works: Try reschedule 1 hour before → 400 error
- [ ] Max reschedule enforced: Reschedule 3 times → 4th attempt → 400 "Maximum reschedules exceeded"
- [ ] Concurrency safe: Two simultaneous reschedules to same slot → only one succeeds (409)
- [ ] Cache invalidated: After reschedule → GET /slots refreshes cache
- [ ] Audit logged: Query audit_logs → see action_type='update', resource_type='appointment'
- [ ] Ownership verified: Patient A tries reschedule Patient B's appointment → 403 Forbidden

## Implementation Checklist
- [ ] Add reschedule_count column: `ALTER TABLE appointments ADD COLUMN reschedule_count INTEGER DEFAULT 0;`
- [ ] Update appointments.service.ts: Add rescheduleAppointment method with transaction + validation
- [ ] Update appointments.controller.ts: Add rescheduleAppointment handler
- [ ] Update appointments.routes.ts: Add PUT /:id route with auth
- [ ] Test validation scenarios
- [ ] Document API in server/README.md
