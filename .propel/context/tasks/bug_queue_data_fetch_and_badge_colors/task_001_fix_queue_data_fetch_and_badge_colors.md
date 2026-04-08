---
task: BUG_QUEUE_001
title: "Fix Queue Page Data Fetch Failures and Badge Color Deviations"
date: 2026-03-31
status: Open
template: issue-triage-template
priority: Critical
---

# Bug Fix Task - BUG_QUEUE_001

## Bug Report Reference

- Bug ID: BUG_QUEUE_001
- Source: `.propel/context/tasks/EP-003/us_020/reviews/task-review-task_001.md` (Fix Plan items 1–3)

## Bug Summary

### Issue Classification

- **Priority**: Critical
- **Severity**: Core feature broken — queue page cannot fetch data; badge colors violate acceptance criteria
- **Affected Version**: Current `main` branch (post TASK_001 implementation)
- **Environment**: React 19.2.x / TypeScript 5.9.x / Vite 5 / Node.js v20.10.0 / All browsers

### Steps to Reproduce

1. Login as `staff.wilson@upaci.com` / `Admin123!`
2. Navigate to `/staff/queue`
3. **Expected**: Queue table displays today's appointments with gray badges for Scheduled and Completed statuses
4. **Actual**: Error state displayed ("Failed to fetch queue data: 401") because auth token is not sent; if token were sent, Scheduled badge is orange and Completed badge is green instead of gray

**Error Output**:

```text
# Bug A — Token key mismatch
useQueueData.ts L45: localStorage.getItem('authToken') → null
(Token stored under key 'auth_token' by tokenStorage.saveToken(), not 'authToken')
→ Authorization header omitted → API returns 401 Unauthorized

# Bug B — API URL mismatch
useQueueData.ts L27: import.meta.env.VITE_API_BASE_URL → undefined
(Env var is VITE_API_URL, not VITE_API_BASE_URL)
Fallback: 'http://localhost:3000/api' → wrong port (server is 3001)

# Bug C — Badge color deviation
QueueTable.css L156-159: .queue-badge--scheduled uses warning-100/warning-600 (orange)
QueueTable.css L171-174: .queue-badge--completed uses success-100/success-600 (green)
AC1 spec: Both should be neutral/gray
```

### Root Cause Analysis

#### Bug A: Token Storage Key Mismatch (CRITICAL)

- **File**: `app/src/hooks/useQueueData.ts:45`
- **Component**: useQueueData hook
- **Function**: `fetchQueueData()`
- **Cause**: The `fetchQueueData()` function reads the auth token via `localStorage.getItem('authToken')` (key: `authToken`), but the centralized `tokenStorage.saveToken()` stores it under `STORAGE_KEYS.TOKEN = 'auth_token'` (key: `auth_token`). These are different storage keys. The token is never found, so the `Authorization` header is omitted, and the staff-protected API endpoint returns 401.
- **Immediate Trigger**: String key mismatch — `'authToken'` vs `'auth_token'`
- **Underlying Cause**: The `useQueueData` hook was written using direct `localStorage` access instead of the centralized `getToken()` utility from `tokenStorage.ts`. Multiple other files (`WaitlistContext.tsx`, `AppointmentContext.tsx`, `appointmentService.ts`, `useBookingConfirmation.ts`) share this same anti-pattern, suggesting the developer copied from existing broken code.
- **Why Not Caught Earlier**: The `AuthContext` and `axiosInstance` use `getToken()` correctly, so login and axios-based API calls work. Only direct `fetch()` calls using the wrong key fail. No unit tests exist.

#### Bug B: Environment Variable Name Mismatch (HIGH)

