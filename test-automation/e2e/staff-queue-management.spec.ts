import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { QueueManagementPage } from '../pages/queue-management.page';

test.describe('E2E: Staff Queue Management Journey', () => {
  test('TC-E2E-STAFF-001: Complete Staff Queue Management Workflow', async ({ page }) => {
    // Phase 1: UC-008 - Staff Login and Authentication
    const loginPage = new LoginPage(page);
    await page.goto('/login');
    await loginPage.login('staff.testuser@example.com', 'StaffSecure123!');
    
    // Checkpoint: Verify redirected to staff dashboard
    await expect(page).toHaveURL(/staff\/dashboard/);
    
    // Phase 2: UC-007 - Add Walk-in Patient to Queue
    await page.goto('/staff/queue-management');
    
    const queueManagement = new QueueManagementPage(page);
    await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();
    
    // Add walk-in patient
    await queueManagement.addWalkinButton.click();
    await queueManagement.patientNameInput.fill('Emma Johnson');
    await queueManagement.dateOfBirthInput.fill('1990-08-22');
    await queueManagement.reasonForVisitInput.fill('Persistent cough and fever');
    await queueManagement.addToQueueButton.click();
    
    // Checkpoint: Patient added to queue
    await expect(page.getByText('Walk-in patient added to queue successfully')).toBeVisible();
    await expect(page.getByRole('row', { name: /Emma Johnson/ })).toBeVisible();
    
    // Phase 3: UC-007 - Mark Patient as Arrived
    await page.getByRole('row', { name: /Emma Johnson/ }).click();
    await expect(page.getByText('Status: In Queue')).toBeVisible();
    
    await queueManagement.markArrivedButton.click();
    await expect(page.getByText('Confirm patient Emma Johnson has arrived?')).toBeVisible();
    await queueManagement.confirmButton.click();
    
    // Checkpoint: Patient marked as arrived
    await expect(page.getByText('Patient marked as arrived successfully')).toBeVisible();
    await expect(page.getByText('Status: Arrived')).toBeVisible();
    
    // Phase 4: UC-007 - Update Status to In Progress
    await queueManagement.markInProgressButton.click();
    await queueManagement.confirmButton.click();
    
    // Checkpoint: Status updated to In Progress
    await expect(page.getByText('Appointment status updated to In Progress')).toBeVisible();
    await expect(page.getByText('Status: In Progress')).toBeVisible();
    
    // Phase 5: UC-007 - Mark Appointment as Completed
    await queueManagement.markCompletedButton.click();
    await queueManagement.confirmButton.click();
    
    // Checkpoint: Appointment completed
    await expect(page.getByText('Appointment status updated to Completed')).toBeVisible();
    await expect(page.getByText('Status: Completed')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Completed Appointments' })).toContainText('Emma Johnson');
    
    // Phase 6: UC-011 - Mark No-Show for Another Patient
    await page.goto('/staff/queue-management');
    
    await page.getByRole('row', { name: /Michael Brown/ }).click();
    await expect(page.getByText('Status: Scheduled')).toBeVisible();
    
    await queueManagement.markNoShowButton.click();
    await expect(page.getByText('Mark Michael Brown as No Show?')).toBeVisible();
    
    await queueManagement.noShowReasonInput.fill('Patient did not arrive 15 minutes past scheduled time');
    await page.getByRole('button', { name: 'Confirm No Show' }).click();
    
    // Checkpoint: No-show logged
    await expect(page.getByText('Appointment marked as No Show and logged immutably')).toBeVisible();
    await expect(page.getByText('Status: No Show')).toBeVisible();
    await expect(page.getByText('Risk assessment updated')).toBeVisible();
    
    // Final Checkpoint: Complete staff workflow validated
    await expect(page).toHaveURL(/staff\/queue-management/);
  });
});
