-- ============================================================================
-- Migration: V020 - Add Calendar Sync Tracking to Appointments
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Extends appointments table with sync status and retry tracking
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V012__create_calendar_tokens_table.sql
-- Note: Complements V012's calendar_tokens architecture with sync tracking
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Extend Appointments Table with Sync Tracking
-- ============================================================================

-- Add calendar_sync_status column
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS calendar_sync_status VARCHAR(20) DEFAULT 'pending';

-- Add calendar_sync_retries column
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS calendar_sync_retries INTEGER DEFAULT 0 NOT NULL;

-- Add calendar_sync_last_attempt column for rate limiting
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS calendar_sync_last_attempt TIMESTAMPTZ;

-- Add calendar_sync_error column for debugging
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT;

-- ============================================================================
-- Add Comments
-- ============================================================================

COMMENT ON COLUMN appointments.calendar_sync_status IS 'Sync status: pending, synced, failed, no_sync';
COMMENT ON COLUMN appointments.calendar_sync_retries IS 'Number of sync retry attempts (max 2 per AIR requirements)';
COMMENT ON COLUMN appointments.calendar_sync_last_attempt IS 'Timestamp of last sync attempt (for rate limiting)';
COMMENT ON COLUMN appointments.calendar_sync_error IS 'Last calendar sync error message for troubleshooting';

-- ============================================================================
-- Add CHECK Constraints
-- ============================================================================

-- Valid sync status values
ALTER TABLE appointments 
    ADD CONSTRAINT chk_calendar_sync_status 
    CHECK (calendar_sync_status IN ('pending', 'synced', 'failed', 'no_sync', NULL));

-- Max 2 retries per AIR requirements (exponential backoff: 5s, 15s)
ALTER TABLE appointments 
    ADD CONSTRAINT chk_calendar_sync_retries 
    CHECK (calendar_sync_retries >= 0 AND calendar_sync_retries <= 2);

-- ============================================================================
-- Create Indexes for Sync Status Queries
-- ============================================================================

-- Index for finding pending sync appointments
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_sync_pending 
    ON appointments(calendar_sync_status, calendar_sync_last_attempt) 
    WHERE calendar_sync_status = 'pending';

-- Index for finding failed syncs that need retry
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_sync_failed 
    ON appointments(calendar_sync_status, calendar_sync_retries) 
    WHERE calendar_sync_status = 'failed' AND calendar_sync_retries < 2;

COMMENT ON INDEX idx_appointments_calendar_sync_pending IS 'Find appointments pending calendar sync with rate limiting';
COMMENT ON INDEX idx_appointments_calendar_sync_failed IS 'Find failed syncs eligible for retry';

-- ============================================================================
-- Update Existing Appointments
-- ============================================================================

-- Mark appointments without calendar_event_id as 'no_sync'
UPDATE appointments 
SET calendar_sync_status = 'no_sync' 
WHERE calendar_event_id IS NULL 
  AND calendar_sync_status = 'pending';

-- Mark appointments with calendar_event_id as 'synced'
UPDATE appointments 
SET calendar_sync_status = 'synced' 
WHERE calendar_event_id ISNOT NULL 
  AND calendar_synced_at IS NOT NULL
  AND calendar_sync_status = 'pending';

COMMIT;
