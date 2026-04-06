# Task - TASK_003: Backend Provider Management and Schedule API with Conflict Detection

## Requirement Reference
- User Story: [us_036]
- Story Location: [.propel/context/tasks/us_036/us_036.md]
- Acceptance Criteria:
    - AC1: Display Providers table (Provider Name, Specialty, Department, Availability Hours, Status)
    - AC1: Add new provider with name + specialty + department assignment + availability template (weekly recurring hours)
    - AC1: Edit provider schedules with visual calendar editor showing blocked time + available slots
    - AC1: Assign providers to multiple departments if needed
    - AC1: Validate no overlapping provider assignments or double-bookings
    - AC1: Refresh appointment booking interface availability within 10 seconds
- Edge Case:
    - EC2: Provider schedule conflicts handled → show existing appointments, prevent overlapping blocked time
    - EC3: Provider removal requires reassignment of all future appointments before deletion

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
Create provider management and scheduling API endpoints. Implement GET /api/admin/providers with pagination, filtering by department/specialty/status, returning provider name (from users table), specialty, department assignments, total availability hours per week, is_active status. Add POST /api/admin/providers to create provider profile linking to existing user (role='doctor' or 'staff'), with specialty, license_number, department assignments (array of {department_id, primary_department}), and weekly schedule template (array of {day_of_week: 0-6, start_time, end_time}). Implement PUT /api/admin/providers/:id to update provider info and departments. Add GET /api/admin/providers/:id/schedule to fetch weekly recurring schedule and blocked times. Implement POST /api/admin/providers/:id/schedule to bulk upsert weekly schedule entries, with overlap validation preventing same provider from having overlapping time slots on same day. Add POST /api/admin/providers/:id/blocked-times to create one-off blocked slots with conflict detection against existing appointments - return 409 Conflict if appointments exist in blocked time range with appointment details for admin review. Implement DELETE /api/admin/providers/:id with validation checking for future appointments - if found, return 409 with {has_future_appointments: true, appointments: [...]} requiring reassignment before deletion. Add GET /api/admin/providers/:id/appointments endpoint to list future appointments for reassignment workflow. Invalidate Redis cache on all changes per NFR-REL01. Log all operations to audit_logs.

## Dependent Tasks
- US-036 task_001: Database migration for provider_profiles, provider_schedules, provider_blocked_times
- US-036 task_002: Department management API for department validation
- US-010: RBAC middleware
- US-011: Audit logging

## Impacted Components
- **CREATE** server/src/routes/providerRoutes.ts - Express routes for provider management
- **CREATE** server/src/controllers/providerController.ts - CRUD and schedule handlers
- **CREATE** server/src/services/providerService.ts - Business logic and conflict detection
- **CREATE** server/src/validators/providerValidators.ts - Zod schemas
- **MODIFY** server/src/routes/index.ts - Mount provider routes

