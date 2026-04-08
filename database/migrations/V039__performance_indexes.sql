-- ============================================================================
-- Migration: V039__performance_indexes.sql
-- Description: Add covering / composite indexes to accelerate slow-path
--              queries identified by load testing & query-plan analysis.
-- User Story: US_040 - Load Testing and Performance Optimization
-- Task: TASK_002 - Backend Performance Optimization
-- ============================================================================

-- 1. Covering index for the most common slot-search query:
--    "Find appointments by date + department with an active status"
--    Partial index keeps index size small by excluding terminal states.
CREATE INDEX IF NOT EXISTS idx_appointments_date_dept_status
  ON appointments (appointment_date, department_id, status)
  WHERE status IN ('scheduled', 'confirmed', 'in_progress', 'checked_in');

-- 2. Patient appointment history sorted by most-recent first.
--    Used by /api/appointments/my-appointments, patient profile panel, risk engine.
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date_desc
  ON appointments (patient_id, appointment_date DESC);

-- 3. Email look-up for login / duplicate-check queries.
CREATE INDEX IF NOT EXISTS idx_patient_profiles_email
  ON patient_profiles (email);

-- 4. Insurance verification history (most-recent first per patient).
CREATE INDEX IF NOT EXISTS idx_insurance_verif_patient_created
  ON insurance_verifications (patient_id, created_at DESC);

-- 5. Clinical document list for a patient, newest first.
CREATE INDEX IF NOT EXISTS idx_clinical_docs_patient_uploaded
  ON clinical_documents (patient_id, uploaded_at DESC);

-- 6. Time-slots availability look-up used by booking flow.
CREATE INDEX IF NOT EXISTS idx_time_slots_available
  ON time_slots (slot_date, department_id, is_available)
  WHERE is_available = true;

-- Force the query planner to acknowledge the new indexes.
ANALYZE appointments;
ANALYZE patient_profiles;
ANALYZE insurance_verifications;
ANALYZE clinical_documents;
ANALYZE time_slots;
