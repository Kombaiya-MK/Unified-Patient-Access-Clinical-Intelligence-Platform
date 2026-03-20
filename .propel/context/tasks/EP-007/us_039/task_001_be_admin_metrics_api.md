# Task - TASK_001_BE_ADMIN_METRICS_API

## Requirement Reference
- User Story: US_039
- Story Location: .propel/context/tasks/us_039/us_039.md
- Acceptance Criteria:
    - System displays real-time metrics updated every 30 seconds via WebSocket
    - Current Queue Size, Average Wait Time, Today's Appointments (scheduled, checked-in, completed, no-shows)
    - System health metrics: API Response Times (<500ms target), AI Service Status, Database Connection Pool, Redis Cache Hit Rate
    - Operational KPIs for date range: Total Appointments, No-Show Rate, Average Booking Lead Time, Insurance Verification Success Rate, Patient Satisfaction Score
    - Allows filtering by date range (Today, Last 7 Days, Last 30 Days, Custom Range)
    - Allows exporting metrics as CSV
    - Displays alerts for system issues (Redis down, AI API quota exceeded, Database slow queries >5s)
- Edge Case:
    - WebSocket connection drops: System falls back to polling every 60 seconds, shows "Real-time sync paused" warning
    - Historical metrics storage: Daily aggregates saved to metrics table, raw data retained for 90 days per TR-006
    - No data for selected date range: API returns empty array with message

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
| Backend | Socket.IO | 4.x |
| Backend | node-cron | 3.x |
| Backend | json2csv | 6.x |
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

> **Note**: Backend API only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement Admin Dashboard backend metrics API: (1) Create database migration V027 for metrics table (daily aggregates, system health snapshots), (2) Metrics aggregation service calculating real-time queue metrics, wait times, appointment counts, (3) System health monitoring service querying Prometheus metrics, AI service status, DB pool stats, Redis cache stats, (4) API endpoints: GET /api/metrics/realtime (current queue/wait times), GET /api/metrics/kpis?from=date&to=date&range=7d|30d (operational KPIs), GET /api/metrics/system-health (API/DB/Redis/AI status), GET /api/metrics/alerts (active system alerts), POST /api/metrics/export (CSV export), (5) Extend WebSocket service (US_020 TASK_004) with 'metrics:update' event broadcasting every 30 seconds, (6) Daily aggregation cron job (node-cron) at midnight storing daily summaries, (7) Data retention worker cleaning raw data older than 90 days (TR-006), (8) Alert detection worker monitoring thresholds (API >500ms, Redis down, AI quota >90%, DB slow queries >5s).

## Dependent Tasks
- US-005 TASK_001: Prometheus metrics setup (API response times, connection gauges)
- US-020 TASK_004: Backend WebSocket service (extend with metrics channel)
- US-024: No-show data (feeds dashboard metrics)
- US-037: Insurance verification data (feeds dashboard metrics)

## Impacted Components
- database/migrations/V027__create_metrics_tables.sql - New migration
- server/src/services/metrics-aggregation.service.ts - New service
- server/src/services/system-health.service.ts - New service
- server/src/services/alert-detection.service.ts - New service
- server/src/controllers/metrics.controller.ts - New controller
- server/src/routes/metrics.routes.ts - New routes
- server/src/workers/metrics-aggregation-worker.ts - Daily cron job
- server/src/workers/data-retention-worker.ts - 90-day cleanup cron job
- server/src/services/websocketService.ts - Modify to add metrics channel (US_020)
- server/src/types/metrics.types.ts - TypeScript interfaces
- server/package.json - Add json2csv dependency

## Implementation Plan
1. **Database Migration V027**:
   - CREATE TABLE metrics_daily_aggregates: date, total_appointments, no_show_count, no_show_rate, avg_wait_time_minutes, avg_lead_time_days, insurance_verification_success_rate, patient_satisfaction_score
   - CREATE TABLE metrics_system_health_snapshots: timestamp, api_avg_response_ms, ai_service_success_rate, db_active_connections, db_max_connections, redis_cache_hit_rate
   - CREATE TABLE metrics_alerts: id, timestamp, alert_type ENUM ('redis_down', 'ai_quota_exceeded', 'db_slow_queries', 'api_slow'), severity ENUM ('critical', 'warning'), message, resolved_at, resolved_by
   - CREATE INDEX idx_metrics_daily_date ON metrics_daily_aggregates(date DESC)
   - CREATE INDEX idx_metrics_health_timestamp ON metrics_system_health_snapshots(timestamp DESC)
   - CREATE INDEX idx_metrics_alerts_unresolved ON metrics_alerts(timestamp DESC) WHERE resolved_at IS NULL
