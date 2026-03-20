-- ============================================================================
-- Migration: V012 - Create Calendar Tokens Table
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates table for storing OAuth tokens for Google Calendar and Outlook Calendar sync
-- Version: 1.0.0
-- Date: 2026-03-19
-- Dependencies: V001__create_core_tables.sql (users table)
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: calendar_tokens
-- Description: Store encrypted OAuth2 tokens for calendar synchronization
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'outlook')),
    access_token TEXT NOT NULL, -- Encrypted OAuth2 access token
    refresh_token TEXT, -- Encrypted OAuth2 refresh token (nullable for some providers)
    token_expiry TIMESTAMPTZ NOT NULL, -- When the access token expires
    scope TEXT, -- OAuth scopes granted
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_calendar_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_calendar_tokens_user_provider UNIQUE (user_id, provider)
);

-- Add table comment
COMMENT ON TABLE calendar_tokens IS 'OAuth2 tokens for calendar synchronization (Google Calendar and Outlook)';
COMMENT ON COLUMN calendar_tokens.user_id IS 'References users.id - user who authorized calendar access';
COMMENT ON COLUMN calendar_tokens.provider IS 'Calendar provider: google or outlook';
COMMENT ON COLUMN calendar_tokens.access_token IS 'Encrypted OAuth2 access token for API calls';
COMMENT ON COLUMN calendar_tokens.refresh_token IS 'Encrypted OAuth2 refresh token for obtaining new access tokens';
COMMENT ON COLUMN calendar_tokens.token_expiry IS 'Timestamp when access_token expires (UTC)';
COMMENT ON COLUMN calendar_tokens.scope IS 'OAuth scopes granted during authorization';

-- Create indexes for performance
CREATE INDEX idx_calendar_tokens_user_id ON calendar_tokens(user_id);
CREATE INDEX idx_calendar_tokens_provider ON calendar_tokens(provider);
CREATE INDEX idx_calendar_tokens_user_provider ON calendar_tokens(user_id, provider);
CREATE INDEX idx_calendar_tokens_expiry ON calendar_tokens(token_expiry) WHERE token_expiry < NOW() + INTERVAL '1 day'; -- Find expiring tokens

-- ============================================================================
-- Modify appointments table to store calendar event references
-- ============================================================================

-- Add columns to appointments table for tracking calendar sync
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255), -- Google/Outlook event ID
    ADD COLUMN IF NOT EXISTS calendar_provider VARCHAR(20) CHECK (calendar_provider IN ('google', 'outlook', NULL)),
    ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ; -- When the event was synced

-- Add comments
COMMENT ON COLUMN appointments.calendar_event_id IS 'Calendar event ID from Google Calendar or Outlook';
COMMENT ON COLUMN appointments.calendar_provider IS 'Calendar provider where event was created';
COMMENT ON COLUMN appointments.calendar_synced_at IS 'Timestamp when appointment was synced to calendar';

-- Create index for finding appointments by calendar event ID
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event_id ON appointments(calendar_event_id) WHERE calendar_event_id IS NOT NULL;

-- ============================================================================
-- Function: Update updated_at timestamp automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_calendar_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_calendar_tokens_updated_at
    BEFORE UPDATE ON calendar_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_tokens_updated_at();

COMMENT ON FUNCTION update_calendar_tokens_updated_at() IS 'Automatically update updated_at timestamp on calendar_tokens updates';

COMMIT;
