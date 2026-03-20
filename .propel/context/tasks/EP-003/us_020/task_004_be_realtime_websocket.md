# Task - TASK_004: Backend Real-time Updates with WebSocket

## Requirement Reference
- User Story: [us_020]
- Story Location: [.propel/context/tasks/us_020/us_020.md]
- Acceptance Criteria:
    - AC2: Status update triggers real-time update to other staff viewing the same queue (<5s latency)
    - AC2: Real-time notification displays "New patient arrived" or queue change message
- Edge Case:
    - N/A (infrastructure concern for real-time communication)

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
| Backend | Node.js (Express) | 20.x LTS |
| Library | ws (WebSocket) | 8.x |

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
Implement WebSocket server for real-time queue updates with <5s latency. WebSocket endpoint authenticates staff users, broadcasts queue update events when appointment status changes, and maintains connection pool for all connected staff. Integrate with queueController to broadcast updates after successful status changes.

## Dependent Tasks
- TASK_003: Backend Queue API (status update endpoints that trigger WebSocket broadcasts)
- US-009: Authentication middleware for token verification

## Impacted Components
- **CREATE** server/src/services/websocketService.ts - WebSocket server setup and connection management
- **CREATE** server/src/types/websocket.types.ts - TypeScript interfaces for WebSocket messages
- **MODIFY** server/src/server.ts - Initialize WebSocket server alongside Express
- **MODIFY** server/src/controllers/queueController.ts - Broadcast WebSocket events after status updates
- **MODIFY** server/package.json - Add ws and @types/ws dependencies

## Implementation Plan
1. **Install WebSocket Library**: Add ws@8.x and @types/ws dependencies
2. **Create websocket.types.ts**: Define interfaces for `WebSocketMessage`, `QueueUpdateEvent`, `WebSocketClient`
3. **Create websocketService.ts**: Implement WebSocket server:
   - `initWebSocketServer(httpServer)`: Create WebSocket.Server attached to HTTP server
   - `handleConnection(ws, request)`: Authenticate client via token in query params or handshake, add to connection pool, send welcome message
   - `broadcastQueueUpdate(event)`: Send 'queue:update' message to all connected staff clients
   - `handleDisconnect(ws)`: Remove client from connection pool
   - `getConnectedClients()`: Return count of active connections
4. **Implement Authentication**: Extract JWT token from WebSocket upgrade request (query param or Authorization header), verify token using existing authService, only allow staff role connections
5. **Integrate with queueController**: After successful status update in `updateStatus()` handler, call `websocketService.broadcastQueueUpdate()` with event payload: { type: 'status_change', appointmentId, newStatus, staffName, timestamp }
6. **Add Heartbeat/Ping**: Implement ping/pong mechanism to detect dead connections, send ping every 30s, terminate connection if no pong within 10s
7. **Add Error Handling**: Handle WebSocket errors (connection refused, client disconnect), log errors, auto-cleanup stale connections
8. **Add Connection Logging**: Log WebSocket connections/disconnections to audit log for monitoring

**Focus on how to implement**: Use 'ws' library (not Socket.io) for lightweight WebSocket server. Attach WebSocket.Server to existing HTTP server (don't create new port). Authenticate during handshake to prevent unauthorized connections. Broadcast only to staff role users. Message format: JSON with { event: 'queue:update', data: {...} }. Implement connection pool using WeakMap or Set to track active clients.

## Current Project State
```
server/
├── src/
│   ├── server.ts (to be modified - add WebSocket init)
│   ├── controllers/
│   │   └── queueController.ts (TASK_003, to be modified)
│   ├── services/
│   │   ├── authService.ts
│   │   ├── queueService.ts (TASK_003)
│   │   └── (websocketService.ts to be created)
│   ├── types/
│   │   ├── queue.types.ts (TASK_003)
│   │   └── (websocket.types.ts to be created)
│   └── app.ts
└── package.json (to be modified)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/websocketService.ts | WebSocket server setup, connection management, broadcast functions |
| CREATE | server/src/types/websocket.types.ts | TypeScript interfaces: WebSocketMessage, QueueUpdateEvent, WebSocketClient |
| MODIFY | server/src/server.ts | Initialize WebSocket server after HTTP server creation, pass httpServer to websocketService.init() |
| MODIFY | server/src/controllers/queueController.ts | Call websocketService.broadcastQueueUpdate() after successful status update |
| MODIFY | server/package.json | Add dependencies: ws@8.x, @types/ws@8.x |

## External References
- **ws Library Documentation**: https://github.com/websockets/ws - WebSocket library for Node.js
- **WebSocket Authentication**: https://devcenter.heroku.com/articles/websocket-security - Token-based WebSocket auth patterns
- **WebSocket Heartbeat**: https://github.com/websockets/ws#how-to-detect-and-close-broken-connections - Ping/pong implementation
- **Express WebSocket Integration**: https://www.npmjs.com/package/express-ws - Example of WebSocket with Express (reference only, use 'ws' directly)
- **WebSocket Best Practices**: https://ably.com/topic/websockets - Scalability and reliability patterns
- **Node.js WebSocket Server**: https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/ - HTTP server integration

## Build Commands
- Install dependencies: `npm install` (in server directory, installs ws@8.x)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with WebSocket support)
- Run tests: `npm test` (execute WebSocket integration tests)
- Test WebSocket: `wscat -c ws://localhost:3000/queue?token=<jwt>` (requires wscat npm package)

## Implementation Validation Strategy
- [x] Unit tests pass for websocketService
- [x] Integration tests pass: WebSocket connection, authentication, broadcast
- [x] Authentication validation: Unauthenticated connections rejected, non-staff users rejected
- [x] Broadcast validation: Status update triggers WebSocket message to all connected clients
- [x] Latency validation: Message received by clients within 5 seconds of status update
- [x] Heartbeat validation: Dead connections detected and cleaned up within 40 seconds
- [x] Connection pool validation: getConnectedClients() returns accurate count
- [x] Error handling validation: WebSocket errors logged, don't crash server

## Implementation Checklist
- [ ] Install ws@8.x and @types/ws dependencies via npm
- [ ] Create websocket.types.ts with interfaces: WebSocketMessage (event: string, data: any, timestamp: Date), QueueUpdateEvent (type: 'status_change', appointmentId: string, newStatus: string, staffName: string, timestamp: Date), WebSocketClient (ws: WebSocket, userId: string, role: string)
- [ ] Create websocketService.ts with initWebSocketServer(httpServer) function (create new WebSocket.Server({ server: httpServer, path: '/queue' }), handle 'connection' event)
- [ ] Implement handleConnection(ws, request) function (extract token from request.url query params or headers, verify with authService.verifyToken(), check role = 'staff', add to clients Set, send welcome message, setup 'message' and 'close' listeners)
- [ ] Implement broadcastQueueUpdate(event: QueueUpdateEvent) function (iterate clients Set, send JSON message { event: 'queue:update', data: event, timestamp: new Date() } to each ws.send())
- [ ] Implement heartbeat mechanism (setInterval every 30s to send ping to all clients, track pong responses, terminate connections without pong within 10s)
- [ ] Modify server.ts to call websocketService.initWebSocketServer(httpServer) after HTTP server creation (after app.listen())
- [ ] Modify queueController.ts updateStatus handler to call websocketService.broadcastQueueUpdate({ type: 'status_change', appointmentId, newStatus, staffName: req.user.name, timestamp: new Date() }) after successful DB update
