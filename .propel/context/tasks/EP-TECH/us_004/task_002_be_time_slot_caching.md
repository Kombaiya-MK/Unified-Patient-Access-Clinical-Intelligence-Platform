# Task - TASK_002_BE_TIME_SLOT_CACHING

## Requirement Reference
- User Story: US_004  
- Story Location: `.propel/context/tasks/us_004/us_004.md`
- Acceptance Criteria:
    - AC2: User queries available time slots, system caches results with 5-minute TTL, subsequent queries return cached data with <100ms response time
- Edge Cases:
    - Cache stampedes during high traffic: Implement cache locking pattern to prevent simultaneous cache regeneration

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

> **Note**: Backend caching logic - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | ioredis | 5.x |
| Backend | Express | 4.x |
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

> **Note**: Caching layer only - no AI features

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement time slot availability caching with Redis using 5-minute TTL, cache key generation based on date/provider/department, and cache-aside pattern with database fallback. Implement cache locking to prevent stampedes during high traffic, ensuring <100ms response time for cached queries. Add performance metrics logging and cache hit/miss tracking.

## Dependent Tasks
- TASK_001_BE_REDIS_CONNECTION_SETUP: Redis client must be configured
- US_003: Database with TimeSlots table must exist

## Impacted Components
**New:**
- server/src/services/timeSlotCache.ts (Cache operations for time slots)
- server/src/services/timeSlotService.ts (Business logic for time slot queries)
- server/src/controllers/timeSlotController.ts (Route handlers)
- server/src/routes/timeSlots.routes.ts (API endpoints)
- server/src/utils/cacheKey.ts (Cache key generation utilities)
- server/src/utils/cacheLock.ts (Distributed locking for stampede prevention)
- server/src/middleware/performanceLogger.ts (Response time tracking)
- server/src/types/timeSlot.types.ts (TypeScript interfaces)

**Modified:**
- server/src/routes/index.ts (Register time slots routes)
- server/src/app.ts (Add performance logging middleware)

## Implementation Plan
1. **Cache Key Strategy**: Design cache keys: `timeslots:{date}:{providerId}:{deptId}` for deterministic lookup
2. **Cache-Aside Pattern**: Check Redis first, if miss → query database → store in Redis with 300s TTL
3. **Time Slot Service**: Create service layer to fetch available time slots from database
4. **Cache Wrapper**: Implement getCachedTimeSlots() that wraps database query with Redis caching
5. **TTL Configuration**: Set 5-minute (300 seconds) expiration using redis.setex()
6. **Cache Locking**: Implement distributed lock using Redis SETNX with 10s timeout to prevent stampedes
7. **Lock Pattern**: On cache miss, acquire lock → query database → cache result → release lock (other requests wait)
8. **Performance Metrics**: Log cache hit/miss ratio, response times, lock wait times
9. **Fallback**: On Redis failure, bypass cache and query database directly
10. **API Endpoint**: Create GET /api/timeslots endpoint with query params (date, providerId, departmentId)
11. **Response Time Target**: Ensure cached responses < 100ms, database fallback < 500ms
12. **Cache Warming**: Optional background job to preload popular time slots

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002, US_003, TASK_001)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts  # PostgreSQL (US_003)
│   │   │   └── redis.ts     # Redis (TASK_001)
│   │   ├── utils/
│   │   │   └── redisClient.ts
│   │   └── routes/
└── database/                # TimeSlots table (US_003)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/timeSlotCache.ts | getCached, setCache, deleteCacheByPattern functions |
| CREATE | server/src/services/timeSlotService.ts | getAvailableTimeSlots(date, providerId, deptId) → query database |
| CREATE | server/src/controllers/timeSlotController.ts | async getTimeSlots(req, res) handler |
| CREATE | server/src/routes/timeSlots.routes.ts | GET /api/timeslots with query validation |
| CREATE | server/src/utils/cacheKey.ts | generateTimeslotKey(date, provider, dept) |
| CREATE | server/src/utils/cacheLock.ts | acquireLock, releaseLock using Redis SETNX, DEL |
| CREATE | server/src/middleware/performanceLogger.ts | Log response time, cache hit/miss to console |
| CREATE | server/src/types/timeSlot.types.ts | TimeSlot, TimeSlotQuery, CacheStats interfaces |
| MODIFY | server/src/routes/index.ts | Import and register timeSlots routes |
| MODIFY | server/src/app.ts | Add performanceLogger middleware globally |
| CREATE | server/tests/integration/timeSlotCache.test.ts | Integration tests for caching behavior |

> 2 modified files, 9 new files created

