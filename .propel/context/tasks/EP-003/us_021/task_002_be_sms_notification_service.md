# Task - TASK_002: Backend SMS Notification Service

## Requirement Reference
- User Story: [us_021]
- Story Location: [.propel/context/tasks/us_021/us_021.md]
- Acceptance Criteria:
    - AC1: Send SMS to patient "You're checked in. Estimated wait: [X] minutes. We'll call your name."
- Edge Case:
    - N/A (notification infrastructure concern)

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
| Backend | Node.js (Express) | 20.x LTS |
| Database | PostgreSQL | 15.x |
| Library | twilio | 5.x |

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
Create SMS notification service using Twilio API (or similar provider) to send wait time messages to walk-in patients after check-in. Implement message templating, phone number validation, delivery tracking, and retry logic for failed sends. Store SMS delivery status in database for audit trail.

## Dependent Tasks
- TASK_001: Backend Walk-in Registration API (calls SMS service after registration)

## Impacted Components
- **CREATE** server/src/services/smsService.ts - SMS sending service with Twilio integration
- **CREATE** server/src/types/sms.types.ts - TypeScript interfaces for SMS operations
- **CREATE** server/src/templates/sms/walkinConfirmation.ts - SMS message template
- **MODIFY** server/src/config/env.ts - Add Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- **CREATE** database/migrations/V014__create_sms_log_table.sql - Database migration for SMS delivery log
- **MODIFY** server/package.json - Add twilio dependency

## Implementation Plan
1. **Install Twilio SDK**: Add twilio@5.x and @types/twilio dependencies
2. **Create Database Migration**: Create V014__create_sms_log_table.sql with columns: id, recipient_phone, message, status (sent/failed), sent_at, error_message, appointment_id (FK), retry_count
3. **Create SMS Configuration**: Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to env.ts and .env.example
4. **Create sms.types.ts**: Define interfaces for `SMSMessage`, `SMSResult`, `SMSLogEntry`
5. **Create walkinConfirmation.ts**: Template function that accepts estimatedWaitMinutes, returns formatted message: "You're checked in at [Clinic Name]. Estimated wait: [X] minutes. We'll call your name. Reply STOP to opt out."
6. **Create smsService.ts**: Implement functions:
   - `sendWalkinConfirmation(phone, estimatedWaitMinutes, appointmentId)`: Format message using template, call Twilio API, log to database, return result
   - `sendSMS(phone, message)`: Base function to send SMS via Twilio client.messages.create(), handle errors
   - `logSMSDelivery(recipient, message, status, error, appointmentId)`: Insert into sms_log table
   - `retrySMS(smsLogId)`: Retry failed SMS (max 2 retries)
