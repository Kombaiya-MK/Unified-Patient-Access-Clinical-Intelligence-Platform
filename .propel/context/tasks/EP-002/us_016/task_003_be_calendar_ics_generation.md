# Task - TASK_003_BE_CALENDAR_ICS_GENERATION

## Requirement Reference
- User Story: US_016  
- Story Location: `.propel/context/tasks/us_016/us_016.md`
- Acceptance Criteria:
    - AC1: Email includes calendar attachment (.ics file) with appointment details
- Edge Cases:
    - Multiple appointments: Include all appointments in single .ics file
    - Timezone handling: Convert to patient's local timezone

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
| Backend | ical-generator | 6.x |
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
Implement calendar (.ics) file generation service using ical-generator library to create iCalendar format files for email attachments. Service generates .ics files with: (1) Event title: "Appointment with [Provider Name]". (2) Start/End datetime in ISO 8601 format with timezone. (3) Location: Clinic address. (4) Description: Appointment reason, preparation instructions, what to bring. (5) Organizer: Clinic contact info. (6) Attendee: Patient email. (7) Alarm/Reminder: 24 hours before appointment. (8) UID: Unique identifier (appointment_id@clinic.com). (9) Status: CONFIRMED. Support multiple appointments in single .ics file (VEVENT for each appointment). Return file path or buffer for email attachment. Handle timezone conversions using moment-timezone. Store generated files in temp directory with cleanup after email sent.

## Dependent Tasks
- US_013 TASK_004: Email service must exist for attachment integration

## Impacted Components
**Modified:**
- server/src/services/emailService.ts (Add .ics attachment support)

**New:**
- server/src/services/calendarService.ts (iCalendar generation logic)
- server/src/templates/calendar/appointmentEvent.ts (Event template)
- server/tmp/ (Temporary .ics file storage directory)

## Implementation Plan
1. **Install ical-generator**: npm install ical-generator
2. **Calendar Service**: Create generateAppointmentCalendar function
3. **Event Template**: Define appointment event structure (title, location, description)
4. **Timezone Handling**: Use moment-timezone for datetime conversion
5. **Multiple Events**: Support multiple appointments in single .ics file
6. **File Generation**: Save .ics to temp directory, return file path
7. **Email Integration**: Attach .ics file to reminder email
8. **Cleanup**: Delete temp .ics files after email sent
9. **Alarm**: Add 24-hour reminder alarm to event
10. **UID Generation**: Unique identifier for each event

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── services/
│   │   │   ├── emailService.ts (US_013 TASK_004)
│   │   │   └── smsService.ts (US_016 TASK_002)
│   │   └── templates/
│   └── tmp/ (create directory)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/calendarService.ts | iCalendar (.ics) generation |
| CREATE | server/src/templates/calendar/appointmentEvent.ts | Event template structure |
| MODIFY | server/src/services/emailService.ts | Add .ics attachment support |

> 1 modified file, 2 new files created

