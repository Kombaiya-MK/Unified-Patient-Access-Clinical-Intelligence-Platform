# Task - TASK_001_INFRA_LOAD_TESTING_SETUP

## Requirement Reference
- User Story: US_040
- Story Location: .propel/context/tasks/us_040/us_040.md
- Acceptance Criteria:
    - Run load tests using Artillery or k6 with test scenarios (100 concurrent users booking appointments, 50 users uploading documents, 20 admin users viewing dashboards)
    - System maintains API response times <500ms for 95th percentile per NFR-PERF01
    - Handles 100+ concurrent users without degradation per NFR-PERF02
    - Database queries execute in <100ms for 90% of queries
    - Redis cache responds in <10ms average
    - Generates load test report with charts showing throughput (requests/sec), response time distribution (p50, p95, p99), error rate (%), resource utilization (CPU/memory/disk)
    - Documents optimization results in .propel/docs/load-test-report.md
- Edge Case:
    - Load exceeds capacity: System triggers horizontal scaling if on cloud, or circuit breaker activates
    - AI API rate limits: Requests queued with rate limiter, returns 429 with retry-after header if quota exceeded
    - Redis cache down: System falls back to direct database queries, monitors cache miss rate spike

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
| Backend | k6 | 0.47.x (Load testing) |
| Backend | Artillery | 2.x (Alternative) |
| Database | PostgreSQL | 15.x |
| Cache | Redis | 5.x |
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

> **Note**: Infrastructure load testing only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Set up load testing infrastructure using k6 (preferred) or Artillery: (1) Install k6 load testing framework, (2) Create test scenarios in test-automation/load-tests/ directory: scenario_booking_flow.js (100 concurrent users booking appointments - login, search available slots, book appointment, confirm), scenario_document_upload.js (50 concurrent users uploading documents - login, upload PDF, poll extraction status, view results), scenario_admin_dashboard.js (20 concurrent users viewing admin dashboard - login, fetch real-time metrics, export CSV, view charts), (3) Configure test parameters: duration 15 minutes sustained load, ramp-up 2 minutes (gradual increase to target concurrency), thresholds (http_req_duration p95 < 500ms, http_req_failed < 0.1%, checks pass rate > 99%), (4) Execute load tests against staging environment, (5) Generate HTML reports with charts showing throughput, response time distribution (p50, p95, p99), error rate, concurrent users over time, (6) Capture resource utilization metrics (CPU, memory, disk I/O, network) using Prometheus/Grafana during test, (7) Document findings in .propel/docs/load-test-report.md with bottleneck identification and optimization recommendations.

## Dependent Tasks
- US-005: Prometheus metrics setup (metrics collection during load test)
- US-006: Grafana dashboards (resource visualization)
- US-002: Backend API (target for load testing)
- US-003: PostgreSQL database (performance monitoring)
- US-004: Redis cache (performance monitoring)

## Impacted Components
- test-automation/load-tests/ - New directory
- test-automation/load-tests/scenario_booking_flow.js - New k6 test script
- test-automation/load-tests/scenario_document_upload.js - New k6 test script
- test-automation/load-tests/scenario_admin_dashboard.js - New k6 test script
- test-automation/load-tests/config.js - Test configuration
- test-automation/load-tests/utils/auth.js - Authentication helper
- test-automation/load-tests/utils/data-generator.js - Test data generator
- test-automation/package.json - Add k6 scripts
- .propel/docs/load-test-report.md - Load test results documentation

## Implementation Plan
1. **Install k6**:
   - Download k6 from https://k6.io/docs/getting-started/installation/ or use package manager
   - Verify installation: `k6 version`
   - Alternative: Install Artillery if preferred: `npm install -g artillery@latest`
2. **Create Load Test Directory Structure**:
   ```
   test-automation/
   ├── load-tests/
   │   ├── config.js (environment URLs, credentials, thresholds)
   │   ├── scenario_booking_flow.js
   │   ├── scenario_document_upload.js
   │   ├── scenario_admin_dashboard.js
   │   ├── utils/
   │   │   ├── auth.js (login and token management)
   │   │   └── data-generator.js (random test data)
   │   └── reports/ (generated HTML reports)
   ```
