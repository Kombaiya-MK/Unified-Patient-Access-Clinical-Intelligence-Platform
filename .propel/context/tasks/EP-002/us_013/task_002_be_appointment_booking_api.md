# Task - TASK_002_BE_APPOINTMENT_BOOKING_API

## Requirement Reference
- User Story: US_013
- Story Location: `.propel/context/tasks/us_013/us_013.md`
- Acceptance Criteria:
    - AC1: API returns available slots filtered by department/provider/date
    - AC2: POST /appointments creates appointment, returns confirmation with appointment ID
    - AC3: Concurrent booking prevention: Return 409 Conflict if slot already booked
    - AC4: Supports waitlist: POST /waitlist adds patient to waitlist for unavailable slot
- Edge Cases:
    - Slot becomes unavailable between selection and submission: Return 409 Conflict with message "Slot already booked"
    - Booking outside business hours: Validate startTime within configured hours (8AM-8PM), reject if invalid
    - Same-day appointments: Allow if slot >2 hours from current time, reject otherwise
    - Duplicate booking prevention: Check if patient already has appointment with same provider on same day

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

> **Note**: Backend API - no UI (UI handled in Task 001)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis (ioredis) | 5.x |
| AI/ML | N/A | N/A |

**Note**: All database operations MUST use transactions for concurrency safety

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI implementation - booking API only (AI intake is US_025)

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API (consumed by web frontend)

## Task Overview
Implement appointment booking REST API endpoints: (1) GET /api/slots for fetching available time slots with caching (5-min TTL), (2) POST /api/appointments for creating appointments with database transactions (prevent concurrent bookings), (3) POST /api/waitlist for joining waitlist. Implement business logic: validate slot availability, prevent double bookings, check business hours (8AM-8PM), same-day restriction (>2 hours notice), cache invalidation on booking/cancellation. Returns 409 Conflict if slot unavailable.

## Dependent Tasks
- US_002: Express backend setup
- US_003 Task 001: Database schema (Appointments, TimeSlots, Departments tables)
- US_004: Redis caching setup
- US_009 Task 001: JWT authentication (protect endpoints)

## Impacted Components
**New:**
- server/src/routes/appointments.routes.ts (GET /slots, POST /appointments, POST /waitlist)
- server/src/controllers/appointments.controller.ts (getAvailableSlots, bookAppointment, joinWaitlist)
- server/src/services/appointments.service.ts (Business logic: slot validation, booking creation, cache invalidation)
- server/src/validators/appointments.validator.ts (Request validation: slotId required, appointmentDate valid)
- server/src/types/appointments.types.ts (Slot, Appointment, BookingRequest, WaitlistRequest interfaces)

## Implementation Plan
1. **Create types**: Slot, Appointment, BookingRequest {patientId, slotId, notes?}, WaitlistRequest {patientId, slotId, preferredDate}
2. **Create AppointmentsService**:
   - getAvailableSlots(departmentId?, providerId?, date?): Query time_slots with LEFT JOIN appointments to find isAvailable=true AND NOT EXISTS(booking), cache results in Redis with 5-min TTL
   - bookAppointment(bookingData): Start transaction → check slot availability (SELECT FOR UPDATE) → if unavailable return {error: 'Slot already booked'} → validate business hours, same-day restriction → check duplicate (patient already has appointment same day/provider) → INSERT into appointments → invalidate cache for that date/provider → commit transaction → return appointment ID
   - joinWaitlist(waitlistData): INSERT into waitlist table → return waitlist ID
   - invalidateSlotCache(date, providerId): Delete Redis key `slots:{providerId}:{date}`
3. **Create AppointmentsController**: Wrap service calls, handle errors, return JSON responses
4. **Create validators**: Joi schemas for bookAppointment (slotId UUID required, notes max 500 chars), joinWaitlist (slotId, preferredDate required)
5. **Create routes**:
   - GET /api/slots?department=X&provider=Y&date=Z (public or authenticated)
   - POST /api/appointments (protected, requireRole('patient'))
   - POST /api/waitlist (protected, requireRole('patient'))
6. **Implement business rules**:
   - Business hours check: Validate slot.startTime between 8AM-8PM
   - Same-day check: If date === today, validate slot.startTime > now + 2 hours
   - Duplicate check: Prevent patient from booking 2+ appointments with same provider on same date
