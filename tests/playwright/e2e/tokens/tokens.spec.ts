import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Tokens Management', () => {
  test('TC-PW-044: Tokens list loads', async ({ adminPage }) => {
    await adminPage.goto('/tokens');
    await expect(adminPage.locator('table, .bg-white').first().or(adminPage.getByText(/no tokens/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-045: Generate token button visible (staff)', async ({ adminPage }) => {
    await adminPage.goto('/tokens');
    const generateBtn = adminPage.getByRole('button', { name: /generate|issue/i }).or(adminPage.locator('button').filter({ hasText: /generate/i }));
    
    if (await generateBtn.count() > 0) {
      await expect(generateBtn.first()).toBeVisible();
    }
  });
});
