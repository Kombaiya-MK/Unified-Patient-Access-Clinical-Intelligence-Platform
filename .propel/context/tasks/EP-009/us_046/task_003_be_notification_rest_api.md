# Task - task_003_be_notification_rest_api

## Requirement Reference
- User Story: us_046
- Story Location: .propel/context/tasks/us_046/us_046.md
- Acceptance Criteria:
    - **AC-1 Missed Notifications**: Fetch missed notifications when client reconnects after being offline using last sync timestamp
    - **AC-2 Mark as Read**: Mark individual notifications or all notifications as read, decrement unread count
    - **AC-3 Notification History**: Paginated notification history (20 per page) with filtering by type/priority
- Edge Case:
    - **Notification Preferences**: User settings endpoint for enabling/disabling notification types per category (appointment, medication, system)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Backend REST API task) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Wireframe Status Legend:**
> - **N/A**: Backend REST API task, no UI impact

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Backend task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Framework | Express | latest |
| Database Client | pg (PostgreSQL) | latest |
| Validation | Zod / Joi | latest |

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
Create RESTful API endpoints for notification management including fetching missed notifications after offline reconnection, marking notifications as read/unread, retrieving paginated notification history, and managing user notification preferences. The API provides `GET /api/notifications/missed?since={timestamp}` endpoint for clients to fetch notifications created after their last sync timestamp (tracked on disconnect). Implements `PUT /api/notifications/:id/read` and `PUT /api/notifications/read-all` for marking notifications as read with unread count updates. Provides `GET /api/notifications` with pagination (limit=20, offset), filtering (type, priority, read_status), and sorting (timestamp DESC). Includes `GET /api/notifications/preferences` and `PUT /api/notifications/preferences` endpoints for per-category notification settings (enable/disable appointment, medication, system alerts).

## Dependent Tasks
- task_001_fe_notification_ui_components (calls REST API endpoints)
- task_002_be_websocket_notification_service (tracks last disconnect timestamp)
- task_004_db_notifications_schema (provides Notifications table and queries)
- US-012 (JWT authentication for API endpoint authorization)

## Impacted Components
- **NEW**: `server/src/routes/notification.routes.ts` - Express router for notification endpoints
- **NEW**: `server/src/controllers/notification.controller.ts` - Controller handling API request/response logic
- **NEW**: `server/src/services/notificationService.ts` - Service implementing business logic for notification management
- **NEW**: `server/src/validators/notification.validator.ts` - Request validation schemas (query params, body)
- **NEW**: `server/src/models/NotificationPreferences.ts` - TypeScript interfaces for notification preferences
- **MODIFY**: `server/src/app.ts` - Register notification routes

## Implementation Plan
1. **Create notification routes**: Define REST endpoints (GET /missed, GET /, GET /:id, PUT /:id/read, PUT /read-all, GET /preferences, PUT /preferences), add authentication middleware, validate request params
2. **Implement notification controller**: Extract query params/body, call notificationService methods, return JSON responses, handle errors (404 not found, 400 bad request, 500 server error)
3. **Build notificationService**: `getMissedNotifications(userId, since)`: query Notifications table WHERE user_id = userId AND created_at > since ORDER BY created_at DESC, `getNotificationHistory(userId, limit, offset, filters)`: paginated query with filtering, `markAsRead(notificationId, userId)`: UPDATE read_status = true WHERE id = notificationId AND user_id = userId, `markAllAsRead(userId)`: UPDATE all unread notifications, `getUnreadCount(userId)`: COUNT(*) WHERE user_id = userId AND read_status = false
4. **Add notification preferences endpoints**: `GET /preferences` returns user's notification settings (JSON object with categories), `PUT /preferences` updates settings (validate boolean values per category: appointment, medication, system)
5. **Implement pagination logic**: Parse limit (default 20, max 100) and offset query params, return total count in response headers (X-Total-Count), include next/prev page URLs in response body
6. **Add filtering and sorting**: Support query params (type, priority, read_status), build dynamic WHERE clauses, default sort by created_at DESC, validate enum values (type: appointment/medication/system/waitlist)
7. **Optimize missed notifications query**: Create index on (user_id, created_at) for fast retrieval, use pagination for large result sets, return metadata (total count, oldest timestamp)
8. **Handle read status updates**: On mark as read, trigger WebSocket broadcast to update frontend badge count in real-time, return updated unread count in response
9. **Add response caching**: Cache unread count in Redis with 60-second TTL, invalidate on mark as read, return cached value for frequent requests
10. **Document API endpoints**: Add OpenAPI/Swagger documentation for all endpoints with request/response schemas, example payloads, error codes

