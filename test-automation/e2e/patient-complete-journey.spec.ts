import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { PatientDashboardPage } from '../pages/patient-dashboard.page';
import { AppointmentBookingPage } from '../pages/appointment-booking.page';
import { PatientIntakePage } from '../pages/patient-intake.page';

test.describe('E2E: Patient Complete Journey', () => {
  test('TC-E2E-PATIENT-001: Complete Patient Onboarding and Appointment Journey', async ({ page }) => {
    // Phase 1: UC-008 - Patient Login and Authentication
    const loginPage = new LoginPage(page);
    await page.goto('/login');
    await loginPage.login('patient.testuser@example.com', 'SecurePass123!');
    
    // Checkpoint: Verify redirected to dashboard
    await expect(page).toHaveURL(/patient\/dashboard/);
    
    // Phase 2: UC-012 - Access Patient Dashboard
    const dashboard = new PatientDashboardPage(page);
    await expect(dashboard.welcomeHeading).toBeVisible();
    await expect(dashboard.welcomeHeading).toContainText('Welcome');
    await expect(dashboard.quickActionsPanel).toBeVisible();
    await expect(dashboard.bookAppointmentLink).toBeVisible();
    
    // Checkpoint: Dashboard loaded with personalized view
    await expect(page.getByRole('region', { name: 'Quick Actions' })).toBeVisible();
    
    // Phase 3: UC-001 - Book Appointment
    await dashboard.bookAppointmentLink.click();
    
    const appointmentBooking = new AppointmentBookingPage(page);
    await appointmentBooking.appointmentTypeSelect.selectOption('General Consultation');
    await appointmentBooking.preferredDatePicker.fill('2026-04-15');
    await appointmentBooking.searchSlotsButton.click();
    
    // Select time slot
    await page.getByRole('button', { name: '10:00 AM' }).click();
    
    // Confirm booking
    await appointmentBooking.confirmBookingButton.click();
    
    // Checkpoint: Appointment confirmed
    await expect(page.getByText('Appointment booked successfully')).toBeVisible();
    await expect(page.getByText('Confirmation email sent with PDF attachment')).toBeVisible();
    
    // Phase 4: UC-002 - Complete AI-Assisted Intake
    await page.goto('/intake/start');
    
    const intakePage = new PatientIntakePage(page);
    await intakePage.aiIntakeButton.click();
    await expect(page.getByText('Hello! I will help you complete your intake.')).toBeVisible();
    
    // AI intake conversation
    await intakePage.chatInput.fill('I have been experiencing frequent headaches for 2 weeks');
    await intakePage.sendButton.click();
    await expect(page.getByText(/How severe/)).toBeVisible();
    
    await intakePage.chatInput.fill('Moderate, usually in the morning');
    await intakePage.sendButton.click();
    
    // Complete intake
    await intakePage.completeIntakeButton.click();
    
    // Checkpoint: Intake completed
    await expect(page.getByText('Intake completed successfully')).toBeVisible();
    
    // Phase 5: UC-012 - Upload Clinical Document
    await page.goto('/patient/dashboard');
    await dashboard.uploadDocumentsLink.click();
    
    // Upload document
    await page.getByLabel('Select File').setInputFiles('./test-data/sample-medical-history.pdf');
    await page.getByLabel('Document Type').selectOption('Medical History');
    await page.getByRole('button', { name: 'Upload' }).click();
    
    // Checkpoint: Document uploaded
    await expect(page.getByText('Document uploaded successfully')).toBeVisible();
    await expect(page.getByText('AI extraction in progress')).toBeVisible();
    
    // Phase 6: UC-001 - Verify Appointment in Dashboard
    await page.goto('/patient/dashboard');
    
    await expect(dashboard.upcomingAppointmentsSection).toBeVisible();
    await expect(page.getByText(/Appointment on April 15, 2026 at 10:00 AM/)).toBeVisible();
    await expect(page.getByText('Status: Confirmed')).toBeVisible();
    
    // Final Checkpoint: Complete journey validated
    await expect(page).toHaveURL(/patient\/dashboard/);
  });
});
