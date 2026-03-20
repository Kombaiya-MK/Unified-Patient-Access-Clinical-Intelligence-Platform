# Task - TASK_002_BE_RESCHEDULE_API_VALIDATION

## Requirement Reference
- User Story: US_014  
- Story Location: `.propel/context/tasks/us_014/us_014.md`
- Acceptance Criteria:
    - AC1: System updates appointment date/time, sends updated confirmation email with new PDF, triggers calendar sync update, logs change to audit log
- Edge Cases:
    - Cannot reschedule within 2 hours: HTTP 400 error
    - Max 3 reschedules per appointment: HTTP 409 error
    - Concurrent slot booking: HTTP 409 with optimistic locking error

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

> **Note**: Backend API only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
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

> **Note**: Backend API only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API only

## Task Overview
Implement PUT /api/appointments/:id endpoint to reschedule existing appointments. Validate 2-hour minimum notice (before start_time), enforce 3-reschedule limit (check reschedule_count), use optimistic locking (version column) to prevent concurrent slot conflicts. On success: increment reschedule_count, update appointment_date/start_time/end_time, log original and new values to audit log (US_011), trigger PDF regeneration (US_013 TASK_003), send email with updated PDF (US_013 TASK_004), trigger calendar sync update for Google/Outlook (US_013 TASK_005). Return HTTP 200 with updated appointment object. Handle errors: 400 for validation failures, 404 for appointment not found, 409 for slot conflicts/reschedule limit, 500 for server errors.

## Dependent Tasks
- US_007: Appointments table must exist
- US_011 TASK_001: Audit logging service must exist
- US_013 TASK_002: Booking API (slot availability logic)
- US_013 TASK_003: PDF generation service must exist
- US_013 TASK_004: Email service must exist
- US_013 TASK_005: Calendar sync service must exist

## Impacted Components
**Modified:**
- server/src/routes/appointmentRoutes.ts (Add PUT /:id route)
- server/src/controllers/appointmentController.ts (Add rescheduleAppointment method)
- database/migrations/XXX_add_reschedule_count_column.sql (Add reschedule_count, version columns)

**New:**
- server/src/services/appointmentRescheduleService.ts (Reschedule business logic)
- server/src/middleware/validateReschedule.ts (Validation middleware)
- server/src/utils/appointmentValidation.ts (2-hour validation logic)

## Implementation Plan
1. **Database Migration**: Add reschedule_count INT DEFAULT 0, version INT DEFAULT 1 to appointments table
2. **Validation Middleware**: Check appointment exists, user ownership, 2-hour restriction, reschedule limit
3. **Optimistic Locking**: Check version column, increment on update
4. **Slot Availability**: Verify new slot not booked (reuse from US_013)
5. **Reschedule Service**: Orchestrate update, increment count, call downstream services
6. **Audit Logging**: Log change with before/after values
7. **PDF Regeneration**: Call generateAppointmentPDF with updated details
8. **Email Service**: Send email with updated PDF attachment
9. **Calendar Sync**: Trigger updateCalendarEvent for Google/Outlook
10. **Error Handling**: Return descriptive errors (400, 404, 409, 500)
11. **Transaction**: Wrap in database transaction for atomicity

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── routes/
│   │   │   └── appointmentRoutes.ts (US_013 TASK_002)
│   │   ├── controllers/
│   │   │   └── appointmentController.ts (US_013 TASK_002)
│   │   ├── services/
│   │   │   ├── appointmentBookingService.ts (US_013 TASK_002)
│   │   │   ├── pdfGenerationService.ts (US_013 TASK_003)
│   │   │   ├── emailService.ts (US_013 TASK_004)
│   │   │   ├── calendarSyncService.ts (US_013 TASK_005)
│   │   │   └── auditLogger.ts (US_011 TASK_001)
│   │   └── middleware/
│   │       └── auth.ts (US_009)
├── database/
│   ├── migrations/ (US_007)
│   │   └── 001_create_appointments_table.sql
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/XXX_add_reschedule_tracking.sql | Add reschedule_count, version columns |
| CREATE | server/src/services/appointmentRescheduleService.ts | Reschedule orchestration logic |
| CREATE | server/src/middleware/validateReschedule.ts | Validation middleware |
| CREATE | server/src/utils/appointmentValidation.ts | 2-hour validation helper |
| MODIFY | server/src/routes/appointmentRoutes.ts | Add PUT /:id route |
| MODIFY | server/src/controllers/appointmentController.ts | Add rescheduleAppointment controller |

> 2 modified files, 4 new files created

