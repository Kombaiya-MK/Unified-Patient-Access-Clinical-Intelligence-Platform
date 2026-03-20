# Task - TASK_003: Backend API Endpoints for Medical Coding Management

## Requirement Reference
- User Story: [us_032]
- Story Location: [.propel/context/tasks/us_032/us_032.md]
- Acceptance Criteria:
    - AC1: Allow edit/approve/reject each code with dropdown showing alternative codes
    - AC1: Save approved codes to Appointments table (icd10_codes JSON array)
    - AC1: Log all coding decisions to audit log with approver_staff_id
- Edge Case:
    - EC1: Vague condition → return multiple alternatives ranked
    - EC2: Combination codes → return primary + secondary
    - EC3: Manual code search → search ICD-10 database

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
Create REST API endpoints for medical coding operations. POST /api/appointments/:id/codes/generate to trigger AI code suggestions for appointment diagnoses, calls medicalCodingService.suggestCodes with patient's diagnosed conditions, returns array of ICD10Suggestion with codes, descriptions, confidence scores, alternatives. GET /api/appointments/:id/codes to retrieve current coding status and approved codes from appointments.icd10_codes. PATCH /api/appointments/:id/codes/:codeIndex/approve to approve AI-suggested code, updates appointments.icd10_codes array at index, logs approval to medical_coding_audit with approver_staff_id, sets coding_status to 'Approved' if all codes approved. PATCH /api/appointments/:id/codes/:codeIndex/reject to reject code, logs rejection with rationale to audit. PATCH /api/appointments/:id/codes/:codeIndex/modify to change suggested code to alternative or custom code, validates new code with icd10Validator, logs modification to audit. POST /api/appointments/:id/codes/bulk-approve to approve all codes with confidence ≥95%, batch update icd10_codes array. GET /api/codes/search to search ICD-10 database by code or description, returns matching codes for manual lookup. Add staff-only authorization. Return proper HTTP status codes and error messages.

## Dependent Tasks
- TASK_001: Database Migration (icd10_codes JSONB, medical_coding_audit table)
- TASK_002: AI Medical Coding Service (suggestCodes function)

## Impacted Components
- **CREATE** server/src/routes/medicalCodingRoutes.ts - Express routes for coding endpoints
- **CREATE** server/src/controllers/medicalCodingController.ts - Endpoint handlers
- **MODIFY** server/src/routes/index.ts - Mount medical coding routes
- **MODIFY** server/src/middleware/authMiddleware.ts - Ensure staff authorization
- **CREATE** server/src/types/medicalCodingApi.types.ts - API request/response types

