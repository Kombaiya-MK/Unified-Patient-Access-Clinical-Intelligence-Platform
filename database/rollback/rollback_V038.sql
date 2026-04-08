-- ============================================================================
-- Rollback: rollback_V038.sql
-- Description: Reverses V038__create_metrics_tables.sql
-- ============================================================================

DROP INDEX IF EXISTS idx_metrics_alerts_type;
DROP INDEX IF EXISTS idx_metrics_alerts_unresolved;
DROP INDEX IF EXISTS idx_metrics_health_timestamp;
DROP INDEX IF EXISTS idx_metrics_daily_date;

DROP TABLE IF EXISTS metrics_alerts;
DROP TABLE IF EXISTS metrics_system_health_snapshots;
DROP TABLE IF EXISTS metrics_daily_aggregates;

SELECT 'V038 rollback complete: metrics tables removed' AS status;
