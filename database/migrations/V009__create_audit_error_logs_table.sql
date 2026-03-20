-- ============================================================================
-- Migration: V009__create_audit_error_logs_table
-- Description: Create fallback table for audit logging failures
-- Task: US_011 TASK_001 - Immutable Audit Logging Service
-- Date: 2026-03-18
-- 
-- Purpose:
-- - Create audit_error_logs table for fallback logging
-- - When audit_logs INSERT fails, log to this table instead
-- - Capture error details, attempted entry, and stack trace
-- - Prevent complete audit logging failure
-- - Support investigation and recovery
-- 
-- Features:
-- - Simple schema with minimal constraints
-- - JSONB for flexible attempted_entry storage
-- - TEXT fields for error messages and stack traces
-- - Automatic timestamp
-- - Indexes for quick querying
-- ============================================================================

-- Start transaction
BEGIN;

-- ============================================================================
-- Part 1: Create audit_error_logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_error_logs (
    id BIGSERIAL PRIMARY KEY,
    error_message TEXT NOT NULL,
    attempted_entry JSONB,
    stack_trace TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Optional: Severity level for triaging
    severity VARCHAR(20) DEFAULT 'ERROR',
    
    -- Optional: Resolution tracking
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by INTEGER, -- User ID of person who resolved
    resolution_notes TEXT
);

-- Log table creation
DO $$
BEGIN
    RAISE NOTICE 'Created audit_error_logs table';
END $$;

-- ============================================================================
-- Part 2: Add Indexes
-- ============================================================================

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_error_logs_created_at 
    ON audit_error_logs (created_at DESC);

-- Index on resolved status for filtering unresolved issues
CREATE INDEX IF NOT EXISTS idx_audit_error_logs_resolved 
    ON audit_error_logs (resolved);

-- Index on severity for prioritization
CREATE INDEX IF NOT EXISTS idx_audit_error_logs_severity 
    ON audit_error_logs (severity);

-- GIN index on attempted_entry JSONB for searching
CREATE INDEX IF NOT EXISTS idx_audit_error_logs_attempted_entry 
    ON audit_error_logs USING gin (attempted_entry);

-- Log index creation
DO $$
BEGIN
    RAISE NOTICE 'Created indexes on audit_error_logs table';
END $$;

-- ============================================================================
-- Part 3: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE audit_error_logs IS 'Fallback table for audit logging failures. When INSERT to audit_logs fails, the error is logged here for investigation and recovery.';

COMMENT ON COLUMN audit_error_logs.error_message IS 'Error message from failed audit log INSERT';
COMMENT ON COLUMN audit_error_logs.attempted_entry IS 'The audit entry that failed to insert (JSONB for flexibility)';
COMMENT ON COLUMN audit_error_logs.stack_trace IS 'Stack trace of the error for debugging';
COMMENT ON COLUMN audit_error_logs.severity IS 'Error severity: ERROR, WARNING, CRITICAL';
COMMENT ON COLUMN audit_error_logs.resolved IS 'Whether the error has been investigated and resolved';
COMMENT ON COLUMN audit_error_logs.resolved_at IS 'Timestamp when error was marked resolved';
COMMENT ON COLUMN audit_error_logs.resolved_by IS 'User ID who resolved the error';
COMMENT ON COLUMN audit_error_logs.resolution_notes IS 'Notes about error resolution';

-- ============================================================================
-- Part 4: Grant Permissions
-- ============================================================================

-- Grant INSERT permission (for logging errors)
GRANT INSERT ON audit_error_logs TO upaci_user;

-- Grant SELECT permission (for querying errors)
GRANT SELECT ON audit_error_logs TO upaci_user;

-- Grant UPDATE permission (for marking resolved)
GRANT UPDATE ON audit_error_logs TO upaci_user;

-- Grant USAGE on sequence
GRANT USAGE, SELECT ON SEQUENCE audit_error_logs_id_seq TO upaci_user;

-- Log permission grants
DO $$
BEGIN
    RAISE NOTICE 'Granted INSERT, SELECT, UPDATE permissions on audit_error_logs';
    RAISE NOTICE 'Granted USAGE on audit_error_logs_id_seq';
END $$;

-- ============================================================================
-- Part 5: Create View for Unresolved Errors
-- ============================================================================

