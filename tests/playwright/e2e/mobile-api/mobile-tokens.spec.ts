import { test, expect } from '../../fixtures/test.fixtures';
import { apiGet } from '../../helpers/api.helper';

test.describe('Mobile API - Tokens', () => {
  test('TC-PW-M-010: GET /api/tokens works for citizen', async ({ apiContext }) => {
    const response = await apiGet(apiContext, '/api/tokens', 'citizen');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });
});
