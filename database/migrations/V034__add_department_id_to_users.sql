-- ============================================================================
-- Migration: V034__add_department_id_to_users.sql
-- Description: Add department_id FK to users for Patient role association (FR-022)
-- Task: US_035 TASK_001 - Admin User Management API
-- ============================================================================

BEGIN;

-- Add department_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL;

-- Add index for department lookup queries
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id)
WHERE department_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN users.department_id IS 'Department association, required for patient role (FR-022)';

COMMIT;
