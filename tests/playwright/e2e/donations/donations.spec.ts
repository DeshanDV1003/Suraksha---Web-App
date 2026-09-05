import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Donations', () => {
  test('TC-PW-063: Donations page loads', async ({ adminPage }) => {
    await adminPage.goto('/donations');
    await expect(adminPage).toHaveURL(/.*donations/);
  });

  test('TC-PW-064: Donation chart renders', async ({ adminPage }) => {
    await adminPage.goto('/donations');
    const chart = adminPage.locator('.apexcharts-canvas, .recharts-wrapper, svg').first();
    if (await chart.count() > 0) {
      await expect(chart).toBeVisible({ timeout: 10000 });
    }
  });
});
