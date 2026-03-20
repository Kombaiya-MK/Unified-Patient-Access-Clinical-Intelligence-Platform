# Audit Logging System Documentation

**Task**: US_011 TASK_001 - Immutable Audit Logging Service  
**Version**: 1.0.0  
**Last Updated**: 2026-03-18  
**Status**: ✅ Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Audit Actions](#audit-actions)
4. [Database Schema](#database-schema)
5. [Implementation](#implementation)
6. [Usage Examples](#usage-examples)
7. [PII Redaction](#pii-redaction)
8. [Transaction Safety](#transaction-safety)
9. [Error Handling](#error-handling)
10. [Querying Audit Logs](#querying-audit-logs)
11. [HIPAA Compliance](#hipaa-compliance)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Audit Logging?

The audit logging system captures all user actions and system events in an immutable audit trail. Every API request, authentication attempt, authorization failure, and security event is logged with comprehensive metadata for compliance, security monitoring, and debugging.

### Why Immutable Audit Logging?

- **HIPAA Compliance** (NFR-003, NFR-005): Healthcare systems must maintain immutable audit trails for 7 years
- **Security Monitoring**: Detect unauthorized access attempts, brute force attacks, and privilege escalation
- **Forensic Analysis**: Investigate security incidents with complete action history
- **Regulatory Requirements**: Meet NIST, SOC 2, and healthcare compliance standards
- **Accountability**: Track all changes to sensitive patient data

### Key Features

✅ **Comprehensive Coverage**: All CRUD operations, authentication, authorization, security events  
✅ **Immutable**: INSERT-only permissions, triggers prevent UPDATE/DELETE  
✅ **PII Redaction**: Automatic redaction of sensitive fields (names, emails, SSNs)  
✅ **Transaction-Safe**: Audit failures rollback primary operations  
✅ **Non-Blocking Middleware**: Automatic audit logging without code changes  
✅ **Fallback Logging**: audit_error_logs table when primary logging fails  
✅ **7-Year Retention**: Designed for long-term compliance storage  

---

## Architecture

### Component Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      API Request                              │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│              authenticate() Middleware                        │
│  • Verify JWT                                                │
│  • Attach req.user                                           │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│              auditMiddleware                                  │
│  • Extract context (user, IP, user-agent)                    │
│  • Map HTTP method to audit action                           │
│  • Extract resource type and ID                              │
│  • Redact PII from request body                              │
│  • Log to audit_logs table                                   │
│  • On failure → log to audit_error_logs                      │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│              authorize() Middleware (if needed)               │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│              Route Handler                                    │
│  • Business logic                                            │
│  • Manual audit logging (for transactions)                   │
└──────────────────────────────────────────────────────────────┘
```

### File Structure

```
server/
├── src/
│   ├── types/
│   │   └── audit.types.ts                # Audit type definitions
│   ├── utils/
│   │   ├── auditLogger.ts                # Core audit logging service
│   │   ├── requestContext.ts             # Extract request context
│   │   └── actionMapper.ts               # Map HTTP to audit actions
│   ├── middleware/
│   │   └── auditMiddleware.ts            # Automatic audit middleware
│   └── routes/
│       └── *.routes.ts                   # Apply audit middleware
├── docs/
│   ├── AUDIT_LOGGING.md                  # This file
│   └── AUDIT_MIDDLEWARE_INTEGRATION.md   # Integration guide
└── database/
    └── migrations/
        ├── V008__audit_logs_permissions.sql      # INSERT-only permissions
        └── V009__create_audit_error_logs_table.sql  # Fallback table
```

---

## Audit Actions

### Authentication Events

| Action | Description | Triggered By |
|--------|-------------|--------------|
| `LOGIN` | Successful authentication | authService.login() |
| `FAILED_LOGIN` | Failed login attempt | authService.login() |
| `LOGOUT` | User logout | authService.logout() |
| `TOKEN_EXPIRED` | Expired token usage | authenticate middleware |
| `TOKEN_INVALID` | Invalid token format | authenticate middleware |
| `PASSWORD_RESET` | Password reset initiated | Password reset flow |
| `PASSWORD_CHANGED` | Password changed | Password change endpoint |

### CRUD Operations

| Action | Description | HTTP Method | Example |
|--------|-------------|-------------|---------|
| `CREATE` | Resource created | POST | POST /api/patients |
| `READ` | Resource accessed | GET | GET /api/patients/123 |
| `UPDATE` | Resource modified | PUT, PATCH | PUT /api/patients/123 |
| `DELETE` | Resource deleted | DELETE | DELETE /api/patients/123 |

### Authorization Events

| Action | Description | Triggered By |
|--------|-------------|--------------|
| `AUTHORIZATION_FAILED` | Insufficient permissions | authorize() middleware |
| `MISSING_ROLE_CLAIM` | JWT missing role field | roleValidator middleware |
| `INVALID_ROLE_CLAIM` | JWT has invalid role | roleValidator middleware |

### Security Events

| Action | Description | Triggered By |
|--------|-------------|--------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Rate limiter middleware |
| `DISTRIBUTED_ATTACK` | Attack from multiple IPs | Brute force detection |
| `ACCOUNT_LOCKED` | Account locked after failed attempts | Brute force detection |

### Special Actions

| Action | Description | HTTP Method | Example |
|--------|-------------|-------------|---------|
| `ACCESS` | General resource access | Any | Generic access logging |
| `SEARCH` | Search operation | GET | GET /api/patients?search=... |
| `EXPORT` | Data export | GET | GET /api/patients/export |

---

## Database Schema

### audit_logs Table

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,                  -- User performing action (nullable)
    action VARCHAR(50) NOT NULL,     -- Audit action type
    table_name VARCHAR(100) NOT NULL,-- Resource type (e.g., 'patients')
    record_id BIGINT,                -- Resource ID (nullable for collections)
    old_values JSONB,                -- Previous values (for UPDATE/DELETE)
    new_values JSONB,                -- New values (for CREATE/UPDATE)
    ip_address INET,                 -- Client IP address
    user_agent TEXT,                 -- User-Agent header
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- `id`: Auto-incrementing BIGSERIAL for billions of records
- `user_id`: Nullable for unauthenticated events
- `action`: Audit action from AuditAction enum
- `table_name`: Resource type (maps to database tables)
- `record_id`: Specific resource ID (null for collections)
- `old_values`: JSONB with PII redacted (for audit trails)
- `new_values`: JSONB with request metadata and details
- `ip_address`: INET type for efficient storage
- `timestamp`: Auto-set timestamp (indexed)

**Constraints:**
- PRIMARY KEY on `id`
- NOT NULL on `action`, `table_name`, `timestamp`
- No foreign key constraints (audit logs outlive records)

**Permissions:**
```sql
GRANT INSERT, SELECT ON audit_logs TO upaci_user;
REVOKE UPDATE, DELETE ON audit_logs FROM upaci_user;
```

**Triggers:**
- `trigger_prevent_audit_update`: Blocks UPDATE operations
- `trigger_prevent_audit_delete`: Blocks DELETE operations

### audit_error_logs Table

Fallback table when audit_logs INSERT fails:

```sql
CREATE TABLE audit_error_logs (
    id BIGSERIAL PRIMARY KEY,
    error_message TEXT NOT NULL,
    attempted_entry JSONB,
    stack_trace TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    severityVARCHAR(20) DEFAULT 'ERROR',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by INTEGER,
    resolution_notes TEXT
);
```

**Purpose:**
- Capture audit logging failures for investigation
- Prevent complete loss of audit trail
- Track error patterns and resolution

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- JSONB indexes for querying
CREATE INDEX idx_audit_logs_old_values ON audit_logs USING gin (old_values);
CREATE INDEX idx_audit_logs_new_values ON audit_logs USING gin (new_values);
```

---

## Implementation

### Type Definitions

**File:** `server/src/types/audit.types.ts`

```typescript
export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  // ...more actions
}

export interface AuditLogEntry {
  id?: number;
  user_id: number | null;
  action: AuditAction | string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string;
  user_agent: string;
  timestamp?: Date;
}

export interface AuditContext {
  userId: number | null;
  userRole: string | null;
  ip: string;
  userAgent: string;
}
```

### Core Audit Logger

**File:** `server/src/utils/auditLogger.ts`

```typescript
import { pool } from '../config/database';
import { AuditLogEntry, AuditContext, A uditAction } from '../types/audit.types';
import { Client } from 'pg';

/**
 * Log Audit Entry
 * Core function for logging all audit events
 */
export async function logAuditEntry(
  entry: Partial<AuditLogEntry>,
  client?: Client,
): Promise<void> {
  // Redact PII
  const redactedOldValues = entry.old_values ? redactPII(entry.old_values) : null;
  const redactedNewValues = entry.new_values ? redactPII(entry.new_values) : null;
  
  const query = `
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id,
      old_values, new_values, ip_address, user_agent, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  `;
  
  const values = [
    entry.user_id || null,
    entry.action || AuditAction.ACCESS,
    entry.table_name || 'unknown',
    entry.record_id || null,
    redactedOldValues ? JSON.stringify(redactedOldValues) : null,
    redactedNewValues ? JSON.stringify(redactedNewValues) : null,
    entry.ip_address || 'unknown',
    entry.user_agent || 'unknown',
  ];
  
  try {
    if (client) {
      await client.query(query, values);
    } else {
      await pool.query(query, values);
    }
  } catch (error) {
    await logToErrorTable(error, entry);
    throw new Error('Audit logging failed');
  }
}

/**
 * Log CREATE Operation
 */
export async function logCreate(
  userId: number,
  tableName: string,
  recordId: string,
  newValues: Record<string, any>,
  context: AuditContext,
  client?: Client,
): Promise<void> {
  await logAuditEntry({
    user_id: userId,
    action: AuditAction.CREATE,
    table_name: tableName,
    record_id: recordId,
    old_values: null,
    new_values: newValues,
    ip_address: context.ip,
    user_agent: context.userAgent,
  }, client);
}

// ...more functions (logRead, logUpdate, logDelete, etc.)
```

### Audit Middleware

**File:** `server/src/middleware/auditMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { extractAuditContext } from '../utils/requestContext';
import { mapHttpMethodToAction, extractResourceInfo } from '../utils/actionMapper';
import { logAuditEntry } from '../utils/auditLogger';

export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const startTime = Date.now();
  const context = extractAuditContext(req);
  
  // Log after response finishes
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const action = mapHttpMethodToAction(req.method, req.path);
    const { resourceType, resourceId } = extractResourceInfo(req.path, req.params);
    
    await logAuditEntry({
      user_id: context.userId,
      action,
      table_name: resourceType,
      record_id: resourceId,
      new_values: {
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        duration,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });
  
  next();
};
```

---

## Usage Examples

### Automatic Audit Logging (Middleware)

Apply audit middleware after authentication:

```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { auditMiddleware } from '../middleware/auditMiddleware';

const router = Router();

router.use(authenticateToken);  // 1. Authenticate first
router.use(auditMiddleware);    // 2. Then audit

router.get('/patients', getPatientsHandler);
router.post('/patients', createPatientHandler);
// All routes automatically audited
```

### Manual Audit Logging (Transactions)

For operations requiring transaction safety:

```typescript
import { logCreate } from '../utils/auditLogger';
import { extractAuditContext } from '../utils/requestContext';

router.post('/patients', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    //1. Create patient
    const result = await client.query(
      'INSERT INTO patients (...) VALUES (...) RETURNING *',
      values
    );
    
    // 2. Log audit entry (transaction-safe)
    const context = extractAuditContext(req);
    await logCreate(
      req.user.userId,
      'patients',
      result.rows[0].id,
      result.rows[0],
      context,
      client  // Pass client for transaction
    );
    
    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    // Audit failure rolls back patient creation
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
```

### Logging Specific Events

```typescript
import { 
  logLogin, 
  logLogout, 
  logAuthorizationFailure,
  logSecurityEvent,
} from '../utils/auditLogger';

// Login event
await logLogin(userId, ipAddress, userAgent);

// Logout event
await logLogout(userId, ipAddress, userAgent);

// Authorization failure
await logAuthorizationFailure(
  userId,
  req.path,
  userRole,
  requiredRoles,
  context
);

// Security event
await logSecurityEvent(
  userId,
  'SUSPICIOUS_ACTIVITY',
  { reason: 'Multiple failed logins', count: 10 },
  context
);
```

---

## PII Redaction

### What is PII?

Personally Identifiable Information (PII) includes:
- Names (first_name, last_name, full_name)
- Email addresses
- Social Security Numbers (SSN)
- Phone numbers
- Physical addresses
- Dates of birth

### Automatic Redaction

The `redactPII()` function automatically redacts PII before logging:

```typescript
const redactedFields = [
  'email', 'first_name', 'last_name', 'full_name',
  'ssn', 'social_security_number', 'phone_number',
  'phone', 'address', 'street', 'city', 'zip',
  'date_of_birth', 'dob', 'birth_date',
];

export function redactPII(data: any): any {
  if (typeof data !== 'object') return data;
  
  const redacted: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (redactedFields.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactPII(value); // Recursive
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}
```

### Example

**Before redaction:**
```json
{
  "patient_id": 123,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "ssn": "123-45-6789"
}
```

**After redaction:**
```json
{
  "patient_id": 123,
  "first_name": "[REDACTED]",
  "last_name": "[REDACTED]",
  "email": "[REDACTED]",
  "ssn": "[REDACTED]"
}
```

**Safe identifiers preserved:**
- `patient_id`, `user_id`, `appointment_id` (numeric IDs)
- Resource relationships
- Action types and timestamps

---

## Transaction Safety

### The Problem

If audit logging fails AFTER a database operation succeeds, you lose the audit trail:

```typescript
// ❌ BAD: Audit failure doesn't rollback patient creation
await createPatient(data);
await logAuditEntry(...); // If this fails, patient still created!
```

### The Solution

Wrap audit logging in the same transaction:

```typescript
// ✅ GOOD: Audit failure rolls back everything
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  await createPatient(data, client);
  await logAuditEntry(..., client); // Same transaction
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK'); // Both operations rolled back
  throw error;
}
```

### When to Use Transactions

**Use transaction-safe audit logging when:**
- Creating, updating, or deleting sensitive data
- Operations must have an audit trail (regulatory requirement)
- Audit failure should prevent the operation

**Skip transaction-safe audit logging when:**
- Using audit middleware (non-transaction endpoints)
- Read-only operations (less critical)
- High-volume operations where audit failures are tolerable

---

## Error Handling

### Fallback Strategy

When `audit_logs` INSERT fails:

1. **Catch exception** in `logAuditEntry()`
2. **Log to `audit_error_logs`** table
3. **Re-throw error** to rollback transaction
4. **Alert monitoring** (if configured)

```typescript
try {
  await pool.query(insertQuery, values);
} catch (error) {
  // Fallback to error table
  await logToErrorTable(error, attemptedEntry);
  throw new Error('Audit logging failed'); // Rollback transaction
}
```

### Error Table Logging

```typescript
async function logToErrorTable(
  error: Error,
  attemptedEntry: any,
): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO audit_error_logs (
        error_message,
        attempted_entry,
        stack_trace
      ) VALUES ($1, $2, $3)
    `, [
      error.message,
      JSON.stringify(attemptedEntry),
      error.stack,
    ]);
  } catch (errorTableError) {
    // Last resort: console.error
    console.error('CRITICAL: Complete audit logging failure', {
      originalError: error,
      errorTableError,
    });
  }
}
```

### Monitoring

Query unresolved errors:

```sql
SELECT * FROM unresolved_audit_errors
ORDER BY created_at DESC
LIMIT 10;
```

Mark errors resolved:

```sql
SELECT mark_audit_error_resolved(
  error_id := 123,
  resolver_user_id := 1,
  notes := 'Database connectivity issue resolved'
);
```

---

## Querying Audit Logs

### Recent Activity by User

```sql
SELECT 
  id,
  action,
  table_name,
  record_id,
  timestamp,
  ip_address
FROM audit_logs
WHERE user_id = 123
ORDER BY timestamp DESC
LIMIT 20;
```

### Failed Login Attempts (Last 24 Hours)

```sql
SELECT 
  new_values->>'metadata' as email,
  ip_address,
  COUNT(*) as attempts,
  MAX(timestamp) as last_attempt
FROM audit_logs
WHERE action = 'FAILED_LOGIN'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY new_values->>'metadata', ip_address
ORDER BY attempts DESC;
```

### All Actions on Specific Resource

```sql
SELECT 
  user_id,
  action,
  timestamp,
  ip_address,
  old_values,
  new_values
FROM audit_logs
WHERE table_name = 'patients'
  AND record_id = '123'
ORDER BY timestamp ASC;
```

### Authorization Failures (Security Monitoring)

```sql
SELECT 
  user_id,
  new_values->>'path' as endpoint,
  new_values->>'userRole' as user_role,
  new_values->>'requiredRoles' as required_roles,
  COUNT(*) as failure_count,
  MAX(timestamp) as last_attempt
FROM audit_logs
WHERE action = 'AUTHORIZATION_FAILED'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_id, endpoint, user_role, required_roles
HAVING COUNT(*) > 10
ORDER BY failure_count DESC;
```

### Data Changes (Before/After)

```sql
SELECT 
  user_id,
  action,
  timestamp,
  old_values->>'first_name' as old_name,
  new_values->>'first_name' as new_name,
  old_values->>'email' as old_email,
  new_values->>'email' as new_email
FROM audit_logs
WHERE table_name = 'users'
  AND record_id = '456'
  AND action = 'UPDATE'
ORDER BY timestamp DESC;
```

### Audit Report (Compliance)

```sql
SELECT 
  DATE(timestamp) as date,
  action,
  COUNT(*) as count
FROM audit_logs
WHERE timestamp BETWEEN '2026-01-01' AND '2026-12-31'
GROUP BY DATE(timestamp), action
ORDER BY date DESC, count DESC;
```

---

## HIPAA Compliance

### Requirements Met

| Requirement | Implementation | Evidence |
|-------------|----------------|----------|
| **164.308(a)(5)(ii)(C)** - Log-in monitoring | LOGIN, FAILED_LOGIN actions | auth.routes.ts, auditLogger.ts |
| **164.312(b)** - Audit controls | All CRUD operations logged | auditMiddleware.ts |
| **164.312(a)(1)** - Access control | Authorization failures logged | authorize() middleware |
| **164.308(a)(1)(ii)(D)** - Activity review | Query functions for admin review | Querying section |
| **164.310(d)(2)(iii)** - Accountability | User ID tracked in all logs | AuditLogEntry.user_id |
| **164.316(b)(2)(i)** - Retention | 7-year design with partitioning | Migration V008 comments |

### Immutability

- **INSERT-only permissions** (V008 migration)
- **Triggers block UPDATE/DELETE** (prevent_audit_log_modification)
- **No foreign key cascades** (logs outlive records)
- **Separate error table** (fallback without data loss)

### PII Protection

- **Automatic redaction** before INSERT
- **redactPII() function** covers all sensitive fields
- **Only IDs stored** (patient_id, user_id, not names/emails)
- **Metadata redacted** in request/response bodies

### Retention

- **7-year default** (configurable)
- **Table partitioning** by year (future enhancement)
- **Archive strategy** to cold storage (future enhancement)

---

## Troubleshooting

### Issue: Audit logs not appearing

**Symptoms:**
- API requests work but no audit logs
- `audit_logs` table empty

**Diagnosis:**
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'audit_logs'
);

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name='audit_logs';
```

**Solutions:**
1. Run migrations: `npm run migrate up`
2. Verify audit middleware applied: Check route files
3. Check authentication: Audit middleware needs `req.user`
4. Check `auditMiddleware` config: `skipPublicEndpoints` setting

### Issue: Audit INSERT fails with permission error

**Error:**
```
ERROR: permission denied for table audit_logs
```

**Cause:** V008 migration not applied

**Solution:**
```bash
cd database
npm run migrate up
```

**Verify:**
```sql
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name='audit_logs' AND grantee='upaci_user';
-- Should show: INSERT, SELECT only
```

### Issue: UPDATE/DELETE succeeds on audit_logs

**Symptom:** Audit logs can be modified

**Cause:** Triggers not created or disabled

**Solution:**
```sql
-- Check triggers exist
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'audit_logs';

-- Recreate triggers if missing
-- (Run V008 migration again)
```

### Issue: Transaction fails with "Audit logging failed"

**Expected Behavior:** This is correct! Audit failures must rollback transactions.

**Investigation:**
1. Check `audit_error_logs` for failure details
2. Check database connectivity
3. Check `audit_logs` table constraints

```sql
SELECT * FROM audit_error_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

### Issue: High audit log volume

**Symptom:** `audit_logs` table growing too fast

**Solutions:**

1. **Skip successful reads:**
```typescript
const auditMiddleware = createAuditMiddleware({
  skipSuccessfulReads: true,
});
```

2. **Selective auditing:**
```typescript
router.use(selectiveAuditMiddleware([
  AuditAction.CREATE,
  AuditAction.UPDATE,
  AuditAction.DELETE,
]));
```

3. **Archive old logs:**
```sql
-- Move logs older than 1 year to archive table
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '1 year';

DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '1 year';
```

### Issue: PII appearing in audit logs

**Cause:** New PII field not in `PII_FIELDS` array

**Solution:**

Edit `src/types/audit.types.ts`:
```typescript
export const PII_FIELDS = [
  'email', 'first_name', 'last_name',
  'new_field', //  ADD NEW PII FIELD
] as const;
```

**Verify:**
```sql
SELECT new_values 
FROM audit_logs 
WHERE new_values::text LIKE '%sensitive_data%'
LIMIT 5;
-- Should show [REDACTED]
```

---

## Advanced Topics

### Table Partitioning (Future Enhancement)

For massive audit log volumes (millions of records):

```sql
-- Partition by year
CREATE TABLE audit_logs_2026 PARTITION OF audit_logs
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE audit_logs_2027 PARTITION OF audit_logs
FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

### Cold Storage Archival

Move old partitions to cheaper storage:

```sql
-- Detach old partition
ALTER TABLE audit_logs DETACH PARTITION audit_logs_2020;

-- Export to archive
COPY audit_logs_2020 TO '/archive/audit_logs_2020.csv' CSV HEADER;

-- Drop if storage constrained (after backup)
DROP TABLE audit_logs_2020;
```

### Custom Audit Actions

Add application-specific actions:

```typescript
// In audit.types.ts
export enum AuditAction {
  // ...existing actions
  PRESCRIPTION_PRINTED = 'PRESCRIPTION_PRINTED',
  LAB_RESULT_VIEWED = 'LAB_RESULT_VIEWED',
  CONSENT_FORM_SIGNED = 'CONSENT_FORM_SIGNED',
}

// In application code
await logSecurityEvent(
  userId,
  AuditAction.PRESCRIPTION_PRINTED,
  { prescription_id: 123, pharmacy: 'CVS' },
  context
);
```

---

## Appendix

### Related Documentation

- [AUTHENTICATION.md](./AUTHENTICATION.md) - JWT authentication system
- [RBAC_GUIDE.md](./RBAC_GUIDE.md) - Role-based access control
- [RATE_LIMITING.md](./RATE_LIMITING.md) - Rate limiting and brute force protection
- [AUDIT_MIDDLEWARE_INTEGRATION.md](./AUDIT_MIDDLEWARE_INTEGRATION.md) - Integration guide

### Migration Files

- `V008__audit_logs_permissions.sql` - Enforce INSERT-only permissions
- `V009__create_audit_error_logs_table.sql` - Create fallback error table

### Audit Actions Reference

**Authentication:** LOGIN, LOGOUT, FAILED_LOGIN, TOKEN_EXPIRED, TOKEN_INVALID, PASSWORD_RESET, PASSWORD_CHANGED  
**CRUD:** CREATE, READ, UPDATE, DELETE  
**Authorization:** AUTHORIZATION_FAILED, MISSING_ROLE_CLAIM, INVALID_ROLE_CLAIM  
**Security:** RATE_LIMIT_EXCEEDED, DISTRIBUTED_ATTACK, ACCOUNT_LOCKED  
**Special:** ACCESS, SEARCH, EXPORT  
**System:** CONFIGURATION_CHANGED, SYSTEM_ERROR  

---

**Author**: Development Team  
**Task**: US_011 TASK_001 - Immutable Audit Logging Service  
**Date**: 2026-03-18  
**Status**: ✅ Complete
