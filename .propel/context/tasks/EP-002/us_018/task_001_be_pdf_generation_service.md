# Task - TASK_001: Backend PDF Generation Service

## Requirement Reference
- User Story: [us_018]
- Story Location: [.propel/context/tasks/us_018/us_018.md]
- Acceptance Criteria:
    - AC1: PDF includes clinic letterhead/logo at the top
    - AC2: PDF includes patient name and MRN
    - AC3: PDF includes appointment date and time in large bold font
    - AC4: PDF includes provider name and credentials, department and location with address
    - AC5: PDF includes appointment ID and QR code (encoding appointment URL for quick lookup)
    - AC6: PDF includes appointment duration, appointment type (consultation/follow-up/procedure)
    - AC7: PDF includes preparation instructions (fasting requirements, documents to bring)
    - AC8: PDF includes insurance information section
    - AC9: PDF includes clinic contact phone/email, cancellation policy, and compliance footer ("Protected Health Information - Handle Securely per HIPAA")
- Edge Case:
    - EC1: What happens when PDF generation fails (library error, memory issue)? Retry once, log error, return error to caller for fallback handling
    - EC2: What if patient doesn't have insurance information? Mark insurance section as "Not provided - please bring insurance card to appointment"

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
| Library | pdfkit | 0.15.x |
| Library | qrcode | 1.5.x |

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
Create a PDF generation service that produces beautifully formatted appointment confirmation PDFs with clinic branding, patient information, appointment details, QR code for quick lookup, and compliance footer. The service will be a reusable module that generates PDF buffers from appointment and patient data.

## Dependent Tasks
- US-007: Appointments table must exist with required fields (appointment_id, patient_id, provider_id, appointment_date, appointment_time, duration, type, department, location, preparation_instructions)
- US-013: Booking creates appointment records in database

## Impacted Components
- **NEW** server/src/services/pdfService.ts - PDF generation service module
- **NEW** server/src/types/pdf.types.ts - TypeScript interfaces for PDF generation
- **NEW** server/src/templates/appointmentConfirmation.template.ts - PDF template structure
- **NEW** server/public/assets/clinic-logo.png - Clinic logo for letterhead (placeholder)

## Implementation Plan
1. **Install PDF Libraries**: Install pdfkit (0.15.x) and qrcode (1.5.x) packages via npm
2. **Create Type Definitions**: Define TypeScript interfaces for appointment data, patient data, and PDF options
3. **Create PDF Template Structure**: Design the document layout with sections (header, patient info, appointment details, QR code, instructions, footer)
4. **Implement Logo/Letterhead**: Add clinic logo at the top using PDFKit image embedding (placeholder logo for now)
5. **Implement Patient Section**: Render patient name and MRN with clear labels
6. **Implement Appointment Section**: Render appointment details in table format with bold date/time
7. **Implement QR Code**: Generate QR code from appointment lookup URL using qrcode library, embed as image
8. **Implement Preparation Instructions**: Render bullet list of instructions if provided
9. **Implement Insurance Section**: Render insurance info or fallback text "Not provided - please bring insurance card to appointment"
10. **Implement Footer**: Add cancellation policy, clinic contact, and HIPAA compliance notice
11. **Add Error Handling**: Wrap PDF generation in try-catch with detailed error logging
12. **Create PDF Buffer Return**: Return PDF as Buffer for downstream storage/email attachment

**Focus on how to implement**: Use PDFKit's document stream API to build PDF in memory. Structure code with separate helper functions for each section (header, body, footer). Use consistent typography and spacing. Validate all input data before rendering. Log PDF generation metrics (time, size).

## Current Project State
```
server/
├── src/
│   ├── services/
│   │   ├── authService.ts
│   │   └── (pdfService.ts to be created)
│   ├── types/
│   │   ├── auth.types.ts
│   │   └── (pdf.types.ts to be created)
│   ├── templates/
│   │   └── (appointmentConfirmation.template.ts to be created)
│   ├── utils/
│   │   ├── auditLogger.ts
│   │   └── tokenGenerator.ts
│   ├── config/
│   │   └── env.ts
│   └── app.ts
├── public/
│   └── assets/
│       └── (clinic-logo.png to be added)
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/pdfService.ts | Core PDF generation service with generateAppointmentConfirmationPDF() function |
| CREATE | server/src/types/pdf.types.ts | TypeScript interfaces: AppointmentPDFData, PatientPDFData, PDFGenerationOptions, PDFGenerationResult |
| CREATE | server/src/templates/appointmentConfirmation.template.ts | PDF template class with section rendering methods (renderHeader, renderPatientInfo, renderAppointmentDetails, renderQRCode, renderFooter) |
| CREATE | server/public/assets/clinic-logo.png | Placeholder clinic logo image (200x80px) for letterhead |
| MODIFY | server/package.json | Add dependencies: pdfkit@0.15.x, @types/pdfkit@0.15.x, qrcode@1.5.x, @types/qrcode@1.5.x |

## External References
- **pdfkit Documentation**: https://pdfkit.org/ - Official documentation for PDFKit library
- **pdfkit GitHub**: https://github.com/foliojs/pdfkit - Source code and examples
- **qrcode npm**: https://www.npmjs.com/package/qrcode - QR code generation library for Node.js
- **QR Code Best Practices**: https://www.qr-code-generator.com/qr-code-marketing/qr-codes-basics/ - QR code size and error correction guidelines (recommended: 2x2 inches, error correction level M)
- **HIPAA PDF Guidelines**: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/protected-health-information/index.html - PHI handling requirements for documents
- **PDF Accessibility Standards**: https://www.pdfa.org/pdf-accessibility-overview/ - PDF/UA for accessible document generation

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run tests: `npm test` (execute unit tests for PDF service)
- Run in development: `npm run dev` (start server with nodemon)

## Implementation Validation Strategy
- [x] Unit tests pass for PDF generation service
- [x] Integration tests pass: generate PDF from sample appointment data
- [x] PDF output validation: manually open generated PDF, verify all sections present
- [x] QR code validation: scan QR code with mobile device, verify encoded URL
- [x] Error handling validation: test with missing fields, verify graceful error messages
- [x] Memory leak check: generate 100 PDFs in sequence, monitor memory usage (no leaks)
- [x] Performance benchmark: PDF generation completes in <5 seconds for typical appointment

## Implementation Checklist
- [ ] Install pdfkit@0.15.x and @types/pdfkit dependencies
- [ ] Install qrcode@1.5.x and @types/qrcode dependencies
- [ ] Create pdf.types.ts with AppointmentPDFData, PatientPDFData, PDFGenerationOptions, PDFGenerationResult interfaces
- [ ] Create appointmentConfirmation.template.ts with section rendering methods (header with logo, patient info, appointment details in table format, QR code, preparation instructions, insurance section, footer with policy/HIPAA notice)
- [ ] Create pdfService.ts with generateAppointmentConfirmationPDF() function that orchestrates template rendering and returns PDF Buffer
- [ ] Add placeholder clinic logo (clinic-logo.png) to server/public/assets/
- [ ] Implement error handling with try-catch and detailed error logging (log generation time, input data summary)
- [ ] Write unit tests for pdfService.generateAppointmentConfirmationPDF() with sample data covering all fields and edge cases (missing insurance, empty instructions)
