import { Page, Locator } from '@playwright/test';

export class AppointmentBookingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get appointmentTypeSelect(): Locator {
    return this.page.getByLabel('Appointment Type');
  }

  get preferredDatePicker(): Locator {
    return this.page.getByLabel('Preferred Date');
  }

  get searchSlotsButton(): Locator {
    return this.page.getByRole('button', { name: 'Search Available Slots' });
  }

  get confirmBookingButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Booking' });
  }

  get successMessage(): Locator {
    return this.page.getByText('Appointment booked successfully');
  }

  get errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  get waitlistButton(): Locator {
    return this.page.getByRole('button', { name: /Join Waitlist/ });
  }

  async bookAppointment(type: string, date: string, time: string): Promise<void> {
    await this.appointmentTypeSelect.selectOption(type);
    await this.preferredDatePicker.fill(date);
    await this.searchSlotsButton.click();
    await this.page.getByRole('button', { name: time }).click();
    await this.confirmBookingButton.click();
  }
}
