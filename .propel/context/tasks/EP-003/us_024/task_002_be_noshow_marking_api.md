# Task - TASK_002: Backend No-Show Marking API with Risk Calculation

## Requirement Reference
- User Story: [us_024]
- Story Location: [.propel/context/tasks/us_024/us_024.md]
- Acceptance Criteria:
    - AC1: Update status to "No Show", record timestamps, increment no_show_count, log to audit log, trigger risk score recalculation (+30 points)
- Edge Case:
    - EC1: Undo no-show within 2 hours (revert to "Arrived")
    - EC2: Excused no-shows don't increment count or affect risk score
    - EC3: Conflict detection if patient cancels while staff marking

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
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | PostgreSQL | 15.x |
| Backend | TypeScript | 5.3.x |

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
Create PATCH /api/staff/queue/:id/mark-noshow endpoint for marking appointments as no-show. Validate appointment is >30min past scheduled time, current status is "Scheduled", accept optional notes and excused_no_show flag. Update appointment: SET status='no_show', no_show_marked_at=NOW(), marked_by_staff_id=[staff_id], no_show_notes=[notes], excused_no_show=[flag]. If NOT excused: increment patient.no_show_count, calculate new risk_score += 30 (cap at 100). Create undo endpoint POST /api/staff/queue/:id/undo-noshow (only within 2 hours): revert status to "Arrived", decrement no_show_count, recalculate risk_score. Log all actions to audit_log. Handle conflict detection (return 409 if status changed).

## Dependent Tasks
- TASK_001: Database Migration (no-show fields must exist)
- US_020 TASK_003: Backend Queue API (base queue service to enhance)
- US_022 TASK_001: Backend Arrival Tracking (audit logging pattern)

## Impacted Components
- **CREATE** server/src/routes/noShowRoutes.ts - No-show marking routes
- **CREATE** server/src/controllers/noShowController.ts - markNoShow(), undoNoShow() controllers
- **CREATE** server/src/services/noShowService.ts - Business logic for marking/undoing no-show
- **CREATE** server/src/services/riskScoreService.ts - Risk score calculation logic
- **MODIFY** server/src/services/auditLogService.ts - Add no-show audit logging methods
- **MODIFY** server/src/types/appointment.types.ts - Add NoShowRequest, NoShowResponse interfaces
- **MODIFY** server/src/app.ts - Register noShowRoutes

## Implementation Plan
1. **Create appointment.types.ts additions**: Define NoShowRequest interface (appointment_id, notes?: string, excused_no_show?: boolean), NoShowResponse interface (appointment, patient_risk_score, message), UndoNoShowResponse interface
2. **Create riskScoreService.ts**: Implement calculateRiskScore(patientId) function - SELECT no_show_count, returns baseScore + (no_show_count * 30) capped at 100, UPDATE patients SET risk_score = calculatedScore WHERE id = patientId
3. **Create noShowService.ts**: Implement markNoShow(appointmentId, staffId, notes?, excused?) - BEGIN TRANSACTION, SELECT appointment with FOR UPDATE (pessimistic lock), validate status='scheduled' AND appointment_datetime < NOW() - INTERVAL '30 minutes', UPDATE appointment SET status='no_show', no_show_marked_at=NOW(), marked_by_staff_id=staffId, no_show_notes=notes, excused_no_show=excused, IF NOT excused THEN UPDATE patients SET no_show_count = no_show_count + 1 AND call riskScoreService.calculateRiskScore, COMMIT, return updated appointment + new risk_score
4. **Create noShowService.ts undo logic**: Implement undoNoShow(appointmentId, staffId) - BEGIN TRANSACTION, SELECT appointment with FOR UPDATE, validate status='no_show' AND no_show_marked_at > NOW() - INTERVAL '2 hours' (within undo window), UPDATE appointment SET status='arrived', no_show_marked_at=NULL, IF excused_no_show=FALSE THEN UPDATE patients SET no_show_count = no_show_count - 1 AND recalculate risk_score, COMMIT, return success message
5. **Create noShowController.ts**: Implement markNoShow(req, res) - extract staffId from req.user, validate body (notes max 500 chars, excused_no_show boolean), call noShowService.markNoShow, log to auditLogService with action='mark_no_show', return 200 with NoShowResponse, handle 400 (validation), 409 (conflict/already no-show), 422 (not past 30min yet)
6. **Create noShowController.ts undo**: Implement undoNoShow(req, res) - extract staffId from req.user, call noShowService.undoNoShow, log to auditLogService with action='undo_no_show', return 200, handle 400 (undo window expired), 409 (conflict)
7. **Create noShowRoutes.ts**: Define PATCH /:id/mark-noshow and POST /:id/undo-noshow routes with authenticate and requireRole('staff', 'admin') middleware
8. **Modify auditLogService.ts**: Add logNoShowMarked(appointmentId, staffId, patientId, excused, notes) and logNoShowUndone(appointmentId, staffId, patientId) methods

