# Calendar Sync Database Schema - Architecture Notes

## Migration Overview

This document explains the calendar sync database schema implementation for US_017 (Calendar Sync Integration).

## Architecture Decision: Normalized vs Denormalized Design

### Original Task Specification
The task initially specified adding calendar sync columns directly to the `users`/`patients` table:
- calendar_provider
- calendar_sync_enabled  
- calendar_access_token (encrypted)
- calendar_refresh_token (encrypted)
- calendar_token_expires_at
- calendar_sync_last_error
- calendar_connected_at

### Implemented Architecture (V012)
Instead, **V012** implemented a normalized design with a separate `calendar_tokens` table.

**Rationale for Normalized Design:**
1. **Multi-Provider Support**: Users can connect multiple calendar providers simultaneously (Google + Outlook)
2. **Token Isolation**: OAuth tokens are isolated in a dedicated table for better security
3. **Easier Token Rotation**: Refresh/revoke operations don't touch user table
4. **Cleaner Separation**: User authentication vs calendar integration concerns separated
5. **Better Indexing**: Optimized indexes on token expiry without bloating user table

### Migration Files Created

| Migration | Purpose | Status |
|-----------|---------|--------|
| **V012** | Creates `calendar_tokens` table + adds calendar columns to `appointments` | ✅ Existing |
| **V020** | Adds `calendar_sync_status`, `calendar_sync_retries` to `appointments` | ✅ New (2026-03-20) |
| **V021** | Creates `calendar_sync_queue` table for rate limiting | ✅ New (2026-03-20) |
| **V022** | Adds performance indexes + monitoring views + utility functions | ✅ New (2026-03-20) |

## Schema Summary

### calendar_tokens Table (V012)
Stores OAuth2 tokens for calendar providers per user.

```sql
CREATE TABLE calendar_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'outlook')),
    access_token TEXT NOT NULL,  -- Encrypted
    refresh_token TEXT,          -- Encrypted  
    token_expiry TIMESTAMPTZ NOT NULL,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)    -- One token per provider per user
);
```

**Benefits:**
- User can connect both Google AND Outlook simultaneously
- Easy to revoke specific provider without affecting others
- Token encryption isolated from user data

### appointments Table Additions (V012 + V020)

**V012 Added:**
- `calendar_event_id` VARCHAR(255) - External event ID from Google/Outlook
- `calendar_provider` VARCHAR(20) - Which provider was used ('google' or 'outlook')
- `calendar_synced_at` TIMESTAMPTZ - When sync completed

**V020 Added:**
- `calendar_sync_status` VARCHAR(20) - Status: 'pending', 'synced', 'failed', 'no_sync'
- `calendar_sync_retries` INTEGER - Retry count (max 2 per AIR requirements)
- `calendar_sync_last_attempt` TIMESTAMPTZ - Last sync attempt (for rate limiting)
- `calendar_sync_error` TEXT - Last error message

### calendar_sync_queue Table (V021)
Handles rate limiting for calendar API calls (batch process every 5 min per US_017).

