# Task - TASK_002_BE_SMS_SERVICE_INTEGRATION

## Requirement Reference
- User Story: US_016  
- Story Location: `.propel/context/tasks/us_016/us_016.md`
- Acceptance Criteria:
    - AC1: Send SMS message "Reminder: You have an appointment tomorrow at [time] with [provider] at [location]. Reply CONFIRM or call [phone] to cancel."
    - AC1: Retries up to 3 times if SMS delivery fails
- Edge Cases:
    - SMS delivery failure: Log failure, attempt email as fallback
    - Multiple appointments: Consolidated SMS listing all appointments

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

> **Note**: Backend service only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | Twilio SDK | 4.x |
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
Implement SMS notification service using Twilio API (or AWS SNS as alternative) to send appointment reminders. Service includes: (1) sendSMS function with parameters (phone, message, appointmentId). (2) SMS template: "Reminder: Appointment tomorrow [date] at [time] with [provider]. Reply CONFIRM or call [phone]. [clinic name]". (3) Retry logic: up to 3 attempts with exponential backoff (1min, 5min, 15min). (4) Delivery status tracking: Update reminder_sms_status (delivered/failed/pending) in appointments table. (5) Error handling: Log failure reasons (invalid number, network error, quota exceeded) to last_reminder_error column. (6) Configuration: Store Twilio credentials in environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER). (7) Consolidated messages: If patient has multiple appointments within 24h, combine into single SMS. (8) Character limit: Truncate message if exceeds 160 characters (SMS segment limit).

## Dependent Tasks
- US_016 TASK_001: Database schema with reminder tracking columns must exist
- US_011 TASK_001: Audit logging service must exist

## Impacted Components
**Modified:**
- None

**New:**
- server/src/services/smsService.ts (SMS sending logic)
- server/src/templates/sms/appointmentReminder.ts (SMS template)
- server/src/config/twilio.ts (Twilio configuration)
- server/.env.example (Add Twilio environment variables)

## Implementation Plan
1. **Twilio Setup**: Install Twilio SDK, configure credentials from .env
2. **SMS Service**: Create sendSMS function with Twilio client
3. **SMS Template**: Parameterized template for appointment reminders
4. **Retry Mechanism**: Exponential backoff with max 3 attempts
5. **Status Tracking**: Update database with delivery status
6. **Error Handling**: Catch Twilio errors (invalid number, rate limit, network)
7. **Consolidated Messages**: Detect multiple appointments, combine into one SMS
8. **Character Limit**: Truncate long messages to 160 characters
9. **Testing**: Mock Twilio client for unit tests
10. **Logging**: Log all SMS attempts to audit log

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── services/
│   │   │   ├── emailService.ts (US_013 TASK_004)
│   │   │   └── auditLogger.ts (US_011 TASK_001)
│   │   └── config/
│   ├── .env
│   └── .env.example
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/smsService.ts | SMS sending with Twilio |
| CREATE | server/src/templates/sms/appointmentReminder.ts | SMS template generator |
| CREATE | server/src/config/twilio.ts | Twilio client configuration |
| MODIFY | server/.env.example | Add Twilio credentials placeholders |

> 1 modified file, 3 new files created

