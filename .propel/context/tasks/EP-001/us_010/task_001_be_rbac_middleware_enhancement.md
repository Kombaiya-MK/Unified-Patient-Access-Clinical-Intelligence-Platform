# Task - TASK_001_BE_RBAC_MIDDLEWARE_ENHANCEMENT

## Requirement Reference
- User Story: US_010  
- Story Location: `.propel/context/tasks/us_010/us_010.md`
- Acceptance Criteria:
    - AC1: API request with JWT token, RBAC middleware validates token, extracts role claim, checks authorization for endpoint, grants access or returns 403 Forbidden with "Insufficient permissions"
- Edge Cases:
    - JWT valid but role claim missing: Return 403 with "Invalid token: missing role claim", log security event
    - Multi-role endpoints: Accept array of allowed roles via decorator or route config

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

> **Note**: Backend authorization middleware - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Database | N/A | N/A |
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

> **Note**: Authorization middleware only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Enhance RBAC middleware from US_009 with comprehensive role validation, multi-role support, role hierarchy, missing role claim detection, security event logging, and flexible route configuration. Implement decorator pattern or route config for declaring required roles, support role arrays for endpoints accessible to multiple roles, enforce role hierarchy (admin > staff > patient), and provide clear error messages with audit logging for authorization failures.

## Dependent Tasks
- US_009 TASK_001: JWT authentication and basic RBAC middleware must be implemented

## Impacted Components
**Modified:**
- server/src/middleware/authorize.ts (Enhance from US_009 with multi-role, hierarchy, validation)

**New:**
- server/src/utils/roleHierarchy.ts (Role hierarchy and comparison utilities)
- server/src/decorators/requireRoles.ts (TypeScript decorator for route role requirements)
- server/src/types/rbac.types.ts (Role enums, RoleConfig, PermissionMatrix interfaces)
- server/src/utils/permissionChecker.ts (Centralized permission validation logic)
- server/src/middleware/roleValidator.ts (Validate role claim in JWT)
- server/docs/RBAC_GUIDE.md (Role-based access control documentation)
- server/tests/integration/rbac.test.ts (Comprehensive RBAC tests)

## Implementation Plan
1. **Role Enum**: Define UserRole enum (ADMIN, STAFF, PATIENT) in TypeScript
2. **Role Hierarchy**: Implement hierarchy where ADMIN > STAFF > PATIENT (admin can access all, staff can access staff+patient, patient only patient)
3. **Multi-Role Support**: Middleware accepts array of roles: authorize(['admin', 'staff'])
4. **Role Validation**: Check if req.user.role exists in JWT payload, return 403 if missing
5. **Permission Matrix**: Optional configuration file mapping endpoints to required roles
6. **Decorator Pattern**: @RequireRoles(['admin']) decorator for cleaner route definitions (if using TypeScript decorators)
7. **Security Logging**: Log all authorization failures to audit_logs table
8. **Error Messages**: Clear 403 responses with specific reason (insufficient permissions, missing role, invalid role)
9. **Wildcard Permissions**: Support * for public endpoints, ** for authenticated (any role)
10. **Resource-based Permissions**: Optional: Check if user has permission for specific resource (e.g., patient can only access their own records)
11. **Testing**: Comprehensive tests for all role combinations and edge cases
12. **Documentation**: RBAC guide with examples, role matrix, best practices

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002-009)
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── authenticate.ts  # JWT validation (US_009)
│   │   │   └── authorize.ts     # Basic RBAC (US_009) - TO ENHANCE
│   │   └── services/
└── database/                # Database setup
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/types/rbac.types.ts | UserRole enum, RoleConfig, PermissionMatrix, AuthorizationError interfaces |
| CREATE | server/src/utils/roleHierarchy.ts | Role hierarchy logic, hasRole(), canAccessRole() functions |
| CREATE | server/src/utils/permissionChecker.ts | checkPermission(user, requiredRoles), isAuthorized() |
| CREATE | server/src/middleware/roleValidator.ts | Validate role claim exists in JWT, log security events |
| MODIFY | server/src/middleware/authorize.ts | Enhance with multi-role, hierarchy, validation, error handling |
| CREATE | server/src/decorators/requireRoles.ts | @RequireRoles() decorator for route definitions |
| CREATE | server/src/config/permissions.ts | Permission matrix configuration (optional centralized config) |
| CREATE | server/docs/RBAC_GUIDE.md | Role definitions, hierarchy, usage examples, permission matrix |
| CREATE | server/tests/integration/rbac.test.ts | Test all role combinations, edge cases, hierarchy enforcement |