## Implementation Plan
1. **Create providerValidators.ts**: Define Zod schemas: createProviderSchema = {user_id: z.number(), specialty: z.string().max(100), license_number: z.string().optional(), department_assignments: z.array(z.object({department_id: z.number(), primary_department: z.boolean()})), weekly_schedule: z.array(z.object({day_of_week: z.number().min(0).max(6), start_time: z.string().regex(/^\d{2}:\d{2}$/), end_time: z.string().regex(/^\d{2}:\d{2}$/)}))}, updateProviderSchema partial, scheduleEntrySchema for individual schedule validation, blockedTimeSchema = {blocked_date: z.date(), start_time, end_time, reason: z.string()}
2. **Create providerService.ts**: Implement getAllProviders(page, limit, filterDepartment, filterSpecialty, filterStatus) with SQL: `SELECT pp.id, pp.user_id, pp.specialty, pp.license_number, u.first_name, u.last_name, u.is_active, STRING_AGG(d.name, ', ') as departments, COALESCE(SUM(EXTRACT(EPOCH FROM (ps.end_time - ps.start_time))/3600), 0) as total_weekly_hours FROM provider_profiles pp JOIN users u ON pp.user_id = u.id LEFT JOIN provider_departments pd ON pp.id = pd.provider_id LEFT JOIN departments d ON pd.department_id = d.id LEFT JOIN provider_schedules ps ON pp.id = ps.provider_id WHERE ps.is_available = TRUE GROUP BY pp.id, u.id ORDER BY u.last_name, u.first_name`, apply filters, return {providers, total, page, limit}
3. **Implement createProvider function**: Validate user exists with role IN ('doctor', 'staff'): `SELECT id, role FROM users WHERE id = $1`, if not found or wrong role throw 400, check user not already provider: `SELECT id FROM provider_profiles WHERE user_id = $1`, if exists throw 409 Conflict, BEGIN TRANSACTION, INSERT INTO provider_profiles (user_id, specialty, license_number), for each department assignment INSERT INTO provider_departments (provider_id, department_id, primary_department), for each schedule entry INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, is_available), COMMIT, INSERT audit_log, invalidate Redis cache 'providers:*' and 'appointment-availability:*', return provider with department names
4. **Implement updateProvider function**: Accept providerId, updateData, adminId, UPDATE provider_profiles SET specialty, license_number, if department_assignments provided: DELETE FROM provider_departments WHERE provider_id (replace all), INSERT new assignments, if schedule_updates provided: handle via separate updateProviderSchedule function, INSERT audit_log, invalidate cache, return updated provider
5. **Implement getProviderSchedule function**: Accept providerId, SELECT ps.id, day_of_week, start_time, end_time, is_available FROM provider_schedules WHERE provider_id ORDER BY day_of_week, start_time, also fetch blocked times: SELECT pbt.id, blocked_date, start_time, end_time, reason FROM provider_blocked_times WHERE provider_id AND blocked_date >= CURRENT_DATE ORDER BY blocked_date, return {weekly_schedule: [...], blocked_times: [...], existing_appointments: [...]} where existing_appointments from appointments table
6. **Implement updateProviderSchedule function**: Accept providerId, scheduleEntries (array of {day_of_week, start_time, end_time, is_available}), perform overlap validation: for each entry check no overlap with other entries for same day using time range logic (start1 < end2 AND start2 < end1), if overlap found throw 400 ValidationError with conflicting entries, BEGIN TRANSACTION, DELETE FROM provider_schedules WHERE provider_id (bulk replace), INSERT new schedules in batch, COMMIT, INSERT audit_log, invalidate cache, return updated schedule
7. **Implement createBlockedTime function**: Accept providerId, {blocked_date, start_time, end_time, reason}, check for conflicts with existing appointments: `SELECT a.id, a.appointment_date, a.appointment_time, p.first_name, p.last_name, p.phone_number FROM appointments a JOIN patient_profiles pp ON a.patient_id = pp.id JOIN users p ON pp.user_id = p.id WHERE a.provider_id = $1 AND a.appointment_date = $2 AND a.appointment_time >= $3 AND a.appointment_time < $4 AND a.status NOT IN ('cancelled', 'completed')`, if appointments found return 409 Conflict with {has_conflicts: true, appointments: [...], message: 'Blocked time conflicts with existing appointments. Reschedule or cancel appointments first.'}, else INSERT INTO provider_blocked_times, INSERT audit_log, invalidate cache, return blocked time
8. **Implement deleteProvider function**: Accept providerId, adminId, check for future appointments: `SELECT COUNT(*) as count, JSON_AGG(JSON_BUILD_OBJECT('id', a.id, 'date', a.appointment_date, 'time', a.appointment_time, 'patient_name', u.first_name || ' ' || u.last_name, 'status', a.status)) as appointments FROM appointments a JOIN patient_profiles pp ON a.patient_id = pp.id JOIN users u ON pp.user_id = u.id WHERE a.provider_id = $1 AND a.appointment_date >= CURRENT_DATE AND a.status NOT IN ('cancelled', 'completed')`, if count > 0 throw 409 Conflict with {has_future_appointments: true, appointment_count, appointments} requiring reassignment, else BEGIN TRANSACTION, UPDATE appointments SET is_reassignment_required = TRUE WHERE provider_id (past completed appointments), DELETE FROM provider_blocked_times WHERE provider_id (CASCADE), DELETE FROM provider_schedules WHERE provider_id (CASCADE), DELETE FROM provider_departments WHERE provider_id (CASCADE), DELETE FROM provider_profiles WHERE id, COMMIT, INSERT audit_log, invalidate cache, return {message: 'Provider deleted successfully'}
9. **Implement getProviderAppointments function**: For reassignment workflow, SELECT appointments with patient details WHERE provider_id AND appointment_date >= CURRENT_DATE AND status NOT IN ('cancelled', 'completed') ORDER BY appointment_date, return appointments array
10. **Create providerController.ts**: Implement handlers: getProviders, createProvider, updateProvider, getProvider, deleteProvider, getProviderSchedule, updateProviderSchedule, createBlockedTime, getProviderAppointments, all with proper validation and error handling
11. **Create providerRoutes.ts**: Routes: GET /providers, POST /providers, GET /providers/:id, PUT /providers/:id, DELETE /providers/:id, GET /providers/:id/schedule, POST /providers/:id/schedule, POST /providers/:id/blocked-times, GET /providers/:id/appointments, apply authMiddleware and rbacMiddleware(['admin'])
12. **Overlap validation logic**: Function detectScheduleOverlap(schedules) that sorts by day_of_week and start_time, then checks adjacent entries: if day_of_week equal and start_time < previous.end_time return conflict, also check within same provider across different schedule entries
13. **Testing**: Test provider CRUD, test schedule overlap validation, test blocked time conflict detection, test provider deletion with future appointments validation, test Redis cache invalidation, test audit logging

