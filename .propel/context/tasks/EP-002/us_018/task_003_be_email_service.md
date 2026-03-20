# Task - TASK_003: Backend Email Service with PDF Attachment

## Requirement Reference
- User Story: [us_018]
- Story Location: [.propel/context/tasks/us_018/us_018.md]
- Acceptance Criteria:
    - AC1: System sends appointment confirmation email with PDF attached after booking/rescheduling
    - AC2: Email includes appointment details (date, time, provider, location) in text format as body
    - AC3: PDF is attached to email with filename `confirmation_[appointment_id]_[timestamp].pdf`
- Edge Case:
    - EC1: What happens when PDF generation fails? Send text-only email with appointment details and display "PDF generation failed, you'll receive details via email"
    - EC2: What if email sending fails? Log error, retry once, if still failing queue for manual review

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
| Library | nodemailer | 6.x |

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
Create an email service that sends appointment confirmation emails with PDF attachments using nodemailer. The service will support both PDF-attached confirmations and text-only fallback emails when PDF generation fails. It will use SMTP configuration from environment variables and include retry logic with exponential backoff for transient failures.

## Dependent Tasks
- TASK_001: Backend PDF Generation Service (provides PDF buffer for email attachment)
- TASK_002: Backend PDF Storage Service (provides PDF file path for attachment)
- US-007: Appointments table with patient email addresses
- US-013: Booking creates appointment records

## Impacted Components
- **NEW** server/src/services/emailService.ts - Email service module with SMTP transport
- **NEW** server/src/types/email.types.ts - TypeScript interfaces for email operations
- **NEW** server/src/templates/email/appointmentConfirmation.html - HTML email template
- **NEW** server/src/templates/email/appointmentConfirmation.text.ts - Plain text email template
- **MODIFY** server/src/config/env.ts - Add SMTP configuration (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM)
- **NEW** database/migrations/V009__create_email_log_table.sql - Database migration for email audit log

## Implementation Plan
1. **Install nodemailer**: Install nodemailer@6.x and @types/nodemailer dependencies
2. **Create SMTP Configuration**: Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM to env.ts and .env.example
3. **Create Database Migration**: Create V009__create_email_log_table.sql with columns: id, appointment_id (FK), recipient_email, subject, sent_at, status (sent/failed), retry_count, error_message, has_attachment
4. **Create Email Types**: Define TypeScript interfaces for EmailOptions, EmailAttachment, EmailResult, EmailStatus
5. **Create HTML Email Template**: Design appointmentConfirmation.html with clinic branding, appointment details table, download link for PDF, footer with clinic contact
6. **Create Text Email Template**: Create appointmentConfirmation.text.ts for plain text fallback with same information
7. **Implement sendEmail() Function**: Create nodemailer transport, compose email with HTML/text alternatives, attach PDF if provided, send email, log to database
8. **Implement sendAppointmentConfirmationWithPDF() Function**: Wrapper function that accepts appointment data and PDF buffer, generates email from template, calls sendEmail() with attachment
9. **Implement sendAppointmentConfirmationTextOnly() Function**: Fallback function for when PDF generation fails, sends text-only email with appointment details
10. **Implement Retry Logic**: Add exponential backoff retry (max 2 retries with 5s, 10s delays) for transient SMTP errors (connection refused, timeout)
11. **Add Error Handling**: Handle SMTP auth errors, invalid email addresses, attachment size limits with detailed logging

