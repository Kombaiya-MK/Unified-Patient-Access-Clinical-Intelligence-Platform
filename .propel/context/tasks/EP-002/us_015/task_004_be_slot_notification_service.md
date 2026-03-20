# Task - TASK_004_BE_SLOT_NOTIFICATION_SERVICE

## Requirement Reference
- User Story: US_015  
- Story Location: `.propel/context/tasks/us_015/us_015.md`
- Acceptance Criteria:
    - AC1: When another patient cancels slot, automatically send notification (email + dashboard popup) within 5 minutes and hold slot for 2 hours pending acceptance
- Edge Cases:
    - Multiple patients on waitlist: First-come-first-served, notify next if first declines
    - Patient doesn't respond within 2 hours: Auto-release, notify next person

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | UXR-401 (Fast notification <5min) |
| **Design Tokens** | N/A |

> **Note**: Backend service only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | node-cron | 3.x |
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

> **Note**: Backend service only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend service only

## Task Overview
Implement event-driven service that monitors appointment cancellations and notifies waitlist patients within 5 minutes. When appointment is cancelled/rescheduled: (1) Query waitlist table for matching date/time with status='waiting', order by created_at ASC (FIFO). (2) Select first patient, update waitlist status='notified', set slot_hold_expires_at=NOW() + 2 hours, set notified_at=NOW(). (3) Send notification email "Your preferred slot [date/time] is now available! Click to book (expires in 2 hours)" with deep link to booking page. (4) Create dashboard notification for real-time popup (US_015 TASK_005). (5) If patient doesn't respond within 2 hours, run cron job (every 5 minutes) to check expired holds (slot_hold_expires_at < NOW()), update status='expired', notify next patient in queue. Log all actions to audit log (US_011). Handle race conditions: use database transactions and FOR UPDATE locks.

## Dependent Tasks
- US_011 TASK_001: Audit logging service must exist
- US_013 TASK_004: Email service must exist
- US_015 TASK_001: Waitlist table must exist
- US_015 TASK_002: Waitlist API must exist

## Impacted Components
**Modified:**
- server/src/controllers/appointmentController.ts (Add waitlist notification on cancel)

**New:**
- server/src/services/waitlistNotificationService.ts (Notification orchestration)
- server/src/jobs/waitlistExpiryJob.ts (Cron job for expired holds)
- server/src/models/Notification.ts (Dashboard notification model)
- database/migrations/XXX_create_notifications_table.sql (Notifications table)

## Implementation Plan
1. **Notifications Table**: Create table for dashboard notifications (id, user_id, type, title, message, data, read, created_at)
2. **Event Trigger**: Hook into appointment cancellation flow
3. **Query Waitlist**: Find matching waitlist entries (date/time, status='waiting'), order by created_at
4. **Notify First Patient**: Update status='notified', set expiry 2 hours, send email, create dashboard notification
5. **Email Notification**: Send with deep link to booking page, countdown timer
6. **Dashboard Notification**: Store in notifications table for real-time display
7. **Cron Job**: Every 5 minutes, check slot_hold_expires_at < NOW(), update status='expired'
8. **Cascade Notification**: If hold expired, notify next patient in queue
9. **Transaction Safety**: Use FOR UPDATE locks to prevent race conditions
10. **Audit Logging**: Log NOTIFY_WAITLIST, EXPIRE_HOLD actions

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── controllers/
│   │   │   └── appointmentController.ts (US_013)
│   │   ├── services/
│   │   │   ├── emailService.ts (US_013 TASK_004)
│   │   │   ├── auditLogger.ts (US_011 TASK_001)
│   │   │   └── waitlistService.ts (US_015 TASK_002)
│   │   └── jobs/ (new directory)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/XXX_create_notifications_table.sql | Dashboard notifications table |
| CREATE | server/src/services/waitlistNotificationService.ts | Notification orchestration logic |
| CREATE | server/src/jobs/waitlistExpiryJob.ts | Cron job for expired holds |
| CREATE | server/src/models/Notification.ts | Notification TypeScript model |
| MODIFY | server/src/controllers/appointmentController.ts | Trigger notification on cancel |
| MODIFY | server/src/index.ts | Start cron job on server startup |