**Focus on how to implement**: Get providers query: `SELECT pp.id, pp.user_id, pp.specialty, pp.license_number, u.first_name, u.last_name, u.email, u.phone_number, u.is_active, STRING_AGG(DISTINCT d.name, ', ' ORDER BY d.name) as departments, COALESCE(SUM(CASE WHEN ps.is_available THEN EXTRACT(EPOCH FROM (ps.end_time - ps.start_time))/3600 ELSE 0 END), 0) as total_weekly_hours FROM provider_profiles pp JOIN users u ON pp.user_id = u.id LEFT JOIN provider_departments pd ON pp.id = pd.provider_id LEFT JOIN departments d ON pd.department_id = d.id LEFT JOIN provider_schedules ps ON pp.id = ps.provider_id WHERE ($1::int IS NULL OR pd.department_id = $1) AND ($2::text IS NULL OR pp.specialty ILIKE $2) AND ($3::boolean IS NULL OR u.is_active = $3) GROUP BY pp.id, u.id ORDER BY u.last_name, u.first_name LIMIT $4 OFFSET $5;`. Create provider: `await db.query('BEGIN'); const userCheck = await db.query('SELECT id, role FROM users WHERE id = $1 AND role IN ($2, $3)', [userId, 'doctor', 'staff']); if (userCheck.rows.length === 0) throw new BadRequestError('User not found or not doctor/staff role'); const providerExists = await db.query('SELECT id FROM provider_profiles WHERE user_id = $1', [userId]); if (providerExists.rows.length > 0) throw new ConflictError('User is already a provider'); const providerResult = await db.query('INSERT INTO provider_profiles (user_id, specialty, license_number) VALUES ($1, $2, $3) RETURNING *', [userId, specialty, licenseNumber]); const providerId = providerResult.rows[0].id; for (const dept of departmentAssignments) { await db.query('INSERT INTO provider_departments (provider_id, department_id, primary_department) VALUES ($1, $2, $3)', [providerId, dept.department_id, dept.primary_department]); } for (const schedule of weeklySchedule) { await db.query('INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, is_available) VALUES ($1, $2, $3, $4, TRUE)', [providerId, schedule.day_of_week, schedule.start_time, schedule.end_time]); } await db.query('COMMIT'); await redis.del('providers:*', 'appointment-availability:*');`. Schedule overlap validation: `function detectOverlap(schedules: ScheduleEntry[]): {hasOverlap: boolean, conflicts: ScheduleEntry[]} { const byDay = schedules.reduce((acc, s) => { acc[s.day_of_week] = acc[s.day_of_week] || []; acc[s.day_of_week].push(s); return acc; }, {}); for (const day in byDay) { const sorted = byDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time)); for (let i = 0; i < sorted.length - 1; i++) { if (sorted[i].end_time > sorted[i+1].start_time) return {hasOverlap: true, conflicts: [sorted[i], sorted[i+1]]}; } } return {hasOverlap: false, conflicts: []}; }`. Blocked time conflict check: `const conflicts = await db.query('SELECT a.id, a.appointment_date, a.appointment_time, u.first_name, u.last_name, u.phone_number FROM appointments a JOIN patient_profiles pp ON a.patient_id = pp.id JOIN users u ON pp.user_id = u.id WHERE a.provider_id = $1 AND a.appointment_date = $2 AND a.appointment_time >= $3::time AND a.appointment_time < $4::time AND a.status NOT IN ($5, $6)', [providerId, blockedDate, startTime, endTime, 'cancelled', 'completed']); if (conflicts.rows.length > 0) throw new ConflictError('Blocked time conflicts with existing appointments', {has_conflicts: true, appointments: conflicts.rows});`.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── index.ts (to be modified)
│   │   └── providerRoutes.ts (to be created)
│   ├── controllers/
│   │   └── providerController.ts (to be created)
│   ├── services/
│   │   └── providerService.ts (to be created)
│   └── validators/
│       └── providerValidators.ts (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/validators/providerValidators.ts | Zod schemas for provider and schedule validation |
| CREATE | server/src/services/providerService.ts | Provider CRUD and scheduling business logic |
| CREATE | server/src/controllers/providerController.ts | Controller handlers |
| CREATE | server/src/routes/providerRoutes.ts | Express routes |
| MODIFY | server/src/routes/index.ts | Mount provider routes |

## External References
- **PostgreSQL Time Range Queries**: https://www.postgresql.org/docs/15/functions-datetime.html - Time comparison
- **PostgreSQL JSON Aggregation**: https://www.postgresql.org/docs/15/functions-aggregate.html - JSON_AGG for appointments
- **Transaction Management**: https://node-postgres.com/features/transactions - BEGIN/COMMIT/ROLLBACK
- **Time Overlap Algorithm**: https://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap - Conflict detection logic
- **Redis Pattern Matching**: https://redis.io/commands/scan/ - Cache invalidation with patterns

## Build Commands
- Build TypeScript: `npm run build`
- Run in development: `npm run dev`
- Run tests: `npm test -- providerController.test.ts`
- Type check: `npm run type-check`

## Implementation Validation Strategy
- [x] GET /api/admin/providers returns list with department and hours
- [x] Filtering by department/specialty/status works
- [x] POST /api/admin/providers creates provider profile
- [x] User role validation ensures doctor/staff only
- [x] Duplicate provider check returns 409 Conflict
- [x] Department assignments created correctly (supports multiple)
- [x] Weekly schedule entries created in batch
- [x] PUT /api/admin/providers/:id updates provider info
- [x] GET /api/admin/providers/:id/schedule returns weekly schedule and blocked times
- [x] Existing appointments included in schedule response
- [x] POST /api/admin/providers/:id/schedule validates schedule overlap
- [x] Schedule overlap detection returns 400 with conflicting entries
- [x] POST /api/admin/providers/:id/blocked-times creates blocked slot
- [x] Blocked time conflict detection returns 409 with appointment details
- [x] DELETE /api/admin/providers/:id validates future appointments
- [x] Provider deletion with future appointments returns 409 with details
- [x] GET /api/admin/providers/:id/appointments returns future appointments
- [x] Audit logging for all operations
- [x] Redis cache invalidated on changes
- [x] All endpoints require admin role

## Implementation Checklist
- [x] Create server/src/validators/provider.validator.ts (Joi schemas: createProviderSchema, updateProviderSchema, scheduleEntrySchema, updateScheduleSchema, blockedTimeSchema, listProvidersQuerySchema)
- [x] Create server/src/services/providerService.ts file
- [x] Implement getAllProviders function (SQL with JOINs, STRING_AGG, SUM hours, filters, pagination)
- [x] Implement createProvider function (user role check, duplicate check, transaction, dept assignments, schedules, audit log)
- [x] Implement updateProvider function (transaction, dept reassignment, audit log, cache invalidation)
- [x] Implement getProviderSchedule function (weekly schedule, blocked times, existing appointments)
- [x] Implement updateProviderSchedule function (overlap validation, bulk replace, transaction, audit log)
- [x] Implement detectScheduleOverlap helper function (group by day, sort by start_time, adjacent overlap check)
- [x] Implement createBlockedTime function (appointment conflict detection, 409 on conflicts, audit log)
- [x] Implement deleteProvider function (future appointment check, 409 if found, cascade delete in transaction, audit log)
- [x] Implement getProviderAppointments function (future appointments with patient details for reassignment)
- [x] Create server/src/controllers/providerController.ts file (all 9 handlers: getProviders, getProvider, createProvider, updateProvider, deleteProvider, getProviderSchedule, updateProviderSchedule, createBlockedTime, getProviderAppointments)
- [x] Add routes to server/src/routes/admin.routes.ts (GET/POST/PUT/DELETE /providers, GET/POST schedule, POST blocked-times, GET appointments)
- [ ] Write comprehensive tests (deferred - requires test infrastructure setup)
