import { Page, Locator } from '@playwright/test';

export class UserManagementPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get createUserButton(): Locator {
    return this.page.getByRole('button', { name: 'Create New User' });
  }

  get fullNameInput(): Locator {
    return this.page.getByLabel('Full Name');
  }

  get emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  get roleSelect(): Locator {
    return this.page.getByLabel('Role');
  }

  get departmentSelect(): Locator {
    return this.page.getByLabel('Department');
  }

  get phoneInput(): Locator {
    return this.page.getByLabel('Phone Number');
  }

  get createUserSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create User' });
  }

  get editUserButton(): Locator {
    return this.page.getByRole('button', { name: 'Edit User' });
  }

  get deactivateUserButton(): Locator {
    return this.page.getByRole('button', { name: 'Deactivate User' });
  }

  get saveChangesButton(): Locator {
    return this.page.getByRole('button', { name: 'Save Changes' });
  }

  get searchUsersInput(): Locator {
    return this.page.getByLabel('Search Users');
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

  get deactivationReasonInput(): Locator {
    return this.page.getByLabel('Reason for Deactivation');
  }

  get confirmDeactivationButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Deactivation' });
  }

  async createUser(name: string, email: string, role: string, department: string, phone: string): Promise<void> {
    await this.createUserButton.click();
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.roleSelect.selectOption(role);
    await this.departmentSelect.selectOption(department);
    await this.phoneInput.fill(phone);
    await this.createUserSubmitButton.click();
  }

  async searchUser(email: string): Promise<void> {
    await this.searchUsersInput.fill(email);
    await this.searchButton.click();
  }

  async updateUserRole(email: string, newRole: string): Promise<void> {
    await this.searchUser(email);
    await this.page.getByRole('row', { name: new RegExp(email) }).click();
    await this.editUserButton.click();
    await this.roleSelect.selectOption(newRole);
    await this.saveChangesButton.click();
  }

  async deactivateUser(email: string, reason: string): Promise<void> {
    await this.page.getByRole('row', { name: new RegExp(email) }).click();
    await this.deactivateUserButton.click();
    await this.deactivationReasonInput.fill(reason);
    await this.confirmDeactivationButton.click();
  }
}
