-- ============================================================================
-- Migration: V036__create_insurance_verifications.sql
-- Description: Create insurance verification tables for pre-appointment
--              insurance eligibility checks with retry tracking
-- User Story: US_037 - Insurance Pre-check Service Integration
-- Task: TASK_001 - Database Migration for Insurance Verifications
-- ============================================================================

-- Create verification_status enum
CREATE TYPE verification_status AS ENUM (
    'active',
    'inactive',
    'requires_auth',
    'pending',
    'failed',
    'incomplete'
);

COMMENT ON TYPE verification_status IS 
'Insurance verification status: active=covered, inactive=not covered, requires_auth=prior auth needed, pending=verification in progress, failed=API error, incomplete=missing insurance info';

-- Create attempt_status enum
CREATE TYPE attempt_status AS ENUM (
    'success',
    'failed',
    'timeout'
);

COMMENT ON TYPE attempt_status IS 
'Insurance verification attempt status: success=API responded ok, failed=API error, timeout=API timed out';

-- ============================================================================
-- Table: insurance_verifications
-- Stores insurance eligibility verification results for patients
-- ============================================================================
CREATE TABLE insurance_verifications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    verification_date DATE NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    copay_amount DECIMAL(10,2) CHECK (copay_amount >= 0),
    deductible_remaining DECIMAL(10,2) CHECK (deductible_remaining >= 0),
    coverage_start_date DATE,
    coverage_end_date DATE,
    authorization_notes TEXT,
    insurance_plan VARCHAR(200),
    member_id VARCHAR(100),
    last_verified_at TIMESTAMPTZ,
    verification_source VARCHAR(50),
    is_primary_insurance BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coverage_dates CHECK (
        coverage_end_date IS NULL OR coverage_start_date IS NULL OR coverage_start_date <= coverage_end_date
    )
);

COMMENT ON TABLE insurance_verifications IS 'Stores insurance eligibility verification results for patients before appointments';
COMMENT ON COLUMN insurance_verifications.patient_id IS 'FK to patient_profiles - CASCADE delete with patient';
COMMENT ON COLUMN insurance_verifications.appointment_id IS 'FK to appointments - SET NULL if appointment cancelled';
COMMENT ON COLUMN insurance_verifications.status IS 'Verification result status from verification_status enum';
COMMENT ON COLUMN insurance_verifications.copay_amount IS 'Patient copay amount in dollars';
COMMENT ON COLUMN insurance_verifications.deductible_remaining IS 'Remaining deductible amount in dollars';
COMMENT ON COLUMN insurance_verifications.verification_source IS 'API provider: availity, change_healthcare, manual';
COMMENT ON COLUMN insurance_verifications.is_primary_insurance IS 'TRUE if primary insurance, FALSE if secondary';

-- ============================================================================
-- Table: insurance_verification_attempts
-- Tracks retry attempts for failed API calls with exponential backoff
-- ============================================================================
CREATE TABLE insurance_verification_attempts (
    id BIGSERIAL PRIMARY KEY,
    verification_id BIGINT NOT NULL REFERENCES insurance_verifications(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL CHECK (attempt_number BETWEEN 1 AND 3),
    api_provider VARCHAR(50),
    api_request_payload JSONB,
    api_response_payload JSONB,
    response_code VARCHAR(10),
    status attempt_status NOT NULL,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retry_after TIMESTAMPTZ
);

COMMENT ON TABLE insurance_verification_attempts IS 'Tracks individual API call attempts for insurance verification with retry logic';
COMMENT ON COLUMN insurance_verification_attempts.attempt_number IS 'Attempt number 1-3 for exponential backoff';
COMMENT ON COLUMN insurance_verification_attempts.retry_after IS 'When to retry: attempt 1 = +1min, attempt 2 = +5min, attempt 3 = +15min';

-- ============================================================================
-- Add has_insurance_issue flag to patient_profiles for quick filtering
-- ============================================================================
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS has_insurance_issue BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN patient_profiles.has_insurance_issue IS 'Quick filter flag: TRUE if latest verification status is inactive, requires_auth, or failed';

-- ============================================================================
-- Indexes for efficient queries
-- ============================================================================
CREATE INDEX idx_insurance_verifications_patient ON insurance_verifications(patient_id);
CREATE INDEX idx_insurance_verifications_appointment ON insurance_verifications(appointment_id);
CREATE INDEX idx_insurance_verifications_status ON insurance_verifications(status)
    WHERE status IN ('inactive', 'requires_auth', 'failed');
CREATE INDEX idx_insurance_verifications_last_verified ON insurance_verifications(last_verified_at DESC);
CREATE INDEX idx_insurance_verification_attempts_verification ON insurance_verification_attempts(verification_id, attempt_number);
CREATE INDEX idx_insurance_verification_attempts_retry ON insurance_verification_attempts(retry_after)
    WHERE status = 'failed' AND retry_after IS NOT NULL;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at on insurance_verifications (uses existing function from V001)
CREATE TRIGGER update_insurance_verifications_updated_at
    BEFORE UPDATE ON insurance_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update patient_profiles.has_insurance_issue when verification status changes
CREATE OR REPLACE FUNCTION update_patient_insurance_issue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('inactive', 'requires_auth', 'failed') THEN
        UPDATE patient_profiles SET has_insurance_issue = TRUE WHERE id = NEW.patient_id;
    ELSIF NEW.status = 'active' THEN
        UPDATE patient_profiles SET has_insurance_issue = FALSE WHERE id = NEW.patient_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_insurance_issue
    AFTER INSERT OR UPDATE OF status ON insurance_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_insurance_issue();
