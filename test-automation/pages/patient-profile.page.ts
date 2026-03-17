import { Page, Locator } from '@playwright/test';

export class PatientProfilePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get medicationsSection(): Locator {
    return this.page.getByRole('region', { name: 'Medications' });
  }

  get conflictAlert(): Locator {
    return this.page.getByRole('alert', { name: 'Conflict Warning' });
  }

  get viewConflictsButton(): Locator {
    return this.page.getByRole('button', { name: 'View Conflicts' });
  }

  get conflictDetailsPanel(): Locator {
    return this.page.getByRole('region', { name: 'Conflict Details' });
  }

  get resolveConflictButton(): Locator {
    return this.page.getByRole('button', { name: 'Resolve Conflict' });
  }

  get resolutionActionInput(): Locator {
    return this.page.getByLabel('Resolution Action');
  }

  get staffNotesInput(): Locator {
    return this.page.getByLabel('Staff Notes');
  }

  get saveResolutionButton(): Locator {
    return this.page.getByRole('button', { name: 'Save Resolution' });
  }

  get criticalConflictDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Critical Conflict Alert' });
  }

  get acknowledgeButton(): Locator {
    return this.page.getByRole('button', { name: 'Acknowledge and Review' });
  }

  get addMedicationsButton(): Locator {
    return this.page.getByRole('button', { name: 'Add Medications' });
  }

  get retryDetectionButton(): Locator {
    return this.page.getByRole('button', { name: 'Retry Conflict Detection' });
  }

  get manualReviewButton(): Locator {
    return this.page.getByRole('button', { name: 'Manual Review' });
  }

  async viewConflictDetails(): Promise<void> {
    await this.viewConflictsButton.click();
  }

  async resolveConflict(conflictId: string, action: string, notes: string): Promise<void> {
    await this.resolveConflictButton.click();
    await this.resolutionActionInput.fill(action);
    await this.staffNotesInput.fill(notes);
    await this.saveResolutionButton.click();
  }

  async acknowledgeCriticalConflict(): Promise<void> {
    await this.acknowledgeButton.click();
  }

  async retryConflictDetection(): Promise<void> {
    await this.retryDetectionButton.click();
  }
}
