-- ============================================================================
-- Migration: V029 - Add Document Extraction Fields
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Adds extraction tracking to clinical_documents, extracted_data
--              to patient_profiles, and creates extraction_logs audit table.
-- Dependencies: V003__create_clinical_tables.sql
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- ============================================================================
-- Add extraction tracking columns to clinical_documents
-- ============================================================================

ALTER TABLE clinical_documents
    ADD COLUMN IF NOT EXISTS extraction_status VARCHAR(30)
        DEFAULT 'Uploaded'
        CHECK (extraction_status IN ('Uploaded', 'Processing', 'Processed', 'Needs Review', 'Extraction Failed')),
    ADD COLUMN IF NOT EXISTS extraction_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(5,2)
        CHECK (extraction_confidence BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS extraction_error TEXT,
    ADD COLUMN IF NOT EXISTS needs_manual_review BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS original_filename VARCHAR(500),
    ADD COLUMN IF NOT EXISTS file_hash VARCHAR(128),
    ADD COLUMN IF NOT EXISTS uploaded_by_user_id BIGINT;

-- ============================================================================
-- Add extracted_data and source_document_id to patient_profiles
-- ============================================================================

ALTER TABLE patient_profiles
    ADD COLUMN IF NOT EXISTS extracted_data JSONB,
    ADD COLUMN IF NOT EXISTS source_document_id BIGINT;

COMMENT ON COLUMN patient_profiles.extracted_data IS 'AI-extracted structured medical data: {patient_name, date_of_birth, document_date, diagnosed_conditions[], prescribed_medications[{name,dosage,frequency}], lab_test_results[{test_name,value,unit,reference_range}], allergies[], provider_name, facility_name}';

-- ============================================================================
-- Create extraction_logs audit table
-- ============================================================================

CREATE TABLE IF NOT EXISTS extraction_logs (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    extraction_attempt INT NOT NULL CHECK (extraction_attempt > 0),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL
        CHECK (status IN ('Uploaded', 'Processing', 'Processed', 'Needs Review', 'Extraction Failed', 'Manually Reviewed')),
    confidence_scores JSONB,
    error_message TEXT,
    processing_duration_ms INT CHECK (processing_duration_ms >= 0),
    api_response_raw JSONB,
    reviewed_by_staff_id BIGINT,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE extraction_logs IS 'Audit trail of all document extraction attempts and manual reviews';

-- ============================================================================
-- Create indexes for query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_extraction_status
    ON clinical_documents (extraction_status);

CREATE INDEX IF NOT EXISTS idx_documents_needs_review
    ON clinical_documents (needs_manual_review)
    WHERE needs_manual_review = true;

CREATE INDEX IF NOT EXISTS idx_documents_file_hash
    ON clinical_documents (file_hash)
    WHERE file_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_extraction_logs_document
    ON extraction_logs (document_id, attempted_at DESC);

COMMIT;
