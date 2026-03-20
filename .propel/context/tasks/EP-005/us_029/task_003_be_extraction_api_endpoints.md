# Task - TASK_003: Backend API Endpoints for Extraction Management

## Requirement Reference
- User Story: [us_029]
- Story Location: [.propel/context/tasks/us_029/us_029.md]
- Acceptance Criteria:
    - AC1: Staff can manually trigger extraction for uploaded documents
    - AC1: Staff can retrieve extracted data with confidence scores
    - AC1: Staff can review and approve/correct extracted data
    - AC1: System tracks who reviewed and approved extracted data
- Edge Case:
    - N/A (API layer)

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
| Backend | Zod | 3.x |
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
Create REST API endpoints for extraction management. POST /api/documents/:id/extract to manually trigger extraction (adds job to queue, returns 202 Accepted with job_id). GET /api/documents/:id/extracted-data to retrieve extracted data with confidence scores per field, extraction status, needs_manual_review flag, extraction logs history. PATCH /api/documents/:id/review to allow staff review and correction of extracted data: accepts corrected_data JSON, reviewed_by_staff_id, review_notes, validates with Zod schema, updates patient_profiles.extracted_data with corrected values, sets needs_manual_review=false, extraction_status='Processed', logs review action to extraction_logs. GET /api/documents/:id/extraction-logs to retrieve audit trail of all extraction attempts with timestamps, statuses, confidence scores. Add authorization middleware to ensure only staff roles can access these endpoints. Return proper HTTP status codes: 200 OK, 202 Accepted, 400 Bad Request, 404 Not Found, 500 Internal Server Error. Include error handling with descriptive messages.

## Dependent Tasks
- TASK_001: Database Migration (extraction fields)
- TASK_002: AI Extraction Service (queue and extraction logic)

## Impacted Components
- **CREATE** server/src/routes/extractionRoutes.ts - Express routes for extraction endpoints
- **CREATE** server/src/controllers/extractionController.ts - Endpoint handlers
- **MODIFY** server/src/routes/documentRoutes.ts - Add extraction routes
- **MODIFY** server/src/middleware/authMiddleware.ts - Ensure staff authorization
- **CREATE** server/src/types/extraction.types.ts - TypeScript interfaces for extraction data

## Implementation Plan
1. **Create extraction.types.ts**: Define interfaces ExtractedDataResponse = {document_id, patient_id, extraction_status, extraction_confidence, needs_manual_review, extracted_data (medical fields), extraction_completed_at, extracted_by}, ReviewRequest = {corrected_data, reviewed_by_staff_id, review_notes}, ExtractionLogEntry = {log_id, extraction_attempt, attempted_at, status, confidence_scores, error_message, processing_duration_ms}
2. **Create extractionController.ts**: Implement triggerExtraction handler: validate document exists and status is 'Uploaded' or 'Extraction Failed', call documentExtractionQueue.addExtractionJob(documentId), update status to 'Processing', return 202 with {message: 'Extraction started', job_id, document_id}
3. **Implement getExtractedData handler**: Query clinical_documents JOIN patient_profiles on source_document_id, return {document_id, patient_id, extraction_status, extraction_confidence, needs_manual_review, extracted_data from patient_profiles, extraction_completed_at, extraction_errors if any}, if not found return 404, include confidence_scores per field from extraction_logs
4. **Implement reviewExtractedData handler**: Validate request body with Zod (corrected_data must match ExtractedDataSchema, reviewed_by_staff_id required), verify staff has permission, update patient_profiles.extracted_data with corrected values using JSONB merge, set clinical_documents needs_manual_review=false, extraction_status='Processed', log review action to extraction_logs with status='Manually Reviewed', reviewed_by_staff_id, review_notes, return 200 with updated extracted_data
5. **Implement getExtractionLogs handler**: Query extraction_logs WHERE document_id ORDER BY attempted_at DESC, return array of log entries with all details (attempt number, status, confidence scores, error messages, processing durations), paginate if >50 logs
6. **Create extractionRoutes.ts**: Setup Express router, define routes: POST /:id/extract (triggerExtraction), GET /:id/extracted-data (getExtractedData), PATCH /:id/review (reviewExtractedData), GET /:id/extraction-logs (getExtractionLogs), apply authMiddleware to ensure authenticated staff only, validate :id parameter is numeric
7. **Modify documentRoutes.ts**: Import and mount extractionRoutes under /api/documents path
8. **Add input validation**: Use Zod schemas to validate request bodies for review endpoint, ensure corrected_data fields match expected types, validate reviewed_by_staff_id exists in users table
9. **Add authorization checks**: In authMiddleware, verify user role is 'staff' or 'admin' for all extraction routes, return 403 Forbidden if patient user tries to access
10. **Error handling**: Wrap all handlers in try-catch, return appropriate status codes with error messages: 400 for validation errors, 404 for document not found, 409 for invalid state transitions (e.g., cannot extract document already processing), 500 for server errors
11. **Add API documentation**: Comment each endpoint with @route, @description, @access (Staff only), @param, @returns, @example
12. **Testing**: Write unit tests for each controller handler, test authorization middleware blocks unauthorized users, test validation rejects invalid data, test review updates database correctly

