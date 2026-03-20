-- ============================================================================
-- Index Usage Analysis Script
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Analyzes index usage statistics to identify unused or underutilized indexes
-- Usage: psql -U postgres -d upaci -f scripts/analyze_index_usage.sql
-- Run periodically: Weekly in production, daily during development
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'Index Usage Analysis Report'
\echo '============================================================================'
\echo ''

-- Set display format
\pset border 2
\pset format wrapped

-- ============================================================================
-- 1. Unused Indexes (idx_scan = 0)
-- ============================================================================

\echo ''
\echo '1. UNUSED INDEXES (never scanned since last stats reset)'
\echo '   Recommendation: Consider dropping if unused after 7+ days'
\echo '---'

SELECT 
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_stat_get_blocks_fetched(indexrelid) - pg_stat_get_blocks_hit(indexrelid) AS disk_reads
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 2. Underutilized Indexes (low scan count vs size)
-- ============================================================================

\echo ''
\echo '2. UNDERUTILIZED INDEXES (scanned < 100 times)'
\echo '   Recommendation: Monitor and consider dropping if usage remains low'
\echo '---'

SELECT 
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    idx_scan AS scan_count,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'Never used'
        WHEN idx_scan < 10 THEN 'Very low usage'
        WHEN idx_scan < 100 THEN 'Low usage'
        ELSE 'Normal'
    END AS usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
  AND idx_scan < 100
  AND idx_scan > 0
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 3. Index Size Overview
-- ============================================================================

\echo ''
\echo '3. INDEX SIZE SUMMARY (ordered by size)'
\echo '   Total index size vs table size comparison'
\echo '---'

SELECT 
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    idx_scan AS scans,
    ROUND(
        100.0 * pg_relation_size(indexrelid) / 
        NULLIF(pg_relation_size(schemaname||'.'||tablename), 0), 
        2
    ) AS index_to_table_ratio_pct
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 4. Most Used Indexes
-- ============================================================================

\echo ''
\echo '4. MOST USED INDEXES (top 20 by scan count)'
\echo '   These indexes are critical for query performance'
\echo '---'

SELECT 
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    idx_scan AS scan_count,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
ORDER BY idx_scan DESC
LIMIT 20;

-- ============================================================================
-- 5. Index Cache Hit Ratio
-- ============================================================================

\echo ''
\echo '5. INDEX CACHE HIT RATIO'
\echo '   Target: > 99% (indicates indexes are in memory)'
\echo '---'

SELECT 
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    idx_scan AS scans,
    CASE 
        WHEN pg_stat_get_blocks_fetched(indexrelid) = 0 THEN 100.0
        ELSE ROUND(
            100.0 * pg_stat_get_blocks_hit(indexrelid) / 
            NULLIF(pg_stat_get_blocks_fetched(indexrelid), 0), 
            2
        )
    END AS cache_hit_ratio_pct,
    pg_stat_get_blocks_hit(indexrelid) AS blocks_hit,
    pg_stat_get_blocks_fetched(indexrelid) - pg_stat_get_blocks_hit(indexrelid) AS blocks_read_from_disk
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
  AND idx_scan > 0
ORDER BY cache_hit_ratio_pct ASC, idx_scan DESC;

-- ============================================================================
-- 6. Duplicate Indexes (potential waste)
-- ============================================================================

\echo ''
\echo '6. POTENTIAL DUPLICATE INDEXES'
\echo '   Indexes on the same column(s) - consider consolidating'
\echo '---'

SELECT 
    a.schemaname AS schema,
    a.tablename AS table,
    a.indexname AS index1,
    b.indexname AS index2,
    pg_get_indexdef(a.indexrelid) AS index1_definition,
    pg_get_indexdef(b.indexrelid) AS index2_definition,
    pg_size_pretty(pg_relation_size(a.indexrelid)) AS index1_size,
    pg_size_pretty(pg_relation_size(b.indexrelid)) AS index2_size
