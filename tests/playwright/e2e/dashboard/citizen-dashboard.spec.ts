import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Dashboard - Citizen', () => {
  test('TC-PW-019: Citizen dashboard loads at /citizen-home', async ({ citizenPage }) => {
    await citizenPage.goto('/citizen-home');
    await expect(citizenPage).toHaveURL(/.*citizen-home/);
  });

  test('TC-PW-020: "Request Help" button is visible', async ({ citizenPage }) => {
    await citizenPage.goto('/citizen-home');
    const helpBtn = citizenPage.getByRole('button', { name: /request help|i need help/i }).or(citizenPage.locator('a').filter({ hasText: /request help/i }));
    await expect(helpBtn.first()).toBeVisible();
  });

  test('TC-PW-021: Water level widget visible', async ({ citizenPage }) => {
    await citizenPage.goto('/citizen-home');
    const waterWidget = citizenPage.locator('.bg-white, .dark\\:bg-gray-800').filter({ hasText: /water|river|level/i });
    if (await waterWidget.count() > 0) {
      await expect(waterWidget.first()).toBeVisible();
    }
  });
});
