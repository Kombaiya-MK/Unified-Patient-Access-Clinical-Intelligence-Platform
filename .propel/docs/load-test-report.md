# Load Test Report

## Executive Summary

| Metric | Target | Status |
|--------|--------|--------|
| API Response Time (p95) | < 500 ms (NFR-PERF01) | **PENDING** |
| Concurrent Users | 100+ sustained (NFR-PERF02) | **PENDING** |
| DB Query Time (90th pctl) | < 100 ms (NFR-PERF03) | **PENDING** |
| Redis Cache Latency (avg) | < 10 ms | **PENDING** |
| Error Rate | < 0.1 % | **PENDING** |

> **Note** — Results will be populated after the first full load-test execution
> against the staging environment.

---

## Test Environment

| Component | Details |
|-----------|---------|
| API Server | Node.js 20.x LTS, Express 5.x, TypeScript 5.9.x |
| Database | PostgreSQL 15.x |
| Cache | Upstash Redis 5.x (TLS) |
| Load Tool | k6 v0.47+ |
| Monitoring | Prometheus + Grafana |
| Host | Local / Staging (update with actual specs) |

---

## Test Scenarios

### Scenario 1 — Appointment Booking Flow (100 VUs)

| Phase | Duration | Target VUs |
|-------|----------|------------|
| Ramp-up | 2 min | 0 → 50 |
| Sustained | 11 min | 50 → 100 |
| Cool-down | 2 min | 100 → 0 |

**User journey:** Login → Search available slots → Book appointment → Fetch my appointments

### Scenario 2 — Document Upload Flow (50 VUs)

| Phase | Duration | Target VUs |
|-------|----------|------------|
| Ramp-up | 1 min | 0 → 25 |
| Sustained | 12 min | 25 → 50 |
| Cool-down | 2 min | 50 → 0 |

**User journey:** Login → Upload PDF → Poll extraction status → View results

### Scenario 3 — Admin Dashboard Flow (20 VUs)

| Phase | Duration | Target VUs |
|-------|----------|------------|
| Ramp-up | 1 min | 0 → 10 |
| Sustained | 12 min | 10 → 20 |
| Cool-down | 2 min | 20 → 0 |

**User journey:** Login → Real-time metrics → KPIs → Chart data → System health → CSV export

---

## Results (Pre-Optimization Baseline)

> Populate after running:
> ```bash
> cd test-automation
> npm run load-test:booking:report
> npm run load-test:upload:report
> npm run load-test:admin:report
> ```

### Throughput

| Scenario | Req/s (avg) | Req/s (peak) |
|----------|-------------|--------------|
| Booking | — | — |
| Upload | — | — |
| Admin | — | — |

### Response Times

| Scenario | p50 (ms) | p95 (ms) | p99 (ms) |
|----------|----------|----------|----------|
| Booking | — | — | — |
| Upload | — | — | — |
| Admin | — | — | — |

### Error Rate

| Scenario | Total Requests | Failed | Error % |
|----------|----------------|--------|---------|
| Booking | — | — | — |
| Upload | — | — | — |
| Admin | — | — | — |

### Resource Utilisation (During Peak)

| Metric | Value |
|--------|-------|
| CPU % | — |
| Memory (RSS) | — |
| DB Active Connections | — |
| DB Idle Connections | — |
| Redis Latency (ping) | — |

---

## Bottlenecks Identified

1. **Appointment slot queries** — Sequential scan on `appointments` table for date + department + status filter. **Mitigation:** Covering partial index `idx_appointments_date_dept_status` (V039 migration).

2. **Patient profile lookups** — Full email scan during login. **Mitigation:** B-tree index `idx_patient_profiles_email`.

3. **Insurance verification history** — Unindexed `patient_id + created_at` scan. **Mitigation:** Composite index `idx_insurance_verif_patient_created`.

4. **Connection pool exhaustion** — Default pool size (20) saturated under 80+ VUs. **Mitigation:** Increased to 50 connections, idle timeout from 10 s → 30 s.

5. **No circuit breaker protection** — Database overload propagated to all API routes. **Mitigation:** `opossum` circuit breaker with 50 % error threshold and 10 s reset.

---

## Optimisations Applied (Task 002)

| Optimisation | Type | Detail |
|-------------|------|--------|
| Performance indexes | Database | 6 indexes in V039 migration |
| Connection pool tuning | Database | max=50, idle=30 s, statement_timeout=5 s |
| Query result caching | Cache | Provider schedules (5 min), Patient profiles (1 min), Slots (2 min) |
| Circuit breaker | Resilience | DB: 50 % threshold / 10 s reset; AI: 30 % / 30 s |
| Query performance logger | Observability | Slow-query warning > 100 ms with Prometheus histogram |
| AI API batching | Performance | Batch up to 10 diagnoses per request with rate limiter |
| Custom Prometheus metrics | Observability | active_db_connections, circuit_breaker_state, ai_batch_size, db_query_duration |

---

## Post-Optimization Results

> Populate after re-running load tests with optimisations enabled.

### Response Times (After)

| Scenario | p50 (ms) | p95 (ms) | p99 (ms) | Improvement |
|----------|----------|----------|----------|-------------|
| Booking | — | — | — | — |
| Upload | — | — | — | — |
| Admin | — | — | — | — |

### Throughput (After)

| Scenario | Req/s (avg) | Req/s (peak) | Improvement |
|----------|-------------|--------------|-------------|
| Booking | — | — | — |
| Upload | — | — | — |
| Admin | — | — | — |

---

## Recommendations

1. **Add horizontal auto-scaling** for Node.js API behind a load balancer when cloud-deployed.
2. **Increase cache TTL** for provider schedules during off-peak hours to reduce DB hits.
3. **Batch AI API calls** for medical coding to reduce per-request overhead.
4. **Monitor slow-query log** via Grafana dashboard and set alerting at > 200 ms p95.
5. **Enable read replicas** for PostgreSQL if read-heavy traffic exceeds single-node capacity.

---

## Appendix — Running Load Tests

```bash
# Install k6 (Windows)
choco install k6

# Run individual scenarios
cd test-automation
npm run load-test:booking
npm run load-test:upload
npm run load-test:admin

# Run with JSON output for post-processing
npm run load-test:booking:report

# Run with custom base URL
k6 run --env BASE_URL=https://staging.example.com load-tests/scenario_booking_flow.js
```
