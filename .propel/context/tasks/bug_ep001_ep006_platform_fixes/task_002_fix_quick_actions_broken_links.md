---
task: BUG_NAV_002
title: "Fix QuickActions Static Broken Routes on Patient Dashboard"
date: 2026-04-02
status: Resolved
template: issue-triage-template
priority: High
epic: EP-002, EP-004, EP-005
---

# Bug Fix Task - BUG_NAV_002

## Bug Report Reference

- Bug ID: BUG_NAV_002
- Source: Platform audit of EP-001 through EP-006 completed features
- Related Epics: EP-002 (Patient Appointments), EP-004 (AI Intake), EP-005 (Document Extraction)

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Navigation broken — all 4 quick action buttons on Patient Dashboard navigate to non-existent routes
- **Affected Version**: `feature/us020-queue-management-api-realtime` branch
- **Environment**: React 19.x / TypeScript 5.9.x / Vite 5 / All browsers

### Steps to Reproduce

1. Login as a patient user
2. Navigate to Patient Dashboard (`/patient/dashboard`)
3. Observe the 2x2 Quick Actions grid
4. Click any quick action card
5. **Expected**: Navigate to the correct functional page (booking, documents, intake)
6. **Actual**: All 4 cards navigate to generic paths (`/appointments`, `/documents`, `/intake/ai`, `/intake/manual`) — `/appointments` and `/documents` have no matching routes, causing redirect to login

**Error Output**:

```text
QuickActions.tsx — Static QUICK_ACTIONS array:
  { path: '/appointments' }    → No route (correct: /appointments/book)
  { path: '/documents' }       → No route (correct: /documents/upload/:patientId)
  { path: '/intake/ai' }       → Works (route exists)
  { path: '/intake/manual' }   → Works (route exists)

2 of 4 quick actions broken → redirect to /login
```

### Root Cause Analysis

- **File**: `app/src/components/dashboard/QuickActions.tsx`
- **Component**: QuickActions
- **Cause**: The component used a static `QUICK_ACTIONS` array with hardcoded paths. Two paths (`/appointments` and `/documents`) did not match any registered route in `App.tsx`. The correct paths require specific patterns: `/appointments/book` for booking and `/documents/upload/:patientId` for document upload (which needs the authenticated user's ID).
- **Underlying Cause**: The QuickActions component was built during US_019 with placeholder paths. It had no access to the authenticated user context (`useAuth`), so it could not construct dynamic paths like `/documents/upload/${userId}`.
- **Why Not Caught Earlier**: The AI Intake and Manual Intake links happened to use correct paths by coincidence. Only the first two cards were broken. No automated navigation tests existed for quick actions.

### Impact Assessment

- **Affected Features**: Patient Dashboard quick actions — the primary navigation shortcut for patients
- **User Impact**: 100% of patient users cannot navigate to appointment booking or document upload via quick actions (2 of 4 cards broken)
- **Data Integrity Risk**: None — read-only navigation issue
- **Security Implications**: None — broken links redirect to login (safe fallback)

## Fix Applied

**File**: `app/src/components/dashboard/QuickActions.tsx`

1. Added `import { useAuth } from '../../hooks/useAuth'` to access authenticated user context
2. Replaced static `QUICK_ACTIONS` array with `getQuickActions(userId?)` function that builds paths dynamically:
   - Book Appointment → `/appointments/book`
   - Upload Documents → `/documents/upload/${userId}` (dynamic patient ID)
   - AI Intake → `/intake/ai`
   - Manual Intake → `/intake/manual`
3. Component now calls `const { user } = useAuth()` and passes `user?.id` to the path builder

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors
- Vite build: 879 modules transformed successfully
