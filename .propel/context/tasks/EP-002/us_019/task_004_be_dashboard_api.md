# Task - TASK_004: Backend Dashboard API Aggregation

## Requirement Reference
- User Story: [us_019]
- Story Location: [.propel/context/tasks/us_019/us_019.md]
- Acceptance Criteria:
    - AC1: API endpoint returns upcoming appointments (next 3), past appointments (last 5), and notifications in single response
    - AC1: Response includes patient name, profile photo URL, unread notification count
    - AC1: Appointments include status, date/time, provider, department, location
- Edge Case:
    - N/A (data aggregation concerns)

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
| Backend | Node.js (Express) | 20.x LTS |
| Database | PostgreSQL | 15.x |

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
Create a GET /api/patients/dashboard endpoint that aggregates all dashboard data in a single optimized query. Returns patient info, upcoming appointments (limit 3), past appointments (limit 5), notifications (limit 5), and unread notification count. Uses SQL JOINs to minimize database round trips and implements caching for performance.

## Dependent Tasks
- US-007: Appointments table with required fields
- US-046: Notifications table (if not ready, return empty array with TODO comment)

## Impacted Components
- **CREATE** server/src/controllers/dashboardController.ts - Controller for dashboard data aggregation
- **CREATE** server/src/routes/dashboardRoutes.ts - Express routes for dashboard endpoints
- **CREATE** server/src/services/dashboardService.ts - Service layer for dashboard data queries
- **CREATE** server/src/types/dashboard.types.ts - TypeScript interfaces for dashboard data
- **MODIFY** server/src/routes/index.ts - Register dashboard routes
- **MODIFY** server/src/app.ts - Add dashboard routes to Express app (if needed)

## Implementation Plan
1. **Create dashboard.types.ts**: Define interfaces for `DashboardData`, `DashboardAppointment`, `DashboardNotification`, `DashboardResponse`
2. **Create dashboardService.ts**: Implement `getPatientDashboard(patientId)` function with SQL queries:
   - Query 1: Get patient info (name, email, profile_photo_url) from Patients table
   - Query 2: Get upcoming appointments (status != 'completed', appointment_date >= CURRENT_DATE, ORDER BY appointment_date ASC LIMIT 3) with JOINs to Providers, Departments
   - Query 3: Get past appointments (status IN ('completed', 'cancelled'), ORDER BY appointment_date DESC LIMIT 5) with JOINs
   - Query 4: Get notifications (ORDER BY created_at DESC LIMIT 5) with unread count
3. **Optimize Queries**: Use single query with CTEs (Common Table Expressions) to reduce round trips:
   ```sql
   WITH upcoming AS (
     SELECT ... FROM appointments WHERE patient_id = $1 AND status != 'completed' AND appointment_date >= CURRENT_DATE ORDER BY appointment_date ASC LIMIT 3
   ),
   past AS (
     SELECT ... FROM appointments WHERE patient_id = $1 AND status IN ('completed', 'cancelled') ORDER BY appointment_date DESC LIMIT 5
   ),
   notifications AS (
     SELECT ... FROM notifications WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 5
   )
   SELECT * FROM upcoming, past, notifications;
   ```
4. **Create dashboardController.ts**: Implement `getDashboard()` handler that extracts patientId from authenticated user, calls `dashboardService.getPatientDashboard()`, formats response
5. **Create dashboardRoutes.ts**: Define GET /api/patients/dashboard route with authentication middleware
6. **Add Error Handling**: Handle cases where patient not found, no appointments exist, return appropriate HTTP status codes
7. **Add Response Caching**: Use in-memory cache (Map) with 5-minute TTL to cache dashboard data per patient, invalidate on appointment updates
8. **Add Audit Logging**: Log dashboard access to audit_log table with patient_id, timestamp, IP address

**Focus on how to implement**: Use PostgreSQL CTEs for efficient multi-query aggregation. Cache results in-memory (not Redis for now) with TTL. Return consistent JSON structure even when sections are empty (e.g., upcomingAppointments: []). Use proper HTTP status codes (200 OK, 401 Unauthorized, 404 Patient Not Found, 500 Server Error). Add request logging for performance monitoring.

