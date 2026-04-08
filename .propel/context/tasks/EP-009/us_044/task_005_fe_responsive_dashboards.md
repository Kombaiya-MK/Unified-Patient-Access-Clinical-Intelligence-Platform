# Task - US_044_TASK_005

## Requirement Reference
- User Story: US_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - AC-1: Mobile (<768px) - single column layout, bottom navigation sheet for actions, cards stacked single-column, FAB for primary actions
    - AC-1: Tablet (768px-1024px) - two-column layout where appropriate, side drawer navigation
    - AC-1: Desktop (1025px-1440px) - three-column layout for dashboards, left sidebar navigation
    - AC-1: Large Desktop (>1440px) - max content width 1600px centered with padding
- Edge Cases:
    - Complex dashboards on mobile → Tabbed interface with scrollable sections, option to rotate to landscape

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html, wireframe-SCR-003-staff-dashboard.html, wireframe-SCR-004-admin-dashboard.html |
| **Screen Spec** | figma_spec.md#SCR-002, SCR-003, SCR-004 |
| **UXR Requirements** | UXR-401, NFR-UX01, UXR-002 |
| **Design Tokens** | designsystem.md#layout, designsystem.md#grid |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference dashboard wireframes to match column layouts at each breakpoint
- **MUST** implement single-column (mobile), two-column (tablet), three-column (desktop) layouts
- **MUST** validate dashboard layouts at breakpoints: 375px, 768px, 1024px, 1440px, 1920px
- Run `/analyze-ux` after implementation to verify dashboard responsiveness

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |

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
Implement responsive dashboard layouts for Patient, Staff, and Admin dashboards with adaptive column grids: single-column on mobile (<768px), two-column on tablet (768-1024px), three-column on desktop (1025-1440px), and max-width 1600px centered on large screens (>1440px). Create dashboard widget components that reflow based on screen size, implement tabbed navigation for mobile to reduce scrolling, and add FAB (Floating Action Button) for primary actions on mobile. Implement CSS Grid for flexible dashboard layouts.

## Dependent Tasks
- task_001_fe_responsive_design_system.md (requires responsive hooks and CSS variables)
- task_002_fe_responsive_navigation_layout.md (requires ResponsiveLayout)

## Impacted Components
- NEW: `app/src/components/Dashboard/DashboardGrid.tsx` - Responsive CSS Grid layout
- NEW: `app/src/components/Dashboard/DashboardWidget.tsx` - Reusable dashboard card component
- NEW: `app/src/components/Dashboard/ResponsiveTabs.tsx` - Tabbed interface for mobile dashboards
- NEW: `app/src/components/Dashboard/FAB.tsx` - Floating Action Button for mobile
- MODIFY: `app/src/pages/PatientDashboard.tsx` - Implement responsive grid layout
- MODIFY: `app/src/pages/StaffDashboard.tsx` - Implement responsive grid layout
- MODIFY: `app/src/pages/AdminDashboard.tsx` - Implement responsive grid layout

