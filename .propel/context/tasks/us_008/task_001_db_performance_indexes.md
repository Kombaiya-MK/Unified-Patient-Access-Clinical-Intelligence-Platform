# Task - TASK_001_DB_PERFORMANCE_INDEXES

## Requirement Reference
- User Story: US_008
- Story Location: `.propel/context/tasks/us_008/us_008.md`
- Acceptance Criteria:
    - AC1: Indexes created on timeslots(staff_id, date), appointments(patient_id, status, appointment_date), users(email), audit_logs(user_id, created_at)
    - Query performance targets: <100ms for slot availability, <200ms for patient lookup
- Edge Cases:
    - Creating index on large existing table: Use CREATE INDEX CONCURRENTLY to avoid table locking
    - Unused indexes: Monitor pg_stat_user_indexes, remove indexes with low idx_scan counts

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

> **Note**: Database performance optimization - no UI impact

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | N/A (database only) | N/A |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

**Note**: All indexes MUST be compatible with PostgreSQL 16.x query planner

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI features - database indexing only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend database optimization

## Task Overview
Create optimized B-tree and composite indexes on high-traffic columns: (1) time_slots: composite index (provider_id, appointment_date, is_available) for slot availability queries, (2) appointments: composite index (patient_id, appointment_date, status) for patient dashboard, single index (status) for queue filtering, (3) users: unique index (email) for login, (4) audit_logs: composite index (user_id, created_at DESC) for audit trail queries, (5) clinical_documents: HNSW vector index (embedding) for similarity search, (6) waitlist: composite index (slot_id, status, priority DESC) for waitlist processing. Use CONCURRENTLY for production safety. Validate query plans with EXPLAIN ANALYZE.

## Dependent Tasks  
- US_003 Task 001: Database schema must exist (tables created)

## Impacted Components
**New:**
- server/db/indexes-performance.sql (Performance optimization indexes)
- server/db/analyze-queries.sql (EXPLAIN ANALYZE queries for validation)
- server/db/index-monitoring.sql (Queries to monitor index usage via pg_stat_user_indexes)

## Implementation Plan
1. **Analyze current query patterns**: Review application queries from logs/APM to identify frequently executed queries
2. **Create time_slots indexes**:
   - Composite: `(provider_id, appointment_date, is_available)` for slot availability API
   - Single: `(appointment_date)` for calendar view
3. **Create appointments indexes**:
   - Composite: `(patient_id, appointment_date DESC, status)` covering index for patient dashboard
   - Single: `(status, appointment_date)` for queue management filtering
   - Single: `(provider_id, appointment_date)` for provider schedule
4. **Create users indexes**:
   - Unique: `(email)` for login queries (already likely exists from UNIQUE constraint)
   - Single: `(role, is_active)` for role-based filtering
5. **Create audit_logs indexes**:
   - Composite: `(user_id, created_at DESC)` for user audit trail pagination
   - Composite: `(resource_type, resource_id, created_at DESC)` for resource-specific audits
6. **Create clinical_documents indexes**:
   - Vector: `(embedding)` using HNSW or IVFFlat for similarity search (pgvector)
   - Single: `(patient_id, created_at DESC)` for patient document history
7. **Create waitlist indexes**:
   - Composite: `(slot_id, status, priority DESC)` for waitlist queue processing
8. **Create notifications indexes**:
   - Composite: `(user_id, is_read, created_at DESC)` for notification feed
9. **Use CONCURRENTLY**: All production index creation uses `CREATE INDEX CONCURRENTLY` to avoid table locking
10. **Validate query plans**: Run EXPLAIN ANALYZE on key queries before/after indexing, verify Index Scan (not Seq Scan)
11. **Monitor index usage**: Query `pg_stat_user_indexes` weekly to identify unused indexes (idx_scan = 0)
12. **Document index rationale**: Add comments to each index explaining which query it optimizes

