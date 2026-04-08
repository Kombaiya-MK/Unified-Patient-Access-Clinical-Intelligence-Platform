# Task - TASK_001_BE_PROMETHEUS_METRICS_SETUP

## Requirement Reference
- User Story: US_005  
- Story Location: `.propel/context/tasks/us_005/us_005.md`
- Acceptance Criteria:
    - AC1: Backend API running, /metrics endpoint returns Prometheus-formatted metrics including http_request_duration_seconds histogram, http_requests_total counter, and active_connections gauge
- Edge Cases:
    - Metrics endpoint accessed by unauthorized user: Protect /metrics endpoint with IP whitelist or basic auth
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
| Backend | Express | 4.x |
| Backend | prom-client | 15.x |
| Backend | TypeScript | 5.3.x |
| Database | N/A | N/A |
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

> **Note**: Monitoring infrastructure only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement Prometheus metrics collection in Express backend using prom-client library with histogram for request duration, counter for total requests, gauge for active connections. Create /metrics endpoint protected by IP whitelist or basic authentication. Implement middleware for automatic metric collection on all API requests. Enforce low-cardinality labels (user_role, endpoint_path, http_method only) to prevent metric explosion. Support 99.9% uptime monitoring (NFR-001).

## Dependent Tasks
- US_002: Backend Express API must be configured

## Impacted Components
**Modified:**
- server/package.json (add prom-client dependency)
- server/src/app.ts (register metrics middleware and endpoint)
- server/.env.example (add metrics endpoint protection config)

**New:**
- server/src/config/metrics.ts (Prometheus metrics configuration)
- server/src/middleware/metricsCollector.ts (Automatic request metrics collection)
- server/src/middleware/metricsAuth.ts (IP whitelist or basic auth for /metrics)
- server/src/routes/metrics.routes.ts (GET /metrics endpoint)
- server/src/utils/metricsRegistry.ts (Central metrics registry with all metrics)
- server/src/types/metrics.types.ts (TypeScript interfaces for metrics)
- server/docs/PROMETHEUS_SETUP.md (Metrics documentation, Prometheus server config)

## Implementation Plan
1. **Install prom-client**: Add prom-client@15.x to package.json for Prometheus metrics
2. **Metrics Registry**: Create central registry for all application metrics
3. **Request Duration Histogram**: Create http_request_duration_seconds with buckets [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
4. **Request Counter**: Create http_requests_total with labels (method, route, status_code, user_role)
5. **Active Connections Gauge**: Create active_connections to track concurrent requests
6. **Metrics Middleware**: Implement middleware to automatically collect metrics on all requests
7. **Label Sanitization**: Normalize route paths (/api/users/:id → /api/users/{id}) to prevent high cardinality
8. **Custom Metrics**: Add optional custom metrics (db_query_duration, cache_hit_rate)
9. **Metrics Endpoint**: Create GET /metrics endpoint that returns registry.metrics() in Prometheus format
10. **Endpoint Protection**: Implement IP whitelist (localhost, monitoring server) or HTTP basic auth
11. **Default Metrics**: Enable Node.js default metrics (memory, CPU, event loop lag)
12. **Documentation**: Document all metrics, labels, and Prometheus scrape configuration

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002, US_003, US_004)
│   ├── src/
│   │   ├── app.ts          # Express app (to be modified)
│   │   ├── middleware/     # Existing middleware
│   │   └── routes/         # API routes
└── database/                # Database setup
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/package.json | Add prom-client@15.x dependency |
| MODIFY | server/.env.example | Add METRICS_AUTH_ENABLED=true, METRICS_AUTH_USER, METRICS_AUTH_PASS, METRICS_IP_WHITELIST |
| CREATE | server/src/config/metrics.ts | Prometheus metrics configuration (histogram buckets, label names) |
| CREATE | server/src/utils/metricsRegistry.ts | Singleton registry with all metrics (histogram, counter, gauge) |
| CREATE | server/src/middleware/metricsCollector.ts | Middleware to track request duration, increment counters, update gauges |
| CREATE | server/src/middleware/metricsAuth.ts | IP whitelist or basic auth protection for /metrics endpoint |
| CREATE | server/src/routes/metrics.routes.ts | GET /metrics endpoint returning Prometheus format |
| CREATE | server/src/types/metrics.types.ts | MetricsConfig, MetricLabels interfaces |
| MODIFY | server/src/app.ts | Import metricsCollector middleware, register globally before routes |
| MODIFY | server/src/routes/index.ts | Register /metrics route with metricsAuth middleware |
| CREATE | server/docs/PROMETHEUS_SETUP.md | Metrics list, Prometheus server config, Grafana dashboard examples |
| CREATE | server/docs/METRICS_REFERENCE.md | Complete metrics documentation (name, type, labels, purpose) |

> 4 modified files, 8 new files created