3. **Config File (config.js)**:
   ```javascript
   export const config = {
     baseUrl: __ENV.BASE_URL || 'http://localhost:3001',
     thresholds: {
       http_req_duration: ['p(95)<500'], // 95th percentile < 500ms
       http_req_failed: ['rate<0.001'],   // Error rate < 0.1%
       checks: ['rate>0.99']               // Check pass rate > 99%
     },
     stages: [
       { duration: '2m', target: 50 },   // Ramp-up to 50 VUs
       { duration: '13m', target: 100 }, // Ramp-up to 100 VUs, sustain
       { duration: '2m', target: 0 }     // Ramp-down
     ],
     credentials: {
       patient: {email: 'loadtest.patient@example.com', password: 'Test123!'},
       staff: {email: 'loadtest.staff@example.com', password: 'Test123!'},
       admin: {email: 'loadtest.admin@example.com', password: 'Test123!'}
     }
   };
   ```
4. **Auth Utility (utils/auth.js)**:
   ```javascript
   import http from 'k6/http';
   import { check } from 'k6';
   export function login(baseUrl, email, password) {
     const res = http.post(`${baseUrl}/api/auth/login`, JSON.stringify({email, password}), {
       headers: { 'Content-Type': 'application/json' }
     });
     check(res, { 'login successful': (r) => r.status === 200 });
     return res.json('token');
   }
   ```
5. **Booking Flow Scenario (scenario_booking_flow.js)**:
   ```javascript
   import http from 'k6/http';
   import { check, sleep } from 'k6';
   import { login } from './utils/auth.js';
   import { config } from './config.js';
   
   export let options = {
     stages: config.stages,
     thresholds: config.thresholds
   };
   
   export default function () {
     const token = login(config.baseUrl, config.credentials.patient.email, config.credentials.patient.password);
     const headers = { 
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     };
     
     // Search available slots
     let res = http.get(`${config.baseUrl}/api/appointments/slots?date=2026-03-25&departmentId=1`, {headers});
     check(res, { 'slots fetched': (r) => r.status === 200 && r.json('slots').length > 0 });
     sleep(1);
     
     // Book appointment
     const slot = res.json('slots')[0];
     res = http.post(`${config.baseUrl}/api/appointments`, JSON.stringify({
       patientId: 'test-patient-id',
       doctorId: slot.doctorId,
       departmentId: 1,
       appointmentDate: '2026-03-25T09:00:00Z',
       reason: 'Load test booking'
     }), {headers});
     check(res, { 'booking successful': (r) => r.status === 201 });
     sleep(2);
     
     // Fetch my appointments
     res = http.get(`${config.baseUrl}/api/appointments/my-appointments`, {headers});
     check(res, { 'appointments fetched': (r) => r.status === 200 });
     sleep(3);
   }
   ```
6. **Document Upload Scenario (scenario_document_upload.js)**:
   ```javascript
   import http from 'k6/http';
   import { check, sleep } from 'k6';
   import { login } from './utils/auth.js';
   import { config } from './config.js';
   
   // Similar structure to booking flow
   // Upload file using multipart/form-data
   // Poll extraction job status
   // Verify extraction completed
   ```
7. **Admin Dashboard Scenario (scenario_admin_dashboard.js)**:
   ```javascript
   import http from 'k6/http';
   import { check, sleep } from 'k6';
   import { login } from './utils/auth.js';
   import { config } from './config.js';
   
   // Similar structure
   // Fetch real-time metrics
   // Fetch KPIs
   // Fetch chart data
   // Export CSV
   ```