> 2 modified files, 4 new files created

## External References
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [PostgreSQL FOR UPDATE](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Deep Linking](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Identifying_resources_on_the_Web)

## Build Commands
```bash
# Install node-cron
cd server
npm install node-cron
npm install --save-dev @types/node-cron

# Run database migration
cd database
psql -U postgres -d clinic_db -f migrations/XXX_create_notifications_table.sql

# Start backend server
cd server
npm run dev

# Expected console logs:
# "Waitlist expiry job started (runs every 5 minutes)"

# Test slot cancellation notification
# 1. Patient A joins waitlist for 2026-03-25 10:00
# 2. Patient B cancels appointment for 2026-03-25 10:00
# Expected: Patient A receives email within 5 minutes, status='notified', slot_hold_expires_at set

# Verify email sent
# Check email logs

# Verify dashboard notification
psql -U postgres -d clinic_db -c "SELECT * FROM notifications WHERE user_id = <patient_A_id> ORDER BY created_at DESC LIMIT 1;"
# Expected: Notification with type='waitlist_available'

# Test expiry cascade
# Wait 2 hours (or manually update slot_hold_expires_at to past time)
psql -U postgres -d clinic_db -c "UPDATE waitlist SET slot_hold_expires_at = NOW() - INTERVAL '1 minute' WHERE patient_id = <patient_A_id>;"
# Wait for cron job to run (max 5 minutes)
# Expected: Patient A status='expired', next patient notified

# Verify audit logs
psql -U postgres -d clinic_db -c "SELECT * FROM audit_logs WHERE action IN ('NOTIFY_WAITLIST', 'EXPIRE_HOLD') ORDER BY created_at DESC;"

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Notifications table created with required columns
- [ ] Appointment cancellation triggers waitlist check
- [ ] Query finds matching waitlist entries (date/time match)
- [ ] First patient (by created_at ASC) is notified
- [ ] Waitlist status updated: 'waiting' → 'notified'
- [ ] slot_hold_expires_at set to NOW() + 2 hours
- [ ] notified_at timestamp recorded
- [ ] Email sent within 5 minutes with slot details, deep link
- [ ] Dashboard notification created in notifications table
- [ ] Cron job runs every 5 minutes
- [ ] Expired holds detected: slot_hold_expires_at < NOW()
- [ ] Expired entry status updated to 'expired'
- [ ] Next patient in queue notified (cascade)
- [ ] Transaction locks prevent race conditions (FOR UPDATE)
- [ ] All actions logged to audit log

## Implementation Checklist

### Notifications Table Migration (database/migrations/XXX_create_notifications_table.sql)
- [ ] -- Migration: Create notifications table for dashboard alerts
- [ ] CREATE TABLE IF NOT EXISTS notifications (
- [ ]   id SERIAL PRIMARY KEY,
- [ ]   user_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
- [ ]   type VARCHAR(50) NOT NULL,
- [ ]   title VARCHAR(255) NOT NULL,
- [ ]   message TEXT NOT NULL,
- [ ]   data JSONB,
- [ ]   is_read BOOLEAN DEFAULT FALSE NOT NULL,
- [ ]   created_at TIMESTAMP DEFAULT NOW() NOT NULL,
- [ ]   read_at TIMESTAMP
- [ ] );
- [ ] CREATE INDEX idx_notifications_user_id ON notifications(user_id);
- [ ] CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
- [ ] COMMENT ON TABLE notifications IS 'Dashboard notifications for real-time alerts';
- [ ] COMMENT ON COLUMN notifications.type IS 'Notification type: waitlist_available, appointment_reminder, etc.';
- [ ] COMMENT ON COLUMN notifications.data IS 'JSON payload with additional data (appointment_id, etc.)';

### Notification Model (server/src/models/Notification.ts)
- [ ] export interface Notification {
- [ ]   id: number;
- [ ]   user_id: number;
- [ ]   type: string;
- [ ]   title: string;
- [ ]   message: string;
- [ ]   data?: any;
- [ ]   is_read: boolean;
- [ ]   created_at: Date;
- [ ]   read_at?: Date;
- [ ] }

### Waitlist Notification Service (server/src/services/waitlistNotificationService.ts)
- [ ] Import: pool (pg), auditLogger, sendEmail, addHours
- [ ] export const notifyWaitlistForSlot = async (appointment_date: string, start_time: string, end_time: string) => {
- [ ]   const client = await pool.connect();
- [ ]   try {
- [ ]     await client.query('BEGIN');
- [ ]     // Find first waiting patient (FIFO) with FOR UPDATE lock
- [ ]     const waitlistResult = await client.query(
- [ ]       'SELECT w.*, p.email, p.first_name, p.last_name FROM waitlist w JOIN patients p ON w.patient_id = p.id WHERE w.preferred_date = $1 AND w.preferred_time = $2 AND w.status = $3 ORDER BY w.created_at ASC LIMIT 1 FOR UPDATE OF w',
- [ ]       [appointment_date, start_time, 'waiting']
- [ ]     );
- [ ]     if (waitlistResult.rows.length === 0) {
- [ ]       await client.query('ROLLBACK');
- [ ]       return { notified: false, reason: 'No one on waitlist' };
- [ ]     }
- [ ]     const waitlistEntry = waitlistResult.rows[0];
- [ ]     const holdExpiresAt = addHours(new Date(), 2);
- [ ]     // Update waitlist entry
- [ ]     await client.query(
- [ ]       'UPDATE waitlist SET status = $1, notified_at = NOW(), slot_hold_expires_at = $2, updated_at = NOW() WHERE id = $3',
- [ ]       ['notified', holdExpiresAt, waitlistEntry.id]
- [ ]     );
- [ ]     // Create dashboard notification
- [ ]     await client.query(
- [ ]       'INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5)',
- [ ]       [
- [ ]         waitlistEntry.patient_id,
- [ ]         'waitlist_available',
- [ ]         'Appointment Slot Available!',
- [ ]         `Your preferred slot ${appointment_date} at ${start_time} is now available! Click to book (expires in 2 hours)`,
- [ ]         JSON.stringify({ appointment_date, start_time, end_time, expires_at: holdExpiresAt })
- [ ]       ]
- [ ]     );
- [ ]     // Audit log
- [ ]     await auditLogger.log({
- [ ]       user_id: waitlistEntry.patient_id,
- [ ]       action: 'NOTIFY_WAITLIST',
- [ ]       entity_type: 'waitlist',
- [ ]       entity_id: waitlistEntry.id,
- [ ]       changes: { status: 'notified', slot_hold_expires_at: holdExpiresAt },
- [ ]       ip_address: 'server-internal',
- [ ]       user_agent: 'waitlist-notification-service'
- [ ]     });
- [ ]     await client.query('COMMIT');
- [ ]     // Send email (non-blocking)
- [ ]     setImmediate(async () => {
- [ ]       try {
- [ ]         const bookingLink = `${process.env.APP_URL}/patient/book-appointment?date=${appointment_date}&time=${start_time}&auto_fill=true`;
- [ ]         await sendEmail({
- [ ]           to: waitlistEntry.email,
- [ ]           subject: 'Your Waitlist Slot is Available!',
- [ ]           template: 'waitlist-slot-available',
- [ ]           data: {
- [ ]             patient_name: `${waitlistEntry.first_name} ${waitlistEntry.last_name}`,
- [ ]             appointment_date,
- [ ]             start_time,
- [ ]             end_time,
- [ ]             booking_link: bookingLink,
- [ ]             expires_at: holdExpiresAt.toISOString()
- [ ]           }
- [ ]         });
- [ ]       } catch (error) {
- [ ]         console.error('Failed to send waitlist notification email:', error);
- [ ]       }
- [ ]     });
- [ ]     return { notified: true, patient_id: waitlistEntry.patient_id };
- [ ]   } catch (error) {
- [ ]     await client.query('ROLLBACK');
- [ ]     console.error('Waitlist notification error:', error);
- [ ]     throw error;
- [ ]   } finally {
- [ ]     client.release();
- [ ]   }
- [ ] };

### Waitlist Expiry Cron Job (server/src/jobs/waitlistExpiryJob.ts)
- [ ] Import: cron, pool (pg), auditLogger, notifyWaitlistForSlot
- [ ] export const startWaitlistExpiryJob = () => {
- [ ]   // Run every 5 minutes
- [ ]   cron.schedule('*/5 * * * *', async () => {
- [ ]     console.log('Running waitlist expiry job...');
- [ ]     const client = await pool.connect();
- [ ]     try {
- [ ]       await client.query('BEGIN');
- [ ]       // Find expired holds
- [ ]       const expiredResult = await client.query(
- [ ]         'SELECT * FROM waitlist WHERE status = $1 AND slot_hold_expires_at < NOW() FOR UPDATE',
- [ ]         ['notified']
- [ ]       );
- [ ]       if (expiredResult.rows.length === 0) {
- [ ]         await client.query('ROLLBACK');
- [ ]         return;
- [ ]       }
- [ ]       console.log(`Found ${expiredResult.rows.length} expired waitlist holds`);
- [ ]       // Update to expired
- [ ]       for (const entry of expiredResult.rows) {
- [ ]         await client.query('UPDATE waitlist SET status = $1, updated_at = NOW() WHERE id = $2', ['expired', entry.id]);
- [ ]         // Audit log
- [ ]         await auditLogger.log({
- [ ]           user_id: entry.patient_id,
- [ ]           action: 'EXPIRE_HOLD',
- [ ]           entity_type: 'waitlist',
- [ ]           entity_id: entry.id,
- [ ]           changes: { status: 'expired', reason: '2-hour hold expired' },
- [ ]           ip_address: 'server-internal',
- [ ]           user_agent: 'waitlist-expiry-job'
- [ ]         });
- [ ]       }
- [ ]       await client.query('COMMIT');
- [ ]       // Notify next person in queue for each expired slot
- [ ]       for (const entry of expiredResult.rows) {
- [ ]         try {
- [ ]           await notifyWaitlistForSlot(entry.preferred_date, entry.preferred_time, entry.end_time);
- [ ]         } catch (error) {
- [ ]           console.error(`Failed to notify next patient for slot ${entry.preferred_date} ${entry.preferred_time}:`, error);
- [ ]         }
- [ ]       }
- [ ]     } catch (error) {
- [ ]       await client.query('ROLLBACK');
- [ ]       console.error('Waitlist expiry job error:', error);
- [ ]     } finally {
- [ ]       client.release();
- [ ]     }
- [ ]   });
- [ ]   console.log('Waitlist expiry job started (runs every 5 minutes)');
- [ ] };

### Update Appointment Controller (server/src/controllers/appointmentController.ts)
- [ ] Import: notifyWaitlistForSlot
- [ ] In cancelAppointment method, after successful cancellation:
- [ ]   // Trigger waitlist notification
- [ ]   setImmediate(async () => {
- [ ]     try {
- [ ]       await notifyWaitlistForSlot(appointment.appointment_date, appointment.start_time, appointment.end_time);
- [ ]     } catch (error) {
- [ ]       console.error('Failed to notify waitlist:', error);
- [ ]     }
- [ ]   });

### Update Server Startup (server/src/index.ts)
- [ ] Import: startWaitlistExpiryJob
- [ ] After app.listen(): startWaitlistExpiryJob();

### Testing Checklist
- [ ] Run migration: notifications table created
- [ ] Start server: Console shows "Waitlist expiry job started"
- [ ] Create waitlist entry for Patient A (waiting)
- [ ] Cancel appointment matching waitlist slot
- [ ] Verify: Patient A status='notified' within 5 minutes
- [ ] Verify: slot_hold_expires_at = NOW() + 2 hours
- [ ] Verify: Email sent to Patient A with deep link
- [ ] Verify: Dashboard notification created for Patient A
- [ ] Verify: Audit log entry for NOTIFY_WAITLIST
- [ ] Test expiry: Manually set slot_hold_expires_at to past time
- [ ] Wait for cron (max 5 minutes)
- [ ] Verify: Patient A status='expired'
- [ ] Verify: Audit log entry for EXPIRE_HOLD
- [ ] Verify: Next patient (if exists) is notified
- [ ] Test race condition: Multiple cancellations same slot
- [ ] Verify: Only one patient notified per slot (FOR UPDATE lock)
- [ ] Test no waitlist: Cancel slot with no one waiting
- [ ] Verify: No errors, service handles gracefully
