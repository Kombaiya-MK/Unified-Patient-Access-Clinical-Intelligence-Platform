# Task - TASK_001: Backend Patient Search API

## Requirement Reference
- User Story: [us_023]
- Story Location: [.propel/context/tasks/us_023/us_023.md]
- Acceptance Criteria:
    - AC1: Search for patient by phone/email/name, select from results, book appointment with staff override options
- Edge Case:
    - EC1: Patient doesn't exist in system - Display "Patient not found" with "Register New Patient" button

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | UXR-501 (Inline validation - for search input) |
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
Create GET /api/staff/patients/search endpoint that accepts query parameters (phone, email, name) and returns matching patient records. Implement fuzzy name matching with ILIKE, phone number normalization (remove hyphens/spaces/parentheses before comparison), and email exact match. Limit results to 10 patients maximum. Require staff authentication with role='staff' or role='admin'. Return patient summary fields (id, first_name, last_name, date_of_birth, phone, email, last_visit_date) for selection in booking interface.

## Dependent Tasks
- US-007: Patients table schema (depends on existing patients table)
- NONE (first task for US_023, establishes search capability)

## Impacted Components
- **CREATE** server/src/routes/staffPatientRoutes.ts - New route file for staff patient operations
- **CREATE** server/src/controllers/staffPatientController.ts - Patient search controller with searchPatients() method
- **CREATE** server/src/services/patientSearchService.ts - Search logic with fuzzy matching and phone normalization
- **MODIFY** server/src/app.ts - Register staffPatientRoutes
- **CREATE** server/src/types/patientSearch.types.ts - PatientSearchQuery, PatientSearchResult interfaces

## Implementation Plan
1. **Create patientSearch.types.ts**: Define PatientSearchQuery interface (phone?: string, email?: string, name?: string), PatientSearchResult interface (id, first_name, last_name, date_of_birth, phone, email, last_visit_date)
2. **Create patientSearchService.ts**: Implement searchPatients(query) function with SQL query builder - if name provided use ILIKE '%name%' on first_name OR last_name, if phone normalize and compare (REPLACE all non-digits), if email use exact match LOWER(email), combine filters with OR logic, ORDER BY last_name ASC, LIMIT 10
3. **Create staffPatientController.ts**: Create searchPatients() controller that validates query params (at least one of phone/email/name required), calls patientSearchService, returns 200 with results array (or empty array if no matches), handles 400 for missing params
4. **Create staffPatientRoutes.ts**: Define GET /search route with authenticate middleware and requireRole('staff', 'admin') middleware, maps to staffPatientController.searchPatients
5. **Modify app.ts**: Import staffPatientRoutes, register as app.use('/api/staff/patients', staffPatientRoutes)
6. **Add Phone Normalization**: Create normalizePhone(phone) utility function in server/src/utils/phoneUtils.ts - removes all non-digit characters (hyphens, spaces, parentheses, plus), returns digits only for comparison
7. **Add Input Validation**: Validate name min 2 characters, phone min 10 digits after normalization, email valid format (use validator.isEmail), return 400 "At least one search parameter required" if all empty
8. **Add Security**: Ensure staff can only search within their organization (add org_id filter if multi-tenant), log search queries to audit log (optional but recommended)

