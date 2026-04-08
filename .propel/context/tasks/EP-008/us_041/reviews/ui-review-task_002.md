# Design Review Report — US_041 / TASK_002

## Summary

Reviewed the **FE Circuit Breaker Status UI** implementation for the Admin Dashboard (SCR-004). The implementation adds a circuit-breaker status panel, limited-functionality banner, and AI fallback alerts across 7 new files and 4 modified files. Overall assessment: **Conditional Pass** — the core UX patterns are well-implemented with strong accessibility, but design token alignment with the design system needs correction and the error state (no backend endpoint) dominates the current visual.

**What works well:**
- Clean component decomposition: StatusPanel, StatusCard, LimitedFunctionalityBanner, AIFallbackAlert
- Excellent accessibility: 0 axe-core violations across 25 WCAG 2.2 AA rules
- Responsive grid works correctly at all 3 breakpoints (1440 → 768 → 375)
- Semantic HTML with proper `role`, `aria-label`, `aria-modal`, `role="progressbar"` attributes
- Loading skeleton with pulse animation for graceful loading state
- Session-scoped dismiss with auto-reset on recovery for the warning banner

## Findings

### Blockers

None — no critical failures that block merge.

### High-Priority Issues

- **H1: Design token mismatch with design system colors**
  Implementation uses Tailwind CSS color values that differ from the design system tokens:

  | Token Purpose | Design System | Implementation | Delta |
  |---|---|---|---|
  | Success / Closed | `#00A145` (success-600) | `#22c55e` (Tailwind green-500) | Different hue/saturation |
  | Warning / Half-Open | `#FF8800` (warning-600) | `#eab308` (Tailwind yellow-500) | Different hue |
  | Error / Open | `#DC3545` (error-600) | `#ef4444` (Tailwind red-500) | Slightly different |
  | Primary link | `#0066CC` (primary-600) | `#2563eb` (Tailwind blue-600) | Different shade |

  **Impact**: Visual inconsistency with existing dashboard elements that follow the design system.
  **Affected viewports**: All (1440px, 768px, 375px).
  **Recommendation**: Update `STATE_STYLES` and inline color values to use design system tokens.

- **H2: Circuit breaker panel shows only error state in current deployment**
  The panel displays "Failed to fetch circuit breaker status" (red text) because no backend REST endpoint exists for `/api/circuit-breaker/status`. While this is a known gap flagged in the implementation review, the admin dashboard currently shows an error-only state for this section.

  **Impact**: Admin users see a permanent error banner with no circuit-breaker data.
  **Recommendation**: Either add backend endpoints (separate task) or show a graceful "No circuit breaker data available" informational state instead of an error.

### Medium-Priority Suggestions

- **M1: Inline styles vs. CSS modules / styled approach**
  All 4 circuit-breaker components use extensive inline `style={{}}` objects (100+ lines per component). The rest of the codebase is not reviewed for approach consistency, but inline styles:
  - Cannot be overridden by design system theme changes
  - Cannot leverage CSS pseudo-classes (`:hover`, `:focus-visible`)
  - Make responsive breakpoint-specific overrides impossible (the grid works via `auto-fill` but finer control requires media queries)

  **Recommendation**: Consider migrating to CSS modules or the project's styling approach in a follow-up task.

- **M2: Wireframe structural divergence**
  The wireframe (SCR-004) defines the Admin Dashboard with: sidebar navigation, 4 stats cards row, Recent Users table, Recent Audit Logs table. The implementation has: top header bar, welcome section, circuit-breaker panel, 8 workflow cards grid. The circuit breaker panel is described as "extends" the wireframe, but the overall page layout diverges significantly from the wireframe.

  **Impact**: The circuit breaker panel integrates cleanly within the existing (non-wireframe) layout, but a full wireframe-fidelity comparison is not applicable since the base dashboard was implemented differently.

- **M3: Modal backdrop click-to-close missing**
  The logs modal dialog has a close button (✕) but clicking the backdrop overlay does not close the modal. Users expect backdrop click to dismiss non-critical modals.

  **Recommendation**: Add `onClick={handleCloseLogs}` to the backdrop `<div>` with `stopPropagation` on the inner dialog.

### Nitpicks

- **Nit**: The `pulse` animation for loading skeletons relies on a global CSS `@keyframes pulse` rule — ensure this keyframe is defined somewhere in the app's global styles.
- **Nit**: The `CircuitBreakerStatusCard` dot indicators (`●`, `●●`, `●●●`) use Unicode text. Consider using SVG icons for consistent cross-browser rendering.
- **Nit**: The error text color `#dc2626` in the error state differs from both `#DC3545` (design system) and `#ef4444` (card styles) — three slightly different reds in the same feature area.

## Testing Coverage

### Tested Successfully

- [x] Desktop (1440px): Circuit breaker panel renders in section below welcome, 4-col workflow grid intact
- [x] Tablet (768px): Header wraps correctly, circuit breaker section full-width, workflow grid becomes 2-col
- [x] Mobile (375px): Single column layout, all text readable, no horizontal overflow
- [x] Login flow → Admin dashboard navigation works correctly
- [x] Loading skeleton state renders 4 placeholder cards with pulse animation (code verified)
- [x] Error state displays red error message when API unavailable
- [x] Modal dialog has proper ARIA attributes (`role="dialog"`, `aria-modal`, `aria-label`)
- [x] LimitedFunctionalityBanner has `role="alert"` for screen reader announcement
- [x] AIFallbackAlert has `role="alert"` and per-service messages with icons
- [x] Dismiss functionality uses sessionStorage (session-scoped persistence)

### Metrics

| Metric | Value |
|--------|-------|
| Viewports tested | Desktop (1440px), Tablet (768px), Mobile (375px) |
| Accessibility violations (axe-core) | **0** |
| Accessibility rules passed | **25** |
| Incomplete checks | 1 |
| Console errors at runtime | 5 (all related to missing backend endpoint — expected) |
| Console warnings | 1 |
| Components reviewed | 4 (StatusPanel, StatusCard, LimitedFunctionalityBanner, AIFallbackAlert) |
| Modified pages reviewed | 3 (AdminDashboard, AppointmentBookingPage, DocumentUploadPage) |

## Recommendations

1. **Align color tokens to design system**: Replace Tailwind color values (`#22c55e`, `#eab308`, `#ef4444`, `#2563eb`) with design system tokens (`#00A145`, `#FF8800`, `#DC3545`, `#0066CC`) in `CircuitBreakerStatusCard.tsx` and all circuit-breaker components. This ensures visual consistency as the platform evolves.

2. **Add graceful empty state for missing backend**: Replace the error message "Failed to fetch circuit breaker status" with an informational state like "Circuit breaker monitoring will be available once the backend service endpoints are deployed" to prevent admin confusion.

---

**Reviewer**: AI Assistant (analyze-ux workflow)
**Date**: 2026-04-06
**Task**: US_041 / TASK_002 — FE Circuit Breaker Status UI
**Verdict**: Conditional Pass — merge-ready with H1 (color tokens) flagged for follow-up
