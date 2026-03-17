# Task - TASK_002_DB_AUDIT_MIGRATIONS

## Requirement Reference
- User Story: US_003
- Story Location: `.propel/context/tasks/us_003/us_003.md`
- Acceptance Criteria:
    - AC3: Connection pooling configured (pg library, max 20 connections)
- Additional Requirements:
    - DR-003: All tables have audit fields (createdAt, updatedAt, createdBy, updatedBy)
    - NFR-004: Immutable audit logs for HIPAA compliance
- Edge Cases:
    - Migration fails midway: Rollback to last successful migration, log error details

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
| Backend | node-pg-migrate | 6.x |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

**Note**: All migrations MUST be compatible with PostgreSQL 16.x

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: No AI implementation - migration framework only

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Database infrastructure

## Task Overview
Create dedicated AuditLogs table for immutable HIPAA-compliant logging (NFR-004). Implement migration framework using node-pg-migrate for schema versioning (DR-006). Configure database triggers to auto-populate audit fields (createdAt, updatedAt, createdBy, updatedBy) on all core tables. Enforce immutability on AuditLogs table (no updates/deletes allowed).

## Dependent Tasks
- US_003 Task 001: Core schema must be created first

## Impacted Components
**New:**
- server/db/migrations/ (migration scripts directory)
- server/db/migrations/001_create_audit_table.sql (AuditLogs table DDL)
- server/db/migrations/002_add_audit_triggers.sql (Triggers for auto-populating audit fields)
- server/src/config/migrations.ts (node-pg-migrate configuration)
- server/package.json (add node-pg-migrate dependency)

## Implementation Plan
1. **Install node-pg-migrate**: `npm install node-pg-migrate` for schema versioning
2. **Create migrations directory**: server/db/migrations/ with naming convention: 001_description.sql, 002_description.sql
3. **Create AuditLogs table**: id (UUID PK), tableName (TEXT NOT NULL), recordId (UUID NOT NULL), action (enum: INSERT/UPDATE/DELETE), changedBy (UUID FK Users), changedAt (TIMESTAMP DEFAULT NOW), oldValues (JSONB), newValues (JSONB), ipAddress (INET), userAgent (TEXT)
4. **Add immutability constraint**: RULE to prevent UPDATE/DELETE on audit_logs (HIPAA requirement)
5. **Create audit trigger function**: PL/pgSQL function to log changes to audit_logs on INSERT/UPDATE/DELETE
6. **Apply triggers to core tables**: Appointments, ClinicalDocuments, Users, PatientProfiles (sensitive data)
7. **Auto-populate createdBy/updatedBy**: Extract userId from application context (req.user.id) and pass to trigger
8. **Configure node-pg-migrate**: server/src/config/migrations.ts with database URL, migrations directory, schema version table
9. **Create migration runner**: Script to run pending migrations on deployment
10. **Add rollback command**: `npm run migrate:down` to revert last migration

## Current Project State
```
ASSIGNMENT/
├── app/                  # Frontend (US_001)
├── server/               # Backend (US_002) + Database (US_003 Task 001)
│   ├── src/
│   │   └── config/
│   │       └── database.ts (exists)
│   └── db/
│       ├── schema.sql (exists)
│       ├── indexes.sql (exists)
│       └── (migrations/ to be created)
└── (PostgreSQL installed)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/db/migrations/001_create_audit_table.sql | AuditLogs table with immutability constraint |
| CREATE | server/db/migrations/002_add_audit_triggers.sql | Trigger function + triggers for core tables |
| CREATE | server/src/config/migrations.ts | node-pg-migrate configuration |
| UPDATE | server/package.json | Add node-pg-migrate dependency, add migrate scripts |
| CREATE | server/db/README.md (append) | Migration instructions, audit logging guide |

> Modifies package.json, rest are new files

## External References
- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)
- [PostgreSQL Rules (Immutability)](https://www.postgresql.org/docs/current/rules.html)
- [HIPAA Audit Log Requirements](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [PostgreSQL JSONB for Audit Trails](https://www.postgresql.org/docs/current/datatype-json.html)

## Build Commands
```bash
# Install migration tool
cd server
npm install node-pg-migrate

# Add migration scripts to package.json
# "migrate:up": "node-pg-migrate up",
# "migrate:down": "node-pg-migrate down",
# "migrate:create": "node-pg-migrate create"

# Run migrations
npm run migrate:up

# Create new migration
npm run migrate:create add_new_column

