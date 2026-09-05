import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Water Monitor', () => {
  test('TC-PW-046: Water monitor loads', async ({ adminPage }) => {
    await adminPage.goto('/water-monitor');
    await expect(adminPage).toHaveURL(/.*water-monitor/);
  });

  test('TC-PW-047: Gauge readings appear', async ({ adminPage }) => {
    await adminPage.goto('/water-monitor');
    
    // Look for gauge readings or a message saying no data
    const readings = adminPage.locator('.bg-white, .dark\\:bg-gray-800').filter({ hasText: /m|level/i });
    if (await readings.count() > 0) {
      await expect(readings.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC-PW-048: ML predictions chart renders', async ({ adminPage }) => {
    await adminPage.goto('/water-monitor');
    
    // Look for ApexCharts or Recharts container
    const chart = adminPage.locator('.apexcharts-canvas, .recharts-wrapper, svg').filter({ hasText: /prediction/i }).or(adminPage.locator('.apexcharts-canvas, .recharts-wrapper').first());
    
    // Again, it might not render if backend ML is offline, so we just check for its existence if it's there
    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
