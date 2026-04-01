-- ============================================================================
-- Migration: V025__add_noshow_fields.sql
-- Description: Add no-show tracking fields to appointments and
--              patient_profiles tables for no-show marking, undo,
--              excused handling, and risk score tracking.
-- Task: US_024 TASK_001
-- ============================================================================

-- Add no-show tracking columns to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS no_show_marked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marked_by_staff_id BIGINT,
  ADD COLUMN IF NOT EXISTS no_show_notes TEXT,
  ADD COLUMN IF NOT EXISTS excused_no_show BOOLEAN NOT NULL DEFAULT FALSE;

-- Add FK for marked_by_staff_id
ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_marked_by_staff
  FOREIGN KEY (marked_by_staff_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add no-show count and risk score to patient_profiles
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS no_show_count INTEGER NOT NULL DEFAULT 0
    CHECK (no_show_count >= 0),
  ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0
    CHECK (risk_score >= 0 AND risk_score <= 100);

-- Partial index for undo window queries (no-show within last 2 hours)
CREATE INDEX IF NOT EXISTS idx_appointments_noshow_marked_at
  ON appointments (no_show_marked_at)
  WHERE status = 'no_show' AND no_show_marked_at IS NOT NULL;

-- Partial index for high-risk patient filtering
CREATE INDEX IF NOT EXISTS idx_patient_profiles_risk_score
  ON patient_profiles (risk_score)
  WHERE risk_score > 0;

-- Partial index for no-show history queries
CREATE INDEX IF NOT EXISTS idx_patient_profiles_noshow_count
  ON patient_profiles (no_show_count)
  WHERE no_show_count > 0;

-- Update the status CHECK constraint to include 'arrived' and 'in_progress' if not already present
-- (V023 already extended this, so this is a safety no-op via IF NOT EXISTS on indexes)

-- Column comments
COMMENT ON COLUMN appointments.no_show_marked_at IS 'Timestamp when appointment was marked as no-show; used for 2-hour undo window';
COMMENT ON COLUMN appointments.marked_by_staff_id IS 'Staff user who marked the no-show; FK to users(id)';
COMMENT ON COLUMN appointments.no_show_notes IS 'Optional notes about the no-show reason';
COMMENT ON COLUMN appointments.excused_no_show IS 'If true, no-show is excused and does not increment patient no_show_count or affect risk_score';
COMMENT ON COLUMN patient_profiles.no_show_count IS 'Cumulative count of non-excused no-shows';
COMMENT ON COLUMN patient_profiles.risk_score IS 'Calculated risk score 0-100; increases by 30 per non-excused no-show';