## External References
- [ical-generator Documentation](https://www.npmjs.com/package/ical-generator)
- [iCalendar RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545)
- [moment-timezone](https://momentjs.com/timezone/)
- [iCalendar Format Guide](https://icalendar.org/)

## Build Commands
```bash
# Install dependencies
cd server
npm install ical-generator
npm install moment-timezone
npm install --save-dev @types/ical-generator

# Create temp directory
mkdir -p tmp

# Start backend server
npm run dev

# Test calendar generation
node -e "
const { generateAppointmentCalendar } = require('./dist/services/calendarService');
generateAppointmentCalendar([{
  id: 123,
  appointment_date: '2026-03-25',
  start_time: '10:00:00',
  end_time: '10:30:00',
  provider_name: 'Dr. Smith',
  patient_email: 'patient@example.com',
  reason: 'Follow-up',
  location: '123 Main St'
}])
.then(filePath => {
  console.log('Calendar file generated:', filePath);
  const fs = require('fs');
  console.log(fs.readFileSync(filePath, 'utf8'));
})
.catch(err => console.error('Generation failed:', err));
"

# Expected output: .ics file content with VCALENDAR, VEVENT, VALARM

# Verify .ics format
cat server/tmp/appointment_123_*.ics
# Expected structure:
# BEGIN:VCALENDAR
# VERSION:2.0
# PRODID:-//Clinic//Appointment Reminder//EN
# BEGIN:VEVENT
# UID:appointment-123@clinic.com
# DTSTAMP:...
# DTSTART:20260325T100000Z
# DTEND:20260325T103000Z
# SUMMARY:Appointment with Dr. Smith
# LOCATION:123 Main St
# DESCRIPTION:Follow-up appointment...
# STATUS:CONFIRMED
# BEGIN:VALARM
# TRIGGER:-PT24H
# ACTION:DISPLAY
# END:VALARM
# END:VEVENT
# END:VCALENDAR

# Test email with calendar attachment
# Trigger reminder email, verify .ics attached

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] ical-generator library installed
- [ ] generateAppointmentCalendar function accepts appointment data array
- [ ] .ics file generated with valid iCalendar format
- [ ] Event title: "Appointment with [Provider]"
- [ ] Start/End datetime in ISO 8601 with timezone
- [ ] Location includes clinic address
- [ ] Description includes reason, preparation instructions
- [ ] Organizer set to clinic contact info
- [ ] Attendee set to patient email
- [ ] 24-hour reminder alarm included (VALARM)
- [ ] Unique UID: appointment-{id}@clinic.com
- [ ] Status: CONFIRMED
- [ ] Multiple appointments: Multiple VEVENT in single .ics
- [ ] Timezone conversion handled correctly
- [ ] File saved to server/tmp/ directory
- [ ] Email service attaches .ics file
- [ ] Cleanup: Temp files deleted after email sent

## Implementation Checklist

### Calendar Event Template (server/src/templates/calendar/appointmentEvent.ts)
- [ ] Export interface CalendarEventData {
- [ ]   id: number;
- [ ]   appointment_date: string;
- [ ]   start_time: string;
- [ ]   end_time: string;
- [ ]   provider_name: string;
- [ ]   provider_specialty?: string;
- [ ]   patient_email: string;
- [ ]   patient_name: string;
- [ ]   reason: string;
- [ ]   location: string;
- [ ]   preparation_instructions?: string;
- [ ] }
- [ ] export const getEventDescription = (data: CalendarEventData): string => {
- [ ]   let description = `Appointment for: ${data.reason}\n\n`;
- [ ]   description += `Provider: ${data.provider_name}`;
- [ ]   if (data.provider_specialty) {
- [ ]     description += ` (${data.provider_specialty})`;
- [ ]   }
- [ ]   description += `\n\nLocation: ${data.location}\n\n`;
- [ ]   description += `What to bring:\n- Photo ID\n- Insurance card\n- List of current medications\n\n`;
- [ ]   if (data.preparation_instructions) {
- [ ]     description += `Preparation:\n${data.preparation_instructions}\n\n`;
- [ ]   }
- [ ]   description += `For questions or cancellations, call ${process.env.CLINIC_PHONE_NUMBER || '1-800-CLINIC'}`;
- [ ]   return description;
- [ ] };

### Calendar Service (server/src/services/calendarService.ts)
- [ ] Import: ical from 'ical-generator', moment from 'moment-timezone', fs, path, getEventDescription
- [ ] const CLINIC_TIMEZONE = process.env.CLINIC_TIMEZONE || 'America/New_York';
- [ ] const CLINIC_NAME = process.env.CLINIC_NAME || 'Clinic';
- [ ] const CLINIC_EMAIL = process.env.CLINIC_EMAIL || 'appointments@clinic.com';
- [ ] const CLINIC_LOCATION = process.env.CLINIC_LOCATION || '123 Main St, City, State 12345';
- [ ] export const generateAppointmentCalendar = async (appointments: CalendarEventData[]): Promise<string> => {
- [ ]   try {
- [ ]     // Create calendar
- [ ]     const calendar = ical({
- [ ]       prodId: { company: CLINIC_NAME, product: 'Appointment Reminder' },
- [ ]       name: 'Appointment Reminders',
- [ ]       timezone: CLINIC_TIMEZONE
- [ ]     });
- [ ]     // Add events for each appointment
- [ ]     appointments.forEach(apt => {
- [ ]       const startDateTime = moment.tz(`${apt.appointment_date} ${apt.start_time}`, CLINIC_TIMEZONE);
- [ ]       const endDateTime = moment.tz(`${apt.appointment_date} ${apt.end_time}`, CLINIC_TIMEZONE);
- [ ]       calendar.createEvent({
- [ ]         uid: `appointment-${apt.id}@${CLINIC_EMAIL.split('@')[1]}`,
- [ ]         start: startDateTime.toDate(),
- [ ]         end: endDateTime.toDate(),
- [ ]         summary: `Appointment with ${apt.provider_name}`,
- [ ]         description: getEventDescription(apt),
- [ ]         location: apt.location || CLINIC_LOCATION,
- [ ]         status: 'CONFIRMED',
- [ ]         organizer: {
- [ ]           name: CLINIC_NAME,
- [ ]           email: CLINIC_EMAIL
- [ ]         },
- [ ]         attendees: [{
- [ ]           name: apt.patient_name,
- [ ]           email: apt.patient_email,
- [ ]           rsvp: true,
- [ ]           status: 'NEEDS-ACTION',
- [ ]           role: 'REQ-PARTICIPANT'
- [ ]         }],
- [ ]         alarms: [{
- [ ]           type: 'display',
- [ ]           trigger: 86400, // 24 hours before (in seconds)
- [ ]           description: `Reminder: Appointment with ${apt.provider_name} tomorrow at ${moment(startDateTime).format('h:mm A')}`
- [ ]         }]
- [ ]       });
- [ ]     });
- [ ]     // Generate file path
- [ ]     const tmpDir = path.join(__dirname, '../../tmp');
- [ ]     if (!fs.existsSync(tmpDir)) {
- [ ]       fs.mkdirSync(tmpDir, { recursive: true });
- [ ]     }
- [ ]     const fileName = `appointment_${appointments[0].id}_${Date.now()}.ics`;
- [ ]     const filePath = path.join(tmpDir, fileName);
- [ ]     // Save to file
- [ ]     fs.writeFileSync(filePath, calendar.toString());
- [ ]     console.log(`Calendar file generated: ${filePath}`);
- [ ]     return filePath;
- [ ]   } catch (error) {
- [ ]     console.error('Calendar generation error:', error);
- [ ]     throw error;
- [ ]   }
- [ ] };
- [ ] export const cleanupCalendarFile = (filePath: string) => {
- [ ]   try {
- [ ]     if (fs.existsSync(filePath)) {
- [ ]       fs.unlinkSync(filePath);
- [ ]       console.log(`Cleaned up calendar file: ${filePath}`);
- [ ]     }
- [ ]   } catch (error) {
- [ ]     console.error('Calendar cleanup error:', error);
- [ ]   }
- [ ] };

### Update Email Service (server/src/services/emailService.ts)
- [ ] Import: generateAppointmentCalendar, cleanupCalendarFile
- [ ] // Extend sendEmail function to support .ics attachments
- [ ] export const sendAppointmentReminderEmail = async (appointmentData: CalendarEventData[]) => {
- [ ]   try {
- [ ]     // Generate calendar file
- [ ]     const calendarFilePath = await generateAppointmentCalendar(appointmentData);
- [ ]     // Send email with calendar attachment
- [ ]     await sendEmail({
- [ ]       to: appointmentData[0].patient_email,
- [ ]       subject: appointmentData.length === 1 
- [ ]         ? `Appointment Reminder: Tomorrow at ${appointmentData[0].start_time}`
- [ ]         : `Appointment Reminders: ${appointmentData.length} appointments tomorrow`,
- [ ]       template: 'appointment-reminder',
- [ ]       data: {
- [ ]         patient_name: appointmentData[0].patient_name,
- [ ]         appointments: appointmentData,
- [ ]         clinic_name: process.env.CLINIC_NAME,
- [ ]         clinic_phone: process.env.CLINIC_PHONE_NUMBER,
- [ ]         clinic_location: process.env.CLINIC_LOCATION,
- [ ]         map_link: `https://maps.google.com/?q=${encodeURIComponent(process.env.CLINIC_LOCATION)}`
- [ ]       },
- [ ]       attachments: [{
- [ ]         filename: 'appointment.ics',
- [ ]         path: calendarFilePath,
- [ ]         contentType: 'text/calendar'
- [ ]       }]
- [ ]     });
- [ ]     // Cleanup temp file after email sent
- [ ]     cleanupCalendarFile(calendarFilePath);
- [ ]     return { success: true };
- [ ]   } catch (error) {
- [ ]     console.error('Reminder email error:', error);
- [ ]     throw error;
- [ ]   }
- [ ] };

