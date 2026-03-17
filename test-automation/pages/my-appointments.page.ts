import { Page, Locator } from '@playwright/test';

export class MyAppointmentsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get appointmentList(): Locator {
    return this.page.getByRole('list', { name: 'My Appointments' });
  }

  get rescheduleButton(): Locator {
    return this.page.getByRole('button', { name: 'Reschedule' });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel Appointment' });
  }

  async viewAppointments(): Promise<void> {
    await this.page.goto('/appointments/my-appointments');
  }
}
