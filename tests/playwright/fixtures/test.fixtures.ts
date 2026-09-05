import { test as base, APIRequestContext, request } from '@playwright/test';
import { loginAs } from '../helpers/auth.helper';

type CustomFixtures = {
  adminPage: import('@playwright/test').Page;
  citizenPage: import('@playwright/test').Page;
  hospitalPage: import('@playwright/test').Page;
  apiContext: APIRequestContext;
};

export const test = base.extend<CustomFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'admin');
    await use(page);
    await context.close();
  },
  citizenPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'citizen');
    await use(page);
    await context.close();
  },
  hospitalPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'hospital');
    await use(page);
    await context.close();
  },
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.BACKEND_URL || 'http://localhost:3001',
    });
    await use(context);
    await context.dispose();
  }
});

export { expect } from '@playwright/test';
