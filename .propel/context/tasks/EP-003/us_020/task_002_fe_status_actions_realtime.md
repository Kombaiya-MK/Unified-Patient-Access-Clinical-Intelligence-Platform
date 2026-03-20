# Task - TASK_002: Frontend Status Update Actions & Real-time Updates

## Requirement Reference
- User Story: [us_020]
- Story Location: [.propel/context/tasks/us_020/us_020.md]
- Acceptance Criteria:
    - AC2: Click "Mark Arrived" → updates status to "Arrived", logs arrival time, moves to "Arrived" section, triggers real-time update (<5s latency)
    - AC3: Click "Start Consultation" → updates status to "In Progress", records start time, displays duration timer
    - AC4: Click "Mark Completed" → updates status to "Completed", calculates total duration, archives from active queue, triggers billing workflow notification
- Edge Case:
    - EC1: Patient scheduled for 2:00 PM doesn't arrive by 2:30 PM - Orange alert badge appears, staff can click "Mark No Show"
    - EC3: Two staff members try to mark arrived simultaneously - Optimistic locking: first update wins, second receives "Already marked arrived by [Staff Name]" message

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-009 |
| **UXR Requirements** | UXR-403 (Real-time <5s via WebSocket/SSE), UXR-401 (Loading <200ms) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #buttons |

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
| Frontend | TypeScript | 5.3.x |
| Frontend | WebSocket API | Native |

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
Implement action buttons (Mark Arrived, Start Consultation, Mark Completed, Mark No Show) with contextual display based on current status. Add WebSocket client for real-time queue updates with <5s latency. Implement optimistic locking error handling and notification banners for concurrent updates. Add duration timer for "In Progress" appointments and late arrival risk indicators.

## Dependent Tasks
- TASK_001: Frontend Queue Table UI (provides table structure and status badges)
- TASK_003: Backend Queue API (provides status update endpoints)
- TASK_004: Backend Real-time Service (provides WebSocket server)

## Impacted Components
- **CREATE** app/src/components/queue/QueueActions.tsx - Contextual action buttons based on status
- **CREATE** app/src/components/queue/DurationTimer.tsx - Live timer for "In Progress" appointments
- **CREATE** app/src/components/queue/RiskIndicator.tsx - Orange badge for high no-show risk
- **CREATE** app/src/components/queue/RealtimeNotification.tsx - Banner for real-time queue updates
- **CREATE** app/src/hooks/useQueueActions.ts - Hook for status update API calls with optimistic UI
- **CREATE** app/src/hooks/useWebSocket.ts - WebSocket client hook for real-time updates
- **CREATE** app/src/components/queue/QueueActions.css - Action button styles
- **MODIFY** app/src/pages/QueueManagementPage.tsx - Add WebSocket integration, notification banner
- **MODIFY** app/src/components/queue/QueueTableRow.tsx - Add QueueActions, RiskIndicator, DurationTimer

## Implementation Plan
1. **Create useQueueActions.ts**: Hook with functions `markArrived(appointmentId)`, `startConsultation(appointmentId)`, `markCompleted(appointmentId)`, `markNoShow(appointmentId)`, each calls API PATCH endpoint, implements optimistic UI update, handles conflict errors (409)
2. **Create QueueActions.tsx**: Contextual buttons based on status:
   - status='scheduled' → "Mark Arrived" button
   - status='arrived' → "Start Consultation" button
   - status='in_progress' → "Mark Completed" button
   - All statuses show "Mark No Show" in dropdown menu
3. **Create DurationTimer.tsx**: Component that displays live timer for appointments with status='in_progress', calculates elapsed time from start_time to now, updates every second using setInterval
4. **Create RiskIndicator.tsx**: Orange badge with "⚠ High Risk" text, shown when riskScore >= 70 OR (status='scheduled' AND currentTime > appointmentTime + 30min)
5. **Create useWebSocket.ts**: Hook that connects to WebSocket at ws://localhost:3000/queue, listens for 'queue:update' events, updates queue data in QueueManagementPage, shows notification banner on update
6. **Create RealtimeNotification.tsx**: Banner component that displays "New patient arrived" or "Queue updated by [Staff Name]" with dismiss button, auto-dismisses after 5 seconds
7. **Add Optimistic Locking Error Handling**: When API returns 409 Conflict, show error toast "Already marked [status] by [Staff Name]", revert optimistic UI update, refresh queue data
8. **Integrate Components**: Modify QueueTableRow to render QueueActions in action column, show RiskIndicator next to patient name if applicable, show DurationTimer in status column for in_progress appointments

