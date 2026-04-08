# Bug Fix Task - BUG_NAV_DUPLICATE

## Bug Report Reference
- Bug ID: BUG_NAV_DUPLICATE
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_002.md` (UX Review Findings)

## Bug Summary

### Issue Classification
- **Priority**: High
- **Severity**: Major UX degradation — dual navigation causes user confusion across all authenticated pages
- **Affected Version**: Current (feature/us005-us008-monitoring-db-audit)
- **Environment**: All browsers, all viewports (most visible at desktop ≥1025px and tablet 768px)

### Steps to Reproduce
1. Log in as any user (patient, staff, admin)
2. Navigate to PatientDashboard (`/patient/dashboard`) at desktop viewport (≥1025px)
3. **Expected**: Single navigation sidebar (the new centralized Sidebar from AuthenticatedLayout)
4. **Actual**: Two sidebars render — the new Sidebar (SVG icons, left column) AND the legacy NavigationSidebar (emoji icons, second column via DashboardLayout)

Additionally:
- StaffDashboard and AdminDashboard render their own `<header>` with logout buttons, duplicating the AuthenticatedLayout Header
- PatientDashboard skip-link is inside the page content, not before the Header
- BottomNav shows only 3 items for patient role (spec requires 4-5)

**Error Output**:
```text
No console errors — this is a visual/structural duplication bug, not a runtime error.
Visual evidence captured at 375px, 768px, 1024px, 1025px, and 1440px viewports.
```

### Root Cause Analysis
- **File**: `app/src/pages/PatientDashboard.tsx:65-66`
- **Component**: PatientDashboard, StaffDashboard, AdminDashboard, UserManagementPage
- **Function**: Render methods of all dashboard pages
- **Cause**: The dashboard pages were built before US_044 TASK_002 introduced the centralized navigation system (`AuthenticatedLayout` in App.tsx with Header, Sidebar, MobileMenu, BottomNav). These pages still embed their own navigation via:
  1. `PatientDashboard` and `UserManagementPage` use `<DashboardLayout sidebar={<NavigationSidebar />}>` which renders a legacy `<aside>` with emoji-icon nav items
  2. `StaffDashboard` and `AdminDashboard` render their own `<header className="dashboard__header">` with title, user info, and logout button
  3. The skip-link (`<a href="#main-content" className="skip-link">`) is rendered inside PatientDashboard instead of at the top of the authenticated layout
  4. The `navigationConfig.tsx` only marks 2 patient items with `bottomNav: true`, leaving the BottomNav sparse

  **Why not caught earlier**: The centralized navigation (AuthenticatedLayout) was added in US_044 TASK_002 as a wrapper around `<Outlet />`. The page-level components were not updated in the same task to remove their redundant navigation, creating the overlap.

### Impact Assessment
- **Affected Features**: All authenticated pages — PatientDashboard, StaffDashboard, AdminDashboard, UserManagementPage
- **User Impact**: Confusing dual-navigation UX on desktop; duplicate header/logout on staff/admin dashboards; skip-link inaccessible to keyboard users; sparse mobile bottom nav
- **Data Integrity Risk**: No
- **Security Implications**: None

## Fix Overview
Remove legacy page-level navigation (DashboardLayout with NavigationSidebar, inline headers with logout) from all dashboard pages. These pages should render only their content, relying on the AuthenticatedLayout wrapper in App.tsx for Header, Sidebar, MobileMenu, and BottomNav. Additionally, move the skip-link into AuthenticatedLayout and add more patient items to BottomNav.

## Fix Dependencies
- US_044 TASK_002 (Responsive Navigation Header) — must be complete (it is)

## Impacted Components

### Frontend — Pages
- `app/src/pages/PatientDashboard.tsx` — MODIFY: Remove DashboardLayout wrapper and NavigationSidebar, remove skip-link, keep page content and NotificationsPanel
- `app/src/pages/StaffDashboard.tsx` — MODIFY: Remove inline `<header>` with logout button, keep nav-card grid content
- `app/src/pages/AdminDashboard.tsx` — MODIFY: Remove inline `<header>` with logout button, keep nav-card grid and CircuitBreakerStatusPanel
- `app/src/pages/UserManagementPage.tsx` — MODIFY: Remove DashboardLayout wrapper and NavigationSidebar, render content directly

### Frontend — Navigation
- `app/src/App.tsx` — MODIFY: Add skip-link before Header in AuthenticatedLayout
- `app/src/components/Navigation/navigationConfig.tsx` — MODIFY: Add `bottomNav: true` to patient intake items

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/pages/PatientDashboard.tsx` | Remove `DashboardLayout` and `NavigationSidebar` imports/usage; remove `.skip-link`; render content directly (WelcomeBanner, QuickActions, appointments, waitlist). Keep NotificationsPanel as inline content. |
| MODIFY | `app/src/pages/StaffDashboard.tsx` | Remove `<header className="dashboard__header">` block with logout button; keep `dashboard__content` section with welcome and nav-grid |
| MODIFY | `app/src/pages/AdminDashboard.tsx` | Remove `<header className="dashboard__header">` block with logout button; keep `dashboard__content` with CircuitBreakerStatusPanel and nav-grid |
| MODIFY | `app/src/pages/UserManagementPage.tsx` | Remove `DashboardLayout` and `NavigationSidebar` imports/usage; render user management content directly |
| MODIFY | `app/src/App.tsx` | Add `<a href="#main-content" className="skip-link">Skip to main content</a>` as first child inside AuthenticatedLayout, before `<Header />` |
| MODIFY | `app/src/components/Navigation/navigationConfig.tsx` | Add `bottomNav: true` to patient `Patient Intake` item; add `Profile` item with `bottomNav: true` |

