-- ============================================================================
-- Migration: V038__create_metrics_tables.sql
-- Description: Create tables for admin dashboard metrics and system alerts
-- User Story: US_039 - Admin Dashboard with System Metrics
-- Task: TASK_001 - Backend Admin Metrics API
-- ============================================================================

-- ============================================================================
-- Table: metrics_daily_aggregates
-- Stores daily metric summaries for reporting
-- ============================================================================
CREATE TABLE metrics_daily_aggregates (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_appointments INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    no_show_rate DECIMAL(5,2) DEFAULT 0,
    avg_wait_time_minutes DECIMAL(8,2) DEFAULT 0,
    avg_lead_time_days DECIMAL(8,2) DEFAULT 0,
    insurance_verification_success_rate DECIMAL(5,2) DEFAULT 0,
    patient_satisfaction_score DECIMAL(3,1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE metrics_daily_aggregates IS 'Daily aggregated operational metrics for admin dashboard';

-- ============================================================================
-- Table: metrics_system_health_snapshots
-- Stores periodic system health snapshots
-- ============================================================================
CREATE TABLE metrics_system_health_snapshots (
    id BIGSERIAL PRIMARY KEY,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    api_avg_response_ms INTEGER DEFAULT 0,
    ai_service_success_rate DECIMAL(5,2) DEFAULT 0,
    db_active_connections INTEGER DEFAULT 0,
    db_max_connections INTEGER DEFAULT 0,
    redis_cache_hit_rate DECIMAL(5,2) DEFAULT 0
);

COMMENT ON TABLE metrics_system_health_snapshots IS 'System health snapshots taken periodically for monitoring';

-- ============================================================================
-- Table: metrics_alerts
-- Stores system alerts for admin notification
-- ============================================================================
CREATE TABLE metrics_alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    resolved_by BIGINT REFERENCES users(id)
);

COMMENT ON TABLE metrics_alerts IS 'System alerts for admin dashboard: redis_down, ai_quota_exceeded, db_slow_queries, api_slow';

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_metrics_daily_date ON metrics_daily_aggregates(date DESC);
CREATE INDEX idx_metrics_health_timestamp ON metrics_system_health_snapshots(recorded_at DESC);
CREATE INDEX idx_metrics_alerts_unresolved ON metrics_alerts(created_at DESC)
    WHERE resolved_at IS NULL;
CREATE INDEX idx_metrics_alerts_type ON metrics_alerts(alert_type);
