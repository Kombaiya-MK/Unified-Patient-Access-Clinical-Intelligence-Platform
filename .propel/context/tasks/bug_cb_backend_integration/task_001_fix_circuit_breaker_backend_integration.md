# Bug Fix Task - BUG_CB_BACKEND_001

## Bug Report Reference

- Bug ID: BUG_CB_BACKEND_001
- Source: `.propel/context/tasks/EP-008/us_041/reviews/task-review-task_002.md` — Fix Plan gaps 1-6

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Core feature non-functional (admin dashboard circuit breaker UI returns 404/error state)
- **Affected Version**: Current HEAD on `feature/us005-us008-monitoring-db-audit`
- **Environment**: Node.js 20.x, Express 4.18.x, React 18.2.x, TypeScript 5.3.x, opossum circuit breaker

### Steps to Reproduce

1. Start the backend server (`npm run dev` in `server/`)
2. Start the frontend (`npm run dev` in `app/`)
3. Log in as admin (`admin@upaci.com` / `Admin123!`)
4. Navigate to Admin Dashboard
5. **Expected**: Circuit Breaker Status Panel shows 4 service cards (gpt4-intake, gpt4v-extraction, gpt4-coding, gpt4-conflicts) with colour-coded states
6. **Actual**: Panel shows error state ("Failed to fetch circuit breaker status") because `GET /api/circuit-breaker/status` returns 404

**Error Output**:

```text
GET http://localhost:3001/api/circuit-breaker/status 404 (Not Found)
WebSocket connection to 'ws://localhost:3001/circuit-breaker?token=...' failed
```

### Root Cause Analysis

- **File**: `server/src/routes/index.ts` (no circuit-breaker route registration)
- **Component**: Backend Route Layer + WebSocket Service
- **Function**: N/A — routes and broadcast function do not exist
- **Cause**: The FE task (TASK_002) created API service calls (`GET /circuit-breaker/status`, `GET /circuit-breaker/logs/:service`) and a WebSocket subscription (`circuit-breaker:update` events), but the corresponding backend endpoints were never implemented. The BE task (TASK_001) created the opossum circuit breakers (`allAIBreakers` in `circuit-breaker.config.ts`) with event handlers that update Prometheus gauges and send email alerts, but do not expose state via REST or broadcast via WebSocket. The WebSocket server (`websocketService.ts`) only serves the `/queue` path for queue update events — no `/circuit-breaker` path exists.

**Root Cause Per Gap:**

| Gap | Immediate Trigger | Underlying Cause | Why Not Caught |
|-----|-------------------|-------------------|----------------|
| 1. No REST endpoints | FE `GET /api/circuit-breaker/status` → 404 | No route file `circuitBreaker.routes.ts` created; no registration in `routes/index.ts` | Build succeeds — 404 only at runtime; no integration test |
| 2. No WS broadcast | FE connects to `ws://host/circuit-breaker` → connection rejected | `websocketService.ts` only accepts `/queue` path; breaker event handlers in config don't call any broadcast | WS connection failure is silent in FE catch block |
| 3. No recovery toast | Banner auto-hides but no positive confirmation | Project uses per-page inline toast (`useState` + `setTimeout`); no shared toast utility | Banner behaviour correct — toast is secondary UX |
| 4. No focus trap in modal | Keyboard Tab navigates behind logs modal overlay | Simple `position: fixed` div; no focus-trap logic implemented | axe-core doesn't detect focus trap — requires manual keyboard test |
| 5. No unit tests | `__tests__/*circuit*` → 0 files | Implementation prioritised UI delivery over test coverage | Build/type-check passed; test coverage not gated |
| 6. ExtractionStatus.tsx missing | Task spec references file that doesn't exist | Component was planned but never created; `DocumentUploadPage` already has `LimitedFunctionalityBanner` | Partially covered by existing banner |

### Impact Assessment

- **Affected Features**: All circuit breaker UI — admin dashboard panel, limited-functionality banner, AI fallback alerts, logs modal
- **User Impact**: Admin users see error state instead of breaker statuses; no real-time updates; no recovery notification
- **Data Integrity Risk**: No — all endpoints are read-only
- **Security Implications**: None — endpoints will be auth-gated (admin-only)

## Fix Overview

Implement the missing backend layer and apply frontend accessibility/UX fixes to make the circuit breaker monitoring UI fully functional:

