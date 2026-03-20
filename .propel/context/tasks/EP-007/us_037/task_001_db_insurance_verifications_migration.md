# Task - TASK_001: Database Migration for Insurance Verifications and Retry Tracking

## Requirement Reference
- User Story: [us_037]
- Story Location: [.propel/context/tasks/us_037/us_037.md]
- Acceptance Criteria:
    - AC1: Store verification result (status, copay, deductible, notes, timestamp)
    - AC1: Store verification attempts with timestamps and API response codes
    - AC1: Support retry tracking for failed API calls (up to 3 attempts)
- Edge Case:
    - EC1: API down → track verification pending status and retry queue
    - EC2: Missing insurance details → flag incomplete records
    - EC3: Multiple insurance plans → track primary vs secondary

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

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Database | PostgreSQL | 15.x |

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

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create database migration V025 to support insurance verification service. Create insurance_verifications table storing verification results with fields: id, patient_id (FK to patient_profiles), appointment_id (FK nullable, verification may occur for standing eligibility), verification_date, status ENUM('active', 'inactive', 'requires_auth', 'pending', 'failed', 'incomplete'), copay_amount DECIMAL(10,2), deductible_remaining DECIMAL(10,2), coverage_start_date DATE, coverage_end_date DATE, authorization_notes TEXT, insurance_plan VARCHAR(200), member_id VARCHAR(100), last_verified_at TIMESTAMPTZ, verification_source VARCHAR(50) (e.g., 'availity', 'change_healthcare', 'manual'), is_primary_insurance BOOLEAN DEFAULT TRUE, created_at, updated_at. Create insurance_verification_attempts table for retry tracking with fields: id, verification_id (FK to insurance_verifications), attempt_number INTEGER, api_provider VARCHAR(50), api_request_payload JSONB, api_response_payload JSONB, response_code VARCHAR(10), status ENUM('success', 'failed', 'timeout'), error_message TEXT, attempted_at TIMESTAMPTZ, retry_after TIMESTAMPTZ (for exponential backoff calculation). Add indexes on patient_id, appointment_id, last_verified_at, status for efficient queries. Add has_insurance_issue BOOLEAN column to patient_profiles for quick filtering. Create verification_status_enum and attempt_status_enum types. Include rollback script. Document tables in TABLE_DEFINITIONS.md with insurance verification workflow explanation.

## Dependent Tasks
- US-007: Core database tables (patient_profiles with insurance fields exists)

## Impacted Components
- **CREATE** database/migrations/V025__create_insurance_verifications.sql - Migration script
- **CREATE** database/rollback/rollback_V025.sql - Rollback script
- **MODIFY** database/schema/TABLE_DEFINITIONS.md - Document new tables

