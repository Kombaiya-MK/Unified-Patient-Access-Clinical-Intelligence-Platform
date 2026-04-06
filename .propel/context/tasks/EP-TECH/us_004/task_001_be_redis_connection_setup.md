# Task - TASK_001_BE_REDIS_CONNECTION_SETUP

## Requirement Reference

- User Story: US_004
- Story Location: `.propel/context/tasks/us_004/us_004.md`
- Acceptance Criteria:
  - AC1: Upstash Redis credentials configured, backend successfully connects to Redis with TLS encryption, logs connection status
- Edge Cases:
  - Redis temporarily unavailable: Fallback to direct database queries, log warning, application continues functioning with increased latency

## Design References (Frontend Tasks Only)

| Reference Type               | Value |
| ---------------------------- | ----- |
| **UI Impact**          | No    |
| **Figma URL**          | N/A   |
| **Wireframe Status**   | N/A   |
| **Wireframe Type**     | N/A   |
| **Wireframe Path/URL** | N/A   |
| **Screen Spec**        | N/A   |
| **UXR Requirements**   | N/A   |
| **Design Tokens**      | N/A   |

> **Note**: Backend caching infrastructure - no UI

## Applicable Technology Stack

| Layer    | Technology    | Version  |
| -------- | ------------- | -------- |
| Frontend | N/A           | N/A      |
| Backend  | Node.js       | 20.x LTS |
| Backend  | ioredis       | 5.x      |
| Backend  | TypeScript    | 5.3.x    |
| Database | Upstash Redis | Cloud    |
| AI/ML    | N/A           | N/A      |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)

| Reference Type                 | Value |
| ------------------------------ | ----- |
| **AI Impact**            | No    |
| **AIR Requirements**     | N/A   |
| **AI Pattern**           | N/A   |
| **Prompt Template Path** | N/A   |
| **Guardrails Config**    | N/A   |
| **Model Provider**       | N/A   |

> **Note**: Caching infrastructure only - no AI logic

## Mobile References (Mobile Tasks Only)

| Reference Type             | Value |
| -------------------------- | ----- |
| **Mobile Impact**    | No    |
| **Platform Target**  | N/A   |
| **Min OS Version**   | N/A   |
| **Mobile Framework** | N/A   |

> **Note**: Backend API only

## Task Overview

Set up Upstash Redis connection in Express backend using ioredis library with TLS encryption, connection pooling, automatic reconnection, and comprehensive error handling. Implement fallback mechanism to database when Redis is unavailable, ensuring application resilience. Configure health check endpoint and logging for monitoring.

## Dependent Tasks

- US_002: Backend Express API must be configured
- US_003: Database connection must be established (for fallback)

## Impacted Components

**Modified:**

- server/package.json (add ioredis dependency)
- server/.env.example (add Upstash Redis credentials)
- server/src/app.ts (add Redis health check endpoint)

**New:**

- server/src/config/redis.ts (Upstash Redis configuration with TLS)
- server/src/utils/redisClient.ts (Redis client singleton with reconnection logic)
- server/src/utils/redisHealthCheck.ts (Connection validation and fallback detection)
- server/src/middleware/redisAvailable.ts (Middleware to check Redis availability)
- server/src/types/redis.types.ts (TypeScript types for cache operations)
- server/docs/REDIS_SETUP.md (Upstash account setup, configuration guide)

## Implementation Plan

