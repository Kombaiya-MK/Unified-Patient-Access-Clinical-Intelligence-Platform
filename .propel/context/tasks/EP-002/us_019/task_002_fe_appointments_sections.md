# Task - TASK_002: Frontend Appointments Sections (Upcoming & Past)

## Requirement Reference
- User Story: [us_019]
- Story Location: [.propel/context/tasks/us_019/us_019.md]
- Acceptance Criteria:
    - AC1: "Upcoming Appointments" section displays next 3 appointments as cards (each showing date/time, provider name, department, status badge colored by status - blue="Scheduled"/green="Confirmed"/orange="Arrived")
    - AC1: Each card has actions dropdown (View Details, Reschedule, Cancel)
    - AC1: "Past Appointments" section below displays last 5 completed appointments (showing visit date, provider, summary link "View Details")
    - AC1: "Book New Appointment" prominent button in upcoming section
- Edge Case:
    - EC1: What happens when patient has no upcoming appointments? Display empty state illustration with "No upcoming appointments" message and "Book Appointment" call-to-action button
    - EC2: How are cancelled appointments displayed? Show in "Past Appointments" with status="Cancelled" and reason if provided
    - EC3: What if patient has >3 upcoming appointments? Show "View All Appointments" link below cards, opens full list page

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-002 |
| **UXR Requirements** | UXR-001 (Max 3 clicks to book), UXR-002 (Clear visual hierarchy: upcoming > past > actions), UXR-201 (Mobile-first responsive) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #typography, #spacing |

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
Implement the Upcoming and Past Appointments sections with distinct visual styles. Upcoming appointments display as cards (grid layout, limit 3) with status badges and action dropdowns. Past appointments display as a table (limit 5) with minimal info. Add empty states, "View All" links, and integrate with AppointmentContext data filtering.

## Dependent Tasks
- TASK_001: Frontend Dashboard Layout & Navigation (provides dashboard structure)
- US-013 TASK_006: Booking confirmation with AppointmentContext (provides appointments data)

## Impacted Components
- **MODIFY** app/src/pages/PatientDashboard.tsx - Add UpcomingAppointments and PastAppointments sections with data filtering
- **CREATE** app/src/components/dashboard/UpcomingAppointments.tsx - Upcoming appointments card grid (limit 3)
- **CREATE** app/src/components/dashboard/PastAppointments.tsx - Past appointments table component (limit 5)
- **MODIFY** app/src/components/dashboard/AppointmentCard.tsx - Add status badge with color coding, actions dropdown
- **CREATE** app/src/components/dashboard/StatusBadge.tsx - Reusable status badge component
- **CREATE** app/src/components/dashboard/AppointmentActionsDropdown.tsx - Actions dropdown (View, Reschedule, Cancel)
- **CREATE** app/src/components/dashboard/EmptyState.tsx - Reusable empty state component with illustration
- **MODIFY** app/src/components/dashboard/AppointmentCard.css - Add status badge styles, dropdown styles
- **CREATE** app/src/components/dashboard/PastAppointments.css - Table styles for past appointments

## Implementation Plan
1. **Create StatusBadge.tsx**: Reusable component with props `status: 'scheduled' | 'confirmed' | 'arrived' | 'completed' | 'cancelled'`, color-coded backgrounds (blue/green/orange/gray/red)
2. **Create AppointmentActionsDropdown.tsx**: Dropdown menu with 3 options (View Details, Reschedule, Cancel), onClick handlers passed as props
3. **Modify AppointmentCard.tsx**: Add StatusBadge, integrate AppointmentActionsDropdown, update layout to match wireframe (date large, provider with avatar, department, actions menu icon)
4. **Create UpcomingAppointments.tsx**: Filter appointments (status != 'completed' && date >= today), sort by date ASC, take first 3, display in card grid, add "View All Appointments" link if >3 exist, empty state if 0
5. **Create PastAppointments.tsx**: Filter appointments (status = 'completed' OR 'cancelled'), sort by date DESC, take first 5, display in table format (columns: Date, Provider, Department, Status, Actions), empty state if 0
6. **Create EmptyState.tsx**: Reusable component with props `icon`, `title`, `message`, `actionLabel`, `onAction`, illustration/icon
7. **Modify PatientDashboard.tsx**: Replace current appointments list with UpcomingAppointments and PastAppointments components, pass onReschedule/onCancel/onViewDetails handlers
8. **Add CSS Styling**: Status badge colors from wireframe (--status-scheduled: blue, --status-confirmed: green, --status-arrived: orange, --status-completed: gray, --status-cancelled: red), table styles with zebra striping

