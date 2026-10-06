import { Page, Locator } from '@playwright/test';

export class AlertsPage {
  readonly page: Page;
  /** The broadcast composer is an always-visible form for ADMIN/DMC_OFFICER —
   * there is no "open a dialog" step, unlike most other create-record pages. */
  readonly alertComposer: Locator;
  readonly titleInput: Locator;
  readonly submitButton: Locator;
  readonly alertList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.alertComposer = page.locator('#alert-composer');
    this.titleInput = page.getByTestId('alert-title-input');
    this.submitButton = this.alertComposer.getByRole('button').last();
    this.alertList = page.getByTestId('alert-card').first();
  }

  async goto() {
    await this.page.goto('/suraksha-alerts');
  }
}
