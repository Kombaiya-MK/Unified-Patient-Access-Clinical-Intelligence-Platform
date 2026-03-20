/**
 * Appointment Confirmation PDF Template
 * 
 * Template class for generating appointment confirmation PDFs using PDFKit.
 * Renders a professional, branded PDF with all appointment details, QR code,
 * and compliance information.
 * 
 * Layout: A4 portrait (595.28 x 841.89 points)
 * Margins: 50pt top/bottom, 50pt left/right
 * 
 * @module appointmentConfirmation.template
 * @created 2026-03-20
 * @task US_018 TASK_001
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { AppointmentConfirmationPDFData } from '../types/pdf.types';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

/**
 * PDF layout constants
 */
const LAYOUT = {
  pageWidth: 595.28, // A4 width in points
  pageHeight: 841.89, // A4 height in points
  marginLeft: 50,
  marginRight: 50,
  marginTop: 50,
  marginBottom: 50,
  contentWidth: 495.28, // pageWidth - marginLeft - marginRight
  
  // Section spacing
  sectionSpacing: 20,
  lineSpacing: 8,
  paragraphSpacing: 12,
  
  // Font sizes
  fontSizeTitle: 24,
  fontSizeHeader: 16,
  fontSizeSubheader: 14,
  fontSizeBody: 11,
  fontSizeSmall: 9,
  
  // Colors
  primaryColor: '#2563eb', // Blue
  secondaryColor: '#64748b', // Slate gray
  textColor: '#1e293b', // Dark slate
  lightGray: '#f1f5f9',
  borderColor: '#cbd5e1',
};

/**
 * Appointment Confirmation PDF Template Class
 */
export class AppointmentConfirmationTemplate {
  private doc: PDFKit.PDFDocument;
  private data: AppointmentConfirmationPDFData;
  private currentY: number;
  