**Focus on how to implement**: Use PostgreSQL transactions with FOR UPDATE for pessimistic locking to prevent concurrent updates. Risk score formula: Math.min(100, baseScore + (no_show_count * 30)). Undo window check: no_show_marked_at > NOW() - INTERVAL '2 hours' in SQL WHERE clause. Conflict detection: before UPDATE check if status still equals expected value, return 409 if changed. Excused no-shows skip patient counter and risk score updates. Audit log includes metadata JSON: {appointment_id, patient_id, excused, notes, previous_risk_score, new_risk_score}. Return 422 "Appointment not past 30 minutes" if NOW() < appointment_datetime + INTERVAL '30 minutes'.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── queueRoutes.ts (US_020)
│   │   └── (noShowRoutes.ts to be created)
│   ├── controllers/
│   │   ├── queueController.ts (US_020)
│   │   └── (noShowController.ts to be created)
│   ├── services/
│   │   ├── queueService.ts (US_020)
│   │   ├── auditLogService.ts (US_023 TASK_002, to be modified)
│   │   ├── (noShowService.ts to be created)
│   │   └── (riskScoreService.ts to be created)
│   ├── types/
│   │   └── appointment.types.ts (to be modified)
│   └── app.ts (to be modified)
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/riskScoreService.ts | Risk score calculation: baseScore + (no_show_count * 30), capped at 100 |
| CREATE | server/src/services/noShowService.ts | markNoShow() and undoNoShow() with transaction handling, validation, patient counter updates |
| CREATE | server/src/controllers/noShowController.ts | markNoShow() and undoNoShow() request handlers with input validation |
| CREATE | server/src/routes/noShowRoutes.ts | PATCH /:id/mark-noshow and POST /:id/undo-noshow routes |
| MODIFY | server/src/services/auditLogService.ts | Add logNoShowMarked() and logNoShowUndone() methods |
| MODIFY | server/src/types/appointment.types.ts | Add NoShowRequest, NoShowResponse, UndoNoShowResponse interfaces |
| MODIFY | server/src/app.ts | Register /api/staff/queue noShowRoutes |

## External References
- **PostgreSQL Transactions**: https://www.postgresql.org/docs/15/tutorial-transactions.html - BEGIN, COMMIT, ROLLBACK
- **PostgreSQL Row Locking**: https://www.postgresql.org/docs/15/explicit-locking.html#LOCKING-ROWS - SELECT ... FOR UPDATE for pessimistic locking
- **PostgreSQL Interval Arithmetic**: https://www.postgresql.org/docs/15/functions-datetime.html - NOW() - INTERVAL calculations
- **Express Error Handling**: https://expressjs.com/en/guide/error-handling.html - Async error handling patterns
- **TypeScript Type Guards**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html - Runtime type checking

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (unit and integration tests)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for riskScoreService.calculateRiskScore()
- [x] Integration test: Mark no-show increments no_show_count and adds 30 to risk_score
- [x] Integration test: Excused no-show does NOT increment count or affect risk_score
- [x] Integration test: Mark no-show before 30min past time returns 422 error
- [x] Integration test: Undo no-show within 2 hours succeeds, decrements count, recalculates risk
- [x] Integration test: Undo no-show after 2 hours returns 400 "Undo window expired"
- [x] Integration test: Concurrent no-show marking fails with 409 conflict
- [x] Integration test: Audit log entries created for mark and undo actions
- [x] Security test: Non-staff user receives 403 Forbidden

## Implementation Checklist
- [ ] Modify appointment.types.ts (add interfaces: NoShowRequest with appointment_id, notes?, excused_no_show?; NoShowResponse with appointment, patient_risk_score, message; UndoNoShowResponse with success, message)
- [ ] Create riskScoreService.ts (calculateRiskScore function: SELECT no_show_count FROM patients WHERE id=patientId, calculate newScore = Math.min(100, no_show_count * 30), UPDATE patients SET risk_score = newScore, return newScore)
- [ ] Create noShowService.ts markNoShow method (BEGIN, SELECT appointment FOR UPDATE, validate status='scheduled' AND appointment_datetime < NOW() - '30 minutes', UPDATE appointment fields, IF NOT excused UPDATE patients no_show_count + 1 and call riskScoreService, COMMIT, return appointment + risk_score)
- [ ] Create noShowService.ts undoNoShow method (BEGIN, SELECT appointment FOR UPDATE, validate status='no_show' AND no_show_marked_at > NOW() - '2 hours', UPDATE appointment status='arrived' and clear no_show fields, IF was not excused DECREMENT no_show_count and recalculate risk, COMMIT, return success)
- [ ] Create noShowController.ts markNoShow handler (get staffId from req.user.id, validate req.body with express-validator (notes maxLength 500, excused_no_show isBoolean), call noShowService.markNoShow, call auditLogService, res.status(200).json response, handle errors 400/409/422)
- [ ] Create noShowController.ts undoNoShow handler (get staffId from req.user.id, call noShowService.undoNoShow, call auditLogService, res.status(200).json, handle 400/409 errors)
- [ ] Create noShowRoutes.ts (express.Router(), PATCH /:id/mark-noshow with authenticate and requireRole('staff', 'admin'), POST /:id/undo-noshow with same middleware, map to controller methods)
- [ ] Modify auditLogService.ts (add logNoShowMarked: INSERT with action='mark_no_show', metadata JSON {appointment_id, patient_id, excused, notes, risk_score_change}; add logNoShowUndone: INSERT with action='undo_no_show')
- [ ] Modify app.ts (import noShowRoutes, app.use('/api/staff/queue', noShowRoutes) - routes will be /api/staff/queue/:id/mark-noshow)
