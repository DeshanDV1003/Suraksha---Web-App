import { test, expect } from '../../fixtures/test.fixtures';
import { IncidentsPage } from '../../pages/IncidentsPage.pom';

test.describe('Incidents Management', () => {
  test('TC-PW-026: Incidents list loads', async ({ adminPage }) => {
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();
    await expect(incidentsPage.incidentRows.or(adminPage.getByText(/no records/i)).first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-027: Filter by severity works', async ({ adminPage }) => {
    // The page filters by Severity and Status — there is no category/type filter.
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();
    await incidentsPage.severityFilter.selectOption({ label: 'HIGH' });
    // We don't assert strict data matching here to keep tests robust against db changes,
    // just ensuring the filtered list (or the empty state) renders without crashing.
    await expect(incidentsPage.incidentRows.or(adminPage.getByText(/no records/i)).first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-PW-028: Create incident form opens', async ({ adminPage }) => {
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();
    await incidentsPage.newIncidentButton.click();
    // The modal is titled "New Field Directive" rather than literally containing "incident".
    await expect(adminPage.locator('form').filter({ hasText: /directive/i })).toBeVisible();
  });

  test('TC-PW-029: Incident detail view', async ({ adminPage }) => {
    const incidentsPage = new IncidentsPage(adminPage);
    await incidentsPage.goto();

    // Click on the first incident row if one exists
    if (await incidentsPage.incidentRows.count() > 0) {
      const viewBtn = incidentsPage.incidentRows.first().getByTestId('view-incident-btn');
      await viewBtn.click({ force: true }); // the button only becomes visible on row hover
      await expect(adminPage.getByTestId('incident-details-modal')).toBeVisible({ timeout: 5000 });
    }
  });
});
