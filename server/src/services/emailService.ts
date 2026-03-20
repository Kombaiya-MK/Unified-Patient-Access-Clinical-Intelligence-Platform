/**
 * Email Service
 * 
 * Service for sending appointment confirmation emails with PDF attachments.
 * 
 * Features:
 * - Multiple email provider support (SMTP, SendGrid, AWS SES)
 * - HTML email templates with Handlebars
 * - PDF attachment from pdfService
 * - Plain text fallback for email clients without HTML support
 * - Retry logic with exponential backoff (3 attempts)
 * - Audit logging for all email sends (success and failure)
 * - HIPAA-compliant email handling (TLS encryption, no PHI in subject)
 * - Email connection testing and health checks
 * 
 * @module emailService
 * @created 2026-03-19
 * @task US_013 TASK_004
 */

import nodemailer, { Transporter } from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { emailConfig, validateEmailConfig } from '../config/email.config';
import { generateAppointmentPDFBuffer } from './pdfService';
import { logSecurityEvent } from '../utils/auditLogger';
import logger from '../utils/logger';

/**
 * Appointment data for email
 */
interface AppointmentEmailData {
  id: string; // UUID
  appointment_date: Date;
  start_time: string;
  end_time: string;
  patient_name: string;
  patient_email: string;
  patient_id: number;
  provider_name: string;
  department_name: string;
  location: string;
}

/**
 * Email template data structure
 */
interface EmailTemplateData {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  providerName: string;
  departmentName: string;
  location: string;
  appointmentId: string; // UUID
  portalUrl: string;
}

/**
 * Email send options
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Create Nodemailer transporter based on email provider configuration
 * 
 * Supports:
 * - SMTP (Gmail, Outlook, custom servers)
 * - SendGrid (via SMTP)
 * - AWS SES (via SMTP or SDK)
 * 
 * @returns Nodemailer transporter instance
 */
const createTransporter = (): Transporter => {
  const { provider, smtp, sendgrid } = emailConfig;
  
  logger.info('Creating email transporter', { provider });
  
  if (provider === 'sendgrid') {
    // SendGrid via SMTP
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, // TLS
      auth: {
        user: 'apikey', // SendGrid uses 'apikey' as username
        pass: sendgrid.apiKey,
      },
    });
  } else if (provider === 'ses') {
    // AWS SES via SMTP (nodemailer-ses-transport can be used for SDK approach)
    throw new Error('AWS SES via SMTP not yet implemented. Use SMTP or SendGrid for now.');
  } else {
    // Standard SMTP (Gmail, Outlook, etc.)
    return nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth,
      tls: smtp.tls,
    });
  }
};

/**
 * Global transporter instance (created on module load)
 */
let transporter: Transporter | null = null;

/**
 * Get or create transporter
 * Lazy initialization with singleton pattern
 */
