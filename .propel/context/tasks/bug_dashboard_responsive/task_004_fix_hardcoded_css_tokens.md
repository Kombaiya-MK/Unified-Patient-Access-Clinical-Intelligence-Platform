# Bug Fix Task - BUG_DASH_004

## Bug Report Reference
- Bug ID: BUG_DASH_004
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_005.md` (Nitpicks section)

## Bug Summary

### Issue Classification
- **Priority**: Low
- **Severity**: Design token non-compliance — hardcoded values instead of CSS variables
- **Affected Version**: feature/us005-us008-monitoring-db-audit
- **Environment**: All browsers, all viewports

### Steps to Reproduce
1. Open `app/src/styles/dashboard-responsive.css`
2. Inspect `.dashboard-widget` border color, hover shadow, tab colors, and FAB colors
3. **Expected**: All color and shadow values reference CSS custom properties from `Dashboard.css` (e.g., `var(--neutral-200)`, `var(--shadow-2)`, `var(--primary-600)`)
4. **Actual**: Multiple hardcoded hex values and shadow strings used directly

**Error Output**:
```text
No runtime error — maintainability concern.
Hardcoded values found:
  Line 82: border: 1px solid #E5E5E5  →  should be var(--neutral-200)
  Line 83: border-radius: var(--radius-lg, 12px)  →  already uses variable (OK)
  Line 113: box-shadow: 0 2px 8px rgba(0,0,0,0.1)  →  should be var(--shadow-2)
  Line 133: color: #6B7280  →  should be var(--neutral-500)
  Line 140: outline: 2px solid #0066CC  →  should be var(--primary-600)
  Line 144: color: #0066CC  →  should be var(--primary-600)
  Line 145: border-bottom-color: #0066CC  →  should be var(--primary-600)
  Line 192: background: #0066CC  →  should be var(--primary-600)
  Line 193: color: #FFFFFF  →  OK (white is universal)
  Line 206: background: #005BB8  →  should be var(--primary-700)
```

### Root Cause Analysis
- **File**: `app/src/styles/dashboard-responsive.css` (multiple lines)
- **Component**: Dashboard responsive CSS
- **Function**: N/A (CSS rules)
- **Cause**: CSS was authored with literal hex/rgba values instead of referencing the CSS custom properties defined in `Dashboard.css`. The variables are available in scope (`:root` block in `Dashboard.css`) but were not used by the responsive stylesheet. This reduces maintainability — if the design system colors change, these hardcoded values would need manual updates.

### Impact Assessment
- **Affected Features**: All dashboard widget styling, tab styling, FAB styling
- **User Impact**: None currently (values match design tokens). Risk of visual inconsistency if tokens are updated in the future
- **Data Integrity Risk**: No
- **Security Implications**: None

## Fix Overview
Replace all hardcoded color and shadow values in `dashboard-responsive.css` with their corresponding CSS custom property references from the `:root` block in `Dashboard.css`.

## Fix Dependencies
- CSS custom properties must be defined in `Dashboard.css` `:root` block (already present)

## Impacted Components
### Frontend
- MODIFY: `app/src/styles/dashboard-responsive.css` — Replace hardcoded values with CSS variables

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `app/src/styles/dashboard-responsive.css` | Replace ~10 hardcoded color/shadow values with `var()` references |

## Implementation Plan
1. Open `app/src/styles/dashboard-responsive.css`
2. Replace each hardcoded value per the mapping below:

| Line | Current Value | Replacement |
|------|--------------|-------------|
| 82 | `#E5E5E5` | `var(--neutral-200)` |
| 91 | `#F3F4F6` | `var(--neutral-100)` (closest) |
| 96 | `#1A1A1A` | `var(--neutral-900)` |
| 107 | `#F3F4F6` | `var(--neutral-100)` |
| 109 | `#FAFAFA` | `var(--neutral-50)` |
| 113 | `0 2px 8px rgba(0,0,0,0.1)` | `var(--shadow-2)` |
| 120 | `#E5E5E5` | `var(--neutral-200)` |
| 133 | `#6B7280` | `var(--neutral-500)` |
| 140 | `#0066CC` | `var(--primary-600)` |
| 144 | `#0066CC` | `var(--primary-600)` |
| 145 | `#0066CC` | `var(--primary-600)` |
| 192 | `#0066CC` | `var(--primary-600)` |
| 206 | `#005BB8` | `var(--primary-700)` |

3. Verify no visual changes at any viewport (purely a refactor)

## Regression Prevention Strategy
- [x] Visual regression test: screenshot comparison before and after — no pixel differences expected
- [x] Verify all CSS variables resolve correctly (no `undefined` fallbacks)

## Rollback Procedure
1. Revert all `var()` references back to hardcoded values
2. Verify no visual changes

## External References
- designsystem.md § 1.1 Colors: Token definitions
- UXR-301: "System MUST use design tokens from designsystem.md for all colors, typography, spacing (no hard-coded values)"

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] Bug no longer reproducible: no hardcoded color/shadow values remain in `dashboard-responsive.css`
- [x] Visual appearance unchanged (pixel-perfect before/after)
- [x] All existing tests pass

## Implementation Checklist
- [x] Replace all hardcoded `#` color values with `var()` CSS custom properties
- [x] Replace hardcoded shadow values with `var()` elevation tokens
- [x] Grep `dashboard-responsive.css` for remaining `#` hex values to catch any missed
- [x] Visual verification at 375px, 768px, 1440px
