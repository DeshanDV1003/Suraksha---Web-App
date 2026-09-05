import { test, expect } from '../../fixtures/test.fixtures';

test.describe('Authentication - Role Guards', () => {

  test('TC-PW-011: Citizen cannot access /reports (redirects to /citizen-home)', async ({ citizenPage }) => {
    await citizenPage.goto('/reports');
    await citizenPage.waitForURL('**/citizen-home');
    await expect(citizenPage).toHaveURL(/.*citizen-home/);
  });

  test('TC-PW-012: Citizen cannot access /users (redirects to /citizen-home)', async ({ citizenPage }) => {
    await citizenPage.goto('/users');
    await citizenPage.waitForURL('**/citizen-home');
    await expect(citizenPage).toHaveURL(/.*citizen-home/);
  });

  test('TC-PW-013: Hospital staff cannot access admin dashboard (redirects to /hospital)', async ({ hospitalPage }) => {
    await hospitalPage.goto('/');
    await hospitalPage.waitForURL('**/hospital');
    await expect(hospitalPage).toHaveURL(/.*hospital/);
  });

  test('TC-PW-014: Unauthenticated user redirects to /login', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });
});
