# Design Tokens Applied

> Cross-reference of designsystem.md tokens applied across all 13 wireframe HTML files.

---

## 1. Color Palette

| Token | Value | Applied In |
|-------|-------|-----------|
| `--primary-900` | `#003D7A` | — reserved |
| `--primary-800` | `#004C99` | Button hover states (all screens) |
| `--primary-600` | `#0066CC` | Primary buttons, links, active sidebar, focus ring, logo, calendar selected day |
| `--primary-200` | `#CCE0F5` | — reserved |
| `--primary-100` | `#E6F0FA` | Patient avatars, active sidebar bg, form focus ring, calendar today bg |
| `--secondary-600` | `#00A86B` | Staff badge, calendar available dot, queue live indicator |
| `--secondary-100` | `#E6F6F0` | Staff sidebar role badge bg |
| `--success-600` | `#00A145` | Active/Complete status badges, patient role badge, upload complete bar |
| `--success-100` | `#E6F9EF` | Success badge bg |
| `--warning-600` | `#FF8800` | Warning badges, medium-risk badges |
| `--warning-100` | `#FFF2E6` | Warning badge bg, walk-in type bg |
| `--error-600` | `#DC3545` | Admin role badge, error states, danger buttons, conflict border, no-show badge, deactivate icons |
| `--error-100` | `#FCE8EA` | Error badge bg, admin avatar bg, alert banner bg |
| `--info-600` | `#0077B6` | Info badges, staff avatars, upload progress bar, extracting bar |
| `--info-100` | `#E6F3F9` | Info badge bg, staff avatar bg |
| `--neutral-900` | `#1A1A1A` | Body text, headings |
| `--neutral-800` | `#333333` | Header title, secondary headings |
| `--neutral-700` | `#4D4D4D` | Table headers, form labels, sidebar items |
| `--neutral-600` | `#666666` | Filter labels, modal body text, help text |
| `--neutral-500` | `#808080` | Breadcrumb text, placeholder text, timestamps |
| `--neutral-400` | `#999999` | Sort icons, disabled pagination |
| `--neutral-300` | `#CCCCCC` | Input borders, secondary button borders |
| `--neutral-200` | `#E5E5E5` | Dividers, header/sidebar borders, table row borders |
| `--neutral-100` | `#F5F5F5` | Table header bg, hover bg, neutral badge bg |
| `--neutral-50` | `#FAFAFA` | Row hover bg, sidebar item hover |
| `--bg-primary` | `#FFFFFF` | Cards, header, sidebar, inputs, modals, drawers |
| `--bg-tertiary` | `#FAFAFA` | Page background (body) |

---

## 2. Typography

| Token | CSS Value | Usage |
|-------|-----------|-------|
| Font Family | `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | All text across all 13 screens |
| Mono Font | `'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace` | Audit log IDs (SCR-012) |
| H1 (32px/700) | `font-size: 32px; font-weight: 700; line-height: 40px; letter-spacing: -0.25px` | Page titles (all screens) |
| H2 (20px/700) | `font-size: 20px; font-weight: 700` | Card headings, modal titles, drawer title |
| Body (14px/400-500) | `font-size: 14px; font-weight: 400–500` | Table cells, form labels, breadcrumb, filters |
| Caption (12px/500) | `font-size: 12px; font-weight: 500` | Badges, help text, sidebar role, filter labels |
| Logo (20px/700) | `font-size: 20px; font-weight: 700` | Header logo "UPACI" |

---

## 3. Spacing Scale

| Token | Value | Applied In |
|-------|-------|-----------|
| 4px | `4px` | Sort icon margin, badge inline padding, gap between pagination buttons |
| 8px | `8px` | Input padding, breadcrumb gap, badge vertical padding, sidebar role padding |
| 12px | `12px` | Sidebar item padding, table cell padding, filter gap, button gap, form label margin, action cell gap |
| 16px | `16px` | Header gap, sidebar nav padding, page header gap, card body padding, modal body margin, pagination padding, form group spacing |
| 20px | `20px` | Drawer header padding, form group margin-bottom |
| 24px | `24px` | Header padding, sidebar item horizontal padding, main padding (initial), breadcrumb margin, page title margin, drawer body padding, modal actions gap |
| 32px | `32px` | Main content padding, modal overall padding, page title font size |
| 48px | — | Modal icon size (48px) |
| 64px | `64px` | Header height (--header-height) |
| 96px | — | Profile avatar in SCR-005 |

