-- ============================================================================
-- Migration: V017 - Add Appointment Reminder Tracking Columns
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Extends appointments table with reminder tracking columns for
--              automated 24-hour appointment reminders via SMS and email
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V002__create_appointment_tables.sql
-- Task: US_016 TASK_001_DB - Database Schema for Reminders
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Add Reminder Tracking Columns to appointments Table
-- ============================================================================

ALTER TABLE app.appointments 
    ADD COLUMN IF NOT EXISTS reminders_sent_at TIMESTAMPTZ;

ALTER TABLE app.appointments 
    ADD COLUMN IF NOT EXISTS reminder_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE app.appointments 
    ADD COLUMN IF NOT EXISTS reminder_sms_status VARCHAR(20);

ALTER TABLE app.appointments 
    ADD COLUMN IF NOT EXISTS reminder_email_status VARCHAR(20);

ALTER TABLE app.appointments 
    ADD COLUMN IF NOT EXISTS last_reminder_error TEXT;

-- ============================================================================
-- Add Column Comments
-- ============================================================================

COMMENT ON COLUMN app.appointments.reminders_sent_at IS 'Timestamp when 24-hour reminder was successfully sent (SMS and/or email)';
COMMENT ON COLUMN app.appointments.reminder_attempts IS 'Number of reminder delivery attempts (max 3 with exponential backoff)';
COMMENT ON COLUMN app.appointments.reminder_sms_status IS 'SMS delivery status: delivered, failed, pending';
COMMENT ON COLUMN app.appointments.reminder_email_status IS 'Email delivery status: delivered, failed, pending';
COMMENT ON COLUMN app.appointments.last_reminder_error IS 'Last delivery failure error message for debugging';

-- ============================================================================
-- Add CHECK Constraints for Valid Status Values
-- ============================================================================

ALTER TABLE app.appointments 
    ADD CONSTRAINT chk_reminder_sms_status 
    CHECK (reminder_sms_status IN ('delivered', 'failed', 'pending') OR reminder_sms_status IS NULL);

ALTER TABLE app.appointments 
    ADD CONSTRAINT chk_reminder_email_status 
    CHECK (reminder_email_status IN ('delivered', 'failed', 'pending') OR reminder_email_status IS NULL);

ALTER TABLE app.appointments 
    ADD CONSTRAINT chk_reminder_attempts_range 
    CHECK (reminder_attempts >= 0 AND reminder_attempts <= 3);

-- ============================================================================
-- Update Trigger
-- ============================================================================

-- Ensure updated_at is maintained when reminder columns are modified
CREATE OR REPLACE FUNCTION app.update_appointments_updated_at_on_reminder()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        NEW.reminders_sent_at IS DISTINCT FROM OLD.reminders_sent_at OR
        NEW.reminder_attempts IS DISTINCT FROM OLD.reminder_attempts OR
        NEW.reminder_sms_status IS DISTINCT FROM OLD.reminder_sms_status OR
        NEW.reminder_email_status IS DISTINCT FROM OLD.reminder_email_status
    ) THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointments_reminder_updated_at
    BEFORE UPDATE ON app.appointments
    FOR EACH ROW
    EXECUTE FUNCTION app.update_appointments_updated_at_on_reminder();

COMMIT;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration:
-- ALTER TABLE app.appointments DROP COLUMN IF EXISTS reminders_sent_at;
-- ALTER TABLE app.appointments DROP COLUMN IF EXISTS reminder_attempts;
-- ALTER TABLE app.appointments DROP COLUMN IF EXISTS reminder_sms_status;
-- ALTER TABLE app.appointments DROP COLUMN IF EXISTS reminder_email_status;
-- ALTER TABLE app.appointments DROP COLUMN IF EXISTS last_reminder_error;
-- DROP TRIGGER IF EXISTS trg_appointments_reminder_updated_at ON app.appointments;
-- DROP FUNCTION IF EXISTS app.update_appointments_updated_at_on_reminder();