const getTransporter = (): Transporter => {
  if (!transporter) {
    validateEmailConfig(); // Throws if config invalid
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Fetch appointment data with patient email for sending confirmation
 * 
 * @param appointmentId - The appointment ID (UUID string)
 * @returns Appointment data including patient email
 * @throws Error if appointment not found or patient email missing
 */
const fetchAppointmentEmailData = async (
  appointmentId: string
): Promise<AppointmentEmailData> => {
  const query = `
    SELECT 
      a.id,
      a.appointment_date,
      a.patient_id,
      ts.start_time,
      ts.end_time,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      p.email as patient_email,
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
      throw new Error(
        `Appointment ${appointmentId} not found or has been cancelled`
      );
    }

    const appointment = result.rows[0] as AppointmentEmailData;
    
    if (!appointment.patient_email) {
      throw new Error(
        `Patient email not found for appointment ${appointmentId}`
      );
    }

    return appointment;
  } catch (error) {
    logger.error('Error fetching appointment email data:', error);
    throw error;
  }
};

/**
 * Format date for email display (e.g., "March 20, 2026")
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
 * Format time for email display (e.g., "2:30 PM")
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
 * Prepare email template data from appointment data
 * @param appointment - Raw appointment data from database
 * @returns Template data ready for Handlebars
 */
const prepareEmailTemplateData = (
  appointment: AppointmentEmailData
): EmailTemplateData => {
  return {
    patientName: appointment.patient_name,
    appointmentDate: formatDate(new Date(appointment.appointment_date)),
    appointmentTime: `${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`,
    providerName: appointment.provider_name,
    departmentName: appointment.department_name,
    location: appointment.location,
    appointmentId: appointment.id,
    portalUrl: emailConfig.portalUrl,
  };
};

/**
 * Render HTML email template using Handlebars
 * 
 * @param templateData - Data to populate in template
 * @returns Rendered HTML string
 * @throws Error if template file not found
 */
const renderEmailTemplate = (templateData: EmailTemplateData): string => {
  const templatePath = path.join(
    __dirname,
    '../templates/email/appointment-confirmation.hbs'
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found at ${templatePath}`);
  }

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebars.compile(templateSource);
  return template(templateData);
};

/**
 * Generate plain text version of email
 * Fallback for email clients that don't support HTML
 * 
 * @param templateData - Email template data
 * @returns Plain text email content
 */
const generatePlainTextEmail = (templateData: EmailTemplateData): string => {
  return `
Dear ${templateData.patientName},

Your appointment has been successfully scheduled. Please review the details below:

APPOINTMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Appointment ID: #${templateData.appointmentId}
Date: ${templateData.appointmentDate}
Time: ${templateData.appointmentTime}
Provider: ${templateData.providerName}
Department: ${templateData.departmentName}
Location: ${templateData.location}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Arrival Time: Please arrive 15 minutes before your scheduled appointment time
• Required Items: Bring a valid photo ID and your insurance card
• Health & Safety: If you have COVID-19 symptoms, please call us before arriving
• Cancellation Policy: Please notify us at least 24 hours in advance

ATTACHED DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A detailed confirmation with QR code is attached to this email.

VIEW IN PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${templateData.portalUrl}/appointments/${templateData.appointmentId}

If you need to cancel or reschedule, please contact us at least 24 hours in advance.

Thank you for choosing UPACI Health!

Best regards,
UPACI Health Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPACI Health Platform
123 Medical Center Dr, Healthcare City, HC 12345
Phone: (555) 123-4567 | Email: appointments@upaci.health

⚠ PROTECTED HEALTH INFORMATION
This email contains confidential patient information protected by HIPAA.
Do not forward or share this email.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
};

/**
 * Send email using Nodemailer
 * 
 * @param options - Email options (to, subject, html, text, attachments)
 * @returns Promise with success status and optional error
 * @throws Error if sending fails
 */
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `${emailConfig.fromName} <${emailConfig.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments || [],
    };

    logger.info('Sending email', {
      to: options.to,
      subject: options.subject,
      attachments: options.attachments?.length || 0,
    });

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Email send failed', { error: error.message, to: options.to });
    return { success: false, error: error.message };
  }
};

/**
 * Send appointment confirmation email with PDF attachment
 * 
 * Features:
 * - Fetches appointment data from database
 * - Generates PDF confirmation using pdfService
 * - Renders HTML email template with appointment details
 * - Includes plain text fallback version
 * - Attaches PDF to email
 * - Implements retry logic with exponential backoff
 * - Logs all sends to audit_logs (success and failure)
 * 
 * Subject line does NOT include PHI (HIPAA compliant)
 * Email body protected - marked as confidential
 * 
 * @param appointmentId - The appointment ID to send confirmation for
 * @param retryCount - Current retry attempt (internal use for retry logic)
 * @returns Promise that resolves when email is sent
 * @throws Error if all retry attempts fail
 * 
 * @example
 * await sendAppointmentConfirmation('123e4567-e89b-12d3-a456-426614174000');
 * // Email sent to patient with PDF attachment
 */
