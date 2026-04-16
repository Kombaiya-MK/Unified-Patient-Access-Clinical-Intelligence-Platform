# Task - task_002_health_check_enhancement

## Requirement Reference
- User Story: US_050 - Zero-Downtime Deployment with PM2 Cluster Mode
- Story Location: .propel/context/tasks/us_050/us_050.md
- Acceptance Criteria:
    - System implements health check endpoint GET /health responding: 200 OK if database connected + Redis connected + AI service reachable, 503 Service Unavailable if any dependency down
    - System uses health check for PM2 wait_ready logic (ensure instance is healthy before marking ready)
- Edge Cases:
    - What happens when new version fails health check? (PM2 keeps old version running, alerts admin, deployment marked as failed)

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
| Database | PostgreSQL | 15.x |
| Caching | Upstash Redis | latest |
| AI/ML | OpenAI API (optional check) | latest |
| Frontend | N/A | N/A |

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
Enhance existing /api/health endpoint to include comprehensive dependency checks (database, Redis, optional AI service) with proper HTTP status codes (200 for healthy, 503 for unhealthy), integrate health check with PM2 readiness logic, and add detailed health status response with latency metrics.

**Purpose**: Provide reliable health check endpoint for PM2 zero-downtime reload validation and operational monitoring.

**Capabilities**:
- Existing /api/health endpoint enhancement
- Database connection test (PostgreSQL query: SELECT 1)
- Redis connection test (PING command with latency measurement)
- Optional AI service test (OpenAI API reachability with 5s timeout)
- HTTP 200 for all healthy, 503 if any dependency fails
- Detailed JSON response with component-level status
- Health check execution time tracking

## Dependent Tasks
- None (existing health check enhancement)

## Impacted Components
- **MODIFY**: server/src/app.ts (enhance existing GET /api/health endpoint)
- **MODIFY**: server/src/utils/dbHealthCheck.ts (ensure connection test function exists)
- **MODIFY**: server/src/utils/redisHealthCheck.ts (ensure Redis ping function exists)
- **CREATE**: server/src/utils/aiServiceHealthCheck.ts (optional AI service reachability test)

## Implementation Plan

### Phase 1: Review Existing Health Check Implementation (0.5 hours)
1. **Read existing /api/health endpoint in app.ts**:
   - Current implementation already checks database and Redis
   - Response includes: success, status, timestamp, uptime, database, pool, redis
   - Returns 200 if dbStatus.status === 'ok', otherwise 503
   - **Enhancement needed**: Add optional AI service check, ensure all dependency failures return 503

2. **Existing health check utilities**:
   - `server/src/utils/dbHealthCheck.ts`: Contains `getConnectionStatus()` function
   - `server/src/utils/redisHealthCheck.ts`: Contains `getRedisStatus()` function
   - Both utilities already exist - no changes needed unless API changes

### Phase 2: Add AI Service Health Check (Optional) (1 hour)
3. **Create aiServiceHealthCheck.ts**:
   - Function: `checkAIServiceHealth(): Promise<{ available: boolean; latency: number | null; error: string | null }>`
   - Test OpenAI API reachability with minimal request (list models endpoint, not chat completion)
   - 5-second timeout (faster than AI service calls in production)
   - Return:
     - `{ available: true, latency: 234, error: null }` if successful
     - `{ available: false, latency: null, error: 'Timeout after 5s' }` if timeout
     - `{ available: false, latency: null, error: 'API Key invalid' }` if auth error
   - Example code:
     ```typescript
     import axios from 'axios';
     
     export const checkAIServiceHealth = async (): Promise<{
       available: boolean;
       latency: number | null;
       error: string | null;
     }> => {
       try {
         const startTime = Date.now();
         const response = await axios.get('https://api.openai.com/v1/models', {
           headers: {
             'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
           },
           timeout: 5000, // 5 second timeout
         });
         const latency = Date.now() - startTime;
         
         return {
           available: response.status === 200,
           latency,
           error: null,
         };
       } catch (error: any) {
         return {
           available: false,
           latency: null,
           error: error.message || 'Unknown error',
         };
       }
     };
     ```

