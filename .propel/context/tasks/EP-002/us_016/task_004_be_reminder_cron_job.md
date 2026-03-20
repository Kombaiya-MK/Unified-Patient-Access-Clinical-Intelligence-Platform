# Task - TASK_004_BE_REMINDER_CRON_JOB

## Requirement Reference
- User Story: US_016  
- Story Location: `.propel/context/tasks/us_016/us_016.md`
- Acceptance Criteria:
    - AC1: Automated reminder job runs (scheduled cron job every hour checking appointments 24 hours ahead)
    - AC1: System sends SMS and email with appointment details, logs reminder sent status, retries up to 3 times if delivery fails
- Edge Cases:
    - Multiple appointments within 24 hours: Send one consolidated message
    - SMS delivery failure: Log failure, email as fallback, display warning in staff dashboard
    - Patient opts out: Check notifications_preferences, skip if opt_out=true

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

> **Note**: Backend cron job only

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

> **Note**: Backend cron job only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend cron job only

## Task Overview
Implement scheduled cron job running every hour to send appointment reminders 24 hours before appointments. Job process: (1) Query upcoming_appointments_needing_reminders_view for appointments 23-25 hours ahead without reminders_sent_at. (2) Group appointments by patient_id (consolidated messages). (3) Check notification_preferences: Skip if sms_opt_out=true AND email_opt_out=true. (4) Send SMS via smsService (if reminder_sms_enabled=true). (5) Send email with .ics attachment via emailService (if reminder_email_enabled=true). (6) Update reminders_sent_at timestamp. (7) Log success/failure to audit log. (8) Fallback strategy: If SMS fails after 3 retries, ensure email sent. (9) Error aggregation: Collect all failures, create staff dashboard notification. (10) Performance: Process in batches of 50 appointments to avoid memory issues. (11) Monitoring: Log job start time, end time, total reminders sent, failure count. Use node-cron with schedule '0 * * * *' (every hour at minute 0).

## Dependent Tasks
- US_016 TASK_001: Database schema with reminder tracking must exist
- US_016 TASK_002: SMS service must exist
- US_016 TASK_003: Calendar generation and email service must exist
- US_011 TASK_001: Audit logging service must exist

## Impacted Components
**Modified:**
- server/src/index.ts (Start cron job on server startup)

**New:**
- server/src/jobs/appointmentReminderJob.ts (Main cron job logic)
- server/src/services/reminderService.ts (Reminder orchestration)
- server/src/utils/reminderStats.ts (Stats tracking and logging)

## Implementation Plan
1. **Cron Job Setup**: Use node-cron with hourly schedule
2. **Query Appointments**: Fetch from upcoming_appointments_needing_reminders_view
3. **Group by Patient**: Consolidate multiple appointments per patient
4. **Check Preferences**: Filter by opt-out settings
5. **Send SMS**: Call smsService for SMS-enabled patients
6. **Send Email**: Call emailService with calendar attachment
7. **Update Database**: Set reminders_sent_at, update status
8. **Fallback Logic**: Email as fallback if SMS fails
9. **Error Aggregation**: Collect failures for staff notification
10. **Batch Processing**: Process 50 appointments at a time
11. **Monitoring**: Log job metrics (start, end, counts, errors)
12. **Graceful Shutdown**: Handle job interruption on server restart

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── services/
│   │   │   ├── smsService.ts (US_016 TASK_002)
│   │   │   ├── emailService.ts (US_013 TASK_004, extended in TASK_003)
│   │   │   ├── calendarService.ts (US_016 TASK_003)
│   │   │   └── auditLogger.ts (US_011 TASK_001)
│   │   ├── jobs/
│   │   │   └── waitlistExpiryJob.ts (US_015 TASK_004)
│   │   └── index.ts
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/jobs/appointmentReminderJob.ts | Hourly cron job for reminders |
| CREATE | server/src/services/reminderService.ts | Reminder orchestration logic |
| CREATE | server/src/utils/reminderStats.ts | Job statistics tracking |
| MODIFY | server/src/index.ts | Start reminder cron job |

