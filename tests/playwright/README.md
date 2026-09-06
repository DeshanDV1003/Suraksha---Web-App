# Suraksha Playwright E2E Tests

This project contains the comprehensive End-to-End test suite for the Suraksha platform, covering both the Web App interface and Mobile App API contracts.

## Prerequisites
- Node.js installed
- Suraksha backend running on `http://localhost:3001`
- Suraksha frontend running on `http://localhost:5173`
- Ensure `.env` is configured correctly with test user credentials

## Installation
```bash
npm install
npx playwright install
```

## Running Tests

### Run all tests (headless)
```bash
npm test
```

> **Local runs: use Chromium.** The Vite dev server is too slow for Firefox /
> WebKit on heavy routes; those projects time out until a prod-preview
> `webServer` is added to the config. `npx playwright test --project=chromium`.

### Run tests with UI
```bash
npm run test:ui
```

### Run mobile API contract tests only
```bash
npm run test:mobile
```

## Viewing Results
```bash
npm run test:report
```

## Notes
- `e2e/auth.setup.ts` is the `setup` project (a dependency of every browser
  project). It registers the test accounts, logs in via the API, and writes
  `.auth/{admin,citizen,hospital}.json` storage-state files. The fixtures in
  `fixtures/test.fixtures.ts` load these with `browser.newContext({ storageState })`.
- The frontend keeps its JWT in `localStorage` (`token` + `user`), so the setup
  injects those keys for the frontend origin — no UI login, and it side-steps the
  2FA on the seeded `admin@suraksha.gov` account (the E2E admin is a dedicated
  `pw.admin@suraksha.lk`, see `.env`).
