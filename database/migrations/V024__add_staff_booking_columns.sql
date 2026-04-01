-- ============================================================================
-- Migration: V024__add_staff_booking_columns.sql
-- Description: Add staff booking columns to appointments table for
--              staff-assisted booking capabilities.
-- Task: US_023 TASK_002
-- ============================================================================

-- Add staff booking columns
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS booked_by_staff BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS booked_by_staff_id BIGINT,
  ADD COLUMN IF NOT EXISTS staff_booking_notes TEXT,
  ADD COLUMN IF NOT EXISTS booking_priority VARCHAR(10) NOT NULL DEFAULT 'normal'
    CHECK (booking_priority IN ('normal', 'urgent')),
  ADD COLUMN IF NOT EXISTS override_capacity BOOLEAN NOT NULL DEFAULT FALSE;

-- Add foreign key for booked_by_staff_id
ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_booked_by_staff
  FOREIGN KEY (booked_by_staff_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for staff booking lookups
CREATE INDEX IF NOT EXISTS idx_appointments_booked_by_staff
  ON appointments (booked_by_staff_id)
  WHERE booked_by_staff = TRUE;

-- Add index for priority filtering
CREATE INDEX IF NOT EXISTS idx_appointments_booking_priority
  ON appointments (booking_priority)
  WHERE booking_priority = 'urgent';

-- Comments
COMMENT ON COLUMN appointments.booked_by_staff IS 'Whether appointment was booked by staff on behalf of patient';
COMMENT ON COLUMN appointments.booked_by_staff_id IS 'Staff user ID who booked the appointment';
COMMENT ON COLUMN appointments.staff_booking_notes IS 'Internal staff notes for the booking';
COMMENT ON COLUMN appointments.booking_priority IS 'Booking priority: normal or urgent';
COMMENT ON COLUMN appointments.override_capacity IS 'Whether slot capacity was overridden for this booking';
