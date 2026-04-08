# Design Review Report

## Summary

This review evaluates the responsive dashboard implementation for US_044 TASK_005 covering Patient Dashboard (SCR-002), Staff Dashboard (SCR-003), and Admin Dashboard (SCR-004). The implementation delivers solid foundational responsive components — DashboardGrid, DashboardWidget, ResponsiveTabs, and FAB — with strong accessibility patterns on the tab component. However, significant wireframe deviations exist: dashboard layouts lack the multi-column data-dense layouts shown in wireframes, Staff and Admin dashboards render as navigation-card menus instead of data-driven views, and CSS spacing values deviate from designsystem.md tokens. The Patient Dashboard is the most complete, with loading/empty/error states and real data integration.

**What works well:**
- ResponsiveTabs implements correct WAI-ARIA tab pattern with keyboard navigation (Arrow keys, Home/End)
- FAB component meets 56px touch target (exceeds 44px minimum), has proper aria-label, and hides on desktop
- Mobile-first CSS approach with proper breakpoint progression
- Skip-to-content link present for keyboard users
- Bottom navigation on mobile/tablet provides persistent navigation
- `prefers-reduced-motion` media query disables animations for accessibility

## Findings

### Blockers

- **B-01: Dashboard sections render stacked full-width on desktop instead of multi-column grid**: On desktop (≥1025px), the Patient Dashboard shows Appointments, Waitlist, and Notifications as vertically stacked full-width sections. The wireframe (SCR-002) specifies a 2fr+1fr two-column split (Appointments left, Notifications right). The ResponsiveTabs component renders all panels sequentially on desktop but does not wrap them in DashboardGrid, so the 3-column CSS Grid never applies to the main content areas.
  - Screenshot: `impl_large_1920_patient.png` vs `wireframe_desktop_1440_patient.png`
  - Expected: Upcoming Appointments (2fr) + Notifications (1fr) side-by-side at ≥1025px
  - Actual: All sections stacked vertically at full width
  - Impact: Fails AC-1 "three-column layout for dashboards" on desktop

