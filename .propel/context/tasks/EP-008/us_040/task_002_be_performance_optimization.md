# Task - TASK_002_BE_PERFORMANCE_OPTIMIZATION

## Requirement Reference
- User Story: US_040
- Story Location: .propel/context/tasks/us_040/us_040.md
- Acceptance Criteria:
    - Database queries execute in <100ms for 90% of queries (measured via Prometheus postgres_exporter)
    - Redis cache responds in <10ms average
    - Optimizes slow API endpoints by adding database indexes (covering indexes for appointment queries by date + department_id)
    - Implements query result caching for frequently accessed data (provider schedules cached 5min TTL, patient profiles cached 1min TTL)
    - Optimizes AI API calls by batching requests where possible (medical coding batched for multiple diagnoses in single OpenAI call)
    - Implements connection pooling for PostgreSQL (max 50 connections) and Redis (max 20 connections)
    - Logs all performance metrics to Prometheus with custom metrics (api_request_duration_seconds histogram, active_users gauge, database_query_duration_seconds histogram)
- Edge Case:
    - Load exceeds capacity: Circuit breaker activates to protect database
    - AI API rate limits: Rate limiter queues requests, returns 429 if quota exceeded
    - Redis cache down: Fallback to direct database queries

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
| Backend | Express | 4.18.x |
| Backend | TypeScript | 5.3.x |
| Backend | pg-pool | 3.x (PostgreSQL connection pooling) |
| Backend | ioredis | 5.x (Redis with connection pooling) |
| Backend | opossum | 8.x (Circuit breaker) |
| Backend | prom-client | 15.x (Custom Prometheus metrics) |
| Database | PostgreSQL | 15.x |
| Cache | Redis | 5.x |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (Optimizes AI API calls via batching) |
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
Implement performance optimizations based on load test findings: (1) Create database migration V028 adding performance indexes: covering index on appointments(appointment_date, department_id, status), index on appointments(patient_id, appointment_date DESC), index on patient_profiles(email), composite index on insurance_verifications(patient_id, created_at DESC), (2) Configure PostgreSQL connection pooling: max 50 connections, min 10 connections, idle timeout 30s, connection timeout 5s, (3) Configure Redis connection pooling: max 20 connections, cluster mode support, retry strategy with exponential backoff, (4) Implement query result caching service: CacheService with get/set/invalidate methods, provider schedules cached 5min TTL (key: `schedule:provider:{id}:date:{date}`), patient profiles cached 1min TTL (key: `profile:patient:{id}`), appointment slots cached 2min TTL, cache invalidation on data updates, (5) Optimize AI API calls: Batch medical coding API calls (combine multiple diagnoses in single OpenAI request), implement request queue with rate limiter (10 requests/sec max), exponential backoff on rate limit errors (429), (6) Implement circuit breaker pattern: Use opossum library, protects database and external APIs, opens circuit after 5 consecutive failures, half-open state after 10s timeout, fallback to cached data or graceful error, (7) Add custom Prometheus metrics: database_query_duration_seconds histogram (labels: query_type, table), active_database_connections gauge, redis_cache_hit_rate gauge, redis_cache_miss_rate gauge, ai_api_batch_size histogram, circuit_breaker_state gauge (0=closed, 1=open, 2=half-open), (8) Optimize slow queries identified in load test: Add EXPLAIN ANALYZE output to query logs, rewrite N+1 queries to use JOINs or batch fetching, add database query timeout (5s max).

## Dependent Tasks
- US_040 - TASK_001_INFRA_LOAD_TESTING_SETUP (load test identifies bottlenecks)
- US-005 (Prometheus metrics collection)
- US-004 (Redis caching layer)
- US-003 (PostgreSQL database)

## Impacted Components
- database/migrations/V028__performance_indexes.sql - New migration
- server/src/config/database.config.ts - PostgreSQL pool configuration
- server/src/config/redis.config.ts - Redis pool configuration
- server/src/services/cache.service.ts - Query result caching service
- server/src/services/ai-batch.service.ts - AI API batching service
- server/src/middleware/circuit-breaker.middleware.ts - Circuit breaker middleware
- server/src/config/metrics.ts - Custom Prometheus metrics (extend US-005)
- server/src/middleware/query-logger.middleware.ts - Query performance logging
- server/package.json - Add opossum, ioredis dependencies

