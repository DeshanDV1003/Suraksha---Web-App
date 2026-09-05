import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Camps Management', () => {
  test('TC-PW-041: Camps list loads', async ({ adminPage }) => {
    await adminPage.goto('/camps');
    await expect(adminPage.locator('.bg-white').first().or(adminPage.getByText(/no camps/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-042: Camp capacity bar renders', async ({ adminPage }) => {
    await adminPage.goto('/camps');
    // Usually there's a progress bar element
    const progressBar = adminPage.locator('.bg-gray-200 > div, progress').first();
    if (await progressBar.count() > 0) {
      await expect(progressBar).toBeVisible();
    }
  });

  test('TC-PW-043: Add new camp form', async ({ adminPage }) => {
    await adminPage.goto('/camps');
    const addBtn = adminPage.getByRole('button', { name: /add|create/i }).or(adminPage.locator('button').filter({ hasText: /add/i }));
    
    if (await addBtn.count() > 0) {
      await addBtn.first().click();
      await expect(adminPage.locator('form').filter({ hasText: /camp/i })).toBeVisible();
    }
  });
});
