# Task - TASK_001_BE_NOSHOW_TRACKING_RISK

## Requirement Reference
- User Story: US_024
- Story Location: `.propel/context/tasks/us_024/us_024.md`
- Acceptance Criteria:
    - AC1: "Mark No-Show" button (available >30 min past appointment time) updates status to "No Show", records timestamp, increments patient's no_show_count, recalculates risk score (+30 points), logs to audit
- Edge Cases:
    - Late arrival: "Undo No-Show" button available for 2 hours, reverts status to "Arrived"
    - Excused no-show: "Excused" checkbox doesn't increment no_show_count or affect risk score
    - Concurrent marking: Patient cancels online while staff marking → detect conflict, prevent duplicate

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Button + confirmation dialog) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-009 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-staff-queue-management.html |
| **Screen Spec** | SCR-009 (Queue Management), SCR-011 (Appointment Management) |
| **UXR Requirements** | UXR-502 (Clear confirmation dialog), UXR-503 (Undo handling) |
| **Design Tokens** | No-Show button: #DC3545 red, Confirmation dialog: warning icon, Undo button: #FF9800 orange with clock icon, Excused checkbox: gray |

> **Wireframe Components:**
> - Mark No-Show button: Red with X icon, enabled only >30 min past time
> - Confirmation dialog: "Mark as No-Show?" heading, Note textarea (optional), "Excused No-Show" checkbox, Cancel + Confirm buttons
> - Undo button: Orange with clock icon, tooltip "Undo (available for 2 hours)", appears on no-show entries
> - Risk indicator: After no-show, patient's future appointments show updated risk badge

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
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
| **Mobile Impact** | Yes (Responsive dialog) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement no-show tracking: (1) PATCH /api/appointments/:id/mark-no-show validates time (>30 min past), updates status="No Show", records no_show_marked_at + marked_by_staff_id, (2) Increment patient's no_show_count in patient_profiles table, (3) Recalculate no-show risk score: current_score + 30 points, cap at 100, (4) If is_excused=true, skip no_show_count increment and risk update, (5) PATCH /api/appointments/:id/undo-no-show validates marked <2 hours ago, reverts status to "Arrived", decrements no_show_count, recalculates risk score -30, (6) Log to audit: action_type='mark_no_show' or 'undo_no_show', includes note if provided, (7) WebSocket broadcast for real-time queue update, (8) Frontend: NoShowConfirmationDialog component, Undo button on queue entries.

## Dependent Tasks
- US_020 Task 002: Queue API (no-show button integration)
- US_038: No-show risk assessment algorithm (risk score calculation)

## Impacted Components
**New:**
- server/src/controllers/no-show.controller.ts (No-show marking handlers)
- server/src/routes/no-show.routes.ts (PATCH mark/undo endpoints)
- server/src/services/no-show.service.ts (Business logic + risk calculation)
- app/src/components/NoShowConfirmationDialog.tsx (Frontend confirmation)
- app/src/components/UndoNoShowButton.tsx (Undo button)

**Modified:**
- server/db/schema.sql (Add no_show_marked_at, marked_by_staff_id, is_excused, undo_deadline columns)
- server/db/schema.sql (Add no_show_count, no_show_risk_score to patient_profiles)

