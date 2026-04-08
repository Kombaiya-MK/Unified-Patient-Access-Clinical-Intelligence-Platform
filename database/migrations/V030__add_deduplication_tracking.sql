-- ============================================================================
-- Migration: V030 - Add Deduplication and Merge Tracking
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Adds merge tracking fields to patient_profiles, creates
--              data_merge_logs, field_conflicts, and medication_timeline tables.
-- Dependencies: V029__add_extraction_fields.sql
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- ============================================================================
-- Add merge tracking columns to patient_profiles
-- ============================================================================

ALTER TABLE patient_profiles
    ADD COLUMN IF NOT EXISTS merged_from_documents JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS merge_status VARCHAR(30)
        DEFAULT 'Single Source'
        CHECK (merge_status IN ('Single Source', 'Merged', 'Has Conflicts')),
    ADD COLUMN IF NOT EXISTS last_deduplicated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS conflict_fields JSONB DEFAULT '[]';

-- ============================================================================
-- Create data_merge_logs audit table
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_merge_logs (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    merge_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    algorithm_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    source_documents JSONB NOT NULL,
    merge_decisions JSONB,
    conflicts_detected JSONB DEFAULT '[]',
    performed_by VARCHAR(20) NOT NULL
        CHECK (performed_by IN ('System', 'Staff Manual')),
    staff_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE data_merge_logs IS 'Audit trail of all deduplication merge operations with decisions and rationale';

-- ============================================================================
-- Create field_conflicts table for unresolved conflicts
-- ============================================================================

CREATE TABLE IF NOT EXISTS field_conflicts (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    conflicting_values JSONB NOT NULL,
    resolution_status VARCHAR(20) NOT NULL
        DEFAULT 'Pending'
        CHECK (resolution_status IN ('Pending', 'Resolved', 'Dismissed')),
    resolved_by_staff_id BIGINT,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE field_conflicts IS 'Tracks unresolved data conflicts across multiple document sources for staff review';

-- ============================================================================
-- Create medication_timeline for temporal medication tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_timeline (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    source_document_id BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_medication_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

COMMENT ON TABLE medication_timeline IS 'Temporal tracking of patient medications across multiple document sources';

-- ============================================================================
-- Create indexes for query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patient_merge_status
    ON patient_profiles (merge_status);

CREATE INDEX IF NOT EXISTS idx_patient_has_conflicts
    ON patient_profiles (id)
    WHERE merge_status = 'Has Conflicts';

CREATE INDEX IF NOT EXISTS idx_merge_logs_patient
    ON data_merge_logs (patient_id, merge_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_field_conflicts_patient
    ON field_conflicts (patient_id, resolution_status);

CREATE INDEX IF NOT EXISTS idx_medication_timeline_patient
    ON medication_timeline (patient_id, is_active, start_date DESC);

COMMIT;
