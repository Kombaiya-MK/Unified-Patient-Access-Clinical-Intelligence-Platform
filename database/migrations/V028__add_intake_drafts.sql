-- ============================================================================
-- Migration: V028__add_intake_drafts.sql
-- Description: Add intake draft fields to clinical_documents for
--              manual intake auto-save functionality.
-- Task: US_026 TASK_001
-- ============================================================================

-- Add draft tracking columns to clinical_documents
ALTER TABLE clinical_documents
  ADD COLUMN IF NOT EXISTS draft_status VARCHAR(20) DEFAULT 'draft'
    CHECK (draft_status IN ('draft', 'in_progress', 'submitted', 'finalized')),
  ADD COLUMN IF NOT EXISTS draft_data JSONB,
  ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMPTZ;

-- Index for finding active drafts by patient and appointment
CREATE INDEX IF NOT EXISTS idx_clinical_documents_draft_status
  ON clinical_documents (draft_status)
  WHERE draft_status IN ('draft', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_clinical_documents_last_saved_at
  ON clinical_documents (last_saved_at DESC)
  WHERE last_saved_at IS NOT NULL;

COMMENT ON COLUMN clinical_documents.draft_status IS 'Status of intake draft: draft, in_progress, submitted, finalized';
COMMENT ON COLUMN clinical_documents.draft_data IS 'JSONB object containing auto-saved form section data';
COMMENT ON COLUMN clinical_documents.last_saved_at IS 'Timestamp of last auto-save for draft';