2. **Metrics Aggregation Service (metrics-aggregation.service.ts)**:
   - Function getRealTimeMetrics(): Promise<RealTimeMetrics>
     - Current Queue Size: SELECT COUNT(*) FROM appointments WHERE status IN ('scheduled', 'arrived', 'in_progress') AND appointment_date = CURRENT_DATE
     - Average Wait Time: SELECT AVG(EXTRACT(EPOCH FROM (in_progress_at - arrival_time)) / 60) FROM appointments WHERE status='in_progress' AND appointment_date = CURRENT_DATE
     - Today's Appointments: SELECT COUNT(*) FILTER (WHERE status='confirmed') as scheduled, COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) as checked_in, COUNT(*) FILTER (WHERE status='completed') as completed, COUNT(*) FILTER (WHERE status='no_show') as no_shows FROM appointments WHERE appointment_date = CURRENT_DATE
   - Function getOperationalKPIs(startDate: Date, endDate: Date): Promise<OperationalKPIs>
     - Total Appointments: SELECT COUNT(*) FROM appointments WHERE appointment_date BETWEEN startDate AND endDate
     - No-Show Rate: SELECT (COUNT(*) FILTER (WHERE status='no_show')) * 100.0 / COUNT(*) FROM appointments WHERE appointment_date BETWEEN startDate AND endDate
     - Avg Booking Lead Time: SELECT AVG(EXTRACT(DAYS FROM appointment_date - created_at)) FROM appointments WHERE created_at BETWEEN startDate AND endDate
     - Insurance Verification Success Rate: SELECT (COUNT(*) FILTER (WHERE verification_status='verified')) * 100.0 / COUNT(*) FROM insurance_verifications WHERE created_at BETWEEN startDate AND endDate
     - Patient Satisfaction Score: SELECT AVG(rating) FROM patient_surveys WHERE created_at BETWEEN startDate AND endDate (if survey data available)
   - Function getChartData(startDate: Date, endDate: Date): Promise<ChartData>
     - Daily Appointment Volume: SELECT appointment_date::date, COUNT(*) FROM appointments WHERE appointment_date BETWEEN startDate AND endDate GROUP BY appointment_date::date ORDER BY appointment_date
     - No-Shows by Day of Week: SELECT EXTRACT(DOW FROM appointment_date) as day_of_week, COUNT(*) FROM appointments WHERE status='no_show' AND appointment_date BETWEEN startDate AND endDate GROUP BY day_of_week ORDER BY day_of_week
     - Appointment Types Distribution: SELECT appointment_type, COUNT(*) FROM appointments WHERE appointment_date BETWEEN startDate AND endDate GROUP BY appointment_type
3. **System Health Service (system-health.service.ts)**:
   - Function getSystemHealth(): Promise<SystemHealth>
     - API Response Times: Query Prometheus /metrics endpoint: http_request_duration_seconds (calculate avg of last 100 requests), compare to target <500ms
     - AI Service Status: Query OpenAI usage API or check recent ai_service_logs table: success_count / total_count for last hour
     - Database Connection Pool: Query pg.Pool.totalCount and pg.Pool.idleCount → active = total - idle, return {active, max: pool.options.max}
     - Redis Cache Hit Rate: Calculate from Redis INFO stats: keyspace_hits / (keyspace_hits + keyspace_misses) * 100
   - Status indicators: Green (healthy), Yellow (warning threshold), Red (critical threshold)
   - Thresholds: API >500ms = Yellow, >1000ms = Red; DB connections >80% = Yellow, >95% = Red; Cache hit rate <60% = Yellow, <40% = Red
