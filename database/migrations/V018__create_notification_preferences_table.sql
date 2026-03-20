-- ============================================================================
-- Migration: V018 - Create Notification Preferences Table
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates notification_preferences table for patient opt-in/opt-out
--              settings for appointment reminders and other notifications
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V001__create_core_tables.sql
-- Task: US_016 TASK_001_DB - Database Schema for Reminders
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: notification_preferences
-- Description: Patient notification preferences for reminders and alerts
-- ============================================================================

DROP TABLE IF EXISTS app.notification_preferences CASCADE;

CREATE TABLE app.notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    
    -- Reminder preferences
    reminder_sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
    email_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Contact preferences
    preferred_contact_method VARCHAR(20) NOT NULL DEFAULT 'both' 
        CHECK (preferred_contact_method IN ('sms', 'email', 'both', 'none')),
    reminder_hours_before INTEGER NOT NULL DEFAULT 24 
        CHECK (reminder_hours_before >= 0 AND reminder_hours_before <= 168),
    
    -- Timezone for reminder scheduling
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    CONSTRAINT fk_notification_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES app.users(id)
        ON DELETE CASCADE
);

-- ============================================================================
-- Table Comments
-- ============================================================================

COMMENT ON TABLE app.notification_preferences IS 'Patient notification preferences for appointment reminders and alerts';
COMMENT ON COLUMN app.notification_preferences.user_id IS 'References users.id - patient user';
COMMENT ON COLUMN app.notification_preferences.reminder_sms_enabled IS 'Whether patient wants SMS reminders (default true)';
COMMENT ON COLUMN app.notification_preferences.reminder_email_enabled IS 'Whether patient wants email reminders (default true)';
COMMENT ON COLUMN app.notification_preferences.sms_opt_out IS 'Patient has opted out of ALL SMS communications';
COMMENT ON COLUMN app.notification_preferences.email_opt_out IS 'Patient has opted out of ALL email communications';
COMMENT ON COLUMN app.notification_preferences.preferred_contact_method IS 'Preferred contact method: sms, email, both, none';
COMMENT ON COLUMN app.notification_preferences.reminder_hours_before IS 'Hours before appointment to send reminder (default 24, max 168=7 days)';
COMMENT ON COLUMN app.notification_preferences.timezone IS 'Patient timezone for reminder scheduling (IANA format)';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_notification_preferences_user_id 
    ON app.notification_preferences(user_id);

CREATE INDEX idx_notification_preferences_opt_outs 
    ON app.notification_preferences(sms_opt_out, email_opt_out)
    WHERE sms_opt_out = TRUE OR email_opt_out = TRUE;

-- ============================================================================
-- Trigger: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION app.update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_preferences_updated_at
    BEFORE UPDATE ON app.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION app.update_notification_preferences_updated_at();

-- ============================================================================
-- Trigger: Auto-create default preferences for new patients
-- ============================================================================

CREATE OR REPLACE FUNCTION app.auto_create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create preferences for patient users
    IF NEW.role = 'patient' THEN
        INSERT INTO app.notification_preferences (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_notification_preferences
    AFTER INSERT ON app.users
    FOR EACH ROW
    EXECUTE FUNCTION app.auto_create_notification_preferences();

-- ============================================================================
-- Backfill: Create default preferences for existing patients
-- ============================================================================

INSERT INTO app.notification_preferences (user_id)
SELECT id
FROM app.users
WHERE role = 'patient'
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT COUNT(*) as total_preferences FROM app.notification_preferences;
-- SELECT * FROM app.notification_preferences LIMIT 5;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_auto_create_notification_preferences ON app.users;
-- DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON app.notification_preferences;
-- DROP FUNCTION IF EXISTS app.auto_create_notification_preferences();
-- DROP FUNCTION IF EXISTS app.update_notification_preferences_updated_at();
-- DROP TABLE IF EXISTS app.notification_preferences CASCADE;