## Implementation Plan
1. **Create medicalCodingApi.types.ts**: Define interfaces: GenerateCodesRequest = {appointment_id}, GenerateCodesResponse = {suggestions: ICD10Suggestion[], appointment_id, generated_at}, ApproveCodeRequest = {staff_id, rationale?}, ModifyCodeRequest = {new_code, rationale, staff_id}, BulkApproveRequest = {staff_id, confidence_threshold?}, SearchCodesRequest = {query, search_type: 'code' | 'description', limit?}, SearchCodesResponse = {results: [{code, description, category}], total_count}
2. **Create medicalCodingController.ts**: Implement generateCodes handler: validate appointment exists, fetch patient profile with diagnosed_conditions from extracted_data, call medicalCodingService.suggestCodes(diagnoses), update appointments.coding_status to 'AI Generated', store suggestions in temporary cache or session (not in DB yet until approved), return 200 with GenerateCodesResponse
3. **Implement getCodes handler**: Query appointments WHERE appointment_id, return icd10_codes JSONB array, coding_status, last_coded_at, include audit trail from med ical_coding_audit for this appointment
4. **Implement approveCode handler**: Validate request body with Zod (staff_id required, rationale optional), fetch current icd10_codes array from appointments, update code at codeIndex with {approved_by_staff_id: staff_id, approved_at: NOW(), is_auto_approved: false}, INSERT INTO medical_coding_audit with action_taken='Approved', update appointments.icd10_codes, check if all codes approved then set coding_status='Approved', return 200 with updated code
5. **Implement rejectCode handler**: Similar to approve but action_taken='Rejected', remove code from icd10_codes array or mark with rejected: true flag, log to audit with rationale, return 200
6. **Implement modifyCode handler**: Validate new_code with icd10Validator.isValidCode, check if code exists in ICD-10 database, fetch full description, update icd10_codes[codeIndex] with modified code, INSERT INTO medical_coding_audit with action_taken='Modified', modified_to_code=new_code, return 200 with updated code
7. **Implement bulkApprove handler**: Filter codes with confidence >= threshold (default 95%), batch update icd10_codes array setting approved_by_staff_id for each, INSERT multiple rows into medical_coding_audit, update coding_status to 'Approved' if all processed, return 200 with {approved_count, total_count}
8. **Implement searchCodes handler**: If search_type='code' call icd10DatabaseService.searchCode exact match, if search_type='description' call icd10DatabaseService.searchByDescription fuzzy search with limit, return 200 with SearchCodesResponse, paginate results if limit specified
9. **Create medicalCodingRoutes.ts**: Setup Express router, define routes: POST /api/appointments/:id/codes/generate (generateCodes), GET /api/appointments/:id/codes (getCodes), PATCH /api/appointments/:id/codes/:codeIndex/approve (approveCode), PATCH /api/appointments/:id/codes/:codeIndex/reject (rejectCode), PATCH /api/appointments/:id/codes/:codeIndex/modify (modifyCode), POST /api/appointments/:id/codes/bulk-approve (bulkApprove), GET /api/codes/search (searchCodes), apply authMiddleware to ensure staff only
10. **Modify index.ts routes**: Import and mount medicalCodingRoutes under /api path
11. **Add input validation**: Use Zod schemas to validate request bodies, ensure appointment_id is numeric, codeIndex within array bounds, staff_id exists in users table, new_code format valid
12. **Add authorization**: In authMiddleware verify user role is 'staff' or 'admin', return 403 Forbidden if patient user tries to access coding endpoints
13. **Error handling**: Wrap handlers in try-catch, return 400 for validation errors, 404 for appointment not found, 409 for invalid state (e.g., codes already approved), 500 for server errors
14. **Add API documentation**: Comment each endpoint with @route, @description, @access (Staff only), @param, @body, @returns
15. **Testing**: Write unit tests for each controller handler, test authorization blocks unauthorized users, test validation rejects invalid data, test approve/reject/modify updates database correctly, test bulk approve processes multiple codes, test search returns matching codes

