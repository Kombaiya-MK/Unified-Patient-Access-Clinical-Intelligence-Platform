# Task - TASK_002_DB_SCHEMA_TABLES_CREATION

## Requirement Reference
- User Story: US_003  
- Story Location: `.propel/context/tasks/us_003/us_003.md`
- Acceptance Criteria:
    - AC2: Database initialized, all core tables (Users, Appointments, ClinicalDocuments, PatientProfiles, AuditLogs, Departments, TimeSlots, Waitlist, Notifications) created with proper foreign key constraints
- Edge Cases:
    - Migrations fail midway: Rollback to last successful migration, log error details

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

> **Note**: Database schema - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | N/A | N/A |
| Database | PostgreSQL | 15+ |
| Database | pgvector | 0.5.0+ |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Partial (embedding columns) |
| **AIR Requirements** | N/A |
| **AI Pattern** | Vector storage for AI embeddings |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Schema includes vector columns for AI features

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend database only

## Task Overview
Design and implement complete database schema for UPACI platform including all core tables with proper relationships, constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK), indexes, and vector columns. Create comprehensive SQL migration scripts that are transactional and rollback-safe. Include seed data for development and testing environments.

## Dependent Tasks
- TASK_001_DB_POSTGRESQL_PGVECTOR_SETUP: Database and pgvector must be installed first

## Impacted Components
**New:**
- database/migrations/V001__create_core_tables.sql (all table definitions)
- database/migrations/V002__create_indexes.sql (performance indexes)
- database/migrations/V003__create_constraints.sql (foreign keys, checks)
- database/migrations/V004__create_vector_columns.sql (pgvector embedding fields)
- database/seeds/dev_seed_data.sql (development test data)
- database/schema/ERD_diagram.md (entity relationship documentation)
- database/schema/TABLE_DEFINITIONS.md (detailed table specifications)

## Implementation Plan
1. **Core Tables Design**: Define schema for Users, Departments, PatientProfiles, AuditLogs
2. **Appointment System Tables**: Appointments, TimeSlots, Waitlist tables with relationships
3. **Clinical Data Tables**: ClinicalDocuments, Medications, Allergies tables
4. **Notification System**: Notifications table for alerts and reminders
5. **Vector Columns**: Add embedding columns (vector(1536)) to ClinicalDocuments table for AI search
6. **Primary Keys**: Use BIGSERIAL for all id columns to support large datasets
7. **Foreign Keys**: Establish relationships (appointments.patient_id → patient_profiles.id, ON DELETE CASCADE/RESTRICT)
8. **Constraints**: Add CHECK constraints (appointment_date >= CURRENT_DATE, status IN ('pending', 'confirmed', 'cancelled'))
9. **Indexes**: Create B-tree indexes on foreign keys, timestamps, status columns
10. **Vector Indexes**: Create IVFFlat indexes on vector columns for fast similarity search
11. **Transactional Migrations**: Wrap each migration in BEGIN/COMMIT with ROLLBACK on error
12. **Seed Data**: Insert test users (admin, doctor, patient), departments, sample appointments

## Current Project State
```
ASSIGNMENT/
├── app/                      # Frontend (US_001)
├── server/                   # Backend API (US_002)
└── database/                 # Database setup (TASK_001)
    ├── install/
    ├── scripts/
    └── docs/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V001__create_core_tables.sql | Users, Departments, PatientProfiles, AuditLogs tables |
| CREATE | database/migrations/V002__create_appointment_tables.sql | Appointments, TimeSlots, Waitlist tables |
| CREATE | database/migrations/V003__create_clinical_tables.sql | ClinicalDocuments, Medications, Allergies tables |
| CREATE | database/migrations/V004__create_notification_tables.sql | Notifications table |
| CREATE | database/migrations/V005__create_indexes.sql | B-tree indexes on FKs, timestamps, status columns |
| CREATE | database/migrations/V006__create_vector_indexes.sql | IVFFlat indexes on vector columns (embedding) |
| CREATE | database/migrations/V007__add_constraints.sql | Foreign keys, check constraints, unique constraints |
| CREATE | database/migrations/V008__add_vector_columns.sql | Add embedding vector(1536) to ClinicalDocuments |
| CREATE | database/seeds/dev_seed_data.sql | Test users, departments, appointments for development |
| CREATE | database/schema/ERD_diagram.md | Entity relationship diagram (Mermaid syntax) |
| CREATE | database/schema/TABLE_DEFINITIONS.md | Detailed table specs (columns, types, constraints) |
| CREATE | database/rollback/rollback_all.sql | Rollback script to drop all tables in correct order |
| CREATE | database/scripts/run_migrations.sh | Bash script to execute migrations sequentially |
| CREATE | database/scripts/run_migrations.ps1 | PowerShell script to execute migrations on Windows |

> All files created as new - no existing schema

## External References
- [PostgreSQL Data Types](https://www.postgresql.org/docs/15/datatype.html)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/15/ddl-constraints.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/15/indexes.html)
- [pgvector Index Types (IVFFlat, HNSW)](https://github.com/pgvector/pgvector#indexing)
- [Database Migration Best Practices](https://www.postgresql.org/docs/15/sql-begin.html)
- [Foreign Key Cascade Actions](https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-FK)
- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/15/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [Mermaid ERD Syntax](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)

## Build Commands
```bash
# Run all migrations (Linux/Mac)
cd database/scripts
chmod +x run_migrations.sh
./run_migrations.sh

# Run all migrations (Windows PowerShell)
cd database\scripts
.\run_migrations.ps1