> 1 modified file, 8 new files created

## External References
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [JWT Claims](https://datatracker.ietf.org/doc/html/rfc7519#section-4)
- [HTTP 403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)

## Build Commands
```bash
# Start development server
cd server
npm run dev

# Test RBAC with different roles

# Test 1: Admin accessing admin endpoint
TOKEN_ADMIN="<admin-jwt-token>"
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: 200 OK with user list

# Test 2: Staff accessing admin endpoint
TOKEN_STAFF="<staff-jwt-token>"
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $TOKEN_STAFF"
# Expected: 403 Forbidden, {"error":"Insufficient permissions. Required role: admin"}

# Test 3: Patient accessing staff endpoint
TOKEN_PATIENT="<patient-jwt-token>"
curl http://localhost:3001/api/staff/queue \
  -H "Authorization: Bearer $TOKEN_PATIENT"
# Expected: 403 Forbidden, {"error":"Insufficient permissions. Required roles: staff, admin"}

# Test 4: Multi-role endpoint (staff OR admin)
curl http://localhost:3001/api/appointments/manage \
  -H "Authorization: Bearer $TOKEN_STAFF"
# Expected: 200 OK (staff allowed)

curl http://localhost:3001/api/appointments/manage \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: 200 OK (admin allowed)

curl http://localhost:3001/api/appointments/manage \
  -H "Authorization: Bearer $TOKEN_PATIENT"
# Expected: 403 Forbidden

# Test 5: Role hierarchy (admin can access staff endpoints)
curl http://localhost:3001/api/staff/dashboard \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# Expected: 200 OK (admin has staff privileges through hierarchy)

# Test 6: Missing role claim
TOKEN_NO_ROLE="<jwt-with-no-role-claim>"
curl http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer $TOKEN_NO_ROLE"
# Expected: 403 Forbidden, {"error":"Invalid token: missing role claim"}

# Test 7: Invalid role value
TOKEN_INVALID_ROLE="<jwt-with-role=invalid>"
curl http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer $TOKEN_INVALID_ROLE"
# Expected: 403 Forbidden, {"error":"Invalid role: invalid"}

# Test 8: Resource-based permission (patient accessing own record)
curl http://localhost:3001/api/patients/1/profile \
  -H "Authorization: Bearer $TOKEN_PATIENT"
# Expected: 200 OK if patient.id === 1, 403 if patient.id !== 1

# Check audit logs for authorization failures
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs 
WHERE action = 'AUTHORIZATION_FAILED' 
ORDER BY created_at DESC 
LIMIT 10;
"

# Run RBAC tests
npm test -- rbac.test.ts
```

## Implementation Validation Strategy
- [ ] Unit tests pass (role hierarchy, permission checker)
- [ ] Integration tests pass (full RBAC flow with all role combinations)
- [ ] Role enum defined: ADMIN, STAFF, PATIENT
- [ ] Authorize middleware enhanced: Accepts array of roles
- [ ] Multi-role support works: authorize(['admin', 'staff']) allows either role
- [ ] Role hierarchy enforced: Admin can access staff endpoints
- [ ] Role validation: Missing role claim → 403 with specific error
- [ ] Invalid role: JWT with invalid role value → 403
- [ ] Security logging: Authorization failures logged to audit_logs
- [ ] Error messages clear: 403 response includes required role(s) and reason
- [ ] Resource-based permissions: Patient can only access own records
- [ ] Decorator pattern works: @RequireRoles(['admin']) on route
- [ ] Permission matrix: Centralized config mapping endpoints to roles
- [ ] Public endpoints: authorize([]) or authorize(['*']) allows all
- [ ] Authenticated endpoints: authorize(['**']) requires any authenticated user
- [ ] All role combinations tested: admin/staff/patient across all endpoint types

## Implementation Checklist

### Type Definitions (server/src/types/rbac.types.ts)
- [ ] Define UserRole enum: export enum UserRole { ADMIN = 'admin', STAFF = 'staff', PATIENT = 'patient' }
- [ ] Define RoleConfig interface: { allowedRoles: UserRole[], requireAll?: boolean, resourceBased?: boolean }
- [ ] Define PermissionMatrix interface: { [endpoint: string]: { method: string, roles: UserRole[] }[] }
- [ ] Define AuthorizationError class: extends Error with statusCode, requiredRoles, userRole fields
- [ ] Define ResourcePermission interface: { resourceType: string, resourceId: string | number, ownerId: number }
- [ ] Export all types and enum

### Role Hierarchy Utility (server/src/utils/roleHierarchy.ts)
- [ ] Define role hierarchy: const roleHierarchy = { admin: 3, staff: 2, patient: 1 }
- [ ] Implement getRoleLevel(role: UserRole): number
- [ ] Return roleHierarchy[role] or 0 if invalid
- [ ] Implement hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean
- [ ] Return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
- [ ] Implement canAccessRole(userRole: UserRole, requiredRoles: UserRole[]): boolean
- [ ] Check if userRole matches any required role OR has higher hierarchy level
- [ ] Return requiredRoles.some(role => userRole === role || hasHigherOrEqualRole(userRole, role))
- [ ] Implement isValidRole(role: string): boolean
- [ ] Return Object.values(UserRole).includes(role as UserRole)
- [ ] Export all functions

### Permission Checker Utility (server/src/utils/permissionChecker.ts)
- [ ] Import types, roleHierarchy
- [ ] Implement checkPermission(userRole: UserRole, requiredRoles: UserRole[]): { authorized: boolean, reason?: string }
- [ ] If requiredRoles is empty or includes '*': return { authorized: true }
- [ ] If requiredRoles includes '**' (any authenticated): return { authorized: true }
- [ ] If canAccessRole(userRole, requiredRoles): return { authorized: true }
- [ ] Else: return { authorized: false, reason: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}` }
- [ ] Implement checkResourceOwnership(userId: number, resource: ResourcePermission): boolean
- [ ] Return userId === resource.ownerId
- [ ] Implement isAuthorized(user: { id: number, role: UserRole }, config: RoleConfig, resource?: ResourcePermission): { authorized: boolean, reason?: string }
- [ ] First check role permissions: const roleCheck = checkPermission(user.role, config.allowedRoles)
- [ ] If not authorized by role: return roleCheck
- [ ] If config.resourceBased && resource: Check ownership
- [ ] If !checkResourceOwnership(user.id, resource): return { authorized: false, reason: 'Access denied: not resource owner' }
- [ ] return { authorized: true }
- [ ] Export functions

### Role Validator Middleware (server/src/middleware/roleValidator.ts)
- [ ] Import types, isValidRole, auditLogger
- [ ] Implement validateRoleClaim middleware: (req: AuthRequest, res: Response, next: NextFunction) => {}
- [ ] Check if req.user exists (authenticate middleware must run first)
- [ ] If !req.user: return next() // authenticate middleware will handle
- [ ] Check if role claim exists: if (!req.user.role)
- [ ] await auditLogger.logSecurityEvent('MISSING_ROLE_CLAIM', { userId: req.user.userId, ip: req.ip })
- [ ] return res.status(403).json({ error: 'Invalid token: missing role claim' })
- [ ] Validate role value: if (!isValidRole(req.user.role))
- [ ] await auditLogger.logSecurityEvent('INVALID_ROLE_CLAIM', { userId: req.user.userId, role: req.user.role, ip: req.ip })
- [ ] return res.status(403).json({ error: `Invalid role: ${req.user.role}` })
- [ ] Call next()
- [ ] Export validateRoleClaim

### Enhanced Authorize Middleware (server/src/middleware/authorize.ts)
- [ ] Import types, permissionChecker, auditLogger, roleValidator
- [ ] Implement authorize(...allowedRoles: (UserRole | string)[]): RequestHandler
- [ ] Convert string roles to UserRole: const roles = allowedRoles.map(r => r as UserRole)
- [ ] Return middleware: async (req: AuthRequest, res: Response, next: NextFunction) => {}
- [ ] Ensure authentication: if (!req.user) return res.status(401).json({ error: 'Authentication required' })
- [ ] Validate role claim exists and is valid (inline or call roleValidator)
- [ ] Check authorization: const { authorized, reason } = checkPermission(req.user.role, roles)
- [ ] If authorized: return next()
- [ ] Else: Log authorization failure
- [ ] await auditLogger.logAuthorizationFailure(req.user.userId, req.path, req.user.role, roles, req.ip)
- [ ] return res.status(403).json({ error: reason || 'Insufficient permissions', requiredRoles: roles, userRole: req.user.role })
- [ ] Export authorize

### Resource-Based Authorization Middleware (server/src/middleware/authorizeResource.ts)
- [ ] Implement authorizeResource(config: RoleConfig, getResource: (req) => Promise<ResourcePermission>): RequestHandler
- [ ] Return middleware: async (req: AuthRequest, res: Response, next: NextFunction) => {}
- [ ] if (!req.user) return res.status(401).json({ error: 'Authentication required' })
- [ ] Fetch resource: const resource = await getResource(req)
- [ ] Check permission: const { authorized, reason } = isAuthorized({ id: req.user.userId, role: req.user.role }, config, resource)
- [ ] If authorized: next()
- [ ] Else: res.status(403).json({ error: reason })
- [ ] Export authorizeResource
- [ ] Usage example: router.get('/patients/:id/profile', authenticate, authorizeResource({ allowedRoles: [UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN], resourceBased: true }, async (req) => ({ resourceType: 'patient', resourceId: req.params.id, ownerId: req.params.id })), controller.getProfile)

### TypeScript Decorators (server/src/decorators/requireRoles.ts) - Optional
- [ ] Note: Express with TypeScript doesn't natively support method decorators for routes
- [ ] Alternative: Create factory function for route definition
- [ ] Implement createProtectedRoute(roles: UserRole[], handler: RequestHandler): RequestHandler[]
- [ ] Return [authenticate, authorize(...roles), handler]
- [ ] Usage: router.get('/admin/users', ...createProtectedRoute([UserRole.ADMIN], userController.list))
- [ ] Export createProtectedRoute

### Permission Matrix Configuration (server/src/config/permissions.ts) - Optional
- [ ] Define centralized permission matrix
- [ ] const permissionMatrix: PermissionMatrix = {
- [ ]   '/api/admin/*': [{ method: 'GET', roles: [UserRole.ADMIN] }, { method: 'POST', roles: [UserRole.ADMIN] }],
- [ ]   '/api/staff/*': [{ method: 'GET', roles: [UserRole.STAFF, UserRole.ADMIN] }],
- [ ]   '/api/patients/:id': [{ method: 'GET', roles: [UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN] }],
- [ ]   '/api/appointments': [{ method: 'POST', roles: [UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN] }]
- [ ] }
- [ ] Export permissionMatrix
- [ ] Implement getRequiredRoles(path: string, method: string): UserRole[]
- [ ] Match path against matrix patterns, return roles for matching method
- [ ] Use this in dynamic middleware: app.use((req, res, next) => { const roles = getRequiredRoles(req.path, req.method); if (roles) return authorize(...roles)(req, res, next); next(); })

### Documentation (server/docs/RBAC_GUIDE.md)
- [ ] Document role definitions
- [ ] ADMIN: Full system access, user management, system configuration
- [ ] STAFF: Patient management, appointment scheduling, clinical records
- [ ] PATIENT: Own profile, own appointments, own medical records
- [ ] Document role hierarchy
- [ ] Admin inherits all staff and patient permissions
- [ ] Staff inherits patient permissions for patients they manage
- [ ] Document usage examples
- [ ] Single role: `router.get('/admin/users', authenticate, authorize(UserRole.ADMIN), controller.list)`
- [ ] Multi-role: `router.get('/appointments', authenticate, authorize(UserRole.STAFF, UserRole.ADMIN), controller.list)`
- [ ] Public endpoint: `router.get('/health', controller.health)` (no auth)
- [ ] Any authenticated: `router.get('/profile', authenticate, authorize('**'), controller.profile)`
- [ ] Document resource-based permissions
- [ ] Example: Patient accessing their own records
- [ ] Implementation with getResource callback
- [ ] Document permission matrix
- [ ] Table showing endpoint → method → required roles
- [ ] Document error responses
- [ ] 401: Authentication required (no token or invalid token)
- [ ] 403: Insufficient permissions (wrong role)
- [ ] 403: Missing role claim (invalid token structure)
- [ ] 403: Invalid role value (token tampered)
- [ ] Document best practices
- [ ] Always use authenticate before authorize
- [ ] Use resource-based permissions for user-specific data
- [ ] Log all authorization failures for security monitoring
- [ ] Regularly review permission matrix for security gaps

### Integration Tests (server/tests/integration/rbac.test.ts)
- [ ] Setup: Create test users for each role (admin, staff, patient)
- [ ] Test: "admin can access admin endpoints"
- [ ] Test: "staff cannot access admin endpoints"
- [ ] Test: "patient cannot access staff endpoints"
- [ ] Test: "multi-role endpoint allows staff OR admin"
- [ ] Test: "admin can access staff endpoints (hierarchy)"
- [ ] Test: "staff can access patient endpoints (hierarchy)"
- [ ] Test: "patient cannot access higher privilege endpoints"
- [ ] Test: "missing role claim returns 403"
- [ ] Test: "invalid role value returns 403"
- [ ] Test: "resource-based: patient can access own records"
- [ ] Test: "resource-based: patient cannot access other's records"
- [ ] Test: "resource-based: staff can access any patient records"
- [ ] Test: "resource-based: admin can access any records"
- [ ] Test: "public endpoint accessible without auth"
- [ ] Test: "authenticated endpoint (**) accessible to any role"
- [ ] Test: "authorization failure logged to audit_logs"
- [ ] Test: "403 response includes required roles and user role"
- [ ] Run tests: npm test -- rbac.test.ts

### Route Updates (Apply RBAC to existing routes)
- [ ] Update admin routes: server/src/routes/admin.routes.ts
- [ ] Apply: router.use(authenticate, authorize(UserRole.ADMIN))
- [ ] Update staff routes: server/src/routes/staff.routes.ts
- [ ] Apply: router.use(authenticate, authorize(UserRole.STAFF, UserRole.ADMIN))
- [ ] Update patient routes: server/src/routes/patients.routes.ts
- [ ] Apply resource-based auth for patient-specific endpoints
- [ ] Update appointment routes: server/src/routes/appointments.routes.ts
- [ ] POST /appointments: authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN)
- [ ] GET /appointments (all): authorize(UserRole.STAFF, UserRole.ADMIN)
- [ ] GET /appointments/my: authorize(UserRole.PATIENT, UserRole.STAFF, UserRole.ADMIN) with resource filter

### Execution and Validation
- [ ] Start server: npm run dev
- [ ] Login as admin, staff, patient users → obtain JWT tokens
- [ ] Test admin access: Admin token → /api/admin/users → 200 OK
- [ ] Test staff access denied: Staff token → /api/admin/users → 403 Forbidden
- [ ] Test patient access denied: Patient token → /api/staff/queue → 403 Forbidden
- [ ] Test multi-role: Staff token → /api/appointments/manage → 200 OK
- [ ] Test multi-role: Admin token → /api/appointments/manage → 200 OK
- [ ] Test multi-role denied: Patient token → /api/appointments/manage → 403 Forbidden
- [ ] Test hierarchy: Admin token → /api/staff/dashboard → 200 OK
- [ ] Test missing role: Token without role claim → 403 with "missing role claim"
- [ ] Test invalid role: Token with role="hacker" → 403 with "Invalid role"
- [ ] Test resource-based: Patient 1 token → /api/patients/1/profile → 200 OK
- [ ] Test resource-based denied: Patient 1 token → /api/patients/2/profile → 403 Forbidden
- [ ] Test resource-based staff: Staff token → /api/patients/2/profile → 200 OK
- [ ] Check audit_logs: Query for AUTHORIZATION_FAILED events → verify logged
- [ ] Verify error format: 403 response includes requiredRoles and userRole fields
- [ ] Run all integration tests: npm test -- rbac.test.ts → all pass
- [ ] Load test: 1000 concurrent requests with mixed roles → all succeed with correct status codes
- [ ] Document findings and examples in RBAC_GUIDE.md
