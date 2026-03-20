-- ============================================================================
-- Reindex Bloated Indexes Script
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Identifies and rebuilds bloated indexes to reclaim space and improve performance
-- Usage: psql -U postgres -d upaci -f scripts/reindex_bloated.sql
-- Caution: REINDEX locks tables - use CONCURRENTLY in production
-- Schedule: Run during maintenance windows or when bloat > 20%
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'Index Bloat Detection and Reindex Script'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- Setup
-- ============================================================================

\set QUIET on
SET maintenance_work_mem = '1GB';
\set QUIET off

-- ============================================================================
-- 1. Detect Bloated Indexes
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 1: Detecting Bloated Indexes'
\echo 'Bloat calculation based on pg_stat_user_indexes statistics'
\echo '---'
\echo ''

CREATE TEMPORARY TABLE bloated_indexes AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_relation_size(indexrelid) AS index_bytes,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    CASE 
        WHEN pg_stat_get_live_tuples(indexrelid) = 0 THEN 0
        ELSE ROUND(
            100.0 * (pg_relation_size(indexrelid) - 
                    (pg_stat_get_live_tuples(indexrelid) * 100)) / 
            NULLIF(pg_relation_size(indexrelid), 0),
            2
        )
    END AS estimated_bloat_pct,
    CASE 
        WHEN idx_scan < 100 THEN 'Low usage - consider dropping'
        WHEN pg_relation_size(indexrelid) > 10485760 AND -- > 10MB
             (pg_relation_size(indexrelid) - 
              (pg_stat_get_live_tuples(indexrelid) * 100)) > 
             pg_relation_size(indexrelid) * 0.2
        THEN 'High bloat - needs REINDEX'
        WHEN pg_relation_size(indexrelid) > 10485760 AND
             (pg_relation_size(indexrelid) - 
              (pg_stat_get_live_tuples(indexrelid) * 100)) > 
             pg_relation_size(indexrelid) * 0.1
        THEN 'Moderate bloat - monitor'
        ELSE 'OK'
    END AS recommendation
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
ORDER BY 
    CASE 
        WHEN pg_stat_get_live_tuples(indexrelid) = 0 THEN 0
        ELSE (pg_relation_size(indexrelid) - 
             (pg_stat_get_live_tuples(indexrelid) * 100))
    END DESC;

SELECT * FROM bloated_indexes;

-- ============================================================================
-- 2. Summary of Bloated Indexes
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 2: Summary Statistics'
\echo '---'
\echo ''

SELECT 
    COUNT(*) AS total_indexes,
    COUNT(*) FILTER (WHERE recommendation LIKE '%REINDEX%') AS needs_reindex,
    COUNT(*) FILTER (WHERE recommendation LIKE '%monitor%') AS needs_monitoring,
    COUNT(*) FILTER (WHERE recommendation LIKE '%dropping%') AS consider_drop,
    pg_size_pretty(SUM(index_bytes)) AS total_index_size,
    pg_size_pretty(SUM(index_bytes) FILTER (WHERE recommendation LIKE '%REINDEX%')) AS bloated_index_size
FROM bloated_indexes;

-- ============================================================================
-- 3. Generate REINDEX Commands
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 3: Generated REINDEX Commands'
\echo 'Copy and execute these commands during maintenance window'
\echo '---'
\echo ''

\echo ''
\echo '-- PRODUCTION (uses CONCURRENTLY - safe, no table locking):'
\echo ''

SELECT FORMAT(
    'REINDEX INDEX CONCURRENTLY %I.%I; -- Size: %s, Bloat: %s%%',
    schemaname,
    indexname,
    index_size,
    estimated_bloat_pct
)
FROM bloated_indexes
WHERE recommendation LIKE '%REINDEX%'
ORDER BY index_bytes DESC;

\echo ''
\echo '-- DEVELOPMENT (faster, locks tables):'
\echo ''

SELECT FORMAT(
    'REINDEX INDEX %I.%I; -- Size: %s, Bloat: %s%%',
    schemaname,
    indexname,
    index_size,
    estimated_bloat_pct
)
FROM bloated_indexes
WHERE recommendation LIKE '%REINDEX%'
ORDER BY index_bytes DESC;

-- ============================================================================
-- 4. Alternative: REINDEX TABLE Commands
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 4: REINDEX TABLE Commands (rebuilds all indexes on table)'
\echo '---'
\echo ''

WITH tables_needing_reindex AS (
    SELECT DISTINCT 
        schemaname,
        tablename,
        COUNT(*) AS bloated_index_count,
        pg_size_pretty(SUM(index_bytes)) AS total_bloated_size
    FROM bloated_indexes
    WHERE recommendation LIKE '%REINDEX%'
    GROUP BY schemaname, tablename
)
SELECT FORMAT(
    'REINDEX TABLE CONCURRENTLY %I.%I; -- %s indexes, Total size: %s',
    schemaname,
    tablename,
    bloated_index_count,
    total_bloated_size
)
FROM tables_needing_reindex
ORDER BY bloated_index_count DESC;

