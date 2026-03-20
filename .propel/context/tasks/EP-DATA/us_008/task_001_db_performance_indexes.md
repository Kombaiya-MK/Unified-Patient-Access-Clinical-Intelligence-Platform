# Task - TASK_001_DB_PERFORMANCE_INDEXES

## Requirement Reference
- User Story: US_008  
- Story Location: `.propel/context/tasks/us_008/us_008.md`
- Acceptance Criteria:
    - AC1: Indexes created on timeslots(staff_id, date), appointments(patient_id, status, appointment_date), users(email), audit_logs(user_id, created_at), query performance improves to target latencies (<100ms slot availability, <200ms patient lookup)
- Edge Cases:
    - Creating index on large existing table: Use CREATE INDEX CONCURRENTLY to avoid table locking in production
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

> **Note**: Database performance optimization - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | node-pg-migrate | 6.x |
| Database | PostgreSQL | 15+ |
| Database | pgvector | 0.5.0+ |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Partial (IVFFlat index on embeddings) |
| **AIR Requirements** | N/A |
| **AI Pattern** | Vector similarity search optimization |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Includes vector index for AI features

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend database only

## Task Overview
Create comprehensive performance indexes on frequently queried columns to achieve sub-100ms slot availability queries and sub-200ms patient lookups. Implement B-tree indexes on foreign keys and status columns, composite indexes for common query patterns, unique indexes for constraints, and IVFFlat indexes for vector similarity search. Use CREATE INDEX CONCURRENTLY for production safety. Monitor index usage with pg_stat_user_indexes and implement automated unused index detection.

## Dependent Tasks
- US_007 TASK_001: Core database schema must be implemented

## Impacted Components
**New:**
- database/migrations/012_create_performance_indexes.js (B-tree indexes on FKs and status)
- database/migrations/013_create_composite_indexes.js (Multi-column indexes for query patterns)
- database/migrations/014_create_vector_indexes.js (IVFFlat for embeddings)
- database/scripts/analyze_index_usage.sql (Query to identify unused indexes)
- database/scripts/benchmark_queries.sql (Performance testing queries)
- database/docs/INDEX_STRATEGY.md (Index design rationale and maintenance)
- database/docs/QUERY_OPTIMIZATION.md (Query performance guide)

**Modified:**
- database/migrations/010_create_indexes.js (from US_007 - may consolidate or enhance)

## Implementation Plan
1. **Query Analysis**: Identify most frequent queries (slot availability, patient lookup, appointment listing)
2. **Index Type Selection**: B-tree for equality/range, IVFFlat for vector similarity, GiST for specialized cases
3. **Composite Indexes**: Create multi-column indexes for common WHERE clauses (e.g., appointments by patient + status + date)
4. **Foreign Key Indexes**: Ensure all FKs have indexes for JOIN performance
5. **Unique Indexes**: Users.email, PatientProfiles.medical_record_number for constraint + performance
6. **Partial Indexes**: Index only active records (WHERE active = true, WHERE status = 'pending')
7. **Expression Indexes**: Index computed values (e.g., LOWER(email) for case-insensitive search)
8. **Vector Indexes**: IVFFlat with lists=100 for clinical_documents.embedding
9. **CONCURRENTLY Flag**: Use for production deployments to prevent table locking
10. **Benchmark Testing**: Execute test queries before/after indexing, verify <100ms/<200ms targets
11. **Index Monitoring**: Create views for pg_stat_user_indexes, track idx_scan and idx_tup_read
12. **Maintenance Scripts**: VACUUM ANALYZE after index creation, REINDEX for index bloat

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002-006)
├── database/                # Database setup (US_003, US_007)
│   ├── migrations/
│   │   ├── 001-009_*.js    # Core schema (US_007)
│   │   ├── 010_*.js        # Initial indexes (US_007)
│   │   └── 011_*.js        # Constraints (US_007)
│   └── docs/
└── monitoring/              # Grafana + Prometheus (US_005-006)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/012_create_performance_indexes.js | B-tree indexes on FKs: patient_profiles.user_id, appointments.patient_id/doctor_id/time_slot_id, etc. |
| CREATE | database/migrations/013_create_composite_indexes.js | Multi-column: time_slots(doctor_id, slot_date, available), appointments(patient_id, status, appointment_date) |
| CREATE | database/migrations/014_create_vector_indexes.js | IVFFlat on clinical_documents.embedding with cosine similarity |
| CREATE | database/migrations/015_create_partial_indexes.js | Partial indexes: users WHERE active=true, appointments WHERE status='pending' |
| CREATE | database/scripts/analyze_index_usage.sql | Query pg_stat_user_indexes for idx_scan < 10, index size > 1MB |
| CREATE | database/scripts/benchmark_queries.sql | Test queries with EXPLAIN ANALYZE, measure execution time |
| CREATE | database/scripts/reindex_bloated.sql | Identify and rebuild bloated indexes |
| CREATE | database/docs/INDEX_STRATEGY.md | Index design decisions, query patterns, maintenance schedule |
| CREATE | database/docs/QUERY_OPTIMIZATION.md | Query tuning guide, EXPLAIN plan interpretation, best practices |
| CREATE | database/tests/performance_benchmark.test.js | Automated tests: slot availability <100ms, patient lookup <200ms |

