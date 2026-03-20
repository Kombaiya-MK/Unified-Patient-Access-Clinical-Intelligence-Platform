-- Migration: V014__create_sms_log_table.sql
-- Description: Create SMS delivery log table for audit trail
-- Author: Clinical Platform Team
-- Date: 2026-03-19

-- Create SMS log table for tracking all SMS notifications
CREATE TABLE IF NOT EXISTS sms_log (
    id SERIAL PRIMARY KEY,
    recipient_phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'queued')),
    sent_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sms_log_recipient_phone 
ON sms_log(recipient_phone);

CREATE INDEX IF NOT EXISTS idx_sms_log_appointment_id 
ON sms_log(appointment_id) 
WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sms_log_status 
ON sms_log(status) 
WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS idx_sms_log_created_at 
ON sms_log(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE sms_log IS 'Audit log for all SMS notifications sent to patients';
COMMENT ON COLUMN sms_log.recipient_phone IS 'Patient phone number (E.164 format)';
COMMENT ON COLUMN sms_log.message IS 'SMS message content sent to patient';
COMMENT ON COLUMN sms_log.status IS 'Delivery status: sent, failed, or queued';
COMMENT ON COLUMN sms_log.error_message IS 'Error details if status is failed';
COMMENT ON COLUMN sms_log.appointment_id IS 'Related appointment ID if SMS is appointment-related';
COMMENT ON COLUMN sms_log.retry_count IS 'Number of retry attempts for failed messages';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sms_log_updated_at_trigger
BEFORE UPDATE ON sms_log
FOR EACH ROW
EXECUTE FUNCTION update_sms_log_updated_at();

-- Log migration
INSERT INTO migration_log (version, description, executed_at) 
VALUES ('V014', 'Create SMS log table for notification audit trail', NOW())
ON CONFLICT (version) DO NOTHING;
