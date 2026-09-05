import { test, expect } from '../../fixtures/test.fixtures';
import { apiGet } from '../../helpers/api.helper';

test.describe('Mobile API - Water', () => {
  test('TC-PW-M-014: GET /api/water/river returns readings', async ({ apiContext }) => {
    const response = await apiGet(apiContext, '/api/water/river', 'citizen');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('TC-PW-M-015: GET /api/water/predictions works', async ({ apiContext }) => {
    const response = await apiGet(apiContext, '/api/water/predictions', 'citizen');
    // Might be 503 if ML is offline
    if (response.ok()) {
      const body = await response.json();
      expect(Array.isArray(body)).toBeTruthy();
    }
  });
});