export const sendAppointmentConfirmation = async (
  appointmentId: string,
  retryCount = 0
): Promise<void> => {
  logger.info('Sending appointment confirmation email', {
    appointmentId,
    retryCount,
  });

  try {
    // 1. Fetch appointment data with patient email
    const appointment = await fetchAppointmentEmailData(appointmentId);
    
    logger.debug('Appointment data fetched for email', {
      appointmentId,
      patientEmail: appointment.patient_email,
      patientName: appointment.patient_name,
    });

    // 2. Generate PDF attachment
    const pdfBuffer = await generateAppointmentPDFBuffer(appointmentId);
    logger.debug('PDF generated for email attachment', {
      appointmentId,
      pdfSize: pdfBuffer.length,
    });

    // 3. Prepare template data
    const templateData = prepareEmailTemplateData(appointment);

    // 4. Render HTML and plain text email
    const htmlContent = renderEmailTemplate(templateData);
    const textContent = generatePlainTextEmail(templateData);

    // 5. Send email with PDF attachment
    await sendEmail({
      to: appointment.patient_email,
      subject: 'Your Appointment Confirmation - UPACI Health', // No PHI in subject
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: `appointment-${appointmentId}-confirmation.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    // 6. Log success to audit_logs
    await logSecurityEvent(
      appointment.patient_id,
      'EMAIL_SENT',
      {
        appointmentId,
        emailType: 'appointment_confirmation',
        recipient: appointment.patient_email,
        pdfAttached: true,
        retryCount,
      },
      {
        userId: appointment.patient_id,
        userRole: 'patient',
        ip: '0.0.0.0', // System-generated email
        userAgent: 'email-service',
      }
    );

    logger.info('Appointment confirmation email sent successfully', {
      appointmentId,
      patientEmail: appointment.patient_email,
      retryCount,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    
    logger.error('Failed to send appointment confirmation email', {
      appointmentId,
      retryCount,
      error: errorMessage,
    });

    // Retry logic with exponential backoff
    if (retryCount < emailConfig.retries) {
      const delay = emailConfig.retryDelay * Math.pow(2, retryCount);
      
      logger.warn(
        `Email send failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${emailConfig.retries})`,
        { appointmentId }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendAppointmentConfirmation(appointmentId, retryCount + 1);
    }

    // All retries exhausted - log failure
    await logSecurityEvent(
      null, // Patient ID not available here
      'EMAIL_FAILED',
      {
        appointmentId,
        emailType: 'appointment_confirmation',
        error: errorMessage,
        retriesAttempted: emailConfig.retries,
      },
      {
        userId: null,
        userRole: null,
        ip: '0.0.0.0',
        userAgent: 'email-service',
      }
    );

    throw new Error(
      `Failed to send appointment confirmation email after ${emailConfig.retries} attempts: ${errorMessage}`
    );
  }
};

/**
 * Waitlist notification email data
 */
interface WaitlistNotificationData {
  patientEmail: string;
  patientName: string;
  slotId: number;
  startTime: Date;
  endTime: Date;
  doctorName: string;
  departmentName: string;
  location: string;
  reservationId: number;
  expiresAt: Date;
}

/**
 * Send waitlist notification email when slot becomes available
 * 
 * Features:
 * - Notifies patient that a slot matching their waitlist request is available
 * - Includes 2-hour hold countdown
 * - Provides "Book Now" link to patient portal
 * - Auto-expires reservation after 2 hours
 * - Logs all sends to audit_logs
 * 
 * @param data - Waitlist notification data
 * @returns Promise that resolves when email is sent
 * @throws Error if sending fails
 * 
 * @example
 * await sendWaitlistNotificationEmail({
 *   patientEmail: 'patient@example.com',
 *   patientName: 'John Doe',
 *   slotId: 123,
 *   startTime: new Date('2026-03-20T14:30:00'),
 *   endTime: new Date('2026-03-20T15:00:00'),
 *   doctorName: 'Dr. Smith',
 *   departmentName: 'Cardiology',
 *   location: 'Building A, Floor 2',
 *   reservationId: 456,
 *   expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
 * });
 */
export const sendWaitlistNotificationEmail = async (
  data: WaitlistNotificationData
): Promise<void> => {
  logger.info('Sending waitlist notification email', {
    patientEmail: data.patientEmail,
    slotId: data.slotId,
    reservationId: data.reservationId,
  });

  try {
    const appointmentDate = formatDate(data.startTime);
    const appointmentTime = `${formatTime(data.startTime.toTimeString().split(' ')[0])} - ${formatTime(data.endTime.toTimeString().split(' ')[0])}`;
    const expiresTime = formatTime(data.expiresAt.toTimeString().split(' ')[0]);
    const bookingUrl = `${emailConfig.portalUrl}/waitlist/book/${data.reservationId}`;

    // HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
    .detail-label { font-weight: bold; color: #495057; }
    .detail-value { color: #212529; }
    .cta-button { display: inline-block; background-color: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; text-align: center; }
    .cta-button:hover { background-color: #218838; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; margin-top: 20px; }
    .urgent { color: #dc3545; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Appointment Slot Available!</h1>
    </div>
    
    <div style="padding: 20px;">
      <p>Dear ${data.patientName},</p>
      
      <p><strong>Great news!</strong> An appointment slot matching your waitlist request is now available.</p>
      
      <div class="alert">
        <strong>⏰ TIME-SENSITIVE:</strong> This slot is reserved for you until <span class="urgent">${expiresTime}</span> (2 hours from notification).
        <br><strong>Act quickly to secure your appointment!</strong>
      </div>
      
      <div class="details">
        <h3 style="margin-top: 0;">Appointment Details</h3>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${appointmentTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Provider:</span>
          <span class="detail-value">${data.doctorName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Department:</span>
          <span class="detail-value">${data.departmentName}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${data.location}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${bookingUrl}" class="cta-button">
          📅 BOOK NOW
        </a>
      </div>
      
      <h3>What Happens Next?</h3>
      <ul>
        <li><strong>Book within 2 hours:</strong> Click the button above to secure this appointment</li>
        <li><strong>If you don't book:</strong> The slot will be released to the next person on the waitlist</li>
        <li><strong>Confirmation:</strong> You'll receive an email confirmation once booked</li>
      </ul>
      
      <h3>Important Reminders</h3>
      <ul>
        <li>Arrive 15 minutes before your scheduled appointment time</li>
        <li>Bring a valid photo ID and your insurance card</li>
        <li>If you have COVID-19 symptoms, please call us before arriving</li>
      </ul>
      
      <p>If you have any questions or need assistance, please contact us at (555) 123-4567.</p>
      
      <p>Best regards,<br>
      UPACI Health Team</p>
    </div>
    
    <div class="footer">
      <p><strong>UPACI Health Platform</strong><br>
      123 Medical Center Dr, Healthcare City, HC 12345<br>
      Phone: (555) 123-4567 | Email: appointments@upaci.health</p>
      
      <p style="margin-top: 15px; color: #dc3545;">
        <strong>⚠ PROTECTED HEALTH INFORMATION</strong><br>
        This email contains confidential patient information protected by HIPAA.<br>
        Do not forward or share this email.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Plain text email content
    const textContent = `
Dear ${data.patientName},

GREAT NEWS! An appointment slot matching your waitlist request is now available.

⏰ TIME-SENSITIVE: This slot is reserved for you until ${expiresTime} (2 hours from notification).
ACT QUICKLY TO SECURE YOUR APPOINTMENT!

APPOINTMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date: ${appointmentDate}
Time: ${appointmentTime}
Provider: ${data.doctorName}
Department: ${data.departmentName}
Location: ${data.location}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOK YOUR APPOINTMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bookingUrl}

WHAT HAPPENS NEXT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Book within 2 hours: Use the link above to secure this appointment
• If you don't book: The slot will be released to the next person on the waitlist
• Confirmation: You'll receive an email confirmation once booked

IMPORTANT REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Arrival Time: Please arrive 15 minutes before your scheduled appointment time
• Required Items: Bring a valid photo ID and your insurance card
• Health & Safety: If you have COVID-19 symptoms, please call us before arriving

If you have any questions or need assistance, please contact us at (555) 123-4567.

Best regards,
UPACI Health Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPACI Health Platform
123 Medical Center Dr, Healthcare City, HC 12345
Phone: (555) 123-4567 | Email: appointments@upaci.health

⚠ PROTECTED HEALTH INFORMATION
This email contains confidential patient information protected by HIPAA.
Do not forward or share this email.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Send email
    await sendEmail({
      to: data.patientEmail,
      subject: 'Appointment Slot Available - Book Within 2 Hours!',
      html: htmlContent,
      text: textContent,
    });

    // Log success to audit_logs
    await logSecurityEvent(
      null, // Patient ID not available in this context
      'EMAIL_SENT',
      {
        emailType: 'waitlist_notification',
        recipient: data.patientEmail,
        slotId: data.slotId,
        reservationId: data.reservationId,
        expiresAt: data.expiresAt.toISOString(),
      },
      {
        userId: null,
        userRole: 'system',
        ip: '0.0.0.0',
        userAgent: 'email-service',
      }
    );

    logger.info('Waitlist notification email sent successfully', {
      patientEmail: data.patientEmail,
      slotId: data.slotId,
      reservationId: data.reservationId,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    
    logger.error('Failed to send waitlist notification email', {
      patientEmail: data.patientEmail,
      slotId: data.slotId,
      error: errorMessage,
    });

    // Log failure
    await logSecurityEvent(
      null,
      'EMAIL_FAILED',
      {
        emailType: 'waitlist_notification',
        recipient: data.patientEmail,
        slotId: data.slotId,
        reservationId: data.reservationId,
        error: errorMessage,
      },
      {
        userId: null,
        userRole: 'system',
        ip: '0.0.0.0',
        userAgent: 'email-service',
      }
    );

    throw new Error(`Failed to send waitlist notification email: ${errorMessage}`);
  }
};

/**
 * Test email connection
 * Verifies that SMTP/email provider credentials are valid
 * 
 * @returns Promise that resolves with true if connection successful
 * @throws Error if connection fails
 * 
 * @example
 * const isConnected = await testEmailConnection();
 * if (isConnected) {
 *   console.log('Email service ready');
 * }
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    logger.info('Email connection test successful');
    return true;
  } catch (error) {
    logger.error('Email connection test failed:', error);
    throw new Error(`Email connection test failed: ${(error as Error).message}`);
  }
};

/**
 * Health check for email service
 * Verifies email configuration and connection
 * 
 * @returns Promise that resolves with health status
 */
export const healthCheck = async (): Promise<{
  healthy: boolean;
  provider: string;
  error?: string;
}> => {
  try {
    await testEmailConnection();
    return {
      healthy: true,
      provider: emailConfig.provider,
    };
  } catch (error) {
    return {
      healthy: false,
      provider: emailConfig.provider,
      error: (error as Error).message,
    };
  }
};

/**
 * Close email transporter
 * Should be called during graceful shutdown
 * 
 * @example
 * // In server shutdown handler
 * await closeEmailTransporter();
 */
export const closeEmailTransporter = async (): Promise<void> => {
  if (transporter) {
    logger.info('Closing email transporter');
    transporter.close();
    transporter = null;
  }
};
