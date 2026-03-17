# Task - TASK_001_DEVOPS_GRAFANA_DASHBOARDS

## Requirement Reference
- User Story: US_006
- Story Location: `.propel/context/tasks/us_006/us_006.md`
- Acceptance Criteria:
    - AC1: Grafana dashboards display 99.9% uptime (30-day rolling), request latency P50/P95/P99, error rate %, system resources (CPU/Memory)
- Edge Cases:
    - Prometheus temporarily unavailable: Grafana displays "No data" with last successful query timestamp
    - Dashboard permissions: Admin role only, configure via Grafana RBAC

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Grafana Dashboard UI) |
| **Figma URL** | N/A (Grafana native UI) |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A (DevOps monitoring tool) |
| **UXR Requirements** | N/A |
| **Design Tokens** | Grafana default theme |

> **Note**: Grafana provides its own UI, no custom frontend development

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | Grafana | 10.x |
| Backend | Prometheus | 2.x |
| Backend | N/A (data source only) | N/A |
| Database | N/A | N/A |
| AI/ML | N/A | N/A |

**Note**: Grafana dashboards consume Prometheus metrics from US_005

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI features - monitoring dashboards only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No (Desktop-focused monitoring) |
| **Platform Target** | Web (Grafana UI) |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Grafana dashboards accessed via desktop browser

## Task Overview
Install Grafana 10.x, configure Prometheus as data source, create 3 dashboards: (1) System Health (uptime 99.9% gauge, error rate graph, request volume), (2) Performance Metrics (latency percentiles P50/P95/P99, response time heatmap, endpoint breakdown), (3) Infrastructure (CPU/Memory usage, database connections, Redis hit rate). Configure RBAC (admin-only access), set up alerts (uptime <99%, p95 latency >500ms, error rate >1%). Export dashboard JSON for version control.

## Dependent Tasks
- US_005: Prometheus metrics must be exposed at /metrics endpoint

## Impacted Components
**New:**
- grafana/ (Grafana installation directory or Docker compose)
- grafana/dashboards/system-health.json (System Health dashboard definition)
- grafana/dashboards/performance.json (Performance Metrics dashboard definition)
- grafana/dashboards/infrastructure.json (Infrastructure dashboard definition)
- grafana/provisioning/datasources/prometheus.yml (Prometheus data source config)
- grafana/provisioning/dashboards/default.yml (Auto-load dashboards on startup)

