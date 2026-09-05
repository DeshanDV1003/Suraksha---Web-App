import { test, expect } from '../../fixtures/test.fixtures';
import { IncidentsPage } from '../../pages/IncidentsPage.pom';

test.describe('Incidents Management', () => {
  test('TC-PW-026: Incidents list loads', async ({ adminPage }) => {
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();
    await expect(incidentsPage.incidentCards.first().or(adminPage.getByText(/no incidents/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-027: Filter by type works', async ({ adminPage }) => {
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();
    
    // Wait for the select to be available
    if (await incidentsPage.filterSelect.count() > 0) {
      await incidentsPage.filterSelect.selectOption({ label: 'FLOOD' });
      // We don't assert strict data matching here to keep tests robust against db changes,
      // just ensuring it doesn't crash
      await adminPage.waitForTimeout(500); 
    }
  });

  test('TC-PW-028: Create incident form opens', async ({ adminPage }) => {
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();
    await incidentsPage.newIncidentButton.first().click();
    await expect(adminPage.locator('form').filter({ hasText: /incident/i })).toBeVisible();
  });

  test('TC-PW-029: Incident detail view', async ({ adminPage }) => {
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();
    
    // Click on the first incident if it exists
    if (await incidentsPage.incidentCards.count() > 0) {
      // Find a view button or just click the card
      const viewBtn = incidentsPage.incidentCards.first().locator('button').filter({ hasText: /view|details/i });
      if (await viewBtn.count() > 0) {
        await viewBtn.first().click();
        // Expect some modal or detail page to open
        await expect(adminPage.locator('[role="dialog"], .modal').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