1. **Create Upstash Account**: Sign up at upstash.com, create Redis database, obtain connection URL and token
2. **Install ioredis**: Add ioredis@5.x to server/package.json (supports TLS, Redis 6+ commands)
3. **Redis Configuration**: Create config/redis.ts with Upstash URL, TLS config, retry strategy (3 attempts, exponential backoff)
4. **Redis Client Singleton**: Create redisClient.ts with ioredis instance, connection events (connect, error, close, reconnecting)
5. **TLS Encryption**: Configure tls: { rejectUnauthorized: true } for secure connection to Upstash
6. **Connection Logging**: Log connection status (connected, reconnecting, failed) with timestamps
7. **Health Check**: Create redisHealthCheck.ts to test connection with PING command
8. **Fallback Mechanism**: Implement isRedisAvailable flag, set to false on connection error, enable database fallback
9. **Graceful Degradation**: Wrap all Redis operations in try/catch, fallback to database on error, log warning
10. **Environment Variables**: Add REDIS_URL, REDIS_TOKEN to .env.example
11. **Auto-reconnection**: Configure ioredis retryStrategy for automatic reconnection on disconnect
12. **Health Endpoint**: Add GET /api/health/redis endpoint to check Redis connectivity

## Current Project State

```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002, US_003)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts  # PostgreSQL config (US_003)
│   │   └── server.ts        # Entry point
└── database/                # Database setup (US_003)
```

## Expected Changes

| Action | File Path                               | Description                                                                                |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| MODIFY | server/package.json                     | Add ioredis@5.x dependency                                                                 |
| MODIFY | server/.env.example                     | Add REDIS_URL=rediss://..., REDIS_TOKEN=..., REDIS_TLS=true                                |
| CREATE | server/src/config/redis.ts              | ioredis configuration with Upstash URL, TLS, retry strategy (3 attempts, 1s/2s/4s backoff) |
| CREATE | server/src/utils/redisClient.ts         | Redis client singleton, connection events, isRedisAvailable flag                           |
| CREATE | server/src/utils/redisHealthCheck.ts    | PING test, set isRedisAvailable based on result                                            |
| CREATE | server/src/middleware/redisAvailable.ts | Middleware to check Redis status, attach req.redis = redisClient or null                   |
| CREATE | server/src/types/redis.types.ts         | RedisConfig, CacheKey, CacheOptions interfaces                                             |
| MODIFY | server/src/app.ts                       | Import redisClient, add GET /api/health/redis endpoint                                     |
| MODIFY | server/src/server.ts                    | Call redisHealthCheck() on startup (non-blocking)                                          |
| CREATE | server/docs/REDIS_SETUP.md              | Upstash account creation, database setup, obtaining credentials                            |
| CREATE | server/src/utils/logger.ts              | Winston logger with redis-specific log level (if not exists from US_003)                   |

> 3 modified files, 8 new files created

