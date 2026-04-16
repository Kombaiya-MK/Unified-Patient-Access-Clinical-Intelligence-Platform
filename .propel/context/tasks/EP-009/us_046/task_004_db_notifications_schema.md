# Task - task_004_db_notifications_schema

## Requirement Reference
- User Story: us_046
- Story Location: .propel/context/tasks/us_046/us_046.md
- Acceptance Criteria:
    - **AC-1 Notification Storage**: Store notification records with id, user_id, type, title, message, priority, read_status, timestamp, action_url
    - **AC-1 Query Optimization**: Efficient queries for fetching missed notifications (indexed by user_id, created_at), unread count, and paginated history
    - **AC-1 User Preferences**: Store per-user notification preferences (enable/disable by category)
- Edge Case:
    - **Notification Retention**: Archive notifications older than 90 days, maintain only unread or recent notifications for active users

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
| Migration | Flyway / Liquibase / Custom Node scripts | latest |

**Note**: All code, and libraries, MUST be compatible with versions above.

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
Create database schema for storing real-time notifications including Notifications table with columns (notification_id UUID PK, user_id FK, type enum, title varchar, message text, priority enum, read_status boolean, created_at timestamp, read_at timestamp, action_url text) and UserNotificationPreferences table for per-user notification settings (user_id FK, preferences JSONB with categories: appointment, medication, system, waitlist). Implement indexes for query optimization: composite index on (user_id, created_at) for missed notification fetching, index on (user_id, read_status) for unread count queries. Create database migration scripts with versioning (V008__create_notifications_table.sql) and rollback support. Add trigger or scheduled job for notification retention policy (archive or delete notifications older than 90 days, preserve unread).

## Dependent Tasks
- task_002_be_websocket_notification_service (writes notifications to database)
- task_003_be_notification_rest_api (queries notifications table)
- US-007 (Users table with user_id FK reference)

## Impacted Components
- **NEW**: `database/migrations/V008__create_notifications_table.sql` - Create Notifications and UserNotificationPreferences tables
- **NEW**: `database/migrations/V009__add_notification_indexes.sql` - Add indexes for query optimization
- **NEW**: `database/functions/fn_archive_old_notifications.sql` - Stored function for notification retention policy (archive >90 days)
- **NEW**: `database/rollback/rollback_notifications.sql` - Rollback script for migrations
- **MODIFY**: `database/schema/README.md` - Document schema changes and query patterns

## Implementation Plan
1. **Create Notifications table**: Columns: notification_id (UUID PK, default gen_random_uuid()), user_id (UUID FK to Users), type (enum: appointment/medication/system/waitlist), title (varchar 255), message (text), priority (enum: info/warning/critical), read_status (boolean, default false), created_at (timestamp with time zone, default NOW()), read_at (timestamp with time zone, nullable), action_url (text, nullable)
2. **Create UserNotificationPreferences table**: Columns: user_id (UUID PK FK to Users), preferences (JSONB default '{"appointment": true, "medication": true, "system": true, "waitlist": true}'), updated_at (timestamp with time zone, default NOW())
3. **Add indexes for optimization**: Composite index on Notifications(user_id, created_at DESC) for missed notification queries, index on (user_id, read_status) for unread count queries, index on (user_id, type) for filtering by notification type
4. **Add foreign key constraints**: user_id references Users(user_id) ON DELETE CASCADE (delete notifications when user deleted), ensure referential integrity
5. **Create notification type and priority enums**: CREATE TYPE notification_type AS ENUM ('appointment', 'medication', 'system', 'waitlist'), CREATE TYPE notification_priority AS ENUM ('info', 'warning', 'critical')
6. **Implement retention policy function**: fn_archive_old_notifications() stored function: DELETE FROM Notifications WHERE read_status = true AND created_at < NOW() - INTERVAL '90 days', keep unread notifications indefinitely
7. **Add scheduled job for retention**: Use pg_cron extension or external cron job to run retention function daily at midnight
8. **Create migration scripts**: Flyway/Liquibase migration V008 for table creation, V009 for indexes, include rollback scripts for downgrade
9. **Add table triggers**: AFTER UPDATE trigger on read_status to set read_at timestamp when notification marked as read
10. **Document query patterns**: Add README with example queries (fetch missed, unread count, mark as read, paginated history), performance benchmarks (<50ms for unread count)

