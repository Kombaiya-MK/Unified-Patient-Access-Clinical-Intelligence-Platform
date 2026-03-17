# Task - TASK_001_DB_POSTGRESQL_SCHEMA

## Requirement Reference
- User Story: US_003
- Story Location: `.propel/context/tasks/us_003/us_003.md`
- Acceptance Criteria:
    - AC1: PostgreSQL 16.x with pgvector extension installed, UPACI database created, connection test passes
    - AC2: Core tables created: Users, Appointments, ClinicalDocuments, PatientProfiles, Departments, TimeSlots, Waitlist, Notifications with foreign keys
    - AC4: pgvector extension enabled, test embedding stored/retrieved with cosine similarity (<-> operator)
- Edge Cases:
    - pgvector extension install fails: Provide Windows/Linux installation guide, disable vector features gracefully
    - Database connection fails at startup: Retry 3 times with exponential backoff (1s, 2s, 4s), log error and exit

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

> **Note**: Database infrastructure - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | pg (PostgreSQL client) | 8.x |
| Database | PostgreSQL | 16.x |
| Database | pgvector extension | 0.5.x |
| AI/ML | N/A (schema only) | N/A |

**Note**: All database schemas MUST be compatible with PostgreSQL 16.x and pgvector 0.5.x

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI implementation - database schema only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Database infrastructure

## Task Overview
Install PostgreSQL 16.x with pgvector extension, create UPACI database, define core tables (Users, Appointments, ClinicalDocuments, PatientProfiles, Departments, TimeSlots, Waitlist, Notifications) with proper primary keys (UUID), foreign keys, indexes, and audit fields (createdAt, updatedAt, createdBy, updatedBy). Configure connection pooling (max 20 connections) using pg library. Validate pgvector vector similarity queries.

## Dependent Tasks
- US_002: Backend API must be configured (config/database.ts will be created here)

## Impacted Components
**New:**
- server/src/config/database.ts (pg Pool configuration with retry logic)
- server/db/ (database scripts directory)
- server/db/schema.sql (DDL for all core tables + pgvector extension)
- server/db/indexes.sql (Performance indexes on foreign keys, search fields)
- server/db/seed.sql (Sample data for development)
- server/db/test-vector.sql (pgvector validation query)