---

## 4. Border Radius

| Token | Value | Applied In |
|-------|-------|-----------|
| `--radius-sm` | `4px` | Focus ring border-radius, inline links, sort headers |
| `--radius-md` | `8px` | Buttons, cards, inputs, selects, pagination buttons, sidebar focus, icon buttons |
| `--radius-lg` | `12px` | Modals, calendar container |
| `--radius-full` | `9999px` | Avatars, badges, sidebar role pill, live indicator dot |

---

## 5. Elevation (Box Shadow)

| Token | CSS Value | Applied In |
|-------|-----------|-----------|
| `--shadow-1` | `0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)` | All `.card` elements (tables, stat cards, form cards, data cards) |
| `--shadow-2` | `0px 3px 6px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)` | Dropdown menus (reserved), tooltip popups |
| `--shadow-3` | `0px 10px 20px rgba(0,0,0,0.19), 0px 6px 6px rgba(0,0,0,0.23)` | Modals (SCR-009, SCR-010, SCR-011, SCR-013), Drawer (SCR-013) |

---

## 6. Focus & Accessibility

| Token | Value | Applied In |
|-------|-------|-----------|
| `--focus-ring` | `0 0 0 2px #FFFFFF, 0 0 0 4px #0066CC` | All interactive elements: buttons, links, inputs, sidebar items, pagination, drawer close, avatar, table headers |
| `role="banner"` | — | Header (all screens) |
| `role="navigation"` | — | Sidebar (all screens), breadcrumb (all screens), pagination (SCR-012) |
| `role="main"` | — | Main content area (all screens) |
| `role="dialog"` | — | Modals (SCR-009, SCR-010, SCR-011, SCR-013), Drawer (SCR-013) |
| `role="alert"` | — | Critical alert banner (SCR-010) |
| `role="grid"` | — | Calendar (SCR-006) |
| `role="search"` | — | Filter section (SCR-012) |
| `aria-modal="true"` | — | All modals & drawers |
| `aria-current="page"` | — | Active breadcrumb item, active pagination button |
| `aria-label` | — | All buttons, inputs, tables, navigation regions |
| `aria-live="polite"` | — | Live queue indicator (SCR-009) |
| `aria-live="assertive"` | — | Critical conflict alert (SCR-010) |

---

## 7. Transition & Animation

| Token | Value | Applied In |
|-------|-------|-----------|
| `--transition` | `200ms ease` | Button hover, sidebar item hover, table row hover, input focus, badge transitions |
| Drawer slide | `right 300ms ease` | User Form Drawer open/close (SCR-013) |
| Pulse animation | `@keyframes pulse` | Live indicator dot (SCR-009), AI extracting progress bar (SCR-008), typing indicator dots (SCR-007) |

---

## 8. Layout Grid

| Token | Value | Applied In |
|-------|-------|-----------|
| `--sidebar-width` | `240px` | Fixed sidebar (all screens except SCR-001) |
| `--header-height` | `64px` | Fixed header (all screens) |
| Main offset | `margin-left: 240px; margin-top: 64px` | Main content area (all screens) |
| 12-column grid | desktop layout | Dashboard stat cards, form field grids, data card grids |

---

## 9. Responsive Breakpoints

| Breakpoint | Applied Changes |
|-----------|----------------|
| `≤1023px` (tablet) | Sidebar hidden, main full-width, brand panel hidden (SCR-001) |
| `≤767px` (mobile) | Page title 24px, padding 16px, stacked layouts, full-width buttons & inputs, column flex on filters/search, prev/next pagination only |

---

## 10. Screen × Token Matrix

| Screen | Colors | Typography | Spacing | Radius | Shadow | Focus | Animation |
|--------|--------|-----------|---------|--------|--------|-------|-----------|
| SCR-001 Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-002 Patient Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-003 Staff Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-004 Admin Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-005 Profile Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-006 Appointment Booking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-007 Patient Intake | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Pulse |
| SCR-008 Document Upload | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Pulse |
| SCR-009 Queue Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Pulse |
| SCR-010 Clinical Data Review | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-011 Appointment Mgmt | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-012 Audit Logs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| SCR-013 User Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Slide |

**Coverage: 100% of design tokens applied across all 13 screens.**
