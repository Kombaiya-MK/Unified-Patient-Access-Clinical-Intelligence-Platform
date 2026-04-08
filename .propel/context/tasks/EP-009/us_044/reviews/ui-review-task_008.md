# Design Review Report — task_008_fe_desktop_enhancements_testing

## Summary

Reviewed desktop enhancement features for US_044 TASK_008 across three viewports (1440px, 768px, 375px). The **responsive layout performs well** — no horizontal scroll at any viewport or at 200% zoom, table-to-card adaptation works on mobile, sidebar collapses to hamburger/bottom nav on tablet. **Hover states are partially effective**: table row hover and dashboard card hover use the correct shadow-2 and 200ms timing. However, the newly created `hover-states.css` CSS selectors target class names (`.btn-responsive--primary`, `.card--elevated`, `.sidebar-nav__link`) that **do not match the actual DOM class names** used in the running application (`queue-action-btn`, `dashboard__nav-card`, CSS module hashes). The `useKeyboardShortcuts` hook and `KeyboardShortcut` tooltip component exist as standalone modules but are **not integrated into any page**, so no keyboard shortcuts are functional. The `MultiPanel` layout component is similarly unintegrated.

## Findings

### Blockers

None.

### High-Priority Issues

- **H-1: hover-states.css selectors do not match actual DOM classes**
  The file targets `.btn-responsive--primary`, `.card--elevated`, `.card--interactive`, `.nav-item`, `.sidebar-nav__link`, but the rendered DOM uses:
  - Buttons: `queue-action-btn queue-action--primary`
  - Dashboard cards: `dashboard__nav-card`
  - Nav items: CSS module hash `_navItem_oq7om_793`

  The hover effects that *do* work (table row → neutral-50, dashboard card → shadow-2) originate from component-level CSS, not from `hover-states.css`. The new stylesheet is effectively dead CSS for most selectors.

  - **Affected elements**: Buttons (primary/secondary/ghost/destructive), cards, sidebar nav links
  - **Evidence**: `getComputedStyle` on "Mark Arrived" button returns transition 0.15s and class `queue-action-btn queue-action--primary` — no `.btn-responsive--primary` present
  - **Impact**: AC-1 "Desktop Features: hover states for buttons and links" is only partially met via existing component CSS, not via the new hover-states.css

- **H-2: Keyboard shortcuts not integrated into any page**
  `useKeyboardShortcuts` hook and `KeyboardShortcut` tooltip component are created as standalone modules in `src/hooks/` and `src/components/Tooltip/` but are not imported or used in any page component. Pressing Ctrl+N, Ctrl+K, or Esc triggers no application shortcuts.

  - **Impact**: AC-1 "keyboard shortcuts visible on hover tooltips" is not functional
  - **Affected pages**: All staff pages (Dashboard, Queue, Book for Patient)

### Medium-Priority Suggestions

- **M-1: MultiPanel layout not applied to any page**
  `MultiPanel.tsx` and `multi-panel-layout.css` exist but are not wired into QueueManagement or UserManagement pages. The task required "multi-panel views (e.g., patient list + details side-by-side)" for desktop — this remains unimplemented.

  - **Note**: The task spec references `src/pages/Staff/QueueManagement.tsx` and `src/pages/Admin/UserManagement.tsx`, but actual paths are `src/pages/QueueManagementPage.tsx`. Path mismatch may have contributed to deferred integration.

- **M-2: Transition timing inconsistency across components**
  Some interactive elements use `0.15s` transitions (queue action buttons, nav items from component CSS) while designsystem.md specifies `200ms`. The `hover-states.css` correctly declares `200ms ease`, but component-level styles with higher specificity override it.

  - **Evidence**: "Mark Arrived" button: `transition: background-color 0.15s, opacity 0.15s`; nav link: `transition: background-color 0.15s, color 0.15s`
  - **Expected**: All interactive transitions should use `200ms ease` per designsystem.md

### Nitpicks

- **Nit**: Queue page shows a duplicate header bar on desktop — global nav header (UPACI, Staff, notifications, avatar) AND a page-level banner (UPACI, Queue Management, SW avatar, Logout). This is a pre-existing issue, not from TASK_008, but wastes ~60px of vertical space.

## Testing Coverage

### Tested Successfully

- [x] Desktop 1440px layout: sidebar visible, full table with all columns, "3 IN QUEUE" badge
- [x] Tablet 768px layout: hamburger menu, bottom nav, tab-based dashboard sections, filters stack vertically
- [x] Mobile 375px layout: card-based queue display, bottom nav, FAB for "Add Patient", no table
- [x] No horizontal scroll at 1440px (`scrollWidth === clientWidth = 1425`)
- [x] No horizontal scroll at 768px (`scrollWidth === clientWidth = 753`)
- [x] No horizontal scroll at 375px (`scrollWidth === clientWidth = 360`)
- [x] 200% zoom compliance: no horizontal scroll (`scrollWidth === clientWidth = 1425`), layout reflows naturally
- [x] Table row hover: `background-color: rgb(250, 250, 250)` (neutral-50), transition 0.2s ✓
- [x] Dashboard card hover: `box-shadow: shadow-2`, transition 0.2s ✓
- [x] Nav link hover: `background-color: rgb(245, 245, 245)` (neutral-100), underline ✓
- [x] Skip-to-content link present
- [x] Main landmark present
- [x] 0 images missing alt text
- [x] 0 buttons without accessible names
- [x] 0 form inputs without labels
- [x] 0 links without accessible names
- [x] 0 console errors

### Metrics

- **Viewports tested**: Desktop (1440px), Tablet (768px), Mobile (375px)
- **Zoom levels tested**: 100%, 200%
- **Accessibility score**: 0 issues found (skip link ✓, landmarks ✓, labels ✓, ARIA ✓)
- **Console errors**: 0
- **Console warnings**: 1 (React DevTools info message — non-actionable)
- **Horizontal scroll**: None at any viewport or zoom level

## Recommendations

1. **Fix hover-states.css selectors to match actual DOM classes**, or apply hover styles directly within each component's CSS/CSS module. The current approach of a global stylesheet targeting BEM class names fails when components use CSS modules or different naming conventions.

2. **Integrate `useKeyboardShortcuts` and `KeyboardShortcut` into page components** to fulfil AC-1. At minimum, wire up Ctrl+K for search focus on the Queue page, and wrap action buttons with `<KeyboardShortcut>` tooltips.
