import { test as base, APIRequestContext, request } from '@playwright/test';
import path from 'path';

type CustomFixtures = {
  adminPage: import('@playwright/test').Page;
  citizenPage: import('@playwright/test').Page;
  hospitalPage: import('@playwright/test').Page;
  apiContext: APIRequestContext;
};

const authFile = (role: string) => path.resolve(__dirname, `../.auth/${role}.json`);

async function pageForRole(browser: import('@playwright/test').Browser, role: string, use: (p: import('@playwright/test').Page) => Promise<void>) {
  const context = await browser.newContext({ storageState: authFile(role) });
  const page = await context.newPage();
  await use(page);
  await context.close();
}

export const test = base.extend<CustomFixtures>({
  adminPage:    async ({ browser }, use) => { await pageForRole(browser, 'admin', use); },
  citizenPage:  async ({ browser }, use) => { await pageForRole(browser, 'citizen', use); },
  hospitalPage: async ({ browser }, use) => { await pageForRole(browser, 'hospital', use); },
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.BACKEND_URL || 'http://localhost:3001',
    });
    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
