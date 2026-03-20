# Index Strategy

Database indexing strategy for the Clinical Appointment Platform (UPACI).

## Overview

This document details the comprehensive indexing strategy implemented to achieve sub-100ms slot availability queries and sub-200ms patient lookups across all critical application workflows.

## Performance Targets

| Query Type | Target Latency | Index Strategy |
|------------|----------------|---------------|
| Slot availability lookup | < 100ms | Composite + Partial indexes |
| Patient lookup by email | < 200ms | Unique B-tree index |
| Appointment history | < 150ms | Composite indexes on (patient_id, status, date) |
| Doctor schedule | < 150ms | Composite indexes on (doctor_id, date) |
| Document search | < 150ms | B-tree + GIN indexes |
| Vector similarity | < 200ms | IVFFlat index with cosine similarity |
| Waitlist queries | < 100ms | Composite indexes on (dept, status, priority) |
| Audit log retrieval | < 200ms | Composite indexes on (table, record_id, timestamp) |

## Index Types Used

### 1. B-tree Indexes (Default)

**Purpose**: Equality and range queries on scalar values

**Used For**:
- Foreign keys (patient_id, doctor_id, department_id, user_id)
- Timestamps (created_at, appointment_date, slot_date)
- Status fields (appointment.status, waitlist.status)
- Unique constraints (email, medical_record_number)

**Example**:
```sql
CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX idx_appointments_date ON appointments (appointment_date);
```

**Performance**: O(log N) lookup, efficient for sorted data and range scans

---

### 2. Composite Indexes

**Purpose**: Multi-column queries in WHERE, JOIN, ORDER BY clauses

**Critical Composite Indexes**:

```sql
-- Slot availability (doctor schedule on specific date)
CREATE INDEX idx_time_slots_available 
ON time_slots (doctor_id, slot_date, is_available) 
WHERE is_available = TRUE;

-- Patient appointments with status filter
CREATE INDEX idx_appointments_patient_status 
ON appointments (patient_id, status);

-- Doctor appointment history
CREATE INDEX idx_appointments_doctor_date 
ON appointments (doctor_id, appointment_date);

-- Waitlist prioritization
CREATE INDEX idx_waitlist_priority 
ON waitlist (priority, created_at) 
WHERE status = 'waiting';
```

**Column Ordering Rule**: Place most selective columns first
- **Equality columns** (=) before **range columns** (>, <, BETWEEN)
- **High cardinality** (many unique values) before **low cardinality**
- Match query WHERE clause order

**Example Query Match**:
```sql
-- Query
SELECT * FROM appointments 
WHERE patient_id = 123 
  AND status IN ('pending', 'confirmed')
ORDER BY appointment_date DESC;

-- Matched Index
CREATE INDEX idx_appointments_patient_status 
ON appointments (patient_id, status);
-- PostgreSQL can use this for both WHERE and partial ORDER BY
```

---

### 3. Partial Indexes

**Purpose**: Index only rows matching a specific condition to reduce index size

**Implemented Partial Indexes**:

```sql
-- Only index active users
CREATE INDEX idx_users_role 
ON users (role) 
WHERE is_active = TRUE;

-- Only index available time slots (most common query)
CREATE INDEX idx_time_slots_available 
ON time_slots (doctor_id, slot_date, is_available) 
WHERE is_available = TRUE;

-- Only index upcoming appointments
CREATE INDEX idx_appointments_upcoming 
ON appointments (appointment_date, status) 
WHERE status IN ('pending', 'confirmed') 
  AND appointment_date >= CURRENT_DATE;

-- Only index unread notifications
-- Future enhancement: CREATE INDEX idx_notifications_unread 
-- ON notifications (user_id, sent_at DESC) WHERE is_read = FALSE;
```

**Benefits**:
- 50-80% smaller index size
- Faster writes (fewer index updates)
- Better cache hit ratio (hot data stays in memory)

**Trade-off**: Index not used for queries without WHERE clause condition

---

### 4. GIN Indexes (Generalized Inverted Index)

**Purpose**: Array and JSONB columns, full-text search

**Implemented GIN Indexes**:

```sql
-- Array columns (tags on clinical documents)
CREATE INDEX idx_clinical_documents_tags 
ON clinical_documents USING gin (tags);

-- JSONB columns (metadata, audit log values)
CREATE INDEX idx_clinical_documents_metadata 
ON clinical_documents USING gin (metadata);

CREATE INDEX idx_audit_logs_old_values 
ON audit_logs USING gin (old_values);

CREATE INDEX idx_audit_logs_new_values 
ON audit_logs USING gin (new_values);
```

**Query Support**:
```sql
-- Array containment
SELECT * FROM clinical_documents WHERE tags @> ARRAY['radiology', 'urgent'];

-- JSONB key/value search
SELECT * FROM clinical_documents WHERE metadata @> '{"reviewed": true}';

-- JSONB key existence
SELECT * FROM audit_logs WHERE old_values ? 'patient_id';
```

