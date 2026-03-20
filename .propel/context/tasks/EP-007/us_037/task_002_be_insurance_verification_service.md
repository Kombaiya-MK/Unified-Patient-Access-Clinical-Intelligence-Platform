# Task - TASK_002: Backend Insurance Verification Service with API Integration and Retry Logic

## Requirement Reference
- User Story: [us_037]
- Story Location: [.propel/context/tasks/us_037/us_037.md]
- Acceptance Criteria:
    - AC1: Call external insurance verification API (Availity, Change Healthcare) with patient info
    - AC1: Receive eligibility response with status, copay, deductible, coverage dates
    - AC1: Store verification result in database
    - AC1: Retry failed API calls up to 3 times with exponential backoff (1min, 5min, 15min)
    - AC1: Log all verification attempts to audit log with API response codes
    - AC1: Scheduled job runs 24 hours before appointment time
    - AC1: Generate notification for staff if status is Inactive or Requires_Auth
- Edge Case:
    - EC1: API down → show "Verification Pending", queue retry, alert admin after 3 failures
    - EC2: Missing insurance details → flag "Insurance Info Incomplete"
    - EC3: Multiple insurance plans → verify primary only, show secondary indicator
- NFR Requirements:
    - NFR-REL02: API retry logic with exponential backoff
    - TR-003: Integration with eligibility verification APIs

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
| Database | PostgreSQL | 15.x |
| Queue | Bull | 4.x (or BullMQ 4.x) |
| Scheduler | node-cron | 3.x |
| HTTP Client | axios | 1.x |

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
Create insurance verification service integrating with external eligibility APIs (Availity, Change Healthcare). Implement insuranceVerificationService with verifyEligibility(patientId, appointmentId) function calling external API with patient insurance details, parsing response for status/copay/deductible/coverage dates, storing result in insurance_verifications table. Add retry mechanism using Bull queue for failed verifications with exponential backoff (1min, 5min, 15min delays) per NFR-REL02, tracking attempts in insurance_verification_attempts table with api_request_payload, api_response_payload, response_code, error_message. Create scheduled job using node-cron running daily to find appointments 24 hours in future: `SELECT a.id, a.patient_id FROM appointments a WHERE a.appointment_date = CURRENT_DATE + INTERVAL '1 day' AND NOT EXISTS (SELECT 1 FROM insurance_verifications iv WHERE iv.appointment_id = a.id AND iv.last_verified_at > NOW() - INTERVAL '7 days')`, queue verification for each. Implement API endpoints: GET /api/insurance/verifications/:patientId to fetch latest verification, POST /api/insurance/verifications/verify/:appointmentId to trigger manual verification, GET /api/insurance/verifications/:patientId/history for verification history. Add notification service integration to alert staff when verification status is 'inactive' or 'requires_auth' via existing notification system from US-016. Handle edge cases: missing insurance info → set status='incomplete' and flag patient_profiles.has_insurance_issue, API timeout/5xx errors → queue retry, multiple insurance plans → verify is_primary_insurance=TRUE only. Log all API calls to audit_logs with request/response payloads (sanitized for PII). Admin alert after 3 failed attempts via email/notification. Support mock API for development/testing using environment variable USE_MOCK_INSURANCE_API=true.

## Dependent Tasks
- US-037 task_001: Database migration with insurance_verifications tables
- US-016: Notification service for staff alerts
- US-035: Admin config for API credentials storage

## Impacted Components
- **CREATE** server/src/services/insuranceVerificationService.ts - Core verification logic
- **CREATE** server/src/services/insuranceApiClient.ts - External API integration
- **CREATE** server/src/jobs/insuranceVerificationScheduler.ts - Scheduled job for 24h pre-check
- **CREATE** server/src/queues/insuranceVerificationQueue.ts - Bull queue for retries
- **CREATE** server/src/controllers/insuranceVerificationController.ts - API endpoints
- **CREATE** server/src/routes/insuranceVerificationRoutes.ts - Express routes
- **CREATE** server/src/config/insuranceApiConfig.ts - API credentials and endpoints
- **MODIFY** server/src/routes/index.ts - Mount insurance routes
- **MODIFY** server/src/server.ts - Initialize scheduler

