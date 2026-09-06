# Suraksha — Test Run 2026-09-06

Re-run of the k6 load test + a full Playwright E2E sweep + a new Vitest unit-test
suite + live execution of the Excel test cases (100 web + 68 mobile), kept
separate from the August baseline. Environment brought up fresh for this run:

| Service | Port | Status |
|---|---|---|
| PostgreSQL (D:\OdooData\pgdata) | 5432 | started for this run |
| Backend (`npm run dev`) | 3001 | up |
| Frontend (Vite `npm run dev`) | 5173 | up |
| ML service (uvicorn `suraksha-ml`) | 8000 | up (NER + LSTM v3.0 loaded) |

Test users: `testload@suraksha.lk` (CITIZEN) OK, `admin@suraksha.gov` (ADMIN) OK,
`hospital@suraksha.lk` — did **not** exist, created this run as `HOSPITAL_STAFF`.

---

## Excel Test Cases (100) — live execution

- File moved to `tests/test-cases/Suraksha_Test_Cases.xlsx` (was `backend/`)
- Runner: `tests/test-cases/run-and-update.cjs` — hits the real API, writes
  Status/Notes back into the workbook, rebuilds the Summary sheet
- Records + findings: `tests/runs/2026-09-06/test-cases/` (`SUMMARY.md`, `results.json`, `results.tsv`)

### 76/8/16 (first run) → 84/1/15 (RBAC + validation fixes) → **85 Pass / 0 Fail / 15 N/A — 100% of executed**

All 8 failures fixed this session:

| TC | Was | Fix |
|---|---|---|
| **TC-027** | any citizen could change any incident's status | `officerMiddleware` added to `PATCH /api/incidents/:id/status` + status-enum validation |
| TC-024 / TC-050 / TC-059 | missing field → HTTP 500 (Prisma error leaked) | new `apiError.ts` (`requireFields` / `sendError`); create controllers validate up-front, validation errors map to 400 |
| TC-030 | `?category=` filter ignored | query params flow through to a Prisma `where` |
| TC-066 | camp occupancy could exceed capacity | capacity check in `updateOccupancy` → 400 |
| TC-087 | donation `amount: 0` accepted | positive-amount validation |
| **TC-096** | k6 load p95 = 26 s — `/api/water/predictions` called ML once per gauge | new `WaterLevelPrediction` cache table + response cache; endpoint serves from DB. **k6 p95 26 s → 533 ms** (`project_docs/water_predictions_caching.md`) |

Backend `tsc --noEmit` clean; the 52-test Vitest suite still green. **No existing
DB rows were touched by the new table** (backup taken first).

---

## Mobile App Test Cases (68) — appended to the same workbook

- App: `D:\Suraksha - Mobile App` (Expo / React Native) — uses this same backend
- Runner: `tests/test-cases/run-mobile.cjs`; definitions: `mobile-test-cases.json`
- **TC-M-001 … TC-M-068** appended after the 100 web cases — web rows untouched
- Records: `tests/runs/2026-09-06/mobile-test-cases/`

### Result: 57 Pass / 3 Fail / 8 N/A  → workbook total **142 / 3 / 23 (98%)**

API contracts from `src/services/api.ts`, offline-sync logic (`useOfflineSubmit`,
`localDB`, `syncService`) + the app's own `offline_sync_results.json`, and the
pure geo utils (`distance.ts`, transpiled and run directly). Device-only
behaviours (camera, maps, push token, background fetch) → N/A.

**3 genuine findings:**

