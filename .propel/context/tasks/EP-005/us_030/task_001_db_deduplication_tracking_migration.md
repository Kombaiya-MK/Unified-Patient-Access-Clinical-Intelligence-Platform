# Task - TASK_001: Database Migration for Deduplication and Merge Tracking

## Requirement Reference
- User Story: [us_030]
- Story Location: [.propel/context/tasks/us_030/us_030.md]
- Acceptance Criteria:
    - AC1: Track merge decisions with source documents and rationale
    - AC1: Flag conflicting values for staff review with status="Conflict"
    - AC1: Create merged PatientProfile records
    - AC1: Log all merge decisions to audit log
- Edge Case:
    - EC1: Contradictory information → flag as conflicts for manual resolution
    - EC2: Medication dosage changes over time → keep as timeline entries
    - EC3: Low confidence deduplication → present side-by-side for manual decision

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
Create PostgreSQL migration V021 to add deduplication tracking fields. Add to patient_profiles: merged_from_documents JSONB array storing source document IDs and merge confidence scores, merge_status enum ('Single Source', 'Merged', 'Has Conflicts'), last_deduplicated_at timestamp, conflict_fields JSONB array storing conflicting data with field_name, values from different documents, resolution_status. Create data_merge_logs table for audit trail: merge_log_id (PK), patient_id (FK), merge_timestamp, algorithm_version, source_documents JSONB array, merge_decisions JSONB (field_name, merged_value, source_document_ids, confidence_score, merge_rationale), conflicts_detected JSONB array, performed_by enum ('System', 'Staff Manual'), staff_id FK nullable. Create field_conflicts table for tracking unresolved conflicts: conflict_id (PK), patient_id (FK), field_name, conflicting_values JSONB array with {value, source_document_id, confidence, extracted_date}, resolution_status enum ('Pending', 'Resolved', 'Dismissed'), resolved_by_staff_id FK nullable, resolved_at timestamp, resolution_notes text. Add medication_timeline table for temporal tracking: entry_id (PK), patient_id (FK), medication_name, dosage, frequency, start_date, end_date nullable, source_document_id FK, is_active boolean. Add indexes for query performance on patient_id and merge_status.

## Dependent Tasks
- None (foundational migration)

## Impacted Components
- **MODIFY** database/migrations/V021__add_deduplication_tracking.sql - New migration file
- **MODIFY** database/schema/TABLE_DEFINITIONS.md - Update patient_profiles, add data_merge_logs, field_conflicts, medication_timeline
- **MODIFY** database/schema/ERD_diagram.md - Update ERD with new tables and relationships

## Implementation Plan
1. **Create V021 migration file**: Setup transaction for atomic changes
2. **Modify patient_profiles table**: ALTER TABLE patient_profiles ADD COLUMN merged_from_documents JSONB DEFAULT '[]', ADD merge_status merge_status_enum DEFAULT 'Single Source', ADD last_deduplicated_at TIMESTAMPTZ, ADD conflict_fields JSONB DEFAULT '[]', CREATE TYPE merge_status_enum AS ENUM ('Single Source', 'Merged', 'Has Conflicts')
3. **Create data_merge_logs table**: CREATE TABLE data_merge_logs with columns: merge_log_id SERIAL PK, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id), merge_timestamp TIMESTAMPTZ DEFAULT NOW(), algorithm_version VARCHAR(20), source_documents JSONB NOT NULL (array of document_ids), merge_decisions JSONB (array of {field_name, merged_value, source_document_ids, confidence_score, merge_rationale}), conflicts_detected JSONB DEFAULT '[]', performed_by VARCHAR(20) CHECK (performed_by IN ('System', 'Staff Manual')), staff_id INT REFERENCES users(user_id)
4. **Create field_conflicts table**: CREATE TABLE field_conflicts with columns: conflict_id SERIAL PK, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id), field_name VARCHAR(100) NOT NULL, conflicting_values JSONB NOT NULL (array of {value, source_document_id, confidence, extracted_date}), resolution_status resolution_status_enum DEFAULT 'Pending', resolved_by_staff_id INT REFERENCES users(user_id), resolved_at TIMESTAMPTZ, resolution_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), CREATE TYPE resolution_status_enum AS ENUM ('Pending', 'Resolved', 'Dismissed')
5. **Create medication_timeline table**: CREATE TABLE medication_timeline with columns: entry_id SERIAL PK, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id), medication_name VARCHAR(200) NOT NULL, dosage VARCHAR(100), frequency VARCHAR(100), start_date DATE NOT NULL, end_date DATE, source_document_id INT REFERENCES clinical_documents(document_id), is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
6. **Add indexes**: CREATE INDEX idx_patient_merge_status ON patient_profiles(merge_status), CREATE INDEX idx_patient_has_conflicts ON patient_profiles(patient_id) WHERE merge_status = 'Has Conflicts', CREATE INDEX idx_merge_logs_patient ON data_merge_logs(patient_id, merge_timestamp DESC), CREATE INDEX idx_field_conflicts_patient ON field_conflicts(patient_id, resolution_status), CREATE INDEX idx_medication_timeline_patient ON medication_timeline(patient_id, is_active, start_date DESC)
7. **Add constraints**: CHECK constraint on field_conflicts requiring at least 2 conflicting values in array, CHECK constraint on medication_timeline start_date <= end_date
8. **Update TABLE_DEFINITIONS.md**: Document all new columns and tables with field descriptions, enum values meanings, JSONB structure examples for merged_from_documents, merge_decisions, conflicting_values
9. **Update ERD_diagram.md**: Add data_merge_logs, field_conflicts, medication_timeline entities, show relationships to patient_profiles and clinical_documents, add merged_from_documents, merge_status, conflict_fields to patient_profiles entity
10. **Add rollback script**: Add to database/rollback/rollback_all.sql to DROP tables, DROP columns, DROP enum types in correct dependency order

