# Task - TASK_002: Backend Department Management API with Operating Hours

## Requirement Reference
- User Story: [us_036]
- Story Location: [.propel/context/tasks/us_036/us_036.md]
- Acceptance Criteria:
    - AC1: Display Departments table (Department Name, Active Providers, Total Appointments, Status)
    - AC1: Add new department with name + description + operating hours (Mon-Sun configurable)
    - AC1: Edit existing departments including deactivation (soft delete)
    - AC1: Save changes with audit log
- Edge Case:
    - EC1: Deactivating department with future appointments → warn admin, offer reassignment
- NFR Requirements:
    - NFR-REL01: Schedule changes reflected in <10s (use Redis cache invalidation)

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
| Caching | Redis | 7.x (Upstash) |
| Validation | Zod | 3.x |

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
Create department management API endpoints for admin CRUD operations. Implement GET /api/admin/departments with pagination, returning department name, code, description, is_active status, operating_hours JSONB, provider_count (count from provider_departments), appointment_count (count from appointments). Add POST /api/admin/departments to create department with name, code, description, operating_hours structure {monday: {open: '08:00', close: '20:00', is_open: true}, ...} validated via Zod schema. Implement PUT /api/admin/departments/:id to update department fields including operating_hours. Add PATCH /api/admin/departments/:id/deactivate to soft-delete by setting is_active=false, with validation checking for future appointments - if found, return 409 Conflict with {has_future_appointments: true, appointment_count: N, provider_ids: []} requiring admin confirmation or reassignment. Log all changes to audit_logs table with admin_id, action, old_values, new_values. Invalidate Redis cache on department changes to ensure appointment booking UI reflects updates within 10s per NFR-REL01. All endpoints require admin role via RBAC middleware from US-010.

## Dependent Tasks
- US-036 task_001: Database migration with operating_hours and relationships
- US-010: RBAC middleware for admin-only access
- US-011: Audit logging infrastructure

## Impacted Components
- **CREATE** server/src/routes/departmentRoutes.ts - Express routes for department management
- **CREATE** server/src/controllers/departmentController.ts - CRUD handlers
- **CREATE** server/src/services/departmentService.ts - Business logic
- **CREATE** server/src/validators/departmentValidators.ts - Zod schemas
- **MODIFY** server/src/routes/index.ts - Mount department routes