**Focus on how to implement**: Express route: `router.post('/:id/extract', authMiddleware, extractionController.triggerExtraction)`. Controller: `export const triggerExtraction = async (req: Request, res: Response) => { const {id} = req.params; const document = await db.query('SELECT * FROM clinical_documents WHERE document_id=$1', [id]); if (!document) return res.status(404).json({error: 'Document not found'}); if (document.extraction_status === 'Processing') return res.status(409).json({error: 'Extraction already in progress'}); const jobId = await documentExtractionQueue.addExtractionJob(id); await db.query('UPDATE clinical_documents SET extraction_status=$1 WHERE document_id=$2', ['Processing', id]); res.status(202).json({message: 'Extraction started', job_id: jobId, document_id: id}); }`. Review endpoint: `export const reviewExtractedData = async (req: Request, res: Response) => { const {id} = req.params; const {corrected_data, reviewed_by_staff_id, review_notes} = req.body; const validated = ExtractedDataSchema.parse(corrected_data); await db.query('UPDATE patient_profiles SET extracted_data=$1 WHERE source_document_id=$2', [JSON.stringify(validated), id]); await db.query('UPDATE clinical_documents SET needs_manual_review=false, extraction_status=$1 WHERE document_id=$2', ['Processed', id]); await db.query('INSERT INTO extraction_logs (document_id, status, ...) VALUES ($1, $2, ...)', [id, 'Manually Reviewed']); res.json({message: 'Review saved', extracted_data: validated}); }`. Authorization: `if (req.user.role !== 'staff' && req.user.role !== 'admin') return res.status(403).json({error: 'Forbidden: Staff access required'})`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── documentRoutes.ts (TASK_001 US_028, to be modified)
│   │   └── extractionRoutes.ts (to be created)
│   ├── controllers/
│   │   ├── documentController.ts (TASK_002 US_029)
│   │   └── extractionController.ts (to be created)
│   ├── middleware/
│   │   └── authMiddleware.ts (may exist, to be verified/modified)
│   ├── types/
│   │   └── extraction.types.ts (to be created)
│   └── queues/
│       └── documentExtractionQueue.ts (TASK_002 US_029)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/extraction.types.ts | TypeScript interfaces for extraction API requests/responses |
| CREATE | server/src/controllers/extractionController.ts | Controller handlers for extraction endpoints |
| CREATE | server/src/routes/extractionRoutes.ts | Express routes for extraction management |
| MODIFY | server/src/routes/documentRoutes.ts | Mount extraction routes under /api/documents |
| MODIFY | server/src/middleware/authMiddleware.ts | Add staff role authorization checks |

## External References
- **Express Router**: https://expressjs.com/en/guide/routing.html - Route organization
- **Express Middleware**: https://expressjs.com/en/guide/using-middleware.html - Authorization
- **Zod Validation**: https://zod.dev/ - Request body validation
- **PostgreSQL JSONB Operations**: https://www.postgresql.org/docs/15/functions-json.html - Update extracted_data
- **HTTP Status Codes**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status - Proper response codes

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start server with hot reload)
- Run tests: `npm test -- extractionController.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] POST /api/documents/:id/extract returns 202 and starts extraction job
- [x] POST /api/documents/:id/extract returns 409 if already processing
- [x] GET /api/documents/:id/extracted-data returns extracted data with confidence scores
- [x] GET /api/documents/:id/extracted-data returns 404 for non-existent document
- [x] PATCH /api/documents/:id/review accepts corrected data and updates database
- [x] PATCH /api/documents/:id/review validates data with Zod schema
- [x] PATCH /api/documents/:id/review sets needs_manual_review=false
- [x] GET /api/documents/:id/extraction-logs returns audit trail
- [x] Authorization middleware blocks non-staff users (returns 403)
- [x] Invalid data returns 400 with validation errors
- [x] Server errors return 500 with error message
- [x] API responses include proper Content-Type: application/json

## Implementation Checklist
- [ ] Create server/src/types/extraction.types.ts with interfaces (ExtractedDataResponse, ReviewRequest, ExtractionLogEntry with all fields and types)
- [ ] Create server/src/controllers/extractionController.ts file
- [ ] Implement triggerExtraction handler (validate document exists, check status not already Processing, add job to queue, update status to Processing, return 202 with job_id)
- [ ] Implement getExtractedData handler (query clinical_documents JOIN patient_profiles, return extraction_status, confidence, needs_manual_review, extracted_data, extraction_completed_at, handle 404 if not found)
- [ ] Implement reviewExtractedData handler (validate request body with Zod, check staff authorization, update patient_profiles.extracted_data, set needs_manual_review=false, log to extraction_logs, return 200 with updated data)
- [ ] Implement getExtractionLogs handler (query extraction_logs WHERE document_id ORDER BY attempted_at DESC, return array of logs, paginate if >50 entries)
- [ ] Create server/src/routes/extractionRoutes.ts (setup Express Router, define POST /:id/extract, GET /:id/extracted-data, PATCH /:id/review, GET /:id/extraction-logs)
- [ ] Apply authMiddleware to all extraction routes (ensure authenticated staff only, return 403 if unauthorized)
- [ ] Modify server/src/routes/documentRoutes.ts to mount extractionRoutes (app.use('/api/documents', extractionRoutes))
- [ ] Add input validation with Zod schemas for reviewExtractedData endpoint (validate corrected_data matches ExtractedDataSchema, reviewed_by_staff_id is number, review_notes is string)
- [ ] Add error handling to all controllers (try-catch blocks, return 400 for validation errors, 404 for not found, 409 for conflicts, 500 for server errors with descriptive messages)
- [ ] Add API documentation comments (JSDoc @route, @description, @access, @param, @returns for each endpoint)
