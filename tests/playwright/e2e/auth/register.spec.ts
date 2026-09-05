import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Authentication - Register', () => {
  test('TC-PW-008: Registration form loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /register|sign up/i }).first()).toBeVisible();
  });

  test('TC-PW-009: Duplicate email shows error', async ({ page }) => {
    await page.goto('/register');
    // Assuming standard fields
    await page.locator('input[type="text"], input[name="name"]').first().fill('Test User');
    await page.locator('input[type="email"], input[name="email"]').first().fill(process.env.CITIZEN_EMAIL || 'testload@suraksha.lk');
    await page.locator('input[type="password"], input[name="password"]').first().fill('Password@123');
    await page.locator('button[type="submit"]').click();
    
    // Should show error about existing user
    await expect(page.getByText(/already exists|in use/i).first()).toBeVisible({ timeout: 5000 });
  });

  // Role-based redirect (TC-PW-010) is complex without creating a new user each time.
  // We'll skip dynamic creation here to avoid polluting DB in simple tests.
});
