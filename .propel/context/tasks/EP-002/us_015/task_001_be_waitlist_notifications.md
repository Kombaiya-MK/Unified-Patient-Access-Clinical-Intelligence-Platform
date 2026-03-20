# Task - TASK_001_BE_WAITLIST_NOTIFICATIONS

## Requirement Reference
- User Story: US_015
- Story Location: `.propel/context/tasks/us_015/us_015.md`
- Acceptance Criteria:
    - AC1: "Join Waitlist" adds to waitlist table, sends confirmation, auto-notifies within 5 min when slot available, holds slot 2 hours
- Edge Cases:
    - Multiple patients on waitlist: First-come-first-served by created_at, notify next if first declines
    - Waitlist expires: Auto-expire after appointment date passes, send reminder 24 hours before
    - No response within 2 hours: Auto-release slot, notify next person

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Button + notifications) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-006 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-006-appointment-booking.html |
| **Screen Spec** | SCR-006 (Booking page with waitlist button), SCR-002 (Dashboard with waitlist section) |
| **UXR Requirements** | UXR-001 (Quick join), UXR-401 (Fast notification <5min) |
| **Design Tokens** | Waitlist button: yellow border, Notification popup: blue banner with action button|

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | node-cron | 3.x |
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
Implement waitlist system: (1) Frontend "Join Waitlist" button on unavailable slots, (2) POST /api/waitlist endpoint, (3) Background cron job checking cancelled appointments every 5 min, (4) Auto-notify first-in-line patient via email + dashboard popup, (5) Hold slot for 2 hours (waitlist_reservation table), (6) Auto-release if no response, notify next person, (7) Expire waitlist entries after appointment date passes. Priority queue by created_at timestamp.

## Dependent Tasks
- US_013 Task 001: Booking UI (add waitlist button)
- US_013 Task 002: Booking API (waitlist endpoint)
- US_016: Notification system (email/dashboard notifications)

## Impacted Components
**New:**
- app/src/components/JoinWaitlistButton.tsx (Frontend button)
- server/src/services/waitlist.service.ts (Backend waitlist logic)
- server/src/jobs/waitlist-processor.ts (Cron job: check cancelled slots, notify waitlist)
- server/db/schema.sql (Add waitlist_reservations table: holds slot temporarily)

## Implementation Plan
1. Add waitlist_reservations table: id, waitlist_id, slot_id, reserved_until (2-hour expiry), status
2. Implement waitlistService: joinWaitlist, notifyWaitlist, releaseReservation, expireWaitlist
3. Create cron job: Run every 5 min, find cancelled appointments, get first waitlist entry, send notification, create reservation
4. Frontend: Add "Join Waitlist" button when slot.isAvailable = false
5. Notification: Email + dashboard popup with "Book Now" link, expires in 2 hours
6. Auto-release: Cron checks reservations > 2 hours old, releases slot, notifies next person
7. Test: Patient A cancels → Patient B (on waitlist) notified < 5 min → books within 2 hours

## Current Project State
```
ASSIGNMENT/
├── app/src/components/ (booking components exist)
├── server/src/
│   ├── services/appointments.service.ts (booking logic exists)
│   └── (waitlist service + cron job to beadded)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/JoinWaitlistButton.tsx | Button component for unavailable slots |
| CREATE | server/src/services/waitlist.service.ts | Waitlist management logic |
| CREATE | server/src/jobs/waitlist-processor.ts | Cron job for auto-notifications |
| CREATE | server/db/waitlist-reservations.sql | Temporary reservation table |
| UPDATE | server/package.json | Add node-cron dependency |

## External References
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [FR-002 Waitlist Management](../../../.propel/context/docs/spec.md#FR-002)

## Build Commands
```bash
cd server
npm install node-cron
npm run dev  # Cron job starts automatically
```

## Implementation Validation Strategy
- [ ] Unit tests: waitlistService.notifyWaitlist sends email + popup
- [ ] Integration tests: Cancel appointment → waitlist patient notified < 5 min
- [ ] Waitlist button visible: Booking page → unavailable slot → see "Join Waitlist"
- [ ] Join waitlist works: Click button → confirmation "You're on the waitlist"
- [ ] Auto-notification: Cancel appointment → verify first waitlist patient emailed < 5 min
- [ ] Reservation created: Notification sent → waitlist_reservations table has row with reserved_until = now + 2 hours
- [ ] Booking within 2 hours: Notified patient books → reservation cleared, waitlist entry removed
- [ ] Auto-release: Wait 2 hours without booking → slot released, next patient notified
- [ ] Priority queue: Multiple waitlist entries → first by created_at notified first
- [ ] Expiry: Waitlist for past appointment → auto-expired by cron job

## Implementation Checklist
- [ ] Install node-cron: `npm install node-cron`
- [ ] Create waitlist_reservations table
- [ ] Implement waitlistService methods
- [ ] Create waitlist-processor.ts cron job (runs every 5 min)
- [ ] Add JoinWaitlistButton UI component
- [ ] Test end-to-end waitlist flow
- [ ] Document waitlist behavior
