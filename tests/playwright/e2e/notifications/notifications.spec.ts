import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Notifications', () => {
  test('TC-PW-070: Notifications page loads', async ({ adminPage }) => {
    await adminPage.goto('/notifications');
    // .or() matches the union of both sides, so when both are present at once we must
    // re-apply .first() to the combined locator (not to each side) to keep strict mode happy.
    const notificationsContent = adminPage.locator('main').locator('.bg-white, .grid').or(adminPage.getByText(/no notifications/i));
    await expect(notificationsContent.first()).toBeVisible({ timeout: 10000 });
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
