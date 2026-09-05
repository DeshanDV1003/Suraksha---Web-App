import { APIRequestContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export type Role = 'admin' | 'citizen' | 'hospital';

export async function loginAs(page: Page, role: Role) {
  // This is usually handled by fixtures, but useful for manual testing
  const statePath = path.resolve(__dirname, `../.auth/${role}.json`);
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    await page.context().addCookies(state.cookies);
    // Add localStorage items if needed (Playwright doesn't restore localStorage automatically via addCookies)
    await page.evaluate((storage) => {
        for (const item of storage) {
            localStorage.setItem(item.name, item.value);
        }
    }, state.origins[0]?.localStorage || []);
  } else {
    throw new Error(`Auth state for ${role} not found. Run setup first.`);
  }
}

export async function getAuthToken(role: Role): Promise<string | null> {
  const statePath = path.resolve(__dirname, `../.auth/${role}.json`);
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    // Token is usually in localStorage under 'token'
    const ls = state.origins[0]?.localStorage || [];
    const tokenItem = ls.find((item: any) => item.name === 'token');
    return tokenItem ? tokenItem.value : null;
  }
  return null;
}
