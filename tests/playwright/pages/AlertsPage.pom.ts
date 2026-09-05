import { Page, Locator, expect } from '@playwright/test';

export class AlertsPage {
  readonly page: Page;
  readonly newAlertButton: Locator;
  readonly alertForm: Locator;
  readonly titleInput: Locator;
  readonly submitButton: Locator;
  readonly alertList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newAlertButton = page.getByRole('button', { name: /new alert|create alert/i });
    this.alertForm = page.locator('form').filter({ hasText: /alert/i });
    this.titleInput = page.getByPlaceholder(/title/i).first();
    this.submitButton = page.getByRole('button', { name: /submit|create/i });
    this.alertList = page.locator('.alert-card, [role="listitem"]').first();
  }

  async goto() {
    await this.page.goto('/suraksha-alerts');
  }

  async clickNewAlert() {
    await this.newAlertButton.first().click();
  }
}
