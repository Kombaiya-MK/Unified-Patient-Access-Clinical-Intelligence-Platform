# Task - TASK_004: Frontend Queue Integration for Walk-ins

## Requirement Reference
- User Story: [us_021]
- Story Location: [.propel/context/tasks/us_021/us_021.md]
- Acceptance Criteria:
    - AC1: Walk-in appears in queue list with "Walk-in" yellow badge
    - AC1: Shows estimated wait time, patient name, chief complaint preview
- Edge Case:
    - EC2: Walk-in prioritized vs scheduled - Walk-ins added to end of current time slot queue, urgent walk-ins marked with priority flag move to front

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html |
| **Screen Spec** | .propel/context/docs/figma_spec.md#SCR-009 |
| **UXR Requirements** | UXR-403 (Real-time updates <5s) |
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
Enhance queue table to display walk-in appointments with distinct "Walk-in" yellow badge, show estimated wait time in minutes, display chief complaint preview with truncation, and implement priority sorting (urgent walk-ins first, then scheduled/walk-ins by time). Integrate with existing QueueTable and real-time WebSocket updates.

## Dependent Tasks
- TASK_001: Backend Walk-in Registration API (provides walk-in data with status, wait time, priority flag)
- TASK_003: Frontend Walk-in Registration Form (creates walk-ins that appear in queue)
- US_020 TASK_001: Frontend Queue Table UI (base table structure to enhance)
- US_020 TASK_004: Backend Real-time WebSocket (broadcasts walk-in additions)

## Impacted Components
- **CREATE** app/src/components/queue/WalkinBadge.tsx - Yellow badge for walk-in appointments
- **CREATE** app/src/components/queue/ChiefComplaintPreview.tsx - Truncated chief complaint display with tooltip
- **CREATE** app/src/components/queue/EstimatedWaitTime.tsx - Wait time display component
- **MODIFY** app/src/components/queue/QueueTableRow.tsx - Add walk-in badge, chief complaint, wait time columns
- **MODIFY** app/src/components/queue/QueueTable.tsx - Update column headers for walk-in data
- **MODIFY** app/src/hooks/useQueueData.ts - Add priority sorting (urgent first, then by appointment time)
- **MODIFY** app/src/types/queue.types.ts - Add chiefComplaint, estimatedWaitMinutes, priorityFlag fields to QueueAppointment interface

## Implementation Plan
1. **Create WalkinBadge.tsx**: Yellow badge component displaying "Walk-in" text, uses design tokens for color (--warning-600 background, --warning-100 background light)
2. **Create EstimatedWaitTime.tsx**: Component that displays wait time in format "[X] min wait" if status='Walk-in', otherwise empty
3. **Create ChiefComplaintPreview.tsx**: Component that truncates chief complaint to 50 characters with "..." ellipsis, shows full text in tooltip on hover
4. **Modify queue.types.ts**: Add fields to QueueAppointment interface: `chiefComplaint?: string`, `estimatedWaitMinutes?: number`, `priorityFlag?: boolean`, `appointmentType: 'scheduled' | 'walk-in'`
5. **Modify QueueTableRow.tsx**: Add conditional rendering:
   - Status column: If appointmentType='walk-in', show WalkinBadge next to status badge
   - Add Chief Complaint column: Display ChiefComplaintPreview if chiefComplaint exists
   - Add Wait Time column: Display EstimatedWaitTime if estimatedWaitMinutes exists
6. **Modify QueueTable.tsx**: Add column headers "Chief Complaint" and "Est. Wait" between Status and Provider columns (only visible for relevant rows)
7. **Modify useQueueData.ts**: Implement priority sorting:
   - Sort appointments: priorityFlag=true first, then by appointment_time ASC
   - Filter to include appointments with status IN ('scheduled', 'arrived', 'in_progress', 'walk-in')
