---
task: BUG_NAV_001
title: "Fix NavigationSidebar Static Broken Routes for All Roles"
date: 2026-04-02
status: Resolved
template: issue-triage-template
priority: High
epic: EP-001, EP-002, EP-003, EP-004, EP-005, EP-006
---

# Bug Fix Task - BUG_NAV_001

## Bug Report Reference

- Bug ID: BUG_NAV_001
- Source: Platform audit of EP-001 through EP-006 completed features
- Related Epics: EP-001 (Authentication), EP-002 (Patient Appointments), EP-003 (Staff Queue), EP-004 (AI Intake), EP-005 (Document Extraction), EP-006 (Clinical Intelligence)

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Navigation broken — sidebar links point to non-existent or incorrect routes; only 2 of 6 links functional
- **Affected Version**: `feature/us020-queue-management-api-realtime` branch
- **Environment**: React 19.x / TypeScript 5.9.x / Vite 5 / All browsers

### Steps to Reproduce

1. Login as any user role (patient, staff, admin, doctor)
2. Observe the left sidebar navigation
3. Click on any link beyond "Dashboard"
4. **Expected**: Navigate to the correct page for the user's role
5. **Actual**: Links point to hardcoded paths like `/appointments`, `/documents`, `/intake`, `/profile`, `/settings` — none of which have registered routes in App.tsx. Clicking them redirects to `/login` (fallback route).

**Error Output**:

```text
NavigationSidebar.tsx — Static NAV_ITEMS array:
  { path: '/appointments' }     → No route registered (correct: /appointments/book for patient)
  { path: '/documents' }        → No route registered (correct: /documents/upload/:patientId)
  { path: '/intake' }           → No route registered (correct: /intake/ai or /intake/manual)
  { path: '/profile' }          → No route registered (not implemented)
  { path: '/settings' }         → No route registered (not implemented)

All 5 links → fallback route → Navigate to /login
```

### Root Cause Analysis

- **File**: `app/src/components/dashboard/NavigationSidebar.tsx`
- **Component**: NavigationSidebar
- **Cause**: The component used a static `NAV_ITEMS` array with hardcoded generic paths (`/appointments`, `/documents`, `/intake`, `/profile`, `/settings`) that were never matched by any `<Route>` in `App.tsx`. The sidebar was role-agnostic — all users saw the same 6 links regardless of role. Staff and admin users saw patient-oriented links; patient users saw links to non-existent pages.
- **Underlying Cause**: The sidebar was built as a placeholder during US_019 TASK_001 with assumed future route paths. As the actual pages were implemented in subsequent tasks (EP-003 through EP-006), the sidebar was never updated to match the real registered routes.
- **Why Not Caught Earlier**: Only `/patient/dashboard` and `/login` were tested in the original US_019 implementation. The sidebar links were visually present but never click-tested against the routing table.

### Impact Assessment

- **Affected Features**: All dashboard navigation for all roles (patient, staff, admin, doctor)
- **User Impact**: 100% of authenticated users have 5 of 6 sidebar links broken — unable to navigate to Queue, Booking, Documents, Intake, or Clinical Review from the sidebar
- **Data Integrity Risk**: None — read-only navigation issue
- **Security Implications**: None — broken links redirect to login (safe fallback)

## Fix Applied

**File**: `app/src/components/dashboard/NavigationSidebar.tsx`

Replaced static `NAV_ITEMS` array with dynamic `getNavItems(role?, userId?)` function that returns role-specific navigation:

- **Patient**: Dashboard (`/patient/dashboard`), Book Appointment (`/appointments/book`), Documents (`/documents/upload/${userId}`), AI Intake (`/intake/ai`), Manual Intake (`/intake/manual`)
- **Staff/Doctor**: Dashboard (`/staff/dashboard`), Patient Queue (`/staff/queue`), Book for Patient (`/staff/appointments/book`), AI Intake (`/intake/ai`), Manual Intake (`/intake/manual`)
- **Admin**: Dashboard (`/admin/dashboard`), Patient Queue (`/staff/queue`), Book for Patient (`/staff/appointments/book`), Audit Logs (`/admin/audit-logs`)

All paths now correspond to registered `<Route>` entries in `App.tsx`.

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors
- Vite build: 879 modules transformed successfully
