# Task - TASK_004_DB_MIGRATION_SYSTEM_SETUP

## Requirement Reference
- User Story: US_003  
- Story Location: `.propel/context/tasks/us_003/us_003.md`
- Acceptance Criteria:
    - AC2: Database initialized with all core tables created
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

> **Note**: Database migration infrastructure - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | node-pg-migrate | 6.x |
| Backend | TypeScript | 5.3.x |
| Database | PostgreSQL | 15+ |
| AI/ML | N/A | N/A |

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

> **Note**: Database migration tooling - no AI logic

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend database tooling only

## Task Overview
Implement automated database migration system using node-pg-migrate with version control, transactional rollback support, migration history tracking, and error recovery. Create migration scripts for all schema changes with comprehensive logging and validation. Integrate with backend startup to auto-run pending migrations.

## Dependent Tasks
- TASK_001_DB_POSTGRESQL_PGVECTOR_SETUP: Database must be installed
- TASK_002_DB_SCHEMA_TABLES_CREATION: Migration scripts created
- TASK_003_BE_DATABASE_CONNECTION_POOLING: Backend database connection configured

## Impacted Components
**Modified:**
- server/package.json (add node-pg-migrate, migration scripts)
- server/src/server.ts (run migrations on startup)
- database/migrations/*.sql (convert to node-pg-migrate format)

**New:**
- server/src/utils/migrationRunner.ts (auto-run migrations on startup)
- server/migrations/ (migration files in node-pg-migrate format)
- server/migrations/1710000001_create_core_tables.js (Users, Departments, etc.)
- server/migrations/1710000002_create_appointment_tables.js (Appointments, TimeSlots, etc.)
- server/migrations/1710000003_create_clinical_tables.js (ClinicalDocuments)
- server/migrations/1710000004_create_notification_tables.js (Notifications)
- server/migrations/1710000005_create_indexes.js (Performance indexes)
- server/migrations/1710000006_create_vector_indexes.js (pgvector indexes)
- server/migrations/1710000007_add_constraints.js (Foreign keys, checks)
- server/migrations/1710000008_add_vector_columns.js (Embedding columns)
- server/config/migrate.json (node-pg-migrate configuration)
- server/docs/MIGRATION_GUIDE.md (How to create/run migrations)

## Implementation Plan
1. **Install Migration Tool**: Add node-pg-migrate@6.x to server/package.json
2. **Configuration File**: Create migrate.json with database connection and migrations directory
3. **Migration Directory**: Create server/migrations/ for version-controlled migration files
4. **Convert SQL Migrations**: Transform database/migrations/*.sql to node-pg-migrate JavaScript format
5. **Transactional Support**: Ensure each migration wrapped in transaction with automatic rollback on error
6. **Migration History Table**: node-pg-migrate creates pgmigrations table to track executed migrations
7. **Startup Integration**: Create migrationRunner.ts to auto-run pending migrations before server starts
8. **Error Handling**: Catch migration errors, log details, rollback transaction, exit process
9. **Migration Scripts**: Add npm run migrate:up, migrate:down, migrate:status to package.json
10. **Testing**: Create test migration that fails to verify rollback works correctly
11. **Logging**: Log each migration execution (name, status, duration, timestamp)
12. **Documentation**: Write MIGRATION_GUIDE.md with examples of creating new migrations

## Current Project State
```
ASSIGNMENT/
├── app/                        # Frontend (US_001)
├── server/                     # Backend API (US_002, TASK_003)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts    # Pool configuration (TASK_003)
│   │   └── server.ts          # Entry point (to be modified)
└── database/                   # Database setup (TASKS_001-002)
    └── migrations/             # Raw SQL files (to be converted)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | server/package.json | Add node-pg-migrate@6.x, migration scripts (migrate:up, migrate:down, migrate:status) |
| CREATE | server/config/migrate.json | Database connection config, migrations-dir: "migrations", schema: "public" |
| CREATE | server/migrations/1710000001_create-core-tables.js | exports.up/down for Users, Departments, PatientProfiles, AuditLogs |
| CREATE | server/migrations/1710000002_create-appointment-tables.js | exports.up/down for Appointments, TimeSlots, Waitlist |
| CREATE | server/migrations/1710000003_create-clinical-tables.js | exports.up/down for ClinicalDocuments, Medications, Allergies |
| CREATE | server/migrations/1710000004_create-notification-tables.js | exports.up/down for Notifications |
| CREATE | server/migrations/1710000005_create-indexes.js | B-tree indexes on foreign keys, timestamps |
| CREATE | server/migrations/1710000006_create-vector-indexes.js | IVFFlat indexes on embedding columns |
| CREATE | server/migrations/1710000007_add-constraints.js | Foreign keys, unique constraints, check constraints |
| CREATE | server/migrations/1710000008_add-vector-columns.js | ALTER TABLE to add vector(1536) columns |
| CREATE | server/src/utils/migrationRunner.ts | Auto-run pending migrations with error handling |
| MODIFY | server/src/server.ts | Call await runMigrations() before server.listen() |
| CREATE | server/docs/MIGRATION_GUIDE.md | How to create migrations, run them, rollback, troubleshooting |
| CREATE | server/migrations/9999999999_test-rollback.js.skip | Test migration that fails (for testing rollback) |

> 2 modified files, 12 new files created

## External References
- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [node-pg-migrate API Reference](https://salsita.github.io/node-pg-migrate/#/api)
- [Migration Best Practices](https://salsita.github.io/node-pg-migrate/#/writing-migrations)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/15/tutorial-transactions.html)
- [Database Migration Strategies](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate)
- [Handling Migration Failures](https://github.com/salsita/node-pg-migrate#transactional-migrations)
- [Migration Naming Conventions](https://github.com/salsita/node-pg-migrate#migration-file-names)

## Build Commands
```bash
# Install node-pg-migrate
cd server
npm install node-pg-migrate

# Create new migration
npm run migrate:create add-table-name

# Run pending migrations (up)
npm run migrate:up

# Rollback last migration (down)
npm run migrate:down

# Check migration status
npm run migrate:status

# Run migrations programmatically (in server startup)
npm run dev
# Expected: Logs "Running pending migrations...", "Migration 1710000001_create-core-tables completed"

# Test rollback on failure
# Temporarily enable 9999999999_test-rollback.js (remove .skip extension)
npm run migrate:up
# Expected: Migration starts, fails, automatic rollback, error logged

# Force specific migration version
DATABASE_URL=postgres://... npx node-pg-migrate up 1710000005

# Undo all migrations (development only)
npm run migrate:down 0

# Check migration history
psql -U upaci_user -d upaci -c "SELECT * FROM pgmigrations ORDER BY run_on DESC;"
```

## Implementation Validation Strategy
- [x] Unit tests pass (migration runner logic tests)
- [x] Integration tests pass (actual migration execution tests)
- [x] node-pg-migrate installed: `npm list node-pg-migrate` shows version 6.x
- [x] migrate.json configuration valid: database-url, migrations-dir, schema defined
- [x] pgmigrations table created: `\d pgmigrations` shows table with id, name, run_on columns
- [x] All 8 migration files created: ls server/migrations/ shows timestamped files
- [x] Migrations run successfully: `npm run migrate:up` completes without errors
- [x] Tables created: `\dt` shows all 9 core tables after migrations
- [x] Migration history tracked: `SELECT * FROM pgmigrations;` shows all executed migrations
- [x] Rollback works: `npm run migrate:down` undoes last migration, table dropped
- [x] Transaction rollback: Test failing migration → verify no partial changes applied
- [x] Auto-run on startup: Start server → verify "Running pending migrations..." logged
- [x] Skip already-run migrations: Run migrate:up twice → second run logs "No pending migrations"
- [x] Migration status command: `npm run migrate:status` shows which migrations applied
- [x] Error logging: Introduce syntax error in migration → verify detailed error logged
- [x] MIGRATION_GUIDE.md complete: Documents creating, running, rolling back migrations

## Implementation Checklist
- [x] Install node-pg-migrate: `npm install node-pg-migrate`
- [x] Create server/config/migrate.json with database URL, migrations directory, schema name
- [x] Add migration scripts to package.json: "migrate:up": "node-pg-migrate up", "migrate:down": "node-pg-migrate down"
- [x] Add "migrate:status": "node-pg-migrate status", "migrate:create": "node-pg-migrate create"
- [x] Create server/migrations/ directory for migration files
- [x] Convert V001__create_core_tables.sql to 1710000001_create-core-tables.js with pgm.createTable()
- [x] Add exports.up function: pgm.createTable('users', { id: { type: 'serial', primaryKey: true }, ... })
- [x] Add exports.down function: pgm.dropTable('users')
- [x] Convert all 8 SQL migration files to node-pg-migrate format
- [x] Ensure transactional: node-pg-migrate wraps each migration in BEGIN/COMMIT automatically
- [x] Create server/src/utils/migrationRunner.ts with async function runMigrations()
- [x] Import node-pg-migrate programmatically: const { default: migrate } = require('node-pg-migrate')
- [x] Configure migration runner: await migrate({ databaseUrl: process.env.DATABASE_URL, direction: 'up', migrationsTable: 'pgmigrations', dir: 'migrations', checkOrder: true })
- [x] Add error handling: try/catch around migrate(), log error, process.exit(1)
- [x] Log migration progress: "Running pending migrations...", "All migrations completed successfully"
- [x] Modify server/src/server.ts: import runMigrations, call await runMigrations() before server.listen()
- [x] Test running migrations: Start clean database, run server → verify tables created
- [x] Test idempotency: Run server twice → second run skips migrations (already applied)
- [x] Create test-rollback.js.skip migration with exports.up that throws error
- [x] Test rollback: Remove .skip, run migration → verify error logged, no partial changes
- [x] Write MIGRATION_GUIDE.md: How to create migration with npm run migrate:create
- [x] Document up/down functions: exports.up creates resources, exports.down undoes changes
- [x] Document transaction behavior: Automatic rollback on error, no partial state
- [x] Document troubleshooting: Migration stuck? Check pgmigrations table, manually update if needed
- [x] Add examples: Creating table, adding column, creating index, adding foreign key
- [x] Test migration status: `npm run migrate:status` → verify output shows applied/pending migrations
