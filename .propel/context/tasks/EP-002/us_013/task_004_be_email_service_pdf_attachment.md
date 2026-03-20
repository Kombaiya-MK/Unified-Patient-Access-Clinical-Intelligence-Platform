# Task - TASK_004_BE_EMAIL_SERVICE_PDF_ATTACHMENT

## Requirement Reference
- User Story: US_013  
- Story Location: `.propel/context/tasks/us_013/us_013.md`
- Acceptance Criteria:
    - AC2: System sends confirmation email with PDF attachment after booking

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

> **Note**: Backend email service - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | Nodemailer | 6.x |
| Backend | Handlebars | 4.x |
| External | SendGrid / AWS SES / SMTP | Latest |
| Database | N/A | N/A |

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

> **Note**: Email service only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend service only

## Task Overview
Implement email service for sending appointment confirmation emails with PDF attachments using Nodemailer. Create HTML email template with Handlebars for appointment confirmation message. Configure email transporter (SendGrid/AWS SES/SMTP). Implement sendAppointmentConfirmation(appointmentId) method that generates PDF (via pdfService), renders email template with appointment details, attaches PDF, and sends email to patient. Include fallback plain text version. Handle email delivery failures with retry logic. Log all email sends to audit_logs. Ensure HIPAA-compliant email handling (TLS encryption, no PHI in subject line).

## Dependent Tasks
- US_013 TASK_002: Appointment booking API must create appointment
- US_013 TASK_003: PDF generation service must be implemented

## Impacted Components
**Modified:**
- server/src/routes/appointments.routes.ts (Trigger email after booking)
- server/src/controllers/appointmentController.ts (Call email service after create)

**New:**
- server/src/services/emailService.ts (Core email sending service)
- server/src/templates/email/appointment-confirmation.hbs (HTML email template)
- server/src/config/email.config.ts (Email configuration: SMTP, SendGrid, SES)
- server/src/utils/emailQueue.ts (Optional: Bull queue for async email sending)
- server/tests/unit/emailService.test.ts (Unit tests for email service)