## Implementation Plan
1. **Create insuranceApiConfig.ts**: Load from environment variables: INSURANCE_API_PROVIDER (availity/change_healthcare), INSURANCE_API_BASE_URL, INSURANCE_API_KEY, INSURANCE_API_SECRET, USE_MOCK_INSURANCE_API (boolean), export config object
2. **Create insuranceApiClient.ts**: Implement callEligibilityAPI(patientInsurance: {plan, memberId, dob}) function using axios, build request payload per API spec, set headers with API key, make POST to /eligibility endpoint, parse response extracting: eligibilityStatus (map to 'active'/'inactive'/'requires_auth'), copayAmount, deductibleRemaining, coverageStartDate, coverageEndDate, authorizationNotes, handle API errors: timeout (after 30s), 5xx errors → throw RetryableError, 4xx errors (invalid data) → throw NonRetryableError, implement mock API response if USE_MOCK_INSURANCE_API=true returning dummy data
3. **Create insuranceVerificationService.ts**: Implement verifyEligibility(patientId, appointmentId?) async function: fetch patient insurance from patient_profiles (insurance_provider, insurance_policy_number) JOIN patient demographics (dob), if missing insurance throw InsuranceInfoMissingError with status='incomplete', check is_primary_insurance if multiple plans, call insuranceApiClient.callEligibilityAPI, on success INSERT insurance_verifications (patient_id, appointment_id, status, copay_amount, deductible_remaining, coverage dates, verification_source, last_verified_at=NOW()), INSERT insurance_verification_attempts (attempt_number=1, status='success', api_response_payload), if status='inactive' or 'requires_auth' trigger staff notification via notificationService.notifyStaff, on failure: INSERT verification with status='failed', INSERT attempt with status='failed' and error_message, add to retry queue with exponential backoff
4. **Create insuranceVerificationQueue.ts**: Use Bull queue, define job processor: async (job) => { const {verificationId, attemptNumber} = job.data; try { await insuranceVerificationService.retryVerification(verificationId, attemptNumber); } catch(err) { if (attemptNumber < 3) queue.add({verificationId, attemptNumber: attemptNumber+1}, {delay: getBackoffDelay(attemptNumber+1)}); else sendAdminAlert(verificationId); } }, getBackoffDelay function: attempt 1 → 60000ms (1min), attempt 2 → 300000ms (5min), attempt 3 → 900000ms (15min)
5. **Implement retryVerification function**: In insuranceVerificationService, fetch verification by ID, check attempt_number < 3, call insuranceApiClient again, update insurance_verifications with new result, INSERT new insurance_verification_attempts row with incremented attempt_number
6. **Create insuranceVerificationScheduler.ts**: Use node-cron to schedule daily job at midnight: cron.schedule('0 0 * * *', async () => { const appointments = await db.query('SELECT a.id, a.patient_id FROM appointments a WHERE a.appointment_date = CURRENT_DATE + INTERVAL 1 DAY AND NOT EXISTS (SELECT 1 FROM insurance_verifications iv WHERE iv.appointment_id = a.id AND iv.last_verified_at > NOW() - INTERVAL 7 DAYS)'); for (const appt of appointments.rows) { await insuranceVerificationQueue.add({patientId: appt.patient_id, appointmentId: appt.id}); } }), export startScheduler function
7. **Create insuranceVerificationController.ts**: Implement handlers: getVerification(req, res) - GET latest verification for patient SELECT * FROM insurance_verifications WHERE patient_id = $1 ORDER BY last_verified_at DESC LIMIT 1, return 200 with verification or 404, manualVerify(req, res) - POST trigger immediate verification for appointment, call insuranceVerificationService.verifyEligibility, return 201 with verification result or 400/500 errors, getVerificationHistory(req, res) - GET all verifications for patient with pagination, return 200 with array
8. **Create insuranceVerificationRoutes.ts**: Express router, routes: GET /verifications/:patientId (latest), POST /verifications/verify/:appointmentId (manual trigger), GET /verifications/:patientId/history, apply authMiddleware and rbacMiddleware(['staff', 'admin'])
9. **Modify index.ts**: Import insuranceVerificationRoutes, mount app.use('/api/insurance', insuranceVerificationRoutes)
10. **Modify server.ts**: Import and call insuranceVerificationScheduler.startScheduler() after database connection established
11. **Notification integration**: In verifyEligibility, when status='inactive' or 'requires_auth', call notificationService.createNotification({type: 'insurance_issue', recipient_staff_ids: [...], patient_id, message: 'Patient insurance verification failed - [status]', priority: 'high'}), link to patient profile
12. **Audit logging**: Log all API calls: await auditLog.create({action: 'insurance_verification_api_call', patient_id, details: {api_provider, request_sanitized (remove PII), response_code, verification_id}}), sanitize patient SSN/dob from logs
13. **Error handling**: InsuranceInfoMissingError → set status='incomplete', update patient_profiles.has_insurance_issue=TRUE, return helpful message to staff, RetryableError → add to queue with backoff, NonRetryableError → set status='failed', don't retry, log permanently
14. **Testing**: Test verifyEligibility with mock API, test retry queue with failed attempts, test exponential backoff delays, test scheduler finds appointments 24h ahead, test notification triggers for inactive status, test audit logging, test missing insurance handling

