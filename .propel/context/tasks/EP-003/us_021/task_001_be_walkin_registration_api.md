# Task - TASK_001: Backend Walk-in Registration API

## Requirement Reference
- User Story: [us_021]
- Story Location: [.propel/context/tasks/us_021/us_021.md]
- Acceptance Criteria:
    - AC1: System creates same-day appointment entry with status="Walk-in"
    - AC1: appointment_datetime=current timestamp
    - AC1: estimated_wait_time calculated based on current queue length (avg 15 min per patient)
    - AC1: Assigns next available provider if no preference specified
    - AC1: Logs walk-in registration to audit log
- Edge Case:
    - EC1: Walk-in patient already registered - Search by phone/DOB, auto-fill existing patient details, link to existing patient record
    - EC2: Walk-in prioritized vs scheduled - Walk-ins added to end of current time slot queue, urgent walk-ins marked with priority flag move to front
    - EC3: All providers fully booked - Calculate estimated wait based on last appointment end time + buffer

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
| Backend | Node.js (Express) | 20.x LTS |
| Database | PostgreSQL | 15.x |

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
Create backend API endpoint for walk-in patient registration that searches for existing patients by phone/DOB, creates or links patient records, generates same-day appointments with status="Walk-in", calculates estimated wait time based on queue length, assigns providers using round-robin or preference logic, and logs all operations to audit trail.

## Dependent Tasks
- US-007: Appointments table with status field
- US-020 TASK_003: Backend Queue API (shares queue calculation logic)

## Impacted Components
- **CREATE** server/src/controllers/walkinController.ts - Controller for walk-in registration endpoints
- **CREATE** server/src/routes/walkinRoutes.ts - Express routes for walk-in operations
- **CREATE** server/src/services/walkinService.ts - Service layer for walk-in registration logic
- **CREATE** server/src/types/walkin.types.ts - TypeScript interfaces for walk-in data
- **MODIFY** server/src/routes/index.ts - Register walk-in routes
- **CREATE** database/migrations/V013__add_walkin_fields.sql - Add priority_flag, chief_complaint columns to appointments table

## Implementation Plan
1. **Create Database Migration V013**: Add columns to appointments table: `priority_flag` (boolean, default false), `chief_complaint` (text), `estimated_wait_minutes` (integer)
2. **Create walkin.types.ts**: Define interfaces for `WalkinRegistrationRequest`, `WalkinRegistrationResult`, `PatientSearchResult`
3. **Create walkinService.ts**: Implement functions:
   - `searchExistingPatient(phone, dob)`: Query patients table by phone+dob, return patient if found
   - `calculateWaitTime(providerId, isUrgent)`: Count appointments in queue for today WHERE status IN ('scheduled', 'arrived', 'in_progress'), multiply count by 15 minutes, add buffer if all providers busy
   - `assignProvider(preferredProviderId)`: If preference specified return preferred, else query providers table for next available (least appointments today)
   - `registerWalkin(data)`: Create or link patient, create appointment with status='Walk-in', appointment_datetime=NOW(), estimated_wait_minutes from calculation, return registration result
4. **Create walkinController.ts**: Implement handlers:
   - `searchPatient()`: Search by phone/DOB, return patient details or empty
   - `registerWalkin()`: Validate request, call walkinService.registerWalkin(), log audit, trigger SMS notification (TASK_002), return success with wait time
5. **Create walkinRoutes.ts**: Define routes:
   - GET /api/staff/walkin/search?phone=&dob= (search existing patient)
   - POST /api/staff/walkin/register (register new walk-in)
6. **Implement Priority Queue Logic**: If priority_flag=true, calculate wait_time as 5 minutes (urgent fast-track), insert at front of queue order
7. **Add Audit Logging**: Log walk-in registration with action='register_walkin', metadata={patientId, appointmentId, providerId, chiefComplaint, estimatedWait}

**Focus on how to implement**: Round-robin provider assignment queries providers ordered by (SELECT COUNT(*) FROM appointments WHERE provider_id = p.id AND appointment_date = CURRENT_DATE) ASC LIMIT 1. Wait time calculation uses simple linear formula: queue_count * 15 minutes. Priority walk-ins bypass wait calculation with fixed 5-minute estimate. Patient search uses exact match on phone (normalized: remove dashes) AND dob.

