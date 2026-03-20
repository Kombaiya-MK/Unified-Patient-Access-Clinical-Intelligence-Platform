# Task - TASK_001: Database Migration for Medication Conflict Tracking

## Requirement Reference
- User Story: [us_033]
- Story Location: [.propel/context/tasks/us_033/us_033.md]
- Acceptance Criteria:
    - AC1: Log all conflict checks to audit log with timestamp and checked_by_staff_id
    - AC1: Track override reasons for critical conflicts
    - AC1: Store conflict detection results with severity levels
- Edge Case:
    - EC1: Unrecognized medication → store partial match attempts
    - EC2: Dosage-dependent interactions → track dosage thresholds
    - EC3: No allergy data → log verification status

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
Create PostgreSQL migration V023 to add medication conflict tracking. Create medication_conflicts table: conflict_id (PK), patient_id (FK), conflict_type enum ('Drug-Drug', 'Drug-Allergy', 'Drug-Condition'), medications_involved JSONB array [{medication_name, dosage, frequency}], severity_level INT (1-5 scale), interaction_mechanism TEXT, clinical_guidance TEXT, detected_at TIMESTAMPTZ, checked_by_staff_id (FK), conflict_status enum ('Active', 'Overridden', 'Resolved'), override_reason TEXT nullable, override_by_staff_id (FK) nullable, override_at TIMESTAMPTZ nullable. Create conflict_check_audit table: audit_id (PK), patient_id (FK), medications_checked JSONB array, allergies_checked JSONB array, conditions_checked JSONB array, conflicts_detected_count INT, highest_severity INT, check_performed_at TIMESTAMPTZ, checked_by enum ('System', 'Staff Manual'), staff_id FK nullable, ai_response_raw JSONB for debugging. Add has_active_conflicts boolean to patient_profiles for quick filtering. Add indexes on patient_id, conflict_status, severity_level for performance.

## Dependent Tasks
- None (foundational migration)

## Impacted Components
- **CREATE** database/migrations/V023__add_medication_conflict_tracking.sql - New migration file
- **MODIFY** database/schema/TABLE_DEFINITIONS.md - Add medication_conflicts, conflict_check_audit tables
- **MODIFY** database/schema/ERD_diagram.md - Update ERD with conflict tracking relationships

## Implementation Plan
1. **Create V023 migration file**: BEGIN transaction for atomic changes
2. **Create conflict_type_enum**: CREATE TYPE conflict_type_enum AS ENUM ('Drug-Drug', 'Drug-Allergy', 'Drug-Condition', 'Drug-Condition-Dosage')
3. **Create conflict_status_enum**: CREATE TYPE conflict_status_enum AS ENUM ('Active', 'Overridden', 'Resolved', 'Acknowledged')
4. **Create medication_conflicts table**: CREATE TABLE with columns: conflict_id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE, conflict_type conflict_type_enum NOT NULL, medications_involved JSONB NOT NULL (array of {medication_name, dosage, frequency, source_document_id}), severity_level INT NOT NULL CHECK (severity_level BETWEEN 1 AND 5), interaction_mechanism TEXT NOT NULL, clinical_guidance TEXT NOT NULL, detected_at TIMESTAMPTZ DEFAULT NOW(), checked_by_staff_id INT REFERENCES users(user_id), conflict_status conflict_status_enum DEFAULT 'Active', override_reason TEXT, override_by_staff_id INT REFERENCES users(user_id), override_at TIMESTAMPTZ, dosage_threshold VARCHAR(50) for dosage-dependent interactions
5. **Create conflict_check_audit table**: CREATE TABLE with columns: audit_id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE, medications_checked JSONB NOT NULL (array of medication objects), allergies_checked JSONB DEFAULT '[]', conditions_checked JSONB DEFAULT '[]', conflicts_detected_count INT DEFAULT 0, highest_severity INT, no_allergy_warning BOOLEAN DEFAULT FALSE, check_performed_at TIMESTAMPTZ DEFAULT NOW(), checked_by VARCHAR(20) CHECK (checked_by IN ('System', 'Staff Manual')), staff_id INT REFERENCES users(user_id), ai_response_raw JSONB for debugging and reprocessing
6. **Modify patient_profiles table**: ALTER TABLE patient_profiles ADD COLUMN has_active_conflicts BOOLEAN DEFAULT FALSE, ADD COLUMN last_conflict_check_at TIMESTAMPTZ
7. **Add indexes**: CREATE INDEX idx_medication_conflicts_patient ON medication_conflicts(patient_id, conflict_status, severity_level DESC), CREATE INDEX idx_medication_conflicts_active ON medication_conflicts(patient_id) WHERE conflict_status = 'Active', CREATE INDEX idx_conflict_check_audit_patient ON conflict_check_audit(patient_id, check_performed_at DESC), CREATE INDEX idx_patient_profiles_has_conflicts ON patient_profiles(has_active_conflicts) WHERE has_active_conflicts = true
8. **Add constraints**: CHECK constraint severity_level BETWEEN 1 AND 5, CHECK constraint conflicts_detected_count >= 0, CHECK constraint override_reason NOT NULL when conflict_status = 'Overridden', CONSTRAINT require_override_reason CHECK ((conflict_status = 'Overridden' AND override_reason IS NOT NULL) OR (conflict_status != 'Overridden'))
9. **Update TABLE_DEFINITIONS.md**: Document medication_conflicts table structure with severity scale (1=Minor, 2=Moderate, 3=Major, 4=Severe, 5=Critical), document conflict_check_audit purpose for compliance tracking, document JSONB structures with examples for medications_involved, allergies_checked, conditions_checked, document conflict resolution workflow states
10. **Update ERD_diagram.md**: Add medication_conflicts and conflict_check_audit entities, show FK relationships to patient_profiles and users, add has_active_conflicts to patient_profiles entity, show relationship between conflict overrides and staff users
11. **Add rollback script**: Add to database/rollback/rollback_all.sql to DROP tables, DROP columns from patient_profiles, DROP enum types in correct dependency order

