import { test, expect } from '../../fixtures/test.fixtures';
import { PublicPortal } from '../../pages/PublicPortal.pom';

test.describe('Missing Persons', () => {
  test('TC-PW-038: Missing persons list loads (Admin)', async ({ adminPage }) => {
    await adminPage.goto('/missing-persons');
    await expect(adminPage.locator('.bg-white').or(adminPage.getByText(/no missing persons/i)).first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-039: Report missing person form', async ({ adminPage }) => {
    await adminPage.goto('/missing-persons');
    const reportBtn = adminPage.getByRole('button', { name: /file new report|report/i });
    await reportBtn.first().click();

    // The modal form has no literal "missing" text inside it, and a generic `form` locator
    // also matches the header's command-palette search form — use the stable testid instead.
    const form = adminPage.getByTestId('missing-person-form');
    await expect(form).toBeVisible();
    await expect(form.locator('input[name="name"]')).toBeVisible();
    await expect(form.locator('input[name="lastSeen"]')).toBeVisible();
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
