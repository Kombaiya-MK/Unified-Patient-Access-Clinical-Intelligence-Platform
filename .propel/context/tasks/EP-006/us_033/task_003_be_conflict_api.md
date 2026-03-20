# Task - TASK_003: Backend API Endpoints for Medication Conflict Checking

## Requirement Reference
- User Story: [us_033]
- Story Location: [.propel/context/tasks/us_033/us_033.md]
- Acceptance Criteria:
    - AC1: Trigger conflict check when adding new medication
    - AC1: Trigger conflict check when new medication extracted from documents
    - AC1: Allow staff to override critical conflicts with reason
    - AC1: Retrieve active conflicts for patient
- Edge Case:
    - EC1: Unrecognized medication → return suggestions for clarification
    - EC2: No allergy data → return warning
    - EC3: Dosage-dependent → return threshold guidance

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
| Backend | TypeScript | 5.3.x |
| Validation | Zod | 3.x |
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
Create REST API endpoints for medication conflict checking. POST /api/patients/:id/medications/check-conflicts to run conflict detection, accepts {medications, allergies?, conditions?}, calls conflictDetectionService.checkConflicts, returns conflicts array with severity levels and action_required flags. GET /api/patients/:id/conflicts to retrieve active conflicts from medication_conflicts table, filter by conflict_status='Active', include override ability for each conflict. PATCH /api/patients/:id/conflicts/:conflictId/override to override critical conflict, requires override_reason in body, validates staff permission, updates conflict_status='Overridden', logs to conflict_check_audit. GET /api/patients/:id/conflicts/history to retrieve conflict check audit trail, paginate results. POST /api/medications/validate to validate single medication name before adding, calls drugDatabaseService for normalization, returns matching drug or suggestions if unrecognized. Add staff-only authorization. Return proper HTTP status codes: 200 OK, 201 Created for new conflicts, 400 Bad Request, 403 Forbidden for override without permission, 409 Conflict if critical interaction detected and not overridden, 500 Internal Server Error. Include error handling with descriptive messages.

## Dependent Tasks
- TASK_001: Database Migration (medication_conflicts, conflict_check_audit tables)
- TASK_002: AI Conflict Detection Service (checkConflicts function)

## Impacted Components
- **CREATE** server/src/routes/conflictCheckRoutes.ts - Express routes for conflict checking
- **CREATE** server/src/controllers/conflictCheckController.ts - Endpoint handlers
- **MODIFY** server/src/routes/index.ts - Mount conflict check routes
- **MODIFY** server/src/middleware/authMiddleware.ts - Ensure staff authorization
- **CREATE** server/src/types/conflictCheckApi.types.ts - API request/response types

## Implementation Plan
1. **Create conflictCheckApi.types.ts**: Define interfaces: CheckConflictsRequest = {medications: MedicationInput[], allergies?: AllergyInput[], conditions?: ConditionInput[]}, CheckConflictsResponse = ConflictCheckResponse + {action_required: boolean, critical_conflicts_count, warning_conflicts_count}, OverrideConflictRequest = {staff_id, override_reason, acknowledged: boolean}, ValidateMedicationRequest = {medication_name}, ValidateMedicationResponse = {valid: boolean, normalized_name?, suggestions?: [{name, confidence}], drug_class?}
2. **Create conflictCheckController.ts**: Implement checkConflicts handler: validate patient exists, fetch patient allergies and conditions from patient_profiles if not provided in request, call conflictDetectionService.checkConflicts, count critical (severity ≥4) and warning (severity 2-3) conflicts, set action_required=true if any critical conflicts, return 200 with CheckConflictsResponse including unrecognized_medications if any
3. **Implement getActiveConflicts handler**: Query medication_conflicts WHERE patient_id AND conflict_status='Active', ORDER BY severity_level DESC, detected_at DESC, include medications_involved details, include override capability flag for each conflict based on severity, return 200 with conflicts array
4. **Implement overrideConflict handler**: Validate request body with Zod (staff_id, override_reason required, acknowledged must be true), verify staff has permission (role='staff' or 'admin'), fetch conflict from medication_conflicts, validate conflict exists and severity ≥4 (only critical conflicts can be overridden), UPDATE medication_conflicts SET conflict_status='Overridden', override_reason=$1, override_by_staff_id=$2, override_at=NOW(), INSERT INTO conflict_check_audit with action='Override' and rationale, return 200 with updated conflict
5. **Implement getConflictHistory handler**: Query conflict_check_audit WHERE patient_id ORDER BY check_performed_at DESC, paginate with limit=20 and offset, include medications_checked, conflicts_detected_count, highest_severity, return 200 with paginated results and total_count
6. **Implement validateMedication handler**: Extract medication_name from request body, call drugDatabaseService.normalizeMedicationName, if found return {valid: true, normalized_name, drug_class}, if not found call searchDrugByPartial and return {valid: false, suggestions: [{name, confidence}]}, return 200 with ValidateMedicationResponse
7. **Create conflictCheckRoutes.ts**: Setup Express router, define routes: POST /api/patients/:id/medications/check-conflicts (checkConflicts), GET /api/patients/:id/conflicts (getActiveConflicts), PATCH /api/patients/:id/conflicts/:conflictId/override (overrideConflict), GET /api/patients/:id/conflicts/history (getConflictHistory), POST /api/medications/validate (validateMedication), apply authMiddleware to ensure staff only
8. **Modify index.ts routes**: Import and mount conflictCheckRoutes under /api path
9. **Add input validation**: Use Zod schemas to validate request bodies, ensure medications array not empty, override_reason min 10 characters for critical overrides, staff_id exists in users table
10. **Add authorization**: In authMiddleware verify user role is 'staff' or 'admin', for override endpoint additionally check user has 'can_override_conflicts' permission, return 403 Forbidden if unauthorized
11. **Error handling**: Wrap handlers in try-catch, return 400 for validation errors with specific field messages, 404 for patient/conflict not found, 409 for critical conflict without override acknowledgment (block save action), 500 for server errors with error message
12. **Add webhook/notification integration**: After detecting critical conflict (severity ≥4), trigger notification service (US_046 dependency) to alert staff, send WebSocket real-time update if staff viewing patient profile
13. **Add API documentation**: Comment each endpoint with @route, @description, @access (Staff only), @body, @returns, @example
14. **Testing**: Write unit tests for each controller handler, test authorization blocks unauthorized users, test validation rejects invalid data, test override requires acknowledged=true and reason, test conflict check returns correct severity counts, test medication validation fuzzy matching

