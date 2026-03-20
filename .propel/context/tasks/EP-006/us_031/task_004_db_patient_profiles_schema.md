# Task - task_004_db_patient_profiles_schema

## Requirement Reference
- User Story: us_031
- Story Location: .propel/context/tasks/us_031/us_031.md
- Acceptance Criteria:
    - **AC-1 Profile Storage**: System stores unified patient profiles with sections: Demographics, Chief Complaint, Medical History, Current Medications, Allergies, Lab Results, Previous Visits
    - **AC-1 Aggregation Efficiency**: Query optimization for fast profile generation (<1 second for patients with <100 documents)
    - **AC-1 Metadata Tracking**: Store source document IDs, confidence scores, "Last Updated" timestamps per data point
    - **AC-1 Conflict Storage**: Store detected conflicts with severity, resolution status, staff actions
- Edge Case:
    - **Profile Versioning**: Maintain profile snapshots for audit trail when conflicts resolved or data updated

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A (Database schema task) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Wireframe Status Legend:**
> - **N/A**: Database schema task, no UI impact

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- N/A (Database task)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Database | PostgreSQL | 15.x |
| Extensions | pgvector (for future AI enhancements) | 0.5.x |
| Migration | Flyway / Liquibase / Custom Node scripts | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No (stores AI-extracted data but no AI processing) |
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
Create database schema for storing unified patient profiles, including PatientProfiles table with JSONB columns for structured sections (Demographics, Medical History, Medications, Allergies, Lab Results, Visits), ProfileConflicts table for tracking data mismatches, and ProfileVersions table for audit trail. Implement aggregation views and optimized queries for fast profile generation (<1 second target). Add indexes on patient_id, last_updated timestamp, and JSONB paths for efficient filtering. Create database migration scripts with rollback support. Schema supports metadata tracking (source document IDs, confidence scores, timestamps) and conflict management (severity, resolution status, staff actions).

## Dependent Tasks
- US-007 (PatientProfiles table - may extend existing schema or create new)
- US-029 (Document extraction - ClinicalDocuments table with extracted data)
- US-030 (Deduplication - deduplicated records)
- task_002_be_patient_profile_generation_api (uses schema and aggregation queries)
- task_003_be_conflict_detection_service (writes to ProfileConflicts table)

## Impacted Components
- **NEW**: `database/migrations/V006__create_patient_profiles_unified.sql` - Create PatientProfiles, ProfileConflicts, ProfileVersions tables
- **NEW**: `database/migrations/V007__add_profile_indexes.sql` - Add indexes for query optimization
- **NEW**: `database/views/vw_unified_patient_profile.sql` - Aggregation view joining ClinicalDocuments, intake, deduplication
- **NEW**: `database/functions/fn_generate_patient_profile.sql` - Stored function aggregating data from multiple sources
- **NEW**: `database/functions/fn_detect_profile_conflicts.sql` - Stored function identifying conflicts
- **NEW**: `database/rollback/rollback_patient_profiles.sql` - Rollback script for migrations
- **MODIFY**: `database/schema/README.md` - Document schema changes and query patterns

## Implementation Plan
1. **Create PatientProfiles table**: Columns: profile_id (UUID PK), patient_id (FK to Patients), demographics (JSONB), medical_history (JSONB array), current_medications (JSONB array), allergies (JSONB array), lab_results (JSONB array), previous_visits (JSONB array), last_calculated (timestamp), version (integer)
2. **Create ProfileConflicts table**: Columns: conflict_id (UUID PK), profile_id (FK), field_name (varchar), conflicting_sources (JSONB array), severity (enum: critical/warning), resolution_status (enum: pending/resolved/dismissed), staff_action (text), resolved_at (timestamp), resolved_by (FK to Users)
3. **Create ProfileVersions table**: Columns: version_id (UUID PK), profile_id (FK), profile_data (JSONB full snapshot), created_at (timestamp), created_by (FK to Users), change_reason (text) - for audit trail
4. **Add indexes for optimization**: Index on (patient_id, last_calculated), GIN index on JSONB columns for path searches (demographics->>'dob', medications @> '[{"drug": "aspirin"}]'), B-tree index on ProfileConflicts(resolution_status, severity)
5. **Create aggregation view**: vw_unified_patient_profile joining ClinicalDocuments, deduplicated records, intake forms, returning unified data structure ready for API consumption
6. **Implement generate_patient_profile function**: PostgreSQL function accepting patient_id, querying multiple tables, applying data prioritization logic, returning unified profile JSONB
7. **Create detect_profile_conflicts function**: PostgreSQL function comparing field values across sources, identifying mismatches, inserting into ProfileConflicts table, returning conflict metadata
8. **Add foreign key constraints**: profile_id references Patients(patient_id) ON DELETE CASCADE, conflict_id references ProfileConflicts ON UPDATE CASCADE
9. **Implement migration scripts**: Flyway/Liquibase migration V006 for table creation, V007 for indexes, include rollback scripts for downgrade
10. **Document query patterns**: Add README with example queries (get profile, detect conflicts, aggregate lab trends), performance benchmarks (<1s for <100 documents)

