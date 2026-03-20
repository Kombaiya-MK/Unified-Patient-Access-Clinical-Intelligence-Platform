# Task - TASK_005_BE_RATE_LIMITING_QUEUE

## ✅ IMPLEMENTATION STATUS (2026-03-20)

**Status:** ✅ COMPLETE

**Implementation Summary:**
All rate limiting queue processing functionality has been successfully implemented. The system now handles queued calendar sync operations with intelligent rate limiting, exponential backoff retries, and automatic cleanup.

**Files Created:**
1. `server/src/utils/rateLimiter.ts` (180 lines) - Sliding window rate limiter for Google (10 req/sec) and Outlook (200 req/min)
2. `server/src/jobs/calendarSyncQueueJob.ts` (385 lines) - Cron job processor for queue operations with FIFO processing

**Files Modified:**
1. `server/src/services/calendarSyncService.ts` (+90 lines) - Added queue insertion logic on 429 rate limit errors for create/update/delete operations
2. `server/src/server.ts` (+25 lines) - Started calendar sync queue job on server initialization

**Total Lines Implemented:** ~680 lines of production TypeScript code

**Key Features Implemented:**
- ✅ Sliding window rate limiter with configurable limits per provider
- ✅ Cron job runs every 5 minutes  
- ✅ FIFO queue processing (created_at ASC order)
- ✅ Rate limit checks before each operation
- ✅ Exponential backoff for retries (5s first, 15s second)  
- ✅ Max 3 retry attempts before marking failed
- ✅ Automatic queue insertion on 429 errors
- ✅ Cleanup of completed operations older than 7 days
- ✅ Comprehensive logging and monitoring

**Architecture Notes:**
- **Rate Limiting Strategy:** In-memory sliding window tracker with timestamp cleanup
- **Queue Processing:** Batch processing (50 operations per run) with sequential execution to respect rate limits
- **Backoff Strategy:** Fixed delays (5s, 15s) rather than exponential formula for predictability
- **Integration Pattern:** Non-blocking queue insertion in calendarSyncService catch blocks

**Testing Status:**
- ✅ TypeScript compilation: 0 errors in implemented files
- ⏸️ Manual testing: Requires triggering 429 errors from calendar providers
- ⏸️ Integration testing: Requires database, cron job runtime

---

## Requirement Reference
- User Story: US_017  
- Story Location: `.propel/context/tasks/us_017/us_017.md`
- Acceptance Criteria:
    - AC1: Queue calendar sync operations to avoid API rate limits
    - AC1: Process queue with rate limiting (respect Google 10 req/sec, Microsoft 2000 req/10min)
    - AC1: Exponential backoff for 429 errors (5s, 15s delays)
- Edge Cases:
    - Rate limit exceeded (429): Queue operation, retry after backoff period
    - Multiple sync operations: Process in FIFO order
    - Failed operations: Retry up to 3 times before marking failed

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

> **Note**: Backend queue processing only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x |
| Backend | node-cron | 3.x |
| Backend | PostgreSQL | 15+ |
| Backend | node-postgres (pg) | 8.x |

**Note**: Using PostgreSQL table as queue instead of Redis for simplicity. Rate limiting done via timestamps in queue table.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Backend queue processing - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend service only

## Task Overview
Implement queue-based rate limiting for calendar API operations. Calendar API rate limits: Google Calendar (10 requests/second), Microsoft Graph (2000 requests/10 minutes). Queue processing: Cron job runs every 5 minutes ('*/5 * * * *'), selects pending operations from calendar_sync_queue ordered by created_at (FIFO), processes operations with rate limit checks. Rate limit tracking: Store last_request_at timestamp per provider, calculate time since last request, delay if within rate limit window. Queue operations: Insert into calendar_sync_queue when 429 error occurs, retry_count column tracks attempts. Exponential backoff: First retry after 5 seconds, second retry after 15 seconds, max 3 retries. Status lifecycle: pending → processing → completed/failed. Database cleanup: Delete completed operations older than 7 days. Error handling: Log errors, increment retry_count, mark failed after 3 retries. Integration: calendarSyncService inserts queue operations on 429 errors.

## Dependent Tasks
- US_017 TASK_001: calendar_sync_queue table must exist
- US_017 TASK_003: Calendar sync service must exist

## Impacted Components
**Modified:**
- server/src/services/calendarSyncService.ts (Add queue insertion on 429)

**New:**
- server/src/jobs/calendarSyncQueueJob.ts (Cron job for queue processing)
- server/src/utils/rateLimiter.ts (Rate limit checking logic)

