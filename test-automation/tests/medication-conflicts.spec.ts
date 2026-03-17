import { test, expect } from '@playwright/test';
import { PatientProfilePage } from '../pages/patient-profile.page';

test.describe('Medication Conflict Detection', () => {
  let patientProfilePage: PatientProfilePage;

  test.beforeEach(async ({ page }) => {
    patientProfilePage = new PatientProfilePage(page);
    // Assume staff is already logged in
  });

  test('TC-UC-010-HP-001: Detect and Highlight Medication Conflicts', async ({ page }) => {
    // Navigate to patient profile
    await page.goto('/staff/patient-profile/PAT-001');
    
    // Verify medications section
    await expect(patientProfilePage.medicationsSection).toBeVisible();
    await expect(page.getByText('Current Medications (5)')).toBeVisible();
    
    // Verify conflict alert
    await expect(patientProfilePage.conflictAlert).toBeVisible();
    await expect(page.getByText('2 medication conflicts detected')).toBeVisible();
    
    // View conflicts
    await patientProfilePage.viewConflictsButton.click();
    
    // Verify conflict details
    await expect(page.getByText('Warfarin + Aspirin: Increased risk of bleeding')).toBeVisible();
    await expect(page.getByText('Lisinopril + Ibuprofen: May reduce effectiveness of blood pressure medication')).toBeVisible();
    
    // Verify severity displayed
    await expect(page.getByText('Severity: High')).toBeVisible();
    
    // Verify resolve button available
    await expect(patientProfilePage.resolveConflictButton).toBeVisible();
  });

  test('TC-UC-010-HP-002: Staff Reviews and Resolves Medication Conflict', async ({ page }) => {
    // Navigate to patient profile
    await page.goto('/staff/patient-profile/PAT-001');
    
    // View conflicts
    await patientProfilePage.viewConflictsButton.click();
    
    // Click resolve conflict
    await patientProfilePage.resolveConflictButton.click();
    
    // Verify conflict being resolved
    await expect(page.getByText('Conflict: Warfarin + Aspirin')).toBeVisible();
    
    // Enter resolution action
    await patientProfilePage.resolutionActionInput.fill('Discontinue Aspirin, consult with cardiologist');
    
    // Enter staff notes
    await patientProfilePage.staffNotesInput.fill('Discussed with patient. Alternative pain management plan in place.');
    
    // Save resolution
    await patientProfilePage.saveResolutionButton.click();
    
    // Verify success message
    await expect(page.getByText('Conflict resolution saved successfully')).toBeVisible();
    
    // Verify conflict status updated
    await expect(page.getByText('Status: Resolved')).toBeVisible();
    
    // Verify conflict count decremented
    await expect(page.getByText('1 medication conflict remaining')).toBeVisible();
  });

  test('TC-UC-010-EC-001: No Conflicts Detected for Patient', async ({ page }) => {
    // Navigate to patient profile with no conflicts
    await page.goto('/staff/patient-profile/PAT-002');
    
    // Verify medications section
    await expect(patientProfilePage.medicationsSection).toBeVisible();
    await expect(page.getByText('Current Medications (3)')).toBeVisible();
    
    // Verify no conflicts message
    await expect(page.getByText('No medication conflicts detected')).toBeVisible();
    
    // Verify positive status indicator
    await expect(page.getByRole('status', { name: 'All Clear' })).toBeVisible();
    
    // Verify timestamp
    await expect(page.getByText(/Last checked:/)).toBeVisible();
  });

  test('TC-UC-010-ER-001: Conflict Detection Fails Due to Missing Medication Data', async ({ page }) => {
    // Navigate to patient with incomplete data
    await page.goto('/staff/patient-profile/PAT-003');
    
    // Verify medications section
    await expect(patientProfilePage.medicationsSection).toBeVisible();
    
    // Verify incomplete data message
    await expect(page.getByText('Medication data incomplete')).toBeVisible();
    
    // Verify warning alert
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Unable to perform conflict detection. Please complete medication history.')).toBeVisible();
    
    // Verify add medications button available
    await expect(patientProfilePage.addMedicationsButton).toBeVisible();
  });

  test('TC-UC-010-EC-002: High Severity Conflict Triggers Immediate Alert', async ({ page }) => {
    // Navigate to patient with critical conflict
    await page.goto('/staff/patient-profile/PAT-004');
    
    // Verify critical conflict modal appears
    await expect(patientProfilePage.criticalConflictDialog).toBeVisible();
    
    // Verify critical alert message
    await expect(page.getByText('CRITICAL: High-risk medication interaction detected')).toBeVisible();
    
    // Verify conflict details
    await expect(page.getByText('Warfarin + Aspirin + Clopidogrel: Extreme bleeding risk')).toBeVisible();
    
    // Verify severity highlighted
    await expect(page.getByText('Severity: Critical')).toHaveCSS('color', /red/i);
    
    // Verify recommendation
    await expect(page.getByText('Immediate physician consultation required')).toBeVisible();
    
    // Acknowledge alert
    await patientProfilePage.acknowledgeButton.click();
    
    // Verify acknowledgment logged
    await expect(page.getByText(/Critical conflict acknowledged by/)).toBeVisible();
  });

  test('TC-UC-010-ER-002: Conflict Detection Service Unavailable', async ({ page }) => {
    // Navigate to patient profile when service is down
    await page.goto('/staff/patient-profile/PAT-005');
    
    // Verify medications section
    await expect(patientProfilePage.medicationsSection).toBeVisible();
    
    // Verify service error alert
    await expect(page.getByRole('alert', { name: 'Service Error' })).toBeVisible();
    await expect(page.getByText('Conflict detection service is temporarily unavailable')).toBeVisible();
    
    // Verify fallback instruction
    await expect(page.getByText('Please manually review medications for potential interactions or try again later.')).toBeVisible();
    
    // Verify retry button available
    await expect(patientProfilePage.retryDetectionButton).toBeVisible();
    
    // Verify manual review option
    await expect(patientProfilePage.manualReviewButton).toBeVisible();
  });
});
