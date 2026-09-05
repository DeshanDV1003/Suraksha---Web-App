import { test, expect } from '../../fixtures/test.fixtures';
import { apiPost } from '../../helpers/api.helper';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

test.describe('Mobile API - Auth', () => {
  test('TC-PW-M-001: Mobile login returns JWT', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: {
        email: process.env.CITIZEN_EMAIL,
        password: process.env.CITIZEN_PASSWORD
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('user');
  });

  test('TC-PW-M-002: JWT payload verification', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: {
        email: process.env.CITIZEN_EMAIL,
        password: process.env.CITIZEN_PASSWORD
      }
    });
    
    const body = await response.json();
    expect(body.user).toHaveProperty('role', 'CITIZEN');
    expect(body.user).toHaveProperty('id');
  });
});
