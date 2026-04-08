-- V031: Add Unified Patient Profile Fields
-- Epic: EP-006 | User Story: US-031 | Task: task_004_db_patient_profiles_schema
-- Description: Adds unified profile support with conflict tracking and versioning

BEGIN;

-- Add unified profile fields to patient_profiles
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS unified_profile JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_confidence_score NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS profile_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_document_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_status VARCHAR(20) DEFAULT 'pending'
    CHECK (profile_status IN ('pending', 'partial', 'complete', 'needs_review'));

-- Create profile_conflicts table for field-level conflict tracking
CREATE TABLE IF NOT EXISTS profile_conflicts (
  conflict_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  conflicting_values JSONB NOT NULL DEFAULT '[]',
  resolution_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (resolution_status IN ('Pending', 'Resolved', 'Deferred')),
  resolved_value TEXT,
  resolution_notes TEXT,
  resolved_by_staff_id BIGINT REFERENCES users(user_id),
  resolved_at TIMESTAMPTZ,
  confidence_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile_versions table for audit trail
CREATE TABLE IF NOT EXISTS profile_versions (
  version_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  profile_snapshot JSONB NOT NULL,
  change_type VARCHAR(30) NOT NULL DEFAULT 'extraction'
    CHECK (change_type IN ('extraction', 'merge', 'manual_edit', 'conflict_resolution', 'system_update')),
  changed_by_staff_id BIGINT REFERENCES users(user_id),
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for profile_conflicts
CREATE INDEX IF NOT EXISTS idx_profile_conflicts_patient
  ON profile_conflicts(patient_id, resolution_status);

CREATE INDEX IF NOT EXISTS idx_profile_conflicts_pending
  ON profile_conflicts(patient_id)
  WHERE resolution_status = 'Pending';

CREATE INDEX IF NOT EXISTS idx_profile_conflicts_field
  ON profile_conflicts(patient_id, field_name);

-- Indexes for profile_versions
CREATE INDEX IF NOT EXISTS idx_profile_versions_patient
  ON profile_versions(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_versions_type
  ON profile_versions(patient_id, change_type);

-- Index for unified profile status
CREATE INDEX IF NOT EXISTS idx_patient_profiles_status
  ON patient_profiles(profile_status)
  WHERE profile_status != 'complete';

COMMIT;