7. **Add concurrency safety**: Use SELECT FOR UPDATE in transaction to lock slot row during booking
8. **Add error handling**: 409 for slot conflict, 400 for validation errors, 500 for server errors
9. **Log to audit**: Log all booking attempts (success/failure) with patientId, slotId, timestamp, IP

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_013 Task 001)
├── server/               # Backend (US_002-005, US_009)
│   ├── src/
│   │   ├── routes/
│   │   │   └── appointments.routes.ts (placeholder exists, to be implemented)
│   │   ├── controllers/ (exists)
│   │   ├── services/ (exists)
│   │   ├── validators/ (exists)
│   │   └── middleware/
│   │       └── auth.ts (verifyToken implemented in US_009)
│   └── db/ (time_slots, appointments tables exist from US_003)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| UPDATE | server/src/routes/appointments.routes.ts | GET /slots, POST /appointments, POST /waitlist |
| CREATE | server/src/controllers/appointments.controller.ts | getAvailableSlots, bookAppointment, joinWaitlist methods |
| CREATE | server/src/services/appointments.service.ts | Slot availability logic, booking creation with transactions, cache invalidation |
| CREATE | server/src/validators/appointments.validator.ts | Joi schemas: bookAppointmentSchema, joinWaitlistSchema |
| CREATE | server/src/types/appointments.types.ts | Slot, Appointment, BookingRequest, WaitlistRequest interfaces |
| UPDATE | server/src/app.ts | Register appointments routes: `app.use('/api', appointmentsRoutes)` |

> Updates 2 existing files, creates 4 new files