> 1 modified file, 3 new files created

## External References
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [Cron Expression Syntax](https://crontab.guru/)
- [Graceful Shutdown](https://nodejs.org/api/process.html#process_event_beforeexit)

## Build Commands
```bash
# node-cron already installed from US_015 TASK_004

# Start backend server
cd server
npm run dev

# Expected console logs:
# "Appointment reminder job started (runs every hour)"

# Test reminder job manually
node -e "
const { runReminderJob } = require('./dist/jobs/appointmentReminderJob');
runReminderJob()
  .then(stats => console.log('Job completed:', stats))
  .catch(err => console.error('Job failed:', err));
"

# Expected output:
# Job started at: 2026-03-18T10:00:00Z
# Processing 5 appointments for 3 patients
# SMS sent: 3 successful, 0 failed
# Email sent: 3 successful, 0 failed
# Job completed in 2.5 seconds

# Verify reminders sent
psql -U postgres -d clinic_db -c "SELECT id, patient_id, appointment_date, reminders_sent_at, reminder_sms_status, reminder_email_status FROM appointments WHERE reminders_sent_at IS NOT NULL ORDER BY reminders_sent_at DESC LIMIT 5;"

# Verify audit logs
psql -U postgres -d clinic_db -c "SELECT action, entity_id, created_at FROM audit_logs WHERE action IN ('SEND_SMS_REMINDER', 'SEND_EMAIL_REMINDER', 'REMINDER_JOB_COMPLETED') ORDER BY created_at DESC LIMIT 10;"

# Test consolidated messages
# Insert 2 appointments for same patient 24h ahead
# Run job
# Expected: Single SMS with both appointments, single email with 2 .ics VEVENTs

# Test opt-out
# Update patient notification_preferences: sms_opt_out=true
# Run job
# Expected: No SMS sent, only email

# Test SMS fallback
# Mock SMS failure (invalid phone number)
# Expected: SMS status='failed', email sent

# Test cron schedule
# Wait for next hour (cron triggers at :00)
# Verify job runs automatically

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Cron job scheduled with '0 * * * *' (every hour)
- [ ] Job queries upcoming_appointments_needing_reminders_view
- [ ] Appointments grouped by patient_id
- [ ] Notification preferences checked: Skip if opt_out=true
- [ ] SMS sent for SMS-enabled patients
- [ ] Email sent with .ics attachment for email-enabled patients
- [ ] Consolidated messages: Multiple appointments combined
- [ ] reminders_sent_at timestamp updated
- [ ] reminder_sms_status and reminder_email_status updated
- [ ] Fallback: Email sent if SMS fails
- [ ] Error aggregation: Failures collected for staff notification
- [ ] Batch processing: 50 appointments per batch
- [ ] Job metrics logged: start, end, counts, errors
- [ ] Audit log entries: SEND_SMS_REMINDER, SEND_EMAIL_REMINDER, REMINDER_JOB_COMPLETED
- [ ] Graceful shutdown: Job completes if server restarted

## Implementation Checklist

### Reminder Stats Utility (server/src/utils/reminderStats.ts)
- [ ] Export interface ReminderJobStats {
- [ ]   startTime: Date;
- [ ]   endTime?: Date;
- [ ]   totalAppointments: number;
- [ ]   totalPatients: number;
- [ ]   smsSuccessCount: number;
- [ ]   smsFailureCount: number;
- [ ]   emailSuccessCount: number;
- [ ]   emailFailureCount: number;
- [ ]   errors: Array<{ appointmentId: number, error: string }>;
- [ ]   duration?: number; // milliseconds
- [ ] }
- [ ] export class ReminderStats {
- [ ]   private stats: ReminderJobStats;
- [ ]   constructor() {
- [ ]     this.stats = {
- [ ]       startTime: new Date(),
- [ ]       totalAppointments: 0,
- [ ]       totalPatients: 0,
- [ ]       smsSuccessCount: 0,
- [ ]       smsFailureCount: 0,
- [ ]       emailSuccessCount: 0,
- [ ]       emailFailureCount: 0,
- [ ]       errors: []
- [ ]     };
- [ ]   }
- [ ]   incrementSMSSuccess() { this.stats.smsSuccessCount++; }
- [ ]   incrementSMSFailure() { this.stats.smsFailureCount++; }
- [ ]   incrementEmailSuccess() { this.stats.emailSuccessCount++; }
- [ ]   incrementEmailFailure() { this.stats.emailFailureCount++; }
- [ ]   addError(appointmentId: number, error: string) {
- [ ]     this.stats.errors.push({ appointmentId, error });
- [ ]   }
- [ ]   complete(): ReminderJobStats {
- [ ]     this.stats.endTime = new Date();
- [ ]     this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
- [ ]     return this.stats;
- [ ]   }
- [ ]   getStats() { return this.stats; }
- [ ]   setTotals(appointments: number, patients: number) {
- [ ]     this.stats.totalAppointments = appointments;
- [ ]     this.stats.totalPatients = patients;
- [ ]   }
- [ ] }

### Reminder Service (server/src/services/reminderService.ts)
- [ ] Import: pool (pg), sendAppointmentReminderSMS, sendAppointmentReminderEmail, auditLogger, CalendarEventData
- [ ] interface PatientAppointments {
- [ ]   patient_id: number;
- [ ]   patient_name: string;
- [ ]   patient_email: string;
- [ ]   patient_phone: string;
- [ ]   reminder_sms_enabled: boolean;
- [ ]   reminder_email_enabled: boolean;
- [ ]   sms_opt_out: boolean;
- [ ]   email_opt_out: boolean;
- [ ]   appointments: any[];
- [ ] }
- [ ] export const sendRemindersForPatient = async (patientData: PatientAppointments) => {
- [ ]   let smsSuccess = false;
- [ ]   let emailSuccess = false;
- [ ]   let errors: string[] = [];
- [ ]   // Check opt-out
- [ ]   if (patientData.sms_opt_out && patientData.email_opt_out) {
- [ ]     console.log(`Patient ${patientData.patient_id} opted out of all notifications, skipping`);
- [ ]     return { smsSuccess: false, emailSuccess: false, skipped: true };
- [ ]   }
- [ ]   // Send SMS
- [ ]   if (patientData.reminder_sms_enabled && !patientData.sms_opt_out) {
- [ ]     try {
- [ ]       const result = await sendAppointmentReminderSMS(patientData.appointments[0].appointment_id);
- [ ]       smsSuccess = result.success;
- [ ]       if (!smsSuccess) {
- [ ]         errors.push(`SMS failed: ${result.error}`);
- [ ]       }
- [ ]     } catch (error) {
- [ ]       console.error(`SMS delivery failed for patient ${patientData.patient_id}:`, error);
- [ ]       errors.push(`SMS error: ${error.message}`);
- [ ]     }
- [ ]   }
- [ ]   // Send Email (or as fallback if SMS failed)
- [ ]   if (patientData.reminder_email_enabled && !patientData.email_opt_out) {
- [ ]     try {
- [ ]       const calendarData: CalendarEventData[] = patientData.appointments.map(apt => ({
- [ ]         id: apt.appointment_id,
- [ ]         appointment_date: apt.appointment_date,
- [ ]         start_time: apt.start_time,
- [ ]         end_time: apt.end_time,
- [ ]         provider_name: apt.provider_name,
- [ ]         provider_specialty: apt.provider_specialty,
- [ ]         patient_email: patientData.patient_email,
- [ ]         patient_name: patientData.patient_name,
- [ ]         reason: apt.reason,
- [ ]         location: process.env.CLINIC_LOCATION || '123 Main St'
- [ ]       }));
- [ ]       await sendAppointmentReminderEmail(calendarData);
- [ ]       emailSuccess = true;
- [ ]       // Update email status in database
- [ ]       for (const apt of patientData.appointments) {
- [ ]         await pool.query(
- [ ]           'UPDATE appointments SET reminder_email_status = $1 WHERE id = $2',
- [ ]           ['delivered', apt.appointment_id]
- [ ]         );
- [ ]       }
- [ ]     } catch (error) {
- [ ]       console.error(`Email delivery failed for patient ${patientData.patient_id}:`, error);
- [ ]       errors.push(`Email error: ${error.message}`);
- [ ]       // Update email status in database
- [ ]       for (const apt of patientData.appointments) {
- [ ]         await pool.query(
- [ ]           'UPDATE appointments SET reminder_email_status = $1, last_reminder_error = $2 WHERE id = $3',
- [ ]           ['failed', error.message, apt.appointment_id]
- [ ]         );
- [ ]       }
- [ ]     }
- [ ]   }
- [ ]   // Fallback: If SMS failed but email available, ensure email sent
- [ ]   if (!smsSuccess && !emailSuccess && patientData.reminder_email_enabled && !patientData.email_opt_out) {
- [ ]     console.log(`SMS failed for patient ${patientData.patient_id}, attempting email fallback`);
- [ ]     // Email sending already attempted above
- [ ]   }
- [ ]   return { smsSuccess, emailSuccess, errors };
- [ ] };

### Reminder Cron Job (server/src/jobs/appointmentReminderJob.ts)
- [ ] Import: cron, pool (pg), sendRemindersForPatient, ReminderStats, auditLogger
- [ ] export const runReminderJob = async (): Promise<ReminderJobStats> => {
- [ ]   const stats = new ReminderStats();
- [ ]   console.log(`[Reminder Job] Started at ${stats.getStats().startTime.toISOString()}`);
- [ ]   try {
- [ ]     // Query appointments needing reminders
- [ ]     const result = await pool.query('SELECT * FROM upcoming_appointments_needing_reminders_view ORDER BY patient_id, appointment_date, start_time');
- [ ]     const appointments = result.rows;
- [ ]     if (appointments.length === 0) {
- [ ]       console.log('[Reminder Job] No appointments needing reminders');
- [ ]       stats.complete();
- [ ]       return stats.getStats();
- [ ]     }
- [ ]     console.log(`[Reminder Job] Processing ${appointments.length} appointments`);
- [ ]     // Group by patient
- [ ]     const patientGroups = new Map<number, any>();
- [ ]     appointments.forEach(apt => {
- [ ]       if (!patientGroups.has(apt.patient_id)) {
- [ ]         patientGroups.set(apt.patient_id, {
- [ ]           patient_id: apt.patient_id,
- [ ]           patient_name: `${apt.first_name} ${apt.last_name}`,
- [ ]           patient_email: apt.email,
- [ ]           patient_phone: apt.phone,
- [ ]           reminder_sms_enabled: apt.reminder_sms_enabled,
- [ ]           reminder_email_enabled: apt.reminder_email_enabled,
- [ ]           sms_opt_out: apt.sms_opt_out,
- [ ]           email_opt_out: apt.email_opt_out,
- [ ]           appointments: []
- [ ]         });
- [ ]       }
- [ ]       patientGroups.get(apt.patient_id).appointments.push(apt);
- [ ]     });
- [ ]     stats.setTotals(appointments.length, patientGroups.size);
- [ ]     console.log(`[Reminder Job] ${patientGroups.size} patients with appointments`);
- [ ]     // Process in batches of 50
- [ ]     const patientArray = Array.from(patientGroups.values());
- [ ]     const BATCH_SIZE = 50;
- [ ]     for (let i = 0; i < patientArray.length; i += BATCH_SIZE) {
- [ ]       const batch = patientArray.slice(i, i + BATCH_SIZE);
- [ ]       await Promise.all(batch.map(async (patientData) => {
- [ ]         try {
- [ ]           const result = await sendRemindersForPatient(patientData);
- [ ]           if (result.skipped) {
- [ ]             // Patient opted out, don't count as failure
- [ ]             return;
- [ ]           }
- [ ]           if (result.smsSuccess) stats.incrementSMSSuccess();
- [ ]           else if (patientData.reminder_sms_enabled) stats.incrementSMSFailure();
- [ ]           if (result.emailSuccess) stats.incrementEmailSuccess();
- [ ]           else if (patientData.reminder_email_enabled) stats.incrementEmailFailure();
- [ ]           if (result.errors && result.errors.length > 0) {
- [ ]             patientData.appointments.forEach(apt => {
- [ ]               stats.addError(apt.appointment_id, result.errors.join(', '));
- [ ]             });
- [ ]           }
- [ ]         } catch (error) {
- [ ]           console.error(`Error processing patient ${patientData.patient_id}:`, error);
- [ ]           stats.addError(patientData.appointments[0].appointment_id, error.message);
- [ ]         }
- [ ]       }));
- [ ]     }
- [ ]     const finalStats = stats.complete();
- [ ]     console.log(`[Reminder Job] Completed in ${finalStats.duration}ms`);
- [ ]     console.log(`  Total: ${finalStats.totalAppointments} appointments, ${finalStats.totalPatients} patients`);
- [ ]     console.log(`  SMS: ${finalStats.smsSuccessCount} sent, ${finalStats.smsFailureCount} failed`);
- [ ]     console.log(`  Email: ${finalStats.emailSuccessCount} sent, ${finalStats.emailFailureCount} failed`);
- [ ]     console.log(`  Errors: ${finalStats.errors.length}`);
- [ ]     // Audit log
- [ ]     await auditLogger.log({
- [ ]       user_id: null, // System action
- [ ]       action: 'REMINDER_JOB_COMPLETED',
- [ ]       entity_type: 'system',
- [ ]       entity_id: 0,
- [ ]       changes: finalStats,
- [ ]       ip_address: 'server-internal',
- [ ]       user_agent: 'reminder-cron-job'
- [ ]     });
- [ ]     // If there are failures, create staff notification (future enhancement)
- [ ]     if (finalStats.errors.length > 0) {
- [ ]       console.warn(`[Reminder Job] ${finalStats.errors.length} reminder(s) failed, staff notification needed`);
- [ ]       // TODO: Create staff dashboard notification
- [ ]     }
- [ ]     return finalStats;
- [ ]   } catch (error) {
- [ ]     console.error('[Reminder Job] Fatal error:', error);
- [ ]     const finalStats = stats.complete();
- [ ]     stats.addError(0, error.message);
- [ ]     return finalStats;
- [ ]   }
- [ ] };
- [ ] export const startReminderCronJob = () => {
- [ ]   // Run every hour at minute 0
- [ ]   cron.schedule('0 * * * *', async () => {
- [ ]     console.log('[Reminder Cron] Triggering appointment reminder job');
- [ ]     await runReminderJob();
- [ ]   });
- [ ]   console.log('[Reminder Cron] Appointment reminder job scheduled (runs every hour)');
- [ ] };

### Update Server Startup (server/src/index.ts)
- [ ] Import: startReminderCronJob
- [ ] // After app.listen()
- [ ] startReminderCronJob();

### Testing Checklist
- [ ] Start server: Console shows "Appointment reminder job scheduled"
- [ ] Test manual run: runReminderJob() executes successfully
- [ ] Verify query: upcoming_appointments_needing_reminders_view returns appointments 24h ahead
- [ ] Test grouping: Multiple appointments per patient combined
- [ ] Test SMS sending: SMS sent for SMS-enabled patients
- [ ] Test email sending: Email with .ics sent for email-enabled patients
- [ ] Test consolidated message: Patient with 2 appointments receives 1 SMS, 1 email with 2 VEVENTs
- [ ] Test opt-out: Patients with sms_opt_out=true don't receive SMS
- [ ] Test fallback: SMS fails → Email sent
- [ ] Test reminders_sent_at: Timestamp updated after sending
- [ ] Test status tracking: reminder_sms_status, reminder_email_status updated
- [ ] Test batch processing: 100 appointments processed in batches of 50
- [ ] Test error handling: Invalid phone/email collected in stats
- [ ] Verify audit log: REMINDER_JOB_COMPLETED with stats
- [ ] Test cron schedule: Job runs automatically every hour
- [ ] Test graceful shutdown: Job completes if server restarted mid-run
- [ ] Integration test: End-to-end from cron trigger → SMS/email sent → patient receives