## Current Project State
```
server/
├── src/
│   ├── controllers/
│   │   ├── appointments.controller.ts
│   │   ├── queueController.ts (US_020 TASK_003)
│   │   └── (walkinController.ts to be created)
│   ├── routes/
│   │   ├── appointments.routes.ts
│   │   ├── queueRoutes.ts (US_020)
│   │   ├── index.ts (to be modified)
│   │   └── (walkinRoutes.ts to be created)
│   ├── services/
│   │   ├── appointments.service.ts
│   │   ├── queueService.ts (US_020)
│   │   └── (walkinService.ts to be created)
│   ├── types/
│   │   ├── appointment.types.ts
│   │   ├── queue.types.ts (US_020)
│   │   └── (walkin.types.ts to be created)
│   └── app.ts
└── package.json
database/
├── migrations/
│   ├── V011__add_appointment_timestamps.sql (US_020)
│   └── (V012__add_walkin_fields.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/walkinController.ts | Controller with searchPatient, registerWalkin handlers |
| CREATE | server/src/routes/walkinRoutes.ts | Express routes: GET /api/staff/walkin/search, POST /api/staff/walkin/register |
| CREATE | server/src/services/walkinService.ts | Service with searchExistingPatient, calculateWaitTime, assignProvider, registerWalkin functions |
| CREATE | server/src/types/walkin.types.ts | TypeScript interfaces: WalkinRegistrationRequest, WalkinRegistrationResult, PatientSearchResult |
| MODIFY | server/src/routes/index.ts | Import and register walkinRoutes (router.use('/staff/walkin', walkinRoutes)) |
| CREATE | database/migrations/V012__add_walkin_fields.sql | Migration to add priority_flag (boolean, default false), chief_complaint (text), estimated_wait_minutes (integer) columns to appointments table |

## External References
- **PostgreSQL COUNT Queries**: https://www.postgresql.org/docs/current/functions-aggregate.html - Counting appointments for wait time
- **Round-robin Algorithm**: https://en.wikipedia.org/wiki/Round-robin_scheduling - Provider assignment pattern
- **Phone Number Normalization**: https://www.npmjs.com/package/libphonenumber-js - Phone formatting library (optional)
- **Date Comparison SQL**: https://www.postgresql.org/docs/current/functions-datetime.html - Date/time queries for today's queue
- **Express Validation**: https://express-validator.github.io/docs/ - Request validation patterns
- **Audit Logging**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html - Audit trail best practices

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Run database migration: `npm run migrate` or `./database/scripts/run_migrations.ps1`
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (execute unit and integration tests)
- Test endpoint: `curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"patientName":"John Doe","phone":"555-1234","dob":"1990-01-01","chiefComplaint":"Fever"}' http://localhost:3000/api/staff/walkin/register`

## Implementation Validation Strategy
- [x] Unit tests pass for walkinController, walkinService
- [x] Integration tests pass: POST /api/staff/walkin/register creates appointment, returns wait time
- [x] Database migration runs successfully without errors
- [x] Patient search validation: GET /api/staff/walkin/search returns existing patient or empty
- [x] Wait time calculation validation: Queue with 4 appointments returns ~60 minutes (4 * 15)
- [x] Provider assignment validation: Next available provider selected when no preference
- [x] Priority flag validation: Urgent walk-ins get 5-minute wait time estimate
- [x] Audit logging validation: All registrations logged with complete metadata

## Implementation Checklist
- [ ] Create V013__add_walkin_fields.sql migration (ALTER TABLE appointments ADD COLUMN priority_flag BOOLEAN DEFAULT FALSE, ADD COLUMN chief_complaint TEXT, ADD COLUMN estimated_wait_minutes INTEGER)
- [ ] Run database migration to add walk-in fields
- [ ] Create walkin.types.ts with interfaces: WalkinRegistrationRequest (patientName, phone, dob, chiefComplaint, preferredProviderId?, isUrgent), WalkinRegistrationResult (success, appointmentId, patientId, estimatedWaitMinutes, providerId), PatientSearchResult (patientId, name, phone, dob, existingAppointments)
- [ ] Create walkinService.ts with searchExistingPatient(phone, dob) function (normalize phone, query patients WHERE phone = $1 AND dob = $2)
- [ ] Implement calculateWaitTime(providerId, isUrgent) function (if isUrgent return 5, else COUNT appointments WHERE provider_id = $1 AND appointment_date = CURRENT_DATE AND status IN ('scheduled','arrived','in_progress') * 15 minutes)
- [ ] Implement assignProvider(preferredProviderId) function (if preferredProviderId provided return it, else SELECT id FROM providers ORDER BY (SELECT COUNT(*) FROM appointments WHERE provider_id = p.id AND appointment_date = CURRENT_DATE) ASC LIMIT 1)
- [ ] Implement registerWalkin(data) function (call searchExistingPatient, if not found INSERT INTO patients, call assignProvider, call calculateWaitTime, INSERT INTO appointments with status='Walk-in', appointment_datetime=NOW(), return result)
- [ ] Create walkinController.ts with searchPatient handler (extract phone/dob from query, call walkinService.searchExistingPatient, return JSON) and registerWalkin handler (validate request body, call walkinService.registerWalkin, log audit, return success with estimated wait time)
