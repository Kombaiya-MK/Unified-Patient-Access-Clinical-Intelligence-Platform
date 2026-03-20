-- ============================================================================
-- Migration: V011 - Create Initial Partitions (2024-2030) and Migrate Data
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates initial yearly partitions for audit_logs from 2024 to 2030
--              with indexes for optimal query performance. Migrates existing data
--              from audit_logs_old to appropriate partitions. Creates default
--              partition for out-of-range records.
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: V010 (partitioned audit_logs table)
-- Rollback: See rollback/rollback_V011.sql
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Step 1: Create yearly partitions (2024-2030)
-- ============================================================================

-- Partition for 2024
CREATE TABLE IF NOT EXISTS audit_logs_2024 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01 00:00:00+00') TO ('2025-01-01 00:00:00+00');

COMMENT ON TABLE audit_logs_2024 IS 'Audit logs partition for year 2024. Range: 2024-01-01 to 2024-12-31.';

-- Partition for 2025
CREATE TABLE IF NOT EXISTS audit_logs_2025 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

COMMENT ON TABLE audit_logs_2025 IS 'Audit logs partition for year 2025. Range: 2025-01-01 to 2025-12-31.';

-- Partition for 2026 (current year)
CREATE TABLE IF NOT EXISTS audit_logs_2026 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

COMMENT ON TABLE audit_logs_2026 IS 'Audit logs partition for year 2026 (current year). Range: 2026-01-01 to 2026-12-31.';

-- Partition for 2027
CREATE TABLE IF NOT EXISTS audit_logs_2027 PARTITION OF audit_logs
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');

COMMENT ON TABLE audit_logs_2027 IS 'Audit logs partition for year 2027. Range: 2027-01-01 to 2027-12-31.';

-- Partition for 2028
CREATE TABLE IF NOT EXISTS audit_logs_2028 PARTITION OF audit_logs
    FOR VALUES FROM ('2028-01-01 00:00:00+00') TO ('2029-01-01 00:00:00+00');

COMMENT ON TABLE audit_logs_2028 IS 'Audit logs partition for year 2028. Range: 2028-01-01 to 2028-12-31.';

-- Partition for 2029
CREATE TABLE IF NOT EXISTS audit_logs_2029 PARTITION OF audit_logs
    FOR VALUES FROM ('2029-01-01 00:00:00+00') TO ('2030-01-01 00:00:00+00');

COMMENT ON TABLE audit_logs_2029 IS 'Audit logs partition for year 2029. Range: 2029-01-01 to 2029-12-31.';

-- Partition for 2030
CREATE TABLE IF NOT EXISTS audit_logs_2030 PARTITION OF audit_logs
    FOR VALUES FROM ('2030-01-01 00:00:00+00') TO ('2031-01-01 00:00:00+00');

COMMENT ON TABLE audit_logs_2030 IS 'Audit logs partition for year 2030. Range: 2030-01-01 to 2030-12-31.';

RAISE NOTICE '✓ Created 7 yearly partitions (2024-2030)';

-- ============================================================================
-- Step 2: Create default partition for out-of-range records
-- ============================================================================

-- Default partition catches any records that don't fit in defined partitions
-- This prevents INSERT failures for unexpected date ranges
CREATE TABLE IF NOT EXISTS audit_logs_default PARTITION OF audit_logs DEFAULT;

COMMENT ON TABLE audit_logs_default IS 'Default partition for audit logs with timestamps outside defined ranges (pre-2024 or post-2030). Review and create specific partitions if this contains significant data.';

RAISE NOTICE '✓ Created default partition for out-of-range records';

-- ============================================================================
-- Step 3: Create indexes on each partition
-- ============================================================================