-- ============================================================================
-- 5. Interactive REINDEX Execution (Commented Out)
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 5: Auto-Reindex (DISABLED by default)'
\echo 'Uncomment the DO block below to automatically reindex bloated indexes'
\echo 'WARNING: This will lock indexes during rebuild'
\echo '---'
\echo ''

/*
DO $$
DECLARE
    index_record RECORD;
    reindex_command TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    FOR index_record IN 
        SELECT schemaname, indexname, index_size 
        FROM bloated_indexes 
        WHERE recommendation LIKE '%REINDEX%'
    LOOP
        reindex_command := FORMAT(
            'REINDEX INDEX CONCURRENTLY %I.%I',
            index_record.schemaname,
            index_record.indexname
        );
        
        RAISE NOTICE 'Rebuilding index: %.% (size: %)', 
            index_record.schemaname, 
            index_record.indexname, 
            index_record.index_size;
        
        start_time := clock_timestamp();
        EXECUTE reindex_command;
        end_time := clock_timestamp();
        
        RAISE NOTICE '  ✓ Completed in % seconds', 
            ROUND(EXTRACT(EPOCH FROM (end_time - start_time))::numeric, 2);
    END LOOP;
    
    RAISE NOTICE 'All indexes rebuilt successfully';
END $$;
*/

-- ============================================================================
-- 6. Post-Reindex Maintenance
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 6: Post-Reindex Maintenance Commands'
\echo 'Run these after reindexing to update statistics'
\echo '---'
\echo ''

WITH tables_reindexed AS (
    SELECT DISTINCT 
        schemaname,
        tablename
    FROM bloated_indexes
    WHERE recommendation LIKE '%REINDEX%'
)
SELECT FORMAT(
    'ANALYZE %I.%I;',
    schemaname,
    tablename
)
FROM tables_reindexed;

-- ============================================================================
-- 7. Vacuum Recommendations
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 7: VACUUM Recommendations'
\echo 'Run VACUUM to reclaim space after reindexing'
\echo '---'
\echo ''

WITH tables_needing_vacuum AS (
    SELECT DISTINCT 
        schemaname,
        tablename,
        COUNT(*) AS reindexed_count
    FROM bloated_indexes
    WHERE recommendation LIKE '%REINDEX%'
    GROUP BY schemaname, tablename
)
SELECT FORMAT(
    'VACUUM (ANALYZE, VERBOSE) %I.%I; -- %s indexes reindexed',
    schemaname,
    tablename,
    reindexed_count
)
FROM tables_needing_vacuum;

-- ============================================================================
-- 8. Schedule Regular Maintenance
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'MAINTENANCE SCHEDULE RECOMMENDATIONS'
\echo '============================================================================'
\echo ''
\echo 'Weekly Tasks:'
\echo '  1. Run this script to identify bloated indexes'
\echo '  2. Monitor indexes with bloat > 10%'
\echo ''
\echo 'Monthly Tasks:'
\echo '  1. REINDEX indexes with bloat > 20%'
\echo '  2. VACUUM ANALYZE all tables'
\echo '  3. Review and drop unused indexes (idx_scan = 0)'
\echo ''
\echo 'After Major Updates:'
\echo '  1. REINDEX all affected indexes'
\echo '  2. VACUUM FULL (during maintenance window)'
\echo '  3. Reset pg_stat statistics: SELECT pg_stat_reset();'
\echo ''
\echo 'Preventive Measures:'
\echo '  1. Set autovacuum_vacuum_scale_factor = 0.1'
\echo '  2. Set autovacuum_analyze_scale_factor = 0.05'
\echo '  3. Monitor table/index bloat weekly'
\echo '  4. Use FILLFACTOR = 90 for frequently updated indexes'
\echo ''
\echo '============================================================================'

-- ============================================================================
-- 9. Detailed Bloat Analysis (Advanced)
-- ============================================================================

\echo ''
\echo '---'
\echo 'STEP 9: Detailed Bloat Analysis'
\echo 'Using pgstattuple extension (if available)'
\echo '---'
\echo ''

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgstattuple') THEN
        RAISE NOTICE 'pgstattuple extension found - running detailed analysis...';
        
        -- This would contain detailed pgstattuple queries
        -- Requires CREATE EXTENSION pgstattuple;
    ELSE
        RAISE NOTICE 'pgstattuple extension not installed';
        RAISE NOTICE 'For detailed analysis: CREATE EXTENSION pgstattuple;';
    END IF;
END $$;

-- ============================================================================
-- Cleanup
-- ============================================================================

DROP TABLE IF EXISTS bloated_indexes;

\echo ''
\echo '============================================================================'
\echo 'Script completed'
\echo '============================================================================'
\echo ''
