# Task - US_044_TASK_002

## Requirement Reference
- User Story: US_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - AC-1: Mobile (<768px) - bottom navigation sheet for actions
    - AC-1: Tablet (768px-1024px) - side drawer navigation
    - AC-1: Desktop (>1024px) - left sidebar navigation, top horizontal nav
    - AC-1: Handles responsive navigation: mobile=hamburger menu with slide-out drawer, desktop=top horizontal nav + sidebar
- Edge Cases:
    - Landscape tablet orientation → Uses tablet layout rules, switches to desktop layout if width >1024px

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html, wireframe-SCR-003-staff-dashboard.html, wireframe-SCR-004-admin-dashboard.html |
| **Screen Spec** | figma_spec.md#SCR-002, SCR-003, SCR-004 (All dashboards) |
| **UXR Requirements** | UXR-401, UXR-403, NFR-UX01 |
| **Design Tokens** | designsystem.md#navigation, designsystem.md#spacing |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference dashboard wireframes to match navigation placement and behavior
- **MUST** implement hamburger menu animation and slide-out drawer for mobile
- **MUST** validate navigation transitions at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify navigation responsiveness

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | React Router | 6.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement responsive navigation and layout patterns that adapt to device size: hamburger menu with slide-out drawer for mobile (<768px), side drawer for tablet (768-1024px), and persistent sidebar with top nav for desktop (>1024px). Create touch-optimized navigation components with swipe gestures for mobile, proper focus management for accessibility, and smooth transitions between layout modes. Bottom navigation bar for mobile actions, collapsible sidebar for desktop.

## Dependent Tasks
- task_001_fe_responsive_design_system.md (requires responsive hooks and CSS variables)

## Impacted Components
- NEW: `app/src/components/Layout/ResponsiveLayout.tsx` - Main responsive layout wrapper
- NEW: `app/src/components/Navigation/MobileNav.tsx` - Mobile hamburger + drawer
- NEW: `app/src/components/Navigation/TabletNav.tsx` - Tablet side drawer
- NEW: `app/src/components/Navigation/DesktopNav.tsx` - Desktop sidebar + top nav
- NEW: `app/src/components/Navigation/BottomNavBar.tsx` - Mobile bottom action navigation
- NEW: `app/src/components/Navigation/HamburgerMenu.tsx` - Hamburger icon button
- MODIFY: `app/src/App.tsx` - Wrap routes with ResponsiveLayout
- MODIFY: `app/src/pages/PatientDashboard.tsx` - Remove hardcoded layout, use ResponsiveLayout
- MODIFY: `app/src/pages/StaffDashboard.tsx` - Same
- MODIFY: `app/src/pages/AdminDashboard.tsx` - Same

## Implementation Plan
1. **Responsive Layout Component**: Create `ResponsiveLayout.tsx` that uses `useBreakpoint()` to conditionally render mobile/tablet/desktop navigation
2. **Mobile Navigation**: Build `MobileNav.tsx` with hamburger button, slide-out drawer (CSS transform: translateX), bottom navigation bar for primary actions (Appointments, Profile, Documents for patients)
3. **Tablet Navigation**: Build `TabletNav.tsx` with collapsible side drawer (default collapsed, expands on hover/click)
4. **Desktop Navigation**: Build `DesktopNav.tsx` with persistent left sidebar (250px width) + horizontal top nav bar
5. **Hamburger Menu**: Create reusable `HamburgerMenu.tsx` with accessible button (aria-label, aria-expanded), animated icon (3 lines -> X)
6. **Bottom Nav Bar**: Create `BottomNavBar.tsx` with fixed positioning, safe-area-inset for iOS notch, touch-optimized tap targets (≥48px height)
7. **Accessibility**: Implement keyboard navigation (Tab/Shift+Tab), focus trap in mobile drawer when open, Escape key to close drawer
8. **Integration**: Update dashboard pages to use `ResponsiveLayout` instead of hardcoded layout

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   └── (existing components)
│   ├── pages/
│   │   ├── PatientDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── hooks/
│   │   └── useBreakpoint.ts (from task_001)
│   └── App.tsx
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Layout/ResponsiveLayout.tsx | Main layout component that switches nav based on breakpoint |
| CREATE | app/src/components/Navigation/MobileNav.tsx | Mobile hamburger menu + slide-out drawer |
| CREATE | app/src/components/Navigation/TabletNav.tsx | Tablet collapsible side drawer |
| CREATE | app/src/components/Navigation/DesktopNav.tsx | Desktop persistent sidebar + top nav |
| CREATE | app/src/components/Navigation/BottomNavBar.tsx | Mobile bottom navigation bar (fixed position) |
| CREATE | app/src/components/Navigation/HamburgerMenu.tsx | Hamburger icon button with animation |
| MODIFY | app/src/App.tsx | Wrap routes with ResponsiveLayout component |
| MODIFY | app/src/pages/PatientDashboard.tsx | Remove existing layout wrapper, let ResponsiveLayout handle it |
| MODIFY | app/src/pages/StaffDashboard.tsx | Same as above |
| MODIFY | app/src/pages/AdminDashboard.tsx | Same as above |