**Focus on how to implement**: SQL migration uses CREATE TYPE for enums first, then ALTER TABLE and CREATE TABLE. merge_status_enum: `CREATE TYPE merge_status_enum AS ENUM ('Single Source', 'Merged', 'Has Conflicts'); ALTER TABLE patient_profiles ADD COLUMN merged_from_documents JSONB DEFAULT '[]', ADD COLUMN merge_status merge_status_enum DEFAULT 'Single Source', ADD COLUMN last_deduplicated_at TIMESTAMPTZ, ADD COLUMN conflict_fields JSONB DEFAULT '[]';`. data_merge_logs: `CREATE TABLE data_merge_logs (merge_log_id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE, merge_timestamp TIMESTAMPTZ DEFAULT NOW(), algorithm_version VARCHAR(20), source_documents JSONB NOT NULL, merge_decisions JSONB, conflicts_detected JSONB DEFAULT '[]', performed_by VARCHAR(20) CHECK (performed_by IN ('System', 'Staff Manual')), staff_id INT REFERENCES users(user_id));`. field_conflicts: `CREATE TABLE field_conflicts (conflict_id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patient_profiles(profile_id) ON DELETE CASCADE, field_name VARCHAR(100) NOT NULL, conflicting_values JSONB NOT NULL, resolution_status resolution_status_enum DEFAULT 'Pending', resolved_by_staff_id INT REFERENCES users(user_id), resolved_at TIMESTAMPTZ, resolution_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), CONSTRAINT at_least_two_conflicts CHECK (jsonb_array_length(conflicting_values) >= 2));`. Indexes for performance: `CREATE INDEX idx_patient_merge_status ON patient_profiles(merge_status); CREATE INDEX idx_merge_logs_patient ON data_merge_logs(patient_id, merge_timestamp DESC); CREATE INDEX idx_field_conflicts_patient ON field_conflicts(patient_id, resolution_status);`.

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql
│   ├── ...
│   ├── V020__add_extraction_fields.sql (US_029)
│   └── (V021__add_deduplication_tracking.sql to be created)
├── schema/
│   ├── TABLE_DEFINITIONS.md (to be updated)
│   └── ERD_diagram.md (to be updated)
└── rollback/
    └── rollback_all.sql (to be updated)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V021__add_deduplication_tracking.sql | Add merge tracking fields to patient_profiles, create data_merge_logs, field_conflicts, medication_timeline tables |
| MODIFY | database/schema/TABLE_DEFINITIONS.md | Document new columns, tables, and JSONB structures |
| MODIFY | database/schema/ERD_diagram.md | Update ERD with deduplication tracking entities and relationships |
| MODIFY | database/rollback/rollback_all.sql | Add rollback commands for V021 migration |