**Focus on how to implement**: Enum types first: `CREATE TYPE conflict_type_enum AS ENUM ('Drug-Drug', 'Drug-Allergy', 'Drug-Condition', 'Drug-Condition-Dosage'); CREATE TYPE conflict_status_enum AS ENUM ('Active', 'Overridden', 'Resolved', 'Acknowledged');`. Conflicts table: `CREATE TABLE medication_conflicts (conflict_id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE, conflict_type conflict_type_enum NOT NULL, medications_involved JSONB NOT NULL, severity_level INT NOT NULL CHECK (severity_level BETWEEN 1 AND 5), interaction_mechanism TEXT NOT NULL, clinical_guidance TEXT NOT NULL, detected_at TIMESTAMPTZ DEFAULT NOW(), checked_by_staff_id INT REFERENCES users(user_id), conflict_status conflict_status_enum DEFAULT 'Active', override_reason TEXT, override_by_staff_id INT REFERENCES users(user_id), override_at TIMESTAMPTZ, dosage_threshold VARCHAR(50), CONSTRAINT require_override_reason CHECK ((conflict_status = 'Overridden' AND override_reason IS NOT NULL) OR (conflict_status != 'Overridden')));`. Audit table: `CREATE TABLE conflict_check_audit (audit_id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE, medications_checked JSONB NOT NULL, allergies_checked JSONB DEFAULT '[]', conditions_checked JSONB DEFAULT '[]', conflicts_detected_count INT DEFAULT 0 CHECK (conflicts_detected_count >= 0), highest_severity INT CHECK (highest_severity BETWEEN 1 AND 5), no_allergy_warning BOOLEAN DEFAULT FALSE, check_performed_at TIMESTAMPTZ DEFAULT NOW(), checked_by VARCHAR(20) CHECK (checked_by IN ('System', 'Staff Manual')), staff_id INT REFERENCES users(user_id), ai_response_raw JSONB);`. Patient profiles: `ALTER TABLE patient_profiles ADD COLUMN has_active_conflicts BOOLEAN DEFAULT FALSE, ADD COLUMN last_conflict_check_at TIMESTAMPTZ;`. Indexes: `CREATE INDEX idx_medication_conflicts_patient ON medication_conflicts(patient_id, conflict_status, severity_level DESC); CREATE INDEX idx_medication_conflicts_active ON medication_conflicts(patient_id) WHERE conflict_status = 'Active';`.

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql
│   ├── ...
│   ├── V022__add_medical_coding_fields.sql (US_032)
│   └── (V023__add_medication_conflict_tracking.sql to be created)
├── schema/
│   ├── TABLE_DEFINITIONS.md (to be updated)
│   └── ERD_diagram.md (to be updated)
└── rollback/
    └── rollback_all.sql (to be updated)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V023__add_medication_conflict_tracking.sql | Create conflict tracking tables and patient profile fields |
| MODIFY | database/schema/TABLE_DEFINITIONS.md | Document conflict tables, enums, and JSONB structures |
| MODIFY | database/schema/ERD_diagram.md | Update ERD with conflict tracking entities |
| MODIFY | database/rollback/rollback_all.sql | Add rollback commands for V023 migration |

