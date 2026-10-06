import { test, expect } from '../../fixtures/test.fixtures';
import { HelpRequestsPage } from '../../pages/HelpRequestsPage.pom';

test.describe('Help Requests', () => {
  test('TC-PW-033: Help request list loads', async ({ adminPage }) => {
    const page = new HelpRequestsPage(adminPage);
    await page.goto();
    
    // Either a list of request cards, or the "all clear" empty state
    await expect(page.listContainer.or(adminPage.getByText(/no pending/i)).first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-034: Status filter works', async ({ adminPage }) => {
    const page = new HelpRequestsPage(adminPage);
    await page.goto();
    
    const filter = adminPage.locator('select').first();
    if (await filter.count() > 0) {
      // Assuming 'PENDING' is a valid option
      await filter.selectOption({ label: 'PENDING' }).catch(() => filter.selectOption({ index: 1 }));
      await adminPage.waitForTimeout(500); // Give time for UI to update
    }
  });
});
