# Task - TASK_002: Backend Staff-Assisted Booking Enhancement

## Requirement Reference
- User Story: [us_023]
- Story Location: [.propel/context/tasks/us_023/us_023.md]
- Acceptance Criteria:
    - AC1: Book appointment with booked_by_staff=true and booked_by_staff_id=[staff user ID], send confirmation email/SMS, generate PDF, log to audit log
- Edge Case:
    - EC2: Staff override options - Staff can book past same-day cutoff time, override full slots with "Override Capacity" checkbox if urgent

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

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.18.x |
| Backend | PostgreSQL | 15.x |
| Backend | TypeScript | 5.3.x |

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

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Create POST /api/staff/appointments/book endpoint for staff-assisted appointment booking. Add appointments table columns: booked_by_staff BOOLEAN DEFAULT FALSE, booked_by_staff_id UUID (FK to users.id), staff_booking_notes TEXT, booking_priority VARCHAR(20) DEFAULT 'normal', override_capacity BOOLEAN DEFAULT FALSE. Enhance booking logic to skip same-day cutoff validation when booked_by_staff=true, allow overbooking when override_capacity=true (urgent cases), set booked_by_staff fields, send confirmation email/SMS to patient (not staff), generate PDF confirmation, log staff-assisted booking to audit_log with action='staff_booked_appointment' showing who booked on behalf of whom.

## Dependent Tasks
- TASK_001: Backend Patient Search API (staff uses this to find patient before booking)
- US-013: Appointment booking backend (base booking logic to enhance)
- US-018: PDF generation service (reuse for confirmation PDF)
- US-021 TASK_002: SMS notification service (reuse for patient SMS)

## Impacted Components
- **CREATE** database/migrations/V015__add_staff_booking_columns.sql - Migration to add staff-assisted booking columns to appointments table
- **CREATE** server/src/routes/staffAppointmentRoutes.ts - Staff-specific appointment routes
- **CREATE** server/src/controllers/staffAppointmentController.ts - bookForPatient() controller method
- **MODIFY** server/src/services/appointmentService.ts - Enhance createAppointment() to accept staff booking params
- **MODIFY** server/src/types/appointment.types.ts - Add StaffBookingRequest interface
- **CREATE** server/src/services/auditLogService.ts - Log staff-assisted bookings (or modify existing audit service)
- **MODIFY** server/src/app.ts - Register staffAppointmentRoutes

## Implementation Plan
1. **Create V015__add_staff_booking_columns.sql**: ALTER TABLE appointments ADD COLUMN booked_by_staff BOOLEAN DEFAULT FALSE, ADD COLUMN booked_by_staff_id UUID REFERENCES users(id) ON DELETE SET NULL, ADD COLUMN staff_booking_notes TEXT, ADD COLUMN booking_priority VARCHAR(20) DEFAULT 'normal' CHECK (booking_priority IN ('normal', 'urgent')), ADD COLUMN override_capacity BOOLEAN DEFAULT FALSE; CREATE INDEX idx_appointments_booked_by_staff ON appointments(booked_by_staff_id) WHERE booked_by_staff = TRUE;
2. **Modify appointment.types.ts**: Add StaffBookingRequest interface extending AppointmentBookingRequest with patient_id, booked_by_staff_id, staff_booking_notes?, booking_priority?, override_capacity?
3. **Create staffAppointmentController.ts**: Implement bookForPatient(req, res) controller - extract staff user ID from req.user, extract patient_id from body, validate staff role, call appointmentService.createStaffBooking(), return 201 with appointment details + confirmation sent message
4. **Modify appointmentService.ts**: Add createStaffBooking(data: StaffBookingRequest) method - set booked_by_staff=true, set booked_by_staff_id, skip same-day cutoff validation if booked_by_staff=true, skip capacity check if override_capacity=true (otherwise check slot availability), insert appointment, call pdfService.generateConfirmation, call emailService.sendConfirmation (to patient), call smsService.sendConfirmation (to patient phone), call auditLogService.log with action='staff_booked_appointment' and metadata={staff_id, patient_id, appointment_id}
5. **Create staffAppointmentRoutes.ts**: Define POST /book route with authenticate and requireRole('staff', 'admin') middleware, map to staffAppointmentController.bookForPatient
6. **Modify app.ts**: Import staffAppointmentRoutes, register as app.use('/api/staff/appointments', staffAppointmentRoutes)
7. **Create/Modify auditLogService.ts**: Implement logStaffBooking(staffId, patientId, appointmentId, notes?) method - INSERT INTO audit_log (action, actor_id, target_id, metadata, timestamp) VALUES ('staff_booked_appointment', staffId, appointmentId, {patient_id, notes}, NOW())
8. **Add Validation**: Validate booking_priority in ['normal', 'urgent'], override_capacity is boolean, staff_booking_notes max 500 characters, appointment_datetime not in past, provider_id exists, patient_id exists

**Focus on how to implement**: Migration uses CHECK constraint for booking_priority enum values. Conditional logic: if (booked_by_staff === true) { skip same-day cutoff check }; if (override_capacity === true) { skip capacity validation } else { check slot availability from provider_availability table }. Audit log stores who (staff_id), what (booked appointment), for whom (patient_id), when (timestamp). Email/SMS recipients use patient.email and patient.phone (not staff contact). PDF includes "Booked by: [Staff Name] on behalf of [Patient Name]" footer. Return 400 if patient_id not found, 409 if slot conflict and override_capacity=false.

