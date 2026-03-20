# Task - TASK_001: Backend Arrival Tracking & Late Detection

## Requirement Reference
- User Story: [us_022]
- Story Location: [.propel/context/tasks/us_022/us_022.md]
- Acceptance Criteria:
    - AC1: Update status to "Arrived", record arrival_time timestamp
    - AC1: Log status change to audit log
- Edge Case:
    - EC1: Staff tries to mark arrived more than once - Display message "Already marked as arrived at [timestamp]"
    - EC2: Late arrival tracking - If arrival_time > appointment_datetime + 15min, flag as "Late" with orange indicator

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
Enhance the existing queue status update API (from US_020 TASK_003) to record arrival_time timestamp when status changes to "Arrived", calculate late arrival flag (arrival_time > appointment_datetime + 15min), prevent duplicate arrival marking, and return late arrival indicator in API response for frontend display.

## Dependent Tasks
- US_020 TASK_003: Backend Queue API with Optimistic Locking (already implemented, will enhance)
- US_007: Appointments table (already has arrived_at column from US_020 TASK_003)

## Impacted Components
- **MODIFY** server/src/services/queueService.ts - Add arrival_time recording and late detection logic
- **MODIFY** server/src/controllers/queueController.ts - Add duplicate arrival check
- **MODIFY** server/src/types/queue.types.ts - Add isLateArrival boolean field to response
- **MODIFY** database/migrations/V015__add_late_arrival_flag.sql - Add is_late_arrival boolean column (optional, can calculate on-the-fly)

## Implementation Plan
1. **Modify queueService.updateAppointmentStatus()**: When newStatus = 'arrived', set arrived_at = NOW(), calculate isLateArrival = (arrived_at > appointment_datetime + INTERVAL '15 minutes')
2. **Add Duplicate Check**: In queueController.updateStatus(), before calling service, check if current status is already 'arrived', return 409 Conflict with message "Already marked as arrived at [arrived_at timestamp]"
3. **Add Late Arrival Calculation**: Create helper function `calculateLateArrival(appointmentDatetime, arrivalTime)` that returns boolean, include in API response
4. **Enhance Audit Logging**: Add isLateArrival flag to audit log metadata when logging status change to 'arrived'
5. **Update API Response**: Include `isLateArrival: boolean` field in StatusUpdateResult response
6. **Add Database Column (Optional)**: Create migration V015 to add `is_late_arrival` boolean column to appointments table for persistent storage, or calculate dynamically in queries

**Focus on how to implement**: Late arrival calculation uses PostgreSQL INTERVAL arithmetic: `arrival_time > appointment_datetime + INTERVAL '15 minutes'`. Duplicate arrival check queries current appointment status before update. API response includes isLateArrival boolean for frontend to display orange indicator. Audit log metadata includes { oldStatus, newStatus, arrivalTime, isLateArrival }.

## Current Project State
```
server/
├── src/
│   ├── controllers/
│   │   └── queueController.ts (US_020 TASK_003, to be modified)
│   ├── services/
│   │   └── queueService.ts (US_020 TASK_003, to be modified)
│   ├── types/
│   │   └── queue.types.ts (US_020 TASK_003, to be modified)
│   └── utils/
│       └── auditLogger.ts (exists)
└── package.json
database/
├── migrations/
│   ├── V011__add_appointment_timestamps.sql (US_020, has arrived_at column)
│   └── (V015__add_late_arrival_flag.sql to be created - optional)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/src/services/queueService.ts | Add arrival_time recording and late arrival calculation in updateAppointmentStatus() |
| MODIFY | server/src/controllers/queueController.ts | Add duplicate arrival check before status update |
| MODIFY | server/src/types/queue.types.ts | Add isLateArrival: boolean to StatusUpdateResult interface |
| CREATE | database/migrations/V015__add_late_arrival_flag.sql | Optional migration to add is_late_arrival column to appointments table |

## External References
- **PostgreSQL INTERVAL**: https://www.postgresql.org/docs/current/functions-datetime.html - Date/time arithmetic
- **PostgreSQL NOW()**: https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT - Current timestamp
- **Express Error Handling**: https://expressjs.com/en/guide/error-handling.html - HTTP 409 Conflict responses
- **Timestamp Comparison**: https://www.postgresql.org/docs/current/datatype-datetime.html - Comparing timestamps
- **Audit Logging**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html - Audit trail best practices

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Run database migration: `npm run migrate` (optional, if creating V015)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (execute unit and integration tests)
- Test endpoint: `curl -X PATCH -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"newStatus":"arrived","version":1}' http://localhost:3000/api/staff/queue/:id/status`

## Implementation Validation Strategy
- [x] Unit tests pass for queueService, queueController with arrival tracking
- [x] Integration tests pass: PATCH /api/staff/queue/:id/status with status=arrived records arrival_time
- [x] Duplicate arrival validation: Second "Mark Arrived" returns 409 Conflict
- [x] Late arrival calculation: Arrival >15min late sets isLateArrival=true
- [x] API response validation: StatusUpdateResult includes isLateArrival boolean
- [x] Audit logging validation: Status changes logged with arrival time and late flag
- [x] Timestamp accuracy: arrived_at recorded with correct timezone (UTC)

## Implementation Checklist
- [ ] Modify queueService.ts updateAppointmentStatus() function (when newStatus = 'arrived', execute SQL: UPDATE appointments SET status = 'arrived', arrived_at = NOW(), version = version + 1 WHERE id = $1 AND version = $2)
- [ ] Add calculateLateArrival helper function in queueService.ts (query: SELECT (arrived_at > appointment_datetime + INTERVAL '15 minutes') AS is_late FROM appointments WHERE id = $1, return boolean)
- [ ] Modify queueController.ts updateStatus() handler (before calling service, check if current status is already 'arrived', if yes return 409 with message "Already marked as arrived at [timestamp]")
- [ ] Update queue.types.ts StatusUpdateResult interface (add isLateArrival?: boolean field)
- [ ] Enhance audit logging in queueController (add metadata: { oldStatus, newStatus, arrivalTime, isLateArrival } when logging 'mark_arrival' action)
- [ ] Update API response in queueController (after successful update, calculate isLateArrival using helper, include in response JSON)
- [ ] Create V015__add_late_arrival_flag.sql migration (optional: ALTER TABLE appointments ADD COLUMN is_late_arrival BOOLEAN DEFAULT FALSE, CREATE INDEX ON appointments(is_late_arrival) WHERE is_late_arrival = TRUE)
- [ ] Write unit tests for late arrival calculation (test cases: on-time arrival, 10 min late, 20 min late, early arrival)
