import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"], input#email');
    this.passwordInput = page.locator('input[type="password"], input[name="password"], input#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.text-red-500, .error-message').first();
  }

  async goto() {
    await this.page.goto('/login');
  }

  async fillCredentials(email: string, pass: string) {
    await this.emailInput.first().fill(email);
    await this.passwordInput.first().fill(pass);
  }

  async submit() {
    await this.loginButton.first().click();
  }

  async login(email: string, pass: string) {
    await this.fillCredentials(email, pass);
    await this.submit();
  }
}
