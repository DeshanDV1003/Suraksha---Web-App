# Suraksha — Unit Tests

Fast, isolated tests for **pure logic** — no database, no HTTP server, no browser
navigation. (Full-stack behaviour is covered by `tests/playwright/`; load by
`tests/k6/`.)

Runner: **Vitest**. This is a standalone package so unit-test dependencies never
touch the app's `package.json`.

```
tests/unit/
├── package.json          vitest + jsdom + testing-library (isolated)
├── vitest.config.ts      backend/** → node env, frontend/** → jsdom env
├── setup.ts              sets test env vars, loads jest-dom matchers
├── backend/
│   ├── __mocks__/prisma.ts        stub for the Prisma singleton
│   ├── auth-middleware.test.ts    JWT verify + role guards (auth.ts)
│   ├── geocoding.test.ts          isInSriLanka bounds + geocode/reverse (axios mocked)
│   ├── duplicate-detection.test.ts haversine distance + NLP entity overlap scoring
│   └── safe-route.test.ts         haversine, route geometry, hazard scoring, risk bands
└── frontend/
    ├── cn.test.ts                 Tailwind class-merge helper (lib/utils.ts)
    ├── useModal.test.tsx          open/close/toggle hook
    └── useAppStore.test.ts        Zustand store: auth + notifications slices
```

## Run

```bash
cd tests/unit
npm install          # first time only
npm test             # all suites            (52 tests)
npm run test:backend # backend/** only
npm run test:frontend# frontend/** only
npm run test:watch   # watch mode
```

No servers or database need to be running.

## Notes

- Two backend service files export a `__test__` object (`duplicateDetectionService.ts`,
  `safeRouteService.ts`) so their internal helper functions can be unit tested.
  This adds no runtime behaviour.
- Backend modules that import the Prisma client are stubbed per-test with
  `vi.mock(...)` — unit tests must never open a DB connection.
- Latest recorded run: `tests/runs/2026-09-06/unit/` (console log + JUnit XML).
