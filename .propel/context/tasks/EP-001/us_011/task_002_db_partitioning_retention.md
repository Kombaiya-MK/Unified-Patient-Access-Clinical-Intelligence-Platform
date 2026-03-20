# Task - TASK_002_DB_PARTITIONING_RETENTION

## Requirement Reference
- User Story: US_011  
- Story Location: `.propel/context/tasks/us_011/us_011.md`
- Acceptance Criteria:
    - AC1: 7-year retention for audit logs
- Edge Cases:
    - Millions of records: Implement table partitioning by year, archive old partitions to cold storage

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

> **Note**: Database schema task - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | node-cron | 3.x |
| Database | PostgreSQL | 15+ |
| Database | Table Partitioning | Built-in |
| Database | pg_partman | 4.7+ (optional) |

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

> **Note**: Database optimization only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Database optimization only

## Task Overview
Implement PostgreSQL table partitioning on audit_logs table using range partitioning by year to handle millions of records efficiently. Create partitions for 7 years (2024-2030) with automatic partition creation for future years. Implement automated archival strategy: export partitions older than 7 years to cold storage (S3/Azure Blob), drop archived partitions. Create retention policy cron job that runs monthly to check and archive expired partitions. Optimize partition queries with partition pruning. Create indexes on each partition for query performance. Document partition management procedures (manual partition creation, archive restoration).

## Dependent Tasks
- US_007 TASK_001: AuditLogs table must exist

## Impacted Components
**Modified:**
- database/migrations/XXX_audit_logs_table.sql (Convert to partitioned table if not already)

**New:**
- database/migrations/XXX_audit_logs_partitioning.sql (Create partitioned table structure)
- database/migrations/XXX_audit_logs_partitions_2024_2030.sql (Create initial partitions)
- database/scripts/create_partition.sql (Function to create new partition)
- database/scripts/archive_old_partitions.sh (Archive script for cold storage)
- server/src/jobs/auditRetentionJob.ts (Cron job for automated retention)
- database/docs/PARTITION_MANAGEMENT.md (Partition management guide)
- server/tests/integration/auditPartitioning.test.ts (Partition tests)

## Implementation Plan
1. **Convert to Partitioned Table**: ALTER TABLE audit_logs to use range partitioning by YEAR(created_at)
2. **Create Partitions**: Generate partitions for each year: audit_logs_2024, audit_logs_2025, ..., audit_logs_2030
3. **Partition Indexes**: Create indexes on each partition (user_id, action_type, created_at)
4. **Default Partition**: Create audit_logs_default for records outside defined ranges (fallback)
5. **Auto Partition Function**: PostgreSQL function that creates next year's partition automatically
6. **Retention Job**: Node.js cron job (runs monthly) to check partitions older than 7 years
7. **Archive Strategy**: Export old partition to S3/Azure Blob using pg_dump, verify export, drop partition
8. **Partition Pruning**: Ensure queries with created_at filters benefit from partition pruning
9. **Monitoring**: Add metrics for partition sizes, row counts, archive operations
10. **Restore Procedure**: Document how to restore archived partition from cold storage

## Current Project State
```
ASSIGNMENT/
├── database/                # Database setup (US_003, US_007)
│   ├── migrations/
│   │   └── ...audit_logs_table.sql  # AuditLogs table exists
│   └── scripts/
└── server/                  # Backend API
    └── src/
        └── jobs/            # Background jobs directory
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/XXX_audit_logs_partitioning.sql | Convert audit_logs to partitioned table |
| CREATE | database/migrations/XXX_audit_logs_partitions_2024_2030.sql | Create initial 7 partitions |
| CREATE | database/scripts/create_partition.sql | Function to create partition for given year |
| CREATE | database/scripts/archive_partition.sh | Bash script to export partition to S3/Blob |
| CREATE | database/scripts/restore_partition.sh | Bash script to restore partition from archive |
| CREATE | server/src/jobs/auditRetentionJob.ts | Cron job for monthly retention check |
| CREATE | server/src/config/retention.config.ts | Retention policy configuration (7 years) |
| CREATE | database/docs/PARTITION_MANAGEMENT.md | Partition management documentation |
| CREATE | server/tests/integration/auditPartitioning.test.ts | Partition functionality tests |

> 0 modified files, 9 new files created

## External References
- [PostgreSQL Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Partition Pruning](https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITION-PRUNING)
- [pg_partman Extension](https://github.com/pgpartman/pg_partman)
- [HIPAA Retention Requirements](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/phi-retention/index.html)
- [Cold Storage Best Practices](https://aws.amazon.com/s3/storage-classes/glacier/)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)

## Build Commands
```bash
# Run partitioning migration
cd database
npm run migrate up

