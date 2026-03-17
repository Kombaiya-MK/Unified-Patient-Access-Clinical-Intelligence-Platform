import { test, expect } from '@playwright/test';
import { PatientDashboardPage } from '../pages/patient-dashboard.page';

test.describe('Patient Dashboard Access', () => {
  let dashboard: PatientDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new PatientDashboardPage(page);
    // Assume patient is already logged in
    await page.goto('/patient/dashboard');
  });

  test('TC-UC-012-HP-001: Access Dashboard and View Appointments', async ({ page }) => {
    // Verify personalized greeting
    await expect(dashboard.welcomeHeading).toBeVisible();
    await expect(dashboard.welcomeHeading).toContainText('Welcome');
    
    // Verify appointments section
    await expect(dashboard.upcomingAppointmentsSection).toBeVisible();
    await expect(page.getByText(/Appointment on March 25, 2026/)).toBeVisible();
    
    // Verify quick actions panel
    await expect(dashboard.quickActionsPanel).toBeVisible();
    await expect(dashboard.bookAppointmentLink).toBeVisible();
    await expect(dashboard.uploadDocumentsLink).toBeVisible();
    
    // Verify notifications panel
    await expect(dashboard.notificationsPanel).toBeVisible();
  });

  test('TC-UC-012-HP-002: Upload Clinical Documents', async ({ page }) => {
    // Click upload documents link
    await dashboard.uploadDocumentsLink.click();
    
    // Verify upload page loaded
    await expect(page.getByRole('heading', { name: 'Upload Clinical Documents' })).toBeVisible();
    
    // Upload file
    const filePath = './test-data/sample-lab-report.pdf';
    await page.getByLabel('Select File').setInputFiles(filePath);
    
    // Select document type
    await page.getByLabel('Document Type').selectOption('Lab Report');
    
    // Enter description
    await page.getByLabel('Description (Optional)').fill('Blood test results from March 10, 2026');
    
    // Upload
    await page.getByRole('button', { name: 'Upload' }).click();
    
    // Verify success
    await expect(page.getByText('Document uploaded successfully')).toBeVisible();
    await expect(page.getByText('AI extraction in progress')).toBeVisible();
  });

  test('TC-UC-012-HP-003: Complete Intake from Dashboard', async ({ page }) => {
    // Verify intake reminder
    await expect(page.getByRole('alert', { name: 'Reminder' })).toBeVisible();
    await expect(page.getByText('Please complete your intake before your appointment on March 25.')).toBeVisible();
    
    // Click complete intake link
    await dashboard.completeIntakeLink.click();
    
    // Verify redirected to intake page
    await expect(page.getByRole('heading', { name: 'Patient Intake' })).toBeVisible();
    
    // Start AI-assisted intake
    await page.getByRole('button', { name: 'Start AI-Assisted Intake' }).click();
    
    // Verify intake process begins
    await expect(page.getByText('Hello! I will help you complete your intake.')).toBeVisible();
  });

  test('TC-UC-012-HP-004: View and Dismiss Notifications', async ({ page }) => {
    // Verify notifications panel
    await expect(dashboard.notificationsPanel).toBeVisible();
    
    // Verify notification count
    await expect(dashboard.notificationBadge).toContainText('3');
    
    // View all notifications
    await dashboard.viewAllNotificationsButton.click();
    
    // Verify notification visible
    await expect(page.getByText('Appointment reminder: March 25, 2026 at 10:00 AM')).toBeVisible();
    
    // Dismiss notification
    await dashboard.dismissNotificationButton.first().click();
    
    // Verify count decremented
    await expect(dashboard.notificationBadge).toContainText('2');
  });

  test('TC-UC-012-EC-001: Dashboard with No Appointments', async ({ page }) => {
    // Verify appointments section
    await expect(dashboard.upcomingAppointmentsSection).toBeVisible();
    
    // Verify no appointments message
    await expect(dashboard.noAppointmentsMessage).toBeVisible();
    
    // Verify book appointment link is emphasized
    await expect(page.getByRole('link', { name: 'Book Your First Appointment' })).toBeVisible();
    
    // Click to book appointment
    await page.getByRole('link', { name: 'Book Your First Appointment' }).click();
    
    // Verify redirected to booking page
    await expect(page).toHaveURL(/appointments\/book/);
  });

  test('TC-UC-012-ER-001: Unauthorized Dashboard Access', async ({ page }) => {
    // Navigate to dashboard without authentication
    await page.context().clearCookies();
    await page.goto('/patient/dashboard');
    
    // Verify redirected to login
    await expect(page).toHaveURL(/login/);
    
    // Verify error alert
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Please log in to access your dashboard.')).toBeVisible();
    
    // Verify login form visible
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('TC-UC-012-EC-002: Dashboard Session Timeout', async ({ page }) => {
    // Simulate session timeout by waiting (using test configuration)
    // In real scenario, this would be 15 minutes
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    
    // Attempt to navigate within dashboard
    await page.reload();
    
    // Verify session expired modal
    await expect(page.getByRole('dialog', { name: 'Session Expired' })).toBeVisible();
    await expect(page.getByText('Your session has expired due to inactivity. Please log in again.')).toBeVisible();
    
    // Click log in again
    await page.getByRole('button', { name: 'Log In Again' }).click();
    
    // Verify redirected to login page
    await expect(page).toHaveURL(/login/);
  });
});
