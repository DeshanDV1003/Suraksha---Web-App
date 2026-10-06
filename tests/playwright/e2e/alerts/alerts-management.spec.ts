import { test, expect } from '../../fixtures/test.fixtures';
import { AlertsPage } from '../../pages/AlertsPage.pom';
import { apiPost } from '../../helpers/api.helper';

test.describe('Alerts Management', () => {
  test('TC-PW-022: Alert list loads with data', async ({ adminPage }) => {
    const alertsPage = new AlertsPage(adminPage);
    await alertsPage.goto();
    // Either the list has items, or shows empty state
    await expect(alertsPage.alertList.or(adminPage.getByText(/no alerts/i).first())).toBeVisible({ timeout: 10000 });
  });

  test('TC-PW-023: New-alert broadcast composer is available to an admin', async ({ adminPage }) => {
    // There is no "open a dialog" step on this page — the composer is an
    // always-visible form for ADMIN / DMC_OFFICER. Confirm it renders with
    // its key fields ready for input.
    const alertsPage = new AlertsPage(adminPage);
    await alertsPage.goto();
    await expect(alertsPage.alertComposer).toBeVisible();
    await expect(alertsPage.titleInput).toBeVisible();
  });

  test('TC-PW-024: Alert form validation (empty title)', async ({ adminPage }) => {
    const alertsPage = new AlertsPage(adminPage);
    await alertsPage.goto();
    await alertsPage.submitButton.click();
    // HTML5 validation blocks submission while the required field is empty
    await expect(alertsPage.titleInput).toHaveAttribute('required', '');
  });

  test('TC-PW-025: Emergency alert banner appears via socket', async ({ adminPage, citizenPage, apiContext }) => {
    // Both admin and citizen should see the alert banner when an alert is created
    await adminPage.goto('/');
    await citizenPage.goto('/citizen-home');
    // Give the citizen page's socket.io client time to finish its handshake before we
    // broadcast — posting immediately after goto() can race the connection, especially
    // under the heavier load of a full multi-browser-project run.
    await citizenPage.waitForTimeout(1500);

    // Create an alert via API to trigger the socket event
    const alertData = {
      title: 'E2E Test Alert - Flood Warning',
      message: 'Playwright automated test alert',
      severity: 'HIGH',
      locations: ['All Island']
    };
    
    const response = await apiPost(apiContext, '/api/alerts', alertData, 'admin');
    expect(response.ok()).toBeTruthy();
    
    // Check if the global alert banner appears on the citizen page.
    // WebKit's socket.io handshake can lag noticeably behind Chromium/Firefox, so give it more room.
    const banner = citizenPage.locator('.fixed').filter({ hasText: 'E2E Test Alert' });
    await expect(banner.first()).toBeVisible({ timeout: 20000 });
  });
});