## Implementation Plan
1. **Create verification_status_enum**: CREATE TYPE verification_status AS ENUM ('active', 'inactive', 'requires_auth', 'pending', 'failed', 'incomplete'), add comment explaining each status
2. **Create attempt_status_enum**: CREATE TYPE attempt_status AS ENUM ('success', 'failed', 'timeout'), add comment
3. **Create insurance_verifications table**: Fields: id BIGSERIAL PRIMARY KEY, patient_id BIGINT NOT NULL FK to patient_profiles(id) ON DELETE CASCADE, appointment_id BIGINT NULLABLE FK to appointments(id) ON DELETE SET NULL, verification_date DATE NOT NULL, status verification_status NOT NULL DEFAULT 'pending', copay_amount DECIMAL(10,2), deductible_remaining DECIMAL(10,2), coverage_start_date DATE, coverage_end_date DATE, authorization_notes TEXT, insurance_plan VARCHAR(200), member_id VARCHAR(100), last_verified_at TIMESTAMPTZ, verification_source VARCHAR(50), is_primary_insurance BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
4. **Create insurance_verification_attempts table**: Fields: id BIGSERIAL PRIMARY KEY, verification_id BIGINT NOT NULL FK to insurance_verifications(id) ON DELETE CASCADE, attempt_number INTEGER NOT NULL CHECK (attempt_number BETWEEN 1 AND 3), api_provider VARCHAR(50), api_request_payload JSONB, api_response_payload JSONB, response_code VARCHAR(10), status attempt_status NOT NULL, error_message TEXT, attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, retry_after TIMESTAMPTZ (calculated as attempted_at + exponential backoff: 1min for attempt 1, 5min for attempt 2, 15min for attempt 3)
5. **Add patient_profiles column**: ALTER TABLE patient_profiles ADD COLUMN has_insurance_issue BOOLEAN DEFAULT FALSE, add comment explaining usage for quick filtering in staff queue
6. **Create indexes**: CREATE INDEX idx_insurance_verifications_patient ON insurance_verifications(patient_id), CREATE INDEX idx_insurance_verifications_appointment ON insurance_verifications(appointment_id), CREATE INDEX idx_insurance_verifications_status ON insurance_verifications(status) WHERE status IN ('inactive', 'requires_auth', 'failed'), CREATE INDEX idx_insurance_verifications_last_verified ON insurance_verifications(last_verified_at DESC), CREATE INDEX idx_insurance_verification_attempts_verification ON insurance_verification_attempts(verification_id, attempt_number), CREATE INDEX idx_insurance_verification_attempts_retry ON insurance_verification_attempts(retry_after) WHERE status = 'failed' AND retry_after IS NOT NULL
7. **Add foreign key constraints**: All FKs with proper ON DELETE actions, insurance_verifications.patient_id ON DELETE CASCADE (remove verifications if patient deleted), insurance_verifications.appointment_id ON DELETE SET NULL (keep verification even if appointment cancelled), insurance_verification_attempts.verification_id ON DELETE CASCADE
8. **Add check constraints**: CHECK copay_amount >= 0, CHECK deductible_remaining >= 0, CHECK coverage_start_date <= coverage_end_date, CHECK attempt_number BETWEEN 1 AND 3
9. **Add triggers**: CREATE TRIGGER update_insurance_verifications_updated_at BEFORE UPDATE ON insurance_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(), trigger to update patient_profiles.has_insurance_issue = TRUE when verification status changes to 'inactive', 'requires_auth', or 'failed'
10. **Create rollback script**: Drop tables in reverse order: insurance_verification_attempts, insurance_verifications, drop enums: verification_status, attempt_status, drop patient_profiles column has_insurance_issue
11. **Update TABLE_DEFINITIONS.md**: Document tables with field descriptions, verification workflow (scheduled job 24h before appointment → API call → store result → update patient flag → display in UI), retry logic explanation (3 attempts with 1min, 5min, 15min backoff), status enum meanings, example queries for staff queue filtering

