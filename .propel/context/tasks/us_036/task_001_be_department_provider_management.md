# Task - TASK_001_BE_DEPARTMENT_PROVIDER_MANAGEMENT

## Requirement Reference
- User Story: US_036  
- Story Location: `.propel/context/tasks/us_036/us_036.md`
- Acceptance Criteria:
    - AC1: Admin dashboard displays Departments table (Name, Active Providers, Total Appointments, Status), allows add/edit/deactivate departments with operating hours, displays Providers table (Name, Specialty, Department, Availability, Status), allows add/edit providers with availability template, visual calendar editor for provider schedules, validates no overlapping assignments, refreshes booking availability <10s after changes
- Edge Cases:
    - Deactivate department with future appointments: Warn admin, offer reassignment
    - Provider schedule conflicts: Show existing appointments in red, prevent overlapping
    - Remove provider with upcoming appointments: Require reassignment before deletion

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Admin dashboard with department/provider management) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-014 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-014-admin-department-mgmt.html |
| **Screen Spec** | SCR-014 (Admin Department Management) |
| **UXR Requirements** | UXR-201 (Consistent admin layout), UXR-401 (Clear actions), NFR-REL01 (Schedule updates <10s) |
| **Design Tokens** | Add button: primary #007BFF, Edit modal: 700px width, Calendar editor: 7-col grid with time slots, Conflict indicator: red blocks, Save button: primary green |

> **Wireframe Components:**
> - Departments section: Table with Add Department button, Edit/Deactivate actions per row  
> - Department modal: Name, Description, Operating Hours (7-day grid, time pickers 6AM-10PM)
> - Providers section: Table with filters (Department/Specialty/Status), Add Provider button
> - Provider modal: Name, Specialty, Department(s) multi-select, Availability template
> - Schedule editor: Weekly calendar grid (Mon-Sun columns, 6AM-10PM rows), drag to block availability, existing appointments shown as non-editable gray blocks

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | FullCalendar | 6.x (Schedule editor) |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x |
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
| **Mobile Impact** | Yes (Responsive tables) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement department/provider management: (1) DepartmentManagement page with two sections (Departments table, Providers table), (2) POST /api/admin/departments creates department with name, description, operating_hours JSON (Mon-Sun with start/end times), (3) GET /api/admin/departments returns list with active_providers_count, total_appointments_count, (4) PATCH /api/admin/departments/:id/deactivate checks for future appointments, warns if found, (5) POST /api/admin/providers creates provider with name, specialty, department_ids[], availability_template JSONB (weekly recurring hours), (6) Provider schedule editor using FullCalendar, allows drag-to-block available times, shows existing appointments as read-only blocks, (7) Conflict validation: Backend checks no overlapping provider assignments, (8) Cache invalidation: On schedule change, clear Redis cache for GET /api/slots (from US_013), (9) Audit logging: All department/provider changes logged with admin_id.

## Dependent Tasks
- US_013 Task 002: Booking API uses departments/providers, cache invalidation needed
- US_035: Admin user management (admin role required)

## Impacted Components
**New:**
- app/src/pages/DepartmentManagement.tsx (Admin page)
- app/src/components/DepartmentTable.tsx (Departments section)
- app/src/components/ProviderTable.tsx (Providers section)
- app/src/components/DepartmentModal.tsx (Create/edit department)
- app/src/components/ProviderScheduleEditor.tsx (FullCalendar integration)
- server/src/controllers/admin-departments.controller.ts (Department CRUD)
- server/src/controllers/admin-providers.controller.ts (Provider CRUD)
- server/src/routes/admin-departments.routes.ts (Department endpoints)
- server/src/routes/admin-providers.routes.ts (Provider endpoints)
- server/src/services/admin-departments.service.ts (Department logic)
- server/src/services/admin-providers.service.ts (Provider logic + conflict detection)

**Modified:**
- server/db/schema.sql (Ensure departments, providers, provider_availability tables exist)