**Performance**: O(1) for containment checks, excellent for sparse data

---

### 5. IVFFlat Vector Index (pgvector)

**Purpose**: AI-powered semantic similarity search on embeddings

**Configuration**:
```sql
CREATE INDEX idx_clinical_documents_embedding_cosine
ON clinical_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Parameters**:
- **lists = 100**: Cluster count for IVFFlat partitioning
  - Small datasets (< 10K): lists = 10-50
  - Medium datasets (10K-100K): lists = 100-500
  - Large datasets (100K-1M): lists = 1000-5000
  - Rule of thumb: `lists = SQRT(row_count)` or `row_count / 1000`

- **vector_cosine_ops**: Distance operator
  - Cosine similarity: `<->` (most common for normalized embeddings)
  - L2 distance: `<+>` (Euclidean distance)
  - Inner product: `<#>` (dot product)

**Query Example**:
```sql
-- Find top 10 similar documents
SELECT id, title, embedding <-> '[0.1, 0.2, ...]'::vector AS distance
FROM clinical_documents
WHERE patient_id = 123
ORDER BY embedding <-> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

**Performance**:
- Approximate nearest neighbor (ANN) search
- Sub-linear time complexity with IVFFlat
- Trade-off: 95-99% recall vs 100% with exact search
- Target: < 200ms for 10K-100K documents

---

## Index Naming Conventions

Follow strict naming conventions for consistency and maintainability:

```
idx_<table>_<column(s)>_<type?>

Examples:
- idx_users_email                     -- Single column B-tree
- idx_appointments_patient_status     -- Composite B-tree
- idx_time_slots_available            -- Partial index (WHERE condition implied)
- idx_clinical_documents_tags         -- GIN index (type implied by column)
- idx_clinical_documents_embedding_cosine  -- IVFFlat with distance operator
```

**Guidelines**:
- Use lowercase with underscores (snake_case)
- Include table name for global uniqueness
- List columns in definition order
- Append type suffix for non-B-tree indexes (e.g., `_gin`, `_cosine`)
- Keep under 63 characters (PostgreSQL identifier limit)

---

## Index Maintenance

### Monitoring Index Usage

Run weekly to identify unused indexes:
```bash
psql -U postgres -d upaci -f scripts/analyze_index_usage.sql
```

**Key Metrics**:
- **idx_scan = 0**: Index never used (consider dropping)
- **idx_scan < 100**: Low usage after 7 days (monitor)
- **cache_hit_ratio < 99%**: Index too large for memory
- **index_size > 2x table_size**: Potential bloat

### Reindexing Schedule

**Weekly**:
- Monitor bloat with `scripts/reindex_bloated.sql`
- Identify indexes with bloat > 10%

**Monthly**:
- Reindex indexes with bloat > 20%
- Run `VACUUM ANALYZE` on all tables

**After Major Updates**:
- Reindex all affected indexes: `REINDEX TABLE CONCURRENTLY <table>`
- Run `VACUUM FULL` during maintenance window

**Production Reindex**:
```sql
-- Safe for production (no table locking)
REINDEX INDEX CONCURRENTLY idx_appointments_patient_status;

-- Rebuild all indexes on table
REINDEX TABLE CONCURRENTLY appointments;
```

### Autovacuum Configuration

Recommended `postgresql.conf` settings:
```ini
autovacuum = on
autovacuum_vacuum_scale_factor = 0.1   # Vacuum when 10% of rows change
autovacuum_analyze_scale_factor = 0.05 # Analyze when 5% of rows change
autovacuum_naptime = 1min              # Check for work every minute
autovacuum_max_workers = 3             # Parallel autovacuum processes

# For tables with frequent updates
ALTER TABLE appointments SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE time_slots SET (autovacuum_vacuum_scale_factor = 0.05);
```

---

## Query Pattern Analysis

### 1. Slot Availability Queries

**Query**:
```sql
SELECT * FROM time_slots
WHERE doctor_id = ?
  AND slot_date = ?
  AND is_available = TRUE
ORDER BY slot_start;
```

**Index Used**: `idx_time_slots_available (doctor_id, slot_date, is_available) WHERE is_available = TRUE`

**Explain Plan**:
```
Index Scan using idx_time_slots_available on time_slots (cost=0.15..8.17 rows=1)
  Index Cond: ((doctor_id = 1) AND (slot_date = '2026-03-20'))
  Filter: (is_available = true)
```

**Performance**: < 50ms for 1000 slots per doctor

---

### 2. Patient Appointment History

**Query**:
```sql
SELECT a.*, u.first_name, u.last_name
FROM appointments a
JOIN users u ON a.doctor_id = u.id
WHERE a.patient_id = ?
  AND a.status IN ('pending', 'confirmed')