## External References
- **PostgreSQL ENUM Types**: https://www.postgresql.org/docs/15/datatype-enum.html - Custom enum types
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/15/datatype-json.html - Store medication lists
- **PostgreSQL CHECK Constraints**: https://www.postgresql.org/docs/15/ddl-constraints.html - Conditional validation
- **Drug Interaction Severity Scale**: https://www.fda.gov/drugs/drug-interactions-labeling - FDA severity classifications

## Build Commands
- Run migration: `psql -U postgres -d clinical_platform -f database/migrations/V023__add_medication_conflict_tracking.sql`
- Or use migration script: `cd database/scripts && ./run_migrations.sh` (Linux) or `./run_migrations.ps1` (Windows)
- Verify migration: `psql -U postgres -d clinical_platform -c "\d medication_conflicts"` (check new table)
- Test rollback: `psql -U postgres -d clinical_platform -f database/rollback/rollback_all.sql`

## Implementation Validation Strategy
- [x] Migration runs without errors on fresh database
- [x] medication_conflicts table created with all fields
- [x] conflict_type_enum has 4 valid values
- [x] conflict_status_enum has 4 valid values
- [x] conflict_check_audit table created with audit fields
- [x] patient_profiles has has_active_conflicts and last_conflict_check_at columns
- [x] Indexes created on patient_id, conflict_status, severity_level
- [x] CHECK constraints enforce valid severity (1-5) and conflicts_detected_count >= 0
- [x] Conditional constraint requires override_reason when status='Overridden'
- [x] Foreign key constraints work with cascade deletes
- [x] Insert test data with JSONB medications_involved validates structure
- [x] Query performance acceptable with indexes (test with EXPLAIN)
- [x] Rollback script successfully reverts all changes

## Implementation Checklist
- [ ] Create database/migrations/V023__add_medication_conflict_tracking.sql file with BEGIN/COMMIT transaction
- [ ] CREATE TYPE conflict_type_enum AS ENUM ('Drug-Drug', 'Drug-Allergy', 'Drug-Condition', 'Drug-Condition-Dosage')
- [ ] CREATE TYPE conflict_status_enum AS ENUM ('Active', 'Overridden', 'Resolved', 'Acknowledged')
- [ ] CREATE TABLE medication_conflicts with all fields (conflict_id, patient_id, conflict_type, medications_involved JSONB, severity_level with CHECK 1-5, interaction_mechanism, clinical_guidance, detected_at, checked_by_staff_id, conflict_status, override_reason, override_by_staff_id, override_at, dosage_threshold, CONSTRAINT require_override_reason)
- [ ] CREATE TABLE conflict_check_audit with audit fields (audit_id, patient_id, medications_checked JSONB, allergies_checked JSONB, conditions_checked JSONB, conflicts_detected_count with CHECK >=0, highest_severity with CHECK 1-5, no_allergy_warning, check_performed_at, checked_by with CHECK System/Staff Manual, staff_id, ai_response_raw JSONB)
- [ ] ALTER TABLE patient_profiles ADD has_active_conflicts BOOLEAN DEFAULT FALSE, ADD last_conflict_check_at TIMESTAMPTZ
- [ ] CREATE indexes: idx_medication_conflicts_patient (patient_id, conflict_status, severity_level DESC), idx_medication_conflicts_active (partial WHERE conflict_status='Active'), idx_conflict_check_audit_patient (patient_id, check_performed_at DESC), idx_patient_profiles_has_conflicts (partial WHERE has_active_conflicts=true)
- [ ] Update database/schema/TABLE_DEFINITIONS.md (document medication_conflicts with severity scale 1-5 meanings: 1=Minor, 2=Moderate, 3=Major, 4=Severe, 5=Critical, document conflict_check_audit for compliance, document JSONB structure examples for medications_involved: [{medication_name, dosage, frequency, source_document_id}], allergies_checked, conditions_checked, document conflict resolution workflow states)
- [ ] Update database/schema/ERD_diagram.md (add medication_conflicts and conflict_check_audit entities, show FK to patient_profiles and users, add has_active_conflicts/last_conflict_check_at to patient_profiles, show override relationships to staff users)
- [ ] Add rollback commands to database/rollback/rollback_all.sql (DROP TABLE conflict_check_audit, DROP TABLE medication_conflicts, ALTER TABLE patient_profiles DROP COLUMN last_conflict_check_at, DROP COLUMN has_active_conflicts, DROP TYPE conflict_status_enum, DROP TYPE conflict_type_enum)
- [ ] Test migration on local PostgreSQL 15.x (run V023 script, verify tables and columns, insert test JSONB data, test CHECK constraints, verify conditional constraint for override_reason, query with indexes, check FK constraints)
