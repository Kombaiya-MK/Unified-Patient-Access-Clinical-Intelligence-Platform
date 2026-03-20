# Task - TASK_001: Backend Draft Auto-Save and Submission API

## Requirement Reference
- User Story: [us_026]
- Story Location: [.propel/context/tasks/us_026/us_026.md]
- Acceptance Criteria:
    - AC1: Form saves draft automatically every 30 seconds to prevent data loss
    - AC1: Submit intake validates all required fields, saves to ClinicalDocuments table
- Edge Case:
    - EC2: Required fields enforced, prevent submission if incomplete

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | UXR-003 (Draft auto-save for error recovery) |
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
Create REST API endpoints for manual intake form management. POST /api/intake/manual/draft auto-saves partial form data to temporary drafts table or clinical_documents with status='draft', returns draft_id and last_saved timestamp. PUT /api/intake/manual/draft/:id updates existing draft with new field values (partial updates allowed). POST /api/intake/manual/submit validates all required fields (chief_complaint, contact_info, emergency_contact required), updates clinical_documents status='completed' and intake_mode='manual', triggers staff notification. GET /api/intake/manual/draft/:appointmentId retrieves latest draft for patient's appointment. DELETE /api/intake/manual/draft/:id removes draft after successful submission or 30-day retention.

## Dependent Tasks
- US-007: ClinicalDocuments table schema
- US-025 TASK_002: Backend AI intake API (for hybrid mode handling)

## Impacted Components
- **CREATE** database/migrations/V019__add_intake_drafts.sql - Add draft-related columns or create intake_drafts table
- **CREATE** server/src/routes/manualIntakeRoutes.ts - Manual intake REST endpoints
- **CREATE** server/src/controllers/manualIntakeController.ts - saveDraft(), updateDraft(), submitIntake(), getDraft() controllers
- **CREATE** server/src/services/manualIntakeService.ts - Business logic for draft management and validation
- **MODIFY** server/src/services/notificationService.ts - Reuse notifyStaffIntakeComplete() from US_025
- **CREATE** server/src/types/manualIntake.types.ts - IntakeFormData, DraftRequest, DraftResponse interfaces
- **MODIFY** server/src/app.ts - Register manualIntakeRoutes

## Implementation Plan
1. **Create V019__add_intake_drafts.sql**: Option A: ALTER TABLE clinical_documents ADD COLUMN status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'archived')), ADD COLUMN draft_data JSONB (for partial data), ADD COLUMN last_saved_at TIMESTAMP; OR Option B: CREATE TABLE intake_drafts (id UUID PRIMARY KEY, appointment_id UUID FK, patient_id UUID FK, form_data JSONB, intake_mode VARCHAR(20), last_saved_at TIMESTAMP, created_at, updated_at) - use Option A for simplicity
2. **Create manualIntake.types.ts**: Define IntakeFormData interface with all form fields (chief_complaint, symptom_description, symptom_onset_date, pain_level 1-10, medical_history, current_medications array, allergies array, previous_surgeries, family_history, emergency_contact_name, emergency_contact_phone), DraftRequest (appointment_id, form_data: Partial<IntakeFormData>), DraftResponse (draft_id, last_saved_at, status), SubmitIntakeRequest (appointment_id, form_data: IntakeFormData)
3. **Create manualIntakeService.ts**: Implement saveDraft(appointmentId, formData) - UPSERT INTO clinical_documents (UPDATE if draft exists, INSERT if new) SET draft_data = formData, status='draft', last_saved_at=NOW(), intake_mode='manual', return draft_id + timestamp
4. **Create manualIntakeService.ts validation**: Implement validateRequiredFields(formData) - check chief_complaint (min 10 chars), emergency_contact_name, emergency_contact_phone (valid format), return validation errors array or null if valid
5. **Create manualIntakeService.ts submission**: Implement submitIntake(appointmentId, formData) - call validateRequiredFields, if valid UPDATE clinical_documents SET status='completed', final_data=formData, submitted_at=NOW(), call notificationService.notifyStaffIntakeComplete, return document_id, if invalid return 422 with validation errors
6. **Create manualIntakeController.ts**: Implement saveDraft(req, res) - extract appointmentId from req.body or req.user, call manualIntakeService.saveDraft, return 200 with DraftResponse {draft_id, last_saved_at, status: 'draft'}; updateDraft(req, res) - similar to save but uses PUT; submitIntake(req, res) - validate body with express-validator, call service.submitIntake, return 201, handle 422 validation errors; getDraft(req, res) - SELECT from clinical_documents WHERE appointment_id AND status='draft', return draft_data
7. **Create manualIntakeRoutes.ts**: Define POST /draft (auto-save endpoint), PUT /draft/:id (update draft), POST /submit (final submission), GET /draft/:appointmentId (retrieve draft), DELETE /draft/:id (cleanup), all with authenticate middleware
8. **Add Draft Cleanup**: Optional scheduled job to DELETE drafts WHERE status='draft' AND last_saved_at < NOW() - INTERVAL '30 days' for data retention

