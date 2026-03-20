# Task - TASK_001_BE_AUDIT_LOGGING_SERVICE

## Requirement Reference
- User Story: US_011  
- Story Location: `.propel/context/tasks/us_011/us_011.md`
- Acceptance Criteria:
    - AC1: User performs action (login, CRUD, data access), system creates audit log with user_id, action_type, resource_type, resource_id, timestamp, IP, user_agent, PII-redacted details (patient_id/user_id instead of names/emails/SSNs), INSERT-only permissions, 7-year retention
- Edge Cases:
    - Audit log insert fails: Fail primary operation with 500, log to error table
    - PII redaction enforcement: Middleware intercepts audit writes, applies redaction before INSERT
    - Millions of records: Table partitioning by year, archive to cold storage

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

> **Note**: Backend logging service - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | pg | 8.x |
| Database | PostgreSQL | 15+ |
| Database | Table Partitioning | Built-in |

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

> **Note**: Audit logging only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement comprehensive immutable audit logging service that captures all user actions (authentication, CRUD operations, data access) with detailed metadata (user_id, action_type, resource_type, resource_id, timestamp, IP address, user_agent, request details). Integrate audit middleware into Express pipeline to automatically log all API calls. Implement transaction-safe logging where audit failure causes primary operation to fail. Create audit logger service with methods for common actions (login, logout, create, read, update, delete, access). Ensure INSERT-only permissions at database level (GRANT INSERT, REVOKE UPDATE/DELETE). Handle audit insert failures with fallback error logging table.

## Dependent Tasks
- US_007 TASK_001: AuditLogs table must exist
- US_009 TASK_001: User authentication for user context