## Implementation Plan
1. **Database Migration V028 - Performance Indexes**:
   - CREATE INDEX idx_appointments_date_dept_status ON appointments(appointment_date, department_id, status) WHERE status IN ('scheduled', 'confirmed', 'in_progress')
     - Covering index for common query: "Find appointments by date and department with specific status"
     - Reduces index size by filtering out completed/cancelled appointments
   - CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date DESC)
     - Optimizes patient appointment history queries (sorted by recent)
   - CREATE INDEX idx_patient_profiles_email ON patient_profiles(email)
     - Speeds up login queries (email lookup)
   - CREATE INDEX idx_insurance_verifications_patient_created ON insurance_verifications(patient_id, created_at DESC)
     - Optimizes insurance verification history queries
   - CREATE INDEX idx_clinical_documents_patient_uploaded ON clinical_documents(patient_id, uploaded_at DESC)
     - Optimizes document list queries
   - ANALYZE all tables after index creation
   - Document index rationale in migration comments
2. **PostgreSQL Connection Pooling (database.config.ts)**:
   ```typescript
   import { Pool } from 'pg';
   export const dbPool = new Pool({
     host: process.env.DB_HOST,
     port: parseInt(process.env.DB_PORT || '5432'),
     database: process.env.DB_NAME,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     max: 50,                    // Max 50 connections
     min: 10,                    // Min 10 idle connections
     idleTimeoutMillis: 30000,   // Close idle connections after 30s
     connectionTimeoutMillis: 5000, // Timeout if no connection available in 5s
     maxUses: 7500,              // Close connection after 7500 uses (prevent leaks)
     allowExitOnIdle: true,
     statement_timeout: 5000     // Query timeout 5s
   });
   
   // Connection pool monitoring
   dbPool.on('connect', () => {
     dbConnectionsGauge.inc();
   });
   dbPool.on('remove', () => {
     dbConnectionsGauge.dec();
   });
   dbPool.on('error', (err) => {
     console.error('Database pool error:', err);
   });
   ```
3. **Redis Connection Pooling (redis.config.ts)**:
   ```typescript
   import Redis from 'ioredis';
   export const redisPool = new Redis({
     host: process.env.REDIS_HOST,
     port: parseInt(process.env.REDIS_PORT || '6379'),
     password: process.env.REDIS_PASSWORD,
     maxRetriesPerRequest: 3,
     enableReadyCheck: true,
     lazyConnect: false,
     maxLoadingRetryTime: 3000,
     retryStrategy: (times) => {
       // Exponential backoff: 50ms, 100ms, 200ms, ...
       return Math.min(times * 50, 2000);
     },
     reconnectOnError: (err) => {
       const targetError = 'READONLY';
       if (err.message.includes(targetError)) {
         return true; // Reconnect on READONLY errors
       }
       return false;
     }
   });
   
   // Redis cluster support (if applicable)
   export const redisCluster = new Redis.Cluster([
     { host: 'redis-node-1', port: 6379 },
     { host: 'redis-node-2', port: 6379 }
   ], {
     redisOptions: { password: process.env.REDIS_PASSWORD },
     maxRedirections: 3
   });
   ```