### Email Template (server/src/templates/email/appointment-reminder.html)
- [ ] <!DOCTYPE html>
- [ ] <html>
- [ ] <head><style>body { font-family: Arial, sans-serif; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }</style></head>
- [ ] <body>
- [ ]   <h2>Appointment Reminder</h2>
- [ ]   <p>Dear {{patient_name}},</p>
- [ ]   <p>This is a friendly reminder about your upcoming appointment{{#if multiple}}s{{/if}}:</p>
- [ ]   <table>
- [ ]     <tr><th>Date</th><th>Time</th><th>Provider</th><th>Reason</th></tr>
- [ ]     {{#each appointments}}
- [ ]     <tr><td>{{formatDate appointment_date}}</td><td>{{formatTime start_time}}</td><td>{{provider_name}}</td><td>{{reason}}</td></tr>
- [ ]     {{/each}}
- [ ]   </table>
- [ ]   <h3>Location</h3>
- [ ]   <p>{{clinic_location}}</p>
- [ ]   <p><a href="{{map_link}}">View on Map</a></p>
- [ ]   <h3>What to Bring</h3>
- [ ]   <ul><li>Photo ID</li><li>Insurance card</li><li>List of current medications</li></ul>
- [ ]   <h3>Parking & Directions</h3>
- [ ]   <p>Free parking available in Lot B. Enter through main entrance.</p>
- [ ]   <h3>Calendar Attachment</h3>
- [ ]   <p>Click the attached .ics file to add this appointment to your calendar.</p>
- [ ]   <p>Questions? Call us at {{clinic_phone}}</p>
- [ ]   <p>To cancel or reschedule, please call at least 24 hours in advance.</p>
- [ ]   <p>Best regards,<br>{{clinic_name}}</p>
- [ ] </body>
- [ ] </html>

### Environment Variables (.env)
- [ ] CLINIC_TIMEZONE=America/New_York
- [ ] CLINIC_EMAIL=appointments@clinic.com
- [ ] CLINIC_LOCATION=123 Main St, City, State 12345

### Testing Checklist
- [ ] Install dependencies: npm install ical-generator moment-timezone
- [ ] Test generateAppointmentCalendar with single appointment
- [ ] Verify .ics file generated in server/tmp/
- [ ] Verify VCALENDAR and VEVENT structure
- [ ] Verify DTSTART, DTEND in correct timezone
- [ ] Verify VALARM with -PT24H trigger
- [ ] Test multiple appointments: Single .ics with multiple VEVENTs
- [ ] Test timezone conversion: Different timezones produce correct ISO times
- [ ] Test email integration: sendAppointmentReminderEmail attaches .ics
- [ ] Verify email received with calendar attachment
- [ ] Test attachment opens in calendar apps (Google Calendar, Outlook, Apple Calendar)
- [ ] Verify cleanup: Temp .ics file deleted after email sent
- [ ] Test error handling: Invalid appointment data
