# Task - TASK_001_DB_WAITLIST_TABLE_SCHEMA

## Requirement Reference
- User Story: US_015  
- Story Location: `.propel/context/tasks/us_015/us_015.md`
- Acceptance Criteria:
    - AC1: System adds patient to waitlist (Waitlist table with appointment_id, patient_id, preferred_datetime, priority_score, created_at)
- Edge Cases:
    - Multiple patients on same slot: First-come-first-served based on created_at
    - Waitlist expiration: Expire after appointment date passes
    - No response within 2 hours: Auto-release slot

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

> **Note**: Database schema task only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | N/A | N/A |
| Database | PostgreSQL | 15+ |
| Database | node-postgres (pg) | 8.x |

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

> **Note**: Database schema only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Database schema only

## Task Overview
Create `waitlist` table to track patients waiting for fully-booked appointment slots. Schema includes: id (PK), patient_id (FK → patients), preferred_appointment_id (FK → appointments, nullable for date/time only), preferred_date, preferred_time, status (waiting, notified, accepted, expired, cancelled), priority_score (for future extensions), slot_hold_expires_at (timestamp when 2-hour hold expires), notified_at, created_at, updated_at. Add indexes on patient_id, status, preferred_date+time for fast lookups. Implement cascading deletes for patient removal. Add trigger to auto-update status to 'expired' when preferred_date passes. Create view for active waitlist entries (status='waiting' AND preferred_date >= CURRENT_DATE).

## Dependent Tasks
- US_007: Appointments table must exist
- US_007: Patients table must exist

## Impacted Components
**Modified:**
- None

**New:**
- database/migrations/XXX_create_waitlist_table.sql (Waitlist table DDL)
- database/migrations/XXX_add_waitlist_indexes.sql (Performance indexes)
- database/migrations/XXX_add_waitlist_triggers.sql (Auto-expiration trigger)
- database/views/active_waitlist_view.sql (Active waitlist view)

## Implementation Plan
1. **Create Waitlist Table**: Define columns for tracking waitlist entries
2. **Foreign Keys**: Link to patients and appointments tables with CASCADE rules
3. **Status Enum**: Create waitlist_status ENUM type (waiting, notified, accepted, expired, cancelled)
4. **Indexes**: Add indexes on patient_id, status, (preferred_date, preferred_time) for queries
5. **Expiration Trigger**: Auto-update status='expired' when preferred_date < CURRENT_DATE
6. **Active View**: Create view filtering active entries (waiting/notified, not expired)
7. **Constraints**: Add CHECK constraints for data integrity
8. **Partitioning**: Consider partitioning by preferred_date for performance (optional)

## Current Project State
```
ASSIGNMENT/
├── database/
│   ├── migrations/ (US_007)
│   │   ├── 001_create_patients_table.sql
│   │   ├── 002_create_appointments_table.sql
│   │   └── ...
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/XXX_create_waitlist_enum.sql | waitlist_status ENUM type |
| CREATE | database/migrations/XXX_create_waitlist_table.sql | Waitlist table with all columns |
| CREATE | database/migrations/XXX_add_waitlist_indexes.sql | Performance indexes |
| CREATE | database/migrations/XXX_add_waitlist_triggers.sql | Auto-expiration trigger |
| CREATE | database/views/active_waitlist_view.sql | Active waitlist view |

> 0 modified files, 5 new files created

## External References
- [PostgreSQL ENUM Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Cascading Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

## Build Commands
```bash
# Apply migrations in order
cd database

# 1. Create ENUM type
psql -U postgres -d clinic_db -f migrations/XXX_create_waitlist_enum.sql

# 2. Create waitlist table
psql -U postgres -d clinic_db -f migrations/XXX_create_waitlist_table.sql

# 3. Add indexes
psql -U postgres -d clinic_db -f migrations/XXX_add_waitlist_indexes.sql

