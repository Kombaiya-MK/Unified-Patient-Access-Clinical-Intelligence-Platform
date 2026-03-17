# Task - TASK_001_BE_ARRIVAL_MARKING_WEBSOCKET

## Requirement Reference
- User Story: US_022
- Story Location: `.propel/context/tasks/us_022/us_022.md`
- Acceptance Criteria:
    - AC1: "Mark Arrived" button updates status to "Arrived", records arrival_time, triggers WebSocket broadcast <5s to all staff viewing queue
- Edge Cases:
    - Duplicate marking: Return "Already marked as arrived at [timestamp]", prevent duplicate updates
    - Late arrival: If arrival_time > appointment_datetime + 15 min, add late_arrival flag
    - Left without seen: "Mark Left Without Being Seen" → status becomes "No Show"

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Staff queue UI integration) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-009 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-staff-queue-management.html |
| **Screen Spec** | SCR-009 (Queue management), SCR-011 (Appointment management) |
| **UXR Requirements** | UXR-403 (Real-time updates <5s via WebSocket) |
| **Design Tokens** | Mark Arrived button: #28A745 green, Status badges: Arrived=#28A745, In Progress=#007BFF, Late badge: #FF9800 orange |

> **Wireframe Components:**
> - Mark Arrived button: Green with checkmark icon, enabled for Scheduled appointments
> - Status badges: Color-coded pills (Scheduled blue, Arrived green, In Progress blue, Completed gray)
> - Late arrival: Orange "Late" badge if >15 min past appointment time
> - Real-time animation: Brief highlight pulse when status changes

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | Socket.IO | 4.x (WebSocket) |
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
Implement arrival marking system: (1) PATCH /api/appointments/:id/arrive endpoint with status update logic, (2) Set status="Arrived", record arrival_time timestamp, (3) Check late arrival (arrival_time > appointment_datetime + 15 min), set late_arrival=true, (4) Prevent duplicate marking (return 400 if already arrived), (5) WebSocket server setup using Socket.IO, (6) Broadcast queue update to all connected staff clients <5s, (7) Frontend integration: "Mark Arrived" button, WebSocket listener for real-time updates, status badge rendering, (8) Log to audit, (9) Support status progression: Scheduled → Arrived → In Progress → Completed.

## Dependent Tasks
- US_020: Staff queue management UI (queue list component)
- US_009 Task 001: JWT auth (require staff role)

## Impacted Components
**New:**
- server/src/websocket/queue.socket.ts (Socket.IO server for queue updates)
- server/src/controllers/arrival.controller.ts (Arrival marking logic)
- server/src/routes/arrival.routes.ts (PATCH /api/appointments/:id/arrive)
- app/src/contexts/SocketContext.tsx (Frontend WebSocket provider)
- app/src/hooks/useQueueSocket.ts (Real-time queue updates)

**Modified:**
- server/db/schema.sql (Add arrival_time, late_arrival columns)
- app/src/pages/StaffQueue.tsx (Add Mark Arrived button, WebSocket integration)

## Implementation Plan
1. Add columns: ALTER TABLE appointments ADD COLUMN arrival_time TIMESTAMP, ADD COLUMN late_arrival BOOLEAN DEFAULT false
2. Install Socket.IO: npm install socket.io socket.io-client
3. Create WebSocket server: server/src/websocket/queue.socket.ts with authentication middleware
4. Implement PATCH /api/appointments/:id/arrive: Validate status=Scheduled, update to Arrived, set arrival_time, check late (>15 min), broadcast via WebSocket
5. Broadcast message: { type: 'QUEUE_UPDATE', appointmentId, status: 'Arrived', arrivalTime }
6. Frontend SocketContext: Connect to ws://localhost:3001/queue, authenticate with JWT
7. Frontend useQueueSocket: Listen for QUEUE_UPDATE, update appointment list via react-query cache
8. Mark Arrived button: Visible for Scheduled appointments, disabled during update
9. Status badges: Render color-coded based on status (Scheduled blue, Arrived green, In Progress blue, Completed gray)
10. Test real-time: Two staff browsers → mark arrived on one → verify updates on second <5s

## Current Project State
```
ASSIGNMENT/
├── app/src/ (queue UI to integrate WebSocket)
├── server/src/
│   ├── services/appointments.service.ts (booking logic exists)
│   └── (WebSocket server + arrival logic to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/websocket/queue.socket.ts | Socket.IO server for queue updates |
| CREATE | server/src/controllers/arrival.controller.ts | Arrival marking handler |
| CREATE | server/src/routes/arrival.routes.ts | PATCH /:id/arrive endpoint |
| CREATE | app/src/contexts/SocketContext.tsx | WebSocket provider |
| CREATE | app/src/hooks/useQueueSocket.ts | Real-time update hook |
| UPDATE | server/db/schema.sql | Add arrival_time, late_arrival columns |
| UPDATE | server/package.json | Add socket.io |
| UPDATE | app/package.json | Add socket.io-client |
| UPDATE | app/src/pages/StaffQueue.tsx | Integrate WebSocket updates |

## External References
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Real-time Queue Updates Pattern](https://socket.io/docs/v4/rooms/)
- [FR-005 Queue Management](../../../.propel/context/docs/spec.md#FR-005)
- [UXR-403 Real-time Updates <5s](../../../.propel/context/docs/spec.md#UXR-403)

## Build Commands
```bash
# Backend
cd server
npm install socket.io
npm run dev

# Frontend
cd app
npm install socket.io-client
npm run dev

# Test arrival marking
curl -X PATCH http://localhost:3001/api/appointments/<id>/arrive \
  -H "Authorization: Bearer <staff-token>"
```

## Implementation Validation Strategy
- [ ] Unit tests: arrivalController validates status before update
- [ ] Integration tests: Mark arrived → status updated + WebSocket broadcast
- [ ] socket.io installed: package.json shows socket.io@4.x
- [ ] arrival_time column exists: \d appointments shows column
- [ ] Arrival endpoint protected: Try PATCH without staff token → 403 Forbidden
- [ ] Mark arrived works: PATCH /appointments/:id/arrive → status="Arrived", arrival_time set
- [ ] Late arrival flagged: Mark arrived 20 min late → late_arrival=true
- [ ] Duplicate prevention: Mark arrived twice → second attempt returns 400 "Already marked arrived at [timestamp]"
- [ ] WebSocket broadcast: Mark arrived → verify message sent to all connected clients <5s
- [ ] Frontend updates: Two browsers open → mark arrived on one → second updates automatically
- [ ] Status badge updates: Arrived appointment shows green "Arrived" badge
- [ ] Audit logged: Query audit_logs → action_type='update', resource_id=appointment_id
- [ ] In Progress transition: Mark Arrived → staff clicks "Start Consultation" → status="In Progress"

## Implementation Checklist
- [ ] Install Socket.IO: Backend + frontend packages
- [ ] Add arrival_time, late_arrival columns to appointments
- [ ] Create queue.socket.ts WebSocket server with auth
- [ ] Implement arrival.controller.ts + arrival.routes.ts
- [ ] Create SocketContext.tsx provider
- [ ] Create useQueueSocket.ts hook
- [ ] Integrate WebSocket updates in StaffQueue.tsx
- [ ] Test real-time updates across multiple clients
- [ ] Document WebSocket architecture in server/README.md
