# Suraksha — Tests

**All test assets and all test records live under this `tests/` directory.**
Nothing test-related is kept in `backend/`, `frontend/`, or elsewhere.

```
tests/
├── README.md                  ← this file
├── unit/                     ← Vitest unit tests (pure logic, no DB/server/browser)
│   ├── backend/                auth guards, geocoding, dup-detection, safe-route
│   └── frontend/               cn helper, useModal hook, Zustand store
├── test-cases/               ← the 168-case Excel catalogue + live runners
│   ├── Suraksha_Test_Cases.xlsx   TC-001..100 (web/API) + TC-M-001..068 (mobile app)
│   ├── run-and-update.cjs         web  — executes each case via API, writes results
│   ├── run-mobile.cjs             mobile app (D:\Suraksha - Mobile App) — same idea
│   └── mobile-test-cases.json     the TC-M-* definitions
├── playwright/                ← Playwright E2E project (specs, POMs, config, helpers)
│   ├── e2e/                     29 spec files + auth.setup.ts (builds .auth/*.json)
│   ├── .auth/                   per-role storageState (gitignored, rebuilt by setup)
│   ├── playwright-report/       latest HTML report (overwritten each run)
│   └── test-results/            latest per-failure traces/screenshots (overwritten each run)
├── k6/                        ← k6 load/performance scripts + all result records
│   ├── load-test.js  spike-test.js  stress-test.js  soak-test.js
│   └── results/
│       ├── 2026-08-23-baseline/   first k6 run (results-load/spike/stress .json)
│       └── 2026-09-06/            re-run (load only): output.txt, summary.json, results-load.json
└── runs/                      ← one folder per full test session (the durable archive)
    └── 2026-09-06/
        ├── SUMMARY.md              human-readable results + findings for that session
        ├── full-run-<date>.txt     full Playwright console log
        ├── playwright-report/      archived HTML report for that session
        ├── unit/                   unit-test console log + JUnit XML
        ├── test-cases/             web Excel-case run: SUMMARY.md, results.json/.tsv
        ├── mobile-test-cases/      mobile Excel-case run: SUMMARY.md, results.json/.tsv
        └── playwright-rerun/       E2E after the auth-bootstrap fix: SUMMARY.md, chromium-results.tsv
```

## How to run

| Suite | Command (run from repo root `D:\Suraksha - Web App`) |
|---|---|
| Unit (all) | `cd tests/unit && npm test` |
| Excel test cases — web (100) | `node tests/test-cases/run-and-update.cjs` |
| Excel test cases — mobile (68) | `node tests/test-cases/run-mobile.cjs` |
| k6 load | `D:\k6\k6-v0.54.0-windows-amd64\k6.exe run tests/k6/load-test.js` |
| k6 spike / stress / soak | same, swap the script name |
| Playwright (all) | `cd tests/playwright && npx playwright test` |

Unit tests need nothing running. k6 + Playwright need PostgreSQL + backend (:3001)
+ frontend (:5173) + ML service (:8000) all up.
See `project_docs/TESTING_GUIDE.md` for full details.

## Archiving a run

After a session, copy the fresh outputs into a dated folder so they are not lost
on the next run:

```
mkdir tests/runs/<YYYY-MM-DD>
cp -r tests/playwright/playwright-report tests/runs/<YYYY-MM-DD>/
# k6 results: write them straight into tests/k6/results/<YYYY-MM-DD>/ when running,
#   e.g. --summary-export tests/k6/results/<YYYY-MM-DD>/load-summary.json
```