1. **Backend REST API**: Create `circuitBreaker.routes.ts` with `GET /status` and `GET /logs/:service` endpoints that read from `allAIBreakers` and an in-memory event log
2. **WebSocket broadcast**: Add `/circuit-breaker` path to WS upgrade handler and `broadcastCircuitBreakerEvent()` function; invoke from breaker event handlers
3. **Recovery toast**: Add inline state-based toast in `LimitedFunctionalityBanner` on `hasOpenCircuits` true→false transition
4. **Focus trap**: Implement keyboard focus trapping in logs modal
5. **Unit tests**: Create vitest + @testing-library/react tests for all 4 components and the hook
6. **ExtractionStatus component**: Create and integrate into `DocumentUploadPage`

## Fix Dependencies

- `opossum` package (already installed) — read breaker `.opened`, `.stats` properties
- `ws` package (already installed) — WebSocket broadcast
- `vitest` + `@testing-library/react` (already configured in `vitest.config.ts`)
- Existing `authenticate` + `authorize` middleware from `server/src/middleware/auth.ts`

## Impacted Components

### Backend (server/)

- `server/src/routes/circuitBreaker.routes.ts` — NEW: REST endpoints for breaker status and logs
- `server/src/routes/index.ts` — MODIFY: Register circuit-breaker routes
- `server/src/config/circuit-breaker.config.ts` — MODIFY: Add in-memory event log + call WS broadcast from event handlers
- `server/src/services/websocketService.ts` — MODIFY: Accept `/circuit-breaker` WS path + add `broadcastCircuitBreakerEvent()`

### Frontend (app/)

- `app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx` — MODIFY: Add recovery toast
- `app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx` — MODIFY: Add focus trap in logs modal
- `app/src/components/document-extraction/ExtractionStatus.tsx` — NEW: Extraction fallback alert component
- `app/src/pages/DocumentUploadPage.tsx` — MODIFY: Integrate `ExtractionStatus`

### Tests (app/)

- `app/__tests__/circuit-breaker/CircuitBreakerStatusCard.test.tsx` — NEW
- `app/__tests__/circuit-breaker/CircuitBreakerStatusPanel.test.tsx` — NEW
- `app/__tests__/circuit-breaker/LimitedFunctionalityBanner.test.tsx` — NEW
- `app/__tests__/circuit-breaker/AIFallbackAlert.test.tsx` — NEW
- `app/__tests__/circuit-breaker/useCircuitBreakerStatus.test.ts` — NEW

## Expected Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | `server/src/routes/circuitBreaker.routes.ts` | `GET /status` reads `allAIBreakers` states; `GET /logs/:service` reads in-memory event ring buffer. Auth: `authenticateToken` + `authorize('admin')` |
| MODIFY | `server/src/routes/index.ts` | Add `import circuitBreakerRoutes` + `router.use('/circuit-breaker', circuitBreakerRoutes)` |
| MODIFY | `server/src/config/circuit-breaker.config.ts` | Add `circuitBreakerEventLog` ring buffer (max 200 entries); push events in open/halfOpen/close handlers; call `broadcastCircuitBreakerEvent()` from each handler |
| MODIFY | `server/src/services/websocketService.ts` | Add `broadcastCircuitBreakerEvent(data)` function; modify `initWebSocketServer` to accept `/circuit-breaker` path in addition to `/queue` |
| MODIFY | `app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx` | Add `useRef` to track previous `hasOpenCircuits`; show inline success toast (auto-dismiss 4s) on true→false transition |
| MODIFY | `app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx` | Add focus trap `useEffect` on modal open: focus first element, trap Tab/Shift+Tab within modal, close on Escape |
| CREATE | `app/src/components/document-extraction/ExtractionStatus.tsx` | Render `AIFallbackAlert` for `gpt4v-extraction` service during active extraction |
| MODIFY | `app/src/pages/DocumentUploadPage.tsx` | Import and render `ExtractionStatus` in extraction results area |
| CREATE | `app/__tests__/circuit-breaker/CircuitBreakerStatusCard.test.tsx` | Tests: renders correct colours/badges for closed/half-open/open; calls onViewLogs on click |
| CREATE | `app/__tests__/circuit-breaker/CircuitBreakerStatusPanel.test.tsx` | Tests: loading skeleton → error state → cards → modal open/close |
| CREATE | `app/__tests__/circuit-breaker/LimitedFunctionalityBanner.test.tsx` | Tests: shows when circuits open; hides on dismiss; re-shows on new circuit; recovery toast |
| CREATE | `app/__tests__/circuit-breaker/AIFallbackAlert.test.tsx` | Tests: renders nothing when inactive; renders message when active |
| CREATE | `app/__tests__/circuit-breaker/useCircuitBreakerStatus.test.ts` | Tests: fetches initial data; updates on WS message; handles fetch error |

