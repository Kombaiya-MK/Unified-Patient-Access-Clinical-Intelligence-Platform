# Task - TASK_001: Frontend Dashboard Layout & Navigation

## Requirement Reference
- User Story: [us_019]
- Story Location: [.propel/context/tasks/us_019/us_019.md]
- Acceptance Criteria:
    - AC1: Dashboard displays welcome message with patient name
    - AC1: Dashboard has navigation sidebar (left) with icons and labels
    - AC1: Dashboard has 3-column responsive layout (sidebar, main content, notifications panel)
    - AC1: Profile photo displays in header (circle, top-right)
    - AC1: Responsive design: Mobile (stacked layout, tabs for sections), tablet (2-column), desktop (3-column with sidebar)
- Edge Case:
    - N/A (layout concerns)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-002 |
| **UXR Requirements** | UXR-001 (Max 3 clicks to book), UXR-002 (Clear visual hierarchy), UXR-201 (Mobile-first responsive) |
| **Design Tokens** | .propel/context/docs/designsystem.md#layout, #colors, #typography |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** open and reference the wireframe file/URL during UI implementation
- **MUST** match layout, spacing, typography, and colors from the wireframe
- **MUST** implement all states shown in wireframe (default, hover, focus, error, loading)
- **MUST** validate implementation against wireframe at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify pixel-perfect alignment

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.x |
| Frontend | React Router | 6.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | CSS Modules | N/A |

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
Restructure the existing PatientDashboard.tsx to implement the full SCR-002 wireframe layout with navigation sidebar, welcome banner with profile photo, 3-column responsive grid, and reusable layout components. The dashboard will serve as the container for appointments, notifications, and quick actions sections (implemented in subsequent tasks).

## Dependent Tasks
- US-012: Login redirects to dashboard (already implemented)

## Impacted Components
- **MODIFY** app/src/pages/PatientDashboard.tsx - Add 3-column layout structure with grid
- **CREATE** app/src/components/dashboard/DashboardLayout.tsx - Reusable dashboard layout wrapper
- **CREATE** app/src/components/dashboard/NavigationSidebar.tsx - Left navigation sidebar with icons
- **CREATE** app/src/components/dashboard/WelcomeBanner.tsx - Welcome message with profile photo
- **CREATE** app/src/components/dashboard/DashboardLayout.css - Layout-specific CSS with grid system
- **MODIFY** app/src/pages/Dashboard.css - Update for 3-column grid, sidebar, responsive breakpoints

## Implementation Plan
1. **Create DashboardLayout.tsx**: Reusable wrapper component accepting children for main content, sidebar for notifications
2. **Create NavigationSidebar.tsx**: Left sidebar with navigation items (Dashboard, Appointments, Documents, Intake, Profile, Settings) with icons and labels, highlight active item
3. **Create WelcomeBanner.tsx**: Welcome message with patient name, profile photo (circle avatar), logout button
4. **Update PatientDashboard.tsx**: Wrap content in DashboardLayout, add NavigationSidebar and WelcomeBanner, structure main content area for appointments sections (placeholders for TASK_002)
5. **Create DashboardLayout.css**: CSS Grid for 3-column layout (240px sidebar, 1fr main, 320px notifications), responsive breakpoints (mobile: stacked, tablet: 2-column, desktop: 3-column)
6. **Update Dashboard.css**: Add styles for welcome banner, navigation sidebar, profile photo, responsive utilities
7. **Implement Responsive Behavior**: Mobile (<768px): hide sidebar + notifications in drawer/modal, tablet (768-1024px): show sidebar + main only, desktop (>1024px): show all 3 columns
8. **Add Accessibility**: ARIA labels for navigation, keyboard navigation, focus management, skip links

