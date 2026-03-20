# Task - TASK_004_BE_CACHE_INVALIDATION_STRATEGY

## Requirement Reference
- User Story: US_004  
- Story Location: `.propel/context/tasks/us_004/us_004.md`
- Acceptance Criteria:
    - AC4: Appointment booked or cancelled, database updated, system invalidates related cache keys (time slots for that date/provider) to ensure data consistency
- Edge Cases:
    - Cache TTL expires during multi-step booking: Use optimistic locking, verify slot availability at final booking step

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

> **Note**: Backend cache management - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | ioredis | 5.x |
| Backend | TypeScript | 5.3.x |
| Database | PostgreSQL | 15+ |
| Database | Upstash Redis | Cloud |
| AI/ML | N/A | N/A |

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

> **Note**: Cache invalidation logic - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement comprehensive cache invalidation strategy using pattern-based key deletion, event-driven invalidation on database changes, and optimistic locking for multi-step operations. Ensure data consistency between Redis cache and PostgreSQL database by invalidating affected cache keys when appointments are created, updated, or cancelled. Handle edge cases of TTL expiration during multi-step booking flows with version checking and slot availability verification.

## Dependent Tasks
- TASK_001_BE_REDIS_CONNECTION_SETUP: Redis client configured
- TASK_002_BE_TIME_SLOT_CACHING: Cache keys established
- US_003: Appointments table in database

## Impacted Components
**New:**
- server/src/services/cacheInvalidation.ts (Invalidation logic)
- server/src/services/appointmentService.ts (Booking with cache invalidation)
- server/src/controllers/appointmentController.ts (API handlers)
- server/src/routes/appointments.routes.ts (Booking endpoints)
- server/src/utils/optimisticLock.ts (Version checking for multi-step operations)
- server/src/middleware/transactional.ts (Database + cache atomic operations)
- server/src/events/appointmentEvents.ts (Event emitter for cache invalidation)
- server/src/types/appointment.types.ts (TypeScript interfaces)

**Modified:**
- server/src/routes/index.ts (Register appointment routes)
- server/src/services/timeSlotCache.ts (Add invalidation method)

## Implementation Plan
1. **Invalidation Patterns**: Identify cache keys to invalidate: timeslots:{date}:{providerId}:*, timeslots:{date}:*:{deptId}
2. **Pattern Deletion**: Use Redis SCAN + DEL to delete keys matching patterns (avoid KEYS in production)
3. **Event-Driven Invalidation**: Emit events (appointment.created, appointment.cancelled) → trigger cache invalidation
4. **Booking Service**: When appointment created → update database → invalidate related time slot caches
5. **Cancellation Service**: When appointment cancelled → update database → invalidate caches → return slot to available pool
6. **Optimistic Locking**: Store version/timestamp with cached data, verify unchanged before committing booking
7. **Multi-Step Flow**: Step 1: Cache slot with reservation (5min hold), Step 2: Verify still available, Step 3: Commit booking
8. **Atomic Operations**: Wrap database update + cache invalidation in transaction-like pattern
9. **Partial Invalidation**: Only delete affected cache keys (specific date/provider), not entire cache
10. **Invalidation Logging**: Log all cache invalidations with timestamp, reason, keys deleted for audit trail
11. **Retry Logic**: If cache invalidation fails, log error but don't block booking (eventual consistency)
12. **Background Cleanup**: Optional background job to remove stale cache entries

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002, US_003, US_004 Tasks 1-3)
│   ├── src/
│   │   ├── services/
│   │   │   ├── timeSlotCache.ts  # Caching logic (TASK_002)
│   │   │   └── sessionService.ts # Sessions (TASK_003)
│   │   └── routes/
└── database/                # Appointments table exists
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/cacheInvalidation.ts | invalidateByPattern, invalidateTimeslots, invalidateAppointment |
| CREATE | server/src/services/appointmentService.ts | createAppointment, cancelAppointment with cache invalidation |
| CREATE | server/src/controllers/appointmentController.ts | bookAppointment, cancelAppointment handlers |
| CREATE | server/src/routes/appointments.routes.ts | POST /api/appointments, DELETE /api/appointments/:id |
| CREATE | server/src/utils/optimisticLock.ts | checkVersion, generateVersion for multi-step operations |
| CREATE | server/src/middleware/transactional.ts | Begin/commit pattern for DB + cache operations |
| CREATE | server/src/events/appointmentEvents.ts | EventEmitter for appointment lifecycle events |
| CREATE | server/src/types/appointment.types.ts | Appointment, BookingRequest, CacheVersion interfaces |
| MODIFY | server/src/services/timeSlotCache.ts | Add invalidate(pattern) method using SCAN + DEL |
| MODIFY | server/src/routes/index.ts | Import and register appointments routes |
| CREATE | server/tests/integration/cacheInvalidation.test.ts | Test invalidation on booking/cancellation |