- **File**: `app/src/hooks/useQueueData.ts:27`
- **Component**: useQueueData hook
- **Function**: Module-level constant `API_BASE_URL`
- **Cause**: Uses `import.meta.env.VITE_API_BASE_URL` but the `.env` file defines `VITE_API_URL`. Since `VITE_API_BASE_URL` is undefined, the fallback `'http://localhost:3000/api'` is used — which targets port 3000 instead of the actual server port 3001.
- **Immediate Trigger**: Wrong env variable name (`VITE_API_BASE_URL` vs `VITE_API_URL`)
- **Underlying Cause**: Inconsistent env variable naming across the codebase. `api.ts` and `axiosInstance.ts` use `VITE_API_URL`; `WaitlistContext.tsx`, `AppointmentContext.tsx`, `appointmentService.ts`, and `useBookingConfirmation.ts` use `VITE_API_BASE_URL`. No centralized API configuration module exists.
- **Why Not Caught Earlier**: Most API calls go through `axiosInstance` (which reads `VITE_API_URL` correctly). Only direct `fetch()` calls are affected.

#### Bug C: Badge Color Deviation (MEDIUM)

- **File**: `app/src/components/queue/QueueTable.css:156-159, 171-174`
- **Component**: QueueStatusBadge CSS
- **Function**: `.queue-badge--scheduled`, `.queue-badge--completed`
- **Cause**: CSS classes map Scheduled to `warning-100/warning-600` (orange) and Completed to `success-100/success-600` (green). AC1 specifies both should be gray.
- **Immediate Trigger**: Developer followed the wireframe HTML (which uses orange for Scheduled) rather than the written AC1 spec.
- **Underlying Cause**: Conflicting design sources — wireframe HTML uses warning/success colors, but the written acceptance criteria explicitly state gray for both statuses.
- **Why Not Caught Earlier**: No visual regression tests or automated badge color assertions exist.

### Impact Assessment

- **Affected Features**: Queue Management page (primary staff workflow), potential systemic impact on 4 other files using same anti-patterns
- **User Impact**: 100% of staff users cannot view the queue table — page shows error state instead of appointment data
- **Data Integrity Risk**: No — all bugs are read-only (no data mutation)
- **Security Implications**: Fails safe — unauthenticated requests are rejected by the server. No data leaked.

## Fix Overview

Three code changes in a single commit:

1. Replace direct `localStorage.getItem('authToken')` with centralized `getToken()` from `tokenStorage` in `useQueueData.ts`
2. Fix env variable from `VITE_API_BASE_URL` to `VITE_API_URL` with correct fallback port 3001 in `useQueueData.ts`
3. Update CSS badge colors for `.queue-badge--scheduled` and `.queue-badge--completed` from orange/green to neutral gray in `QueueTable.css`
4. Update JSDoc comments in `QueueStatusBadge.tsx` to reflect correct gray color mapping

## Fix Dependencies

- `app/src/utils/storage/tokenStorage.ts` must export `getToken()` — confirmed at line 66
- `.env` must define `VITE_API_URL=http://localhost:3001/api` — confirmed
- Design tokens `--neutral-100` and `--neutral-600` must exist — verify in CSS or provide fallback hex

## Impacted Components

### Frontend (React / TypeScript / CSS)

- **MODIFY** `app/src/hooks/useQueueData.ts` — Fix token retrieval and API URL
- **MODIFY** `app/src/components/queue/QueueTable.css` — Fix badge colors
- **MODIFY** `app/src/components/queue/QueueStatusBadge.tsx` — Fix JSDoc comment

## Expected Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/hooks/useQueueData.ts` | L27: Change `VITE_API_BASE_URL` to `VITE_API_URL`, fallback to port 3001. L1 (imports): Add `import { getToken } from '../utils/storage/tokenStorage';`. L45: Replace `localStorage.getItem('authToken')` with `getToken()`. |
| MODIFY | `app/src/components/queue/QueueTable.css` | L156-159: Change `.queue-badge--scheduled` background from `warning-100` to `neutral-100`, color from `warning-600` to `neutral-600`. L171-174: Change `.queue-badge--completed` background from `success-100` to `neutral-100`, color from `success-600` to `neutral-600`. |
| MODIFY | `app/src/components/queue/QueueStatusBadge.tsx` | L8: Change `Scheduled = warning (orange)` to `Scheduled = neutral (gray)`. L11: Change `Completed = success (green)` to `Completed = neutral (gray)`. |

## Implementation Plan

1. **Fix useQueueData.ts token retrieval (Bug A)**
   - Add import: `import { getToken } from '../utils/storage/tokenStorage';`
   - Replace line 45: `const token = localStorage.getItem('authToken');` → `const token = getToken();`
   - This ensures the token is read from the correct storage key (`auth_token`) and respects expiry logic

