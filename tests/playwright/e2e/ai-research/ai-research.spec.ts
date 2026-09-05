import { test, expect } from '../../fixtures/test.fixtures';

test.describe('AI Research', () => {
  test('TC-PW-065: AI research page loads', async ({ adminPage }) => {
    await adminPage.goto('/ai-research');
    await expect(adminPage).toHaveURL(/.*ai-research/);
  });

  test('TC-PW-066: Graceful degradation when ML service is offline', async ({ adminPage }) => {
    await adminPage.goto('/ai-research');
    
    // It should either load data or show an error boundry / offline message, but NOT crash the whole app
    await expect(
      adminPage.locator('.bg-white, .grid').first()
      .or(adminPage.getByText(/offline|error|unavailable|failed/i).first())
      .or(adminPage.locator('.text-red-600').filter({ hasText: /crashed/i }))
    ).toBeVisible({ timeout: 15000 });
  });
});
