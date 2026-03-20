-- ============================================================================
-- Migration: V021 - Create Calendar Sync Queue Table
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates queue table for calendar sync operations with rate limiting
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V002__create_appointment_tables.sql, V012__create_calendar_tokens_table.sql
-- Purpose: Handle rate limiting for calendar API calls (batch process every 5 min)
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Drop existing table if recreating
-- ============================================================================

DROP TABLE IF EXISTS calendar_sync_queue CASCADE;

-- ============================================================================
-- Create Calendar Sync Queue Table
-- ============================================================================

CREATE TABLE calendar_sync_queue (
    -- Primary key
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign key to appointment
    appointment_id BIGINT NOT NULL,
    
    -- Operation type
    operation VARCHAR(20) NOT NULL,
    
    -- Payload with appointment details for sync
    payload JSONB NOT NULL,
    
    -- Queue status
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    
    -- Retry tracking
    retry_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Scheduling for rate limiting
    scheduled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at TIMESTAMPTZ,
    
    -- Error tracking
    error_message TEXT,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_calendar_queue_appointment 
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    
    -- CHECK constraints
    CONSTRAINT chk_queue_operation 
        CHECK (operation IN ('create', 'update', 'delete')),
    
    CONSTRAINT chk_queue_status 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    CONSTRAINT chk_queue_retry_count 
        CHECK (retry_count >= 0 AND retry_count <= 2)
);

-- ============================================================================
-- Add Table and  Column Comments
-- ============================================================================

COMMENT ON TABLE calendar_sync_queue IS 
    'Queue for calendar sync operations to handle rate limiting (batch process every 5 min per US_017)';

COMMENT ON COLUMN calendar_sync_queue.appointment_id IS 
    'References appointments.id - appointment to sync';

COMMENT ON COLUMN calendar_sync_queue.operation IS 
    'Calendar operation type: create (new event), update (reschedule), delete (cancel)';

COMMENT ON COLUMN calendar_sync_queue.payload IS 
    'JSON payload with appointment details: {eventId, startTime, endTime, title, description, location}';

COMMENT ON COLUMN calendar_sync_queue.status IS 
    'Queue item status: pending (awaiting processing), processing (in progress), completed (synced), failed (error)';

COMMENT ON COLUMN calendar_sync_queue.retry_count IS 
    'Number of retry attempts (max 2 with exponential backoff: 5s, 15s per AIR requirements)';

COMMENT ON COLUMN calendar_sync_queue.scheduled_at IS 
    'When to process this queue item (for rate limiting and batch processing)';

COMMENT ON COLUMN calendar_sync_queue.processed_at IS 
    'Timestamp when queue item was processed (completed or failed)';

COMMENT ON COLUMN calendar_sync_queue.error_message IS 
    'Last error message if sync failed (for debugging and user notification)';

-- ============================================================================
-- Create Indexes for Queue Processing
-- ============================================================================

-- Primary queue processing index (status + scheduled time)
CREATE INDEX idx_calendar_queue_processing 
    ON calendar_sync_queue(status, scheduled_at) 
    WHERE status IN ('pending', 'processing');

-- Index for finding queue items by appointment
CREATE INDEX idx_calendar_queue_appointment 
    ON calendar_sync_queue(appointment_id);

-- Index for finding failed items eligible for retry
CREATE INDEX idx_calendar_queue_retry 
    ON calendar_sync_queue(status, retry_count, scheduled_at) 
    WHERE status = 'failed' AND retry_count < 2;

-- Index for cleanup of old completed items
CREATE INDEX idx_calendar_queue_completed 
    ON calendar_sync_queue(status, processed_at) 
    WHERE status = 'completed';

-- ============================================================================
-- Add Index Comments
-- ============================================================================

COMMENT ON INDEX idx_calendar_queue_processing IS 
    'Process queue items in order (oldest first) respecting rate limits';

COMMENT ON INDEX idx_calendar_queue_appointment IS 
    'Find all queue entries for a specific appointment';

COMMENT ON INDEX idx_calendar_queue_retry IS 
    'Find failed items eligible for retry (max 2 attempts)';

COMMENT ON INDEX idx_calendar_queue_completed IS 
    'Support cleanup of old completed queue items (retention policy)';

-- ============================================================================
-- Create Trigger for Auto-Update Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_calendar_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calendar_queue_updated_at
    BEFORE UPDATE ON calendar_sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_queue_updated_at();

COMMENT ON FUNCTION update_calendar_queue_updated_at() IS 
    'Automatically update updated_at timestamp on calendar_sync_queue updates';

-- ============================================================================
-- Sample Queue Entry (for documentation)
-- ============================================================================

/*
Example payload JSONB structure:
{
  "eventId": "abc123",
  "userId": 42,
  "provider": "google",
  "startTime": "2026-03-25T10:00:00Z",
  "endTime": "2026-03-25T10:30:00Z",
  "title": "Dr. Smith - Cardiology Consultation",
  "description": "Follow-up appointment for patient John Doe",
  "location": "Building A, Room 203",
  "attendees": ["patient@example.com", "doctor@example.com"]
}
*/

COMMIT;
