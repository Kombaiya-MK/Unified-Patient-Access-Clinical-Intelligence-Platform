# Task - TASK_004: Frontend Undo No-Show Functionality

## Requirement Reference
- User Story: [us_024]
- Story Location: [.propel/context/tasks/us_024/us_024.md]
- Acceptance Criteria:
    - AC1: Display confirmation after marking no-show
- Edge Case:
    - EC1: Allow staff to revert no-show within 2 hours via "Undo No-Show" button, changes status back to "Arrived"

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html, .propel/context/wireframes/Hi-Fi/wireframe-SCR-011-appointment-management.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-009 |
| **UXR Requirements** | UXR-503 (Handle undo gracefully) |
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
Add "Undo No-Show" button to no-show appointments in queue table or appointment history. Button displayed only when status='no_show' AND no_show_marked_at is within 2 hours from now. Render button with clock icon (ClockIcon or HistoryIcon) and label "Undo", tooltip shows "Undo no-show (available for 2 hours)". On click, show confirmation dialog "Undo No-Show?" with message "This will change the appointment status to Arrived and update the patient's record accordingly", Confirm and Cancel buttons. On confirm, call POST /api/staff/queue/:id/undo-noshow, display success toast "No-show undone. Status changed to Arrived.", update appointment status in UI to "Arrived", handle 400 error "Undo window expired (>2 hours)" with error toast.

## Dependent Tasks
- TASK_002: Backend No-Show Marking API (provides POST undo endpoint)
- TASK_003: Frontend Mark No-Show Button (establishes no-show workflow)
- US_020 TASK_001: Frontend Queue Table UI (base table to enhance)

## Impacted Components
- **MODIFY** app/src/components/queue/QueueActions.tsx - Add "Undo No-Show" button with conditional display
- **CREATE** app/src/components/queue/UndoNoShowModal.tsx - Simple confirmation modal for undo action
- **CREATE** app/src/hooks/useUndoNoShow.ts - Custom hook for undo no-show API call
- **MODIFY** app/src/types/queue.types.ts - Add UndoNoShowResponse type
- **CREATE** app/src/utils/dateUtils.ts - Add isWithinUndoWindow() helper (if doesn't exist from TASK_003)

## Implementation Plan
1. **Modify queue.types.ts**: Add UndoNoShowResponse interface (success: boolean, appointment, message: string)
2. **Create UndoNoShowModal.tsx**: Simple confirmation modal with h3 "Undo No-Show?", paragraph explaining action "This will change the appointment status to Arrived and update the patient's record accordingly", Confirm button (primary style) and Cancel button (secondary), controlled via isOpen prop, onConfirm() and onCancel() callbacks
3. **Create useUndoNoShow hook**: Accept appointmentId, return { undoNoShow: () => Promise, loading, error }, call axios.post(`/api/staff/queue/${appointmentId}/undo-noshow`), on success return response data, on 400 error extract "Undo window expired" message
4. **Create isWithinUndoWindow helper**: Add to dateUtils.ts - function isWithinUndoWindow(markedAt: string | Date): boolean { const markedDate = new Date(markedAt); const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); return markedDate > twoHoursAgo; }
5. **Modify QueueActions.tsx**: Add "Undo No-Show" button conditionally rendered when appointment.status === 'no_show' AND isWithinUndoWindow(appointment.no_show_marked_at), button with ClockIcon/HistoryIcon and label "Undo", tooltip "Undo no-show (available for 2 hours)", onClick opens UndoNoShowModal
6. **Handle Undo Submission**: On modal confirm, call useUndoNoShow.undoNoShow(), show loading spinner, on success close modal + show success toast "No-show undone. Status changed to Arrived." + update appointment in queue table (set status='arrived', clear no_show fields), on 400 error show error toast "Undo window expired (>2 hours)", on other errors show generic error toast
7. **Add Countdown Timer (Optional Enhancement)**: Display remaining undo time next to button "Undo (1h 23m left)" for better UX, update every minute using setInterval
8. **Add Button Styling**: "Undo" button uses warning/secondary color scheme (--warning-600 or --neutral-600), smaller button size, clock icon on left of label