## Current Project State
```
ASSIGNMENT/
├── server/
│   └── db/
│       ├── schema.sql (tables exist from US_003)
│       └── indexes.sql (basic FK indexes exist)
└── (indexes-performance.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/db/indexes-performance.sql | Performance indexes with CONCURRENTLY, comments explaining queries |
| CREATE | server/db/analyze-queries.sql | EXPLAIN ANALYZE for key queries (slot availability, patient lookup, audit trail) |
| CREATE | server/db/index-monitoring.sql | Queries to check index usage stats from pg_stat_user_indexes |
| UPDATE | server/db/README.md | Document index strategy, monitoring process, maintenance schedule |

> Creates 3 new files, updates 1 existing file

## External References
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [CREATE INDEX CONCURRENTLY](https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY)
- [EXPLAIN ANALYZE](https://www.postgresql.org/docs/current/sql-explain.html)
- [pgvector Indexing](https://github.com/pgvector/pgvector#indexing)
- [pg_stat_user_indexes](https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-ALL-INDEXES-VIEW)
- [Index Maintenance Best Practices](https://www.postgresql.org/docs/current/routine-reindex.html)

## Build Commands
```bash
# Run performance index creation
cd server/db
psql -U postgres -d upaci -f indexes-performance.sql

# Analyze query performance (before/after)
psql -U postgres -d upaci -f analyze-queries.sql

# Monitor index usage
psql -U postgres -d upaci -f index-monitoring.sql

