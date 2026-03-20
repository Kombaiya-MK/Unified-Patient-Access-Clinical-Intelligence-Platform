# Task - TASK_001_DB_REMINDER_SCHEMA

## Requirement Reference
- User Story: US_016  
- Story Location: `.propel/context/tasks/us_016/us_016.md`
- Acceptance Criteria:
    - AC1: Log reminder sent status (reminders_sent_at timestamp in Appointments table)
- Edge Cases:
    - Patient opts out: Check notifications_preferences table, skip if opt_out=true
    - Multiple delivery attempts: Track retry count and failure reasons

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Database schema task only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | N/A | N/A |
| Database | PostgreSQL | 15+ |
| Database | node-postgres (pg) | 8.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Database schema only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Database schema only

## Task Overview
Extend appointments table and create notification_preferences table to support automated reminder tracking. Add columns to appointments: reminders_sent_at (timestamp when reminder sent), reminder_attempts (retry count), reminder_sms_status (delivered/failed/pending), reminder_email_status (delivered/failed/pending), last_reminder_error (failure reason). Create notification_preferences table: patient_id, reminder_sms_enabled (default true), reminder_email_enabled (default true), sms_opt_out (default false), email_opt_out (default false), preferred_contact_method (sms/email/both), reminder_hours_before (default 24), created_at, updated_at. Add indexes for cron job queries: appointments(appointment_date, reminders_sent_at) for finding unsent reminders. Create view upcoming_appointments_needing_reminders filtering appointments 24 hours ahead without reminders_sent_at.

## Dependent Tasks
- US_007: Appointments table must exist

## Impacted Components
**Modified:**
- None

**New:**
- database/migrations/XXX_add_appointment_reminder_columns.sql (Extend appointments table)
- database/migrations/XXX_create_notification_preferences_table.sql (Preferences table)
- database/migrations/XXX_add_reminder_indexes.sql (Performance indexes)
- database/views/upcoming_appointments_needing_reminders_view.sql (Reminder query view)

## Implementation Plan
1. **Extend Appointments Table**: Add reminder tracking columns
2. **Notification Preferences Table**: Store patient opt-in/opt-out preferences
3. **Default Preferences**: Create trigger to insert default preferences for new patients
4. **Indexes**: Add composite index on (appointment_date, reminders_sent_at) for cron queries
5. **View**: Create view for appointments needing reminders (24h window, not sent)
6. **Constraints**: Add CHECK constraints for valid status values
7. **Backfill**: Update existing patients with default notification preferences

## Current Project State
```
ASSIGNMENT/
├── database/
│   ├── migrations/ (US_007)
│   │   ├── 001_create_patients_table.sql
│   │   ├── 002_create_appointments_table.sql
│   │   └── ...
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/XXX_add_appointment_reminder_columns.sql | Add reminder tracking to appointments |
| CREATE | database/migrations/XXX_create_notification_preferences_table.sql | Patient notification preferences |
| CREATE | database/migrations/XXX_add_reminder_indexes.sql | Performance indexes for cron job |
| CREATE | database/views/upcoming_appointments_needing_reminders_view.sql | View for reminder queries |
| CREATE | database/migrations/XXX_backfill_notification_preferences.sql | Default preferences for existing patients |

> 0 modified files, 5 new files created

## External References
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)

## Build Commands
```bash
# Apply migrations in order
cd database

# 1. Add reminder columns to appointments
psql -U postgres -d clinic_db -f migrations/XXX_add_appointment_reminder_columns.sql

# 2. Create notification preferences table
psql -U postgres -d clinic_db -f migrations/XXX_create_notification_preferences_table.sql

# 3. Add indexes
psql -U postgres -d clinic_db -f migrations/XXX_add_reminder_indexes.sql

# 4. Create view
psql -U postgres -d clinic_db -f views/upcoming_appointments_needing_reminders_view.sql

# 5. Backfill existing patients
psql -U postgres -d clinic_db -f migrations/XXX_backfill_notification_preferences.sql

# Verify appointments table structure
psql -U postgres -d clinic_db -c "\d appointments"

# Expected new columns:
# - reminders_sent_at (TIMESTAMP)
# - reminder_attempts (INTEGER DEFAULT 0)
# - reminder_sms_status (VARCHAR)
# - reminder_email_status (VARCHAR)
# - last_reminder_error (TEXT)