7. **Implement Phone Validation**: Validate phone format (E.164: +1XXXXXXXXXX), reject invalid numbers before sending
8. **Add Error Handling**: Handle Twilio errors (invalid number, insufficient balance, network timeout), log errors, return graceful failure without blocking registration
9. **Integrate with walkinController**: After successful walk-in registration in TASK_001, call `smsService.sendWalkinConfirmation()` asynchronously (don't block response)

**Focus on how to implement**: Use Twilio trial account for development (allows sending to verified numbers). Store SMS logs for audit compliance. SMS sending is fire-and-forget (async, don't block registration response). Retry failed SMS automatically up to 2 times with exponential backoff (5s, 10s). Phone number validation uses E.164 format (+1XXXXXXXXXX). Environment variables for Twilio credentials loaded from .env file.

## Current Project State
```
server/
├── src/
│   ├── controllers/
│   │   └── walkinController.ts (TASK_001, to be modified)
│   ├── services/
│   │   ├── walkinService.ts (TASK_001)
│   │   └── (smsService.ts to be created)
│   ├── types/
│   │   ├── walkin.types.ts (TASK_001)
│   │   └── (sms.types.ts to be created)
│   ├── templates/
│   │   └── sms/
│   │       └── (walkinConfirmation.ts to be created)
│   ├── config/
│   │   └── env.ts (to be modified)
│   └── app.ts
└── package.json (to be modified)
database/
├── migrations/
│   ├── V012__add_walkin_fields.sql (TASK_001)
│   └── (V013__create_sms_log_table.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/smsService.ts | SMS service with sendWalkinConfirmation, sendSMS, logSMSDelivery, retrySMS functions |
| CREATE | server/src/types/sms.types.ts | TypeScript interfaces: SMSMessage, SMSResult, SMSLogEntry |
| CREATE | server/src/templates/sms/walkinConfirmation.ts | SMS message template function for walk-in confirmation |
| MODIFY | server/src/config/env.ts | Add Twilio configuration: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER |
| CREATE | database/migrations/V013__create_sms_log_table.sql | Migration to create sms_log table with columns: id, recipient_phone, message, status, sent_at, error_message, appointment_id, retry_count |
| MODIFY | server/package.json | Add dependencies: twilio@5.x, @types/twilio@5.x |
| MODIFY | server/src/controllers/walkinController.ts | Call smsService.sendWalkinConfirmation() after successful registration (async, non-blocking) |
| CREATE | server/.env.example | Add example Twilio configuration variables |

## External References
- **Twilio Node.js SDK**: https://www.twilio.com/docs/libraries/node - Official Twilio SDK documentation
- **Twilio SMS API**: https://www.twilio.com/docs/sms/api - SMS sending API reference
- **E.164 Phone Format**: https://en.wikipedia.org/wiki/E.164 - International phone number standard
- **Twilio Trial Account**: https://www.twilio.com/try-twilio - Free trial for development
- **SMS Best Practices**: https://www.twilio.com/docs/sms/best-practices - SMS delivery optimization
- **Phone Number Validation**: https://www.npmjs.com/package/libphonenumber-js - Phone validation library

## Build Commands
- Install dependencies: `npm install` (in server directory, installs twilio@5.x)
- Run database migration: `npm run migrate` or `./database/scripts/run_migrations.ps1`
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run in development: `npm run dev` (start server with nodemon)
- Run tests: `npm test` (execute unit tests for SMS service)
- Test SMS sending: `npm run test:sms` (send test SMS to verified number)

## Implementation Validation Strategy
- [x] Unit tests pass for smsService
- [x] Integration tests pass: sendWalkinConfirmation sends SMS and logs to database
- [x] Database migration runs successfully without errors
- [x] SMS delivery validation: Send test SMS to verified phone number, verify receipt
- [x] Phone validation: Invalid phone numbers rejected before API call
- [x] Error handling validation: Twilio errors logged, don't crash server
- [x] Retry logic validation: Failed SMS retries up to 2 times with exponential backoff
- [x] Audit logging validation: All SMS attempts logged to sms_log table

## Implementation Checklist
- [ ] Create V014__create_sms_log_table.sql migration (CREATE TABLE sms_log with columns: id SERIAL PRIMARY KEY, recipient_phone VARCHAR(20) NOT NULL, message TEXT NOT NULL, status VARCHAR(20) NOT NULL, sent_at TIMESTAMP DEFAULT NOW(), error_message TEXT, appointment_id INTEGER REFERENCES appointments(id), retry_count INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())
- [ ] Run database migration to create sms_log table
- [ ] Install twilio@5.x and @types/twilio dependencies via npm
- [ ] Create sms.types.ts with interfaces: SMSMessage (phone: string, message: string, appointmentId?: number), SMSResult (success: boolean, messageId?: string, error?: string), SMSLogEntry (id, recipientPhone, message, status, sentAt, errorMessage, appointmentId, retryCount)
- [ ] Add Twilio configuration to env.ts (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER from process.env) and .env.example
- [ ] Create walkinConfirmation.ts template function (params: estimatedWaitMinutes: number, clinicName: string, returns formatted string with message)
- [ ] Create smsService.ts with sendSMS base function (initialize Twilio client, validate E.164 phone format, call client.messages.create(), handle errors, return SMSResult)
- [ ] Implement sendWalkinConfirmation function (format message using template, call sendSMS, log to database with logSMSDelivery, return result)
- [ ] Implement retrySMS function (query sms_log for failed messages with retry_count < 2, resend with exponential backoff 5s/10s, increment retry_count)