# Verify partitioned table structure
psql -U upaci_user -d upaci -c "
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename LIKE 'audit_logs%' 
ORDER BY tablename;
"
# Expected: audit_logs (parent), audit_logs_2024, audit_logs_2025, ..., audit_logs_2030, audit_logs_default

# Check partition configuration
psql -U upaci_user -d upaci -c "
SELECT 
    inhrelid::regclass AS child,
    pg_get_expr(c.relpartbound, inhrelid, true) AS partition_bound
FROM pg_inherits
JOIN pg_class c ON c.oid = inhrelid
WHERE inhparent = 'audit_logs'::regclass
ORDER BY child;
"
# Expected: Each partition with year range (e.g., FOR VALUES FROM ('2024-01-01') TO ('2025-01-01'))

# Test INSERT into correct partition
psql -U upaci_user -d upaci -c "
INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, ip_address, user_agent, created_at)
VALUES (1, 'TEST', 'test', '1', '127.0.0.1', 'test', '2025-06-15 10:00:00');
"

# Verify record in audit_logs_2025 partition
psql -U upaci_user -d upaci -c "
SELECT * FROM audit_logs_2025 WHERE action_type = 'TEST';
"
# Expected: 1 row

# Test partition pruning (should only scan 2024 partition)
psql -U upaci_user -d upaci -c "
EXPLAIN SELECT * FROM audit_logs 
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';
"
# Expected: EXPLAIN plan shows only audit_logs_2024 scanned (partition pruning working)

# Create partition for new year (2031)
psql -U upaci_user -d upaci -c "
SELECT create_audit_partition(2031);
"

# Verify new partition created
psql -U upaci_user -d upaci -c "
SELECT tablename FROM pg_tables WHERE tablename = 'audit_logs_2031';
"
# Expected: audit_logs_2031

# Test archive script (dry run)
cd database/scripts
bash archive_partition.sh 2024 --dry-run
# Expected: Output showing pg_dump command and DROP TABLE command (not executed)

# Run archive for real (2024 partition to S3)
bash archive_partition.sh 2024 --execute --s3-bucket=upaci-audit-archive
# Expected: 
# - audit_logs_2024 exported to S3
# - Table dropped from database
# - Archive metadata logged

# Test restore from archive
bash restore_partition.sh 2024 --s3-bucket=upaci-audit-archive
# Expected: audit_logs_2024 restored from S3 backup

# Start retention cron job
cd server
npm run dev
# Cron job runs monthly, checks for partitions > 7 years old, archives automatically

# Check partition sizes
psql -U upaci_user -d upaci -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE tablename LIKE 'audit_logs%'
ORDER BY bytes DESC;
"

