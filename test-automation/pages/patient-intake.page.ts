import { Page, Locator } from '@playwright/test';

export class PatientIntakePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get aiIntakeButton(): Locator {
    return this.page.getByRole('button', { name: 'Start AI-Assisted Intake' });
  }

  get manualFormButton(): Locator {
    return this.page.getByRole('button', { name: 'Use Manual Form' });
  }

  get switchToManualButton(): Locator {
    return this.page.getByRole('button', { name: 'Switch to Manual Form' });
  }

  get switchToAIButton(): Locator {
    return this.page.getByRole('button', { name: 'Switch to AI-Assisted Intake' });
  }

  get chatInput(): Locator {
    return this.page.getByLabel('Type your response');
  }

  get sendButton(): Locator {
    return this.page.getByRole('button', { name: 'Send' });
  }

  get chiefComplaintInput(): Locator {
    return this.page.getByLabel('Chief Complaint');
  }

  get durationInput(): Locator {
    return this.page.getByLabel('Duration (days)');
  }

  get severitySelect(): Locator {
    return this.page.getByLabel('Severity');
  }

  get additionalNotesTextarea(): Locator {
    return this.page.getByLabel('Additional Notes');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit Intake' });
  }

  get completeIntakeButton(): Locator {
    return this.page.getByRole('button', { name: 'Complete Intake' });
  }

  get successMessage(): Locator {
    return this.page.getByText('Intake completed successfully');
  }

  get errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  async startAIIntake(): Promise<void> {
    await this.aiIntakeButton.click();
  }

  async startManualIntake(): Promise<void> {
    await this.manualFormButton.click();
  }

  async sendAIResponse(message: string): Promise<void> {
    await this.chatInput.fill(message);
    await this.sendButton.click();
  }
}
