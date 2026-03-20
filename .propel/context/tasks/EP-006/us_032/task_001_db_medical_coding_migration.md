# Task - TASK_001: Database Migration for Medical Coding Storage

## Requirement Reference
- User Story: [us_032]
- Story Location: [.propel/context/tasks/us_032/us_032.md]
- Acceptance Criteria:
    - AC1: Save approved codes to Appointments table (icd10_codes JSON array)
    - AC1: Log all coding decisions to audit log with approver_staff_id
    - AC1: Mark coding as "Approved" or "Pending Review"
- Edge Case:
    - EC2: Combination codes → store primary + secondary codes array
    - EC3: No matching code → store "Best match" indicator

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
| Migration Tool | Custom SQL scripts | N/A |

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
Create PostgreSQL migration V022 to add medical coding storage fields. Add to appointments table: icd10_codes JSONB array storing approved ICD-10 codes with structure [{code, description, confidence_score, approved_by_staff_id, approved_at, is_auto_approved, alternatives_considered}], cpt_codes JSONB array with similar structure for procedure codes, coding_status enum ('Not Started', 'AI Generated', 'Pending Review', 'Approved', 'Rejected'), last_coded_at timestamp. Create medical_coding_audit table for decision tracking: audit_id (PK), appointment_id (FK), diagnosis_text, suggested_code, action_taken enum ('Approved', 'Rejected', 'Modified'), modified_to_code VARCHAR if changed, confidence_score decimal(5,2), performed_by_staff_id (FK), performed_at timestamp, rationale TEXT, alternatives_considered JSONB. Add indexes for query performance on appointment_id and coding_status. Add constraints to ensure confidence_score between 0-100, validate JSONB structure for code arrays.

## Dependent Tasks
- None (foundational migration)

## Impacted Components
- **CREATE** database/migrations/V022__add_medical_coding_fields.sql - New migration file
- **MODIFY** database/schema/TABLE_DEFINITIONS.md - Update appointments, add medical_coding_audit
- **MODIFY** database/schema/ERD_diagram.md - Update ERD with coding fields and audit table

## Implementation Plan
1. **Create V022 migration file**: Setup transaction for atomic changes
2. **Create coding_status_enum**: CREATE TYPE coding_status_enum AS ENUM ('Not Started', 'AI Generated', 'Pending Review', 'Approved', 'Rejected')
3. **Modify appointments table**: ALTER TABLE appointments ADD icd10_codes JSONB DEFAULT '[]', ADD cpt_codes JSONB DEFAULT '[]', ADD coding_status coding_status_enum DEFAULT 'Not Started', ADD last_coded_at TIMESTAMPTZ
4. **Define JSONB structure**: Document expected structure for icd10_codes: [{code: 'I10', description: 'Hypertension, unspecified', confidence_score: 98.5, approved_by_staff_id: 123, approved_at: timestamp, is_auto_approved: boolean, alternatives_considered: [{code, description, confidence_score}]}]
5. **Create medical_coding_audit table**: CREATE TABLE with columns: audit_id SERIAL PK, appointment_id INT NOT NULL REFERENCES appointments(appointment_id), diagnosis_text TEXT NOT NULL, suggested_code VARCHAR(20), action_taken action_taken_enum NOT NULL, modified_to_code VARCHAR(20), confidence_score DECIMAL(5,2), performed_by_staff_id INT REFERENCES users(user_id), performed_at TIMESTAMPTZ DEFAULT NOW(), rationale TEXT, alternatives_considered JSONB
6. **Create action_taken_enum**: CREATE TYPE action_taken_enum AS ENUM ('Approved', 'Rejected', 'Modified', 'Alternative Selected')
7. **Add indexes**: CREATE INDEX idx_appointments_coding_status ON appointments(coding_status), CREATE INDEX idx_medical_coding_audit_appointment ON medical_coding_audit(appointment_id, performed_at DESC), CREATE INDEX idx_appointments_last_coded ON appointments(last_coded_at) WHERE last_coded_at IS NOT NULL
8. **Add constraints**: CHECK constraint confidence_score BETWEEN 0 AND 100 on medical_coding_audit, CHECK constraint jsonb_typeof(icd10_codes) = 'array' on appointments to ensure array structure, CHECK constraint jsonb_typeof(cpt_codes) = 'array' on appointments
9. **Update TABLE_DEFINITIONS.md**: Document icd10_codes and cpt_codes JSONB structure with field explanations, document coding_status enum values and workflow, document medical_coding_audit table purpose and fields, include examples of JSONB data
10. **Update ERD_diagram.md**: Add icd10_codes, cpt_codes, coding_status, last_coded_at to appointments entity, add medical_coding_audit entity with FK relationship to appointments, show relationship to users table for performed_by_staff_id
11. **Add rollback script**: Add to database/rollback/rollback_all.sql to DROP columns, DROP table medical_coding_audit, DROP enum types in correct dependency order