**Focus on how to implement**: Verification status enum: `CREATE TYPE verification_status AS ENUM ('active', 'inactive', 'requires_auth', 'pending', 'failed', 'incomplete'); COMMENT ON TYPE verification_status IS 'Insurance verification status: active=covered, inactive=not covered, requires_auth=prior auth needed, pending=verification in progress, failed=API error, incomplete=missing insurance info';`. Insurance verifications table: `CREATE TABLE insurance_verifications (id BIGSERIAL PRIMARY KEY, patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE, appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL, verification_date DATE NOT NULL, status verification_status NOT NULL DEFAULT 'pending', copay_amount DECIMAL(10,2) CHECK (copay_amount >= 0), deductible_remaining DECIMAL(10,2) CHECK (deductible_remaining >= 0), coverage_start_date DATE, coverage_end_date DATE CHECK (coverage_end_date IS NULL OR coverage_start_date <= coverage_end_date), authorization_notes TEXT, insurance_plan VARCHAR(200), member_id VARCHAR(100), last_verified_at TIMESTAMPTZ, verification_source VARCHAR(50), is_primary_insurance BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);`. Verification attempts: `CREATE TABLE insurance_verification_attempts (id BIGSERIAL PRIMARY KEY, verification_id BIGINT NOT NULL REFERENCES insurance_verifications(id) ON DELETE CASCADE, attempt_number INTEGER NOT NULL CHECK (attempt_number BETWEEN 1 AND 3), api_provider VARCHAR(50), api_request_payload JSONB, api_response_payload JSONB, response_code VARCHAR(10), status attempt_status NOT NULL, error_message TEXT, attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, retry_after TIMESTAMPTZ);`. Patient flag: `ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS has_insurance_issue BOOLEAN DEFAULT FALSE; COMMENT ON COLUMN patient_profiles.has_insurance_issue IS 'Quick filter flag: TRUE if latest verification status is inactive, requires_auth, or failed';`. Update trigger: `CREATE OR REPLACE FUNCTION update_patient_insurance_issue() RETURNS TRIGGER AS $$ BEGIN IF NEW.status IN ('inactive', 'requires_auth', 'failed') THEN UPDATE patient_profiles SET has_insurance_issue = TRUE WHERE id = NEW.patient_id; ELSIF NEW.status = 'active' THEN UPDATE patient_profiles SET has_insurance_issue = FALSE WHERE id = NEW.patient_id; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql; CREATE TRIGGER trigger_update_patient_insurance_issue AFTER INSERT OR UPDATE OF status ON insurance_verifications FOR EACH ROW EXECUTE FUNCTION update_patient_insurance_issue();`.

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql (patient_profiles with insurance fields)
│   ├── V024__add_provider_schedules.sql (from US-036)
│   └── V025__create_insurance_verifications.sql (to be created)
└── rollback/
    └── rollback_V025.sql (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V025__create_insurance_verifications.sql | Migration for insurance verification tables |
| CREATE | database/rollback/rollback_V025.sql | Rollback script for V025 |
| MODIFY | database/schema/TABLE_DEFINITIONS.md | Document insurance verification tables |

## External References
- **PostgreSQL ENUM Types**: https://www.postgresql.org/docs/15/datatype-enum.html - Custom enum types
- **PostgreSQL DECIMAL**: https://www.postgresql.org/docs/15/datatype-numeric.html - Money amounts with precision
- **PostgreSQL Triggers**: https://www.postgresql.org/docs/15/trigger-definition.html - Auto-update patient flag
- **Foreign Key Actions**: https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-FK - ON DELETE CASCADE vs SET NULL

## Build Commands
- Run migration: `psql -U postgres -d appointment_db -f database/migrations/V025__create_insurance_verifications.sql`
- Rollback: `psql -U postgres -d appointment_db -f database/rollback/rollback_V025.sql`
- Verify: `psql -U postgres -d appointment_db -c "\d+ insurance_verifications; \d+ insurance_verification_attempts;"`

## Implementation Validation Strategy
- [x] Migration script runs without errors
- [x] verification_status enum created with 6 values
- [x] attempt_status enum created with 3 values
- [x] insurance_verifications table created with all fields
- [x] insurance_verification_attempts table created with retry tracking
- [x] patient_profiles.has_insurance_issue column added
- [x] All foreign key constraints created correctly (CASCADE and SET NULL)
- [x] Check constraints prevent negative amounts and invalid date ranges
- [x] Indexes created on patient_id, appointment_id, status, last_verified_at
- [x] Partial index on retry_after for failed attempts
- [x] Trigger auto-updates patient_profiles.has_insurance_issue
- [x] updated_at trigger works on insurance_verifications
- [x] Rollback script successfully reverses all changes
- [x] TABLE_DEFINITIONS.md updated with workflow documentation

## Implementation Checklist
- [ ] Create database/migrations/V025__create_insurance_verifications.sql file with header comment
- [ ] Create verification_status enum (CREATE TYPE verification_status AS ENUM with 6 values: active, inactive, requires_auth, pending, failed, incomplete, add COMMENT explaining each status meaning)
- [ ] Create attempt_status enum (CREATE TYPE attempt_status AS ENUM with 3 values: success, failed, timeout, add COMMENT)
- [ ] Create insurance_verifications table (id BIGSERIAL PRIMARY KEY, patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE, appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL, verification_date DATE NOT NULL, status verification_status NOT NULL DEFAULT 'pending', copay_amount DECIMAL(10,2) CHECK >= 0, deductible_remaining DECIMAL(10,2) CHECK >= 0, coverage_start_date DATE, coverage_end_date DATE CHECK <= coverage_start_date, authorization_notes TEXT, insurance_plan VARCHAR(200), member_id VARCHAR(100), last_verified_at TIMESTAMPTZ, verification_source VARCHAR(50), is_primary_insurance BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, add table and column comments)
- [ ] Create insurance_verification_attempts table (id BIGSERIAL PRIMARY KEY, verification_id BIGINT NOT NULL REFERENCES insurance_verifications(id) ON DELETE CASCADE, attempt_number INTEGER NOT NULL CHECK BETWEEN 1 AND 3, api_provider VARCHAR(50), api_request_payload JSONB, api_response_payload JSONB, response_code VARCHAR(10), status attempt_status NOT NULL, error_message TEXT, attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, retry_after TIMESTAMPTZ for exponential backoff, add comments)
- [ ] Alter patient_profiles table (ADD COLUMN has_insurance_issue BOOLEAN DEFAULT FALSE, add COMMENT explaining quick filter flag for staff queue)
- [ ] Create indexes (idx_insurance_verifications_patient on patient_id, idx_insurance_verifications_appointment on appointment_id, idx_insurance_verifications_status partial on status WHERE IN ('inactive', 'requires_auth', 'failed'), idx_insurance_verifications_last_verified on last_verified_at DESC, idx_insurance_verification_attempts_verification on verification_id and attempt_number, idx_insurance_verification_attempts_retry partial on retry_after WHERE status='failed' AND retry_after IS NOT NULL)
- [ ] Create function update_patient_insurance_issue (IF NEW.status IN ('inactive', 'requires_auth', 'failed') THEN UPDATE patient_profiles SET has_insurance_issue=TRUE WHERE id=NEW.patient_id ELSIF NEW.status='active' THEN SET has_insurance_issue=FALSE, return NEW, LANGUAGE plpgsql)
- [ ] Create trigger trigger_update_patient_insurance_issue (AFTER INSERT OR UPDATE OF status ON insurance_verifications FOR EACH ROW EXECUTE FUNCTION update_patient_insurance_issue())
- [ ] Create trigger update_insurance_verifications_updated_at (BEFORE UPDATE ON insurance_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column() assuming function exists from V001)
- [ ] Create database/rollback/rollback_V025.sql (DROP TABLE insurance_verification_attempts, DROP TABLE insurance_verifications, DROP TYPE verification_status, DROP TYPE attempt_status, ALTER TABLE patient_profiles DROP COLUMN has_insurance_issue, add success message)
- [ ] Update database/schema/TABLE_DEFINITIONS.md (add insurance_verifications section with all fields, data types, constraints, add insurance_verification_attempts section, explain verification workflow: scheduled job 24h before → API call → store result → retry if failed with exponential backoff 1min/5min/15min → update patient flag → display in queue, status enum meanings table, example queries for staff queue filtering has_insurance_issue=TRUE, retry queue WHERE retry_after <= NOW())
- [ ] Test migration runs successfully on clean database
- [ ] Test rollback script successfully reverses all changes
- [ ] Verify foreign key constraints work (test CASCADE delete, SET NULL on appointment delete)
- [ ] Verify check constraints prevent invalid data (test negative copay, invalid date range, attempt_number >3)
- [ ] Verify trigger auto-updates patient flag when verification status changes (INSERT with status='inactive' should set has_insurance_issue=TRUE)
