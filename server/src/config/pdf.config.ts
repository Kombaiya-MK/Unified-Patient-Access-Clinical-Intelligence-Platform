/**
 * PDF Generation Configuration
 * 
 * Configuration settings for appointment confirmation PDFs including:
 * - Page format and margins
 * - Branding elements (logo, colors, clinic information)
 * - Print settings
 */

export const pdfConfig = {
  format: 'A4' as const,
  margin: { 
    top: '20mm', 
    right: '20mm', 
    bottom: '20mm', 
    left: '20mm' 
  },
  printBackground: true,
  preferCSSPageSize: false,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-size:10px; text-align:center; width:100%; padding-top:10px;">UPACI Health - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  branding: {
    logo: '/public/images/logo.png',
    primaryColor: '#006CB8',
    secondaryColor: '#004A80',
    clinicName: 'UPACI Health Platform',
    address: '123 Medical Center Dr, Healthcare City, HC 12345',
    phone: '(555) 123-4567',
    email: 'appointments@upaci.health'
  }
};

export type PDFConfig = typeof pdfConfig;
