# Task - TASK_001_GRAFANA_DASHBOARD_SETUP

## Requirement Reference
- User Story: US_006  
- Story Location: `.propel/context/tasks/us_006/us_006.md`
- Acceptance Criteria:
    - AC1: Grafana dashboards display 99.9% uptime (30-day rolling window), request latency P50/P95/P99 percentiles, error rate percentage, and system resource usage (CPU/Memory)
- Edge Cases:
    - Prometheus temporarily unavailable: Grafana displays "No data" with last successful query timestamp
    - Dashboard permissions: Admin role only, configure authentication via Grafana RBAC

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Grafana dashboards - monitoring UI) |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | Grafana built-in UI |
| **UXR Requirements** | Dashboard must be readable at a glance, critical metrics prominently displayed |
| **Design Tokens** | N/A |

> **Note**: While this is UI, it's monitoring infrastructure using Grafana's built-in design system

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | N/A | N/A |
| Database | N/A | N/A |
| Monitoring | Grafana | 10.x+ |
| Monitoring | Prometheus | 2.x+ |
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

> **Note**: Monitoring dashboards only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Web-based monitoring interface only

## Task Overview
Set up Grafana monitoring platform with Prometheus data source integration, create comprehensive dashboards for system health monitoring including 99.9% uptime tracking (30-day rolling window), request latency percentiles (P50/P95/P99), error rates, and system resource usage. Configure RBAC for admin-only access, implement error handling for data source unavailability, and export dashboard JSON for version control.

## Dependent Tasks
- US_005: Prometheus metrics must be exposed and collecting data

## Impacted Components
**New:**
- monitoring/grafana/dashboards/upaci-system-health.json (Main dashboard JSON)
- monitoring/grafana/dashboards/upaci-api-performance.json (API metrics dashboard)
- monitoring/grafana/dashboards/upaci-infrastructure.json (CPU/Memory/Disk dashboard)
- monitoring/grafana/provisioning/datasources/prometheus.yml (Prometheus data source config)
- monitoring/grafana/provisioning/dashboards/default.yml (Dashboard provisioning config)
- monitoring/grafana/grafana.ini (Grafana configuration)
- monitoring/docker-compose.yml (Grafana + Prometheus containers)
- monitoring/docs/GRAFANA_SETUP.md (Installation and configuration guide)
- monitoring/docs/DASHBOARD_GUIDE.md (Dashboard usage and PromQL queries)

## Implementation Plan
1. **Grafana Installation**: Set up Grafana 10.x using Docker or local installation
2. **Prometheus Data Source**: Configure Prometheus connection (http://prometheus:9090 or localhost:9090)
3. **Dashboard Provisioning**: Set up automatic dashboard loading from JSON files
4. **Uptime Panel**: Create stat panel with PromQL: `avg_over_time(up[30d]) * 100` for 99.9% uptime
5. **Latency Percentiles**: Create graph panel with histogram_quantile for P50/P95/P99
6. **Error Rate Panel**: Create gauge panel with PromQL: `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])`
7. **CPU Usage Panel**: Create graph with `rate(process_cpu_seconds_total[5m]) * 100`
8. **Memory Usage Panel**: Create graph with `process_resident_memory_bytes / 1024 / 1024` (MB)
9. **Active Connections**: Create stat panel with `active_connections` gauge
10. **Request Rate**: Create graph with `rate(http_requests_total[5m])`
11. **RBAC Configuration**: Configure Grafana auth (OAuth, LDAP, or local users), restrict dashboards to Admin role
12. **Alert Rules**: Optional alert configuration for uptime < 99.9%, latency > 2s, error rate > 1%
13. **Time Range Controls**: Set default time range to 24h, allow 30d for uptime calculation
14. **No Data Handling**: Configure "No data" message and last query timestamp display
15. **Dashboard Variables**: Add filters for environment, service, endpoint

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002-005)
│   └── /metrics            # Prometheus endpoint (US_005)
├── database/                # Database setup
└── (monitoring/ to be created)  # Grafana + Prometheus setup
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | monitoring/docker-compose.yml | Grafana + Prometheus containers with network and volume config |
| CREATE | monitoring/grafana/grafana.ini | Grafana configuration (server, security, auth, dashboards) |
| CREATE | monitoring/grafana/provisioning/datasources/prometheus.yml | Prometheus data source with URL, access mode, scrape interval |
| CREATE | monitoring/grafana/provisioning/dashboards/default.yml | Auto-load dashboards from JSON files |
| CREATE | monitoring/grafana/dashboards/upaci-system-health.json | Main dashboard: uptime, latency, errors, connections |
| CREATE | monitoring/grafana/dashboards/upaci-api-performance.json | API-specific metrics: endpoints, response times, throughput |
| CREATE | monitoring/grafana/dashboards/upaci-infrastructure.json | System resources: CPU, memory, disk, network |
| CREATE | monitoring/prometheus/prometheus.yml | Prometheus scrape config (from US_005 docs) |
| CREATE | monitoring/prometheus/alerts.yml | Optional alert rules for critical thresholds |
| CREATE | monitoring/docs/GRAFANA_SETUP.md | Installation guide (Docker, standalone), first-time setup |
| CREATE | monitoring/docs/DASHBOARD_GUIDE.md | Dashboard overview, PromQL queries explained, troubleshooting |
| CREATE | monitoring/docs/RBAC_CONFIGURATION.md | User management, role-based access, OAuth integration |
| CREATE | monitoring/.env.example | GF_SECURITY_ADMIN_USER, GF_SECURITY_ADMIN_PASSWORD, GF_SERVER_ROOT_URL |
| CREATE | monitoring/scripts/import-dashboards.sh | Script to import dashboards via Grafana API |

