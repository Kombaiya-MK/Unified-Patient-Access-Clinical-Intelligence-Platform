# Task - TASK_003: Frontend Mark No-Show Button and Confirmation Dialog

## Requirement Reference
- User Story: [us_024]
- Story Location: [.propel/context/tasks/us_024/us_024.md]
- Acceptance Criteria:
    - AC1: Click "Mark No-Show" button, add optional note in dialog, display confirmation "Appointment marked as No Show"
- Edge Case:
    - EC2: Excused no-shows via checkbox in dialog
    - EC3: Handle conflict if patient cancels while staff marking

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html, .propel/context/wireframes/Hi-Fi/wireframe-SCR-011-appointment-management.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-009 |
| **UXR Requirements** | UXR-502 (Clear confirmation dialog), UXR-503 (Handle undo gracefully) |
| **Design Tokens** | .propel/context/docs/designsystem.md#buttons, #modals, #colors |

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
| Frontend | React Hook Form | 7.x |
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
Add "Mark No-Show" button to queue table actions (red button with X icon), conditionally enabled only for appointments where status='scheduled' AND appointment_datetime < NOW() - 30 minutes. Create NoShowConfirmationModal with heading "Mark as No-Show?", optional note textarea (max 500 chars with counter), "Excused No-Show" checkbox (with tooltip explaining it won't affect patient's record), Cancel and Confirm buttons. On confirm, call PATCH /api/staff/queue/:id/mark-noshow, display success toast "Appointment marked as No Show. Patient's risk score updated.", remove appointment from active queue table, handle 409 conflict error with message "Patient cancelled this appointment".

## Dependent Tasks
- TASK_002: Backend No-Show Marking API (provides PATCH endpoint)
- US_020 TASK_001: Frontend Queue Table UI (base table to enhance)
- US_020 TASK_002: Frontend Status Update Actions (actions component pattern)

## Impacted Components
- **MODIFY** app/src/components/queue/QueueActions.tsx - Add "Mark No-Show" button with conditional enablement
- **CREATE** app/src/components/queue/NoShowConfirmationModal.tsx - Modal with note field and excused checkbox
- **CREATE** app/src/hooks/useMarkNoShow.ts - Custom hook for no-show marking API call
- **MODIFY** app/src/types/queue.types.ts - Add NoShowRequest, NoShowResponse types
- **MODIFY** app/src/components/queue/QueueTable.tsx - Update to remove no-show appointments from active queue

