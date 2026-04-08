# Bug Fix Task — BUG_TASK008_DESKTOP_UX

## Bug Report Reference

- Bug ID: BUG_TASK008_DESKTOP_UX
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_008.md`

## Bug Summary

### Issue Classification

- **Priority**: High
- **Severity**: Major — AC-1 "Desktop Features" partially unmet; hover-states.css is dead CSS for most elements, keyboard shortcuts non-functional, multi-panel layout unintegrated
- **Affected Version**: Current (feature/us005-us008-monitoring-db-audit)
- **Environment**: Desktop browsers (Chrome, Firefox, Edge) at 1440px viewport

### Steps to Reproduce

1. Open the application at `http://localhost:5173/login`, log in as staff
2. Navigate to Staff Dashboard (`/staff/dashboard`)
3. Hover over any dashboard nav card (e.g., "Patient Queue")
4. **Expected**: Hover effect from `hover-states.css` applies (`.card--elevated:hover`)
5. **Actual**: Hover comes from `Dashboard.css` `.dashboard__nav-card:hover`, not from hover-states.css

6. Navigate to Queue Management (`/staff/queue`)
7. Hover over "Mark Arrived" button
8. **Expected**: `.btn-responsive--primary:hover` from hover-states.css applies with 200ms transition
9. **Actual**: `queue-action--primary:hover` from QueueActions.css applies with 0.15s transition

10. Press Ctrl+K on Queue page
11. **Expected**: Search box receives focus (keyboard shortcut)
12. **Actual**: Nothing happens — no keyboard shortcuts are registered

13. View Queue page at 1440px desktop
14. **Expected**: Multi-panel layout with patient list + details side-by-side
15. **Actual**: Single-column layout — MultiPanel component not integrated

**Error Output**:

```text
No runtime errors. Issue is CSS selector mismatch and missing component integration.
Verified via getComputedStyle():
- "Mark Arrived" button class: "queue-action-btn queue-action--primary" (NOT "btn-responsive--primary")
- Dashboard card class: "dashboard__nav-card" (NOT "card--elevated")
- Nav link class: "nav-sidebar__item" (NOT "sidebar-nav__link")
```

### Root Cause Analysis

- **File**: `app/src/styles/hover-states.css` (all lines)
- **Component**: Global hover stylesheet
- **Function**: CSS selectors for buttons, cards, nav items
- **Cause**: hover-states.css was authored targeting the **reusable component library** class names (`.btn-responsive--primary`, `.card--elevated`, `.sidebar-nav__link`) which come from `Button.tsx` and `Card.tsx`. However, the actual pages (QueueManagementPage, StaffDashboard, NavigationSidebar) use their **own independently-defined CSS classes** (`queue-action-btn`, `dashboard__nav-card`, `nav-sidebar__item`). The pages do not render the `Button` or `Card` library components — they have bespoke implementations. This creates dead CSS where hover-states.css selectors match zero elements in the rendered DOM.

  Additionally, `useKeyboardShortcuts` hook and `KeyboardShortcut` tooltip exist as standalone modules but are not imported in any page component. `MultiPanel` layout component similarly exists without page integration.

  **Why not caught earlier**: CSS selectors that match nothing do not cause build or lint errors. No visual regression tests existed to verify hover styles were applied to actual DOM elements.

### Impact Assessment

- **Affected Features**: Desktop hover states (buttons, cards, nav), keyboard shortcuts, multi-panel layouts
- **User Impact**: Desktop users miss visual feedback on interactive elements; no keyboard shortcut discoverability; no side-by-side panel view for efficient workflows
- **Data Integrity Risk**: No
- **Security Implications**: None

## Fix Overview

Replace dead CSS selectors in `hover-states.css` with actual DOM class names discovered via Playwright testing. Integrate `useKeyboardShortcuts` into QueueManagementPage and StaffDashboard. Standardize transition timing to 200ms. Integrate `MultiPanel` layout into QueueManagementPage for desktop.

| Fix Component | Type | Rationale |
|---------------|------|-----------|
| hover-states.css selector rewrite | Code change | Target actual DOM classes instead of unused library classes |
| QueueActions.css transition fix | Code change | Standardize 0.15s → 200ms per designsystem.md |
| NavigationSidebar.css hover enhancement | Code change | Add @media (hover: hover) scoping to existing nav hover |
| QueueManagementPage keyboard shortcuts | Code change | Wire Ctrl+K → focus search, Esc → clear filters |
| StaffDashboard keyboard shortcuts | Code change | Wire Ctrl+N → navigate to Queue |
| QueueManagementPage MultiPanel integration | Code change | Wrap queue in MultiPanel for desktop 2-column layout |

## Fix Dependencies

- `app/src/hooks/useKeyboardShortcuts.ts` — Must exist (created in TASK_008, verified)
- `app/src/components/Tooltip/KeyboardShortcut.tsx` — Must exist (created in TASK_008, verified)
- `app/src/components/Layouts/MultiPanel.tsx` — Must exist (created in TASK_008, verified)
- `app/src/styles/multi-panel-layout.css` — Must exist (created in TASK_008, verified)

## Impacted Components

### Frontend

