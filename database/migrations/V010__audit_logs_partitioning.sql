-- ============================================================================
-- Migration: V010 - Convert audit_logs to Partitioned Table
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Converts audit_logs from regular table to partitioned table using
--              RANGE partitioning by year on timestamp column for efficient
--              data management and 7-year HIPAA retention compliance
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: V001 (audit_logs table), V008 (audit_logs permissions)
-- Rollback: See rollback/rollback_V010.sql
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Step 1: Backup existing audit_logs data (in case of rollback)
-- ============================================================================

-- Create temporary backup table to preserve existing audit logs during migration
CREATE TABLE IF NOT EXISTS audit_logs_backup AS 
SELECT * FROM audit_logs;

COMMENT ON TABLE audit_logs_backup IS 'Temporary backup of audit_logs during partitioning migration. Can be dropped after successful migration verification.';

-- Verify backup count matches original
DO $$
DECLARE
    original_count BIGINT;
    backup_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO original_count FROM audit_logs;
    SELECT COUNT(*) INTO backup_count FROM audit_logs_backup;
    
    IF original_count != backup_count THEN
        RAISE EXCEPTION 'Backup verification failed: original=%, backup=%', original_count, backup_count;
    END IF;
    
    RAISE NOTICE 'Backup created successfully: % records', backup_count;
END $$;

-- ============================================================================
-- Step 2: Drop constraints and triggers from original table
-- ============================================================================

-- Drop immutability triggers (will be recreated on partitioned table)
DROP TRIGGER IF EXISTS trigger_prevent_audit_update ON audit_logs;
DROP TRIGGER IF EXISTS trigger_prevent_audit_delete ON audit_logs;

-- Drop indexes (will be recreated on each partition)
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_table_record;
DROP INDEX IF EXISTS idx_audit_logs_old_values;
DROP INDEX IF EXISTS idx_audit_logs_new_values;

RAISE NOTICE 'Dropped existing indexes and triggers';

-- ============================================================================
-- Step 3: Rename original table and create partitioned table
-- ============================================================================

-- Rename original table to temporary name
ALTER TABLE audit_logs RENAME TO audit_logs_old;

-- Create new partitioned table with same structure
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
    PRIMARY KEY (id, timestamp)  -- Composite primary key including partition key
) PARTITION BY RANGE (timestamp);

-- Add table comments
COMMENT ON TABLE audit_logs IS 'Partitioned audit trail for all system operations. Partitioned by year on timestamp column for efficient 7-year retention management. HIPAA-compliant immutable logging.';
COMMENT ON COLUMN audit_logs.id IS 'Unique audit log ID (combined with timestamp for composite key in partitioned table)';
COMMENT ON COLUMN audit_logs.user_id IS 'References users.id - user who performed the action (NULL for system/unauthenticated actions)';
COMMENT ON COLUMN audit_logs.action IS 'Audit action type: LOGIN, LOGOUT, CREATE, READ, UPDATE, DELETE, AUTHORIZATION_FAILED, etc.';
COMMENT ON COLUMN audit_logs.table_name IS 'Affected database table or resource type';
COMMENT ON COLUMN audit_logs.record_id IS 'Primary key of affected record (NULL for collection operations)';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous record values (for UPDATE/DELETE) - PII redacted';
COMMENT ON COLUMN audit_logs.new_values IS 'New record values (for INSERT/UPDATE) - PII redacted';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address for security tracking';
COMMENT ON COLUMN audit_logs.user_agent IS 'Client user agent for device identification';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the action occurred - PARTITION KEY for range partitioning by year';

RAISE NOTICE 'Created partitioned audit_logs table';

-- ============================================================================
-- Step 4: Migrate existing data to partitioned table
-- ============================================================================

-- NOTE: We'll insert data into partitions after they're created in V011 migration
-- This migration just creates the partitioned table structure
-- Data migration will happen in V011__audit_logs_partitions_2024_2030.sql

RAISE NOTICE 'Partitioned table structure created. Data migration will occur in V011 after partitions are created.';

-- ============================================================================
-- Step 5: Recreate sequence for id column
-- ============================================================================

-- Get the maximum id from old table
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM audit_logs_old;
    
    -- Create sequence for partitioned table
    CREATE SEQUENCE IF NOT EXISTS audit_logs_id_seq;
    
    -- Set sequence start value to max_id + 1
    PERFORM setval('audit_logs_id_seq', max_id + 1, false);
    
    -- Alter id column to use the sequence
    ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT nextval('audit_logs_id_seq');
    
    RAISE NOTICE 'Sequence audit_logs_id_seq created and set to start at %', max_id + 1;
END $$;

-- Grant sequence usage to application user
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO upaci_user;

-- ============================================================================
-- Step 6: Recreate immutability triggers
-- ============================================================================

-- Recreate the immutability prevention function and triggers
-- These enforce INSERT-only permissions at trigger level (defense in depth)

-- Function already exists from V008, but let's ensure it's there
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted. This action violates HIPAA compliance requirements (45 CFR 164.312(b)).'
        USING ERRCODE = '42501',  -- insufficient_privilege
              HINT = 'Audit logs must remain unchanged for regulatory compliance. Contact system administrator if you need to query audit history.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION prevent_audit_log_modification() IS 'Trigger function that prevents any UPDATE or DELETE on audit_logs table to enforce immutability for HIPAA compliance';

