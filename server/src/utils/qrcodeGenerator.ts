/**
 * QR Code Generator Utility
 * 
 * Generates QR codes for appointment URLs as base64 data URLs
 * for embedding directly in PDF documents.
 */

import QRCode from 'qrcode';

/**
 * Generate a QR code from appointment data
 * @param data - The data to encode (typically appointment URL)
 * @returns Base64 encoded data URL for embedding in HTML/PDF
 * @throws Error if QR code generation fails
 */
export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'H', // High error correction for better scanning
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL; // Returns base64 data URL: "data:image/png;base64,..."
  } catch (err) {
    const error = err as Error;
    throw new Error(`QR code generation failed: ${error.message}`);
  }
};

/**
 * Generate an appointment QR code with the standard URL format
 * @param appointmentId - The appointment ID (UUID string)
 * @returns Base64 encoded data URL for the QR code
 */
export const generateAppointmentQRCode = async (appointmentId: string): Promise<string> => {
  const appointmentUrl = `https://upaci.health/appointments/${appointmentId}`;
  return generateQRCode(appointmentUrl);
};
