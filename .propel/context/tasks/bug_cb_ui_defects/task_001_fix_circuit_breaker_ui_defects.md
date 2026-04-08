# Bug Fix Task — Circuit Breaker UI Visual & Interaction Defects

## Bug Report Reference

- Bug ID: bug_cb_ui_defects (derived from ui-review-task_002.md)
- Source: `.propel/context/tasks/EP-008/us_041/reviews/ui-review-task_002.md`

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Visual fidelity failure + UX interaction gap across admin dashboard
- **Affected Version**: Uncommitted — `feature/us005-us008-monitoring-db-audit` branch, TASK_002 FE files
- **Environment**: React 18.2.x, TypeScript 5.3.x, Vite dev server, all viewports (375px, 768px, 1440px)

### Steps to Reproduce

1. Start backend (`cd server && npm run dev`) and frontend (`cd app && npm run dev`)
2. Navigate to `http://localhost:5173/login`
3. Login as `admin@upaci.com` / `Admin123!`
4. Observe Admin Dashboard at `/admin/dashboard`
5. **Expected**: Circuit breaker panel uses design system colors (success=#00A145, warning=#FF8800, error=#DC3545, primary=#0066CC); shows informational empty state when API unavailable; logs modal closes on backdrop click
6. **Actual**: Panel uses Tailwind CSS colors (#22c55e, #eab308, #ef4444, #2563eb); shows red error text "Failed to fetch circuit breaker status"; modal backdrop click does nothing

**Error Output**:

```text
Console errors (5 total — all from missing backend endpoint):
[ERROR] Failed to load resource: 404 @ http://localhost:3001/api/circuit-breaker/status
[ERROR] [API Error] {message: An unexpected error occurred, statusCode: undefined}
```

### Root Cause Analysis

**Bug H1: Design Token Mismatch**

- **File**: `app/src/components/circuit-breaker/CircuitBreakerStatusCard.tsx:38-63`
- **Component**: CircuitBreakerStatusCard, LimitedFunctionalityBanner
- **Function**: `STATE_STYLES` constant object, inline style declarations
- **Cause**: Developer used Tailwind CSS default palette colors from memory instead of referencing the project's design system document (`.propel/context/docs/designsystem.md`). The 14 color values span 3 files and affect all visual states (closed/half-open/open) plus the link and error text colors.

**Bug H2: Error-Only State**

- **File**: `app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx:66-74`
- **Component**: CircuitBreakerStatusPanel
- **Function**: Error rendering block in the component return
- **Cause**: The error state does not distinguish between "backend endpoint missing" (expected during phased rollout) and "genuine fetch failure". The `useCircuitBreakerStatus` hook sets a generic error string for all failures.

**Bug M3: Modal Backdrop Click-to-Close**

- **File**: `app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx:100-114`
- **Component**: CircuitBreakerStatusPanel (logs modal)
- **Function**: Modal overlay `<div>` — missing `onClick` handler
- **Cause**: Modal was implemented with only a close button (✕), omitting the standard backdrop-click-to-dismiss interaction pattern.

### Impact Assessment

- **Affected Features**: Admin dashboard circuit-breaker section, appointment booking page banner, document upload page banner
- **User Impact**: Visual inconsistency with platform design system; admin confusion from permanent red error message; minor UX friction from modal dismiss
- **Data Integrity Risk**: No
- **Security Implications**: Console errors expose internal API path (`/api/circuit-breaker/status`) but no sensitive data

## Fix Overview

Consolidated fix addressing all 3 bugs in the circuit-breaker UI component set:

1. Replace 14 Tailwind CSS color values with design system tokens across 3 files
2. Replace the error-only state with an informational empty state using info-colored styling
3. Add `onClick` backdrop handler to the logs modal with `stopPropagation` on inner content

## Fix Dependencies

- Design system reference: `.propel/context/docs/designsystem.md`
- No new npm packages required
- No backend changes required

## Impacted Components

### Frontend (React/TypeScript)

- `app/src/components/circuit-breaker/CircuitBreakerStatusCard.tsx` — MODIFY (STATE_STYLES colors, View Logs link color)
- `app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx` — MODIFY (error state, modal backdrop)
- `app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx` — MODIFY (SVG fill, text color)

## Expected Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/components/circuit-breaker/CircuitBreakerStatusCard.tsx` | Replace STATE_STYLES colors: closed (#22c55e→#00A145, #15803d→#007A3D, #f0fdf4→#E6F9EF, #bbf7d0→#CCF2DF), half-open (#eab308→#FF8800, #a16207→#CC6600, #fefce8→#FFF2E6, #fde68a→#FFE5CC), open (#ef4444→#DC3545, #b91c1c→#A02A2A, #fef2f2→#FCE8EA, #fecaca→#F8D7DA); Replace View Logs link color #2563eb→#0066CC |
| MODIFY | `app/src/components/circuit-breaker/CircuitBreakerStatusPanel.tsx` | Replace error block (lines 66-74) with informational empty state using info-100 bg + info-600 text; Add onClick={handleCloseLogs} to modal overlay div; Add onClick stopPropagation to inner modal div |
| MODIFY | `app/src/components/circuit-breaker/LimitedFunctionalityBanner.tsx` | Replace SVG fill #eab308→#FF8800; Replace text color #a16207→#CC6600 |

## Implementation Plan

1. **Update `CircuitBreakerStatusCard.tsx` STATE_STYLES** — Replace all 12 color values in the closed/half-open/open state objects with design system tokens per the mapping table below:

    | State | Property | Current | Design System |
    |-------|----------|---------|---------------|
    | closed | bg | #f0fdf4 | #E6F9EF (success-100) |
    | closed | border | #bbf7d0 | #CCF2DF (success-200) |
    | closed | text | #15803d | #007A3D (success-700) |
    | closed | badgeBg | #22c55e | #00A145 (success-600) |
    | closed | barBg | #22c55e | #00A145 (success-600) |
    | half-open | bg | #fefce8 | #FFF2E6 (warning-100) |
    | half-open | border | #fde68a | #FFE5CC (warning-200) |
    | half-open | text | #a16207 | #CC6600 (warning-700) |
    | half-open | badgeBg | #eab308 | #FF8800 (warning-600) |
    | half-open | barBg | #eab308 | #FF8800 (warning-600) |
    | open | bg | #fef2f2 | #FCE8EA (error-100) |
    | open | border | #fecaca | #F8D7DA (error-200) |
    | open | text | #b91c1c | #A02A2A (error-700) |
    | open | badgeBg | #ef4444 | #DC3545 (error-600) |
    | open | barBg | #ef4444 | #DC3545 (error-600) |

2. **Update View Logs link color** in `CircuitBreakerStatusCard.tsx` line 142 — Replace `#2563eb` with `#0066CC` (primary-600)

3. **Update error state in `CircuitBreakerStatusPanel.tsx`** — Replace the red error `<p>` (line 72) with an informational box using info-100 background (#E6F3F9), info-600 text (#0077B6), and an informational message: "Circuit breaker monitoring will be available once backend endpoints are deployed."

4. **Add backdrop click handler in `CircuitBreakerStatusPanel.tsx`** — Add `onClick={handleCloseLogs}` to the modal overlay div (line ~101); Add `onClick={(e) => e.stopPropagation()}` to the inner modal content div (line ~115)

5. **Update `LimitedFunctionalityBanner.tsx`** — Replace SVG `fill="#eab308"` with `fill="#FF8800"` (line 66); Replace text `color: '#a16207'` with `color: '#CC6600'` (line 81)

6. **Verify build** — Run `npm run build` in `app/` to confirm 0 new TypeScript errors

7. **Verify accessibility** — Run axe-core audit on the admin dashboard to confirm 0 violations

## Regression Prevention Strategy

- [ ] Visual regression: Confirm all circuit-breaker card colors match design system tokens at desktop viewport
- [ ] Error state: Confirm informational message renders (blue info style) instead of red error when backend unavailable
- [ ] Modal: Confirm backdrop click closes the modal
- [ ] Modal: Confirm clicking inside modal content does NOT close the modal
- [ ] Banner: Confirm warning banner SVG and text colors match design system warning tokens
- [ ] Build: TypeScript compilation passes with 0 new errors
- [ ] Accessibility: axe-core WCAG 2.2 AA audit passes with 0 violations

## Rollback Procedure

1. Files are untracked — discard changes with `git checkout -- app/src/components/circuit-breaker/` or delete and recreate from previous state
2. Validate admin dashboard renders without the fix (original Tailwind colors restore)
3. No data migration or database changes to revert

## External References

- Design system: `.propel/context/docs/designsystem.md` — Semantic Colors section
- UI review: `.propel/context/tasks/EP-008/us_041/reviews/ui-review-task_002.md`
- Task spec: `.propel/context/tasks/EP-008/us_041/task_002_fe_circuit_breaker_status_ui.md`
- WCAG 2.2 AA: Color contrast requirements (1.4.3 minimum 4.5:1 for text)

## Build Commands

```bash
cd app
npm run build
npm run dev
```

## Implementation Validation Strategy

- [ ] All 14 color hex values in circuit-breaker components match design system tokens
- [ ] Error state shows informational message (info-100 bg, info-600 text) instead of red error
- [ ] Modal closes when clicking backdrop overlay
- [ ] Modal does NOT close when clicking inside modal content
- [ ] TypeScript build passes with 0 new errors
- [ ] axe-core accessibility audit shows 0 violations on admin dashboard

## Implementation Checklist

- [x] Replace 12 color values in STATE_STYLES object (CircuitBreakerStatusCard.tsx)
- [x] Replace View Logs link color (CircuitBreakerStatusCard.tsx)
- [x] Replace error state with informational empty state (CircuitBreakerStatusPanel.tsx)
- [x] Add backdrop click-to-close on modal overlay (CircuitBreakerStatusPanel.tsx)
- [x] Add stopPropagation on inner modal content (CircuitBreakerStatusPanel.tsx)
- [x] Replace SVG fill and text color in banner (LimitedFunctionalityBanner.tsx)
- [x] Run build verification (`npm run build`)
- [x] Run accessibility audit (axe-core)