# Run single migration manually
psql -U upaci_user -d upaci -f database/migrations/V001__create_core_tables.sql

# Rollback all changes (development only)
psql -U upaci_user -d upaci -f database/rollback/rollback_all.sql

# Load seed data
psql -U upaci_user -d upaci -f database/seeds/dev_seed_data.sql

# Verify tables created
psql -U upaci_user -d upaci -c "\dt"

# Verify foreign keys
psql -U upaci_user -d upaci -c "SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"

# Verify indexes
psql -U upaci_user -d upaci -c "\di"

# Check vector columns
psql -U upaci_user -d upaci -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='clinical_documents' AND data_type='USER-DEFINED';"
```

## Implementation Validation Strategy
- [x] Unit tests pass (N/A for DDL scripts)
- [x] Integration tests pass (migration execution tests)
- [x] All 9 core tables created: `\dt` in psql shows Users, Appointments, ClinicalDocuments, PatientProfiles, AuditLogs, Departments, TimeSlots, Waitlist, Notifications
- [x] Primary keys on all tables: `SELECT * FROM information_schema.table_constraints WHERE constraint_type='PRIMARY KEY';` returns 9 rows
- [x] Foreign keys established: Query information_schema.table_constraints shows FK relationships
- [x] Check constraints working: Try inserting invalid data (past appointment_date) → should fail
- [x] Unique constraints enforced: Try inserting duplicate email → should fail
- [x] Indexes created: `\di` shows indexes on foreign keys, timestamps, status columns
- [x] Vector columns exist: clinical_documents.embedding column has type vector(1536)
- [x] Vector indexes created: `\di` shows IVFFlat index on clinical_documents.embedding
- [x] Transactional migrations: Introduce error in migration → verify rollback occurs
- [x] Seed data loads: Run dev_seed_data.sql → verify users, departments, appointments inserted
- [x] ERD diagram complete: Mermaid syntax renders correctly, shows all relationships
- [x] Table definitions documented: TABLE_DEFINITIONS.md has all columns, types, constraints
- [x] Cascade actions work: Delete parent record → verify child records deleted (if ON DELETE CASCADE)

## Implementation Checklist
- [x] Create database/migrations/ directory for version-controlled SQL scripts
- [x] Design Users table (id BIGSERIAL, email VARCHAR UNIQUE, password_hash, role ENUM, created_at TIMESTAMPTZ)
- [x] Design Departments table (id BIGSERIAL, name VARCHAR, code VARCHAR UNIQUE, active BOOLEAN)
- [x] Design PatientProfiles table (id BIGSERIAL, user_id FK, date_of_birth DATE, medical_record_number VARCHAR UNIQUE)
- [x] Design Appointments table (id BIGSERIAL, patient_id FK, doctor_id FK, department_id FK, appointment_date TIMESTAMPTZ, status VARCHAR)
- [x] Design TimeSlots table (id BIGSERIAL, doctor_id FK, department_id FK, slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ, available BOOLEAN)
- [x] Design Waitlist table (id BIGSERIAL, patient_id FK, department_id FK, requested_date DATE, priority INT)
- [x] Design ClinicalDocuments table (id BIGSERIAL, patient_id FK, appointment_id FK, document_type VARCHAR, content TEXT, embedding vector(1536))
- [x] Design AuditLogs table (id BIGSERIAL, user_id FK, action VARCHAR, table_name VARCHAR, record_id BIGINT, timestamp TIMESTAMPTZ)
- [x] Design Notifications table (id BIGSERIAL, user_id FK, type VARCHAR, message TEXT, read BOOLEAN, sent_at TIMESTAMPTZ)
- [x] Write V001__create_core_tables.sql: BEGIN; CREATE TABLE users (...); CREATE TABLE departments (...); COMMIT;
- [x] Write V002__create_appointment_tables.sql with CHECK constraints (appointment_date >= CURRENT_DATE)
- [x] Write V003__create_clinical_tables.sql with TEXT fields for medical content
- [x] Write V004__create_notification_tables.sql with read/unread status
- [x] Write V005__create_indexes.sql: CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
- [x] Write V006__create_vector_indexes.sql: CREATE INDEX ON clinical_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
- [x] Write V007__add_constraints.sql: ALTER TABLE appointments ADD CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;
- [x] Write V008__add_vector_columns.sql: ALTER TABLE clinical_documents ADD COLUMN embedding vector(1536);
- [x] Create dev_seed_data.sql with 3 users (admin, doctor, patient), 2 departments, 5 appointments
- [x] Create ERD_diagram.md using Mermaid syntax showing all table relationships
- [x] Document TABLE_DEFINITIONS.md with column descriptions, data types, constraints, indexes
- [x] Write rollback_all.sql: DROP TABLE IF EXISTS notifications, audit_logs, clinical_documents, appointments, time_slots, waitlist, patient_profiles, departments, users CASCADE;
- [x] Create run_migrations.sh with psql commands for each migration file in order
- [x] Create run_migrations.ps1 for Windows with same logic as bash script
- [x] Test migrations on clean database: Run run_migrations.sh → verify all tables created
- [x] Test rollback: Run rollback_all.sql → verify all tables dropped
- [x] Test seed data: Load dev_seed_data.sql → query tables to verify data inserted
- [x] Test foreign key cascade: Delete user → verify audit_logs for that user deleted (if CASCADE)
- [x] Test check constraints: Try INSERT INTO appointments with past date → should fail with constraint violation
- [x] Test vector operations: INSERT test embedding, query with <-> operator
- [x] Document migration sequence in README.md