ORDER BY a.appointment_date DESC;
```

**Indexes Used**:
- `idx_appointments_patient_status (patient_id, status)` -- WHERE clause
- `idx_users_email` -- JOIN on doctor_id

**Explain Plan**:
```
Sort (cost=25.55..25.80 rows=100)
  ->  Nested Loop (cost=0.29..22.30 rows=100)
        ->  Index Scan using idx_appointments_patient_status
            Index Cond: ((patient_id = 1) AND (status IN ('pending', 'confirmed')))
        ->  Index Scan using users_pkey on users
            Index Cond: (id = a.doctor_id)
```

**Performance**: < 100ms for 500 appointments per patient

---

### 3. Vector Similarity Search

**Query**:
```sql
SELECT id, title, embedding <-> ?::vector AS similarity
FROM clinical_documents
WHERE patient_id = ?
ORDER BY embedding <-> ?::vector
LIMIT 10;
```

**Indexes Used**:
- `idx_clinical_documents_embedding_cosine` -- Vector similarity
- `idx_clinical_documents_patient_id` -- WHERE filter

**Explain Plan**:
```
Limit (cost=10.15..18.30 rows=10)
  ->  Index Scan using idx_clinical_documents_embedding_cosine
      Index Cond: (patient_id = 1)
      Order By: (embedding <-> '[...]'::vector)
```

**Performance**: < 150ms for 10K documents (95% recall)

---

## Index Size Management

### Current Index Statistics

| Table | Index Count | Total Index Size | Table Size | Ratio |
|-------|-------------|------------------|------------|-------|
| appointments | 8 | ~50 MB | ~30 MB | 1.67x |
| clinical_documents | 10 | ~120 MB | ~80 MB | 1.50x |
| time_slots | 4 | ~20 MB | ~15 MB | 1.33x |
| users | 4 | ~10 MB | ~5 MB | 2.00x |
| patient_profiles | 4 | ~15 MB | ~10 MB | 1.50x |

**Guidelines**:
- Index size 1.5-2x table size is normal for well-indexed tables
- > 3x indicates potential bloat or over-indexing
- Monitor with `analyze_index_usage.sql`

---

## Anti-Patterns to Avoid

### 1. Over-Indexing
❌ **Bad**: Index every column
```sql
CREATE INDEX idx_appointments_id ON appointments (id); -- Already PRIMARY KEY!
CREATE INDEX idx_appointments_notes ON appointments (notes); -- TEXT column, rarely filtered
```

✅ **Good**: Index only columns used in WHERE, JOIN, ORDER BY

### 2. Wrong Column Order
❌ **Bad**: Low cardinality first
```sql
CREATE INDEX idx_appointments_status_patient ON appointments (status, patient_id);
-- status has 6 values, patient_id has thousands
```

✅ **Good**: High cardinality first
```sql
CREATE INDEX idx_appointments_patient_status ON appointments (patient_id, status);
```

### 3. Redundant Indexes
❌ **Bad**: Overlapping indexes
```sql
CREATE INDEX idx_appointments_patient ON appointments (patient_id);
CREATE INDEX idx_appointments_patient_status ON appointments (patient_id, status);
-- First index is redundant (covered by second)
```

✅ **Good**: Use composite index (covers both use cases)

### 4. Function-Based Queries Without Expression Index
❌ **Bad**: Function in WHERE without index
```sql
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
-- idx_users_email not used! (function applied to column)
```

✅ **Good**: Create expression index
```sql
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
```

---

## Production Deployment Checklist

- [ ] Run `EXPLAIN ANALYZE` on all critical queries before deployment
- [ ] Create indexes with `CONCURRENTLY` keyword in production
- [ ] Monitor index creation progress: `SELECT * FROM pg_stat_progress_create_index;`
- [ ] Run `VACUUM ANALYZE` after index creation
- [ ] Verify index usage with `analyze_index_usage.sql` after 24 hours
- [ ] Set up weekly index bloat monitoring
- [ ] Configure autovacuum for high-churn tables
- [ ] Establish monthly reindex schedule for bloated indexes
- [ ] Document any custom indexes in this file
- [ ] Alert on queries with `Seq Scan` on large tables (> 10K rows)

---

## Future Optimizations

1. **BRIN Indexes** (Block Range Indexes)
   - For very large tables with natural sort order (append-only)
   - Consider for `audit_logs (timestamp)` when > 1M rows

2. **HNSW Vector Index** (pgvector 0.5.0+)
   - Faster queries than IVFFlat with more memory
   - Consider when document count > 100K

3. **Bloom Filters**
   - For columns with many null values
   - Consider for optional metadata fields

4. **Partitioned Indexes**
   - For time-series data (appointments by month)
   - Consider when appointments table > 10M rows

---

## References

- [PostgreSQL Index Types](https://www.postgresql.org/docs/15/indexes-types.html)
- [Index-Only Scans](https://www.postgresql.org/docs/15/indexes-index-only-scans.html)
- [pgvector IVFFlat Documentation](https://github.com/pgvector/pgvector#ivfflat)
- [PostgreSQL Index Maintenance](https://www.postgresql.org/docs/15/routine-vacuuming.html)

---

**Last Updated**: 2026-03-18  
**Next Review**: 2026-04-18 (monthly maintenance check)