```sql
CREATE TABLE calendar_sync_queue (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    payload JSONB NOT NULL,       -- Appointment details for sync
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 2),
    scheduled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:**
- Queue calendar sync operations when rate limits are hit
- Batch process every 5 minutes to respect API quotas
- Automatic retry with exponential backoff (5s, 15s)

### Performance Indexes (V022)

**Key Indexes:**
1. `idx_calendar_tokens_active` - Find users with active (non-expired) tokens
2. `idx_appointments_calendar_sync_pending` - Find pending syncs
3. `idx_appointments_calendar_sync_failed` - Find failed syncs eligible for retry
4. `idx_calendar_queue_processing` - Process queue in FIFO order
5. `idx_calendar_queue_retry` - Find failed items needing retry

### Monitoring & Utilities (V022)

**View: v_calendar_sync_health**
System health dashboard for monitoring:
- Users with calendar connected (active vs expired tokens)
- Provider breakdown (Google vs Outlook)
- Appointment sync status counts
- Queue status and stuck item detection

**Function: calendar_queue_schedule_retry()**
Automatically reschedule failed queue items with exponential backoff:
- 1st retry: 5 seconds delay
- 2nd retry: 15 seconds delay  
- Max retries: 2 (per AIR requirements)

**Function: calendar_queue_cleanup_old(retention_days)**
Clean up old completed/failed queue items (default 7-day retention).

## Compliance with Requirements

### AIR Requirements (AI Impact Requirements)
- ✅ **AIR-O02**: Human override - Users can manually disconnect calendar sync
- ✅ **Retry Logic**: Max 2 retries with exponential backoff (5s, 15s)
- ✅ **Rate Limiting**: Queue-based batch processing every 5 minutes

### Security (OWASP)
- ✅ **Token Encryption**: OAuth tokens stored encrypted (ready for pgcrypto)
- ✅ **Token Isolation**: Separate table reduces attack surface
- ✅ **Audit Trail**: created_at, updated_at on all tables
- ✅ **Cascade Deletion**: ON DELETE CASCADE prevents orphaned records

### Performance (NFR)
- ✅ **Optimized Indexes**: Partial indexes on active records only
- ✅ **Queue Processing**: Batch operations reduce API calls
- ✅ **Monitoring**: Health view identifies performance bottlenecks

## Usage Examples

### Check Calendar Sync Health
```sql
SELECT * FROM v_calendar_sync_health;
```

### Manually Trigger Retry
```sql
SELECT calendar_queue_schedule_retry();  
-- Returns count of items rescheduled
```

### Clean Up Old Queue Items
```sql
SELECT calendar_queue_cleanup_old(7);  -- 7-day retention
-- Returns count of deleted items
```

### Find Stuck Processing Items
```sql
SELECT * FROM calendar_sync_queue 
WHERE status = 'processing' 
  AND updated_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes';
```

## Migration Application Order

Apply in this exact order:

```bash
# 1. Base calendar support (already applied)
psql -d clinic_db -f V012__create_calendar_tokens_table.sql

# 2. Add sync tracking to appointments
psql -d clinic_db -f V020__add_calendar_sync_tracking_to_appointments.sql

# 3. Create sync queue for rate limiting
psql -d clinic_db -f V021__create_calendar_sync_queue_table.sql

# 4. Add indexes and utilities
psql -d clinic_db -f V022__add_calendar_sync_indexes_and_utilities.sql
```

## Comparison: Normalized vs Denormalized

| Aspect | Denormalized (Task Spec) | Normalized (Implemented) |
|--------|--------------------------|--------------------------|
| Multi-Provider | ❌ Only one provider per user | ✅ Multiple providers supported |
| Token Security | ⚠️ Tokens in user table | ✅ Isolated in separate table |
| Query Performance | ✅ Single table lookup | ⚠️ Requires JOIN |
| Schema Flexibility | ❌ Hard to extend | ✅ Easy to add providers |
| Token Rotation | ⚠️ Touches user table | ✅ Isolated updates |
| Database Normalization | ❌ Violates 3NF | ✅ Follows 3NF |

**Decision: Normalized approach is superior** for this use case due to multi-provider support and better separation of concerns.

## Related Documentation
- [OAuth2 Implementation Guide](../../server/src/services/googleCalendarService.ts)
- [Calendar Sync Service](../../server/src/services/calendarSyncService.ts)  
- [Frontend Calendar Sync Modal](../../app/src/components/booking/CalendarSyncModal.tsx)
- [US_017 User Story](../../.propel/context/tasks/EP-002/us_017/us_017.md)

---
**Last Updated:** March 20, 2026  
**Migration Version:** V012, V020, V021, V022  
**Architecture Decision:** Normalized design with separate calendar_tokens table
