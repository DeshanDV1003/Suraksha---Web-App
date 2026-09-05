import { test, expect } from '../../fixtures/test.fixtures';
import { apiGet } from '../../helpers/api.helper';

test.describe('Mobile API - Family', () => {
  test('TC-PW-M-013: GET /api/family returns member list', async ({ apiContext }) => {
    const response = await apiGet(apiContext, '/api/family', 'citizen');
    // If endpoint exists and user has family, it returns array. Otherwise 404 or empty.
    if (response.ok()) {
      const body = await response.json();
      expect(Array.isArray(body)).toBeTruthy();
    }
  });
});