## Implementation Plan
1. **Install PostgreSQL**: Download PostgreSQL 16.x installer for Windows, enable pgvector during setup or install manually
2. **Create database**: `CREATE DATABASE upaci;` with owner postgres user
3. **Enable pgvector**: `CREATE EXTENSION IF NOT EXISTS vector;` in upaci database
4. **Define UUID function**: Use gen_random_uuid() for primary keys (built-in PostgreSQL function)
5. **Create Users table**: id (UUID PK), email (UNIQUE NOT NULL), passwordHash, role (enum: admin/doctor/staff/patient), firstName, lastName, createdAt, updatedAt, createdBy, updatedBy
6. **Create Departments table**: id (UUID PK), name, description, isActive, createdAt, updatedAt
7. **Create PatientProfiles table**: id (UUID PK), userId (FK Users), dateOfBirth, gender, phoneNumber, address, emergencyContact, medicalHistory (JSONB), allergies (TEXT[]), createdAt, updatedAt
8. **Create TimeSlots table**: id (UUID PK), departmentId (FK Departments), doctorId (FK Users role=doctor), startTime (TIMESTAMP), endTime (TIMESTAMP), isAvailable (BOOLEAN), createdAt, updatedAt
9. **Create Appointments table**: id (UUID PK), patientId (FK Users), doctorId (FK Users), timeSlotId (FK TimeSlots), departmentId (FK Departments), appointmentDate, status (enum: scheduled/completed/cancelled), reasonForVisit, createdAt, updatedAt, createdBy, updatedBy
10. **Create ClinicalDocuments table**: id (UUID PK), appointmentId (FK Appointments), patientId (FK Users), documentType (enum: intake-form/prescription/lab-result/note), filePath, extractedText, embedding (vector(1536) for OpenAI embeddings), metadata (JSONB), uploadedBy (FK Users), createdAt, updatedAt
11. **Create Waitlist table**: id (UUID PK), patientId (FK Users), departmentId (FK Departments), preferredDate, priority (INTEGER), status (enum: waiting/notified/scheduled/expired), createdAt, updatedAt
12. **Create Notifications table**: id (UUID PK), userId (FK Users), type (enum: appointment-reminder/document-ready/waitlist-notification), message, isRead (BOOLEAN DEFAULT false), createdAt
13. **Add foreign key constraints**: ON DELETE CASCADE for patientId, ON DELETE SET NULL for doctorId (reassign appointments if doctor deleted)
14. **Create indexes**: Users.email, Appointments.patientId+appointmentDate, ClinicalDocuments.embedding (vector index for similarity search), TimeSlots.doctorId+startTime
15. **Configure connection pooling**: server/src/config/database.ts with pg Pool (max 20, idleTimeoutMillis 30000, connectionTimeoutMillis 2000)
16. **Implement retry logic**: 3 attempts with exponential backoff (1s, 2s, 4s), log each attempt
17. **Test vector query**: Insert test embedding, perform cosine similarity search with `SELECT * FROM clinical_documents ORDER BY embedding <-> '[vector]' LIMIT 5`

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001)
├── server/               # Backend (US_002)
│   ├── src/
│   │   └── config/       # database.ts to be added
│   └── (db/ to be created)
└── (PostgreSQL to be installed)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/db/schema.sql | DDL for 9 core tables + pgvector extension |
| CREATE | server/db/indexes.sql | Performance indexes on FKs, email, appointmentDate, embedding vector |
| CREATE | server/db/seed.sql | Sample users (admin, doctor, patient), departments, timeslots for dev |
| CREATE | server/db/test-vector.sql | Validation query for pgvector cosine similarity |
| CREATE | server/src/config/database.ts | pg Pool with retry logic, connection test, graceful shutdown |
| CREATE | server/db/README.md | Database setup instructions, schema diagram, ER relationships |

> All files created as new - no existing database code