# Verify notification_preferences table
psql -U postgres -d clinic_db -c "\d notification_preferences"

# Test view: appointments needing reminders
psql -U postgres -d clinic_db -c "SELECT * FROM upcoming_appointments_needing_reminders_view LIMIT 5;"

# Test: Appointments 24 hours from now
psql -U postgres -d clinic_db <<EOF
SELECT COUNT(*) FROM appointments 
WHERE appointment_date = CURRENT_DATE + INTERVAL '1 day'
AND reminders_sent_at IS NULL
AND status = 'scheduled';
EOF
```

## Implementation Validation Strategy
- [ ] Appointments table has reminders_sent_at column (nullable timestamp)
- [ ] Appointments table has reminder_attempts column (integer, default 0)
- [ ] Appointments table has reminder_sms_status column (varchar)
- [ ] Appointments table has reminder_email_status column (varchar)
- [ ] Appointments table has last_reminder_error column (text, nullable)
- [ ] notification_preferences table created with patient_id FK
- [ ] Default values: reminder_sms_enabled=true, reminder_email_enabled=true
- [ ] Composite index on (appointment_date, reminders_sent_at) exists
- [ ] Partial index on reminders_sent_at IS NULL for unsent reminders
- [ ] View filters appointments 24 hours ahead without reminders_sent_at
- [ ] Trigger creates default preferences for new patients
- [ ] Existing patients have default preferences populated
- [ ] CHECK constraints validate status values (delivered/failed/pending)
- [ ] Foreign key cascade: DELETE patient → DELETE preferences

## Implementation Checklist

### Add Reminder Columns to Appointments (database/migrations/XXX_add_appointment_reminder_columns.sql)
- [ ] -- Migration: Add reminder tracking columns to appointments table
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminders_sent_at TIMESTAMP;
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_attempts INTEGER DEFAULT 0 NOT NULL;
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sms_status VARCHAR(20);
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_email_status VARCHAR(20);
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS last_reminder_error TEXT;
- [ ] COMMENT ON COLUMN appointments.reminders_sent_at IS 'Timestamp when 24-hour reminder was sent';
- [ ] COMMENT ON COLUMN appointments.reminder_attempts IS 'Number of reminder delivery attempts (max 3)';
- [ ] COMMENT ON COLUMN appointments.reminder_sms_status IS 'SMS delivery status: delivered, failed, pending';
- [ ] COMMENT ON COLUMN appointments.reminder_email_status IS 'Email delivery status: delivered, failed, pending';
- [ ] COMMENT ON COLUMN appointments.last_reminder_error IS 'Last delivery failure error message';
- [ ] -- Add CHECK constraint for valid status values
- [ ] ALTER TABLE appointments ADD CONSTRAINT chk_reminder_sms_status CHECK (reminder_sms_status IN ('delivered', 'failed', 'pending', NULL));
- [ ] ALTER TABLE appointments ADD CONSTRAINT chk_reminder_email_status CHECK (reminder_email_status IN ('delivered', 'failed', 'pending', NULL));

### Create Notification Preferences Table (database/migrations/XXX_create_notification_preferences_table.sql)
- [ ] -- Migration: Create notification_preferences table for patient opt-in/opt-out
- [ ] DROP TABLE IF EXISTS notification_preferences CASCADE;
- [ ] CREATE TABLE notification_preferences (
- [ ]   id SERIAL PRIMARY KEY,
- [ ]   patient_id INTEGER NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
- [ ]   reminder_sms_enabled BOOLEAN DEFAULT TRUE NOT NULL,
- [ ]   reminder_email_enabled BOOLEAN DEFAULT TRUE NOT NULL,
- [ ]   sms_opt_out BOOLEAN DEFAULT FALSE NOT NULL,
- [ ]   email_opt_out BOOLEAN DEFAULT FALSE NOT NULL,
- [ ]   preferred_contact_method VARCHAR(20) DEFAULT 'both' NOT NULL,
- [ ]   reminder_hours_before INTEGER DEFAULT 24 NOT NULL,
- [ ]   created_at TIMESTAMP DEFAULT NOW() NOT NULL,
- [ ]   updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
- [ ]   CONSTRAINT chk_preferred_method CHECK (preferred_contact_method IN ('sms', 'email', 'both')),
- [ ]   CONSTRAINT chk_reminder_hours CHECK (reminder_hours_before >= 1 AND reminder_hours_before <= 168)
- [ ] );
- [ ] COMMENT ON TABLE notification_preferences IS 'Patient notification preferences for appointment reminders';
- [ ] COMMENT ON COLUMN notification_preferences.sms_opt_out IS 'Patient opted out of SMS notifications';
- [ ] COMMENT ON COLUMN notification_preferences.email_opt_out IS 'Patient opted out of email notifications';
- [ ] COMMENT ON COLUMN notification_preferences.reminder_hours_before IS 'Hours before appointment to send reminder (1-168, default 24)';
- [ ] -- Create trigger to insert default preferences for new patients
- [ ] CREATE OR REPLACE FUNCTION create_default_notification_preferences()
- [ ] RETURNS TRIGGER AS $$
- [ ] BEGIN
- [ ]   INSERT INTO notification_preferences (patient_id)
- [ ]   VALUES (NEW.id)
- [ ]   ON CONFLICT (patient_id) DO NOTHING;
- [ ]   RETURN NEW;
- [ ] END;
- [ ] $$ LANGUAGE plpgsql;
- [ ] CREATE TRIGGER create_notification_preferences_on_patient_insert
- [ ]   AFTER INSERT ON patients
- [ ]   FOR EACH ROW
- [ ]   EXECUTE FUNCTION create_default_notification_preferences();
- [ ] -- Update timestamps trigger
- [ ] CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
- [ ] RETURNS TRIGGER AS $$
- [ ] BEGIN
- [ ]   NEW.updated_at := NOW();
- [ ]   RETURN NEW;
- [ ] END;
- [ ] $$ LANGUAGE plpgsql;
- [ ] CREATE TRIGGER update_notification_preferences_timestamp_trigger
- [ ]   BEFORE UPDATE ON notification_preferences
- [ ]   FOR EACH ROW
- [ ]   EXECUTE FUNCTION update_notification_preferences_timestamp();

### Add Performance Indexes (database/migrations/XXX_add_reminder_indexes.sql)
- [ ] -- Migration: Add indexes for reminder cron job queries
- [ ] CREATE INDEX idx_appointments_reminder_query ON appointments(appointment_date, reminders_sent_at) 
- [ ]   WHERE status = 'scheduled';
- [ ] CREATE INDEX idx_appointments_reminder_unsent ON appointments(appointment_date) 
- [ ]   WHERE reminders_sent_at IS NULL AND status = 'scheduled';
- [ ] CREATE INDEX idx_appointments_reminder_failed ON appointments(reminder_attempts) 
- [ ]   WHERE reminder_attempts > 0 AND reminder_attempts < 3;
- [ ] CREATE INDEX idx_notification_preferences_patient ON notification_preferences(patient_id);
- [ ] COMMENT ON INDEX idx_appointments_reminder_query IS 'Fast lookup for appointments needing reminders (24h ahead)';
- [ ] COMMENT ON INDEX idx_appointments_reminder_unsent IS 'Partial index for unsent reminders only';
- [ ] COMMENT ON INDEX idx_appointments_reminder_failed IS 'Track failed reminder attempts for retry';

### Create Reminder View (database/views/upcoming_appointments_needing_reminders_view.sql)
- [ ] -- View: Appointments needing 24-hour reminders
- [ ] DROP VIEW IF EXISTS upcoming_appointments_needing_reminders_view CASCADE;
- [ ] CREATE VIEW upcoming_appointments_needing_reminders_view AS
- [ ] SELECT 
- [ ]   a.id AS appointment_id,
- [ ]   a.patient_id,
- [ ]   a.provider_id,
- [ ]   a.appointment_date,
- [ ]   a.start_time,
- [ ]   a.end_time,
- [ ]   a.reason,
- [ ]   a.reminder_attempts,
- [ ]   p.first_name,
- [ ]   p.last_name,
- [ ]   p.email,
- [ ]   p.phone,
- [ ]   pr.name AS provider_name,
- [ ]   pr.specialty AS provider_specialty,
- [ ]   np.reminder_sms_enabled,
- [ ]   np.reminder_email_enabled,
- [ ]   np.sms_opt_out,
- [ ]   np.email_opt_out,
- [ ]   np.preferred_contact_method,
- [ ]   np.reminder_hours_before,
- [ ]   a.appointment_date + a.start_time AS appointment_datetime,
- [ ]   EXTRACT(EPOCH FROM ((a.appointment_date + a.start_time) - NOW())) / 3600 AS hours_until_appointment
- [ ] FROM appointments a
- [ ] JOIN patients p ON a.patient_id = p.id
- [ ] JOIN providers pr ON a.provider_id = pr.id
- [ ] LEFT JOIN notification_preferences np ON a.patient_id = np.patient_id
- [ ] WHERE a.status = 'scheduled'
- [ ]   AND a.reminders_sent_at IS NULL
- [ ]   AND a.appointment_date >= CURRENT_DATE
- [ ]   AND (a.appointment_date + a.start_time) BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
- [ ]   AND (np.reminder_sms_enabled = TRUE OR np.reminder_email_enabled = TRUE)
- [ ]   AND a.reminder_attempts < 3
- [ ] ORDER BY a.appointment_date, a.start_time;
- [ ] COMMENT ON VIEW upcoming_appointments_needing_reminders_view IS 'Appointments 24 hours ahead needing reminder notifications';

### Backfill Notification Preferences (database/migrations/XXX_backfill_notification_preferences.sql)
- [ ] -- Migration: Backfill notification preferences for existing patients
- [ ] INSERT INTO notification_preferences (patient_id)
- [ ] SELECT id FROM patients
- [ ] WHERE NOT EXISTS (
- [ ]   SELECT 1 FROM notification_preferences WHERE patient_id = patients.id
- [ ] )
- [ ] ON CONFLICT (patient_id) DO NOTHING;
- [ ] -- Verify backfill
- [ ] DO $$
- [ ] DECLARE
- [ ]   patient_count INTEGER;
- [ ]   pref_count INTEGER;
- [ ] BEGIN
- [ ]   SELECT COUNT(*) INTO patient_count FROM patients;
- [ ]   SELECT COUNT(*) INTO pref_count FROM notification_preferences;
- [ ]   IF patient_count != pref_count THEN
- [ ]     RAISE EXCEPTION 'Backfill incomplete: % patients, % preferences', patient_count, pref_count;
- [ ]   ELSE
- [ ]     RAISE NOTICE 'Backfill successful: % notification preferences created', pref_count;
- [ ]   END IF;
- [ ] END $$;

### Verification Queries
- [ ] -- Verify column additions
- [ ] SELECT column_name, data_type, column_default, is_nullable
- [ ] FROM information_schema.columns
- [ ] WHERE table_name = 'appointments' AND column_name LIKE 'reminder%'
- [ ] ORDER BY ordinal_position;
- [ ] -- Verify notification_preferences structure
- [ ] SELECT column_name, data_type, column_default
- [ ] FROM information_schema.columns
- [ ] WHERE table_name = 'notification_preferences'
- [ ] ORDER BY ordinal_position;
- [ ] -- Verify indexes
- [ ] SELECT indexname, indexdef FROM pg_indexes 
- [ ] WHERE tablename IN ('appointments', 'notification_preferences') 
- [ ] AND indexname LIKE '%reminder%';
- [ ] -- Test view query (should return appointments 24h ahead)
- [ ] SELECT appointment_id, patient_id, appointment_date, start_time, hours_until_appointment
- [ ] FROM upcoming_appointments_needing_reminders_view
- [ ] LIMIT 10;
- [ ] -- Test opt-out logic
- [ ] SELECT COUNT(*) FROM upcoming_appointments_needing_reminders_view
- [ ] WHERE sms_opt_out = FALSE AND email_opt_out = FALSE;
- [ ] -- Test retry limit (should exclude attempts >= 3)
- [ ] SELECT COUNT(*) FROM upcoming_appointments_needing_reminders_view;
- [ ] -- Verify all patients have preferences
- [ ] SELECT 
- [ ]   (SELECT COUNT(*) FROM patients) AS total_patients,
- [ ]   (SELECT COUNT(*) FROM notification_preferences) AS total_preferences;