**Focus on how to implement**:
- Route definition: `router.get('/missed', authMiddleware, notificationController.getMissed);`
- Service query: `const notifications = await db.query('SELECT * FROM notifications WHERE user_id = $1 AND created_at > $2 ORDER BY created_at DESC', [userId, since]);`
- Mark as read: `await db.query('UPDATE notifications SET read_status = true, read_at = NOW() WHERE id = $1 AND user_id = $2', [notificationId, userId]);`
- Unread count: `const result = await db.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_status = false', [userId]); return result.rows[0].count;`
- Pagination: `const notifications = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]);`
- Preferences: `const prefs = await db.query('SELECT preferences FROM user_notification_preferences WHERE user_id = $1', [userId]); return prefs.rows[0]?.preferences || { appointment: true, medication: true, system: true };`

## Current Project State
```
server/src/
├── routes/
│   └── (to create: notification.routes.ts)
├── controllers/
│   └── (to create: notification.controller.ts)
├── services/
│   └── (to create: notificationService.ts)
├── validators/
│   └── (to create: notification.validator.ts)
├── models/
│   └── (to create: NotificationPreferences.ts)
└── app.ts (to modify: register routes)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/routes/notification.routes.ts | Express router: GET /api/notifications/missed?since={timestamp}, GET /api/notifications (paginated history), GET /api/notifications/:id, PUT /api/notifications/:id/read, PUT /api/notifications/read-all, GET /api/notifications/preferences, PUT /api/notifications/preferences, authentication middleware on all routes |
| CREATE | server/src/controllers/notification.controller.ts | Controller methods: getMissed(req, res), getHistory(req, res), getById(req, res), markAsRead(req, res), markAllAsRead(req, res), getPreferences(req, res), updatePreferences(req, res), error handling with try-catch, return JSON responses |
| CREATE | server/src/services/notificationService.ts | Service methods: getMissedNotifications(userId, since), getNotificationHistory(userId, limit, offset, filters), getNotificationById(id, userId), markAsRead(notificationId, userId), markAllAsRead(userId), getUnreadCount(userId), getPreferences(userId), updatePreferences(userId, preferences), database queries using parameterized statements |
| CREATE | server/src/validators/notification.validator.ts | Validation schemas: validateMissedQuery (since: ISO timestamp), validateHistoryQuery (limit: number 1-100, offset: number, type: enum, priority: enum, read_status: boolean), validatePreferences (JSON object with boolean values per category) |
| CREATE | server/src/models/NotificationPreferences.ts | TypeScript interfaces: NotificationPreferences { appointment: boolean, medication: boolean, system: boolean, waitlist: boolean }, Notification { id, user_id, type, title, message, priority, read_status, created_at, read_at, action_url } |
| MODIFY | server/src/app.ts | Register notification routes: app.use('/api/notifications', notificationRoutes); after existing routes |

## External References
- **Express Routing**: https://expressjs.com/en/guide/routing.html (Route parameters, query params, middleware)
- **PostgreSQL Pagination**: https://www.postgresql.org/docs/15/queries-limit.html (LIMIT and OFFSET clauses)
- **RESTful API Design**: https://restfulapi.net/ (Best practices for resource naming, HTTP methods, status codes)
- **Zod Validation**: https://zod.dev/ (Schema validation for request params/body)
- **ISO 8601 Timestamps**: https://en.wikipedia.org/wiki/ISO_8601 (Standard date-time format for since parameter)
- **FR-023 Spec**: .propel/context/docs/spec.md#FR-023 (Real-time dashboard notifications requirements)

## Build Commands
```bash
# Development server
cd server
npm run dev

# Run migrations (task_004 database schema)
npm run migrate

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Implementation Checklist
- [x] Create notification routes with authentication middleware: GET /api/notifications/missed?since={timestamp}, GET /api/notifications (paginated), PUT /api/notifications/:id/read, PUT /api/notifications/read-all, GET /preferences, PUT /preferences
- [x] Implement notification controller with request/response handling: extract query params/body, call notificationService methods, return JSON responses with proper status codes (200, 404, 400, 500)
- [x] Build notificationService with database queries: getMissedNotifications (WHERE created_at > since), getNotificationHistory (paginated with filters), markAsRead (UPDATE read_status), markAllAsRead, getUnreadCount (COUNT unread)
- [x] Add pagination logic: parse limit (default 20, max 100) and offset, return total count in X-Total-Count header, include next/prev page URLs in response body
- [x] Implement filtering and sorting: support query params (type, priority, read_status), build dynamic WHERE clauses, default sort by created_at DESC, validate enum values
- [x] Create notification preferences endpoints: GET /preferences returns user settings (JSON object), PUT /preferences updates settings (validate boolean values per category: appointment, medication, system, waitlist)
- [x] Optimize missed notifications query: use index on (user_id, created_at), handle large result sets with pagination, return metadata (total count, oldest timestamp)
- [x] Handle read status updates: trigger WebSocket broadcast to update frontend badge count, return updated unread count in response, cache unread count in Redis with 60s TTL invalidation on updates