# 4. Add triggers
psql -U postgres -d clinic_db -f migrations/XXX_add_waitlist_triggers.sql

# 5. Create view
psql -U postgres -d clinic_db -f views/active_waitlist_view.sql

# Verify table structure
psql -U postgres -d clinic_db -c "\d waitlist"

# Expected columns:
# - id (SERIAL PRIMARY KEY)
# - patient_id (INTEGER FK)
# - preferred_appointment_id (INTEGER FK, nullable)
# - preferred_date (DATE NOT NULL)
# - preferred_time (TIME NOT NULL)
# - status (waitlist_status DEFAULT 'waiting')
# - priority_score (INTEGER DEFAULT 0)
# - slot_hold_expires_at (TIMESTAMP)
# - notified_at (TIMESTAMP)
# - created_at (TIMESTAMP DEFAULT NOW())
# - updated_at (TIMESTAMP DEFAULT NOW())

# Verify indexes
psql -U postgres -d clinic_db -c "\di waitlist*"
# Expected indexes:
# - idx_waitlist_patient_id
# - idx_waitlist_status
# - idx_waitlist_preferred_datetime
# - idx_waitlist_hold_expires

# Verify trigger
psql -U postgres -d clinic_db -c "SELECT tgname FROM pg_trigger WHERE tgrelid = 'waitlist'::regclass;"
# Expected: update_waitlist_expiration_trigger

# Test expiration trigger
psql -U postgres -d clinic_db <<EOF
INSERT INTO waitlist (patient_id, preferred_date, preferred_time) 
VALUES (1, '2026-03-01', '10:00:00');
SELECT id, status FROM waitlist WHERE patient_id = 1;
-- Expected: status = 'expired' (date in past)
EOF

