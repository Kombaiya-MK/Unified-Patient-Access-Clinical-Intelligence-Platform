# Task - TASK_001: Frontend Queue Table UI with Filters

## Requirement Reference
- User Story: [us_020]
- Story Location: [.propel/context/tasks/us_020/us_020.md]
- Acceptance Criteria:
    - AC1: Display today's appointment list with columns: Patient Name, Appointment Time, Status, Provider, Department, and Action buttons
    - AC1: Status shown with color-coded badges (Scheduled=gray, Arrived=green, In Progress=blue, Completed=gray, No Show=red)
    - AC1: Table is sortable by time/status, row highlight on hover
- Edge Case:
    - EC4: High-volume days need filtering - Filter dropdowns: Status (multi-select), Provider, Department; Search by patient name

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-009 |
| **UXR Requirements** | UXR-101 (WCAG AA), UXR-201 (Mobile-first), UXR-401 (Loading <200ms) |
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
Create the queue management page with a sortable, filterable data table displaying today's appointments. Implement status badges with color coding, patient name links, and filter controls (status multi-select, provider dropdown, department dropdown, patient name search). Responsive design switches from table to cards on mobile.

## Dependent Tasks
- US-009: Authentication for staff role (already implemented)
- US-022: Backend appointments API with status field (dependency for data fetching)

## Impacted Components
- **CREATE** app/src/pages/QueueManagementPage.tsx - Main queue management page
- **CREATE** app/src/components/queue/QueueTable.tsx - Sortable appointment table
- **CREATE** app/src/components/queue/QueueFilters.tsx - Filter controls (status, provider, department, search)
- **CREATE** app/src/components/queue/QueueStatusBadge.tsx - Color-coded status badge component
- **CREATE** app/src/components/queue/QueueTableRow.tsx - Individual queue row with patient info
- **CREATE** app/src/components/queue/QueueMobileCard.tsx - Mobile card view for appointments
- **CREATE** app/src/pages/QueueManagementPage.css - Page-level styles
- **CREATE** app/src/components/queue/QueueTable.css - Table and card styles
- **CREATE** app/src/hooks/useQueueData.ts - Hook for fetching and filtering queue data
- **CREATE** app/src/types/queue.types.ts - TypeScript interfaces for queue data
- **MODIFY** app/src/App.tsx - Add route /staff/queue for queue management page

## Implementation Plan
1. **Create queue.types.ts**: Define interfaces for `QueueAppointment`, `QueueFilters`, `QueueSortConfig`
2. **Create useQueueData.ts**: Hook that fetches today's appointments from API, implements client-side filtering by status/provider/department/search, sorting by time/status
3. **Create QueueStatusBadge.tsx**: Component with status prop, returns badge with color coding (Scheduled=gray, Arrived=green, In Progress=blue, Completed=gray, No Show=red)
4. **Create QueueFilters.tsx**: Filter controls with status multi-select (checkboxes), provider dropdown, department dropdown, patient name search input, "Reset Filters" button
5. **Create QueueTableRow.tsx**: Table row component with patient name (link), appointment time, status badge, provider name, department, action buttons slot (implemented in TASK_002)
6. **Create QueueMobileCard.tsx**: Mobile card view with same info as table row, stacked layout
7. **Create QueueTable.tsx**: Desktop table with sortable headers (time, status), maps appointments to QueueTableRow, responsive switch to QueueMobileCard on mobile (<768px)
8. **Create QueueManagementPage.tsx**: Page with header ("Queue Management", live indicator), QueueFilters, QueueTable, loading/error/empty states
9. **Add Route**: Update App.tsx to add /staff/queue route (protected, staff-only)

