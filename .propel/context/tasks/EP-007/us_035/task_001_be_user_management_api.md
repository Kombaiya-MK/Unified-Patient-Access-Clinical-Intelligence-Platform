# Task - TASK_001: Backend User Management API with RBAC and Audit

## Requirement Reference
- User Story: [us_035]
- Story Location: [.propel/context/tasks/us_035/us_035.md]
- Acceptance Criteria:
    - AC1: Display user table with Email, Role, Department, Status, Last Login columns
    - AC2: Create user with email, password, role, department (visible only for Patient role per FR-022)
    - AC3: Edit user to modify role or department, log to audit, invalidate sessions on role change
    - AC4: Deactivate user sets active=false, invalidates sessions, logs deactivation
- Edge Case:
    - EC1: Duplicate email validation → return 409 Conflict error
    - EC2: Prevent admin from deactivating own account → validate user_id != current_admin_id
    - EC3: Department required for Patient role → validate department_id NOT NULL when role='patient'
    - EC4: Password complexity enforcement → min 8 chars, 1 uppercase, 1 number, 1 special char

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
| Validation | Zod | 3.x |
| Password Hashing | bcrypt | 5.x |

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
Create comprehensive user management API endpoints for admin CRUD operations on user accounts. Implement GET /api/admin/users with pagination, sorting by email/role/last_login, and filtering by role/status. Add POST /api/admin/users to create new user accounts with email uniqueness validation, password complexity checks (min 8 chars, 1 uppercase, 1 number, 1 special char), role assignment (patient/doctor/staff/admin), and conditional department_id requirement for Patient role only (FR-022). Implement PUT /api/admin/users/:id to update user role and department, with audit logging to audit_logs table, session token invalidation on role changes by clearing session_token field in users table to force re-authentication with new permissions. Add DELETE /api/admin/users/:id to soft-delete by setting is_active=false, invalidating all user sessions, logging deactivation with admin_id and reason to audit_logs. Implement self-deactivation prevention by checking user_id != current_admin_id. Send email verification on user creation using nodemailer. Integrate with existing RBAC middleware from US-010 to restrict all endpoints to admin role only. Return proper HTTP status codes: 201 Created, 200 OK, 409 Conflict for duplicate email, 403 Forbidden for self-deactivation, 400 Bad Request for validation errors. Support department lookup with GET /api/departments for dropdown population.

## Dependent Tasks
- US-007: Database schema with users and departments tables (completed)
- US-009: Authentication system with JWT (completed)
- US-010: RBAC middleware for admin-only access (completed)
- US-011: Audit logging infrastructure (completed)

## Impacted Components
- **CREATE** server/src/routes/adminRoutes.ts - Express routes for user management
- **CREATE** server/src/controllers/adminController.ts - CRUD handlers for users
- **CREATE** server/src/services/userManagementService.ts - Business logic for user operations
- **CREATE** server/src/validators/userValidators.ts - Zod schemas for user validation
- **MODIFY** server/src/routes/index.ts - Mount admin routes
- **MODIFY** server/src/middleware/rbacMiddleware.ts - Ensure admin-only access validation

