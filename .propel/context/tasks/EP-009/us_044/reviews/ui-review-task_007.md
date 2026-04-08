# Design Review Report

## Summary

Touch interactions and mobile gestures implementation for Queue Management (SCR-009) was reviewed across three viewports (1440px desktop, 768px tablet, 375px mobile). The implementation introduces SwipeableRow components with left/right swipe gesture handlers, global touch target enforcement (≥44px), mobile-native DatePicker/TimePicker, and a dev-mode TouchTargetValidator. Overall implementation is strong with proper GPU-accelerated animations, semantic HTML, and ARIA support. Two high-priority and one medium-priority finding require attention before the feature is production-ready.

**What works well:**
- SwipeableRow uses GPU-accelerated `transform: translateX()` with `will-change: transform` for smooth animation
- 250ms cubic-bezier spring-back animation feels natural and responsive
- Cards correctly wrap each queue entry with hidden action panels (No-Show left/red, Check In right/green)
- `aria-label="Swipe left to check in, swipe right to mark no-show"` provides screen reader context
- Mobile card view displays at <768px with proper `<article>` semantic elements
- `html { touch-action: manipulation }` eliminates 300ms tap delay globally
- 200% zoom test passes — no horizontal scrollbar, layout remains usable
- All buttons and links meet ≥44px height, keyboard navigation has visible 2px blue outline
- Queue status badges use `role="status"` for ARIA live updates
- `prefers-reduced-motion: reduce` disables all swipe/action panel transitions
- DatePicker/TimePicker use native `<input type="date/time">` for platform-native pickers on mobile
- Swipe is disabled for non-scheduled appointments and during status update operations

## Findings

### Blockers

None.

### High-Priority Issues

- **H-1: Swipe gesture has no visual discoverability cue**
  Swipeable rows have no visual indicator (e.g., subtle arrow hint, onboarding tooltip, or first-use tutorial) that tells users they can swipe. A first-time staff user viewing the queue at 375px has no way to discover the swipe action exists. The only hint is the `aria-label` text, which is invisible to sighted users.
  - **Impact**: Staff users may never discover swipe-to-check-in, relying exclusively on the "Mark Arrived" button and three-dot menu. Reduces efficiency gain that swipe gestures are intended to provide.
  - **Affected viewport**: Mobile (375px)
  - **UXR**: UXR-001 (Navigation efficiency), UXR-201 (Mobile-first design)
  - **Screenshot**: Mobile card view — no visual swipe hint visible
  - **Recommendation**: Add a one-time onboarding animation (e.g., brief peek-a-boo of action panel on first load) or a subtle drag handle/chevron icon on card edges.

- **H-2: No confirmation for destructive "No-Show" swipe action**
  Swiping right past the 80px threshold immediately triggers `onStatusUpdate(id, 'no_show', version)` without any confirmation dialog. Per figma_spec.md, destructive actions (Cancel/Delete) require a Confirmation Dialog modal. Marking a patient as No-Show is a significant status change that could affect patient records and billing.
  - **Impact**: Accidental swipe right could incorrectly mark a patient as No-Show. While there is an undo mechanism (`useUndoNoShow`), the lack of pre-action confirmation is inconsistent with the design system's modal confirmation pattern.
  - **Affected viewport**: Mobile (375px) — swipe gesture only
  - **UXR**: UXR-502 (Clear error recovery paths)
  - **Recommendation**: Either (a) add a confirmation bottom sheet before executing the No-Show action, or (b) provide a prominent inline undo toast that appears for 5+ seconds, or (c) increase the swipe threshold for destructive-direction swipe to 120px.

### Medium-Priority Suggestions

