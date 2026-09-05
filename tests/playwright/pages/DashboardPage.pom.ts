import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly statsCards: Locator;
  readonly sidebarLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    // Targeting typical stats cards in the dashboard
    this.statsCards = page.locator('.bg-white, .dark\\:bg-gray-800').filter({ hasText: /Total/i });
    this.sidebarLinks = page.locator('nav a');
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectStatsLoaded() {
    // Wait for at least one stats card to be visible
    await expect(this.statsCards.first()).toBeVisible({ timeout: 15000 });
  }
}
