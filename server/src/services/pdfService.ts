/**
 * PDF Generation Service
 * 
 * Service for generating appointment confirmation PDFs with:
 * - Appointment details (patient, provider, date/time, location)
 * - QR codes for mobile access
 * - Clinic branding
 * - Professional layout (A4, portrait)
 * 
 * Uses Puppeteer (headless Chrome) for high-quality PDF rendering
 * from HTML templates. Browser instance is cached for performance.
 * 
 * @module pdfService
 * @created 2026-03-18
 * @task US_013 TASK_003
 */

import puppeteer, { Browser } from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { pdfConfig } from '../config/pdf.config';
import { generateAppointmentQRCode } from '../utils/qrcodeGenerator';
import logger from '../utils/logger';

/**
 * Appointment data for PDF generation
 */
interface AppointmentData {
  id: string; // UUID
  appointment_date: Date;
  start_time: string;
  end_time: string;
  patient_name: string;
  provider_name: string;
  department_name: string;
  location: string;
}

/**
 * PDF template data structure
 */
interface PDFTemplateData {
  logo: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  primaryColor: string;
  appointmentId: string; // UUID
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  providerName: string;
  departmentName: string;
  location: string;
  qrCode: string;
}

/**
 * Cached browser instance for performance
 * Reusing the same browser across PDF generations significantly improves performance
 */
let browser: Browser | null = null;

/**
 * Initialize or retrieve cached Puppeteer browser instance
 * @returns Puppeteer browser instance
 */
const initBrowser = async (): Promise<Browser> => {
  if (!browser) {
    logger.info('Launching Puppeteer browser instance');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
    logger.info('Puppeteer browser launched successfully');
  }
  return browser;
};

/**
 * Fetch appointment data with related patient, provider, and department information
 * @param appointmentId - The appointment ID (UUID string)
 * @returns Appointment data for PDF generation
 * @throws Error if appointment not found or database error
 */
