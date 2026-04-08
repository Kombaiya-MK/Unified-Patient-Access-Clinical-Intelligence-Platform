-- ============================================================================
-- Migration: V035 - Add Provider Schedules and Department Operating Hours
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates provider_profiles, provider_departments, provider_schedules,
--              provider_blocked_times tables. Adds operating_hours JSONB to departments
--              and reassignment tracking columns to appointments.
-- Version: 1.0.0
-- Dependencies: V001__create_core_tables.sql, V002__create_appointment_tables.sql
-- Task: US_036 TASK_001
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- ============================================================================
-- 1. Add operating_hours JSONB column to departments
-- ============================================================================
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{
    "monday":    {"open": "08:00", "close": "20:00", "is_open": true},
    "tuesday":   {"open": "08:00", "close": "20:00", "is_open": true},
    "wednesday": {"open": "08:00", "close": "20:00", "is_open": true},
    "thursday":  {"open": "08:00", "close": "20:00", "is_open": true},
    "friday":    {"open": "08:00", "close": "20:00", "is_open": true},
    "saturday":  {"open": "08:00", "close": "20:00", "is_open": true},
    "sunday":    {"open": "08:00", "close": "20:00", "is_open": true}
  }'::jsonb;

COMMENT ON COLUMN departments.operating_hours IS
  'Weekly operating hours as JSONB. Structure: {day: {open: "HH:MM", close: "HH:MM", is_open: boolean}}';

-- ============================================================================
-- 2. Create provider_profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_profiles (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialty       VARCHAR(100),
    license_number  VARCHAR(50),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  provider_profiles              IS 'Provider profiles linking users (doctor/staff) to scheduling metadata';
COMMENT ON COLUMN provider_profiles.user_id      IS 'References users.id; must have role doctor or staff';
COMMENT ON COLUMN provider_profiles.specialty    IS 'Clinical specialty, e.g. Cardiology, Orthopedics';
COMMENT ON COLUMN provider_profiles.license_number IS 'Professional license/registration number';

-- ============================================================================
-- 3. Create provider_departments junction table (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_departments (
    id                  BIGSERIAL   PRIMARY KEY,
    provider_id         BIGINT      NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    department_id       BIGINT      NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    primary_department  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_provider_department UNIQUE (provider_id, department_id)
);

COMMENT ON TABLE  provider_departments IS 'Many-to-many relationship between providers and departments';
COMMENT ON COLUMN provider_departments.primary_department IS 'TRUE if this is the provider''s primary department';

-- ============================================================================
-- 4. Create provider_schedules table (weekly recurring availability)
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_schedules (
    id              BIGSERIAL   PRIMARY KEY,
    provider_id     BIGINT      NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    day_of_week     INTEGER     NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME        NOT NULL,
    end_time        TIME        NOT NULL,
    is_available    BOOLEAN     NOT NULL DEFAULT TRUE,
    recurrence_type VARCHAR(20) NOT NULL DEFAULT 'weekly',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_schedule_time_range CHECK (start_time < end_time)
);

COMMENT ON TABLE  provider_schedules              IS 'Weekly recurring availability templates for providers';
COMMENT ON COLUMN provider_schedules.day_of_week  IS '0=Sunday, 1=Monday, ... 6=Saturday';
COMMENT ON COLUMN provider_schedules.recurrence_type IS 'Recurrence pattern: weekly (default), for future bi-weekly support';

-- ============================================================================
-- 5. Create provider_blocked_times table (one-off blocked slots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_blocked_times (
    id                  BIGSERIAL   PRIMARY KEY,
    provider_id         BIGINT      NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    blocked_date        DATE        NOT NULL,
    start_time          TIME        NOT NULL,
    end_time            TIME        NOT NULL,
    reason              TEXT,
    created_by_user_id  BIGINT      REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_blocked_time_range CHECK (start_time < end_time)
);

COMMENT ON TABLE  provider_blocked_times IS 'One-off blocked time slots for providers (vacations, meetings, etc.)';
COMMENT ON COLUMN provider_blocked_times.created_by_user_id IS 'Admin user who created the blocked time entry';

-- ============================================================================
-- 6. Add appointment reassignment tracking columns
-- ============================================================================
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_reassignment_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_provider_id     BIGINT,
  ADD COLUMN IF NOT EXISTS reassignment_reason      TEXT;

COMMENT ON COLUMN appointments.is_reassignment_required IS 'TRUE when provider deactivated and appointment needs reassignment';
COMMENT ON COLUMN appointments.original_provider_id     IS 'Previous provider ID when appointment has been reassigned';
COMMENT ON COLUMN appointments.reassignment_reason      IS 'Reason for reassignment (e.g. provider_deactivated, schedule_conflict)';

-- ============================================================================
-- 7. Create indexes for efficient queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id
    ON provider_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_provider_profiles_specialty
    ON provider_profiles(specialty);

CREATE INDEX IF NOT EXISTS idx_provider_departments_provider
    ON provider_departments(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_departments_department
    ON provider_departments(department_id);

CREATE INDEX IF NOT EXISTS idx_provider_schedules_provider_day
    ON provider_schedules(provider_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_provider_blocked_times_provider_date
    ON provider_blocked_times(provider_id, blocked_date);

CREATE INDEX IF NOT EXISTS idx_appointments_reassignment
    ON appointments(is_reassignment_required)
    WHERE is_reassignment_required = TRUE;

-- ============================================================================
-- 8. Unique index to prevent exact duplicate schedule entries
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_no_overlap_schedules
    ON provider_schedules(provider_id, day_of_week, start_time, end_time);

-- Note: Full overlapping range validation (e.g. 09:00-12:00 vs 10:00-11:00)
-- is handled at the application layer in providerService.ts

-- ============================================================================
-- 9. Triggers for updated_at timestamps
-- ============================================================================
CREATE TRIGGER update_provider_profiles_updated_at
    BEFORE UPDATE ON provider_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_schedules_updated_at
    BEFORE UPDATE ON provider_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