8. **Add CSS Styling**: Walk-in badge yellow (#FF8800 background, white text), chief complaint column max-width 200px with ellipsis, wait time right-aligned

**Focus on how to implement**: Walk-in badge uses same styling pattern as status badges but with yellow color scheme. Chief complaint truncation uses CSS text-overflow: ellipsis + title attribute for tooltip (no JS tooltip library needed). Priority sorting ensures urgent walk-ins appear at top of queue regardless of time. Estimated wait time only displays for status='Walk-in', hidden for other statuses.

## Current Project State
```
app/
├── src/
│   ├── pages/
│   │   └── QueueManagementPage.tsx (US_020, has WalkinRegistrationModal from TASK_003)
│   ├── components/
│   │   ├── queue/
│   │   │   ├── QueueTable.tsx (US_020 TASK_001, to be modified)
│   │   │   ├── QueueTableRow.tsx (US_020 TASK_001, to be modified)
│   │   │   ├── QueueStatusBadge.tsx (US_020 TASK_001, exists)
│   │   │   └── (new walk-in components to be created)
│   │   └── walkin/
│   │       └── WalkinRegistrationModal.tsx (TASK_003)
│   ├── hooks/
│   │   ├── useQueueData.ts (US_020 TASK_001, to be modified)
│   │   └── useWalkinRegistration.ts (TASK_003)
│   ├── types/
│   │   ├── queue.types.ts (US_020 TASK_001, to be modified)
│   │   └── walkin.types.ts (TASK_003)
│   └── App.tsx
└── public/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/queue/WalkinBadge.tsx | Yellow badge component displaying "Walk-in" text with warning color scheme |
| CREATE | app/src/components/queue/ChiefComplaintPreview.tsx | Truncated chief complaint display (50 chars) with full text in title tooltip |
| CREATE | app/src/components/queue/EstimatedWaitTime.tsx | Wait time display component "[X] min wait" for walk-in appointments |
| MODIFY | app/src/components/queue/QueueTableRow.tsx | Add WalkinBadge next to status, ChiefComplaintPreview column, EstimatedWaitTime column |
| MODIFY | app/src/components/queue/QueueTable.tsx | Add column headers "Chief Complaint" and "Est. Wait" |
| MODIFY | app/src/hooks/useQueueData.ts | Add priority sorting (priorityFlag=true first, then appointment_time ASC) |
| MODIFY | app/src/types/queue.types.ts | Add chiefComplaint?: string, estimatedWaitMinutes?: number, priorityFlag?: boolean, appointmentType: 'scheduled'|'walk-in' to QueueAppointment |

## External References
- **CSS Text Truncation**: https://css-tricks.com/snippets/css/truncate-string-with-ellipsis/ - Ellipsis overflow pattern
- **React Tooltip**: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title - Native title attribute tooltips
- **Array Sorting**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort - Multi-criteria sorting
- **CSS Badge Design**: https://getbootstrap.com/docs/5.3/components/badge/ - Badge component patterns
- **Conditional Rendering**: https://react.dev/learn/conditional-rendering - React conditional patterns

## Build Commands
- Install dependencies: `npm install` (in app directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start Vite dev server with hot reload)
- Run tests: `npm test` (execute unit tests for walk-in queue components)
- Type check: `npm run type-check` (validate TypeScript without building)

## Implementation Validation Strategy
- [x] Unit tests pass for WalkinBadge, ChiefComplaintPreview, EstimatedWaitTime components
- [x] Visual comparison against wireframe completed at 375px, 768px, 1440px
- [x] Run `/analyze-ux` to validate wireframe alignment
- [x] Walk-in badge displays correctly with yellow color scheme
- [x] Chief complaint truncates to 50 characters, full text shows on hover
- [x] Estimated wait time displays only for walk-in appointments
- [x] Priority sorting: Urgent walk-ins appear first in queue
- [x] Real-time updates: New walk-ins appear in queue via WebSocket within 5 seconds
- [x] Mobile responsive: Chief complaint and wait time columns visible on tablet+

## Implementation Checklist
- [ ] Reference wireframe at .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-queue-management.html during implementation
- [ ] Modify queue.types.ts QueueAppointment interface (add chiefComplaint?: string, estimatedWaitMinutes?: number, priorityFlag?: boolean, appointmentType: 'scheduled'|'walk-in')
- [ ] Create WalkinBadge.tsx component (returns badge with "Walk-in" text, CSS class .badge--walkin with background: var(--warning-600), color: white)
- [ ] Create EstimatedWaitTime.tsx component (props: estimatedWaitMinutes, returns "[X] min wait" formatted text if value exists)
- [ ] Create ChiefComplaintPreview.tsx component (props: chiefComplaint, truncates to 50 chars with "...", adds full text to title attribute for tooltip)
- [ ] Modify QueueTableRow.tsx (add WalkinBadge next to QueueStatusBadge if appointmentType='walk-in', add <td> for ChiefComplaintPreview, add <td> for EstimatedWaitTime)
- [ ] Modify QueueTable.tsx (add <th> headers "Chief Complaint" and "Est. Wait" between Status and Provider columns)
- [ ] Modify useQueueData.ts (add sorting logic: appointments.sort((a, b) => { if (a.priorityFlag && !b.priorityFlag) return -1; if (!a.priorityFlag && b.priorityFlag) return 1; return a.appointmentTime - b.appointmentTime; }))