**Focus on how to implement**: Use AppointmentContext's `appointments` array and filter client-side (limit 3 upcoming, limit 5 past). Status badge should use CSS classes for colors (not inline styles). Actions dropdown should close on outside click (use useRef + useEffect). Past appointments table should be accessible (ARIA roles, sortable headers). Empty state should have meaningful illustration (placeholder icon for now).

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── PatientDashboard.tsx (has DashboardLayout from TASK_001, shows all appointments unsorted)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx (TASK_001)
│   │   │   ├── NavigationSidebar.tsx (TASK_001)
│   │   │   ├── WelcomeBanner.tsx (TASK_001)
│   │   │   ├── AppointmentCard.tsx (basic version, needs status badge + actions)
│   │   │   ├── AppointmentCard.css
│   │   │   └── (new components to be added)
│   │   └── common/
│   │       └── LoadingSpinner.tsx
│   ├── context/
│   │   └── AppointmentContext.tsx (provides appointments array)
│   └── hooks/
│       └── useAuth.ts
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/dashboard/UpcomingAppointments.tsx | Component to display next 3 upcoming appointments as card grid with "View All" link if >3 exist |
| CREATE | app/src/components/dashboard/PastAppointments.tsx | Component to display last 5 past appointments in table format with sortable columns |
| CREATE | app/src/components/dashboard/StatusBadge.tsx | Reusable status badge component with color coding (blue/green/orange/gray/red) |
| CREATE | app/src/components/dashboard/AppointmentActionsDropdown.tsx | Dropdown menu component with View Details, Reschedule, Cancel actions |
| CREATE | app/src/components/dashboard/EmptyState.tsx | Reusable empty state component with icon, title, message, and action button |
| MODIFY | app/src/components/dashboard/AppointmentCard.tsx | Add StatusBadge integration, AppointmentActionsDropdown, update layout to match wireframe (large date, provider avatar) |
| MODIFY | app/src/components/dashboard/AppointmentCard.css | Add status badge colors, actions dropdown styles, hover effects |
| CREATE | app/src/components/dashboard/PastAppointments.css | Table styles for past appointments (zebra striping, sortable headers, responsive) |
| MODIFY | app/src/pages/PatientDashboard.tsx | Replace appointments list with UpcomingAppointments and PastAppointments sections, add data filtering logic |
| MODIFY | app/src/components/index.ts | Export new dashboard components (UpcomingAppointments, PastAppointments, StatusBadge, etc.) |

## External References
- **React Dropdown Patterns**: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/ - Accessible dropdown menu patterns
- **CSS Table Styling**: https://css-tricks.com/complete-guide-table-element/ - Table styling best practices
- **React useRef Hook**: https://react.dev/reference/react/useRef - Detecting outside clicks for dropdown
- **Array Filter and Sort**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter - JavaScript array methods
- **ARIA Table Roles**: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/table_role - Accessible table implementation
- **Empty State Design**: https://www.nngroup.com/articles/empty-state-ux/ - Best practices for empty states

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for appointment components)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for UpcomingAppointments, PastAppointments, StatusBadge, AppointmentActionsDropdown, EmptyState components
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Status badge colors match wireframe specification (Scheduled=blue, Confirmed=green, Arrived=orange, Completed=gray, Cancelled=red)
- [x] Actions dropdown functionality: opens on click, closes on outside click, keyboard accessible
- [x] Data filtering validation: upcoming appointments (status != completed, date >= today, limit 3), past appointments (status = completed/cancelled, limit 5)
- [x] "View All" link appears only when >3 upcoming appointments exist
- [x] Empty states display correctly when no upcoming or past appointments
- [x] Accessibility validation: keyboard navigation, ARIA labels, screen reader compatibility

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-002-patient-dashboard.html during implementation
- [ ] Create StatusBadge.tsx component with status prop and color mapping (scheduled: blue, confirmed: green, arrived: orange, completed: gray, cancelled: red) using CSS classes
- [ ] Create AppointmentActionsDropdown.tsx with dropdown menu (View Details, Reschedule, Cancel), close on outside click using useRef + useEffect
- [ ] Create EmptyState.tsx reusable component (props: icon, title, message, actionLabel, onAction) with placeholder illustration
- [ ] Create UpcomingAppointments.tsx component (filter appointments: status != 'completed' && appointment_date >= today, sort ASC, take first 3, display as card grid, show "View All" link if total >3)
- [ ] Create PastAppointments.tsx component (filter appointments: status = 'completed' OR 'cancelled', sort DESC, take first 5, display as table with columns: Date, Provider, Department, Status, Actions)
- [ ] Modify AppointmentCard.tsx to integrate StatusBadge and AppointmentActionsDropdown, update layout to match wireframe (date large font, provider avatar, department below)
- [ ] Create PastAppointments.css with table styles (zebra striping using nth-child, sortable header icons, responsive collapse to cards on mobile <768px)
