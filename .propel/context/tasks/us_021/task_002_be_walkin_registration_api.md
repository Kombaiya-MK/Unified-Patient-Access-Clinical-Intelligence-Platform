# Task - TASK_002_BE_WALKIN_REGISTRATION_API

## Requirement Reference
- User Story: US_021
- Story Location: `.propel/context/tasks/us_021/us_021.md`
- Acceptance Criteria:
    - AC1: POST /api/walk-ins creates same-day appointment with status="Walk-in", calculates estimated wait time (avg 15 min per patient), assigns provider, sends SMS, logs to audit
- Edge Cases:
    - Patient already exists: Search by phone/DOB in users table, link to existing patient_id
    - Prioritization: Urgent walk-ins get priority (priority_order=1), normal walk-ins added to end (priority_order=queue_length+1)
    - Fully booked: Calculate wait based on last appointment end time + 15-min buffer

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | Twilio SDK | 4.x |
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
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement walk-in registration endpoint: (1) POST /api/walk-ins accepts {name, phone, dob, chiefComplaint, preferredProviderId, isUrgent}, (2) Search existing patient by phone/DOB, create user if new, (3) Create same-day appointment with status="Walk-in", appointment_datetime=current timestamp, (4) Calculate estimated wait time: count appointments today × 15 min avg, (5) Assign provider (preferred or next available), (6) Set priority_order (urgent=1, normal=max+1), (7) Send SMS via Twilio: "You're checked in. Estimated wait: X min. We'll call your name.", (8) Log to audit, (9) Return appointment with wait time.

## Dependent Tasks
- US_009 Task 001: JWT auth (require staff role)
- US_016 Task 001: Notification service (SMS sending)
- US_020: Queue management (priority_order sorting)

## Impacted Components
**New:**
- server/src/controllers/walkins.controller.ts (Walk-in registration logic)
- server/src/routes/walkins.routes.ts (POST /api/walk-ins)
- server/src/services/walkins.service.ts (Business logic: patient search, wait time calculation)

**Modified:**
- server/db/schema.sql (Add priority_order column to appointments)

## Implementation Plan
1. Add priority_order column: ALTER TABLE appointments ADD COLUMN priority_order INTEGER DEFAULT 0
2. Implement walkinsService.registerWalkIn: Search patient, create user if new, calculate wait time, create appointment
3. Patient search: SELECT FROM users WHERE phone=$1 OR (first_name=$2 AND last_name=$3 AND date_of_birth=$4)
4. Wait time calculation: SELECT COUNT(*) FROM appointments WHERE DATE(appointment_datetime) = CURRENT_DATE AND status IN ('Scheduled', 'Walk-in', 'Arrived') → multiply by 15
5. Provider assignment: If preferredProviderId null, find provider with least appointments today
6. Priority order: If isUrgent, priority_order=1; else SELECT MAX(priority_order)+1 FROM appointments WHERE DATE=today
7. Send SMS: Call notificationService.sendSMS(phone, message)
8. Add POST /api/walk-ins route: requireRole('staff', 'admin'), Joi validation
9. Test: Register walk-in → verify appointment created, SMS sent, audit logged

## Current Project State
```
ASSIGNMENT/server/src/
├── services/appointments.service.ts (booking logic exists)
├── services/notification.service.ts (from US_016, SMS sending)
└── (walk-in service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/walkins.controller.ts | Walk-in registration handler |
| CREATE | server/src/routes/walkins.routes.ts | POST /api/walk-ins route |
| CREATE | server/src/services/walkins.service.ts | Business logic + wait time calculation |
| UPDATE | server/db/schema.sql | Add priority_order column |
| UPDATE | server/src/app.ts | Mount /api/walk-ins routes |

## External References
- [Twilio SMS](https://www.twilio.com/docs/sms/quickstart/node)
- [FR-005 Walk-in Management](../../../.propel/context/docs/spec.md#FR-005)
- [UC-007 Walk-in Check-in Flow](../../../.propel/context/docs/spec.md#UC-007)

## Build Commands
```bash
cd server
npm run dev

# Test walk-in registration
curl -X POST http://localhost:3001/api/walk-ins \
  -H "Authorization: Bearer <staff-token>" \
  -d '{
    "name": "John Doe",
    "phone": "555-123-4567",
    "dob": "1990-01-15",
    "chiefComplaint": "Fever and cough",
    "isUrgent": false
  }' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: walkinsService calculates wait time correctly
- [ ] Integration tests: POST /api/walk-ins creates appointment + sends SMS
- [ ] priority_order column exists: \d appointments shows column
- [ ] Walk-in route protected: Try POST without staff token → 403 Forbidden
- [ ] New patient registration: POST with new phone → user created in users table
- [ ] Existing patient: POST with existing phone → linked to existing patient_id
- [ ] Wait time calculation: 3 appointments today → calculated wait time = 45 min
- [ ] Provider assignment: No preferred provider → assigns provider with least appointments
- [ ] SMS sent: Register walk-in → verify Twilio sends "You're checked in. Estimated wait: X min"
- [ ] Urgent prioritization: Register with isUrgent=true → priority_order=1, appears first in queue
- [ ] Audit logged: Query audit_logs → see action_type='create', resource_type='appointment'
- [ ] Response includes wait time: POST returns { appointment: {...}, estimatedWaitMinutes: 45 }

## Implementation Checklist
- [ ] Add priority_order column to appointments table
- [ ] Create walkins.service.ts with patient search + wait calculation logic
- [ ] Create walkins.controller.ts with registration handler
- [ ] Create walkins.routes.ts with POST /api/walk-ins
- [ ] Mount walk-ins routes in app.ts
- [ ] Test walk-in registration flow
- [ ] Document walk-in API in server/README.md
