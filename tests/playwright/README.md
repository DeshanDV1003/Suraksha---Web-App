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
- `global-setup.ts` runs automatically before tests to authenticate the different user roles (Admin, Citizen, Hospital) and saves their state, so tests don't need to log in manually every time.
