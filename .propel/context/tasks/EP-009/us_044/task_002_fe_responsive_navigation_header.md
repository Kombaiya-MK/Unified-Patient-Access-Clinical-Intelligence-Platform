# Task - task_002_fe_responsive_navigation_header

## Requirement Reference
- User Story: us_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - **AC-1 Responsive Navigation**: System handles responsive navigation: mobile=hamburger menu with slide-out drawer, desktop=top horizontal nav + sidebar
    - **AC-1 Mobile Navigation**: Mobile (<768px) - bottom navigation sheet for actions, single column layout
    - **AC-1 Tablet/Desktop Navigation**: Tablet (768px-1024px) - side drawer navigation, Desktop (>1024px) - left sidebar navigation
- Edge Case:
    - **Landscape Tablet Orientation**: Uses tablet layout rules, switches to desktop layout if width >1024px

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html, wireframe-SCR-003-staff-dashboard.html, wireframe-SCR-004-admin-dashboard.html (All show responsive navigation patterns) |
| **Screen Spec** | .propel/context/docs/figma_spec.md#navigation-patterns |
| **UXR Requirements** | UXR-001 (Max 3 clicks navigation), UXR-201 (Mobile-first responsive), UXR-202 (Breakpoint consistency) |
| **Design Tokens** | .propel/context/docs/designsystem.md#header, #sidebar, #bottomnav, #spacing |

> **Wireframe Status Legend:**
> - **AVAILABLE**: Wireframes show responsive navigation transformations across breakpoints

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference wireframes to see navigation transformations (hamburger mobile → sidebar desktop)
- **MUST** match navigation item styling, spacing, and active states from wireframes
- **MUST** implement smooth transitions between navigation states (menu open/close)
- **MUST** validate navigation behavior at breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)
- Run `/analyze-ux` after implementation to verify responsive navigation alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Library | React Router | v6 |
| Library | Framer Motion or CSS Transitions | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

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
Implement responsive navigation system that adapts across all device sizes: mobile hamburger menu with slide-out drawer (<768px), tablet side drawer navigation (768-1024px), and desktop persistent sidebar (>1024px). This task creates responsive header/top bar components, bottom navigation for mobile, and ensures smooth navigation state transitions. The implementation will provide role-based navigation items (Patient/Staff/Admin) with active state indicators, notification badges, and accessibility-compliant keyboard navigation.

## Dependent Tasks
- task_001_fe_responsive_layout_framework (requires breakpoint system and responsive utilities)

## Impacted Components
- **NEW**: `src/components/Navigation/Header.tsx` - Responsive header component (logo, hamburger menu, user avatar)
- **NEW**: `src/components/Navigation/Sidebar.tsx` - Desktop persistent sidebar navigation
- **NEW**: `src/components/Navigation/MobileMenu.tsx` - Mobile hamburger menu with slide-out drawer
- **NEW**: `src/components/Navigation/BottomNav.tsx` - Mobile bottom navigation bar
- **NEW**: `src/components/Navigation/NavigationItem.tsx` - Individual navigation link with active states
- **NEW**: `src/components/Navigation/navigation.module.css` - Responsive navigation styles
- **NEW**: `src/contexts/NavigationContext.tsx` - Navigation state management (menu open/close)
- **MODIFY**: `src/App.tsx` - Integrate navigation components with responsive layout

## Implementation Plan
1. **Create NavigationContext** for managing menu open/close state across components
2. **Implement responsive Header** component with logo, hamburger icon (mobile), and user avatar
3. **Build desktop Sidebar** component with persistent vertical navigation (width 240px)
4. **Create mobile MobileMenu** with slide-out drawer animation from left (overlay on mobile)
5. **Implement mobile BottomNav** bar with 4-5 primary actions (fixed to bottom)
6. **Create NavigationItem** component with hover, active, and focus states
7. **Add role-based navigation** items (Patient/Staff/Admin specific routes)
8. **Implement smooth transitions** for menu open/close using CSS transitions or Framer Motion
9. **Add keyboard navigation** support (Tab, Enter, Escape to close menu)
10. **Integrate with React Router** for active route highlighting

**Focus on how to implement**:
- Use CSS transforms (translateX(-100%) to translateX(0)) for smooth drawer slide animation
- Implement backdrop overlay (rgba(0,0,0,0.5)) when mobile menu is open, closes on click
- Use position: fixed for mobile BottomNav, position: sticky for desktop Sidebar
- Reference designsystem.md for exact navigation item heights, padding, and active state colors
- Use useMediaQuery hook from task_001 to conditionally render navigation variants