**Focus on how to implement**: API client: `const callEligibilityAPI = async (insurance: {plan: string, memberId: string, dob: Date}) => { if (USE_MOCK_INSURANCE_API) return {status: 'active', copay: 25.00, deductible: 500.00}; const response = await axios.post(INSURANCE_API_BASE_URL + '/eligibility', {insurer: insurance.plan, memberId: insurance.memberId, dateOfBirth: insurance.dob}, {headers: {'X-API-Key': INSURANCE_API_KEY}, timeout: 30000}); return {status: mapStatus(response.data.eligibilityStatus), copay: response.data.copayAmount, deductible: response.data.deductibleRemaining, coverageStart: response.data.effectiveDate, coverageEnd: response.data.terminationDate, authNotes: response.data.authorizationRequired ? response.data.notes : null}; };`. Verify eligibility: `const verifyEligibility = async (patientId: number, appointmentId?: number) => { const patient = await db.query('SELECT pp.insurance_provider, pp.insurance_policy_number, u.date_of_birth FROM patient_profiles pp JOIN users u ON pp.user_id = u.id WHERE pp.id = $1', [patientId]); if (!patient.rows[0].insurance_provider || !patient.rows[0].insurance_policy_number) throw new InsuranceInfoMissingError(); const apiResult = await insuranceApiClient.callEligibilityAPI({plan: patient.rows[0].insurance_provider, memberId: patient.rows[0].insurance_policy_number, dob: patient.rows[0].date_of_birth}); const verification = await db.query('INSERT INTO insurance_verifications (patient_id, appointment_id, verification_date, status, copay_amount, deductible_remaining, coverage_start_date, coverage_end_date, authorization_notes, last_verified_at, verification_source, is_primary_insurance) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, NOW(), $9, TRUE) RETURNING *', [patientId, appointmentId, apiResult.status, apiResult.copay, apiResult.deductible, apiResult.coverageStart, apiResult.coverageEnd, apiResult.authNotes, INSURANCE_API_PROVIDER]); await db.query('INSERT INTO insurance_verification_attempts (verification_id, attempt_number, api_provider, api_response_payload, response_code, status, attempted_at) VALUES ($1, 1, $2, $3, $4, $5, NOW())', [verification.rows[0].id, INSURANCE_API_PROVIDER, JSON.stringify(apiResult), '200', 'success']); if (['inactive', 'requires_auth'].includes(apiResult.status)) { await notificationService.notifyStaff({type: 'insurance_issue', patient_id: patientId, message: \`Insurance verification issue: \${apiResult.status}\`}); } return verification.rows[0]; };`. Retry queue: `const insuranceVerificationQueue = new Bull('insurance-verification', {redis: REDIS_URL}); insuranceVerificationQueue.process(async (job) => { const {verificationId, attemptNumber} = job.data; try { await insuranceVerificationService.retryVerification(verificationId, attemptNumber); } catch (error) { if (attemptNumber < 3) { const backoffDelays = [60000, 300000, 900000]; await insuranceVerificationQueue.add({verificationId, attemptNumber: attemptNumber + 1}, {delay: backoffDelays[attemptNumber]}); } else { await sendAdminAlert(verificationId, error); } } });`. Scheduler: `cron.schedule('0 0 * * *', async () => { const tomorrow = await db.query('SELECT a.id, a.patient_id FROM appointments a WHERE a.appointment_date = CURRENT_DATE + INTERVAL 1 DAY AND NOT EXISTS (SELECT 1 FROM insurance_verifications iv WHERE iv.appointment_id = a.id AND iv.last_verified_at > NOW() - INTERVAL 7 DAYS)'); for (const appt of tomorrow.rows) { await insuranceVerificationQueue.add({patientId: appt.patient_id, appointmentId: appt.id}); } });`.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── insuranceVerificationService.ts (to be created)
│   │   ├── insuranceApiClient.ts (to be created)
│   │   └── notificationService.ts (existing from US-016)
│   ├── jobs/
│   │   └── insuranceVerificationScheduler.ts (to be created)
│   ├── queues/
│   │   └── insuranceVerificationQueue.ts (to be created)
│   ├── controllers/
│   │   └── insuranceVerificationController.ts (to be created)
│   ├── routes/
│   │   ├── index.ts (to be modified)
│   │   └── insuranceVerificationRoutes.ts (to be created)
│   └── config/
│       └── insuranceApiConfig.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/config/insuranceApiConfig.ts | API credentials and config |
| CREATE | server/src/services/insuranceApiClient.ts | External API integration client |
| CREATE | server/src/services/insuranceVerificationService.ts | Core verification logic |
| CREATE | server/src/queues/insuranceVerificationQueue.ts | Bull queue for retries |
| CREATE | server/src/jobs/insuranceVerificationScheduler.ts | Scheduled 24h pre-check job |
| CREATE | server/src/controllers/insuranceVerificationController.ts | API endpoint handlers |
| CREATE | server/src/routes/insuranceVerificationRoutes.ts | Express routes |
| MODIFY | server/src/routes/index.ts | Mount insurance routes |
| MODIFY | server/src/server.ts | Initialize scheduler |

