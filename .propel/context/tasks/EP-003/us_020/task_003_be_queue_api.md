# Task - TASK_003: Backend Queue API with Optimistic Locking

## Requirement Reference
- User Story: [us_020]
- Story Location: [.propel/context/tasks/us_020/us_020.md]
- Acceptance Criteria:
    - AC1: API returns today's appointment list with patient, provider, department, status
    - AC2: PATCH endpoint updates appointment status to "Arrived", logs arrival time in audit log
    - AC3: PATCH endpoint updates status to "In Progress", records start time
    - AC4: PATCH endpoint updates status to "Completed", calculates total duration
- Edge Case:
    - EC3: Two staff members try to mark arrived simultaneously - Optimistic locking: first update wins, second receives "Already marked arrived by [Staff Name]" message

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
Create queue management API endpoints for staff to fetch today's appointments and update appointment statuses with optimistic locking. Implement GET /api/staff/queue/today endpoint with filters (status, provider, department). Implement PATCH /api/staff/queue/:id/status endpoint with version checking to prevent concurrent update conflicts. Log all status changes to audit table with staff member info.

## Dependent Tasks
- US-007: Database schema with Appointments table
- US-009: Authentication middleware for staff role
- US-022: Arrival marking backend service (may overlap, coordinate implementation)

## Impacted Components
- **CREATE** server/src/controllers/queueController.ts - Controller for queue management endpoints
- **CREATE** server/src/routes/queueRoutes.ts - Express routes for queue operations
- **CREATE** server/src/services/queueService.ts - Service layer for queue data and status updates
- **CREATE** server/src/types/queue.types.ts - TypeScript interfaces for queue operations
- **MODIFY** server/src/routes/index.ts - Register queue routes
- **MODIFY** database/migrations/V010__add_appointment_version.sql - Add version column to appointments table for optimistic locking
- **MODIFY** database/migrations/V011__add_appointment_timestamps.sql - Add arrived_at, started_at, completed_at columns

## Implementation Plan
1. **Create Database Migrations**:
   - V010: Add `version` integer column (default 1) to appointments table for optimistic locking
   - V011: Add `arrived_at`, `started_at`, `completed_at` timestamp columns to appointments table
2. **Create queue.types.ts**: Define interfaces for `QueueAppointment`, `StatusUpdateRequest`, `StatusUpdateResult`, `QueueFilters`
3. **Create queueService.ts**: Implement functions:
   - `getTodayQueue(filters)`: Query appointments WHERE appointment_date = CURRENT_DATE, JOIN patients, providers, departments, apply filters, ORDER BY appointment_time ASC
   - `updateAppointmentStatus(appointmentId, newStatus, staffId, version)`: Update with optimistic locking (WHERE id = $1 AND version = $2), increment version, set timestamp column based on status, return conflict error if version mismatch
   - `getStaffMemberName(staffId)`: Helper to get staff name for conflict error message
4. **Implement Optimistic Locking**: In `updateAppointmentStatus`, execute SQL:
   ```sql
   UPDATE appointments
   SET status = $1, version = version + 1, [arrived_at|started_at|completed_at] = NOW(), updated_by = $2
   WHERE id = $3 AND version = $4
   RETURNING *;
   ```
   If rowCount = 0, query current version and staff who updated, return 409 Conflict with message
5. **Create queueController.ts**: Implement handlers:
   - `getTodayQueue()`: Extract filters from query params, call queueService.getTodayQueue(), return JSON
   - `updateStatus()`: Extract appointmentId, newStatus, version from request, call queueService.updateAppointmentStatus(), log to audit_log, broadcast WebSocket event (TASK_004), return updated appointment or 409 error
6. **Create queueRoutes.ts**: Define routes:
   - GET /api/staff/queue/today?status=&providerId=&departmentId= (protected, staff role)
   - PATCH /api/staff/queue/:id/status (protected, staff role)
7. **Add Audit Logging**: Log all status updates to audit_log with action = 'update_appointment_status', metadata = { appointmentId, oldStatus, newStatus, staffId }

**Focus on how to implement**: Optimistic locking uses version field to detect concurrent updates. When conflict detected, return 409 status with error message including staff member name who won the race. Timestamp columns (arrived_at, started_at, completed_at) track status transition times. Query optimization uses single JOIN query with WHERE/ORDER BY for today's queue. Filters applied with SQL WHERE clauses (not client-side).