## Implementation Plan
1. **Create userValidators.ts**: Define Zod schemas: createUserSchema = {email: z.string().email(), password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/), role: z.enum(['patient', 'doctor', 'staff', 'admin']), first_name, last_name, phone_number?, department_id?: z.number()}, updateUserSchema = {role?, department_id?, first_name?, last_name?, phone_number?}, passwordComplexityRegex for validation
2. **Create userManagementService.ts**: Implement getAllUsers(page, limit, sortBy, filterRole, filterStatus) with SQL query: `SELECT u.id, email, role, first_name, last_name, phone_number, is_active, last_login_at, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE ($1::text IS NULL OR role = $1) AND ($2::boolean IS NULL OR is_active = $2) ORDER BY ${sortBy} LIMIT $3 OFFSET $4`, return {users, total, page, limit}
3. **Implement createUser function**: Validate input with createUserSchema, if role='patient' require department_id (throw 400 if missing), check email uniqueness: `SELECT COUNT(*) FROM users WHERE email = $1`, if exists throw 409 Conflict, hash password with bcrypt.hash(password, 10), generate verification_token with crypto.randomBytes(32).toString('hex'), INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number, department_id, is_active, verification_token) VALUES (...) RETURNING id, INSERT audit_log entry with action='user_created', send email verification with nodemailer, return {user_id, message: 'User created successfully. Verification email sent.'}
4. **Implement updateUser function**: Accept userId, updateData, adminId, validate with updateUserSchema, if role update: fetch old role for audit comparison, if department_id update and role != 'patient': set department_id = NULL, UPDATE users SET role = $1, department_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *, if role changed: invalidate sessions by `UPDATE users SET session_token = NULL WHERE id = $1` to force re-login, INSERT audit_log (action='user_updated', performed_by_user_id=adminId, details={field: 'role', old_value, new_value}), return updated user
5. **Implement deactivateUser function**: Accept userId, adminId, check self-deactivation: if userId === adminId throw 403 Forbidden with message 'Cannot deactivate your own account', UPDATE users SET is_active = FALSE, session_token = NULL WHERE id = $1, INSERT audit_log (action='user_deactivated', performed_by_user_id=adminId, user_id=userId, details={reason: 'Admin deactivation'}), return {message: 'User deactivated successfully'}
6. **Implement getDepartments function**: Simple SELECT id, department_name, description FROM departments WHERE is_active = TRUE ORDER BY department_name, return departments array for dropdown
7. **Create adminController.ts**: Implement handlers: getUsers(req, res) - parse query params {page=1, limit=20, sortBy='created_at', role?, status?}, call userManagementService.getAllUsers, return 200 with {users, pagination}, createUser(req, res) - validate body, call userManagementService.createUser, catch unique constraint error (code 23505) return 409, return 201, updateUser(req, res) - validate params and body, call userManagementService.updateUser with req.user.id as adminId, return 200, deactivateUser(req, res) - call userManagementService.deactivateUser with req.user.id, catch 403 error, return 200, getDepartments(req, res) - call service, return 200
8. **Create adminRoutes.ts**: Setup Express router, routes: GET /users (pagination, sorting, filtering), POST /users (create), PUT /users/:id (update), DELETE /users/:id (deactivate), GET /departments (for dropdown), apply authMiddleware and rbacMiddleware(['admin']) to all routes
9. **Modify index.ts**: Import adminRoutes, mount app.use('/api/admin', adminRoutes)
10. **Modify rbacMiddleware.ts**: Verify admin role check exists: `const rbacMiddleware = (allowedRoles) => (req, res, next) => { if (!allowedRoles.includes(req.user.role)) return res.status(403).json({error: 'Forbidden'}); next(); };`
11. **Session invalidation logic**: On role change or deactivation, clear session_token field: `UPDATE users SET session_token = NULL WHERE id = $1`, authMiddleware should validate session_token matches stored value
12. **Email verification setup**: Configure nodemailer transport with SMTP (use free SMTP like Gmail, Ethereal for dev), send email with verification link: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`, template includes user name and link

**Focus on how to implement**: User list query: `const query = 'SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.is_active, u.last_login_at, d.department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE ($1::text IS NULL OR u.role = $1) AND ($2::boolean IS NULL OR u.is_active = $2) ORDER BY ${sortBy} DESC LIMIT $3 OFFSET $4'; const result = await db.query(query, [filterRole, filterStatus, limit, offset]);`. Create user: `const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]); if (existingUser.rows.length > 0) throw new ConflictError('User with this email already exists'); const hashedPassword = await bcrypt.hash(password, 10); const verificationToken = crypto.randomBytes(32).toString('hex'); const insertResult = await db.query('INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number, department_id, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', [email, hashedPassword, role, firstName, lastName, phoneNumber, departmentId, verificationToken]); await db.query('INSERT INTO audit_logs (action, user_id, performed_by_user_id, details) VALUES ($1, $2, $3, $4)', ['user_created', insertResult.rows[0].id, adminId, JSON.stringify({email, role})]); await sendVerificationEmail(email, firstName, verificationToken);`. Update user: `const oldUser = await db.query('SELECT role FROM users WHERE id = $1', [userId]); const updateResult = await db.query('UPDATE users SET role = $1, department_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [role, departmentId, userId]); if (oldUser.rows[0].role !== role) { await db.query('UPDATE users SET session_token = NULL WHERE id = $1', [userId]); await db.query('INSERT INTO audit_logs (action, user_id, performed_by_user_id, details) VALUES ($1, $2, $3, $4)', ['role_changed', userId, adminId, JSON.stringify({old_role: oldUser.rows[0].role, new_role: role})]); }`. Deactivate: `if (userId === adminId) throw new ForbiddenError('Cannot deactivate your own account'); await db.query('UPDATE users SET is_active = FALSE, session_token = NULL WHERE id = $1', [userId]); await db.query('INSERT INTO audit_logs (action, user_id, performed_by_user_id, details) VALUES ($1, $2, $3, $4)', ['user_deactivated', userId, adminId, JSON.stringify({reason: 'Admin deactivation'})]);`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── index.ts (to be modified)
│   │   └── adminRoutes.ts (to be created)
│   ├── controllers/
│   │   └── adminController.ts (to be created)
│   ├── services/
│   │   └── userManagementService.ts (to be created)
│   ├── validators/
│   │   └── userValidators.ts (to be created)
│   └── middleware/
│       └── rbacMiddleware.ts (existing from US-010, to verify admin role support)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/validators/userValidators.ts | Zod schemas for user validation |
| CREATE | server/src/services/userManagementService.ts | User CRUD business logic |
| CREATE | server/src/controllers/adminController.ts | Controller handlers for user management |
| CREATE | server/src/routes/adminRoutes.ts | Express routes for admin endpoints |
| MODIFY | server/src/routes/index.ts | Mount admin routes |
| MODIFY | server/src/middleware/rbacMiddleware.ts | Verify admin role enforcement |

## External References
- **Express Router**: https://expressjs.com/en/guide/routing.html - Route organization
- **Zod Validation**: https://zod.dev/ - Schema validation
- **bcrypt**: https://www.npmjs.com/package/bcrypt - Password hashing (salt rounds: 10)
- **nodemailer**: https://nodemailer.com/ - Email sending for verification
- **PostgreSQL Pagination**: https://www.postgresql.org/docs/15/queries-limit.html - LIMIT and OFFSET
- **RBAC Patterns**: https://auth0.com/blog/role-based-access-control-rbac-and-react-apps/ - Admin-only access

## Build Commands
- Build TypeScript: `npm run build` (compile src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test -- adminController.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] GET /api/admin/users returns user list with pagination
- [x] Pagination works with page and limit query params
- [x] Sorting by email/role/last_login works correctly
- [x] Filtering by role and status works correctly
- [x] POST /api/admin/users creates user with valid data
- [x] Email uniqueness validation returns 409 Conflict for duplicate
- [x] Password complexity validation enforces min 8 chars, 1 uppercase, 1 number, 1 special
- [x] Department required for Patient role, validation fails if missing
- [x] Verification email sent on user creation
- [x] PUT /api/admin/users/:id updates user role and department
- [x] Role change invalidates user sessions (session_token = NULL)
- [x] Audit log entry created on user update
- [x] DELETE /api/admin/users/:id sets is_active=false
- [x] Self-deactivation returns 403 Forbidden
- [x] Deactivation invalidates all user sessions
- [x] Audit log entry created on deactivation
- [x] GET /api/departments returns active departments
- [x] All endpoints require admin role (rbacMiddleware)
- [x] Unauthorized access returns 403 Forbidden

## Implementation Checklist
- [x] Create server/src/validators/userValidators.ts (Zod schemas: createUserSchema with email/password/role/first_name/last_name/phone_number/department_id, updateUserSchema with optional fields, password regex /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
- [x] Create server/src/services/userManagementService.ts file
- [x] Implement getAllUsers function (SQL query with LEFT JOIN departments, WHERE filters for role and status, ORDER BY with sortBy param, LIMIT and OFFSET for pagination, return {users, total, page, limit})
- [x] Implement createUser function (validate createUserSchema, check role='patient' requires department_id, SELECT COUNT to check email uniqueness throw 409 if exists, bcrypt.hash password with 10 rounds, generate verification_token with crypto.randomBytes(32).toString('hex'), INSERT INTO users, INSERT audit_log with action='user_created', sendVerificationEmail with nodemailer, return {user_id, message})
- [x] Implement updateUser function (validate updateUserSchema, if role='patient' ensure department_id provided, if role != 'patient' set department_id=NULL, SELECT old role for audit, UPDATE users SET role/department_id/updated_at, if role changed UPDATE users SET session_token=NULL to force re-login, INSERT audit_log with action='user_updated' and details{old_role, new_role}, return updated user)
- [x] Implement deactivateUser function (check userId === adminId throw 403 ForbiddenError 'Cannot deactivate your own account', UPDATE users SET is_active=FALSE session_token=NULL, INSERT audit_log with action='user_deactivated' and performed_by_user_id=adminId, return {message: 'User deactivated successfully'})
- [x] Implement getDepartments function (SELECT id department_name description FROM departments WHERE is_active=TRUE ORDER BY department_name, return departments array)
- [x] Create server/src/controllers/adminController.ts file
- [x] Implement getUsers handler (parse query params page=1 limit=20 sortBy='created_at' role? status?, call userManagementService.getAllUsers, return 200 with {users, pagination: {page, limit, total}})
- [x] Implement createUser handler (validate req.body with createUserSchema, call userManagementService.createUser with req.user.id as adminId, catch Zod validation errors return 400, catch unique constraint PostgreSQL error code 23505 return 409 Conflict, return 201 Created with {user_id, message})
- [x] Implement updateUser handler (validate req.params.id and req.body with updateUserSchema, call userManagementService.updateUser with userId and req.user.id as adminId, catch 403 Forbidden for validation errors, return 200 with updated user)
- [x] Implement deactivateUser handler (validate req.params.id, call userManagementService.deactivateUser with userId and req.user.id as adminId, catch 403 Forbidden for self-deactivation, return 200 with {message})
- [x] Implement getDepartments handler (call userManagementService.getDepartments, return 200 with departments array)
- [x] Create server/src/routes/adminRoutes.ts (Express Router, import authMiddleware and rbacMiddleware, routes: GET /users with query params, POST /users, PUT /users/:id, DELETE /users/:id, GET /departments, apply authMiddleware and rbacMiddleware(['admin']) to all routes)
- [x] Modify server/src/routes/index.ts (import adminRoutes, app.use('/api/admin', adminRoutes))
- [x] Verify server/src/middleware/rbacMiddleware.ts has admin role check (const rbacMiddleware = (allowedRoles) => (req, res, next) => { if (!allowedRoles.includes(req.user.role)) return res.status(403).json({error: 'Forbidden: Insufficient permissions'}); next(); })
- [x] Configure nodemailer transport (create config/email.ts with SMTP settings using process.env.SMTP_HOST/PORT/USER/PASS, for dev use Ethereal ethereal.email for testing, export transporter nodemailer.createTransport)
- [x] Implement sendVerificationEmail helper (async function accepting email/firstName/verificationToken, construct verification URL ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}, send HTML email with transporter.sendMail subject 'Verify Your Email' body with link and user name)
- [ ] Write comprehensive tests (test getUsers pagination and sorting, test createUser success and duplicate email 409, test password complexity validation 400, test department required for Patient role, test updateUser and session invalidation, test deactivateUser and self-prevention 403, test getDepartments, test RBAC middleware blocks non-admin with 403)