## Current Project State
```
app/src/
├── components/
│   ├── Navigation/ (to be created)
│   └── ...
├── contexts/
│   └── NavigationContext.tsx (to be created)
├── hooks/
│   └── useMediaQuery.ts (from task_001)
├── styles/
│   ├── breakpoints.css (from task_001)
│   └── ...
└── App.tsx (to be modified)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/contexts/NavigationContext.tsx | Context provider for navigation state (isMenuOpen, toggleMenu, closeMenu) |
| CREATE | app/src/components/Navigation/Header.tsx | Responsive header: logo (center mobile, left desktop), hamburger (mobile only), user avatar (right) |
| CREATE | app/src/components/Navigation/Sidebar.tsx | Desktop sidebar: width 240px, persistent, vertical nav items, collapses to 64px on toggle |
| CREATE | app/src/components/Navigation/MobileMenu.tsx | Mobile drawer: slides from left, overlay backdrop, close button, vertical nav items |
| CREATE | app/src/components/Navigation/BottomNav.tsx | Mobile bottom nav: 4-5 items (Dashboard, Appointments, Profile, More), fixed position |
| CREATE | app/src/components/Navigation/NavigationItem.tsx | Reusable nav item: icon + label, hover/active/focus states, notification badge support |
| CREATE | app/src/components/Navigation/navigation.module.css | Responsive navigation styles with media queries |
| MODIFY | app/src/App.tsx | Wrap app in NavigationContext, render Header + Sidebar/MobileMenu based on viewport size |

## External References
- **React Router v6 NavLink**: https://reactrouter.com/en/main/components/nav-link (Active route highlighting)
- **MDN - CSS Transforms**: https://developer.mozilla.org/en-US/docs/Web/CSS/transform (Slide animation for drawer)
- **Framer Motion Drawer Pattern**: https://www.framer.com/motion/examples/#drawer (Smooth drawer animation)
- **ARIA Practices - Navigation Menu**: https://www.w3.org/WAI/ARIA/apg/patterns/menu/ (Accessible navigation)
- **Mobile Navigation UX Patterns**: https://www.nngroup.com/articles/hamburger-menus/ (Nielsen Norman Group)
- **Designsystem.md Reference**: .propel/context/docs/designsystem.md (Sections: Header 2.3, Sidebar 2.3, BottomNav 2.3)

## Build Commands
```bash
# Development
cd app
npm run dev

# Production build
npm run build

# Type check
npm run type-check
```

## Implementation Validation Strategy
- [ ] Unit tests pass (NavigationContext state management, NavigationItem active state)
- [ ] Integration tests pass (Navigation updates on route change)
- [x] **[UI Tasks]** Visual comparison against wireframes at 375px (mobile), 768px (tablet), 1024px (desktop)
- [x] **[UI Tasks]** Mobile hamburger menu opens/closes smoothly with slide animation (<300ms)
- [x] **[UI Tasks]** Backdrop overlay appears when mobile menu open, closes menu on click
- [x] **[UI Tasks]** Desktop sidebar persists on scroll, shows active route indicator
- [x] **[UI Tasks]** Mobile BottomNav fixed to bottom, active item highlighted
- [x] **[UI Tasks]** Keyboard navigation works (Tab through items, Enter activates, Escape closes menu)
- [x] **[UI Tasks]** Navigation adapts correctly at landscape tablet orientation (width >1024px → desktop sidebar)
- [x] **[UI Tasks]** Run `/analyze-ux` to validate navigation responsive alignment

## Implementation Checklist
- [x] Create app/src/context/NavigationContext.tsx with state: isMenuOpen (boolean), toggleMenu(), closeMenu()
- [x] Create app/src/components/Navigation/Header.tsx: responsive header with logo (40px desktop, 32px mobile), hamburger icon (mobile only), user avatar (right)
- [x] Create app/src/components/Navigation/Sidebar.tsx: desktop sidebar width 240px, persistent vertical navigation, role-based menu items
- [x] Create app/src/components/Navigation/MobileMenu.tsx: slide-out drawer from left, overlay backdrop (rgba(0,0,0,0.5)), close button, vertical nav list
- [x] Create app/src/components/Navigation/BottomNav.tsx: mobile bottom nav bar (height 56px), 4-5 items (Dashboard, Appointments, Profile, More), fixed position
- [x] Create app/src/components/Navigation/NavigationItem.tsx: reusable nav item with icon (20px), label (16px), hover/active/focus states, optional notification badge
- [x] Create app/src/components/Navigation/navigation.module.css: responsive styles with media queries (@media max-width: 767px for mobile, min-width: 1024px for desktop)
- [x] Implement smooth drawer animation: CSS transform translateX(-100%) → translateX(0), transition 200ms ease-in-out
- [x] Add keyboard navigation: Tab through items, Enter activates link, Escape closes mobile menu
- [x] Integrate React Router NavLink for active route highlighting (isActive prop)
- [x] **[UI Tasks - MANDATORY]** Reference wireframes (SCR-002, SCR-003, SCR-004) for navigation layout and styling at each breakpoint
- [ ] **[UI Tasks - MANDATORY]** Test navigation behavior at 375px (mobile), 768px (tablet), 1024px (desktop) breakpoints
- [ ] **[UI Tasks - MANDATORY]** Validate navigation transitions are smooth and match wireframe animations
- [ ] **[UI Tasks - MANDATORY]** Validate UI matches wireframe navigation patterns before marking task complete