## Implementation Plan
1. Add columns to appointments: no_show_marked_at TIMESTAMP, marked_by_staff_id UUID, is_excused BOOLEAN DEFAULT false, undo_deadline TIMESTAMP
2. Add columns to patient_profiles: no_show_count INTEGER DEFAULT 0, no_show_risk_score INTEGER DEFAULT 0
3. Implement noShowService.markNoShow: Validate time (appointment_datetime + 30 min < NOW()), update status, set no_show_marked_at=NOW(), undo_deadline=NOW()+2 hours, increment no_show_count unless is_excused, update risk_score (+30, cap at 100)
4. Risk score formula: base_score + (no_show_count × 30), capped at 100
5. Implement noShowService.undoNoShow: Validate NOW() < undo_deadline, revert status="Arrived", decrement no_show_count, update risk_score (-30, min 0)
6. Add PATCH /api/appointments/:id/mark-no-show route: requireRole('staff', 'admin'), Joi validation
7. Add PATCH /api/appointments/:id/undo-no-show route: requireRole('staff', 'admin')
8. WebSocket broadcast: { type: 'NO_SHOW_MARKED', appointmentId, riskScore }
9. Frontend: NoShowConfirmationDialog with note textarea + excused checkbox
10. Test: Mark no-show → verify no_show_count incremented, risk_score updated

## Current Project State
```
ASSIGNMENT/server/src/
├── services/appointments.service.ts (booking logic)
└── (no-show service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/no-show.controller.ts | No-show handlers |
| CREATE | server/src/routes/no-show.routes.ts | PATCH mark/undo routes |
| CREATE | server/src/services/no-show.service.ts | No-show logic + risk calc |
| CREATE | app/src/components/NoShowConfirmationDialog.tsx | Confirmation dialog |
| CREATE | app/src/components/UndoNoShowButton.tsx | Undo button component |
| UPDATE | server/db/schema.sql | Add no-show columns to appointments + patient_profiles |

## External References
- [FR-017 No-Show Marking](../../../.propel/context/docs/spec.md#FR-017)
- [UC-011 Staff Mark No Show](../../../.propel/context/docs/spec.md#UC-011)

## Build Commands
```bash
cd server
npm run dev

# Test mark no-show
curl -X PATCH http://localhost:3001/api/appointments/<id>/mark-no-show \
  -H "Authorization: Bearer <staff-token>" \
  -d '{"note": "Did not arrive", "isExcused": false}' \
  -H "Content-Type: application/json"

# Test undo
curl -X PATCH http://localhost:3001/api/appointments/<id>/undo-no-show \
  -H "Authorization: Bearer <staff-token>"
```

## Implementation Validation Strategy
- [ ] Unit tests: noShowService calculates risk score correctly
- [ ] Integration tests: Mark no-show → no_show_count incremented
- [ ] no-show columns exist: \d appointments shows no_show_marked_at, marked_by_staff_id
- [ ] patient_profiles columns exist: no_show_count, no_show_risk_score
- [ ] No-show endpoint protected: Try PATCH without staff token → 403
- [ ] Time validation: Try mark no-show <30 min past → 400 "Too early to mark no-show"
- [ ] Mark no-show: PATCH /mark-no-show → status="No Show", no_show_marked_at set
- [ ] Count incremented: Query patient_profiles → no_show_count incremented by 1
- [ ] Risk score updated: no_show_risk_score = previous + 30 (e.g., 20 → 50)
- [ ] Excused no-show: Mark with isExcused=true → no_show_count unchanged, risk_score unchanged
- [ ] Undo works: PATCH /undo-no-show within 2 hours → status="Arrived", no_show_count decremented, risk_score -30
- [ ] Undo deadline: Try undo after 2 hours → 400 "Undo period expired"
- [ ] Note saved: Mark with note → query appointments.no_show_note
- [ ] WebSocket broadcast: Mark no-show → queue updates in real-time
- [ ] Audit logged: action_type='mark_no_show', includes staff_id, patient_id, note

## Implementation Checklist
- [ ] Add no-show columns to appointments and patient_profiles tables
- [ ] Implement no-show.service.ts with risk calculation
- [ ] Create no-show.controller.ts handlers
- [ ] Create no-show.routes.ts with PATCH routes
- [ ] Create NoShowConfirmationDialog.tsx frontend component
- [ ] Create UndoNoShowButton.tsx component
- [ ] Integrate with queue WebSocket broadcasts
- [ ] Test no-show marking + undo flow
- [ ] Document no-show tracking in server/README.md