## External References
- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [pgvector Extension](https://github.com/pgvector/pgvector)
- [pgvector Installation Windows](https://github.com/pgvector/pgvector#windows)
- [node-postgres (pg) Pool](https://node-postgres.com/features/pooling)
- [UUID in PostgreSQL](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [Vector Similarity Search](https://github.com/pgvector/pgvector#querying)
- [PostgreSQL Indexes Best Practices](https://www.postgresql.org/docs/current/indexes.html)

## Build Commands
```bash
# Install PostgreSQL 16 (Windows)
# Download from: https://www.postgresql.org/download/windows/
# Or use installer: postgresql-16.x-windows-x64.exe

# Install pgvector (after PostgreSQL installation)
# Follow: https://github.com/pgvector/pgvector#windows

# Create database
psql -U postgres
CREATE DATABASE upaci;
\c upaci
CREATE EXTENSION IF NOT EXISTS vector;

# Run schema migrations
cd server/db
psql -U postgres -d upaci -f schema.sql
psql -U postgres -d upaci -f indexes.sql
psql -U postgres -d upaci -f seed.sql  # Optional for dev

# Test vector query
psql -U postgres -d upaci -f test-vector.sql

# Backend connection test
cd ../
npm run dev  # Should log "Database connected successfully"
```

## Implementation Validation Strategy
- [ ] Unit tests pass (N/A for database setup)
- [ ] Integration tests pass (connection test in config/database.ts)
- [ ] PostgreSQL 16.x installed: `psql --version` returns 16.x
- [ ] pgvector extension installed: `SELECT * FROM pg_extension WHERE extname = 'vector';` returns 1 row
- [ ] UPACI database created: `\l` lists upaci database
- [ ] All 9 tables exist: `\dt` lists users, appointments, clinical_documents, patient_profiles, departments, time_slots, waitlist, notifications
- [ ] Foreign keys enforced: Try inserting appointment with invalid patientId -> ERROR
- [ ] UUID primary keys work: Insert user -> id generated as UUID
- [ ] Indexes created: `\di` lists indexes on email, patientId, embedding
- [ ] Vector similarity search works: test-vector.sql returns ranked results
- [ ] Connection pooling configured: server/src/config/database.ts exports pool with max 20
- [ ] Backend connects successfully: `npm run dev` logs "Database connected successfully"
- [ ] Retry logic works: Stop PostgreSQL, start backend -> logs 3 retry attempts then exits
- [ ] Seed data loads: `SELECT COUNT(*) FROM users;` returns >0

## Implementation Checklist
- [ ] Download PostgreSQL 16.x installer from official website
- [ ] Run installer: Enable Stack Builder for pgvector installation
- [ ] Install pgvector extension: Follow Windows-specific instructions
- [ ] Create upaci database: `psql -U postgres -c "CREATE DATABASE upaci;"`
- [ ] Enable pgvector: `psql -U postgres -d upaci -c "CREATE EXTENSION vector;"`
- [ ] Create server/db/ directory
- [ ] Write db/schema.sql: CREATE TABLE statements for 9 tables with UUIDs, foreign keys, audit fields
- [ ] Define Users table: id, email (UNIQUE), passwordHash, role (CHECK constraint), firstName, lastName, timestamps, audit fields
- [ ] Define Departments table: id, name, description, isActive, timestamps
- [ ] Define PatientProfiles table: id, userId FK, dateOfBirth, gender, phoneNumber, address, emergencyContact, medicalHistory JSONB, allergies TEXT[], timestamps
- [ ] Define TimeSlots table: id, departmentId FK, doctorId FK, startTime, endTime, isAvailable, timestamps
- [ ] Define Appointments table: id, patientId FK, doctorId FK, timeSlotId FK, departmentId FK, appointmentDate, status (CHECK constraint), reasonForVisit, timestamps, audit fields
- [ ] Define ClinicalDocuments table: id, appointmentId FK, patientId FK, documentType (CHECK constraint), filePath, extractedText, embedding vector(1536), metadata JSONB, uploadedBy FK, timestamps
- [ ] Define Waitlist table: id, patientId FK, departmentId FK, preferredDate, priority, status (CHECK constraint), timestamps
- [ ] Define Notifications table: id, userId FK, type (CHECK constraint), message, isRead DEFAULT false, createdAt
- [ ] Write db/indexes.sql: CREATE INDEX statements for email, patientId, appointmentDate, doctorId, embedding (HNSW or IVFFlat)
- [ ] Write db/seed.sql: INSERT sample admin user, 2 departments, 1 doctor, 3 timeslots
- [ ] Write db/test-vector.sql: INSERT document with test embedding, SELECT with <-> cosine similarity
- [ ] Run schema migration: `psql -U postgres -d upaci -f schema.sql`
- [ ] Run indexes migration: `psql -U postgres -d upaci -f indexes.sql`
- [ ] Verify tables: `psql -U postgres -d upaci -c "\dt"`
- [ ] Verify indexes: `psql -U postgres -d upaci -c "\di"`
- [ ] Create server/src/config/database.ts: Import pg Pool, configure with process.env.DATABASE_URL, max 20 connections
- [ ] Implement retry logic: Function to connect with 3 attempts, exponential backoff (1s, 2s, 4s)
- [ ] Add connection test: `pool.query('SELECT NOW()')` on startup
- [ ] Add graceful shutdown: `pool.end()` on process.exit
- [ ] Add DATABASE_URL to server/.env.example: `postgresql://postgres:password@localhost:5432/upaci`
- [ ] Test connection: `npm run dev` -> verify "Database connected successfully" log
- [ ] Test retry logic: Stop PostgreSQL, start backend -> verify 3 retry logs
- [ ] Run test-vector.sql: Verify cosine similarity returns ranked results
- [ ] Document schema in server/db/README.md: ER diagram (text-based), table descriptions, relationships