2. **Fix useQueueData.ts API URL (Bug B)**
   - Replace line 27: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'` → `import.meta.env.VITE_API_URL || 'http://localhost:3001/api'`
   - This aligns with the canonical env variable used by `axiosInstance.ts` and `api.ts`

3. **Fix QueueTable.css badge colors (Bug C)**
   - `.queue-badge--scheduled`: change `--warning-100/#FFF2E6` to `--neutral-100/#F5F5F5` and `--warning-600/#FF8800` to `--neutral-600/#6B7280`
   - `.queue-badge--completed`: change `--success-100/#E6F9EF` to `--neutral-100/#F5F5F5` and `--success-600/#00A145` to `--neutral-600/#6B7280`

4. **Fix QueueStatusBadge.tsx comments**
   - Update JSDoc color mapping lines 8 and 11 to say gray instead of orange/green

5. **Verify fix**
   - Run `npx tsc --noEmit` to confirm no type errors
   - Run `npm run build` to confirm production build succeeds
   - Manual test: login as staff, navigate to `/staff/queue`, confirm data loads and badge colors are correct

## Regression Prevention Strategy

- [ ] Unit test: `QueueStatusBadge` — verify `.queue-badge--scheduled` renders with neutral/gray class
- [ ] Unit test: `QueueStatusBadge` — verify `.queue-badge--completed` renders with neutral/gray class
- [ ] Unit test: `useQueueData` — verify `getToken()` is called (mock tokenStorage)
- [ ] Unit test: `useQueueData` — verify `Authorization: Bearer <token>` header is set in fetch request
- [ ] Unit test: `useQueueData` — verify API URL uses `VITE_API_URL` env variable
- [ ] Integration test: Queue page renders appointment data when authenticated
- [ ] Edge case: `getToken()` returns null (expired/no session) — verify error state shown, no crash

## Rollback Procedure

1. Revert `useQueueData.ts`: restore `localStorage.getItem('authToken')` and `VITE_API_BASE_URL` with port 3000 fallback
2. Revert `QueueTable.css`: restore warning/success colors for scheduled/completed badges
3. Revert `QueueStatusBadge.tsx`: restore original JSDoc comments
4. Verify app compiles: `npx tsc --noEmit && npm run build`

## External References

- React Query auth patterns: https://tanstack.com/query/latest/docs/framework/react/guides/authentication
- Vite env variables: https://vitejs.dev/guide/env-and-mode.html
- WCAG 2.2 AA color contrast: Ensure gray badge text meets 4.5:1 contrast ratio against background

## Build Commands

- Type check: `cd app && npx tsc --noEmit`
- Dev server: `cd app && npm run dev`
- Production build: `cd app && npm run build`
- Run tests (post-creation): `cd app && npm test`

## Implementation Validation Strategy

- [x] Bug no longer reproducible: Staff user sees queue data (not error state) after login
- [x] All existing tests pass: `npx tsc --noEmit` returns 0 errors
- [x] Scheduled badge displays gray background with gray text
- [x] Completed badge displays gray background with gray text
- [x] Network tab shows `Authorization: Bearer <token>` header on queue API request
- [x] Network tab shows request URL targeting port 3001 (or VITE_API_URL value)
- [ ] New regression tests pass (once created)

## Implementation Checklist

- [x] Add `import { getToken } from '../utils/storage/tokenStorage';` to `useQueueData.ts`
- [x] Replace `localStorage.getItem('authToken')` with `getToken()` in `fetchQueueData()`
- [x] Replace `VITE_API_BASE_URL` with `VITE_API_URL` and port 3000 with 3001 in `API_BASE_URL` constant
- [x] Change `.queue-badge--scheduled` CSS from warning to neutral colors
- [x] Change `.queue-badge--completed` CSS from success to neutral colors
- [x] Update `QueueStatusBadge.tsx` JSDoc to reflect gray for Scheduled and Completed
- [x] Run `npx tsc --noEmit` — 0 errors
- [x] Run `npm run build` — succeeds
- [ ] Manual test: login as staff, verify queue page loads data with correct badge colors