**Focus on how to implement**: Express route: `router.post('/appointments/:id/codes/generate', authMiddleware, medicalCodingController.generateCodes)`. Controller approve: `export const approveCode = async (req: Request, res: Response) => { const {id, codeIndex} = req.params; const {staff_id, rationale} = req.body; const appointment = await db.query('SELECT icd10_codes FROM appointments WHERE appointment_id=$1', [id]); const codes = appointment.icd10_codes; codes[codeIndex].approved_by_staff_id = staff_id; codes[codeIndex].approved_at = new Date(); await db.query('UPDATE appointments SET icd10_codes=$1, coding_status=$2 WHERE appointment_id=$3', [JSON.stringify(codes), allApproved ? 'Approved' : 'Pending Review', id]); await db.query('INSERT INTO medical_coding_audit (appointment_id, diagnosis_text, suggested_code, action_taken, performed_by_staff_id, rationale) VALUES ($1, $2, $3, $4, $5, $6)', [id, codes[codeIndex].diagnosis_text, codes[codeIndex].icd10_code, 'Approved', staff_id, rationale]); res.json({message: 'Code approved', code: codes[codeIndex]}); }`. Bulk approve: `const highConfidenceCodes = codes.filter(c => c.confidence_score >= threshold); for (const code of highConfidenceCodes) { code.approved_by_staff_id = staff_id; code.approved_at = new Date(); } await db.query('UPDATE appointments SET icd10_codes=$1 WHERE appointment_id=$2', [JSON.stringify(codes), id]);`. Search: `const results = search_type === 'code' ? await icd10DatabaseService.searchCode(query) : await icd10DatabaseService.searchByDescription(query, limit); res.json({results, total_count: results.length});`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── index.ts (to be modified)
│   │   └── medicalCodingRoutes.ts (to be created)
│   ├── controllers/
│   │   └── medicalCodingController.ts (to be created)
│   ├── middleware/
│   │   └── authMiddleware.ts (may exist, to be verified/modified)
│   ├── types/
│   │   └── medicalCodingApi.types.ts (to be created)
│   └── services/
│       ├── medicalCodingService.ts (TASK_002)
│       └── icd10DatabaseService.ts (TASK_002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/medicalCodingApi.types.ts | API request/response TypeScript interfaces |
| CREATE | server/src/controllers/medicalCodingController.ts | Controller handlers for coding endpoints |
| CREATE | server/src/routes/medicalCodingRoutes.ts | Express routes for medical coding |
| MODIFY | server/src/routes/index.ts | Mount medical coding routes |
| MODIFY | server/src/middleware/authMiddleware.ts | Add staff role authorization |

## External References
- **Express Router**: https://expressjs.com/en/guide/routing.html - Route organization
- **Express Middleware**: https://expressjs.com/en/guide/using-middleware.html - Authorization
- **Zod Validation**: https://zod.dev/ - Request body validation
- **PostgreSQL JSONB Update**: https://www.postgresql.org/docs/15/functions-json.html - Update JSONB arrays
- **HTTP Status Codes**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status - Proper response codes

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start server with hot reload)
- Run tests: `npm test -- medicalCodingController.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] POST /api/appointments/:id/codes/generate returns AI suggestions
- [x] GET /api/appointments/:id/codes returns current coding status
- [x] PATCH /api/appointments/:id/codes/:codeIndex/approve updates database
- [x] PATCH /api/appointments/:id/codes/:codeIndex/reject removes code
- [x] PATCH /api/appointments/:id/codes/:codeIndex/modify changes code
- [x] POST /api/appointments/:id/codes/bulk-approve processes multiple codes
- [x] GET /api/codes/search returns matching ICD-10 codes
- [x] Authorization middleware blocks non-staff users (returns 403)
- [x] Validation rejects invalid appointment_id or codeIndex
- [x] Audit log records all actions with staff_id and rationale
- [x] coding_status updated correctly based on approval state
- [x] Error handling returns proper status codes with messages

## Implementation Checklist
- [ ] Create server/src/types/medicalCodingApi.types.ts (interfaces: GenerateCodesRequest/Response, ApproveCodeRequest, ModifyCodeRequest with new_code/rationale/staff_id, BulkApproveRequest, SearchCodesRequest with query/search_type/limit, SearchCodesResponse)
- [ ] Create server/src/controllers/medicalCodingController.ts file
- [ ] Implement generateCodes handler (validate appointment exists, fetch patient diagnoses from patient_profiles.extracted_data, call medicalCodingService.suggestCodes, update coding_status to 'AI Generated', cache suggestions, return 200 with GenerateCodesResponse)
- [ ] Implement getCodes handler (query appointments icd10_codes JSONB, coding_status, last_coded_at, fetch audit trail from medical_coding_audit, return 200)
- [ ] Implement approveCode handler (validate request with Zod, fetch icd10_codes array, update code at index with approved_by_staff_id/approved_at, INSERT INTO medical_coding_audit action='Approved', check if all approved set coding_status='Approved', return 200)
- [ ] Implement rejectCode handler (similar to approve but action='Rejected', remove from array or mark rejected=true, log to audit with rationale, return 200)
- [ ] Implement modifyCode handler (validate new_code with icd10Validator, check exists in database, update icd10_codes[index], INSERT audit action='Modified' with modified_to_code, return 200)
- [ ] Implement bulkApprove handler (filter codes confidence >= threshold default 95%, batch update icd10_codes approved_by_staff_id, INSERT multiple audit rows, update coding_status if all processed, return 200 with counts)
- [ ] Implement searchCodes handler (if search_type='code' call icd10DatabaseService.searchCode exact, if 'description' call searchByDescription fuzzy with limit, return 200 with SearchCodesResponse, paginate)
- [ ] Create server/src/routes/medicalCodingRoutes.ts (Express Router, routes: POST /appointments/:id/codes/generate, GET /appointments/:id/codes, PATCH /appointments/:id/codes/:codeIndex/approve, PATCH /:id/codes/:codeIndex/reject, PATCH /:id/codes/:codeIndex/modify, POST /:id/codes/bulk-approve, GET /codes/search, apply authMiddleware staff-only)
- [ ] Modify server/src/routes/index.ts (import medicalCodingRoutes, mount app.use('/api', medicalCodingRoutes))
- [ ] Add Zod validation schemas for request bodies (validate appointment_id numeric, codeIndex within bounds, staff_id exists, new_code format valid, search query non-empty)
- [ ] Add authorization in authMiddleware (verify user.role === 'staff' || user.role === 'admin', return 403 if patient)
- [ ] Add error handling to all controllers (try-catch, return 400 validation errors, 404 not found, 409 conflicts, 500 server errors with messages)
- [ ] Add JSDoc API documentation (comment each endpoint: @route, @description, @access Staff only, @param, @body, @returns)
- [ ] Write unit tests (test each handler, test authorization blocks, test validation, test database updates correct, test bulk approve, test search, test audit logging)
