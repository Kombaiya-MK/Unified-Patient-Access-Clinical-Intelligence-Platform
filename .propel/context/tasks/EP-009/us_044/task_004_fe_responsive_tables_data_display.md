# Task - US_044_TASK_004

## Requirement Reference
- User Story: US_044
- Story Location: .propel/context/tasks/EP-009/us_044/us_044.md
- Acceptance Criteria:
    - AC-1: Implements responsive tables: mobile=card layout (stacked key-value pairs), tablet/desktop=traditional table
- Edge Cases:
    - Complex dashboards on mobile → Tabbed interface with scrollable sections

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html, wireframe-SCR-011-appointment-management.html, wireframe-SCR-012-audit-logs.html |
| **Screen Spec** | figma_spec.md#SCR-009, SCR-011, SCR-012, SCR-013 |
| **UXR Requirements** | UXR-401, NFR-UX01 |
| **Design Tokens** | designsystem.md#tables, designsystem.md#cards |

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** reference table wireframes to match card layout on mobile and table layout on desktop
- **MUST** implement stacked key-value pairs for mobile card view
- **MUST** validate table layouts at breakpoints: 375px, 768px, 1440px
- Run `/analyze-ux` after implementation to verify table responsiveness

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
Implement responsive table components that transform from traditional HTML tables on desktop to card-based layouts on mobile. On mobile (<768px), display each table row as a card with stacked key-value pairs (label: value). On tablet/desktop (≥768px), render as standard HTML tables with all columns visible. Include horizontal scroll with visual indicators for wide tables on tablet. Add touch-friendly row actions (swipe gestures for quick actions like check-in, no-show on mobile queue).

## Dependent Tasks
- task_001_fe_responsive_design_system.md (requires responsive hooks and CSS variables)

## Impacted Components
- NEW: `app/src/components/Tables/ResponsiveTable.tsx` - Main responsive table component
- NEW: `app/src/components/Tables/TableCard.tsx` - Card layout for mobile table rows
- NEW: `app/src/components/Tables/TableRow.tsx` - Desktop table row
- NEW: `app/src/components/Tables/TableScrollContainer.tsx` - Horizontal scroll wrapper for wide tables
- MODIFY: `app/src/pages/QueueManagement.tsx` - Use ResponsiveTable for queue list
- MODIFY: `app/src/pages/AppointmentManagement.tsx` - Use ResponsiveTable for appointments
- MODIFY: `app/src/pages/AuditLogs.tsx` - Use ResponsiveTable for audit log entries
- MODIFY: `app/src/pages/UserManagement.tsx` - Use ResponsiveTable for user list

## Implementation Plan
1. **Responsive Table Component**: Create `ResponsiveTable.tsx` that accepts data array and column definitions, uses `useBreakpoint()` to switch between card and table rendering
2. **Mobile Card Layout**: Create `TableCard.tsx` that displays each row as a card with stacked key-value pairs (e.g., "Patient: John Doe", "Time: 10:00 AM", "Status: Waiting")
3. **Desktop Table Layout**: Create `TableRow.tsx` for standard HTML table rendering with all columns visible
4. **Horizontal Scroll**: Create `TableScrollContainer.tsx` for wide tables on tablet, with scroll shadows to indicate more content
5. **Swipe Gestures**: Add swipe actions for mobile cards (swipe left to reveal "Check In" button, swipe right for "Mark No-Show" on queue table)
6. **Column Visibility**: Allow hiding less important columns on tablet (e.g., show only Name, Time, Status on tablet; hide Phone, Notes)
7. **Sorting & Filtering**: Ensure table sorting and filtering work across both layouts
8. **Integration**: Update pages with tables (Queue Management, Appointment Management, Audit Logs, User Management) to use ResponsiveTable

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   └── (existing components)
│   ├── pages/
│   │   ├── QueueManagement.tsx
│   │   ├── AppointmentManagement.tsx
│   │   ├── AuditLogs.tsx
│   │   └── UserManagement.tsx
│   └── hooks/
│       └── useBreakpoint.ts (from task_001)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/Tables/ResponsiveTable.tsx | Main table component that switches layout based on breakpoint |
| CREATE | app/src/components/Tables/TableCard.tsx | Card layout for mobile (stacked key-value pairs) |
| CREATE | app/src/components/Tables/TableRow.tsx | Standard table row for desktop |
| CREATE | app/src/components/Tables/TableScrollContainer.tsx | Horizontal scroll wrapper with scroll shadows |
| MODIFY | app/src/pages/QueueManagement.tsx | Replace existing table with ResponsiveTable |
| MODIFY | app/src/pages/AppointmentManagement.tsx | Replace existing table with ResponsiveTable |
| MODIFY | app/src/pages/AuditLogs.tsx | Replace existing table with ResponsiveTable |
| MODIFY | app/src/pages/UserManagement.tsx | Replace existing table with ResponsiveTable |

## External References
- [MDN: Responsive Tables](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design#responsive_tables)
- [CSS-Tricks: Responsive Data Tables](https://css-tricks.com/responsive-data-tables/)
- [WCAG 2.2: Tables (1.3.1)](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships)
- [React: Swipe Gestures (react-swipeable)](https://www.npmjs.com/package/react-swipeable)
- [Scroll Shadows Tutorial](https://lea.verou.me/blog/2012/04/background-attachment-local/)

## Build Commands
```bash
cd app
npm run dev    # Development with hot reload
npm run build  # Production build
```

## Implementation Validation Strategy
- [x] Mobile (<768px): Tables render as cards with stacked key-value pairs
- [x] Tablet (768-1024px): Tables render as traditional tables with horizontal scroll if needed
- [x] Desktop (>1024px): Tables render as traditional tables with all columns visible
- [ ] Swipe gestures work on mobile cards (if implemented for queue)
- [x] Table sorting works across both layouts (card and table)
- [x] Table filtering works across both layouts
- [x] Scroll shadows visible when table content overflows horizontally
- [x] Cards are touch-friendly with adequate spacing (≥8px between cards)
- [ ] Run `/analyze-ux` to validate table responsiveness

## Implementation Checklist
- [x] Create `ResponsiveTable.tsx` with props: `data` (array), `columns` (column definitions), `mobileCardTemplate` (JSX function for card layout)
- [x] Create `TableCard.tsx` that displays row data as card: stacked key-value pairs, bordered container, touch-friendly tap targets
- [x] Create `TableRow.tsx` for standard HTML `<tr>` rendering with column mapping
- [x] Create `TableScrollContainer.tsx` with `overflow-x: auto`, scroll shadows using CSS gradients
- [x] Implement column visibility rules: hide less important columns on tablet (use `hideOnTablet` flag in column definitions)
- [ ] Add swipe gesture support to `TableCard` using `react-swipeable` or custom touch handlers for queue actions
- [x] Update `QueueManagement.tsx` to use `ResponsiveTable` with queue data (Patient, Time, Status, Actions)
- [x] Update `AuditLogs.tsx` to use `ResponsiveTable` with audit log data (Timestamp, User, Action, Resource)
- [x] **[UI Tasks - MANDATORY]** Reference queue and table wireframes to match layouts
- [x] **[UI Tasks - MANDATORY]** Validate table layouts match wireframe specifications at all breakpoints before marking complete