## Implementation Plan

### Step 1: In-memory event log in circuit-breaker config (Gap 1c, 2b)

In `server/src/config/circuit-breaker.config.ts`:

- Add `circuitBreakerEventLog` array (max 200 entries, FIFO) with entry shape: `{ id, service, event, timestamp, details }`
- In `open` handler: push `{ event: 'opened', ... }` to log; call `broadcastCircuitBreakerEvent()`
- In `halfOpen` handler: push `{ event: 'half-opened', ... }` to log; call `broadcastCircuitBreakerEvent()`
- In `close` handler: push `{ event: 'closed', ... }` to log; call `broadcastCircuitBreakerEvent()`
- Export `circuitBreakerEventLog` and a helper `getLogsForService(service)` function

### Step 2: WebSocket broadcast + path support (Gap 2a)

In `server/src/services/websocketService.ts`:

- Change `new WebSocketServer({ server: httpServer, path: '/queue' })` to `new WebSocketServer({ noServer: true })`
- Add HTTP server `upgrade` handler that checks `pathname === '/queue' || pathname === '/circuit-breaker'` and calls `wss.handleUpgrade()`
- Add `broadcastCircuitBreakerEvent(data)` function that broadcasts `{ event: 'circuit-breaker:update', data, timestamp }` to all connected clients with `readyState === OPEN`
- Export `broadcastCircuitBreakerEvent`

### Step 3: Backend REST routes (Gap 1a, 1b)

Create `server/src/routes/circuitBreaker.routes.ts`:

- `GET /status`: Import `allAIBreakers` from config; map each to `{ service: breaker.options.name, model, state: breaker.opened ? 'open' : (breaker.pendingClose ? 'half-open' : 'closed'), failureRate, lastStateChange, errorCount, successCount }`. Use opossum's `.stats` property.
- `GET /logs/:service`: Import `getLogsForService(service)` from config. Validate `service` param against allowed service IDs (allowlist). Return filtered logs.
- Apply `authenticateToken` + `authorize('admin')` middleware

Register in `server/src/routes/index.ts`:

- Add `import circuitBreakerRoutes from './circuitBreaker.routes';`
- Add `router.use('/circuit-breaker', circuitBreakerRoutes);`

### Step 4: Recovery toast (Gap 3)

In `app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx`:

- Add `useRef<boolean>` to track previous `hasOpenCircuits` value
- Add `useState` for toast visibility + message
- In `useEffect`, detect transition from `true → false` on `hasOpenCircuits`; show success toast "AI services have recovered" with 4s auto-dismiss
- Render toast as fixed-position element at top-right (matches `UserManagementPage` pattern)

### Step 5: Focus trap in logs modal (Gap 4)

In `app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx`:

- Add `useRef<HTMLDivElement>` for modal container
- On modal open: query all focusable elements within container, focus first element
- Intercept `keydown`: Tab cycles within focusable elements; Shift+Tab cycles backwards; Escape closes modal
- On close: return focus to trigger element (View Logs button)

### Step 6: ExtractionStatus component (Gap 6)

Create `app/src/components/document-extraction/ExtractionStatus.tsx`:

- Import `useCircuitBreakerStatus` and `AIFallbackAlert`
- Check if `document-extraction` service (mapped to `gpt4v-extraction`) is in `openServices`
- If open, render `<AIFallbackAlert service="document-extraction" isActive={true} />`
- If closed, render nothing

Integrate in `app/src/pages/DocumentUploadPage.tsx`:

- Import `ExtractionStatus`
- Render near extraction results section

### Step 7: Unit tests (Gap 5)

Create 5 test files in `app/__tests__/circuit-breaker/`:

- **CircuitBreakerStatusCard.test.tsx**: Render with closed/half-open/open states; verify badge text, colours; verify `onViewLogs` callback
- **CircuitBreakerStatusPanel.test.tsx**: Verify loading skeleton; error state; 4 cards rendered; modal open/close
- **LimitedFunctionalityBanner.test.tsx**: Show when circuits open; hide on dismiss; re-show on new circuit open; toast on recovery
- **AIFallbackAlert.test.tsx**: Renders nothing when `isActive=false`; renders correct message when `isActive=true` for each service
- **useCircuitBreakerStatus.test.ts**: Mock `getCircuitBreakerStatus` fetch; verify initial load; verify WS message update; verify error state