## Implementation Plan
1. **Create departmentValidators.ts**: Define Zod schemas: operatingHoursSchema = z.object({monday: z.object({open: z.string().regex(/^\d{2}:\d{2}$/), close: z.string().regex(/^\d{2}:\d{2}$/), is_open: z.boolean()}), tuesday: ..., ... for all 7 days}), createDepartmentSchema = {name: z.string().min(1).max(100), code: z.string().min(1).max(20), description: z.string().optional(), operating_hours: operatingHoursSchema, location: z.string().optional(), phone_number: z.string().optional(), email: z.string().email().optional()}, updateDepartmentSchema = createDepartmentSchema.partial() for optional fields
2. **Create departmentService.ts**: Implement getAllDepartments(page, limit, filterStatus) with SQL query: `SELECT d.id, d.name, d.code, d.description, d.is_active, d.operating_hours, d.location, d.phone_number, d.email, COUNT(DISTINCT pd.provider_id) as provider_count, COUNT(DISTINCT a.id) as appointment_count FROM departments d LEFT JOIN provider_departments pd ON d.id = pd.department_id LEFT JOIN appointments a ON pd.provider_id = a.provider_id GROUP BY d.id ORDER BY d.name LIMIT $1 OFFSET $2`, return {departments, total, page, limit}
3. **Implement createDepartment function**: Validate with createDepartmentSchema, check code uniqueness: `SELECT id FROM departments WHERE code = $1`, if exists throw 409 Conflict, INSERT INTO departments (name, code, description, operating_hours, location, phone_number, email) VALUES (...) RETURNING *, INSERT audit_log entry with action='department_created', invalidate Redis cache key 'departments:*', return department
4. **Implement updateDepartment function**: Accept departmentId, updateData, adminId, validate with updateDepartmentSchema, fetch old values for audit: `SELECT * FROM departments WHERE id = $1`, UPDATE departments SET name = $1, code = $2, description = $3, operating_hours = $4, location = $5, phone_number = $6, email = $7, updated_at = NOW() WHERE id = $8 RETURNING *, INSERT audit_log (action='department_updated', old_values, new_values), invalidate Redis cache, return updated department
5. **Implement deactivateDepartment function**: Accept departmentId, adminId, check for future appointments: `SELECT COUNT(*) as count, ARRAY_AGG(DISTINCT provider_id) as provider_ids FROM appointments a JOIN provider_departments pd ON a.provider_id = pd.provider_id WHERE pd.department_id = $1 AND a.appointment_date >= CURRENT_DATE AND a.status NOT IN ('cancelled', 'completed')`, if count > 0 throw 409 Conflict with {has_future_appointments: true, appointment_count, provider_ids, message: 'Department has future appointments. Reassign or notify patients before deactivating.'}, else UPDATE departments SET is_active = FALSE WHERE id = $1, INSERT audit_log, invalidate Redis cache, return {message: 'Department deactivated successfully'}
6. **Implement getDepartmentById function**: SELECT with provider count and appointment count joins, return department or 404 if not found
7. **Create departmentController.ts**: Implement handlers: getDepartments(req, res) - parse query params {page=1, limit=20, status?}, call departmentService.getAllDepartments, return 200 with {departments, pagination}, createDepartment(req, res) - validate body, call departmentService.createDepartment with req.user.id, catch unique constraint error (code 23505) return 409, return 201, updateDepartment(req, res) - validate params and body, call departmentService.updateDepartment with req.user.id, return 200, deactivateDepartment(req, res) - call departmentService.deactivateDepartment with req.user.id, catch 409 error return with future appointments info, return 200, getDepartment(req, res) - call departmentService.getDepartmentById, return 200 or 404
8. **Create departmentRoutes.ts**: Setup Express router, routes: GET /departments (list with pagination), GET /departments/:id (detail), POST /departments (create), PUT /departments/:id (update), PATCH /departments/:id/deactivate (soft delete), apply authMiddleware and rbacMiddleware(['admin']) to all routes
9. **Modify index.ts**: Import departmentRoutes, mount app.use('/api/admin', departmentRoutes)
10. **Redis cache invalidation**: Create helper function invalidateDepartmentCache() that deletes keys matching 'departments:*' and 'appointment-availability:*' patterns using Redis DEL or SCAN+DEL, call after create/update/deactivate operations
11. **Operating hours validation**: Add custom Zod validator to ensure open < close time for each day, validate time format HH:MM (00:00 to 23:59)
12. **Testing**: Test CRUD operations, test operating hours validation, test deactivation with future appointments returns 409, test Redis cache invalidation, test audit logging, test admin-only access

