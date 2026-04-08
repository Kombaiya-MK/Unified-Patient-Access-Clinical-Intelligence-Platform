# Bug Fix Task - BUG_DASH_003

## Bug Report Reference
- Bug ID: BUG_DASH_003
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_005.md` (B-01)

## Bug Summary

### Issue Classification
- **Priority**: Critical
- **Severity**: Blocker — fails AC-1 "three-column layout for dashboards" on desktop
- **Affected Version**: feature/us005-us008-monitoring-db-audit
- **Environment**: All browsers, desktop (≥1025px) and large desktop (>1440px) viewports

### Steps to Reproduce
1. Log in as a patient and navigate to `/patient/dashboard`
2. Set viewport to 1440px wide (desktop)
3. **Expected**: Dashboard sections (Appointments, Waitlist, Notifications) render in a multi-column grid (wireframe shows 2fr + 1fr)
4. **Actual**: All sections render as vertically stacked full-width blocks — no multi-column layout

**Error Output**:
```text
No runtime error — architectural issue in ResponsiveTabs desktop rendering.
On desktop, ResponsiveTabs renders each tab's content in a sequential <div role="region">,
but these regions are not wrapped in DashboardGrid, so the CSS Grid columns never apply.
The .responsive-tabs container is a plain div with no grid display.
```

### Root Cause Analysis
- **File**: `app/src/components/dashboard/ResponsiveTabs.tsx:79-86`
- **Component**: ResponsiveTabs
- **Function**: Desktop branch of the render function
- **Cause**: When `isDesktop` is true, the component renders all tab panels as sequential `<div role="region">` elements inside a plain `<div className="responsive-tabs">`. The `.responsive-tabs` class has no CSS Grid properties — it is just `width: 100%`. The `DashboardGrid` component that provides the responsive grid layout is never used as a wrapper for the desktop output. Each tab panel's content (which may contain its own DashboardWidget) renders at full width because there is no parent grid container governing the column layout of the panels themselves.

### Impact Assessment
- **Affected Features**: All three dashboards (Patient, Staff, Admin) at desktop viewports
- **User Impact**: Desktop users see a long scrolling single-column page instead of a space-efficient multi-column dashboard — poor information density, more scrolling required
- **Data Integrity Risk**: No
- **Security Implications**: None

## Fix Overview
Modify the ResponsiveTabs desktop rendering to wrap the tab panels inside a `DashboardGrid` component, so the CSS Grid columns (3-column at ≥1025px) apply to the dashboard sections. Additionally, add a new CSS class `.responsive-tabs--desktop-grid` that applies grid layout matching the wireframe's column structure.

The Patient Dashboard wireframe (SCR-002) uses a **2fr + 1fr** layout (Appointments spanning 2 columns, Notifications in 1 column). The `DashboardWidget` already supports a `span` prop for column spanning. The ResponsiveTabs should accept an optional `desktopGridClassName` prop to allow per-dashboard grid customization.

## Fix Dependencies
- DashboardGrid component exists (from task_005)
- DashboardWidget span prop works correctly

## Impacted Components
### Frontend
- MODIFY: `app/src/components/dashboard/ResponsiveTabs.tsx` — Desktop render path to use DashboardGrid
- MODIFY: `app/src/styles/dashboard-responsive.css` — Add `.responsive-tabs--desktop-grid` styles

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/components/dashboard/ResponsiveTabs.tsx` | Wrap desktop tab panels in `<DashboardGrid>` instead of plain `<div>` |
| MODIFY | `app/src/styles/dashboard-responsive.css` | Add `.responsive-tabs--desktop-grid` with `display: grid` matching dashboard breakpoint columns |

## Implementation Plan
1. In `ResponsiveTabs.tsx`, import `DashboardGrid`
2. In the desktop branch (`if (isDesktop)`), wrap the mapped `<div role="region">` elements inside a `<DashboardGrid>` component
3. Add an optional `desktopClassName` prop to `ResponsiveTabsProps` for per-dashboard grid customization
4. In `dashboard-responsive.css`, ensure `.responsive-tabs` on desktop inherits proper grid behavior by adding a `.responsive-tabs--desktop` variant that uses `display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;`
5. Update PatientDashboard.tsx to set `span` props on DashboardWidgets within tabs so the Appointments section spans 2 columns
6. Verify at 1440px: dashboard sections render in columns matching wireframe
7. Verify at 768px and 375px: tab behavior unchanged (no regression)

## Regression Prevention Strategy
- [x] Visual regression test: desktop screenshot comparison at 1440px
- [x] Verify tabs still work at 768px (keyboard navigation, active tab switching)
- [x] Verify mobile 375px single-column layout unchanged
- [x] Verify large desktop 1920px max-width constraint still applies

## Rollback Procedure
1. Revert `ResponsiveTabs.tsx` desktop branch to plain `<div>` wrapper
2. Remove `.responsive-tabs--desktop` CSS if added
3. Verify stacked layout returns (previous known state)

## External References
- [MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- wireframe-SCR-002-patient-dashboard.html: `.dashboard-grid { grid-template-columns: 2fr 1fr; }`
- designsystem.md § 1.7 Grid: `Dashboard 3-column layout: 4-4-4 columns (desktop)`

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] Bug no longer reproducible: desktop shows multi-column dashboard layout
- [x] All existing tests pass
- [x] Tab keyboard navigation works at tablet/mobile viewports
- [x] Large desktop max-width constraint applies

## Implementation Checklist
- [x] Import `DashboardGrid` in `ResponsiveTabs.tsx`
- [x] Wrap desktop panels in `<DashboardGrid>` component
- [x] Add optional `desktopClassName` prop to `ResponsiveTabsProps`
- [x] Add `.responsive-tabs--desktop` CSS with grid properties
- [x] Verify Patient Dashboard renders Appointments (span-2) + Notifications (span-1) at 1440px
- [x] Verify tabs unchanged at 768px and 375px
