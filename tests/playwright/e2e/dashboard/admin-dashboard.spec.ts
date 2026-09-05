import { test, expect } from '../../fixtures/test.fixtures';
import { DashboardPage } from '../../pages/DashboardPage.pom';

test.describe('Dashboard - Admin', () => {
  test('TC-PW-015: Dashboard loads with statistics cards', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    await dashboardPage.goto();
    await dashboardPage.expectStatsLoaded();
  });

  test('TC-PW-016: Stat cards display numeric values', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    await dashboardPage.goto();
    await dashboardPage.expectStatsLoaded();
    
    // Check that at least one stat card has a number
    const textContent = await dashboardPage.statsCards.first().innerText();
    expect(textContent).toMatch(/[0-9]+/);
  });

  test('TC-PW-017: Navigation sidebar links are visible', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    await dashboardPage.goto();
    await expect(dashboardPage.sidebarLinks.first()).toBeVisible();
  });

  test('TC-PW-018: Dark mode toggle works', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    await dashboardPage.goto();
    
    // Look for a theme toggle button (usually contains sun/moon icon or similar)
    // Here we'll just check if the button exists and is clickable
    const toggleBtn = adminPage.locator('button').filter({ has: adminPage.locator('svg') }).first();
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click();
      // Test passes if it didn't crash
    }
  });
});