**Focus on how to implement**: SQL query uses dynamic WHERE clause building based on provided params. Phone normalization SQL: `REGEXP_REPLACE(phone, '[^0-9]', '', 'g')` (PostgreSQL regex). Name fuzzy match uses ILIKE with '%' wildcards for substring search. Empty results return [] with 200 status (not 404). Controller uses express-validator for input sanitization. Response includes last_visit_date from LEFT JOIN to appointments table with MAX(appointment_datetime).

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── appointmentRoutes.ts (US_013)
│   │   ├── queueRoutes.ts (US_020)
│   │   └── (staffPatientRoutes.ts to be created)
│   ├── controllers/
│   │   ├── appointmentController.ts (US_013)
│   │   ├── queueController.ts (US_020)
│   │   └── (staffPatientController.ts to be created)
│   ├── services/
│   │   ├── appointmentService.ts (US_013)
│   │   ├── queueService.ts (US_020)
│   │   └── (patientSearchService.ts to be created)
│   ├── middleware/
│   │   ├── authenticate.ts (auth middleware)
│   │   └── requireRole.ts (role-based access control)
│   ├── types/
│   │   └── (patientSearch.types.ts to be created)
│   ├── utils/
│   │   └── (phoneUtils.ts to be created)
│   └── app.ts (main Express app, to be modified)
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/patientSearch.types.ts | PatientSearchQuery, PatientSearchResult interfaces with patient summary fields |
| CREATE | server/src/services/patientSearchService.ts | Search logic with fuzzy name matching, phone normalization, email exact match, LIMIT 10 |
| CREATE | server/src/controllers/staffPatientController.ts | searchPatients() controller with input validation and 200/400 responses |
| CREATE | server/src/routes/staffPatientRoutes.ts | GET /search route with staff authentication middleware |
| CREATE | server/src/utils/phoneUtils.ts | normalizePhone() utility for stripping non-digit characters |
| MODIFY | server/src/app.ts | Register /api/staff/patients routes |

## External References
- **PostgreSQL Text Search**: https://www.postgresql.org/docs/15/functions-matching.html - ILIKE and pattern matching
- **Phone Number Normalization**: https://www.twilio.com/docs/glossary/what-e164 - E.164 format normalization
- **Express Validator**: https://express-validator.github.io/docs/ - Input validation and sanitization
- **PostgreSQL REGEXP_REPLACE**: https://www.postgresql.org/docs/15/functions-string.html - Regex string replacement for phone normalization
- **SQL Injection Prevention**: https://node-postgres.com/features/queries - Parameterized queries with pg library

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon hot reload)
- Run tests: `npm test` (execute unit tests for patient search service)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for patientSearchService (test fuzzy name match, phone normalization, empty results)
- [x] Integration test: POST /api/staff/patients/search with name="John" returns matching patients
- [x] Integration test: Search with phone="(555) 123-4567" matches normalized "5551234567" in DB
- [x] Integration test: Email search is case-insensitive
- [x] Integration test: Empty query params return 400 "At least one search parameter required"
- [x] Integration test: Non-staff user receives 403 Forbidden
- [x] Load test: Search endpoint handles 100 concurrent requests within 500ms p95 latency
- [x] Security test: SQL injection attempts in name parameter are sanitized

## Implementation Checklist
- [ ] Create patientSearch.types.ts (interfaces: PatientSearchQuery with phone?: string, email?: string, name?: string; PatientSearchResult with id, first_name, last_name, date_of_birth, phone, email, last_visit_date)
- [ ] Create phoneUtils.ts (normalizePhone function: input.replace(/[^0-9]/g, '') to strip all non-digit characters)
- [ ] Create patientSearchService.ts (searchPatients function: build dynamic SQL WHERE with ILIKE for name, REGEXP_REPLACE for phone, LOWER for email, LEFT JOIN appointments for last_visit_date, ORDER BY last_name, LIMIT 10, use parameterized query with pg)
- [ ] Create staffPatientController.ts (searchPatients handler: validate at least one param exists using express-validator, call patientSearchService, return res.status(200).json({ patients: results }), handle 400 for validation errors)
- [ ] Create staffPatientRoutes.ts (express.Router(), GET /search with authenticate and requireRole('staff', 'admin') middleware, route to staffPatientController.searchPatients)
- [ ] Modify app.ts (import staffPatientRoutes, add app.use('/api/staff/patients', staffPatientRoutes) after existing routes)
- [ ] Add input validation rules (name: min 2 chars, phone: min 10 digits after normalization, email: valid format, at least one param required)
- [ ] Add audit logging (optional: log search queries with staff_id, search_params, result_count, timestamp to audit_log table for compliance)
