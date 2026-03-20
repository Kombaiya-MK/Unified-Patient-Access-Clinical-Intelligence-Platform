-- ============================================================================
-- Migration: V015 - Add Reschedule Count Column
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Adds reschedule_count column to appointments table to track
--              the number of times an appointment has been rescheduled.
--              Business rule: Maximum 3 reschedules per appointment.
-- Version: 1.0.0
-- Date: 2026-03-19
-- Dependencies: V002__create_appointment_tables.sql
-- Task: US_014 TASK_002
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: appointments
-- Action: Add reschedule_count column
-- Description: Tracks number of times appointment has been rescheduled
-- Business Rule: Maximum 3 reschedules allowed
-- ============================================================================

-- Add reschedule_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'app'
          AND table_name = 'appointments'
          AND column_name = 'reschedule_count'
    ) THEN
        ALTER TABLE appointments
        ADD COLUMN reschedule_count INTEGER NOT NULL DEFAULT 0
        CHECK (reschedule_count >= 0 AND reschedule_count <= 3);

        -- Add column comment
        COMMENT ON COLUMN appointments.reschedule_count IS 'Number of times appointment has been rescheduled (max 3)';

        RAISE NOTICE 'Added reschedule_count column to appointments table';
    ELSE
        RAISE NOTICE 'Column reschedule_count already exists in appointments table';
    END IF;
END $$;

-- ============================================================================
-- Index: idx_appointments_reschedule_count
-- Description: Index for filtering appointments by reschedule count
-- Use Case: Query appointments that can still be rescheduled
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_count
ON appointments(reschedule_count)
WHERE reschedule_count < 3 AND status NOT IN ('cancelled', 'completed');

COMMENT ON INDEX idx_appointments_reschedule_count IS 'Index for appointments that can still be rescheduled';

-- ============================================================================
-- Add original_appointment_date column for audit trail
-- Description: Stores the original appointment date before first reschedule
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'app'
          AND table_name = 'appointments'
          AND column_name = 'original_appointment_date'
    ) THEN
        ALTER TABLE appointments
        ADD COLUMN original_appointment_date TIMESTAMPTZ;

        -- Backfill with current appointment_date for existing records
        UPDATE appointments
        SET original_appointment_date = appointment_date
        WHERE original_appointment_date IS NULL;

        -- Add column comment
        COMMENT ON COLUMN appointments.original_appointment_date IS 'Original appointment date before first reschedule (audit trail)';

        RAISE NOTICE 'Added original_appointment_date column to appointments table';
    ELSE
        RAISE NOTICE 'Column original_appointment_date already exists in appointments table';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify column was added
DO $$
DECLARE
    v_column_exists BOOLEAN;
    v_constraint_exists BOOLEAN;
BEGIN
    -- Check column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'app'
          AND table_name = 'appointments'
          AND column_name = 'reschedule_count'
    ) INTO v_column_exists;

    -- Check constraint exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu
          ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_schema = 'app'
          AND ccu.table_name = 'appointments'
          AND ccu.column_name = 'reschedule_count'
    ) INTO v_constraint_exists;

    IF v_column_exists AND v_constraint_exists THEN
        RAISE NOTICE 'Migration V015 completed successfully';
        RAISE NOTICE 'Column reschedule_count added with CHECK constraint (0-3)';
    ELSE
        RAISE WARNING 'Migration V015 may have issues';
        RAISE WARNING 'Column exists: %', v_column_exists;
        RAISE WARNING 'Constraint exists: %', v_constraint_exists;
    END IF;
END $$;
