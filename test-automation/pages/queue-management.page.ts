import { Page, Locator } from '@playwright/test';

export class QueueManagementPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get addWalkinButton(): Locator {
    return this.page.getByRole('button', { name: 'Add Walk-in Patient' });
  }

  get patientNameInput(): Locator {
    return this.page.getByLabel('Patient Name');
  }

  get dateOfBirthInput(): Locator {
    return this.page.getByLabel('Date of Birth');
  }

  get reasonForVisitInput(): Locator {
    return this.page.getByLabel('Reason for Visit');
  }

  get addToQueueButton(): Locator {
    return this.page.getByRole('button', { name: 'Add to Queue' });
  }

  get markArrivedButton(): Locator {
    return this.page.getByRole('button', { name: 'Mark as Arrived' });
  }

  get markInProgressButton(): Locator {
    return this.page.getByRole('button', { name: 'Mark as In Progress' });
  }

  get markCompletedButton(): Locator {
    return this.page.getByRole('button', { name: 'Mark as Completed' });
  }

  get markNoShowButton(): Locator {
    return this.page.getByRole('button', { name: 'Mark as No Show'});
  }

  get confirmButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get confirmNoShowButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm No Show' });
  }

  get noShowReasonInput(): Locator {
    return this.page.getByLabel('Reason (Optional)');
  }

  get searchPatientInput(): Locator {
    return this.page.getByLabel('Search Patient ID');
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search' });
  }

  get successMessage(): Locator {
    return this.page.getByText(/successfully/);
  }

  get errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  async addWalkinPatient(name: string, dob: string, reason: string): Promise<void> {
    await this.addWalkinButton.click();
    await this.patientNameInput.fill(name);
    await this.dateOfBirthInput.fill(dob);
    await this.reasonForVisitInput.fill(reason);
    await this.addToQueueButton.click();
  }

  async markPatientArrived(patientName: string): Promise<void> {
    await this.page.getByRole('row', { name: new RegExp(patientName) }).click();
    await this.markArrivedButton.click();
    await this.confirmButton.click();
  }

  async updateStatusToInProgress(patientName: string): Promise<void> {
    await this.page.getByRole('row', { name: new RegExp(patientName) }).click();
    await this.markInProgressButton.click();
    await this.confirmButton.click();
  }

  async markAppointmentCompleted(patientName: string): Promise<void> {
    await this.page.getByRole('row', { name: new RegExp(patientName) }).click();
    await this.markCompletedButton.click();
    await this.confirmButton.click();
  }

  async markPatientNoShow(patientName: string, reason?: string): Promise<void> {
    await this.page.getByRole('row', { name: new RegExp(patientName) }).click();
    await this.markNoShowButton.click();
    if (reason) {
      await this.noShowReasonInput.fill(reason);
    }
    await this.confirmNoShowButton.click();
  }
}