**Focus on how to implement**: Get departments query: `const query = 'SELECT d.id, d.name, d.code, d.description, d.is_active, d.operating_hours, d.location, d.phone_number, d.email, d.created_at, d.updated_at, COUNT(DISTINCT pd.provider_id) as provider_count, COUNT(DISTINCT a.id) as appointment_count FROM departments d LEFT JOIN provider_departments pd ON d.id = pd.department_id LEFT JOIN appointments a ON pd.provider_id = a.provider_id WHERE ($1::boolean IS NULL OR d.is_active = $1) GROUP BY d.id ORDER BY d.name LIMIT $2 OFFSET $3'; const result = await db.query(query, [filterStatus, limit, offset]);`. Create department: `const existingDept = await db.query('SELECT id FROM departments WHERE code = $1', [code]); if (existingDept.rows.length > 0) throw new ConflictError('Department code already exists'); const insertResult = await db.query('INSERT INTO departments (name, code, description, operating_hours, location, phone_number, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [name, code, description, JSON.stringify(operatingHours), location, phoneNumber, email]); await db.query('INSERT INTO audit_logs (action, table_name, record_id, new_values, user_id) VALUES ($1, $2, $3, $4, $5)', ['department_created', 'departments', insertResult.rows[0].id, JSON.stringify(insertResult.rows[0]), adminId]); await redis.del('departments:*'); return insertResult.rows[0];`. Deactivate with validation: `const futureAppointments = await db.query('SELECT COUNT(*)::int as count, ARRAY_AGG(DISTINCT pd.provider_id) as provider_ids FROM appointments a JOIN provider_departments pd ON a.provider_id = pd.provider_id WHERE pd.department_id = $1 AND a.appointment_date >= CURRENT_DATE AND a.status NOT IN ($2, $3)', [departmentId, 'cancelled', 'completed']); if (futureAppointments.rows[0].count > 0) throw new ConflictError('Department has future appointments', {has_future_appointments: true, appointment_count: futureAppointments.rows[0].count, provider_ids: futureAppointments.rows[0].provider_ids}); await db.query('UPDATE departments SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [departmentId]);`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── index.ts (to be modified)
│   │   └── departmentRoutes.ts (to be created)
│   ├── controllers/
│   │   └── departmentController.ts (to be created)
│   ├── services/
│   │   └── departmentService.ts (to be created)
│   └── validators/
│       └── departmentValidators.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/validators/departmentValidators.ts | Zod schemas for department validation |
| CREATE | server/src/services/departmentService.ts | Department CRUD business logic |
| CREATE | server/src/controllers/departmentController.ts | Controller handlers |
| CREATE | server/src/routes/departmentRoutes.ts | Express routes |
| MODIFY | server/src/routes/index.ts | Mount department routes |

## External References
- **Express Router**: https://expressjs.com/en/guide/routing.html - Route organization
- **Zod Validation**: https://zod.dev/ - Schema validation for operating hours
- **Redis Cache Invalidation**: https://redis.io/commands/del/ - Cache clearing
- **PostgreSQL JSON Functions**: https://www.postgresql.org/docs/15/functions-json.html - JSONB queries
- **PostgreSQL Aggregates**: https://www.postgresql.org/docs/15/functions-aggregate.html - COUNT with GROUP BY