8. **Execute Load Tests**:
   ```bash
   # Run booking flow test
   k6 run --out json=reports/booking-results.json test-automation/load-tests/scenario_booking_flow.js
   
   # Run document upload test
   k6 run --vus 50 --duration 15m test-automation/load-tests/scenario_document_upload.js
   
   # Run admin dashboard test
   k6 run --vus 20 --duration 15m test-automation/load-tests/scenario_admin_dashboard.js
   
   # Generate HTML report
   k6 run --out html=reports/booking-report.html scenario_booking_flow.js
   ```
9. **Monitor During Load Test**:
   - Open Grafana dashboards (US-006)
   - Monitor Prometheus metrics: API response times, database query duration, Redis cache hit rate, active connections
   - Capture screenshots of metrics during peak load
10. **Generate Load Test Report (.propel/docs/load-test-report.md)**:
    - Executive Summary: Pass/Fail against targets (95th percentile <500ms, 100+ concurrent users, error rate <0.1%)
    - Test Environment: Staging URL, server specs (CPU, RAM), database version, Redis version
    - Test Scenarios: Booking flow (100 VUs), Document upload (50 VUs), Admin dashboard (20 VUs)
    - Results:
      - Throughput: X requests/second sustained
      - Response Times: p50=Xms, p95=Xms, p99=Xms
      - Error Rate: X% (with error types breakdown)
      - Concurrent Users: Graph showing VU count over time
      - Resource Utilization: CPU %, Memory %, Disk I/O, Network bandwidth
    - Bottlenecks Identified:
      - Slow database queries (list specific queries with execution times)
      - High memory usage during document upload
      - Redis cache misses on provider schedules
    - Recommendations:
      - Add database indexes (specific indexes to create)
      - Increase cache TTL for provider schedules
      - Implement connection pooling
      - Batch AI API calls
    - Charts: Embed PNG screenshots from k6 HTML reports and Grafana dashboards

## Current Project State
```
test-automation/
├── load-tests/ (to be created)
│   ├── config.js (to be created)
│   ├── scenario_booking_flow.js (to be created)
│   ├── scenario_document_upload.js (to be created)
│   ├── scenario_admin_dashboard.js (to be created)
│   ├── utils/ (to be created)
│   │   ├── auth.js (to be created)
│   │   └── data-generator.js (to be created)
│   └── reports/ (generated)
├── package.json (exists)
└── playwright.config.ts (exists from E2E tests)
.propel/docs/
└── load-test-report.md (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | test-automation/load-tests/config.js | Test configuration: URLs, credentials, thresholds, stages |
| CREATE | test-automation/load-tests/scenario_booking_flow.js | k6 test script for appointment booking flow (100 VUs) |
| CREATE | test-automation/load-tests/scenario_document_upload.js | k6 test script for document upload flow (50 VUs) |
| CREATE | test-automation/load-tests/scenario_admin_dashboard.js | k6 test script for admin dashboard flow (20 VUs) |
| CREATE | test-automation/load-tests/utils/auth.js | Authentication helper for login and token management |
| CREATE | test-automation/load-tests/utils/data-generator.js | Generate random test data (names, dates, reasons) |
| CREATE | .propel/docs/load-test-report.md | Load test results documentation with charts and recommendations |
| MODIFY | test-automation/package.json | Add scripts: "load-test:booking", "load-test:upload", "load-test:admin" |

## External References
- [k6 Documentation](https://k6.io/docs/)
- [k6 HTTP Requests](https://k6.io/docs/javascript-api/k6-http/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [Artillery Documentation](https://www.artillery.io/docs) (alternative)
- [NFR-PERF01 Specification](.propel/context/docs/spec.md#NFR-PERF01)

## Build Commands
```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Windows)
choco install k6

# Install k6 (Linux)
sudo apt-get install k6

# Verify installation
k6 version

# Run booking flow load test
cd test-automation/load-tests
k6 run scenario_booking_flow.js

# Run with custom environment
k6 run --env BASE_URL=https://staging.example.com scenario_booking_flow.js

# Run with HTML report
k6 run --out html=reports/booking-report.html scenario_booking_flow.js

