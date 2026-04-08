-- ============================================================================
-- Migration: V037__add_noshow_risk_columns.sql
-- Description: Add no-show risk assessment columns to appointments table
-- User Story: US_038 - No-Show Risk Assessment Algorithm
-- Task: TASK_001 - Database Schema for No-Show Risk
-- ============================================================================

-- Add no_show_risk_score column (0-100 integer)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS no_show_risk_score INTEGER DEFAULT NULL
    CHECK (no_show_risk_score >= 0 AND no_show_risk_score <= 100);

COMMENT ON COLUMN appointments.no_show_risk_score IS 'No-show risk score 0-100%, calculated by ML model';

-- Add risk_category column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS risk_category VARCHAR(10) DEFAULT NULL
    CHECK (risk_category IN ('low', 'medium', 'high'));

COMMENT ON COLUMN appointments.risk_category IS 'Risk category: low (<20%), medium (20-50%), high (>50%)';

-- Add risk_calculated_at timestamp
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS risk_calculated_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN appointments.risk_calculated_at IS 'Timestamp when risk was last calculated';

-- Add risk_factors JSONB column for contributing factors breakdown
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN appointments.risk_factors IS 'Contributing risk factors: {"previous_noshows": 25, "weekend_appointment": 10}';

-- ============================================================================
-- Indexes for efficient risk-based queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_risk_category
    ON appointments(risk_category) WHERE risk_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_risk_score
    ON appointments(no_show_risk_score DESC) WHERE no_show_risk_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_risk_calculated
    ON appointments(risk_calculated_at DESC);
