-- V033: Add Medication Conflict Tracking
-- Epic: EP-006 | User Story: US-033 | Task: task_001_db_conflict_tracking_migration
-- Description: Adds medication conflict detection and override tracking

BEGIN;

-- Medication conflicts table
CREATE TABLE IF NOT EXISTS medication_conflicts (
  conflict_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE,
  conflict_type VARCHAR(30) NOT NULL
    CHECK (conflict_type IN ('Drug-Drug', 'Drug-Allergy', 'Drug-Condition', 'Drug-Condition-Dosage')),
  medications_involved JSONB NOT NULL DEFAULT '[]',
  severity_level INT NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
  interaction_mechanism TEXT NOT NULL,
  clinical_guidance TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  checked_by_staff_id BIGINT REFERENCES users(user_id),
  conflict_status VARCHAR(20) NOT NULL DEFAULT 'Active'
    CHECK (conflict_status IN ('Active', 'Overridden', 'Resolved', 'Acknowledged')),
  override_reason TEXT,
  override_by_staff_id BIGINT REFERENCES users(user_id),
  override_at TIMESTAMPTZ,
  dosage_threshold VARCHAR(50),
  CONSTRAINT require_override_reason CHECK (
    (conflict_status = 'Overridden' AND override_reason IS NOT NULL)
    OR (conflict_status != 'Overridden')
  )
);

-- Conflict check audit table
CREATE TABLE IF NOT EXISTS conflict_check_audit (
  audit_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE,
  medications_checked JSONB NOT NULL DEFAULT '[]',
  allergies_checked JSONB DEFAULT '[]',
  conditions_checked JSONB DEFAULT '[]',
  conflicts_detected_count INT DEFAULT 0 CHECK (conflicts_detected_count >= 0),
  highest_severity INT CHECK (highest_severity IS NULL OR (highest_severity BETWEEN 1 AND 5)),
  no_allergy_warning BOOLEAN DEFAULT FALSE,
  check_performed_at TIMESTAMPTZ DEFAULT NOW(),
  checked_by VARCHAR(20) CHECK (checked_by IN ('System', 'Staff Manual')),
  staff_id BIGINT REFERENCES users(user_id),
  ai_response_raw JSONB
);

-- Add conflict-related fields to patient_profiles
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS has_active_conflicts BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_conflict_check_at TIMESTAMPTZ;

-- Indexes for medication_conflicts
CREATE INDEX IF NOT EXISTS idx_medication_conflicts_patient
  ON medication_conflicts(patient_id, conflict_status, severity_level DESC);

CREATE INDEX IF NOT EXISTS idx_medication_conflicts_active
  ON medication_conflicts(patient_id)
  WHERE conflict_status = 'Active';

CREATE INDEX IF NOT EXISTS idx_medication_conflicts_severity
  ON medication_conflicts(severity_level DESC)
  WHERE conflict_status = 'Active';

-- Indexes for conflict_check_audit
CREATE INDEX IF NOT EXISTS idx_conflict_check_audit_patient
  ON conflict_check_audit(patient_id, check_performed_at DESC);

-- Index for patient_profiles conflict flag
CREATE INDEX IF NOT EXISTS idx_patient_profiles_has_conflicts
  ON patient_profiles(has_active_conflicts)
  WHERE has_active_conflicts = true;

COMMIT;
