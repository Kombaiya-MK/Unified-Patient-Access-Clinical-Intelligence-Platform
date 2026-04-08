# Bug Fix Task - BUG_DASH_001

## Bug Report Reference
- Bug ID: BUG_DASH_001
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_005.md` (H-01, H-02)

## Bug Summary

### Issue Classification
- **Priority**: High
- **Severity**: Visual defect affecting all dashboards on mobile and tablet viewports
- **Affected Version**: feature/us005-us008-monitoring-db-audit
- **Environment**: All browsers, mobile (<768px) and tablet (768-1024px) viewports

### Steps to Reproduce
1. Open any dashboard page (Patient, Staff, or Admin)
2. Set viewport to 375px wide (mobile)
3. **Expected**: Content has 16px padding on each side per designsystem.md
4. **Actual**: Content has only 4px padding on each side — nearly flush with screen edges

5. Set viewport to 768px wide (tablet)
6. **Expected**: Grid gap between widgets is 24px per designsystem.md
7. **Actual**: Grid gap is 20px — 4px narrower than specified

**Error Output**:
```text
No runtime error — visual spacing deviation from design tokens.
CSS: .dashboard-grid { padding: 0 4px; }       → should be { padding: 0 16px; }
CSS: @media (min-width: 768px) { gap: 20px; }  → should be { gap: 24px; }
```

### Root Cause Analysis
- **File**: `app/src/styles/dashboard-responsive.css:24-25`
- **Component**: DashboardGrid CSS
- **Function**: N/A (CSS rules)
- **Cause**: Mobile padding was set to `0 4px` instead of `0 16px` as required by `designsystem.md#spacing` (`mobile.container: "100% - 32px padding (16px each side)"`). Tablet gap was set to `20px` instead of `24px` as required by `designsystem.md#grid` (`tablet.gutter: 24px`).

### Impact Assessment
- **Affected Features**: All dashboard pages (Patient, Staff, Admin) on mobile and tablet
- **User Impact**: Content appears cramped on mobile; inconsistent spacing on tablet deviates from design system
- **Data Integrity Risk**: No
- **Security Implications**: None

## Fix Overview
Update two CSS property values in `dashboard-responsive.css` to match designsystem.md token values: mobile padding from `0 4px` to `0 16px`, tablet gap from `20px` to `24px`.

## Fix Dependencies
- None

## Impacted Components
### Frontend
- MODIFY: `app/src/styles/dashboard-responsive.css` — DashboardGrid mobile and tablet rules

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/styles/dashboard-responsive.css` | Change `.dashboard-grid` padding from `0 4px` to `0 16px`; change tablet `gap` from `20px` to `24px` |

## Implementation Plan
1. Open `app/src/styles/dashboard-responsive.css`
2. Change line 25: `padding: 0 4px;` → `padding: 0 16px;`
3. Change line 31: `gap: 20px;` → `gap: 24px;`
4. Verify at 375px and 768px viewports

## Regression Prevention Strategy
- [x] Visual regression test: screenshot comparison at 375px and 768px viewports
- [x] Verify no horizontal scroll introduced at 320px minimum viewport

## Rollback Procedure
1. Revert the two CSS property value changes
2. Verify dashboard spacing returns to previous state

## External References
- designsystem.md § 1.3 Spacing: `mobile.container: "100% - 32px padding (16px each side)"`
- designsystem.md § 1.7 Grid System: `tablet.gutter: 24px`

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] Bug no longer reproducible: mobile content has 16px side padding, tablet gap is 24px
- [x] All existing tests pass
- [x] No horizontal scroll at 320px viewport width

## Implementation Checklist
- [x] Update `.dashboard-grid` padding from `0 4px` to `0 16px`
- [x] Update tablet `@media (min-width: 768px)` gap from `20px` to `24px`
- [x] Visual check at 375px, 768px, 1440px viewports
