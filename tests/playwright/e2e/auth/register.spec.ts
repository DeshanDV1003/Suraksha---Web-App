import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Authentication - Register', () => {
  test('TC-PW-008: Registration form loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /register|sign up/i }).first()).toBeVisible();
  });

  test('TC-PW-009: Duplicate email shows error', async ({ page }) => {
    await page.goto('/register');
    // Full Name and Region/Jurisdiction are both plain text inputs — fill every required field
    // or the browser's native HTML5 validation silently blocks submission.
    await page.locator('input[type="text"]').nth(0).fill('Test User');
    await page.locator('input[type="email"]').fill(process.env.CITIZEN_EMAIL || 'testload@suraksha.lk');
    await page.locator('input[type="tel"]').fill('0771234567');
    await page.locator('input[type="text"]').nth(1).fill('Region 3');
    await page.locator('input[type="password"]').fill('Password@123');
    await page.locator('button[type="submit"]').click();

    // Should show error about existing user
    await expect(page.getByTestId('register-error')).toBeVisible({ timeout: 8000 });
  });

  // Role-based redirect (TC-PW-010) is complex without creating a new user each time.
  // We'll skip dynamic creation here to avoid polluting DB in simple tests.
});
