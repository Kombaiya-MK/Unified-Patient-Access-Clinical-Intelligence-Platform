---
task: BUG_DASH_002
title: "Fix AdminDashboard Placeholder — Replace with Functional Navigation Including Audit Logs"
date: 2026-04-02
status: Resolved
template: issue-triage-template
priority: High
epic: EP-001, EP-003, EP-004
---

# Bug Fix Task - BUG_DASH_002

## Bug Report Reference

- Bug ID: BUG_DASH_002
- Source: Platform audit of EP-001 through EP-006 completed features
- Related Epics: EP-001 (Authentication — Audit Logs), EP-003 (Staff Queue), EP-004 (AI Patient Intake)

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Admin dashboard is a non-functional placeholder — admin users cannot access audit logs, queue management, or any other implemented feature from their dashboard
- **Affected Version**: `feature/us020-queue-management-api-realtime` branch
- **Environment**: React 19.x / TypeScript 5.9.x / Vite 5 / All browsers

### Steps to Reproduce

1. Login as an admin user
2. Navigate to Admin Dashboard (`/admin/dashboard`)
3. **Expected**: Dashboard with navigation to Audit Logs, Queue Management, Appointment Booking, AI Intake, Manual Intake
4. **Actual**: A placeholder page showing "Authentication Successful" text and a bullet-point list of "Upcoming Features" including "Security audit logs" — despite the AuditLogsPage being fully implemented with filters, pagination, sorting, and CSV/JSON export

**Error Output**:

```text
AdminDashboard.tsx — 60-line placeholder component (identical structure to StaffDashboard):
  <h2>✅ Authentication Successful</h2>
  <p>Welcome to the Admin Dashboard!</p>
  ...
  <h3>Upcoming Features</h3>
  <ul>
    <li>🔐 Security audit logs</li>   ← ALREADY IMPLEMENTED (AuditLogsPage.tsx)
    <li>👥 User management</li>
    ...
  </ul>
  <p><em>This is a placeholder dashboard.</em></p>

→ No clickable links or navigation
→ AuditLogsPage fully built but unreachable
→ Admin cannot reach /admin/audit-logs, /staff/queue, /staff/appointments/book, /intake/ai, /intake/manual
```

### Root Cause Analysis

- **File**: `app/src/pages/AdminDashboard.tsx`
- **Component**: AdminDashboard
- **Cause**: Identical issue to BUG_DASH_001 (StaffDashboard). The component was created during US_012 TASK_003 as a placeholder. The AuditLogsPage was implemented in US_011 TASK_004 with full functionality (AuditLogFilters, AuditLogTable, AuditLogPagination, CSV/JSON export via auditExport utility), but the AdminDashboard was never updated to link to it.
- **Underlying Cause**: The AdminDashboard was built during EP-001 before any admin-specific features existed. The AuditLogsPage was built later but only as a standalone component — no route was registered in App.tsx and no navigation link was added to the admin dashboard.
- **Why Not Caught Earlier**: The AuditLogsPage was tested in isolation during US_011 but never through the actual app navigation flow. The placeholder dashboard was accepted as-is during EP-001 review.

### Impact Assessment

- **Affected Features**: Admin dashboard landing page — the primary entry point for all admin workflows. Audit log viewer (US_011 TASK_004) completely inaccessible via normal navigation.
- **User Impact**: 100% of admin users see a dead-end placeholder. The entire audit log feature (fully built with 4 specialized components) is unreachable.
- **Data Integrity Risk**: None — display-only issue
- **Security Implications**: Audit logs being inaccessible means admins cannot review security events, which is an operational gap (though not a vulnerability).

## Fix Applied

**File**: `app/src/pages/AdminDashboard.tsx`

Replaced the 60-line placeholder with a functional dashboard featuring:

1. Added `useNavigate` from `react-router-dom`
2. Created `ADMIN_NAV_CARDS` array with 5 navigation cards:
   - Audit Logs → `/admin/audit-logs` (admin-specific, first card)
   - Patient Queue → `/staff/queue`
   - Book Appointment → `/staff/appointments/book`
   - AI Intake → `/intake/ai`
   - Manual Intake → `/intake/manual`
3. Each card renders as an accessible `<button>` with icon, title, description
4. Uses shared `.dashboard__nav-grid` / `.dashboard__nav-card` CSS classes
5. Grid uses `aria-label="Admin workflows"` for accessibility

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors
- Vite build: 879 modules transformed successfully