## External References
- [Optimistic Locking Pattern](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)
- [PostgreSQL Row Versioning](https://www.postgresql.org/docs/current/mvcc.html)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Transaction Management](https://node-postgres.com/features/transactions)

## Build Commands
```bash
# Run database migration
cd database
psql -U postgres -d clinic_db -f migrations/XXX_add_reschedule_tracking.sql

# Start backend server
cd server
npm run dev

# Test reschedule endpoint
curl -X PUT http://localhost:3000/api/appointments/123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_date": "2026-03-25",
    "start_time": "14:00:00",
    "end_time": "14:30:00"
  }'

# Expected response (200 OK):
{
  "id": 123,
  "patient_id": 456,
  "provider_id": 789,
  "appointment_date": "2026-03-25",
  "start_time": "14:00:00",
  "end_time": "14:30:00",
  "reschedule_count": 1,
  "version": 2,
  "status": "scheduled"
}

# Test 2-hour restriction (appointment at 2026-03-18 10:00, current time 9:00)
curl -X PUT http://localhost:3000/api/appointments/123 \
  -d '{ "appointment_date": "2026-03-18", "start_time": "11:00:00" }'
# Expected: 400 "Cannot reschedule appointments within 2 hours of start time"

# Test reschedule limit (after 3 reschedules)
# Expected: 409 "Maximum reschedules (3) reached for this appointment"

# Test concurrent booking
# User A and B select same slot, User B submits first, User A submits second
# Expected: 409 "Slot no longer available"

# Test version conflict
curl -X PUT http://localhost:3000/api/appointments/123 \
  -d '{ ..., "version": 1 }' # stale version
# Expected: 409 "Appointment was modified by another user"

# Verify audit log
psql -U postgres -d clinic_db -c "SELECT * FROM audit_logs WHERE entity_id = 123 AND action = 'UPDATE' ORDER BY created_at DESC LIMIT 1;"
# Expected: Log entry with before/after values

# Verify email sent
# Check email logs or mock email service
# Expected: Email with new appointment details + PDF attachment

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Migration adds reschedule_count, version columns
- [ ] PUT /:id route requires authentication
- [ ] Validate appointment exists (404 if not found)
- [ ] Validate user owns appointment (403 if not patient_id match)
- [ ] Validate 2 hours before start_time (400 if too soon)
- [ ] Validate reschedule_count < 3 (409 if limit reached)
- [ ] Validate new slot available (409 if booked)
- [ ] Optimistic locking check: version matches (409 if stale)
- [ ] Transaction: Update appointment date/time, increment reschedule_count, increment version
- [ ] Audit log: Log UPDATE with before/after values
- [ ] PDF regeneration: Call generateAppointmentPDF
- [ ] Email: Send email with PDF attachment
- [ ] Calendar sync: Call updateCalendarEvent
- [ ] Return 200 with updated appointment object
- [ ] Rollback on any error, return appropriate status

## Implementation Checklist

### Database Migration (database/migrations/XXX_add_reschedule_tracking.sql)
- [ ] CREATE MIGRATION FILE: XXX_add_reschedule_tracking.sql
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_count INT DEFAULT 0 NOT NULL;
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS version INT DEFAULT 1 NOT NULL;
- [ ] COMMENT ON COLUMN appointments.reschedule_count IS 'Number of times appointment has been rescheduled (max 3)';
- [ ] COMMENT ON COLUMN appointments.version IS 'Optimistic locking version for concurrent updates';
- [ ] CREATE INDEX idx_appointments_reschedule_count ON appointments(reschedule_count);

### Appointment Validation Utility (server/src/utils/appointmentValidation.ts)
- [ ] Import: addHours, parseISO, isAfter from date-fns
- [ ] export interface RescheduleValidation {
- [ ]   allowed: boolean;
- [ ]   error?: { code: string; message: string; status: number };
- [ ] }
- [ ] export const validateRescheduleTime = (appointmentDate: string, startTime: string): RescheduleValidation => {
- [ ]   const appointmentDateTime = parseISO(`${appointmentDate}T${startTime}`);
- [ ]   const twoHoursFromNow = addHours(new Date(), 2);
- [ ]   if (!isAfter(appointmentDateTime, twoHoursFromNow)) {
- [ ]     return { allowed: false, error: { code: 'TIME_RESTRICTION', message: 'Cannot reschedule appointments within 2 hours of start time. Please call the office.', status: 400 } };
- [ ]   }
- [ ]   return { allowed: true };
- [ ] };
- [ ] export const validateRescheduleCount = (rescheduleCount: number): RescheduleValidation => {
- [ ]   if (rescheduleCount >= 3) {
- [ ]     return { allowed: false, error: { code: 'MAX_RESCHEDULES', message: 'Maximum reschedules (3) reached for this appointment.', status: 409 } };
- [ ]   }
- [ ]   return { allowed: true };
- [ ] };

### Validation Middleware (server/src/middleware/validateReschedule.ts)
- [ ] Import: Request, Response, NextFunction, pool (pg), validateRescheduleTime, validateRescheduleCount
- [ ] export const validateReschedule = async (req: Request, res: Response, next: NextFunction) => {
- [ ]   const appointmentId = req.params.id;
- [ ]   const userId = req.user.id; // from auth middleware
- [ ]   const { appointment_date, start_time } = req.body;
- [ ]   try {
- [ ]     // Check appointment exists and user owns it
- [ ]     const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [appointmentId]);
- [ ]     if (result.rows.length === 0) {
- [ ]       return res.status(404).json({ error: 'Appointment not found' });
- [ ]     }
- [ ]     const appointment = result.rows[0];
- [ ]     if (appointment.patient_id !== userId) {
- [ ]       return res.status(403).json({ error: 'Unauthorized to reschedule this appointment' });
- [ ]     }
- [ ]     // Validate 2-hour restriction
- [ ]     const timeValidation = validateRescheduleTime(appointment.appointment_date, appointment.start_time);
- [ ]     if (!timeValidation.allowed) {
- [ ]       return res.status(timeValidation.error.status).json({ error: timeValidation.error.message, code: timeValidation.error.code });
- [ ]     }
- [ ]     // Validate reschedule count
- [ ]     const countValidation = validateRescheduleCount(appointment.reschedule_count);
- [ ]     if (!countValidation.allowed) {
- [ ]       return res.status(countValidation.error.status).json({ error: countValidation.error.message, code: countValidation.error.code });
- [ ]     }
- [ ]     // Attach appointment to request
- [ ]     req.appointment = appointment;
- [ ]     next();
- [ ]   } catch (error) {
- [ ]     console.error('Validation error:', error);
- [ ]     res.status(500).json({ error: 'Failed to validate reschedule request' });
- [ ]   }
- [ ] };

### Reschedule Service (server/src/services/appointmentRescheduleService.ts)
- [ ] Import: pool (pg), auditLogger (US_011), generateAppointmentPDF (US_013 TASK_003), sendEmail (US_013 TASK_004), updateCalendarEvent (US_013 TASK_005)
- [ ] interface RescheduleData {
- [ ]   appointmentId: number;
- [ ]   newDate: string;
- [ ]   newStartTime: string;
- [ ]   newEndTime: string;
- [ ]   currentVersion: number;
- [ ] }
- [ ] export const rescheduleAppointment = async (data: RescheduleData) => {
- [ ]   const client = await pool.connect();
- [ ]   try {
- [ ]     await client.query('BEGIN');
- [ ]     // Check slot availability (reuse from booking service)
- [ ]     const slotCheck = await client.query(
- [ ]       'SELECT COUNT(*) FROM appointments WHERE provider_id = (SELECT provider_id FROM appointments WHERE id = $1) AND appointment_date = $2 AND start_time = $3 AND status != $4',
- [ ]       [data.appointmentId, data.newDate, data.newStartTime, 'cancelled']
- [ ]     );
- [ ]     if (parseInt(slotCheck.rows[0].count) > 0) {
- [ ]       throw { status: 409, code: 'SLOT_UNAVAILABLE', message: 'Slot no longer available' };
- [ ]     }
- [ ]     // Get current appointment
- [ ]     const currentResult = await client.query('SELECT * FROM appointments WHERE id = $1', [data.appointmentId]);
- [ ]     const oldAppointment = currentResult.rows[0];
- [ ]     // Optimistic locking check
- [ ]     if (oldAppointment.version !== data.currentVersion) {
- [ ]       throw { status: 409, code: 'VERSION_CONFLICT', message: 'Appointment was modified by another user. Please refresh and try again.' };
- [ ]     }
- [ ]     // Update appointment
- [ ]     const updateResult = await client.query(
- [ ]       'UPDATE appointments SET appointment_date = $1, start_time = $2, end_time = $3, reschedule_count = reschedule_count + 1, version = version + 1, updated_at = NOW() WHERE id = $4 RETURNING *',
- [ ]       [data.newDate, data.newStartTime, data.newEndTime, data.appointmentId]
- [ ]     );
- [ ]     const updatedAppointment = updateResult.rows[0];
- [ ]     // Audit log
- [ ]     await auditLogger.log({
- [ ]       user_id: oldAppointment.patient_id,
- [ ]       action: 'UPDATE',
- [ ]       entity_type: 'appointment',
- [ ]       entity_id: data.appointmentId,
- [ ]       changes: {
- [ ]         before: { appointment_date: oldAppointment.appointment_date, start_time: oldAppointment.start_time, end_time: oldAppointment.end_time },
- [ ]         after: { appointment_date: data.newDate, start_time: data.newStartTime, end_time: data.newEndTime }
- [ ]       },
- [ ]       ip_address: 'server-internal',
- [ ]       user_agent: 'reschedule-service'
- [ ]     });
- [ ]     await client.query('COMMIT');
- [ ]     // Post-transaction: PDF, email, calendar sync (non-blocking)
- [ ]     setImmediate(async () => {
- [ ]       try {
- [ ]         // Regenerate PDF
- [ ]         const pdfPath = await generateAppointmentPDF(updatedAppointment);
- [ ]         // Send email with PDF
- [ ]         await sendEmail({
- [ ]           to: updatedAppointment.patient_email,
- [ ]           subject: 'Appointment Rescheduled',
- [ ]           template: 'appointment-rescheduled',
- [ ]           data: { appointment: updatedAppointment },
- [ ]           attachments: [{ filename: 'appointment-confirmation.pdf', path: pdfPath }]
- [ ]         });
- [ ]         // Update calendar events
- [ ]         await updateCalendarEvent(updatedAppointment);
- [ ]       } catch (error) {
- [ ]         console.error('Post-reschedule processing error:', error);
- [ ]         // Log but don't fail the reschedule
- [ ]       }
- [ ]     });
- [ ]     return updatedAppointment;
- [ ]   } catch (error) {
- [ ]     await client.query('ROLLBACK');
- [ ]     throw error;
- [ ]   } finally {
- [ ]     client.release();
- [ ]   }
- [ ] };

### Update Controller (server/src/controllers/appointmentController.ts)
- [ ] Import: rescheduleAppointment from appointmentRescheduleService
- [ ] export const rescheduleAppointment = async (req: Request, res: Response) => {
- [ ]   try {
- [ ]     const appointmentId = parseInt(req.params.id);
- [ ]     const { appointment_date, start_time, end_time } = req.body;
- [ ]     const currentVersion = req.appointment.version; // from middleware
- [ ]     // Validate required fields
- [ ]     if (!appointment_date || !start_time || !end_time) {
- [ ]       return res.status(400).json({ error: 'Missing required fields: appointment_date, start_time, end_time' });
- [ ]     }
- [ ]     const updatedAppointment = await rescheduleAppointment({
- [ ]       appointmentId,
- [ ]       newDate: appointment_date,
- [ ]       newStartTime: start_time,
- [ ]       newEndTime: end_time,
- [ ]       currentVersion
- [ ]     });
- [ ]     res.status(200).json(updatedAppointment);
- [ ]   } catch (error) {
- [ ]     console.error('Reschedule error:', error);
- [ ]     if (error.status === 409) {
- [ ]       return res.status(409).json({ error: error.message, code: error.code });
- [ ]     }
- [ ]     res.status(500).json({ error: 'Failed to reschedule appointment' });
- [ ]   }
- [ ] };

### Update Routes (server/src/routes/appointmentRoutes.ts)
- [ ] Import: validateReschedule, rescheduleAppointment (controller), authenticate
- [ ] router.put('/:id', authenticate, validateReschedule, rescheduleAppointment);

### Testing Checklist
- [ ] Run migration: reschedule_count, version columns added
- [ ] Test PUT /api/appointments/:id with valid data → 200, appointment updated
- [ ] Test 2-hour restriction: Appointment 1.5 hours away → 400 error
- [ ] Test reschedule limit: 4th reschedule → 409 error
- [ ] Test slot unavailable: Concurrent booking → 409 error
- [ ] Test version conflict: Stale version → 409 error
- [ ] Test unauthorized: Different user's appointment → 403 error
- [ ] Test not found: Invalid appointment ID → 404 error
- [ ] Verify audit log: UPDATE entry with before/after values
- [ ] Verify PDF regenerated: New PDF file created
- [ ] Verify email sent: Email with updated details + PDF
- [ ] Verify calendar sync: Google/Outlook event updated
- [ ] Test rollback: Database error → No changes persisted
- [ ] Integration test: Frontend reschedule → Backend → Email → Calendar
