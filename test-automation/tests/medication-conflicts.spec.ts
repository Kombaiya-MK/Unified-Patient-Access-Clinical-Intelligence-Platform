import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { PatientProfilePage } from '../pages/patient-profile.page';

import testFixtures from '../data/medication-conflicts.json';

const staff = testFixtures.staff;
const pat001 = testFixtures.patients['PAT-001'];
const pat002 = testFixtures.patients['PAT-002'];
const resolution = testFixtures.resolution;

test.describe('Medication Conflict Detection', () => {
  let patientProfilePage: PatientProfilePage;

  test.beforeEach(async ({ page }) => {
    patientProfilePage = new PatientProfilePage(page);

    // Authenticate as staff before each test
    const loginPage = new LoginPage(page);
    await page.goto('/login');
    await loginPage.login(staff.email, staff.password);
    await expect(page).toHaveURL(/staff|dashboard/);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('TC-UC-010-HP-001: Detect and Highlight Medication Conflicts', async ({ page }) => {
    // 001: Navigate to patient profile
    await page.goto('/staff/patient-profile/PAT-001');

    // 002: Medications section visible
    await expect(patientProfilePage.medicationsSection).toBeVisible();

    // 003: Medication count displayed
    await expect(page.getByText(`Current Medications (${pat001.medications_count})`)).toBeVisible();

    // 004: Conflict alert visible
    await expect(patientProfilePage.conflictAlert).toBeVisible();

    // 005: Conflict count visible
    await expect(page.getByText(`${pat001.conflict_count} medication conflicts detected`)).toBeVisible();

    // 006: View conflict details
    await patientProfilePage.viewConflictsButton.click();

    // 007: First conflict detail
    const conflict1 = pat001.conflicts[0];
    await expect(
      page.getByText(`${conflict1.medications.join(' + ')}: ${conflict1.description}`),
    ).toBeVisible();

    // 008: Second conflict detail
    const conflict2 = pat001.conflicts[1];
    await expect(
      page.getByText(`${conflict2.medications.join(' + ')}: ${conflict2.description}`),
    ).toBeVisible();

    // 009: Conflict severity displayed
    await expect(page.getByText(`Severity: ${conflict1.severity}`)).toBeVisible();

    // 010: Resolve button available
    await expect(patientProfilePage.resolveConflictButton).toBeVisible();
  });

  test('TC-UC-010-HP-002: Staff Reviews and Resolves Medication Conflict', async ({ page }) => {
    // 001: Navigate to patient profile
    await page.goto('/staff/patient-profile/PAT-001');

    // 002: View conflicts
    await patientProfilePage.viewConflictsButton.click();

    // 003: Click resolve conflict
    await patientProfilePage.resolveConflictButton.click();

    // 004: Conflict being resolved is displayed
    await expect(
      page.getByText(`Conflict: ${resolution.medications.join(' + ')}`),
    ).toBeVisible();

    // 005: Enter resolution action
    await patientProfilePage.resolutionActionInput.fill(resolution.action);

    // 006: Enter staff notes
    await patientProfilePage.staffNotesInput.fill(resolution.notes);

    // 007: Save resolution
    await patientProfilePage.saveResolutionButton.click();

    // 008: Success message
    await expect(page.getByText('Conflict resolution saved successfully')).toBeVisible();

    // 009: Conflict status updated
    await expect(page.getByText('Status: Resolved')).toBeVisible();

    // 010: Conflict count decremented
    await expect(page.getByText('1 medication conflict remaining')).toBeVisible();
  });

  test('TC-UC-010-EC-001: No Conflicts Detected for Patient', async ({ page }) => {
    // EC001: Navigate to patient with no conflicts
    await page.goto('/staff/patient-profile/PAT-002');

    // EC002: Medications section visible
    await expect(patientProfilePage.medicationsSection).toBeVisible();

    // EC003: Medication count displayed
    await expect(page.getByText(`Current Medications (${pat002.medications_count})`)).toBeVisible();

    // EC004: No conflicts message
    await expect(page.getByText('No medication conflicts detected')).toBeVisible();

    // EC005: Positive status indicator
    await expect(page.getByRole('status', { name: 'All Clear' })).toBeVisible();

    // EC006: Timestamp of last conflict check
    await expect(page.getByText(/Last checked:.*\d{4}/)).toBeVisible();
  });

  test('TC-UC-010-ER-001: Conflict Detection Fails Due to Missing Medication Data', async ({ page }) => {
    // ER001: Navigate to patient with incomplete data
    await page.goto('/staff/patient-profile/PAT-003');

    // ER002: Medications section visible
    await expect(patientProfilePage.medicationsSection).toBeVisible();

    // ER003: Incomplete data message
    await expect(page.getByText('Medication data incomplete')).toBeVisible();

    // ER004: Warning alert visible
    await expect(page.getByRole('alert')).toBeVisible();

    // ER005: Detection failure message
    await expect(
      page.getByText('Unable to perform conflict detection. Please complete medication history.'),
    ).toBeVisible();

    // ER006: Add medications button available
    await expect(patientProfilePage.addMedicationsButton).toBeVisible();
  });

  test('TC-UC-010-EC-002: High Severity Conflict Triggers Immediate Alert', async ({ page }) => {
    // EC007: Navigate to patient with critical conflict
    await page.goto('/staff/patient-profile/PAT-004');

    // EC008: Critical conflict modal appears immediately
    await expect(patientProfilePage.criticalConflictDialog).toBeVisible();

    // EC009: Critical alert message
    await expect(page.getByText('CRITICAL: High-risk medication interaction detected')).toBeVisible();

    // EC010: Conflict details visible
    const criticalConflict = testFixtures.patients['PAT-004'].conflicts[0];
    await expect(
      page.getByText(`${criticalConflict.medications.join(' + ')}: ${criticalConflict.description}`),
    ).toBeVisible();

    // EC011: Severity highlighted
    await expect(page.getByText(`Severity: ${criticalConflict.severity}`)).toBeVisible();

    // EC012: Recommendation visible
    await expect(page.getByText('Immediate physician consultation required')).toBeVisible();

    // EC013: Acknowledge button visible
    await expect(patientProfilePage.acknowledgeButton).toBeVisible();

    // EC014: Acknowledge alert
    await patientProfilePage.acknowledgeCriticalConflict();

    // EC015: Acknowledgment logged immutably
    await expect(page.getByText(/Critical conflict acknowledged by/)).toBeVisible();
  });

  test('TC-UC-010-ER-002: Conflict Detection Service Unavailable', async ({ page }) => {
    // ER007: Navigate to patient when service is down
    await page.goto('/staff/patient-profile/PAT-005');

    // ER008: Medications section visible
    await expect(patientProfilePage.medicationsSection).toBeVisible();

    // ER009: Service error alert
    await expect(page.getByRole('alert', { name: 'Service Error' })).toBeVisible();

    // ER010: Service unavailable message
    await expect(page.getByText('Conflict detection service is temporarily unavailable')).toBeVisible();

    // ER011: Fallback instruction
    await expect(
      page.getByText('Please manually review medications for potential interactions or try again later.'),
    ).toBeVisible();

    // ER012: Retry button available
    await expect(patientProfilePage.retryDetectionButton).toBeVisible();

    // ER013: Manual review option available
    await expect(patientProfilePage.manualReviewButton).toBeVisible();
  });
});
