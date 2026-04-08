-- V032: Add Medical Coding Fields
-- Epic: EP-006 | User Story: US-032 | Task: task_001_db_medical_coding_migration
-- Description: Adds ICD-10/CPT coding support with audit tracking

BEGIN;

-- Create coding status and action enums as check constraints (avoid enum type issues)
-- Medical coding suggestions table
CREATE TABLE IF NOT EXISTS medical_coding_suggestions (
  suggestion_id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES patient_profiles(profile_id) ON DELETE CASCADE,
  code_type VARCHAR(10) NOT NULL CHECK (code_type IN ('ICD-10', 'CPT')),
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  coding_status VARCHAR(20) NOT NULL DEFAULT 'ai_suggested'
    CHECK (coding_status IN ('ai_suggested', 'approved', 'rejected', 'modified', 'manual')),
  suggested_by VARCHAR(20) NOT NULL DEFAULT 'ai'
    CHECK (suggested_by IN ('ai', 'staff', 'system')),
  reviewed_by_staff_id BIGINT REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  original_code VARCHAR(20),
  modification_reason TEXT,
  source_text TEXT,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical coding audit table
CREATE TABLE IF NOT EXISTS medical_coding_audit (
  audit_id BIGSERIAL PRIMARY KEY,
  suggestion_id BIGINT REFERENCES medical_coding_suggestions(suggestion_id) ON DELETE SET NULL,
  appointment_id BIGINT REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  patient_id BIGINT REFERENCES patient_profiles(profile_id) ON DELETE CASCADE,
  action_taken VARCHAR(20) NOT NULL
    CHECK (action_taken IN ('generated', 'approved', 'rejected', 'modified', 'bulk_approved')),
  code_type VARCHAR(10) NOT NULL CHECK (code_type IN ('ICD-10', 'CPT')),
  code VARCHAR(20) NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  staff_id BIGINT REFERENCES users(user_id),
  modification_details JSONB,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add coding fields to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS icd10_codes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cpt_codes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS coding_status VARCHAR(20) DEFAULT 'pending'
    CHECK (coding_status IN ('pending', 'ai_generated', 'partially_reviewed', 'fully_reviewed')),
  ADD COLUMN IF NOT EXISTS coding_reviewed_at TIMESTAMPTZ;

-- Indexes for medical_coding_suggestions
CREATE INDEX IF NOT EXISTS idx_coding_suggestions_appointment
  ON medical_coding_suggestions(appointment_id, coding_status);

CREATE INDEX IF NOT EXISTS idx_coding_suggestions_patient
  ON medical_coding_suggestions(patient_id, code_type);

CREATE INDEX IF NOT EXISTS idx_coding_suggestions_status
  ON medical_coding_suggestions(coding_status)
  WHERE coding_status = 'ai_suggested';

CREATE INDEX IF NOT EXISTS idx_coding_suggestions_code
  ON medical_coding_suggestions(code_type, code);

-- Indexes for medical_coding_audit
CREATE INDEX IF NOT EXISTS idx_coding_audit_appointment
  ON medical_coding_audit(appointment_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_coding_audit_staff
  ON medical_coding_audit(staff_id, performed_at DESC);

COMMIT;
