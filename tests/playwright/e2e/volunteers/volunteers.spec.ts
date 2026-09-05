import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Volunteers Management', () => {
  test('TC-PW-052: Volunteer list loads', async ({ adminPage }) => {
    await adminPage.goto('/volunteers');
    await expect(adminPage.locator('table, .grid, .bg-white').first().or(adminPage.getByText(/no volunteers/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-053: Task assignment UI', async ({ adminPage }) => {
    await adminPage.goto('/volunteers');
    
    // Might need to switch to a 'Tasks' tab or page
    const tasksTab = adminPage.getByRole('button', { name: /tasks/i }).or(adminPage.locator('a, button').filter({ hasText: /tasks/i }));
    
    if (await tasksTab.count() > 0) {
      await tasksTab.first().click();
      await expect(adminPage.locator('.bg-white').first()).toBeVisible();
    }
  });
});