**Focus on how to implement**: Conditional rendering uses computed property: `const canUndo = appointment.status === 'no_show' && isWithinUndoWindow(appointment.no_show_marked_at)`. Time window check: `new Date(no_show_marked_at).getTime() > Date.now() - (2 * 60 * 60 * 1000)`. On success, parent QueueTable updates appointment: `setAppointments(prev => prev.map(a => a.id === appointmentId ? {...a, status: 'arrived', no_show_marked_at: null} : a))`. Tooltip uses Tooltip component with hover/focus trigger. Modal simpler than no-show modal (no form fields, just confirmation). Optional countdown timer: `const minutesLeft = Math.floor((markedAt.getTime() + 2*60*60*1000 - Date.now()) / 60000)`.

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── queue/
│   │   │   ├── QueueTable.tsx (US_020 TASK_001)
│   │   │   ├── QueueActions.tsx (US_020 TASK_002, to be modified)
│   │   │   ├── NoShowConfirmationModal.tsx (US_024 TASK_003)
│   │   │   └── (UndoNoShowModal.tsx to be created)
│   │   └── common/
│   │       ├── Toast.tsx (US_022 TASK_002)
│   │       ├── Modal.tsx (base modal)
│   │       └── Tooltip.tsx (for undo button tooltip)
│   ├── hooks/
│   │   ├── useMarkNoShow.ts (US_024 TASK_003)
│   │   └── (useUndoNoShow.ts to be created)
│   ├── types/
│   │   └── queue.types.ts (to be modified)
│   └── utils/
│       └── dateUtils.ts (to add isWithinUndoWindow, may have isPastThirtyMinutes from TASK_003)
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/queue/UndoNoShowModal.tsx | Simple confirmation modal for undo action with explanation text |
| CREATE | app/src/hooks/useUndoNoShow.ts | Hook calling POST /api/staff/queue/:id/undo-noshow with error handling |
| MODIFY | app/src/components/queue/QueueActions.tsx | Add "Undo No-Show" button with conditional display (status='no_show' AND within 2 hours) |
| MODIFY | app/src/types/queue.types.ts | Add UndoNoShowResponse interface |
| MODIFY | app/src/utils/dateUtils.ts | Add isWithinUndoWindow() helper function |
| MODIFY | app/src/components/queue/QueueTable.tsx | Handle appointment status update on successful undo |

## External References
- **React Conditional Rendering**: https://react.dev/learn/conditional-rendering - Conditional button display patterns
- **Tooltip Components**: https://react-spectrum.adobe.com/react-aria/useTooltip.html - Accessible tooltips
- **Date Calculations**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date - Time difference calculations
- **React Icons**: https://react-icons.github.io/react-icons/ - Clock/History icon components
- **Countdown Timers**: https://www.npmjs.com/package/react-countdown - Optional countdown implementation

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server)
- Run tests: `npm test` (unit tests for undo no-show components)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Unit tests pass for useUndoNoShow hook
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] "Undo No-Show" button appears only for no-show appointments within 2-hour window
- [x] "Undo No-Show" button hidden for no-show appointments older than 2 hours
- [x] Tooltip displays "Undo no-show (available for 2 hours)" on hover
- [x] Confirmation modal displays with clear explanation
- [x] Success toast shows "No-show undone. Status changed to Arrived."
- [x] Appointment status updates to "Arrived" in queue table after undo
- [x] Error toast displays "Undo window expired" for 400 response
- [x] Button styled with clock icon and appropriate colors

## Implementation Checklist
- [ ] Reference wireframes at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html and wireframe-SCR-011-appointment-management.html during implementation
- [ ] Modify queue.types.ts (add UndoNoShowResponse interface with success: boolean, appointment: Appointment, message: string)
- [ ] Modify dateUtils.ts (add isWithinUndoWindow function: export function isWithinUndoWindow(markedAt: string | Date): boolean { const markedDate = new Date(markedAt); const twoHoursLater = markedDate.getTime() + (2 * 60 * 60 * 1000); return Date.now() < twoHoursLater; })
- [ ] Create useUndoNoShow.ts hook (useState for loading/error, undoNoShow async function: axios.post(`/api/staff/queue/${appointmentId}/undo-noshow`) with try/catch, handle 400 "undo window expired" error separately, return {undoNoShow, loading, error})
- [ ] Create UndoNoShowModal.tsx component (props: isOpen, onConfirm, onClose; render h3 "Undo No-Show?", paragraph explaining action, Confirm and Cancel buttons with loading state on confirm)
- [ ] Modify QueueActions.tsx (add undoButton: compute canUndo = status === 'no_show' && isWithinUndoWindow(no_show_marked_at), conditionally render button with canUndo check, ClockIcon from react-icons, label "Undo", Tooltip wrapper with text "Undo no-show (available for 2 hours)", onClick sets showUndoModal=true, secondary/warning button styling)
- [ ] Add undo submission handler (in QueueActions or parent: onConfirm calls useUndoNoShow.undoNoShow(), on success: toast.success("No-show undone. Status changed to Arrived."), call onUpdateAppointment(appointmentId, {status: 'arrived'}), close modal; on 400 error: toast.error("Undo window expired (>2 hours)"); on other errors: toast.error("Failed to undo no-show"))
- [ ] Modify QueueTable.tsx or parent page (add onUpdateAppointment callback that updates appointment: setAppointments(prev => prev.map(a => a.id === appointmentId ? {...a, ...updates} : a)))
- [ ] Add optional countdown timer (compute minutesLeft from no_show_marked_at + 2 hours - now, display in button label "Undo (1h 23m left)", useEffect with setInterval to update every minute)
