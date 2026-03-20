# Query Optimization Guide

Comprehensive guide for optimizing database queries in the Clinical Appointment Platform (UPACI).

## Table of Contents

- [Performance Targets](#performance-targets)
- [Using EXPLAIN ANALYZE](#using-explain-analyze)
- [Common Query Patterns](#common-query-patterns)
- [Optimization Techniques](#optimization-techniques)
- [Anti-Patterns](#anti-patterns)
- [Troubleshooting Slow Queries](#troubleshooting-slow-queries)

---

## Performance Targets

| Query Category | Target Latency | Tolerance | Alert Threshold |
|----------------|----------------|-----------|------------------|
| Slot availability | < 100ms | < 150ms | >= 200ms |
| Patient lookup | < 200ms | < 300ms | >= 400ms |
| Appointment operations | < 150ms | < 250ms | >= 350ms |
| Document search | < 150ms | < 250ms | >= 350ms |
| Vector similarity | < 200ms | < 300ms | >= 400ms |
| Batch operations | < 500ms | < 1s | >= 2s |

**Performance Tiers**:
- ✅ **Excellent**: Within target latency
- ⚠️ **Acceptable**: Within tolerance (investigate if persistent)
- ❌ **Poor**: Above alert threshold (requires immediate optimization)

---

## Using EXPLAIN ANALYZE

### Basic Usage

```sql
EXPLAIN ANALYZE
SELECT * FROM appointments WHERE patient_id = 123;
```

**Output Example**:
```
Index Scan using idx_appointments_patient_id on appointments  (cost=0.42..8.44 rows=1 width=1041) (actual time=0.015..0.017 rows=1 loops=1)
  Index Cond: (patient_id = 123)
Planning Time: 0.085 ms
Execution Time: 0.045 ms
```

### EXPLAIN Options

```sql
-- Full analysis with buffer statistics
EXPLAIN (ANALYZE, BUFFERS, TIMING, VERBOSE)
SELECT ...;

-- Just the plan (no execution)
EXPLAIN (FORMAT JSON)
SELECT ...;
```

### Reading EXPLAIN Output

#### 1. Scan Types (Best to Worst)

**Index Scan** ✅ (Best)
- Uses index to find specific rows
- O(log N) complexity
- Example: `Index Scan using idx_users_email`

**Index Only Scan** ✅ (Best - if covering index)
- Reads data directly from index (no table access)
- Fastest possible scan
- Example: `Index Only Scan using idx_appointments_patient_status`

**Bitmap Index Scan** ⚠️ (Good for multiple conditions)
- Combines multiple indexes
- Used for OR conditions or large result sets
- Example: `Bitmap Index Scan on idx_appointments_date`

**Sequential Scan** ❌ (Avoid for large tables)
- Reads entire table row-by-row
- O(N) complexity
- Acceptable only for small tables (< 1000 rows)
- Example: `Seq Scan on appointments`

#### 2. Join Types

**Nested Loop** ✅ (Best for small result sets)
- For each row in outer table, scan inner table
- Efficient with indexes
- Example: `Nested Loop (cost=0.29..16.32 rows=1)`

**Hash Join** ⚠️ (Good for large result sets)
- Build hash table from smaller table
- Probe from larger table
- Example: `Hash Join (cost=10.00..50.00 rows=1000)`

**Merge Join** ⚠️ (Good for sorted data)
- Both inputs must be sorted on join key
- Efficient for large pre-sorted datasets
- Example: `Merge Join (cost=25.00..75.00 rows=5000)`

#### 3. Key Metrics

**Cost**:
```
cost=0.42..8.44
      ^^^   ^^^
      |     Total cost (arbitrary units)
      Startup cost
```
- Lower is better
- Relative, not absolute (compare plans for same query)

**Rows**:
```
rows=1 (actual rows=1)
```
- Estimated vs actual row count
- Large discrepancies indicate outdated statistics (run `ANALYZE`)

**Time**:
```
actual time=0.015..0.017 ms
            ^^^^    ^^^^
            First row  Last row
```
- Most important metric for optimization

**Buffers**:
```
Buffers: shared hit=5 read=1
               ^^^     ^^^
               Cache    Disk
```
- `hit`: Pages found in cache (fast)
- `read`: Pages read from disk (slow)
- Target: > 99% cache hit ratio

---

## Common Query Patterns

### 1. Simple Lookup by Foreign Key

**Query**:
```sql
SELECT * FROM appointments WHERE patient_id = 123;
```

**Optimization**:
- Ensure index exists: `CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);`
- Expected plan: `Index Scan using idx_appointments_patient_id`
- Target: < 50ms

**Explain Check**:
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM appointments WHERE patient_id = 123;
```

✅ **Good**:
```
Index Scan using idx_appointments_patient_id (actual time=0.020..0.025 ms)
Buffers: shared hit=3
```

❌ **Bad**:
```
Seq Scan on appointments (actual time=5.250..15.750 ms)
Buffers: shared read=500
```

---

### 2. Filtered Lookup with Status

**Query**:
```sql
SELECT * FROM appointments 
WHERE patient_id = 123 
  AND status IN ('pending', 'confirmed')
ORDER BY appointment_date DESC;
```

**Optimization**:
- Use composite index: `idx_appointments_patient_status (patient_id, status)`
- Index covers WHERE clause
- PostgreSQL can use index for partial ORDER BY

**Expected Plan**:
```
Index Scan Backward using idx_appointments_patient_status
  Index Cond: ((patient_id = 123) AND (status = ANY ('{pending,confirmed}'::text[])))
```

**Target**: < 100ms

---

### 3. Range Query with Date

**Query**:
```sql
SELECT * FROM appointments
WHERE appointment_date >= '2026-03-01'
  AND appointment_date < '2026-04-01';
```

**Optimization**:
- Index on date column: `idx_appointments_date`
- Consider BRIN index for append-only tables
- Use midnight timestamps for date ranges

**Anti-Pattern**:
```sql
-- BAD: Function prevents index usage
WHERE DATE(appointment_date) = '2026-03-20'

-- GOOD: Use range instead
WHERE appointment_date >= '2026-03-20 00:00:00'
  AND appointment_date < '2026-03-21 00:00:00'
```

---

### 4. JOIN with Foreign Key

**Query**:
```sql
SELECT a.*, u.first_name, u.last_name
FROM appointments a
JOIN users u ON a.doctor_id = u.id
WHERE a.patient_id = 123;
```

**Optimization**:
- Index on `appointments.patient_id` (WHERE clause)
- Primary key on `users.id` (JOIN)
- Expected: Nested Loop join

**Expected Plan**:
```
Nested Loop (actual time=0.050..0.075 ms)
  -> Index Scan using idx_appointments_patient_id
  -> Index Scan using users_pkey
```

**Target**: < 100ms

---

### 5. Aggregation Query

**Query**:
```sql
SELECT 
    doctor_id,
    COUNT(*) AS appointment_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
FROM appointments
WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY doctor_id;
```

**Optimization**:
- Index on `appointment_date` for WHERE
- Minimize GROUP BY columns
- Use FILTER clause instead of CASE WHEN

**Expected Plan**:
```
HashAggregate (actual time=25.500..26.750 ms)
  -> Index Scan using idx_appointments_date
```

**Target**: < 200ms for 10K rows

---

### 6. EXISTS vs IN vs JOIN

**Use EXISTS for existence check**:
```sql
-- ✅ GOOD: EXISTS (stops after first match)
SELECT * FROM patients p
WHERE EXISTS (
    SELECT 1 FROM appointments a 
    WHERE a.patient_id = p.id 
      AND a.status = 'pending'
);

-- ⚠️ OK: IN (materializes subquery)
SELECT * FROM patients p
WHERE p.id IN (
    SELECT patient_id FROM appointments 
    WHERE status = 'pending'
);

-- ❌ BAD: JOIN (may return duplicates, need DISTINCT)
SELECT DISTINCT p.* FROM patients p
JOIN appointments a ON p.id = a.patient_id
WHERE a.status = 'pending';
```

**Performance**:
- EXISTS: Best for "any rows exist" check
- IN: Good for small subquery result sets
- JOIN: Use when you need columns from both tables

---

### 7. JSONB Queries

**Query**:
```sql
-- Key existence
SELECT * FROM clinical_documents 
WHERE metadata ? 'reviewed';

-- Containment
SELECT * FROM clinical_documents 
WHERE metadata @> '{"reviewed": true}';

-- Nested path
SELECT * FROM clinical_documents 
WHERE metadata->'patient'->>'name' = 'John';
```

**Optimization**:
- GIN index: `CREATE INDEX idx_metadata ON clinical_documents USING gin (metadata);`
- Use operators: `?`, `@>`, `?&`, `?|`
- Avoid extracting then comparing (use operators)

**Anti-Pattern**:
```sql
-- BAD: Extracts value then compares
WHERE (metadata->>'reviewed')::boolean = true

-- GOOD: Use containment operator
WHERE metadata @> '{"reviewed": true}'
```

---

### 8. Array Queries

**Query**:
```sql
-- Array overlap
SELECT * FROM clinical_documents 
WHERE tags && ARRAY['urgent', 'radiology'];

-- Array containment
SELECT * FROM clinical_documents 
WHERE tags @> ARRAY['urgent'];
```

**Optimization**:
- GIN index: `CREATE INDEX idx_tags ON clinical_documents USING gin (tags);`
- Use operators: `&&` (overlap), `@>` (contains), `<@` (contained by)

---

### 9. Vector Similarity Search

**Query**:
```sql
SELECT id, title, embedding <-> '[...]'::vector AS distance
FROM clinical_documents
WHERE patient_id = 123
ORDER BY embedding <-> '[...]'::vector
LIMIT 10;
```

**Optimization**:
- IVFFlat index with appropriate `lists` parameter
- Filter by `patient_id` BEFORE similarity sort
- Use `LIMIT` to stop early

**Expected Plan**:
```
Limit (actual time=50.250..50.500 ms)
  -> Index Scan using idx_clinical_documents_embedding_cosine
      Index Cond: (patient_id = 123)
      Order By: (embedding <-> '[...]'::vector)
```

**Target**: < 200ms for 10K documents

---

## Optimization Techniques

### 1. Rewrite Queries to Use Indexes

**Before**:
```sql
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
```
- Function on column prevents index usage

**After**:
```sql
-- Create expression index
CREATE INDEX idx_users_email_lower ON users (LOWER(email));

-- Query now uses index
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
```

---

### 2. Use Partial Indexes for Common Filters

**Before**:
```sql
CREATE INDEX idx_appointments_status ON appointments (status);

SELECT * FROM appointments WHERE status = 'pending';
```
- Index covers all statuses (6 values)

**After**:
```sql
-- Index only pending/confirmed (most queries)
CREATE INDEX idx_appointments_active 
ON appointments (patient_id, appointment_date) 
WHERE status IN ('pending', 'confirmed');

SELECT * FROM appointments 
WHERE status = 'pending' 
  AND patient_id = 123;
```
- 50% smaller index, faster queries

---

### 3. Covering Indexes (Index-Only Scan)

**Before**:
```sql
CREATE INDEX idx_appointments_patient ON appointments (patient_id);

SELECT patient_id, appointment_date, status 
FROM appointments 
WHERE patient_id = 123;
```
- Index Scan + Heap Fetch (slow)

**After**:
```sql
CREATE INDEX idx_appointments_patient_covering 
ON appointments (patient_id, appointment_date, status);

SELECT patient_id, appointment_date, status 
FROM appointments 
WHERE patient_id = 123;
```
- Index Only Scan (fast - no heap access)

---

### 4. Batch Operations

**Before**:
```sql
-- 1000 individual queries
FOR EACH patient:
    SELECT * FROM appointments WHERE patient_id = patient.id;
```
- 1000 round trips to database

**After**:
```sql
-- Single query with IN clause
SELECT * FROM appointments 
WHERE patient_id = ANY($1::bigint[]);
```
- 1 round trip, batch processing

**Even Better (if need all data)**:
```sql
-- Join instead of IN
SELECT p.id, a.* 
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
WHERE p.id = ANY($1::bigint[]);
```

---

### 5. Avoid SELECT *

**Before**:
```sql
SELECT * FROM appointments WHERE patient_id = 123;
```
- Fetches all columns (including large TEXT fields)

**After**:
```sql
SELECT id, patient_id, doctor_id, appointment_date, status
FROM appointments 
WHERE patient_id = 123;
```
- Smaller result set
- Enables covering indexes
- Faster network transfer

---

### 6. Use CTEs for Readability (But Watch Performance)

**CTE (Common Table Expression)**:
```sql
WITH pending_appointments AS (
    SELECT * FROM appointments WHERE status = 'pending'
)
SELECT * FROM pending_appointments WHERE patient_id = 123;
```

**Performance**:
- PostgreSQL 12+: CTE inlining (usually optimized)
- < PostgreSQL 12: CTE materialized (optimization barrier)

**Solution**:
```sql
-- Explicitly prevent materialization
WITH pending_appointments AS NOT MATERIALIZED (
    SELECT * FROM appointments WHERE status = 'pending'
)
...
```

---

## Anti-Patterns

### 1. ❌ Functions on Indexed Columns

**Bad**:
```sql
WHERE LOWER(email) = 'test@example.com'  -- Index not used
WHERE DATE(created_at) = '2026-03-20'    -- Index not used
WHERE status || '_suffix' = 'pending_suffix'  -- Index not used
```

**Good**:
```sql
-- Create functional index
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
WHERE LOWER(email) = 'test@example.com'

-- Use date range
WHERE created_at >= '2026-03-20' AND created_at < '2026-03-21'

-- Store computed value in column
ALTER TABLE appointments ADD status_with_suffix TEXT 
  GENERATED ALWAYS AS (status || '_suffix') STORED;
CREATE INDEX idx_status_suffix ON appointments (status_with_suffix);
```

---

### 2. ❌ OR Conditions Across Different Columns

**Bad**:
```sql
SELECT * FROM appointments 
WHERE patient_id = 123 OR doctor_id = 456;
```
- Cannot use indexes efficiently

**Good**:
```sql
-- Use UNION ALL
SELECT * FROM appointments WHERE patient_id = 123
UNION ALL
SELECT * FROM appointments WHERE doctor_id = 456 AND patient_id != 123;
```
- Each branch uses appropriate index

---

### 3. ❌ NOT IN with NULL Values

**Bad**:
```sql
SELECT * FROM patients 
WHERE id NOT IN (SELECT patient_id FROM waitlist);
```
- Returns zero rows if waitlist.patient_id contains NULL

**Good**:
```sql
SELECT * FROM patients p
WHERE NOT EXISTS (
    SELECT 1 FROM waitlist w WHERE w.patient_id = p.id
);
```

---

### 4. ❌ OFFSET for Pagination

**Bad**:
```sql
-- Page 1000: Skip 50,000 rows!
SELECT * FROM appointments 
ORDER BY created_at DESC 
LIMIT 50 OFFSET 50000;
```
- Database must process all skipped rows

**Good**:
```sql
-- Keyset pagination
SELECT * FROM appointments 
WHERE created_at < $last_seen_timestamp 
ORDER BY created_at DESC 
LIMIT 50;
```
- Uses index, constant time

---

### 5. ❌ Implicit Type Conversions

**Bad**:
```sql
-- patient_id is BIGINT, but passing string
WHERE patient_id = '123'
```
- PostgreSQL converts column to TEXT (index not used)

**Good**:
```sql
WHERE patient_id = 123
-- Or explicitly cast
WHERE patient_id = '123'::bigint
```

---

## Troubleshooting Slow Queries

### Step-by-Step Process

#### 1. Enable Query Logging

```sql
-- Log queries > 100ms
ALTER DATABASE upaci SET log_min_duration_statement = 100;

-- View slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 20;
```

#### 2. Run EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
<your slow query>;
```

#### 3. Check for Sequential Scans

Look for `Seq Scan on <table>` where table has > 1000 rows
- **Solution**: Add index on filtered columns

#### 4. Check Statistics

```sql
-- When was table last analyzed?
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'app';

-- Manually update if needed
ANALYZE appointments;
```

#### 5. Check Index Usage

```sql
-- Is index being used?
SELECT * FROM pg_stat_user_indexes 
WHERE indexrelname = 'idx_appointments_patient_status';

-- idx_scan should be > 0
```

#### 6. Check for Bloat

```bash
psql -U postgres -d upaci -f scripts/analyze_index_usage.sql
```

Look for:
- High estimated bloat percentage
- Low cache hit ratio

#### 7. Optimize Query

Apply techniques from this guide:
- Add/modify indexes
- Rewrite query logic
- Use covering indexes
- Batch operations

#### 8. Verify Improvement

```sql
EXPLAIN (ANALYZE, BUFFERS)
<optimized query>;
```

Compare execution time to original.

---

## Performance Monitoring

### Set Up pg_stat_statements

```sql
-- Enable extension (requires restart)
CREATE EXTENSION pg_stat_statements;

-- View top 10 slowest queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Set Up Alerts

```sql
-- Alert on queries > 1 second
SELECT query FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
  AND calls > 10;
```

Integrate with monitoring (Grafana/Prometheus):
- Alert when P95 latency > target
- Track query execution time by endpoint
- Monitor cache hit ratio

---

## Benchmarking Checklist

Use `scripts/benchmark_queries.sql` to validate performance:

```bash
psql -U postgres -d upaci -f scripts/benchmark_queries.sql
```

**Expected Results**:
- [ ] Slot availability: < 100ms ✅
- [ ] Patient lookup: < 200ms ✅
- [ ] Appointment history: < 150ms ✅
- [ ] Doctor schedule: < 150ms ✅
- [ ] Active medications: < 100ms ✅
- [ ] Waitlist queue: < 100ms ✅
- [ ] Document search: < 150ms ✅
- [ ] Vector similarity: < 200ms ✅
- [ ] Notifications: < 100ms ✅
- [ ] Audit log: < 200ms ✅

---

## Additional Resources

- [PostgreSQL EXPLAIN Tutorial](https://www.postgresql.org/docs/15/using-explain.html)
- [Query Performance Tuning](https://www.postgresql.org/docs/15/performance-tips.html)
- [pg_stat_statements Documentation](https://www.postgresql.org/docs/15/pgstatstatements.html)
- [Index Advisor Tools](https://github.com/ankane/dexter)

---

**Last Updated**: 2026-03-18  
**Maintained By**: Platform Team