4. **Alert Detection Service (alert-detection.service.ts)**:
   - Function detectAlerts(): Promise<Alert[]>
     - Check Redis connection: Try redis.ping(), if fails → create alert 'redis_down', severity='critical'
     - Check AI quota: Query OpenAI usage API, if quota_used / quota_total > 0.9 → create alert 'ai_quota_exceeded', severity='warning'
     - Check DB slow queries: Query pg_stat_statements WHERE mean_exec_time > 5000 → create alert 'db_slow_queries', severity='warning'
     - Check API response time: Query Prometheus, if avg > 1000ms → create alert 'api_slow', severity='critical'
   - Function createAlert(type, severity, message): INSERT INTO metrics_alerts
   - Function resolveAlert(alertId, userId): UPDATE metrics_alerts SET resolved_at=NOW(), resolved_by=userId
   - Function getActiveAlerts(): SELECT * FROM metrics_alerts WHERE resolved_at IS NULL ORDER BY timestamp DESC
5. **Metrics Controller (metrics.controller.ts)**:
   - GET /api/metrics/realtime: Calls metricsAggregationService.getRealTimeMetrics(), returns {queueSize, avgWaitTime, todayAppointments}
   - GET /api/metrics/kpis: Parse query params (from, to, range), calculate date range, call getOperationalKPIs(), return KPIs
   - GET /api/metrics/chart-data: Parse query params, call getChartData(), return {dailyVolume, noShowsByDay, appointmentTypes}
   - GET /api/metrics/system-health: Call systemHealthService.getSystemHealth(), return {apiResponseTime, aiServiceStatus, dbPool, redisHitRate}
   - GET /api/metrics/alerts: Call alertDetectionService.getActiveAlerts(), return alerts array
   - POST /api/metrics/alerts/:id/resolve: Call alertDetectionService.resolveAlert(alertId, req.user.id), return success
   - POST /api/metrics/export: Parse query params (from, to), fetch data, convert to CSV using json2csv, set Content-Disposition header, stream CSV file
   - Authorization: All endpoints require 'admin' role via requireRole('admin') middleware
6. **Metrics Routes (metrics.routes.ts)**:
   - router.get('/realtime', authMiddleware, requireRole('admin'), metricsController.getRealtime)
   - router.get('/kpis', authMiddleware, requireRole('admin'), metricsController.getKPIs)
   - router.get('/chart-data', authMiddleware, requireRole('admin'), metricsController.getChartData)
   - router.get('/system-health', authMiddleware, requireRole('admin'), metricsController.getSystemHealth)
   - router.get('/alerts', authMiddleware, requireRole('admin'), metricsController.getAlerts)
   - router.post('/alerts/:id/resolve', authMiddleware, requireRole('admin'), metricsController.resolveAlert)
   - router.post('/export', authMiddleware, requireRole('admin'), metricsController.exportCSV)
7. **WebSocket Integration (extend websocketService.ts from US_020)**:
   - Add metrics broadcast function: broadcastMetricsUpdate()
   - On interval (every 30 seconds): Call metricsAggregationService.getRealTimeMetrics(), emit 'metrics:update' event to all admin clients
   - Handle WebSocket disconnect: Frontend falls back to polling GET /api/metrics/realtime every 60 seconds
8. **Daily Aggregation Worker (metrics-aggregation-worker.ts)**:
   - Use node-cron: cron.schedule('0 0 * * *', async () => {...}) - Runs daily at midnight
   - Calculate previous day's aggregates: total_appointments, no_show_count, no_show_rate, avg_wait_time, avg_lead_time
   - INSERT INTO metrics_daily_aggregates (date, ...) VALUES (CURRENT_DATE - INTERVAL '1 day', ...)
   - Log success: console.log(`Stored daily aggregates for ${date}`)
9. **Data Retention Worker (data-retention-worker.ts)**:
   - Use node-cron: cron.schedule('0 1 * * *', async () => {...}) - Runs daily at 1 AM
   - DELETE FROM metrics_system_health_snapshots WHERE timestamp < NOW() - INTERVAL '90 days'
   - Keep daily aggregates forever (historical reporting)
   - Log deleted rows count