# Test active view
psql -U postgres -d clinic_db -c "SELECT * FROM active_waitlist_view;"
# Expected: Only entries with status IN ('waiting', 'notified') AND preferred_date >= CURRENT_DATE
```

## Implementation Validation Strategy
- [ ] waitlist_status ENUM type created with 5 values
- [ ] waitlist table created with 11 columns
- [ ] patient_id FK references patients(id) ON DELETE CASCADE
- [ ] preferred_appointment_id FK references appointments(id) ON DELETE SET NULL
- [ ] status column defaults to 'waiting'
- [ ] priority_score defaults to 0
- [ ] created_at, updated_at default to NOW()
- [ ] Index on patient_id exists
- [ ] Index on status exists
- [ ] Composite index on (preferred_date, preferred_time) exists
- [ ] Index on slot_hold_expires_at exists
- [ ] Trigger auto-updates status='expired' when date passes
- [ ] active_waitlist_view filters correctly
- [ ] CHECK constraint: slot_hold_expires_at > created_at (if not null)
- [ ] CHECK constraint: preferred_date >= created_at::DATE

## Implementation Checklist

### Create ENUM Type (database/migrations/XXX_create_waitlist_enum.sql)
- [ ] -- Migration: Create waitlist_status ENUM type
- [ ] DROP TYPE IF EXISTS waitlist_status CASCADE;
- [ ] CREATE TYPE waitlist_status AS ENUM (
- [ ]   'waiting',      -- Patient on waitlist, slot not available yet
- [ ]   'notified',     -- Patient notified, slot held for 2 hours
- [ ]   'accepted',     -- Patient accepted slot, appointment booked
- [ ]   'expired',      -- Appointment date passed or slot hold expired
- [ ]   'cancelled'     -- Patient cancelled waitlist entry
- [ ] );
- [ ] COMMENT ON TYPE waitlist_status IS 'Status lifecycle for waitlist entries';

### Create Waitlist Table (database/migrations/XXX_create_waitlist_table.sql)
- [ ] -- Migration: Create waitlist table for appointment slot tracking
- [ ] DROP TABLE IF EXISTS waitlist CASCADE;
- [ ] CREATE TABLE waitlist (
- [ ]   id SERIAL PRIMARY KEY,
- [ ]   patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
- [ ]   preferred_appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
- [ ]   preferred_date DATE NOT NULL,
- [ ]   preferred_time TIME NOT NULL,
- [ ]   status waitlist_status DEFAULT 'waiting' NOT NULL,
- [ ]   priority_score INTEGER DEFAULT 0 NOT NULL,
- [ ]   slot_hold_expires_at TIMESTAMP,
- [ ]   notified_at TIMESTAMP,
- [ ]   created_at TIMESTAMP DEFAULT NOW() NOT NULL,
- [ ]   updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
- [ ]   CONSTRAINT chk_hold_expires_after_created CHECK (slot_hold_expires_at IS NULL OR slot_hold_expires_at > created_at),
- [ ]   CONSTRAINT chk_preferred_date_valid CHECK (preferred_date >= created_at::DATE)
- [ ] );
- [ ] COMMENT ON TABLE waitlist IS 'Tracks patients waiting for fully-booked appointment slots';
- [ ] COMMENT ON COLUMN waitlist.patient_id IS 'FK to patients table';
- [ ] COMMENT ON COLUMN waitlist.preferred_appointment_id IS 'Optional FK to specific appointment slot';
- [ ] COMMENT ON COLUMN waitlist.preferred_date IS 'Preferred appointment date';
- [ ] COMMENT ON COLUMN waitlist.preferred_time IS 'Preferred appointment start time';
- [ ] COMMENT ON COLUMN waitlist.status IS 'Current waitlist entry status';
- [ ] COMMENT ON COLUMN waitlist.priority_score IS 'Priority ranking (0=FIFO, higher=priority)';
- [ ] COMMENT ON COLUMN waitlist.slot_hold_expires_at IS '2-hour hold expiration timestamp after notification';
- [ ] COMMENT ON COLUMN waitlist.notified_at IS 'Timestamp when patient was notified of availability';

### Create Indexes (database/migrations/XXX_add_waitlist_indexes.sql)
- [ ] -- Migration: Add performance indexes to waitlist table
- [ ] CREATE INDEX idx_waitlist_patient_id ON waitlist(patient_id);
- [ ] CREATE INDEX idx_waitlist_status ON waitlist(status);
- [ ] CREATE INDEX idx_waitlist_preferred_datetime ON waitlist(preferred_date, preferred_time);
- [ ] CREATE INDEX idx_waitlist_hold_expires ON waitlist(slot_hold_expires_at) WHERE slot_hold_expires_at IS NOT NULL;
- [ ] CREATE INDEX idx_waitlist_active ON waitlist(created_at) WHERE status IN ('waiting', 'notified');
- [ ] COMMENT ON INDEX idx_waitlist_patient_id IS 'Fast lookup of patient waitlist entries';
- [ ] COMMENT ON INDEX idx_waitlist_status IS 'Filter by status (waiting, notified, etc.)';
- [ ] COMMENT ON INDEX idx_waitlist_preferred_datetime IS 'Match waitlist entries to appointment slots';
- [ ] COMMENT ON INDEX idx_waitlist_hold_expires IS 'Find expired holds for auto-release';
- [ ] COMMENT ON INDEX idx_waitlist_active IS 'FIFO ordering for active waitlist (first-come-first-served)';

### Create Expiration Trigger (database/migrations/XXX_add_waitlist_triggers.sql)
- [ ] -- Migration: Auto-expire waitlist entries when date passes
- [ ] CREATE OR REPLACE FUNCTION expire_past_waitlist_entries()
- [ ] RETURNS TRIGGER AS $$
- [ ] BEGIN
- [ ]   IF NEW.preferred_date < CURRENT_DATE AND NEW.status = 'waiting' THEN
- [ ]     NEW.status := 'expired';
- [ ]     NEW.updated_at := NOW();
- [ ]   END IF;
- [ ]   RETURN NEW;
- [ ] END;
- [ ] $$ LANGUAGE plpgsql;
- [ ] CREATE TRIGGER update_waitlist_expiration_trigger
- [ ]   BEFORE INSERT OR UPDATE ON waitlist
- [ ]   FOR EACH ROW
- [ ]   EXECUTE FUNCTION expire_past_waitlist_entries();
- [ ] COMMENT ON FUNCTION expire_past_waitlist_entries IS 'Auto-expire waitlist entries for past dates';
- [ ] -- Trigger to update updated_at timestamp
- [ ] CREATE OR REPLACE FUNCTION update_waitlist_timestamp()
- [ ] RETURNS TRIGGER AS $$
- [ ] BEGIN
- [ ]   NEW.updated_at := NOW();
- [ ]   RETURN NEW;
- [ ] END;
- [ ] $$ LANGUAGE plpgsql;
- [ ] CREATE TRIGGER update_waitlist_timestamp_trigger
- [ ]   BEFORE UPDATE ON waitlist
- [ ]   FOR EACH ROW
- [ ]   EXECUTE FUNCTION update_waitlist_timestamp();

### Create Active Waitlist View (database/views/active_waitlist_view.sql)
- [ ] -- View: Active waitlist entries (not expired, current/future dates)
- [ ] DROP VIEW IF EXISTS active_waitlist_view CASCADE;
- [ ] CREATE VIEW active_waitlist_view AS
- [ ] SELECT 
- [ ]   w.id,
- [ ]   w.patient_id,
- [ ]   p.first_name || ' ' || p.last_name AS patient_name,
- [ ]   p.email AS patient_email,
- [ ]   p.phone AS patient_phone,
- [ ]   w.preferred_date,
- [ ]   w.preferred_time,
- [ ]   w.status,
- [ ]   w.priority_score,
- [ ]   w.slot_hold_expires_at,
- [ ]   w.notified_at,
- [ ]   w.created_at,
- [ ]   w.updated_at,
- [ ]   EXTRACT(EPOCH FROM (w.slot_hold_expires_at - NOW())) / 60 AS minutes_until_hold_expires
- [ ] FROM waitlist w
- [ ] JOIN patients p ON w.patient_id = p.id
- [ ] WHERE w.status IN ('waiting', 'notified')
- [ ]   AND w.preferred_date >= CURRENT_DATE
- [ ] ORDER BY w.priority_score DESC, w.created_at ASC;
- [ ] COMMENT ON VIEW active_waitlist_view IS 'Active waitlist entries with patient details (FIFO order)';

### Verification Queries
- [ ] -- Verify table structure
- [ ] SELECT column_name, data_type, is_nullable, column_default 
- [ ] FROM information_schema.columns 
- [ ] WHERE table_name = 'waitlist' ORDER BY ordinal_position;
- [ ] -- Verify foreign keys
- [ ] SELECT constraint_name, table_name, column_name, 
- [ ]        foreign_table_name, foreign_column_name
- [ ] FROM information_schema.key_column_usage
- [ ] WHERE table_name = 'waitlist';
- [ ] -- Verify indexes exist
- [ ] SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'waitlist';
- [ ] -- Test FIFO ordering
- [ ] INSERT INTO waitlist (patient_id, preferred_date, preferred_time)
- [ ] VALUES (1, '2026-03-25', '10:00:00'), (2, '2026-03-25', '10:00:00'), (3, '2026-03-25', '10:00:00');
- [ ] SELECT patient_id, created_at FROM active_waitlist_view WHERE preferred_date = '2026-03-25';
- [ ] -- Expected: Ordered by created_at ASC (first patient first)
- [ ] -- Test expiration
- [ ] INSERT INTO waitlist (patient_id, preferred_date, preferred_time) VALUES (4, '2026-03-01', '10:00:00');
- [ ] SELECT status FROM waitlist WHERE patient_id = 4;
- [ ] -- Expected: status = 'expired'