**Focus on how to implement**:
- PatientProfiles schema: `CREATE TABLE PatientProfiles ( profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES Patients(patient_id) ON DELETE CASCADE, demographics JSONB, medical_history JSONB, current_medications JSONB, allergies JSONB, lab_results JSONB, previous_visits JSONB, last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(), version INTEGER DEFAULT 1, UNIQUE(patient_id) );`
- JSONB structure: `demographics: { name, dob, gender, address, contact, insurance, source: { document_id, confidence, updated_at } }`
- Medications JSONB: `[{ drug: "Aspirin", dosage: "100mg", frequency: "daily", last_updated: "2026-02-15", source: { document_id: "doc-123", confidence: 0.95 } }]`
- Indexes: `CREATE INDEX idx_profiles_patient ON PatientProfiles(patient_id, last_calculated); CREATE INDEX idx_profiles_demographics_gin ON PatientProfiles USING GIN (demographics);`
- Aggregation view: `CREATE VIEW vw_unified_patient_profile AS SELECT p.patient_id, jsonb_agg(cd.extracted_data) AS documents, i.intake_data FROM Patients p LEFT JOIN ClinicalDocuments cd ON cd.patient_id = p.patient_id LEFT JOIN IntakeForms i ON i.patient_id = p.patient_id GROUP BY p.patient_id;`
- Stored function: `CREATE FUNCTION fn_generate_patient_profile(p_patient_id UUID) RETURNS JSONB AS $$ DECLARE result JSONB; BEGIN SELECT jsonb_build_object('demographics', ..., 'medications', ...) INTO result FROM vw_unified_patient_profile WHERE patient_id = p_patient_id; RETURN result; END; $$ LANGUAGE plpgsql;`
- Migration script: `-- V006__create_patient_profiles_unified.sql \n CREATE TABLE IF NOT EXISTS PatientProfiles (...); \n CREATE TABLE IF NOT EXISTS ProfileConflicts (...);`
- Rollback: `-- rollback_patient_profiles.sql \n DROP TABLE IF EXISTS ProfileVersions CASCADE; \n DROP TABLE IF EXISTS ProfileConflicts CASCADE; \n DROP TABLE IF EXISTS PatientProfiles CASCADE;`

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql (existing)
│   ├── V002__create_appointment_tables.sql (existing)
│   └── (to create: V006__create_patient_profiles_unified.sql, V007__add_profile_indexes.sql)
├── views/
│   └── (to create: vw_unified_patient_profile.sql)
├── functions/
│   └── (to create: fn_generate_patient_profile.sql, fn_detect_profile_conflicts.sql)
├── rollback/
│   └── (to create: rollback_patient_profiles.sql)
└── schema/
    └── README.md (to modify: document profile schema)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V006__create_patient_profiles_unified.sql | Migration: CREATE TABLE PatientProfiles (profile_id, patient_id FK, demographics JSONB, medical_history JSONB, medications JSONB, allergies JSONB, lab_results JSONB, visits JSONB, last_calculated, version); CREATE TABLE ProfileConflicts (conflict_id, profile_id FK, field_name, conflicting_sources JSONB, severity enum, resolution_status, staff_action, resolved_at, resolved_by FK Users); CREATE TABLE ProfileVersions (version_id, profile_id FK, profile_data JSONB, created_at, created_by FK, change_reason) |
