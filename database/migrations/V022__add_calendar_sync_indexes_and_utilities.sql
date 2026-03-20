-- ============================================================================
-- Migration: V022 - Add Calendar Sync Performance Indexes  
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Adds additional indexes for calendar sync lookup performance
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V012, V020, V021 (calendar_tokens, appointments sync tracking, queue)
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Calendar Tokens Table Indexes (Complement V012)
-- ============================================================================

-- Index for finding users with calendar sync enabled (via calendar_tokens)
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_active 
    ON calendar_tokens(user_id, provider) 
    WHERE token_expiry > CURRENT_TIMESTAMP;

COMMENT ON INDEX idx_calendar_tokens_active IS 
    'Fast lookup for users with active (non-expired) calendar tokens';

-- ============================================================================
-- Appointments Table Indexes for Calendar Lookups
-- ============================================================================

-- Composite index for finding appointments by provider and sync status
CREATE INDEX IF NOT EXISTS idx_appointments_provider_status 
    ON appointments(calendar_provider, calendar_sync_status) 
    WHERE calendar_provider IS NOT NULL;

-- Index for upcoming appointments needing calendar sync
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming_sync 
    ON appointments(appointment_date, calendar_sync_status) 
    WHERE calendar_sync_status = 'pending' 
      AND appointment_date > CURRENT_TIMESTAMP;

-- Index for calendar event ID lookups (webhook updates)
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event_lookup 
    ON appointments(calendar_event_id, calendar_provider) 
    WHERE calendar_event_id IS NOT NULL;

COMMENT ON INDEX idx_appointments_provider_status IS 
    'Find appointments by calendar provider and sync status';

COMMENT ON INDEX idx_appointments_upcoming_sync IS 
    'Identify upcoming appointments requiring calendar sync';

COMMENT ON INDEX idx_appointments_calendar_event_lookup IS 
    'Fast lookups for calendar webhook updates (match event_id to appointment)';

-- ============================================================================
-- Calendar Sync Queue Additional Indexes
-- ============================================================================

-- Index for batch processing by operation type
CREATE INDEX IF NOT EXISTS idx_calendar_queue_operation_batch 
    ON calendar_sync_queue(operation, status, scheduled_at) 
    WHERE status = 'pending';

-- Index for monitoring stuck/long-running processes
CREATE INDEX IF NOT EXISTS idx_calendar_queue_stuck 
    ON calendar_sync_queue(status, updated_at) 
    WHERE status = 'processing' 
      AND updated_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes';

COMMENT ON INDEX idx_calendar_queue_operation_batch IS 
    'Batch process by operation type (e.g., 100 creates, then 50 updates)';

COMMENT ON INDEX idx_calendar_queue_stuck IS 
    'Monitor for stuck/zombie processing items (>5 min in processing state)';

-- ============================================================================
-- Create View for Calendar Sync Health Monitoring
-- ============================================================================

CREATE OR REPLACE VIEW v_calendar_sync_health AS
SELECT 
    -- Overall stats
    COUNT(*) FILTER (WHERE ct.id IS NOT NULL) AS users_with_calendar_connected,
    COUNT(*) FILTER (WHERE ct.token_expiry > CURRENT_TIMESTAMP) AS users_with_active_tokens,
    COUNT(*) FILTER (WHERE ct.token_expiry <= CURRENT_TIMESTAMP) AS users_with_expired_tokens,
    
    -- Provider breakdown
    COUNT(*) FILTER (WHERE ct.provider = 'google') AS google_connected,
    COUNT(*) FILTER (WHERE ct.provider = 'outlook') AS outlook_connected,
    
    -- Appointment sync status
    (SELECT COUNT(*) FROM appointments WHERE calendar_sync_status = 'pending') AS appointments_pending_sync,
    (SELECT COUNT(*) FROM appointments WHERE calendar_sync_status = 'synced') AS appointments_synced,
    (SELECT COUNT(*) FROM appointments WHERE calendar_sync_status = 'failed') AS appointments_sync_failed,
    
    -- Queue status
    (SELECT COUNT(*) FROM calendar_sync_queue WHERE status = 'pending') AS queue_pending,
    (SELECT COUNT(*) FROM calendar_sync_queue WHERE status = 'processing') AS queue_processing,
    (SELECT COUNT(*) FROM calendar_sync_queue WHERE status = 'failed' AND retry_count < 2) AS queue_retry_eligible,
    
    -- System health indicators
    (SELECT COUNT(*) FROM calendar_sync_queue 
     WHERE status = 'processing' 
       AND updated_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes') AS queue_stuck_items,
    
    CURRENT_TIMESTAMP AS last_checked
FROM calendar_tokens ct;

COMMENT ON VIEW v_calendar_sync_health IS 
    'Monitoring view for calendar sync system health and statistics';

-- ============================================================================
-- Create Function for Queue Auto-Retry
-- ============================================================================

CREATE OR REPLACE FUNCTION calendar_queue_schedule_retry()
RETURNS INTEGER AS $$
DECLARE
    retry_count INTEGER;
BEGIN
    -- Move failed items back to pending if retry_count < 2
    -- Apply exponential backoff: 5s (1st retry), 15s (2nd retry)
    UPDATE calendar_sync_queue
    SET 
        status = 'pending',
        retry_count = retry_count + 1,
        scheduled_at = CURRENT_TIMESTAMP + 
            CASE 
                WHEN retry_count = 0 THEN INTERVAL '5 seconds'   -- 1st retry
                WHEN retry_count = 1 THEN INTERVAL '15 seconds'  -- 2nd retry
                ELSE INTERVAL '0 seconds'  -- Should not happen (max 2 retries)
            END,
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'failed' 
      AND retry_count < 2;
    
    GET DIAGNOSTICS retry_count = ROW_COUNT;
    RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calendar_queue_schedule_retry() IS 
    'Reschedule failed queue items for retry with exponential backoff (5s, 15s per AIR requirements)';

-- ============================================================================
-- Create Function for Queue Cleanup
-- ============================================================================

CREATE OR REPLACE FUNCTION calendar_queue_cleanup_old(retention_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete completed/failed queue items older than retention period
    DELETE FROM calendar_sync_queue
    WHERE status IN ('completed', 'failed')
      AND processed_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
      AND retry_count >= 2; -- Only delete if max retries exhausted
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calendar_queue_cleanup_old(INTEGER) IS 
    'Clean up old completed/failed queue items (default 7-day retention)';

COMMIT;