## Implementation Plan
1. **Modify PatientDashboard.tsx**: Remove `DashboardLayout` wrapper and `NavigationSidebar`. Replace with a `<div>` wrapper. Remove skip-link element. Remove the `WelcomeBanner` inline logout (since logout is now in the Sidebar/Header). Keep `NotificationsPanel` as an inline section within the content area.
2. **Modify StaffDashboard.tsx**: Remove the `<header className="dashboard__header">` block including the title, user info, and logout button. The Header with user avatar and role badge is now provided by AuthenticatedLayout.
3. **Modify AdminDashboard.tsx**: Same as StaffDashboard — remove inline header block. Keep CircuitBreakerStatusPanel and nav-grid.
4. **Modify UserManagementPage.tsx**: Remove `DashboardLayout` wrapper and `NavigationSidebar`. Render the user management table/form content directly.
5. **Add skip-link to AuthenticatedLayout** (App.tsx): Insert `<a href="#main-content" className="skip-link">Skip to main content</a>` as the first element inside the `.appLayout` div, before `<Header />`, and add `id="main-content"` to the `<main>` element.
6. **Enhance BottomNav items** (navigationConfig.tsx): Add `bottomNav: true` to patient `Patient Intake` nav item. Ensure patient BottomNav shows 4 items plus "More" (Dashboard, Book Appointment, Patient Intake, More).
7. **Verify TypeScript build**: Run `npx tsc --noEmit` to confirm no type errors.
8. **Verify visual at 375px, 768px, 1025px, 1440px**: Ensure single navigation renders at each viewport.

## Regression Prevention Strategy
- [x] Visual regression: Screenshot comparison at 375px, 768px, 1025px, 1440px after fix
- [x] Verify no duplicate `<aside>` or `<header>` elements in DOM at each viewport
- [x] Verify skip-link is the first focusable element after page load
- [x] Verify BottomNav shows 4 items for patient role
- [x] Test all roles (patient, staff, admin) — each should have single navigation

## Rollback Procedure
1. Revert changes to PatientDashboard.tsx, StaffDashboard.tsx, AdminDashboard.tsx, UserManagementPage.tsx, App.tsx, navigationConfig.tsx via `git checkout -- <files>`
2. Verify pages render with legacy DashboardLayout navigation
3. No data migration needed — purely UI components

## External References
- US_044 TASK_002 implementation: New centralized navigation (Header, Sidebar, MobileMenu, BottomNav)
- AuthenticatedLayout in `app/src/App.tsx` (lines 57-70)
- designsystem.md §2.3: Header, Sidebar, BottomNav specs
- WCAG 2.4.1: Skip navigation mechanism

## Build Commands
```bash
cd app
npx tsc --noEmit
npm run dev
```

## Implementation Validation Strategy
- [x] No duplicate sidebar visible at desktop (1440px)
- [x] No duplicate header visible on staff/admin dashboards
- [x] Skip-link is first focusable element (Tab key from page load)
- [x] BottomNav shows 4 items for patient role at mobile (375px)
- [x] All existing page functionality preserved (quick actions, appointments, waitlist)
- [x] TypeScript build passes with 0 errors

## Implementation Checklist
- [x] Remove DashboardLayout + NavigationSidebar from PatientDashboard.tsx
- [x] Remove skip-link from PatientDashboard.tsx
- [x] Remove inline header from StaffDashboard.tsx
- [x] Remove inline header from AdminDashboard.tsx
- [x] Remove DashboardLayout + NavigationSidebar from UserManagementPage.tsx
- [x] Add skip-link to AuthenticatedLayout in App.tsx
- [x] Add `id="main-content"` to main element in AuthenticatedLayout
- [x] Add `bottomNav: true` to patient intake item in navigationConfig.tsx
