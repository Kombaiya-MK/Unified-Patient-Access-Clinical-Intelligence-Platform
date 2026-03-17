import { test, expect } from '@playwright/test';
import { QueueManagementPage } from '../pages/queue-management.page';

test.describe('Staff Walk-in and Queue Management', () => {
  let queueManagementPage: QueueManagementPage;

  test.beforeEach(async ({ page }) => {
    queueManagementPage = new QueueManagementPage(page);
    // Assume staff is already logged in
    await page.goto('/staff/queue-management');
  });

  test('TC-UC-007-HP-001: Add Walk-in Patient to Queue', async ({ page }) => {
    // Click add walk-in button
    await queueManagementPage.addWalkinButton.click();
    
    // Fill patient details
    await queueManagementPage.patientNameInput.fill('John Smith');
    await queueManagementPage.dateOfBirthInput.fill('1985-05-15');
    await queueManagementPage.reasonForVisitInput.fill('Fever and sore throat');
    
    // Add to queue
    await queueManagementPage.addToQueueButton.click();
    
    // Verify success message
    await expect(page.getByText('Walk-in patient added to queue successfully')).toBeVisible();
    
    // Verify patient appears in queue list
    await expect(page.getByRole('row', { name: /John Smith/ })).toBeVisible();
  });

  test('TC-UC-007-HP-002: Mark Patient as Arrived', async ({ page }) => {
    // Select patient row
    await page.getByRole('row', { name: /John Smith/ }).click();
    
    // Mark as arrived
    await queueManagementPage.markArrivedButton.click();
    
    // Confirm arrival
    await expect(page.getByText('Confirm patient John Smith has arrived?')).toBeVisible();
    await queueManagementPage.confirmButton.click();
    
    // Verify success message
    await expect(page.getByText('Patient marked as arrived successfully')).toBeVisible();
    
    // Verify status updated
    await expect(page.getByText('Status: Arrived')).toBeVisible();
  });

  test('TC-UC-007-HP-003: Update Appointment Status to In Progress', async ({ page }) => {
    // Select patient row with Arrived status
    await page.getByRole('row', { name: /John Smith/ }).click();
    await expect(page.getByText('Status: Arrived')).toBeVisible();
    
    // Mark as In Progress
    await queueManagementPage.markInProgressButton.click();
    await queueManagementPage.confirmButton.click();
    
    // Verify success message
    await expect(page.getByText('Appointment status updated to In Progress')).toBeVisible();
    
    // Verify status updated
    await expect(page.getByText('Status: In Progress')).toBeVisible();
  });

  test('TC-UC-007-HP-004: Update Appointment Status to Completed', async ({ page }) => {
    // Select patient row with In Progress status
    await page.getByRole('row', { name: /John Smith/ }).click();
    await expect(page.getByText('Status: In Progress')).toBeVisible();
    
    // Mark as Completed
    await queueManagementPage.markCompletedButton.click();
    await queueManagementPage.confirmButton.click();
    
    // Verify success message
    await expect(page.getByText('Appointment status updated to Completed')).toBeVisible();
    
    // Verify status updated
    await expect(page.getByText('Status: Completed')).toBeVisible();
    
    // Verify patient moved to completed section
    await expect(page.getByRole('region', { name: 'Completed Appointments' })).toContainText('John Smith');
  });

  test('TC-UC-007-EC-001: Queue Full Warning', async ({ page }) => {
    // Verify queue is at capacity
    await expect(page.getByText(/Queue Capacity: 20\/20/)).toBeVisible();
    
    // Attempt to add walk-in patient
    await queueManagementPage.addWalkinButton.click();
    
    // Verify warning dialog
    await expect(page.getByText('Queue is at full capacity. Add to waitlist instead?')).toBeVisible();
    
    // Add to waitlist
    await page.getByRole('button', { name: 'Add to Waitlist' }).click();
    
    // Verify success
    await expect(page.getByText('Patient added to waitlist successfully')).toBeVisible();
  });

  test('TC-UC-007-ER-001: Mark Arrival with Invalid Patient ID', async ({ page }) => {
    // Search for invalid patient ID
    await queueManagementPage.searchPatientInput.fill('INVALID-ID-999');
    await queueManagementPage.searchButton.click();
    
    // Verify error alert
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Patient not found. Please verify the Patient ID.')).toBeVisible();
    
    // Verify mark arrived button is disabled
    await expect(queueManagementPage.markArrivedButton).toBeDisabled();
  });

  test('TC-UC-007-EC-002: Status Transition Validation', async ({ page }) => {
    // Select patient with Scheduled status
    await page.getByRole('row', { name: /Jane Doe/ }).click();
    await expect(page.getByText('Status: Scheduled')).toBeVisible();
    
    // Verify invalid transitions are disabled
    await expect(queueManagementPage.markCompletedButton).toBeDisabled();
    await expect(queueManagementPage.markInProgressButton).toBeDisabled();
    
    // Verify only valid transition is enabled
    await expect(queueManagementPage.markArrivedButton).toBeEnabled();
  });
});
