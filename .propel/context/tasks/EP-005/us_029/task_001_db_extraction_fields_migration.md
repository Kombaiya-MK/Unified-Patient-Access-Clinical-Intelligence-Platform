# Task - TASK_001: Database Migration for Document Extraction Fields

## Requirement Reference
- User Story: [us_029]
- Story Location: [.propel/context/tasks/us_029/us_029.md]
- Acceptance Criteria:
    - AC1: Store extracted data in PatientProfiles table with document_id reference
    - AC1: Update document status to "Processed"/"Needs Review"/"Extraction Failed"
    - AC1: Track extraction_completed_at timestamp
- Edge Case:
    - N/A (Database migration)

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
Create PostgreSQL migration V020 to add extraction tracking fields to clinical_documents table: extraction_status enum ('Uploaded', 'Processing', 'Processed', 'Needs Review', 'Extraction Failed'), extraction_completed_at timestamp, extraction_confidence decimal(5,2) for overall confidence score, extraction_error text for failure messages, needs_manual_review boolean default false. Add extracted_data JSONB column to patient_profiles table to store structured medical data extracted from documents with document_id reference. Create extraction_logs table for audit trail: log_id (PK), document_id (FK to clinical_documents), extraction_attempt int, attempted_at timestamp, status, confidence_scores JSONB (per-field confidence), error_message text, processing_duration_ms int, api_response_raw JSONB.

## Dependent Tasks
- None (foundational migration)

## Impacted Components
- **MODIFY** database/migrations/V020__add_extraction_fields.sql - New migration file
- **MODIFY** database/schema/TABLE_DEFINITIONS.md - Update clinical_documents, patient_profiles, add extraction_logs
- **MODIFY** database/schema/ERD_diagram.md - Update ERD with new columns and extraction_logs table

## Implementation Plan
1. **Create V020 migration file**: ALTER TABLE clinical_documents ADD COLUMN extraction_status, ADD extraction_completed_at, ADD extraction_confidence, ADD extraction_error, ADD needs_manual_review, CREATE TYPE extraction_status_enum
2. **Modify patient_profiles table**: ALTER TABLE patient_profiles ADD COLUMN extracted_data JSONB with structure: {patient_name, date_of_birth, document_date, diagnosed_conditions[], prescribed_medications[{name, dosage, frequency}], lab_test_results[{test_name, value, unit, reference_range}], allergies[], provider_name, facility_name}, ADD document_id FK constraint
3. **Create extraction_logs table**: CREATE TABLE extraction_logs with columns log_id SERIAL PK, document_id INT FK, extraction_attempt INT, attempted_at TIMESTAMPTZ DEFAULT NOW(), status, confidence_scores JSONB, error_message TEXT, processing_duration_ms INT, api_response_raw JSONB, INDEX on document_id and attempted_at for query performance
4. **Update TABLE_DEFINITIONS.md**: Document extraction_status enum values and their meanings (Uploaded: just uploaded awaiting extraction, Processing: AI extraction in progress, Processed: successfully extracted >90% confidence, Needs Review: extracted but <90% confidence on some fields requires manual review, Extraction Failed: AI API error or illegible document), document extracted_data JSONB schema with all medical data fields, document extraction_logs audit trail purpose
5. **Update ERD_diagram.md**: Add extraction_status, extraction_completed_at, extraction_confidence, extraction_error, needs_manual_review to clinical_documents entity, add extracted_data to patient_profiles entity, add extraction_logs entity with relationships: extraction_logs.document_id references clinical_documents.document_id (one-to-many)
6. **Add indexes**: CREATE INDEX idx_documents_extraction_status ON clinical_documents(extraction_status) for queue filtering, CREATE INDEX idx_documents_needs_review ON clinical_documents(needs_manual_review) WHERE needs_manual_review=true for staff review queue, CREATE INDEX idx_extraction_logs_document ON extraction_logs(document_id, attempted_at DESC) for retrieval
7. **Add constraints**: CHECK constraint extraction_confidence BETWEEN 0 AND 100, CHECK constraint extraction_attempt > 0, CHECK constraint processing_duration_ms >= 0
8. **Rollback script**: Add to database/rollback/rollback_all.sql to DROP columns, DROP table extraction_logs, DROP TYPE extraction_status_enum

