# Task - TASK_002_BE_JOIN_WAITLIST_API

## Requirement Reference
- User Story: US_015  
- Story Location: `.propel/context/tasks/us_015/us_015.md`
- Acceptance Criteria:
    - AC1: Click "Join Waitlist" → System adds to waitlist, sends confirmation "You're on the waitlist for [date/time]. We'll notify you if it becomes available"
- Edge Cases:
    - Multiple patients on same slot: FIFO based on created_at
    - Duplicate waitlist entry: Prevent patient joining same slot twice

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
Implement POST /api/waitlist endpoint for patients to join waitlist for fully-booked slots. Accept: patient_id (from auth token), preferred_date, preferred_time, optional preferred_appointment_id. Validate: slot is actually full, patient not already on waitlist for same slot, preferred_date is future date. Insert record with status='waiting', priority_score=0 (FIFO). Send confirmation email "You're on the waitlist for [date/time]. We'll notify you if it becomes available" using email service (US_013 TASK_004). Log to audit log (US_011). Return HTTP 201 with waitlist entry object. Also implement GET /api/waitlist (patient's active entries), DELETE /api/waitlist/:id (cancel waitlist entry). Handle errors: 400 for validation, 404 for invalid slot, 409 for duplicate entry, 500 for server errors.

## Dependent Tasks
- US_007: Appointments table must exist
- US_011 TASK_001: Audit logging service must exist
- US_013 TASK_004: Email service must exist
- US_015 TASK_001: Waitlist table must exist

## Impacted Components
**Modified:**
- server/src/routes/index.ts (Add waitlist routes)

**New:**
- server/src/routes/waitlistRoutes.ts (Waitlist API routes)
- server/src/controllers/waitlistController.ts (Join, cancel, list waitlist)
- server/src/services/waitlistService.ts (Business logic)
- server/src/middleware/validateWaitlistRequest.ts (Validation middleware)

## Implementation Plan
1. **Route Definition**: POST /api/waitlist, GET /api/waitlist, DELETE /api/waitlist/:id
2. **Validation Middleware**: Check slot exists, is full, patient not duplicate, date is future
3. **Slot Full Check**: Query appointments table for slot capacity
4. **Duplicate Check**: Prevent patient joining same slot twice (unique constraint)
5. **Insert Waitlist**: Insert with status='waiting', created_at=NOW()
6. **Email Confirmation**: Send "You're on the waitlist" email
7. **Audit Log**: Log JOIN_WAITLIST action
8. **GET Endpoint**: Return patient's active waitlist entries (status IN waiting, notified)
9. **DELETE Endpoint**: Update status='cancelled', log CANCEL_WAITLIST action
10. **Error Handling**: Return descriptive errors (400, 404, 409, 500)

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── appointmentRoutes.ts (US_013)
│   │   │   └── index.ts
│   │   ├── controllers/
│   │   │   └── appointmentController.ts
│   │   ├── services/
│   │   │   ├── emailService.ts (US_013 TASK_004)
│   │   │   └── auditLogger.ts (US_011 TASK_001)
│   │   └── middleware/
│   │       └── auth.ts (US_009)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/routes/waitlistRoutes.ts | Waitlist API routes (POST, GET, DELETE) |
| CREATE | server/src/controllers/waitlistController.ts | Join, list, cancel waitlist controllers |
| CREATE | server/src/services/waitlistService.ts | Waitlist business logic |
| CREATE | server/src/middleware/validateWaitlistRequest.ts | Validation middleware |
| MODIFY | server/src/routes/index.ts | Register waitlist routes |

> 1 modified file, 4 new files created

## External References
- [Express Route Parameters](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Unique Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)
- [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

## Build Commands
```bash
# Start backend server
cd server
npm run dev

# Test join waitlist endpoint
curl -X POST http://localhost:3000/api/waitlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "preferred_date": "2026-03-25",
    "preferred_time": "10:00:00",
    "preferred_appointment_id": 123
  }'

# Expected response (201 Created):
{
  "id": 1,
  "patient_id": 456,
  "preferred_date": "2026-03-25",
  "preferred_time": "10:00:00",
  "preferred_appointment_id": 123,
  "status": "waiting",
  "priority_score": 0,
  "created_at": "2026-03-18T10:00:00Z"
}

# Test duplicate entry (same patient, same slot)
curl -X POST http://localhost:3000/api/waitlist \
  -H "Authorization: Bearer <token>" \
  -d '{ "preferred_date": "2026-03-25", "preferred_time": "10:00:00" }'
# Expected: 409 "You are already on the waitlist for this slot"

# Test get patient's waitlist
curl -X GET http://localhost:3000/api/waitlist \
  -H "Authorization: Bearer <token>"
# Expected: Array of active waitlist entries

# Test cancel waitlist entry
curl -X DELETE http://localhost:3000/api/waitlist/1 \
  -H "Authorization: Bearer <token>"
# Expected: 200 "Waitlist entry cancelled"

# Verify email sent
# Check email logs or mock email service

# Verify audit log
psql -U postgres -d clinic_db -c "SELECT * FROM audit_logs WHERE action = 'JOIN_WAITLIST' ORDER BY created_at DESC LIMIT 1;"

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] POST /api/waitlist requires authentication
- [ ] Validate preferred_date is future date (400 if past)
- [ ] Validate slot exists in appointments table (404 if not found)
- [ ] Validate slot is full by checking appointment count
- [ ] Prevent duplicate entry: same patient + date + time (409)
- [ ] Insert waitlist entry with status='waiting', priority_score=0
- [ ] Send confirmation email with slot details
- [ ] Log JOIN_WAITLIST action to audit log
- [ ] Return 201 with waitlist entry object
- [ ] GET /api/waitlist returns only patient's active entries
- [ ] DELETE /api/waitlist/:id updates status='cancelled'
- [ ] DELETE logs CANCEL_WAITLIST action
- [ ] Verify patient owns waitlist entry before cancel (403)
- [ ] Handle errors: 400, 404, 409, 500 with descriptive messages

## Implementation Checklist

### Validation Middleware (server/src/middleware/validateWaitlistRequest.ts)
- [ ] Import: Request, Response, NextFunction, pool (pg)
- [ ] export const validateJoinWaitlist = async (req: Request, res: Response, next: NextFunction) => {
- [ ]   const { preferred_date, preferred_time, preferred_appointment_id } = req.body;
- [ ]   const patient_id = req.user.id; // from auth middleware
- [ ]   try {
- [ ]     // Validate required fields
- [ ]     if (!preferred_date || !preferred_time) {
- [ ]       return res.status(400).json({ error: 'Missing required fields: preferred_date, preferred_time' });
- [ ]     }
- [ ]     // Validate future date
- [ ]     const preferredDateTime = new Date(`${preferred_date}T${preferred_time}`);
- [ ]     if (preferredDateTime <= new Date()) {
- [ ]       return res.status(400).json({ error: 'Preferred date/time must be in the future' });
- [ ]     }
- [ ]     // Check if slot exists (if appointment_id provided)
- [ ]     if (preferred_appointment_id) {
- [ ]       const slotResult = await pool.query('SELECT id FROM appointments WHERE id = $1', [preferred_appointment_id]);
- [ ]       if (slotResult.rows.length === 0) {
- [ ]         return res.status(404).json({ error: 'Appointment slot not found' });
- [ ]       }
- [ ]     }
- [ ]     // Check for duplicate waitlist entry
- [ ]     const duplicateCheck = await pool.query(
- [ ]       'SELECT id FROM waitlist WHERE patient_id = $1 AND preferred_date = $2 AND preferred_time = $3 AND status IN ($4, $5)',
- [ ]       [patient_id, preferred_date, preferred_time, 'waiting', 'notified']
- [ ]     );
- [ ]     if (duplicateCheck.rows.length > 0) {
- [ ]       return res.status(409).json({ error: 'You are already on the waitlist for this slot', code: 'DUPLICATE_ENTRY' });
- [ ]     }
- [ ]     next();
- [ ]   } catch (error) {
- [ ]     console.error('Validation error:', error);
- [ ]     res.status(500).json({ error: 'Failed to validate waitlist request' });
- [ ]   }
- [ ] };

### Waitlist Service (server/src/services/waitlistService.ts)
- [ ] Import: pool (pg), auditLogger (US_011), sendEmail (US_013 TASK_004)
- [ ] interface JoinWaitlistData {
- [ ]   patient_id: number;
- [ ]   preferred_date: string;
- [ ]   preferred_time: string;
- [ ]   preferred_appointment_id?: number;
- [ ] }
- [ ] export const joinWaitlist = async (data: JoinWaitlistData) => {
- [ ]   const client = await pool.connect();
- [ ]   try {
- [ ]     await client.query('BEGIN');
- [ ]     // Insert waitlist entry
- [ ]     const insertResult = await client.query(
- [ ]       'INSERT INTO waitlist (patient_id, preferred_date, preferred_time, preferred_appointment_id, status, priority_score) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
- [ ]       [data.patient_id, data.preferred_date, data.preferred_time, data.preferred_appointment_id || null, 'waiting', 0]
- [ ]     );
- [ ]     const waitlistEntry = insertResult.rows[0];
- [ ]     // Get patient email
- [ ]     const patientResult = await client.query('SELECT email, first_name, last_name FROM patients WHERE id = $1', [data.patient_id]);
- [ ]     const patient = patientResult.rows[0];
- [ ]     // Audit log
- [ ]     await auditLogger.log({
- [ ]       user_id: data.patient_id,
- [ ]       action: 'JOIN_WAITLIST',
- [ ]       entity_type: 'waitlist',
- [ ]       entity_id: waitlistEntry.id,
- [ ]       changes: { preferred_date: data.preferred_date, preferred_time: data.preferred_time },
- [ ]       ip_address: 'server-internal',
- [ ]       user_agent: 'waitlist-service'
- [ ]     });
- [ ]     await client.query('COMMIT');
- [ ]     // Send confirmation email (non-blocking)
- [ ]     setImmediate(async () => {
- [ ]       try {
- [ ]         await sendEmail({
- [ ]           to: patient.email,
- [ ]           subject: 'Waitlist Confirmation',
- [ ]           template: 'waitlist-confirmation',
- [ ]           data: {
- [ ]             patient_name: `${patient.first_name} ${patient.last_name}`,
- [ ]             preferred_date: data.preferred_date,
- [ ]             preferred_time: data.preferred_time,
- [ ]             message: `You're on the waitlist for ${data.preferred_date} at ${data.preferred_time}. We'll notify you if it becomes available.`
- [ ]           }
- [ ]         });
- [ ]       } catch (error) {
- [ ]         console.error('Failed to send waitlist confirmation email:', error);
- [ ]       }
- [ ]     });
- [ ]     return waitlistEntry;
- [ ]   } catch (error) {
- [ ]     await client.query('ROLLBACK');
- [ ]     throw error;
- [ ]   } finally {
- [ ]     client.release();
- [ ]   }
- [ ] };
- [ ] export const getPatientWaitlist = async (patient_id: number) => {
- [ ]   const result = await pool.query(
- [ ]     'SELECT * FROM active_waitlist_view WHERE patient_id = $1 ORDER BY created_at ASC',
- [ ]     [patient_id]
- [ ]   );
- [ ]   return result.rows;
- [ ] };
- [ ] export const cancelWaitlistEntry = async (waitlist_id: number, patient_id: number) => {
- [ ]   const client = await pool.connect();
- [ ]   try {
- [ ]     await client.query('BEGIN');
- [ ]     // Verify ownership
- [ ]     const ownershipCheck = await client.query('SELECT patient_id FROM waitlist WHERE id = $1', [waitlist_id]);
- [ ]     if (ownershipCheck.rows.length === 0) {
- [ ]       throw { status: 404, message: 'Waitlist entry not found' };
- [ ]     }
- [ ]     if (ownershipCheck.rows[0].patient_id !== patient_id) {
- [ ]       throw { status: 403, message: 'Unauthorized to cancel this waitlist entry' };
- [ ]     }
- [ ]     // Update status to cancelled
- [ ]     await client.query('UPDATE waitlist SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', waitlist_id]);
- [ ]     // Audit log
- [ ]     await auditLogger.log({
- [ ]       user_id: patient_id,
- [ ]       action: 'CANCEL_WAITLIST',
- [ ]       entity_type: 'waitlist',
- [ ]       entity_id: waitlist_id,
- [ ]       changes: { status: 'cancelled' },
- [ ]       ip_address: 'server-internal',
- [ ]       user_agent: 'waitlist-service'
- [ ]     });
- [ ]     await client.query('COMMIT');
- [ ]   } catch (error) {
- [ ]     await client.query('ROLLBACK');
- [ ]     throw error;
- [ ]   } finally {
- [ ]     client.release();
- [ ]   }
- [ ] };

### Waitlist Controller (server/src/controllers/waitlistController.ts)
- [ ] Import: Request, Response, joinWaitlist, getPatientWaitlist, cancelWaitlistEntry
- [ ] export const joinWaitlistController = async (req: Request, res: Response) => {
- [ ]   try {
- [ ]     const patient_id = req.user.id; // from auth middleware
- [ ]     const { preferred_date, preferred_time, preferred_appointment_id } = req.body;
- [ ]     const waitlistEntry = await joinWaitlist({
- [ ]       patient_id,
- [ ]       preferred_date,
- [ ]       preferred_time,
- [ ]       preferred_appointment_id
- [ ]     });
- [ ]     res.status(201).json(waitlistEntry);
- [ ]   } catch (error) {
- [ ]     console.error('Join waitlist error:', error);
- [ ]     res.status(500).json({ error: 'Failed to join waitlist' });
- [ ]   }
- [ ] };
- [ ] export const getWaitlistController = async (req: Request, res: Response) => {
- [ ]   try {
- [ ]     const patient_id = req.user.id;
- [ ]     const waitlistEntries = await getPatientWaitlist(patient_id);
- [ ]     res.status(200).json(waitlistEntries);
- [ ]   } catch (error) {
- [ ]     console.error('Get waitlist error:', error);
- [ ]     res.status(500).json({ error: 'Failed to retrieve waitlist' });
- [ ]   }
- [ ] };
- [ ] export const cancelWaitlistController = async (req: Request, res: Response) => {
- [ ]   try {
- [ ]     const waitlist_id = parseInt(req.params.id);
- [ ]     const patient_id = req.user.id;
- [ ]     await cancelWaitlistEntry(waitlist_id, patient_id);
- [ ]     res.status(200).json({ message: 'Waitlist entry cancelled successfully' });
- [ ]   } catch (error) {
- [ ]     console.error('Cancel waitlist error:', error);
- [ ]     if (error.status === 404) {
- [ ]       return res.status(404).json({ error: error.message });
- [ ]     }
- [ ]     if (error.status === 403) {
- [ ]       return res.status(403).json({ error: error.message });
- [ ]     }
- [ ]     res.status(500).json({ error: 'Failed to cancel waitlist entry' });
- [ ]   }
- [ ] };

### Waitlist Routes (server/src/routes/waitlistRoutes.ts)
- [ ] Import: Router, authenticate, validateJoinWaitlist, joinWaitlistController, getWaitlistController, cancelWaitlistController
- [ ] const router = Router();
- [ ] router.post('/', authenticate, validateJoinWaitlist, joinWaitlistController);
- [ ] router.get('/', authenticate, getWaitlistController);
- [ ] router.delete('/:id', authenticate, cancelWaitlistController);
- [ ] export default router;

### Update Main Routes (server/src/routes/index.ts)
- [ ] Import: waitlistRoutes from './waitlistRoutes'
- [ ] router.use('/api/waitlist', waitlistRoutes);

### Testing Checklist
- [ ] POST /api/waitlist with valid data → 201, waitlist entry created
- [ ] POST with past date → 400 "Must be in the future"
- [ ] POST duplicate entry → 409 "Already on waitlist"
- [ ] POST without auth → 401 Unauthorized
- [ ] GET /api/waitlist → 200, returns patient's active entries
- [ ] DELETE /api/waitlist/:id → 200, status updated to cancelled
- [ ] DELETE wrong patient → 403 Unauthorized
- [ ] Verify confirmation email sent with correct details
- [ ] Verify audit log: JOIN_WAITLIST and CANCEL_WAITLIST entries
- [ ] Test concurrent joins: Multiple patients same slot → FIFO order maintained
- [ ] Integration test: Full flow from frontend to backend