## Current Project State
```
server/
├── src/
│   ├── controllers/
│   │   ├── appointments.controller.ts
│   │   ├── auth.controller.ts
│   │   └── (dashboardController.ts to be created)
│   ├── routes/
│   │   ├── appointments.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── index.ts (to be modified)
│   │   └── (dashboardRoutes.ts to be created)
│   ├── services/
│   │   ├── authService.ts
│   │   └── (dashboardService.ts to be created)
│   ├── types/
│   │   ├── appointment.types.ts
│   │   ├── auth.types.ts
│   │   └── (dashboard.types.ts to be created)
│   ├── middleware/
│   │   └── authMiddleware.ts
│   └── app.ts
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/dashboardController.ts | Controller with getDashboard() handler (extract patientId, call service, return formatted response) |
| CREATE | server/src/routes/dashboardRoutes.ts | Express route: GET /api/patients/dashboard with authentication middleware |
| CREATE | server/src/services/dashboardService.ts | Service with getPatientDashboard(patientId) function using optimized SQL queries with CTEs |
| CREATE | server/src/types/dashboard.types.ts | TypeScript interfaces: DashboardData, DashboardAppointment, DashboardNotification, DashboardResponse |
| MODIFY | server/src/routes/index.ts | Import and register dashboardRoutes with router |

## External References
- **PostgreSQL CTEs**: https://www.postgresql.org/docs/current/queries-with.html - Common Table Expressions for multi-query optimization
- **Node.js In-Memory Caching**: https://www.npmjs.com/package/node-cache - In-memory cache with TTL
- **Express Error Handling**: https://expressjs.com/en/guide/error-handling.html - Best practices for async error handling
- **PostgreSQL JOINs**: https://www.postgresql.org/docs/current/tutorial-join.html - Efficient JOIN queries
- **REST API Response Format**: https://jsonapi.org/ - Consistent JSON response structure
- **SQL Query Optimization**: https://www.postgresql.org/docs/current/performance-tips.html - Query performance tips

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (execute unit and integration tests)
- Test endpoint: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/patients/dashboard`

## Implementation Validation Strategy
- [x] Unit tests pass for dashboardController and dashboardService
- [x] Integration tests pass: Full dashboard API request returns expected structure
- [x] API endpoint validation: GET /api/patients/dashboard returns 200 with all fields
- [x] Data filtering validation: Upcoming appointments (status != completed, limit 3), past appointments (limit 5)
- [x] Empty state validation: API returns empty arrays when no data exists (not null)
- [x] Authentication validation: Unauthenticated requests return 401 Unauthorized
- [x] Performance validation: Response time <500ms for typical dashboard load
- [x] Cache validation: Second request within 5 minutes uses cached data (verify via logs)

## Implementation Checklist
- [x] Create dashboard.types.ts with interfaces: DashboardData (patient: { id, name, email, profilePhotoUrl }, upcomingAppointments: DashboardAppointment[], pastAppointments: DashboardAppointment[], notifications: DashboardNotification[], unreadCount: number)
- [x] Create dashboardService.ts with getPatientDashboard(patientId: string) function using SQL CTE query to fetch patient info, upcoming appointments (JOIN Providers, Departments, LIMIT 3), past appointments (LIMIT 5), notifications (LIMIT 5)
- [x] Implement query optimization using PostgreSQL CTEs (WITH upcoming AS ..., past AS ..., notifications AS ...) to minimize database round trips
- [x] Create dashboardController.ts with getDashboard() handler (extract user.id from req.user, call dashboardService, return JSON response with 200 status)
- [x] Create dashboardRoutes.ts with GET /api/patients/dashboard route protected by authMiddleware (verifyToken)
- [x] Modify routes/index.ts to import and register dashboardRoutes (router.use('/patients', dashboardRoutes))
- [x] Add in-memory caching using Map with 5-minute TTL (cache key: patientId, store dashboard data, invalidate on appointment create/update)
- [x] Add error handling for patient not found (404), database errors (500), authentication errors (401) with appropriate HTTP status codes and error messages
