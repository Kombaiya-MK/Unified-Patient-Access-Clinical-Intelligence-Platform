# Task - TASK_001_FE_STAFF_QUEUE_UI

## Requirement Reference
- User Story: US_020
- Story Location: `.propel/context/tasks/us_020/us_020.md`
- Acceptance Criteria:
    - AC1: Queue page shows today's appointments with columns (Patient Name, Time, Status, Provider, Department, Actions), real-time updates <5s
    - AC2: "Mark Arrived" button updates status to "Arrived", triggers WebSocket broadcast
    - AC3: "Start Consultation" updates to "In Progress", displays duration timer
    - AC4: "Mark Completed" updates to "Completed", archives from queue
- Edge Cases:
    - Late patient (>30 min): Orange alert badge, "Mark No Show" button enabled
    - Simultaneous updates: Optimistic locking, display "Already marked by [Staff Name]"
    - High-volume filtering: Filter by Status/Provider/Department, search by name

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-009 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-staff-queue-management.html |
| **Screen Spec** | SCR-009 (Queue Management), SCR-003 (Staff Dashboard) |
| **UXR Requirements** | UXR-403 (Real-time <5s via WebSocket), UXR-101 (WCAG AA), UXR-201 (Responsive: cards on mobile, table on desktop) |
| **Design Tokens** | Status badges: Scheduled=#007BFF, Arrived=#28A745, In Progress=#FFA500, Completed=#6C757D, No Show=#DC3545. Buttons: Mark Arrived green, Start blue, Complete gray, No Show red |

> **Wireframe Components:**
> - Queue table: Sortable by time/status, row hover highlight
> - Status badges: Color-coded pills (green=Arrived, blue=In Progress, gray=Scheduled)
> - Action buttons: Contextual based on status (Scheduled→Mark Arrived, Arrived→Start, In Progress→Complete)
> - Filters panel: Status multi-select, Provider dropdown, Department dropdown, Date picker (default today)
> - No-show risk indicator: Orange "⚠ High Risk" badge if risk_score ≥70
> - Walk-in badge: Yellow "Walk-in" pill for walk-in appointments
> - Real-time banner: "New patient arrived" notification on WebSocket event
> - Register Walk-in button: Top-right corner

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Socket.IO Client | 4.x |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

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
| **Mobile Impact** | Yes (Responsive) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement staff queue management UI: (1) StaffQueue page with appointment table (columns: Patient, Time, Status, Provider, Department, Actions), (2) Real-time WebSocket integration for queue updates <5s (UXR-403), (3) Status badges with color coding, (4) Action buttons (Mark Arrived, Start, Complete, No Show) contextual to current status, (5) Filter panel (Status multi-select, Provider/Department dropdowns, search by patient name), (6) Late arrival indicator (orange badge if >30 min past time), (7) No-show risk badge (⚠ High Risk if score ≥70), (8) Walk-in badge (yellow pill), (9) Register Walk-in button (top-right), (10) Responsive: cards on mobile, table on desktop, (11) WCAG AA compliant.

## Dependent Tasks
- US_022 Task 001: Arrival marking + WebSocket server (real-time updates)
- US_021 Task 001: Walk-in registration UI (Register Walk-in button)
- US_024: No-show marking (No Show button)

## Impacted Components
**New:**
- app/src/pages/StaffQueue.tsx (Queue management page)
- app/src/components/QueueTable.tsx (Appointment table with filters)
- app/src/components/QueueFilters.tsx (Filter panel)
- app/src/components/StatusBadge.tsx (Reusable status badge)
- app/src/hooks/useQueueData.ts (Fetch queue appointments + WebSocket updates)

**Modified:**
- app/src/contexts/SocketContext.tsx (Reuse from US_022, connect to queue channel)

## Implementation Plan
1. Create StaffQueue page: Layout with filters (left/top), queue table (center), Register Walk-in button (top-right)
2. Implement QueueFilters: Status checkboxes (Scheduled, Arrived, In Progress), Provider dropdown, Department dropdown, patient name search input
3. Implement QueueTable: Sortable columns, status badges, action buttons based on status
4. Action buttons logic:
   - Scheduled → "Mark Arrived" (green)
   - Arrived → "Start Consultation" (blue)
   - In Progress → "Mark Completed" (gray)
   - >30 min past + not arrived → "Mark No Show" (red)
5. useQueueData hook: Fetch GET /api/queue?date=today, subscribe to WebSocket 'queue:update' events, update react-query cache on event
6. Status badges: Render color-coded pills using StatusBadge component
7. Risk badge: If appointment.noShowRiskScore >= 70, render "⚠ High Risk" orange badge
8. Walk-in badge: If appointment.status = "Walk-in", render yellow "Walk-in" badge
9. Real-time updates: WebSocket event → update queue list, brief highlight animation on changed row
10. Responsive: Desktop (table), mobile (card list with stacked info), tablet (compact table)

## Current Project State
```
ASSIGNMENT/app/src/
├── pages/ (dashboard exists)
├── contexts/SocketContext.tsx (from US_022)
└── (queue components to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/StaffQueue.tsx | Queue management page |
| CREATE | app/src/components/QueueTable.tsx | Appointment table |
| CREATE | app/src/components/QueueFilters.tsx | Filter panel |
| CREATE | app/src/components/StatusBadge.tsx | Status badge component |
| CREATE | app/src/hooks/useQueueData.ts | Queue data + WebSocket hook |

## External References
- [React Table Sorting](https://tanstack.com/table/v8)
- [Socket.IO Client React](https://socket.io/docs/v4/client-api/)
- [UXR-403 Real-time Updates <5s](../../../.propel/context/docs/spec.md#UXR-403)
- [FR-005 Queue Management](../../../.propel/context/docs/spec.md#FR-005)

## Build Commands
```bash
cd app
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: QueueFilters updates query parameters
- [ ] Integration tests: Queue page fetches appointments for today
- [ ] Queue page renders: Navigate to /queue → see appointment table
- [ ] Appointments displayed: Table shows today's appointments with all columns
- [ ] Status badges: Verify color-coded (Scheduled blue, Arrived green, In Progress orange, Completed gray)
- [ ] Action buttons contextual: Scheduled appointment shows "Mark Arrived", Arrived shows "Start"
- [ ] Mark Arrived: Click button → status updates, badge changes to green "Arrived"
- [ ] Real-time update: Two browsers → mark arrived on one → second updates <5s
- [ ] Filters work: Select "Arrived" status → table shows only arrived appointments
- [ ] Provider filter: Select provider → table shows only that provider's appointments
- [ ] Search: Type patient name → table filters results
- [ ] Risk badge: Appointment with risk_score=75 → shows orange "⚠ High Risk"
- [ ] Walk-in badge: Walk-in appointment → shows yellow "Walk-in" badge
- [ ] Late arrival: Appointment >30 min past time → orange alert badge
- [ ] Responsive: Mobile → cards instead of table, filters collapse to dropdown
- [ ] WCAG AA: Keyboard navigation, ARIA labels, 4.5:1 contrast

## Implementation Checklist
- [ ] Create StatusBadge.tsx reusable component
- [ ] Create QueueFilters.tsx with status/provider/department filters
- [ ] Create QueueTable.tsx with sortable columns + action buttons
- [ ] Create useQueueData.ts hook with WebSocket integration
- [ ] Create StaffQueue.tsx page container
- [ ] Add routing: /queue → StaffQueue (requireRole staff/admin)
- [ ] Test real-time updates across multiple clients
- [ ] Validate WCAG AA compliance
- [ ] Document queue management in app/README.md
