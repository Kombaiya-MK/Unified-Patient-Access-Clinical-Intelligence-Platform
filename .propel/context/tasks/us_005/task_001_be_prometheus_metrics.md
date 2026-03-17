# Task - TASK_001_BE_PROMETHEUS_METRICS

## Requirement Reference
- User Story: US_005
- Story Location: `.propel/context/tasks/us_005/us_005.md`
- Acceptance Criteria:
    - AC1: /metrics endpoint returns Prometheus-formatted metrics including http_request_duration_seconds (histogram), http_requests_total (counter), active_connections (gauge)
- Edge Cases:
    - Unauthorized access to /metrics: Protect with IP whitelist or basic auth (prevent external access)
    - High-cardinality labels: Limit labels to user_role, endpoint_path, http_method only (avoid user_id, request_id)

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

> **Note**: Backend monitoring infrastructure - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | prom-client | 15.x |
| Monitoring | Prometheus | (External scraper) |
| AI/ML | N/A | N/A |

**Note**: Metrics must be compatible with Prometheus scrape format (OpenMetrics)

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI implementation - monitoring infrastructure only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend monitoring infrastructure

## Task Overview
Install prom-client library, configure Prometheus metrics exporter at /metrics endpoint. Implement middleware to track: (1) http_request_duration_seconds histogram with labels (method, route, status_code, user_role), (2) http_requests_total counter, (3) active_connections gauge, (4) database_query_duration_seconds histogram, (5) redis_operations_total counter. Protect /metrics endpoint with IP whitelist or basic auth. Prevent high-cardinality labels (exclude user_id, request_id).

## Dependent Tasks
- US_002: Backend API must be configured
- US_003: Database setup (to track query duration)
- US_004: Redis setup (to track cache operations)

## Impacted Components
**New:**
- server/src/config/metrics.ts (prom-client initialization, metric definitions)
- server/src/middleware/metrics.middleware.ts (Express middleware to track request duration)
- server/src/routes/metrics.routes.ts (GET /metrics endpoint with auth)
- server/.env.example (METRICS_ALLOWED_IPS, METRICS_BASIC_AUTH_USER, METRICS_BASIC_AUTH_PASS)

## Implementation Plan
1. **Install prom-client**: `npm install prom-client` for Prometheus metrics
2. **Initialize Registry**: Create default registry for all metrics
3. **Define histogram metrics**: http_request_duration_seconds with buckets [0.001, 0.01, 0.1, 0.5, 1, 5, 10], labels: method, route, status_code, user_role
4. **Define counter metrics**: http_requests_total with labels: method, route, status_code, user_role
5. **Define gauge metrics**: active_connections (current number of concurrent requests)
6. **Add database metrics**: database_query_duration_seconds histogram
7. **Add Redis metrics**: redis_operations_total counter with labels: operation (get/set/del), status (hit/miss/error)
8. **Create metrics middleware**: Track request start time, increment active_connections, on response: decrement active_connections, record duration, increment counter
9. **Create /metrics endpoint**: GET /metrics returns registry.metrics() in Prometheus format
10. **Add IP whitelist**: Middleware to check req.ip against METRICS_ALLOWED_IPS (comma-separated list)
11. **Add basic auth**: If IP not whitelisted, require basic auth (username/password from env vars)
12. **Test with Prometheus**: Configure Prometheus scrape_config to scrape /metrics every 15 seconds

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001)
├── server/               # Backend (US_002-004)
│   ├── src/
│   │   ├── config/ (exists)
│   │   ├── middleware/ (exists)
│   │   └── routes/ (exists)
│   └── package.json
└── (Prometheus to be configured separately)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/config/metrics.ts | prom-client Registry, histogram/counter/gauge definitions |
| CREATE | server/src/middleware/metrics.middleware.ts | Express middleware to track request duration and active connections |
| CREATE | server/src/routes/metrics.routes.ts | GET /metrics with IP whitelist + basic auth |
| CREATE | server/src/middleware/metrics-auth.middleware.ts | IP whitelist + basic auth for /metrics |
| UPDATE | server/.env.example | Add METRICS_ALLOWED_IPS, METRICS_BASIC_AUTH_USER, METRICS_BASIC_AUTH_PASS |
| UPDATE | server/package.json | Add prom-client dependency |
| UPDATE | server/src/app.ts | Import metrics config, add metrics middleware, register /metrics route |

> Creates 4 new files, updates 3 existing files

