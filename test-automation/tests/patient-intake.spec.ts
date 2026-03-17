import { test, expect } from '@playwright/test';
import { PatientIntakePage } from '../pages/patient-intake.page';

test.describe('Patient Intake', () => {
  let patientIntakePage: PatientIntakePage;

  test.beforeEach(async ({ page }) => {
    patientIntakePage = new PatientIntakePage(page);
  });

  test('TC-UC-002-HP-001: Complete AI-Assisted Intake', async ({ page }) => {
    // Navigate to intake page
    await page.goto('/intake/start');
    await expect(page).toHaveURL(/intake\/start/);

    // Start AI-assisted intake
    await patientIntakePage.aiIntakeButton.click();
    
    // Verify AI greeting
    await expect(page.getByText('Hello! I will help you complete your intake.')).toBeVisible();
    
    // Enter first response
    await patientIntakePage.chatInput.fill('I have had a persistent cough for 3 weeks');
    await patientIntakePage.sendButton.click();
    
    // Verify follow-up question
    await expect(page.getByText(/How severe/)).toBeVisible();
    
    // Enter second response
    await patientIntakePage.chatInput.fill('Moderate, worse at night');
    await patientIntakePage.sendButton.click();
    
    // Complete intake
    await patientIntakePage.completeIntakeButton.click();
    
    // Verify success message
    await expect(page.getByText('Intake completed successfully')).toBeVisible();
    await expect(page.getByText('Your responses have been saved')).toBeVisible();
  });

  test('TC-UC-002-HP-002: Complete Manual Form Intake', async ({ page }) => {
    // Navigate to intake page
    await page.goto('/intake/start');
    
    // Use manual form
    await patientIntakePage.manualFormButton.click();
    
    // Fill out manual form
    await patientIntakePage.chiefComplaintInput.fill('Persistent cough for 3 weeks');
    await patientIntakePage.durationInput.fill('21');
    await patientIntakePage.severitySelect.selectOption('Moderate');
    await patientIntakePage.additionalNotesTextarea.fill('Worse at night, no fever');
    
    // Submit intake
    await patientIntakePage.submitButton.click();
    
    // Verify success message
    await expect(page.getByText('Intake completed successfully')).toBeVisible();
  });

  test('TC-UC-002-EC-001: Switch from AI to Manual Mid-Process', async ({ page }) => {
    // Navigate to intake page
    await page.goto('/intake/start');
    
    // Start AI-assisted intake
    await patientIntakePage.aiIntakeButton.click();
    
    // Enter initial response
    await patientIntakePage.chatInput.fill('I have a headache');
    await patientIntakePage.sendButton.click();
    
    // Switch to manual form
    await patientIntakePage.switchToManualButton.click();
    
    // Confirm switch
    await expect(page.getByText('Your progress will be saved. Continue?')).toBeVisible();
    await page.getByRole('button', { name: 'Yes, Switch' }).click();
    
    // Verify manual form loads with saved data
    await expect(patientIntakePage.chiefComplaintInput).toHaveValue('I have a headache');
    
    // Complete remaining fields
    await patientIntakePage.durationInput.fill('2');
    
    // Submit intake
    await patientIntakePage.submitButton.click();
    
    // Verify success
    await expect(page.getByText('Intake completed successfully')).toBeVisible();
  });

  test('TC-UC-002-ER-001: Incomplete Intake Submission Blocked', async ({ page }) => {
    // Navigate to intake page
    await page.goto('/intake/start');
    
    // Use manual form
    await patientIntakePage.manualFormButton.click();
    
    // Leave chief complaint empty
    await patientIntakePage.chiefComplaintInput.fill('');
    
    // Attempt to submit
    await patientIntakePage.submitButton.click();
    
    // Verify validation error
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Chief Complaint is required')).toBeVisible();
    
    // Verify error styling on field
    await expect(patientIntakePage.chiefComplaintInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-UC-002-EC-002: Switch from Manual to AI Mid-Process', async ({ page }) => {
    // Navigate to intake page
    await page.goto('/intake/start');
    
    // Start with manual form
    await patientIntakePage.manualFormButton.click();
    
    // Fill chief complaint
    await patientIntakePage.chiefComplaintInput.fill('Fever and chills');
    
    // Switch to AI-assisted
    await patientIntakePage.switchToAIButton.click();
    
    // Confirm switch
    await page.getByRole('button', { name: 'Yes, Switch' }).click();
    
    // Verify AI acknowledges previous data
    await expect(page.getByText('I see you mentioned: Fever and chills. Let me ask you a few more questions.')).toBeVisible();
    
    // Verify AI continues intake
    await expect(page.getByText('How long have you had these symptoms?')).toBeVisible();
  });
});
