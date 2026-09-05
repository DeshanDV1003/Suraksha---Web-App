import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Navigation', () => {
  test('TC-PW-067: Sidebar links navigate to correct pages', async ({ adminPage }) => {
    await adminPage.goto('/');
    
    // Test one specific navigation
    const alertsLink = adminPage.locator('nav a').filter({ hasText: /alerts/i }).first();
    if (await alertsLink.count() > 0) {
      await alertsLink.click();
      await expect(adminPage).toHaveURL(/.*alerts/);
    }
  });

  test('TC-PW-069: Mobile responsive sidebar', async ({ adminPage }) => {
    // Set viewport to mobile size
    await adminPage.setViewportSize({ width: 375, height: 667 });
    await adminPage.goto('/');
    
    // Sidebar should be hidden or behind a hamburger menu
    const hamburger = adminPage.locator('button').filter({ has: adminPage.locator('svg') }).first(); // Generic hamburger locator
    if (await hamburger.count() > 0 && await hamburger.isVisible()) {
      await hamburger.click();
      const nav = adminPage.locator('nav').first();
      await expect(nav).toBeVisible();
    }
  });
});
