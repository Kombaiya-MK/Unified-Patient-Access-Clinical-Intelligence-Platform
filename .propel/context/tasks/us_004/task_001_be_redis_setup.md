# Task - TASK_001_BE_REDIS_SETUP

## Requirement Reference
- User Story: US_004
- Story Location: `.propel/context/tasks/us_004/us_004.md`
- Acceptance Criteria:
    - AC1: Upstash Redis configured with TLS encryption, successful connection logged
    - AC2: Time slot availability cached with 5-minute TTL, subsequent queries return cached data <100ms
    - AC3: JWT sessions stored in Redis with 15-minute TTL, user_id as key
    - AC4: Cache invalidation on appointment booking/cancellation (invalidate time slots for date/provider)
- Edge Cases:
    - Redis temporarily unavailable: Fallback to direct database queries, log warning, continue with increased latency
    - Cache stampede prevention: Implement cache locking pattern (prevent simultaneous regeneration)
    - Cache TTL expires during multi-step booking: Use optimistic locking, verify slot availability at final step

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

> **Note**: Backend infrastructure - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | ioredis | 5.x |
| Cache | Upstash Redis | Cloud (TLS required) |
| AI/ML | N/A | N/A |

**Note**: All Redis operations MUST use TLS encryption for Upstash

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI implementation - caching infrastructure only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend caching infrastructure

## Task Overview
Configure Upstash Redis with TLS encryption using ioredis library. Implement caching strategies: (1) time slot availability with 5-minute TTL, (2) JWT session management with 15-minute TTL, (3) cache invalidation patterns on appointment CRUD operations. Add fallback to direct database queries if Redis unavailable. Implement cache stampede prevention with distributed locking.

## Dependent Tasks
- US_002: Backend API must be configured
- US_003: Database must be setup (fallback queries)

## Impacted Components
**New:**
- server/src/config/redis.ts (ioredis client configuration with TLS, retry logic)
- server/src/services/cache.service.ts (Cache wrapper with get/set/invalidate methods)
- server/src/utils/cache-lock.ts (Distributed locking for cache stampede prevention)
- server/src/middleware/cache.middleware.ts (Express middleware for caching responses)
- server/.env.example (REDIS_URL, REDIS_TLS=true)

