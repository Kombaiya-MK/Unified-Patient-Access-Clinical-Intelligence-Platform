-- Migration: V013__add_walkin_fields.sql
-- Description: Add columns for walk-in patient registration
-- Author: Clinical Platform Team
-- Date: 2026-03-19

-- Add walk-in related columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS priority_flag BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
ADD COLUMN IF NOT EXISTS estimated_wait_minutes INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN appointments.priority_flag IS 'Flag to mark urgent walk-ins that should be prioritized in queue';
COMMENT ON COLUMN appointments.chief_complaint IS 'Patient chief complaint for walk-in appointments';
COMMENT ON COLUMN appointments.estimated_wait_minutes IS 'Estimated wait time in minutes calculated at check-in';

-- Create index on priority_flag for efficient queue sorting
CREATE INDEX IF NOT EXISTS idx_appointments_priority_flag 
ON appointments(priority_flag) 
WHERE priority_flag = TRUE;

-- Create index on appointment_date and priority for queue queries
CREATE INDEX IF NOT EXISTS idx_appointments_queue_sorting 
ON appointments(appointment_date, priority_flag DESC, appointment_time);

-- Log migration
INSERT INTO migration_log (version, description, executed_at) 
VALUES ('V013', 'Add walk-in fields to appointments table', NOW())
ON CONFLICT (version) DO NOTHING;
