import { Page, expect } from '@playwright/test';

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function waitForToast(page: Page, text?: string) {
  if (text) {
    await expect(page.locator('.go3958317564, .go2072408551, [role="status"]').filter({ hasText: text }).first()).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.locator('.go3958317564, .go2072408551, [role="status"]').first()).toBeVisible({ timeout: 10000 });
  }
}

export async function waitForMapLoad(page: Page) {
  // Wait for the leaflet container to be visible
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 });
  // Wait for at least one tile to load (or tile-pane)
  await expect(page.locator('.leaflet-tile-loaded, .leaflet-tile-pane').first()).toBeVisible({ timeout: 15000 });
}