## Implementation Plan
1. **Install ioredis**: `npm install ioredis` for Redis client with TLS support
2. **Get Upstash credentials**: Create free Upstash Redis instance, copy connection URL (rediss://...)
3. **Configure ioredis client**: server/src/config/redis.ts with TLS enabled, retry strategy (3 attempts, exponential backoff)
4. **Implement fallback pattern**: Try-catch around Redis operations, fallback to database on error, log warnings
5. **Create CacheService**: Wrapper class with methods: get(key), set(key, value, ttl), del(key, pattern), invalidateSlots(date, providerId)
6. **Implement time slot caching**: Cache key pattern: `slots:{providerId}:{date}` with 5-minute TTL (300 seconds)
7. **Implement session caching**: Cache key pattern: `session:{userId}:{tokenId}` with 15-minute TTL (900 seconds)
8. **Add cache middleware**: Express middleware to cache GET responses (exclude auth endpoints)
9. **Implement cache invalidation**: On appointment booking/cancellation, call invalidateSlots to clear related cache keys
10. **Implement distributed locking**: Use Redis SETNX for lock acquisition, prevent cache stampede during slot regeneration
11. **Add health check**: GET /api/health includes Redis status (connected/disconnected)
12. **Test fallback**: Stop Redis, verify application continues functioning (logs warnings)

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001)
├── server/               # Backend (US_002) + Database (US_003)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts (exists)
│   │   │   └── (redis.ts to be added)
│   │   ├── services/ (exists)
│   │   ├── middleware/ (exists)
│   │   └── utils/ (exists)
│   └── package.json
└── (Upstash Redis to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/config/redis.ts | ioredis client with TLS, retry logic, fallback handler |
| CREATE | server/src/services/cache.service.ts | CacheService class: get, set, del, invalidateSlots, invalidateSession |
| CREATE | server/src/utils/cache-lock.ts | Distributed locking functions: acquireLock(key), releaseLock(key) |
| CREATE | server/src/middleware/cache.middleware.ts | Express middleware for caching GET responses (exclude /auth/*) |
| UPDATE | server/.env.example | Add REDIS_URL, REDIS_TLS=true |
| UPDATE | server/package.json | Add ioredis dependency |
| UPDATE | server/src/app.ts | Import redis config, add cache middleware |

> Creates 4 new files, updates 3 existing files

## External References
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [ioredis TLS Configuration](https://github.com/redis/ioredis#tls-options)
- [Cache Stampede Prevention](https://en.wikipedia.org/wiki/Cache_stampede)
- [Redis Distributed Locking](https://redis.io/docs/manual/patterns/distributed-locks/)
- [NFR-002 Performance Requirements](../../../.propel/context/docs/spec.md#NFR-002)

## Build Commands
```bash
# Install ioredis
cd server
npm install ioredis

# Create Upstash Redis instance (manual step)
# 1. Go to upstash.com
# 2. Create free Redis database (256MB)
# 3. Enable TLS
# 4. Copy connection URL (starts with rediss://)

# Add to .env
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379
REDIS_TLS=true

# Test connection
npm run dev  # Logs "Redis connected successfully"
```

## Implementation Validation Strategy
- [ ] Unit tests: CacheService methods (get, set, del, invalidateSlots)
- [ ] Integration tests: Redis connection, fallback to DB when Redis down
- [ ] ioredis installed: package.json shows ioredis@5.x
- [ ] Redis connected: `npm run dev` logs "Redis connected successfully"
- [ ] TLS verified: Connection uses rediss:// protocol (TLS enabled)
- [ ] Time slot caching works: Query slots → verify cached (logs "Cache HIT"), query again → returns <100ms
- [ ] Cache TTL respected: Wait 5 minutes → re-query slots → cache regenerated (logs "Cache MISS")
- [ ] Session caching works: Login → JWT stored in Redis with 15-min TTL → verify with `KEYS session:*`
- [ ] Session expires: Wait 15 minutes → API request returns 401 Unauthorized
- [ ] Cache invalidation works: Book appointment → slots cache invalidated → re-query regenerates cache
- [ ] Fallback to DB: Stop Redis → query slots → returns data from DB (slower), logs "Redis unavailable, using database"
- [ ] Distributed locking works: Simulate concurrent requests → only one regenerates cache, others wait for lock
- [ ] Health check shows Redis status: GET /api/health returns {redis: "connected"} or {redis: "disconnected"}

## Implementation Checklist
- [ ] Install ioredis: `npm install ioredis`
- [ ] Create Upstash Redis instance: upstash.com → Create database → Enable TLS → Copy URL
- [ ] Create server/src/config/redis.ts:
  - [ ] Import ioredis: `import Redis from 'ioredis'`
  - [ ] Configure client: `new Redis(process.env.REDIS_URL, { tls: { rejectUnauthorized: false }, retryStrategy: ... })`
  - [ ] Add retry strategy: 3 attempts with exponential backoff (1s, 2s, 4s)
  - [ ] Add connection event handlers: 'connect', 'error', 'close'
  - [ ] Export redis client: `export const redisClient`
- [ ] Create server/src/services/cache.service.ts:
  - [ ] Import redisClient from config/redis
  - [ ] Implement get(key): Try redis.get(key), catch error → return null, log warning
  - [ ] Implement set(key, value, ttl): Try redis.setex(key, ttl, JSON.stringify(value)), catch error → log warning
  - [ ] Implement del(key): Try redis.del(key), catch error → log warning
  - [ ] Implement invalidateSlots(providerId, date): Delete keys matching `slots:{providerId}:{date}`
  - [ ] Implement invalidateSession(userId, tokenId): Delete key `session:{userId}:{tokenId}`
- [ ] Create server/src/utils/cache-lock.ts:
  - [ ] Implement acquireLock(key, ttl): Use redis.set(key, 'locked', 'NX', 'EX', ttl)
  - [ ] Implement releaseLock(key): Use redis.del(key)
  - [ ] Add timeout: Max wait 5 seconds for lock acquisition
- [ ] Create server/src/middleware/cache.middleware.ts:
  - [ ] Check if GET request (skip POST/PUT/DELETE)
  - [ ] Skip auth endpoints: req.path.startsWith('/auth')
  - [ ] Try cache.get(req.url) → if HIT, return cached response
  - [ ] If MISS, proceed to controller, intercept response, cache with 5-min TTL
- [ ] Update server/.env.example: Add REDIS_URL=rediss://..., REDIS_TLS=true
- [ ] Update server/src/app.ts: Import redis config, add cache middleware after morgan
- [ ] Test Redis connection: `npm run dev` → verify "Redis connected successfully" log
- [ ] Test time slot caching:
  - [ ] Query GET /api/timeslots?providerId=X&date=Y → logs "Cache MISS", returns data
  - [ ] Query again → logs "Cache HIT", returns <100ms
  - [ ] Wait 5 minutes → query again → logs "Cache MISS" (TTL expired)
- [ ] Test session caching:
  - [ ] Login → verify JWT stored in Redis: `redis-cli KEYS "session:*"`
  - [ ] Wait 15 minutes → API request→ 401 Unauthorized (session expired)
- [ ] Test cache invalidation:
  - [ ] Book appointment → logs "Cache invalidated for slots:{providerId}:{date}"
  - [ ] Query slots → logs "Cache MISS" (regenerates)
- [ ] Test fallback: Stop Upstash Redis → query slots → returns data (slower), logs "Redis unavailable"
- [ ] Test distributed locking: Simulate 10 concurrent requests → verify only 1 regenerates cache
- [ ] Document Redis setup in server/README.md: Upstash account setup, environment variables, caching strategies used
