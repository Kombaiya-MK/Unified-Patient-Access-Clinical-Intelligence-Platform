# Task - task_003_be_server_side_validation_middleware

## Requirement Reference
- User Story: US_047 - Inline Form Validation and Error Handling
- Story Location: .propel/context/tasks/us_047/us_047.md
- Acceptance Criteria:
    - System validates all form submissions on server-side before processing
    - System provides standardized validation error responses for client consumption
    - System implements async validation endpoints (username availability, insurance eligibility)
    - System rate limits async validation endpoints to prevent abuse (max 10 requests/minute per IP)
    - System validates common field types server-side: Email, Phone, Date, Required fields, Custom validations
- Edge Cases:
    - How are network errors during async validation handled? (Return 503 Service Unavailable with retry-after header)
    - What happens when validation rules change during session? (Server-side validation always takes precedence, version validation schemas)

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
| Frontend | N/A | N/A |
| Backend | Node.js (Express) | 20.x LTS |
| Library | Zod | 3.x |
| Library | express-rate-limit | 7.x |
| Database | PostgreSQL | 15.x |
| AI/ML | N/A | N/A |

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
Implement server-side validation middleware using Zod schemas for all form endpoints (login, appointment booking, intake, document upload, admin user management) to prevent invalid data from reaching business logic. Create async validation endpoints for username availability and insurance eligibility checks with rate limiting. Standardize validation error response format for consistent client-side error display.

**Purpose**: Establish robust server-side validation layer that acts as final gatekeeper before data persistence, preventing malicious or malformed data from entering the system.

**Capabilities**:
- Zod schema validation for all form DTOs (Login, AppointmentBooking, PatientIntake, DocumentUpload, UserManagement)
- Validation middleware that intercepts requests before controller logic
- Standardized validation error response format: `{success: false, errors: [{field: string, message: string, code: string}]}`
- Async validation endpoints:
  - `GET /api/users/check-username?username=X` (check username availability)
  - `POST /api/insurance/check-eligibility` (verify insurance eligibility)
- Rate limiting for async validation endpoints (max 10 requests/minute per IP)
- Validation error logging for monitoring frequent validation failures
- Server-side validation mirrors client-side rules (email, phone, date, required, custom formats)

## Dependent Tasks
- None (backend validation is independent of frontend tasks, but should mirror validation rules)

## Impacted Components
- **CREATE**: server/src/middleware/validation.middleware.ts (Zod schema validation middleware)
- **CREATE**: server/src/schemas/loginDTO.schema.ts (Zod schema for login request)
- **CREATE**: server/src/schemas/appointmentBookingDTO.schema.ts (Zod schema for appointment booking)
- **CREATE**: server/src/schemas/patientIntakeDTO.schema.ts (Zod schema for patient intake)
- **CREATE**: server/src/schemas/documentUploadDTO.schema.ts (Zod schema for document upload metadata)
- **CREATE**: server/src/schemas/userManagementDTO.schema.ts (Zod schema for admin user creation/update)
- **CREATE**: server/src/controllers/validationController.ts (async validation endpoints)
- **CREATE**: server/src/middleware/rateLimiter.middleware.ts (rate limiting for validation endpoints)
- **MODIFY**: server/src/routes/auth.routes.ts (add validation middleware to login/register routes)
- **MODIFY**: server/src/routes/appointment.routes.ts (add validation middleware to booking routes)
- **MODIFY**: server/src/routes/user.routes.ts (add validation middleware to user management routes)
- **CREATE**: server/src/utils/validationErrorLogger.ts (log validation failures for monitoring)

## Implementation Plan

### Phase 1: Validation Middleware & Error Format (2 hours)
1. **Create validation.middleware.ts**:
   - Accept Zod schema as parameter: `validateRequest(schema: z.ZodSchema)`
   - Middleware function: `(req, res, next) => { ... }`
   - Validate `req.body` against schema: `schema.safeParse(req.body)`
   - On validation failure:
     - Extract field-level errors from Zod error object
     - Format as: `{success: false, errors: [{field: string, message: string, code: string}]}`
     - Return HTTP 400 Bad Request with error payload
   - On validation success: Call `next()` to proceed to controller

2. **Standardized validation error response format**:
   - Schema: `ValidationErrorResponse = {success: false, errors: ValidationError[]}`
   - ValidationError: `{field: string, message: string, code: string}`
   - Example:
     ```json
     {
       "success": false,
       "errors": [
         {"field": "email", "message": "Email must include @ and domain", "code": "INVALID_EMAIL"},
         {"field": "phone", "message": "Phone must be 10 digits", "code": "INVALID_PHONE"}
       ]
     }
     ```
   - Error codes: REQUIRED_FIELD, INVALID_EMAIL, INVALID_PHONE, INVALID_DATE, CUSTOM_FORMAT_ERROR, etc.