  constructor(data: AppointmentConfirmationPDFData) {
    this.data = data;
    this.currentY = LAYOUT.marginTop;
    
    // Initialize PDF document
    this.doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: LAYOUT.marginTop,
        bottom: LAYOUT.marginBottom,
        left: LAYOUT.marginLeft,
        right: LAYOUT.marginRight,
      },
      info: {
        Title: `Appointment Confirmation - ${data.patient.name}`,
        Author: data.clinic.name,
        Subject: 'Medical Appointment Confirmation',
        Keywords: 'appointment, confirmation, healthcare',
        CreationDate: new Date(),
      },
    });
  }
  
  /**
   * Generate the complete PDF and return as Buffer
   * @returns Promise<Buffer> PDF content as buffer
   */
  async generate(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const buffers: Buffer[] = [];
        
        // Collect PDF data into buffers
        this.doc.on('data', (chunk: Buffer) => {
          buffers.push(chunk);
        });
        
        this.doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        
        this.doc.on('error', (err) => {
          logger.error('PDF generation error:', err);
          reject(err);
        });
        
        // Render all sections
        this.renderHeader();
        this.renderPatientInfo();
        this.renderAppointmentDetails();
        this.renderQRCode();
        this.renderPreparationInstructions();
        this.renderInsuranceInfo();
        this.renderFooter();
        
        // Finalize the PDF
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Render clinic header with logo and letterhead
   */
  private renderHeader(): void {
    const { clinic } = this.data;
    
    // Try to add logo if available
    if (clinic.logoPath && fs.existsSync(clinic.logoPath)) {
      try {
        this.doc.image(clinic.logoPath, LAYOUT.marginLeft, this.currentY, {
          width: 150,
          height: 60,
        });
        this.currentY += 70;
      } catch (error) {
        logger.warn('Failed to load clinic logo:', error);
        // Continue without logo
      }
    }
    
    // Clinic name and contact info
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeHeader)
      .fillColor(LAYOUT.primaryColor)
      .text(clinic.name, LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeHeader + LAYOUT.lineSpacing;
    
    this.doc
      .font('Helvetica')
      .fontSize(LAYOUT.fontSizeSmall)
      .fillColor(LAYOUT.secondaryColor)
      .text(clinic.address, LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeSmall + 4;
    
    this.doc
      .text(`Phone: ${clinic.phone}  |  Email: ${clinic.email}`, LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeSmall + LAYOUT.sectionSpacing + 10;
    
    // Horizontal line
    this.doc
      .moveTo(LAYOUT.marginLeft, this.currentY)
      .lineTo(LAYOUT.pageWidth - LAYOUT.marginRight, this.currentY)
      .strokeColor(LAYOUT.borderColor)
      .stroke();
    
    this.currentY += LAYOUT.sectionSpacing;
    
    // Document title
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeTitle)
      .fillColor(LAYOUT.textColor)
      .text('Appointment Confirmation', LAYOUT.marginLeft, this.currentY, {
        align: 'center',
        width: LAYOUT.contentWidth,
      });
    
    this.currentY += LAYOUT.fontSizeTitle + LAYOUT.sectionSpacing;
  }
  
  /**
   * Render patient information section
   */
  private renderPatientInfo(): void {
    const { patient } = this.data;
    
    // Section header
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeSubheader)
      .fillColor(LAYOUT.primaryColor)
      .text('Patient Information', LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeSubheader + LAYOUT.lineSpacing;
    
    // Patient details
    this.doc
      .font('Helvetica')
      .fontSize(LAYOUT.fontSizeBody)
      .fillColor(LAYOUT.textColor);
    
    this.renderLabelValue('Name:', patient.name);
    this.renderLabelValue('Medical Record Number (MRN):', patient.mrn);
    
    if (patient.email) {
      this.renderLabelValue('Email:', patient.email);
    }
    
    if (patient.phone) {
      this.renderLabelValue('Phone:', patient.phone);
    }
    
    this.currentY += LAYOUT.sectionSpacing;
  }
  
  /**
   * Render appointment details section
   */
  private renderAppointmentDetails(): void {
    const { appointment } = this.data;
    
    // Section header
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeSubheader)
      .fillColor(LAYOUT.primaryColor)
      .text('Appointment Details', LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeSubheader + LAYOUT.lineSpacing;
    
    // Highlight box for date/time
    const boxY = this.currentY;
    const boxHeight = 60;
    
    this.doc
      .rect(LAYOUT.marginLeft, boxY, LAYOUT.contentWidth, boxHeight)
      .fillAndStroke(LAYOUT.lightGray, LAYOUT.borderColor);
    
    // Date and time (large, bold)
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeHeader)
      .fillColor(LAYOUT.textColor)
      .text(appointment.appointmentDate, LAYOUT.marginLeft + 10, boxY + 10, {
        width: LAYOUT.contentWidth - 20,
      });
    
    this.doc
      .fontSize(LAYOUT.fontSizeSubheader)
      .text(appointment.appointmentTime, LAYOUT.marginLeft + 10, boxY + 35, {
        width: LAYOUT.contentWidth - 20,
      });
    
    this.currentY = boxY + boxHeight + LAYOUT.lineSpacing;
    
    // Other appointment details
    this.doc
      .font('Helvetica')
      .fontSize(LAYOUT.fontSizeBody)
      .fillColor(LAYOUT.textColor);
    
    this.renderLabelValue('Appointment ID:', appointment.appointmentId);
    this.renderLabelValue('Type:', appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1));
    this.renderLabelValue('Duration:', `${appointment.duration} minutes`);
    this.renderLabelValue('Provider:', `${appointment.providerName}${appointment.providerCredentials ? ', ' + appointment.providerCredentials : ''}`);
    this.renderLabelValue('Department:', appointment.departmentName);
    this.renderLabelValue('Location:', appointment.location);
    this.renderLabelValue('Address:', appointment.address);
    
    this.currentY += LAYOUT.sectionSpacing;
  }
  
  /**
   * Render QR code for quick appointment lookup
   */
  private async renderQRCode(): Promise<void> {
    const { appointment, options } = this.data;
    
    if (options?.includeQRCode === false) {
      return;
    }
    
    try {
      const qrCodeSize = options?.qrCodeSize || 150;
      const errorCorrection = options?.qrCodeErrorCorrection || 'M';
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(appointment.appointmentUrl, {
        errorCorrectionLevel: errorCorrection,
        type: 'image/png',
        width: qrCodeSize,
        margin: 1,
      });
      
      // Section header
      this.doc
        .font('Helvetica-Bold')
        .fontSize(LAYOUT.fontSizeSubheader)
        .fillColor(LAYOUT.primaryColor)
        .text('Quick Access', LAYOUT.marginLeft, this.currentY);
      
      this.currentY += LAYOUT.fontSizeSubheader + LAYOUT.lineSpacing;
      
      // QR code description
      this.doc
        .font('Helvetica')
        .fontSize(LAYOUT.fontSizeBody)
        .fillColor(LAYOUT.textColor)
        .text('Scan this QR code with your mobile device to quickly access your appointment details:', 
          LAYOUT.marginLeft, this.currentY, {
            width: LAYOUT.contentWidth,
          });
      
      this.currentY += LAYOUT.fontSizeBody + LAYOUT.lineSpacing + 5;
      
      // Add QR code image
      this.doc.image(qrCodeDataUrl, LAYOUT.marginLeft, this.currentY, {
        width: qrCodeSize,
        height: qrCodeSize,
      });
      
      this.currentY += qrCodeSize + LAYOUT.sectionSpacing;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      // Continue without QR code
    }
  }
  
  /**
   * Render preparation instructions section
   */
  private renderPreparationInstructions(): void {
    const { appointment } = this.data;
    
    if (!appointment.preparationInstructions || appointment.preparationInstructions.length === 0) {
      return;
    }
    
    // Section header
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeSubheader)
      .fillColor(LAYOUT.primaryColor)
      .text('Preparation Instructions', LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeSubheader + LAYOUT.lineSpacing;
    
    this.doc
      .font('Helvetica')
      .fontSize(LAYOUT.fontSizeBody)
      .fillColor(LAYOUT.textColor)
      .text('Please follow these instructions before your appointment:', LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeBody + LAYOUT.lineSpacing;
    
    // Bullet list
    appointment.preparationInstructions.forEach((instruction) => {
      this.doc
        .circle(LAYOUT.marginLeft + 5, this.currentY + 5, 2)
        .fill(LAYOUT.textColor);
      
      this.doc
        .font('Helvetica')
        .fontSize(LAYOUT.fontSizeBody)
        .fillColor(LAYOUT.textColor)
        .text(instruction, LAYOUT.marginLeft + 15, this.currentY, {
          width: LAYOUT.contentWidth - 15,
        });
      
      this.currentY += LAYOUT.fontSizeBody + LAYOUT.lineSpacing;
    });
    
    this.currentY += LAYOUT.sectionSpacing;
  }
  
  /**
   * Render insurance information section
   */
  private renderInsuranceInfo(): void {
    const { patient } = this.data;
    
    // Section header
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeSubheader)
      .fillColor(LAYOUT.primaryColor)
      .text('Insurance Information', LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeSubheader + LAYOUT.lineSpacing;
    
    if (!patient.insuranceProvider) {
      // No insurance info provided
      this.doc
        .font('Helvetica-Oblique')
        .fontSize(LAYOUT.fontSizeBody)
        .fillColor(LAYOUT.secondaryColor)
        .text('Not provided - please bring insurance card to appointment', LAYOUT.marginLeft, this.currentY);
      
      this.currentY += LAYOUT.fontSizeBody + LAYOUT.sectionSpacing;
    } else {
      // Insurance details
      this.doc
        .font('Helvetica')
        .fontSize(LAYOUT.fontSizeBody)
        .fillColor(LAYOUT.textColor);
      
      this.renderLabelValue('Provider:', patient.insuranceProvider);
      
      if (patient.insurancePolicyNumber) {
        this.renderLabelValue('Policy Number:', patient.insurancePolicyNumber);
      }
      
      if (patient.insuranceGroupNumber) {
        this.renderLabelValue('Group Number:', patient.insuranceGroupNumber);
      }
      
      this.currentY += LAYOUT.sectionSpacing;
    }
  }
  
  /**
   * Render footer with cancellation policy and compliance notice
   */
  private renderFooter(): void {
    const { clinic } = this.data;
    
    // Ensure footer is at bottom of page
    const footerY = LAYOUT.pageHeight - LAYOUT.marginBottom - 100;
    if (this.currentY < footerY) {
      this.currentY = footerY;
    }
    
    // Horizontal line
    this.doc
      .moveTo(LAYOUT.marginLeft, this.currentY)
      .lineTo(LAYOUT.pageWidth - LAYOUT.marginRight, this.currentY)
      .strokeColor(LAYOUT.borderColor)
      .stroke();
    
    this.currentY += 10;
    
    // Cancellation policy
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeSmall)
      .fillColor(LAYOUT.textColor)
      .text('Cancellation Policy:', LAYOUT.marginLeft, this.currentY);
    
    this.currentY += LAYOUT.fontSizeSmall + 4;
    
    this.doc
      .font('Helvetica')
      .fontSize(LAYOUT.fontSizeSmall)
      .fillColor(LAYOUT.textColor)
      .text(clinic.cancellationPolicy, LAYOUT.marginLeft, this.currentY, {
        width: LAYOUT.contentWidth,
      });
    
    this.currentY += LAYOUT.fontSizeSmall + LAYOUT.lineSpacing + 4;
    
    // Contact information
    this.doc
      .font('Helvetica')
      .fontSize(LAYOUT.fontSizeSmall)
      .fillColor(LAYOUT.secondaryColor)
      .text(`For questions or to reschedule, please contact us at ${clinic.phone} or ${clinic.email}`, 
        LAYOUT.marginLeft, this.currentY, {
          width: LAYOUT.contentWidth,
        });
    
    this.currentY += LAYOUT.fontSizeSmall + LAYOUT.lineSpacing + 8;
    
    // HIPAA compliance notice
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeSmall)
      .fillColor('#ef4444') // Red color for importance
      .text('Protected Health Information - Handle Securely per HIPAA', 
        LAYOUT.marginLeft, this.currentY, {
          align: 'center',
          width: LAYOUT.contentWidth,
        });
  }
  
  /**
   * Helper method to render label-value pairs
   * @param label Label text
   * @param value Value text
   */
  private renderLabelValue(label: string, value: string): void {
    this.doc
      .font('Helvetica-Bold')
      .fontSize(LAYOUT.fontSizeBody)
      .fillColor(LAYOUT.secondaryColor)
      .text(label, LAYOUT.marginLeft, this.currentY, {
        continued: true,
        width: 180,
      })
      .font('Helvetica')
      .fillColor(LAYOUT.textColor)
      .text(' ' + value, {
        width: LAYOUT.contentWidth - 180,
      });
    
    this.currentY += LAYOUT.fontSizeBody + LAYOUT.lineSpacing;
  }
}