# Run partition tests
npm test -- auditPartitioning.test.ts
```

## Implementation Validation Strategy
- [ ] Partitioned table created with range by year
- [ ] Initial partitions exist: 2024-2030 + default
- [ ] INSERT routes to correct partition automatically
- [ ] Partition pruning works: EXPLAIN shows single partition scanned
- [ ] Indexes created on each partition
- [ ] create_audit_partition function creates new partition
- [ ] Archive script exports to S3/Azure Blob
- [ ] Archive script drops exported partition
- [ ] Restore script restores from cold storage
- [ ] Retention cron job runs monthly
- [ ] 7-year retention enforced programmatically
- [ ] Partition metadata tracked (created_at, archived_at)
- [ ] Query performance improved with partitioning
- [ ] Documentation complete for manual operations

## Implementation Checklist

### Migration: Convert to Partitioned Table (database/migrations/XXX_audit_logs_partitioning.sql)
- [ ] -- If audit_logs already exists as regular table, convert:
- [ ] CREATE TABLE audit_logs_new (LIKE audit_logs INCLUDING ALL) PARTITION BY RANGE (created_at);
- [ ] Copy data: INSERT INTO audit_logs_new SELECT * FROM audit_logs;
- [ ] Drop old: DROP TABLE audit_logs;
- [ ] Rename: ALTER TABLE audit_logs_new RENAME TO audit_logs;
- [ ] -- If starting fresh, create partitioned table directly:
- [ ] CREATE TABLE audit_logs (...columns...) PARTITION BY RANGE (created_at);

### Migration: Create Initial Partitions (database/migrations/XXX_audit_logs_partitions_2024_2030.sql)
- [ ] CREATE TABLE audit_logs_2024 PARTITION OF audit_logs FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
- [ ] CREATE TABLE audit_logs_2025 PARTITION OF audit_logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
- [ ] CREATE TABLE audit_logs_2026 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
- [ ] CREATE TABLE audit_logs_2027 PARTITION OF audit_logs FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
- [ ] CREATE TABLE audit_logs_2028 PARTITION OF audit_logs FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
- [ ] CREATE TABLE audit_logs_2029 PARTITION OF audit_logs FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');
- [ ] CREATE TABLE audit_logs_2030 PARTITION OF audit_logs FOR VALUES FROM ('2030-01-01') TO ('2031-01-01');
- [ ] CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

### Create Partition Indexes (database/migrations/XXX_audit_logs_partitions_2024_2030.sql continued)
- [ ] For each partition (2024-2030):
- [ ] CREATE INDEX idx_audit_logs_YYYY_user_id ON audit_logs_YYYY(user_id);
- [ ] CREATE INDEX idx_audit_logs_YYYY_action_type ON audit_logs_YYYY(action_type);
- [ ] CREATE INDEX idx_audit_logs_YYYY_created_at ON audit_logs_YYYY(created_at);
- [ ] CREATE INDEX idx_audit_logs_YYYY_resource ON audit_logs_YYYY(resource_type, resource_id);

### Create Partition Function (database/scripts/create_partition.sql)
- [ ] CREATE OR REPLACE FUNCTION create_audit_partition(year INT) RETURNS VOID AS $$
- [ ] DECLARE
- [ ]   partition_name TEXT := 'audit_logs_' || year;
- [ ]   start_date DATE := (year || '-01-01')::DATE;
- [ ]   end_date DATE := ((year + 1) || '-01-01')::DATE;
- [ ] BEGIN
- [ ]   EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
- [ ]   EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_id ON %I(user_id)', partition_name, partition_name);
- [ ]   EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_action_type ON %I(action_type)', partition_name, partition_name);
- [ ]   EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON %I(created_at)', partition_name, partition_name);
- [ ]   RAISE NOTICE 'Partition % created successfully', partition_name;
- [ ] END;
- [ ] $$ LANGUAGE plpgsql;

### Archive Script (database/scripts/archive_partition.sh)
- [ ] #!/bin/bash
- [ ] YEAR=$1
- [ ] DRY_RUN=$2  # --dry-run or --execute
- [ ] S3_BUCKET=$3  # --s3-bucket=<name>
- [ ] PARTITION="audit_logs_${YEAR}"
- [ ] ARCHIVE_FILE="${PARTITION}_$(date +%Y%m%d).sql.gz"
- [ ] If DRY_RUN: echo commands without executing
- [ ] pg_dump -U upaci_user -d upaci -t $PARTITION | gzip > /tmp/$ARCHIVE_FILE
- [ ] Upload to S3: aws s3 cp /tmp/$ARCHIVE_FILE s3://$S3_BUCKET/audit-archives/$ARCHIVE_FILE
- [ ] Or Azure: az storage blob upload --file /tmp/$ARCHIVE_FILE --container audit-archives --name $ARCHIVE_FILE
- [ ] Verify upload: Check file exists in S3/Azure
- [ ] If verify success: psql -U postgres -d upaci -c "DROP TABLE ${PARTITION};"
- [ ] Log archive: INSERT INTO archive_metadata (partition_name, archive_date, archive_location) VALUES (...)
- [ ] Cleanup: rm /tmp/$ARCHIVE_FILE

### Restore Script (database/scripts/restore_partition.sh)
- [ ] #!/bin/bash
- [ ] YEAR=$1
- [ ] S3_BUCKET=$2
- [ ] PARTITION="audit_logs_${YEAR}"
- [ ] ARCHIVE_FILE="${PARTITION}_*.sql.gz"  # Use latest
- [ ] Download from S3: aws s3 cp s3://$S3_BUCKET/audit-archives/$ARCHIVE_FILE /tmp/$ARCHIVE_FILE
- [ ] Decompress: gunzip /tmp/$ARCHIVE_FILE
- [ ] Restore: psql -U postgres -d upaci < /tmp/${ARCHIVE_FILE%.gz}
- [ ] Verify: Check row count in restored partition
- [ ] Log restore: UPDATE archive_metadata SET restored_at = NOW() WHERE partition_name = $PARTITION

### Retention Configuration (server/src/config/retention.config.ts)
- [ ] export const retentionConfig = {
- [ ]   retentionYears: 7,  // HIPAA requirement
- [ ]   cronSchedule: '0 0 1 * *',  // Run on 1st day of each month at midnight
- [ ]   s3Bucket: process.env.AUDIT_ARCHIVE_BUCKET || 'upaci-audit-archive',
- [ ]   azureContainer: process.env.AUDIT_ARCHIVE_CONTAINER || 'audit-archives',
- [ ]   archiveDryRun: process.env.ARCHIVE_DRY_RUN === 'true'
- [ ] };

### Retention Cron Job (server/src/jobs/auditRetentionJob.ts)
- [ ] Import node-cron, retention config, pg client
- [ ] Implement function checkAndArchiveOldPartitions(): Promise<void>
- [ ] Calculate cutoff year: const cutoffYear = new Date().getFullYear() - retentionConfig.retentionYears
- [ ] Query partitions: SELECT tablename FROM pg_tables WHERE tablename LIKE 'audit_logs_%' AND tablename ~ '^audit_logs_[0-9]{4}$'
- [ ] For each partition, extract year from name
- [ ] If year < cutoffYear: Archive partition
- [ ] Execute archive script: spawn('bash', ['database/scripts/archive_partition.sh', year, '--execute', '--s3-bucket=' + s3Bucket])
- [ ] Log archive result: console.log(`Archived partition audit_logs_${year}`)
- [ ] On error: Log to console and audit_error_logs
- [ ] Implement cron.schedule(retentionConfig.cronSchedule, checkAndArchiveOldPartitions)
- [ ] Export startRetentionJob() function

### Partition Management Documentation (database/docs/PARTITION_MANAGEMENT.md)
- [ ] Document partition strategy (range by year)
- [ ] Document initial setup (migrations to run)
- [ ] Document automatic partition creation (create_audit_partition function)
- [ ] Document manual partition creation: SELECT create_audit_partition(YYYY);
- [ ] Document archive process (automatic cron, manual script)
- [ ] Document restore process (restore_partition.sh script)
- [ ] Document partition pruning (how queries benefit)
- [ ] Document index strategy per partition
- [ ] Document 7-year retention policy (HIPAA requirement)
- [ ] Document monitoring partition sizes (query examples)
- [ ] Document troubleshooting (partition not found, archive failures)

### Integration Tests (server/tests/integration/auditPartitioning.test.ts)
- [ ] Test: "INSERT routes to correct partition based on created_at"
- [ ] Test: "partition pruning works for date range queries"
- [ ] Test: "create_audit_partition creates new partition"
- [ ] Test: "indexes exist on all partitions"
- [ ] Test: "default partition catches out-of-range dates"
- [ ] Test: "archive script exports partition to file"
- [ ] Test: "restore script imports partition from file"
- [ ] Test: "retention job identifies old partitions"
- [ ] Test: "query performance better with partitioning vs single table"

### Validation and Execution
- [ ] Run migrations: npm run migrate up
- [ ] Verify partitions: Check pg_tables for audit_logs_* tables
- [ ] Test INSERT: Insert records in different years, verify routing
- [ ] Test partition pruning: EXPLAIN query with date range
- [ ] Create new partition: SELECT create_audit_partition(2031)
- [ ] Test archive script (dry-run): bash archive_partition.sh 2024 --dry-run
- [ ] Configure S3/Azure credentials: Set environment variables
- [ ] Start retention job: npm run dev (cron starts automatically)
- [ ] Monitor partition sizes: Run size query
- [ ] Run tests: npm test -- auditPartitioning.test.ts → all pass
