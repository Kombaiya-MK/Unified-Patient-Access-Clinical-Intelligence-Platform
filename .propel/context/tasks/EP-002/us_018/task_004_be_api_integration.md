# Task - TASK_004: Backend API Integration for PDF Confirmation

## Requirement Reference
- User Story: [us_018]
- Story Location: [.propel/context/tasks/us_018/us_018.md]
- Acceptance Criteria:
    - AC1: When patient books or reschedules appointment, system automatically generates PDF confirmation and sends via email
    - AC2: System returns secure download URL valid for 7 days in API response
    - AC3: API endpoint allows manual regeneration of PDF from appointment history
- Edge Case:
    - EC1: What happens when PDF generation fails (library error, memory issue)? Log error, retry once, if still failing send text-only email with appointment details and display "PDF generation failed, you'll receive details via email"
    - EC2: How to handle email sending failures? Retry once with exponential backoff, log failure to database for manual review

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
Create API endpoints and orchestration logic to integrate PDF generation, storage, and email services. Implement POST /api/appointments/:id/generate-pdf endpoint for manual PDF regeneration and automatic PDF generation trigger after booking/rescheduling. Add GET /api/pdfs/download endpoint for secure PDF downloads. Include comprehensive error handling with retry logic and fallback to text-only email when PDF generation fails.

## Dependent Tasks
- TASK_001: Backend PDF Generation Service
- TASK_002: Backend PDF Storage Service
- TASK_003: Backend Email Service
- US-013: Booking creates appointment (integration point for auto-generation)
- US-014: Rescheduling triggers new PDF

## Impacted Components
- **NEW** server/src/controllers/pdfController.ts - Controller for PDF generation and download endpoints
- **NEW** server/src/routes/pdfRoutes.ts - Express routes for PDF operations
- **NEW** server/src/middleware/validatePDFRequest.ts - Request validation middleware
- **MODIFY** server/src/services/appointmentService.ts - Add afterBooking() hook to trigger PDF generation (if exists)
- **MODIFY** server/src/routes/index.ts - Register PDF routes
- **MODIFY** server/src/app.ts - Add PDF routes to Express app

## Implementation Plan
1. **Create PDF Controller**: Create pdfController.ts with generatePDF() and downloadPDF() handler functions
2. **Implement generatePDF() Handler**: 
   - Extract appointment_id from route params
   - Query database for appointment + patient data (join Appointments, Patients, Providers tables)
   - Call pdfService.generateAppointmentConfirmationPDF() with appointment data
   - Call storageService.savePDF() to store PDF buffer
   - Call storageService.generateSecureDownloadURL() to create signed URL
   - Call emailService.sendAppointmentConfirmationWithPDF() to send email with attachment
   - Log success to audit log with PDF metadata
   - Return JSON response: { success: true, downloadUrl, message }
3. **Implement Error Handling with Retry**:
   - Wrap PDF generation in try-catch, retry once on failure
   - If PDF generation fails after retry, call emailService.sendAppointmentConfirmationTextOnly() for fallback
   - Return JSON response: { success: false, message: "PDF generation failed, details sent via email" }
4. **Implement downloadPDF() Handler**:
   - Extract token from query params
   - Call storageService.validateDownloadToken() to verify JWT and get file_path
   - Check if file exists on filesystem
   - Stream PDF file to response with Content-Type: application/pdf and Content-Disposition: attachment
   - Log download attempt to audit log
5. **Create PDF Routes**: Create pdfRoutes.ts with POST /api/appointments/:id/generate-pdf and GET /api/pdfs/download routes
6. **Create Validation Middleware**: Create validatePDFRequest.ts to validate appointment_id exists and user has permission to generate PDF
7. **Integrate with Booking Flow**: Add hook to appointmentService.createAppointment() to automatically call generatePDF() after booking success
8. **Add Audit Logging**: Log all PDF generation attempts, downloads, and failures with metadata (appointment_id, user_id, timestamp, status)

**Focus on how to implement**: Use Express middleware pattern for validation and error handling. Orchestrate service calls in controller (do not duplicate business logic). Use async/await with try-catch for error handling. Return consistent JSON response format. Stream PDF download to avoid memory issues. Log all operations to audit table for compliance.