## Implementation Plan
1. **Modify queue.types.ts**: Add NoShowRequest interface (appointment_id, notes?: string, excused_no_show?: boolean), NoShowResponse interface (appointment, patient_risk_score, message)
2. **Create NoShowConfirmationModal.tsx**: Modal with h3 "Mark as No-Show?", paragraph "This action will update the patient's record", textarea for notes (label "Reason (optional)", placeholder "e.g., Patient called to say they couldn't make it", maxLength 500 with "X/500" counter), checkbox "Excused No-Show" with question mark tooltip "Excused no-shows won't affect the patient's risk score", Cancel button (secondary) and Confirm button (danger/red), controlled via isOpen prop, onConfirm(notes, excused) callback, onCancel callback
3. **Create useMarkNoShow hook**: Accept appointmentId, return { markNoShow: (notes?, excused?) => Promise, loading, error }, call axios.patch(`/api/staff/queue/${appointmentId}/mark-noshow`, { notes, excused_no_show: excused }), on success return response data, on error handle 409 conflict, 422 "not past 30min yet"
4. **Modify QueueActions.tsx**: Add "Mark No-Show" button (red/danger style, X icon or CloseIcon), compute isEligible = appointment.status === 'scheduled' && isPastThirtyMinutes(appointment.appointment_datetime), button disabled={!isEligible} with tooltip "Available 30 minutes after scheduled time", onClick opens NoShowConfirmationModal
5. **Add Time Check Helper**: Create isPastThirtyMinutes(appointmentTime) utility - returns new Date() > new Date(appointmentTime + 30 minutes)
6. **Handle Modal Submission**: On confirm click in modal, call useMarkNoShow.markNoShow(notes, excused), show loading spinner in modal during request, on success close modal + show success toast "Appointment marked as No Show" + remove from queue table (filter out by id), on error display error message in modal (don't close)
7. **Handle Conflict Error**: If API returns 409, display error toast "Patient cancelled this appointment. Please refresh the queue." and refresh queue data
8. **Add Button Styling**: "Mark No-Show" button uses danger color scheme (--danger-600 background, white text), smaller secondary button style, positioned in actions menu/dropdown

**Focus on how to implement**: Conditional button enablement uses computed property checking both status and time. Time comparison: `Date.now() > new Date(appointment.appointment_datetime).getTime() + (30 * 60 * 1000)`. Modal uses React Hook Form or controlled state for note textarea and checkbox. Character counter updates on change: `{notes.length}/500`. Excused checkbox tooltip uses InfoIcon with hover/focus tooltip component. On success, parent QueueTable component filters appointments: `setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))`. WebSocket update from US_020 TASK_004 broadcasts no-show status change to other staff. Error handling shows inline alert in modal for 422/409 errors instead of closing.

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── queue/
│   │   │   ├── QueueTable.tsx (US_020 TASK_001)
│   │   │   ├── QueueActions.tsx (US_020 TASK_002, to be modified)
│   │   │   ├── QueueStatusBadge.tsx (US_020 TASK_001)
│   │   │   └── (NoShowConfirmationModal.tsx to be created)
│   │   └── common/
│   │       ├── Toast.tsx (US_022 TASK_002)
│   │       ├── Modal.tsx (base modal component)
│   │       └── Tooltip.tsx (may exist for info icon tooltips)
│   ├── hooks/
│   │   ├── useQueueActions.ts (US_020 TASK_002)
│   │   └── (useMarkNoShow.ts to be created)
│   ├── types/
│   │   └── queue.types.ts (to be modified)
│   └── utils/
│       └── (dateUtils.ts to add isPastThirtyMinutes helper)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/queue/NoShowConfirmationModal.tsx | Modal with note textarea (500 char max), excused checkbox, confirm/cancel buttons |
| CREATE | app/src/hooks/useMarkNoShow.ts | Hook calling PATCH /api/staff/queue/:id/mark-noshow with error handling |
| MODIFY | app/src/components/queue/QueueActions.tsx | Add "Mark No-Show" button with conditional enablement (>30min past time) |
| MODIFY | app/src/types/queue.types.ts | Add NoShowRequest, NoShowResponse interfaces |
| CREATE | app/src/utils/dateUtils.ts | Add isPastThirtyMinutes() helper function (if file doesn't exist) |
| MODIFY | app/src/components/queue/QueueTable.tsx | Handle appointment removal from queue on successful no-show marking |

## External References
- **React Modals**: https://react.dev/reference/react-dom/components/dialog - Native dialog element
- **React Hook Form**: https://react-hook-form.com/api/useform - Form handling in modal
- **Character Counter**: https://www.w3schools.com/howto/howto_js_character_count.asp - Textarea character counting
- **Tooltip Components**: https://react-spectrum.adobe.com/react-aria/useTooltip.html - Accessible tooltip patterns
- **Date Manipulation**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date - JavaScript Date API

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for no-show components)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for useMarkNoShow hook
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] "Mark No-Show" button disabled for appointments within 30 minutes of scheduled time
- [x] "Mark No-Show" button enabled for appointments >30 minutes past scheduled time
- [x] Modal displays with note field and excused checkbox
- [x] Character counter updates correctly (X/500 format)
- [x] Excused checkbox tooltip explains "won't affect risk score"
- [x] Success toast shows after marking no-show
- [x] Appointment removed from queue table after successful marking
- [x] Conflict error (409) displays "Patient cancelled this appointment" message

## Implementation Checklist
- [ ] Reference wireframes at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html and wireframe-SCR-011-appointment-management.html during implementation
- [ ] Modify queue.types.ts (add NoShowRequest interface with appointment_id: string, notes?: string, excused_no_show?: boolean; add NoShowResponse interface with appointment, patient_risk_score, message)
- [ ] Create dateUtils.ts isPastThirtyMinutes function (export function isPastThirtyMinutes(appointmentTime: string | Date): boolean { const appointmentDate = new Date(appointmentTime); const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); return appointmentDate < thirtyMinutesAgo; })
- [ ] Create useMarkNoShow.ts hook (useState for loading/error, markNoShow async function: axios.patch with try/catch, handle 409 conflict error separately, return {markNoShow, loading, error})
- [ ] Create NoShowConfirmationModal.tsx component (props: isOpen, appointmentId, patientName, onConfirm, onClose; state for notes and excused; render textarea with maxLength 500 and character counter span, render checkbox with label and InfoIcon tooltip, Cancel and Confirm buttons with loading state)
- [ ] Modify QueueActions.tsx (add markNoShowButton: compute isEligible using isPastThirtyMinutes, render button with disabled={!isEligible}, title/tooltip "Available 30 minutes after appointment time", onClick sets showNoShowModal=true, danger button styling with X icon)
- [ ] Add modal submission handler (in QueueActions or parent: onConfirm calls useMarkNoShow.markNoShow(notes, excused), on success: toast.success("Appointment marked as No Show"), call onRemoveFromQueue(appointmentId), close modal; on error: display error in modal with alert component)
- [ ] Modify QueueTable.tsx or parent page (add onRemoveFromQueue callback prop that filters appointments: setAppointments(prev => prev.filter(a => a.id !== appointmentId)))
- [ ] Add styling for danger button (.btn--danger with background: var(--danger-600), hover: var(--danger-700), color: white)
