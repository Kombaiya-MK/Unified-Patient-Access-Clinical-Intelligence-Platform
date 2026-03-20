# Task - TASK_003_BE_PDF_GENERATION_SERVICE

## Requirement Reference
- User Story: US_013  
- Story Location: `.propel/context/tasks/us_013/us_013.md`
- Acceptance Criteria:
    - AC4: PDF confirmation includes appointment date/time, provider name, department, location, patient name, appointment ID, and QR code

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

> **Note**: Backend PDF generation service - no UI

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | Puppeteer | 21.x |
| Backend | qrcode | 1.x |
| Backend | Handlebars | 4.x |
| Database | PostgreSQL | 15+ |

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

> **Note**: PDF generation only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend service only

## Task Overview
Implement PDF generation service for appointment confirmations using Puppeteer (headless Chrome) to render HTML template to PDF. Create Handlebars template with appointment details: date/time, provider name, department, location, patient name, appointment ID. Generate QR code containing appointment reference URL using qrcode library. Include clinic branding (logo, colors). Implement generateAppointmentPDF(appointmentId) service method. Store PDFs temporarily in filesystem or cloud storage (S3). Ensure PDF is accessible, print-friendly, and includes all required information.Return PDF buffer or file path for email attachment.

## Dependent Tasks
- US_013 TASK_002: Appointment booking API must create appointment

## Impacted Components
**Modified:**
- None

**New:**
- server/src/services/pdfService.ts (Core PDF generation service)
- server/src/templates/appointment-confirmation.hbs (Handlebars template for PDF)
- server/src/utils/qrcodeGenerator.ts (QR code generation utility)
- server/src/config/pdf.config.ts (PDF configuration: margins, format, branding)
- server/tests/unit/pdfService.test.ts (Unit tests for PDF generation)
- server/public/templates/styles.css (CSS for PDF styling)

