import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';
const authDir = path.resolve(__dirname, '../.auth');

const ROLES = [
  { role: 'admin',    email: process.env.ADMIN_EMAIL!,    password: process.env.ADMIN_PASSWORD!,    name: 'PW Admin',    userRole: 'ADMIN' },
  { role: 'citizen',  email: process.env.CITIZEN_EMAIL!,  password: process.env.CITIZEN_PASSWORD!,  name: 'PW Citizen',  userRole: 'CITIZEN' },
  { role: 'hospital', email: process.env.HOSPITAL_EMAIL!, password: process.env.HOSPITAL_PASSWORD!, name: 'PW Hospital', userRole: 'HOSPITAL_STAFF' },
];

/**
 * Builds .auth/<role>.json storage-state files that the fixtures load with
 * `browser.newContext({ storageState })`. The Suraksha frontend keeps its JWT in
 * localStorage (`token` + `user`), so we log in via the API and inject those two
 * keys for the frontend origin — no flaky UI login, and it side-steps the 2FA on
 * the seeded admin account.
 */
setup('authenticate all roles', async ({ request }) => {
  fs.mkdirSync(authDir, { recursive: true });

  for (const r of ROLES) {
    // Make sure the account exists (a duplicate-email 400 is fine).
    await request.post(`${BACKEND}/api/auth/register`, {
      data: { name: r.name, email: r.email, password: r.password, phone: '0770000000', role: r.userRole },
    }).catch(() => undefined);

    const res = await request.post(`${BACKEND}/api/auth/login`, {
      data: { email: r.email, password: r.password },
    });
    expect(res.ok(), `login request failed for ${r.role} (${r.email})`).toBeTruthy();

    const body = await res.json();
    expect(body.token, `no token returned for ${r.role} — is 2FA enabled on this account?`).toBeTruthy();
    expect(body.user?.role, `unexpected role for ${r.role}`).toBe(r.userRole);

    const storageState = {
      cookies: [],
      origins: [
        {
          origin: FRONTEND,
          localStorage: [
            { name: 'token', value: body.token as string },
            { name: 'user', value: JSON.stringify(body.user) },
          ],
        },
      ],
    };
    fs.writeFileSync(path.join(authDir, `${r.role}.json`), JSON.stringify(storageState, null, 2));
  }
});
