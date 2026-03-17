# Task - TASK_001_BE_RBAC_MIDDLEWARE

## Requirement Reference
- User Story: US_010
- Story Location: `.propel/context/tasks/us_010/us_010.md`
- Acceptance Criteria:
    - AC1: RBAC middleware extracts role from JWT, checks authorized roles for endpoint, grants access or returns 403 Forbidden
- Edge Cases:
    - Valid JWT but missing role claim: Return 403 "Invalid token: missing role claim", log security event
    - Multi-role endpoints: Accept array of allowed roles `@RequireRoles(['Staff', 'Admin'])`

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

> **Note**: Backend security middleware - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

**Note**: RBAC middleware MUST be compatible with JWT auth from US_009

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI features - authentication/authorization only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend security middleware

## Task Overview
Implement RBAC middleware factory function `requireRole(...allowedRoles)` that: (1) Extracts user role from req.user (set by verifyToken middleware), (2) Checks if user.role is in allowedRoles array, (3) Grants access (calls next()) or returns 403 Forbidden with "Insufficient permissions", (4) Logs failed authorization attempts to audit log (userId, endpoint, attemptedRole, requiredRoles). Supports single role (`requireRole('admin')`) and multiple roles (`requireRole('admin', 'staff')`). Integrates with existing auth middleware from US_009.

## Dependent Tasks
- US_009 Task 001: JWT authentication middleware must exist (verifyToken sets req.user)

## Impacted Components
**New:**
- server/src/middleware/rbac.middleware.ts (requireRole factory function)
- server/src/types/express.d.ts (Extend Express Request type with user: {userId, role, email})