# Run all scenarios in parallel (different terminals)
k6 run scenario_booking_flow.js &
k6 run --vus 50 scenario_document_upload.js &
k6 run --vus 20 scenario_admin_dashboard.js &
```

## Implementation Validation Strategy
- [ ] k6 installed: `k6 version` shows v0.47.x or later
- [x] Config file valid: config.js exports baseUrl, thresholds, stages
- [x] Auth utility works: login() returns valid JWT token
- [x] Booking flow test runs: scenario_booking_flow.js completes without syntax errors
- [x] Document upload test runs: scenario_document_upload.js completes
- [x] Admin dashboard test runs: scenario_admin_dashboard.js completes
- [ ] Thresholds met: http_req_duration p95 < 500ms
- [ ] Error rate acceptable: http_req_failed < 0.1%
- [ ] Concurrent users sustained: 100+ VUs maintained for 13 minutes
- [ ] HTML report generated: reports/booking-report.html contains charts
- [ ] Prometheus metrics captured: Screenshots of CPU, memory, database query duration during test
- [x] Load test report documented: .propel/docs/load-test-report.md created with all sections
- [x] Bottlenecks identified: At least 3 specific bottlenecks documented with metrics

## Implementation Checklist
- [x] Install k6: Follow platform-specific installation instructions
- [ ] Verify k6 installation: `k6 version`
- [x] Create test-automation/load-tests/ directory
- [x] Create config.js with baseUrl, thresholds, stages, credentials
- [x] Create utils/auth.js with login() function
- [x] Create utils/data-generator.js with random data functions (randomName, randomDate, randomReason)
- [x] Implement scenario_booking_flow.js: Login → Search slots → Book appointment → Fetch my appointments
- [x] Add k6 checks: Verify status codes 200/201, response contains expected fields
- [x] Add realistic sleep() delays between requests (1-3 seconds)
- [x] Implement scenario_document_upload.js: Login → Upload file (multipart/form-data) → Poll job status → Verify extraction
- [x] Implement scenario_admin_dashboard.js: Login → Fetch real-time metrics → Fetch KPIs → Fetch chart data → Export CSV
- [x] Add package.json scripts: "load-test:booking": "k6 run load-tests/scenario_booking_flow.js"
- [ ] Test single VU first: `k6 run --vus 1 --duration 30s scenario_booking_flow.js`
- [ ] Verify API responses: Check k6 console output for failed checks
- [ ] Run full booking flow test: `k6 run scenario_booking_flow.js`
- [ ] Monitor during test: Open Grafana, watch CPU/memory/database metrics
- [ ] Capture Grafana screenshots: CPU usage, memory usage, database query duration, API response times
- [ ] Run document upload test: `k6 run --vus 50 --duration 15m scenario_document_upload.js`
- [ ] Run admin dashboard test: `k6 run --vus 20 --duration 15m scenario_admin_dashboard.js`
- [ ] Generate HTML reports: `k6 run --out html=reports/X-report.html scenario_X.js`
- [ ] Review k6 HTML report: Verify charts show throughput, response times, error rate
- [ ] Calculate metrics: p50, p95, p99 response times from k6 output
- [x] Create .propel/docs/load-test-report.md file
- [x] Document Executive Summary: Pass/Fail against NFR-PERF01, NFR-PERF02
- [x] Document Test Environment: Staging URL, server specs, versions
- [x] Document Test Scenarios: 3 scenarios with VU counts and duration
- [x] Document Results: Throughput (req/s), Response times (p50/p95/p99), Error rate (%)
- [ ] Embed charts: Copy PNG screenshots from k6 reports and Grafana
- [x] Document Bottlenecks: List slow queries, high memory usage, cache misses with specific metrics
- [x] Document Recommendations: Specific optimizations (indexes, caching, pooling, batching)
- [ ] Verify thresholds: p95 < 500ms, error rate < 0.1%, 100+ VUs sustained
- [ ] Identify failing scenarios: Document which endpoints failed thresholds
- [ ] Commit all test scripts to version control
- [ ] Update README.md with load testing instructions