> All files created as new - builds on US_007 schema

## External References
- [PostgreSQL Index Types](https://www.postgresql.org/docs/15/indexes-types.html)
- [CREATE INDEX CONCURRENTLY](https://www.postgresql.org/docs/15/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY)
- [Index Monitoring](https://www.postgresql.org/docs/15/monitoring-stats.html#MONITORING-PG-STAT-USER-INDEXES-VIEW)
- [Composite Index Strategy](https://www.postgresql.org/docs/15/indexes-multicolumn.html)
- [Partial Indexes](https://www.postgresql.org/docs/15/indexes-partial.html)
- [pgvector IVFFlat Index](https://github.com/pgvector/pgvector#ivfflat)
- [EXPLAIN ANALYZE](https://www.postgresql.org/docs/15/sql-explain.html)
- [Index Maintenance](https://www.postgresql.org/docs/15/routine-vacuuming.html)

## Build Commands
```bash
# Navigate to server directory
cd server

# Create migration for performance indexes
npm run migrate:create create-performance-indexes
npm run migrate:create create-composite-indexes
npm run migrate:create create-vector-indexes
npm run migrate:create create-partial-indexes

# Run index migrations
npm run migrate:up

# Verify indexes created
psql -U upaci_user -d upaci -c "\di"
# Expected: List showing 20+ indexes

# Analyze index usage statistics
psql -U upaci_user -d upaci -f ../database/scripts/analyze_index_usage.sql

# Run VACUUM ANALYZE after index creation
psql -U upaci_user -d upaci -c "VACUUM ANALYZE;"

# Benchmark slot availability query (target: <100ms)
psql -U upaci_user -d upaci -c "
EXPLAIN ANALYZE
SELECT * FROM time_slots
WHERE doctor_id = 1 
  AND slot_date = '2026-03-20'
  AND available = true
ORDER BY slot_start_time;
"
# Expected: Execution Time: < 100ms, Index Scan on time_slots

# Benchmark patient lookup (target: <200ms)
psql -U upaci_user -d upaci -c "
EXPLAIN ANALYZE
SELECT u.*, pp.* 
FROM users u
JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.email = 'patient@example.com';
"
# Expected: Execution Time: < 200ms, Index Scan on users_email_idx

# Benchmark appointment listing by patient
psql -U upaci_user -d upaci -c "
EXPLAIN ANALYZE
SELECT a.*, u.first_name, u.last_name
FROM appointments a
JOIN users u ON a.doctor_id = u.id
WHERE a.patient_id = 1
  AND a.status IN ('pending', 'confirmed')
ORDER BY a.appointment_date DESC
LIMIT 20;
"
# Expected: Execution Time: < 150ms, Index Scan on appointments composite index

# Test vector similarity search (clinical documents)
psql -U upaci_user -d upaci -c "
EXPLAIN ANALYZE
SELECT title, content
FROM clinical_documents
WHERE patient_id = 1
ORDER BY embedding <-> '[1,2,3,...]'::vector
LIMIT 10;
"
# Expected: IVFFlat Index Scan, < 200ms for 1000+ documents

# Monitor index usage over time (run after application load)
psql -U upaci_user -d upaci -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
"
# Look for indexes with idx_scan = 0 (unused)

# Identify bloated indexes
psql -U upaci_user -d upaci -f ../database/scripts/reindex_bloated.sql

# Run performance benchmark tests
npm test -- performance_benchmark.test.js

# Production deployment (use CONCURRENTLY)
psql -U upaci_user -d upaci -c "
CREATE INDEX CONCURRENTLY idx_appointments_patient_status 
ON appointments(patient_id, status, appointment_date);
"
# No table locking, safe for production
```

## Implementation Validation Strategy
- [ ] Unit tests pass (N/A for indexes)
- [ ] Integration tests pass (performance benchmark tests)
- [ ] All required indexes created: `\di` shows indexes on timeslots, appointments, users, audit_logs
- [ ] Composite indexes exist: appointments(patient_id, status, appointment_date), time_slots(doctor_id, slot_date, available)
- [ ] Vector index created: clinical_documents.embedding with IVFFlat
- [ ] Unique indexes: users.email, patient_profiles.medical_record_number
- [ ] Partial indexes: users WHERE active=true, appointments WHERE status='pending'
- [ ] Slot availability query <100ms: EXPLAIN ANALYZE shows execution time < 100ms
- [ ] Patient lookup query <200ms: EXPLAIN ANALYZE shows execution time < 200ms
- [ ] Query plans use indexes: EXPLAIN shows "Index Scan" not "Seq Scan"
- [ ] Index usage monitored: pg_stat_user_indexes shows idx_scan counts
- [ ] No unused indexes: All indexes have idx_scan > 0 after load testing
- [ ] VACUUM ANALYZE completed: Statistics updated for query planner
- [ ] Concurrent creation tested: CREATE INDEX CONCURRENTLY succeeds without locking
- [ ] Index size reasonable: Total index size < 2x table size
- [ ] Performance benchmarks pass: All queries meet latency targets

## Implementation Checklist

### Performance Indexes Migration (012_create_performance_indexes.js)
- [ ] Create migration file: `npm run migrate:create create-performance-indexes`
- [ ] Implement exports.up function
- [ ] Create index on users.email (if not already unique index): pgm.createIndex('users', 'email', { unique: true })
- [ ] Create index on users.role: pgm.createIndex('users', 'role')
- [ ] Create index on patient_profiles.user_id: pgm.createIndex('patient_profiles', 'user_id')
- [ ] Create index on patient_profiles.medical_record_number (if not unique): pgm.createIndex('patient_profiles', 'medical_record_number', { unique: true })
- [ ] Create index on time_slots.doctor_id: pgm.createIndex('time_slots', 'doctor_id')
- [ ] Create index on time_slots.department_id: pgm.createIndex('time_slots', 'department_id')
- [ ] Create index on time_slots.slot_date: pgm.createIndex('time_slots', 'slot_date')
- [ ] Create index on appointments.patient_id: pgm.createIndex('appointments', 'patient_id')
- [ ] Create index on appointments.doctor_id: pgm.createIndex('appointments', 'doctor_id')
- [ ] Create index on appointments.department_id: pgm.createIndex('appointments', 'department_id')
- [ ] Create index on appointments.time_slot_id: pgm.createIndex('appointments', 'time_slot_id')
- [ ] Create index on appointments.appointment_date: pgm.createIndex('appointments', 'appointment_date')
- [ ] Create index on appointments.status: pgm.createIndex('appointments', 'status')
- [ ] Create index on clinical_documents.patient_id: pgm.createIndex('clinical_documents', 'patient_id')
- [ ] Create index on clinical_documents.appointment_id: pgm.createIndex('clinical_documents', 'appointment_id')
- [ ] Create index on clinical_documents.created_at: pgm.createIndex('clinical_documents', 'created_at', { method: 'btree', order: 'DESC' })
- [ ] Create index on waitlist.patient_id: pgm.createIndex('waitlist', 'patient_id')
- [ ] Create index on waitlist.department_id: pgm.createIndex('waitlist', 'department_id')
- [ ] Create index on waitlist.status: pgm.createIndex('waitlist', 'status')
- [ ] Create index on notifications.user_id: pgm.createIndex('notifications', 'user_id')
- [ ] Create index on notifications.read: pgm.createIndex('notifications', 'read')
- [ ] Create index on notifications.sent_at: pgm.createIndex('notifications', 'sent_at', { order: 'DESC' })
- [ ] Create index on audit_logs.user_id: pgm.createIndex('audit_logs', 'user_id')
- [ ] Create index on audit_logs.table_name: pgm.createIndex('audit_logs', 'table_name')
- [ ] Create index on audit_logs.created_at: pgm.createIndex('audit_logs', 'created_at', { order: 'DESC' })
- [ ] Implement exports.down to drop all indexes

### Composite Indexes Migration (013_create_composite_indexes.js)
- [ ] Create migration file
- [ ] Create composite index on time_slots(doctor_id, slot_date, available):
  - pgm.createIndex('time_slots', ['doctor_id', 'slot_date', 'available'], { name: 'idx_time_slots_doctor_date_available' })
  - Purpose: Fast slot availability lookup for specific doctor and date
- [ ] Create composite index on appointments(patient_id, status, appointment_date):
  - pgm.createIndex('appointments', ['patient_id', 'status', 'appointment_date'], { name: 'idx_appointments_patient_status_date' })
  - Purpose: Patient appointment history with status filter
- [ ] Create composite index on appointments(doctor_id, appointment_date):
  - pgm.createIndex('appointments', ['doctor_id', 'appointment_date'], { name: 'idx_appointments_doctor_date' })
  - Purpose: Doctor's schedule/calendar view
- [ ] Create composite index on clinical_documents(patient_id, created_at DESC):
  - pgm.createIndex('clinical_documents', ['patient_id', { name: 'created_at', sort: 'DESC' }], { name: 'idx_clinical_docs_patient_recent' })
  - Purpose: Recent documents for patient
- [ ] Create composite index on waitlist(department_id, status, priority):
  - pgm.createIndex('waitlist', ['department_id', 'status', 'priority'], { name: 'idx_waitlist_dept_status_priority' })
  - Purpose: Prioritized waitlist per department
- [ ] Create composite index on notifications(user_id, read, sent_at DESC):
  - pgm.createIndex('notifications', ['user_id', 'read', { name: 'sent_at', sort: 'DESC' }], { name: 'idx_notifications_user_recent' })
  - Purpose: Unread notifications for user
- [ ] Create composite index on audit_logs(table_name, record_id, created_at DESC):
  - pgm.createIndex('audit_logs', ['table_name', 'record_id', { name: 'created_at', sort: 'DESC' }], { name: 'idx_audit_logs_record_history' })
  - Purpose: Audit history for specific record
- [ ] Implement exports.down to drop composite indexes

### Vector Indexes Migration (014_create_vector_indexes.js)
- [ ] Create migration file
- [ ] Create IVFFlat index on clinical_documents.embedding:
  - pgm.sql("CREATE INDEX idx_clinical_documents_embedding ON clinical_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);")
  - lists = 100: Good for 10K-1M documents, adjust based on data size
  - vector_cosine_ops: Cosine similarity operator (<->)
- [ ] Alternative: HNSW index (if available in pgvector version):
  - pgm.sql("CREATE INDEX idx_clinical_documents_embedding_hnsw ON clinical_documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);")
  - HNSW: Faster queries, slower inserts
- [ ] Implement exports.down to drop vector indexes

### Partial Indexes Migration (015_create_partial_indexes.js)
- [ ] Create migration file
- [ ] Create partial index on users WHERE active=true:
  - pgm.sql("CREATE INDEX idx_users_active_email ON users(email) WHERE active = true;")
  - Purpose: Fast lookup of active users only
- [ ] Create partial index on appointments WHERE status IN ('pending', 'confirmed'):
  - pgm.sql("CREATE INDEX idx_appointments_upcoming ON appointments(patient_id, appointment_date) WHERE status IN ('pending', 'confirmed');")
  - Purpose: Upcoming appointments query
- [ ] Create partial index on time_slots WHERE available=true:
  - pgm.sql("CREATE INDEX idx_time_slots_available ON time_slots(doctor_id, slot_date) WHERE available = true;")
  - Purpose: Only index available slots (smaller index)
- [ ] Create partial index on notifications WHERE read=false:
  - pgm.sql("CREATE INDEX idx_notifications_unread ON notifications(user_id, sent_at DESC) WHERE read = false;")
  - Purpose: Unread notifications (most common query)
- [ ] Implement exports.down to drop partial indexes

### Index Usage Analysis Script (database/scripts/analyze_index_usage.sql)
- [ ] Create SQL script to query pg_stat_user_indexes
- [ ] Query: SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
- [ ] Filter: WHERE schemaname = 'public' AND idx_scan < 10
- [ ] Sort: ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
- [ ] Purpose: Identify unused indexes (idx_scan = 0 or very low) consuming space
- [ ] Add recommendations: -- If idx_scan = 0 after 7 days, consider dropping index

### Benchmark Queries Script (database/scripts/benchmark_queries.sql)
- [ ] Create SQL script with EXPLAIN ANALYZE for critical queries
- [ ] Query 1: Slot availability (target <100ms)
  - EXPLAIN ANALYZE SELECT * FROM time_slots WHERE doctor_id = ? AND slot_date = ? AND available = true ORDER BY slot_start_time;
- [ ] Query 2: Patient lookup by email (target <200ms)
  - EXPLAIN ANALYZE SELECT u.*, pp.* FROM users u JOIN patient_profiles pp ON u.id = pp.user_id WHERE u.email = ?;
- [ ] Query 3: Patient appointments (target <150ms)
  - EXPLAIN ANALYZE SELECT * FROM appointments WHERE patient_id = ? AND status IN ('pending', 'confirmed') ORDER BY appointment_date DESC LIMIT 20;
- [ ] Query 4: Doctor schedule (target <200ms)
  - EXPLAIN ANALYZE SELECT a.*, u.first_name, u.last_name FROM appointments a JOIN users u ON a.patient_id = u.user_id WHERE a.doctor_id = ? AND a.appointment_date >= CURRENT_DATE ORDER BY a.appointment_date;
- [ ] Query 5: Waitlist by priority (target <100ms)
  - EXPLAIN ANALYZE SELECT w.*, pp.*, u.first_name, u.last_name FROM waitlist w JOIN patient_profiles pp ON w.patient_id = pp.id JOIN users u ON pp.user_id = u.id WHERE w.department_id = ? AND w.status = 'waiting' ORDER BY w.priority, w.created_at;
- [ ] Add timing extraction: \timing on

### Reindex Bloated Script (database/scripts/reindex_bloated.sql)
- [ ] Create SQL script to identify bloated indexes
- [ ] Query index bloat: Use pg_stat_user_indexes and pg_class to calculate bloat percentage
- [ ] Threshold: bloat > 30% and size > 10MB
- [ ] Generate REINDEX commands: REINDEX INDEX CONCURRENTLY <index_name>;
- [ ] Add warning: -- Run during low-traffic periods

### Index Strategy Documentation (database/docs/INDEX_STRATEGY.md)
- [ ] Document index design principles
- [ ] Explain B-tree for equality/range queries (=, <, >, BETWEEN)
- [ ] Explain IVFFlat for vector similarity (approximate nearest neighbor)
- [ ] Explain composite index column order: Most selective column first, common filters before sort columns
- [ ] Document query patterns: slot availability, patient lookup, appointment listing
- [ ] Explain partial indexes: When to use (frequent filter on one value)
- [ ] Document CONCURRENTLY usage: Production deployments to avoid locks
- [ ] Maintenance schedule: VACUUM ANALYZE weekly, REINDEX bloated indexes monthly, review unused indexes quarterly
- [ ] Index size guidelines: Total index size should be 1-2x table size

### Query Optimization Guide (database/docs/QUERY_OPTIMIZATION.md)
- [ ] Document EXPLAIN ANALYZE interpretation
- [ ] Seq Scan vs Index Scan: When each appears, why
- [ ] Bitmap Index Scan: Combining multiple indexes
- [ ] Cost estimation: Understanding planner output
- [ ] Query rewriting: Examples of optimizing slow queries
- [ ] JOIN strategies: Nested Loop, Hash Join, Merge Join
- [ ] Common anti-patterns: SELECT *, OR clauses, implicit type conversions
- [ ] Performance targets: <100ms slot queries, <200ms patient lookups
- [ ] Monitoring: Using pg_stat_statements, slow query log

### Performance Benchmark Tests (database/tests/performance_benchmark.test.js)
- [ ] Create test file with performance assertions
- [ ] Test: "Slot availability query completes in <100ms"
  - Execute query 10 times, calculate average execution time
  - Assert: avgTime < 100ms
- [ ] Test: "Patient lookup query completes in <200ms"
  - Execute query 10 times, assert avgTime < 200ms
- [ ] Test: "Patient appointments query completes in <150ms"
- [ ] Test: "Vector similarity search completes in <200ms"
- [ ] Test: "All queries use index scans"
  - Parse EXPLAIN output, assert no "Seq Scan" on large tables
- [ ] Test: "No missing indexes on foreign keys"
  - Query information_schema for FKs without indexes
- [ ] Run tests: npm test -- performance_benchmark.test.js

### Execution and Validation
- [ ] Run all index migrations: npm run migrate:up
- [ ] Verify migrations succeeded: Check migration status table
- [ ] Run VACUUM ANALYZE: Rebuild statistics for query planner
- [ ] Execute benchmark queries: Run benchmark_queries.sql
- [ ] Verify query times: Slot availability <100ms, patient lookup <200ms
- [ ] Check query plans: All use Index Scan, not Seq Scan
- [ ] Load test application: Generate realistic traffic (1000+ queries/min)
- [ ] Monitor index usage: Run analyze_index_usage.sql after 24h
- [ ] Identify unused indexes: Check for idx_scan = 0
- [ ] Run performance tests: npm test -- performance_benchmark.test.js → all pass
- [ ] Document results: Update INDEX_STRATEGY.md with actual performance metrics
- [ ] Production planning: Prepare CONCURRENTLY commands for production deployment