**Focus on how to implement**: Check conflicts endpoint: `router.post('/patients/:id/medications/check-conflicts', authMiddleware, conflictCheckController.checkConflicts)`. Controller: `export const checkConflicts = async (req: Request, res: Response) => { const {id} = req.params; const {medications, allergies, conditions} = req.body; const patient = await db.query('SELECT * FROM patient_profiles WHERE profile_id=$1', [id]); if (!patient) return res.status(404).json({error: 'Patient not found'}); const patientAllergies = allergies || patient.extracted_data?.allergies || []; const patientConditions = conditions || patient.extracted_data?.diagnosed_conditions || []; const result = await conflictDetectionService.checkConflicts(medications, patientAllergies, patientConditions, id); const criticalCount = result.conflicts.filter(c => c.severity_level >= 4).length; const warningCount = result.conflicts.filter(c => c.severity_level >= 2 && c.severity_level < 4).length; const response = {...result, action_required: criticalCount > 0, critical_conflicts_count: criticalCount, warning_conflicts_count: warningCount}; if (criticalCount > 0) return res.status(409).json({...response, message: 'Critical conflicts detected - override required'}); res.json(response); }`. Override: `export const overrideConflict = async (req: Request, res: Response) => { const {id, conflictId} = req.params; const {staff_id, override_reason, acknowledged} = req.body; if (!acknowledged) return res.status(400).json({error: 'Must acknowledge conflict to override'}); if (override_reason.length < 10) return res.status(400).json({error: 'Override reason must be at least 10 characters'}); const conflict = await db.query('SELECT * FROM medication_conflicts WHERE conflict_id=$1 AND patient_id=$2', [conflictId, id]); if (!conflict || conflict.severity_level < 4) return res.status(400).json({error: 'Only critical conflicts can be overridden'}); await db.query('UPDATE medication_conflicts SET conflict_status=$1, override_reason=$2, override_by_staff_id=$3, override_at=NOW() WHERE conflict_id=$4', ['Overridden', override_reason, staff_id, conflictId]); await db.query('INSERT INTO conflict_check_audit (patient_id, medications_checked, action_taken, performed_by, staff_id) VALUES ($1, $2, $3, $4, $5)', [id, '{}', 'Override', 'Staff Manual', staff_id]); res.json({message: 'Conflict overridden', conflict_id: conflictId}); }`. Validate medication: `export const validateMedication = async (req: Request, res: Response) => { const {medication_name} = req.body; const normalized = await drugDatabaseService.normalizeMedicationName(medication_name); if (normalized) { const drugClass = await drugDatabaseService.getDrugClass(normalized); return res.json({valid: true, normalized_name: normalized, drug_class: drugClass}); } const suggestions = await drugDatabaseService.searchDrugByPartial(medication_name); res.json({valid: false, suggestions}); }`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── index.ts (to be modified)
│   │   └── conflictCheckRoutes.ts (to be created)
│   ├── controllers/
│   │   └── conflictCheckController.ts (to be created)
│   ├── middleware/
│   │   └── authMiddleware.ts (may exist, to be verified/modified)
│   ├── types/
│   │   └── conflictCheckApi.types.ts (to be created)
│   └── services/
│       ├── conflictDetectionService.ts (TASK_002)
│       └── drugDatabaseService.ts (TASK_002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/conflictCheckApi.types.ts | API request/response TypeScript interfaces |
| CREATE | server/src/controllers/conflictCheckController.ts | Controller handlers for conflict checking |
| CREATE | server/src/routes/conflictCheckRoutes.ts | Express routes for conflict endpoints |
| MODIFY | server/src/routes/index.ts | Mount conflict check routes |
| MODIFY | server/src/middleware/authMiddleware.ts | Add staff authorization and override permissions |

## External References
- **Express Router**: https://expressjs.com/en/guide/routing.html - Route organization
- **Express Middleware**: https://expressjs.com/en/guide/using-middleware.html - Authorization
- **Zod Validation**: https://zod.dev/ - Request body validation
- **HTTP Status 409 Conflict**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409 - Appropriate for medication conflicts
- **PostgreSQL Transactions**: https://www.postgresql.org/docs/15/tutorial-transactions.html - Atomic override operations

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start server with hot reload)
- Run tests: `npm test -- conflictCheckController.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] POST /api/patients/:id/medications/check-conflicts returns conflict array
- [x] Critical conflicts (severity ≥4) return 409 status with action_required=true
- [x] Warning conflicts (severity 2-3) return 200 with warnings
- [x] GET /api/patients/:id/conflicts returns active conflicts
- [x] PATCH /api/patients/:id/conflicts/:conflictId/override requires acknowledged=true
- [x] Override requires override_reason min 10 characters
- [x] Override updates conflict_status and logs to audit
- [x] GET /api/patients/:id/conflicts/history returns paginated audit trail
- [x] POST /api/medications/validate returns normalized name or suggestions
- [x] Authorization middleware blocks non-staff users (returns 403)
- [x] Validation rejects empty medications array
- [x] Error handling returns proper status codes with messages
- [x] Unrecognized medications return suggestions array
- [x] No allergy data returns warning flag

## Implementation Checklist
- [ ] Create server/src/types/conflictCheckApi.types.ts (interfaces: CheckConflictsRequest with medications/allergies/conditions arrays, CheckConflictsResponse extends ConflictCheckResponse with action_required/critical_conflicts_count/warning_conflicts_count, OverrideConflictRequest with staff_id/override_reason/acknowledged, ValidateMedicationRequest/Response)
- [ ] Create server/src/controllers/conflictCheckController.ts file
- [ ] Implement checkConflicts handler (validate patient exists, fetch allergies/conditions from patient_profiles if not provided, call conflictDetectionService.checkConflicts, count critical severity≥4 and warnings 2-3, set action_required if critical>0, return 409 if critical conflicts else 200)
- [ ] Implement getActiveConflicts handler (query medication_conflicts WHERE patient_id AND conflict_status='Active' ORDER BY severity_level DESC, include medications_involved, override_capability flag, return 200)
- [ ] Implement overrideConflict handler (validate request with Zod: staff_id/override_reason required/acknowledged=true, check staff permission, fetch conflict validate severity≥4, UPDATE medication_conflicts set status='Overridden'/override_reason/override_by_staff_id/override_at, INSERT conflict_check_audit action='Override', return 200)
- [ ] Implement getConflictHistory handler (query conflict_check_audit WHERE patient_id ORDER BY check_performed_at DESC, paginate limit=20 offset, include medications_checked/conflicts_detected_count/highest_severity, return 200 with total_count)
- [ ] Implement validateMedication handler (extract medication_name, call drugDatabaseService.normalizeMedicationName, if found return valid=true/normalized_name/drug_class, if not found call searchDrugByPartial return valid=false/suggestions, return 200)
- [ ] Create server/src/routes/conflictCheckRoutes.ts (Express Router, routes: POST /patients/:id/medications/check-conflicts, GET /patients/:id/conflicts, PATCH /patients/:id/conflicts/:conflictId/override, GET /patients/:id/conflicts/history, POST /medications/validate, apply authMiddleware staff-only)
- [ ] Modify server/src/routes/index.ts (import conflictCheckRoutes, mount app.use('/api', conflictCheckRoutes))
- [ ] Add Zod validation schemas for request bodies (validate medications array not empty, override_reason min 10 characters, acknowledged boolean required for override, staff_id exists)
- [ ] Add authorization in authMiddleware (verify user.role === 'staff' || 'admin', for override check can_override_conflicts permission, return 403 if unauthorized)
- [ ] Add error handling to all controllers (try-catch, return 400 validation errors with field details, 404 patient/conflict not found, 409 critical conflict without override, 500 server errors with message)
- [ ] Add webhook/notification integration optional (after detecting critical conflict severity≥4: trigger notification service alert staff, send WebSocket real-time update if staff viewing profile)
- [ ] Add JSDoc API documentation (comment each endpoint: @route, @description, @access Staff only, @body, @returns CheckConflictsResponse, @example)
- [ ] Write unit tests (test each handler, test authorization blocks, test validation rejects, test override requires acknowledged+reason, test conflict check counts, test medication validation fuzzy, test 409 status for critical conflicts)
