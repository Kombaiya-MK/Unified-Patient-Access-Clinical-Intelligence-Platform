# Task - task_002_be_websocket_notification_service

## Requirement Reference
- User Story: us_046
- Story Location: .propel/context/tasks/us_046/us_046.md
- Acceptance Criteria:
    - **AC-1 Real-time Delivery**: WebSocket connection broadcasts notifications to connected clients without page reload    - **AC-1 User-Specific Routing**: Notifications routed to specific users based on user_id (rooms/channels per user)
    - **AC-1 Connection Management**: Handle client connections, disconnections, and reconnections with session recovery
- Edge Case:
    - **Connection Drop**: On disconnection, track last active timestamp; on reconnection, allow client to fetch missed notifications via REST API

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Backend service task) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Wireframe Status Legend:**
> - **N/A**: Backend WebSocket service task, no UI impact

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Backend task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Framework | Express | latest |
| WebSocket | Socket.io | latest |
| Authentication | JWT (verify tokens) | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

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
Implement WebSocket notification service using Socket.io for real-time notification delivery to authenticated clients. The service creates user-specific rooms (one per user_id) for targeted notification broadcasting, handles client connections/disconnections with session tracking, and integrates with JWT authentication middleware to verify client identity. When a notification event occurs (appointment status change, medication conflict, system alert), the service broadcasts the notification JSON payload to all connected clients in the target user's room. Implements connection management: track last active timestamp on disconnect to enable missed notification sync, handle reconnection gracefully, and maintain connection pool monitoring. Service exposes `broadcastNotification(userId, notificationData)` method for other backend services to trigger notifications.

## Dependent Tasks
- task_001_fe_notification_ui_components (consumes WebSocket events)
- task_003_be_notification_rest_api (provides missed notification fetching after reconnection)
- task_004_db_notifications_schema (stores notification data)
- US-012 (JWT authentication for WebSocket connection verification)

## Impacted Components
- **NEW**: `server/src/services/websocketService.ts` - Main WebSocket service with Socket.io server initialization
- **NEW**: `server/src/middleware/websocketAuth.ts` - JWT authentication middleware for WebSocket handshake
- **NEW**: `server/src/controllers/notificationBroadcast.ts` - Controller with broadcastNotification method for other services
- **NEW**: `server/src/utils/socketRoomManager.ts` - Utility for managing user rooms (join, leave, get active users)
- **MODIFY**: `server/src/server.ts` - Initialize Socket.io server alongside Express HTTP server
- **MODIFY**: `server/src/app.ts` - Export Express app for Socket.io integration

## Implementation Plan
1. **Install Socket.io**: Add socket.io dependency, initialize Socket.io server attached to HTTP server instance
2. **Create websocketAuth middleware**: Verify JWT token from WebSocket handshake query param (`?token=xxx`) using existing JWT verification logic, attach userId to socket.data
3. **Implement websocketService**: Initialize io instance, configure CORS (allow frontend origin), handle "connection" event, implement "user_join" event handler (join user to room `user:${userId}`), handle "disconnect" event (track last active timestamp)
4. **Build socketRoomManager utility**: `joinUserRoom(socket, userId)`: join socket to room, `leaveUserRoom(socket, userId)`: leave room, `getActiveUsersInRoom(userId)`: return socket count
5. **Create notificationBroadcast controller**: `broadcastNotification(userId, notificationData)`: emit "notification" event to room `user:${userId}` with payload { id, type, title, message, priority, timestamp, actionUrl }
6. **Integrate with Express**: Attach Socket.io to HTTP server in server.ts, expose io instance globally or via dependency injection for other services to call broadcastNotification
7. **Add connection logging**: Log connection events (userId, socketId, timestamp) for monitoring, track active connections count, log disconnections with duration
8. **Implement reconnection handling**: On reconnect, identify user via JWT token, re-join user to room, client fetches missed notifications via REST API using last disconnect timestamp
9. **Add error handling**: Handle invalid JWT tokens (disconnect with error message), malformed events (log warning, ignore), connection rate limiting (max 5 connections per user)
10. **Test WebSocket flow**: Use Postman/wscat to connect with valid JWT token, emit "user_join" event, trigger notification from backend, verify "notification" event received by client

