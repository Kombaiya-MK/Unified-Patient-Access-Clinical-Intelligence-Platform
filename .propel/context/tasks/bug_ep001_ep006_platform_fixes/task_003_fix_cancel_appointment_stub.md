---
task: BUG_APPT_001
title: "Fix Cancel Appointment Stub Not Wired to API Service"
date: 2026-04-02
status: Resolved
template: issue-triage-template
priority: High
epic: EP-002
---

# Bug Fix Task - BUG_APPT_001

## Bug Report Reference

- Bug ID: BUG_APPT_001
- Source: Platform audit of EP-001 through EP-006 completed features
- Related Epics: EP-002 (Patient Appointment Booking & Management)

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Core feature broken — cancel appointment button shows alert instead of actually cancelling
- **Affected Version**: `feature/us020-queue-management-api-realtime` branch
- **Environment**: React 19.x / TypeScript 5.9.x / Vite 5 / All browsers

### Steps to Reproduce

1. Login as a patient user
2. Navigate to Patient Dashboard (`/patient/dashboard`)
3. View the appointments list with an upcoming appointment
4. Click the "Cancel" button on an appointment
5. Confirm the browser confirmation dialog
6. **Expected**: Appointment is cancelled via API, status changes to "cancelled", appointment list refreshes
7. **Actual**: A browser `alert()` displays "Cancel appointment {id} - Feature coming soon!" — no API call is made, appointment status unchanged

**Error Output**:

```text
PatientDashboard.tsx — handleCancel function (lines 43-48):
  const handleCancel = (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      alert(`Cancel appointment ${appointmentId} - Feature coming soon!`);
    }
  };

→ No API call made
→ No state update
→ No list refresh
```

### Root Cause Analysis

- **File**: `app/src/pages/PatientDashboard.tsx`
- **Component**: PatientDashboard
- **Function**: `handleCancel(appointmentId: string)`
- **Cause**: The `handleCancel` function was implemented as a TODO stub using `alert()` instead of calling the existing `cancelAppointment` service function. The service function (`app/src/services/appointmentService.ts:259`) was fully implemented — it makes a `PATCH /api/appointments/${appointmentId}/cancel` request — but was never imported or invoked by the dashboard.
- **Underlying Cause**: The PatientDashboard was built in US_019 TASK_001 as a display-only component. The cancel functionality was deferred with a `// TODO: Implement cancel logic with confirmation` comment. When the cancel API was implemented in US_013 TASK_002, the dashboard was not updated to wire it up.
- **Why Not Caught Earlier**: The confirmation dialog (`confirm()`) gives the visual appearance that something is happening. The `alert()` message says "Feature coming soon!" which was accepted during demo as expected behavior. No integration tests existed for the cancel flow.

### Impact Assessment

- **Affected Features**: Patient appointment cancellation — a core EP-002 workflow
- **User Impact**: 100% of patients cannot cancel appointments from the dashboard. They see a misleading "feature coming soon" message for functionality that already exists in the backend.
- **Data Integrity Risk**: None — the stub fails safe (no API call, no data change)
- **Security Implications**: None

## Fix Applied

**File**: `app/src/pages/PatientDashboard.tsx`

1. Added `import { cancelAppointment } from '../services/appointmentService'`
2. Added `useState` import for cancelling state tracker
3. Replaced stub `handleCancel` with async implementation:
   - Shows browser `confirm()` dialog
   - Sets `cancellingId` state for loading indicator
   - Calls `cancelAppointment(appointmentId, 'Cancelled by patient')`
   - Calls `refreshAppointments()` on success to update the list
   - Shows error alert on failure with proper error message extraction
   - Clears `cancellingId` in `finally` block

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors
- Vite build: 879 modules transformed successfully