### Phase 2: Zod DTO Schemas (2.5 hours)
3. **Create loginDTO.schema.ts**:
   - Zod schema: `LoginDTOSchema = z.object({ email: z.string().email().max(255), password: z.string().min(8).max(128), rememberMe: z.boolean().optional() })`
   - Mirror frontend validation rules from validators.ts

4. **Create appointmentBookingDTO.schema.ts**:
   - Fields: patientId (UUID), staffId (UUID), timeslotId (UUID), appointmentDate (ISO 8601 date), reason (string, max 200 chars)
   - Zod schema: `AppointmentBookingDTOSchema = z.object({ ... })`
   - Date validation: Must be future date, not more than 90 days in advance

5. **Create patientIntakeDTO.schema.ts**:
   - Fields: patientId (UUID), firstName, lastName, dob (date), phone, email, medications (array), allergies (array)
   - Zod schema: `PatientIntakeDTOSchema = z.object({ ... })`
   - DOB validation: Must be past date, age >= 18 years
   - Phone validation: US format (XXX) XXX-XXXX or international

6. **Create documentUploadDTO.schema.ts**:
   - Fields: patientId (UUID), documentType (enum: INSURANCE_CARD, LAB_REPORT, PRESCRIPTION, OTHER), fileName, fileSize (max 10MB)
   - Zod schema: `DocumentUploadDTOSchema = z.object({ ... })`
   - File size validation: Max 10MB (10 * 1024 * 1024 bytes)

7. **Create userManagementDTO.schema.ts**:
   - Fields: email, firstName, lastName, role (enum: PATIENT, STAFF, ADMIN), active (boolean)
   - Zod schema: `UserManagementDTOSchema = z.object({ ... })`
   - Email validation: Must be unique (check in database), valid email format

### Phase 3: Async Validation Endpoints (1.5 hours)
8. **Create validationController.ts**:
   - Endpoint 1: `GET /api/users/check-username?username=X`
     - Query database: `SELECT 1 FROM users WHERE username = ? LIMIT 1`
     - Response: `{available: boolean}` (available: false if username exists)
     - Rate limit: 10 requests/minute per IP
   - Endpoint 2: `POST /api/insurance/check-eligibility`
     - Body: `{memberId: string, provider: string}`
     - Query internal dummy insurance records (CSV/JSON file)
     - Response: `{eligible: boolean, reason?: string}` (reason if ineligible)
     - Rate limit: 10 requests/minute per IP

9. **Create rateLimiter.middleware.ts**:
   - Use express-rate-limit library
   - Config: `max: 10 requests, windowMs: 60 * 1000 (1 minute), keyGenerator: (req) => req.ip`
   - On rate limit exceeded: Return HTTP 429 Too Many Requests with `Retry-After` header
   - Error response: `{success: false, message: "Too many requests, please try again later", retryAfter: 60}`

### Phase 4: Integrate Validation Middleware (1 hour)
10. **Modify route files to add validation middleware**:
    - auth.routes.ts: Add `validateRequest(LoginDTOSchema)` to POST /api/auth/login
    - appointment.routes.ts: Add `validateRequest(AppointmentBookingDTOSchema)` to POST /api/appointments
    - user.routes.ts: Add `validateRequest(UserManagementDTOSchema)` to POST /api/users and PUT /api/users/:id
    - Example route: `router.post('/api/auth/login', validateRequest(LoginDTOSchema), authController.login)`

### Phase 5: Validation Error Logging & Monitoring (1 hour)
11. **Create validationErrorLogger.ts**:
    - Log validation failures to file: `logs/validation-errors.log`
    - Log format: `[timestamp] [IP] [endpoint] [field] [errorCode] [errorMessage]`
    - Use Winston logger for structured logging
    - Monitor frequent validation errors (e.g., if >50 failures/hour on specific field, alert devs)
    - Implement log rotation: Daily log files, keep last 30 days

12. **Add validation error tracking**:
    - Track validation failure metrics: Count failures per endpoint, per field
    - Export metrics to Prometheus (optional, for monitoring dashboard)
    - Grafana dashboard query: `rate(validation_errors_total[5m])` to track validation error rate