- **B-02: Staff Dashboard is navigation-only, missing all data widgets from wireframe**: The wireframe (SCR-003) shows a data-rich dashboard with KPI cards (Today's Appointments: 18, Patients Arrived: 12, Pending Intake: 4), department-grouped appointment tables, and real-time data. The implementation renders only navigation cards (Patient Queue, Book Appointment, AI Intake, Manual Intake) with no actual data display, no Table components, and no Badge components.
  - Screenshot: `impl_desktop_1440_staff.png` vs `wireframe_desktop_1440_staff.png`
  - Expected: KPI summary cards + department appointment tables + status badges
  - Actual: Navigation cards linking to other pages
  - Impact: Staff users have no dashboard overview; must navigate to separate pages for each piece of information

- **B-03: Admin Dashboard is navigation-only, missing data tables from wireframe**: The wireframe (SCR-004) shows KPI cards (Total Users: 342, Active Staff: 28, Today's Appointments: 67, System Alerts: 3), a Recent Users table, and a Recent Audit Logs table. The implementation renders navigation cards only (System Metrics, Audit Logs, User Management, Departments) plus a Circuit Breaker Status panel.
  - Screenshot: `impl_desktop_1440_admin.png` vs `wireframe_desktop_1440_admin.png`
  - Expected: KPI cards + Recent Users table + Recent Audit Logs table
  - Actual: Navigation cards + Circuit Breaker monitor

### High-Priority Issues

- **H-01: Mobile grid padding too narrow (4px vs 16px)**: The CSS sets `padding: 0 4px` on `.dashboard-grid` at mobile viewport. The designsystem.md specifies 16px margin each side for mobile containers. Content sits too close to screen edges on small devices.
  - Affected: All dashboards at <768px
  - designsystem.md: `mobile.container: "100% - 32px padding (16px each side)"`
  - Actual CSS: `padding: 0 4px`

- **H-02: Tablet grid gap 20px instead of 24px**: The CSS sets `gap: 20px` at the tablet breakpoint (≥768px). The designsystem.md specifies `tablet.gutter: 24px`.
  - Affected: All dashboards at 768-1024px
  - Expected: 24px gap
  - Actual: 20px gap

- **H-03: Staff/Admin dashboards lack loading, empty, and error states**: Per figma_spec.md, SCR-003 and SCR-004 require Default, Loading, Empty, and Error states. The Staff and Admin dashboards only render navigation cards with no data fetching, so no loading spinners, empty states, or error handling exist. Only the Patient Dashboard implements all four states.
  - Impact: UXR-401 compliance failure for Staff and Admin dashboards

- **H-04: FAB overlaps bottom navigation on mobile**: At 375px viewport, the FAB (fixed bottom: 24px, right: 24px) visually overlaps with the bottom navigation bar. The FAB should have increased bottom offset to clear the bottom nav bar height.
  - Screenshot: `impl_mobile_375_patient.png` — FAB partially hidden behind bottom nav
  - Impact: Touch target conflict; users may accidentally tap the wrong element

- **H-05: Patient Dashboard missing "Documents" widget**: The figma_spec.md SCR-002 requires 4 cards (Upcoming Appointments, Quick Actions, Documents, Notifications). The implementation has Appointments, Waitlist, and Notifications tabs but no Documents section. The wireframe shows "Upload Documents" as a quick action only, but the specification lists Documents as a dedicated card widget.

- **H-06: max-width 1600px conflicts with designsystem.md 1440px**: The task spec says max-width 1600px for large desktop, but designsystem.md specifies `wide.container: "1440px centered"`. The CSS implements 1600px per the task. This inconsistency should be resolved with an authoritative decision.

### Medium-Priority Suggestions

- **M-01: Inactive tab text color borderline contrast**: Inactive tab color `#6B7280` on white background yields approximately 4.6:1 contrast ratio — barely meeting WCAG AA 4.5:1 for normal text (14px). Increasing to `#4B5563` would provide a more comfortable 7:1 ratio and meet AAA.

- **M-02: DashboardWidget lacks landmark roles**: Widgets render as plain `<div>` elements without `role="region"` or `aria-labelledby` attributes. Adding these would improve screen reader navigation by allowing users to jump between dashboard sections.

- **M-03: Quick Actions uses 4 buttons on Patient Dashboard vs 3 in wireframe**: The wireframe shows 3 quick actions (Book Appointment, Complete Intake, Upload Documents). The implementation shows 4 (Book Appointment, Upload Documents, AI Intake, Manual Intake). While functional, this deviates from the wireframe layout.

- **M-04: Heading hierarchy inconsistency**: The Patient Dashboard has `h2` for "Good evening" and "Quick Actions", then `h3` inside DashboardWidget titles, which is correct. However, the WaitlistSection internally uses `h2` for "My Waitlist" inside an `h3`-titled widget, breaking the heading hierarchy.

- **M-05: No skeleton loading states**: UXR-401 requires skeleton screens for loads >500ms. The Patient Dashboard uses a LoadingSpinner instead of skeleton placeholders that match the expected layout shape.

### Nitpicks

- Nit: Widget border uses hard-coded `#E5E5E5` instead of `var(--neutral-200)` CSS variable in `dashboard-responsive.css`
- Nit: Widget hover shadow uses hard-coded value `0 2px 8px rgba(0,0,0,0.1)` instead of elevation token `var(--shadow-2)`
- Nit: FAB label text hidden below 480px — consider always showing icon-only with tooltip for consistency
- Nit: Tab font-size 14px is acceptable but wireframe appears to use 16px tab labels

## Testing Coverage

### Tested Successfully

- Mobile (<768px): Single column layout renders correctly for Patient Dashboard
- Tablet (768-1024px): Two-column Quick Actions grid renders; tabs visible and functional
- Desktop (1025-1440px): Tabs hidden; all sections rendered simultaneously
- Large Desktop (>1440px): max-width constraint applied; content doesn't stretch infinitely
- Tab keyboard navigation: ArrowRight/ArrowLeft moves between tabs correctly
- Tab ARIA: role="tablist", role="tab", role="tabpanel", aria-selected, aria-controls all present
- FAB: aria-label present, 56px min touch target, hidden at ≥1025px
- Skip-to-content link present in DOM
- Bottom navigation renders on mobile/tablet with 4 items
- Hamburger menu accessible on tablet viewport
- Error state renders with "Try Again" button on Patient Dashboard (error recovery path)
- Empty state renders for Waitlist with descriptive message and guidance
- `prefers-reduced-motion` disables transitions on FAB and widgets

### Metrics

- Viewports tested: Desktop (1440px), Tablet (768px), Mobile (375px), Large Desktop (1920px)
- Wireframes compared: SCR-002 (Patient), SCR-003 (Staff), SCR-004 (Admin) at desktop 1440px
- Console errors: 8 (all API 500 errors from backend database issues, not frontend bugs)
- Accessibility issues (automated): 0 missing alt attributes, 0 unlabeled buttons
- Tab contrast ratio: ~4.6:1 (inactive), ~4.6:1 (active) — passes AA minimum
- Touch targets: FAB 56px (passes), tabs 44px min-height (passes)
- State coverage: Patient 4/4, Staff 1/4, Admin 1/4

### Wireframe Deviation Report

| Element | Screen | Wireframe | Implementation | Deviation | Severity |
|---------|--------|-----------|----------------|-----------|----------|
| Dashboard layout | SCR-002 | 2fr+1fr two-column grid | Stacked full-width sections | Layout mismatch | Blocker |
| Quick Actions count | SCR-002 | 3 cards | 4 buttons | +1 action | Medium |
| Documents card | SCR-002 | Dedicated card widget | Missing (only in Quick Actions) | Missing widget | High |
| KPI summary cards | SCR-003 | 3 KPI cards (18, 12, 4) | None — navigation cards only | Missing entirely | Blocker |
| Department tables | SCR-003 | 7 department appointment tables | None | Missing entirely | Blocker |
| KPI cards | SCR-004 | 4 KPI cards (342, 28, 67, 3) | None — navigation cards only | Missing entirely | Blocker |
| Recent Users table | SCR-004 | User table with 4 rows | None | Missing entirely | Blocker |
| Recent Audit Logs | SCR-004 | Audit log table with 5 rows | None (Circuit Breaker panel instead) | Missing table | Blocker |
| Sidebar nav items | SCR-002 | 5 items (incl. Documents, Profile) | 4 items (no Documents, no Profile) | -1 to -2 items | Medium |
| Mobile padding | All | 16px each side | 4px each side | -12px per side | High |
| Tablet gap | All | 24px | 20px | -4px | High |

## Recommendations

1. **Wrap desktop dashboard content in DashboardGrid**: The ResponsiveTabs component correctly renders all panels on desktop, but the panels are not wrapped in a grid container. On desktop, the three tab panels should be placed inside a `DashboardGrid` to achieve the multi-column layout specified in the wireframes. The Patient Dashboard should use a 2fr+1fr split (Appointments spanning 2 columns, Notifications in 1 column) matching the wireframe.

2. **Implement data-driven widgets for Staff and Admin dashboards**: Replace navigation-only card layouts with actual data displays — KPI summary cards, appointment tables, and audit log tables as shown in the wireframes. These dashboards need API integration with loading, empty, and error states to meet figma_spec.md state requirements and UXR-401 compliance.
