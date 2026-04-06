-- ============================================================================
-- Migration: V023 - Add Queue Management Columns to Appointments
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Adds version column for optimistic locking, arrived_at and
--              started_at timestamps for queue status tracking.
--              completed_at already exists from V002.
-- Dependencies: V002__create_appointment_tables.sql
-- Task: US_020 TASK_003
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- Add version column for optimistic locking (default 1)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add arrived_at timestamp (set when patient arrives)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;

-- Add started_at timestamp (set when consultation starts)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add updated_by column to track which staff member made status changes
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS updated_by BIGINT;

-- Extend status CHECK constraint to include queue statuses
-- Drop old constraint and add new one that includes 'arrived' and 'in_progress'
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_status_valid;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled', 'arrived', 'in_progress'));

-- Index on version for optimistic locking queries
CREATE INDEX IF NOT EXISTS idx_appointments_version ON appointments (id, version);

-- Index on today's appointments for queue queries
CREATE INDEX IF NOT EXISTS idx_appointments_queue_today
  ON appointments (appointment_date, status)
  WHERE status NOT IN ('cancelled', 'rescheduled');

COMMENT ON COLUMN appointments.version IS 'Optimistic locking version counter';
COMMENT ON COLUMN appointments.arrived_at IS 'Timestamp when patient arrived';
COMMENT ON COLUMN appointments.started_at IS 'Timestamp when consultation started';
COMMENT ON COLUMN appointments.updated_by IS 'Staff user ID who last updated status';

COMMIT;
