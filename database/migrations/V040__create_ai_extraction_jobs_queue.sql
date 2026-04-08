-- ============================================================================
-- Migration: V040 - Create AI Extraction Jobs Queue
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates ai_extraction_jobs_queue table for queueing document
--              extraction jobs when the AI circuit breaker is open.
-- Dependencies: V003__create_clinical_tables.sql
-- Task: US_041 TASK_001
-- ============================================================================

BEGIN;

SET search_path TO app, public;

CREATE TABLE IF NOT EXISTS ai_extraction_jobs_queue (
    id              BIGSERIAL       PRIMARY KEY,
    document_id     BIGINT          NOT NULL REFERENCES clinical_documents(id) ON DELETE CASCADE,
    job_type        VARCHAR(50)     NOT NULL CHECK (job_type IN ('ocr_extraction', 'data_extraction', 'classification')),
    status          VARCHAR(20)     NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    retry_count     INTEGER         NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
    scheduled_at    TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at    TIMESTAMPTZ,
    error_details   JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_extraction_jobs_queue IS 'Queue for document extraction jobs when AI circuit breaker is open';

-- Partial index for active jobs (queued or processing)
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status
    ON ai_extraction_jobs_queue(status, scheduled_at)
    WHERE status IN ('queued', 'processing');

-- Index for document lookups
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_document
    ON ai_extraction_jobs_queue(document_id);

COMMIT;