10. **Alert Detection Worker (alert-detection-worker.ts)**:
    - Use node-cron: cron.schedule('*/5 * * * *', async () => {...}) - Runs every 5 minutes
    - Call alertDetectionService.detectAlerts()
    - For each detected issue: Check if alert already exists (WHERE resolved_at IS NULL), if not, create new alert
    - Log active alerts count

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── websocketService.ts (exists from US_020, to be modified)
│   │   ├── metrics-aggregation.service.ts (to be created)
│   │   ├── system-health.service.ts (to be created)
│   │   └── alert-detection.service.ts (to be created)
│   ├── controllers/
│   │   └── metrics.controller.ts (to be created)
│   ├── routes/
│   │   └── metrics.routes.ts (to be created)
│   ├── workers/
│   │   ├── metrics-aggregation-worker.ts (to be created)
│   │   ├── data-retention-worker.ts (to be created)
│   │   └── alert-detection-worker.ts (to be created)
│   ├── types/
│   │   └── metrics.types.ts (to be created)
│   └── app.ts (register metrics routes)
└── package.json (add json2csv dependency)
database/
├── migrations/
│   └── V027__create_metrics_tables.sql (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V027__create_metrics_tables.sql | Migration for metrics_daily_aggregates, metrics_system_health_snapshots, metrics_alerts tables |
| CREATE | server/src/types/metrics.types.ts | TypeScript interfaces: RealTimeMetrics, OperationalKPIs, SystemHealth, Alert, ChartData |
| CREATE | server/src/services/metrics-aggregation.service.ts | Service for calculating real-time metrics, KPIs, chart data |
| CREATE | server/src/services/system-health.service.ts | Service for querying Prometheus, AI service, DB pool, Redis cache stats |
| CREATE | server/src/services/alert-detection.service.ts | Service for detecting system alerts and managing alert lifecycle |
| CREATE | server/src/controllers/metrics.controller.ts | API controller for metrics endpoints |
| CREATE | server/src/routes/metrics.routes.ts | Express routes for /api/metrics/* endpoints |
| CREATE | server/src/workers/metrics-aggregation-worker.ts | Daily cron job storing daily metric aggregates |
| CREATE | server/src/workers/data-retention-worker.ts | Daily cron job cleaning data older than 90 days |
| CREATE | server/src/workers/alert-detection-worker.ts | Every 5 minutes cron job detecting system alerts |
| MODIFY | server/src/services/websocketService.ts | Add broadcastMetricsUpdate() function, emit 'metrics:update' every 30s |
| MODIFY | server/src/app.ts | Register metrics routes: app.use('/api/metrics', metricsRoutes) |
| MODIFY | server/package.json | Add json2csv@6.x, @types/json2csv dependencies |

## External References
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [node-cron](https://www.npmjs.com/package/node-cron)
- [json2csv](https://www.npmjs.com/package/json2csv)
- [Prometheus Query API](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/15/functions-datetime.html)
- [Redis INFO command](https://redis.io/commands/info/)

## Build Commands
```bash
# Run migration
psql -U postgres -d appointment_db -f database/migrations/V027__create_metrics_tables.sql

# Install dependencies
cd server
npm install json2csv @types/json2csv

# Start server with workers
npm run dev

# Test metrics endpoint
curl -X GET http://localhost:3001/api/metrics/realtime \
  -H "Authorization: Bearer <admin-token>"

# Test CSV export
curl -X POST http://localhost:3001/api/metrics/export \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"from": "2026-03-01", "to": "2026-03-19"}' \
  -o metrics.csv
```

## Implementation Validation Strategy
- [ ] Migration V027 runs successfully, 3 tables created
- [ ] GET /api/metrics/realtime returns current queue size, avg wait time, today's appointments
- [ ] GET /api/metrics/kpis with date range returns all KPIs (appointments, no-show rate, lead time, insurance verification, satisfaction)
- [ ] GET /api/metrics/chart-data returns arrays for daily volume, no-shows by day, appointment types
- [ ] GET /api/metrics/system-health returns API response time, AI service status, DB pool stats, Redis cache hit rate
- [ ] Status indicators correct: Green (<500ms), Yellow (500-1000ms), Red (>1000ms)
- [ ] GET /api/metrics/alerts returns active alerts array
- [ ] POST /api/metrics/alerts/:id/resolve updates resolved_at and resolved_by
- [ ] POST /api/metrics/export generates CSV file with correct Content-Disposition header
- [ ] WebSocket 'metrics:update' event emitted every 30 seconds to admin clients
- [ ] Daily aggregation worker runs at midnight, stores previous day's metrics
- [ ] Data retention worker runs at 1 AM, deletes snapshots older than 90 days
- [ ] Alert detection worker runs every 5 minutes, creates alerts for issues
- [ ] Non-admin users receive 403 Forbidden on metrics endpoints
- [ ] Empty date range returns empty array with descriptive message

## Implementation Checklist
- [ ] Create database/migrations/V027__create_metrics_tables.sql with 3 tables and 3 indexes
- [ ] Test migration: psql -f V027__create_metrics_tables.sql, verify tables exist
- [ ] Install dependencies: npm install json2csv @types/json2csv
- [ ] Create server/src/types/metrics.types.ts with all interfaces
- [ ] Implement server/src/services/metrics-aggregation.service.ts with getRealTimeMetrics(), getOperationalKPIs(), getChartData()
- [ ] Write SQL queries for current queue size, average wait time, today's appointments breakdown
- [ ] Write SQL queries for KPIs: total appointments, no-show rate, lead time, insurance verification rate
- [ ] Write SQL queries for chart data: daily volume, no-shows by day of week, appointment types
- [ ] Implement server/src/services/system-health.service.ts with getSystemHealth()
- [ ] Query Prometheus /metrics endpoint for API response times
- [ ] Calculate AI service success rate from ai_service_logs or OpenAI usage API
- [ ] Query PostgreSQL pg.Pool stats for active/max connections
- [ ] Query Redis INFO keyspace for cache hit rate calculation
- [ ] Implement status indicator logic: Green/Yellow/Red based on thresholds
- [ ] Implement server/src/services/alert-detection.service.ts with detectAlerts(), createAlert(), resolveAlert(), getActiveAlerts()
- [ ] Add alert detection logic: Redis ping, AI quota check, DB slow queries, API response time
- [ ] Create server/src/controllers/metrics.controller.ts with 7 endpoints
- [ ] Add authorization check: requireRole('admin') middleware on all endpoints
- [ ] Implement CSV export: Use json2csv to convert data, set Content-Disposition header, stream response
- [ ] Create server/src/routes/metrics.routes.ts with Express Router
- [ ] Register metrics routes in server/src/app.ts
- [ ] Modify server/src/services/websocketService.ts to add broadcastMetricsUpdate()
- [ ] Add setInterval(broadcastMetricsUpdate, 30000) in WebSocket server initialization
- [ ] Create server/src/workers/metrics-aggregation-worker.ts with midnight cron job
- [ ] Calculate and store daily aggregates for previous day
- [ ] Create server/src/workers/data-retention-worker.ts with 1 AM cron job
- [ ] Delete metrics_system_health_snapshots older than 90 days
- [ ] Create server/src/workers/alert-detection-worker.ts with 5-minute cron job
- [ ] Call alertDetectionService.detectAlerts() every 5 minutes
- [ ] Test GET /api/metrics/realtime with admin token, verify response structure
- [ ] Test GET /api/metrics/kpis with date range query params
- [ ] Test GET /api/metrics/chart-data, verify chart arrays
- [ ] Test GET /api/metrics/system-health, verify all 4 health indicators
- [ ] Test GET /api/metrics/alerts, verify active alerts array
- [ ] Test POST /api/metrics/alerts/:id/resolve, verify resolved_at updated
- [ ] Test POST /api/metrics/export, verify CSV file downloaded
- [ ] Test WebSocket connection, verify 'metrics:update' event received every 30s
- [ ] Test daily aggregation worker manually, verify daily aggregate row created
- [ ] Test data retention worker manually, verify old snapshots deleted
- [ ] Test alert detection worker manually, verify alerts created for threshold violations
- [ ] Test non-admin access: Verify 403 Forbidden
- [ ] Test empty date range: Verify empty array with message
- [ ] Document API endpoints in server/README.md
- [ ] Commit all files to version control