-- Create triggers on partitioned parent table
-- These will cascade to all partitions automatically
CREATE TRIGGER trigger_prevent_audit_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trigger_prevent_audit_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

COMMENT ON TRIGGER trigger_prevent_audit_update ON audit_logs IS 'HIPAA compliance: Prevents modification of audit log records';
COMMENT ON TRIGGER trigger_prevent_audit_delete ON audit_logs IS 'HIPAA compliance: Prevents deletion of audit log records';

RAISE NOTICE 'Recreated immutability triggers on partitioned table';

-- ============================================================================
-- Step 7: Recreate permissions
-- ============================================================================

-- Revoke UPDATE and DELETE permissions on partitioned table
REVOKE UPDATE ON audit_logs FROM upaci_user;
REVOKE DELETE ON audit_logs FROM upaci_user;

-- Grant INSERT and SELECT permissions
GRANT INSERT ON audit_logs TO upaci_user;
GRANT SELECT ON audit_logs TO upaci_user;

RAISE NOTICE 'Recreated INSERT-only permissions on partitioned table';

-- ============================================================================
-- Step 8: Create checkpoint for rollback
-- ============================================================================

-- Store migration metadata for tracking
CREATE TABLE IF NOT EXISTS partition_migration_log (
    id SERIAL PRIMARY KEY,
    migration_version VARCHAR(50) NOT NULL,
    migration_name VARCHAR(255) NOT NULL,
    original_table_rows BIGINT NOT NULL,
    backup_table_rows BIGINT NOT NULL,
    migration_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    notes TEXT
);

INSERT INTO partition_migration_log (
    migration_version,
    migration_name,
    original_table_rows,
    backup_table_rows,
    notes
)
SELECT 
    'V010',
    'Convert audit_logs to partitioned table',
    (SELECT COUNT(*) FROM audit_logs_old),
    (SELECT COUNT(*) FROM audit_logs_backup),
    'Converted audit_logs to RANGE partitioned table by timestamp (year). Original table backed up as audit_logs_old. Data migration pending in V011.';

RAISE NOTICE 'Migration metadata logged';

-- ============================================================================
-- Verification Queries (for post-migration validation)
-- ============================================================================

-- Check if audit_logs is partitioned
DO $$
DECLARE
    is_partitioned BOOLEAN;
BEGIN
    SELECT 
        c.relkind = 'p'  -- 'p' means partitioned table
    INTO is_partitioned
    FROM pg_class c
    WHERE c.relname = 'audit_logs'
        AND c.relnamespace = 'app'::regnamespace;
    
    IF is_partitioned THEN
        RAISE NOTICE '✓ Verification passed: audit_logs is a partitioned table';
    ELSE
        RAISE EXCEPTION '✗ Verification failed: audit_logs is not partitioned';
    END IF;
END $$;

-- Check if old table still exists
DO $$
DECLARE
    old_table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'app' 
        AND tablename = 'audit_logs_old'
    ) INTO old_table_exists;
    
    IF old_table_exists THEN
        RAISE NOTICE '✓ Backup table audit_logs_old exists for rollback';
    ELSE
        RAISE EXCEPTION '✗ Backup table audit_logs_old missing - rollback not possible';
    END IF;
END $$;

-- Check if backup table exists
DO $$
DECLARE
    backup_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'app' 
        AND tablename = 'audit_logs_backup'
    ) INTO backup_exists;
    
    IF backup_exists THEN
        RAISE NOTICE '✓ Backup table audit_logs_backup exists';
    ELSE
        RAISE EXCEPTION '✗ Backup table audit_logs_backup missing';
    END IF;
END $$;

-- Check if triggers were recreated
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'audit_logs'
        AND c.relnamespace = 'app'::regnamespace
        AND t.tgname IN ('trigger_prevent_audit_update', 'trigger_prevent_audit_delete');
    
    IF trigger_count = 2 THEN
        RAISE NOTICE '✓ Immutability triggers recreated successfully';
    ELSE
        RAISE EXCEPTION '✗ Expected 2 triggers, found %', trigger_count;
    END IF;
END $$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
========================================================================
Migration V010 Completed Successfully
========================================================================
✓ Original audit_logs backed up to audit_logs_old and audit_logs_backup
✓ Partitioned audit_logs table created with RANGE partitioning by timestamp
✓ Immutability triggers recreated
✓ INSERT-only permissions restored
✓ Sequence audit_logs_id_seq configured

NEXT STEPS:
1. Run V011__audit_logs_partitions_2024_2030.sql to create partitions
2. V011 will migrate data from audit_logs_old to partitioned table
3. After verification, drop audit_logs_old and audit_logs_backup

ROLLBACK:
If issues occur, run: rollback/rollback_V010.sql
This will restore audit_logs_old to audit_logs

DATA STATUS:
- audit_logs_old contains: % records
- audit_logs (partitioned) contains: 0 records (partitions not created yet)
- Next migration (V011) will create partitions and migrate data
========================================================================
    ', (SELECT COUNT(*) FROM audit_logs_old);
END $$;

COMMIT;