- **M-1: Hardcoded hex color in swipeable-row action panel**
  In `touch-interactions.css` line 89, `.swipeable-row__action--right` uses `background: #16a34a` instead of the design system token `var(--success-600, #00A145)` or `var(--secondary-600, #00A86B)`. This violates UXR-301 (Design token adherence — no hard-coded values).
  - **Impact**: Color inconsistency with design system. The green used (#16a34a) doesn't match either success-600 (#00A145) or secondary-600 (#00A86B) from designsystem.md.
  - **File**: `app/src/styles/touch-interactions.css:89`

- **M-2: Duplicate "Mark Arrived" buttons (hidden + visible)**
  At 375px viewport, 6 "Mark Arrived" buttons exist — 3 have 0×0 dimensions (from desktop table view HTML) and 3 are visible at 89×44px (from mobile card view). The hidden table-view buttons remain in the DOM and are technically keyboard-focusable, which could confuse screen reader users navigating via Tab.
  - **Impact**: Minor accessibility confusion — screen reader may encounter invisible duplicate buttons.
  - **Recommendation**: Ensure the desktop table's `display: none` fully removes elements from the tab order, or add `tabindex="-1"` and `aria-hidden="true"` on the hidden view's elements.

- **M-3: Wireframe deviation — mobile layout style**
  The wireframe (SCR-009) at 375px shows a **table layout** (with truncated columns), while the implementation shows a **card-based layout**. This is actually a UX improvement that aligns with designsystem.md specification ("Mobile: Card-based layout — each row becomes a card"), but deviates from the wireframe.
  - **Impact**: Positive deviation — card layout is more touch-friendly and appropriate for mobile. Documented for traceability.

### Nitpicks

- **Nit-1**: Checkbox filter inputs are 13px wide (the raw `<input>` element). While the parent `<label>` at 296×58px serves as the touch target, some accessibility auditing tools may flag the input itself. Consider using CSS to increase the checkbox hit area via `width: 44px; height: 44px`.

- **Nit-2**: The "More actions" three-dot button (`⋮`) could benefit from a slightly larger touch area. It currently meets the 44px minimum, but the visual affordance is small. Consider making the dot icon area more visually prominent.

- **Nit-3**: The `touch-interactions.css` file includes a comment referencing `form-responsive.css` ("Complements form-responsive.css") but no `@import` or explicit dependency link. This is a documentation-only observation.

## Testing Coverage

### Tested Successfully
- [x] Desktop viewport (1440px) — queue table view with sidebar navigation
- [x] Tablet viewport (768px) — responsive table with bottom navigation and hamburger menu
- [x] Mobile viewport (375px) — card-based layout with SwipeableRow wrapping each card
- [x] SwipeableRow DOM structure verified — 3 swipeable rows with action panels
- [x] Touch target audit — 30 elements pass ≥44px, 5 checkbox inputs technically small but wrapped by large labels
- [x] Keyboard navigation — Tab order functional, 2px blue focus outline visible
- [x] ARIA attributes — all buttons labeled, `aria-live="polite"` on queue table, `role="status"` on status badges
- [x] Skip link present — "Skip to main content" anchor
- [x] Semantic HTML — `<main>`, `<nav>`, `<article>`, `<header>`, heading hierarchy H1→H2
- [x] 200% zoom — no horizontal scroll, layout adapts to mobile breakpoint
- [x] Animation — spring-back transition (250ms cubic-bezier), `will-change: transform`, GPU-accelerated
- [x] `prefers-reduced-motion` — transitions disabled when motion preference is set
- [x] `touch-action: manipulation` on `<html>` — 300ms tap delay eliminated
- [x] Console errors — 2 errors (backend 500s, not task-related), 3 WebSocket warnings (backend offline)
- [x] SwipeableRow disabled for non-scheduled appointments and during update operations

### Metrics
- **Viewports tested**: Desktop (1440px), Tablet (768px), Mobile (375px)
- **Accessibility score**: Manual audit — 0 unlabeled buttons, 0 unlabeled inputs, ARIA live regions present, skip link exists, heading hierarchy valid
- **Console errors**: 2 (backend API 500s — not related to TASK_007)
- **Touch target violations**: 0 (effective touch target including labels)
- **Performance observations**: GPU-accelerated transforms, `will-change: transform` set appropriately, spring-back animation is 250ms

### Wireframe Comparison Summary

| Viewport | Wireframe Layout | Implementation Layout | Match | Notes |
|----------|-----------------|----------------------|-------|-------|
| Desktop (1440px) | Table with sidebar | Table with sidebar | Partial | Implementation has Search/Filter panel above table; wireframe shows "Add Walk-in" button (not present without data) |
| Tablet (768px) | Table with truncated columns | Table with hamburger + bottom nav | Partial | Bottom nav added; sidebar collapsed to hamburger — improvement |
| Mobile (375px) | Table with truncated columns | Card-based layout with SwipeableRow | Deviation | Positive deviation — cards are more touch-friendly per designsystem.md |

### UXR Requirements Validation

| UXR-ID | Requirement | Status | Evidence |
|--------|-------------|--------|----------|
| UXR-201 | Mobile-first responsive design | PASS | Card layout at 375px, touch targets ≥44px, bottom navigation |
| UXR-402 | Touch targets ≥44px | PASS | 30/30 visible interactive elements meet minimum; checkboxes have label wrappers at 296×58px |
| UXR-403 | Real-time queue updates | PARTIAL | WebSocket hook present (`useWebSocket.ts`), `aria-live="polite"` on table; backend offline during test |
| UXR-101 | WCAG 2.2 AA compliance | PASS | Focus visible (2px blue outline), semantic HTML, ARIA labels, skip link, heading hierarchy |
| UXR-103 | Keyboard navigation | PASS | All interactive elements focusable, logical tab order |
| UXR-301 | Design token usage | PARTIAL | One hardcoded hex `#16a34a` found in touch-interactions.css:89; all other values use CSS variables |

### State Coverage

| State | Tested | Notes |
|-------|--------|-------|
| Default | Yes | Queue loads with 3 scheduled appointments |
| Loading | N/A | Backend data loaded quickly; loading skeleton not visible in test |
| Empty | N/A | Could not trigger empty state in current test session |
| Error | Yes | "Failed to load queue data" shown when backend returns 500 |
| Real-time Updates | N/A | WebSocket backend offline during test; connection status indicator shows "Live — Real-time" |

## Recommendations

1. **Add swipe gesture discoverability**: Implement a first-use animation or subtle visual cue (e.g., arrow icons on card edges, one-time peek animation) so staff users can discover the swipe gestures without external training.

2. **Confirm destructive swipe**: Add a confirmation step for the No-Show swipe direction (right swipe), either via a bottom sheet confirmation dialog or a prominently displayed undo toast (5+ second duration, accessible via keyboard), to prevent accidental patient status changes.