4. **Cache Service (cache.service.ts)**:
   ```typescript
   import { redisPool } from '../config/redis.config';
   
   export class CacheService {
     async get<T>(key: string): Promise<T | null> {
       try {
         const data = await redisPool.get(key);
         if (!data) {
           redisCacheMissGauge.inc();
           return null;
         }
         redisCacheHitGauge.inc();
         return JSON.parse(data);
       } catch (error) {
         console.error('Cache get error:', error);
         return null; // Graceful fallback
       }
     }
     
     async set(key: string, value: any, ttlSeconds: number): Promise<void> {
       try {
         await redisPool.setex(key, ttlSeconds, JSON.stringify(value));
       } catch (error) {
         console.error('Cache set error:', error);
         // Don't throw - cache is optional
       }
     }
     
     async invalidate(pattern: string): Promise<void> {
       try {
         const keys = await redisPool.keys(pattern);
         if (keys.length > 0) {
           await redisPool.del(...keys);
         }
       } catch (error) {
         console.error('Cache invalidate error:', error);
       }
     }
   }
   
   // Usage in controllers:
   // Provider schedule caching (5min TTL)
   async getProviderSchedule(providerId: string, date: string) {
     const cacheKey = `schedule:provider:${providerId}:date:${date}`;
     let schedule = await cacheService.get(cacheKey);
     if (!schedule) {
       schedule = await db.query('SELECT * FROM provider_schedules WHERE provider_id=$1 AND date=$2', [providerId, date]);
       await cacheService.set(cacheKey, schedule, 300); // 5min TTL
     }
     return schedule;
   }
   
   // Patient profile caching (1min TTL)
   async getPatientProfile(patientId: string) {
     const cacheKey = `profile:patient:${patientId}`;
     let profile = await cacheService.get(cacheKey);
     if (!profile) {
       profile = await db.query('SELECT * FROM patient_profiles WHERE id=$1', [patientId]);
       await cacheService.set(cacheKey, profile, 60); // 1min TTL
     }
     return profile;
   }
   
   // Cache invalidation on update
   async updatePatientProfile(patientId: string, data: any) {
     await db.query('UPDATE patient_profiles SET ... WHERE id=$1', [patientId]);
     await cacheService.invalidate(`profile:patient:${patientId}`);
   }
   ```
5. **AI API Batching Service (ai-batch.service.ts)**:
   ```typescript
   import { OpenAI } from 'openai';
   import pLimit from 'p-limit';
   
   export class AIBatchService {
     private queue: Array<{diagnoses: string[], resolve: Function, reject: Function}> = [];
     private batchSize = 10; // Max 10 diagnoses per API call
     private flushInterval = 100; // Flush every 100ms
     private rateLimiter = pLimit(10); // Max 10 concurrent requests
     
     constructor() {
       setInterval(() => this.flush(), this.flushInterval);
     }
     
     async batchMedicalCoding(diagnoses: string[]): Promise<{icd10: string, cpt: string}[]> {
       return new Promise((resolve, reject) => {
         this.queue.push({diagnoses, resolve, reject});
         if (this.queue.length >= this.batchSize) {
           this.flush();
         }
       });
     }
     
     private async flush() {
       if (this.queue.length === 0) return;
       
       const batch = this.queue.splice(0, this.batchSize);
       const allDiagnoses = batch.flatMap(item => item.diagnoses);
       
       try {
         // Single OpenAI API call for multiple diagnoses
         const result = await this.rateLimiter(() => 
           openai.chat.completions.create({
             model: 'gpt-4-turbo',
             messages: [{
               role: 'user',
               content: `Extract ICD-10 and CPT codes for these diagnoses: ${allDiagnoses.join(', ')}`
             }],
             tools: [{type: 'function', function: {name: 'extract_codes', parameters: {...}}}]
           })
         );
         
         // Parse results and distribute to requesters
         const codes = parseMedicalCodes(result);
         batch.forEach((item, idx) => {
           item.resolve(codes[idx]);
         });
         
         aiApiBatchSizeHistogram.observe(allDiagnoses.length);
       } catch (error) {
         if (error.status === 429) {
           // Rate limit exceeded - exponential backoff
           const retryAfter = error.headers['retry-after'] || 5;
           setTimeout(() => {
             this.queue.unshift(...batch); // Re-queue
             this.flush();
           }, retryAfter * 1000);
         } else {
           batch.forEach(item => item.reject(error));
         }
       }
     }
   }
   ```
