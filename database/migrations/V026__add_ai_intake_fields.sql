-- ============================================================================
-- Migration: V026__add_ai_intake_fields.sql
-- Description: Add AI intake fields to clinical_documents table for
--              conversation history, intake mode, and AI validation score.
-- Task: US_025 TASK_002
-- ============================================================================

-- Add AI intake columns to clinical_documents
ALTER TABLE clinical_documents
  ADD COLUMN IF NOT EXISTS conversation_history JSONB,
  ADD COLUMN IF NOT EXISTS intake_mode VARCHAR(20) DEFAULT 'manual'
    CHECK (intake_mode IN ('ai', 'manual', 'hybrid')),
  ADD COLUMN IF NOT EXISTS ai_validation_score NUMERIC(5, 2)
    CHECK (ai_validation_score IS NULL OR (ai_validation_score >= 0 AND ai_validation_score <= 100));

-- Index for filtering by intake mode
CREATE INDEX IF NOT EXISTS idx_clinical_documents_intake_mode
  ON clinical_documents (intake_mode);

-- Index for AI validation score queries
CREATE INDEX IF NOT EXISTS idx_clinical_documents_ai_validation_score
  ON clinical_documents (ai_validation_score)
  WHERE ai_validation_score IS NOT NULL;

COMMENT ON COLUMN clinical_documents.conversation_history IS 'JSONB array of AI conversation messages for intake';
COMMENT ON COLUMN clinical_documents.intake_mode IS 'Mode of intake: ai, manual, or hybrid';
COMMENT ON COLUMN clinical_documents.ai_validation_score IS 'AI validation confidence score (0-100)';