## External References
- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [Redis SETEX Command](https://redis.io/commands/setex/)
- [Redis SETNX for Locking](https://redis.io/commands/setnx/)
- [Cache Stampede Prevention](https://en.wikipedia.org/wiki/Cache_stampede)
- [Distributed Locking with Redis](https://redis.io/docs/manual/patterns/distributed-locks/)
- [ioredis Pipeline](https://github.com/redis/ioredis#pipeline)
- [Performance Monitoring Best Practices](https://nodejs.org/api/perf_hooks.html)

## Build Commands
```bash
# Install additional dev dependencies (if needed)
cd server
npm install --save-dev supertest @types/supertest

# Start development server
npm run dev

# Test time slots endpoint (no cache)
curl "http://localhost:3001/api/timeslots?date=2026-03-20&providerId=1&departmentId=2"
# Expected: Response time ~200-300ms (database query)

# Test again (with cache)
curl "http://localhost:3001/api/timeslots?date=2026-03-20&providerId=1&departmentId=2"
# Expected: Response time <100ms (cached)

# Check Redis keys
redis-cli -u $REDIS_URL --tls
KEYS timeslots:*
# Expected: timeslots:2026-03-20:1:2

# Check TTL
TTL timeslots:2026-03-20:1:2
# Expected: ~300 seconds (5 minutes)

# Test cache stampede prevention
# Use load testing tool (Apache Bench or Artillery)
ab -n 100 -c 10 "http://localhost:3001/api/timeslots?date=2026-03-20&providerId=1"
# Expected: Only 1 database query, 99 requests wait for cache

# Monitor cache hit ratio
# Check logs for: "Cache hit: 95%, Cache miss: 5%"

# Run integration tests
npm test -- timeSlotCache.test.ts

# Performance profiling
npm run dev
# Make requests, check logs for timing metrics
```

## Implementation Validation Strategy
- [x] Unit tests pass (cache logic mocking)
- [x] Integration tests pass (Redis + PostgreSQL together)
- [x] Time slots endpoint created: GET /api/timeslots returns 200 OK
- [x] Query parameters validated: Missing date → 400 Bad Request
- [x] First request caches data: Check Redis → key exists with TTL ~300s
- [x] Subsequent requests use cache: Response time <100ms
- [x] Cache hit logged: Console shows "Cache HIT: timeslots:2026-03-20:1:2"
- [x] Cache miss logged: Console shows "Cache MISS: timeslots:2026-03-20:1:2, querying database..."
- [x] TTL expires correctly: Wait 5 minutes → key no longer exists in Redis
- [x] Database fallback works: Stop Redis → endpoint still returns data (slower)
- [x] Cache locking prevents stampede: 10 concurrent requests → only 1 database query
- [x] Lock timeout works: Lock held >10s → automatically released
- [x] Performance metrics logged: Request ID, response time, cache status
- [x] Cache key format correct: timeslots:{date}:{providerId}:{deptId}
- [x] Empty results cached: No available slots → still caches empty array with TTL

## Implementation Checklist
- [x] Create server/src/types/timeSlot.types.ts with interfaces: TimeSlot (id, startTime, endTime, available), TimeSlotQuery (date, providerId, departmentId)
- [x] Create server/src/utils/cacheKey.ts with function generateTimeslotKey(date: string, provider: number, dept: number): string
- [x] Return key format: `timeslots:${date}:${provider}:${dept}`
- [x] Create server/src/utils/cacheLock.ts with async function acquireLock(key: string, timeout: number = 10000)
- [x] Implement: const lockKey = `lock:${key}`, acquired = await redis.set(lockKey, '1', 'NX', 'PX', timeout)
- [x] Return true if acquired, false otherwise
- [x] Implement releaseLock: await redis.del(lockKey)
- [x] Create server/src/services/timeSlotService.ts with async getAvailableTimeSlots(date, providerId, deptId)
- [x] Query database: SELECT * FROM time_slots WHERE slot_date = $1 AND doctor_id = $2 AND department_id = $3 AND available = true
- [x] Return TimeSlot[] array
- [x] Create server/src/services/timeSlotCache.ts with async getCachedTimeSlots(query: TimeSlotQuery)
- [x] Generate cache key using cacheKey.generateTimeslotKey()
- [x] Check Redis: const cached = await redis.get(cacheKey)
- [x] If cached: parse JSON, log "Cache HIT", return data
- [x] If miss: log "Cache MISS", acquire lock
- [x] If lock acquired: query database, store in Redis with 300s TTL: await redis.setex(cacheKey, 300, JSON.stringify(data))
- [x] Release lock, return data
- [x] If lock not acquired: wait 100ms, retry check Redis (lock holder will populate cache)
- [x] Wrap in try/catch: on Redis error, fallback to database query directly
- [x] Create server/src/controllers/timeSlotController.ts with async getTimeSlots(req, res)
- [x] Extract query params: const { date, providerId, departmentId } = req.query
- [x] Validate: if (!date || !providerId) return res.status(400).json({ error: 'date and providerId required' })
- [x] Call: const slots = await timeSlotCache.getCachedTimeSlots({ date, providerId, departmentId })
- [x] Return: res.json({ success: true, data: slots, cached: true })
- [x] Create server/src/routes/timeSlots.routes.ts with Express router
- [x] Define: router.get('/timeslots', timeSlotController.getTimeSlots)
- [x] Export router
- [x] Modify server/src/routes/index.ts: import timeSlots routes, app.use('/api', timeSlotsRouter)
- [x] Create server/src/middleware/performanceLogger.ts
- [x] Capture start time: const startTime = Date.now()
- [x] On res.finish: const duration = Date.now() - startTime
- [x] Log: `${req.method} ${req.path} - ${duration}ms`
- [x] Modify server/src/app.ts: import performanceLogger, app.use(performanceLogger)
- [x] Test: Start server, call /api/timeslots → verify response
- [x] Test first call: Check logs for "Cache MISS", verify Redis key created
- [x] Test second call: Check logs for "Cache HIT", verify response <100ms
- [x] Test TTL: redis.ttl(key) → should be ~300, decreases over time
- [x] Test lock: Simulate 10 concurrent requests (use Promise.all), verify only 1 DB query
- [x] Create server/tests/integration/timeSlotCache.test.ts
- [x] Test case: "should cache time slots with 5-minute TTL"
- [x] Test case: "should return cached data on subsequent requests"
- [x] Test case: "should prevent cache stampede with locking"
- [x] Test case: "should fallback to database when Redis unavailable"
- [x] Run tests: npm test -- timeSlotCache.test.ts → all pass