6. **Circuit Breaker Middleware (circuit-breaker.middleware.ts)**:
   ```typescript
   import CircuitBreaker from 'opossum';
   
   // Protect database queries
   export const dbCircuitBreaker = new CircuitBreaker(async (query: string, params: any[]) => {
     return await dbPool.query(query, params);
   }, {
     timeout: 5000,          // Timeout after 5s
     errorThresholdPercentage: 50, // Open after 50% failure rate
     resetTimeout: 10000,    // Try again after 10s
     rollingCountTimeout: 10000,
     rollingCountBuckets: 10,
     name: 'database'
   });
   
   dbCircuitBreaker.on('open', () => {
     console.error('Database circuit breaker opened');
     circuitBreakerStateGauge.set({service: 'database'}, 1);
   });
   dbCircuitBreaker.on('halfOpen', () => {
     console.warn('Database circuit breaker half-open');
     circuitBreakerStateGauge.set({service: 'database'}, 2);
   });
   dbCircuitBreaker.on('close', () => {
     console.info('Database circuit breaker closed');
     circuitBreakerStateGauge.set({service: 'database'}, 0);
   });
   
   dbCircuitBreaker.fallback((query, params) => {
     // Fallback: Return cached data or error gracefully
     return cacheService.get(`query:${hashQuery(query, params)}`);
   });
   
   // Protect AI API calls
   export const aiCircuitBreaker = new CircuitBreaker(async (prompt: string) => {
     return await openai.chat.completions.create({...});
   }, {
     timeout: 10000, // AI API timeout 10s
     errorThresholdPercentage: 30,
     resetTimeout: 30000, // Try again after 30s
     name: 'openai'
   });
   
   aiCircuitBreaker.fallback(() => {
     return { error: 'AI service temporarily unavailable', fallback: true };
   });
   ```
7. **Custom Prometheus Metrics (extend metrics.ts from US-005)**:
   ```typescript
   import { Histogram, Gauge } from 'prom-client';
   
   export const databaseQueryDurationHistogram = new Histogram({
     name: 'database_query_duration_seconds',
     help: 'Duration of database queries in seconds',
     labelNames: ['query_type', 'table'],
     buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5] // 1ms, 10ms, 50ms, 100ms, 500ms, 1s, 5s
   });
   
   export const activeDatabaseConnectionsGauge = new Gauge({
     name: 'active_database_connections',
     help: 'Number of active database connections'
   });
   
   export const redisCacheHitGauge = new Gauge({
     name: 'redis_cache_hit_rate',
     help: 'Redis cache hit rate (%)',
   });
   
   export const redisCacheMissGauge = new Gauge({
     name: 'redis_cache_miss_rate',
     help: 'Redis cache miss rate (%)',
   });
   
   export const aiApiBatchSizeHistogram = new Histogram({
     name: 'ai_api_batch_size',
     help: 'Number of items in AI API batch requests',
     buckets: [1, 5, 10, 20, 50]
   });
   
   export const circuitBreakerStateGauge = new Gauge({
     name: 'circuit_breaker_state',
     help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
     labelNames: ['service']
   });
   ```
8. **Query Performance Logging (query-logger.middleware.ts)**:
   ```typescript
   export function logSlowQuery(query: string, duration: number, params: any[]) {
     if (duration > 100) { // Log queries slower than 100ms
       console.warn('SLOW QUERY', {
         query,
         duration: `${duration}ms`,
         params,
         threshold: '100ms'
       });
       databaseQueryDurationHistogram.observe({query_type: 'slow', table: extractTable(query)}, duration / 1000);
     }
   }
   
   // Wrap all database queries with timing
   export async function timedQuery(query: string, params: any[]) {
     const start = Date.now();
     try {
       const result = await dbCircuitBreaker.fire(query, params);
       const duration = Date.now() - start;
       logSlowQuery(query, duration, params);
       databaseQueryDurationHistogram.observe({query_type: 'success', table: extractTable(query)}, duration / 1000);
       return result;
     } catch (error) {
       const duration = Date.now() - start;
       databaseQueryDurationHistogram.observe({query_type: 'error', table: extractTable(query)}, duration / 1000);
       throw error;
     }
   }
   ```
9. **Optimize N+1 Queries**:
   - Identify N+1 patterns in load test (e.g., fetching appointments, then fetching patient for each appointment)
   - Rewrite to use JOINs: `SELECT a.*, p.* FROM appointments a JOIN patient_profiles p ON a.patient_id = p.id`
   - Or use batch fetching with IN clause: `SELECT * FROM patient_profiles WHERE id IN ($1, $2, ...)`
10. **Update All Controllers to Use Optimizations**:
    - Replace direct `db.query()` calls with `timedQuery()`
    - Add caching to frequently accessed endpoints
    - Use AI batch service for medical coding
    - All database/AI calls go through circuit breakers

