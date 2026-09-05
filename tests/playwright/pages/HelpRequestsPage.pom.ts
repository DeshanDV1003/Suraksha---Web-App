import { Page, Locator } from '@playwright/test';

export class HelpRequestsPage {
  readonly page: Page;
  readonly listContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listContainer = page.locator('.bg-white.rounded-xl').first();
  }

  async goto() {
    await this.page.goto('/help-requests');
  }
}
