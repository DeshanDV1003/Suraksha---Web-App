import { Page, Locator, expect } from '@playwright/test';

export class MapPage {
  readonly page: Page;
  readonly mapContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mapContainer = page.locator('.leaflet-container');
  }

  async goto() {
    await this.page.goto('/map');
  }

  async expectMapLoaded() {
    await expect(this.mapContainer).toBeVisible({ timeout: 15000 });
  }
}