## Implementation Plan
1. Database schema: departments (id, name, description, operating_hours JSONB, active BOOLEAN), providers (id, name, specialty, active BOOLEAN), provider_departments (provider_id, department_id), provider_availability (provider_id, day_of_week, start_time, end_time, is_blocked BOOLEAN)
2. Implement POST /api/admin/departments: Validate operating_hours JSON format, INSERT department, audit log
3. Implement GET /api/admin/departments: Query departments with LEFT JOIN to count active providers, count appointments
4. Implement PATCH /api/admin/departments/:id/deactivate: Check appointments WHERE department_id=$1 AND appointment_datetime > NOW(), if exists return warning with count
5. Implement POST /api/admin/providers: Validate department_ids exist, INSERT provider, INSERT provider_departments, INSERT provider_availability from template
6. Provider schedule editor: FullCalendar with timeGrid view, editable:true, events from provider_availability + existing appointments (read-only), eventDrop saves updated availability
7. Conflict validation: On provider assignment, check no overlapping provider_availability for same department + time
8. Cache invalidation: After department/provider changes, DELETE FROM Redis key slots:*
9. Frontend: DepartmentManagement page with tabs (Departments, Providers), modals for create/edit
10. Test: Create department → add provider → edit schedule → verify bookingAPI refreshes slots <10s

## Current Project State
```
ASSIGNMENT/
├── server/src/ (admin-users from US_035 exists)
├── app/src/pages/ (user management exists)
└── (department/provider management to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/DepartmentManagement.tsx | Admin page |
| CREATE | app/src/components/DepartmentTable.tsx | Departments table |
| CREATE | app/src/components/ProviderTable.tsx | Providers table |
| CREATE | app/src/components/DepartmentModal.tsx | Create/edit modal |
| CREATE | app/src/components/ProviderScheduleEditor.tsx | Calendar editor |
| CREATE | server/src/controllers/admin-departments.controller.ts | Department handlers |
| CREATE | server/src/controllers/admin-providers.controller.ts | Provider handlers |
| CREATE | server/src/routes/admin-departments.routes.ts | Department routes |
| CREATE | server/src/routes/admin-providers.routes.ts | Provider routes |
| CREATE | server/src/services/admin-departments.service.ts | Department logic |
| CREATE | server/src/services/admin-providers.service.ts | Provider logic |
| UPDATE | server/db/schema.sql | Ensure departments, providers tables |

## External References
- [FullCalendar Documentation](https://fullcalendar.io/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [FR-012 Department Management](../../../.propel/context/docs/spec.md#FR-012)
- [NFR-REL01 Schedule Sync <10s](../../../.propel/context/docs/spec.md#NFR-REL01)

## Build Commands
```bash
cd app
npm install @fullcalendar/react @fullcalendar/timegrid @fullcalendar/interaction
npm run dev

cd server
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: departmentService validates operating_hours JSON
- [ ] Integration tests: POST /admin/departments creates department
- [ ] @fullcalendar installed: package.json shows @fullcalendar/react
- [ ] Department management page renders: Navigate to /admin/departments → see tables
- [ ] Departments table: Shows name, active providers count, total appointments, status
- [ ] Add department: Click "Add Department" → modal opens, form submits → department created
- [ ] Operating hours: Modal has 7-day grid (Mon-Sun), time pickers for each day
- [ ] Providers table: Shows name, specialty, department, availability hours, status
- [ ] Add provider: Click "Add Provider" → modal with name, specialty, department multi-select
- [ ] Availability template: Weekly recurring hours (Mon 9AM-5PM, Tue 8AM-4PM, etc.)
- [ ] Schedule editor: Click "Edit Schedule" → FullCalendar opens with time grid
- [ ] Drag availability: Drag on calendar → blocks available time, saves to database
- [ ] Existing appointments: Shows as gray non-editable blocks on calendar
- [ ] Conflict validation: Assign provider to overlapping times → error "Schedule conflict"
- [ ] Deactivate warning: Deactivate department with future appointments → warning "X appointments will be affected"
- [ ] Cache invalidation: Edit provider schedule → GET /api/slots refreshes <10s
- [ ] Audit logged: Query audit_logs → see department_created, provider_updated actions

## Implementation Checklist
- [ ] Install FullCalendar: `npm install @fullcalendar/react @fullcalendar/timegrid @fullcalendar/interaction`
- [ ] Create/update departments, providers database tables
- [ ] Implement admin-departments.service.ts CRUD logic
- [ ] Implement admin-providers.service.ts with conflict detection
- [ ] Create admin-departments.controller.ts + routes.ts
- [ ] Create admin-providers.controller.ts + routes.ts
- [ ] Create DepartmentManagement.tsx page
- [ ] Create DepartmentTable.tsx + DepartmentModal.tsx
- [ ] Create ProviderTable.tsx + ProviderScheduleEditor.tsx with FullCalendar
- [ ] Implement cache invalidation on schedule changes
- [ ] Test department/provider management flow
- [ ] Validate <10s schedule sync
- [ ] Document department management in server/README.md