## Implementation Plan
1. **PDF Service**: Create pdfService with generateAppointmentPDF(appointmentId) method
2. **Fetch Data**: Query appointment with patient, provider, department details
3. **QR Code**: Generate QR code with URL: https://upaci.health/appointments/{appointmentId}
4. **Template**: Render Handlebars template with appointment data and QR code (base64)
5. **Puppeteer**: Launch headless browser, load rendered HTML, generate PDF
6. **Branding**: Include clinic logo, primary colors, footer with contact info
7. **Layout**: A4 format, portrait, margins (20mm), clear typography
8. **Content**: Appointment ID (barcode), date/time, patient name, provider name, department, location, instructions
9. **Storage**: Save PDF to /tmp or upload to S3, return path/buffer
10. **Error Handling**: Handle Puppeteer failures, template errors, missing data
11. **Performance**: Cache Puppeteer instance (don't launch/close for each PDF)
12. **Testing**: Unit tests with mock data, verify PDF content

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend API
│   ├── src/
│   │   ├── services/
│   │   │   ├── auditLogger.ts (US_011)
│   │   │   └── authService.ts (US_009)
│   │   └── routes/
│   │       └── appointments.routes.ts (US_013 TASK_002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/pdfService.ts | PDF generation with Puppeteer and Handlebars |
| CREATE | server/src/templates/appointment-confirmation.hbs | HTML template for appointment PDF |
| CREATE | server/src/utils/qrcodeGenerator.ts | Generate QR code as base64 data URL |
| CREATE | server/src/config/pdf.config.ts | PDF settings: format, margins, fonts |
| CREATE | server/public/templates/styles.css | Inline CSS for PDF styling |
| CREATE | server/tests/unit/pdfService.test.ts | Unit tests for PDF generation |

> 0 modified files, 6 new files created

## External References
- [Puppeteer Documentation](https://pptr.dev/)
- [Handlebars Templating](https://handlebarsjs.com/)
- [qrcode npm package](https://www.npmjs.com/package/qrcode)
- [PDF Best Practices](https://developer.mozilla.org/en-US/docs/Web/CSS/Paged_Media)
- [Puppeteer PDF Options](https://pptr.dev/api/puppeteer.pdfoptions)

## Build Commands
```bash
# Install dependencies
cd server
npm install puppeteer qrcode handlebars

# Test PDF generation
# Create test appointment in database
psql -U upaci_user -d upaci -c "
INSERT INTO appointments (patient_id, provider_id, department_id, appointment_date, start_time, end_time, status)
VALUES (1, 1, 1, '2026-04-15', '10:00:00', '10:30:00', 'scheduled')
RETURNING id;
"
# Get appointment ID (e.g., 123)

# Generate PDF via service
node -e "
const { generateAppointmentPDF } = require('./dist/services/pdfService');
generateAppointmentPDF(123).then(pdfPath => console.log('PDF generated:', pdfPath));
"

# Verify PDF created
ls -lh /tmp/appointment-*.pdf

# Open PDF to verify content
# Check: Appointment ID, date/time, patient name, provider, department, QR code

# Test QR code scanning
# Scan QR code with phone → Should open https://upaci.health/appointments/123

# Run unit tests
npm test -- pdfService.test.ts
```

## Implementation Validation Strategy
- [ ] pdfService.generateAppointmentPDF() method created
- [ ] Fetches appointment with patient, provider, department data
- [ ] QR code generated with appointment URL
- [ ] Handlebars template renders with all data
- [ ] Puppeteer generates PDF from HTML
- [ ] PDF includes: Appointment ID, date/time, patient name, provider, department, location
- [ ] PDF includes: QR code (scannable)
- [ ] PDF includes: Clinic logo, branding colors
- [ ] PDF format: A4, portrait, 20mm margins
- [ ] PDF typography: Clear, readable fonts (Arial/Helvetica)
- [ ] PDF saved to /tmp or uploaded to S3
- [ ] Service returns PDF path or buffer
- [ ] Error handling: Missing data, Puppeteer failures
- [ ] Performance: Puppeteer instance cached
- [ ] Unit tests pass with mock data

## Implementation Checklist

### PDF Configuration (server/src/config/pdf.config.ts)
- [ ] export const pdfConfig = {
- [ ]   format: 'A4' as const,
- [ ]   margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
- [ ]   printBackground: true,
- [ ]   preferCSSPageSize: false,
- [ ]   displayHeaderFooter: true,
- [ ]   headerTemplate: '<div></div>',
- [ ]   footerTemplate: '<div style="font-size:10px; text-align:center; width:100%;">UPACI Health - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
- [ ]   branding: {
- [ ]     logo: '/public/images/logo.png',
- [ ]     primaryColor: '#006CB8',
- [ ]     secondaryColor: '#004A80',
- [ ]     clinicName: 'UPACI Health Platform',
- [ ]     address: '123 Medical Center Dr, Healthcare City, HC 12345',
- [ ]     phone: '(555) 123-4567',
- [ ]     email: 'appointments@upaci.health'
- [ ]   }
- [ ] }

### QR Code Generator (server/src/utils/qrcodeGenerator.ts)
- [ ] Import QRCode
- [ ] export const generateQRCode = async (data: string): Promise<string> => {
- [ ]   try {
- [ ]     const qrCodeDataURL = await QRCode.toDataURL(data, { width: 200, margin: 2, errorCorrectionLevel: 'H' });
- [ ]     return qrCodeDataURL; // Returns base64 data URL
- [ ]   } catch (err) {
- [ ]     throw new Error('QR code generation failed: ' + err.message);
- [ ]   }
- [ ] }

### Handlebars Template (server/src/templates/appointment-confirmation.hbs)
- [ ] <!DOCTYPE html>
- [ ] <html><head><meta charset="UTF-8"><title>Appointment Confirmation</title><style>{{> styles}}</style></head>
- [ ] <body>
- [ ]   <div class="header"><img src="{{logo}}" alt="{{clinicName}}" class="logo"><h1>Appointment Confirmation</h1></div>
- [ ]   <div class="content">
- [ ]     <div class="appointment-id"><strong>Appointment ID:</strong> {{appointmentId}}</div>
- [ ]     <div class="qr-code"><img src="{{qrCode}}" alt="QR Code"></div>
- [ ]     <h2>Appointment Details</h2>
- [ ]     <table class="details">
- [ ]       <tr><td><strong>Patient:</strong></td><td>{{patientName}}</td></tr>
- [ ]       <tr><td><strong>Date:</strong></td><td>{{appointmentDate}}</td></tr>
- [ ]       <tr><td><strong>Time:</strong></td><td>{{appointmentTime}}</td></tr>
- [ ]       <tr><td><strong>Provider:</strong></td><td>{{providerName}}</td></tr>
- [ ]       <tr><td><strong>Department:</strong></td><td>{{departmentName}}</td></tr>
- [ ]       <tr><td><strong>Location:</strong></td><td>{{location}}</td></tr>
- [ ]     </table>
- [ ]     <div class="instructions"><h3>Important Instructions</h3><ul><li>Please arrive 15 minutes early</li><li>Bring valid ID and insurance card</li><li>Wear a mask if experiencing symptoms</li></ul></div>
- [ ]   </div>
- [ ]   <div class="footer"><p>{{clinicName}}</p><p>{{address}}</p><p>Phone: {{phone}} | Email: {{email}}</p></div>
- [ ] </body></html>

### Template Styles (server/src/templates/styles.css or inline)
- [ ] body { font-family: Arial, Helvetica, sans-serif; padding: 0; margin: 0; color: #333; }
- [ ] .header { text-align: center; padding: 20px; border-bottom: 3px solid {{primaryColor}}; }
- [ ] .logo { max-width: 150px; margin-bottom: 10px; }
- [ ] h1 { color: {{primaryColor}}; font-size: 24px; margin: 0; }
- [ ] .content { padding: 20px; }
- [ ] .appointment-id { font-size: 18px; background: #F0F0F0; padding: 10px; margin-bottom: 20px; text-align: center; }
- [ ] .qr-code { text-align: center; margin: 20px 0; }
- [ ] .qr-code img { width: 150px; height: 150px; }
- [ ] .details { width: 100%; border-collapse: collapse; margin: 20px 0; }
- [ ] .details td { padding: 10px; border-bottom: 1px solid #DDD; }
- [ ] .instructions { background: #FFF9E5; padding: 15px; margin: 20px 0; border-left: 4px solid #FFC107; }
- [ ] .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #DDD; margin-top: 40px; }

### PDF Service (server/src/services/pdfService.ts)
- [ ] Import puppeteer, handlebars, fs, path, generateQRCode, pdfConfig
- [ ] Import pg Client for database queries
- [ ] Let browser: puppeteer.Browser | null = null; // Cached browser instance
- [ ] const initBrowser = async (): Promise<puppeteer.Browser> => {
- [ ]   if (!browser) {
- [ ]     browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
- [ ]   }
- [ ]   return browser;
- [ ] }
- [ ] const fetchAppointmentData = async (appointmentId: number): Promise<any> => {
- [ ]   const client = new Client(/* db config */);
- [ ]   await client.connect();
- [ ]   const query = `
- [ ]     SELECT 
- [ ]       a.id, a.appointment_date, a.start_time, a.end_time,
- [ ]       p.first_name || ' ' || p.last_name as patient_name,
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
- [ ] export const generateAppointmentPDF = async (appointmentId: number): Promise<string> => {
- [ ]   try {
- [ ]     // 1. Fetch appointment data
- [ ]     const appointment = await fetchAppointmentData(appointmentId);
- [ ]     // 2. Generate QR code
- [ ]     const qrCodeUrl = `https://upaci.health/appointments/${appointmentId}`;
- [ ]     const qrCode = await generateQRCode(qrCodeUrl);
- [ ]     // 3. Prepare template data
- [ ]     const templateData = {
- [ ]       logo: pdfConfig.branding.logo,
- [ ]       clinicName: pdfConfig.branding.clinicName,
- [ ]       address: pdfConfig.branding.address,
- [ ]       phone: pdfConfig.branding.phone,
- [ ]       email: pdfConfig.branding.email,
- [ ]       primaryColor: pdfConfig.branding.primaryColor,
- [ ]       appointmentId: appointment.id,
- [ ]       patientName: appointment.patient_name,
- [ ]       appointmentDate: format(new Date(appointment.appointment_date), 'MMMM d, yyyy'),
- [ ]       appointmentTime: format(parseISO(appointment.start_time), 'h:mm a') + ' - ' + format(parseISO(appointment.end_time), 'h:mm a'),
- [ ]       providerName: appointment.provider_name,
- [ ]       departmentName: appointment.department_name,
- [ ]       location: appointment.location || 'Building A, Floor 2',
- [ ]       qrCode: qrCode
- [ ]     };
- [ ]     // 4. Render Handlebars template
- [ ]     const templatePath = path.join(__dirname, '../templates/appointment-confirmation.hbs');
- [ ]     const templateSource = fs.readFileSync(templatePath, 'utf-8');
- [ ]     const template = handlebars.compile(templateSource);
- [ ]     const html = template(templateData);
- [ ]     // 5. Generate PDF with Puppeteer
- [ ]     const browserInstance = await initBrowser();
- [ ]     const page = await browserInstance.newPage();
- [ ]     await page.setContent(html, { waitUntil: 'networkidle0' });
- [ ]     const pdfPath = path.join('/tmp', `appointment-${appointmentId}-${Date.now()}.pdf`);
- [ ]     await page.pdf({ path: pdfPath, format: pdfConfig.format, margin: pdfConfig.margin, printBackground: pdfConfig.printBackground, displayHeaderFooter: pdfConfig.displayHeaderFooter, footerTemplate: pdfConfig.footerTemplate });
- [ ]     await page.close();
- [ ]     // 6. Return PDF path
- [ ]     return pdfPath;
- [ ]   } catch (error) {
- [ ]     throw new Error(`PDF generation failed: ${error.message}`);
- [ ]   }
- [ ] }
- [ ] export const closeBrowser = async (): Promise<void> => {
- [ ]   if (browser) {
- [ ]     await browser.close();
- [ ]     browser = null;
- [ ]   }
- [ ] }
- [ ] // Export as buffer for email attachment
- [ ] export const generateAppointmentPDFBuffer = async (appointmentId: number): Promise<Buffer> => {
- [ ]   const pdfPath = await generateAppointmentPDF(appointmentId);
- [ ]   const buffer = fs.readFileSync(pdfPath);
- [ ]   fs.unlinkSync(pdfPath); // Cleanup
- [ ]   return buffer;
- [ ] }

### Unit Tests (server/tests/unit/pdfService.test.ts)
- [ ] Import pdfService, mock database
- [ ] Mock fetchAppointmentData to return test appointment
- [ ] Test: "generateAppointmentPDF creates PDF file"
- [ ] Test: "PDF includes appointment ID"
- [ ] Test: "PDF includes QR code"
- [ ] Test: "generateAppointmentPDFBuffer returns Buffer"
- [ ] Test: "throws error for non-existent appointment"
- [ ] Test: "handles Puppeteer launch failure"

### Validation and Testing
- [ ] Install dependencies: npm install puppeteer qrcode handlebars
- [ ] Create test appointment in database
- [ ] Run: generateAppointmentPDF(appointmentId)
- [ ] Verify PDF file created in /tmp
- [ ] Open PDF: Check all fields present (ID, date, patient, provider, department, QR code)
- [ ] Scan QR code: Opens correct URL
- [ ] Verify branding: Logo, colors match config
- [ ] Check layout: A4, portrait, proper margins
- [ ] Run unit tests: npm test -- pdfService.test.ts → all pass
- [ ] Test with missing data: Appointment not found → throws error
- [ ] Test Puppeteer failure: Simulate crash → handles gracefully