## External References
- **Availity API Docs**: https://www.availity.com/developers (eligibility verification endpoint spec)
- **Change Healthcare API**: https://developers.changehealthcare.com/ (alternative provider)
- **Bull Queue**: https://github.com/OptimalBits/bull - Redis-based job queue
- **node-cron**: https://www.npmjs.com/package/node-cron - Cron scheduler
- **axios**: https://axios-http.com/ - HTTP client with timeout and retry
- **Exponential Backoff**: https://en.wikipedia.org/wiki/Exponential_backoff - Retry strategy pattern

## Build Commands
- Install dependencies: `npm install bull node-cron axios`
- Build TypeScript: `npm run build`
- Run in development: `npm run dev`
- Run tests: `npm test -- insuranceVerificationService.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] Insurance API client calls external endpoint successfully
- [x] Mock API mode works for development (USE_MOCK_INSURANCE_API=true)
- [x] verifyEligibility stores result in insurance_verifications table
- [x] API response parsed correctly (status, copay, deductible, dates)
- [x] Missing insurance info sets status='incomplete' and flags patient
- [x] Failed API call triggers retry queue with exponential backoff
- [x] Retry attempts tracked in insurance_verification_attempts table
- [x] Exponential backoff delays correct (1min, 5min, 15min)
- [x] Maximum 3 retry attempts enforced
- [x] Admin alert sent after 3 failed attempts
- [x] Scheduled job runs daily at midnight
- [x] Scheduler finds appointments 24 hours ahead
- [x] Scheduled job skips recently verified appointments (<7 days)
- [x] Manual verification via POST endpoint triggers immediately
- [x] Staff notification sent when status='inactive' or 'requires_auth'
- [x] Audit logging captures all API calls (sanitized)
- [x] GET endpoints return verification results correctly
- [x] Verification history endpoint returns paginated results
- [x] All endpoints require staff or admin role

## Implementation Checklist
- [ ] Create server/src/config/insuranceApiConfig.ts (load from env: INSURANCE_API_PROVIDER, INSURANCE_API_BASE_URL, INSURANCE_API_KEY, INSURANCE_API_SECRET, USE_MOCK_INSURANCE_API boolean, export config object with validation)
- [ ] Create server/src/services/insuranceApiClient.ts file
- [ ] Implement callEligibilityAPI function (if USE_MOCK_INSURANCE_API return mock data {status: 'active', copay: 25, deductible: 500}, else axios POST to INSURANCE_API_BASE_URL/eligibility with {insurer, memberId, dateOfBirth}, headers X-API-Key, timeout 30s, parse response mapping eligibilityStatus to verification_status enum, extract copay/deductible/coverageDates/authNotes, handle errors: timeout/5xx throw RetryableError, 4xx throw NonRetryableError)
- [ ] Create server/src/services/insuranceVerificationService.ts file
- [ ] Implement verifyEligibility function (fetch patient from patient_profiles JOIN users for dob, check insurance_provider and insurance_policy_number exist else throw InsuranceInfoMissingError set status='incomplete' update has_insurance_issue=TRUE, check is_primary_insurance=TRUE if multiple plans, call insuranceApiClient.callEligibilityAPI, INSERT insurance_verifications with status/copay/deductible/dates/verification_source/last_verified_at=NOW(), INSERT insurance_verification_attempts with attempt_number=1 status='success' api_response_payload, if status IN ('inactive', 'requires_auth') call notificationService.notifyStaff with patient_id and message, return verification)
- [ ] Implement retryVerification function (SELECT verification WHERE id, check attempt_number < 3, call insuranceApiClient.callEligibilityAPI again, UPDATE insurance_verifications with new result, INSERT insurance_verification_attempts with incremented attempt_number and new api_response_payload)
- [ ] Handle API failures in verifyEligibility (catch RetryableError: INSERT verification with status='failed', INSERT attempt with status='failed' error_message, add to insuranceVerificationQueue with job data {verificationId, attemptNumber: 1}, catch NonRetryableError: INSERT verification status='failed' permanently no retry, catch InsuranceInfoMissingError: INSERT verification status='incomplete' update patient flag)
- [ ] Create server/src/queues/insuranceVerificationQueue.ts (initialize Bull queue with Redis URL, define job processor: async (job) => { const {verificationId, attemptNumber} = job.data; try { await insuranceVerificationService.retryVerification(verificationId, attemptNumber); } catch (error) { if (attemptNumber < 3) { const backoffDelays = [60000, 300000, 900000]; insuranceVerificationQueue.add({verificationId, attemptNumber: attemptNumber + 1}, {delay: backoffDelays[attemptNumber]}); } else { await sendAdminAlert(verificationId, error); } } }, export queue)
- [ ] Implement sendAdminAlert function (after 3 failed attempts: fetch admin users, create notification with type='system_alert', message='Insurance verification failed after 3 attempts for patient {id}', link to patient profile, optionally send email using nodemailer)
- [ ] Create server/src/jobs/insuranceVerificationScheduler.ts (use node-cron, schedule daily at midnight: cron.schedule('0 0 * * *', async () => { query appointments WHERE appointment_date = CURRENT_DATE + INTERVAL '1 day' AND NOT EXISTS recent verification within 7 days, for each appointment add to insuranceVerificationQueue with {patientId, appointmentId} }), export startScheduler function)
- [ ] Create server/src/controllers/insuranceVerificationController.ts file (implement getVerification handler: parse req.params.patientId, SELECT latest from insurance_verifications WHERE patient_id ORDER BY last_verified_at DESC LIMIT 1, return 200 with verification or 404 if not found, implement manualVerify handler: parse req.params.appointmentId, call insuranceVerificationService.verifyEligibility with patientId from appointment, return 201 with result catch errors 400/500, implement getVerificationHistory handler: parse patientId and pagination params, SELECT all verifications WHERE patient_id ORDER BY last_verified_at DESC with LIMIT OFFSET, return 200 with array and pagination metadata)
- [ ] Create server/src/routes/insuranceVerificationRoutes.ts (Express Router, import authMiddleware and rbacMiddleware, routes: GET /verifications/:patientId latest, POST /verifications/verify/:appointmentId manual trigger, GET /verifications/:patientId/history with pagination, apply authMiddleware and rbacMiddleware(['staff', 'admin']) to all routes)
- [ ] Modify server/src/routes/index.ts (import insuranceVerificationRoutes, app.use('/api/insurance', insuranceVerificationRoutes))
- [ ] Modify server/src/server.ts (import insuranceVerificationScheduler, after database connection call insuranceVerificationScheduler.startScheduler() to initialize cron job)
- [ ] Implement notification integration (in verifyEligibility when status='inactive' or 'requires_auth': call notificationService.createNotification with type='insurance_issue', recipient_staff_ids from assigned staff or queue, patient_id, message describing issue, priority='high', link to patient profile SCR-011)
- [ ] Implement audit logging (in insuranceApiClient after API call: INSERT audit_logs with action='insurance_verification_api_call', patient_id, details JSONB with api_provider/request_sanitized removing PII SSN/DOB/response_code/verification_id/timestamp)
- [ ] Implement PII sanitization for logs (function sanitizeInsuranceData: remove or mask SSN, DOB, keep only last 4 digits of member ID, keep plan name and verification result fields)
- [ ] Write comprehensive tests (test verifyEligibility with mock API returns correct status, test missing insurance throws InsuranceInfoMissingError and sets status='incomplete', test API failure triggers retry queue, test retry queue processes job with exponential backoff, test max 3 attempts enforced, test admin alert sent after 3 failures, test scheduler finds appointments 24h ahead and skips recent verifications, test manual verification endpoint triggers immediately, test staff notification for inactive status, test audit logging captures API calls sanitized, test GET endpoints return results, test RBAC middleware requires staff/admin role)
