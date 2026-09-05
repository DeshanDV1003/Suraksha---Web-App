import { test, expect } from '../../fixtures/test.fixtures';
import { HospitalPage } from '../../pages/HospitalPage.pom';

test.describe('Dashboard - Hospital', () => {
  test('TC-PW-054: Hospital dashboard loads at /hospital', async ({ hospitalPage }) => {
    const page = new HospitalPage(hospitalPage);
    await page.goto();
    await page.expectDashboardLoaded();
    await expect(hospitalPage).toHaveURL(/.*hospital/);
  });

  test('TC-PW-055: Referrals page loads', async ({ hospitalPage }) => {
    await hospitalPage.goto('/hospital/referrals');
    await expect(hospitalPage.getByRole('heading', { name: /referral/i }).first()).toBeVisible();
  });

  test('TC-PW-056: Capacity page loads', async ({ hospitalPage }) => {
    await hospitalPage.goto('/hospital/capacity');
    await expect(hospitalPage.getByRole('heading', { name: /capacity|beds/i }).first()).toBeVisible();
  });
});
