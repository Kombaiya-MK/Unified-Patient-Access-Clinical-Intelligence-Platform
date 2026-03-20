# Task - TASK_001_DB_NOSHOW_RISK_SCHEMA

## Requirement Reference
- User Story: US_038
- Story Location: .propel/context/tasks/us_038/us_038.md
- Acceptance Criteria:
    - System stores risk score (0-100%) in appointments table (no_show_risk_score, risk_category)
    - Risk categories: Low Risk (<20%), Medium Risk (20-50%), High Risk (>50%)
    - Risk score updates after each appointment outcome
- Edge Case:
    - Brand new patients with no history use population average risk ~15%, marked as "New Patient - Baseline Risk"
    - Patients with perfect attendance have risk score floor at 5% minimum with "Reliable Patient" tag

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
| Frontend | N/A | N/A |
| Backend | N/A | N/A |
| Database | PostgreSQL | 15.x |
| AI/ML | N/A | N/A |

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

> **Note**: Database schema only - ML model implemented in task_002

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Add no-show risk assessment columns to appointments table: (1) no_show_risk_score INTEGER (0-100 range), (2) risk_category VARCHAR(10) CHECK constraint ('low', 'medium', 'high'), (3) risk_calculated_at TIMESTAMPTZ for tracking when risk was last computed, (4) risk_factors JSONB for storing contributing factors breakdown (e.g., {"previous_noshows": 25, "weekend_appointment": 10, "insurance_issue": 15}), (5) Add indexes for efficient queries filtering by risk_category and risk_score, (6) Provide rollback script reversing all schema changes.

## Dependent Tasks
- None (schema changes first)

## Impacted Components
- database/migrations/V026__add_noshow_risk_columns.sql - New migration script
- database/rollback/ - Rollback script for V026
- appointments table - Add 4 new columns

## Implementation Plan
1. Create migration V026__add_noshow_risk_columns.sql with:
   - ALTER TABLE appointments ADD COLUMN no_show_risk_score INTEGER DEFAULT NULL CHECK (no_show_risk_score >= 0 AND no_show_risk_score <= 100)
   - ALTER TABLE appointments ADD COLUMN risk_category VARCHAR(10) DEFAULT NULL CHECK (risk_category IN ('low', 'medium', 'high'))
   - ALTER TABLE appointments ADD COLUMN risk_calculated_at TIMESTAMPTZ DEFAULT NULL
   - ALTER TABLE appointments ADD COLUMN risk_factors JSONB DEFAULT '{}'::jsonb
   - COMMENT statements explaining each column
2. Create indexes:
   - CREATE INDEX idx_appointments_risk_category ON appointments(risk_category) WHERE risk_category IS NOT NULL
   - CREATE INDEX idx_appointments_risk_score ON appointments(no_show_risk_score DESC) WHERE no_show_risk_score IS NOT NULL
   - CREATE INDEX idx_appointments_risk_calculated ON appointments(risk_calculated_at DESC)
3. Create rollback script database/rollback/rollback_V026__add_noshow_risk_columns.sql:
   - DROP INDEX idx_appointments_risk_calculated
   - DROP INDEX idx_appointments_risk_score
   - DROP INDEX idx_appointments_risk_category
   - ALTER TABLE appointments DROP COLUMN risk_factors, DROP COLUMN risk_calculated_at, DROP COLUMN risk_category, DROP COLUMN no_show_risk_score
4. Test migration: Run against test database, verify columns exist, verify constraints enforced

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql (users, departments, patient_profiles)
│   ├── V002__create_appointment_tables.sql (appointments table with status)
│   ├── ...
│   ├── V014__create_sms_log_table.sql (latest actual migration)
│   └── V026__add_noshow_risk_columns.sql (to be created)
└── rollback/
    └── rollback_V026__add_noshow_risk_columns.sql (to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V026__add_noshow_risk_columns.sql | Migration adding no_show_risk_score, risk_category, risk_calculated_at, risk_factors columns to appointments table with indexes |
| CREATE | database/rollback/rollback_V026__add_noshow_risk_columns.sql | Rollback script removing all V026 schema changes |

## External References
- [PostgreSQL CHECK Constraints](https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS)
- [PostgreSQL JSONB Type](https://www.postgresql.org/docs/15/datatype-json.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/15/indexes.html)

## Build Commands
```bash
# Run migration
psql -U postgres -d appointment_db -f database/migrations/V026__add_noshow_risk_columns.sql

# Verify columns exist
psql -U postgres -d appointment_db -c "\d appointments"

# Test rollback
psql -U postgres -d appointment_db -f database/rollback/rollback_V026__add_noshow_risk_columns.sql
```

## Implementation Validation Strategy
- [ ] Migration script runs without errors
- [ ] All 4 columns exist: `\d appointments` shows no_show_risk_score, risk_category, risk_calculated_at, risk_factors
- [ ] CHECK constraint enforced: INSERT with risk_score=150 fails
- [ ] CHECK constraint enforced: INSERT with risk_category='invalid' fails
- [ ] Indexes created: `\di appointments*` shows 3 new indexes
- [ ] JSONB column accepts valid JSON: UPDATE appointments SET risk_factors='{"test": 10}'::jsonb succeeds
- [ ] Rollback script reverses all changes: After rollback, columns and indexes removed
- [ ] Performance test: Query with WHERE risk_category='high' uses index (EXPLAIN ANALYZE)

## Implementation Checklist
- [ ] Create database/migrations/V026__add_noshow_risk_columns.sql file with header comment
- [ ] Add no_show_risk_score column with INTEGER type, CHECK (0-100), DEFAULT NULL
- [ ] Add risk_category column with VARCHAR(10), CHECK ('low', 'medium', 'high'), DEFAULT NULL
- [ ] Add risk_calculated_at column with TIMESTAMPTZ, DEFAULT NULL
- [ ] Add risk_factors column with JSONB type, DEFAULT '{}'::jsonb
- [ ] Add COMMENT statements for all 4 new columns
- [ ] Create idx_appointments_risk_category partial index (WHERE risk_category IS NOT NULL)
- [ ] Create idx_appointments_risk_score descending partial index (WHERE no_show_risk_score IS NOT NULL)
- [ ] Create idx_appointments_risk_calculated descending index
- [ ] Create database/rollback/rollback_V026__add_noshow_risk_columns.sql with DROP INDEX and DROP COLUMN statements
- [ ] Test migration on local database: psql -f V026__add_noshow_risk_columns.sql
- [ ] Verify columns exist: \d appointments shows 4 new columns
- [ ] Test CHECK constraints: INSERT invalid values (risk_score=150, category='invalid') → should fail
- [ ] Test JSONB column: UPDATE appointments SET risk_factors='{"previous_noshows": 25}'::jsonb
- [ ] Verify indexes: \di appointments* shows 3 new indexes
- [ ] Test rollback script: psql -f rollback_V026__add_noshow_risk_columns.sql → columns removed
- [ ] Document migration in database/README.md
- [ ] Commit migration script to version control