**Focus on how to implement**:
- Notifications schema: `CREATE TABLE Notifications ( notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE, type notification_type NOT NULL, title VARCHAR(255) NOT NULL, message TEXT, priority notification_priority NOT NULL DEFAULT 'info', read_status BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), read_at TIMESTAMP WITH TIME ZONE, action_url TEXT );`
- Indexes: `CREATE INDEX idx_notifications_user_created ON Notifications(user_id, created_at DESC); CREATE INDEX idx_notifications_user_read ON Notifications(user_id, read_status); CREATE INDEX idx_notifications_user_type ON Notifications(user_id, type);`
- Preferences schema: `CREATE TABLE UserNotificationPreferences ( user_id UUID PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE, preferences JSONB NOT NULL DEFAULT '{"appointment": true, "medication": true, "system": true, "waitlist": true}'::jsonb, updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() );`
- Retention function: `CREATE FUNCTION fn_archive_old_notifications() RETURNS void AS $$ BEGIN DELETE FROM Notifications WHERE read_status = true AND created_at < NOW() - INTERVAL '90 days'; END; $$ LANGUAGE plpgsql;`
- Read timestamp trigger: `CREATE TRIGGER trg_set_read_at BEFORE UPDATE ON Notifications FOR EACH ROW WHEN (OLD.read_status = false AND NEW.read_status = true) EXECUTE FUNCTION set_read_at_timestamp();`
- Missed notifications query: `SELECT * FROM Notifications WHERE user_id = $1 AND created_at > $2 ORDER BY created_at DESC;`
- Unread count query: `SELECT COUNT(*) FROM Notifications WHERE user_id = $1 AND read_status = false;`

