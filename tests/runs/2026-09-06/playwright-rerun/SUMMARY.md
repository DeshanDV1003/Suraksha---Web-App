# Playwright E2E — re-run after fixing the auth bootstrap (2026-09-06)

The first sweep this session scored 43/234 because **no test that needed a
logged-in session could run** — `global-setup.ts` never executed. That is now
fixed; this is the real picture.

## What was broken in the harness (fixed)

| Problem | Fix |
|---|---|
| `global-setup.ts` was wired as a `setup` *project* (`testMatch`) but contained no `test()` calls — it was written for the `globalSetup:` config key. Result: 0 setup tests ran, `.auth/*.json` never created, every fixture-authenticated test threw `Auth state for <role> not found`. | Replaced with **`e2e/auth.setup.ts`** — a real setup spec that registers the test accounts, logs in via the API, and writes proper `storageState` files (the frontend keeps its JWT in `localStorage`, so it injects `token` + `user` for the frontend origin). |
| `.auth` path mismatch — setup wrote `tests/playwright/tests/playwright/.auth/…`, helper read `tests/playwright/.auth/…`. | Both now use `path.resolve(__dirname, '../.auth/<role>.json')`. |
| Fixtures did a manual `loginAs()` (cookies + `page.evaluate` localStorage on `about:blank` — a no-op). | Fixtures now use native `browser.newContext({ storageState })`. |
| `.env` admin was `admin@suraksha.gov`, which has **2FA enabled** → API/UI login never returns a token. | `.env` admin is now a dedicated `pw.admin@suraksha.lk` (role ADMIN), created by the setup spec. |
| 30 s timeout too tight for the Vite dev server on heavy routes. | `timeout: 60s`, `navigationTimeout: 45s`, `expect: 10s`. |

Files: `playwright.config.ts`, `fixtures/test.fixtures.ts`, `e2e/auth.setup.ts`
(new), `.env`; `global-setup.ts` deleted.

## Result — Chromium (the reliable signal): 63 / 79 = **80%**

Per-test list: `chromium-results.tsv`. Full console: `chromium-console.txt`.

Firefox / WebKit were **not** counted — see "Cross-browser" below.

## The 16 Chromium failures

**15 are test-quality problems, not app bugs** — the page loads fine (the DOM
snapshots show the real sidebar / content), but the POM/spec locator is a guessed
CSS class or button label that doesn't exist in the current UI:

| Test | Bad locator | Reality |
|---|---|---|
| TC-PW-015 / 016 | `.bg-white…filter(hasText:/Total/)` | dashboard renders; stat cards aren't `.bg-white` / don't say "Total" |
| TC-PW-022 | `.alert-card, [role=listitem]` | alerts page renders; no such class |
| TC-PW-023 / 024 | button `/new alert\|create alert/i` on `/suraksha-alerts` | button label / route differ |
| TC-PW-026 / 028 | `.bg-white.rounded-xl`, button `/report incident/i` | incidents page renders; class/label differ |
| TC-PW-027 | `page.locator('select').first()` | the type filter isn't a `<select>` |
| TC-PW-032 | zoom-in control `.click()` | Leaflet control locator wrong |
| TC-PW-039 | missing-person form locator | form renders under a different structure |
| TC-PW-054 | `text=Hospital` | **strict-mode violation** — matches 3 elements; page works |
| TC-PW-056 | capacity-page content locator | page renders |
| TC-PW-062 | family-member list locator | page renders |
| TC-PW-004 / 009 | `getByText(/invalid credentials\|error/i)` within 5 s | error shows via react-hot-toast — different text / faster than the assertion |

**1 is a real backend finding:**

| TC-PW-M-015 | `GET /api/water/predictions` exceeded the 15 s request timeout — the endpoint called the ML service once per gauge | **FIXED** this session — `WaterLevelPrediction` cache table; endpoint serves from DB (now ~250 ms, k6 p95 26 s → 533 ms). See `project_docs/water_predictions_caching.md`. Re-verified: TC-PW-M-015 passes (247 ms). |

## Cross-browser (Firefox / WebKit)

Both fail *en masse* — not app bugs, but the **Vite dev server** serves unbundled
ESM (hundreds of module requests); Firefox and WebKit are far slower than Chromium
at this and time out on heavy routes (`/`, `/incidents`, `/ai-research`, `/map`)
even at 60 s, sometimes during fixture setup. The API-only tests (`TC-PW-M-*`) pass
in all three.

**Recommended fix:** add a `webServer` block that runs a production preview
(`vite build && vite preview`) and point `baseURL` at it — a bundled build loads
fast in every browser. Until then, treat **Chromium as the source of truth** for
local runs (common practice for a dev E2E suite).

## What to fix next (priority order)

1. ~~Backend — cache `GET /api/water/predictions`~~ **DONE** (fixes TC-PW-M-015 and TC-096).
2. **E2E cross-browser** — `webServer` prod-preview block so Firefox/WebKit are meaningful.
3. **E2E test quality** — modernise the POMs (`pages/*.pom.ts`) and the ~10 specs to use `getByRole` / `getByTestId` / real labels instead of guessed CSS classes; add `data-testid` hooks to the React components where a stable handle is missing. ~15 tests, mechanical but touches many files.