## Implementation Plan
1. **Install Grafana**: Download Grafana 10.x for Windows or use Docker (`docker run -d -p 3000:3000 grafana/grafana`)
2. **Configure Prometheus data source**: Add Prometheus endpoint (http://localhost:3001/metrics) in Grafana UI or provisioning file
3. **Create System Health dashboard**:
   - Panel 1: Uptime gauge (PromQL: `avg_over_time(up[30d]) * 100`) with threshold (green >99.9%, yellow 99-99.9%, red <99%)
   - Panel 2: Error rate graph (PromQL: `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100`)
   - Panel 3: Request volume (PromQL: `rate(http_requests_total[5m])`)
4. **Create Performance Metrics dashboard**:
   - Panel 1: Latency percentiles (PromQL: `histogram_quantile(0.50, http_request_duration_seconds_bucket)`, `0.95`, `0.99`)
   - Panel 2: Response time heatmap (PromQL: `http_request_duration_seconds_bucket`)
   - Panel 3: Endpoint breakdown table (PromQL: `topk(10, sum by (route) (rate(http_requests_total[5m])))`)
5. **Create Infrastructure dashboard**:
   - Panel 1: CPU usage (PromQL: `process_cpu_seconds_total`)
   - Panel 2: Memory usage (PromQL: `process_resident_memory_bytes / 1024 / 1024`) in MB
   - Panel 3: Database connections (PromQL: `active_connections` from custom metric)
   - Panel 4: Redis hit rate (PromQL: `redis_operations_total{status="hit"} / redis_operations_total`)
6. **Configure RBAC**: Create "Monitoring" organization, assign admin users to Editor role, restrict Viewer role
7. **Set up alerts**:
   - Alert 1: Uptime < 99.9% for 5 minutes → notify #alerts Slack channel
   - Alert 2: P95 latency > 500ms for 5 minutes → notify DevOps team
   - Alert 3: Error rate > 1% for 1 minute → page on-call engineer
8. **Export dashboard JSON**: Save dashboard definitions to grafana/dashboards/ for version control
9. **Configure provisioning**: Auto-load dashboards and data sources on Grafana startup using provisioning files

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend
├── server/               # Backend with /metrics endpoint (US_005)
└── (grafana/ to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | grafana/docker-compose.yml | Docker Compose for Grafana + Prometheus (optional) |
| CREATE | grafana/provisioning/datasources/prometheus.yml | Prometheus data source configuration |
| CREATE | grafana/provisioning/dashboards/default.yml | Auto-load dashboards on startup |
| CREATE | grafana/dashboards/system-health.json | System Health dashboard JSON export |
| CREATE | grafana/dashboards/performance.json | Performance Metrics dashboard JSON export |
| CREATE | grafana/dashboards/infrastructure.json | Infrastructure dashboard JSON export |
| CREATE | grafana/alerting/alerts.yml | Alert rules for uptime, latency, error rate |
| CREATE | grafana/README.md | Setup instructions, dashboard descriptions, PromQL queries |

> All files created as new - no existing Grafana setup

## External References
- [Grafana Installation](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)
- [Prometheus Data Source](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [PromQL Queries](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)
- [NFR-001 Uptime Requirements](../../../.propel/context/docs/spec.md#NFR-001)

## Build Commands
```bash
# Option 1: Docker installation
docker run -d -p 3000:3000 \
  -v $(pwd)/grafana/provisioning:/etc/grafana/provisioning \
  -v $(pwd)/grafana/dashboards:/var/lib/grafana/dashboards \
  grafana/grafana:10.0.0

# Option 2: Windows installation
# Download from: https://grafana.com/grafana/download?platform=windows
# Run installer

# Access Grafana
# URL: http://localhost:3000
# Default credentials: admin/admin (change on first login)

# Add Prometheus data source via UI
# Configuration → Data sources → Add Prometheus
# URL: http://localhost:3001/metrics

# Import dashboards
# Dashboards → Import → Upload JSON files from grafana/dashboards/
```

## Implementation Validation Strategy
- [ ] Unit tests: N/A (infrastructure setup)
- [ ] Integration tests: Verify Prometheus data source connected
- [ ] Grafana installed: Access http://localhost:3000 → see login page
- [ ] Prometheus data source configured: Data sources → Prometheus → "Data source is working"
- [ ] System Health dashboard displays: Shows uptime gauge, error rate graph, request volume
- [ ] Uptime calculation correct: PromQL `avg_over_time(up[30d]) * 100` returns ~99.9%
- [ ] Performance dashboard displays: Shows P50/P95/P99 latency, heatmap, endpoint table
- [ ] Latency values realistic: P50 <100ms, P95 <500ms (per NFR-002)
- [ ] Infrastructure dashboard displays: CPU, memory, DB connections, Redis hit rate
- [ ] RBAC configured: Login as non-admin → cannot edit dashboards (Viewer role only)
- [ ] Alerts configured: Check Alerting → Alert rules → verify 3 rules (uptime, latency, error rate)
- [ ] Alert triggers: Simulate high error rate → verify alert fires
- [ ] Dashboard JSON exported: grafana/dashboards/ contains 3 JSON files
- [ ] Provisioning works: Restart Grafana → dashboards auto-loaded

## Implementation Checklist
- [ ] Install Grafana: Docker (`docker run...`) or Windows installer
- [ ] Access Grafana UI: http://localhost:3000, login with admin/admin
- [ ] Change default admin password
- [ ] Create grafana/provisioning/datasources/prometheus.yml:
  - [ ] `apiVersion: 1`
  - [ ] `datasources: - name: Prometheus, type: prometheus, url: http://localhost:3001, access: proxy, isDefault: true`
- [ ] Create grafana/provisioning/dashboards/default.yml:
  - [ ] `apiVersion: 1`
  - [ ] `providers: - name: 'default', folder: '', type: file, options: { path: /var/lib/grafana/dashboards }`
- [ ] Create System Health dashboard in Grafana UI:
  - [ ] Panel 1: Gauge "Uptime (30-day)" with PromQL `avg_over_time(up[30d]) * 100`, threshold green >99.9%
  - [ ] Panel 2: Graph "Error Rate" with PromQL `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100`
  - [ ] Panel 3: Graph "Request Volume" with PromQL `rate(http_requests_total[5m])`
  - [ ] Export JSON: Settings → JSON Model → Copy to grafana/dashboards/system-health.json
- [ ] Create Performance Metrics dashboard:
  - [ ] Panel 1: Graph "Request Latency" with 3 series: P50, P95, P99 using `histogram_quantile()`
  - [ ] Panel 2: Heatmap "Response Time Distribution" with `http_request_duration_seconds_bucket`
  - [ ] Panel 3: Table "Top 10 Endpoints" with `topk(10, sum by (route) (rate(http_requests_total[5m])))`
  - [ ] Export JSON to grafana/dashboards/performance.json
- [ ] Create Infrastructure dashboard:
  - [ ] Panel 1: Graph "CPU Usage" with `rate(process_cpu_seconds_total[5m])`
  - [ ] Panel 2: Graph "Memory Usage (MB)" with `process_resident_memory_bytes / 1024 / 1024`
  - [ ] Panel 3: Gauge "Active DB Connections" with `active_connections`
  - [ ] Panel 4: Gauge "Redis Hit Rate" with `redis_operations_total{status="hit"} / redis_operations_total * 100`
  - [ ] Export JSON to grafana/dashboards/infrastructure.json
- [ ] Configure RBAC:
  - [ ] Configuration → Users → Create "monitoring-viewer" user with Viewer role
  - [ ] Test: Login as viewer → verify cannot edit dashboards
- [ ] Create alert rules (Alerting → Alert rules → New alert rule):
  - [ ] Alert 1: "Low Uptime" - Query: `avg_over_time(up[30d]) * 100 < 99.9`, For: 5m, Notify: #alerts Slack
  - [ ] Alert 2: "High Latency" - Query: `histogram_quantile(0.95, http_request_duration_seconds_bucket) > 0.5`, For: 5m, Notify: DevOps email
  - [ ] Alert 3: "High Error Rate" - Query: `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01`, For: 1m, Notify: PagerDuty
- [ ] Test alerts: Simulate high error rate (stop backend) → verify alert fires
- [ ] Document in grafana/README.md:
  - [ ] Setup instructions (Docker, provisioning, first login)
  - [ ] Dashboard descriptions (what each panel shows)
  - [ ] PromQL query explanations
  - [ ] Alert thresholds and notification channels
  - [ ] Troubleshooting (Prometheus unreachable, dashboards not loading)
- [ ] Test provisioning: `docker-compose down && docker-compose up` → verify dashboards auto-loaded
- [ ] Verify uptime tracking: Let system run for 24 hours → check uptime gauge shows correct percentage
