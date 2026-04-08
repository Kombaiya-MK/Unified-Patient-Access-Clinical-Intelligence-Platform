# Bug Fix Task - BUG_DASH_002

## Bug Report Reference
- Bug ID: BUG_DASH_002
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_005.md` (H-04)

## Bug Summary

### Issue Classification
- **Priority**: High
- **Severity**: Touch target conflict on mobile — users may tap wrong element
- **Affected Version**: feature/us005-us008-monitoring-db-audit
- **Environment**: All browsers, mobile (<768px) and tablet (768-1024px) viewports

### Steps to Reproduce
1. Log in as a patient and navigate to `/patient/dashboard`
2. Set viewport to 375px wide (mobile)
3. Scroll to the bottom of the page
4. **Expected**: FAB button is fully visible above the bottom navigation bar
5. **Actual**: FAB overlaps the bottom navigation bar — the FAB sits at `bottom: 24px` while the bottom nav is 56px tall fixed at `bottom: 0`

**Error Output**:
```text
No runtime error — layout overlap between two fixed-position elements.
FAB: position: fixed; bottom: 24px; z-index: 100
BottomNav: position: fixed; bottom: 0; height: 56px; z-index: 100
Overlap: FAB occupies 24px-80px from bottom, BottomNav occupies 0px-56px from bottom → 32px overlap
```

### Root Cause Analysis
- **File**: `app/src/styles/dashboard-responsive.css:186`
- **Component**: FAB CSS
- **Function**: N/A (CSS positioning)
- **Cause**: The FAB `bottom: 24px` was set without accounting for the presence of the BottomNav component (56px tall, fixed at bottom). The FAB needs `bottom: 80px` (56px nav height + 24px spacing) on mobile/tablet viewports where the bottom nav is visible. On desktop (≥1025px), both the FAB and BottomNav are hidden so no conflict exists.

### Impact Assessment
- **Affected Features**: Patient Dashboard FAB ("Book Appointment"), Staff Dashboard FAB ("Add Patient")
- **User Impact**: FAB partially obscured by bottom nav; touch targets overlap causing accidental taps
- **Data Integrity Risk**: No
- **Security Implications**: None

## Fix Overview
Add a CSS rule for mobile/tablet viewports that increases the FAB `bottom` offset to `80px` to clear the 56px bottom navigation bar. This only applies below the desktop breakpoint (< 1025px) where both elements are visible.

## Fix Dependencies
- None

## Impacted Components
### Frontend
- MODIFY: `app/src/styles/dashboard-responsive.css` — FAB positioning rule

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/styles/dashboard-responsive.css` | Change FAB `bottom: 24px` to `bottom: 80px` in the base (mobile-first) rule; the desktop rule already hides the FAB so no change needed there |

## Implementation Plan
1. Open `app/src/styles/dashboard-responsive.css`
2. Change `.fab { bottom: 24px; }` to `.fab { bottom: 80px; }`
3. Verify at 375px viewport: FAB sits fully above the bottom nav bar
4. Verify at 768px viewport: FAB sits fully above the bottom nav bar
5. Verify at 1440px viewport: FAB is hidden (no regression)

## Regression Prevention Strategy
- [x] Visual test: FAB is fully visible above bottom nav at 375px and 768px
- [x] Verify FAB remains hidden at ≥1025px desktop viewport
- [x] Verify FAB touch target (56×56px minimum) is not clipped

## Rollback Procedure
1. Revert `.fab { bottom }` value from `80px` back to `24px`
2. Verify FAB positioning returns to previous state

## External References
- [Material Design FAB placement guidelines](https://m3.material.io/components/floating-action-button/guidelines)
- WCAG 2.2: Touch target spacing (2.5.8)

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] Bug no longer reproducible: FAB fully visible above bottom nav at 375px
- [x] All existing tests pass
- [x] FAB hidden at desktop viewport (no regression)

## Implementation Checklist
- [x] Update `.fab` bottom offset from `24px` to `80px`
- [x] Visual check at 375px, 768px, 1440px viewports
- [x] Verify no overlap between FAB and bottom navigation