**Focus on how to implement**: Use CSS Grid for table layout. Sortable headers use onClick to toggle sort direction (ASC/DESC). Filters update query params for persistence on refresh. Mobile view uses CSS media queries (@media max-width: 767px) to hide table and show cards. Status badges use CSS classes for colors (not inline styles). Patient name links navigate to patient details page (placeholder for now).

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   ├── PatientDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   └── (QueueManagementPage.tsx to be created)
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── AppointmentCard.tsx (exists, different from queue view)
│   │   ├── queue/
│   │   │   └── (all queue components to be created)
│   │   └── common/
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── (useQueueData.ts to be created)
│   ├── types/
│   │   ├── appointment.types.ts
│   │   └── (queue.types.ts to be created)
│   └── App.tsx (to be modified)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/QueueManagementPage.tsx | Main queue page with header, filters, table, loading/error/empty states |
| CREATE | app/src/components/queue/QueueTable.tsx | Sortable table component with responsive switch to mobile cards |
| CREATE | app/src/components/queue/QueueFilters.tsx | Filter controls (status multi-select, provider/department dropdowns, search input, reset button) |
| CREATE | app/src/components/queue/QueueStatusBadge.tsx | Reusable status badge with color coding |
| CREATE | app/src/components/queue/QueueTableRow.tsx | Table row with patient info, status badge, provider, department, actions slot |
| CREATE | app/src/components/queue/QueueMobileCard.tsx | Mobile card view for appointments (stacked layout) |
| CREATE | app/src/pages/QueueManagementPage.css | Page styles (header, live indicator, section layout) |
| CREATE | app/src/components/queue/QueueTable.css | Table styles (sortable headers, hover effects, mobile cards, status badge colors) |
| CREATE | app/src/hooks/useQueueData.ts | Hook for fetching queue data, client-side filtering/sorting |
| CREATE | app/src/types/queue.types.ts | TypeScript interfaces: QueueAppointment, QueueFilters, QueueSortConfig, QueueStatus |
| MODIFY | app/src/App.tsx | Add /staff/queue route protected with staff role check |

## External References
- **React Table Sorting**: https://www.robinwieruch.de/react-table-sort/ - Sortable table implementation patterns
- **CSS Table Responsive**: https://css-tricks.com/responsive-data-tables/ - Table-to-cards responsive pattern
- **React Multi-Select**: https://www.npmjs.com/package/react-select - Accessible multi-select component (or build custom)
- **URL Query Params**: https://reactrouter.com/en/main/hooks/use-search-params - Persist filters in URL
- **CSS Grid Table**: https://css-tricks.com/look-ma-no-media-queries-responsive-layouts-using-css-grid/ - Grid-based table layout
- **ARIA Table Roles**: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/table_role - Accessible table implementation

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for queue components)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for QueueTable, QueueFilters, QueueStatusBadge components
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Status badge colors match wireframe (Scheduled=gray, Arrived=green, In Progress=blue)
- [x] Table sorting works correctly (click header toggles ASC/DESC)
- [x] Filters work: status multi-select, provider/department dropdowns, patient search
- [x] Mobile responsive: table switches to cards on <768px
- [x] Accessibility validation: keyboard navigation, ARIA labels, sortable headers announced

## Implementation Checklist
- [x] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html during implementation
- [x] Create queue.types.ts with interfaces: QueueAppointment (id, patientName, patientId, appointmentTime, status: 'scheduled'|'arrived'|'in_progress'|'completed'|'no_show', provider, department, riskScore), QueueFilters (status: string[], providerId, departmentId, searchTerm), QueueSortConfig (field, direction)
- [x] Create useQueueData.ts hook (fetch from /api/staff/queue/today, implement client-side filtering with useMemo, sorting with useState, return { appointments, loading, error, filters, setFilters, sort, setSort })
- [x] Create QueueStatusBadge.tsx component (props: status, returns badge with CSS class for color: .badge--scheduled gray, .badge--arrived green, .badge--in-progress blue, .badge--completed gray, .badge--no-show red)
- [x] Create QueueFilters.tsx component (status multi-select checkboxes, provider/department dropdowns fetched from API, patient search input with debounce, reset button, onChange updates filters)
- [x] Create QueueTableRow.tsx component (columns: patient name as link, appointment time formatted, QueueStatusBadge, provider name, department, actions slot for TASK_002)
- [x] Create QueueMobileCard.tsx component (card layout with patient name header, time + status badge row, provider + department row, actions at bottom)
- [x] Create QueueTable.tsx component (table with sortable headers using onClick, map appointments to QueueTableRow, responsive media query hides table and shows QueueMobileCard grid on mobile <768px)