**Focus on how to implement**:
- Socket.io initialization: `import { Server } from 'socket.io'; const io = new Server(httpServer, { cors: { origin: 'http://localhost:5173' } });`
- JWT verification: `socket.use((socket, next) => { const token = socket.handshake.query.token; jwt.verify(token, SECRET, (err, decoded) => { if (err) return next(new Error('Authentication error')); socket.data.userId = decoded.userId; next(); }); });`
- User room join: `socket.on('user_join', ({ userId }) => { socket.join(\`user:\${userId}\`); console.log(\`User \${userId} joined room\`); });`
- Broadcast notification: `io.to(\`user:\${userId}\`).emit('notification', notificationData);`
- Disconnect tracking: `socket.on('disconnect', () => { const userId = socket.data.userId; const timestamp = Date.now(); // Store in Redis or in-memory map });`
- Connection limit: `const userSockets = io.sockets.adapter.rooms.get(\`user:\${userId}\`)?.size || 0; if (userSockets >= 5) { socket.disconnect(); }`

## Current Project State
```
server/src/
├── services/
│   └── (to create: websocketService.ts)
├── middleware/
│   └── (to create: websocketAuth.ts)
├── controllers/
│   └── (to create: notificationBroadcast.ts)
├── utils/
│   └── (to create: socketRoomManager.ts)
├── server.ts (to modify: initialize Socket.io)
└── app.ts (to modify: export app for Socket.io)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/websocketService.ts | WebSocket service: Initialize io with Socket.io, configure CORS, handle "connection" event, implement "user_join" handler (join room user:userId), "disconnect" handler (log timestamp), expose io instance |
| CREATE | server/src/middleware/websocketAuth.ts | Middleware: Verify JWT token from socket.handshake.query.token, decode to extract userId, attach to socket.data.userId, disconnect on invalid token with error message |
| CREATE | server/src/controllers/notificationBroadcast.ts | Controller: broadcastNotification(userId, notificationData) method, io.to(\`user:\${userId}\`).emit('notification', data), handle errors (log warning if room empty) |
| CREATE | server/src/utils/socketRoomManager.ts | Utility: joinUserRoom(socket, userId), leaveUserRoom(socket, userId), getActiveUsersInRoom(userId) returns socket count, listActiveUsers() returns all user IDs with active connections |
| MODIFY | server/src/server.ts | Initialize Socket.io: const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_URL } }); import websocketService and initialize with io instance |
| MODIFY | server/src/app.ts | Export Express app for HTTP server creation: export default app; (if not already exporting) |

## External References
- **Socket.io Server API**: https://socket.io/docs/v4/server-api/ (Server initialization, rooms, event handling)
- **Socket.io Authentication**: https://socket.io/docs/v4/middlewares/#sending-credentials (JWT token verification in handshake)
- **Socket.io Rooms**: https://socket.io/docs/v4/rooms/ (Room-based broadcasting for user-specific notifications)
- **JWT Verification**: https://www.npmjs.com/package/jsonwebtoken (jwt.verify() for token validation)
- **Node.js HTTP Server**: https://nodejs.org/api/http.html (HTTP server for Socket.io attachment)
- **UC-014 Spec**: .propel/context/docs/spec.md#UC-014 (Dashboard notifications use case)

## Build Commands
```bash
# Install Socket.io
cd server
npm install socket.io

# Development server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Implementation Checklist
- [x] Install socket.io dependency and initialize Socket.io server attached to HTTP server in server.ts with CORS configuration (allow frontend origin)
- [x] Create websocketAuth middleware to verify JWT token from socket.handshake.query.token, decode userId, attach to socket.data.userId, disconnect on invalid token
- [x] Implement websocketService with io instance, handle "connection" event, implement "user_join" event handler (join socket to room user:userId), "disconnect" handler (log last active timestamp)
- [x] Build socketRoomManager utility with joinUserRoom, leaveUserRoom, getActiveUsersInRoom (return socket count), listActiveUsers (return all active user IDs)
- [x] Create notificationBroadcast controller with broadcastNotification(userId, notificationData) method using io.to(\`user:\${userId}\`).emit('notification', data)
- [x] Add connection logging (userId, socketId, timestamp), track active connection count, log disconnections with duration, implement connection rate limiting (max 5 per user)
- [x] Integrate Socket.io with Express HTTP server in server.ts, expose io instance globally or via dependency injection for other services to trigger notifications
- [x] Test WebSocket flow: Connect with valid JWT token, emit user_join, trigger notification from backend, verify client receives "notification" event, test reconnection handling