## External References
- [prom-client Documentation](https://github.com/siimon/prom-client)
- [Prometheus Histogram Best Practices](https://prometheus.io/docs/practices/histograms/)
- [Prometheus Metric Types](https://prometheus.io/docs/concepts/metric_types/)
- [Avoiding High Cardinality](https://prometheus.io/docs/practices/naming/#labels)
- [Express Response Time Middleware](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production)
- [NFR-001 Uptime Monitoring](../../../.propel/context/docs/spec.md#NFR-001)

## Build Commands
```bash
# Install prom-client
cd server
npm install prom-client

# Add environment variables
METRICS_ALLOWED_IPS=127.0.0.1,10.0.0.0/24
METRICS_BASIC_AUTH_USER=prometheususername
METRICS_BASIC_AUTH_PASS=securepassword123

# Test metrics endpoint
npm run dev
curl http://localhost:3001/metrics  # With basic auth

# Example Prometheus scrape config (prometheus.yml)
scrape_configs:
  - job_name: 'upaci-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    basic_auth:
      username: 'prometheususername'
      password: 'securepassword123'
```

## Implementation Validation Strategy
- [ ] Unit tests: Metrics middleware increments counters correctly
- [ ] Integration tests: /metrics endpoint returns valid Prometheus format
- [ ] prom-client installed: package.json shows prom-client@15.x
- [ ] /metrics endpoint accessible: GET http://localhost:3001/metrics returns 200 OK
- [ ] Prometheus format valid: Output includes `# HELP`, `# TYPE`, metric values
- [ ] http_request_duration_seconds recorded: Make API request → /metrics shows histogram with request labels
- [ ] http_requests_total incremented: Make 5 requests → counter shows 5
- [ ] active_connections tracked: Simulate concurrent requests → gauge shows current count
- [ ] Labels limited: Verify no user_id, request_id labels (only method, route, status_code, user_role)
- [ ] IP whitelist works: Request from non-whitelisted IP → 401 Unauthorized
- [ ] Basic auth works: Request without auth → 401, with valid auth → 200 OK
- [ ] Database metrics tracked: Query database → database_query_duration_seconds recorded
- [ ] Redis metrics tracked: Cache operation → redis_operations_total incremented with status=hit/miss
- [ ] Prometheus scrapes successfully: Configure Prometheus → verify metrics appear in Prometheus UI

## Implementation Checklist
- [ ] Install prom-client: `npm install prom-client`
- [ ] Create server/src/config/metrics.ts:
  - [ ] Import prom-client: `import { Registry, Histogram, Counter, Gauge, collectDefaultMetrics } from 'prom-client'`
  - [ ] Create registry: `const register = new Registry()`
  - [ ] Collect default metrics: `collectDefaultMetrics({ register })`
  - [ ] Define http_request_duration_seconds: Histogram with buckets [0.001, 0.01, 0.1, 0.5, 1, 5, 10], labels: ['method', 'route', 'status_code', 'user_role']
  - [ ] Define http_requests_total: Counter with labels: ['method', 'route', 'status_code', 'user_role']
  - [ ] Define active_connections: Gauge
  - [ ] Define database_query_duration_seconds: Histogram with buckets [0.001, 0.01, 0.1, 0.5, 1, 3, 5]
  - [ ] Define redis_operations_total: Counter with labels: ['operation', 'status']
  - [ ] Export: register, httpDuration, httpTotal, activeConnections, dbQueryDuration, redisOps
- [ ] Create server/src/middleware/metrics.middleware.ts:
  - [ ] Import metrics from config/metrics
  - [ ] Increment activeConnections.inc() on request
  - [ ] Record request start time: `const start = Date.now()`
  - [ ] On response.finish event:
    - [ ] Decrement activeConnections.dec()
    - [ ] Calculate duration: `(Date.now() - start) / 1000`
    - [ ] Extract labels: method=req.method, route=req.route?.path || req.path, status_code=res.statusCode, user_role=req.user?.role || 'anonymous'
    - [ ] Record duration: `httpDuration.observe({ method, route, status_code, user_role }, duration)`
    - [ ] Increment counter: `httpTotal.inc({ method, route, status_code, user_role })`
- [ ] Create server/src/middleware/metrics-auth.middleware.ts:
  - [ ] Parse METRICS_ALLOWED_IPS: Split by comma, support CIDR notation
  - [ ] Check if req.ip in whitelist → next()
  - [ ] If not whitelisted, check Authorization header
  - [ ] Decode Basic Auth: `Buffer.from(authHeader.split(' ')[1], 'base64').toString()`
  - [ ] Compare with METRICS_BASIC_AUTH_USER:METRICS_BASIC_AUTH_PASS
  - [ ] If valid → next(), else → res.status(401).send('Unauthorized')
- [ ] Create server/src/routes/metrics.routes.ts:
  - [ ] Import register from config/metrics
  - [ ] Import metricsAuth from middleware/metrics-auth
  - [ ] router.get('/metrics', metricsAuth, async (req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); })
- [ ] Update server/.env.example:
  - [ ] METRICS_ALLOWED_IPS=127.0.0.1,10.0.0.0/24
  - [ ] METRICS_BASIC_AUTH_USER=prometheususername
  - [ ] METRICS_BASIC_AUTH_PASS=securepassword123
- [ ] Update server/src/app.ts:
  - [ ] Import metricsMiddleware from middleware/metrics
  - [ ] Import metricsRoutes from routes/metrics
  - [ ] Add metricsMiddleware after helmet and cors
  - [ ] Register /metrics route: `app.use(metricsRoutes)`
- [ ] Instrument database queries (in config/database.ts):
  - [ ] Wrap pool.query with metrics: Record start time → execute query → record duration in dbQueryDuration
- [ ] Instrument Redis operations (in services/cache.service.ts):
  - [ ] Wrap redis.get with metrics: Increment redisOps with labels {operation: 'get', status: 'hit'/'miss'/'error'}
  - [ ] Wrap redis.set with metrics: Increment redisOps with labels {operation: 'set', status: 'success'/'error'}
- [ ] Test /metrics endpoint:
  - [ ] `npm run dev`
  - [ ] `curl http://localhost:3001/metrics` (from whitelisted IP or with basic auth)
  - [ ] Verify output includes: `# HELP http_request_duration_seconds`, `# TYPE http_request_duration_seconds histogram`, metric values
- [ ] Test metrics captured:
  - [ ] Make API request: `curl http://localhost:3001/api/health`
  - [ ] Check /metrics → verify http_request_duration_seconds{method="GET",route="/api/health",status_code="200",user_role="anonymous"} histogram bucket
  - [ ] Verify http_requests_total{...} counter incremented
- [ ] Test IP whitelist: Request from non-whitelisted IP → 401 Unauthorized
- [ ] Test basic auth: Request without Authorization → 401, with valid header → 200 OK
- [ ] Document metrics in server/README.md: Metrics exposed, labels used, Prometheus scrape configuration example
