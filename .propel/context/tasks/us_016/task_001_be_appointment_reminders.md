# Task - TASK_001_BE_APPOINTMENT_REMINDERS

## Requirement Reference
- User Story: US_016
- Story Location: `.propel/context/tasks/us_016/us_016.md`
- Acceptance Criteria:
    - AC1: Automated cron job (hourly) sends SMS/email reminders 24 hours before appointment with details, calendar .ics attachment, logs reminders_sent_at
- Edge Cases:
    - Multiple appointments within 24 hours: Send one consolidated message
    - SMS delivery fails: Log failure, use email as fallback, show warning in staff dashboard
    - Patient opts out: Check notifications_preferences, skip if opt_out=true

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No (Backend cron job) |
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
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | node-cron | 3.x |
| Backend | Twilio SDK | 4.x (SMS) |
| Backend | Nodemailer | 6.x (Email) |
| Database | PostgreSQL | 16.x |
| AI/ML | N/A | N/A |

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
Implement automated appointment reminder system: (1) node-cron job runs hourly, queries appointments 24 hours ahead, (2) Sends SMS via Twilio: "Reminder: Appointment tomorrow [time] with [provider]. Reply CONFIRM or call [phone].", (3) Sends email via Nodemailer with appointment details, map link, .ics calendar file, preparation instructions, (4) Logs reminders_sent_at timestamp in appointments table, (5) Retries 3 times on delivery failure, (6) Checks notifications_preferences for opt-out, (7) Consolidates multiple appointments into one message.

## Dependent Tasks
- US_007: Appointments table must exist
- US_018: PDF/calendar .ics generation (attach to email)

## Impacted Components
**New:**
- server/src/jobs/appointment-reminders.ts (Cron job for sending reminders)
- server/src/services/notification.service.ts (SMS + email sending logic)
- server/src/templates/reminder-email.html (Email HTML template)
- server/src/templates/reminder-sms.txt (SMS text template)
- server/db/notifications-preferences.sql (Preferences table: user_id, reminder_opt_out)

## Implementation Plan
1. Install Twilio SDK + Nodemailer: npm install twilio nodemailer
2. Create notifications_preferences table: user_id, reminder_opt_out BOOLEAN DEFAULT false
3. Implement NotificationService: sendSMS(phone, message), sendEmail(email, subject, html, attachments)
4. Create reminder cron job: Run every hour, query appointments WHERE appointment_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '24 hours' AND reminders_sent_at IS NULL
5. SMS template: "Reminder: Appointment tomorrow at [time] with [provider] at [location]. Reply CONFIRM or call [clinic_phone]."
6. Email template: HTML with appointment table, map link, .ics attachment, preparation instructions
7. Consolidation logic: GROUP BY patient_id, if count > 1, combine appointments in one message
8. Retry logic: Try 3 times with exponential backoff (10s, 30s, 60s)
9. Update reminders_sent_at: After successful send
10. Log delivery failures: Insert to notification_failures table for staff monitoring

## Current Project State
```
ASSIGNMENT/server/src/
├── services/ (appointments.service exists)
└── (notification service + cron job to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/jobs/appointment-reminders.ts | Hourly cron job |
| CREATE | server/src/services/notification.service.ts | SMS/email sending |
| CREATE | server/src/templates/reminder-email.html | Email template |
| CREATE | server/src/templates/reminder-sms.txt | SMS template |
| CREATE | server/db/notifications-preferences.sql | Opt-out preferences table |
| UPDATE | server/package.json | Add twilio, nodemailer |
| UPDATE | server/.env.example | Add TWILIO_SID, TWILIO_TOKEN, SMTP_* |

## External References
- [Twilio SMS API](https://www.twilio.com/docs/sms/api)
- [Nodemailer Documentation](https://nodemailer.com/)
- [node-cron Scheduling](https://www.npmjs.com/package/node-cron)
- [FR-003 Automated Reminders](../../../.propel/context/docs/spec.md#FR-003)

## Build Commands
```bash
cd server
npm install twilio nodemailer node-cron
npm run dev  # Cron starts automatically
```

## Implementation Validation Strategy
- [ ] Unit tests: sendSMS sends via Twilio
- [ ] Integration tests: Cron job queries appointments 24 hours ahead
- [ ] twilio installed: package.json shows twilio@4.x
- [ ] Cron job runs: Log shows "Reminder cron job started" on server start
- [ ] Query correct appointments: Cron runs → logs "Found X appointments for reminder"
- [ ] SMS sent: Create appointment for tomorrow → wait 1 hour → verify SMS received
- [ ] Email sent: Verify email with .ics attachment received
- [ ] reminders_sent_at updated: Query appointments table → timestamp set
- [ ] Opt-out respected: Set reminder_opt_out=true → cron skips that patient
- [ ] Consolidation: Create 2 appointments for tomorrow → receive 1 SMS listing both
- [ ] Retry logic: Simulate Twilio failure → verify 3 retry attempts logged
- [ ] Delivery failure logged: SMS fails → notification_failures table has entry

## Implementation Checklist
- [ ] Install dependencies: `npm install twilio nodemailer node-cron`
- [ ] Add environment variables: TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE, SMTP_HOST, SMTP_USER, SMTP_PASS
- [ ] Create notifications_preferences table
- [ ] Implement notification.service.ts with sendSMS + sendEmail
- [ ] Create reminder templates (SMS txt + email HTML)
- [ ] Implement appointment-reminders.ts cron job (every hour)
- [ ] Test reminder delivery
- [ ] Document reminder system in server/README.md