## External References
- **PostgreSQL ENUM Types**: https://www.postgresql.org/docs/15/datatype-enum.html - Custom enum types
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/15/datatype-json.html - Store complex merge data
- **PostgreSQL Array Functions**: https://www.postgresql.org/docs/15/functions-array.html - JSONB array operations
- **PostgreSQL CHECK Constraints**: https://www.postgresql.org/docs/15/ddl-constraints.html - Validate conflict arrays

## Build Commands
- Run migration: `psql -U postgres -d clinical_platform -f database/migrations/V021__add_deduplication_tracking.sql`
- Or use migration script: `cd database/scripts && ./run_migrations.sh` (Linux) or `./run_migrations.ps1` (Windows)
- Verify migration: `psql -U postgres -d clinical_platform -c "\d patient_profiles"` (check new columns)
- Test rollback: `psql -U postgres -d clinical_platform -f database/rollback/rollback_all.sql`

## Implementation Validation Strategy
- [x] Migration runs without errors on fresh database
- [x] patient_profiles table has merged_from_documents, merge_status, last_deduplicated_at, conflict_fields columns
- [x] merge_status enum has 3 valid values
- [x] data_merge_logs table created with all audit fields
- [x] field_conflicts table created with resolution tracking
- [x] medication_timeline table created for temporal tracking
- [x] Indexes created on patient_id and merge_status
- [x] CHECK constraints enforce valid data (at least 2 conflicts, start_date <= end_date)
- [x] Foreign key constraints work with cascade deletes
- [x] Insert test data with JSONB structures validates correctly
- [x] Query performance acceptable with indexes (test with EXPLAIN)
- [x] Rollback script successfully reverts all changes

## Implementation Checklist
- [ ] Create database/migrations/V021__add_deduplication_tracking.sql file with BEGIN/COMMIT transaction
- [ ] Create merge_status_enum type (CREATE TYPE merge_status_enum AS ENUM ('Single Source', 'Merged', 'Has Conflicts'))
- [ ] Create resolution_status_enum type (CREATE TYPE resolution_status_enum AS ENUM ('Pending', 'Resolved', 'Dismissed'))
- [ ] ALTER TABLE patient_profiles ADD merged_from_documents JSONB DEFAULT '[]', ADD merge_status merge_status_enum DEFAULT 'Single Source', ADD last_deduplicated_at TIMESTAMPTZ, ADD conflict_fields JSONB DEFAULT '[]'
- [ ] CREATE TABLE data_merge_logs with all audit fields (merge_log_id, patient_id, merge_timestamp, algorithm_version, source_documents JSONB, merge_decisions JSONB, conflicts_detected JSONB, performed_by with CHECK constraint, staff_id)
- [ ] CREATE TABLE field_conflicts with conflict tracking fields (conflict_id, patient_id, field_name, conflicting_values JSONB, resolution_status, resolved_by_staff_id, resolved_at, resolution_notes, created_at, CHECK constraint for at least 2 conflicts)
- [ ] CREATE TABLE medication_timeline for temporal medication tracking (entry_id, patient_id, medication_name, dosage, frequency, start_date, end_date, source_document_id, is_active, created_at, CHECK constraint start_date <= end_date)
- [ ] CREATE indexes: idx_patient_merge_status, idx_patient_has_conflicts (partial WHERE merge_status='Has Conflicts'), idx_merge_logs_patient, idx_field_conflicts_patient, idx_medication_timeline_patient
- [ ] Update database/schema/TABLE_DEFINITIONS.md (document all new tables, columns, enum values, JSONB structure examples for merged_from_documents: [{document_id, confidence_score, extracted_date}], merge_decisions: [{field_name, merged_value, source_document_ids[], confidence, rationale}], conflicting_values: [{value, source_document_id, confidence, extracted_date}])
- [ ] Update database/schema/ERD_diagram.md (add data_merge_logs, field_conflicts, medication_timeline entities, show FK relationships to patient_profiles and clinical_documents, update patient_profiles with merge tracking fields)
- [ ] Add rollback commands to database/rollback/rollback_all.sql (DROP TABLE medication_timeline, field_conflicts, data_merge_logs, ALTER TABLE patient_profiles DROP COLUMN conflict_fields, DROP COLUMN last_deduplicated_at, DROP COLUMN merge_status, DROP COLUMN merged_from_documents, DROP TYPE resolution_status_enum, DROP TYPE merge_status_enum)
- [ ] Test migration on local PostgreSQL 15.x (run V021 script, verify tables and columns, insert test data with JSONB, query with indexes, check constraints)
