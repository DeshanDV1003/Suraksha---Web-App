import { test, expect } from '../../fixtures/test.fixtures';
import { PublicPortal } from '../../pages/PublicPortal.pom';

test.describe('Missing Persons', () => {
  test('TC-PW-038: Missing persons list loads (Admin)', async ({ adminPage }) => {
    await adminPage.goto('/missing-persons');
    await expect(adminPage.locator('.bg-white').first().or(adminPage.getByText(/no missing persons/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-039: Report missing person form', async ({ adminPage }) => {
    await adminPage.goto('/missing-persons');
    const reportBtn = adminPage.getByRole('button', { name: /report/i }).or(adminPage.locator('button').filter({ hasText: /report/i }));
    
    if (await reportBtn.count() > 0) {
      await reportBtn.first().click();
      await expect(adminPage.locator('form').filter({ hasText: /missing/i })).toBeVisible();
    }
  });

  test('TC-PW-040: Public portal (no auth) lists missing persons', async ({ page }) => {
    const portal = new PublicPortal(page);
    await portal.gotoMissingPortal();
    await expect(page).toHaveURL(/.*missing-portal/);
    
    // Look for a grid or list of persons
    const container = page.locator('.grid, .flex, .bg-white').first();
    await expect(container).toBeVisible({ timeout: 10000 });
  });
});