> 2 modified files, 9 new files created

## External References
- [Redis SCAN Command](https://redis.io/commands/scan/) (Avoid KEYS in production)
- [Redis DEL Command](https://redis.io/commands/del/)
- [Optimistic Concurrency Control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
- [Cache Invalidation Strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/Strategies.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Database Transactions](https://www.postgresql.org/docs/15/tutorial-transactions.html)
- [Node.js EventEmitter](https://nodejs.org/api/events.html)

## Build Commands
```bash
# Start development server
cd server
npm run dev

# Test booking (creates appointment + invalidates cache)
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"patientId":1,"doctorId":2,"departmentId":3,"date":"2026-03-20","timeSlotId":5}'
# Expected: {"success":true,"appointmentId":123}

# Check cache invalidated
redis-cli -u $REDIS_URL --tls
KEYS timeslots:2026-03-20:2:*
# Expected: (empty) - cache cleared for that date/provider

# Query time slots again (cache miss, refreshes from DB)
curl "http://localhost:3001/api/timeslots?date=2026-03-20&providerId=2"
# Expected: Response without the booked slot, new cache created

# Test cancellation
curl -X DELETE http://localhost:3001/api/appointments/123 \
  -H "Authorization: Bearer <token>"
# Expected: {"success":true}

# Verify cache invalidated again
# Subsequent query shows slot as available again

# Test multi-step booking with version check
curl -X POST http://localhost:3001/api/appointments/reserve \
  -d '{"timeSlotId":5,"version":"v1"}'
# Step 1: Reserve slot temporarily (5 minutes)

# Wait 6 minutes (TTL expires)

curl -X POST http://localhost:3001/api/appointments/confirm \
  -d '{"timeSlotId":5,"version":"v1"}'
# Expected: 409 Conflict - "Version mismatch, slot no longer available"

# Check invalidation logs
# Server logs: "Cache invalidated: timeslots:2026-03-20:2:3, reason: appointment_created"

# Run integration tests
npm test -- cacheInvalidation.test.ts
```

## Implementation Validation Strategy
- [ ] Unit tests pass (invalidation logic mocking)
- [ ] Integration tests pass (Redis + PostgreSQL + cache invalidation)
- [ ] Booking endpoint created: POST /api/appointments returns 201 Created
- [ ] Appointment saved to database: Query appointments table shows new record
- [ ] Cache invalidated on booking: Related timeslots:* keys deleted from Redis
- [ ] Subsequent queries reflect changes: Booked slot no longer available
- [ ] Cancellation invalidates cache: DELETE appointment → cache cleared
- [ ] Pattern-based deletion works: SCAN finds matching keys, DEL removes them
- [ ] Optimistic locking: Version mismatch → 409 Conflict
- [ ] Multi-step booking: Reserve → wait > TTL → confirm → fails with error
- [ ] Event emission: appointment.created event fired and handled
- [ ] Transactional consistency: Database failure → cache not invalidated (rollback)
- [ ] Partial invalidation: Only affected keys deleted, other cache intact
- [ ] Invalidation logging: Logs show timestamp, pattern, reason, keys deleted
- [ ] Retry on failure: Cache invalidation error logged but booking succeeds

## Implementation Checklist
- [ ] Create server/src/types/appointment.types.ts with interfaces
- [ ] Define Appointment: { id, patientId, doctorId, departmentId, date, timeSlotId, status, version }
- [ ] Define BookingRequest: { patientId, doctorId, departmentId, date, timeSlotId, version? }
- [ ] Define CacheVersion: { version: string, timestamp: number }
- [ ] Create server/src/services/cacheInvalidation.ts
- [ ] Implement invalidateByPattern(pattern: string): use SCAN to find keys, DEL to remove
- [ ] Use cursor-based SCAN: let cursor = '0'; do { [cursor, keys] = await redis.scan(cursor, 'MATCH', pattern) }
- [ ] Delete in batches: if (keys.length > 0) await redis.del(...keys)
- [ ] Implement invalidateTimeslots(date, providerId, deptId): invalidate timeslots:{date}:{providerId}:{deptId}*
- [ ] Implement invalidateAppointment(appointmentId): query appointment details, invalidate related caches
- [ ] Log each invalidation: logger.info(`Invalidated cache: ${pattern}, keys: ${keys.length}`)
- [ ] Create server/src/utils/optimisticLock.ts
- [ ] Implement generateVersion(): return `v${Date.now()}`
- [ ] Implement checkVersion(cachedVersion, providedVersion): return cachedVersion === providedVersion
- [ ] Create server/src/events/appointmentEvents.ts
- [ ] Import EventEmitter from 'events'
- [ ] Export instance: export const appointmentEvents = new EventEmitter()
- [ ] Define event handlers: appointmentEvents.on('appointment.created', (data) => invalidateTimeslots(data.date, data.doctorId, data.departmentId))
- [ ] Create server/src/services/appointmentService.ts
- [ ] Implement createAppointment(bookingRequest): async function
- [ ] Start database transaction: const client = await pool.connect(); await client.query('BEGIN')
- [ ] Insert appointment: await client.query('INSERT INTO appointments (patient_id, doctor_id, ...) VALUES ($1, $2, ...)')
- [ ] Update time slot: await client.query('UPDATE time_slots SET available = false WHERE id = $1')
- [ ] Commit transaction: await client.query('COMMIT')
- [ ] Emit event: appointmentEvents.emit('appointment.created', { date, doctorId, departmentId })
- [ ] Return appointment ID
- [ ] On error: await client.query('ROLLBACK'), throw error
- [ ] Implement cancelAppointment(appointmentId): query appointment, update status to 'cancelled', update time slot to available
- [ ] Emit: appointmentEvents.emit('appointment.cancelled', { date, doctorId, departmentId })
- [ ] Invalidate cache
- [ ] Create server/src/controllers/appointmentController.ts
- [ ] Implement bookAppointment handler: extract booking data from body, validate
- [ ] Call appointmentService.createAppointment(data)
- [ ] Return: res.status(201).json({ success: true, appointmentId })
- [ ] Implement cancelAppointment handler: extract appointmentId from params
- [ ] Call appointmentService.cancelAppointment(appointmentId)
- [ ] Return: res.json({ success: true })
- [ ] Add error handling: 409 for version mismatch, 404 for not found, 500 for server errors
- [ ] Create server/src/routes/appointments.routes.ts
- [ ] Define: router.post('/appointments', authenticate, appointmentController.bookAppointment)
- [ ] Define: router.delete('/appointments/:id', authenticate, appointmentController.cancelAppointment)
- [ ] Export router
- [ ] Modify server/src/services/timeSlotCache.ts
- [ ] Add method: async invalidate(pattern: string): call cacheInvalidation.invalidateByPattern(pattern)
- [ ] Modify server/src/routes/index.ts: import appointments routes, app.use('/api', appointmentsRouter)
- [ ] Test booking: POST /api/appointments → verify appointment created
- [ ] Test cache invalidation: Check Redis → timeslots keys deleted
- [ ] Test subsequent query: GET /api/timeslots → booked slot not in results
- [ ] Test cancellation: DELETE /api/appointments/:id → slot available again
- [ ] Test optimistic locking: Reserve slot with v1, modify DB (change version), confirm with v1 → 409 error
- [ ] Test multi-step TTL expiration: Reserve → wait > 5min → confirm → slot no longer held, 409 error
- [ ] Test transactional rollback: Simulate DB error after cache invalidation → verify cache not cleared
- [ ] Test pattern deletion: SCAN finds 5 matching keys → all deleted
- [ ] Create server/tests/integration/cacheInvalidation.test.ts
- [ ] Test: "should invalidate time slot cache when appointment booked"
- [ ] Test: "should invalidate cache when appointment cancelled"
- [ ] Test: "should use optimistic locking for multi-step booking"
- [ ] Test: "should handle version mismatch in booking flow"
- [ ] Test: "should log all cache invalidations"
- [ ] Run tests: npm test -- cacheInvalidation.test.ts → all pass
