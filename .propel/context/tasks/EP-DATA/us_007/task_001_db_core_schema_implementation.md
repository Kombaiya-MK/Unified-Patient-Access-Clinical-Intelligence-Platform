# Task - TASK_001_DB_CORE_SCHEMA_IMPLEMENTATION

## Requirement Reference
- User Story: US_007  
- Story Location: `.propel/context/tasks/us_007/us_007.md`
- Acceptance Criteria:
    - AC1: All tables (Users, Appointments, ClinicalDocuments, PatientProfiles, AuditLogs, Departments, TimeSlots, Waitlist, Notifications) created with primary keys, foreign keys, indexes, and check constraints without errors
- Edge Cases:
    - Migration fails midway: Transaction rollback ensures consistency, migration status tracked in schema_migrations table
    - Schema changes in production: Use migration tool (Flyway or node-pg-migrate) for versioned migrations

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
| Backend | Node.js | 20.x LTS |
| Backend | node-pg-migrate | 6.x |
| Database | PostgreSQL | 15+ |
| Database | pgvector | 0.5.0+ |
| AI/ML | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Partial (vector columns for embeddings) |
| **AIR Requirements** | N/A |
| **AI Pattern** | Vector storage infrastructure |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Schema includes vector columns for future AI features

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend database only

## Task Overview
Implement complete core database schema with all 9 tables covering user management, appointments, clinical documents, patient profiles, audit logging, departments, time slots, waitlist, and notifications. Ensure referential integrity with foreign keys, data validation with check constraints, query performance with indexes, and ACID compliance with transactional migrations. Build on US_003 foundation (database setup and migration system).

## Dependent Tasks
- US_003 TASK_001: PostgreSQL and pgvector must be installed
- US_003 TASK_004: Migration system (node-pg-migrate) must be configured

## Impacted Components
**New:**
- database/migrations/001_create_users_table.js (Users table with authentication fields)
- database/migrations/002_create_departments_table.js (Departments table)
- database/migrations/003_create_patient_profiles_table.js (Patient profiles with medical info)
- database/migrations/004_create_time_slots_table.js (Time slot availability)
- database/migrations/005_create_appointments_table.js (Appointment bookings)
- database/migrations/006_create_clinical_documents_table.js (Clinical records with vector embeddings)
- database/migrations/007_create_waitlist_table.js (Waitlist management)
- database/migrations/008_create_notifications_table.js (User notifications)
- database/migrations/009_create_audit_logs_table.js (Audit trail)
- database/migrations/010_create_indexes.js (Performance indexes)
- database/migrations/011_add_constraints.js (Check constraints and validations)
- database/schema/ERD.md (Entity relationship diagram)
- database/schema/DATA_DICTIONARY.md (Complete column documentation)
- database/seeds/001_initial_data.js (Seed data for development)

## Implementation Plan
1. **Users Table**: id, email (unique), password_hash, role (enum: admin, doctor, staff, patient), active, created_at, updated_at
2. **Departments Table**: id, name, code (unique), description, active, created_at
3. **PatientProfiles Table**: id, user_id (FK), date_of_birth, gender, medical_record_number (unique), emergency_contact, insurance_info, allergies, medications, created_at, updated_at
4. **TimeSlots Table**: id, doctor_id (FK users), department_id (FK departments), slot_date, slot_start_time, slot_end_time, available (boolean), booking_limit, created_at
5. **Appointments Table**: id, patient_id (FK patient_profiles), doctor_id (FK users), department_id (FK departments), time_slot_id (FK time_slots), appointment_date, status (enum: pending, confirmed, cancelled, completed, no_show), reason, notes, created_at, updated_at
6. **ClinicalDocuments Table**: id, patient_id (FK patient_profiles), appointment_id (FK appointments), document_type, title, content (TEXT), embedding (vector(1536)), created_by (FK users), created_at, updated_at
7. **Waitlist Table**: id, patient_id (FK patient_profiles), department_id (FK departments), requested_date, priority (1-5), status (enum: waiting, notified, scheduled, cancelled), notes, created_at, updated_at
8. **Notifications Table**: id, user_id (FK users), type (enum: appointment_reminder, appointment_confirmed, waitlist_available, system_alert), title, message, read (boolean), sent_at, read_at
9. **AuditLogs Table**: id, user_id (FK users), action, table_name, record_id, old_values (JSONB), new_values (JSONB), ip_address, user_agent, created_at
10. **Indexes**: B-tree on FKs, timestamps, status columns; unique indexes on email, medical_record_number; IVFFlat on embedding vectors
11. **Constraints**: CHECK email format, CHECK date_of_birth >= '1900-01-01', CHECK priority BETWEEN 1 AND 5, CHECK slot_end_time > slot_start_time
12. **Transactional Migrations**: Each migration wrapped in transaction, automatic rollback on error

