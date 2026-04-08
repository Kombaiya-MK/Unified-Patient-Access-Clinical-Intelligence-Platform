---
task: BUG_API_001
title: "Fix getPatientAppointments API Returning 501 Not Implemented"
date: 2026-04-02
status: Resolved
template: issue-triage-template
priority: Critical
epic: EP-002
---

# Bug Fix Task - BUG_API_001

## Bug Report Reference

- Bug ID: BUG_API_001
- Source: Platform audit of EP-001 through EP-006 completed features
- Related Epics: EP-002 (Patient Appointment Booking & Management)

## Bug Summary

### Issue Classification

- **Priority**: Critical
- **Severity**: API endpoint returns 501 — any client calling `GET /api/appointments/patient/:patientId` always receives an error. The backend service to fulfill this request already exists but is not wired up.
- **Affected Version**: `feature/us020-queue-management-api-realtime` branch
- **Environment**: Node.js v20.10.0 / Express / TypeScript 5.9.x / Neon PostgreSQL

### Steps to Reproduce

1. Start the backend server (`npm run dev` in `/server`)
2. Login and obtain a valid JWT token
3. Send request: `GET /api/appointments/patient/123` with `Authorization: Bearer <token>`
4. **Expected**: JSON response with the patient's appointments array
5. **Actual**: HTTP 501 response:
   ```json
   {
     "success": false,
     "message": "Not implemented yet"
   }
   ```

**Error Output**:

```text
server/src/controllers/appointments.controller.ts — getPatientAppointments method (line 346-349):
  // TODO: Implement getPatientAppointments in service
  res.status(501).json({
    success: false,
    message: 'Not implemented yet',
  });

Existing working implementation available at:
  server/src/services/dashboardService.ts:193 — getPatientAppointments(userId: number)
  → Queries app.appointments JOIN app.users JOIN app.departments
  → Returns DashboardAppointment[] with provider and department details
  → Already used successfully by dashboardController.getMyAppointments()
```

### Root Cause Analysis

- **File**: `server/src/controllers/appointments.controller.ts`
- **Component**: AppointmentsController
- **Method**: `getPatientAppointments(req, res)`
- **Cause**: The controller method has proper authentication and authorization logic (patients can only access their own appointments, staff/admin can access any), but the actual data fetch was left as a TODO stub returning 501. The `getPatientAppointments` function in `dashboardService.ts` was already fully implemented and tested (used by the dashboard's "My Appointments" feature), but the appointments controller was not connected to it.
- **Underlying Cause**: The appointments controller was developed in US_013 TASK_002. The `getPatientAppointments` endpoint was scaffolded with auth/authz guards but the service call was deferred. When `dashboardService.getPatientAppointments` was implemented in a different task (US_019), the controller was not revisited.
- **Why Not Caught Earlier**: The frontend Patient Dashboard uses `useAppointments()` context which calls the dashboard API (`/api/dashboard/appointments`), not this endpoint. This endpoint was only used by direct API consumers. No automated API tests cover this endpoint.

### Impact Assessment

- **Affected Features**: `GET /api/appointments/patient/:patientId` — used for cross-patient appointment lookups by staff and admin
- **User Impact**: Staff and admin users cannot fetch a specific patient's appointments via this endpoint. Patient-facing features work through the separate dashboard endpoint.
- **Data Integrity Risk**: None — fails safe with 501 (no data mutation)
- **Security Implications**: None — authentication and authorization guards are already in place and functioning correctly

## Fix Applied

**File**: `server/src/controllers/appointments.controller.ts`

1. Added import: `import { getPatientAppointments as fetchPatientAppointments } from '../services/dashboardService'`
2. Replaced the 501 stub with:
   ```typescript
   const appointments = await fetchPatientAppointments(parseInt(requestedPatientId, 10));
   res.status(200).json({
     success: true,
     data: appointments,
   });
   ```
3. Added `as string` type assertion on `req.params.patientId` to resolve TypeScript `string | string[]` union type error

The existing authorization guard (lines 336-343) remains intact — patients can only access their own appointments; staff/admin can access any patient's.

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors in `/server`
- Service function: `dashboardService.getPatientAppointments` already validated by existing dashboard endpoint usage
