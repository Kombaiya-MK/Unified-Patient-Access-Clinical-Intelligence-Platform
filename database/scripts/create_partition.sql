-- ============================================================================
-- Function: create_audit_partition
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates a new yearly partition for audit_logs table with all
--              required indexes. Used for automatic partition creation by
--              retention cron job or manual partition management.
-- Version: 1.0.0
-- Date: 2026-03-18
-- Usage: SELECT create_audit_partition(2031);
-- ============================================================================

SET search_path TO app, public;

-- ============================================================================
-- Function: create_audit_partition
-- ============================================================================

CREATE OR REPLACE FUNCTION create_audit_partition(year INT)
RETURNS TABLE (
    partition_name TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    partition_table_name TEXT;
    start_date_val TIMESTAMPTZ;
    end_date_val TIMESTAMPTZ;
    partition_exists BOOLEAN;
    metadata_exists BOOLEAN;
BEGIN
    -- Validate year input
    IF year < 2024 OR year > 2100 THEN
        RETURN QUERY SELECT 
            NULL::TEXT,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ,
            'ERROR'::TEXT,
            format('Invalid year: %s. Must be between 2024 and 2100.', year)::TEXT;
        RETURN;
    END IF;
    
    -- Calculate partition name and date bounds
    partition_table_name := 'audit_logs_' || year;
    start_date_val := (year || '-01-01 00:00:00+00')::TIMESTAMPTZ;
    end_date_val := ((year + 1) || '-01-01 00:00:00+00')::TIMESTAMPTZ;
    
    -- Check if partition already exists
    SELECT EXISTS (
        SELECT 1 
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON i.inhparent = p.oid
        WHERE c.relname = partition_table_name
            AND p.relname = 'audit_logs'
            AND p.relnamespace = 'app'::regnamespace
    ) INTO partition_exists;
    
    IF partition_exists THEN
        RETURN QUERY SELECT 
            partition_table_name::TEXT,
            start_date_val,
            end_date_val,
            'INFO'::TEXT,
            format('Partition %s already exists.', partition_table_name)::TEXT;
        RETURN;
    END IF;
    
    -- Create partition
    BEGIN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS app.%I PARTITION OF app.audit_logs FOR VALUES FROM (%L) TO (%L)',
            partition_table_name,
            start_date_val,
            end_date_val
        );
        
        -- Add comment to partition
        EXECUTE format(
            'COMMENT ON TABLE app.%I IS %L',
            partition_table_name,
            format('Audit logs partition for year %s. Range: %s to %s. Created: %s',
                year,
                to_char(start_date_val, 'YYYY-MM-DD'),
                to_char(end_date_val - INTERVAL '1 day', 'YYYY-MM-DD'),
                to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')
            )
        );
        
        -- Create indexes on new partition
        -- Index 1: user_id
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_user_id ON app.%I(user_id)',
            partition_table_name,
            partition_table_name
        );
        
        -- Index 2: action
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_action ON app.%I(action)',
            partition_table_name,
            partition_table_name
        );
        
        -- Index 3: timestamp
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_timestamp ON app.%I(timestamp)',
            partition_table_name,
            partition_table_name
        );
        
        -- Index 4: table_name and record_id composite
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_table_record ON app.%I(table_name, record_id)',
            partition_table_name,
            partition_table_name
        );
        
        -- Index 5: old_values JSONB (GIN index)
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_old_values ON app.%I USING GIN (old_values)',
            partition_table_name,
            partition_table_name
        );
        
        -- Index 6: new_values JSONB (GIN index)
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_new_values ON app.%I USING GIN (new_values)',
            partition_table_name,
            partition_table_name
        );
        
        -- Insert metadata into partition_metadata table
        INSERT INTO partition_metadata (
            partition_name,
            partition_type,
            start_date,
            end_date,
            status,
            notes
        )
        VALUES (
            partition_table_name,
            'yearly',
            start_date_val,
            end_date_val,
            'active',
            format('Automatically created partition for year %s via create_audit_partition() function', year)
        )
        ON CONFLICT (partition_name) DO UPDATE
        SET 
            notes = EXCLUDED.notes || ' | Re-created: ' || to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS');
        
        -- Return success
        RETURN QUERY SELECT 
            partition_table_name::TEXT,
            start_date_val,
            end_date_val,
            'SUCCESS'::TEXT,
            format('Partition %s created successfully with 6 indexes.', partition_table_name)::TEXT;
            
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        RETURN QUERY SELECT 
            partition_table_name::TEXT,
            start_date_val,
            end_date_val,
            'ERROR'::TEXT,
            format('Failed to create partition %s: %s', partition_table_name, SQLERRM)::TEXT;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function metadata
-- ============================================================================

COMMENT ON FUNCTION create_audit_partition(INT) IS 
'Creates a new yearly partition for audit_logs table with all required indexes.
Usage: SELECT create_audit_partition(2031);
Returns: partition_name, start_date, end_date, status, message
Status values: SUCCESS, INFO, ERROR
Indexes created per partition:
  1. idx_<partition>_user_id (B-tree on user_id)
  2. idx_<partition>_action (B-tree on action)
  3. idx_<partition>_timestamp (B-tree on timestamp)
  4. idx_<partition>_table_record (B-tree composite on table_name, record_id)
  5. idx_<partition>_old_values (GIN on old_values JSONB)
  6. idx_<partition>_new_values (GIN on new_values JSONB)
Also inserts metadata into partition_metadata table for tracking.';

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Allow application user to create partitions
GRANT EXECUTE ON FUNCTION create_audit_partition(INT) TO upaci_user;

-- ============================================================================
-- Test examples
-- ============================================================================

-- Example 1: Create partition for 2031
-- SELECT * FROM create_audit_partition(2031);

-- Example 2: Create partition for 2032
-- SELECT * FROM create_audit_partition(2032);

-- Example 3: Try to create existing partition (should return INFO status)
-- SELECT * FROM create_audit_partition(2026);

-- Example 4: Invalid year (should return ERROR status)
-- SELECT * FROM create_audit_partition(2020);

-- ============================================================================
-- Verification queries
-- ============================================================================

-- List all audit_logs partitions
-- SELECT 
--     c.relname AS partition_name,
--     pg_get_expr(c.relpartbound, c.oid, true) AS partition_bound,
--     pg_size_pretty(pg_total_relation_size(c.oid)) AS size
-- FROM pg_class c
-- JOIN pg_inherits i ON c.oid = i.inhrelid
-- JOIN pg_class p ON i.inhparent = p.oid
-- WHERE p.relname = 'audit_logs'
--     AND p.relnamespace = 'app'::regnamespace
-- ORDER BY c.relname;

-- Check indexes on a specific partition
-- SELECT 
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'app'
--     AND tablename = 'audit_logs_2031'
-- ORDER BY indexname;

-- View partition metadata
-- SELECT 
--     partition_name,
--     partition_type,
--     start_date,
--     end_date,
--     status,
--     created_at,
--     notes
-- FROM partition_metadata
-- WHERE partition_name LIKE 'audit_logs_%'
-- ORDER BY start_date;

RAISE NOTICE '✓ Function create_audit_partition() created successfully';
RAISE NOTICE 'Usage: SELECT * FROM create_audit_partition(2031);';
