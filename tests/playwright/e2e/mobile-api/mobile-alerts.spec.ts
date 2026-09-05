import { test, expect } from '../../fixtures/test.fixtures';
import { apiGet } from '../../helpers/api.helper';

test.describe('Mobile API - Alerts', () => {
  test('TC-PW-M-004: GET /api/alerts returns alert array', async ({ apiContext }) => {
    const response = await apiGet(apiContext, '/api/alerts', 'citizen');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('title');
    }
  });
});