| TC | Finding |
|---|---|
| **TC-M-030** | Offline-sync **retries create duplicate server records** (10% in the app's own duplicate-retry test) — no idempotency key; `X-Original-Timestamp` is sent but not used for dedup. Duplicate emergency reports. |
| TC-M-003 | `authService.getProfile()` → `GET /api/auth/profile` is **404** (dead code; app uses `/users/me`) |
| TC-M-065 | JWT stored in **plaintext AsyncStorage**, not `expo-secure-store` (already a dependency) |

Same-class-as-web note: `POST /api/family/members`, `/api/assessments/damage`,
`/api/location/log` return **500 not 400** on missing fields — the
`family` / `damageAssessment` / `location` controllers weren't in last turn's
`apiError.ts` fix. They pass with the payloads the app actually sends.
Full detail: `tests/runs/2026-09-06/test-cases/SUMMARY.md`.

---

## 0. Unit Tests (new — Vitest)

- Location: `tests/unit/` (standalone package — does not touch app dependencies)
- Records: `tests/runs/2026-09-06/unit/` (`unit-test-output.txt`, `junit.xml`)
- Command: `cd tests/unit && npm test` — needs nothing running.

### Result: 52 passed / 0 failed (7 files, ~10 s)

| Area | File | What is covered |
|---|---|---|
| Backend | `auth-middleware.test.ts` (8) | JWT verify, missing/forged token → 401, `req.user` attach, `admin`/`officer`/`hospital` role guards → 403 |
| Backend | `geocoding.test.ts` (8) | `isInSriLanka` bounding box (incl. edges), Nominatim hit in/outside LK, network-failure fallback |
| Backend | `duplicate-detection.test.ts` (9) | Haversine distance (Colombo→Kandy ≈ 94 km, symmetry, monotonic), NLP entity overlap scoring |
| Backend | `safe-route.test.ts` (10) | Haversine, `totalKm`, Bézier route geometry, hazard proximity scoring, `riskLabel` bands (80/60/40) |
| Frontend | `cn.test.ts` (5) | Tailwind class-merge helper — conflicts, conditionals, arrays/objects |
| Frontend | `useModal.test.tsx` (5) | open / close / toggle, stable callback identity |
| Frontend | `useAppStore.test.ts` (7) | Zustand store: `setUser`, notifications add/markAsRead/clear, misc slices |

Two backend service files got a non-behavioural `export const __test__ = {...}`
(`duplicateDetectionService.ts`, `safeRouteService.ts`) to expose internal
helpers for testing.

---

## 1. k6 Load Test (re-run)

- Script: `tests/k6/load-test.js` (unchanged — 100 VUs, 1m ramp / 3m hold / 1m down)
- Records for this re-run: `tests/k6/results/2026-09-06/`
  - `load-test-output.txt` — full console output
  - `load-summary.json` — k6 summary export
  - (the raw per-request stream is gitignored — too large)
- August baseline preserved at `tests/k6/results/2026-08-23-baseline/`
  (`results-load.json`, `results-spike.json`, `results-stress.json`).

### Result — first run vs. after the predictions-cache fix

| Metric | First run | **After cache fix** | Threshold | Verdict |
|---|---|---|---|---|
| Checks passed | 2528/2528 | **23364/23364** | — | ✅ |
| `http_req_failed` | 0.00% | 0.00% | < 1% | ✅ |
| `http_req_duration` p95 | 25.96 s | **533 ms** | < 1.5 s | ✅ |
| `water_predictions_duration` p95 | 35.2 s | **243 ms** | — | — |
| `dashboard_stats_duration` p95 | 20.9 s | **866 ms** | — | — |
| Total requests / rate | 2095 / 6.56 req/s | **19471 / 64 req/s** | — | — |
| VUs max | 100 | 100 | — | — |

**First run:** zero errors but p95 26 s — `/api/water/predictions` called the ML
service once per gauge (50×), and the single-worker ML service serialised them.

**Fix (this session):** new `WaterLevelPrediction` cache table + 60 s in-process
response cache; the hourly cycle persists results; startup warm-up. Endpoint now
serves from the DB. **k6 all thresholds pass; p95 26 s → 533 ms.**
Details: `project_docs/water_predictions_caching.md`.
No existing DB rows were modified — a backup was taken first
(`D:\SurakshaBackups\manual_before_predictions_table_20260906-1249.sql`).

Spike / stress / soak were not re-run this round; August records remain at
`tests/k6/results/2026-08-23-baseline/`.

---

## 2. Playwright E2E

> **Superseded** — the first sweep below scored 43/234 only because the auth
> bootstrap was broken (no logged-in test could run). That is now **fixed**.
> Current result and analysis: **`playwright-rerun/SUMMARY.md`**.
>
> After the fix — **Chromium: 63 / 79 = 80%**. Of the 16 failures, 15 are brittle
> test selectors (pages load fine) and 1 is a real backend finding
> (`GET /api/water/predictions` too slow — same as TC-096). Firefox/WebKit need a
> production-preview `webServer` to be meaningful (Vite dev server too slow for
> non-Chromium).

### First sweep (auth broken): 43 passed / 191 failed / 234 total

### Failure breakdown

| Cause | Count | Real app bug? |
|---|---|---|
| `Auth state for admin/citizen/hospital not found. Run setup first.` | 165 | **No — test harness misconfig** |
| `page.goto` / `locator` / `waitForURL` timeout (30 s) | ~22 | Partly — mostly downstream of the auth failure + slow first paint |
| `expect(locator).toBeVisible()` / element not found | ~8 | Needs review once auth is fixed |
| `page.goto: NS_ERROR_CONNECTION_REFUSED` (1, firefox) | 1 | Transient during server warm-up |

### Root cause of the 165 auth failures

`tests/playwright/playwright.config.ts` wires authentication as a **`setup`
project** (`testMatch: /global-setup\.ts/`), but `tests/playwright/global-setup.ts`
contains **no `test()` calls** — it exports a `globalSetup` function meant for the
`globalSetup:` config key. So the setup project runs 0 tests, `.auth/*.json` is
never written, and every test that uses the `adminPage` / `citizenPage` /
`hospitalPage` fixtures throws immediately in `loginAs()`.

There is also a path bug: `global-setup.ts` writes to
`tests/playwright/.auth/<role>.json` relative to CWD (→ nested
`tests/playwright/tests/playwright/.auth/`), while `helpers/auth.helper.ts` reads
`../.auth/<role>.json` relative to the `helpers/` folder. These two paths don't
agree.

### What actually passed (43)

All of them are tests that need **no** browser session pre-auth:
- Public request portal (load, submit, validation)
- Public missing-persons list
- Mobile API contract tests (they authenticate via API call, not the fixture)
- Login form tests (valid citizen/hospital login, empty-form validation, register link)

So: backend API + public routes + login flow are healthy. The authenticated-UI
surface (dashboards, alerts, incidents, camps, users, hospital, water monitor,
map, settings, etc.) was **not meaningfully exercised** this run because of the
harness bug above.

---

## Recommended next steps

1. ~~Backend — cache `GET /api/water/predictions`~~ **DONE** — fixed TC-096 and
   TC-PW-M-015 (`project_docs/water_predictions_caching.md`).
2. **E2E** — add a prod-preview `webServer` block so Firefox/WebKit runs are real
   (Chromium is currently 63/79 = 80%; the other two browsers time out on the
   Vite dev server).
3. **E2E** — modernise the POM/spec locators (guessed CSS classes →
   `getByRole` / `getByTestId`); ~15 chromium tests, all "element not found" on
   pages that actually render fine.

The Playwright auth bootstrap (the blocker in the first sweep) is **done** — see
`playwright-rerun/SUMMARY.md`.
