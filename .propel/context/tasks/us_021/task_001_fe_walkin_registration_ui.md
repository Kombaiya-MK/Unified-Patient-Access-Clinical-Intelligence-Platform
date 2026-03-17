# Task - TASK_001_FE_WALKIN_REGISTRATION_UI

## Requirement Reference
- User Story: US_021
- Story Location: `.propel/context/tasks/us_021/us_021.md`
- Acceptance Criteria:
    - AC1: "Register Walk-in" button on queue page opens quick registration form (name, phone, DOB, chief complaint, preferred provider), creates same-day appointment with status="Walk-in", displays in queue with yellow badge
- Edge Cases:
    - Existing patient: Search by phone/DOB, auto-fill details, link to existing record
    - Prioritization: Walk-ins added to end of queue, urgent checkbox moves to front
    - Fully booked: Calculate wait time, offer next available slot

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-009 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-staff-queue-management.html |
| **Screen Spec** | SCR-009 (Queue management page), SCR-003 (Staff dashboard) |
| **UXR Requirements** | UXR-001 (Quick registration <3 clicks), UXR-501 (Inline validation), UXR-103 (Keyboard navigation) |
| **Design Tokens** | Register button: secondary (outlined), Walk-in badge: #FFC107 yellow, Urgent badge: #DC3545 red, Modal: 600px width |

> **Wireframe Components:**
> - Register Walk-in button: Top-right of queue page, outlined style, user-plus icon
> - Modal form: Name (text), Phone (masked ###-###-####), DOB (date picker), Chief Complaint (textarea 200 chars), Preferred Provider (dropdown), Urgent (checkbox)
> - Queue entry: Yellow "Walk-in" badge, name, chief complaint preview, estimated wait time

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | Formik | 2.x |
| Frontend | Yup | 1.x |
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
Implement walk-in registration UI: (1) "Register Walk-in" button on staff queue page, (2) Modal with quick form (Formik + Yup validation), (3) Patient search (phone/DOB lookup), auto-fill if existing patient, (4) Submit calls POST /api/walk-ins endpoint, (5) Success → adds to queue list with "Walk-in" yellow badge + estimated wait time, (6) Displays success toast "Walk-in registered. Estimated wait: X min. SMS sent.", (7) Urgent checkbox moves to front of queue, (8) Fully booked → shows wait time warning, (9) Real-time queue update via WebSocket.

## Dependent Tasks
- US_020: Staff queue management UI (queue list component)
- US_021 Task 002: Walk-in registration API endpoint (POST /api/walk-ins)

## Impacted Components
**New:**
- app/src/components/WalkInRegistrationModal.tsx (Modal form)
- app/src/components/WalkInBadge.tsx (Yellow badge component)
- app/src/hooks/useWalkInRegistration.ts (POST mutation)

**Modified:**
- app/src/pages/StaffQueue.tsx (Add "Register Walk-in" button)
- app/src/services/appointmentService.ts (Add registerWalkIn method)

## Implementation Plan
1. Create WalkInRegistrationModal: Form with Formik, fields (name, phone, DOB, chiefComplaint, preferredProviderId, isUrgent)
2. Phone validation: Yup schema with regex ^\d{3}-\d{3}-\d{4}$, masked input
3. Patient search: On phone/DOB blur → call GET /api/patients/search → if found, auto-fill
4. Implement useWalkInRegistration hook: POST /api/walk-ins mutation
5. Success handling: Close modal, show toast with wait time, queue updates via WebSocket
6. Add "Register Walk-in" button to StaffQueue page: Top-right, opens modal
7. Render WalkInBadge: Yellow pill with "Walk-in" text on queue list entries
8. Test: Register new walk-in → verify added to queue with badge

## Current Project State
```
ASSIGNMENT/app/src/
├── pages/StaffQueue.tsx (to be modified)
├── components/ (booking components exist)
└── (walk-in components to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/WalkInRegistrationModal.tsx | Modal form with Formik validation |
| CREATE | app/src/components/WalkInBadge.tsx | Yellow badge component |
| CREATE | app/src/hooks/useWalkInRegistration.ts | POST mutation hook |
| UPDATE | app/src/pages/StaffQueue.tsx | Add "Register Walk-in" button |
| UPDATE | app/src/services/appointmentService.ts | Add registerWalkIn method |

## External References
- [Formik Documentation](https://formik.org/docs/overview)
- [react-input-mask (Phone masking)](https://www.npmjs.com/package/react-input-mask)
- [FR-005 Walk-in Registration](../../../.propel/context/docs/spec.md#FR-005)
- [UC-007 Walk-in Check-in Flow](../../../.propel/context/docs/spec.md#UC-007)

## Build Commands
```bash
cd app
npm install react-input-mask
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: WalkInRegistrationModal validates phone format
- [ ] Integration tests: Register walk-in → appears in queue list
- [ ] Modal opens: Click "Register Walk-in" button → modal displays
- [ ] Form validation: Submit empty → required field errors
- [ ] Phone masking: Type numbers → formatted as ###-###-####
- [ ] Patient search: Enter existing phone → auto-fills name/DOB
- [ ] Chief complaint char limit: Type 201 chars → shows "200 max" error
- [ ] Provider dropdown: Lists providers for selected department
- [ ] Urgent checkbox: Check urgent → moves to front of queue
- [ ] Submit success: Register → modal closes, green toast, queue updated with walk-in badge
- [ ] Wait time display: Queue entry shows "Estimated wait: 45 min"
- [ ] Responsive: Test on mobile (375px) → form fields stack vertically
- [ ] Keyboard navigation: Tab through fields, Enter to submit
- [ ] WCAG AA: ARIA labels, 4.5:1 contrast, screen reader friendly

## Implementation Checklist
- [ ] Install react-input-mask: `npm install react-input-mask`
- [ ] Create WalkInRegistrationModal.tsx with Formik form
- [ ] Create WalkInBadge.tsx component
- [ ] Create useWalkInRegistration.ts hook
- [ ] Update StaffQueue.tsx: Add button in header
- [ ] Update appointmentService.ts: Add registerWalkIn method
- [ ] Test registration flow end-to-end
- [ ] Validate WCAG AA compliance
- [ ] Document walk-in flow in app/README.md
