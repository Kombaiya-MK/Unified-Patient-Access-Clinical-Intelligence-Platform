-- ============================================================================
-- Migration: V008__audit_logs_permissions
-- Description: Enforce INSERT-only permissions on audit_logs table for immutability
-- Task: US_011 TASK_001 - Immutable Audit Logging Service
-- Date: 2026-03-18
-- 
-- Purpose:
-- - Make audit_logs table immutable (prevent UPDATE/DELETE)
-- - Grant only INSERT and SELECT permissions to application user
-- - Ensure HIPAA compliance with immutable audit trail
-- - Support 7-year retention requirement
-- 
-- Security:
-- - REVOKE UPDATE and DELETE privileges
-- - GRANT INSERT and SELECT only
-- - Protect audit log integrity
-- ============================================================================

-- Start transaction
BEGIN;

-- ============================================================================
-- Part 1: Revoke Dangerous Permissions
-- ============================================================================

-- Revoke UPDATE permission on audit_logs
-- This prevents modification of existing audit records
REVOKE UPDATE ON audit_logs FROM PUBLIC;
REVOKE UPDATE ON audit_logs FROM upaci_user;

-- Revoke DELETE permission on audit_logs
-- This prevents deletion of audit records
REVOKE DELETE ON audit_logs FROM PUBLIC;
REVOKE DELETE ON audit_logs FROM upaci_user;

-- Log permission changes
DO $$
BEGIN
    RAISE NOTICE 'Revoked UPDATE and DELETE permissions on audit_logs';
END $$;

-- ============================================================================
-- Part 2: Grant Required Permissions
-- ============================================================================

-- Grant INSERT permission (for creating new audit entries)
GRANT INSERT ON audit_logs TO upaci_user;

-- Grant SELECT permission (for querying audit logs)
GRANT SELECT ON audit_logs TO upaci_user;

-- Grant USAGE on sequence (for auto-incrementing IDs)
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO upaci_user;

-- Log granted permissions
DO $$
BEGIN
    RAISE NOTICE 'Granted INSERT and SELECT permissions on audit_logs';
    RAISE NOTICE 'Granted USAGE on audit_logs_id_seq';
END $$;

-- ============================================================================
-- Part 3: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all system operations. INSERT-only permissions enforce HIPAA compliance. Retention: 7 years. Do NOT modify or delete records.';

-- ============================================================================
-- Part 4: Create Function to Prevent Direct Updates (Extra Protection)
-- ============================================================================

-- Create trigger function to block any UPDATE/DELETE attempts
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted. Operation: % on audit_logs is not allowed.', TG_OP
        USING HINT = 'Audit logs must remain unchanged for compliance. Contact system administrator if correction is needed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to block UPDATE operations
DROP TRIGGER IF EXISTS trigger_prevent_audit_update ON audit_logs;
CREATE TRIGGER trigger_prevent_audit_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- Add trigger to block DELETE operations
DROP TRIGGER IF EXISTS trigger_prevent_audit_delete ON audit_logs;
CREATE TRIGGER trigger_prevent_audit_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- Log trigger creation
DO $$
BEGIN
    RAISE NOTICE 'Created triggers to prevent audit log modification';
    RAISE NOTICE 'Triggers: trigger_prevent_audit_update, trigger_prevent_audit_delete';
END $$;

-- ============================================================================
-- Part 5: Verify Permissions
-- ============================================================================

-- Query to verify permissions (for documentation)
DO $$
DECLARE
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO perm_count
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND grantee = 'upaci_user'
      AND privilege_type IN ('UPDATE', 'DELETE');
    
    IF perm_count > 0 THEN
        RAISE EXCEPTION 'ERROR: upaci_user still has UPDATE or DELETE permissions on audit_logs';
    END IF;
    
    RAISE NOTICE 'Verified: upaci_user does NOT have UPDATE or DELETE permissions';
END $$;

-- ============================================================================
-- Part 6: Add Metadata
-- ============================================================================

-- Add migration tracking (if migrations table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
        INSERT INTO schema_migrations (version, description, applied_at)
        VALUES (
            'V008',
            'Enforce INSERT-only permissions on audit_logs table',
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

-- Check permissions granted to upaci_user
-- Run: 
-- SELECT grantee, privilege_type 
-- FROM information_schema.table_privileges 
-- WHERE table_schema='public' AND table_name='audit_logs' AND grantee='upaci_user';
-- Expected: INSERT, SELECT only

-- Test UPDATE attempt (should fail)
-- Run: UPDATE audit_logs SET action = 'MODIFIED' WHERE id = 1;
-- Expected: ERROR: Audit logs are immutable

-- Test DELETE attempt (should fail)
-- Run: DELETE FROM audit_logs WHERE id = 1;
-- Expected: ERROR: Audit logs are immutable

-- Test INSERT (should succeed)
-- Run: 
-- INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, user_agent)
-- VALUES (1, 'TEST', 'test_table', '1', '127.0.0.1', 'test');
-- Expected: Success

-- ============================================================================
-- End of Migration
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE 'Migration V008 completed successfully';
    RAISE NOTICE 'audit_logs table is now immutable (INSERT-only)';
    RAISE NOTICE 'HIPAA compliance: Audit trail cannot be modified';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