## Implementation Plan
1. **Email Service**: Create emailService with sendAppointmentConfirmation(appointmentId) method
2. **Transporter**: Configure Nodemailer with SendGrid/SES/SMTP credentials
3. **Fetch Data**: Query appointment with patient email and details
4. **Generate PDF**: Call pdfService.generateAppointmentPDFBuffer(appointmentId)
5. **Email Template**: Render Handlebars template with appointment details
6. **Plain Text**: Generate plain text fallback version
7. **Attachments**: Attach PDF buffer with filename "appointment-confirmation.pdf"
8. **Send Email**: Use transporter.sendMail with to, from, subject, html, text, attachments
9. **Retry Logic**: Implement exponential backoff retry (3 attempts) on failure
10. **Audit Logging**: Log all email sends (success/failure) to audit_logs
11. **Error Handling**: Handle SMTP failures, invalid email addresses, PDF generation errors
12. **Testing**: Unit tests with mock transporter, verify email content and attachments

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend API
│   ├── src/
│   │   ├── services/
│   │   │   ├── pdfService.ts (US_013 TASK_003)
│   │   │   └── auditLogger.ts (US_011)
│   │   └── routes/
│   │       └── appointments.routes.ts (US_013 TASK_002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/emailService.ts | Email sending with Nodemailer and PDF attachments |
| CREATE | server/src/templates/email/appointment-confirmation.hbs | HTML email template |
| CREATE | server/src/config/email.config.ts | Email configuration (SMTP/SendGrid/SES) |
| CREATE | server/src/utils/emailQueue.ts | Optional: Async email queue with Bull |
| CREATE | server/tests/unit/emailService.test.ts | Unit tests for email service |
| MODIFY | server/src/controllers/appointmentController.ts | Call emailService after booking |

> 1 modified file, 5 new files created

## External References
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
- [AWS SES SDK](https://docs.aws.amazon.com/ses/latest/dg/send-using-sdk-nodejs.html)
- [Handlebars Email Templates](https://handlebarsjs.com/)
- [Bull Queue for Async Jobs](https://github.com/OptimalBits/bull)
- [HIPAA Email Compliance](https://www.hhs.gov/hipaa/for-professionals/faq/570/does-hipaa-permit-health-care-providers-to-use-email/index.html)

## Build Commands
```bash
# Install dependencies
cd server
npm install nodemailer @sendgrid/mail handlebars

# Configure email credentials (environment variables)
# For SendGrid:
export SENDGRID_API_KEY="SG.xxxxx"
# For SMTP:
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT=587
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="app-specific-password"

# Test email service
# Create test appointment
APPOINTMENT_ID=123

# Send confirmation email
node -e "
const { sendAppointmentConfirmation } = require('./dist/services/emailService');
sendAppointmentConfirmation(123).then(() => console.log('Email sent successfully'));
"

# Check inbox for confirmation email
# Verify: Subject, body content, PDF attachment

# Test retry logic (simulate SMTP failure)
# Mock transporter to fail first 2 attempts, succeed on 3rd
# Verify: Email sent after retries, audit log shows retries

# Test invalid email address
# Create appointment with invalid patient email
# Verify: Error logged, graceful failure

# Run unit tests
npm test -- emailService.test.ts
```

## Implementation Validation Strategy
- [ ] Nodemailer transporter configured with SMTP/SendGrid/SES
- [ ] emailService.sendAppointmentConfirmation(appointmentId) method created
- [ ] Fetches appointment with patient email
- [ ] Generates PDF via pdfService.generateAppointmentPDFBuffer()
- [ ] Renders HTML email template with appointment details
- [ ] Generates plain text fallback
- [ ] Attaches PDF with correct filename
- [ ] Sends email with correct to, from, subject
- [ ] Subject line: "Your Appointment Confirmation - [Clinic Name]" (no PHI)
- [ ] Retry logic: 3 attempts with exponential backoff
- [ ] Audit logging: All sends logged to audit_logs
- [ ] Error handling: SMTP failures, invalid emails, PDF errors
- [ ] TLS encryption: Secure email transmission
- [ ] Unit tests pass with mock transporter
- [ ] Integration test: Real email sent and received

## Implementation Checklist

### Email Configuration (server/src/config/email.config.ts)
- [ ] export const emailConfig = {
- [ ]   provider: process.env.EMAIL_PROVIDER || 'smtp', // 'smtp' | 'sendgrid' | 'ses'
- [ ]   from: process.env.EMAIL_FROM || 'no-reply@upaci.health',
- [ ]   fromName: 'UPACI Health Platform',
- [ ]   smtp: {
- [ ]     host: process.env.SMTP_HOST || 'smtp.gmail.com',
- [ ]     port: parseInt(process.env.SMTP_PORT || '587'),
- [ ]     secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
- [ ]     auth: {
- [ ]       user: process.env.SMTP_USER,
- [ ]       pass: process.env.SMTP_PASS
- [ ]     }
- [ ]   },
- [ ]   sendgrid: {
- [ ]     apiKey: process.env.SENDGRID_API_KEY
- [ ]   },
- [ ]   ses: {
- [ ]     region: process.env.AWS_REGION || 'us-east-1',
- [ ]     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
- [ ]     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
- [ ]   },
- [ ]   retries: 3,
- [ ]   retryDelay: 5000 // 5 seconds base delay
- [ ] }

### Email Template (server/src/templates/email/appointment-confirmation.hbs)
- [ ] <!DOCTYPE html>
- [ ] <html><head><meta charset="UTF-8"><title>Appointment Confirmation</title><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;}.header{background:#006CB8;color:white;padding:20px;text-align:center;}.content{padding:20px;}.footer{background:#F3F4F6;padding:20px;text-align:center;font-size:12px;color:#666;}.button{display:inline-block;padding:12px 24px;background:#006CB8;color:white;text-decoration:none;border-radius:4px;margin:15px 0;}.details{background:#F9FAFB;padding:15px;margin:15px 0;border-left:4px solid #006CB8;}</style></head>
- [ ] <body>
- [ ]   <div class="header"><h1>Appointment Confirmed</h1></div>
- [ ]   <div class="content">
- [ ]     <p>Dear {{patientName}},</p>
- [ ]     <p>Your appointment has been successfully scheduled. Please find the details below:</p>
- [ ]     <div class="details">
- [ ]       <p><strong>Date:</strong> {{appointmentDate}}</p>
- [ ]       <p><strong>Time:</strong> {{appointmentTime}}</p>
- [ ]       <p><strong>Provider:</strong> {{providerName}}</p>
- [ ]       <p><strong>Department:</strong> {{departmentName}}</p>
- [ ]       <p><strong>Location:</strong> {{location}}</p>
- [ ]       <p><strong>Appointment ID:</strong> {{appointmentId}}</p>
- [ ]     </div>
- [ ]     <p><strong>Important Reminders:</strong></p>
- [ ]     <ul>
- [ ]       <li>Please arrive 15 minutes early</li>
- [ ]       <li>Bring valid ID and insurance card</li>
- [ ]       <li>Wear a mask if experiencing symptoms</li>
- [ ]     </ul>
- [ ]     <p>A detailed confirmation with QR code is attached to this email for your records.</p>
- [ ]     <a href="{{portalUrl}}/appointments/{{appointmentId}}" class="button">View in Portal</a>
- [ ]     <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
- [ ]     <p>Thank you for choosing UPACI Health.</p>
- [ ]   </div>
- [ ]   <div class="footer">
- [ ]     <p>UPACI Health Platform</p>
- [ ]     <p>123 Medical Center Dr, Healthcare City, HC 12345</p>
- [ ]     <p>Phone: (555) 123-4567 | Email: appointments@upaci.health</p>
- [ ]     <p><small>This email contains protected health information. Do not forward.</small></p>
- [ ]   </div>
- [ ] </body></html>

### Email Service (server/src/services/emailService.ts)
- [ ] Import nodemailer, handlebars, fs, path, generateAppointmentPDFBuffer, emailConfig, auditLogger
- [ ] Import pg Client for database queries
- [ ] const createTransporter = (): nodemailer.Transporter => {
- [ ]   if (emailConfig.provider === 'sendgrid') {
- [ ]     // SendGrid transporter
- [ ]     return nodemailer.createTransport({ host: 'smtp.sendgrid.net', port: 587, auth: { user: 'apikey', pass: emailConfig.sendgrid.apiKey } });
- [ ]   } else if (emailConfig.provider === 'ses') {
- [ ]     // AWS SES transporter
- [ ]     return nodemailer.createTransport({ SES: new AWS.SES(emailConfig.ses) });
- [ ]   } else {
- [ ]     // SMTP transporter
- [ ]     return nodemailer.createTransporter(emailConfig.smtp);
- [ ]   }
- [ ] }
- [ ] const transporter = createTransporter()
- [ ] const fetchAppointmentEmailData = async (appointmentId: number): Promise<any> => {
- [ ]   const client = new Client(/* db config */);
- [ ]   await client.connect();
- [ ]   const query = `
- [ ]     SELECT 
- [ ]       a.id, a.appointment_date, a.start_time, a.end_time,
- [ ]       p.first_name || ' ' || p.last_name as patient_name,
- [ ]       p.email as patient_email,
- [ ]       pr.first_name || ' ' || pr.last_name as provider_name,
- [ ]       d.name as department_name, d.location
- [ ]     FROM appointments a
- [ ]     JOIN users p ON a.patient_id = p.id
- [ ]     JOIN users pr ON a.provider_id = pr.id
- [ ]     JOIN departments d ON a.department_id = d.id
- [ ]     WHERE a.id = $1
- [ ]   `;
- [ ]   const result = await client.query(query, [appointmentId]);
- [ ]   await client.end();
- [ ]   if (result.rows.length === 0) throw new Error(`Appointment ${appointmentId} not found`);
- [ ]   return result.rows[0];
- [ ] }
- [ ] const renderEmailTemplate = (data: any): string => {
- [ ]   const templatePath = path.join(__dirname, '../templates/email/appointment-confirmation.hbs');
- [ ]   const templateSource = fs.readFileSync(templatePath, 'utf-8');
- [ ]   const template = handlebars.compile(templateSource);
- [ ]   return template(data);
- [ ] }
- [ ] const generatePlainTextEmail = (data: any): string => {
- [ ]   return `
- [ ] Dear ${data.patientName},
- [ ] 
- [ ] Your appointment has been successfully scheduled.
- [ ] 
- [ ] Date: ${data.appointmentDate}
- [ ] Time: ${data.appointmentTime}
- [ ] Provider: ${data.providerName}
- [ ] Department: ${data.departmentName}
- [ ] Location: ${data.location}
- [ ] Appointment ID: ${data.appointmentId}
- [ ] 
- [ ] Important Reminders:
- [ ] - Please arrive 15 minutes early
- [ ] - Bring valid ID and insurance card
- [ ] - Wear a mask if experiencing symptoms
- [ ] 
- [ ] If you need to reschedule or cancel, please contact us at least 24 hours in advance.
- [ ] 
- [ ] Thank you for choosing UPACI Health.
- [ ]   `.trim();
- [ ] }
- [ ] export const sendAppointmentConfirmation = async (appointmentId: number, retryCount = 0): Promise<void> => {
- [ ]   try {
- [ ]     // 1. Fetch appointment data
- [ ]     const appointment = await fetchAppointmentEmailData(appointmentId);
- [ ]     if (!appointment.patient_email) throw new Error('Patient email not found');
- [ ]     // 2. Generate PDF attachment
- [ ]     const pdfBuffer = await generateAppointmentPDFBuffer(appointmentId);
- [ ]     // 3. Prepare template data
- [ ]     const templateData = {
- [ ]       patientName: appointment.patient_name,
- [ ]       appointmentDate: format(new Date(appointment.appointment_date), 'MMMM d, yyyy'),
- [ ]       appointmentTime: format(parseISO(appointment.start_time), 'h:mm a') + ' - ' + format(parseISO(appointment.end_time), 'h:mm a'),
- [ ]       providerName: appointment.provider_name,
- [ ]       departmentName: appointment.department_name,
- [ ]       location: appointment.location || 'Building A, Floor 2',
- [ ]       appointmentId: appointment.id,
- [ ]       portalUrl: process.env.PORTAL_URL || 'https://upaci.health'
- [ ]     };
- [ ]     // 4. Render email
- [ ]     const htmlContent = renderEmailTemplate(templateData);
- [ ]     const textContent = generatePlainTextEmail(templateData);
- [ ]     // 5. Send email
- [ ]     const mailOptions = {
- [ ]       from: `${emailConfig.fromName} <${emailConfig.from}>`,
- [ ]       to: appointment.patient_email,
- [ ]       subject: 'Your Appointment Confirmation - UPACI Health',
- [ ]       html: htmlContent,
- [ ]       text: textContent,
- [ ]       attachments: [{
- [ ]         filename: `appointment-${appointmentId}-confirmation.pdf`,
- [ ]         content: pdfBuffer,
- [ ]         contentType: 'application/pdf'
- [ ]       }]
- [ ]     };
- [ ]     await transporter.sendMail(mailOptions);
- [ ]     // 6. Log success
- [ ]     await auditLogger.logSecurityEvent(appointment.patient_id, 'EMAIL_SENT', { appointmentId, email: appointment.patient_email, type: 'appointment_confirmation' }, { ip: '0.0.0.0', userAgent: 'email-service' });
- [ ]   } catch (error) {
- [ ]     // Retry logic
- [ ]     if (retryCount < emailConfig.retries) {
- [ ]       const delay = emailConfig.retryDelay * Math.pow(2, retryCount); // Exponential backoff
- [ ]       console.log(`Email send failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${emailConfig.retries})`);
- [ ]       await new Promise(resolve => setTimeout(resolve, delay));
- [ ]       return sendAppointmentConfirmation(appointmentId, retryCount + 1);
- [ ]     }
- [ ]     // All retries failed, log error
- [ ]     await auditLogger.logSecurityEvent(null, 'EMAIL_FAILED', { appointmentId, error: error.message }, {ip: '0.0.0.0', userAgent: 'email-service' });
- [ ]     throw new Error(`Failed to send appointment confirmation email after ${emailConfig.retries} attempts: ${error.message}`);
- [ ]   }
- [ ] }
- [ ] export const testEmailConnection = async (): Promise<boolean> => {
- [ ]   try {
- [ ]     await transporter.verify();
- [ ]     return true;
- [ ]   } catch (err) {
- [ ]     console.error('Email connection test failed:', err);
- [ ]     return false;
- [ ]   }
- [ ] }

### Update Appointment Controller (server/src/controllers/appointmentController.ts)
- [ ] Import sendAppointmentConfirmation from emailService
- [ ] In createAppointment method, after successful appointment creation:
- [ ] try {
- [ ]   await sendAppointmentConfirmation(newAppointment.id);
- [ ] } catch (emailError) {
- [ ]   // Log error but don't fail the booking
- [ ]   console.error('Failed to send confirmation email:', emailError);
- [ ]   // Optionally: Queue for retry later
- [ ] }
- [ ] Return appointment with note if email failed: { ...appointment, emailSent: true/false }

### Optional: Email Queue (server/src/utils/emailQueue.ts)
- [ ] Import Bull
- [ ] export const emailQueue = new Bull('email-queue', { redis: { host: 'localhost', port: 6379 } })
- [ ] emailQueue.process(async (job) => {
- [ ]   const { appointmentId } = job.data;
- [ ]   await sendAppointmentConfirmation(appointmentId);
- [ ] })
- [ ] export const queueAppointmentEmail = async (appointmentId: number): Promise<void> => {
- [ ]   await emailQueue.add({ appointmentId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
- [ ] }

### Unit Tests (server/tests/unit/emailService.test.ts)
- [ ] Import emailService, mock nodemailer transporter
- [ ] Mock fetchAppointmentEmailData to return test data
- [ ] Mock generateAppointmentPDFBuffer to return Buffer
- [ ] Test: "sendAppointmentConfirmation sends email with PDF attachment"
- [ ] Test: "email includes correct recipient and subject"
- [ ] Test: "HTML and plain text versions included"
- [ ] Test: "retries on SMTP failure (3 attempts)"
- [ ] Test: "throws error after all retries exhausted"
- [ ] Test: "logs success to audit_logs"
- [ ] Test: "logs failure to audit_logs"
- [ ] Test: "testEmailConnection returns true for valid config"

### Validation and Testing
- [ ] Configure email credentials in environment
- [ ] Test email connection: testEmailConnection() → returns true
- [ ] Create test appointment with valid patient email
- [ ] Run: sendAppointmentConfirmation(appointmentId)
- [ ] Check inbox: Email received
- [ ] Verify email content: Subject, body, appointment details
- [ ] Verify attachment: PDF attached, opens correctly
- [ ] Test retry logic: Mock SMTP failure → retries 3 times
- [ ] Test invalid email: Use invalid address → error logged
- [ ] Check audit_logs: EMAIL_SENT and EMAIL_FAILED events logged
- [ ] Run unit tests: npm test -- emailService.test.ts → all pass
- [ ] Test with real appointment booking: Book appointment → email sent automatically
