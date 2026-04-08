-- ============================================================================
-- Migration: V027__create_conversations_table.sql
-- Description: Create conversations table for temporary AI conversation
--              storage during intake sessions.
-- Task: US_025 TASK_002
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT,
    started_by_user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'completed', 'abandoned', 'switched_to_manual')),
    intake_mode VARCHAR(20) NOT NULL DEFAULT 'ai'
      CHECK (intake_mode IN ('ai', 'manual', 'hybrid')),
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    token_count INTEGER NOT NULL DEFAULT 0,
    summary_generated BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversations_patient
      FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_appointment
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_conversations_started_by
      FOREIGN KEY (started_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_patient_id
  ON conversations (patient_id);

CREATE INDEX IF NOT EXISTS idx_conversations_appointment_id
  ON conversations (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON conversations (status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_conversations_started_at
  ON conversations (started_at DESC);

COMMENT ON TABLE conversations IS 'Temporary AI conversation storage during patient intake sessions';
