# Task - TASK_001_BE_AUDIT_LOGGING_SYSTEM

## Requirement Reference
- User Story: US_011
- Story Location: `.propel/context/tasks/us_011/us_011.md`
- Acceptance Criteria:
    - AC1: All user actions logged to audit_logs table with user_id, action_type, resource_type, resource_id, timestamp, IP, user_agent, PII-redacted details
    - INSERT-only permissions (no UPDATE/DELETE), 7-year retention
- Edge Cases:
    - Audit log insert fails: Fail primary operation with 500 error, log to separate error table
    - PII redaction enforced: Middleware intercepts writes, applies redaction rules before INSERT
    - Table grows to millions: Implement table partitioning by year, archive old partitions to cold storage

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No (Backend logging, Admin UI viewing in separate US) |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE (Admin viewing only) |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-012-audit-logs.html |
| **Screen Spec** | SCR-012 (Admin audit log viewing - separate UI task) |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Backend audit logging implementation only - Admin UI for viewing is separate task

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

**Note**: Audit logging MUST comply with HIPAA requirements (NFR-003, NFR-005)

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AIImpact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI features - compliance logging only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend logging infrastructure

## Task Overview
Implement immutable audit logging middleware: (1) Intercepts all API requests/responses, (2) Extracts user_id from JWT, action_type from HTTP method + endpoint, resource_type/resource_id from request body/params, (3) Applies PII redaction rules (replace firstName/lastName/email/ssn with hashed IDs), (4) Inserts to audit_logs table (enforced INSERT-only via database rules from US_003 Task 002), (5) Implements table partitioning by year for scalability, (6) Configures 7-year retention policy. Logs all CRUD operations, authentication events, authorization failures, data exports.

## Dependent Tasks
- US_003 Task 002: AuditLogs table with immutability rules must exist
- US_009 Task 001: JWT authentication to extract user_id

## Impacted Components
**New:**
- server/src/middleware/audit.middleware.ts (Express middleware to capture requests/responses)
- server/src/services/audit.service.ts (Business logic: createAuditLog, applyPIIRedaction, getAuditTrail)
- server/src/utils/pii-redaction.ts (PII redaction rules: hash names/emails/SSNs)
- server/src/types/audit.types.ts (AuditLog, ActionType, ResourceType interfaces)
- server/db/audit-partitions.sql (Table partitioning by year: 2025, 2026, 2027, ...)

**Modified:**
- server/src/app.ts (Register audit middleware globally)

## Implementation Plan
1. **Create audit types**: ActionType (login, logout, create, read, update, delete, export, authorization_failed), ResourceType (appointment, user, clinical_document, patient_profile, audit_log, system)
2. **Implement PII redaction utility**:
   - createHash(value): SHA256 hash of PII value for consistent redaction
   - redactPII(data): Recursively walk object, replace firstName/lastName/email/ssn/dateOfBirth with hashed equivalents
3. **Create AuditService**:
   - createAuditLog(logData): Insert to audit_logs table after PII redaction, return log ID
   - getAuditTrail(userId, filters): Query audit_logs with pagination for Admin UI (separate task)
4. **Implement audit middleware**:
   - Capture request: Extract userId from req.user, method, path, body, query, ip, user-agent
   - Infer action_type: POST→create, GET→read, PUT/PATCH→update, DELETE→delete, POST /auth/login→login
   - Infer resource_type and resource_id from endpoint pattern (e.g., /api/appointments/:id → resource_type='appointment', resource_id=:id)
   - Capture response: On res.finish, extract status_code
   - Create audit log: Call auditService.createAuditLog with redacted details
5. **Handle audit failures**: Wrap auditService.createAuditLog in try-catch, if fails → log to error_logs table (separate table for debugging), fail primary operation with 500 error
6. **Implement table partitioning**:
   - Create partitions: audit_logs_2025, audit_logs_2026, ..., audit_logs_2031 (7 years)
   - Add partition trigger: Automatically route INSERTs to correct partition based on created_at year
7. **Configure retention policy**: Cron job to archive partitions older than 7 years to cold storage (S3/Glacier)
8. **Test audit logging**: Perform CRUD operations, verify audit_logs entries created with correct action_type, resource_type, PII redacted
9. **Enforce immutability**: Verify UPDATE/DELETE on audit_logs fails (from US_003 Task 002 rules)