**Focus on how to implement**: SQL migration with enum types first: `CREATE TYPE coding_status_enum AS ENUM ('Not Started', 'AI Generated', 'Pending Review', 'Approved', 'Rejected'); CREATE TYPE action_taken_enum AS ENUM ('Approved', 'Rejected', 'Modified', 'Alternative Selected');`. ALTER appointments: `ALTER TABLE appointments ADD COLUMN icd10_codes JSONB DEFAULT '[]', ADD COLUMN cpt_codes JSONB DEFAULT '[]', ADD COLUMN coding_status coding_status_enum DEFAULT 'Not Started', ADD COLUMN last_coded_at TIMESTAMPTZ;`. JSONB validation: `ALTER TABLE appointments ADD CONSTRAINT check_icd10_codes_array CHECK (jsonb_typeof(icd10_codes) = 'array'), ADD CONSTRAINT check_cpt_codes_array CHECK (jsonb_typeof(cpt_codes) = 'array');`. Audit table: `CREATE TABLE medical_coding_audit (audit_id SERIAL PRIMARY KEY, appointment_id INT NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE, diagnosis_text TEXT NOT NULL, suggested_code VARCHAR(20), action_taken action_taken_enum NOT NULL, modified_to_code VARCHAR(20), confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0 AND 100), performed_by_staff_id INT REFERENCES users(user_id), performed_at TIMESTAMPTZ DEFAULT NOW(), rationale TEXT, alternatives_considered JSONB);`. Indexes: `CREATE INDEX idx_appointments_coding_status ON appointments(coding_status); CREATE INDEX idx_medical_coding_audit_appointment ON medical_coding_audit(appointment_id, performed_at DESC);`.

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql
│   ├── ...
│   ├── V021__add_deduplication_tracking.sql (US_030)
│   └── (V022__add_medical_coding_fields.sql to be created)
├── schema/
│   ├── TABLE_DEFINITIONS.md (to be updated)
│   └── ERD_diagram.md (to be updated)
└── rollback/
    └── rollback_all.sql (to be updated)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V022__add_medical_coding_fields.sql | Add medical coding fields to appointments, create medical_coding_audit table |
| MODIFY | database/schema/TABLE_DEFINITIONS.md | Document new columns, JSONB structures, and audit table |
| MODIFY | database/schema/ERD_diagram.md | Update ERD with coding fields and relationships |
| MODIFY | database/rollback/rollback_all.sql | Add rollback commands for V022 migration |

## External References
- **PostgreSQL ENUM Types**: https://www.postgresql.org/docs/15/datatype-enum.html - Custom enum types
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/15/datatype-json.html - JSON data storage
- **PostgreSQL JSONB Functions**: https://www.postgresql.org/docs/15/functions-json.html - JSONB validation
- **ICD-10 Code Structure**: https://www.cms.gov/medicare/coding-billing/icd-10-codes - Medical coding standards

## Build Commands
- Run migration: `psql -U postgres -d clinical_platform -f database/migrations/V022__add_medical_coding_fields.sql`
- Or use migration script: `cd database/scripts && ./run_migrations.sh` (Linux) or `./run_migrations.ps1` (Windows)
- Verify migration: `psql -U postgres -d clinical_platform -c "\d appointments"` (check new columns)
- Test rollback: `psql -U postgres -d clinical_platform -f database/rollback/rollback_all.sql`

## Implementation Validation Strategy
- [x] Migration runs without errors on fresh database
- [x] appointments table has icd10_codes, cpt_codes, coding_status, last_coded_at columns
- [x] coding_status enum has 5 valid values
- [x] action_taken_enum has 4 valid values
- [x] medical_coding_audit table created with all audit fields
- [x] Indexes created on coding_status and appointment_id
- [x] CHECK constraints enforce valid ranges (confidence 0-100)
- [x] JSONB array type constraints work correctly
- [x] Foreign key constraints work with cascade deletes
- [x] Insert test data with JSONB code arrays validates structure
- [x] Query performance acceptable with indexes (test with EXPLAIN)
- [x] Rollback script successfully reverts all changes

## Implementation Checklist
- [ ] Create database/migrations/V022__add_medical_coding_fields.sql file with BEGIN/COMMIT transaction
- [ ] CREATE TYPE coding_status_enum AS ENUM ('Not Started', 'AI Generated', 'Pending Review', 'Approved', 'Rejected')
- [ ] CREATE TYPE action_taken_enum AS ENUM ('Approved', 'Rejected', 'Modified', 'Alternative Selected')
- [ ] ALTER TABLE appointments ADD icd10_codes JSONB DEFAULT '[]', ADD cpt_codes JSONB DEFAULT '[]', ADD coding_status coding_status_enum DEFAULT 'Not Started', ADD last_coded_at TIMESTAMPTZ
- [ ] Add JSONB array validation constraints on appointments (CHECK jsonb_typeof(icd10_codes) = 'array' AND jsonb_typeof(cpt_codes) = 'array')
- [ ] CREATE TABLE medical_coding_audit with all audit fields (audit_id, appointment_id, diagnosis_text, suggested_code, action_taken, modified_to_code, confidence_score with CHECK 0-100, performed_by_staff_id, performed_at, rationale, alternatives_considered JSONB)
- [ ] CREATE indexes: idx_appointments_coding_status, idx_medical_coding_audit_appointment (appointment_id, performed_at DESC), idx_appointments_last_coded (partial WHERE last_coded_at IS NOT NULL)
- [ ] Update database/schema/TABLE_DEFINITIONS.md (document icd10_codes JSONB structure example: [{code, description, confidence_score, approved_by_staff_id, approved_at, is_auto_approved, alternatives_considered}], document coding_status and action_taken enum values, document medical_coding_audit table purpose and fields)
- [ ] Update database/schema/ERD_diagram.md (add icd10_codes/cpt_codes/coding_status/last_coded_at to appointments entity, add medical_coding_audit entity with FK to appointments and users, show relationships)
- [ ] Add rollback commands to database/rollback/rollback_all.sql (DROP TABLE medical_coding_audit, ALTER TABLE appointments DROP COLUMN last_coded_at, DROP COLUMN coding_status, DROP COLUMN cpt_codes, DROP COLUMN icd10_codes, DROP TYPE action_taken_enum, DROP TYPE coding_status_enum)
- [ ] Test migration on local PostgreSQL 15.x (run V022 script, verify columns and table, insert test JSONB data, query with indexes, check constraints)
