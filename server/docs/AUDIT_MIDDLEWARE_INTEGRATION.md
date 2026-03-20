# Audit Middleware Integration Example

## File: server/src/routes/appointments.routes.ts

### Before:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All appointment routes require authentication
router.use(authenticateToken);

// Routes...
router.get('/', handler);
router.post('/', handler);
```

### After (with audit middleware):
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { auditMiddleware } from '../middleware/auditMiddleware'; // ADD THIS

const router = Router();

// All appointment routes require authentication
router.use(authenticateToken);

// ADD AUDIT MIDDLEWARE AFTER AUTHENTICATION
router.use(auditMiddleware);

// Routes... (no changes needed)
router.get('/', handler);
router.post('/', handler);
```

## Integration Pattern

The audit middleware should be applied **after** authentication middleware:

```
Request Flow:
1. authenticateToken → Validates JWT, attaches req.user
2. auditMiddleware → Logs audit entry with user context
3. authorize (if needed) → Checks role permissions
4. Route handler → Business logic
```

## Files to Update

Apply the same pattern to these route files:

1. ✅ **server/src/routes/appointments.routes.ts**
   ```diff
   + import { auditMiddleware } from '../middleware/auditMiddleware';
   
   router.use(authenticateToken);
   + router.use(auditMiddleware);
   ```

2. ✅ **server/src/routes/patients.routes.ts**
   ```diff
   + import { auditMiddleware } from '../middleware/auditMiddleware';
   
   router.use(authenticateToken);
   + router.use(auditMiddleware);
   ```

3. ⚠️ **server/src/routes/auth.routes.ts**
   - **DO NOT add audit middleware here**
   - Auth routes (login, register) are already logged by auditLogger
   - Adding middleware would create duplicate logs

4. ⚠️ **server/src/routes/metrics.routes.ts**
   - **DO NOT add audit middleware here**
   - Metrics/health endpoints should not be audited
   - auditMiddleware already skips these paths

## Route-Specific Audit Logging

For routes that need manual audit logging (not covered by middleware):

```typescript
import { logCreate, logUpdate, logDelete } from '../utils/auditLogger';
import { extractAuditContext } from '../utils/requestContext';

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Business logic
    const result = await createAppointment(data, client);
    
    // Manual audit logging (transaction-safe)
    const context = extractAuditContext(req);
    await logCreate(
      req.user.userId,
      'appointments',
      result.id,
      result,
      context,
      client // Pass client for transaction
    );
    
    await client.query('COMMIT');
    res.json({ success: true, data: result });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
```

## Configuration Options

### Skip Successful Reads (Reduce Log Volume)

```typescript
import { createAuditMiddleware } from '../middleware/auditMiddleware';

const customAuditMiddleware = createAuditMiddleware({
  skipSuccessfulReads: true, // Don't log successful GET requests
});

router.use(authenticateToken);
router.use(customAuditMiddleware);
```

### Selective Auditing

```typescript
import { selectiveAuditMiddleware } from '../middleware/auditMiddleware';
import { AuditAction } from '../types/audit.types';

// Only audit CREATE, UPDATE, DELETE (not READ)
router.use(authenticateToken);
router.use(selectiveAuditMiddleware([
  AuditAction.CREATE,
  AuditAction.UPDATE,
  AuditAction.DELETE,
]));
```

## Verification

After integration, verify audit logging works:

```bash
# 1. Start server
npm run dev

# 2. Make authenticated request
curl -X GET http://localhost:3001/api/appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Check audit logs
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs 
WHERE action = 'READ' 
  AND table_name = 'appointments' 
ORDER BY timestamp DESC 
LIMIT 5;
"

# Expected: 1 row with your request details
```

## Troubleshooting

### Issue: Audit logs not appearing

**Check:**
1. Is `authenticateToken` applied before `auditMiddleware`?
2. Is the request authenticated (has valid JWT)?
3. Check `skipPublicEndpoints` config (default: true)
4. Check application logs for audit errors

### Issue: Duplicate audit logs

**Cause:** Audit middleware applied AND manual `logAuditEntry()` called

**Fix:** Use middleware OR manual logging, not both:
- Use middleware for standard CRUD operations
- Use manual logging for complex transactions

### Issue: Audit INSERT fails with permission error

**Cause:** Database permissions not applied (migration V008)

**Fix:**
```bash
# Apply migrations
cd database
npm run migrate up

# Verify permissions
psql -U postgres -d upaci -c "
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name='audit_logs';
"
# Expected: upaci_user has INSERT, SELECT only
```

## Notes

- ✅ Audit middleware is **non-blocking** - failures don't break requests
- ✅ PII is **automatically redacted** via `redactPII()` function
- ✅ Audit failures are logged to `audit_error_logs` table
- ✅ Transaction-safe when using `client` parameter
- ⚠️ Configure `skipSuccessfulReads` to reduce log volume in production
- ⚠️ Monitor `audit_error_logs` regularly for failures