## Current Project State
```
ASSIGNMENT/
├── server/
│   ├── src/
│   │   ├── middleware/ (auth, rbac exist)
│   │   ├── services/ (auth, appointments exist)
│   │   └── utils/ (exists)
│   └── db/
│       └── migrations/
│           └── 001_create_audit_table.sql (from US_003 Task 002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/middleware/audit.middleware.ts | Express middleware to capture all requests/responses |
| CREATE | server/src/services/audit.service.ts | createAuditLog, getAuditTrail, applyPIIRedaction methods |
| CREATE | server/src/utils/pii-redaction.ts | PII hashing and redaction functions |
| CREATE | server/src/types/audit.types.ts | AuditLog, ActionType, ResourceType, AuditFilters interfaces |
| CREATE | server/db/audit-partitions.sql | Table partitioning by year (2025-2031) |
| UPDATE | server/src/app.ts | Register audit middleware after auth middleware |
| CREATE | server/db/retention-policy.sql | Retention policy (archive partitions >7 years old) |

> Creates 6 new files, updates 1 existing file

## External References
- [HIPAA Audit Log Requirements](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [PostgreSQL Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [PII Redaction Best Practices](https://www.owasp.org/index.php/Data_Anonymization)
- [NFR-003 HIPAA Compliance](../../../.propel/context/docs/spec.md#NFR-003)
- [NFR-005 Immutable Audit Logging](../../../.propel/context/docs/spec.md#NFR-005)

## Build Commands
```bash
# No new dependencies needed
cd server
npm run dev

# Create audit partitions
cd server/db
psql -U postgres -d upaci -f audit-partitions.sql

# Test audit logging
# Make API request → check audit_logs
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer <token>" \
  -d '{"slotId":"xxx","notes":"Test"}'

# Query audit logs
psql -U postgres -d upaci -c "SELECT * FROM audit_logs WHERE user_id = 'user-id' ORDER BY created_at DESC LIMIT 10;"

