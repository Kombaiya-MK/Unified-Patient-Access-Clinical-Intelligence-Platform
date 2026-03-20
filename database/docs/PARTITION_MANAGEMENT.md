# Audit Logs Partition Management Guide

**Clinical Appointment Platform (UPACI)**  
**Version:** 1.0.0  
**Last Updated:** 2026-03-18  
**HIPAA Compliance:** 45 CFR 164.316(b)(2)(i) - 7-Year Retention

---

## Table of Contents

1. [Overview](#overview)
2. [Partition Strategy](#partition-strategy)
3. [Initial Setup](#initial-setup)
4. [Automatic Partition Creation](#automatic-partition-creation)
5. [Manual Partition Management](#manual-partition-management)
6. [Archive Process](#archive-process)
7. [Restore Process](#restore-process)
8. [Partition Pruning](#partition-pruning)
9. [Index Strategy](#index-strategy)
10. [7-Year Retention Policy](#7-year-retention-policy)
11. [Monitoring Partition Sizes](#monitoring-partition-sizes)
12. [Troubleshooting](#troubleshooting)
13. [Performance Optimization](#performance-optimization)
14. [Compliance & Auditing](#compliance--auditing)

---

## Overview

The `audit_logs` table uses **PostgreSQL range partitioning** to efficiently manage millions of audit records over a 7-year retention period. Partitioning provides:

- **Performance**: Faster queries with partition pruning (only scan relevant partitions)
- **Maintainability**: Easy archival and deletion of old data
- **Cost Efficiency**: Archive old partitions to cold storage (S3/Azure Blob)
- **HIPAA Compliance**: Structured 7-year retention with automatic archival

### Key Features

✅ **Yearly Partitions**: One partition per year (2024-2030, expandable)  
✅ **Automatic Archival**: Cron job archives partitions > 7 years old  
✅ **Cold Storage**: S3 or Azure Blob for long-term storage  
✅ **Partition Pruning**: Queries with date filters scan only relevant partitions  
✅ **Immutable Audit Trail**: INSERT-only permissions preserved on partitions  
✅ **Comprehensive Indexing**: 6 indexes per partition for query performance  

---

## Partition Strategy

### Range Partitioning by Year

Partitions are created using **RANGE partitioning** on the `timestamp` column:

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, timestamp)  -- Composite key including partition key
) PARTITION BY RANGE (timestamp);
```

### Partition Naming Convention

| Partition Name | Year | Date Range | Status |
|----------------|------|------------|--------|
| `audit_logs_2024` | 2024 | 2024-01-01 to 2024-12-31 | Active |
| `audit_logs_2025` | 2025 | 2025-01-01 to 2025-12-31 | Active |
| `audit_logs_2026` | 2026 | 2026-01-01 to 2026-12-31 | Active (current) |
| `audit_logs_2027` | 2027 | 2027-01-01 to 2027-12-31 | Active |
| `audit_logs_2028` | 2028 | 2028-01-01 to 2028-12-31 | Active |
| `audit_logs_2029` | 2029 | 2029-01-01 to 2029-12-31 | Active |
| `audit_logs_2030` | 2030 | 2030-01-01 to 2030-12-31 | Active |
| `audit_logs_default` | - | Out-of-range records | Fallback |

### Default Partition

The `audit_logs_default` partition catches any records with timestamps outside defined ranges (pre-2024 or post-2030). This prevents INSERT failures.

**⚠️ Important**: If `audit_logs_default` accumulates significant records, create specific partitions for those years.

---

## Initial Setup

### Prerequisites

1. PostgreSQL 15+ with partitioning support
2. Existing `audit_logs` table (from V001 migration)
3. Database permissions for `upaci_user`

### Step 1: Run Partitioning Migrations

```bash
cd database
psql -U postgres -d upaci -f migrations/V010__audit_logs_partitioning.sql
psql -U postgres -d upaci -f migrations/V011__audit_logs_partitions_2024_2030.sql
```

**V010** converts `audit_logs` to a partitioned table.  
**V011** creates initial partitions (2024-2030) and migrates existing data.

### Step 2: Verify Partitions Created

```sql
-- List all audit_logs partitions
SELECT 
    c.relname AS partition_name,
    pg_get_expr(c.relpartbound, c.oid, true) AS partition_bound,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
    (SELECT COUNT(*) FROM app.audit_logs WHERE 
        timestamp >= pg_get_expr(c.relpartbound, c.oid, true)::text::timestamptz
    ) AS row_count
FROM pg_class c
JOIN pg_inherits i ON c.oid = i.inhrelid
JOIN pg_class p ON i.inhparent = p.oid
WHERE p.relname = 'audit_logs'
    AND p.relnamespace = 'app'::regnamespace
ORDER BY c.relname;
```

Expected output:
```
 partition_name   | partition_bound                                      | size   | row_count
------------------+------------------------------------------------------+--------+-----------
 audit_logs_2024  | FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')     | 128 MB |     15420
 audit_logs_2025  | FOR VALUES FROM ('2025-01-01') TO ('2026-01-01')     | 256 MB |     32501
 audit_logs_2026  | FOR VALUES FROM ('2026-01-01') TO ('2027-01-01')     | 64 MB  |      5823
 audit_logs_2027  | FOR VALUES FROM ('2027-01-01') TO ('2028-01-01')     | 0 bytes|         0
 audit_logs_2028  | FOR VALUES FROM ('2028-01-01') TO ('2029-01-01')     | 0 bytes|         0
 audit_logs_2029  | FOR VALUES FROM ('2029-01-01') TO ('2030-01-01')     | 0 bytes|         0
 audit_logs_2030  | FOR VALUES FROM ('2030-01-01') TO ('2031-01-01')     | 0 bytes|         0
 audit_logs_default | DEFAULT                                            | 0 bytes|         0
```

### Step 3: Load Partition Function

```bash
psql -U postgres -d upaci -f database/scripts/create_partition.sql
```

This creates the `create_audit_partition(year INT)` function for dynamic partition creation.

### Step 4: Test INSERT Routing

```sql
-- Insert test record
INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, user_agent, timestamp)
VALUES (1, 'TEST', 'test_table', 123, '127.0.0.1', 'test-agent', '2026-06-15 10:30:00');

-- Verify it went to correct partition
SELECT COUNT(*) FROM audit_logs_2026 WHERE action = 'TEST';
-- Expected: 1 row

-- Cleanup test record
DELETE FROM audit_logs WHERE action = 'TEST';
```

---

## Automatic Partition Creation

### Using the `create_audit_partition` Function

PostgreSQL function to create new partitions dynamically:

```sql
-- Create partition for 2031
SELECT * FROM create_audit_partition(2031);
```

**Output:**
```
 partition_name   | start_date          | end_date            | status  | message
------------------+---------------------+---------------------+---------+----------------------------------------------------------
 audit_logs_2031  | 2031-01-01 00:00:00 | 2032-01-01 00:00:00 | SUCCESS | Partition audit_logs_2031 created successfully with 6 indexes.
```

### What the Function Does

1. Validates year input (2024-2100)
2. Checks if partition already exists
3. Creates partition with `FOR VALUES FROM (start) TO (end)`
4. Creates 6 indexes on the partition:
   - `idx_audit_logs_YYYY_user_id`
   - `idx_audit_logs_YYYY_action`
   - `idx_audit_logs_YYYY_timestamp`
   - `idx_audit_logs_YYYY_table_record`
   - `idx_audit_logs_YYYY_old_values` (GIN)
   - `idx_audit_logs_YYYY_new_values` (GIN)
5. Inserts metadata into `partition_metadata` table

### Batch Creating Multiple Partitions

```sql
-- Create partitions for 2031-2035
DO $$
DECLARE
    year INT;
BEGIN
    FOR year IN 2031..2035 LOOP
        PERFORM create_audit_partition(year);
    END LOOP;
END $$;
```

---

## Manual Partition Management

### Creating a Partition Manually (Without Function)

```sql
-- Create partition for 2031
CREATE TABLE audit_logs_2031 PARTITION OF audit_logs
    FOR VALUES FROM ('2031-01-01 00:00:00+00') TO ('2032-01-01 00:00:00+00');

-- Add indexes
CREATE INDEX idx_audit_logs_2031_user_id ON audit_logs_2031(user_id);
CREATE INDEX idx_audit_logs_2031_action ON audit_logs_2031(action);
CREATE INDEX idx_audit_logs_2031_timestamp ON audit_logs_2031(timestamp);
CREATE INDEX idx_audit_logs_2031_table_record ON audit_logs_2031(table_name, record_id);
CREATE INDEX idx_audit_logs_2031_old_values ON audit_logs_2031 USING GIN (old_values);
CREATE INDEX idx_audit_logs_2031_new_values ON audit_logs_2031 USING GIN (new_values);

-- Insert metadata
INSERT INTO partition_metadata (partition_name, partition_type, start_date, end_date, status, notes)
VALUES (
    'audit_logs_2031',
    'yearly',
    '2031-01-01 00:00:00+00',
    '2032-01-01 00:00:00+00',
    'active',
    'Manually created partition for year 2031'
);
```

### Viewing Partition Indexes

```sql
-- Check all indexes on a specific partition
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'app'
    AND tablename = 'audit_logs_2026'
ORDER BY indexname;
```

### Viewing Partition Metadata

```sql
-- View all partition metadata
SELECT 
    partition_name,
    partition_type,
    start_date,
    end_date,
    status,
    pg_size_pretty(archive_size_bytes) AS archive_size,
    row_count_at_archive,
    archived_at,
    archive_location
FROM partition_metadata
WHERE partition_name LIKE 'audit_logs_%'
ORDER BY start_date;
```

---

## Archive Process

### Automatic Archival (Recommended)

The retention cron job automatically archives partitions older than 7 years.

**Configuration** (`server/src/config/retention.config.ts`):

```typescript
export const retentionConfig = {
  retentionYears: 7,  // HIPAA requirement
  cronSchedule: '0 0 1 * *',  // Monthly on 1st day at 00:00
  storageProvider: 's3',  // or 'azure'
  s3Bucket: 'upaci-audit-archive',
  dryRun: false,  // Set to true for testing
  enabled: true,  // Set to false to disable
};
```

**Start the Cron Job** (in application startup):

```typescript
import { startRetentionJob } from './jobs/auditRetentionJob';

// In server.ts or app.ts
const retentionTask = startRetentionJob();
```

**How It Works:**

1. **Monthly Execution**: Job runs on the 1st day of each month at midnight
2. **Calculate Cutoff**: Determines which partitions are > 7 years old
3. **Export Partition**: Uses `pg_dump` to export partition data
4. **Compress**: GZIPs the export file
5. **Upload**: Uploads to S3/Azure Blob storage
6. **Verify**: Confirms upload successful
7. **Update Metadata**: Marks partition as 'archived' in `partition_metadata`
8. **Drop Partition**: Removes partition from database
9. **Cleanup**: Removes local temporary files

### Manual Archival

**Archive a specific partition (dry run first):**

```bash
cd database/scripts

# Dry run (test without executing)
bash archive_partition.sh 2024 --dry-run --s3-bucket=upaci-audit-archive

# Actual execution
bash archive_partition.sh 2024 --execute --s3-bucket=upaci-audit-archive
```

**Script Options:**

| Option | Description |
|--------|-------------|
| `<year>` | Year of partition to archive (e.g., 2024) |
| `--dry-run` | Show commands without executing (default) |
| `--execute` | Actually execute the archive operation |
| `--s3-bucket=<name>` | AWS S3 bucket for archive storage |
| `--azure-container=<name>` | Azure Blob container for archive storage |

**Required Environment Variables (S3):**

```bash
export AWS_ACCESS_KEY_ID="your_aws_key"
export AWS_SECRET_ACCESS_KEY="your_aws_secret"
export AWS_DEFAULT_REGION="us-east-1"
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="upaci"
export DB_USER="postgres"
```

**Required Environment Variables (Azure):**

```bash
export AZURE_STORAGE_ACCOUNT="your_storage_account"
export AZURE_STORAGE_KEY="your_storage_key"
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="upaci"
export DB_USER="postgres"
```

### Verifying Archive Upload

**S3:**

```bash
aws s3 ls s3://upaci-audit-archive/audit-archives/
```

**Azure:**

```bash
az storage blob list \
    --account-name your_storage_account \
    --container-name audit-archives \
    --prefix "audit_logs_"
```

---

## Restore Process

### When to Restore

- **Compliance Audit**: Need to review historical records
- **Legal Discovery**: Court order requires access to old data
- **Data Recovery**: Accidental deletion or corruption
- **Business Analytics**: Historical trend analysis

### Manual Restore

**Restore a partition from S3:**

```bash
cd database/scripts

# Restore partition for 2024 from S3
bash restore_partition.sh 2024 --s3-bucket=upaci-audit-archive

# Expected output:
# [INFO] Downloading from S3...
# [SUCCESS] Downloaded archive file
# [INFO] Decompressing archive...
# [INFO] Creating partition structure...
# [INFO] Restoring data to partition...
# [SUCCESS] Data restored to partition
# [INFO] Verifying restored row count...
# [SUCCESS] Row count verified: 15420 records
# [SUCCESS] Restore operation completed successfully
```

**Restore from Azure:**

```bash
bash restore_partition.sh 2024 --azure-container=audit-archives
```

### What Restore Does

1. **Query Metadata**: Retrieves archive location from `partition_metadata`
2. **Download Archive**: Fetches compressed SQL dump from S3/Azure
3. **Decompress**: Unzips the archive file
4. **Create Partition**: Calls `create_audit_partition()` to recreate structure
5. **Import Data**: Runs `psql < archive.sql` to restore records
6. **Verify**: Counts rows and compares to `row_count_at_archive`
7. **Update Metadata**: Marks partition as 'restored'

### Verifying Restored Data

```sql
-- Check partition exists
SELECT * FROM pg_tables WHERE tablename = 'audit_logs_2024';

-- Count records
SELECT COUNT(*) FROM audit_logs_2024;

-- Sample recent records
SELECT * FROM audit_logs_2024 ORDER BY timestamp DESC LIMIT 10;

-- Verify partition metadata
SELECT * FROM partition_metadata WHERE partition_name = 'audit_logs_2024';
```

---

## Partition Pruning

### What is Partition Pruning?

Partition pruning is PostgreSQL's optimization that **scans only relevant partitions** based on query filters. This dramatically improves query performance.

### Example: Query with Date Filter

```sql
-- Query audit logs for March 2026
EXPLAIN SELECT * FROM audit_logs 
WHERE timestamp >= '2026-03-01' AND timestamp < '2026-04-01';
```

**EXPLAIN Output (partition pruning working):**

```
Append  (cost=0.00..100.50 rows=1000 width=200)
  ->  Seq Scan on audit_logs_2026  (cost=0.00..100.50 rows=1000 width=200)
        Filter: ((timestamp >= '2026-03-01'::timestamp) AND (timestamp < '2026-04-01'::timestamp))
```

✅ **Only `audit_logs_2026` is scanned** (not all 8 partitions)

### Example: Query Without Date Filter

```sql
-- Query without timestamp filter
EXPLAIN SELECT * FROM audit_logs WHERE user_id = 123;
```

**EXPLAIN Output (NO partition pruning):**

```
Append  (cost=0.00..800.00 rows=5000 width=200)
  ->  Index Scan using idx_audit_logs_2024_user_id on audit_logs_2024
  ->  Index Scan using idx_audit_logs_2025_user_id on audit_logs_2025
  ->  Index Scan using idx_audit_logs_2026_user_id on audit_logs_2026
  ->  Index Scan using idx_audit_logs_2027_user_id on audit_logs_2027
  ...
```

❌ **All partitions scanned** (slower query)

### Best Practices for Partition Pruning

1. **Always include `timestamp` filter** in WHERE clause when possible
2. **Use BETWEEN or >= and <** for date ranges
3. **Avoid functions on `timestamp` column** (e.g., `EXTRACT(YEAR FROM timestamp) = 2026`)
4. **Use parametrized queries** to enable const folding

**Good Query:**
```sql
SELECT * FROM audit_logs 
WHERE timestamp BETWEEN '2026-01-01' AND '2026-12-31' 
    AND user_id = 123;
```

**Bad Query (disables pruning):**
```sql
SELECT * FROM audit_logs 
WHERE EXTRACT(YEAR FROM timestamp) = 2026 
    AND user_id = 123;
```

---

## Index Strategy

### Indexes Per Partition

Each partition has **6 indexes** for optimal query performance:

| Index Name | Type | Column(s) | Purpose |
|------------|------|-----------|---------|
| `idx_audit_logs_YYYY_user_id` | B-tree | `user_id` | Queries by user |
| `idx_audit_logs_YYYY_action` | B-tree | `action` | Queries by action type |
| `idx_audit_logs_YYYY_timestamp` | B-tree | `timestamp` | Date range queries |
| `idx_audit_logs_YYYY_table_record` | B-tree | `table_name, record_id` | Resource lookup |
| `idx_audit_logs_YYYY_old_values` | GIN | `old_values` (JSONB) | JSONB queries |
| `idx_audit_logs_YYYY_new_values` | GIN | `new_values` (JSONB) | JSONB queries |

### Why Per-Partition Indexes?

- **Smaller Index Size**: Each index only covers one year of data
- **Faster Index Scans**: Smaller B-trees = faster lookups
- **Better Maintenance**: VACUUM/ANALYZE each partition independently
- **Partition Pruning**: PostgreSQL uses partition-local indexes

### Checking Index Usage

```sql
-- Show index usage statistics for 2026 partition
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'audit_logs_2026'
ORDER BY idx_scan DESC;
```

### Rebuilding Indexes (if needed)

```sql
-- Rebuild all indexes on a partition
REINDEX TABLE audit_logs_2026;

-- Rebuild a specific index
REINDEX INDEX idx_audit_logs_2026_user_id;
```

---

## 7-Year Retention Policy

### HIPAA Requirement

**45 CFR 164.316(b)(2)(i)** states:

> "Retain the documentation required by paragraph (b)(1) of this section for 6 years from the date of its creation or the date when it last was in effect, whichever is later."

**UPACI uses a 7-year retention** to provide buffer for compliance.

### Retention Implementation

| Year | Current Year | Status |
|------|--------------|--------|
| 2024 | 2026 | Active (2 years old) |
| 2025 | 2026 | Active (1 year old) |
| 2026 | 2026 | Active (current year) |
| 2027 | 2033 | Active (future) |
| ... |
| 2019 | 2026 | **Archived** (7 years old) |
| 2018 | 2026 | **Archived** (8 years old) |

### Retention Timeline

```
Year 2026 (Current Year)
┌─────────────────────────────────────────────────────────────────┐
│ Active Partitions (in database)                                 │
│ ● 2024, 2025, 2026, 2027, 2028, 2029, 2030                     │
│                                                                  │
│ Archival Threshold: 2026 - 7 = 2019                            │
│                                                                  │
│ Archived Partitions (cold storage)                              │
│ ● 2019, 2018, 2017, 2016, ...                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Calculating Archival Eligibility

```sql
-- Find partitions eligible for archival
SELECT 
    partition_name,
    start_date,
    EXTRACT(YEAR FROM start_date) AS year,
    EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM start_date) AS age_years
FROM partition_metadata
WHERE 
    partition_type = 'yearly'
    AND status = 'active'
    AND EXTRACT(YEAR FROM start_date) < EXTRACT(YEAR FROM CURRENT_DATE) - 7
ORDER BY start_date;
```

---

## Monitoring Partition Sizes

### Query: Partition Size and Row Count

```sql
SELECT 
    c.relname AS partition_name,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
    pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
    pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) AS index_size,
    (SELECT COUNT(*) FROM app.audit_logs WHERE 
        timestamp >= (SELECT start_date FROM partition_metadata WHERE partition_name = c.relname)
        AND timestamp < (SELECT end_date FROM partition_metadata WHERE partition_name = c.relname)
    ) AS row_count
FROM pg_class c
JOIN pg_inherits i ON c.oid = i.inhrelid
JOIN pg_class p ON i.inhparent = p.oid
WHERE p.relname = 'audit_logs'
    AND p.relnamespace = 'app'::regnamespace
ORDER BY c.relname;
```

### Query: Total Audit Logs Storage

```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('app.audit_logs')) AS total_size,
    (SELECT COUNT(*) FROM app.audit_logs) AS total_rows;
```

### Query: Partition Growth Rate

```sql
-- Estimate monthly growth rate for current year partition
SELECT 
    partition_name,
    COUNT(*) AS row_count,
    pg_size_pretty(pg_total_relation_size('app.' || partition_name::text)) AS size,
    pg_size_pretty(pg_total_relation_size('app.' || partition_name::text) / NULLIF(COUNT(*), 0)) AS bytes_per_row
FROM partition_metadata pm
CROSS JOIN LATERAL (
    SELECT COUNT(*) FROM app.audit_logs al 
    WHERE al.timestamp >= pm.start_date 
        AND al.timestamp < pm.end_date
) counts
WHERE partition_name = 'audit_logs_' || EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY partition_name;
```

### Alerts and Monitoring

**Recommended Monitoring:**

1. **Partition Size > 50 GB** → Consider more frequent archival or monthly partitions
2. **Default Partition > 1000 rows** → Create specific partition for that year
3. **Partition Growth > 1 GB/day** → Investigate unusual activity
4. **Archive Failures** → Check `audit_error_logs` table

---

## Troubleshooting

### Problem: Partition Not Found

**Symptom:**
```
ERROR:  no partition of relation "audit_logs" found for row
```

**Cause:** Trying to INSERT a record with timestamp outside all partition ranges.

**Solution:**

1. Check the timestamp value:
   ```sql
   SELECT timestamp FROM <your_insert_query>;
   ```

2. Create partition for that year:
   ```sql
   SELECT * FROM create_audit_partition(2035);  -- Example: year 2035
   ```

3. Re-run the INSERT.

### Problem: Partition Already Exists

**Symptom:**
```
ERROR:  relation "audit_logs_2031" already exists
```

**Solution:**

Check if partition is already created:
```sql
SELECT * FROM pg_tables WHERE tablename = 'audit_logs_2031';
```

If it exists, no action needed. If creating manually, use `CREATE TABLE IF NOT EXISTS`.

### Problem: Archive Script Fails

**Symptom:**
```
[ERROR] Failed to export partition
```

**Troubleshooting Steps:**

1. **Check database connectivity:**
   ```bash
   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;"
   ```

2. **Verify partition exists:**
   ```sql
   SELECT * FROM pg_tables WHERE tablename = 'audit_logs_2024';
   ```

3. **Check AWS/Azure credentials:**
   ```bash
   # S3
   aws s3 ls s3://upaci-audit-archive/
   
   # Azure
   az storage container list --account-name your_account
   ```

4. **Check disk space:**
   ```bash
   df -h /tmp
   ```

5. **Review archive logs:**
   ```bash
   tail -f logs/audit-retention.log
   ```

### Problem: Restore Fails with Row Count Mismatch

**Symptom:**
```
[ERROR] Row count mismatch! Expected 15420, got 15410
```

**Cause:** Archive file may be corrupted or incomplete.

**Solution:**

1. **Check archive file integrity:**
   ```bash
   gunzip -t /tmp/audit_logs_2024_*.sql.gz
   ```

2. **Download archive again:**
   ```bash
   aws s3 cp s3://upaci-audit-archive/audit-archives/audit_logs_2024_*.sql.gz /tmp/
   ```

3. **Verify archive metadata:**
   ```sql
   SELECT * FROM partition_metadata WHERE partition_name = 'audit_logs_2024';
   ```

4. **If corrupted, restore from backup** (if available).

### Problem: Partition Pruning Not Working

**Symptom:** EXPLAIN shows all partitions being scanned.

**Solution:**

1. **Ensure timestamp filter in WHERE clause:**
   ```sql
   -- Good
   SELECT * FROM audit_logs 
   WHERE timestamp >= '2026-01-01' AND timestamp < '2026-12-31';
   
   -- Bad (disables pruning)
   SELECT * FROM audit_logs 
   WHERE EXTRACT(YEAR FROM timestamp) = 2026;
   ```

2. **Check table statistics:**
   ```sql
   ANALYZE audit_logs;
   ```

3. **Verify partition constraints:**
   ```sql
   SELECT 
       c.relname AS partition_name,
       pg_get_expr(c.relpartbound, c.oid, true) AS partition_bound
   FROM pg_class c
   JOIN pg_inherits i ON c.oid = i.inhrelid
   JOIN pg_class p ON i.inhparent = p.oid
   WHERE p.relname = 'audit_logs';
   ```

---

## Performance Optimization

### Query Performance Tips

1. **Always use timestamp filters** to enable partition pruning
2. **Use indexes** - queries on `user_id`, `action`, `table_name` benefit from indexes
3. **Limit result sets** - use LIMIT when fetching many rows
4. **Avoid SELECT *** - specify only needed columns
5. **Use JSONB operators** efficiently with GIN indexes:
   ```sql
   -- Good (uses GIN index)
   SELECT * FROM audit_logs 
   WHERE new_values @> '{"status": "active"}';
    
   -- Bad (can't use index)
   SELECT * FROM audit_logs 
   WHERE new_values::text LIKE '%active%';
   ```

### Maintenance Operations

**Regular VACUUM and ANALYZE:**

```sql
-- Vacuum and analyze all partitions
VACUUM ANALYZE audit_logs;

-- Or per partition
VACUUM ANALYZE audit_logs_2026;
```

**Rebuild Indexes (if fragmented):**

```sql
-- Rebuild all indexes on current year partition
REINDEX TABLE audit_logs_2026;
```

**Check for Bloat:**

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_dead_tup AS dead_tuples
FROM pg_stat_user_tables
WHERE tablename LIKE 'audit_logs_%'
ORDER BY n_dead_tup DESC;
```

---

## Compliance & Auditing

### HIPAA Compliance Checklist

✅ **7-Year Retention**: Partitions archived to cold storage after 7 years  
✅ **Immutable Audit Trail**: INSERT-only permissions enforced  
✅ **Secure Storage**: S3/Azure with encryption at rest  
✅ **Access Logging**: Cloud provider logs access to archives  
✅ **Disaster Recovery**: Multi-region replication for archives  
✅ **Audit Trail**: `partition_metadata` tracks all archival operations  

### Generating Compliance Reports

**Query: Retention Status Summary**

```sql
SELECT 
    CASE 
        WHEN status = 'active' THEN 'Active Database'
        WHEN status = 'archived' THEN 'Cold Storage'
        ELSE status
    END AS location,
    COUNT(*) AS partition_count,
    SUM(row_count_at_archive) AS total_records,
    pg_size_pretty(SUM(archive_size_bytes)) AS total_size
FROM partition_metadata
WHERE partition_name LIKE 'audit_logs_%'
GROUP BY status;
```

**Query: Archive History**

```sql
SELECT 
    partition_name,
    EXTRACT(YEAR FROM start_date) AS year,
    row_count_at_archive,
    pg_size_pretty(archive_size_bytes) AS archive_size,
    archived_at,
    archive_location
FROM partition_metadata
WHERE status = 'archived'
ORDER BY archived_at DESC;
```

---

## Summary

### Key Takeaways

1. **Partitioning improves performance** for large audit log tables
2. **Automatic archival** via cron job ensures HIPAA compliance
3. **Partition pruning** makes date-range queries fast
4. **Cold storage** (S3/Azure) reduces database costs
5. **Easy restore** process brings back archived data when needed

### Quick Reference Commands

| Task | Command |
|------|---------|
| **Create Partition** | `SELECT * FROM create_audit_partition(2031);` |
| **List Partitions** | `SELECT * FROM pg_tables WHERE tablename LIKE 'audit_logs_%';` |
| **Archiveition** | `bash archive_partition.sh 2024 --execute --s3-bucket=upaci-audit-archive` |
| **Restore Partition** | `bash restore_partition.sh 2024 --s3-bucket=upaci-audit-archive` |
| **View Metadata** | `SELECT * FROM partition_metadata ORDER BY start_date;` |
| **Check Partition Sizes** | `SELECT pg_size_pretty(pg_total_relation_size('app.audit_logs'));` |

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-03-18  
**Maintained By:** UPACI Platform Team  
**Questions?** Contact: [devops@upaci.com](mailto:devops@upaci.com)
