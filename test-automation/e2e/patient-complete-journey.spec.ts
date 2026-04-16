import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { PatientDashboardPage } from '../pages/patient-dashboard.page';
import { AppointmentBookingPage } from '../pages/appointment-booking.page';
import { PatientIntakePage } from '../pages/patient-intake.page';
import { DocumentUploadPage } from '../pages/document-upload.page';
import * as path from 'path';

import journeyData from '../data/e2e-journeys.json';

const testData = journeyData.patient_journey;

test.describe.serial('E2E: Patient Complete Journey', () => {
  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
  });

  test.afterAll(async () => {
    // Cleanup: Delete test patient data created during journey
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    try {
      const response = await fetch(`${baseURL}/api/test/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testData.user.email }),
      });
      if (!response.ok) {
        console.warn(`Test cleanup returned ${response.status} — manual cleanup may be needed`);
      }
    } catch {
      console.warn('Test cleanup endpoint not available — manual cleanup may be needed');
    }
    await sharedPage.context().close();
  });

  test('Phase 1 - UC-008: Patient Login and Authentication', async () => {
    const loginPage = new LoginPage(sharedPage);
    await sharedPage.goto('/login');
    await expect(sharedPage).toHaveURL(/login/);

    await loginPage.login(testData.user.email, testData.user.password);

    // Checkpoint E2E-005: Verify redirected to patient dashboard
    await expect(sharedPage).toHaveURL(/patient\/dashboard/);
  });

  test('Phase 2 - UC-012: Access Patient Dashboard', async () => {
    const dashboard = new PatientDashboardPage(sharedPage);

    // E2E-006: Personalized dashboard greeting
    await expect(dashboard.welcomeHeading).toBeVisible();
    await expect(dashboard.welcomeHeading).toContainText('Welcome');

    // E2E-007: Quick actions panel
    await expect(dashboard.quickActionsPanel).toBeVisible();

    // E2E-008: Book appointment link
    await expect(dashboard.bookAppointmentLink).toBeVisible();
  });

  test('Phase 3 - UC-001: Book Appointment', async () => {
    const dashboard = new PatientDashboardPage(sharedPage);
    const appointmentBooking = new AppointmentBookingPage(sharedPage);

    // E2E-009: Navigate to appointment booking
    await dashboard.navigateToBookAppointment();

    // E2E-010 to E2E-014: Complete booking flow using page object
    await appointmentBooking.bookAppointment(
      testData.appointment.type,
      testData.appointment.date,
      testData.appointment.time,
    );

    // E2E-015: Checkpoint — Appointment confirmed
    await expect(appointmentBooking.successMessage).toBeVisible();

    // E2E-016: Confirmation email sent
    await expect(sharedPage.getByText('Confirmation email sent with PDF attachment')).toBeVisible();
  });

  test('Phase 4 - UC-002: Complete AI-Assisted Intake', async () => {
    const intakePage = new PatientIntakePage(sharedPage);

    // E2E-017: Navigate to intake
    await sharedPage.goto('/intake/start');

    // E2E-018: Start AI-assisted intake
    await intakePage.startAIIntake();

    // E2E-019: AI greeting visible
    await expect(sharedPage.getByText('Hello! I will help you complete your intake.')).toBeVisible();

    // E2E-020 to E2E-021: First response
    await intakePage.sendAIResponse(testData.intake.chief_complaint);

    // E2E-022: Follow-up question
    await expect(sharedPage.getByText(/How severe/)).toBeVisible();

    // E2E-023 to E2E-024: Second response
    await intakePage.sendAIResponse(testData.intake.severity);

    // E2E-025: Complete intake
    await intakePage.completeIntakeButton.click();

    // E2E-026: Checkpoint — Intake completed
    await expect(intakePage.successMessage).toBeVisible();
  });

  test('Phase 5 - UC-012: Upload Clinical Document', async () => {
    const dashboard = new PatientDashboardPage(sharedPage);
    const documentUpload = new DocumentUploadPage(sharedPage);

    // E2E-027: Return to dashboard
    await sharedPage.goto('/patient/dashboard');

    // E2E-028: Navigate to document upload
    await dashboard.navigateToUploadDocuments();

    // E2E-029 to E2E-031: Upload document using page object
    const testFilePath = path.resolve(__dirname, '..', 'test-data', 'sample-medical-history.pdf');
    await documentUpload.uploadDocument(testFilePath, testData.document.type);

    // E2E-032: Checkpoint — Document uploaded
    await expect(documentUpload.successMessage).toBeVisible();

    // E2E-033: AI extraction initiated
    await expect(documentUpload.aiExtractionStatus).toBeVisible();
  });

  test('Phase 6 - UC-001: Verify Appointment in Dashboard', async () => {
    const dashboard = new PatientDashboardPage(sharedPage);

    // E2E-034: Return to dashboard
    await sharedPage.goto('/patient/dashboard');

    // E2E-035: Upcoming appointments section visible
    await expect(dashboard.upcomingAppointmentsSection).toBeVisible();

    // E2E-036: Booked appointment visible
    await expect(
      sharedPage.getByText(/Appointment on April 15, 2026 at 10:00 AM/),
    ).toBeVisible();

    // E2E-037: Appointment status confirmed
    await expect(sharedPage.getByText('Status: Confirmed')).toBeVisible();

    // Final Checkpoint: Complete journey validated
    await expect(sharedPage).toHaveURL(/patient\/dashboard/);
  });
});