## External References
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [SELECT FOR UPDATE](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Joi Validation](https://joi.dev/api/)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/ttl/)
- [FR-001 Appointment Booking Requirements](../../../.propel/context/docs/spec.md#FR-001)
- [DR-002 Referential Integrity](../../../.propel/context/docs/spec.md#DR-002)

## Build Commands
```bash
# Install dependencies
cd server
npm install joi

# Development server
npm run dev

# Test endpoints
# Get available slots
curl "http://localhost:3001/api/slots?department=123&date=2025-03-20" \
  -H "Authorization: Bearer <token>"

# Book appointment
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"slotId":"slot-uuid","notes":"Follow-up consultation"}'

# Join waitlist
curl -X POST http://localhost:3001/api/waitlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"slotId":"slot-uuid","preferredDate":"2025-03-20"}'
```

## Implementation Validation Strategy
- [ ] Unit tests: getAvailableSlots returns only unbooked slots
- [ ] Unit tests: bookAppointment prevents concurrent bookings (simulate race condition)
- [ ] Integration tests: POST /appointments creates appointment, returns 201
- [ ] Integration tests: Booking already-booked slot returns 409 Conflict
- [ ] joi installed: package.json shows joi@17.x
- [ ] GET /api/slots endpoint works: Returns available slots filtered by department/provider/date
- [ ] Slot caching works: Query slots → cached in Redis with 5-min TTL → subsequent queries return cached data
- [ ] POST /appointments endpoint works: Creates appointment, returns {appointmentId, status: 'scheduled'}
- [ ] Concurrency safety: Simulate 2 concurrent bookings for same slot → only one succeeds, other returns 409
- [ ] Business hours validation: Try booking slot at 7AM → 400 error "Slot outside business hours"
- [ ] Same-day restriction: Try booking today's slot <2 hours away → 400 error "Same-day appointments require 2+ hours notice"
- [ ] Duplicate booking prevention: Book appointment (patient + provider + date) → try booking again same day/provider → 400 error "You already have an appointment with this provider today"
- [ ] Cache invalidation: Book appointment → cache invalidated for that date/provider → re-query slots refreshes cache
- [ ] POST /waitlist endpoint works: Adds to waitlist table, returns {waitlistId, position}
- [ ] Audit logging: Booking attempt logged with patientId, slotId, success/failure, timestamp
- [ ] Error handling: Invalid slotId (non-UUID) → 400 validation error, server error → 500 with generic message

## Implementation Checklist
- [ ] Install joi: `cd server && npm install joi`
- [ ] Create server/src/types/appointments.types.ts:
  - [ ] `export interface Slot { id: string; startTime: Date; endTime: Date; isAvailable: boolean; providerId: string; departmentId: string; duration: number; }`
  - [ ] `export interface Appointment { id: string; patientId: string; providerId: string; slotId: string; appointmentDate: Date; status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'; notes?: string; createdAt: Date; updatedAt: Date; }`
  - [ ] `export interface BookingRequest { slotId: string; notes?: string; }`
  - [ ] `export interface WaitlistRequest { slotId: string; preferredDate: string; }`
- [ ] Create server/src/validators/appointments.validator.ts:
  - [ ] Import joi
  - [ ] `export const bookAppointmentSchema = joi.object({ slotId: joi.string().uuid().required(), notes: joi.string().max(500).optional() })`
  - [ ] `export const joinWaitlistSchema = joi.object({ slotId: joi.string().uuid().required(), preferredDate: joi.date().iso().required() })`
- [ ] Create server/src/services/appointments.service.ts:
  - [ ] Import pool (database), redisClient, auditLog
  - [ ] Implement getAvailableSlots(departmentId?, providerId?, date?):
    - [ ] Build cache key: `slots:${departmentId}:${providerId}:${date}`
    - [ ] Try cache: `redisClient.get(cacheKey)` → if HIT, return cached JSON
    - [ ] If MISS, query database: `SELECT ts.*, p.name as provider_name FROM time_slots ts LEFT JOIN appointments a ON ts.id = a.slot_id AND a.status != 'cancelled' JOIN providers p ON ts.provider_id = p.id WHERE ts.is_available = true AND a.id IS NULL AND ($1::uuid IS NULL OR ts.department_id = $1) AND ($2::uuid IS NULL OR ts.provider_id = $2) AND ($3::date IS NULL OR DATE(ts.start_time) = $3)`
    - [ ] Cache results: `redisClient.setex(cacheKey, 300, JSON.stringify(slots))`
    - [ ] Return slots
  - [ ] Implement bookAppointment(patientId, bookingData):
    - [ ] Start transaction: `await pool.query('BEGIN')`
    - [ ] Lock slot: `SELECT * FROM time_slots WHERE id = $1 FOR UPDATE` → verify isAvailable=true
    - [ ] Check if already booked: `SELECT * FROM appointments WHERE slot_id = $1 AND status != 'cancelled'` → if exists, rollback and throw { code: 409, message: 'Slot already booked' }
    - [ ] Validate business hours: Parse slot.startTime hour → if <8 or >20, throw { code: 400, message: 'Outside business hours' }
    - [ ] Validate same-day: If slot.date === today AND slot.startTime < now + 2 hours, throw { code: 400, message: 'Same-day appointments require 2+ hours notice' }
    - [ ] Check duplicate: `SELECT * FROM appointments WHERE patient_id = $1 AND provider_id = (SELECT provider_id FROM time_slots WHERE id = $2) AND DATE(appointment_date) = DATE($3) AND status != 'cancelled'` → if exists, throw { code: 400, message: 'You already have an appointment with this provider today' }
    - [ ] Insert appointment: `INSERT INTO appointments (id, patient_id, provider_id, slot_id, appointment_date, status, notes, created_by) VALUES (gen_random_uuid(), $1, ..., 'scheduled', ...) RETURNING *`
    - [ ] Update time slot: `UPDATE time_slots SET is_available = false WHERE id = $1`
    - [ ] Commit transaction: `await pool.query('COMMIT')`
    - [ ] Invalidate cache: `invalidateSlotCache(slot.date, slot.providerId)`
    - [ ] Log to audit: `auditLog.create({ userId: patientId, action: 'book_appointment', resourceId: appointment.id, details: { slotId, notes } })`
    - [ ] Return appointment
  - [ ] Implement joinWaitlist(patientId, waitlistData):
    - [ ] Insert: `INSERT INTO waitlist (id, patient_id, slot_id, preferred_date, status, created_at) VALUES (gen_random_uuid(), $1, $2, $3, 'waiting', NOW()) RETURNING *`
    - [ ] Return waitlist entry
  - [ ] Implement invalidateSlotCache(date, providerId): `redisClient.del(slots:*:${providerId}:${date})`
- [ ] Create server/src/controllers/appointments.controller.ts:
  - [ ] Import appointmentsService, validators
  - [ ] Implement getAvailableSlots(req, res):
    - [ ] Extract query params: departmentId, providerId, date
    - [ ] Call appointmentsService.getAvailableSlots(departmentId, providerId, date)
    - [ ] Return 200 with {slots: [...]}
    - [ ] Catch errors → return 500
  - [ ] Implement bookAppointment(req, res):
    - [ ] Validate body: bookAppointmentSchema.validate(req.body) → if error, return 400 with errors
    - [ ] Extract patientId from req.user (set by auth middleware)
    - [ ] Call appointmentsService.bookAppointment(patientId, req.body)
    - [ ] Return 201 with {appointmentId, status: 'scheduled', message: 'Appointment booked successfully'}
    - [ ] Catch errors: 409 → return 409 with message, 400 → return 400, 500 → return 500
  - [ ] Implement joinWaitlist(req, res):
    - [ ] Validate body: joinWaitlistSchema.validate(req.body)
    - [ ] Extract patientId from req.user
    - [ ] Call appointmentsService.joinWaitlist(patientId, req.body)
    - [ ] Return 201 with {waitlistId, message: "You've been added to the waitlist"}
    - [ ] Catch errors → return 500
- [ ] Update server/src/routes/appointments.routes.ts:
  - [ ] Import appointmentsController, verifyToken, requireRole from middleware/auth
  - [ ] GET /slots: appointmentsController.getAvailableSlots (optional auth for better caching)
  - [ ] POST /appointments: verifyToken, requireRole('patient'), appointmentsController.bookAppointment
  - [ ] POST /waitlist: verifyToken, requireRole('patient'), appointmentsController.joinWaitlist
- [ ] Update server/src/app.ts: Ensure appointments routes registered: `app.use('/api', appointmentsRoutes)`
- [ ] Test GET /api/slots:
  - [ ] `curl "http://localhost:3001/api/slots?date=2025-03-20"`
  - [ ] Verify response: {slots: [{id, startTime, endTime, isAvailable, providerId, departmentId}]}
  - [ ] Check Redis: `redis-cli GET "slots:*:*:2025-03-20"` → verify cached
- [ ] Test POST /api/appointments:
  - [ ] Create test slot in database: `INSERT INTO time_slots (...) VALUES (...)`
  - [ ] `curl -X POST http://localhost:3001/api/appointments -d '{"slotId":"test-slot-id"}' -H "Authorization: Bearer <token>" -H "Content-Type: application/json"`
  - [ ] Verify response: {appointmentId, status: 'scheduled'}
  - [ ] Verify database: `SELECT * FROM appointments WHERE id = '<appointmentId>'` → exists
  - [ ] Verify time slot updated: `SELECT is_available FROM time_slots WHERE id = 'test-slot-id'` → false
  - [ ] Verify cache invalidated: Re-query slots → cache regenerated
- [ ] Test concurrent bookings:
  - [ ] Simulate 2 simultaneous POST requests for same slot (use Promise.all)
  - [ ] Verify: One returns 201, other returns 409 "Slot already booked"
- [ ] Test business hours validation:
  - [ ] Create slot at 7:00 AM → try booking → verify 400 "Outside business hours"
- [ ] Test same-day restriction:
  - [ ] Create slot for today, 1 hour from now → try booking → verify 400 "Same-day appointments require 2+ hours notice"
- [ ] Test duplicate booking prevention:
  - [ ] Book appointment (patient A, provider B, date X) → try booking again (patient A, provider B, date X) → verify 400 "You already have an appointment with this provider today"
- [ ] Test POST /api/waitlist:
  - [ ] `curl -X POST http://localhost:3001/api/waitlist -d '{"slotId":"booked-slot-id","preferredDate":"2025-03-20"}' -H "Authorization: Bearer <token>"`
  - [ ] Verify response: {waitlistId, message}
  - [ ] Verify database: `SELECT * FROM waitlist WHERE id = '<waitlistId>'` → exists
- [ ] Document API in server/README.md: Endpoints, request/response formats, error codes, business rules