# Rebuild index if needed (maintenance)
psql -U postgres -d upaci -c "REINDEX INDEX CONCURRENTLY idx_appointments_patient_date;"
```

## Implementation Validation Strategy
- [ ] Unit tests: N/A (database indexing)
- [ ] Integration tests: Query performance tests (<100ms slot availability, <200ms patient lookup)
- [ ] Indexes created: `\di` lists all performance indexes
- [ ] Index on time_slots: `\d time_slots` shows index on (provider_id, appointment_date, is_available)
- [ ] Index on appointments: `\d appointments` shows indexes on (patient_id, appointment_date, status), (status, appointment_date)
- [ ] Index on users: `\d users` shows unique index on (email)
- [ ] Index on audit_logs: `\d audit_logs` shows index on (user_id, created_at DESC)
- [ ] Vector index on clinical_documents: `\d clinical_documents` shows HNSW index on (embedding)
- [ ] Query plan verification (slot availability): `EXPLAIN ANALYZE SELECT * FROM time_slots WHERE provider_id = 'X' AND appointment_date = 'Y' AND is_available = true` → uses Index Scan, cost <5.0, execution <5ms
- [ ] Query plan verification (patient lookup): `EXPLAIN ANALYZE SELECT * FROM appointments WHERE patient_id = 'X' ORDER BY appointment_date DESC LIMIT 10` → uses Index Scan, execution <10ms
- [ ] Query plan verification (audit trail): `EXPLAIN ANALYZE SELECT * FROM audit_logs WHERE user_id = 'X' ORDER BY created_at DESC LIMIT 50` → uses Index Scan, execution <20ms
- [ ] Slot availability query <100ms: Run query 100 times → p95 <100ms
- [ ] Patient lookup query <200ms: Run query 100 times → p95 <200ms
- [ ] Index usage monitored: Query pg_stat_user_indexes → all indexes have idx_scan > 0 after 1 week
- [ ] No unused indexes: No indexes with idx_scan = 0 after 1 month (remove if found)

## Implementation Checklist
- [ ] Create server/db/indexes-performance.sql:
  - [ ] `-- time_slots indexes for slot availability API (GET /api/slots)`
  - [ ] `CREATE INDEX CONCURRENTLY idx_timeslots_provider_date_available ON time_slots (provider_id, appointment_date, is_available) WHERE is_available = true;`
  - [ ] `CREATE INDEX CONCURRENTLY idx_timeslots_date ON time_slots (appointment_date);`
  - [ ] `-- appointments indexes for patient dashboard and queue management`
  - [ ] `CREATE INDEX CONCURRENTLY idx_appointments_patient_date_status ON appointments (patient_id, appointment_date DESC, status);`
  - [ ] `CREATE INDEX CONCURRENTLY idx_appointments_status_date ON appointments (status, appointment_date) WHERE status IN ('scheduled', 'confirmed');`
  - [ ] `CREATE INDEX CONCURRENTLY idx_appointments_provider_date ON appointments (provider_id, appointment_date);`
  - [ ] `-- users indexes for login and role filtering`
  - [ ] `CREATE UNIQUE INDEX CONCURRENTLY idx_users_email ON users (email);` (if not exists from UNIQUE constraint)
  - [ ] `CREATE INDEX CONCURRENTLY idx_users_role_active ON users (role, is_active) WHERE is_active = true;`
  - [ ] `-- audit_logs indexes for audit trail queries`
  - [ ] `CREATE INDEX CONCURRENTLY idx_auditlogs_user_created ON audit_logs (user_id, created_at DESC);`
  - [ ] `CREATE INDEX CONCURRENTLY idx_auditlogs_resource_created ON audit_logs (resource_type, resource_id, created_at DESC);`
  - [ ] `-- clinical_documents indexes for vector similarity and patient history`
  - [ ] `CREATE INDEX CONCURRENTLY idx_clinicaldocs_embedding ON clinical_documents USING hnsw (embedding vector_cosine_ops);`
  - [ ] `CREATE INDEX CONCURRENTLY idx_clinicaldocs_patient_created ON clinical_documents (patient_id, created_at DESC);`
  - [ ] `-- waitlist indexes for queue processing`
  - [ ] `CREATE INDEX CONCURRENTLY idx_waitlist_slot_status_priority ON waitlist (slot_id, status, priority DESC) WHERE status = 'waiting';`
  - [ ] `-- notifications indexes for notification feed`
  - [ ] `CREATE INDEX CONCURRENTLY idx_notifications_user_unread_created ON notifications (user_id, is_read, created_at DESC);`
- [ ] Create server/db/analyze-queries.sql:
  - [ ] `-- Analyze slot availability query`
  - [ ] `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM time_slots WHERE provider_id = 'sample-provider-uuid' AND appointment_date = '2025-03-20' AND is_available = true;`
  - [ ] `-- Analyze patient lookup query`
  - [ ] `EXPLAIN (ANALYZE, BUFFERS) SELECT a.*, u.first_name, u.last_name FROM appointments a JOIN users u ON a.provider_id = u.id WHERE a.patient_id = 'sample-patient-uuid' ORDER BY a.appointment_date DESC LIMIT 10;`
  - [ ] `-- Analyze audit trail query`
  - [ ] `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM audit_logs WHERE user_id = 'sample-user-uuid' ORDER BY created_at DESC LIMIT 50;`
  - [ ] `-- Analyze queue management query`
  - [ ] `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM appointments WHERE status = 'scheduled' AND appointment_date = CURRENT_DATE ORDER BY appointment_date;`
- [ ] Create server/db/index-monitoring.sql:
  - [ ] `-- Check index usage statistics`
  - [ ] `SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan ASC;`
  - [ ] `-- Find unused indexes (idx_scan = 0)`
  - [ ] `SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS size FROM pg_stat_user_indexes WHERE schemaname = 'public' AND idx_scan = 0 AND indexname NOT LIKE 'pg_%';`
  - [ ] `-- Show index sizes`
  - [ ] `SELECT tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS size FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY pg_relation_size(indexrelid) DESC;`
- [ ] Run performance index creation: `psql -U postgres -d upaci -f indexes-performance.sql`
- [ ] Verify indexes created: `psql -U postgres -d upaci -c "\di"` → list includes all idx_* indexes
- [ ] Run query analysis (before indexing): Save EXPLAIN ANALYZE results as baseline
- [ ] Run query analysis (after indexing): Compare to baseline → verify Index Scan used, cost reduced by 90%+
- [ ] Test slot availability query performance:
  - [ ] `\timing` in psql
  - [ ] `SELECT * FROM time_slots WHERE provider_id = 'X' AND appointment_date = '2025-03-20' AND is_available = true;`
  - [ ] Verify execution time <10ms (in-memory), <100ms (cold cache)
- [ ] Test patient lookup performance:
  - [ ] `SELECT * FROM appointments WHERE patient_id = 'X' ORDER BY appointment_date DESC LIMIT 10;`
  - [ ] Verify execution time <20ms
- [ ] Monitor index usage after 1 week: `psql -U postgres -d upaci -f index-monitoring.sql` → verify all indexes have idx_scan > 0
- [ ] Update server/db/README.md:
  - [ ] Document index strategy: Which queries each index optimizes
  - [ ] Monitoring process: Weekly index usage checks, quarterly maintenance
  - [ ] Maintenance schedule: REINDEX CONCURRENTLY quarterly for high-churn tables
