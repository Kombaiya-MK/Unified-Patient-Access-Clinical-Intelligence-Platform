# Task - TASK_001_BE_PDF_CONFIRMATION_GENERATION

## Requirement Reference
- User Story: US_018
- Story Location: `.propel/context/tasks/us_018/us_018.md`
- Acceptance Criteria:
    - AC1: PDF generated with clinic letterhead, patient details, appointment info, QR code, preparation instructions, HIPAA footer; saved with filename confirmation_[id]_[timestamp].pdf, secure download URL valid 7 days
- Edge Cases:
    - PDF generation fails: Log error, retry once, send text-only email if still failing
    - Long-term storage: Delete PDFs >30 days old, patient can regenerate from history
    - Missing insurance info: Mark as "Not provided - bring insurance card"

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No (Backend PDF generation) |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | PDF Document |
| **Wireframe Path/URL** | N/A (PDF template spec, not wireframe) |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **PDF Template Spec:**
> - Header: Clinic logo (top-left), clinic name/address/phone (top-right)
> - Title: "Appointment Confirmation" centered, 24pt bold
> - Appointment table: Date, Time, Provider, Location, Type, Duration
> - QR Code: Bottom-right, 2x2 inches, encodes appointment lookup URL
> - Preparation section: Bullet list if applicable
> - Footer: Cancellation policy, HIPAA notice, page number

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | pdfkit | 0.14.x |
| Backend | qrcode | 1.5.x |
| Database | PostgreSQL | 16.x |
| Storage | Local filesystem | N/A |
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
Implement PDF confirmation generator using pdfkit: (1) Create PdfService.generateConfirmation(appointmentId) with professional medical template, (2) Include clinic letterhead, patient name/MRN, appointment details table, provider info, location/directions, QR code (appointment URL), preparation instructions, insurance section, cancellation policy, HIPAA footer, (3) Save to server/storage/pdfs/ with filename confirmation_[id]_[timestamp].pdf, (4) Generate secure download URL with 7-day expiry token, (5) Integrate with booking/reschedule APIs (auto-generate after appointment creation), (6) Auto-delete PDFs >30 days old (cron job), (7) Regenerate on-demand from appointment history.

## Dependent Tasks
- US_013 Task 002: Booking API (trigger PDF generation)
- US_014 Task 002: Reschedule API (regenerate PDF)

## Impacted Components
**New:**
- server/src/services/pdf.service.ts (PDF generation logic)
- server/src/templates/confirmation-template.ts (PDF layout and styling)
- server/src/routes/pdf.routes.ts (GET /pdfs/:token for secure download)
- server/src/utils/qr-generator.ts (QR code generation for appointment lookup)
- server/storage/pdfs/ (PDF file storage directory)
- server/src/jobs/pdf-cleanup.ts (Cron job: delete PDFs >30 days old)

## Implementation Plan
1. Install pdfkit + qrcode: npm install pdfkit qrcode
2. Create PdfService.generateConfirmation: Accepts appointmentId, fetches data (appointment + patient + provider), generates PDF using pdfkit
3. PDF layout: Header (logo + clinic info), title, appointment details table, QR code, preparation section, footer
4. QR code: Encode appointment lookup URL (https://upaci.com/appointments/{id}/verify), 200x200px
5. Save PDF: Write to server/storage/pdfs/confirmation_{id}_{timestamp}.pdf
6. Generate secure URL: Create JWT token with exp=7 days, return /api/pdfs/{token}
7. Download endpoint: GET /api/pdfs/:token verifies token, streams PDF file
8. Integrate with booking: After appointment created, call pdfService.generateConfirmation(), return PDF URL in response
9. Auto-cleanup: Cron job runs daily, deletes PDFs with mtime >30 days
10. Email attachment: Use Nodemailer to attach PDF to confirmation email

## Current Project State
```
ASSIGNMENT/server/src/
├── services/appointments.service.ts (booking logic exists)
└── (pdf service to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/pdf.service.ts | PDF generation using pdfkit |
| CREATE | server/src/templates/confirmation-template.ts | PDF layout/styling |
| CREATE | server/src/routes/pdf.routes.ts | Secure PDF download endpoint |
| CREATE | server/src/utils/qr-generator.ts | QR code generation |
| CREATE | server/storage/pdfs/.gitkeep | PDF storage directory |
| CREATE | server/src/jobs/pdf-cleanup.ts | Daily cron to delete old PDFs |
| UPDATE | server/package.json | Add pdfkit, qrcode |
| UPDATE | server/src/services/appointments.service.ts | Call pdfService after booking |

## External References
- [pdfkit Documentation](https://pdfkit.org/)
- [QR Code Generation](https://www.npmjs.com/package/qrcode)
- [TR-016 PDF Generation](../../../.propel/context/docs/spec.md#TR-016)
- [UC-004 Send Appointment Details as PDF](../../../.propel/context/docs/spec.md#UC-004)

## Build Commands
```bash
cd server
npm install pdfkit qrcode @types/pdfkit
npm run dev

# Generate test PDF
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer <token>" \
  -d '{"slotId":"xxx"}' \
  # Returns pdfUrl in response

# Download PDF
curl http://localhost:3001/api/pdfs/<token> -o confirmation.pdf
```

## Implementation Validation Strategy
- [ ] Unit tests: pdfService.generateConfirmation creates PDF file
- [ ] Integration tests: Book appointment → PDF generated + URL returned
- [ ] pdfkit installed: package.json shows pdfkit@0.14.x
- [ ] PDF generated: Book appointment → verify confirmation_{id}_{timestamp}.pdf exists in storage/pdfs/
- [ ] PDF content correct: Open PDF → verify clinic logo, patient name, appointment details, QR code present
- [ ] QR code works: Scan QR code → decodes to appointment lookup URL
- [ ] Secure download URL: GET /api/pdfs/{token} returns PDF file
- [ ] Token expiry: Wait 7 days → URL returns 410 Gone "Download link expired"
- [ ] Email attachment: Booking confirmation email includes PDF as attachment
- [ ] Regeneration: Dashboard "Download PDF" → regenerates from appointment data
- [ ] Auto-cleanup: Create test PDF with old mtime → cron job deletes after 30 days
- [ ] Error handling: Simulate pdfkit error → retry once → if fails, text-only email sent

## Implementation Checklist
- [ ] Install dependencies: `npm install pdfkit qrcode @types/pdfkit`
- [ ] Create server/storage/pdfs/ directory with .gitkeep
- [ ] Create qr-generator.ts utility
- [ ] Implement pdf.service.ts with generateConfirmation method
- [ ] Create confirmation-template.ts with pdfkit layout
- [ ] Implement pdf.routes.ts with secure download endpoint
- [ ] Integrate with appointments.service.ts (call after booking)
- [ ] Create pdf-cleanup.ts cron job (daily)
- [ ] Test PDF generation + download
- [ ] Document PDF generation in server/README.md