## External References
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [Twilio SMS Best Practices](https://www.twilio.com/docs/sms/quickstart/node)
- [SMS Character Limits](https://www.twilio.com/docs/glossary/what-sms-character-limit)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

## Build Commands
```bash
# Install Twilio SDK
cd server
npm install twilio
npm install --save-dev @types/twilio

# Set environment variables
cat >> .env <<EOF
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
CLINIC_PHONE_NUMBER=+1-800-CLINIC
CLINIC_NAME="Acme Health Clinic"
EOF

# Start backend server
npm run dev

# Test SMS sending
# Create test script: server/scripts/testSMS.ts
node -e "
const { sendSMS } = require('./dist/services/smsService');
sendSMS('+1234567890', 'Test reminder message', 123)
  .then(result => console.log('SMS sent:', result))
  .catch(err => console.error('SMS failed:', err));
"

# Expected console output:
# "SMS sent successfully to +1234567890, SID: SM..."

# Test retry logic (simulate failure)
# Mock Twilio error in test environment

# Verify database updates
psql -U postgres -d clinic_db -c "SELECT id, reminder_sms_status, reminder_attempts, last_reminder_error FROM appointments WHERE id = 123;"
# Expected: reminder_sms_status='delivered', reminder_attempts=1

# Test consolidated message (multiple appointments)
# Insert two appointments for same patient 24h ahead
# Run reminder job
# Expected: Single SMS with both appointment details

# Test character limit
# Create appointment with very long provider name/location
# Expected: SMS truncated to 160 characters with "..."

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Twilio SDK installed and configured
- [ ] Environment variables loaded: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- [ ] sendSMS function accepts phone, message, appointmentId
- [ ] SMS template generates correct message format
- [ ] Message includes: date, time, provider, location, phone number, clinic name
- [ ] Retry logic: 3 attempts with exponential backoff (1min, 5min, 15min)
- [ ] Database updates: reminder_sms_status, reminder_attempts, last_reminder_error
- [ ] Delivery status: 'delivered' on success, 'failed' after 3 attempts
- [ ] Error handling: Invalid number, rate limit, network errors caught
- [ ] Consolidated messages: Multiple appointments combined into single SMS
- [ ] Character limit: Messages truncated to 160 characters
- [ ] Audit log: All SMS attempts logged with success/failure
- [ ] Mock Twilio client in test environment

## Implementation Checklist

### Twilio Configuration (server/src/config/twilio.ts)
- [ ] Import: twilio from 'twilio'
- [ ] export const twilioClient = twilio(
- [ ]   process.env.TWILIO_ACCOUNT_SID,
- [ ]   process.env.TWILIO_AUTH_TOKEN
- [ ] );
- [ ] export const twilioConfig = {
- [ ]   accountSid: process.env.TWILIO_ACCOUNT_SID,
- [ ]   authToken: process.env.TWILIO_AUTH_TOKEN,
- [ ]   phoneNumber: process.env.TWILIO_PHONE_NUMBER,
- [ ]   clinicPhone: process.env.CLINIC_PHONE_NUMBER || '+1-800-CLINIC',
- [ ]   clinicName: process.env.CLINIC_NAME || 'Clinic'
- [ ] };
- [ ] // Validate configuration on startup
- [ ] if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber) {
- [ ]   console.error('Missing Twilio configuration. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env');
- [ ] }

### SMS Template (server/src/templates/sms/appointmentReminder.ts)
- [ ] Import: formatDate, formatTime
- [ ] interface AppointmentData {
- [ ]   appointment_date: string;
- [ ]   start_time: string;
- [ ]   provider_name: string;
- [ ]   location?: string;
- [ ] }
- [ ] export const generateReminderSMS = (appointments: AppointmentData[], clinicPhone: string, clinicName: string): string => {
- [ ]   if (appointments.length === 1) {
- [ ]     const apt = appointments[0];
- [ ]     const date = formatDate(apt.appointment_date);
- [ ]     const time = formatTime(apt.start_time);
- [ ]     let message = `Reminder: Appointment tomorrow ${date} at ${time} with ${apt.provider_name}`;
- [ ]     if (apt.location) {
- [ ]       message += ` at ${apt.location}`;
- [ ]     }
- [ ]     message += `. Reply CONFIRM or call ${clinicPhone}. ${clinicName}`;
- [ ]     // Truncate to 160 characters if needed
- [ ]     if (message.length > 160) {
- [ ]       message = message.substring(0, 157) + '...';
- [ ]     }
- [ ]     return message;
- [ ]   } else {
- [ ]     // Multiple appointments: consolidated message
- [ ]     let message = `Reminder: You have ${appointments.length} appointments tomorrow: `;
- [ ]     appointments.forEach((apt, index) => {
- [ ]       message += `${formatTime(apt.start_time)} (${apt.provider_name})`;
- [ ]       if (index < appointments.length - 1) message += ', ';
- [ ]     });
- [ ]     message += `. Call ${clinicPhone}. ${clinicName}`;
- [ ]     if (message.length > 160) {
- [ ]       message = message.substring(0, 157) + '...';
- [ ]     }
- [ ]     return message;
- [ ]   }
- [ ] };

### SMS Service (server/src/services/smsService.ts)
- [ ] Import: twilioClient, twilioConfig, pool (pg), auditLogger, generateReminderSMS
- [ ] interface SMSResult {
- [ ]   success: boolean;
- [ ]   sid?: string;
- [ ]   error?: string;
- [ ]   attempts: number;
- [ ] }
- [ ] const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
- [ ] export const sendSMS = async (phone: string, message: string, appointmentId: number, attempt: number = 1): Promise<SMSResult> => {
- [ ]   try {
- [ ]     // Send SMS via Twilio
- [ ]     const result = await twilioClient.messages.create({
- [ ]       body: message,
- [ ]       from: twilioConfig.phoneNumber,
- [ ]       to: phone
- [ ]     });
- [ ]     // Update database: success
- [ ]     await pool.query(
- [ ]       'UPDATE appointments SET reminder_sms_status = $1, reminder_attempts = $2, reminders_sent_at = COALESCE(reminders_sent_at, NOW()) WHERE id = $3',
- [ ]       ['delivered', attempt, appointmentId]
- [ ]     );
- [ ]     // Audit log
- [ ]     await auditLogger.log({
- [ ]       user_id: null, // System action
- [ ]       action: 'SEND_SMS_REMINDER',
- [ ]       entity_type: 'appointment',
- [ ]       entity_id: appointmentId,
- [ ]       changes: { phone, status: 'delivered', sid: result.sid, attempt },
- [ ]       ip_address: 'server-internal',
- [ ]       user_agent: 'sms-service'
- [ ]     });
- [ ]     console.log(`SMS sent successfully to ${phone}, SID: ${result.sid}`);
- [ ]     return { success: true, sid: result.sid, attempts: attempt };
- [ ]   } catch (error) {
- [ ]     console.error(`SMS send failed (attempt ${attempt}):`, error);
- [ ]     const errorMessage = error.message || 'Unknown error';
- [ ]     // Update database: failure
- [ ]     await pool.query(
- [ ]       'UPDATE appointments SET reminder_sms_status = $1, reminder_attempts = $2, last_reminder_error = $3 WHERE id = $4',
- [ ]       ['failed', attempt, errorMessage, appointmentId]
- [ ]     );
- [ ]     // Retry logic (up to 3 attempts)
- [ ]     if (attempt < 3) {
- [ ]       const backoffMs = attempt === 1 ? 60000 : (attempt === 2 ? 300000 : 0); // 1min, 5min
- [ ]       console.log(`Retrying SMS in ${backoffMs / 1000} seconds...`);
- [ ]       await sleep(backoffMs);
- [ ]       return sendSMS(phone, message, appointmentId, attempt + 1);
- [ ]     } else {
- [ ]       // All retries exhausted
- [ ]       await auditLogger.log({
- [ ]         user_id: null,
- [ ]         action: 'SMS_REMINDER_FAILED',
- [ ]         entity_type: 'appointment',
- [ ]         entity_id: appointmentId,
- [ ]         changes: { phone, error: errorMessage, totalAttempts: 3 },
- [ ]         ip_address: 'server-internal',
- [ ]         user_agent: 'sms-service'
- [ ]       });
- [ ]       return { success: false, error: errorMessage, attempts: attempt };
- [ ]     }
- [ ]   }
- [ ] };
- [ ] export const sendAppointmentReminderSMS = async (appointmentId: number) => {
- [ ]   // Fetch appointment details
- [ ]   const result = await pool.query(
- [ ]     'SELECT a.*, p.phone, p.first_name, p.last_name, pr.name AS provider_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN providers pr ON a.provider_id = pr.id WHERE a.id = $1',
- [ ]     [appointmentId]
- [ ]   );
- [ ]   if (result.rows.length === 0) {
- [ ]     throw new Error('Appointment not found');
- [ ]   }
- [ ]   const appointment = result.rows[0];
- [ ]   // Check for multiple appointments for same patient within 24h
- [ ]   const multipleResult = await pool.query(
- [ ]     'SELECT appointment_date, start_time, pr.name AS provider_name FROM appointments a JOIN providers pr ON a.provider_id = pr.id WHERE a.patient_id = $1 AND a.appointment_date = $2 AND a.status = $3 AND a.reminders_sent_at IS NULL ORDER BY a.start_time',
- [ ]     [appointment.patient_id, appointment.appointment_date, 'scheduled']
- [ ]   );
- [ ]   // Generate SMS message
- [ ]   const message = generateReminderSMS(
- [ ]     multipleResult.rows,
- [ ]     twilioConfig.clinicPhone,
- [ ]     twilioConfig.clinicName
- [ ]   );
- [ ]   // Send SMS
- [ ]   return sendSMS(appointment.phone, message, appointmentId);
- [ ] };

### Update .env.example (server/.env.example)
- [ ] # Twilio SMS Configuration
- [ ] TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
- [ ] TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
- [ ] TWILIO_PHONE_NUMBER=+1234567890
- [ ] CLINIC_PHONE_NUMBER=+1-800-555-1234
- [ ] CLINIC_NAME=Acme Health Clinic

### Testing Checklist
- [ ] Install Twilio SDK: npm install twilio
- [ ] Configure .env with valid Twilio credentials
- [ ] Test single appointment SMS: sendAppointmentReminderSMS(123)
- [ ] Verify message format matches template
- [ ] Verify database updates: reminder_sms_status='delivered', reminder_attempts=1
- [ ] Test retry logic: Mock Twilio error, verify 3 attempts with backoff
- [ ] Test consolidated message: Patient with 2 appointments tomorrow
- [ ] Verify character limit: Long message truncated to 160 chars
- [ ] Test error handling: Invalid phone number → reminder_sms_status='failed'
- [ ] Verify audit logs: SEND_SMS_REMINDER and SMS_REMINDER_FAILED entries
- [ ] Test rate limiting: Handle Twilio rate limit errors gracefully
- [ ] Integration test: Full reminder flow (cron job → SMS → status update)