-- Indexes for 2024 partition
CREATE INDEX IF NOT EXISTS idx_audit_logs_2024_user_id ON audit_logs_2024(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2024_action ON audit_logs_2024(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2024_timestamp ON audit_logs_2024(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2024_table_record ON audit_logs_2024(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2024_old_values ON audit_logs_2024 USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2024_new_values ON audit_logs_2024 USING GIN (new_values);

-- Indexes for 2025 partition
CREATE INDEX IF NOT EXISTS idx_audit_logs_2025_user_id ON audit_logs_2025(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2025_action ON audit_logs_2025(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2025_timestamp ON audit_logs_2025(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2025_table_record ON audit_logs_2025(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2025_old_values ON audit_logs_2025 USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2025_new_values ON audit_logs_2025 USING GIN (new_values);

-- Indexes for 2026 partition (current year)
CREATE INDEX IF NOT EXISTS idx_audit_logs_2026_user_id ON audit_logs_2026(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2026_action ON audit_logs_2026(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2026_timestamp ON audit_logs_2026(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2026_table_record ON audit_logs_2026(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2026_old_values ON audit_logs_2026 USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2026_new_values ON audit_logs_2026 USING GIN (new_values);

-- Indexes for 2027 partition
CREATE INDEX IF NOT EXISTS idx_audit_logs_2027_user_id ON audit_logs_2027(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2027_action ON audit_logs_2027(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2027_timestamp ON audit_logs_2027(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2027_table_record ON audit_logs_2027(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2027_old_values ON audit_logs_2027 USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2027_new_values ON audit_logs_2027 USING GIN (new_values);

-- Indexes for 2028 partition
CREATE INDEX IF NOT EXISTS idx_audit_logs_2028_user_id ON audit_logs_2028(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2028_action ON audit_logs_2028(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2028_timestamp ON audit_logs_2028(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2028_table_record ON audit_logs_2028(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2028_old_values ON audit_logs_2028 USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2028_new_values ON audit_logs_2028 USING GIN (new_values);

-- Indexes for 2029 partition
CREATE INDEX IF NOT EXISTS idx_audit_logs_2029_user_id ON audit_logs_2029(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2029_action ON audit_logs_2029(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2029_timestamp ON audit_logs_2029(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2029_table_record ON audit_logs_2029(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2029_old_values ON audit_logs_2029 USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2029_new_values ON audit_logs_2029 USING GIN (new_values);

-- Indexes for 2030 partition
CREATE INDEX IF NOT EXISTS idx_audit_logs_2030_user_id ON audit_logs_2030(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2030_action ON audit_logs_2030(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2030_timestamp ON audit_logs_2030(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2030_table_record ON audit_logs_2030(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2030_old_values ON audit_logs_2030 USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_2030_new_values ON audit_logs_2030 USING GIN (new_values);

-- Indexes for default partition
CREATE INDEX IF NOT EXISTS idx_audit_logs_default_user_id ON audit_logs_default(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_default_action ON audit_logs_default(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_default_timestamp ON audit_logs_default(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_default_table_record ON audit_logs_default(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_default_old_values ON audit_logs_default USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_default_new_values ON audit_logs_default USING GIN (new_values);

RAISE NOTICE '✓ Created indexes on all 8 partitions (7 yearly + 1 default)';
RAISE NOTICE '  - 6 indexes per partition: user_id, action, timestamp, table_record, old_values (GIN), new_values (GIN)';
RAISE NOTICE '  - Total: 48 indexes across all partitions';

-- ============================================================================
-- Step 4: Migrate data from audit_logs_old to partitioned table
-- ============================================================================

-- Check if audit_logs_old exists and has data
DO $$
DECLARE
    old_table_exists BOOLEAN;
    old_table_count BIGINT := 0;
    migrated_count BIGINT := 0;
BEGIN
    -- Check if audit_logs_old exists
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'app' 
        AND tablename = 'audit_logs_old'
    ) INTO old_table_exists;
    
    IF old_table_exists THEN
        -- Get count of records to migrate
        SELECT COUNT(*) INTO old_table_count FROM audit_logs_old;
        
        IF old_table_count > 0 THEN
            RAISE NOTICE 'Migrating % records from audit_logs_old to partitioned table...', old_table_count;
            
            -- Insert data from old table to partitioned table
            -- PostgreSQL will automatically route to correct partition based on timestamp
            INSERT INTO audit_logs (
                id,
                user_id,
                action,
                table_name,
                record_id,
                old_values,
                new_values,
                ip_address,
                user_agent,
                timestamp
            )
            SELECT 
                id,
                user_id,
                action,
                table_name,
                record_id,
                old_values,
                new_values,
                ip_address,
                user_agent,
                timestamp
            FROM audit_logs_old;
            
            -- Verify migration
            SELECT COUNT(*) INTO migrated_count FROM audit_logs;
            
            IF migrated_count = old_table_count THEN
                RAISE NOTICE '✓ Data migration successful: % records migrated', migrated_count;
            ELSE
                RAISE EXCEPTION '✗ Data migration failed: expected %, got %', old_table_count, migrated_count;
            END IF;
        ELSE
            RAISE NOTICE '✓ No data to migrate (audit_logs_old is empty)';
        END IF;
    ELSE
        RAISE NOTICE '✓ No audit_logs_old table found (fresh installation)';
    END IF;
END $$;

-- Update sequence to current max id
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM audit_logs;
    
    IF max_id > 0 THEN
        -- Set sequence to max_id + 1
        PERFORM setval('audit_logs_id_seq', max_id, true);
        RAISE NOTICE '✓ Sequence updated: next value will be %', max_id + 1;
    ELSE
        RAISE NOTICE '✓ Sequence at initial state (no records migrated)';
    END IF;
END $$;

-- ============================================================================
-- Step 5: Create metadata table for partition tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS partition_metadata (
    id SERIAL PRIMARY KEY,
    partition_name VARCHAR(100) NOT NULL UNIQUE,
    partition_type VARCHAR(50) NOT NULL DEFAULT 'yearly',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMPTZ,
    archive_location TEXT,
    archive_size_bytes BIGINT,
    row_count_at_archive BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    notes TEXT,
    CONSTRAINT check_status CHECK (status IN ('active', 'archived', 'deleted', 'restored'))
);

COMMENT ON TABLE partition_metadata IS 'Tracks all audit_logs partitions including active, archived, and deleted partitions for retention management';
COMMENT ON COLUMN partition_metadata.partition_name IS 'Partition table name (e.g., audit_logs_2024)';
COMMENT ON COLUMN partition_metadata.partition_type IS 'Partition type: yearly, monthly, or default';
COMMENT ON COLUMN partition_metadata.start_date IS 'Partition range start (inclusive)';
COMMENT ON COLUMN partition_metadata.end_date IS 'Partition range end (exclusive)';
COMMENT ON COLUMN partition_metadata.archived_at IS 'When partition was archived to cold storage (NULL if active)';
COMMENT ON COLUMN partition_metadata.archive_location IS 'S3/Azure Blob URL or file path where partition is archived';
COMMENT ON COLUMN partition_metadata.archive_size_bytes IS 'Size of archived data in bytes';
COMMENT ON COLUMN partition_metadata.row_count_at_archive IS 'Number of rows in partition when archived';
COMMENT ON COLUMN partition_metadata.status IS 'active: in database | archived: in cold storage | deleted: dropped from DB | restored: brought back from archive';

-- Create indexes for partition_metadata
CREATE INDEX IF NOT EXISTS idx_partition_metadata_status ON partition_metadata(status);
CREATE INDEX IF NOT EXISTS idx_partition_metadata_archived_at ON partition_metadata(archived_at);
CREATE INDEX IF NOT EXISTS idx_partition_metadata_start_date ON partition_metadata(start_date);

-- Insert metadata for newly created partitions
INSERT INTO partition_metadata (partition_name, partition_type, start_date, end_date, status, notes)
VALUES 
    ('audit_logs_2024', 'yearly', '2024-01-01 00:00:00+00', '2025-01-01 00:00:00+00', 'active', 'Initial partition creation - V011 migration'),
    ('audit_logs_2025', 'yearly', '2025-01-01 00:00:00+00', '2026-01-01 00:00:00+00', 'active', 'Initial partition creation - V011 migration'),
    ('audit_logs_2026', 'yearly', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'active', 'Initial partition creation - V011 migration (current year)'),
    ('audit_logs_2027', 'yearly', '2027-01-01 00:00:00+00', '2028-01-01 00:00:00+00', 'active', 'Initial partition creation - V011 migration'),
    ('audit_logs_2028', 'yearly', '2028-01-01 00:00:00+00', '2029-01-01 00:00:00+00', 'active', 'Initial partition creation - V011 migration'),
    ('audit_logs_2029', 'yearly', '2029-01-01 00:00:00+00', '2030-01-01 00:00:00+00', 'active', 'Initial partition creation - V011 migration'),
    ('audit_logs_2030', 'yearly', '2030-01-01 00:00:00+00', '2031-01-01 00:00:00+00', 'active', 'Initial partition creation - V011 migration'),
    ('audit_logs_default', 'default', '1970-01-01 00:00:00+00', '9999-12-31 23:59:59+00', 'active', 'Default partition for out-of-range records')
ON CONFLICT (partition_name) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON partition_metadata TO upaci_user;
GRANT USAGE, SELECT ON SEQUENCE partition_metadata_id_seq TO upaci_user;

RAISE NOTICE '✓ Created partition_metadata tracking table';

-- ============================================================================
-- Step 6: Verification Queries
-- ============================================================================

-- List all partitions
DO $$
DECLARE
    partition_record RECORD;
    partition_count INTEGER := 0;
BEGIN
    RAISE NOTICE '
========================================================================
Partition Summary
========================================================================';
    
    FOR partition_record IN 
        SELECT 
            c.relname AS partition_name,
            pg_get_expr(c.relpartbound, c.oid, true) AS partition_bound,
            pg_size_pretty(pg_total_relation_size(c.oid)) AS size
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON i.inhparent = p.oid
        WHERE p.relname = 'audit_logs'
            AND p.relnamespace = 'app'::regnamespace
        ORDER BY c.relname
    LOOP
        partition_count := partition_count + 1;
        RAISE NOTICE '  %: % - % - %', 
            partition_count,
            partition_record.partition_name,
            partition_record.partition_bound,
            partition_record.size;
    END LOOP;
    
    RAISE NOTICE '
Total partitions: %
========================================================================', partition_count;
END $$;

-- Count records in each partition
DO $$
DECLARE
    partition_record RECORD;
    total_records BIGINT := 0;
BEGIN
    RAISE NOTICE '
========================================================================
Record Distribution Across Partitions
========================================================================';
    
    FOR partition_record IN 
        SELECT 
            c.relname AS partition_name
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON i.inhparent = p.oid
        WHERE p.relname = 'audit_logs'
            AND p.relnamespace = 'app'::regnamespace
        ORDER BY c.relname
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM app.%I', partition_record.partition_name) 
        INTO partition_record;
        
        total_records := total_records + partition_record.count;
        
        IF partition_record.count > 0 THEN
            RAISE NOTICE '  %-25s: % records', partition_record.partition_name, partition_record.count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '
Total records in audit_logs: %
========================================================================', total_records;
END $$;

-- Verify indexes
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'app'
        AND tablename LIKE 'audit_logs_%';
    
    RAISE NOTICE '✓ Indexes created: % indexes across all partitions', index_count;
END $$;

-- Test partition pruning
EXPLAIN (COSTS OFF, FORMAT TEXT) 
SELECT COUNT(*) FROM audit_logs 
WHERE timestamp >= '2026-01-01' AND timestamp < '2026-12-31';

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
========================================================================
Migration V011 Completed Successfully
========================================================================
✓ Created 7 yearly partitions (2024-2030)
✓ Created 1 default partition for out-of-range records
✓ Created 48 indexes (6 per partition × 8 partitions)
✓ Migrated data from audit_logs_old (if existed)
✓ Created partition_metadata tracking table
✓ Updated sequence for id generation

PARTITION BENEFITS:
- Improved query performance with partition pruning
- Simplified 7-year retention management (drop old partitions)
- Efficient cold storage archival (export partition to S3/Azure)
- Reduced index size per partition

NEXT STEPS:
1. Run V012__create_partition_function.sql to add create_audit_partition()
2. Test INSERT: INSERT INTO audit_logs (action, table_name, timestamp) VALUES (''TEST'', ''test'', ''2026-06-15 10:00:00'');
3. Verify partition routing: SELECT * FROM audit_logs_2026 WHERE action = ''TEST'';
4. Test partition pruning: EXPLAIN SELECT * FROM audit_logs WHERE timestamp BETWEEN ''2026-01-01'' AND ''2026-12-31'';
5. After verification, optionally drop audit_logs_old and audit_logs_backup tables

CLEANUP (After Verification):
-- DROP TABLE IF EXISTS audit_logs_old;
-- DROP TABLE IF EXISTS audit_logs_backup;
========================================================================
    ';
END $$;

COMMIT;