## Current Project State
```
database/
├── migrations/
│   ├── V001__create_core_tables.sql (existing)
│   └── (to create: V008__create_notifications_table.sql, V009__add_notification_indexes.sql)
├── functions/
│   └── (to create: fn_archive_old_notifications.sql)
├── rollback/
│   └── (to create: rollback_notifications.sql)
└── schema/
    └── README.md (to modify: document notifications schema)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V008__create_notifications_table.sql | Migration: CREATE TYPE notification_type ENUM ('appointment', 'medication', 'system', 'waitlist'); CREATE TYPE notification_priority ENUM ('info', 'warning', 'critical'); CREATE TABLE Notifications (notification_id UUID PK, user_id UUID FK Users, type notification_type, title VARCHAR(255), message TEXT, priority notification_priority DEFAULT 'info', read_status BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW(), read_at TIMESTAMP, action_url TEXT); CREATE TABLE UserNotificationPreferences (user_id UUID PK FK Users, preferences JSONB DEFAULT '{"appointment": true, "medication": true, "system": true, "waitlist": true}', updated_at TIMESTAMP DEFAULT NOW()); |
| CREATE | database/migrations/V009__add_notification_indexes.sql | Migration: CREATE INDEX idx_notifications_user_created ON Notifications(user_id, created_at DESC); CREATE INDEX idx_notifications_user_read ON Notifications(user_id, read_status); CREATE INDEX idx_notifications_user_type ON Notifications(user_id, type); CREATE INDEX idx_prefs_user ON UserNotificationPreferences(user_id); |
| CREATE | database/functions/fn_archive_old_notifications.sql | Stored function: FUNCTION fn_archive_old_notifications() RETURNS void; DELETE FROM Notifications WHERE read_status = true AND created_at < NOW() - INTERVAL '90 days'; keep unread notifications indefinitely |
| CREATE | database/functions/fn_set_read_at_timestamp.sql | Trigger function: FUNCTION set_read_at_timestamp() RETURNS trigger; NEW.read_at = NOW() WHEN OLD.read_status = false AND NEW.read_status = true; RETURN NEW; |
| CREATE | database/triggers/trg_set_read_at.sql | Trigger: CREATE TRIGGER trg_set_read_at BEFORE UPDATE ON Notifications FOR EACH ROW WHEN (OLD.read_status = false AND NEW.read_status = true) EXECUTE FUNCTION set_read_at_timestamp(); |
| CREATE | database/rollback/rollback_notifications.sql | Rollback script: DROP TRIGGER IF EXISTS trg_set_read_at ON Notifications; DROP FUNCTION IF EXISTS fn_archive_old_notifications; DROP FUNCTION IF EXISTS set_read_at_timestamp; DROP TABLE IF EXISTS UserNotificationPreferences CASCADE; DROP TABLE IF EXISTS Notifications CASCADE; DROP TYPE IF EXISTS notification_priority; DROP TYPE IF EXISTS notification_type; |
| MODIFY | database/schema/README.md | Documentation: Add schema diagrams for Notifications/UserNotificationPreferences tables, example queries (missed notifications, unread count, mark as read, paginated history), performance benchmarks (<50ms unread count), retention policy explanation (90 days for read notifications) |

## External References
- **PostgreSQL ENUM Types**: https://www.postgresql.org/docs/15/datatype-enum.html (ENUM type for notification_type and notification_priority)
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/15/datatype-json.html (JSONB for notification preferences)
- **PostgreSQL Indexes**: https://www.postgresql.org/docs/15/indexes.html (B-tree indexes for query optimization)
- **PostgreSQL Triggers**: https://www.postgresql.org/docs/15/trigger-definition.html (BEFORE UPDATE trigger for read_at timestamp)
- **PostgreSQL Foreign Keys**: https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-FK (ON DELETE CASCADE for referential integrity)
- **DR-009 Requirement**: .propel/context/docs/design.md#DR-009 (Notifications table schema requirement)

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
psql -U postgres -d appointment_platform -f migrations/V008__create_notifications_table.sql

# Validate schema
psql -U postgres -d appointment_platform -c "\d Notifications"
psql -U postgres -d appointment_platform -c "\d UserNotificationPreferences"
```

## Implementation Checklist
- [x] Create V008 migration: CREATE TYPE notification_type ENUM, CREATE TYPE notification_priority ENUM, CREATE TABLE Notifications (notification_id UUID PK, user_id FK Users, type, title, message, priority, read_status, created_at, read_at, action_url)
- [x] Create UserNotificationPreferences table: user_id UUID PK FK Users ON DELETE CASCADE, preferences JSONB DEFAULT '{"appointment": true, "medication": true, "system": true, "waitlist": true}', updated_at timestamp
- [x] Create V009 migration with indexes: Composite index (user_id, created_at DESC), index (user_id, read_status), index (user_id, type), index on UserNotificationPreferences(user_id)
- [x] Add foreign key constraints: user_id references Users(user_id) ON DELETE CASCADE for both tables, ensure referential integrity
- [x] Create fn_archive_old_notifications stored function: DELETE FROM Notifications WHERE read_status = true AND created_at < NOW() - INTERVAL '90 days', keep unread notifications
- [x] Implement set_read_at_timestamp trigger function: BEFORE UPDATE trigger sets read_at = NOW() when read_status changes from false to true
- [x] Add rollback script: DROP TRIGGER, DROP FUNCTION, DROP TABLE UserNotificationPreferences/Notifications CASCADE, DROP TYPE notification_priority/notification_type for safe downgrade
- [x] Document schema: Add README with query examples (missed notifications, unread count, mark as read), performance benchmarks (<50ms), retention policy (90 days), JSONB preference structure