const fetchAppointmentData = async (appointmentId: string): Promise<AppointmentData> => {
  const query = `
    SELECT 
      a.id,
      a.appointment_date,
      ts.start_time,
      ts.end_time,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      CONCAT(pr.first_name, ' ', pr.last_name) as provider_name,
      d.name as department_name,
      COALESCE(d.location, 'Building A, Floor 2') as location
    FROM appointments a
    JOIN users p ON a.patient_id = p.id
    JOIN time_slots ts ON a.slot_id = ts.id
    JOIN users pr ON ts.provider_id = pr.id
    JOIN departments d ON ts.department_id = d.id
    WHERE a.id = $1 AND a.status != 'cancelled'
  `;

  try {
    const result = await pool.query(query, [appointmentId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Appointment ${appointmentId} not found or has been cancelled`);
    }

    return result.rows[0] as AppointmentData;
  } catch (error) {
    logger.error('Error fetching appointment data:', error);
    throw error;
  }
};

/**
 * Format date for display (e.g., "March 20, 2026")
 * @param date - Date to format
 * @returns Formatted date string
 */
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format time for display (e.g., "2:30 PM")
 * @param timeString - Time string in HH:MM:SS format
 * @returns Formatted time string
 */
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Prepare template data from appointment data
 * @param appointment - Raw appointment data from database
 * @param qrCode - Base64 encoded QR code
 * @returns Template data ready for Handlebars
 */
const prepareTemplateData = (
  appointment: AppointmentData,
  qrCode: string
): PDFTemplateData => {
  return {
    ...pdfConfig.branding,
    appointmentId: appointment.id,
    patientName: appointment.patient_name,
    appointmentDate: formatDate(new Date(appointment.appointment_date)),
    appointmentTime: `${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`,
    providerName: appointment.provider_name,
    departmentName: appointment.department_name,
    location: appointment.location,
    qrCode,
  };
};

/**
 * Compile and render Handlebars template
 * @param templateData - Data to populate in template
 * @returns Rendered HTML string
 */
const renderTemplate = (templateData: PDFTemplateData): string => {
  const templatePath = path.join(__dirname, '../templates/appointment-confirmation.hbs');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebars.compile(templateSource);
  return template(templateData);
};

/**
 * Generate appointment confirmation PDF
 * 
 * @param appointmentId - The appointment ID (UUID string) to generate PDF for
 * @returns Path to generated PDF file
 * @throws Error if appointment not found, browser fails, or PDF generation fails
 * 
 * @example
 * const pdfPath = await generateAppointmentPDF('123e4567-e89b-12d3-a456-426614174000');
 * console.log('PDF generated:', pdfPath);
 */
export const generateAppointmentPDF = async (appointmentId: string): Promise<string> => {
  logger.info(`Generating PDF for appointment ${appointmentId}`);

  try {
    // 1. Fetch appointment data from database
    const appointment = await fetchAppointmentData(appointmentId);
    logger.debug('Appointment data fetched:', { appointmentId, patientName: appointment.patient_name });

    // 2. Generate QR code
    const qrCode = await generateAppointmentQRCode(appointmentId);
    logger.debug('QR code generated');

    // 3. Prepare template data
    const templateData = prepareTemplateData(appointment, qrCode);

    // 4. Render Handlebars template
    const html = renderTemplate(templateData);
    logger.debug('Template rendered');

    // 5. Generate PDF with Puppeteer
    const browserInstance = await initBrowser();
    const page = await browserInstance.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1123 }); // A4 at 96 DPI

    // Load HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfPath = path.join('/tmp', `appointment-${appointmentId}-${Date.now()}.pdf`);
    
    // Ensure /tmp directory exists (Windows compatibility)
    const tmpDir = path.dirname(pdfPath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    await page.pdf({
      path: pdfPath,
      format: pdfConfig.format,
      margin: pdfConfig.margin,
      printBackground: pdfConfig.printBackground,
      displayHeaderFooter: pdfConfig.displayHeaderFooter,
      footerTemplate: pdfConfig.footerTemplate,
      preferCSSPageSize: pdfConfig.preferCSSPageSize,
    });

    await page.close();
    logger.info(`PDF generated successfully: ${pdfPath}`);

    return pdfPath;
  } catch (error) {
    logger.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${(error as Error).message}`);
  }
};

/**
 * Generate appointment confirmation PDF as Buffer
 * Useful for email attachments or API responses
 * 
 * @param appointmentId - The appointment ID (UUID string) to generate PDF for
 * @returns PDF as Buffer
 * @throws Error if appointment not found or PDF generation fails
 * 
 * @example
 * const pdfBuffer = await generateAppointmentPDFBuffer('123e4567-e89b-12d3-a456-426614174000');
 * // Send as email attachment or return in API response
 */
export const generateAppointmentPDFBuffer = async (appointmentId: string): Promise<Buffer> => {
  const pdfPath = await generateAppointmentPDF(appointmentId);
  
  try {
    const buffer = fs.readFileSync(pdfPath);
    // Cleanup temporary file
    fs.unlinkSync(pdfPath);
    logger.debug(`Temporary PDF file deleted: ${pdfPath}`);
    return buffer;
  } catch (error) {
    logger.error('Error reading/deleting PDF file:', error);
    throw error;
  }
};

/**
 * Close the cached Puppeteer browser instance
 * Should be called during graceful shutdown
 * 
 * @example
 * // In server shutdown handler
 * await closeBrowser();
 */
export const closeBrowser = async (): Promise<void> => {
  if (browser) {
    logger.info('Closing Puppeteer browser instance');
    await browser.close();
    browser = null;
    logger.info('Puppeteer browser closed');
  }
};

/**
 * Health check for PDF service
 * Verifies that Puppeteer can be initialized
 * 
 * @returns true if service is healthy
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    await initBrowser();
    return true;
  } catch (error) {
    logger.error('PDF service health check failed:', error);
    return false;
  }
};

// ============================================================================
// PDFKit-based PDF Generation (US_018 TASK_001)
// ============================================================================

import { AppointmentConfirmationTemplate } from '../templates/appointmentConfirmation.template';
import type {
  AppointmentConfirmationPDFData,
  PDFGenerationResult,
  PatientPDFData,
  AppointmentPDFData,
  ClinicBrandingData,
  PDFGenerationOptions,
} from '../types/pdf.types';

/**
 * Generate appointment confirmation PDF using PDFKit
 * 
 * Creates a professional, branded PDF with appointment details,
 * QR code, preparation instructions, and compliance information.
 * 
 * @param data Complete appointment confirmation data
 * @returns PDF generation result with buffer
 * 
 * @example
 * const result = await generateAppointmentConfirmationPDFKit({
 *   patient: { name: 'John Doe', mrn: 'MRN12345' },
 *   appointment: { appointmentId: 'abc123', ... },
 *   clinic: { name: 'Clinic Name', ... }
 * });
 * 
 * if (result.success && result.buffer) {
 *   // Use the PDF buffer (save to file, send via email, etc.)
 * }
 */
export const generateAppointmentConfirmationPDFKit = async (
  data: AppointmentConfirmationPDFData
): Promise<PDFGenerationResult> => {
  const startTime = Date.now();
  
  try {
    logger.info('Generating appointment confirmation PDF with PDFKit', {
      appointmentId: data.appointment.appointmentId,
      patientName: data.patient.name,
    });
    
    // Validate required data
    validatePDFData(data);
    
    // Create template instance and generate PDF
    const template = new AppointmentConfirmationTemplate(data);
    const buffer = await template.generate();
    
    const generationTime = Date.now() - startTime;
    
    logger.info('PDF generated successfully', {
      appointmentId: data.appointment.appointmentId,
      sizeBytes: buffer.length,
      generationTimeMs: generationTime,
    });
    
    return {
      success: true,
      buffer,
      sizeBytes: buffer.length,
      generationTimeMs: generationTime,
      pageCount: 1, // Single page for now
    };
  } catch (error) {
    const generationTime = Date.now() - startTime;
    
    logger.error('PDF generation failed', {
      appointmentId: data.appointment.appointmentId,
      error: (error as Error).message,
      generationTimeMs: generationTime,
    });
    
    // Retry once for transient errors
    if (shouldRetryPDFGeneration(error as Error)) {
      logger.info('Retrying PDF generation once');
      
      try {
        const template = new AppointmentConfirmationTemplate(data);
        const buffer = await template.generate();
        const totalGenerationTime = Date.now() - startTime;
        
        logger.info('PDF generated successfully on retry', {
          appointmentId: data.appointment.appointmentId,
          sizeBytes: buffer.length,
          generationTimeMs: totalGenerationTime,
        });
        
        return {
          success: true,
          buffer,
          sizeBytes: buffer.length,
          generationTimeMs: totalGenerationTime,
          pageCount: 1,
        };
      } catch (retryError) {
        logger.error('PDF generation failed on retry', {
          appointmentId: data.appointment.appointmentId,
          error: (retryError as Error).message,
        });
        
        return {
          success: false,
          error: `PDF generation failed: ${(retryError as Error).message}`,
          generationTimeMs: Date.now() - startTime,
        };
      }
    }
    
    return {
      success: false,
      error: `PDF generation failed: ${(error as Error).message}`,
      generationTimeMs: generationTime,
    };
  }
};

/**
 * Generate appointment confirmation PDF from appointment ID
 * 
 * Fetches appointment data from database and generates PDF using PDFKit.
 * This is a convenience function that combines data fetching and PDF generation.
 * 
 * @param appointmentId Appointment UUID
 * @param options Optional PDF generation options
 * @returns PDF generation result with buffer
 * 
 * @example
 * const result = await generateAppointmentPDFFromId('abc123-...', {
 *   includeQRCode: true,
 *   qrCodeSize: 150
 * });
 */
export const generateAppointmentPDFFromId = async (
  appointmentId: string,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> => {
  try {
    logger.info('Fetching appointment data for PDF generation', { appointmentId });
    
    // Fetch appointment data from database
    const query = `
      SELECT 
        a.id AS appointment_id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.duration,
        a.appointment_type,
        a.preparation_instructions,
        p.full_name AS patient_name,
        p.mrn,
        p.email AS patient_email,
        p.phone AS patient_phone,
        p.insurance_provider,
        p.insurance_policy_number,
        p.insurance_group_number,
        pr.full_name AS provider_name,
        pr.credentials AS provider_credentials,
        d.department_name,
        d.location,
        d.address
      FROM appointments a
      JOIN users p ON a.patient_id = p.user_id
      JOIN users pr ON a.provider_id = pr.user_id
      JOIN departments d ON a.department_id = d.department_id
      WHERE a.id = $1
    `;
    
    const result = await pool.query(query, [appointmentId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }
    
    const row = result.rows[0];
    
    // Build PDF data structure
    const pdfData: AppointmentConfirmationPDFData = {
      patient: {
        name: row.patient_name,
        mrn: row.mrn,
        email: row.patient_email,
        phone: row.patient_phone,
        insuranceProvider: row.insurance_provider,
        insurancePolicyNumber: row.insurance_policy_number,
        insuranceGroupNumber: row.insurance_group_number,
      },
      appointment: {
        appointmentId: row.appointment_id,
        appointmentDate: formatAppointmentDate(row.appointment_date),
        appointmentTime: formatAppointmentTime(row.start_time, row.end_time),
        duration: row.duration || 30,
        type: row.appointment_type || 'consultation',
        providerName: row.provider_name,
        providerCredentials: row.provider_credentials,
        departmentName: row.department_name,
        location: row.location,
        address: row.address,
        preparationInstructions: parsePreparationInstructions(row.preparation_instructions),
        appointmentUrl: `${process.env.APP_URL || 'https://clinic.com'}/appointments/${row.appointment_id}`,
      },
      clinic: getClinicBrandingData(),
      options,
    };
    
    // Generate PDF
    return await generateAppointmentConfirmationPDFKit(pdfData);
  } catch (error) {
    logger.error('Failed to generate PDF from appointment ID', {
      appointmentId,
      error: (error as Error).message,
    });
    
    return {
      success: false,
      error: `Failed to generate PDF: ${(error as Error).message}`,
    };
  }
};

/**
 * Validate PDF data before generation
 * @param data PDF data to validate
 * @throws Error if required fields are missing
 */
function validatePDFData(data: AppointmentConfirmationPDFData): void {
  if (!data.patient?.name) {
    throw new Error('Patient name is required');
  }
  
  if (!data.patient?.mrn) {
    throw new Error('Patient MRN is required');
  }
  
  if (!data.appointment?.appointmentId) {
    throw new Error('Appointment ID is required');
  }
  
  if (!data.appointment?.appointmentDate) {
    throw new Error('Appointment date is required');
  }
  
  if (!data.appointment?.appointmentTime) {
    throw new Error('Appointment time is required');
  }
  
  if (!data.clinic?.name) {
    throw new Error('Clinic name is required');
  }
}

/**
 * Determine if PDF generation error should be retried
 * @param error Error object
 * @returns true if error is transient and should be retried
 */
function shouldRetryPDFGeneration(error: Error): boolean {
  const retryableErrors = [
    'ENOMEM', // Out of memory
    'ETIMEDOUT', // Timeout
    'ECONNRESET', // Connection reset
  ];
  
  return retryableErrors.some(code => error.message.includes(code));
}

/**
 * Get clinic branding data from environment/config
 * @returns Clinic branding data
 */
function getClinicBrandingData(): ClinicBrandingData {
  return {
    name: process.env.CLINIC_NAME || 'Clinical Appointment Platform',
    logoPath: process.env.CLINIC_LOGO_PATH || path.join(__dirname, '../../public/assets/clinic-logo.png'),
    address: process.env.CLINIC_ADDRESS || '123 Medical Center Drive, City, State 12345',
    phone: process.env.CLINIC_PHONE || '(555) 123-4567',
    email: process.env.CLINIC_EMAIL || 'appointments@clinic.com',
    website: process.env.CLINIC_WEBSITE || 'https://clinic.com',
    cancellationPolicy: process.env.CLINIC_CANCELLATION_POLICY || 
      'Please provide at least 24 hours notice if you need to cancel or reschedule your appointment. Late cancellations or no-shows may result in a cancellation fee.',
  };
}

/**
 * Format appointment date for PDF display
 * @param date Date object or string
 * @returns Formatted date string (e.g., "Monday, March 20, 2026")
 */
function formatAppointmentDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format appointment time for PDF display
 * @param startTime Start time string (HH:MM:SS)
 * @param endTime End time string (HH:MM:SS)
 * @returns Formatted time range (e.g., "10:30 AM - 11:00 AM")
 */
function formatAppointmentTime(startTime: string, endTime: string): string {
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Parse preparation instructions from database field
 * @param instructions Instructions as string or JSON array
 * @returns Array of instruction strings
 */
function parsePreparationInstructions(instructions: string | null | undefined): string[] | undefined {
  if (!instructions) {
    return undefined;
  }
  
  try {
    // Try parsing as JSON array
    const parsed = JSON.parse(instructions);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not JSON, treat as single instruction
  }
  
  // Split by newlines or semicolons
  return instructions
    .split(/[\n;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}