## Impacted Components
**Modified:**
- server/src/middleware/authenticate.ts (Add audit logging for authentication events)
- server/src/routes/*.ts (Add audit middleware to protected routes)

**New:**
- server/src/services/auditLogger.ts (Core audit logging service)
- server/src/middleware/auditMiddleware.ts (Express middleware for automatic logging)
- server/src/types/audit.types.ts (AuditAction enum, AuditLogEntry interface)
- server/src/utils/requestContext.ts (Extract user context from request)
- database/migrations/XXX_audit_logs_permissions.sql (REVOKE UPDATE/DELETE on audit_logs)
- database/migrations/XXX_audit_error_logs_table.sql (Fallback error logging table)
- server/tests/integration/auditLogging.test.ts (Comprehensive audit tests)
- server/docs/AUDIT_LOGGING.md (Audit logging documentation)

## Implementation Plan
1. **Audit Types**: Define AuditAction enum (LOGIN, LOGOUT, CREATE, READ, UPDATE, DELETE, ACCESS, FAILED_LOGIN, AUTHORIZATION_FAILED)
2. **Audit Service**: Create AuditLogger service with methods: logLogin(), logLogout(), logCreate(), logRead(), logUpdate(), logDelete(), logAccess(), logSecurityEvent()
3. **Transaction Safety**: Wrap audit INSERT in same transaction as primary operation - if audit fails, rollback everything
4. **Audit Middleware**: Express middleware that runs after request completion, logs action, status code, duration
5. **User Context**: Extract user_id, role from req.user (populated by authenticate middleware)
6. **Request Metadata**: Capture IP (req.ip), user_agent (req.headers['user-agent']), method, path, status_code
7. **Action Type Mapping**: Map HTTP method + route to AuditAction (POST /patients → CREATE, GET /patients/:id → READ)
8. **Resource Identification**: Extract resource_type (from route pattern) and resource_id (from req.params.id)
9. **Details Field**: Store JSON with request_body (PII-redacted), query_params, response_status, error_message (if failed)
10. **INSERT-Only Permissions**: Run migration to GRANT INSERT, REVOKE UPDATE/DELETE on audit_logs for app user
11. **Error Handling**: On audit INSERT failure, log to audit_error_logs table (separate table with relaxed constraints)
12. **Failure Strategy**: If audit INSERT fails, fail primary operation with 500 error and message "Audit logging failed"
13. **Query Optimization**: Add indexes on user_id, action_type, created_at for audit report queries
14. **Testing**: Test audit for all CRUD operations, authentication events, authorization failures, transaction rollback

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002-010)
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── authenticate.ts  # JWT validation (US_009)
│   │   │   └── authorize.ts     # RBAC (US_010)
│   │   └── services/
└── database/                # Database setup (US_003, US_007)
    ├── migrations/
    │   └── ...audit_logs_table.sql  # AuditLogs table exists (US_007)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/audit.types.ts | AuditAction enum, AuditLogEntry interface, AuditContext type |
| CREATE | server/src/services/auditLogger.ts | Core audit logging service with transaction support |
| CREATE | server/src/middleware/auditMiddleware.ts | Express middleware for automatic audit logging |
| CREATE | server/src/utils/requestContext.ts | Extract user/request context utilities |
| CREATE | server/src/utils/actionMapper.ts | Map HTTP method + route to AuditAction enum |
| MODIFY | server/src/middleware/authenticate.ts | Add logLogin() on successful auth, logFailedLogin() on failure |
| MODIFY | server/src/routes/patients.routes.ts | Add auditMiddleware to all routes |
| MODIFY | server/src/routes/appointments.routes.ts | Add auditMiddleware to all routes |
| MODIFY | server/src/routes/admin.routes.ts | Add auditMiddleware to all routes |
| CREATE | database/migrations/XXX_audit_logs_permissions.sql | REVOKE UPDATE/DELETE, GRANT INSERT only |
| CREATE | database/migrations/XXX_audit_error_logs_table.sql | Create audit_error_logs fallback table |
| CREATE | server/tests/integration/auditLogging.test.ts | Test all audit scenarios |
| CREATE | server/docs/AUDIT_LOGGING.md | Documentation for audit logging system |

> 3 modified files, 10 new files created

## External References
- [HIPAA Audit Controls](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [PostgreSQL INSERT-only Security](https://www.postgresql.org/docs/current/sql-grant.html)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Audit Logging Best Practices](https://owasp.org/www-community/Audit_Logging_Best_Practices)
- [NIST Audit Requirements](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)

## Build Commands
```bash
# Run migration for INSERT-only permissions
cd database
npm run migrate up

# Verify audit_logs permissions
psql -U upaci_user -d upaci -c "
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema='public' AND table_name='audit_logs';
"
# Expected: INSERT only, no UPDATE/DELETE

# Start development server
cd server
npm run dev

# Test audit logging with login
TOKEN=""
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!"}'
# Capture token from response
TOKEN="<jwt-token>"

# Check audit log created for login
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs 
WHERE action_type = 'LOGIN' 
ORDER BY created_at DESC 
LIMIT 1;
"
# Expected: 1 row with user_id, IP, user_agent, timestamp

# Test audit for CRUD operation (create appointment)
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patient_id":1,"department_id":1,"appointment_date":"2026-04-01T10:00:00Z"}'

# Check audit log for CREATE
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs 
WHERE action_type = 'CREATE' AND resource_type = 'appointment' 
ORDER BY created_at DESC 
LIMIT 1;
"
# Expected: 1 row with action=CREATE, resource_type=appointment, resource_id=<new-id>, details JSON

# Test audit immutability (try UPDATE - should fail)
psql -U upaci_user -d upaci -c "
UPDATE audit_logs SET action_type = 'MODIFIED' WHERE id = 1;
"
# Expected: ERROR: permission denied for table audit_logs

# Test audit for READ operation
curl -X GET http://localhost:3001/api/patients/1 \
  -H "Authorization: Bearer $TOKEN"

# Check audit log for READ
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs 
WHERE action_type = 'READ' AND resource_type = 'patient' AND resource_id = '1' 
ORDER BY created_at DESC 
LIMIT 1;
"

# Test transaction rollback on audit failure
# Manually break audit_logs table (simulate constraint violation)
psql -U postgres -d upaci -c "
ALTER TABLE audit_logs ADD CONSTRAINT test_fail CHECK (user_id > 0);
UPDATE users SET id = -1 WHERE id = 1;  -- Force negative user_id
"

# Try operation with user -1
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer $TOKEN_INVALID_USER" \
  -H "Content-Type: application/json" \
  -d '{"patient_id":1,"department_id":1,"appointment_date":"2026-04-01T11:00:00Z"}'
# Expected: 500 error, "Audit logging failed", appointment NOT created

# Check audit_error_logs for failure
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_error_logs ORDER BY created_at DESC LIMIT 1;
"
# Expected: 1 row with error details

# Revert test changes
psql -U postgres -d upaci -c "
ALTER TABLE audit_logs DROP CONSTRAINT test_fail;
UPDATE users SET id = 1 WHERE id = -1;
"

# Run integration tests
npm test -- auditLogging.test.ts
```

## Implementation Validation Strategy
- [ ] Migration applied: audit_logs has INSERT-only permissions
- [ ] Permissions verified: REVOKE UPDATE/DELETE confirmed
- [ ] Audit service created: auditLogger.ts with all log methods
- [ ] Audit middleware integrated: Runs on all protected routes
- [ ] Login audit: Successful login creates audit log with LOGIN action
- [ ] Failed login audit: Invalid credentials logged as FAILED_LOGIN
- [ ] CRUD audit: CREATE/READ/UPDATE/DELETE operations logged
- [ ] Resource identification: resource_type and resource_id correctly extracted
- [ ] User context: user_id and role captured from JWT
- [ ] Request metadata: IP, user_agent, method, path recorded
- [ ] Details field: JSON with request summary, status code
- [ ] Immutability enforced: UPDATE/DELETE on audit_logs fails with permission error
- [ ] Transaction safety: Primary operation rolls back if audit INSERT fails
- [ ] Error logging: Audit failures logged to audit_error_logs
- [ ] 500 error returned: User sees "Audit logging failed" on audit INSERT failure
- [ ] Authorization failures logged: 403 responses create AUTHORIZATION_FAILED audit entry

## Implementation Checklist

### Type Definitions (server/src/types/audit.types.ts)
- [ ] Define AuditAction enum: LOGIN, LOGOUT, CREATE, READ, UPDATE, DELETE, ACCESS, FAILED_LOGIN, AUTHORIZATION_FAILED, PASSWORD_RESET, ACCOUNT_LOCKED
- [ ] Define AuditLogEntry interface: { user_id: number, action_type: AuditAction, resource_type: string, resource_id: string, ip_address: string, user_agent: string, details: object, created_at: Date }
- [ ] Define AuditContext interface: { userId: number, userRole: string, ip: string, userAgent: string }
- [ ] Export all types

### Audit Logger Service (server/src/services/auditLogger.ts)
- [ ] Import pg Client, AuditAction, AuditLogEntry types
- [ ] Implement logAudit(entry: Partial<AuditLogEntry>, client?: Client): Promise<void>
- [ ] If client provided (transaction): Use client for INSERT
- [ ] If no client: Create new connection, INSERT, close
- [ ] SQL: INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, ip_address, user_agent, details, created_at) VALUES (...)
- [ ] Catch INSERT errors: Log to audit_error_logs table instead
- [ ] If audit_error_logs INSERT also fails: Log to console as last resort
- [ ] Implement logLogin(userId: number, context: AuditContext): Promise<void>
- [ ] Call logAudit({ user_id: userId, action_type: AuditAction.LOGIN, resource_type: 'auth', resource_id: userId.toString(), ip_address: context.ip, user_agent: context.userAgent, details: { timestamp: new Date() } })
- [ ] Implement logFailedLogin(email: string, context: AuditContext): Promise<void>
- [ ] Call logAudit with action_type=FAILED_LOGIN, details={ email, reason: 'Invalid credentials' }
- [ ] Implement logCreate(userId: number, resourceType: string, resourceId: string, context: AuditContext, details?: object): Promise<void>
- [ ] Implement logRead(userId: number, resourceType: string, resourceId: string, context: AuditContext): Promise<void>
- [ ] Implement logUpdate(userId: number, resourceType: string, resourceId: string, context: AuditContext, changes?: object): Promise<void>
- [ ] Implement logDelete(userId: number, resourceType: string, resourceId: string, context: AuditContext): Promise<void>
- [ ] Implement logAuthorizationFailure(userId: number, path: string, userRole: string, requiredRoles: string[], context: AuditContext): Promise<void>
- [ ] Implement logSecurityEvent(userId: number, eventType: string, details: object, context: AuditContext): Promise<void>
- [ ] Export all methods

### Request Context Utility (server/src/utils/requestContext.ts)
- [ ] Implement extractAuditContext(req: AuthRequest): AuditContext
- [ ] Extract userId: req.user?.userId || req.user?.id || null
- [ ] Extract userRole: req.user?.role || 'unauthenticated'
- [ ] Extract IP: req.ip || req.connection.remoteAddress || 'unknown'
- [ ] Extract userAgent: req.headers['user-agent'] || 'unknown'
- [ ] Return { userId, userRole, ip, userAgent }

### Action Mapper Utility (server/src/utils/actionMapper.ts)
- [ ] Implement mapHttpMethodToAction(method: string, path: string): AuditAction
- [ ] If method === 'POST': return AuditAction.CREATE
- [ ] If method === 'GET': return AuditAction.READ
- [ ] If method === 'PUT' || method === 'PATCH': return AuditAction.UPDATE
- [ ] If method === 'DELETE': return AuditAction.DELETE
- [ ] Default: return AuditAction.ACCESS
- [ ] Implement extractResourceInfo(path: string, params: object): { resourceType: string, resourceId: string }
- [ ] Parse path: /api/:resource/:id → extract resource and id
- [ ] Example: /api/patients/123 → { resourceType: 'patient', resourceId: '123' }
- [ ] If no ID in path: resourceId = 'collection'
- [ ] Export functions

### Audit Middleware (server/src/middleware/auditMiddleware.ts)
- [ ] Import auditLogger, extractAuditContext, mapHttpMethodToAction, extractResourceInfo
- [ ] Implement auditMiddleware: async (req: AuthRequest, res: Response, next: NextFunction) => {}
- [ ] Store start time: const startTime = Date.now()
- [ ] Override res.json to capture response: const originalJson = res.json.bind(res)
- [ ] res.json = (body) => { /* capture response */ return originalJson(body); }
- [ ] On response finish: res.on('finish', async () => {})
- [ ] Generate audit log if user authenticated (skip public endpoints)
- [ ] Extract context: const context = extractAuditContext(req)
- [ ] Map action: const action = mapHttpMethodToAction(req.method, req.path)
- [ ] Extract resource: const { resourceType, resourceId } = extractResourceInfo(req.path, req.params)
- [ ] Build details: { method: req.method, path: req.path, status_code: res.statusCode, duration: Date.now() - startTime, query: req.query }
- [ ] Call auditLogger.logAudit({ user_id: context.userId, action_type: action, resource_type: resourceType, resource_id: resourceId, ip_address: context.ip, user_agent: context.userAgent, details })
- [ ] Catch errors: Log to console (don't fail response)
- [ ] Call next()

### Modify Authentication Middleware (server/src/middleware/authenticate.ts)
- [ ] Import auditLogger, extractAuditContext
- [ ] On successful JWT validation: Call auditLogger.logLogin(userId, context)
- [ ] On JWT validation failure: Call auditLogger.logSecurityEvent(null, 'INVALID_TOKEN', { token: req.headers.authorization, error: err.message }, context)
- [ ] Export modified authenticate

### Database Migration: Permissions (database/migrations/XXX_audit_logs_permissions.sql)
- [ ] -- Migration: Revoke UPDATE/DELETE on audit_logs
- [ ] REVOKE UPDATE, DELETE ON audit_logs FROM upaci_user;
- [ ] GRANT INSERT, SELECT ON audit_logs TO upaci_user;
- [ ] Comment: Makes audit_logs immutable at database level

### Database Migration: Error Logs (database/migrations/XXX_audit_error_logs_table.sql)
- [ ] CREATE TABLE audit_error_logs (
- [ ]   id SERIAL PRIMARY KEY,
- [ ]   error_message TEXT NOT NULL,
- [ ]   attempted_entry JSONB,
- [ ]   stack_trace TEXT,
- [ ]   created_at TIMESTAMPTZ DEFAULT NOW()
- [ ] );
- [ ] Comment: Fallback table when audit_logs INSERT fails

### Route Integration (Apply to all protected routes)
- [ ] Modify server/src/routes/patients.routes.ts: Add auditMiddleware after authenticate
- [ ] router.use(authenticate, auditMiddleware);
- [ ] Modify server/src/routes/appointments.routes.ts: Add auditMiddleware after authenticate
- [ ] Modify server/src/routes/admin.routes.ts: Add auditMiddleware after authenticate
- [ ] Verify order: authenticate → authorize → auditMiddleware → controller

### Integration Tests (server/tests/integration/auditLogging.test.ts)
- [ ] Test: "login creates audit log with LOGIN action"
- [ ] Test: "failed login creates FAILED_LOGIN audit"
- [ ] Test: "POST /appointments creates CREATE audit"
- [ ] Test: "GET /patients/:id creates READ audit"
- [ ] Test: "PUT /patients/:id creates UPDATE audit"
- [ ] Test: "DELETE /appointments/:id creates DELETE audit"
- [ ] Test: "403 response creates AUTHORIZATION_FAILED audit"
- [ ] Test: "audit log includes user_id, IP, user_agent"
- [ ] Test: "resource_type and resource_id correctly extracted"
- [ ] Test: "UPDATE audit_logs fails with permission denied"
- [ ] Test: "DELETE audit_logs fails with permission denied"
- [ ] Test: "audit INSERT failure logs to audit_error_logs"
- [ ] Test: "audit details field contains request summary"
- [ ] Test: "public endpoints do not create audit logs"

### Documentation (server/docs/AUDIT_LOGGING.md)
- [ ] Document audit log structure (all fields)
- [ ] Document supported actions (LOGIN, CREATE, READ, UPDATE, DELETE, etc.)
- [ ] Document automatic audit middleware (how it works)
- [ ] Document manual audit logging (when to use service directly)
- [ ] Document immutability guarantee (INSERT-only permissions)
- [ ] Document error handling (audit_error_logs fallback)
- [ ] Document retention policy (7 years, see US_011 TASK_002)
- [ ] Document querying audit logs (example queries for reports)
- [ ] Document HIPAA compliance features

### Validation and Testing
- [ ] Start server: npm run dev
- [ ] Login and verify audit: Check audit_logs for LOGIN entry
- [ ] Create resource and verify: Check CREATE audit with resource_type
- [ ] Read resource and verify: Check READ audit
- [ ] Update resource and verify: Check UPDATE audit
- [ ] Delete resource and verify: Check DELETE audit
- [ ] Test immutability: Attempt UPDATE on audit_logs → permission denied
- [ ] Test transaction: Simulate audit failure, verify primary operation rolled back
- [ ] Test audit_error_logs: Force audit failure, verify fallback logging
- [ ] Run integration tests: npm test -- auditLogging.test.ts → all pass