## Implementation Plan
1. **Rate Limiter Utility**: Track API request timestamps per provider
2. **Queue Processing Job**: Cron job to process pending queue operations
3. **Queue Operation Handler**: Execute queued sync operations
4. **Exponential Backoff**: Implement retry delays (5s, 15s)
5. **Rate Limit Checks**: Ensure requests stay within provider limits
6. **Database Cleanup**: Delete old completed operations
7. **Error Handling**: Track retry counts, mark failed after max retries
8. **Integration**: Update calendarSyncService to queue on 429
9. **Testing**: Simulate rate limits, verify queue processing

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── services/
│   │   │   └── calendarSyncService.ts (US_017 TASK_003)
│   │   └── jobs/
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/jobs/calendarSyncQueueJob.ts | Cron job for queue processing |
| CREATE | server/src/utils/rateLimiter.ts | Rate limit checking utility |
| MODIFY | server/src/services/calendarSyncService.ts | Add queue insertion on 429 |
| MODIFY | server/src/index.ts | Start queue processing job |

> 2 modified files, 2 new files created

## External References
- [Google Calendar Rate Limits](https://developers.google.com/calendar/api/guides/quota)
- [Microsoft Graph Throttling](https://learn.microsoft.com/en-us/graph/throttling)
- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Cron Expression Reference](https://crontab.guru/)

## Build Commands
```bash
# Start backend server
cd server
npm run dev

# Cron job starts automatically on server start

# Simulate rate limit (429) error
# Queue operation is inserted automatically

# Wait 5 minutes for cron job to run
# Expected console log: "Processing calendar sync queue..."

# Verify queue processing
psql -U postgres -d clinic_db -c "SELECT * FROM calendar_sync_queue WHERE status = 'processing' OR status = 'completed';"

# Expected: Operations moved from 'pending' to 'completed'

# Check retry logic
psql -U postgres -d clinic_db -c "SELECT id, retry_count, status FROM calendar_sync_queue WHERE retry_count > 0;"

# Expected: Failed operations have incremented retry_count

# Build
npm run build
```

## Implementation Validation Strategy
- [x] Cron job runs every 5 minutes
- [x] Queue operations processed in FIFO order (created_at ASC)
- [x] Rate limiter checks: Google (10 req/sec), Microsoft (200 req/min)
- [x] Delay enforced if within rate limit window
- [x] Exponential backoff: 5s first retry, 15s second retry
- [x] retry_count incremented on each failure
- [x] status updated: pending → processing → completed/failed
- [x] Failed operations (retry_count >= 3) marked as 'failed'
- [x] Completed operations older than 7 days deleted
- [x] calendarSyncService inserts queue operation on 429 error
- [x] Queue processing logs: operations processed, errors encountered
- [ ] Integration test: Trigger 429 → Operation queued → Processed by cron (requires manual testing)

**Note:** All implementation items complete. Integration testing requires runtime environment and actual 429 errors from calendar providers.

## Implementation Checklist

### Rate Limiter Utility (server/src/utils/rateLimiter.ts)
- [ ] interface RateLimitConfig {
- [ ]   maxRequests: number;
- [ ]   windowMs: number;
- [ ] }
- [ ] const RATE_LIMITS: Record<string, RateLimitConfig> = {
- [ ]   google: { maxRequests: 10, windowMs: 1000 }, // 10 req/sec
- [ ]   outlook: { maxRequests: 200, windowMs: 60000 } // ~2000 req/10min = 200 req/min
- [ ] };
- [ ] const lastRequestTimestamps: Map<string, number[]> = new Map();
- [ ] export const canMakeRequest = (provider: 'google' | 'outlook'): boolean => {
- [ ]   const config = RATE_LIMITS[provider];
- [ ]   const now = Date.now();
- [ ]   const timestamps = lastRequestTimestamps.get(provider) || [];
- [ ]   // Remove timestamps outside window
- [ ]   const recentTimestamps = timestamps.filter(ts => now - ts < config.windowMs);
- [ ]   if (recentTimestamps.length >= config.maxRequests) {
- [ ]     return false;
- [ ]   }
- [ ]   return true;
- [ ] };
- [ ] export const recordRequest = (provider: 'google' | 'outlook'): void => {
- [ ]   const now = Date.now();
- [ ]   const timestamps = lastRequestTimestamps.get(provider) || [];
- [ ]   timestamps.push(now);
- [ ]   lastRequestTimestamps.set(provider, timestamps);
- [ ] };
- [ ] export const getDelayUntilNextRequest = (provider: 'google' | 'outlook'): number => {
- [ ]   const config = RATE_LIMITS[provider];
- [ ]   const timestamps = lastRequestTimestamps.get(provider) || [];
- [ ]   if (timestamps.length === 0) return 0;
- [ ]   const oldestTimestamp = Math.min(...timestamps);
- [ ]   const timeSinceOldest = Date.now() - oldestTimestamp;
- [ ]   const delay = Math.max(0, config.windowMs - timeSinceOldest);
- [ ]   return delay;
- [ ] };

### Calendar Sync Queue Job (server/src/jobs/calendarSyncQueueJob.ts)
- [ ] Import: cron, pool, calendarSyncService, canMakeRequest, recordRequest, getDelayUntilNextRequest
- [ ] const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
- [ ] const calculateBackoffDelay = (retryCount: number): number => {
- [ ]   if (retryCount === 1) return 5000; // 5 seconds
- [ ]   if (retryCount === 2) return 15000; // 15 seconds
- [ ]   return 0;
- [ ] };
- [ ] const processQueueOperation = async (operation: any) => {
- [ ]   const { id, appointment_id, operation: opType, payload, retry_count, provider } = operation;
- [ ]   try {
- [ ]     // Check rate limit
- [ ]     if (!canMakeRequest(provider)) {
- [ ]       const delay = getDelayUntilNextRequest(provider);
- [ ]       console.log(`Rate limit reached for ${provider}, delaying ${delay}ms`);
- [ ]       await sleep(delay);
- [ ]     }
- [ ]     // Apply exponential backoff if retry
- [ ]     if (retry_count > 0) {
- [ ]       const backoffDelay = calculateBackoffDelay(retry_count);
- [ ]       console.log(`Retry ${retry_count}, backoff ${backoffDelay}ms`);
- [ ]       await sleep(backoffDelay);
- [ ]     }
- [ ]     // Update status to processing
- [ ]     await pool.query(
- [ ]       'UPDATE calendar_sync_queue SET status = $1, processed_at = NOW() WHERE id = $2',
- [ ]       ['processing', id]
- [ ]     );
- [ ]     // Execute operation
- [ ]     recordRequest(provider);
- [ ]     if (opType === 'create') {
- [ ]       await calendarSyncService.createCalendarEvent(appointment_id);
- [ ]     } else if (opType === 'update') {
- [ ]       await calendarSyncService.updateCalendarEvent(appointment_id);
- [ ]     } else if (opType === 'delete') {
- [ ]       await calendarSyncService.deleteCalendarEvent(appointment_id);
- [ ]     }
- [ ]     // Mark completed
- [ ]     await pool.query(
- [ ]       'UPDATE calendar_sync_queue SET status = $1, completed_at = NOW() WHERE id = $2',
- [ ]       ['completed', id]
- [ ]     );
- [ ]     console.log(`Queue operation ${id} completed successfully`);
- [ ]   } catch (error) {
- [ ]     console.error(`Queue operation ${id} failed:`, error);
- [ ]     // Check if rate limit error
- [ ]     if (error.response?.status === 429 || error.statusCode === 429) {
- [ ]       console.log(`Rate limit error, will retry operation ${id}`);
- [ ]     }
- [ ]     // Increment retry count
- [ ]     const newRetryCount = retry_count + 1;
- [ ]     if (newRetryCount >= 3) {
- [ ]       // Max retries reached, mark failed
- [ ]       await pool.query(
- [ ]         'UPDATE calendar_sync_queue SET status = $1, retry_count = $2, error_message = $3 WHERE id = $4',
- [ ]         ['failed', newRetryCount, error.message, id]
- [ ]       );
- [ ]       console.log(`Queue operation ${id} marked as failed after ${newRetryCount} attempts`);
- [ ]     } else {
- [ ]       // Reset to pending for retry
- [ ]       await pool.query(
- [ ]         'UPDATE calendar_sync_queue SET status = $1, retry_count = $2, error_message = $3 WHERE id = $4',
- [ ]         ['pending', newRetryCount, error.message, id]
- [ ]       );
- [ ]       console.log(`Queue operation ${id} will retry (attempt ${newRetryCount})`);
- [ ]     }
- [ ]   }
- [ ] };
- [ ] const processCalendarSyncQueue = async () => {
- [ ]   console.log('[CalendarSyncQueue] Processing pending operations...');
- [ ]   try {
- [ ]     // Get pending operations (FIFO order)
- [ ]     const result = await pool.query(
- [ ]       `SELECT csq.*, p.calendar_provider AS provider
- [ ]        FROM calendar_sync_queue csq
- [ ]        JOIN appointments a ON csq.appointment_id = a.id
- [ ]        JOIN patients p ON a.patient_id = p.id
- [ ]        WHERE csq.status = 'pending'
- [ ]        ORDER BY csq.created_at ASC
- [ ]        LIMIT 50` // Process in batches
- [ ]     );
- [ ]     const operations = result.rows;
- [ ]     if (operations.length === 0) {
- [ ]       console.log('[CalendarSyncQueue] No pending operations');
- [ ]       return;
- [ ]     }
- [ ]     console.log(`[CalendarSyncQueue] Processing ${operations.length} operations`);
- [ ]     // Process operations sequentially to respect rate limits
- [ ]     for (const operation of operations) {
- [ ]       await processQueueOperation(operation);
- [ ]     }
- [ ]     // Cleanup old completed operations (older than 7 days)
- [ ]     await pool.query(
- [ ]       `DELETE FROM calendar_sync_queue
- [ ]        WHERE status = 'completed'
- [ ]        AND completed_at < NOW() - INTERVAL '7 days'`
- [ ]     );
- [ ]     console.log('[CalendarSyncQueue] Processing complete');
- [ ]   } catch (error) {
- [ ]     console.error('[CalendarSyncQueue] Error processing queue:', error);
- [ ]   }
- [ ] };
- [ ] // Schedule cron job: every 5 minutes
- [ ] export const startCalendarSyncQueueJob = () => {
- [ ]   cron.schedule('*/5 * * * *', () => {
- [ ]     processCalendarSyncQueue();
- [ ]   });
- [ ]   console.log('[CalendarSyncQueue] Job scheduled: every 5 minutes');
- [ ] };

### Update Calendar Sync Service (server/src/services/calendarSyncService.ts)
- [ ] // At top of file
- [ ] Import: pool (already imported)
- [ ] // In catch block of createCalendarEvent, updateCalendarEvent, deleteCalendarEvent
- [ ] // After existing 429 handling
- [ ] if (error.response?.status === 429 || error.statusCode === 429) {
- [ ]   console.log(`Rate limit hit, queueing operation for appointment ${appointmentId}`);
- [ ]   await pool.query(
- [ ]     'INSERT INTO calendar_sync_queue (appointment_id, operation, payload, status) VALUES ($1, $2, $3, $4)',
- [ ]     [appointmentId, 'create', JSON.stringify(appointment), 'pending'] // operation type: 'create', 'update', 'delete'
- [ ]   );
- [ ]   return { queued: true };
- [ ] }

### Update Server Entry Point (server/src/index.ts)
- [ ] Import: startCalendarSyncQueueJob
- [ ] // After server starts
- [ ] startCalendarSyncQueueJob();
- [ ] console.log('Calendar sync queue job started');

### Database Query Optimization
- [ ] // Add index on calendar_sync_queue.status for faster pending operation queries
- [ ] CREATE INDEX IF NOT EXISTS idx_calendar_sync_queue_status_created_at
- [ ] ON calendar_sync_queue (status, created_at)
- [ ] WHERE status = 'pending';

### Monitoring and Logging
- [ ] const getQueueStats = async () => {
- [ ]   const result = await pool.query(
- [ ]     `SELECT status, COUNT(*) as count
- [ ]      FROM calendar_sync_queue
- [ ]      GROUP BY status`
- [ ]   );
- [ ]   return result.rows;
- [ ] };
- [ ] // Log queue stats at start of processing
- [ ] const stats = await getQueueStats();
- [ ] console.log('[CalendarSyncQueue] Queue stats:', stats);

### Testing Checklist
- [ ] Test: Cron job runs every 5 minutes
- [ ] Test: FIFO processing (oldest operations first)
- [ ] Test: Rate limiter allows requests within limits
- [ ] Test: Rate limiter blocks requests exceeding limits
- [ ] Test: Delay calculated correctly for rate-limited operations
- [ ] Test: Exponential backoff: 5s delay after first failure
- [ ] Test: Exponential backoff: 15s delay after second failure
- [ ] Test: Operation marked 'failed' after 3 retries
- [ ] Test: 429 error queues operation automatically
- [ ] Test: Completed operations older than 7 days deleted
- [ ] Integration test: Trigger rapid sync operations → Rate limited → Queued → Processed
- [ ] Integration test: Simulate 429 error → Queued → Retried with backoff → Completed
- [ ] Load test: 100 sync operations → All processed successfully within rate limits