**Modified:**
- server/src/routes/*.routes.ts (Add requireRole to protected endpoints)

## Implementation Plan
1. **Extend Express Request type**: Create server/src/types/express.d.ts to add `user: {userId: string, role: UserRole, email: string}` property
2. **Create requireRole factory**: Function that accepts variable number of role arguments (...allowedRoles: UserRole[])
3. **Implement middleware logic**:
   - Check if req.user exists (set by verifyToken middleware) → if not, return 401 "Unauthorized"
   - Check if req.user.role exists → if not, return 403 "Invalid token: missing role claim" + log security event
   - Check if req.user.role in allowedRoles → if yes, call next()
   - If no match → return 403 "Insufficient permissions. Required roles: [allowedRoles]" + log failed attempt to audit
4. **Add audit logging**: Log failed authorization with {userId, endpoint: req.path, method: req.method, userRole: req.user.role, requiredRoles: allowedRoles, timestamp, ip: req.ip}
5. **Apply to routes**: Update appointment routes to require 'patient' role, queue management to require 'staff', admin endpoints to require 'admin'
6. **Test RBAC**: Create test endpoints for each role, verify patient cannot access staff endpoints (403), staff cannot access admin endpoints

## Current Project State
```
ASSIGNMENT/
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts (verifyToken exists from US_009)
│   │   ├── routes/ (appointments, auth routes exist)
│   │   └── types/ (auth.types exists)
│   └── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/middleware/rbac.middleware.ts | requireRole factory function for role-based access control |
| CREATE | server/src/types/express.d.ts | Extend Express Request interface with user property |
| UPDATE | server/src/routes/appointments.routes.ts | Add requireRole('patient') to booking endpoints |
| UPDATE | server/src/routes/admin.routes.ts | Add requireRole('admin') to admin endpoints (if exists) |
| UPDATE | server/src/types/auth.types.ts | Export UserRole type for reuse |

> Creates 2 new files, updates 3 existing files

## External References
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [OWASP Access Control](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NFR-004 RBAC Enforcement](../../../.propel/context/docs/spec.md#NFR-004)

## Build Commands
```bash
# No new dependencies needed
cd server
npm run dev

# Test RBAC (requires valid JWT tokens for different roles)
# Patient tries staff endpoint → 403
curl http://localhost:3001/api/queue \
  -H "Authorization: Bearer <patient-token>"

# Staff tries admin endpoint → 403
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <staff-token>"

# Admin accesses admin endpoint → 200
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <admin-token>"
```

## Implementation Validation Strategy
- [ ] Unit tests: requireRole('admin') allows admin user, blocks patient user
- [ ] Unit tests: requireRole('admin', 'staff') allows both admin and staff, blocks patient
- [ ] Integration tests: Patient token → staff endpoint → 403 Forbidden
- [ ] RBAC middleware exported: server/src/middleware/rbac.middleware.ts exports requireRole function
- [ ] Express Request type extended: req.user has userId, role, email properties with TypeScript autocompletion
- [ ] Patient endpoint protected: POST /api/appointments requires 'patient' role → patient succeeds, staff/admin blocked
- [ ] Staff endpoint protected: GET /api/queue requires 'staff' role → staff/admin succeed, patient blocked
- [ ] Admin endpoint protected: GET /api/admin/users requires 'admin' role → admin succeeds, patient/staff blocked
- [ ] Multi-role endpoint: Endpoint with requireRole('staff', 'admin') allows both staff and admin
- [ ] Missing role claim: Token without role → 403 "Invalid token: missing role claim"
- [ ] Failed authorization logged: Patient tries admin endpoint → audit_logs has entry with action='authorization_failed', details={requiredRoles: ['admin'], userRole: 'patient'}
- [ ] Error message includes required roles: 403 response body: {"error": "Insufficient permissions. Required roles: admin, staff"}

## Implementation Checklist
- [ ] Create server/src/types/express.d.ts:
  - [ ] `import { UserRole } from './auth.types';`
  - [ ] `declare global { namespace Express { interface Request { user?: { userId: string; email: string; role: UserRole; }; } } }`
- [ ] Update server/src/types/auth.types.ts: Ensure `export type UserRole = 'admin' | 'staff' | 'patient'` is exported
- [ ] Create server/src/middleware/rbac.middleware.ts:
  - [ ] Import UserRole, auditLog (for logging failed attempts)
  - [ ] `export function requireRole(...allowedRoles: UserRole[]) {`
  - [ ]   `return (req: Request, res: Response, next: NextFunction) => {`
  - [ ]     `// Check if user exists (set by verifyToken middleware)`
  - [ ]     `if (!req.user) { return res.status(401).json({ error: 'Unauthorized: No authentication token' }); }`
  - [ ]     `// Check if role claim exists`
  - [ ]     `if (!req.user.role) {`
  - [ ]       `auditLog.create({ userId: req.user.userId, action: 'authorization_failed', details: { reason: 'missing_role_claim' }, ipAddress: req.ip });`
  - [ ]       `return res.status(403).json({ error: 'Invalid token: missing role claim' });`
  - [ ]     `}`
  - [ ]     `// Check if user role is in allowed roles`
  - [ ]     `if (!allowedRoles.includes(req.user.role)) {`
  - [ ]       `auditLog.create({ userId: req.user.userId, action: 'authorization_failed', resourceType: 'endpoint', resourceId: req.path, details: { method: req.method, userRole: req.user.role, requiredRoles: allowedRoles }, ipAddress: req.ip });`
  - [ ]       `return res.status(403).json({ error: \`Insufficient permissions. Required roles: \${allowedRoles.join(', ')}\` });`
  - [ ]     `}`
  - [ ]     `// Authorization successful`
  - [ ]     `next();`
  - [ ]   `};`
  - [ ] `}`
- [ ] Update server/src/routes/appointments.routes.ts:
  - [ ] Import requireRole from '../middleware/rbac.middleware'
  - [ ] POST /appointments: `verifyToken, requireRole('patient'), appointmentsController.bookAppointment`
  - [ ] POST /waitlist: `verifyToken, requireRole('patient'), appointmentsController.joinWaitlist`
- [ ] Create test endpoint for RBAC validation (in a test routes file or add temporarily):
  - [ ] GET /api/test/patient-only: `verifyToken, requireRole('patient'), (req, res) => res.json({ message: 'Patient access granted' })`
  - [ ] GET /api/test/staff-only: `verifyToken, requireRole('staff'), (req, res) => res.json({ message: 'Staff access granted' })`
  - [ ] GET /api/test/admin-only: `verifyToken, requireRole('admin'), (req, res) => res.json({ message: 'Admin access granted' })`
  - [ ] GET /api/test/multi-role: `verifyToken, requireRole('staff', 'admin'), (req, res) => res.json({ message: 'Staff or Admin access granted' })`
- [ ] Test patient role:
  - [ ] Login as patient → get token
  - [ ] `curl http://localhost:3001/api/test/patient-only -H "Authorization: Bearer <patient-token>"` → 200 OK
  - [ ] `curl http://localhost:3001/api/test/staff-only -H "Authorization: Bearer <patient-token>"` → 403 Forbidden
  - [ ] `curl http://localhost:3001/api/test/admin-only -H "Authorization: Bearer <patient-token>"` → 403 Forbidden
- [ ] Test staff role:
  - [ ] Login as staff → get token
  - [ ] `curl http://localhost:3001/api/test/staff-only -H "Authorization: Bearer <staff-token>"` → 200 OK
  - [ ] `curl http://localhost:3001/api/test/multi-role -H "Authorization: Bearer <staff-token>"` → 200 OK
  - [ ] `curl http://localhost:3001/api/test/admin-only -H "Authorization: Bearer <staff-token>"` → 403 Forbidden
- [ ] Test admin role:
  - [ ] Login as admin → get token
  - [ ] `curl http://localhost:3001/api/test/admin-only -H "Authorization: Bearer <admin-token>"` → 200 OK
  - [ ] `curl http://localhost:3001/api/test/multi-role -H "Authorization: Bearer <admin-token>"` → 200 OK
- [ ] Test missing role claim:
  - [ ] Create JWT without role claim (manually using jwt.sign)
  - [ ] `curl http://localhost:3001/api/test/patient-only -H "Authorization: Bearer <no-role-token>"` → 403 "Invalid token: missing role claim"
  - [ ] Verify audit_logs: `SELECT * FROM audit_logs WHERE action = 'authorization_failed'` → has entry with reason='missing_role_claim'
- [ ] Test failed authorization logging:
  - [ ] Patient tries admin endpoint → 403
  - [ ] Query audit_logs: `SELECT * FROM audit_logs WHERE action = 'authorization_failed' AND details->>'userRole' = 'patient'` → has entry with requiredRoles=['admin']
- [ ] Document RBAC in server/README.md:
  - [ ] How to use requireRole middleware
  - [ ] Available roles: patient, staff, admin
  - [ ] Examples of protected endpoints
  - [ ] How to test RBAC with different user roles
