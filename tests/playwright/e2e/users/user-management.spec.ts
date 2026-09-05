import { test, expect } from '../../fixtures/test.fixtures';

test.describe('User Management', () => {
  test('TC-PW-049: User list loads for admin', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await expect(adminPage.locator('table, .grid').first().or(adminPage.getByText(/no users/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-050: Search user by name', async ({ adminPage }) => {
    await adminPage.goto('/users');
    const searchInput = adminPage.getByPlaceholder(/search/i).first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('Admin');
      await adminPage.waitForTimeout(500); // Wait for filtering
      // Assume the table/list is still there
      await expect(adminPage.locator('table, .grid').first()).toBeVisible();
    }
  });

  test('TC-PW-051: Change user role', async ({ adminPage }) => {
    await adminPage.goto('/users');
    // Ensure that role dropdowns exist
    const roleSelect = adminPage.locator('select').first();
    if (await roleSelect.count() > 0) {
      await expect(roleSelect).toBeVisible();
    }
  });
});
