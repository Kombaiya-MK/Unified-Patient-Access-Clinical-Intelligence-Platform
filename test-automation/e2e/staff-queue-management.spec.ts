import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { QueueManagementPage } from '../pages/queue-management.page';

import journeyData from '../data/e2e-journeys.json';

const testData = journeyData.staff_journey;

test.describe.serial('E2E: Staff Queue Management Journey', () => {
  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
  });

  test.afterAll(async () => {
    // Cleanup: Remove test patient data and queue entries
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

  test('Phase 1 - UC-008: Staff Login and Authentication', async () => {
    const loginPage = new LoginPage(sharedPage);

    // E2E-001: Navigate to login page
    await sharedPage.goto('/login');
    await expect(sharedPage).toHaveURL(/login/);

    // E2E-002 to E2E-004: Fill credentials and submit
    await loginPage.login(testData.user.email, testData.user.password);

    // E2E-005: Checkpoint — Redirected to staff dashboard
    await expect(sharedPage).toHaveURL(/staff\/dashboard/);
  });

  test('Phase 2 - UC-007: Add Walk-in Patient to Queue', async () => {
    const queueManagement = new QueueManagementPage(sharedPage);

    // E2E-006: Navigate to queue management
    await sharedPage.goto('/staff/queue-management');

    // E2E-007: Page heading visible
    await expect(sharedPage.getByRole('heading', { name: 'Queue Management' })).toBeVisible();

    // E2E-008 to E2E-012: Add walk-in patient using page object
    await queueManagement.addWalkinPatient(
      testData.walkin_patient.name,
      testData.walkin_patient.date_of_birth,
      testData.walkin_patient.reason,
    );

    // E2E-013: Success message
    await expect(sharedPage.getByText('Walk-in patient added to queue successfully')).toBeVisible();

    // E2E-014: Checkpoint — Patient visible in queue list
    await expect(sharedPage.getByRole('row', { name: /Emma Johnson/ })).toBeVisible();
  });

  test('Phase 3 - UC-007: Mark Patient as Arrived', async () => {
    const queueManagement = new QueueManagementPage(sharedPage);

    // E2E-015: Select patient row
    await sharedPage.getByRole('row', { name: /Emma Johnson/ }).click();

    // E2E-016: Verify initial status
    await expect(sharedPage.getByText('Status: In Queue')).toBeVisible();

    // E2E-017: Click mark as arrived
    await queueManagement.markArrivedButton.click();

    // E2E-018: Confirmation dialog visible
    await expect(sharedPage.getByText('Confirm patient Emma Johnson has arrived?')).toBeVisible();

    // E2E-019: Confirm arrival
    await queueManagement.confirmButton.click();

    // E2E-020: Success message
    await expect(sharedPage.getByText('Patient marked as arrived successfully')).toBeVisible();

    // E2E-021: Checkpoint — Status updated
    await expect(sharedPage.getByText('Status: Arrived')).toBeVisible();
  });

  test('Phase 4 - UC-007: Update Status to In Progress', async () => {
    const queueManagement = new QueueManagementPage(sharedPage);

    // E2E-022: Patient row still selected
    await expect(sharedPage.getByRole('row', { name: /Emma Johnson/ })).toBeVisible();

    // E2E-023: Click mark as in progress
    await queueManagement.markInProgressButton.click();

    // E2E-024: Confirm status update
    await queueManagement.confirmButton.click();

    // E2E-025: Success message
    await expect(sharedPage.getByText('Appointment status updated to In Progress')).toBeVisible();

    // E2E-026: Checkpoint — Status updated
    await expect(sharedPage.getByText('Status: In Progress')).toBeVisible();
  });

  test('Phase 5 - UC-007: Mark Appointment as Completed', async () => {
    const queueManagement = new QueueManagementPage(sharedPage);

    // E2E-027: Click mark as completed
    await queueManagement.markCompletedButton.click();

    // E2E-028: Confirm completion
    await queueManagement.confirmButton.click();

    // E2E-029: Success message
    await expect(sharedPage.getByText('Appointment status updated to Completed')).toBeVisible();

    // E2E-030: Status updated
    await expect(sharedPage.getByText('Status: Completed')).toBeVisible();

    // E2E-031: Checkpoint — Patient moved to completed section
    await expect(
      sharedPage.getByRole('region', { name: 'Completed Appointments' }),
    ).toContainText('Emma Johnson');
  });

  test('Phase 6 - UC-011: Mark No-Show for Another Patient', async () => {
    const queueManagement = new QueueManagementPage(sharedPage);

    // E2E-032: Refresh queue management page
    await sharedPage.goto('/staff/queue-management');

    // E2E-033: Select scheduled patient
    await sharedPage.getByRole('row', { name: /Michael Brown/ }).click();

    // E2E-034: Verify scheduled status
    await expect(sharedPage.getByText('Status: Scheduled')).toBeVisible();

    // E2E-035: Click mark as no show
    await queueManagement.markNoShowButton.click();

    // E2E-036: Confirmation message
    await expect(sharedPage.getByText('Mark Michael Brown as No Show?')).toBeVisible();

    // E2E-037: Enter reason
    await queueManagement.noShowReasonInput.fill(testData.noshow_patient.noshow_reason);

    // E2E-038: Confirm no show
    await queueManagement.confirmNoShowButton.click();

    // E2E-039: Immutable log confirmation
    await expect(sharedPage.getByText('Appointment marked as No Show and logged immutably')).toBeVisible();

    // E2E-040: Status updated
    await expect(sharedPage.getByText('Status: No Show')).toBeVisible();

    // E2E-041: Checkpoint — Risk assessment updated
    await expect(sharedPage.getByText('Risk assessment updated')).toBeVisible();

    // Final Checkpoint: Complete staff workflow validated
    await expect(sharedPage).toHaveURL(/staff\/queue-management/);
  });
});