## Implementation Plan
1. **Dashboard Grid Component**: Create `DashboardGrid.tsx` using CSS Grid with responsive columns: `grid-template-columns: 1fr` (mobile), `repeat(2, 1fr)` (tablet), `repeat(3, 1fr)` (desktop), max-width 1600px with auto margins for large screens
2. **Dashboard Widget**: Create reusable `DashboardWidget.tsx` card component (header, content, optional footer), configurable grid-column-span for flexible layouts
3. **Responsive Tabs**: Create `ResponsiveTabs.tsx` for mobile to organize dashboard sections (Appointments, Documents, Profile for patients; Queue, Appointments, Reports for staff)
4. **FAB Component**: Create `FAB.tsx` fixed-position button (bottom-right mobile, hidden on desktop), primary action button (e.g., "Book Appointment" for patients, "Add Patient" for staff)
5. **Max-Width Container**: Implement max-width 1600px for large desktop screens (>1440px) with centered content and side padding
6. **Dashboard Layouts**: Update Patient/Staff/Admin dashboards to use DashboardGrid, widgets reflow automatically based on breakpoint
7. **Accessibility**: Ensure tab navigation is keyboard-accessible, FAB has proper aria-label, focus management when tabs switch

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── ResponsiveLayout.tsx (from task_002)
│   │   └── (other components)
│   ├── pages/
│   │   ├── PatientDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── hooks/
│       └── useBreakpoint.ts (from task_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Dashboard/DashboardGrid.tsx | CSS Grid with responsive columns (1/2/3 col based on breakpoint) |
| CREATE | app/src/components/Dashboard/DashboardWidget.tsx | Reusable card component for dashboard widgets |
| CREATE | app/src/components/Dashboard/ResponsiveTabs.tsx | Tabbed interface for mobile dashboards |
| CREATE | app/src/components/Dashboard/FAB.tsx | Floating Action Button for mobile (fixed bottom-right) |
| MODIFY | app/src/pages/PatientDashboard.tsx | Use DashboardGrid and widgets, add tabs for mobile, FAB for "Book Appointment" |
| MODIFY | app/src/pages/StaffDashboard.tsx | Use DashboardGrid and widgets, add tabs for mobile, FAB for "Add Patient" |
| MODIFY | app/src/pages/AdminDashboard.tsx | Use DashboardGrid and widgets, add tabs for mobile |

## External References
- [MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [MDN: Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)
- [Material Design: Floating Action Button](https://m3.material.io/components/floating-action-button/overview)
- [WCAG 2.2: Focus Order (2.4.3)](https://www.w3.org/WAI/WCAG22/Understanding/focus-order)
- [CSS-Tricks: Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] Mobile (<768px): Single column layout, tabs visible, FAB fixed bottom-right
- [x] Tablet (768-1024px): Two-column grid layout, widgets reflow correctly
- [x] Desktop (1025-1440px): Three-column grid layout, FAB hidden
- [x] Large Desktop (>1440px): Max-width 1600px, content centered with padding
- [x] Dashboard widgets responsive (height, padding adjust per breakpoint)
- [x] Tabs keyboard-accessible (Arrow keys to navigate, Enter to select)
- [x] FAB accessible (aria-label present, keyboard focusable)
- [x] No horizontal scroll at any breakpoint
- [ ] Run `/analyze-ux` to validate dashboard responsiveness

## Implementation Checklist
- [x] Create `DashboardGrid.tsx` with CSS Grid: `display: grid; grid-template-columns: 1fr` (mobile), `repeat(2, 1fr)` (tablet ≥768px), `repeat(3, 1fr)` (desktop ≥1025px), `max-width: 1600px; margin: 0 auto` (large ≥1440px)
- [x] Create `DashboardWidget.tsx` with card styling: border, border-radius, padding, shadow, optional header/footer slots
- [x] Create `ResponsiveTabs.tsx` with tab buttons (horizontal scrollable on mobile), tab panels with conditional rendering
- [x] Create `FAB.tsx` with `position: fixed; bottom: 24px; right: 24px; display: none` on desktop (≥1025px), visible on mobile/tablet
- [x] Update `PatientDashboard.tsx`: wrap widgets in DashboardGrid, add ResponsiveTabs for mobile (Appointments/Waitlist/Notifications tabs), add FAB for "Book Appointment"
- [x] Update `StaffDashboard.tsx`: wrap widgets in DashboardGrid, add ResponsiveTabs for mobile (Queue/Appointments/Intake tabs), add FAB for "Add Patient"
- [x] Update `AdminDashboard.tsx`: wrap widgets in DashboardGrid, add ResponsiveTabs for mobile (Admin Tools/Monitoring/Workflows tabs)
- [x] **[UI Tasks - MANDATORY]** Reference dashboard wireframes to match widget placement and column layouts
- [ ] **[UI Tasks - MANDATORY]** Validate dashboards match wireframe specifications at all breakpoints before marking complete