## Current Project State
```
server/
├── src/
│   ├── config/
│   │   ├── database.config.ts (exists, to be modified)
│   │   ├── redis.config.ts (exists from US-004, to be modified)
│   │   └── metrics.ts (exists from US-005, to be extended)
│   ├── services/
│   │   ├── cache.service.ts (to be created)
│   │   └── ai-batch.service.ts (to be created)
│   ├── middleware/
│   │   ├── circuit-breaker.middleware.ts (to be created)
│   │   └── query-logger.middleware.ts (to be created)
│   └── controllers/
│       └── *.controller.ts (to be modified for optimizations)
└── package.json (add opossum, p-limit dependencies)
database/
├── migrations/
│   └── V028__performance_indexes.sql (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V028__performance_indexes.sql | Migration adding 5 covering indexes for performance optimization |
| CREATE | server/src/services/cache.service.ts | Query result caching service with get/set/invalidate methods |
| CREATE | server/src/services/ai-batch.service.ts | AI API batching service with rate limiting and queue |
| CREATE | server/src/middleware/circuit-breaker.middleware.ts | Circuit breaker for database and AI API using opossum |
| CREATE | server/src/middleware/query-logger.middleware.ts | Query performance logging with slow query detection |
| MODIFY | server/src/config/database.config.ts | Add PostgreSQL connection pooling configuration (max 50 connections) |
| MODIFY | server/src/config/redis.config.ts | Add Redis connection pooling and retry strategy |
| MODIFY | server/src/config/metrics.ts | Add custom Prometheus metrics (database_query_duration, active_connections, cache_hit_rate, etc.) |
| MODIFY | server/src/controllers/*.controller.ts | Replace db.query with timedQuery, add caching, use AI batch service |
| MODIFY | server/package.json | Add opossum@8.x, p-limit@5.x dependencies |

## External References
- [PostgreSQL Connection Pooling](https://node-postgres.com/features/pooling)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [opossum Circuit Breaker](https://nodeshift.dev/opossum/)
- [p-limit](https://www.npmjs.com/package/p-limit)
- [PostgreSQL EXPLAIN ANALYZE](https://www.postgresql.org/docs/15/sql-explain.html)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)

## Build Commands
```bash
# Run migration
psql -U postgres -d appointment_db -f database/migrations/V028__performance_indexes.sql

# Verify indexes created
psql -U postgres -d appointment_db -c "\d+ appointments"

# Install dependencies
cd server
npm install opossum p-limit

# Start server with optimizations
npm run dev

# Test cached endpoint
curl -X GET http://localhost:3001/api/providers/schedule/1/2026-03-25 \
  -H "Authorization: Bearer <token>"

