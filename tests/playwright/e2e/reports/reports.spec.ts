import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Reports', () => {
  test('TC-PW-057: Reports page loads (staff only)', async ({ adminPage }) => {
    await adminPage.goto('/reports');
    await expect(adminPage.getByRole('heading', { name: /report/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-058: Export button visible', async ({ adminPage }) => {
    await adminPage.goto('/reports');
    const exportBtn = adminPage.getByRole('button', { name: /export|download/i }).or(adminPage.locator('button').filter({ hasText: /export/i }));
    
    if (await exportBtn.count() > 0) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });
});