**Focus on how to implement**: Use optimistic UI updates (update local state immediately, revert on API error). WebSocket reconnects automatically on disconnect with exponential backoff. Action buttons disable during API call to prevent double-clicks. Conflict errors show user-friendly message with staff name who made the update. Duration timer uses useEffect with setInterval cleanup.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── QueueManagementPage.tsx (TASK_001, to be modified)
│   ├── components/
│   │   ├── queue/
│   │   │   ├── QueueTable.tsx (TASK_001)
│   │   │   ├── QueueTableRow.tsx (TASK_001, to be modified)
│   │   │   └── (new action components to be created)
│   │   └── common/
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useQueueData.ts (TASK_001)
│   │   └── (useQueueActions.ts, useWebSocket.ts to be created)
│   └── types/
│       └── queue.types.ts (TASK_001)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/queue/QueueActions.tsx | Contextual action buttons (Mark Arrived, Start, Complete, No Show) based on status |
| CREATE | app/src/components/queue/DurationTimer.tsx | Live timer component for "In Progress" appointments, updates every second |
| CREATE | app/src/components/queue/RiskIndicator.tsx | Orange badge for high no-show risk (score >= 70 or late >30min) |
| CREATE | app/src/components/queue/RealtimeNotification.tsx | Banner for real-time queue updates with dismiss button and auto-dismiss |
| CREATE | app/src/hooks/useQueueActions.ts | Hook with markArrived, startConsultation, markCompleted, markNoShow functions (optimistic UI + API calls) |
| CREATE | app/src/hooks/useWebSocket.ts | WebSocket client hook for real-time updates, reconnects on disconnect |
| CREATE | app/src/components/queue/QueueActions.css | Action button styles (primary, secondary, danger colors, disabled state) |
| MODIFY | app/src/pages/QueueManagementPage.tsx | Add useWebSocket integration, RealtimeNotification banner at top |
| MODIFY | app/src/components/queue/QueueTableRow.tsx | Add QueueActions in action column, RiskIndicator next to patient name, DurationTimer in status column for in_progress |
| MODIFY | app/src/types/queue.types.ts | Add WebSocketMessage, QueueActionResult, ConflictError interfaces |

## External References
- **React WebSocket**: https://www.npmjs.com/package/react-use-websocket - WebSocket hook library (or use native WebSocket)
- **Optimistic UI Updates**: https://tanstack.com/query/latest/docs/react/guides/optimistic-updates - Optimistic update patterns
- **React Timer**: https://overreacted.io/making-setinterval-declarative-with-react-hooks/ - setInterval with useEffect
- **WebSocket Reconnection**: https://github.com/pladaria/reconnecting-websocket - Auto-reconnect pattern
- **Conflict Resolution**: https://martinfowler.com/articles/patterns-of-distributed-systems/version-vector.html - Optimistic locking patterns
- **Toast Notifications**: https://www.npmjs.com/package/react-hot-toast - User notifications library

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for action components and hooks)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for QueueActions, DurationTimer, RiskIndicator, useQueueActions, useWebSocket
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Action buttons display correctly based on appointment status
- [x] Optimistic UI updates work: status changes immediately, reverts on error
- [x] Conflict error handling: 409 response shows "Already marked by [Staff]" message
- [x] WebSocket real-time updates work: new appointments appear within 5s
- [x] Duration timer updates every second for in_progress appointments
- [x] Risk indicator appears for late arrivals (>30min past appointment time)

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html during implementation
- [ ] Create useQueueActions.ts hook with markArrived, startConsultation, markCompleted, markNoShow functions (each calls PATCH /api/staff/queue/:id/status with optimistic UI update, handles 409 conflict errors)
- [ ] Create QueueActions.tsx component (props: appointmentId, currentStatus, returns contextual buttons: scheduled → "Mark Arrived", arrived → "Start", in_progress → "Complete", all have "No Show" option in dropdown)
- [ ] Create DurationTimer.tsx component (props: startTime, calculates elapsed time, updates every 1 second using setInterval in useEffect, displays as "15m 32s" format)
- [ ] Create RiskIndicator.tsx component (props: riskScore, appointmentTime, currentTime, shows orange badge "⚠ High Risk" if riskScore >= 70 OR currentTime > appointmentTime + 30min)
- [ ] Create useWebSocket.ts hook (connects to ws://localhost:3000/queue with auth token, listens for 'queue:update' events, returns { connected, lastUpdate, error }, reconnects with exponential backoff on disconnect)
- [ ] Create RealtimeNotification.tsx banner component (props: message, onDismiss, auto-dismisses after 5 seconds, displays at top of queue page with slide-in animation)
- [ ] Modify QueueTableRow.tsx to render QueueActions in action column, RiskIndicator next to patient name if applicable, DurationTimer in status column for in_progress appointments