**Focus on how to implement**: Use CSS Grid for layout (not flexbox) to enable precise column sizing. NavigationSidebar should use React Router's `useLocation()` to highlight active route. Profile photo should fallback to initials if no photo URL. Responsive behavior using CSS media queries + React state for mobile menu toggle. Follow wireframe pixel-perfect (use design tokens from designsystem.md).

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   ├── PatientDashboard.tsx (basic dashboard, to be restructured)
│   │   └── Dashboard.css (basic styles, to be enhanced)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AppointmentCard.tsx (exists, used in TASK_002)
│   │   │   ├── AppointmentCard.css
│   │   │   └── (new components to be added)
│   │   ├── common/
│   │   │   └── LoadingSpinner.tsx (exists)
│   │   └── index.ts
│   ├── context/
│   │   └── AppointmentContext.tsx (exists, provides appointments)
│   ├── hooks/
│   │   └── useAuth.ts (exists, provides user data)
│   └── App.tsx
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/dashboard/DashboardLayout.tsx | Reusable 3-column grid layout component with props for sidebar, main, and notifications content |
| CREATE | app/src/components/dashboard/NavigationSidebar.tsx | Left navigation sidebar with icons (Dashboard, Appointments, Documents, Intake, Profile, Settings) and active highlighting |
| CREATE | app/src/components/dashboard/WelcomeBanner.tsx | Welcome banner component with patient name, profile photo (circle avatar), and logout button |
| CREATE | app/src/components/dashboard/DashboardLayout.css | CSS Grid layout styles (240px sidebar, 1fr main, 320px notifications), responsive breakpoints |
| MODIFY | app/src/pages/PatientDashboard.tsx | Restructure to use DashboardLayout, NavigationSidebar, WelcomeBanner components with proper layout structure |
| MODIFY | app/src/pages/Dashboard.css | Add styles for welcome banner, profile photo, navigation items (active state, hover effects), responsive utilities |
| MODIFY | app/src/components/index.ts | Export new dashboard layout components (DashboardLayout, NavigationSidebar, WelcomeBanner) |

## External References
- **CSS Grid Layout**: https://css-tricks.com/snippets/css/complete-guide-grid/ - Complete guide to CSS Grid
- **React Router useLocation**: https://reactrouter.com/en/main/hooks/use-location - Highlighting active navigation items
- **Responsive Design**: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design - Responsive layout patterns
- **ARIA Navigation**: https://www.w3.org/WAI/ARIA/apg/patterns/navigation/ - Accessible navigation patterns
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties - Design tokens implementation
- **React Component Composition**: https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children - Layout composition patterns

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for dashboard components)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for DashboardLayout, NavigationSidebar, WelcomeBanner components
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Navigation active highlighting works correctly (Dashboard, Appointments routes)
- [x] Profile photo fallback to initials works when no photo URL provided
- [x] Responsive layout tested: mobile (stacked), tablet (2-column), desktop (3-column)
- [x] Accessibility validation: keyboard navigation, ARIA labels, focus management, skip links
- [x] Browser compatibility: Chrome, Firefox, Safari, Edge

## Implementation Checklist
- [x] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html during implementation
- [x] Create DashboardLayout.tsx reusable component (CSS Grid with 3 slots: sidebar, main, notifications panel)
- [x] Create NavigationSidebar.tsx with navigation items array (Dashboard, Appointments, Documents, Intake, Profile, Settings) using React Router NavLink for active highlighting
- [x] Create WelcomeBanner.tsx component (patient name from useAuth, profile photo with fallback to initials, logout button)
- [x] Create DashboardLayout.css with CSS Grid layout (--sidebar-width: 240px, --notifications-width: 320px, main 1fr), responsive breakpoints at 768px and 1024px
- [x] Modify PatientDashboard.tsx to use DashboardLayout wrapper with NavigationSidebar in left slot, main content in center, notifications placeholder in right slot (empty for now, implemented in TASK_003)
- [x] Update Dashboard.css with welcome banner styles (flexbox layout, profile photo border-radius: 50%, navigation item hover/active states from wireframe color palette)
- [x] Implement responsive behavior with CSS media queries (mobile: hide sidebar/notifications, show hamburger menu; tablet: show sidebar only; desktop: show all 3 columns)