**Focus on how to implement**: SQL migration uses ALTER TABLE for existing tables, CREATE TABLE for new extraction_logs audit table. extraction_status enum: `CREATE TYPE extraction_status_enum AS ENUM ('Uploaded', 'Processing', 'Processed', 'Needs Review', 'Extraction Failed'); ALTER TABLE clinical_documents ADD COLUMN extraction_status extraction_status_enum DEFAULT 'Uploaded', ADD COLUMN extraction_completed_at TIMESTAMPTZ, ADD COLUMN extraction_confidence DECIMAL(5,2), ADD COLUMN extraction_error TEXT, ADD COLUMN needs_manual_review BOOLEAN DEFAULT FALSE;`. patient_profiles extracted_data: `ALTER TABLE patient_profiles ADD COLUMN extracted_data JSONB, ADD COLUMN source_document_id INT REFERENCES clinical_documents(document_id);`. Indexes for performance: `CREATE INDEX idx_documents_extraction_status ON clinical_documents(extraction_status); CREATE INDEX idx_documents_needs_review ON clinical_documents(needs_manual_review) WHERE needs_manual_review=true;`. extraction_logs for audit: `CREATE TABLE extraction_logs (log_id SERIAL PRIMARY KEY, document_id INT NOT NULL REFERENCES clinical_documents(document_id) ON DELETE CASCADE, extraction_attempt INT NOT NULL, attempted_at TIMESTAMPTZ DEFAULT NOW(), status extraction_status_enum NOT NULL, confidence_scores JSONB, error_message TEXT, processing_duration_ms INT, api_response_raw JSONB);`.

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql
│   ├── ...
│   ├── V019__draft_intake_fields.sql (US_026)
│   └── (V020__add_extraction_fields.sql to be created)
├── schema/
│   ├── TABLE_DEFINITIONS.md (to be updated)
│   └── ERD_diagram.md (to be updated)
└── rollback/
    └── rollback_all.sql (to be updated)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V020__add_extraction_fields.sql | Add extraction fields to clinical_documents, extracted_data to patient_profiles, create extraction_logs table |
| MODIFY | database/schema/TABLE_DEFINITIONS.md | Document new columns and extraction_logs table schema |
| MODIFY | database/schema/ERD_diagram.md | Update ERD with extraction tracking fields and relationships |
| MODIFY | database/rollback/rollback_all.sql | Add rollback commands for V020 migration |

## External References
- **PostgreSQL ENUM Types**: https://www.postgresql.org/docs/15/datatype-enum.html - Create custom enum types
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/15/datatype-json.html - JSON data type for extracted_data
- **PostgreSQL Indexes**: https://www.postgresql.org/docs/15/indexes.html - Performance optimization
- **PostgreSQL CHECK Constraints**: https://www.postgresql.org/docs/15/ddl-constraints.html - Data validation

## Build Commands
- Run migration: `psql -U postgres -d clinical_platform -f database/migrations/V020__add_extraction_fields.sql`
- Or use migration script: `cd database/scripts && ./run_migrations.sh` (Linux) or `./run_migrations.ps1` (Windows)
- Verify migration: `psql -U postgres -d clinical_platform -c "\d clinical_documents"` (check new columns)
- Test rollback: `psql -U postgres -d clinical_platform -f database/rollback/rollback_all.sql`

## Implementation Validation Strategy
- [x] Migration runs without errors on fresh database
- [x] clinical_documents table has extraction_status, extraction_completed_at, extraction_confidence, extraction_error, needs_manual_review columns
- [x] extraction_status enum has 5 valid values
- [x] patient_profiles table has extracted_data JSONB and source_document_id FK columns
- [x] extraction_logs table created with all specified columns
- [x] Indexes created on extraction_status and needs_manual_review
- [x] CHECK constraints enforce valid ranges (confidence 0-100, attempt >0, duration >=0)
- [x] Foreign key constraints work (cascade delete on extraction_logs)
- [x] Insert test data with extracted_data JSONB validates structure
- [x] Rollback script successfully reverts all changes

## Implementation Checklist
- [ ] Create database/migrations/V020__add_extraction_fields.sql file
- [ ] Create extraction_status_enum type with 5 values (CREATE TYPE extraction_status_enum AS ENUM ('Uploaded', 'Processing', 'Processed', 'Needs Review', 'Extraction Failed'))
- [ ] ALTER TABLE clinical_documents ADD extraction_status extraction_status_enum DEFAULT 'Uploaded', ADD extraction_completed_at TIMESTAMPTZ, ADD extraction_confidence DECIMAL(5,2), ADD extraction_error TEXT, ADD needs_manual_review BOOLEAN DEFAULT FALSE
- [ ] ALTER TABLE patient_profiles ADD extracted_data JSONB with comment explaining structure, ADD source_document_id INT REFERENCES clinical_documents(document_id)
- [ ] CREATE TABLE extraction_logs with all audit fields (log_id, document_id, extraction_attempt, attempted_at, status, confidence_scores JSONB, error_message, processing_duration_ms, api_response_raw JSONB)
- [ ] CREATE indexes: idx_documents_extraction_status, idx_documents_needs_review (partial index WHERE needs_manual_review=true), idx_extraction_logs_document
- [ ] ADD CHECK constraints: extraction_confidence BETWEEN 0 AND 100, extraction_attempt > 0 in extraction_logs, processing_duration_ms >= 0
- [ ] Update database/schema/TABLE_DEFINITIONS.md with new columns and extraction_logs table definition (document field purposes, data types, constraints)
- [ ] Update database/schema/ERD_diagram.md with new fields in clinical_documents and patient_profiles entities, add extraction_logs entity with relationship lines
- [ ] Add rollback commands to database/rollback/rollback_all.sql (DROP columns, DROP TABLE extraction_logs, DROP TYPE extraction_status_enum in correct order)
- [ ] Test migration on local PostgreSQL 15.x (run V020 script, verify columns, insert test data, query extraction_logs)
- [ ] Verify indexes created and used in query plans (EXPLAIN SELECT * FROM clinical_documents WHERE extraction_status = 'Needs Review')
