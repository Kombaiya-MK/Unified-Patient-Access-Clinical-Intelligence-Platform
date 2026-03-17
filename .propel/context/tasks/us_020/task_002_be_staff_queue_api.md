# Task - TASK_002_BE_STAFF_QUEUE_API

## Requirement Reference
- User Story: US_020
- Story Location: `.propel/context/tasks/us_020/us_020.md`
- Acceptance Criteria:
    - AC1: GET /api/queue returns today's appointments with status tracking
    - AC3: PATCH /api/appointments/:id/start-consultation updates to "In Progress", records start_time
    - AC4: PATCH /api/appointments/:id/complete updates to "Completed", calculates duration, triggers billing workflow
- Edge Cases:
    - Optimistic locking: Simultaneous updates → first wins, second returns 409 "Already updated by [staff name]"
    - Filtering: Query params ?status=Arrived&provider=provider-id&department=dept-id

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
| Backend | Socket.IO | 4.x |
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
Implement staff queue API: (1) GET /api/queue endpoint with filters (date, status, provider, department), returns appointments with JOIN to users + providers tables for patient/provider names, (2) PATCH /api/appointments/:id/start-consultation validates status="Arrived", updates to "In Progress", records start_time, broadcasts via WebSocket, (3) PATCH /api/appointments/:id/complete validates status="In Progress", updates to "Completed", calculates duration (completed_at - start_time), triggers billing notification, broadcasts via WebSocket, (4) Optimistic locking using version column to prevent concurrent updates, (5) Cache queue data in Redis (1-min TTL), invalidate on status changes, (6) Support pagination for high-volume days.

## Dependent Tasks
- US_022 Task 001: WebSocket server (reuse for queue broadcasts)
- US_009 Task 001: JWT auth (requireRole staff/admin)

## Impacted Components
**New:**
- server/src/controllers/queue.controller.ts (Queue endpoints)
- server/src/routes/queue.routes.ts (GET /api/queue, PATCH endpoints)
- server/src/services/queue.service.ts (Business logic)

**Modified:**
- server/db/schema.sql (Add start_time, completed_at, version columns to appointments)
- server/src/websocket/queue.socket.ts (Add broadcast methods)

## Implementation Plan
1. Add columns: ALTER TABLE appointments ADD COLUMN start_time TIMESTAMP, ADD COLUMN completed_at TIMESTAMP, ADD COLUMN version INTEGER DEFAULT 0
2. Implement GET /api/queue: Query appointments for date with filters, JOIN users (patient_name), JOIN providers (provider_name), ORDER BY appointment_datetime, cache in Redis (1-min TTL)
3. Implement PATCH /api/appointments/:id/start-consultation: Validate status="Arrived", check version for optimistic locking, UPDATE status="In Progress", start_time=NOW(), version=version+1, broadcast via WebSocket
4. Implement PATCH /api/appointments/:id/complete: Validate status="In Progress", check version, UPDATE status="Completed", completed_at=NOW(), calculate duration (completed_at - start_time), trigger billing service, broadcast WebSocket
5. Optimistic locking: WHERE id=$1 AND version=$2, returns 0 rows if version mismatch → 409 Conflict
6. WebSocket broadcast: { type: 'STATUS_CHANGE', appointmentId, status, updatedBy: staffName }
7. Cache invalidation: On status change, delete Redis key queue:{date}
8. Test: Two staff mark arrived simultaneously → first succeeds, second gets 409

## Current Project State
```
ASSIGNMENT/server/src/
├── websocket/queue.socket.ts (from US_022)
├── services/appointments.service.ts (booking logic)
└── (queue service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/queue.controller.ts | Queue endpoints |
| CREATE | server/src/routes/queue.routes.ts | GET /api/queue, PATCH routes |
| CREATE | server/src/services/queue.service.ts | Queue business logic |
| UPDATE | server/db/schema.sql | Add start_time, completed_at, version columns |
| UPDATE | server/src/websocket/queue.socket.ts | Add broadcast methods |

## External References
- [Optimistic Locking Pattern](https://www.postgresql.org/docs/current/applevel-consistency.html)
- [Socket.IO Rooms](https://socket.io/docs/v4/rooms/)
- [FR-005 Queue Management](../../../.propel/context/docs/spec.md#FR-005)
- [UXR-403 Real-time <5s](../../../.propel/context/docs/spec.md#UXR-403)

## Build Commands
```bash
cd server
npm run dev

# Test queue fetch
curl -X GET "http://localhost:3001/api/queue?date=2025-01-15&status=Arrived" \
  -H "Authorization: Bearer <staff-token>"

# Test start consultation
curl -X PATCH http://localhost:3001/api/appointments/<id>/start-consultation \
  -H "Authorization: Bearer <staff-token>"
```

## Implementation Validation Strategy
- [ ] Unit tests: queueService filters appointments by status
- [ ] Integration tests: GET /api/queue returns today's appointments
- [ ] version column exists: \d appointments shows version column
- [ ] Queue endpoint protected: Try GET without staff token → 403 Forbidden
- [ ] Fetch queue: GET /api/queue → returns appointments with patient_name, provider_name
- [ ] Filter by status: GET /api/queue?status=Arrived → returns only arrived appointments
- [ ] Filter by provider: GET /api/queue?provider=provider-id → returns only that provider's appointments
- [ ] Start consultation: PATCH /start-consultation → status="In Progress", start_time set
- [ ] Mark completed: PATCH /complete → status="Completed", completed_at set, duration calculated
- [ ] Duration calculation: completed_at - start_time = duration_minutes stored
- [ ] Optimistic locking: Simultaneous updates → first succeeds, second gets 409 with "Already updated"
- [ ] WebSocket broadcast: Status change → all connected clients receive update <5s
- [ ] Cache works: First request caches, second request served from Redis
- [ ] Cache invalidation: Status change → next GET fetches fresh data

## Implementation Checklist
- [ ] Add start_time, completed_at, version columns to appointments
- [ ] Implement queue.service.ts with filtering + optimistic locking
- [ ] Create queue.controller.ts with GET + PATCH handlers
- [ ] Create queue.routes.ts with protected routes
- [ ] Update queue.socket.ts with broadcast methods
- [ ] Mount /api/queue routes in app.ts
- [ ] Test optimistic locking with concurrent updates
- [ ] Document queue API in server/README.md
