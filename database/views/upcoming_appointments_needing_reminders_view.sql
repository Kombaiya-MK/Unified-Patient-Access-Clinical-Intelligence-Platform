-- ============================================================================
-- View: upcoming_appointments_needing_reminders
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Materialized view for cron job to efficiently find appointments
--              needing 24-hour reminders. Filters appointments 23-25 hours ahead
--              without reminders sent, joins with patient preferences.
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V017, V018, V019
-- Task: US_016 TASK_001_DB - Database Schema for Reminders
-- Refresh: Hourly via cron job
-- ============================================================================

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Drop existing view if exists
-- ============================================================================

DROP VIEW IF EXISTS app.upcoming_appointments_needing_reminders CASCADE;

-- ============================================================================
-- Create View
-- ============================================================================

CREATE OR REPLACE VIEW app.upcoming_appointments_needing_reminders AS
SELECT 
    a.id AS appointment_id,
    a.patient_id,
    a.doctor_id,
    a.department_id,
    a.appointment_date,
    a.duration_minutes,
    a.status,
    a.appointment_type,
    a.reason_for_visit,
    a.reminders_sent_at,
    a.reminder_attempts,
    a.reminder_sms_status,
    a.reminder_email_status,
    
    -- Patient information
    u.email AS patient_email,
    u.phone_number AS patient_phone,
    u.first_name AS patient_first_name,
    u.last_name AS patient_last_name,
    
    -- Doctor information
    d.first_name AS doctor_first_name,
    d.last_name AS doctor_last_name,
    
    -- Department information
    dept.name AS department_name,
    dept.location AS department_location,
    dept.phone_number AS department_phone,
    
    -- Notification preferences
    COALESCE(np.reminder_sms_enabled, TRUE) AS sms_enabled,
    COALESCE(np.reminder_email_enabled, TRUE) AS email_enabled,
    COALESCE(np.sms_opt_out, FALSE) AS sms_opt_out,
    COALESCE(np.email_opt_out, FALSE) AS email_opt_out,
    COALESCE(np.preferred_contact_method, 'both') AS preferred_contact_method,
    COALESCE(np.reminder_hours_before, 24) AS reminder_hours_before,
    COALESCE(np.timezone, 'America/New_York') AS patient_timezone,
    
    -- Calculated fields
    (a.appointment_date - CURRENT_TIMESTAMP) AS time_until_appointment,
    (CASE 
        WHEN np.sms_opt_out = FALSE AND np.reminder_sms_enabled = TRUE THEN TRUE
        ELSE FALSE
    END) AS should_send_sms,
    (CASE 
        WHEN np.email_opt_out = FALSE AND np.reminder_email_enabled = TRUE THEN TRUE
        ELSE FALSE
    END) AS should_send_email

FROM app.appointments a
INNER JOIN app.users u ON a.patient_id = u.id
INNER JOIN app.users d ON a.doctor_id = d.id
INNER JOIN app.departments dept ON a.department_id = dept.id
LEFT JOIN app.notification_preferences np ON u.id = np.user_id

WHERE 
    -- Appointment is 23-25 hours in the future (1-hour window for cron execution flexibility)
    a.appointment_date >= (CURRENT_TIMESTAMP + INTERVAL '23 hours')
    AND a.appointment_date <= (CURRENT_TIMESTAMP + INTERVAL '25 hours')
    
    -- Reminder not yet sent
    AND a.reminders_sent_at IS NULL
    
    -- Appointment is active
    AND a.status IN ('confirmed', 'pending')
    
    -- Patient has valid contact info
    AND (u.email IS NOT NULL OR u.phone_number IS NOT NULL)
    
    -- Patient hasn't opted out of ALL notifications
    AND NOT (COALESCE(np.sms_opt_out, FALSE) = TRUE AND COALESCE(np.email_opt_out, FALSE) = TRUE)

ORDER BY 
    a.appointment_date ASC,
    a.patient_id ASC;

-- ============================================================================
-- View Comments
-- ============================================================================

COMMENT ON VIEW app.upcoming_appointments_needing_reminders IS 
'Optimized view for reminder cron job to find appointments needing 24-hour reminders. ' ||
'Filters appointments 23-25 hours ahead, excludes sent reminders, respects opt-out preferences.';

-- ============================================================================
-- Usage Examples
-- ============================================================================

-- Example 1: Find all appointments needing reminders
-- SELECT * FROM app.upcoming_appointments_needing_reminders;

-- Example 2: Count appointments by notification type
-- SELECT 
--     COUNT(*) as total,
--     SUM(CASE WHEN should_send_sms THEN 1 ELSE 0 END) as sms_count,
--     SUM(CASE WHEN should_send_email THEN 1 ELSE 0 END) as email_count
-- FROM app.upcoming_appointments_needing_reminders;

-- Example 3: Group appointments by patient (for consolidated messages)
-- SELECT 
--     patient_id,
--     patient_email,
--     patient_phone,
--     COUNT(*) as appointment_count,
--     STRING_AGG(appointment_id::TEXT, ',') as appointment_ids,
--     MIN(appointment_date) as earliest_appointment,
--     BOOL_AND(should_send_sms) as can_send_sms,
--     BOOL_AND(should_send_email) as can_send_email
-- FROM app.upcoming_appointments_needing_reminders
-- GROUP BY patient_id, patient_email, patient_phone
-- HAVING COUNT(*) > 0;

-- ============================================================================
-- Performance Verification
-- ============================================================================
-- Verify indexes are used:
-- EXPLAIN ANALYZE SELECT * FROM app.upcoming_appointments_needing_reminders;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- DROP VIEW IF EXISTS app.upcoming_appointments_needing_reminders CASCADE;