FROM pg_stat_user_indexes a
JOIN pg_stat_user_indexes b 
    ON a.schemaname = b.schemaname 
    AND a.tablename = b.tablename 
    AND a.indexname < b.indexname
WHERE a.schemaname = 'app'
  AND pg_get_indexdef(a.indexrelid) = pg_get_indexdef(b.indexrelid);

-- ============================================================================
-- 7. Index Bloat Estimation
-- ============================================================================

\echo ''
\echo '7. INDEX BLOAT ESTIMATION'
\echo '   Bloat > 20% indicates need for REINDEX'
\echo '---'

SELECT 
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    CASE 
        WHEN pg_stat_get_tuples_inserted(indexrelid) + 
             pg_stat_get_tuples_updated(indexrelid) + 
             pg_stat_get_tuples_deleted(indexrelid) = 0 THEN 0
        ELSE ROUND(
            100.0 * pg_stat_get_tuples_deleted(indexrelid) / 
            NULLIF(
                pg_stat_get_tuples_inserted(indexrelid) + 
                pg_stat_get_tuples_updated(indexrelid) + 
                pg_stat_get_tuples_deleted(indexrelid), 
                0
            ), 
            2
        )
    END AS estimated_bloat_pct,
    CASE 
        WHEN pg_stat_get_tuples_deleted(indexrelid) > 
             (pg_stat_get_tuples_inserted(indexrelid) + pg_stat_get_tuples_updated(indexrelid)) * 0.2
        THEN 'Consider REINDEX'
        ELSE 'OK'
    END AS recommendation
FROM pg_stat_user_indexes
WHERE schemaname = 'app'
ORDER BY estimated_bloat_pct DESC;

-- ============================================================================
-- 8. Summary Statistics
-- ============================================================================

\echo ''
\echo '8. SUMMARY STATISTICS'
\echo '---'

SELECT 
    COUNT(*) AS total_indexes,
    COUNT(*) FILTER (WHERE idx_scan = 0) AS unused_indexes,
    COUNT(*) FILTER (WHERE idx_scan < 100 AND idx_scan > 0) AS underutilized_indexes,
    COUNT(*) FILTER (WHERE idx_scan >= 100) AS well_used_indexes,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) AS total_index_size,
    pg_size_pretty(SUM(pg_relation_size(indexrelid)) FILTER (WHERE idx_scan = 0)) AS unused_index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'app';

-- ============================================================================
-- Notes and Recommendations
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'MAINTENANCE RECOMMENDATIONS'
\echo '============================================================================'
\echo ''
\echo '1. Unused indexes (idx_scan = 0):'
\echo '   - Monitor for 7-14 days before dropping'
\echo '   - Consider if index is used by specific rare queries'
\echo '   - Drop with: DROP INDEX CONCURRENTLY index_name;'
\echo ''
\echo '2. Underutilized indexes (idx_scan < 100):'
\echo '   - Review query patterns to understand low usage'
\echo '   - Consider partial indexes for specific use cases'
\echo '   - May be needed for rare but critical queries'
\echo ''
\echo '3. Index bloat > 20%:'
\echo '   - Rebuild with: REINDEX INDEX CONCURRENTLY index_name;'
\echo '   - Schedule during maintenance window'
\echo '   - Run VACUUM ANALYZE after reindex'
\echo ''
\echo '4. Cache hit ratio < 99%:'
\echo '   - Increase shared_buffers in postgresql.conf'
\echo '   - Consider adding more RAM'
\echo '   - Review if index is too large for available memory'
\echo ''
\echo '5. Reset statistics to track new usage patterns:'
\echo '   - SELECT pg_stat_reset();'
\echo '   - Do this after significant schema or query changes'
\echo ''
\echo 'Last stats reset: '
SELECT stats_reset FROM pg_stat_database WHERE datname = current_database();
\echo ''
\echo '============================================================================'