## Regression Prevention Strategy

- [ ] Unit test: `GET /circuit-breaker/status` returns 4 breaker states with correct shape
- [ ] Unit test: `GET /circuit-breaker/logs/:service` returns filtered logs; rejects invalid service IDs
- [ ] Unit test: `broadcastCircuitBreakerEvent` sends message to all connected WS clients
- [ ] Unit test: `CircuitBreakerStatusCard` renders correct colours for each state
- [ ] Unit test: `LimitedFunctionalityBanner` shows toast on recovery transition
- [ ] Unit test: `CircuitBreakerStatusPanel` modal traps focus
- [ ] Integration test: Admin dashboard circuit breaker panel loads without error state
- [ ] Edge case: Logs endpoint with non-existent service returns empty array (not 500)
- [ ] Edge case: WS broadcast with 0 connected clients doesn't throw

## Rollback Procedure

1. `git revert <commit>` — all changes are additive (new files + small modifications to existing)
2. Verify `GET /api/health` still returns 200 (server not broken)
3. No database schema changes — no data recovery needed
4. FE reverts to showing error state in circuit breaker panel (pre-existing behaviour)

## External References

- [opossum API: CircuitBreaker](https://nodeshift.dev/opossum/) — `.opened`, `.pendingClose`, `.stats`, `.status`
- [ws library: WebSocket.Server](https://github.com/websockets/ws/blob/master/doc/ws.md)
- [WCAG 2.2 Focus Trap](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — modal dialog pattern
- [Vitest + Testing Library](https://vitest.dev/guide/) — test runner configuration

## Build Commands

```bash
# Backend
cd server && npm run build

# Frontend
cd app && npx tsc --noEmit && npx vite build

# Tests
cd app && npx vitest run --reporter=verbose
```

## Implementation Validation Strategy

- [ ] `GET /api/circuit-breaker/status` returns JSON array of 4 breaker states (200 OK)
- [ ] `GET /api/circuit-breaker/logs/gpt4-intake` returns JSON array of log entries (200 OK)
- [ ] `GET /api/circuit-breaker/logs/invalid-service` returns empty array (200 OK, not 500)
- [ ] WebSocket connection to `ws://localhost:3001/circuit-breaker?token=...` succeeds
- [ ] Breaker state change triggers `circuit-breaker:update` WS event to connected clients
- [ ] Admin dashboard shows 4 circuit breaker cards instead of error state
- [ ] Logs modal traps keyboard focus (Tab stays within modal)
- [ ] Recovery toast appears when breaker transitions from open to closed
- [ ] All new unit tests pass (`npx vitest run`)
- [ ] TypeScript compile succeeds (`npx tsc --noEmit`)
- [ ] No new lint errors

## Implementation Checklist

- [x] Create `server/src/routes/circuitBreaker.routes.ts` with GET /status and GET /logs/:service
- [x] Register circuit-breaker routes in `server/src/routes/index.ts`
- [x] Add in-memory event log ring buffer to `server/src/config/circuit-breaker.config.ts`
- [x] Add `broadcastCircuitBreakerEvent()` to `server/src/services/websocketService.ts`
- [x] Modify WS server to accept `/circuit-breaker` path
- [x] Call broadcast from breaker open/halfOpen/close handlers
- [x] Add recovery toast to `LimitedFunctionalityBanner.tsx`
- [x] Add focus trap to logs modal in `CircuitBreakerStatusPanel.tsx`
- [x] Create `ExtractionStatus.tsx` component
- [x] Integrate `ExtractionStatus` into `DocumentUploadPage.tsx`
- [x] Create `CircuitBreakerStatusCard.test.tsx`
- [x] Create `CircuitBreakerStatusPanel.test.tsx`
- [x] Create `LimitedFunctionalityBanner.test.tsx`
- [x] Create `AIFallbackAlert.test.tsx`
- [x] Create `useCircuitBreakerStatus.test.ts`
- [x] Verify backend build (`npm run build`)
- [x] Verify frontend build (`npx tsc --noEmit && npx vite build`)
- [x] Verify all tests pass (`npx vitest run`)