## Current Project State
```
server/
  src/
    controllers/
      authController.ts (existing)
      appointmentController.ts (existing)
      userController.ts (existing)
    middleware/
      (NEW - validation.middleware.ts, rateLimiter.middleware.ts)
    routes/
      auth.routes.ts (MODIFY - add validation middleware)
      appointment.routes.ts (MODIFY - add validation middleware)
      user.routes.ts (MODIFY - add validation middleware)
    schemas/
      (NEW - loginDTO.schema.ts, appointmentBookingDTO.schema.ts, patientIntakeDTO.schema.ts, documentUploadDTO.schema.ts, userManagementDTO.schema.ts)
    utils/
      (NEW - validationErrorLogger.ts)
  logs/
    validation-errors.log (NEW - created by logger)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/middleware/validation.middleware.ts | Zod schema validation middleware with standardized error format |
| CREATE | server/src/schemas/loginDTO.schema.ts | Zod schema for login request validation (email, password, rememberMe) |
| CREATE | server/src/schemas/appointmentBookingDTO.schema.ts | Zod schema for appointment booking validation (patientId, staffId, timeslotId, date, reason) |
| CREATE | server/src/schemas/patientIntakeDTO.schema.ts | Zod schema for patient intake validation (name, DOB, phone, email, medications, allergies) |
| CREATE | server/src/schemas/documentUploadDTO.schema.ts | Zod schema for document upload metadata validation (patientId, type, fileName, fileSize max 10MB) |
| CREATE | server/src/schemas/userManagementDTO.schema.ts | Zod schema for user creation/update validation (email unique, role enum, active boolean) |
| CREATE | server/src/controllers/validationController.ts | Async validation endpoints (username availability, insurance eligibility) |
| CREATE | server/src/middleware/rateLimiter.middleware.ts | Rate limiting middleware for async validation endpoints (max 10 req/min per IP) |
| MODIFY | server/src/routes/auth.routes.ts | Add validateRequest(LoginDTOSchema) middleware to POST /api/auth/login |
| MODIFY | server/src/routes/appointment.routes.ts | Add validateRequest(AppointmentBookingDTOSchema) middleware to POST /api/appointments |
| MODIFY | server/src/routes/user.routes.ts | Add validateRequest(UserManagementDTOSchema) middleware to POST/PUT /api/users |
| CREATE | server/src/utils/validationErrorLogger.ts | Validation error logging utility with Winston (log to file, daily rotation, 30-day retention) |

## External References
- **Zod Documentation**: https://zod.dev/ (Schema validation library)
- **Express Validation Middleware Pattern**: https://express-validator.github.io/docs/ (Validation middleware best practices)
- **express-rate-limit**: https://www.npmjs.com/package/express-rate-limit (Rate limiting for API endpoints)
- **Winston Logger**: https://github.com/winstonjs/winston (Structured logging for validation errors)
- **HTTP Status Codes**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status (400 Bad Request, 429 Too Many Requests)
- **Zod Error Handling**: https://zod.dev/ERROR_HANDLING (Extract field-level errors from Zod validation failures)

## Build Commands
```bash
# Install dependencies
cd server
npm install zod express-rate-limit winston

# Start dev server
npm run dev

# Run tests
npm run test

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm run start
```

## Implementation Validation Strategy
- [x] Unit tests pass (test each Zod schema with valid/invalid inputs)
- [x] Integration tests pass (test validation middleware in Express routes)
- [x] Manual API testing: Send invalid payloads to endpoints, verify 400 Bad Request with standardized error format
- [x] Async validation testing: Test username availability and insurance eligibility endpoints
- [x] Rate limiting testing: Send >10 requests/minute to async validation endpoints, verify 429 Too Many Requests response
- [x] Validation error logging: Trigger validation failures, verify logs are written to `logs/validation-errors.log`
- [x] Cross-validation with frontend: Ensure server-side validation rules match frontend validators.ts
- [x] Security testing: Send malicious payloads (SQL injection, XSS) to validate sanitization works

## Implementation Checklist
- [x] Create validation.middleware.ts with Zod schema validation, standardized error format (HTTP 400, {success: false, errors: [{field, message, code}]}), and integrate with all route files
- [x] Create loginDTO.schema.ts with email, password, rememberMe validation mirroring frontend rules
- [x] Create appointmentBookingDTO.schema.ts with patientId, staffId, timeslotId, appointmentDate (future date), reason (max 200 chars) validation
- [x] Create patientIntakeDTO.schema.ts with firstName, lastName, DOB (past date, age >= 18), phone, email, medications, allergies validation
- [x] Create documentUploadDTO.schema.ts with patientId, documentType enum, fileName, fileSize (max 10MB) validation
- [x] Create userManagementDTO.schema.ts with email (unique check via database), firstName, lastName, role enum (PATIENT/STAFF/ADMIN), active boolean validation
- [x] Create validationController.ts with GET /api/users/check-username and POST /api/insurance/check-eligibility endpoints, plus rateLimiter.middleware.ts with express-rate-limit (max 10 req/min per IP, HTTP 429)
- [x] Create validationErrorLogger.ts with Winston logger (log to file, daily rotation, 30-day retention, structured log format [timestamp, IP, endpoint, field, errorCode]), and add validation error tracking metrics (count failures per endpoint/field)

