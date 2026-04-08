# Bug Fix Task - BUG_USERTABLE_MOBILE_A11Y

## Bug Report Reference

- Bug ID: BUG_USERTABLE_MOBILE_A11Y
- Source: `.propel/context/tasks/EP-009/us_044/reviews/ui-review-task_004.md`

## Bug Summary

### Issue Classification

- **Priority**: Medium
- **Severity**: WCAG AA compliance gap -- admin mobile users
- **Affected Version**: feature/us005-us008-monitoring-db-audit
- **Environment**: Mobile browsers (<768px), UserManagement (SCR-013)

### Steps to Reproduce

1. Log in as admin on mobile or resize to <768px
2. Navigate to User Management page
3. Observe mobile card layout renders
4. **Expected**: Action buttons have at least 44px touch
   targets, at least 16px font, scroll shadows on desktop
5. **Actual**: Buttons render at about 24px height
   (padding: 6px, fontSize: 0.75rem/12px). Desktop has
   bare `overflow-x: auto` with no scroll shadows.

**Error Output**:

```text
No runtime errors. WCAG 2.2 AA compliance issue:
- SC 2.5.8 (Target Size): 24px, below 44px minimum
- SC 1.4.4 (Resize Text): 12px, below 16px threshold
- Inconsistent with responsive-table.css design system
```

### Root Cause Analysis

- **File**: `app/src/components/admin/UserTable.tsx:175-232`
- **Component**: UserTable (mobile cards section)
- **Function**: Render return -- mobile card buttons
- **Cause**: UserTable was built in US_035 TASK_002
  before the responsive design system (US_044).
  Mobile cards use inline styles with undersized
  touch targets. TASK_004 listed it as MODIFY but
  deferred due to complex state management. The
  touch target gap is a WCAG compliance issue.

### Impact Assessment

- **Affected Features**: UserManagement admin page
  (SCR-013) mobile layout
- **User Impact**: Admin users on mobile encounter
  undersized tap targets and small text
- **Data Integrity Risk**: No
- **Security Implications**: None

## Fix Overview

Migrate UserTable.tsx mobile presentation to the
responsive design system: replace inline styles with
`responsive-table.css` classes, wrap desktop table in
`TableScrollContainer` for scroll shadows, use
`useBreakpoint()` for conditional rendering, and set
mobile buttons to WCAG-compliant 44px min touch targets.

## Fix Dependencies

- US_044 TASK_001 (responsive hooks, CSS variables)
- US_044 TASK_004 (TableScrollContainer, responsive-table.css)

## Impacted Components

### Frontend

- MODIFY: `app/src/components/admin/UserTable.tsx`

## Expected Changes

| Action | File Path              | Description            |
|--------|------------------------|------------------------|
| MODIFY | `UserTable.tsx` (admin)| Import useBreakpoint,  |
|        |                        | TableScrollContainer,  |
|        |                        | responsive-table.css.  |
|        |                        | Replace inline cards   |
|        |                        | with CSS classes. Set  |
|        |                        | button 44px minimum.   |

## Implementation Plan

1. **Add imports**: Import `useBreakpoint`,
   `TableScrollContainer`, and `responsive-table.css`
2. **Add breakpoint hook**: Call `useBreakpoint()`
   and derive `isMobile` boolean
3. **Wrap desktop table**: Wrap table in
   `TableScrollContainer` for scroll shadows
4. **Migrate mobile card styles**: Replace inline
   styles with `table-card` CSS classes
5. **Fix button touch targets**: Set min-height 44px,
   padding 12px 16px, font-size 1rem (16px)
6. **Replace CSS toggle**: Remove style tag, use
   isMobile conditional rendering
7. **Preserve functionality**: All props, CRUD, sorting,
   pagination, empty state remain unchanged

## Regression Prevention Strategy

- [ ] Visual verification at 375px: buttons at least 44px
- [ ] Visual verification at 768px: scroll shadows
- [ ] Visual verification at 1440px: full table
- [ ] Verify Edit button triggers onEdit callback
- [ ] Verify Deactivate disabled for self-user
- [ ] Verify empty state renders on mobile
- [ ] TypeScript compilation: zero errors

## Rollback Procedure

1. Revert `app/src/components/admin/UserTable.tsx`
   to previous version via git checkout
2. Verify page renders at desktop and mobile

## External References

- [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG 2.2 SC 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- US_044 TASK_004 responsive table implementation

## Build Commands

```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy

- [x] Mobile cards render with at least 44px buttons
- [x] Mobile text renders at 16px font size
- [x] Desktop table has scroll shadow indicators
- [x] All existing functionality preserved
- [x] Zero TypeScript compilation errors
- [x] Zero console errors

## Implementation Checklist

- [x] Import useBreakpoint, TableScrollContainer,
  and responsive-table.css
- [x] Add useBreakpoint() hook and isMobile boolean
- [x] Wrap desktop table in TableScrollContainer
- [x] Replace mobile card inline styles with CSS classes
- [x] Set action button min-height 44px, font-size 16px
- [x] Replace style tag with conditional rendering
- [x] Verify all existing props and callbacks unchanged
- [x] Validate touch targets at 375px viewport
