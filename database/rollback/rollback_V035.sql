-- ============================================================================
-- Rollback: V035 - Remove Provider Schedules and Department Operating Hours
-- ============================================================================
-- Reverses all changes from V035__add_provider_schedules.sql
-- Task: US_036 TASK_001
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- Drop triggers
DROP TRIGGER IF EXISTS update_provider_schedules_updated_at ON provider_schedules;
DROP TRIGGER IF EXISTS update_provider_profiles_updated_at ON provider_profiles;

-- Drop indexes
DROP INDEX IF EXISTS idx_no_overlap_schedules;
DROP INDEX IF EXISTS idx_appointments_reassignment;
DROP INDEX IF EXISTS idx_provider_blocked_times_provider_date;
DROP INDEX IF EXISTS idx_provider_schedules_provider_day;
DROP INDEX IF EXISTS idx_provider_departments_department;
DROP INDEX IF EXISTS idx_provider_departments_provider;
DROP INDEX IF EXISTS idx_provider_profiles_specialty;
DROP INDEX IF EXISTS idx_provider_profiles_user_id;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS provider_blocked_times CASCADE;
DROP TABLE IF EXISTS provider_schedules CASCADE;
DROP TABLE IF EXISTS provider_departments CASCADE;
DROP TABLE IF EXISTS provider_profiles CASCADE;

-- Remove appointment reassignment columns
ALTER TABLE appointments
  DROP COLUMN IF EXISTS reassignment_reason,
  DROP COLUMN IF EXISTS original_provider_id,
  DROP COLUMN IF EXISTS is_reassignment_required;

-- Remove departments operating_hours column
ALTER TABLE departments
  DROP COLUMN IF EXISTS operating_hours;

COMMIT;
