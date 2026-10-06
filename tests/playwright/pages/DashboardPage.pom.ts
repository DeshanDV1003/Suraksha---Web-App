import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly statsCards: Locator;
  readonly sidebarLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    // Stable hook — see DashboardPage.tsx mainStats.map(...)
    this.statsCards = page.getByTestId('dashboard-stat-card');
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