CREATE OR REPLACE VIEW unresolved_audit_errors AS
SELECT 
    id,
    error_message,
    attempted_entry,
    severity,
    created_at,
    -- Extract some key fields from attempted_entry for convenience
    attempted_entry->>'action' AS attempted_action,
    attempted_entry->>'table_name' AS attempted_table,
    attempted_entry->>'user_id' AS attempted_user_id
FROM audit_error_logs
WHERE resolved = FALSE
ORDER BY created_at DESC;

COMMENT ON VIEW unresolved_audit_errors IS 'View of unresolved audit logging errors for quick monitoring';

GRANT SELECT ON unresolved_audit_errors TO upaci_user;

DO $$
BEGIN
    RAISE NOTICE 'Created view: unresolved_audit_errors';
END $$;

-- ============================================================================
-- Part 6: Create Helper Function to Mark Errors Resolved
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_audit_error_resolved(
    error_id BIGINT,
    resolver_user_id INTEGER,
    notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE audit_error_logs
    SET 
        resolved = TRUE,
        resolved_at = NOW(),
        resolved_by = resolver_user_id,
        resolution_notes = notes
    WHERE id = error_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit error log ID % not found', error_id;
    END IF;
    
    RAISE NOTICE 'Marked audit error % as resolved by user %', error_id, resolver_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_audit_error_resolved IS 'Helper function to mark an audit error as resolved';

DO $$
BEGIN
    RAISE NOTICE 'Created function: mark_audit_error_resolved';
END $$;

-- ============================================================================
-- Part 7: Add Sample Data (Optional - for testing only)
-- ============================================================================

-- Uncomment to insert sample error for testing
-- INSERT INTO audit_error_logs (
--     error_message,
--     attempted_entry,
--     stack_trace,
--     severity
-- ) VALUES (
--     'Connection timeout to database',
--     '{"user_id": 1, "action": "CREATE", "table_name": "patients", "record_id": "123"}',
--     'Error: Connection timeout
-- at Database.query (/app/src/utils/database.ts:45)
-- at logAuditEntry (/app/src/utils/auditLogger.ts:123)',
--     'ERROR'
-- );

-- ============================================================================
-- Part 8: Add Metadata
-- ============================================================================

-- Add migration tracking (if migrations table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
        INSERT INTO schema_migrations (version, description, applied_at)
        VALUES (
            'V009',
            'Create audit_error_logs fallback table',
            NOW()
        );
        RAISE NOTICE 'Recorded migration in schema_migrations table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'schema_migrations table not found, skipping tracking';
END $$;

-- Commit transaction
COMMIT;

-- ============================================================================
-- Verification Queries (Run manually to confirm)
-- ============================================================================

-- Check table exists
-- Run: \d audit_error_logs
-- Expected: Table structure with columns

-- Check indexes
-- Run: \di idx_audit_error_logs*
-- Expected: 4 indexes

-- Check view
-- Run: SELECT * FROM unresolved_audit_errors LIMIT 5;
-- Expected: Empty or sample data if inserted

-- Test INSERT
-- Run:
-- INSERT INTO audit_error_logs (error_message, attempted_entry, stack_trace)
-- VALUES ('Test error', '{"test": true}'::jsonb, 'Test stack trace');
-- Expected: Success

-- Test mark_audit_error_resolved function
-- Run: SELECT mark_audit_error_resolved(1, 1, 'Resolved during testing');
-- Expected: Success

-- ============================================================================
-- Maintenance Queries
-- ============================================================================

-- Count unresolved errors
-- SELECT COUNT(*) FROM audit_error_logs WHERE resolved = FALSE;

-- Recent errors (last 24 hours)
-- SELECT * FROM audit_error_logs 
-- WHERE created_at > NOW() - INTERVAL '24 hours'
-- ORDER BY created_at DESC;

-- Errors by severity
-- SELECT severity, COUNT(*) as count
-- FROM audit_error_logs
-- GROUP BY severity
-- ORDER BY count DESC;

-- Most common error messages
-- SELECT error_message, COUNT(*) as count
-- FROM audit_error_logs
-- GROUP BY error_message
-- ORDER BY count DESC
-- LIMIT 10;

-- ============================================================================
-- End of Migration
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE 'Migration V009 completed successfully';
    RAISE NOTICE 'audit_error_logs table created for fallback logging';
    RAISE NOTICE 'View: unresolved_audit_errors available for monitoring';
    RAISE NOTICE 'Function: mark_audit_error_resolved() available';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