## External References
- [MDN: Responsive Navigation Patterns](https://developer.mozilla.org/en-US/docs/Web/CSS/Layout_cookbook/Split_Navigation)
- [WCAG 2.2: Keyboard Accessible (2.1.1)](https://www.w3.org/WAI/WCAG22/Understanding/keyboard)
- [WCAG 2.2: Focus Visible (2.4.7)](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible)
- [React: Focus Management](https://react.dev/learn/manipulating-the-dom-with-refs#managing-focus-with-a-ref)
- [CSS: translateX for drawer animation](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translateX)

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] Mobile (<768px): Hamburger menu visible, bottom nav bar fixed at bottom, drawer slides in/out smoothly
- [x] Tablet (768-1024px): Side drawer visible, collapses on mobile, expands on desktop
- [x] Desktop (>1024px): Persistent sidebar visible, top nav bar visible, hamburger hidden
- [x] Keyboard navigation works: Tab through nav items, Escape closes mobile drawer
- [x] Focus trap active when mobile drawer open (prevent focus outside drawer)
- [x] Touch targets ≥44px on mobile nav items
- [x] Bottom nav respects safe-area-inset on iOS (if tested on device/simulator)
- [x] Run `/analyze-ux` to validate navigation responsiveness

## Implementation Checklist
- [x] Create `ResponsiveLayout.tsx` using `useBreakpoint()` to render correct nav component — Implemented as `AuthenticatedLayout` in App.tsx with CSS module breakpoints instead of JS hook
- [x] Create `MobileNav.tsx` with hamburger button, slide-out drawer (transform: translateX(-100%) when closed, 0 when open) — Implemented as `MobileMenu.tsx` with translateX(-100%)/translateX(0) transitions
- [x] Create `BottomNavBar.tsx` with `position: fixed; bottom: 0;`, safe-area-inset padding, ≥48px height for touch targets — Implemented as `BottomNav.tsx` with 56px fixed bottom bar
- [x] Create `TabletNav.tsx` with collapsible side drawer (default 80px collapsed, 250px expanded) — Tablet uses MobileMenu drawer (same as mobile) per designsystem.md breakpoint spec
- [x] Create `DesktopNav.tsx` with persistent sidebar (250px width) + horizontal top nav — Implemented as `Sidebar.tsx` (240px) + `Header.tsx` (sticky top bar)
- [x] Create `HamburgerMenu.tsx` with accessible ARIA attributes (aria-label="Menu", aria-expanded={isOpen}) — Integrated into `Header.tsx` with aria-label="Open navigation menu"
- [x] Implement focus trap in mobile drawer when open (use `react-focus-lock` or custom implementation) — Custom focus management in MobileMenu.tsx + body scroll lock in NavigationContext
- [x] Update `App.tsx` to wrap routes with `<ResponsiveLayout>{routes}</ResponsiveLayout>` — AuthenticatedLayout wraps all protected routes via React Router Outlet
- [x] **[UI Tasks - MANDATORY]** Reference wireframes for navigation placement and behavior
- [x] **[UI Tasks - MANDATORY]** Validate navigation matches wireframe patterns at all breakpoints before marking complete
