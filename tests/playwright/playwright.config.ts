import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read from default ".env" file.
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* The Vite dev server serves unbundled ESM — first paint of a heavy route can
     be slow, especially in Firefox / WebKit. Give tests room. */
  timeout: 60_000,
  expect: { timeout: 10_000 },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retries absorb environment-level flakiness (a single local machine running the preview
     server, backend, ML service and 3 browser engines concurrently) — every deterministic
     locator/app bug this suite caught has already been fixed at the source, not papered over here. */
  retries: process.env.CI ? 2 : 1,
  /* Cap concurrency so chromium/firefox/webkit workers don't starve the single local
     preview server and backend, which was causing random cross-browser timeouts. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. Points at the
       production preview server started below — bundled output paints far
       faster than the unbundled Vite dev server in Firefox/WebKit. */
    baseURL: process.env.FRONTEND_URL || 'http://localhost:4173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    navigationTimeout: 45_000,
    actionTimeout: 15_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
    },
  ],

  /* Build once and serve the production bundle for the whole run — the Vite
     dev server's unbundled ESM is slow enough in Firefox/WebKit to cause mass
     timeouts that have nothing to do with real app bugs. */
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    cwd: path.resolve(__dirname, '../../frontend'),
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
