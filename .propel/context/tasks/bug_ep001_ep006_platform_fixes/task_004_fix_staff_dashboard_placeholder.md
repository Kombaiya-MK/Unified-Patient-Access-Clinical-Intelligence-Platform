---
task: BUG_DASH_001
title: "Fix StaffDashboard Placeholder — Replace with Functional Navigation Dashboard"
date: 2026-04-02
status: Resolved
template: issue-triage-template
priority: High
epic: EP-003, EP-004
---

# Bug Fix Task - BUG_DASH_001

## Bug Report Reference

- Bug ID: BUG_DASH_001
- Source: Platform audit of EP-001 through EP-006 completed features
- Related Epics: EP-003 (Staff Queue Management), EP-004 (AI Patient Intake)

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Staff dashboard is a non-functional placeholder — staff users have no way to access queue management, booking, or intake pages from their dashboard
- **Affected Version**: `feature/us020-queue-management-api-realtime` branch
- **Environment**: React 19.x / TypeScript 5.9.x / Vite 5 / All browsers

### Steps to Reproduce

1. Login as a staff user (e.g., `staff.wilson@upaci.com`)
2. Navigate to Staff Dashboard (`/staff/dashboard`)
3. **Expected**: Dashboard with navigation to Queue Management, Appointment Booking, AI Intake, Manual Intake — all fully implemented pages
4. **Actual**: A placeholder page showing "Authentication Successful" text and a bullet-point list of "Upcoming Features" with the note "This is a placeholder dashboard. Full implementation coming in future tasks."

**Error Output**:

```text
StaffDashboard.tsx — 60-line placeholder component:
  <h2>✅ Authentication Successful</h2>
  <p>Welcome to the Staff Dashboard!</p>
  ...
  <h3>Upcoming Features</h3>
  <ul>
    <li>👥 View patient queue</li>
    <li>📋 Manage appointments</li>
    ...
  </ul>
  <p><em>This is a placeholder dashboard.</em></p>

→ No clickable links or navigation
→ All features listed as "upcoming" are already implemented
→ Staff cannot reach /staff/queue, /staff/appointments/book, /intake/ai, /intake/manual
```

### Root Cause Analysis

- **File**: `app/src/pages/StaffDashboard.tsx`
- **Component**: StaffDashboard
- **Cause**: The component was created during US_012 TASK_003 as an explicit placeholder with a `// This is a placeholder component - full implementation in future tasks` comment. It displays the user's authentication info and a static list of planned features. No navigation links, cards, or router integration was included.
- **Underlying Cause**: The StaffDashboard was built during EP-001 (Authentication) before any of the staff-facing features existed. EP-003 (Queue Management with `QueueManagementPage`), EP-002 (Staff Booking with `StaffBookingPage`), and EP-004 (AI Intake with `AIPatientIntakePage`) were all implemented in subsequent epics but the StaffDashboard was never updated to link to them.
- **Why Not Caught Earlier**: Testing focused on individual page components (QueueManagementPage, StaffBookingPage, etc.) via direct URL. The dashboard landing page was not retested after downstream features were completed. Also used by the Doctor dashboard route (`/doctor/dashboard`) which suffers the same issue.

### Impact Assessment

- **Affected Features**: Staff dashboard landing page — the primary entry point for all staff workflows. Also affects doctor dashboard (which renders the same component).
- **User Impact**: 100% of staff and doctor users see a dead-end placeholder after login. They must manually type URLs to access any feature.
- **Data Integrity Risk**: None — display-only issue
- **Security Implications**: None — existing ProtectedRoute guards are intact

## Fix Applied

**File**: `app/src/pages/StaffDashboard.tsx`

Replaced the 60-line placeholder with a functional dashboard featuring:

1. Added `useNavigate` from `react-router-dom`
2. Created `STAFF_NAV_CARDS` array with 4 navigation cards:
   - Patient Queue → `/staff/queue`
   - Book Appointment → `/staff/appointments/book`
   - AI Intake → `/intake/ai`
   - Manual Intake → `/intake/manual`
3. Each card renders as a `<button>` with icon, title, description, and `onClick={() => navigate(card.path)}`
4. Cards use new `.dashboard__nav-grid` / `.dashboard__nav-card` CSS classes added to `Dashboard.css`
5. Grid uses `aria-label="Staff workflows"` and cards use `aria-hidden="true"` on decorative icons for accessibility

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors
- Vite build: 879 modules transformed successfully
