-- ============================================================================
-- Migration: V019 - Add Reminder Query Performance Indexes
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates indexes to optimize reminder cron job queries that need
--              to find appointments 24 hours ahead without reminders sent
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V017__add_appointment_reminder_columns.sql
-- Task: US_016 TASK_001_DB - Database Schema for Reminders
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Composite Index for Reminder Queries
-- ============================================================================
-- Optimizes the cron job query for appointments needing reminders
-- Note: Cannot use NOW() in index predicate (not IMMUTABLE)

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_lookup
    ON app.appointments(appointment_date, status)
    WHERE reminders_sent_at IS NULL
      AND status IN ('confirmed', 'pending');

-- ============================================================================
-- Partial Index for Unsent Reminders
-- ============================================================================
-- Significantly reduces index size by only indexing appointments without reminders

CREATE INDEX IF NOT EXISTS idx_appointments_unsent_reminders
    ON app.appointments(appointment_date)
    WHERE reminders_sent_at IS NULL
      AND status NOT IN ('cancelled', 'completed', 'no_show');

-- ============================================================================
-- Index for Patient-based Queries
-- ============================================================================
-- Optimizes grouping by patient for consolidated messages

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date_reminder
    ON app.appointments(patient_id, appointment_date)
    WHERE reminders_sent_at IS NULL;

-- ============================================================================
-- Index for Retry Monitoring
-- ============================================================================
-- Optimizes queries for appointments with failed reminders needing retry

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_failures
    ON app.appointments(reminder_attempts, reminders_sent_at)
    WHERE reminder_attempts > 0 
      AND reminders_sent_at IS NULL;

-- ============================================================================
-- Index for Status Breakdown
-- ============================================================================
-- Optimizes queries for reminder delivery status analytics

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_status
    ON app.appointments(reminder_sms_status, reminder_email_status)
    WHERE reminders_sent_at IS NOT NULL;

-- ============================================================================
-- Covering Index for Dashboard Queries
-- ============================================================================
-- Includes commonly queried columns to avoid table lookups
-- Note: Removed date filter from WHERE clause as CURRENT_DATE is not IMMUTABLE

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_dashboard
    ON app.appointments(
        appointment_date,
        patient_id,
        doctor_id,
        status,
        reminders_sent_at,
        reminder_sms_status,
        reminder_email_status
    )
    WHERE reminders_sent_at IS NOT NULL;

COMMIT;

-- ============================================================================
-- Index Usage Verification
-- ============================================================================
-- Run after migration to verify indexes are created:
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'appointments' 
--   AND indexname LIKE '%reminder%';

-- Verify index is used in query plan:
-- EXPLAIN ANALYZE 
-- SELECT * FROM app.appointments 
-- WHERE appointment_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
--   AND reminders_sent_at IS NULL 
--   AND status = 'confirmed';

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- DROP INDEX IF EXISTS app.idx_appointments_reminder_lookup;
-- DROP INDEX IF EXISTS app.idx_appointments_unsent_reminders;
-- DROP INDEX IF EXISTS app.idx_appointments_patient_date_reminder;
-- DROP INDEX IF EXISTS app.idx_appointments_reminder_failures;
-- DROP INDEX IF EXISTS app.idx_appointments_reminder_status;
-- DROP INDEX IF EXISTS app.idx_appointments_reminder_dashboard;
