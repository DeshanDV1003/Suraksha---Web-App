import { chromium, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const contexts = [
    {
      role: 'admin',
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!,
      storagePath: 'tests/playwright/.auth/admin.json',
    },
    {
      role: 'citizen',
      email: process.env.CITIZEN_EMAIL!,
      password: process.env.CITIZEN_PASSWORD!,
      storagePath: 'tests/playwright/.auth/citizen.json',
    },
    {
      role: 'hospital',
      email: process.env.HOSPITAL_EMAIL!,
      password: process.env.HOSPITAL_PASSWORD!,
      storagePath: 'tests/playwright/.auth/hospital.json',
    }
  ];

  for (const user of contexts) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${baseURL}/login`);
      
      // Look for the specific inputs based on attributes/types
      await page.locator('input[type="email"], input[name="email"], input#email').first().fill(user.email);
      await page.locator('input[type="password"], input[name="password"], input#password').first().fill(user.password);
      
      // Click the login button
      await page.locator('button[type="submit"]').first().click();
      
      // Wait for network idle or a specific element that shows login success
      await page.waitForLoadState('networkidle');
      
      // Give a little extra time for tokens to be stored
      await page.waitForTimeout(1000);
      
      // Save state
      await context.storageState({ path: user.storagePath });
      console.log(`Authenticated as ${user.role}`);
    } catch (error) {
      console.error(`Failed to authenticate ${user.role}:`, error);
    } finally {
      await context.close();
    }
  }
  await browser.close();
}

export default globalSetup;
