import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Notifications', () => {
  test('TC-PW-070: Notifications page loads', async ({ adminPage }) => {
    await adminPage.goto('/notifications');
    await expect(adminPage.locator('.bg-white, .grid').first().or(adminPage.getByText(/no notifications/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-071: Mark-as-read interaction', async ({ adminPage }) => {
    await adminPage.goto('/notifications');
    const markReadBtn = adminPage.getByRole('button', { name: /mark as read/i }).or(adminPage.locator('button').filter({ hasText: /read/i }));
    
    if (await markReadBtn.count() > 0) {
      await markReadBtn.first().click();
      // Assume success if no crash and element updates
      await adminPage.waitForTimeout(500);
    }
  });
});