## Build Commands
- Build TypeScript: `npm run build`
- Run in development: `npm run dev`
- Run tests: `npm test -- departmentController.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] GET /api/admin/departments returns list with provider/appointment counts
- [x] Pagination and filtering by status work correctly
- [x] POST /api/admin/departments creates department with operating hours
- [x] Operating hours validation ensures open < close times
- [x] Duplicate code returns 409 Conflict
- [x] PUT /api/admin/departments/:id updates department
- [x] Operating hours update reflected in response
- [x] PATCH /api/admin/departments/:id/deactivate checks future appointments
- [x] Deactivation with future appointments returns 409 with details
- [x] Deactivation without future appointments succeeds
- [x] Audit log entries created for all operations
- [x] Redis cache invalidated on changes (verify with TTL checks)
- [x] Changes reflected in appointment booking within 10s (NFR-REL01)
- [x] All endpoints require admin role

## Implementation Checklist
- [ ] Create server/src/validators/departmentValidators.ts (Zod schemas: operatingHoursSchema with monday-sunday objects each having open/close regex /^\d{2}:\d{2}$/ and is_open boolean, custom refine to validate open < close for each day, createDepartmentSchema with name min 1 max 100, code min 1 max 20, description optional, operating_hours using operatingHoursSchema, location/phone_number/email optional, updateDepartmentSchema as createDepartmentSchema.partial())
- [ ] Create server/src/services/departmentService.ts file
- [ ] Implement getAllDepartments function (SQL query with LEFT JOIN provider_departments and appointments, COUNT DISTINCT provider_id as provider_count, COUNT DISTINCT appointments.id as appointment_count, GROUP BY departments.id, WHERE filter by is_active if provided, ORDER BY name, LIMIT and OFFSET for pagination, return {departments, total, page, limit})
- [ ] Implement createDepartment function (validate createDepartmentSchema, SELECT check for duplicate code throw 409 ConflictError if exists, INSERT INTO departments with name/code/description/operating_hours as JSONB/location/phone_number/email, INSERT audit_logs with action='department_created' new_values and user_id=adminId, invalidate Redis cache 'departments:*' and 'appointment-availability:*' patterns using DEL or SCAN+DEL, return created department)
- [ ] Implement updateDepartment function (validate updateDepartmentSchema, SELECT old values from departments WHERE id for audit comparison, UPDATE departments SET fields with updated_at=NOW(), INSERT audit_logs with action='department_updated' old_values and new_values and user_id=adminId, invalidate Redis cache, return updated department)
- [ ] Implement deactivateDepartment function (SELECT COUNT and ARRAY_AGG provider_ids FROM appointments JOIN provider_departments WHERE department_id and appointment_date >= CURRENT_DATE and status NOT IN ('cancelled', 'completed'), if count > 0 throw 409 ConflictError with has_future_appointments true, appointment_count, provider_ids, message 'Department has future appointments. Reassign or notify patients before deactivating', else UPDATE departments SET is_active=FALSE updated_at=NOW(), INSERT audit_logs with action='department_deactivated', invalidate Redis cache, return {message: 'Department deactivated successfully'})
- [ ] Implement getDepartmentById function (SELECT with LEFT JOIN provider_departments and appointments, COUNT aggregates, WHERE departments.id = $1, return department or throw 404 NotFoundError)
- [ ] Create server/src/controllers/departmentController.ts file
- [ ] Implement getDepartments handler (parse query params page=1 limit=20 status?, call departmentService.getAllDepartments, return 200 with {departments, pagination: {page, limit, total, totalPages}})
- [ ] Implement createDepartment handler (validate req.body with createDepartmentSchema, call departmentService.createDepartment with req.user.id as adminId, catch Zod validation errors return 400, catch unique constraint PostgreSQL error code 23505 return 409 Conflict, return 201 Created with department)
- [ ] Implement updateDepartment handler (validate req.params.id and req.body with updateDepartmentSchema, call departmentService.updateDepartment with departmentId and req.user.id, catch 404 NotFoundError, return 200 with updated department)
- [ ] Implement deactivateDepartment handler (validate req.params.id, call departmentService.deactivateDepartment with departmentId and req.user.id, catch 409 ConflictError return with has_future_appointments details, return 200 with success message)
- [ ] Implement getDepartment handler (validate req.params.id, call departmentService.getDepartmentById, catch 404 NotFoundError, return 200 with department)
- [ ] Create server/src/routes/departmentRoutes.ts (Express Router, import authMiddleware and rbacMiddleware from US-010, routes: GET /departments with query params, GET /departments/:id, POST /departments, PUT /departments/:id, PATCH /departments/:id/deactivate, apply authMiddleware and rbacMiddleware(['admin']) to all routes)
- [ ] Modify server/src/routes/index.ts (import departmentRoutes, app.use('/api/admin', departmentRoutes))
- [ ] Implement Redis cache invalidation helper (create utils/cacheInvalidation.ts with function invalidateDepartmentCache() that uses Redis SCAN to find keys matching 'departments:*' and 'appointment-availability:*' patterns, then DEL those keys, handle Redis connection errors gracefully)
- [ ] Add operating hours time validation (in Zod schema refine callback: for each day check if is_open=true then validate open < close using time string comparison '08:00' < '20:00', throw error if validation fails)
- [ ] Write comprehensive tests (test getAllDepartments pagination and filtering, test createDepartment success and duplicate code 409, test operating hours validation with invalid times, test updateDepartment, test deactivateDepartment with future appointments returns 409 error, test deactivateDepartment without appointments succeeds, test audit logging for all operations, test Redis cache invalidation with TTL checks, test admin-only access with RBAC middleware blocks non-admin users with 403)