## Current Project State
```
ASSIGNMENT/
├── app/                     # Frontend (US_001)
├── server/                  # Backend API (US_002-006)
├── database/                # Database setup (US_003)
│   ├── install/            # Installation scripts
│   ├── scripts/            # Utility scripts
│   └── docs/               # Documentation
└── monitoring/              # Grafana + Prometheus (US_005-006)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/001_create_users_table.js | Users: id, email, password_hash, role, active, timestamps |
| CREATE | database/migrations/002_create_departments_table.js | Departments: id, name, code, description, active, timestamps |
| CREATE | database/migrations/003_create_patient_profiles_table.js | Patient profiles: medical_record_number, demographics, medical history |
| CREATE | database/migrations/004_create_time_slots_table.js | Time slots: doctor_id, department_id, slot times, availability |
| CREATE | database/migrations/005_create_appointments_table.js | Appointments: patient, doctor, time slot, status, reason |
| CREATE | database/migrations/006_create_clinical_documents_table.js | Clinical docs: content, embedding vector(1536), metadata |
| CREATE | database/migrations/007_create_waitlist_table.js | Waitlist: patient, department, priority, status |
| CREATE | database/migrations/008_create_notifications_table.js | Notifications: user, type, message, read status |
| CREATE | database/migrations/009_create_audit_logs_table.js | Audit logs: user actions, old/new values JSONB, IP tracking |
| CREATE | database/migrations/010_create_indexes.js | B-tree indexes on FKs, unique indexes, IVFFlat on vectors |
| CREATE | database/migrations/011_add_constraints.js | CHECK constraints: email format, date ranges, enums |
| CREATE | database/schema/ERD.md | Entity relationship diagram in Mermaid format |
| CREATE | database/schema/DATA_DICTIONARY.md | Complete documentation: table purpose, columns, constraints, indexes |
| CREATE | database/seeds/001_initial_data.js | Seed data: admin user, 3 departments, 2 doctors, 5 patients, test appointments |
| CREATE | database/tests/schema_validation.test.js | Integration tests: table existence, constraint enforcement |

> All files created as new - builds on US_003 migration system

## External References
- [PostgreSQL Data Types](https://www.postgresql.org/docs/15/datatype.html)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/15/ddl-constraints.html)
- [node-pg-migrate API](https://salsita.github.io/node-pg-migrate/#/api)
- [Database Design Best Practices](https://www.postgresql.org/docs/15/ddl-basics.html)
- [JSONB Data Type](https://www.postgresql.org/docs/15/datatype-json.html)
- [pgvector Vector Type](https://github.com/pgvector/pgvector#vector-type)
- [PostgreSQL Naming Conventions](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Mermaid ERD Syntax](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)

## Build Commands
```bash
# Navigate to server directory (where migrations are)
cd server

# Create all migration files
npm run migrate:create create-users-table
npm run migrate:create create-departments-table
npm run migrate:create create-patient-profiles-table
npm run migrate:create create-time-slots-table
npm run migrate:create create-appointments-table
npm run migrate:create create-clinical-documents-table
npm run migrate:create create-waitlist-table
npm run migrate:create create-notifications-table
npm run migrate:create create-audit-logs-table
npm run migrate:create create-indexes
npm run migrate:create add-constraints

# Run all migrations (execute in order)
npm run migrate:up

# Verify tables created
psql -U upaci_user -d upaci -c "\dt"
# Expected: 9 tables listed

# Check foreign keys
psql -U upaci_user -d upaci -c "
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
"

# Check indexes
psql -U upaci_user -d upaci -c "\di"

# Run seed data
npm run seed

