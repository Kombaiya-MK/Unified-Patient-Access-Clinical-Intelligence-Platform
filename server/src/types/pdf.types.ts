/**
 * PDF Generation Type Definitions
 * 
 * TypeScript interfaces for PDF generation service
 * Used for appointment confirmation PDFs with clinic branding
 * 
 * @module pdf.types
 * @created 2026-03-20
 * @task US_018 TASK_001
 */

/**
 * Patient information for PDF
 */
export interface PatientPDFData {
  name: string;
  mrn: string; // Medical Record Number
  email?: string;
  phone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
}

/**
 * Appointment information for PDF
 */
export interface AppointmentPDFData {
  appointmentId: string;
  appointmentDate: string; // Formatted date (e.g., "Monday, March 20, 2026")
  appointmentTime: string; // Formatted time (e.g., "10:30 AM - 11:00 AM")
  duration: number; // Duration in minutes
  type: string; // consultation, follow-up, procedure
  providerName: string;
  providerCredentials?: string; // e.g., "MD, FACP"
  departmentName: string;
  location: string;
  address: string;
  preparationInstructions?: string[];
  appointmentUrl: string; // URL for QR code (e.g., "https://clinic.com/appointments/abc123")
}

/**
 * Clinic branding information for PDF
 */
export interface ClinicBrandingData {
  name: string;
  logoPath?: string; // Path to clinic logo image
  address: string;
  phone: string;
  email: string;
  website?: string;
  cancellationPolicy: string;
}

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  /**
   * PDF document title (appears in PDF properties)
   */
  title?: string;
  
  /**
   * PDF author (appears in PDF properties)
   */
  author?: string;
  
  /**
   * Include QR code for quick appointment lookup
   * @default true
   */
  includeQRCode?: boolean;
  
  /**
   * QR code size in pixels
   * @default 150
   */
  qrCodeSize?: number;
  
  /**
   * QR code error correction level
   * L (Low) - 7% of data can be restored
   * M (Medium) - 15% of data can be restored
   * Q (Quartile) - 25% of data can be restored
   * H (High) - 30% of data can be restored
   * @default 'M'
   */
  qrCodeErrorCorrection?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * PDF generation result
 */
export interface PDFGenerationResult {
  /**
   * Indicates if PDF generation was successful
   */
  success: boolean;
  
  /**
   * PDF content as Buffer (if successful)
   */
  buffer?: Buffer;
  
  /**
   * Error message (if failed)
   */
  error?: string;
  
  /**
   * PDF file size in bytes (if successful)
   */
  sizeBytes?: number;
  
  /**
   * Generation time in milliseconds
   */
  generationTimeMs?: number;
  
  /**
   * Number of pages in the PDF
   */
  pageCount?: number;
}

/**
 * Complete PDF data bundle combining all required information
 */
export interface AppointmentConfirmationPDFData {
  patient: PatientPDFData;
  appointment: AppointmentPDFData;
  clinic: ClinicBrandingData;
  options?: PDFGenerationOptions;
}
