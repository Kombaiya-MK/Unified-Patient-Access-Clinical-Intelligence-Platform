# Task - TASK_003: Frontend "Left Without Being Seen" Action

## Requirement Reference
- User Story: [us_022]
- Story Location: [.propel/context/tasks/us_022/us_022.md]
- Acceptance Criteria:
    - AC3: Display audit log of all status changes with timestamps and staff member name
- Edge Case:
    - EC3: Left without being seen - Add "Left Without Being Seen" button, mark status as "No Show", record in audit log

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
| **Design Tokens** | .propel/context/docs/designsystem.md#buttons, #colors |

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
Add "Left Without Being Seen" action to queue management interface that allows staff to mark patients who left before treatment. When clicked, confirmation modal appears with reason dropdown (e.g., "Long wait time", "Felt better", "Other"), then updates appointment status to "No Show" via PATCH /api/staff/queue/:id/status. Display success/error toast, update queue table real-time, and ensure action button appears conditionally only for Scheduled and Arrived statuses.

## Dependent Tasks
- US_020 TASK_002: Frontend Status Update Actions (base actions component to enhance)
- US_020 TASK_003: Backend Queue API (PATCH /api/staff/queue/:id/status endpoint)
- US_020 TASK_004: Backend WebSocket (real-time broadcast for status updates)
- TASK_001: Backend Arrival Tracking (audit log recording for status changes)

## Impacted Components
- **MODIFY** app/src/components/queue/QueueActions.tsx - Add "Left Without Being Seen" button/menu option
- **CREATE** app/src/components/queue/LeftWithoutSeenModal.tsx - Confirmation modal with reason dropdown
- **MODIFY** app/src/hooks/useQueueActions.ts - Add markLeftWithoutSeen() function
- **MODIFY** app/src/types/queue.types.ts - Add 'no_show' to AppointmentStatus enum

## Implementation Plan
1. **Modify queue.types.ts**: Ensure 'no_show' is included in AppointmentStatus enum (if not already present)
2. **Create LeftWithoutSeenModal.tsx**: Modal component with header "Confirm Patient Left", dropdown with reasons (Long wait time | Felt better | Emergency elsewhere | No explanation | Other), textarea for optional notes (max 200 chars), Cancel and Confirm buttons
3. **Modify QueueActions.tsx**: Add "Left Without Being Seen" button (styled with danger variant, secondary priority), conditionally display only when status === 'scheduled' || status === 'arrived', onClick opens LeftWithoutSeenModal
4. **Modify useQueueActions.ts**: Create markLeftWithoutSeen(appointmentId, reason, notes?) function that calls PATCH /api/staff/queue/:id/status with body { status: 'no_show', reason, notes, action: 'left_without_seen' }
5. **Add Success/Error Handling**: Show success toast "Patient marked as left without being seen", on error show toast with error message, close modal on success, update local queue state optimistically
6. **Add Button Styling**: "Left Without Being Seen" button uses danger color (red), displays after primary actions, 3px left margin, icon: ExitIcon or similar from icon library
7. **Add Modal Validation**: Reason dropdown required (cannot confirm without selecting), notes optional but max 200 characters validation

**Focus on how to implement**: Button conditional rendering uses `{(status === 'scheduled' || status === 'arrived') && <LeftWithoutSeenButton />}` JSX pattern. Modal uses React Hook Form for validation and submission. API call sends status='no_show' along with reason enum value. Backend queues WebSocket broadcast with action type 'left_without_seen'. Success: remove appointment from queue table (filter out from state). Error: display inline alert in modal without closing.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── QueueManagementPage.tsx (US_020)
│   ├── components/
│   │   ├── queue/
│   │   │   ├── QueueTable.tsx (US_020 TASK_001)
│   │   │   ├── QueueActions.tsx (US_020 TASK_002, to be modified)
│   │   │   ├── QueueStatusBadge.tsx (US_020 TASK_001)
│   │   │   ├── LateArrivalBadge.tsx (US_022 TASK_002)
│   │   │   └── (LeftWithoutSeenModal.tsx to be created)
│   │   └── common/
│   │       ├── Toast.tsx (US_022 TASK_002)
│   │       └── Modal.tsx (base modal component, may exist or need creation)
│   ├── hooks/
│   │   ├── useQueueActions.ts (US_020 TASK_002, to be modified)
│   │   └── useWebSocket.ts (US_020 TASK_002)
│   ├── types/
│   │   └── queue.types.ts (US_020 TASK_001, to be modified)
│   └── App.tsx
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/queue/LeftWithoutSeenModal.tsx | Confirmation modal with reason dropdown (5 options) and optional notes textarea |
| MODIFY | app/src/components/queue/QueueActions.tsx | Add "Left Without Being Seen" button that opens confirmation modal (danger style, conditional display) |
| MODIFY | app/src/hooks/useQueueActions.ts | Add markLeftWithoutSeen(appointmentId, reason, notes?) function calling PATCH API |
| MODIFY | app/src/types/queue.types.ts | Add 'no_show' to AppointmentStatus enum, add LeftWithoutSeenReason enum |

## External References
- **React Modals**: https://react.dev/reference/react-dom/components/dialog - Native dialog element for modals
- **React Hook Form Validation**: https://react-hook-form.com/get-started#Applyvalidation - Form validation with required fields
- **REST API PATCH**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH - PATCH method for partial updates
- **TypeScript Enums**: https://www.typescriptlang.org/docs/handbook/enums.html - Enum types for status/reason values
- **Confirmation Dialogs**: https://www.nngroup.com/articles/confirmation-dialog/ - UX best practices for confirmations

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for left without seen components)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for LeftWithoutSeenModal component
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Button appears only for Scheduled and Arrived statuses
- [x] Modal displays with reason dropdown and notes field
- [x] Form validation works (reason required, notes max 200 chars)
- [x] Success toast displays after confirming
- [x] Appointment removed from queue table after status update
- [x] Real-time update: Other staff members see removal via WebSocket

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html during implementation
- [ ] Modify queue.types.ts (ensure 'no_show' in AppointmentStatus enum, add LeftWithoutSeenReason enum with values: 'long_wait' | 'felt_better' | 'emergency_elsewhere' | 'no_explanation' | 'other')
- [ ] Create LeftWithoutSeenModal.tsx component (accepts props: isOpen, onClose, onConfirm(reason, notes), uses React Hook Form for reason dropdown required validation and notes maxLength 200)
- [ ] Add dropdown options (Long wait time, Felt better, Emergency elsewhere, No explanation, Other with labels)
- [ ] Modify QueueActions.tsx (add button with label "Left Without Being Seen", danger variant styling, icon: ExitIcon, conditional display: status === 'scheduled' || status === 'arrived', onClick: opens modal setShowLeftModal(true))
- [ ] Modify useQueueActions.ts (add markLeftWithoutSeen function: async (appointmentId, reason, notes) => axios.patch(`/api/staff/queue/${appointmentId}/status`, { status: 'no_show', reason, notes, action: 'left_without_seen' }), on success: show toast and filter appointment from queue state, on error: show error toast)
- [ ] Add form validation (reason dropdown has required: true rule, notes textarea has maxLength: 200 rule, display validation errors inline)
- [ ] Add button styling (.btn--danger class with background: var(--danger-600), color: white, hover: var(--danger-700), margin-left: 8px)
