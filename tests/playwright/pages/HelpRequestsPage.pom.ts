import { Page, Locator } from '@playwright/test';

export class HelpRequestsPage {
  readonly page: Page;
  readonly listContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listContainer = page.getByTestId('help-request-card');
  }

  async goto() {
    await this.page.goto('/help-requests');
  }
}