# Check Prometheus metrics
curl http://localhost:3001/metrics | grep database_query_duration
curl http://localhost:3001/metrics | grep redis_cache_hit_rate
curl http://localhost:3001/metrics | grep circuit_breaker_state
```

## Implementation Validation Strategy
- [ ] Migration V028 runs successfully, 5 indexes created
- [ ] ANALYZE shows index usage: EXPLAIN ANALYZE shows "Index Scan" instead of "Seq Scan"
- [ ] PostgreSQL pool configured: max 50 connections, min 10, idle timeout 30s
- [ ] Redis pool configured: max 20 connections, retry strategy with exponential backoff
- [ ] Cache service works: get/set/invalidate methods function correctly
- [ ] Provider schedule cached: First request hits DB, second request hits cache (check logs)
- [ ] Patient profile cached: First request hits DB, second request hits cache
- [ ] Cache invalidation works: Update patient profile, cache cleared, next request hits DB
- [ ] AI batching works: Multiple diagnoses batched into single OpenAI API call
- [ ] Rate limiting works: 11th concurrent AI request queued, not rejected
- [ ] Circuit breaker protects DB: After 5 consecutive errors, circuit opens
- [ ] Circuit breaker fallback: When circuit open, fallback to cached data or graceful error
- [ ] Custom Prometheus metrics exported: /metrics endpoint shows database_query_duration, cache_hit_rate, circuit_breaker_state
- [ ] Slow queries logged: Query >100ms generates console warning
- [ ] Database query timeout: Query exceeds 5s, connection terminated
- [ ] Connection pool monitoring: active_database_connections gauge updates
- [ ] N+1 queries eliminated: Replaced with JOINs or batch fetching
- [ ] Load test re-run: p95 response time reduced by >30%
- [ ] Database query time: 90% of queries <100ms (verified in Prometheus)
- [ ] Redis cache time: Average <10ms (verified in Prometheus)

## Implementation Checklist
- [x] Create database/migrations/V028__performance_indexes.sql with 5 indexes
- [x] Add index comments explaining rationale and target queries
- [ ] Test migration: psql -f V028__performance_indexes.sql
- [x] Run ANALYZE on all tables: psql -c "ANALYZE;"
- [ ] Verify index usage: EXPLAIN ANALYZE on slow queries, check for "Index Scan"
- [x] Install dependencies: npm install opossum p-limit
- [x] Modify server/src/config/database.config.ts: Add pool configuration (max 50, min 10, idle 30s, timeout 5s)
- [x] Add connection pool monitoring: dbPool.on('connect'), dbPool.on('remove')
- [x] Modify server/src/config/redis.config.ts: Add retry strategy with exponential backoff
- [ ] Add Redis cluster support (if applicable)
- [x] Create server/src/services/cache.service.ts with get/set/invalidate methods
- [x] Add cache hit/miss tracking (redisCacheHitGauge, redisCacheMissGauge)
- [x] Add graceful error handling (don't throw on cache failures)
- [x] Create server/src/services/ai-batch.service.ts with queue and flush logic
- [x] Implement rate limiter using p-limit (10 concurrent requests)
- [x] Implement batch size limit (10 diagnoses per API call)
- [x] Add exponential backoff on 429 rate limit errors
- [x] Create server/src/middleware/circuit-breaker.middleware.ts with opossum
- [x] Configure dbCircuitBreaker: timeout 5s, error threshold 50%, reset 10s
- [x] Configure aiCircuitBreaker: timeout 10s, error threshold 30%, reset 30s
- [x] Add circuit breaker event listeners (open, halfOpen, close)
- [x] Add fallback functions (cached data for DB, graceful error for AI)
- [x] Create server/src/middleware/query-logger.middleware.ts with timedQuery function
- [x] Add slow query logging (>100ms threshold)
- [ ] Wrap queries with circuit breaker: dbCircuitBreaker.fire(query, params)
- [x] Extend server/src/config/metrics.ts: Add 6 custom Prometheus metrics
- [x] Add database_query_duration_seconds histogram with query_type and table labels
- [x] Add active_database_connections gauge
- [x] Add redis_cache_hit_rate and redis_cache_miss_rate gauges
- [x] Add ai_api_batch_size histogram
- [x] Add circuit_breaker_state gauge (0=closed, 1=open, 2=half-open)
- [ ] Update all controllers to use timedQuery instead of direct db.query
- [ ] Add caching to provider schedule endpoint (5min TTL)
- [ ] Add caching to patient profile endpoint (1min TTL)
- [ ] Add cache invalidation on update/delete operations
- [ ] Update medical coding service to use aiBatchService
- [ ] Identify and fix N+1 queries: Replace with JOINs or batch fetching
- [ ] Test provider schedule caching: First request slow, second request fast
- [ ] Test patient profile caching: First request slow, second request fast
- [ ] Test cache invalidation: Update patient, verify cache cleared
- [ ] Test AI batching: Send 10 diagnoses, verify single OpenAI API call
- [ ] Test rate limiting: Send 20 concurrent AI requests, verify queuing
- [ ] Test circuit breaker: Shutdown database, verify circuit opens after 5 failures
- [ ] Test circuit breaker fallback: With circuit open, verify fallback data returned
- [ ] Verify Prometheus metrics: curl /metrics, check all 6 new metrics present
- [ ] Verify slow query logging: Run slow query, check console warning
- [ ] Run load test again: Execute k6 tests from TASK_001
- [ ] Verify p95 response time: Should be <500ms (measure improvement)
- [ ] Verify database query time: Check Prometheus, 90% <100ms
- [ ] Verify Redis cache time: Check Prometheus, average <10ms
- [x] Update .propel/docs/load-test-report.md: Add "Post-Optimization Results" section
- [x] Document improvements: Before/after metrics for p95, throughput, error rate
- [x] Document optimizations applied: Indexes, caching, pooling, batching, circuit breakers
- [x] Commit all files to version control