## External References

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [ioredis GitHub](https://github.com/redis/ioredis)
- [ioredis TLS Configuration](https://github.com/redis/ioredis#tls-options)
- [Redis PING Command](https://redis.io/commands/ping/)
- [Upstash Redis Free Tier](https://upstash.com/pricing)
- [Retry Strategy Best Practices](https://github.com/redis/ioredis#auto-reconnect)
- [Node.js TLS/SSL](https://nodejs.org/api/tls.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

## Build Commands

```bash
# Install ioredis
cd server
npm install ioredis

# Update .env with Upstash credentials
# Get credentials from: https://console.upstash.com/redis/your-database
cp .env.example .env
# Add: REDIS_URL=rediss://your-upstash-endpoint:6379
#      REDIS_TOKEN=your-upstash-token

# Start development server
npm run dev

# Test Redis connection
curl http://localhost:3001/api/health/redis
# Expected: {"status":"ok","redis":"connected","latency":"45ms"}

# Test fallback (simulate Redis down)
# Set invalid REDIS_URL in .env
npm run dev
# Expected: Logs "Redis unavailable, using database fallback"

# Test Redis CLI (using upstash-cli or redis-cli with TLS)
redis-cli -u $REDIS_URL --tls
PING
# Expected: PONG

# Monitor Redis connections
# Upstash Console -> Metrics -> Active Connections

# Production build
npm run build
npm start
```

## Implementation Validation Strategy

- [x] Unit tests pass (Redis client mocking tests)
- [x] Integration tests pass (actual Upstash Redis connection tests)
- [x] ioredis installed: `npm list ioredis` shows version 5.x
- [x] Upstash account created: Console shows active Redis database
- [x] .env file has Redis credentials: REDIS_URL and REDIS_TOKEN set
- [x] Server starts and connects to Redis: Console logs "Redis connected to Upstash"
- [x] TLS encryption enabled: Connection uses rediss:// protocol
- [x] PING command works: redisClient.ping() returns "PONG"
- [x] Health endpoint works: `curl http://localhost:3001/api/health/redis` returns JSON with status
- [x] Connection events logged: Connect, reconnecting, error events logged to console
- [x] Retry strategy works: Disconnect from Upstash → verify 3 retry attempts with exponential backoff
- [x] Fallback to database: Set invalid Redis URL → verify app starts, logs fallback warning
- [x] isRedisAvailable flag: Check flag value when Redis connected (true) vs disconnected (false)
- [x] Graceful degradation: Redis down → API requests still work (slower, using database)
- [x] Auto-reconnection: Temporarily disconnect Redis → verify automatic reconnection after 8s
- [x] No crashes: Redis connection errors don't crash the server

## Implementation Checklist

- [x] Sign up for Upstash account at https://upstash.com
- [x] Create Redis database (Free tier: 10K commands/day, 256MB storage)
- [x] Copy connection URL (rediss://...) and token from Upstash console
- [x] Install ioredis: `npm install ioredis`
- [x] Create server/src/config/redis.ts with RedisConfig interface
- [x] Configure ioredis options: host, port, password (token), tls: { rejectUnauthorized: true }
- [x] Add retryStrategy: (times) => times > 3 ? null : Math.min(times * 1000, 4000)
- [x] Create server/src/utils/redisClient.ts with singleton pattern
- [x] Initialize Redis client: const redis = new Redis(redisConfig)
- [x] Add connection event handlers: redis.on('connect', () => { isRedisAvailable = true; log('Connected') })
- [x] Add error handler: redis.on('error', (err) => { isRedisAvailable = false; log.error(err) })
- [x] Add reconnecting handler: redis.on('reconnecting', () => log.warn('Reconnecting...'))
- [x] Export redisClient and isRedisAvailable flag
- [x] Create server/src/utils/redisHealthCheck.ts with async testConnection()
- [x] Implement PING test: const result = await redisClient.ping(); return result === 'PONG'
- [x] Wrap in try/catch: catch errors, set isRedisAvailable = false, return false
- [x] Create server/src/middleware/redisAvailable.ts
- [x] Check isRedisAvailable flag, attach req.redis = isRedisAvailable ? redisClient : null
- [x] Create server/src/types/redis.types.ts with RedisConfig, CacheKey, CacheOptions interfaces
- [x] Update server/.env.example with REDIS_URL, REDIS_TOKEN, REDIS_TLS=true
- [x] Modify server/src/server.ts: import redisHealthCheck, call await redisHealthCheck() (non-blocking, log result)
- [x] Modify server/src/app.ts: add GET /api/health/redis route
- [x] Implement health endpoint: const start = Date.now(); await redis.ping(); const latency = Date.now() - start; return { status: 'ok', redis: 'connected', latency: `${latency}ms` }
- [x] Add error handling in health endpoint: catch errors, return { status: 'degraded', redis: 'unavailable', fallback: 'database' }
- [x] Test connection with valid credentials: npm run dev → verify "Redis connected" logged
- [x] Test connection with invalid credentials: set wrong token → verify error logged, app continues
- [x] Test health endpoint: curl /api/health/redis → verify latency < 200ms for Upstash
- [x] Test retry strategy: Pause Upstash database → verify 3 retry attempts, then fallback
- [x] Document Upstash setup in REDIS_SETUP.md (sign up, create database, get credentials)
- [x] Add troubleshooting section: TLS errors, connection timeout, authentication failed
- [x] Test with Upstash free tier limits: Verify 10K commands/day sufficient for development