> All files created as new - no existing monitoring infrastructure

## External References
- [Grafana Installation](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Prometheus Data Source](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [Dashboard JSON Model](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/)
- [PromQL Queries](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [histogram_quantile Function](https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile)
- [Grafana RBAC](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)

## Build Commands
```bash
# Navigate to monitoring directory
cd monitoring

# Start Grafana + Prometheus with Docker
docker-compose up -d

# Check services running
docker-compose ps
# Expected: grafana (port 3000), prometheus (port 9090)

# Access Grafana
# Open browser: http://localhost:3000
# Login: admin / admin (change password on first login)

# Verify Prometheus data source
# Grafana UI -> Configuration -> Data Sources -> Prometheus
# Test connection -> "Data source is working"

# Import dashboards (if not auto-loaded)
./scripts/import-dashboards.sh

# View System Health Dashboard
# Grafana UI -> Dashboards -> UPACI System Health

# Expected panels:
# - Uptime (30-day): 99.95% (stat panel)
# - Request Latency P50/P95/P99: Graph showing percentiles over time
# - Error Rate: 0.5% (gauge panel)
# - Active Connections: 15 (stat panel)
# - CPU Usage: 25% (graph)
# - Memory Usage: 512 MB (graph)

# Test Prometheus unavailable scenario
docker-compose stop prometheus
# Refresh Grafana dashboard
# Expected: Panels show "No data" with last query timestamp

# Restart Prometheus
docker-compose start prometheus
# Dashboard updates with current data

# Configure RBAC
# Grafana UI -> Configuration -> Users
# Create user with Viewer role (read-only)
# Verify: Viewer cannot edit dashboards

# Export dashboard JSON (for version control)
curl -H "Authorization: Bearer <api-key>" \
  http://localhost:3000/api/dashboards/uid/<dashboard-uid> \
  | jq .dashboard > dashboards/upaci-system-health.json

# Production deployment
# Update monitoring/.env with production values
# GF_SERVER_ROOT_URL=https://grafana.yourdomain.com
# Deploy with docker-compose or Kubernetes

# Stop services
docker-compose down
```

## Implementation Validation Strategy
- [ ] Unit tests pass (N/A for Grafana setup)
- [ ] Integration tests pass (dashboard queries return data)
- [ ] Grafana installed: `docker ps` shows grafana container running
- [ ] Grafana accessible: http://localhost:3000 loads login page
- [ ] Prometheus data source connected: Test connection succeeds in Grafana
- [ ] System Health dashboard exists: Lists in Grafana Dashboards menu
- [ ] Uptime panel works: Shows 99.9%+ for 30-day window
- [ ] Latency percentiles panel: Displays P50, P95, P99 lines on graph
- [ ] Error rate panel: Shows percentage < 1%
- [ ] CPU usage panel: Shows current CPU utilization
- [ ] Memory usage panel: Shows current memory consumption
- [ ] Active connections panel: Shows current gauge value
- [ ] Time range selector: Can switch between 1h, 6h, 24h, 7d, 30d
- [ ] Refresh interval: Auto-refresh every 5s, 10s, 30s, 1m options
- [ ] No data handling: Prometheus stopped → panels show "No data" message
- [ ] RBAC configured: Admin can edit, Viewer can only view dashboards
- [ ] Dashboard provisioning: JSON files auto-loaded on Grafana startup
- [ ] Alert rules: Optional alerts fire when thresholds exceeded

## Implementation Checklist
- [ ] Create monitoring/ directory structure: grafana/, prometheus/, docs/, scripts/
- [ ] Create monitoring/docker-compose.yml with Grafana and Prometheus services
- [ ] Define Grafana service: image: grafana/grafana:10.x, ports: 3000:3000, volumes for provisioning and dashboards
- [ ] Define Prometheus service: image: prom/prometheus:v2.x, ports: 9090:9090, volume for prometheus.yml
- [ ] Create network: monitoring-network for service communication
- [ ] Create monitoring/.env.example with GF_SECURITY_ADMIN_USER=admin, GF_SECURITY_ADMIN_PASSWORD=secure_password
- [ ] Create monitoring/grafana/grafana.ini configuration file
- [ ] Configure [server] section: http_port = 3000, root_url = http://localhost:3000
- [ ] Configure [security] section: admin_user = ${GF_SECURITY_ADMIN_USER}, admin_password = ${GF_SECURITY_ADMIN_PASSWORD}
- [ ] Configure [auth] section: disable_login_form = false (allow local login)
- [ ] Configure [dashboards] section: default_home_dashboard_path = /var/lib/grafana/dashboards/upaci-system-health.json
- [ ] Create monitoring/grafana/provisioning/datasources/prometheus.yml
- [ ] Define datasource: name: Prometheus, type: prometheus, url: http://prometheus:9090, access: proxy, isDefault: true
- [ ] Create monitoring/grafana/provisioning/dashboards/default.yml
- [ ] Configure: path: /var/lib/grafana/dashboards, options: { foldersFromFilesStructure: true }
- [ ] Create monitoring/prometheus/prometheus.yml (copy from US_005 docs)
- [ ] Configure scrape_configs to target backend /metrics endpoint
- [ ] Create monitoring/grafana/dashboards/upaci-system-health.json
- [ ] Design dashboard layout: 4x4 grid with 16 panels
- [ ] Add Uptime stat panel: query = `avg_over_time(up{job="upaci-backend"}[30d]) * 100`, format = percent, thresholds: red<99.9, yellow<99.95, green>=99.95
- [ ] Add Latency graph panel: 3 queries for P50/P95/P99 using histogram_quantile
- [ ] P50: `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))`
- [ ] P95: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- [ ] P99: `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))`
- [ ] Add Error Rate gauge panel: `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100`, format = percent, thresholds: green<0.5, yellow<1, red>=1
- [ ] Add Active Connections stat panel: `active_connections`, instant query
- [ ] Add CPU Usage graph panel: `rate(process_cpu_seconds_total{job="upaci-backend"}[5m]) * 100`, format = percent
- [ ] Add Memory Usage graph panel: `process_resident_memory_bytes{job="upaci-backend"} / 1024 / 1024`, format = MB
- [ ] Add Request Rate graph panel: `rate(http_requests_total[5m])`, format = req/s
- [ ] Add Response Time by Endpoint table panel: Group by route, show avg duration
- [ ] Configure time range: Default 24h, available options: 5m, 15m, 1h, 6h, 12h, 24h, 7d, 30d
- [ ] Configure refresh interval: Default 10s, options: 5s, 10s, 30s, 1m, 5m, off
- [ ] Configure no data behavior: Show "No data" with "Last successful query: <timestamp>"
- [ ] Add dashboard variables: $environment (prod, staging, dev), $service (backend, frontend)
- [ ] Create monitoring/grafana/dashboards/upaci-api-performance.json
- [ ] Add panels: Top 10 endpoints by request count, slowest endpoints, error rates by endpoint
- [ ] Create monitoring/grafana/dashboards/upaci-infrastructure.json
- [ ] Add panels: Node.js heap size, event loop lag, GC duration, open file descriptors
- [ ] Configure RBAC in Grafana UI: Settings -> Users -> Roles
- [ ] Create Admin role: Full access to all dashboards, edit permissions
- [ ] Create Viewer role: Read-only access, cannot edit or create dashboards
- [ ] Test RBAC: Login as Viewer → verify edit button disabled
- [ ] Create monitoring/scripts/import-dashboards.sh for API-based import
- [ ] Script: Loop through dashboards/*.json, POST to /api/dashboards/db
- [ ] Create monitoring/docs/GRAFANA_SETUP.md
- [ ] Document Docker installation: docker-compose up -d
- [ ] Document standalone installation: Download from grafana.com, install, start service
- [ ] Document first-time login: Change admin password, configure SMTP for alerts
- [ ] Document data source setup: Add Prometheus manually if provisioning fails
- [ ] Create monitoring/docs/DASHBOARD_GUIDE.md
- [ ] Document each panel: Purpose, PromQL query, interpretation
- [ ] Explain histogram_quantile: How percentiles calculated from histogram buckets
- [ ] Document troubleshooting: "No data" errors, query performance, cardinality issues
- [ ] Create monitoring/docs/RBAC_CONFIGURATION.md
- [ ] Document user creation, role assignment, OAuth integration (Google, GitHub)
- [ ] Start Grafana and Prometheus: docker-compose up -d
- [ ] Access Grafana: http://localhost:3000, login with admin credentials
- [ ] Verify Prometheus data source: Configuration -> Data Sources -> Test
- [ ] Verify dashboards loaded: Dashboards menu shows 3 dashboards
- [ ] Test uptime panel: Should show ~100% if backend running continuously
- [ ] Test latency panel: Should show 3 lines (P50 < P95 < P99)
- [ ] Test error rate panel: Should be < 1% in normal operation
- [ ] Generate load: Run load test (ab, artillery), verify metrics update in real-time
- [ ] Test no data handling: Stop Prometheus → verify "No data" message appears
- [ ] Test RBAC: Create viewer user, login, verify edit disabled
- [ ] Export dashboard: Settings -> JSON Model -> Copy and save to file
- [ ] Document queries in DASHBOARD_GUIDE.md for future reference
