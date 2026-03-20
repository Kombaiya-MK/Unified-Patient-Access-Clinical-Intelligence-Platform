-- ============================================================================
-- Migration: V016 - Create Waitlist Reservations Table
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates waitlist_reservations table to temporarily hold slots
--              for notified waitlist patients. Slots are held for 2 hours.
-- Version: 1.0.0
-- Date: 2026-03-19
-- Dependencies: V002__create_appointment_tables.sql (waitlist table)
-- Task: US_015 TASK_001
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: waitlist_reservations
-- Description: Temporary slot reservations for notified waitlist patients
-- Business Rule: Slots held for 2 hours after notification
-- ============================================================================

CREATE TABLE IF NOT EXISTS waitlist_reservations (
    id BIGSERIAL PRIMARY KEY,
    waitlist_id BIGINT NOT NULL,
    slot_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reserved_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'booked', 'expired', 'released')),
    notification_sent_at TIMESTAMPTZ,
    booked_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_reserved_until_future CHECK (reserved_until > reserved_at),
    CONSTRAINT chk_status_timestamps CHECK (
        (status = 'booked' AND booked_at IS NOT NULL) OR
        (status = 'expired' AND released_at IS NOT NULL) OR
        (status = 'released' AND released_at IS NOT NULL) OR
        (status = 'active')
    ),
    CONSTRAINT uq_active_reservation_per_slot UNIQUE (slot_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Add table comment
COMMENT ON TABLE waitlist_reservations IS 'Temporary slot reservations for waitlist patients (2-hour hold)';
COMMENT ON COLUMN waitlist_reservations.waitlist_id IS 'References waitlist.id';
COMMENT ON COLUMN waitlist_reservations.slot_id IS 'References time_slots.id - temporarily reserved slot';
COMMENT ON COLUMN waitlist_reservations.patient_id IS 'References patient_profiles.id';
COMMENT ON COLUMN waitlist_reservations.reserved_until IS 'Expiration time (reserved_at + 2 hours)';
COMMENT ON COLUMN waitlist_reservations.status IS 'Reservation status: active, booked, expired, released';
COMMENT ON COLUMN waitlist_reservations.notification_sent_at IS 'When patient was notified about availability';
COMMENT ON COLUMN waitlist_reservations.booked_at IS 'When patient successfully booked the slot';
COMMENT ON COLUMN waitlist_reservations.released_at IS 'When reservation was released (expired or cancelled)';

-- ============================================================================
-- Indexes for waitlist_reservations
-- ============================================================================

-- Index for finding active reservations
CREATE INDEX IF NOT EXISTS idx_waitlist_reservations_active
ON waitlist_reservations(status, reserved_until)
WHERE status = 'active';

COMMENT ON INDEX idx_waitlist_reservations_active IS 'Find active reservations for expiry checks';

-- Index for finding expired reservations (cron job)
CREATE INDEX IF NOT EXISTS idx_waitlist_reservations_expired
ON waitlist_reservations(reserved_until, status)
WHERE status = 'active' AND reserved_until < CURRENT_TIMESTAMP;

COMMENT ON INDEX idx_waitlist_reservations_expired IS 'Find expired reservations for auto-release';

-- Index for patient lookup
CREATE INDEX IF NOT EXISTS idx_waitlist_reservations_patient
ON waitlist_reservations(patient_id, status, created_at DESC);

COMMENT ON INDEX idx_waitlist_reservations_patient IS 'Patient reservation history';

-- Index for waitlist entry lookup
CREATE INDEX IF NOT EXISTS idx_waitlist_reservations_waitlist
ON waitlist_reservations(waitlist_id);

COMMENT ON INDEX idx_waitlist_reservations_waitlist IS 'Find reservation by waitlist entry';

-- Index for slot lookup
CREATE INDEX IF NOT EXISTS idx_waitlist_reservations_slot
ON waitlist_reservations(slot_id, status);

COMMENT ON INDEX idx_waitlist_reservations_slot IS 'Check if slot has active reservation';

-- ============================================================================
-- Trigger: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION waitlist_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_waitlist_reservations_updated_at
BEFORE UPDATE ON waitlist_reservations
FOR EACH ROW
EXECUTE FUNCTION waitlist_reservations_updated_at();

COMMENT ON FUNCTION waitlist_reservations_updated_at IS 'Auto-update updated_at timestamp';

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_index_count INTEGER;
BEGIN
    -- Check table exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'app'
          AND table_name = 'waitlist_reservations'
    ) INTO v_table_exists;

    -- Count indexes
    SELECT COUNT(*)
    INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'app'
      AND tablename = 'waitlist_reservations';

    IF v_table_exists AND v_index_count >= 5 THEN
        RAISE NOTICE 'Migration V016 completed successfully';
        RAISE NOTICE 'Table waitlist_reservations created with % indexes', v_index_count;
    ELSE
        RAISE WARNING 'Migration V016 may have issues';
        RAISE WARNING 'Table exists: %', v_table_exists;
        RAISE WARNING 'Index count: %', v_index_count;
    END IF;
END $$;
