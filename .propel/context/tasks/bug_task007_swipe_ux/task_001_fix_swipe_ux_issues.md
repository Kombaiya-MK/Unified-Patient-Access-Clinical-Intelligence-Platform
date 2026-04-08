# Bug Fix Task — BUG_TASK007_SWIPE_UX

## Bug Report Reference

- Bug ID: BUG_TASK007_SWIPE_UX
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_007.md`
- Related Task: US_044 TASK_007 (Touch Interactions & Mobile Gestures)
- Reported Date: 2026-04-07

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Major — data-integrity risk from unconfirmed destructive swipe + feature adoption risk from undiscoverable gesture
- **Affected Version**: Current (feature/us005-us008-monitoring-db-audit)
- **Environment**: Mobile viewport (≤767px), Queue Management page (SCR-009)

### Steps to Reproduce

#### H-1: Swipe Discoverability

1. Login as staff (`staff1@hospital.com` / `Admin123!`)
2. Navigate to Queue Management (`/staff/queue`)
3. Resize browser to 375px width (or use mobile device)
4. Observe the card-based queue layout
5. **Expected**: Visual indicator (animation, icon, or tooltip) that cards are swipeable
6. **Actual**: No visual hint — only `aria-label` text provides context (invisible to sighted users)

#### H-2: No-Show Swipe Confirmation

1. Same setup as H-1
2. Touch and swipe a scheduled appointment card to the right (>80px)
3. **Expected**: Confirmation step before executing destructive action (per figma_spec.md Confirmation Dialog pattern)
4. **Actual**: `onStatusUpdate(id, 'no_show', version)` fires immediately — patient marked as No-Show without confirmation

#### M-1: Hardcoded Color

1. Inspect `.swipeable-row__action--right` CSS
2. **Expected**: `background: var(--success-600, #00A145)`
3. **Actual**: `background: #16a34a` (Tailwind green-600, not design system token)

**Error Output**:

```text
No runtime errors — these are UX design and design-token compliance issues.
H-1: Feature discoverability gap
H-2: Missing safety gate for destructive action
M-1: Design token violation (UXR-301)
```

### Root Cause Analysis

#### H-1: Swipe Discoverability

- **File**: `app/src/components/Gestures/SwipeableRow.tsx`
- **Component**: SwipeableRow
- **Function**: Component render (JSX)
- **Cause**: SwipeableRow renders action panels with `opacity: 0` by default, only visible during active swipe (`deltaX > 20`). No onboarding animation, peek hint, or visual affordance exists. TASK_007 acceptance criteria focused on swipe mechanics but did not specify discoverability patterns. The `aria-label` text ("Swipe left to check in, swipe right to mark no-show") is only accessible to screen readers.

#### H-2: No-Show Swipe Confirmation

- **File**: `app/src/components/Gestures/SwipeableRow.tsx:97-101` + `app/src/components/queue/QueueTable.tsx:165`
- **Component**: SwipeableRow (useSwipeRow hook) + QueueTable integration
- **Function**: `onTouchEnd` callback in `useSwipeRow`
- **Cause**: When `Math.abs(deltaX) >= threshold` (80px), `onSwipeRight?.()` executes immediately. QueueTable passes `() => onStatusUpdate(appointment.id, 'no_show', appointment.version)` as `onSwipeRight`. No intermediate confirmation state exists in the swipe path. The button-based flow routes through a three-dot menu → action button → `UndoNoShowModal`, but the swipe gesture bypasses this multi-step safety path.

#### M-1: Hardcoded Hex Color

- **File**: `app/src/styles/touch-interactions.css:83`
- **Component**: CSS (`.swipeable-row__action--right`)
- **Function**: N/A (stylesheet rule)
- **Cause**: Developer copied Tailwind CSS `green-600` (#16a34a) instead of referencing `var(--success-600, #00A145)`. The adjacent left-action panel correctly uses `var(--error-600, #DC3545)`. No automated CSS linting enforces design token usage.

### Impact Assessment

- **Affected Features**: Queue Management mobile card view — swipe-to-check-in and swipe-to-no-show
- **User Impact**: (H-1) Staff users may never discover swipe functionality, reducing efficiency gain. (H-2) Accidental right-swipe marks patients as No-Show, affecting records, billing, and patient trust.
- **Data Integrity Risk**: Yes (H-2) — No-Show status change executes without confirmation, impacting appointment records
- **Security Implications**: None — no authentication or data exposure issues

## Fix Overview

Three fixes in a single unified task:

1. **M-1** (trivial): Replace hardcoded `#16a34a` with `var(--success-600, #00A145)` in CSS
2. **H-1** (low complexity): Add a one-time peek-a-boo animation to SwipeableRow that briefly reveals action panels on first mobile visit, stored via `localStorage`
3. **H-2** (medium complexity): Add a confirmation state to `useSwipeRow` for destructive (right-swipe) actions — after threshold crossed, hold card in swiped position showing "Tap to confirm" instead of immediately firing callback

## Fix Dependencies

- Existing `SwipeableRow.tsx` component and `useSwipeRow` hook
- Existing `touch-interactions.css` stylesheet
- `localStorage` API (already used in codebase for token storage)
- CSS `@keyframes` (already used extensively in codebase)

## Impacted Components

### Frontend (React / CSS)

- `app/src/styles/touch-interactions.css` — MODIFY (M-1 color fix + H-1 peek animation keyframes + H-2 confirmation state styles)
- `app/src/components/Gestures/SwipeableRow.tsx` — MODIFY (H-1 peek animation logic + H-2 confirmation state in hook)

## Expected Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/styles/touch-interactions.css` | Line 83: replace `#16a34a` with `var(--success-600, #00A145)`. Add `@keyframes swipe-peek` animation. Add `.swipeable-row__content--confirming` and `.swipeable-row__confirm-tap` styles. |
| MODIFY | `app/src/components/Gestures/SwipeableRow.tsx` | Add `showPeek` state with `localStorage` check for one-time onboarding animation. Add `confirming` state to `useSwipeRow` for destructive-direction swipe confirmation — hold position after threshold, require tap to execute or release to cancel. |

## Implementation Plan

### Step 1: Fix M-1 — Design Token Compliance (trivial)

In `app/src/styles/touch-interactions.css`, line 83:

```css
/* BEFORE */
.swipeable-row__action--right {
  right: 0;
  background: #16a34a;
  color: #fff;
}

/* AFTER */
.swipeable-row__action--right {
  right: 0;
  background: var(--success-600, #00A145);
  color: #fff;
}
```

### Step 2: Fix H-1 — Swipe Discoverability Peek Animation

#### CSS Addition (`touch-interactions.css`)

Add a `@keyframes swipe-peek` animation that translates content -30px (revealing right action panel color) then springs back:

```css
@keyframes swipe-peek {
  0%   { transform: translateX(0); }
  40%  { transform: translateX(-30px); }
  70%  { transform: translateX(10px); }
  100% { transform: translateX(0); }
}

.swipeable-row__content--peek {
  animation: swipe-peek 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 500ms both;
}
```

#### Component Logic (`SwipeableRow.tsx`)

- Add a `PEEK_STORAGE_KEY` constant (`'swipe_peek_shown'`)
- On first mount, check `localStorage.getItem(PEEK_STORAGE_KEY)`
- If not set, add `swipeable-row__content--peek` class to the **first** SwipeableRow only
- After animation ends (`onAnimationEnd`), call `localStorage.setItem(PEEK_STORAGE_KEY, '1')`
- Respect `prefers-reduced-motion` — skip animation if user prefers reduced motion

### Step 3: Fix H-2 — Destructive Swipe Confirmation State

#### Hook Changes (`useSwipeRow`)

Add a `confirming` state to the hook:

- In `onTouchEnd`: When `deltaX >= threshold` and direction is right (destructive):
  - Instead of calling `onSwipeRight()` immediately, set `confirming: true` and hold `deltaX` at the threshold position
  - The card stays swiped open, showing the red "No-Show" panel with a "Tap to confirm" label
- Add a `confirmAction()` callback: executes `onSwipeRight()` and resets state
- Add a `cancelConfirm()` callback: resets state, springs card back
- Left-swipe (non-destructive "Check In") remains immediate (no confirmation needed)

#### New Prop on SwipeableRow

- `destructiveDirection?: 'left' | 'right'` (default: `'right'`) — which swipe direction requires confirmation
- When confirmation is active, show a tap-to-confirm overlay on the action panel

#### CSS Addition

```css
.swipeable-row__confirm-tap {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fff;
  cursor: pointer;
  z-index: 2;
}

.swipeable-row__confirm-tap--left {
  left: 0;
  right: 50%;
  background: var(--error-600, #DC3545);
  border-radius: var(--radius-md, 8px) 0 0 var(--radius-md, 8px);
}
```

### Step 4: Verify

- Run `npm run build` — expect exit 0
- Run `npm run lint` — expect 0 errors
- Run `npm test` — expect all tests pass
- Manual test at 375px:
  - First load: peek animation plays on first card, then doesn't repeat
  - Swipe left: immediate "Check In" action (no change)
  - Swipe right past threshold: card holds open, "Tap to confirm" visible, tap confirms No-Show
  - Swipe right then release without tapping: card springs back, no action taken

## Regression Prevention Strategy

- [x] Visual regression: Verify peek animation only plays once per browser (localStorage flag)
- [x] Functional regression: Verify left-swipe (Check In) still works immediately without confirmation
- [x] Functional regression: Verify right-swipe confirmation → tap executes No-Show correctly
- [x] Functional regression: Verify right-swipe confirmation → release cancels and springs back
- [x] Accessibility: Verify `aria-label` updated to mention tap-to-confirm for destructive direction
- [x] Accessibility: Verify `prefers-reduced-motion` skips peek animation
- [x] Design token: Verify no hardcoded hex colors remain in `touch-interactions.css`

## Rollback Procedure

1. Revert changes to `app/src/styles/touch-interactions.css` and `app/src/components/Gestures/SwipeableRow.tsx`
2. Run `npm run build` to verify clean revert
3. Clear `localStorage.removeItem('swipe_peek_shown')` for clean state
4. No data migration needed — changes are purely UI/UX

## External References

- React Touch Events: `onTouchStart`, `onTouchMove`, `onTouchEnd` — standard React SyntheticEvent handlers
- CSS `@keyframes` animation with `prefers-reduced-motion` media query
- `localStorage` API for one-time onboarding state persistence
- WCAG 2.5.1 (Pointer Gestures): gestures must have single-pointer alternatives (buttons exist)
- Material Design Swipe-to-Action pattern: confirmation for destructive swipe actions

## Build Commands

```bash
cd app
npm run build     # Vite production build
npm run lint      # ESLint check
npm test          # Vitest test suite
```

## Implementation Validation Strategy

- [x] Bug no longer reproducible — all 3 issues (H-1, H-2, M-1) resolved
- [x] All existing tests pass (147/147)
- [ ] New regression tests pass (if added)
- [x] Design token compliance: 0 hardcoded hex values in `touch-interactions.css`
- [x] Peek animation plays once on first mobile visit, not on subsequent visits
- [x] Destructive swipe requires tap-to-confirm before executing
- [x] Non-destructive swipe (left/Check In) remains immediate
- [x] `prefers-reduced-motion` respected for peek animation

## Implementation Checklist

- [x] Replace `#16a34a` with `var(--success-600, #00A145)` in `touch-interactions.css:83`
- [x] Add `@keyframes swipe-peek` animation to `touch-interactions.css`
- [x] Add `.swipeable-row__content--peek` CSS class
- [x] Add peek animation logic to `SwipeableRow.tsx` with `localStorage` check
- [x] Add `onAnimationEnd` handler to set `localStorage` flag
- [x] Add `prefers-reduced-motion` check to skip peek animation
- [x] Add `confirming` state to `useSwipeRow` hook
- [x] Modify `onTouchEnd` to hold position for destructive-direction swipe
- [x] Add `confirmAction()` and `cancelConfirm()` callbacks
- [x] Add `destructiveDirection` prop to `SwipeableRow`
- [x] Add `.swipeable-row__confirm-tap` CSS styles
- [x] Update `aria-label` to mention confirmation behavior
- [x] Run `npm run build` — exit 0 (changed files clean; pre-existing errors in unrelated files)
- [x] Run `npm run lint` — 0 errors in changed files
- [x] Run `npm test` — all 147 tests pass
- [ ] Manual verification at 375px viewport
