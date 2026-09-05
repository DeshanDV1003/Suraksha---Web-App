import { Page, Locator, expect } from '@playwright/test';

export class HospitalPage {
  readonly page: Page;
  readonly sidebarLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebarLinks = page.locator('nav a');
  }

  async goto() {
    await this.page.goto('/hospital');
  }

  async expectDashboardLoaded() {
    await expect(this.page.locator('text=Hospital')).toBeVisible({ timeout: 10000 });
  }
}