| CREATE | database/migrations/V007__add_profile_indexes.sql | Migration: CREATE INDEX idx_profiles_patient ON PatientProfiles(patient_id, last_calculated); CREATE INDEX idx_profiles_demographics_gin ON PatientProfiles USING GIN (demographics); CREATE INDEX idx_profiles_medications_gin ON PatientProfiles USING GIN (current_medications); CREATE INDEX idx_conflicts_status ON ProfileConflicts(resolution_status, severity) |
| CREATE | database/views/vw_unified_patient_profile.sql | Aggregation view: LEFT JOIN ClinicalDocuments, IntakeForms, DeduplicatedRecords on patient_id, jsonb_agg documents, return unified structure ready for API |
| CREATE | database/functions/fn_generate_patient_profile.sql | Stored function: FUNCTION fn_generate_patient_profile(p_patient_id UUID) RETURNS JSONB; query vw_unified_patient_profile, apply data prioritization (most recent for meds, historical for labs), return structured JSONB |
| CREATE | database/functions/fn_detect_profile_conflicts.sql | Stored function: FUNCTION fn_detect_profile_conflicts(p_profile_id UUID) RETURNS TABLE(conflict_metadata JSONB); compare field values across sources, identify mismatches, INSERT INTO ProfileConflicts, return conflict array |
| CREATE | database/rollback/rollback_patient_profiles.sql | Rollback script: DROP TABLE ProfileVersions CASCADE; DROP TABLE ProfileConflicts CASCADE; DROP TABLE PatientProfiles CASCADE; DROP VIEW vw_unified_patient_profile; DROP FUNCTION fn_generate_patient_profile; DROP FUNCTION fn_detect_profile_conflicts |
| MODIFY | database/schema/README.md | Documentation: Add schema diagrams for PatientProfiles/ProfileConflicts/ProfileVersions tables, example queries (SELECT * FROM vw_unified_patient_profile WHERE patient_id = ?), performance benchmarks (<1s for <100 docs), JSONB path query examples |

## External References
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/15/datatype-json.html (JSONB data type, operators, indexes)
- **PostgreSQL Indexing**: https://www.postgresql.org/docs/15/indexes.html (B-tree, GIN indexes for JSONB)
- **PostgreSQL Stored Functions**: https://www.postgresql.org/docs/15/plpgsql.html (PL/pgSQL language, function parameters, RETURNS)
- **Flyway Migrations**: https://flywaydb.org/documentation/ (Migration versioning, rollback patterns)
- **Query Optimization**: https://www.postgresql.org/docs/15/performance-tips.html (EXPLAIN ANALYZE, index strategies)
- **DR-001 to DR-010**: .propel/context/docs/design.md#data-requirements (Data requirements: referential integrity, versioning, audit trail)

## Build Commands
```bash
# Run migrations (development)
cd database
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Test migration (dry run)
npm run migrate:dry-run

# Run SQL scripts manually
psql -U postgres -d appointment_platform -f migrations/V006__create_patient_profiles_unified.sql

# Validate schema
psql -U postgres -d appointment_platform -c "\d PatientProfiles"
psql -U postgres -d appointment_platform -c "\d+ ProfileConflicts"
```

## Implementation Checklist
- [ ] Create V006 migration: PatientProfiles table (profile_id UUID PK, patient_id FK, demographics/medical_history/medications/allergies/lab_results/visits JSONB, last_calculated timestamp, version integer, UNIQUE patient_id)
- [ ] Create ProfileConflicts table: conflict_id UUID PK, profile_id FK, field_name varchar, conflicting_sources JSONB array, severity enum (critical/warning), resolution_status enum (pending/resolved/dismissed), staff_action text, resolved_at/resolved_by
- [ ] Create ProfileVersions table for audit trail: version_id UUID PK, profile_id FK, profile_data JSONB full snapshot, created_at, created_by FK Users, change_reason text
- [ ] Create V007 migration with indexes: B-tree on (patient_id, last_calculated), GIN on demographics/medications/lab_results JSONB columns, B-tree on ProfileConflicts(resolution_status, severity)
- [ ] Implement vw_unified_patient_profile aggregation view: LEFT JOIN ClinicalDocuments, IntakeForms, DeduplicatedRecords on patient_id, jsonb_agg documents grouped by patient_id
- [ ] Create fn_generate_patient_profile stored function: accept patient_id UUID, query aggregation view, apply data prioritization rules (most recent for changeable fields), return unified JSONB
- [ ] Implement fn_detect_profile_conflicts stored function: accept profile_id, compare field values across sources, INSERT conflicts into ProfileConflicts table, return conflict metadata array
- [ ] Add rollback script: DROP TABLE ProfileVersions/ProfileConflicts/PatientProfiles CASCADE, DROP VIEW vw_unified_patient_profile, DROP FUNCTION stored functions for safe downgrade
