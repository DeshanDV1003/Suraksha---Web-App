import { Page, Locator } from '@playwright/test';

export class PublicPortal {
  readonly page: Page;
  readonly requestHelpLink: Locator;
  readonly missingPortalLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.requestHelpLink = page.getByRole('link', { name: /request help/i });
    this.missingPortalLink = page.getByRole('link', { name: /missing persons/i });
  }

  async gotoRequestHelp() {
    await this.page.goto('/request-help');
  }

  async gotoMissingPortal() {
    await this.page.goto('/missing-portal');
  }
}