### Phase 3: Enhance /api/health Endpoint (1 hour)
4. **Modify app.ts /api/health endpoint**:
   - Import `checkAIServiceHealth` function
   - Add AI service check to health check response
   - Update HTTP status logic: Return 503 if database OR Redis OR AI service is down
   - Add execution time tracking for health check itself
   - Example enhanced endpoint:
     ```typescript
     import { checkAIServiceHealth } from './utils/aiServiceHealthCheck';

     app.get('/api/health', async (_req: Request, res: Response) => {
       const startTime = Date.now();
       
       try {
         // Existing checks
         const dbStatus = await getConnectionStatus();
         const poolStats = getPoolStats();
         const redisStatus = getRedisStatus();
         
         // New: AI service check (optional - only if OPENAI_API_KEY is set)
         let aiServiceStatus = { available: true, latency: null, error: 'Not configured' };
         if (process.env.OPENAI_API_KEY) {
           aiServiceStatus = await checkAIServiceHealth();
         }
         
         // Determine overall health
         const isHealthy = 
           dbStatus.status === 'ok' && 
           redisStatus.connected && 
           (process.env.OPENAI_API_KEY ? aiServiceStatus.available : true);
         
         const executionTime = Date.now() - startTime;
         
         res.status(isHealthy ? 200 : 503).json({
           success: isHealthy,
           status: isHealthy ? 'healthy' : 'degraded',
           timestamp: new Date().toISOString(),
           uptime: process.uptime(),
           executionTime: `${executionTime}ms`,
           environment: config.nodeEnv,
           database: {
             connected: dbStatus.status === 'ok',
             host: dbStatus.details?.host,
             port: dbStatus.details?.port,
             database: dbStatus.details?.database,
             version: dbStatus.details?.version,
           },
           pool: {
             total: poolStats.totalCount,
             idle: poolStats.idleCount,
             waiting: poolStats.waitingCount,
           },
           redis: {
             connected: redisStatus.connected,
             latency: redisStatus.latency,
             lastError: redisStatus.lastError,
           },
           aiService: {
             configured: !!process.env.OPENAI_API_KEY,
             available: aiServiceStatus.available,
             latency: aiServiceStatus.latency,
             error: aiServiceStatus.error,
           },
         });
       } catch (error) {
         const executionTime = Date.now() - startTime;
         logger.error('Health check failed:', error);
         res.status(503).json({
           success: false,
           status: 'error',
           timestamp: new Date().toISOString(),
           uptime: process.uptime(),
           executionTime: `${executionTime}ms`,
           environment: config.nodeEnv,
           error: 'Health check execution failed',
         });
       }
     });
     ```

### Phase 4: PM2 Health Check Integration (0.5 hours)
5. **Document PM2 health check usage**:
   - PM2's `wait_ready: true` setting in ecosystem.config.js waits for `process.send('ready')` signal
   - Health check is NOT directly invoked by PM2 - it's a separate HTTP endpoint
   - PM2 reload process:
     1. PM2 starts new instance
     2. New instance initializes (database connects, Redis connects)
     3. New instance calls `server.listen()` successfully
     4. New instance sends `process.send('ready')` to PM2
     5. PM2 marks new instance as ready, routes traffic to it
     6. PM2 sends SIGINT to old instance (graceful shutdown)
   - Health check validates readiness for external monitoring (load balancers, Kubernetes probes, manual checks)

6. **Health check validation during deployment**:
   - Deployment script should poll /api/health after PM2 reload
   - Wait for HTTP 200 response before considering deployment successful
   - Example polling logic (bash):
     ```bash
     # After pm2 reload upaci-backend
     for i in {1..30}; do
       if curl -f http://localhost:3000/api/health; then
         echo "Health check passed"
         exit 0
       fi
       echo "Health check failed, retrying in 2s..."
       sleep 2
     done
     echo "Health check failed after 30 attempts"
     exit 1
     ```

### Phase 5: Testing & Validation (1 hour)
7. **Health check test scenarios**:
   - **Scenario 1**: All dependencies healthy → Expect HTTP 200, success: true
   - **Scenario 2**: Database down → Expect HTTP 503, database.connected: false
   - **Scenario 3**: Redis down → Expect HTTP 503, redis.connected: false
   - **Scenario 4**: AI service down (if configured) → Expect HTTP 503, aiService.available: false
   - **Scenario 5**: Health check timeout → Expect HTTP 503 with error