## Current Project State
```
server/
├── src/
│   ├── controllers/
│   │   ├── appointments.controller.ts
│   │   ├── auth.controller.ts
│   │   └── (queueController.ts to be created)
│   ├── routes/
│   │   ├── appointments.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── index.ts (to be modified)
│   │   └── (queueRoutes.ts to be created)
│   ├── services/
│   │   ├── appointments.service.ts
│   │   ├── authService.ts
│   │   └── (queueService.ts to be created)
│   ├── types/
│   │   ├── appointment.types.ts
│   │   └── (queue.types.ts to be created)
│   ├── middleware/
│   │   └── authMiddleware.ts
│   └── app.ts
├── package.json
└── (to be created)
database/
├── migrations/
│   ├── V009__create_email_log_table.sql
│   ├── (V010__add_appointment_version.sql to be created)
│   └── (V011__add_appointment_timestamps.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/queueController.ts | Controller with getTodayQueue, updateStatus handlers |
| CREATE | server/src/routes/queueRoutes.ts | Express routes: GET /api/staff/queue/today, PATCH /api/staff/queue/:id/status |
| CREATE | server/src/services/queueService.ts | Service with getTodayQueue, updateAppointmentStatus functions with optimistic locking |
| CREATE | server/src/types/queue.types.ts | TypeScript interfaces: QueueAppointment, StatusUpdateRequest, StatusUpdateResult, QueueFilters, ConflictError |
| MODIFY | server/src/routes/index.ts | Import and register queueRoutes (router.use('/staff/queue', queueRoutes)) |
| CREATE | database/migrations/V010__add_appointment_version.sql | Migration to add version column (integer, default 1, not null) to appointments table |
| CREATE | database/migrations/V011__add_appointment_timestamps.sql | Migration to add arrived_at, started_at, completed_at timestamp columns to appointments table |

## External References
- **PostgreSQL Optimistic Locking**: https://www.postgresql.org/docs/current/mvcc-intro.html - Concurrency control patterns
- **Row Versioning**: https://use-the-index-luke.com/sql/dml/update#mvcc - Version-based optimistic locking
- **PostgreSQL UPDATE RETURNING**: https://www.postgresql.org/docs/current/dml-returning.html - Atomic update and return
- **Express Error Handling**: https://expressjs.com/en/guide/error-handling.html - HTTP status codes for conflicts
- **Date Filtering SQL**: https://www.postgresql.org/docs/current/functions-datetime.html - Date comparison functions
- **Audit Logging Best Practices**: https://www.percona.com/blog/audit-logging-in-postgresql/ - PostgreSQL audit patterns

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Run database migrations: `npm run migrate` or `./database/scripts/run_migrations.ps1`
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (execute unit and integration tests)
- Test endpoint: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/staff/queue/today`

## Implementation Validation Strategy
- [x] Unit tests pass for queueController, queueService
- [x] Integration tests pass: GET /api/staff/queue/today returns appointments, PATCH updates status
- [x] Database migrations run successfully without errors
- [x] Optimistic locking validation: Concurrent updates return 409 Conflict with staff name
- [x] Version increment validation: Each status update increments version by 1
- [x] Timestamp validation: arrived_at, started_at, completed_at set correctly based on status
- [x] Audit logging validation: All status updates logged with staffId, old/new status
- [x] Authorization validation: Non-staff users receive 403 Forbidden

## Implementation Checklist
- [ ] Create V010__add_appointment_version.sql migration (ALTER TABLE appointments ADD COLUMN version INTEGER NOT NULL DEFAULT 1)
- [ ] Create V011__add_appointment_timestamps.sql migration (ALTER TABLE appointments ADD COLUMN arrived_at TIMESTAMP, ADD COLUMN started_at TIMESTAMP, ADD COLUMN completed_at TIMESTAMP)
- [ ] Run database migrations to add version and timestamp columns
- [ ] Create queue.types.ts with interfaces: QueueAppointment (id, patient_name, patient_id, appointment_time, status, provider_name, provider_id, department_name, department_id, risk_score, version), StatusUpdateRequest (newStatus, version), StatusUpdateResult (success, appointment, conflict), QueueFilters, ConflictError
- [ ] Create queueService.ts with getTodayQueue(filters) function (SQL: SELECT appointments.*, patients.name, providers.name, departments.name FROM appointments JOIN patients/providers/departments WHERE appointment_date = CURRENT_DATE, apply filters, ORDER BY appointment_time ASC)
- [ ] Implement updateAppointmentStatus(appointmentId, newStatus, staffId, version) with optimistic locking (UPDATE WHERE id = $1 AND version = $2, increment version, set timestamp column, RETURNING *, if rowCount = 0 query conflict and return 409 with staff name)
- [ ] Create queueController.ts with getTodayQueue handler (extract filters from query params, call queueService, return JSON) and updateStatus handler (extract params, call queueService, log audit, broadcast WebSocket in TASK_004, return result or 409 error)
- [ ] Create queueRoutes.ts with GET /api/staff/queue/today and PATCH /api/staff/queue/:id/status routes protected by authMiddleware with staff role check
