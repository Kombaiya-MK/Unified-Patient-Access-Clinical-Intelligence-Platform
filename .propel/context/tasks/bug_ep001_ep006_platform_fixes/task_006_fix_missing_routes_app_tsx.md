---
task: BUG_ROUTE_001
title: "Fix Missing App.tsx Routes — Audit Logs Unregistered, Doctor Role Excluded from EP-004/EP-005/EP-006 Routes"
date: 2026-04-02
status: Resolved
template: issue-triage-template
priority: High
epic: EP-001, EP-004, EP-005, EP-006
---

# Bug Fix Task - BUG_ROUTE_001

## Bug Report Reference

- Bug ID: BUG_ROUTE_001
- Source: Platform audit of EP-001 through EP-006 completed features
- Related Epics: EP-001 (Authentication — Audit Logs route), EP-004 (AI Intake), EP-005 (Document Extraction), EP-006 (Clinical Intelligence)

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Missing route makes AuditLogsPage completely inaccessible; doctor role blocked from 4 routes it should access
- **Affected Version**: `feature/us020-queue-management-api-realtime` branch
- **Environment**: React 19.x / TypeScript 5.9.x / Vite 5 / All browsers

### Steps to Reproduce

**Bug A — Missing Audit Logs Route:**

1. Login as an admin user
2. Navigate to `/admin/audit-logs` directly in browser address bar
3. **Expected**: AuditLogsPage renders with filters, table, pagination, and export
4. **Actual**: React Router has no matching route → falls through to `<Route path="*">` → redirects to `/login`

**Bug B — Doctor Role Excluded:**

1. Login as a doctor user
2. Navigate to `/intake/ai` or `/intake/manual` or `/documents/upload/123` or `/clinical-review/123`
3. **Expected**: Page renders — doctors should access intake forms, document upload, and clinical review
4. **Actual**: ProtectedRoute checks `allowedRoles={['patient', 'staff', 'admin']}` (no `'doctor'`) → redirects to `/unauthorized`

**Error Output**:

```text
App.tsx — Route configuration:

Bug A: No route registered for /admin/audit-logs
  AuditLogsPage exists at: app/src/pages/AuditLogsPage.tsx (fully built)
  Components built: AuditLogFilters, AuditLogTable, AuditLogPagination, auditExport utility
  → Feature complete but unreachable

Bug B: Doctor role missing from allowedRoles:
  /intake/ai         → allowedRoles: ['patient', 'staff', 'admin']       (missing 'doctor')
  /intake/manual     → allowedRoles: ['patient', 'staff', 'admin']       (missing 'doctor')
  /documents/upload  → allowedRoles: ['patient', 'staff', 'admin']       (missing 'doctor')
  /clinical-review   → allowedRoles: ['staff', 'admin']                  (missing 'doctor')
```

### Root Cause Analysis

#### Bug A: Missing Audit Logs Route

- **File**: `app/src/App.tsx`
- **Cause**: The AuditLogsPage was implemented in US_011 TASK_004 as a standalone page component but no corresponding `<Route>` was added to App.tsx. The import statement and route registration were both missing.
- **Underlying Cause**: US_011 TASK_004 focused on building the page and its sub-components (filters, table, pagination, export). The task scope did not include "register the route in App.tsx" as an explicit step, and the developer who built AuditLogsPage did not update the router.

#### Bug B: Doctor Role Excluded from Routes

- **File**: `app/src/App.tsx`
- **Cause**: When the intake, document upload, and clinical review routes were added, the `allowedRoles` arrays only included `patient`, `staff`, and `admin`. The `doctor` role was not included despite doctors needing access to all clinical features.
- **Underlying Cause**: The doctor role was added as a distinct role after the initial route setup. The doctor dashboard route (`/doctor/dashboard`) was added and uses `allowedRoles={['doctor', 'admin']}`, but the downstream feature routes were not updated to include `doctor`.

### Impact Assessment

- **Affected Features**:
  - Bug A: Entire Audit Logs feature (US_011 TASK_004) — 4 components, fully built, zero accessibility
  - Bug B: All clinical workflows for doctor users — intake, documents, clinical review
- **User Impact**:
  - Bug A: 100% of admin users cannot access audit logs
  - Bug B: 100% of doctor users cannot access intake forms, document upload, or clinical review
- **Data Integrity Risk**: None — routing/access control issue
- **Security Implications**: Bug B is overly restrictive (not a security hole). Bug A means audit trail cannot be reviewed (operational gap).

## Fix Applied

**File**: `app/src/App.tsx`

1. Added `import AuditLogsPage from './pages/AuditLogsPage'`
2. Added new route:
   ```tsx
   <Route path="/admin/audit-logs"
     element={<ProtectedRoute allowedRoles={['admin']}><AuditLogsPage /></ProtectedRoute>}
   />
   ```
3. Added `'doctor'` to `allowedRoles` for 4 routes:
   - `/intake/ai` → `['patient', 'staff', 'doctor', 'admin']`
   - `/intake/manual` → `['patient', 'staff', 'doctor', 'admin']`
   - `/documents/upload/:patientId` → `['patient', 'staff', 'doctor', 'admin']`
   - `/clinical-review/:patientId` → `['staff', 'doctor', 'admin']`

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors
- Vite build: 879 modules transformed successfully
