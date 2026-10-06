import { Page, Locator } from '@playwright/test';

export class IncidentsPage {
  readonly page: Page;
  readonly newIncidentButton: Locator;
  /** The page only filters by Severity and Status (there is no category/type filter). */
  readonly severityFilter: Locator;
  readonly statusFilter: Locator;
  readonly incidentRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newIncidentButton = page.getByRole('button', { name: /register new incident/i });
    const selects = page.locator('.suraksha-card select');
    this.severityFilter = selects.nth(0);
    this.statusFilter = selects.nth(1);
    this.incidentRows = page.getByTestId('incident-row');
  }

  async goto() {
    await this.page.goto('/incidents');
  }
}