# Verify immutability (should fail)
psql -U postgres -d upaci -c "UPDATE audit_logs SET action_type = 'modified' WHERE id = 'log-id';"
```

## Implementation Validation Strategy
- [ ] Unit tests: PII redaction replaces firstName/lastName/email with hashes
- [ ] Unit tests: Audit log creation succeeds with all required fields
- [ ] Integration tests: Make API request → audit_logs has entry
- [ ] Audit middleware registered: server/src/app.ts has `app.use(auditMiddleware)`
- [ ] Audit log captured for login: POST /auth/login → audit_logs has action_type='login'
- [ ] Audit log captured for booking: POST /api/appointments → audit_logs has action_type='create', resource_type='appointment'
- [ ] Audit log captured for read: GET /api/appointments/:id → audit_logs has action_type='read', resource_id=:id
- [ ] Audit log captured for update: PUT /api/appointments/:id → audit_logs has action_type='update', old_values/new_values
- [ ] Audit log captured for delete: DELETE /api/appointments/:id → audit_logs has action_type='delete', old_values
- [ ] Authorization failure logged: Patient tries admin endpoint → audit_logs has action_type='authorization_failed'
- [ ] PII redacted: Audit log details has patient_id instead of firstName/lastName
- [ ] IP address captured: audit_logs.ip_address matches req.ip
- [ ] User agent captured: audit_logs.user_agent matches req.headers['user-agent']
- [ ] Immutability enforced: UPDATE audit_logs → ERROR "cannot update audit_logs"
- [ ] DELETE blocked: DELETE FROM audit_logs → ERROR "cannot delete from audit_logs"
- [ ] Table partitioning works: INSERT audit log for 2025 → routed to audit_logs_2025
- [ ] Audit failure handling: Simulate audit insert failure (stop DB) → primary operation returns 500
- [ ] Retention policy: Query audit logs >7 years old → archived to cold storage (simulated)

## Implementation Checklist
- [ ] Create server/src/types/audit.types.ts:
  - [ ] `export type ActionType = 'login' | 'logout' | 'create' | 'read' | 'update' | 'delete' | 'export' | 'authorization_failed';`
  - [ ] `export type ResourceType = 'appointment' | 'user' | 'clinical_document' | 'patient_profile' | 'audit_log' | 'system';`
  - [ ] `export interface AuditLog { id: string; userId: string; actionType: ActionType; resourceType: ResourceType; resourceId?: string; timestamp: Date; ipAddress: string; userAgent: string; oldValues?: any; newValues?: any; details?: any; }`
  - [ ] `export interface AuditFilters { userId?: string; actionType?: ActionType; resourceType?: ResourceType; startDate?: Date; endDate?: Date; limit?: number; offset?: number; }`
- [ ] Create server/src/utils/pii-redaction.ts:
  - [ ] Import crypto
  - [ ] `export function createHash(value: string): string { return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16); }`
  - [ ] `export function redactPII(data: any): any {`
  - [ ]   `if (typeof data !== 'object' || data === null) return data;`
  - [ ]   `const redacted = Array.isArray(data) ? [...data] : { ...data };`
  - [ ]   `const piiFields = ['firstName', 'lastName', 'email', 'ssn', 'dateOfBirth', 'phoneNumber'];`
  - [ ]   `for (const key in redacted) {`
  - [ ]     `if (piiFields.includes(key) && typeof redacted[key] === 'string') {`
  - [ ]       `redacted[key] = 'REDACTED_' + createHash(redacted[key]);`
  - [ ]     `} else if (typeof redacted[key] === 'object') {`
  - [ ]       `redacted[key] = redactPII(redacted[key]);`
  - [ ]     `}`
  - [ ]   `}`
  - [ ]   `return redacted;`
  - [ ] `}`
- [ ] Create server/src/services/audit.service.ts:
  - [ ] Import pool (database), redactPII, AuditLog
  - [ ] `export async function createAuditLog(logData: Partial<AuditLog>): Promise<string> {`
  - [ ]   `try {`
  - [ ]     `const redactedDetails = logData.details ? redactPII(logData.details) : null;`
  - [ ]     `const redactedOldValues = logData.oldValues ? redactPII(logData.oldValues) : null;`
  - [ ]     `const redactedNewValues = logData.newValues ? redactPII(logData.newValues) : null;`
  - [ ]     `const result = await pool.query(`
  - [ ]       `'INSERT INTO audit_logs (id, user_id, action_type, resource_type, resource_id, timestamp, ip_address, user_agent, old_values, new_values, details) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9) RETURNING id',`
  - [ ]       `[logData.userId, logData.actionType, logData.resourceType, logData.resourceId, logData.ipAddress, logData.userAgent, redactedOldValues, redactedNewValues, redactedDetails]`
  - [ ]     `);`
  - [ ]     `return result.rows[0].id;`
  - [ ]   `} catch (error) {`
  - [ ]     `// Log to separate error table for investigation`
  - [ ]     `await pool.query('INSERT INTO error_logs (error_type, error_message, stack_trace, created_at) VALUES ($1, $2, $3, NOW())', ['audit_log_failure', error.message, error.stack]);`
  - [ ]     `throw new Error('Audit log creation failed');`
  - [ ]   `}`
  - [ ] `}`
  - [ ] `export async function getAuditTrail(filters: AuditFilters): Promise<AuditLog[]> {`
  - [ ]   `// Implementation for Admin UI to query audit logs (separate task)`
  - [ ]   `const query = 'SELECT * FROM audit_logs WHERE ($1::uuid IS NULL OR user_id = $1) AND ($2::text IS NULL OR action_type = $2) ORDER BY timestamp DESC LIMIT $3 OFFSET $4';`
  - [ ]   `const result = await pool.query(query, [filters.userId, filters.actionType, filters.limit || 50, filters.offset || 0]);`
  - [ ]   `return result.rows;`
  - [ ] `}`
- [ ] Create server/src/middleware/audit.middleware.ts:
  - [ ] Import auditService, ActionType, ResourceType
  - [ ] `export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {`
  - [ ]   `const startTime = Date.now();`
  - [ ]   `// Capture request data`
  - [ ]   `const userId = req.user?.userId || 'anonymous';`
  - [ ]   `const method = req.method;`
  - [ ]   `const path = req.path;`
  - [ ]   `const ipAddress = req.ip || req.connection.remoteAddress;`
  - [ ]   `const userAgent = req.headers['user-agent'] || 'unknown';`
  - [ ]   `// Infer action type from method`
  - [ ]   `let actionType: ActionType = 'read';`
  - [ ]   `if (path.includes('/auth/login')) actionType = 'login';`
  - [ ]   `else if (path.includes('/auth/logout')) actionType = 'logout';`
  - [ ]   `else if (method === 'POST') actionType = 'create';`
  - [ ]   `else if (method === 'PUT' || method === 'PATCH') actionType = 'update';`
  - [ ]   `else if (method === 'DELETE') actionType = 'delete';`
  - [ ]   `// Infer resource type and ID from path`
  - [ ]   `const pathParts = path.split('/').filter(p => p);`
  - [ ]   `let resourceType: ResourceType = 'system';`
  - [ ]   `let resourceId: string | undefined;`
  - [ ]   `if (pathParts.includes('appointments')) { resourceType = 'appointment'; resourceId = pathParts[pathParts.indexOf('appointments') + 1]; }`
  - [ ]   `else if (pathParts.includes('users')) { resourceType = 'user'; resourceId = pathParts[pathParts.indexOf('users') + 1]; }`
  - [ ]   `else if (pathParts.includes('documents')) { resourceType = 'clinical_document'; resourceId = pathParts[pathParts.indexOf('documents') + 1]; }`
  - [ ]   `// Capture response`
  - [ ]   `const originalSend = res.send;`
  - [ ]   `res.send = function(data) {`
  - [ ]     `res.send = originalSend; // Restore original`
  - [ ]     `// Create audit log asynchronously (don't block response)`
  - [ ]     `auditService.createAuditLog({`
  - [ ]       `userId, actionType, resourceType, resourceId, ipAddress, userAgent,`
  - [ ]       `details: { method, path, statusCode: res.statusCode, duration: Date.now() - startTime, body: req.body, query: req.query }`
  - [ ]     `}).catch(err => console.error('Audit log failed:', err));`
  - [ ]     `return originalSend.call(this, data);`
  - [ ]   `};`
  - [ ]   `next();`
  - [ ] `};`
- [ ] Create server/db/audit-partitions.sql:
  - [ ] `-- Create partitioned audit_logs table (if not exists from US_003 Task 002)`
  - [ ] `-- Assume parent table exists, create partitions by year`
  - [ ] `CREATE TABLE IF NOT EXISTS audit_logs_2025 PARTITION OF audit_logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');`
  - [ ] `CREATE TABLE IF NOT EXISTS audit_logs_2026 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');`
  - [ ] `CREATE TABLE IF NOT EXISTS audit_logs_2027 PARTITION OF audit_logs FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');`
  - [ ] `-- Continue for 7 years (2025-2031)`
  - [ ] `-- Note: Parent audit_logs table must have PARTITION BY RANGE (created_at)`
- [ ] Create server/db/retention-policy.sql:
  - [ ] `-- Archive audit logs older than 7 years`
  - [ ] `-- To be run as cron job: 0 0 1 1 * (yearly on Jan 1)`
  - [ ] `-- Example: Export to CSV and drop partition`
  - [ ] `COPY (SELECT * FROM audit_logs_2018) TO '/backup/audit_logs_2018.csv' WITH CSV HEADER;`
  - [ ] `DROP TABLE IF EXISTS audit_logs_2018;`
- [ ] Update server/src/app.ts:
  - [ ] Import auditMiddleware
  - [ ] Register after auth middleware: `app.use(auditMiddleware);`
- [ ] Test audit logging:
  - [ ] Login: POST /auth/login → verify audit_logs has action_type='login', user_id=logged_in_user
  - [ ] Create appointment: POST /api/appointments → verify action_type='create', resource_type='appointment', details includes body
  - [ ] Read appointment: GET /api/appointments/123 → verify action_type='read', resource_id='123'
  - [ ] Update appointment: PUT /api/appointments/123 → verify action_type='update', old_values/new_values captured
  - [ ] Delete appointment: DELETE /api/appointments/123 → verify action_type='delete', old_values captured
  - [ ] Authorization failure: Patient tries admin endpoint → verify action_type='authorization_failed'
- [ ] Test PII redaction:
  - [ ] Create appointment with patient details (firstName, lastName, email) in body
  - [ ] Query audit_logs → verify details.body has REDACTED_<hash> instead of actual PII
- [ ] Test immutability:
  - [ ] `UPDATE audit_logs SET action_type = 'modified' WHERE id = 'xxx';` → ERROR
  - [ ] `DELETE FROM audit_logs WHERE id = 'xxx';` → ERROR
- [ ] Test partitioning:
  - [ ] Insert audit log → verify routed to correct partition (audit_logs_2026 for 2026 dates)
  - [ ] Query specific partition: `SELECT * FROM audit_logs_2026 LIMIT 10;`
- [ ] Document audit logging in server/README.md:
  - [ ] What actions are logged (login, CRUD operations, authorization failures)
  - [ ] PII redaction strategy (SHA256 hashing)
  - [ ] Retention policy (7 years, partitioned by year)
  - [ ] How to query audit trail (for Admin UI)
  - [ ] Immutability enforcement (INSERT-only table)
