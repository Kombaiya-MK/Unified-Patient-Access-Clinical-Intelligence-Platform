# Task - TASK_001: Database Migration for No-Show Fields

## Requirement Reference
- User Story: [us_024]
- Story Location: [.propel/context/tasks/us_024/us_024.md]
- Acceptance Criteria:
    - AC1: Update status to "No Show", record no_show_marked_at timestamp and marked_by_staff_id, increment patient's no_show_count
- Edge Case:
    - EC1: Allow staff to revert no-show within 2 hours (need to track no_show_marked_at for undo window)
    - EC2: Excused no-shows don't increment count (need excused_no_show flag)

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
Create migration V016__add_noshow_fields.sql to add no-show tracking fields to appointments and patients tables. For appointments table: add no_show_marked_at TIMESTAMP, marked_by_staff_id UUID (FK to users.id), no_show_notes TEXT, excused_no_show BOOLEAN DEFAULT FALSE. For patients table: add no_show_count INTEGER DEFAULT 0, risk_score INTEGER DEFAULT 0. Create indexes on no_show_marked_at for undo window queries and risk_score for risk-based filtering. Add CHECK constraint risk_score BETWEEN 0 AND 100.

## Dependent Tasks
- US-007: Appointments and patients tables (base schema must exist)
- NONE (first task for US_024, establishes database schema)

## Impacted Components
- **CREATE** database/migrations/V016__add_noshow_fields.sql - Migration file adding no-show tracking columns and indexes

## Implementation Plan
1. **Alter appointments table**: ADD COLUMN no_show_marked_at TIMESTAMP, ADD COLUMN marked_by_staff_id UUID REFERENCES users(id) ON DELETE SET NULL, ADD COLUMN no_show_notes TEXT, ADD COLUMN excused_no_show BOOLEAN DEFAULT FALSE
2. **Alter patients table**: ADD COLUMN no_show_count INTEGER DEFAULT 0 CHECK (no_show_count >= 0), ADD COLUMN risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100)
3. **Create indexes**: CREATE INDEX idx_appointments_no_show_marked_at ON appointments(no_show_marked_at) WHERE status = 'no_show' AND no_show_marked_at IS NOT NULL (for undo window queries within 2 hours)
4. **Create indexes**: CREATE INDEX idx_patients_risk_score ON patients(risk_score) WHERE risk_score > 0 (for high-risk patient filtering)
5. **Create indexes**: CREATE INDEX idx_patients_no_show_count ON patients(no_show_count) WHERE no_show_count > 0 (for no-show history queries)
6. **Add comments**: COMMENT ON COLUMN appointments.excused_no_show IS 'If true, no-show is excused and does not increment patient no_show_count or affect risk_score'
7. **Add comments**: COMMENT ON COLUMN patients.risk_score IS 'Calculated risk score 0-100, increases with no-shows, affects booking priority and restrictions'

**Focus on how to implement**: Migration uses ALTER TABLE with multiple ADD COLUMN statements. Foreign key marked_by_staff_id references users(id) with ON DELETE SET NULL (if staff account deleted, no-show record preserved with NULL staff_id). CHECK constraints ensure non-negative no_show_count and risk_score within 0-100 range. Partial indexes used for performance (only indexes rows matching WHERE condition). excused_no_show flag differentiates regular vs excused no-shows for different business logic handling. no_show_marked_at used to calculate undo window (NOW() - no_show_marked_at < INTERVAL '2 hours').

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql (users, patients tables)
│   ├── V002__create_appointment_tables.sql (appointments table base)
│   ├── V013__add_walkin_fields.sql (US_021)
│   ├── V014__create_sms_log_table.sql (US_021)
│   ├── V015__add_staff_booking_columns.sql (US_023)
│   └── (V016__add_noshow_fields.sql to be created)
└── scripts/
    └── run_migrations.ps1 (PowerShell script for applying migrations)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V016__add_noshow_fields.sql | Add 4 columns to appointments (no_show_marked_at, marked_by_staff_id, no_show_notes, excused_no_show), 2 columns to patients (no_show_count, risk_score), 3 partial indexes |

## External References
- **PostgreSQL ALTER TABLE**: https://www.postgresql.org/docs/15/sql-altertable.html - Adding columns to existing tables
- **PostgreSQL CHECK Constraints**: https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS - Value range validation
- **PostgreSQL Partial Indexes**: https://www.postgresql.org/docs/15/indexes-partial.html - Indexes with WHERE clause for query optimization
- **PostgreSQL Foreign Keys**: https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-FK - ON DELETE SET NULL behavior
- **PostgreSQL Comments**: https://www.postgresql.org/docs/15/sql-comment.html - Adding documentation to columns

## Build Commands
- Run migration: `.\database\scripts\run_migrations.ps1` (applies V016 migration)
- Verify migration: `psql -U postgres -d appointment_db -c "\d appointments"` (check appointments table schema)
- Verify migration: `psql -U postgres -d appointment_db -c "\d patients"` (check patients table schema)
- Check indexes: `psql -U postgres -d appointment_db -c "\di+ idx_appointments_no_show_marked_at"` (verify index created)

## Implementation Validation Strategy
- [x] Migration runs without errors
- [x] Appointments table has 4 new columns: no_show_marked_at, marked_by_staff_id, no_show_notes, excused_no_show
- [x] Patients table has 2 new columns: no_show_count, risk_score
- [x] CHECK constraint on risk_score prevents values outside 0-100 range
- [x] CHECK constraint on no_show_count prevents negative values
- [x] Foreign key on marked_by_staff_id references users(id)
- [x] Partial indexes created and used by query planner (EXPLAIN output shows index usage)
- [x] Default values applied correctly (excused_no_show=FALSE, no_show_count=0, risk_score=0)

## Implementation Checklist
- [ ] Create V016__add_noshow_fields.sql file in database/migrations directory
- [ ] Write ALTER TABLE appointments ADD COLUMN no_show_marked_at TIMESTAMP NULL (nullable, only set when no-show marked)
- [ ] Write ALTER TABLE appointments ADD COLUMN marked_by_staff_id UUID REFERENCES users(id) ON DELETE SET NULL (FK to staff who marked no-show)
- [ ] Write ALTER TABLE appointments ADD COLUMN no_show_notes TEXT NULL (optional notes about no-show reason)
- [ ] Write ALTER TABLE appointments ADD COLUMN excused_no_show BOOLEAN DEFAULT FALSE NOT NULL (flag for excused vs regular no-show)
- [ ] Write ALTER TABLE patients ADD COLUMN no_show_count INTEGER DEFAULT 0 NOT NULL CHECK (no_show_count >= 0) (cumulative no-show counter)
- [ ] Write ALTER TABLE patients ADD COLUMN risk_score INTEGER DEFAULT 0 NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100) (0-100 risk assessment score)
- [ ] Create partial index: CREATE INDEX idx_appointments_no_show_marked_at ON appointments(no_show_marked_at) WHERE status = 'no_show' AND no_show_marked_at IS NOT NULL (optimize undo window queries)
- [ ] Create partial index: CREATE INDEX idx_patients_risk_score ON patients(risk_score) WHERE risk_score > 0 (optimize high-risk patient queries)
- [ ] Create partial index: CREATE INDEX idx_patients_no_show_count ON patients(no_show_count) WHERE no_show_count > 0 (optimize no-show history queries)
- [ ] Add column comments: COMMENT ON COLUMN appointments.excused_no_show, COMMENT ON COLUMN patients.risk_score documenting business logic
- [ ] Run migration using .\database\scripts\run_migrations.ps1
- [ ] Verify schema changes with \d appointments and \d patients commands
