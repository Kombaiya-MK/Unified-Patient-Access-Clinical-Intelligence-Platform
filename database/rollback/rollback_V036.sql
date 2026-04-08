-- ============================================================================
-- Rollback: rollback_V036.sql
-- Description: Reverses V036__create_insurance_verifications.sql
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_patient_insurance_issue ON insurance_verifications;
DROP FUNCTION IF EXISTS update_patient_insurance_issue();
DROP TRIGGER IF EXISTS update_insurance_verifications_updated_at ON insurance_verifications;

DROP INDEX IF EXISTS idx_insurance_verification_attempts_retry;
DROP INDEX IF EXISTS idx_insurance_verification_attempts_verification;
DROP INDEX IF EXISTS idx_insurance_verifications_last_verified;
DROP INDEX IF EXISTS idx_insurance_verifications_status;
DROP INDEX IF EXISTS idx_insurance_verifications_appointment;
DROP INDEX IF EXISTS idx_insurance_verifications_patient;

DROP TABLE IF EXISTS insurance_verification_attempts;
DROP TABLE IF EXISTS insurance_verifications;

DROP TYPE IF EXISTS attempt_status;
DROP TYPE IF EXISTS verification_status;

ALTER TABLE patient_profiles DROP COLUMN IF EXISTS has_insurance_issue;

-- Rollback complete
SELECT 'V036 rollback complete: insurance verification tables removed' AS status;