# Verify seed data
psql -U upaci_user -d upaci -c "SELECT COUNT(*) FROM users;"
# Expected: 8 (1 admin, 2 doctors, 5 patients)

# Test constraint enforcement (should fail)
psql -U upaci_user -d upaci -c "
INSERT INTO users (email, password_hash, role) 
VALUES ('invalid-email', 'hash', 'patient');
"
# Expected: ERROR: constraint violation (email format)

# Test foreign key (should fail)
psql -U upaci_user -d upaci -c "
INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, status) 
VALUES (99999, 1, 1, '2026-03-20', 'pending');
"
# Expected: ERROR: foreign key violation (patient_id does not exist)

# Rollback last migration (for testing)
npm run migrate:down

# Re-run schema migrations
npm run migrate:up

# Run schema validation tests
npm test -- schema_validation.test.js
```

## Implementation Validation Strategy
- [ ] Unit tests pass (DDL validation tests)
- [ ] Integration tests pass (constraint and FK enforcement)
- [ ] All 9 tables created: `\dt` shows users, departments, patient_profiles, time_slots, appointments, clinical_documents, waitlist, notifications, audit_logs
- [ ] Primary keys defined: `\d users` shows "id" as PRIMARY KEY
- [ ] Foreign keys enforced: Insert invalid FK → ERROR
- [ ] Unique constraints work: Insert duplicate email → ERROR
- [ ] Check constraints enforced: Insert invalid email format → ERROR, Insert priority=0 → ERROR
- [ ] Indexes created: `\di` shows indexes on all FKs, unique indexes, vector indexes
- [ ] IVFFlat index on embeddings: `\d clinical_documents` shows vector(1536) column with index
- [ ] NOT NULL constraints: Insert NULL into required field → ERROR
- [ ] ENUM types: Insert invalid status → ERROR
- [ ] Default values: created_at defaults to NOW()
- [ ] Timestamps: updated_at trigger updates on row change
- [ ] JSONB columns: audit_logs.old_values stores valid JSON
- [ ] Transaction rollback: Introduce error in migration → no partial changes
- [ ] Seed data loads: Users, departments, appointments populated
- [ ] ERD complete: Mermaid diagram shows all relationships
- [ ] Data dictionary complete: All columns documented with types and constraints

## Implementation Checklist

### Users Table (001_create_users_table.js)
- [ ] Create migration file: `npm run migrate:create create-users-table`
- [ ] Implement exports.up: pgm.createTable('users', { ... })
- [ ] Add id: { type: 'bigserial', primaryKey: true }
- [ ] Add email: { type: 'varchar(255)', notNull: true, unique: true }
- [ ] Add password_hash: { type: 'varchar(255)', notNull: true }
- [ ] Add role: { type: 'varchar(20)', notNull: true, check: "role IN ('admin', 'doctor', 'staff', 'patient')" }
- [ ] Add first_name: { type: 'varchar(100)' }
- [ ] Add last_name: { type: 'varchar(100)' }
- [ ] Add phone: { type: 'varchar(20)' }
- [ ] Add active: { type: 'boolean', default: true }
- [ ] Add created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') }
- [ ] Add updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') }
- [ ] Implement exports.down: pgm.dropTable('users')

### Departments Table (002_create_departments_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add name: { type: 'varchar(100)', notNull: true }
- [ ] Add code: { type: 'varchar(20)', notNull: true, unique: true }
- [ ] Add description: { type: 'text' }
- [ ] Add active: { type: 'boolean', default: true }
- [ ] Add created_at, updated_at timestamps

### PatientProfiles Table (003_create_patient_profiles_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add user_id: { type: 'bigint', notNull: true, references: 'users', onDelete: 'CASCADE' }
- [ ] Add date_of_birth: { type: 'date', notNull: true }
- [ ] Add gender: { type: 'varchar(20)', check: "gender IN ('male', 'female', 'other', 'prefer_not_to_say')" }
- [ ] Add medical_record_number: { type: 'varchar(50)', unique: true }
- [ ] Add blood_type: { type: 'varchar(5)' }
- [ ] Add height_cm: { type: 'numeric(5,2)' }
- [ ] Add weight_kg: { type: 'numeric(5,2)' }
- [ ] Add allergies: { type: 'text' }
- [ ] Add current_medications: { type: 'text' }
- [ ] Add emergency_contact_name: { type: 'varchar(100)' }
- [ ] Add emergency_contact_phone: { type: 'varchar(20)' }
- [ ] Add insurance_provider: { type: 'varchar(100)' }
- [ ] Add insurance_policy_number: { type: 'varchar(50)' }
- [ ] Add created_at, updated_at timestamps

### TimeSlots Table (004_create_time_slots_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add doctor_id: { type: 'bigint', notNull: true, references: 'users' }
- [ ] Add department_id: { type: 'bigint', notNull: true, references: 'departments' }
- [ ] Add slot_date: { type: 'date', notNull: true }
- [ ] Add slot_start_time: { type: 'time', notNull: true }
- [ ] Add slot_end_time: { type: 'time', notNull: true }
- [ ] Add available: { type: 'boolean', default: true }
- [ ] Add booking_limit: { type: 'integer', default: 1 }
- [ ] Add created_at timestamp
- [ ] Add check constraint: slot_end_time > slot_start_time

### Appointments Table (005_create_appointments_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add patient_id: { type: 'bigint', notNull: true, references: 'patient_profiles', onDelete: 'RESTRICT' }
- [ ] Add doctor_id: { type: 'bigint', notNull: true, references: 'users' }
- [ ] Add department_id: { type: 'bigint', notNull: true, references: 'departments' }
- [ ] Add time_slot_id: { type: 'bigint', references: 'time_slots', onDelete: 'SET NULL' }
- [ ] Add appointment_date: { type: 'timestamptz', notNull: true }
- [ ] Add status: { type: 'varchar(20)', notNull: true, check: "status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')", default: 'pending' }
- [ ] Add reason: { type: 'text' }
- [ ] Add notes: { type: 'text' }
- [ ] Add created_at, updated_at timestamps

### ClinicalDocuments Table (006_create_clinical_documents_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add patient_id: { type: 'bigint', notNull: true, references: 'patient_profiles', onDelete: 'CASCADE' }
- [ ] Add appointment_id: { type: 'bigint', references: 'appointments', onDelete: 'SET NULL' }
- [ ] Add document_type: { type: 'varchar(50)', notNull: true, check: "document_type IN ('prescription', 'lab_result', 'imaging', 'consultation_note', 'discharge_summary', 'referral')" }
- [ ] Add title: { type: 'varchar(255)', notNull: true }
- [ ] Add content: { type: 'text', notNull: true }
- [ ] Add embedding: { type: 'vector(1536)' } (for AI similarity search)
- [ ] Add file_url: { type: 'varchar(500)' }
- [ ] Add created_by: { type: 'bigint', references: 'users' }
- [ ] Add created_at, updated_at timestamps

### Waitlist Table (007_create_waitlist_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add patient_id: { type: 'bigint', notNull: true, references: 'patient_profiles', onDelete: 'CASCADE' }
- [ ] Add department_id: { type: 'bigint', notNull: true, references: 'departments' }
- [ ] Add requested_date: { type: 'date', notNull: true }
- [ ] Add priority: { type: 'integer', notNull: true, default: 3, check: 'priority BETWEEN 1 AND 5' }
- [ ] Add status: { type: 'varchar(20)', notNull: true, check: "status IN ('waiting', 'notified', 'scheduled', 'cancelled')", default: 'waiting' }
- [ ] Add notes: { type: 'text' }
- [ ] Add created_at, updated_at timestamps

### Notifications Table (008_create_notifications_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add user_id: { type: 'bigint', notNull: true, references: 'users', onDelete: 'CASCADE' }
- [ ] Add type: { type: 'varchar(50)', notNull: true, check: "type IN ('appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'waitlist_available', 'system_alert', 'message')" }
- [ ] Add title: { type: 'varchar(255)', notNull: true }
- [ ] Add message: { type: 'text', notNull: true }
- [ ] Add read: { type: 'boolean', default: false }
- [ ] Add sent_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') }
- [ ] Add read_at: { type: 'timestamptz' }

### AuditLogs Table (009_create_audit_logs_table.js)
- [ ] Create migration file
- [ ] Add id (bigserial PRIMARY KEY)
- [ ] Add user_id: { type: 'bigint', references: 'users', onDelete: 'SET NULL' }
- [ ] Add action: { type: 'varchar(50)', notNull: true } (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- [ ] Add table_name: { type: 'varchar(100)' }
- [ ] Add record_id: { type: 'bigint' }
- [ ] Add old_values: { type: 'jsonb' }
- [ ] Add new_values: { type: 'jsonb' }
- [ ] Add ip_address: { type: 'inet' }
- [ ] Add user_agent: { type: 'text' }
- [ ] Add created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') }

### Indexes (010_create_indexes.js)
- [ ] Create B-tree index on users.email (already unique)
- [ ] Create index on users.role: pgm.createIndex('users', 'role')
- [ ] Create index on patient_profiles.user_id
- [ ] Create index on patient_profiles.medical_record_number (already unique)
- [ ] Create index on time_slots (doctor_id, slot_date)
- [ ] Create index on time_slots (department_id, slot_date, available)
- [ ] Create index on appointments (patient_id, status)
- [ ] Create index on appointments (doctor_id, appointment_date)
- [ ] Create index on appointments (time_slot_id)
- [ ] Create index on clinical_documents (patient_id, created_at DESC)
- [ ] Create IVFFlat index on clinical_documents.embedding: pgm.sql("CREATE INDEX ON clinical_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);")
- [ ] Create index on waitlist (department_id, status, priority)
- [ ] Create index on notifications (user_id, read, sent_at DESC)
- [ ] Create index on audit_logs (user_id, created_at DESC)
- [ ] Create index on audit_logs (table_name, record_id)

### Constraints (011_add_constraints.js)
- [ ] Add CHECK constraint on users.email format: pgm.addConstraint('users', 'email_format', 'CHECK (email ~* \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$\')')
- [ ] Add CHECK constraint on patient_profiles.date_of_birth >= '1900-01-01'
- [ ] Add CHECK constraint on patient_profiles.height_cm BETWEEN 30 AND 300
- [ ] Add CHECK constraint on patient_profiles.weight_kg BETWEEN 1 AND 500
- [ ] Add CHECK constraint on appointments.appointment_date >= created_at (cannot book in the past at booking time)

### Seed Data (database/seeds/001_initial_data.js)
- [ ] Create seed file using node-pg-migrate or raw SQL
- [ ] Insert admin user: email='admin@upaci.com', role='admin', password_hash=bcrypt('admin123')
- [ ] Insert 2 doctors: Dr. Smith (Cardiology), Dr. Johnson (Orthopedics)
- [ ] Insert 2 staff members
- [ ] Insert 5 patients with complete profiles
- [ ] Insert 3 departments: Cardiology, Orthopedics, General Medicine
- [ ] Insert 20 time slots across doctors and departments
- [ ] Insert 5 test appointments (mix of pending, confirmed, completed)
- [ ] Insert 3 waitlist entries
- [ ] Insert 10 notifications
- [ ] Insert sample audit logs

### Documentation (database/schema/)
- [ ] Create ERD.md with Mermaid diagram
- [ ] Define all 9 entities and relationships
- [ ] Show cardinality: User 1---* Appointments, Patient 1---* ClinicalDocuments, etc.
- [ ] Create DATA_DICTIONARY.md
- [ ] Document each table: purpose, business rules
- [ ] Document each column: data type, constraints, nullable, default, description
- [ ] Document indexes: name, columns, type (B-tree, IVFFlat), purpose
- [ ] Document foreign keys: child table, parent table, on delete action

### Testing (database/tests/schema_validation.test.js)
- [ ] Test: "should have all 9 tables created"
- [ ] Test: "should enforce unique email constraint"
- [ ] Test: "should enforce foreign key on patient_profiles.user_id"
- [ ] Test: "should enforce check constraint on users.email format"
- [ ] Test: "should enforce check constraint on waitlist.priority (1-5)"
- [ ] Test: "should have indexes on all foreign keys"
- [ ] Test: "should have vector index on clinical_documents.embedding"
- [ ] Test: "should cascade delete patient profile when user deleted"
- [ ] Test: "should prevent deletion of appointment with RESTRICT on patient"
- [ ] Run all tests: npm test -- schema_validation.test.js
