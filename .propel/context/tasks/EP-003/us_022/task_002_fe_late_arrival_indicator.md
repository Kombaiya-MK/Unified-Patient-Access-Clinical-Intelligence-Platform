# Task - TASK_002: Frontend Late Arrival Indicator

## Requirement Reference
- User Story: [us_022]
- Story Location: [.propel/context/tasks/us_022/us_022.md]
- Acceptance Criteria:
    - AC1: Display success toast "Patient marked as arrived" after marking arrival
- Edge Case:
    - EC2: Late arrival tracking - If arrival_time > appointment_datetime + 15min, flag as "Late" with orange indicator

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-009 |
| **UXR Requirements** | UXR-403 (Real-time queue updates <5s) |
| **Design Tokens** | .propel/context/docs/designsystem.md#colors, #badges |

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
Add late arrival indicator (orange "Late" badge) to queue table that displays when isLateArrival flag is true in API response. Enhance Mark Arrived action to show success toast notification. Update WebSocket listener to include isLateArrival field for real-time updates. Integrate with existing QueueTable and QueueActions components from US_020.

## Dependent Tasks
- TASK_001: Backend Arrival Tracking & Late Detection (provides isLateArrival flag in API response)
- US_020 TASK_001: Frontend Queue Table UI (base table component to enhance)
- US_020 TASK_002: Frontend Status Update Actions (Mark Arrived button already exists)

## Impacted Components
- **CREATE** app/src/components/queue/LateArrivalBadge.tsx - Orange badge for late arrivals
- **MODIFY** app/src/components/queue/QueueTableRow.tsx - Add LateArrivalBadge next to patient name
- **MODIFY** app/src/hooks/useQueueActions.ts - Add success toast after mark arrived
- **MODIFY** app/src/types/queue.types.ts - Add isLateArrival?: boolean to QueueAppointment interface
- **MODIFY** app/src/hooks/useWebSocket.ts - Include isLateArrival in WebSocket message handling

## Implementation Plan
1. **Create LateArrivalBadge.tsx**: Orange badge component displaying "Late" text, uses design tokens for color (--warning-600 background, white text)
2. **Modify queue.types.ts**: Add `isLateArrival?: boolean` field to QueueAppointment interface
3. **Modify QueueTableRow.tsx**: Add conditional rendering - if isLateArrival=true, display LateArrivalBadge next to patient name
4. **Modify useQueueActions.ts**: In markArrived() function, after successful API call, show success toast "Patient marked as arrived" (green toast, auto-dismiss 3 seconds)
5. **Modify useWebSocket.ts**: When processing 'queue:update' event for status='arrived', check for isLateArrival field in message data, update local queue state
6. **Add Error Handling**: When API returns 409 Conflict (already arrived), display error toast with message from API response
7. **Add CSS Styling**: Late badge orange (#FF8800 background, white text, small size), position next to patient name with 8px left margin

**Focus on how to implement**: LateArrivalBadge uses same styling pattern as status badges but smaller size. Conditional rendering uses `{appointment.isLateArrival && <LateArrivalBadge />}` JSX pattern. Success toast uses existing Toast component (or create if not exists). WebSocket update includes isLateArrival in payload: `{ appointmentId, newStatus, isLateArrival }`. Error toast for 409 displays backend error message.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── QueueManagementPage.tsx (US_020)
│   ├── components/
│   │   ├── queue/
│   │   │   ├── QueueTable.tsx (US_020 TASK_001)
│   │   │   ├── QueueTableRow.tsx (US_020 TASK_001, to be modified)
│   │   │   ├── QueueActions.tsx (US_020 TASK_002, has Mark Arrived button)
│   │   │   ├── QueueStatusBadge.tsx (US_020 TASK_001, exists)
│   │   │   └── (LateArrivalBadge.tsx to be created)
│   │   └── common/
│   │       └── Toast.tsx (may need to create or modify)
│   ├── hooks/
│   │   ├── useQueueActions.ts (US_020 TASK_002, to be modified)
│   │   └── useWebSocket.ts (US_020 TASK_002, to be modified)
│   ├── types/
│   │   └── queue.types.ts (US_020 TASK_001, to be modified)
│   └── App.tsx
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/queue/LateArrivalBadge.tsx | Orange badge component displaying "Late" text with warning color scheme |
| MODIFY | app/src/components/queue/QueueTableRow.tsx | Add LateArrivalBadge conditional rendering next to patient name |
| MODIFY | app/src/hooks/useQueueActions.ts | Add success toast "Patient marked as arrived" after markArrived() API call |
| MODIFY | app/src/types/queue.types.ts | Add isLateArrival?: boolean to QueueAppointment interface |
| MODIFY | app/src/hooks/useWebSocket.ts | Handle isLateArrival field in WebSocket 'queue:update' messages |

## External References
- **React Conditional Rendering**: https://react.dev/learn/conditional-rendering - JSX conditional patterns
- **CSS Badge Design**: https://getbootstrap.com/docs/5.3/components/badge/ - Badge component styling
- **Toast Notifications**: https://www.npmjs.com/package/react-hot-toast - Toast notification library
- **WebSocket Message Handling**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/message_event - Parsing WebSocket messages
- **TypeScript Optional Fields**: https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties - Optional interface fields

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for late arrival components)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for LateArrivalBadge component
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Late badge displays correctly with orange color scheme
- [x] Success toast shows after marking arrival
- [x] Error toast shows for duplicate arrival (409 response)
- [x] Real-time updates: Late arrival indicator appears/updates via WebSocket
- [x] Badge positioning correct next to patient name

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html during implementation
- [ ] Modify queue.types.ts QueueAppointment interface (add isLateArrival?: boolean field)
- [ ] Create LateArrivalBadge.tsx component (returns badge with "Late" text, CSS class .badge--late with background: var(--warning-600), color: white, font-size: 11px, padding: 2px 6px)
- [ ] Modify QueueTableRow.tsx (add conditional rendering: {appointment.isLateArrival && <LateArrivalBadge />} after patient name display, with margin-left: 8px)
- [ ] Modify useQueueActions.ts markArrived() function (after successful API response, call toast.success("Patient marked as arrived", { duration: 3000 }), handle 409 error with toast.error(error.message))
- [ ] Modify useWebSocket.ts message handler (when event.type === 'status_change' && event.newStatus === 'arrived', include isLateArrival from event.data in updated appointment object)
- [ ] Create or enhance Toast.tsx component (if not exists, create wrapper around react-hot-toast with success/error methods, or use existing implementation)
- [ ] Add CSS for .badge--late (background-color: #FF8800, color: white, font-size: 11px, font-weight: 600, padding: 2px 6px, border-radius: 4px, text-transform: uppercase)
