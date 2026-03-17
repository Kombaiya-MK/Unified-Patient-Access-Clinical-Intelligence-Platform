import { Page, Locator } from '@playwright/test';

export class PatientDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get welcomeHeading(): Locator {
    return this.page.getByRole('heading', { name: /Welcome/ });
  }

  get upcomingAppointmentsSection(): Locator {
    return this.page.getByRole('region', { name: 'Upcoming Appointments' });
  }

  get quickActionsPanel(): Locator {
    return this.page.getByRole('region', { name: 'Quick Actions' });
  }

  get notificationsPanel(): Locator {
    return this.page.getByRole('region', { name: 'Notifications' });
  }

  get bookAppointmentLink(): Locator {
    return this.page.getByRole('link', { name: 'Book Appointment' });
  }

  get uploadDocumentsLink(): Locator {
    return this.page.getByRole('link', { name: 'Upload Documents' });
  }

  get completeIntakeLink(): Locator {
    return this.page.getByRole('link', { name: 'Complete Intake Now' });
  }

  get viewAllNotificationsButton(): Locator {
    return this.page.getByRole('button', { name: 'View All Notifications' });
  }

  get notificationBadge(): Locator {
    return this.page.getByText(/Badge:/);
  }

  get dismissNotificationButton(): Locator {
    return this.page.getByRole('button', { name: 'Dismiss' });
  }

  get noAppointmentsMessage(): Locator {
    return this.page.getByText('You have no upcoming appointments.');
  }

  get sessionExpiredDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Session Expired' });
  }

  async navigateToBookAppointment(): Promise<void> {
    await this.bookAppointmentLink.click();
  }

  async navigateToUploadDocuments(): Promise<void> {
    await this.uploadDocumentsLink.click();
  }

  async viewNotifications(): Promise<void> {
    await this.viewAllNotificationsButton.click();
  }
}