**Focus on how to implement**: UPSERT pattern in PostgreSQL: `INSERT INTO clinical_documents (...) VALUES (...) ON CONFLICT (appointment_id, patient_id) DO UPDATE SET draft_data = EXCLUDED.draft_data, last_saved_at = NOW()`. Partial updates accept `Partial<IntakeFormData>` TypeScript type allowing any subset of fields. Validation uses express-validator for email/phone formats. Required fields check: `if (!formData.chief_complaint || formData.chief_complaint.length < 10) errors.push('Chief complaint required (min 10 chars)')`. Status column distinguishes drafts from completed intakes. Auto-save endpoint idempotent (can be called repeatedly without duplicates). Last_saved_at timestamp returned to frontend for "Draft saved at 2:35 PM" display.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── aiIntakeRoutes.ts (US_025 TASK_002)
│   │   └── (manualIntakeRoutes.ts to be created)
│   ├── controllers/
│   │   └── (manualIntakeController.ts to be created)
│   ├── services/
│   │   ├── notificationService.ts (US_025 TASK_002, reuse)
│   │   └── (manualIntakeService.ts to be created)
│   ├── types/
│   │   └── (manualIntake.types.ts to be created)
│   └── app.ts (to be modified)
database/
└── migrations/
    ├── V017__add_conversation_history.sql (US_025)
    └── (V019__add_intake_drafts.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V019__add_intake_drafts.sql | Add status, draft_data JSONB, last_saved_at columns to clinical_documents table |
| CREATE | server/src/types/manualIntake.types.ts | IntakeFormData, DraftRequest, DraftResponse, SubmitIntakeRequest interfaces |
| CREATE | server/src/services/manualIntakeService.ts | saveDraft(), validateRequiredFields(), submitIntake() with UPSERT logic |
| CREATE | server/src/controllers/manualIntakeController.ts | saveDraft(), updateDraft(), submitIntake(), getDraft(), deleteDraft() handlers |
| CREATE | server/src/routes/manualIntakeRoutes.ts | POST /draft, PUT /draft/:id, POST /submit, GET /draft/:appointmentId, DELETE /draft/:id routes |
| MODIFY | server/src/app.ts | Register /api/intake/manual routes |

## External References
- **PostgreSQL UPSERT**: https://www.postgresql.org/docs/15/sql-insert.html#SQL-ON-CONFLICT - INSERT ... ON CONFLICT DO UPDATE
- **Express Validator**: https://express-validator.github.io/docs/ - Field validation rules
- **JSONB Storage**: https://www.postgresql.org/docs/15/datatype-json.html - Store partial form data
- **Phone Validation**: https://www.npmjs.com/package/libphonenumber-js - Phone number format validation
- **Draft Pattern**: https://en.wikipedia.org/wiki/Draft_(writing) - Auto-save UX patterns

## Build Commands
- Run migration: `.\database\scripts\run_migrations.ps1` (applies V019)
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (integration tests for draft auto-save)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Migration V019 runs successfully, clinical_documents has status/draft_data columns
- [x] Integration test: POST /api/intake/manual/draft saves partial data, returns draft_id
- [x] Integration test: Multiple draft saves update same record (no duplicates)
- [x] Integration test: GET /api/intake/manual/draft/:appointmentId retrieves latest draft
- [x] Integration test: POST /api/intake/manual/submit with incomplete data returns 422 validation errors
- [x] Integration test: POST /api/intake/manual/submit with valid data saves and notifies staff
- [x] Integration test: Draft auto-save within 30 seconds doesn't create duplicate rows
- [x] Load test: 100 concurrent draft saves complete within 1s

## Implementation Checklist
- [ ] Create V019__add_intake_drafts.sql migration (ALTER TABLE clinical_documents ADD status VARCHAR(20) DEFAULT 'completed' CHECK IN ('draft', 'completed', 'archived'), ADD draft_data JSONB NULL, ADD last_saved_at TIMESTAMP NULL, ADD UNIQUE constraint on (appointment_id, patient_id) IF NOT EXISTS)
- [ ] Run migration using .\database\scripts\run_migrations.ps1
- [ ] Create manualIntake.types.ts (export IntakeFormData interface with chief_complaint, symptom_description, symptom_onset_date, pain_level, medical_history, current_medications string[], allergies string[], previous_surgeries, family_history, emergency_contact_name, emergency_contact_phone; DraftRequest with appointment_id and form_data Partial<IntakeFormData>; DraftResponse with draft_id, last_saved_at, status; SubmitIntakeRequest with appointment_id and form_data IntakeFormData)
- [ ] Create manualIntakeService.ts saveDraft method (INSERT INTO clinical_documents ... ON CONFLICT (appointment_id, patient_id) DO UPDATE SET draft_data = ?, last_saved_at = NOW(), status = 'draft', intake_mode = 'manual', return {draft_id, last_saved_at})
- [ ] Create manualIntakeService.ts validateRequiredFields function (check chief_complaint min 10 chars, emergency_contact_name exists, emergency_contact_phone valid format using libphonenumber-js, return errors array or null)
- [ ] Create manualIntakeService.ts submitIntake method (call validateRequiredFields, if valid: UPDATE clinical_documents SET status='completed', final_data=form_data, submitted_at=NOW() WHERE appointment_id, call notificationService.notifyStaffIntakeComplete, return document_id; if invalid: return validation errors)
- [ ] Create manualIntakeController.ts with handlers (saveDraft: extract appointmentId and form_data from body, call service.saveDraft, res.status(200).json(response); submitIntake: validate request body, call service.submitIntake, handle 422 errors; getDraft: query by appointmentId, return draft_data; deleteDraft: DELETE WHERE id=)
- [ ] Create manualIntakeRoutes.ts (express.Router(), POST /draft with authenticate, PUT /draft/:id with authenticate, POST /submit with authenticate, GET /draft/:appointmentId with authenticate, DELETE /draft/:id with authenticate)
- [ ] Modify app.ts (import manualIntakeRoutes, app.use('/api/intake/manual', manualIntakeRoutes))