## External References
- [prom-client Documentation](https://github.com/siimon/prom-client)
- [Prometheus Data Model](https://prometheus.io/docs/concepts/data_model/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Histogram Buckets Selection](https://prometheus.io/docs/practices/histograms/)
- [High-Cardinality Labels Problem](https://www.robustperception.io/cardinality-is-key)
- [Prometheus Exposition Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [Node.js prom-client Guide](https://github.com/siimon/prom-client#histogram)
- [Securing Metrics Endpoint](https://prometheus.io/docs/guides/basic-auth/)

## Build Commands
```bash
# Install prom-client
cd server
npm install prom-client

# Update .env with metrics authentication
cp .env.example .env
echo "METRICS_AUTH_ENABLED=true" >> .env
echo "METRICS_AUTH_USER=admin" >> .env
echo "METRICS_AUTH_PASS=secure_password" >> .env
echo "METRICS_IP_WHITELIST=127.0.0.1,::1" >> .env

# Start development server
npm run dev

# Test metrics endpoint (no auth - should fail)
curl http://localhost:3001/metrics
# Expected: 401 Unauthorized (if METRICS_AUTH_ENABLED=true)

# Test with basic auth
curl -u admin:secure_password http://localhost:3001/metrics
# Expected: Prometheus-formatted metrics

# Test from whitelisted IP (localhost)
curl http://localhost:3001/metrics
# Expected: Metrics (if IP whitelist used instead of basic auth)

# Sample metrics output:
# # HELP http_request_duration_seconds HTTP request duration in seconds
# # TYPE http_request_duration_seconds histogram
# http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",user_role="patient",le="0.01"} 45
# http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",user_role="patient",le="0.05"} 98
# http_request_duration_seconds_sum{method="GET",route="/api/users",status_code="200",user_role="patient"} 3.456
# http_request_duration_seconds_count{method="GET",route="/api/users",status_code="200",user_role="patient"} 100
# 
# # HELP http_requests_total Total HTTP requests
# # TYPE http_requests_total counter
# http_requests_total{method="GET",route="/api/users",status_code="200",user_role="patient"} 100
# http_requests_total{method="POST",route="/api/appointments",status_code="201",user_role="patient"} 25
# 
# # HELP active_connections Number of active connections
# # TYPE active_connections gauge
# active_connections 12

# Generate load for testing
# Use Apache Bench or Artillery
ab -n 1000 -c 10 http://localhost:3001/api/health

# Check metrics again
curl -u admin:secure_password http://localhost:3001/metrics
# Verify counts increased

# Production build
npm run build
npm start

# Configure Prometheus server (prometheus.yml)
# scrape_configs:
#   - job_name: 'upaci-backend'
#     scrape_interval: 15s
#     metrics_path: '/metrics'
#     basic_auth:
#       username: 'admin'
#       password: 'secure_password'
#     static_configs:
#       - targets: ['localhost:3001']
```

## Implementation Validation Strategy
- [x] Unit tests pass (metrics collection logic tests)
- [x] Integration tests pass (metrics endpoint tests)
- [x] prom-client installed: `npm list prom-client` shows version 15.x
- [x] /metrics endpoint created: GET /metrics returns 200 OK
- [x] Prometheus format validated: Metrics follow Prometheus exposition format
- [x] Histogram created: http_request_duration_seconds with 7 buckets
- [x] Counter created: http_requests_total increments on each request
- [x] Gauge created: active_connections tracks concurrent requests
- [x] Labels applied: method, route, status_code, user_role present on metrics
- [x] Route normalization: /api/users/123 → /api/users/{id} (no high cardinality)
- [x] Middleware works: All API requests automatically tracked
- [x] Auth protection: Unauthorized request → 401 (if auth enabled)
- [x] Basic auth works: Valid credentials → 200 with metrics
- [x] IP whitelist works: Request from 127.0.0.1 → 200 (if whitelist enabled)
- [x] Default metrics: nodejs_* metrics present (heap_size, event_loop_lag, etc.)
- [x] High-cardinality prevented: No user_id, request_id, or session_id labels
- [x] Performance impact minimal: Metrics collection adds <5ms to request time

## Implementation Checklist
- [x] Install prom-client: `npm install prom-client`
- [x] Create server/src/types/metrics.types.ts with interfaces
- [x] Define MetricsConfig: { enabled: boolean, auth: { enabled, username, password }, ipWhitelist: string[] }
- [x] Define MetricLabels: { method: string, route: string, status_code: number, user_role?: string }
- [x] Create server/src/config/metrics.ts
- [x] Define histogram buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] for request duration
- [x] Define allowed labels: ['method', 'route', 'status_code', 'user_role']
- [x] Export metricsConfig object with configuration
- [x] Create server/src/utils/metricsRegistry.ts
- [x] Import: const { Registry, Histogram, Counter, Gauge, collectDefaultMetrics } = require('prom-client')
- [x] Create registry: const register = new Registry()
- [x] Enable default metrics: collectDefaultMetrics({ register, prefix: 'nodejs_' })
- [x] Create histogram: httpRequestDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration in seconds', labelNames: ['method', 'route', 'status_code', 'user_role'], buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], registers: [register] })
- [x] Create counter: httpRequestsTotal = new Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status_code', 'user_role'], registers: [register] })
- [x] Create gauge: activeConnections = new Gauge({ name: 'active_connections', help: 'Number of active connections', registers: [register] })
- [x] Export: { register, httpRequestDuration, httpRequestsTotal, activeConnections }
- [x] Create server/src/middleware/metricsCollector.ts
- [x] Import metrics from metricsRegistry
- [x] Implement middleware: (req, res, next) => {}
- [x] Increment activeConnections on request start: activeConnections.inc()
- [x] Capture start time: const startTime = Date.now()
- [x] On response finish: calculate duration = (Date.now() - startTime) / 1000
- [x] Normalize route: replace :id, :uuid, numeric segments with {id}, {uuid}
- [x] Extract user role: const userRole = req.user?.role || 'anonymous'
- [x] Record histogram: httpRequestDuration.observe({ method: req.method, route: normalizedRoute, status_code: res.statusCode, user_role: userRole }, duration)
- [x] Increment counter: httpRequestsTotal.inc({ method: req.method, route: normalizedRoute, status_code: res.statusCode, user_role: userRole })
- [x] Decrement gauge: activeConnections.dec()
- [x] Create server/src/middleware/metricsAuth.ts
- [x] Check if auth enabled: const authEnabled = process.env.METRICS_AUTH_ENABLED === 'true'
- [x] If IP whitelist: const whitelist = process.env.METRICS_IP_WHITELIST?.split(',') || ['127.0.0.1', '::1']
- [x] Check IP: if (whitelist.includes(req.ip)) return next()
- [x] If basic auth: extract Authorization header, decode base64
- [x] Validate: if (username === process.env.METRICS_AUTH_USER && password === process.env.METRICS_AUTH_PASS) return next()
- [x] Else: return res.status(401).set('WWW-Authenticate', 'Basic realm="Metrics"').send('Unauthorized')
- [x] Create server/src/routes/metrics.routes.ts
- [x] Import: const { register } = require('../utils/metricsRegistry')
- [x] Define: router.get('/metrics', async (req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()) })
- [x] Export router
- [x] Modify server/src/app.ts
- [x] Import: const metricsCollector = require('./middleware/metricsCollector')
- [x] Register globally: app.use(metricsCollector) BEFORE route definitions
- [x] This ensures all requests are tracked
- [x] Modify server/src/routes/index.ts
- [x] Import: const metricsRouter = require('./metrics.routes'), const metricsAuth = require('../middleware/metricsAuth')
- [x] Register: app.use('/metrics', metricsAuth, metricsRouter)
- [x] Update server/.env.example with METRICS_AUTH_ENABLED, METRICS_AUTH_USER, METRICS_AUTH_PASS, METRICS_IP_WHITELIST
- [x] Test: Start server, make 10 API requests to various endpoints
- [x] Test: curl /metrics → verify http_requests_total shows count of 10+
- [x] Test: Verify histogram buckets populated with request durations
- [x] Test: Verify active_connections goes up during concurrent requests, back to 0 when idle
- [x] Test: Check route normalization: /api/users/123 recorded as /api/users/{id}
- [x] Test: Verify user_role label: authenticated requests show 'patient'/'doctor', unauthenticated show 'anonymous'
- [x] Test auth: curl /metrics without credentials → 401
- [x] Test auth: curl -u admin:wrong_pass /metrics → 401
- [x] Test auth: curl -u admin:correct_pass /metrics → 200 with metrics
- [x] Test IP whitelist: Request from external IP → 401 (if whitelist enabled)
- [x] Create server/docs/PROMETHEUS_SETUP.md
- [x] Document prometheus.yml configuration for scraping
- [x] Document basic_auth setup in Prometheus
- [x] Document static_configs with backend target
- [x] Document scrape_interval recommendation (15s)
- [x] Create server/docs/METRICS_REFERENCE.md
- [x] Document each metric: name, type (histogram/counter/gauge), labels, purpose, example values
- [x] Document http_request_duration_seconds: measures request latency distribution
- [x] Document http_requests_total: counts total requests by endpoint, method, status
- [x] Document active_connections: current number of concurrent requests
- [x] Document nodejs_* default metrics: heap size, GC duration, event loop lag
- [x] Add example PromQL queries: rate(http_requests_total[5m]), histogram_quantile(0.95, http_request_duration_seconds)
- [x] Add Grafana dashboard JSON example for visualizing metrics
- [x] Test Prometheus integration: Start Prometheus server, configure scrape, verify metrics collected