**Focus on how to implement**: Use nodemailer with SMTP transport (supports Gmail, SendGrid, Mailgun free tiers). Store SMTP credentials in environment variables. Use HTML template with inline CSS for email client compatibility. Attach PDF as Buffer with proper MIME type (application/pdf). Log all email attempts to database for audit and debugging. Implement retry with exponential backoff using async/await with setTimeout.

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── pdfService.ts (TASK_001)
│   │   ├── storageService.ts (TASK_002)
│   │   └── (emailService.ts to be created)
│   ├── types/
│   │   ├── pdf.types.ts (TASK_001)
│   │   ├── storage.types.ts (TASK_002)
│   │   └── (email.types.ts to be created)
│   ├── templates/
│   │   ├── appointmentConfirmation.template.ts (TASK_001 - PDF template)
│   │   └── email/
│   │       ├── (appointmentConfirmation.html to be created)
│   │       └── (appointmentConfirmation.text.ts to be created)
│   ├── config/
│   │   └── env.ts (to be modified with SMTP config)
│   └── app.ts
└── package.json
database/
├── migrations/
│   ├── V008__create_pdf_metadata_table.sql (TASK_002)
│   └── (V009__create_email_log_table.sql to be created)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/emailService.ts | Email service with sendEmail(), sendAppointmentConfirmationWithPDF(), sendAppointmentConfirmationTextOnly() functions |
| CREATE | server/src/types/email.types.ts | TypeScript interfaces: EmailOptions, EmailAttachment, EmailResult, EmailStatus, EmailLogEntry |
| CREATE | server/src/templates/email/appointmentConfirmation.html | HTML email template with clinic branding, appointment details table, PDF download link, footer |
| CREATE | server/src/templates/email/appointmentConfirmation.text.ts | Plain text email template function for text-only fallback |
| MODIFY | server/src/config/env.ts | Add SMTP configuration: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM with fallback defaults |
| CREATE | database/migrations/V009__create_email_log_table.sql | Migration to create email_log table with columns: id, appointment_id, recipient_email, subject, sent_at, status, retry_count, error_message, has_attachment |
| MODIFY | server/package.json | Add dependencies: nodemailer@6.x, @types/nodemailer@6.x |
| CREATE | server/.env.example | Add example SMTP configuration variables for developers |

## External References
- **nodemailer Documentation**: https://nodemailer.com/about/ - Official documentation for nodemailer
- **nodemailer SMTP Setup**: https://nodemailer.com/smtp/ - SMTP transport configuration
- **nodemailer Attachments**: https://nodemailer.com/message/attachments/ - How to attach files to emails
- **Email HTML Best Practices**: https://www.campaignmonitor.com/css/ - CSS support in email clients
- **Email Retry Strategies**: https://www.mailgun.com/blog/email/transactional-email-best-practices/ - Best practices for email delivery
- **SMTP Free Providers**: https://sendgrid.com/pricing/ (SendGrid free tier: 100 emails/day), https://www.mailgun.com/pricing/ (Mailgun free tier: 5000 emails/month)
- **Email Deliverability**: https://aws.amazon.com/blogs/messaging-and-targeting/email-deliverability-tips/ - Tips for avoiding spam folders

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Run database migration: `npm run migrate` or `./database/scripts/run_migrations.ps1`
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run tests: `npm test` (execute unit tests for email service)
- Test email sending: `npm run test:email` (send test email to configured address)
- Run in development: `npm run dev` (start server with nodemailer debug logging enabled)

## Implementation Validation Strategy
- [x] Unit tests pass for email service (all functions)
- [x] Integration tests pass: send test email with PDF attachment, verify email received
- [x] Database migration runs successfully without errors
- [x] Email template rendering validation: verify HTML and text templates render correctly with sample data
- [x] Attachment validation: send email with PDF, verify PDF opens correctly
- [x] Retry logic validation: simulate SMTP failure, verify retry attempts with exponential backoff
- [x] Text-only fallback validation: send email without PDF attachment, verify text-only email format
- [x] Error handling validation: test with invalid SMTP credentials, invalid recipient email, verify error logging

## Implementation Checklist
- [ ] Create V009__create_email_log_table.sql migration with email_log table (id, appointment_id FK, recipient_email, subject, sent_at, status, retry_count, error_message, has_attachment, created_at)
- [ ] Run database migration to create email_log table
- [ ] Install nodemailer@6.x and @types/nodemailer dependencies
- [ ] Create email.types.ts with EmailOptions, EmailAttachment, EmailResult, EmailStatus, EmailLogEntry interfaces
- [ ] Add SMTP configuration to env.ts (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM) and .env.example
- [ ] Create appointmentConfirmation.html HTML email template with inline CSS, appointment details table, PDF download link
- [ ] Create appointmentConfirmation.text.ts plain text email template function
- [ ] Create emailService.ts with sendEmail() base function (create SMTP transport, send email, log to database, return EmailResult)
