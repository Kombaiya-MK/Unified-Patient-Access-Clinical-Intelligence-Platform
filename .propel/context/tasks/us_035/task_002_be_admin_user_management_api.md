# Task - TASK_002_BE_ADMIN_USER_MANAGEMENT_API

## Requirement Reference
- User Story: US_035
- Story Location: `.propel/context/tasks/us_035/us_035.md`
- Acceptance Criteria:
    - AC1: GET /api/admin/users returns user list, POST /api/admin/users creates user with email validation + password hashing, sends email verification, PATCH /api/admin/users/:id updates user (role change invalidates sessions), PATCH /api/admin/users/:id/deactivate sets active=false + invalidates sessions, logs all changes to audit
- Edge Cases:
    - Duplicate email: 409 "User with this email already exists"
    - Self-deactivation: 400 "Cannot deactivate your own account"
    - Patient without department: 400 "Department required for Patient role"

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
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | bcrypt | 5.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

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
Implement admin user management API: (1) GET /api/admin/users with filters (?role=patient&status=active), pagination, returns user list with last_login, (2) POST /api/admin/users validates email uniqueness, password complexity (regex ^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$), hashes password with bcrypt, validates department required for Patient role, creates user, sends email verification, logs to audit, (3) PATCH /api/admin/users/:id allows role/department updates, if role changed → DELETE FROM sessions WHERE user_id=$1 (invalidate active sessions), logs change with old/new values, (4) PATCH /api/admin/users/:id/deactivate validates not self-deactivation, sets active=false, invalidates sessions, logs deactivation, (5) All endpoints require admin role via requireRole('admin').

## Dependent Tasks
- US_009 Task 001: JWT auth (bcrypt, session management)
- US_010 Task 001: RBAC (requireRole admin)
- US_011 Task 001: Audit logging

## Impacted Components
**New:**
- server/src/controllers/admin-users.controller.ts (User CRUD handlers)
- server/src/routes/admin-users.routes.ts (Admin user endpoints)
- server/src/services/admin-users.service.ts (User management logic)
- server/src/middleware/password-validation.middleware.ts (Password complexity check)

**Modified:**
- server/db/schema.sql (Ensure users table has active BOOLEAN, last_login TIMESTAMP)

## Implementation Plan
1. Add columns if missing: ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true, ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
2. Implement GET /api/admin/users: Query users with filters (role, status), JOIN departments for patient users, ORDER BY created_at DESC, pagination (page, limit)
3. Implement POST /api/admin/users:
   - Validate email uniqueness: SELECT FROM users WHERE email=$1
   - Validate password complexity: Regex ^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$
   - If role=patient, validate department_id provided
   - Hash password: bcrypt.hash(password, 12)
   - INSERT user
   - Send email verification (reuse from US_009)
   - Audit log: action_type='user_created'
4. Implement PATCH /api/admin/users/:id:
   - Validate userId != currentUserId if changing to inactive
   - If role changed: DELETE FROM sessions WHERE user_id=$1
   - UPDATE users SET role=$1, department_id=$2, updated_at=NOW()
   - Audit log: old_role, new_role, updated_by_admin_id
5. Implement PATCH /api/admin/users/:id/deactivate:
   - Validate userId != req.user.id (self-deactivation check)
   - UPDATE users SET active=false
   - DELETE FROM sessions WHERE user_id=$1
   - Audit log: action_type='user_deactivated'
6. Password validation middleware: Joi schema with custom validator
7. Add routes: All require verifyToken + requireRole('admin')
8. Test: Create duplicate user → 409, deactivate self → 400

## Current Project State
```
ASSIGNMENT/server/src/
├── services/appointments.service.ts (user logic exists in auth)
└── (admin user service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/admin-users.controller.ts | User CRUD handlers |
| CREATE | server/src/routes/admin-users.routes.ts | Admin endpoints |
| CREATE | server/src/services/admin-users.service.ts | User management logic |
| CREATE | server/src/middleware/password-validation.middleware.ts | Password complexity |
| UPDATE | server/db/schema.sql | Ensure active, last_login columns |

## External References
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [Joi Password Validation](https://joi.dev/api/?v=17.9.1#stringpatternregex-name)
- [FR-015 User Management](../../../.propel/context/docs/spec.md#FR-015)
- [UC-005 Admin Operations](../../../.propel/context/docs/spec.md#UC-005)

## Build Commands
```bash
cd server
npm run dev

# Test create user
curl -X POST http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "email": "newuser@clinic.com",
    "password": "SecurePass1!",
    "role": "patient",
    "departmentId": "dept-uuid"
  }' \
  -H "Content-Type: application/json"

# Test deactivate
curl -X PATCH http://localhost:3001/api/admin/users/<user-id>/deactivate \
  -H "Authorization: Bearer <admin-token>"
```

## Implementation Validation Strategy
- [ ] Unit tests: adminUsersService validates password complexity
- [ ] Integration tests: POST /admin/users creates user with hashed password
- [ ] active, last_login columns exist: \d users shows columns
- [ ] GET /admin/users protected: Try GET without admin token → 403
- [ ] User list: GET /admin/users → returns users with email, role, status, last_login
- [ ] Filters work: GET /admin/users?role=patient&status=active → filtered results
- [ ] Pagination: GET /admin/users?page=2&limit=10 → page 2 users
- [ ] Create user: POST /admin/users → user created with hashed password
- [ ] Email uniqueness: POST with existing email → 409 "User already exists"
- [ ] Password complexity: POST with "weak" password → 400 "Password must include uppercase, number, special char"
- [ ] Department validation: POST role=patient without departmentId → 400 "Department required"
- [ ] Email verification sent: After user creation → email sent (mocked in tests)
- [ ] Update user: PATCH /admin/users/:id → user updated, audit logged
- [ ] Role change invalidates sessions: PATCH role → sessions table cleared for that user_id
- [ ] Deactivate user: PATCH /deactivate → active=false, sessions cleared
- [ ] Self-deactivation blocked: Admin tries deactivate self → 400 "Cannot deactivate your own account"
- [ ] Audit logged: All operations → query audit_logs, see action_type='user_created/updated/deactivated'

## Implementation Checklist
- [ ] Add active, last_login columns to users table if missing
- [ ] Create password-validation.middleware.ts with regex check
- [ ] Implement admin-users.service.ts with CRUD logic
- [ ] Create admin-users.controller.ts handlers
- [ ] Create admin-users.routes.ts with protected routes
- [ ] Session invalidation on role change/deactivate
- [ ] Self-deactivation prevention
- [ ] Email verification integration (reuse from US_009)
- [ ] Mount /api/admin/users routes in app.ts
- [ ] Test user management API endpoints
- [ ] Document admin API in server/README.md