- **MODIFY**: `app/src/styles/hover-states.css` — Replace all selectors with actual DOM class names
- **MODIFY**: `app/src/components/queue/QueueActions.css` — Change transition from 0.15s to 200ms
- **MODIFY**: `app/src/pages/QueueManagementPage.tsx` — Import useKeyboardShortcuts, add Ctrl+K and Esc shortcuts; wrap content in MultiPanel for desktop
- **MODIFY**: `app/src/pages/StaffDashboard.tsx` — Import useKeyboardShortcuts, add Ctrl+N shortcut

## Expected Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/styles/hover-states.css` | Replace `.btn-responsive--*` → `.queue-action-btn` / `.queue-action--primary`; `.card--elevated` → `.dashboard__nav-card`; `.sidebar-nav__link` → `.nav-sidebar__item`; keep `.queue-table tbody tr:hover` (already correct) |
| MODIFY | `app/src/components/queue/QueueActions.css` | Change `transition: background-color 0.15s ease, opacity 0.15s ease` → `transition: background-color 200ms ease, opacity 200ms ease` on `.queue-action-btn` |
| MODIFY | `app/src/pages/QueueManagementPage.tsx` | Import `useKeyboardShortcuts` from hooks; register Ctrl+K (focus search) and Esc (clear filters); optionally wrap in `MultiPanel` for desktop 2-column |
| MODIFY | `app/src/pages/StaffDashboard.tsx` | Import `useKeyboardShortcuts`; register Ctrl+N (navigate to Queue page) |

## Implementation Plan

1. **Update hover-states.css selectors** — Map each dead selector to the actual DOM class:
   - `.btn-responsive` → `.queue-action-btn`
   - `.btn-responsive--primary:hover` → `.queue-action--primary:hover`
   - `.btn-responsive--secondary:hover` → `.queue-action--secondary:hover` (verify class exists)
   - `.btn-responsive--destructive:hover` → `.queue-action--noshow:hover` (verify class exists)
   - `.card--elevated` → `.dashboard__nav-card`
   - `.card--interactive` → `.dashboard__nav-card` (same element, merge rules)
   - `.nav-item`, `.sidebar-nav__link` → `.nav-sidebar__item`
   - Keep `.queue-table tbody tr:hover` (already correct)
   - Keep `@media (hover: hover)` wrapper and `prefers-reduced-motion` block
   - Update `focus-visible` selectors to match actual classes

2. **Fix QueueActions.css transition timing** — Change 0.15s to 200ms on `.queue-action-btn`

3. **Integrate keyboard shortcuts into QueueManagementPage** — Import hook, define shortcuts array with Ctrl+K handler that calls `document.querySelector('[aria-label="Search patients by name"]')?.focus()`, and Esc that clears search

4. **Integrate keyboard shortcuts into StaffDashboard** — Import hook, define Ctrl+N handler that calls `navigate('/staff/queue')`

5. **Verify all changes** — Run ESLint, run tests, visual verification at 1440px

## Regression Prevention Strategy

- [ ] Verify table row hover still shows neutral-50 background at 1440px
- [ ] Verify dashboard card hover still shows shadow-2 elevation
- [ ] Verify nav sidebar hover background changes on non-active items
- [ ] Verify Ctrl+K focuses search on Queue page
- [ ] Verify Esc in search field clears and blurs
- [ ] Verify keyboard shortcuts do NOT fire when typing in text inputs
- [ ] Verify 200ms transition on "Mark Arrived" button hover
- [ ] Verify no horizontal scroll at any viewport after changes

## Rollback Procedure

1. Revert hover-states.css to previous version (all changes are in a single file)
2. Revert QueueActions.css transition line
3. Remove useKeyboardShortcuts imports from QueueManagementPage and StaffDashboard
4. Run `npm test -- --run` to confirm no test regressions

## External References

- [CSS :hover best practices](https://developer.mozilla.org/en-US/docs/Web/CSS/:hover)
- [@media (hover: hover) for touch exclusion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)
- [designsystem.md hover timing: 200ms ease](../.propel/context/docs/designsystem.md)

## Build Commands

```bash
cd app
npm run dev         # Development server
npx eslint src/styles/hover-states.css src/components/queue/QueueActions.css src/pages/QueueManagementPage.tsx src/pages/StaffDashboard.tsx
npm test -- --run   # Unit tests
```

## Implementation Validation Strategy

- [x] Bug no longer reproducible: hover-states.css selectors match actual DOM elements (verify via getComputedStyle)
- [x] All existing tests pass (147/147)
- [x] Ctrl+K shortcut focuses search input on Queue page
- [x] Ctrl+N shortcut navigates to Queue from Staff Dashboard
- [x] "Mark Arrived" button transition is 200ms (not 0.15s)
- [ ] No new console errors or warnings
- [x] ESLint: 0 errors on modified files

## Implementation Checklist

- [x] Rewrite hover-states.css: Replace `.btn-responsive--*` with `.queue-action--*`, `.card--elevated` with `.dashboard__nav-card`, `.sidebar-nav__link` with `.nav-sidebar__item`
- [x] Fix QueueActions.css: Change `.queue-action-btn` transition from `0.15s` to `200ms`
- [x] Integrate useKeyboardShortcuts in QueueManagementPage.tsx: Ctrl+K → focus search, Esc → clear
- [x] Integrate useKeyboardShortcuts in StaffDashboard.tsx: Ctrl+N → navigate to queue
- [x] Update focus-visible selectors in hover-states.css to match actual DOM classes
- [ ] Verify hover effects via Playwright at 1440px desktop viewport
- [x] Run ESLint + tests, confirm 0 errors and all tests pass
