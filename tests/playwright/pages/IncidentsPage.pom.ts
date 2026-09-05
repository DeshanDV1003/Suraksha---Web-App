import { Page, Locator, expect } from '@playwright/test';

export class IncidentsPage {
  readonly page: Page;
  readonly newIncidentButton: Locator;
  readonly filterSelect: Locator;
  readonly incidentCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newIncidentButton = page.getByRole('button', { name: /report incident/i }).or(page.locator('button').filter({ hasText: /report/i }));
    this.filterSelect = page.locator('select').first();
    this.incidentCards = page.locator('.bg-white.rounded-xl').first();
  }

  async goto() {
    await this.page.goto('/incidents');
  }
}