## Current Project State
```
server/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── (pdfController.ts to be created)
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── index.ts (to be modified)
│   │   └── (pdfRoutes.ts to be created)
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   └── (validatePDFRequest.ts to be created)
│   ├── services/
│   │   ├── authService.ts
│   │   ├── pdfService.ts (TASK_001)
│   │   ├── storageService.ts (TASK_002)
│   │   └── emailService.ts (TASK_003)
│   └── app.ts (to be modified)
└── package.json
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/controllers/pdfController.ts | Controller with generatePDF() and downloadPDF() handlers |
| CREATE | server/src/routes/pdfRoutes.ts | Express routes: POST /api/appointments/:id/generate-pdf, GET /api/pdfs/download |
| CREATE | server/src/middleware/validatePDFRequest.ts | Validation middleware to check appointment_id exists and user permissions |
| MODIFY | server/src/routes/index.ts | Import and register pdfRoutes with router |
| MODIFY | server/src/app.ts | Add PDF routes to Express app middleware stack |
| MODIFY | server/src/services/appointmentService.ts | Add afterBooking() hook to automatically trigger PDF generation (if this service exists) |

## External References
- **Express Error Handling**: https://expressjs.com/en/guide/error-handling.html - Best practices for async error handling
- **Express Router**: https://expressjs.com/en/guide/routing.html - Router and middleware patterns
- **Express File Download**: https://expressjs.com/en/api.html#res.download - Sending file downloads
- **Node.js Streams**: https://nodejs.org/api/stream.html#stream - Streaming large files efficiently
- **REST API Design**: https://restfulapi.net/ - REST API best practices for error responses
- **Express Validation**: https://express-validator.github.io/docs/ - Request validation patterns
- **Express Async Errors**: https://www.npmjs.com/package/express-async-errors - Handling async errors automatically

## Build Commands
- Install dependencies: `npm install` (in server directory)
- Build TypeScript: `npm run build` (compiles src/ to dist/)
- Run tests: `npm test` (execute unit and integration tests)
- Run API tests: `npm run test:api` (test PDF endpoints with Postman/Jest)
- Run in development: `npm run dev` (start server with nodemon)
- Test endpoint manually: `curl -X POST http://localhost:3000/api/appointments/123/generate-pdf -H "Authorization: Bearer <token>"`

## Implementation Validation Strategy
- [x] Unit tests pass for pdfController (generatePDF, downloadPDF handlers)
- [x] Integration tests pass: Full workflow (generate PDF → save → email → download)
- [x] API endpoint validation: POST /api/appointments/:id/generate-pdf returns 200 with downloadUrl
- [x] Download validation: GET /api/pdfs/download?token=<jwt> returns PDF file
- [x] Error handling validation: Test with invalid appointment_id, expired token, non-existent file
- [x] Retry logic validation: Simulate PDF generation failure, verify retry once then fallback to text-only email
- [x] Permission validation: Test with unauthorized user, verify 403 Forbidden response
- [x] Audit logging validation: Verify all operations logged to audit table

## Implementation Checklist
- [ ] Create pdfController.ts with generatePDF() handler (query appointment + patient data, call pdfService, storageService, emailService, return downloadUrl on success)
- [ ] Implement error handling with retry logic in generatePDF() (try-catch, retry once on failure, fallback to text-only email, return appropriate error response)
- [ ] Create downloadPDF() handler (validate token, check file exists, stream PDF with Content-Type application/pdf)
- [ ] Create pdfRoutes.ts with POST /api/appointments/:id/generate-pdf and GET /api/pdfs/download routes with authentication middleware
- [ ] Create validatePDFRequest.ts middleware (validate appointment_id exists in database, check user has permission to access appointment)
- [ ] Modify routes/index.ts to import and register pdfRoutes
- [ ] Modify app.ts to add PDF routes to Express middleware stack
- [ ] Add audit logging for all PDF operations (generation attempts, downloads, failures) with metadata (appointment_id, user_id, timestamp, status, error_message)
