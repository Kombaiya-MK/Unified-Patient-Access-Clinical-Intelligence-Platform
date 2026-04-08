-- ============================================================================
-- Rollback: V039__performance_indexes.sql
-- ============================================================================

DROP INDEX IF EXISTS idx_appointments_date_dept_status;
DROP INDEX IF EXISTS idx_appointments_patient_date_desc;
DROP INDEX IF EXISTS idx_patient_profiles_email;
DROP INDEX IF EXISTS idx_insurance_verif_patient_created;
DROP INDEX IF EXISTS idx_clinical_docs_patient_uploaded;
DROP INDEX IF EXISTS idx_time_slots_available;