## Current Project State
```
server/
├── src/
│   ├── routes/
│   │   ├── appointmentRoutes.ts (US_013, patient self-booking)
│   │   ├── staffPatientRoutes.ts (US_023 TASK_001)
│   │   └── (staffAppointmentRoutes.ts to be created)
│   ├── controllers/
│   │   ├── appointmentController.ts (US_013)
│   │   └── (staffAppointmentController.ts to be created)
│   ├── services/
│   │   ├── appointmentService.ts (US_013, to be modified)
│   │   ├── pdfService.ts (US_018 TASK_001)
│   │   ├── emailService.ts (US_018 TASK_003)
│   │   ├── smsService.ts (US_021 TASK_002)
│   │   └── (auditLogService.ts to be created or modified)
│   ├── types/
│   │   └── appointment.types.ts (US_013, to be modified)
│   └── app.ts (to be modified)
database/
└── migrations/
    ├── V001__create_core_tables.sql
    ├── V002__create_appointment_tables.sql
    └── (V015__add_staff_booking_columns.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/V015__add_staff_booking_columns.sql | Add 5 columns to appointments table: booked_by_staff, booked_by_staff_id, staff_booking_notes, booking_priority, override_capacity |
| CREATE | server/src/routes/staffAppointmentRoutes.ts | POST /book route with staff authentication and role check |
| CREATE | server/src/controllers/staffAppointmentController.ts | bookForPatient() controller with patient_id validation and staff user extraction |
| MODIFY | server/src/services/appointmentService.ts | Add createStaffBooking() method with override logic for cutoff time and capacity |
| MODIFY | server/src/types/appointment.types.ts | Add StaffBookingRequest interface with staff-specific fields |
| CREATE | server/src/services/auditLogService.ts | logStaffBooking() method to record who booked for whom |
| MODIFY | server/src/app.ts | Register /api/staff/appointments routes |

## External References
- **PostgreSQL Foreign Keys**: https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-FK - ON DELETE SET NULL for staff reference
- **PostgreSQL CHECK Constraints**: https://www.postgresql.org/docs/15/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS - Enum validation for booking_priority
- **Audit Logging Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html - What to log for compliance
- **Email Service Integration**: https://nodemailer.com/about/ - Sending transactional emails
- **Twilio SMS**: https://www.twilio.com/docs/sms/api - SMS notification delivery

## Build Commands
- Run migration: `.\database\scripts\run_migrations.ps1` (applies V015 migration)
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (execute unit and integration tests)
- Type check: `npm run type-check` (validate TypeScript)

## Implementation Validation Strategy
- [x] Migration V015 runs successfully, appointments table has new columns
- [x] Unit tests pass for appointmentService.createStaffBooking()
- [x] Integration test: Staff books appointment past same-day cutoff → succeeds
- [x] Integration test: Staff books with override_capacity=true on full slot → succeeds
- [x] Integration test: Patient receives confirmation email and SMS (staff does not)
- [x] Integration test: PDF confirmation generated with "Booked by [Staff Name]" footer
- [x] Integration test: Audit log entry created with staff_id and patient_id
- [x] Integration test: Non-staff user receives 403 Forbidden
- [x] Security test: Staff cannot book for patients outside their organization (if multi-tenant)

## Implementation Checklist
- [ ] Create V015__add_staff_booking_columns.sql migration (ALTER TABLE appointments ADD booked_by_staff BOOLEAN DEFAULT FALSE, booked_by_staff_id UUID REFERENCES users(id), staff_booking_notes TEXT, booking_priority VARCHAR(20) DEFAULT 'normal' CHECK IN ('normal', 'urgent'), override_capacity BOOLEAN DEFAULT FALSE, add index on booked_by_staff_id)
- [ ] Run migration using .\database\scripts\run_migrations.ps1
- [ ] Modify appointment.types.ts (add StaffBookingRequest interface with patient_id: string, booked_by_staff_id: string, staff_booking_notes?: string, booking_priority?: 'normal' | 'urgent', override_capacity?: boolean, plus all fields from AppointmentBookingRequest)
- [ ] Create staffAppointmentController.ts (bookForPatient handler: get staffId from req.user.id, validate patient_id in body, validate staff role, call appointmentService.createStaffBooking, return 201 with {appointment, message: "Confirmation sent to patient"})
- [ ] Modify appointmentService.ts (add createStaffBooking method: set booked_by_staff=true, conditionally skip cutoff if booked_by_staff, conditionally skip capacity if override_capacity, insert appointment, trigger notifications/PDF, call audit log)
- [ ] Create auditLogService.ts (logStaffBooking function: INSERT INTO audit_log with action='staff_booked_appointment', actor_id=staffId, target_id=appointmentId, metadata JSON with patient_id and notes)
- [ ] Create staffAppointmentRoutes.ts (POST /book with authenticate, requireRole('staff', 'admin'), maps to staffAppointmentController.bookForPatient)
- [ ] Modify app.ts (add app.use('/api/staff/appointments', staffAppointmentRoutes) after existing routes)
