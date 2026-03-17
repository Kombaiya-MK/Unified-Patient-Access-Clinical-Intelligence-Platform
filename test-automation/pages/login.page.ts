import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  get passwordInput(): Locator {
    return this.page.getByLabel('Password');
  }

  get loginButton(): Locator {
    return this.page.getByRole('button', { name: 'Log In' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