# Rollback last migration
npm run migrate:down
```

## Implementation Validation Strategy
- [ ] Unit tests pass (N/A for database setup)
- [ ] Integration tests pass (trigger tests in test suite)
- [ ] AuditLogs table exists: `\d audit_logs` shows schema
- [ ] Immutability enforced: `UPDATE audit_logs SET action = 'TEST' WHERE id = 'xxx';` -> ERROR: "cannot update audit_logs"
- [ ] Triggers installed: `\dy` lists triggers on users, appointments, clinical_documents, patient_profiles
- [ ] Audit log created on INSERT: Insert new user -> audit_logs has 1 row with action=INSERT, newValues populated
- [ ] Audit log created on UPDATE: Update appointment status -> audit_logs has row with action=UPDATE, oldValues + newValues
- [ ] Audit log created on DELETE: Delete waitlist entry -> audit_logs has row with action=DELETE, oldValues populated
- [ ] createdBy/updatedBy auto-populated: Insert appointment with userId context -> createdBy matches userId
- [ ] Migration framework works: `npm run migrate:up` -> schema_version table tracks applied migrations
- [ ] Rollback works: `npm run migrate:down` -> reverts last migration, schema_version updated
- [ ] JSONB oldValues/newValues: Verify changed fields captured correctly in JSONB format

## Implementation Checklist
- [ ] Install node-pg-migrate: `npm install node-pg-migrate --save-dev`
- [ ] Add scripts to package.json: migrate:up, migrate:down, migrate:create
- [ ] Create server/db/migrations/ directory
- [ ] Write 001_create_audit_table.sql:
  - [ ] CREATE TABLE audit_logs with id, tableName, recordId, action, changedBy, changedAt, oldValues, newValues, ipAddress, userAgent
  - [ ] Add CHECK constraint on action (INSERT, UPDATE, DELETE only)
  - [ ] Add foreign key changedBy -> users(id)
  - [ ] CREATE RULE no_update_audit_logs: ON UPDATE TO audit_logs DO INSTEAD NOTHING
  - [ ] CREATE RULE no_delete_audit_logs: ON DELETE TO audit_logs DO INSTEAD NOTHING
- [ ] Write 002_add_audit_triggers.sql:
  - [ ] CREATE FUNCTION audit_trigger_func() RETURNS TRIGGER:
    - [ ] On INSERT: Log tableName, NEW.id, action=INSERT, newValues=row_to_json(NEW), changedBy=NEW.createdBy
    - [ ] On UPDATE: Log tableName, NEW.id, action=UPDATE, oldValues=row_to_json(OLD), newValues=row_to_json(NEW), changedBy=NEW.updatedBy
    - [ ] On DELETE: Log tableName, OLD.id, action=DELETE, oldValues=row_to_json(OLD), changedBy=current_setting('app.user_id')
  - [ ] CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
  - [ ] CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON appointments FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
  - [ ] CREATE TRIGGER audit_clinical_documents AFTER INSERT OR UPDATE OR DELETE ON clinical_documents FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
  - [ ] CREATE TRIGGER audit_patient_profiles AFTER INSERT OR UPDATE OR DELETE ON patient_profiles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
- [ ] Create server/src/config/migrations.ts:
  - [ ] Import node-pg-migrate
  - [ ] Export config: { databaseUrl: process.env.DATABASE_URL, dir: 'db/migrations', migrationsTable: 'schema_version' }
- [ ] Run migrations: `npm run migrate:up`
- [ ] Verify schema_version table: `SELECT * FROM schema_version;` shows 2 applied migrations
- [ ] Test INSERT audit: `INSERT INTO users (...) VALUES (...);` -> check audit_logs for INSERT row
- [ ] Test UPDATE audit: `UPDATE appointments SET status = 'completed' WHERE id = 'xxx';` -> check audit_logs for UPDATE row with oldValues/newValues
- [ ] Test DELETE audit: `DELETE FROM waitlist WHERE id = 'xxx';` -> check audit_logs for DELETE row
- [ ] Test immutability: `UPDATE audit_logs SET action = 'TEST' WHERE id = 'xxx';` -> verify ERROR
- [ ] Test rollback: `npm run migrate:down` -> verify trigger dropped, schema_version decremented
- [ ] Document migrations in server/db/README.md: How to create, run, rollback migrations
- [ ] Document audit logging: Which tables are audited, what fields are captured, how to query audit trail
