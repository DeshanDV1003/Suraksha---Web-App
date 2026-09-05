import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Family Safety', () => {
  test('TC-PW-061: Family safety page loads', async ({ citizenPage }) => {
    await citizenPage.goto('/family-safety');
    await expect(citizenPage).toHaveURL(/.*family-safety/);
  });

  test('TC-PW-062: Family member list visible', async ({ citizenPage }) => {
    await citizenPage.goto('/family-safety');
    await expect(citizenPage.locator('.bg-white, .grid').first().or(citizenPage.getByText(/no family members/i).first())).toBeVisible({ timeout: 10000 });
  });
});