8. **Testing commands**:
   ```bash
   # Test healthy state
   curl -i http://localhost:3000/api/health
   # Expect: HTTP/1.1 200 OK

   # Test database failure (stop PostgreSQL)
   sudo systemctl stop postgresql
   curl -i http://localhost:3000/api/health
   # Expect: HTTP/1.1 503 Service Unavailable
   sudo systemctl start postgresql

   # Test Redis failure (stop Redis)
   redis-cli shutdown
   curl -i http://localhost:3000/api/health
   # Expect: HTTP/1.1 503 Service Unavailable
   redis-server --daemonize yes

   # Test PM2 reload with health check monitoring
   pm2 reload upaci-backend
   # In another terminal, poll health check
   while true; do curl -i http://localhost:3000/api/health; sleep 1; done
   # Verify: No 503 errors during reload
   ```

## Current Project State
```
server/
  src/
    app.ts (MODIFY - enhance /api/health endpoint)
    utils/
      dbHealthCheck.ts (EXISTING - getConnectionStatus function)
      redisHealthCheck.ts (EXISTING - getRedisStatus function)
      aiServiceHealthCheck.ts (CREATE - checkAIServiceHealth function)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/src/app.ts | Enhance GET /api/health endpoint with AI service check, updated HTTP status logic (503 if any dependency fails), execution time tracking, detailed JSON response with component-level status |
| CREATE | server/src/utils/aiServiceHealthCheck.ts | AI service health check function (checkAIServiceHealth) with OpenAI API reachability test, 5s timeout, latency measurement, error handling |
| MODIFY | server/src/utils/dbHealthCheck.ts | Ensure getConnectionStatus() function exists and returns { status: 'ok' | 'error', details: {...} } (likely no changes needed) |
| MODIFY | server/src/utils/redisHealthCheck.ts | Ensure getRedisStatus() function exists and returns { connected: boolean, latency: number, lastError: string } (likely no changes needed) |

## External References
- **Health Check Best Practices**: https://microservices.io/patterns/observability/health-check-api.html (Health check patterns)
- **HTTP Status Codes**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503 (503 Service Unavailable)
- **PM2 Signals**: https://pm2.keymetrics.io/docs/usage/signals-clean-restart/#process-signals (wait_ready, process signals)
- **OpenAI API - List Models**: https://platform.openai.com/docs/api-reference/models/list (Lightweight health check endpoint)
- **Express Health Check**: https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html (Express patterns)

## Build Commands
```bash
# Build TypeScript
cd server
npm run build

# Start server (or use PM2)
npm run dev
# OR: npm run pm2:start

# Test health check
curl -i http://localhost:3000/api/health

# Watch logs
npm run pm2:logs
```

## Implementation Validation Strategy
- [x] Unit tests pass (write unit tests for checkAIServiceHealth function with mocked axios)
- [x] Integration tests pass (test /api/health endpoint with real database, Redis, mocked AI service)
- [x] Manual testing: Start server, verify /api/health returns 200 with all dependencies healthy
- [x] Manual testing: Stop PostgreSQL, verify /api/health returns 503 with database.connected: false
- [x] Manual testing: Stop Redis, verify /api/health returns 503 with redis.connected: false
- [x] Manual testing: Set invalid OPENAI_API_KEY, verify /api/health returns 503 with aiService.available: false
- [x] Manual testing: Execute pm2 reload while polling /api/health, verify no 503 errors during reload
- [x] Log verification: Check logs for health check execution time (<100ms typical)

## Implementation Checklist
- [x] Create aiServiceHealthCheck.ts with checkAIServiceHealth function (test OpenAI API /v1/models endpoint with 5s timeout, return available/latency/error)
- [x] Modify app.ts to enhance GET /api/health endpoint with AI service check (import checkAIServiceHealth, add aiService to response)
- [x] Update /api/health HTTP status logic to return 503 if database OR Redis OR AI service fails (isHealthy = dbStatus.ok && redisStatus.connected && aiServiceStatus.available)
- [x] Add execution time tracking to health check endpoint (const startTime = Date.now(), calculate executionTime at end)
- [x] Write unit tests for checkAIServiceHealth with mocked axios (test success, timeout, auth error scenarios)
- [x] Write integration tests for /api/health endpoint (test with healthy dependencies, test with each dependency failing)
- [x] Test health check manually (curl http://localhost:3000/api/health, verify 200 when healthy, verify 503 when dependency fails)
- [x] Test PM2 reload with health check monitoring (pm2 reload upaci-backend while polling /api/health in loop, verify no 503 errors during reload)
