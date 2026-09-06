# 17 — Testing & Evaluation (Chapter 5 source)

All testing artefacts live under `d:\Suraksha - Web App\tests\`.
Run records for the evaluation session: `tests\runs\2026-09-06\`.

## 17.1 Test strategy (state this table in the report)

> **Table 5.x — Testing strategy: level, tool, target, scale.**

| Level | Tool | Target | Scale | Where |
|---|---|---|---|---|
| Static analysis | `tsc --noEmit`, ESLint | type & lint correctness (backend + both frontends) | whole codebase, 0 errors | — |
| **Unit** | Vitest | pure logic (auth guards, geocoding bounds, Haversine, entity overlap, route geometry, hazard scoring, `cn()`, `useModal`, Zustand store) | **52 tests, 7 files, 100% pass** | `tests/unit/` |
| **Documented test cases (functional)** | custom Node runner → Excel | every API + mobile feature against the live system | **168 cases** (100 web/API + 68 mobile) | `tests/test-cases/`, Appendix A |
| **End-to-end (UI)** | Playwright (Chromium/Firefox/WebKit) | web dashboard user journeys | 29 spec files, **Chromium 63/79 = 80%** | `tests/playwright/`, `tests/runs/2026-09-06/playwright-rerun/` |
| **Load / performance** | k6 | API under concurrent load | 100 VUs × 5 min + targeted endpoint tests | `tests/k6/`, `tests/runs/.../` |
| **Resilience (offline sync)** | app's own harness + case runner | mobile queue under connectivity failure | 6 conditions × queue sizes | `D:\Suraksha - Mobile App\offline_sync_results.json` |
| **Security review** | manual + case runner | auth, RBAC, injection, validation | 7 findings, 5 fixed | this file §5 |

## 17.2 Functional testing — 168 documented test cases

**Workbook:** `tests/test-cases/Suraksha_Test_Cases.xlsx` — sheet *Test Cases*
(168 rows: `TC-001…TC-100` web/API + `TC-M-001…TC-M-068` mobile), sheet *Summary*
(per-module Pass/Fail/N/A), sheet *Load Testing Guide*.
**Runners:** `run-and-update.cjs` (web), `run-mobile.cjs` (mobile) — each
registers test accounts, calls the real API as the client would, scores each case
Pass / Fail / N/A, and writes the result columns + rebuilds the Summary sheet.

> **Table 5.x — Documented test-case results (2026-09-06).**

| Section | Modules | Pass | Fail | N/A | Total |
|---|---|---|---|---|---|
| Web / API (TC-001–100) | Auth, Alerts, Incidents, Water, Help Requests, Missing Persons, Relief Camps, Users, Volunteers, Resources, Donations, AI Services, Performance | **85** | 0 | 15 | 100 |
| Mobile (TC-M-001–068) | Auth, Home, Reporting, Offline Sync, Alerts/Geo, Water, Family Safety, Relief Tokens, API Contract, Device, i18n, Config, Realtime | **57** | 3 | 8 | 68 |
| **Total** | 26 modules | **142** | **3** | **23** | **168** |
| **Pass rate (of the 145 executed)** | | **98 %** | | | |

**N/A cases** = genuinely not exercisable in this environment: mobile-device-only
behaviours (camera, maps, push tokens, background fetch — 8), features with no
API route yet, flows needing hardware, and long k6 scenarios not re-run this
session.

### Bugs found by the case testing and fixed during the evaluation

> **Table 5.x — Defects found by functional testing and their resolution.**

| ID | Defect | Root cause | Fix | Severity |
|---|---|---|---|---|
| TC-027 | Any authenticated citizen could change any incident's status | `PATCH /api/incidents/:id/status` had `authMiddleware` only, no role guard | Added `officerMiddleware` + status-enum validation | **High (RBAC)** |
| TC-024 / TC-050 / TC-059 | Missing required field → HTTP 500 with a leaked `PrismaClientValidationError` stack | Controllers spread `req.body` straight into `prisma.create()` | New `utils/apiError.ts` — `requireFields()` + `sendError()` mapping validation-class errors to 400/404/409 | Medium (robustness) |
| TC-030 | `GET /api/incidents?category=` query param silently ignored | `getAllIncidents()` took no filter | Pass `category`/`status` through to a Prisma `where` | Low |
| TC-066 | Camp occupancy could exceed capacity | no capacity check in `updateOccupancy` | Reject `currentOccupancy > totalCapacity` with 400 | Medium (data integrity) |
| TC-087 | Donation with `amount: 0` accepted | no positive-amount validation | Reject non-positive amount; require a positive amount for `MONETARY` | Low |
| TC-096 | k6 load p95 = 26 s | `/api/water/predictions` called the ML service once per gauge (≤ 50) | `WaterLevelPrediction` cache table + response cache (see §3, `11 §11.9`) | High (performance) |

Progression across three runs: **76/8/16 → 84/1/15 → 85/0/15** (web), then mobile
appended → **142/3/23** total. Only 3 open items remain — all **mobile findings**
(see §4).

## 17.3 Performance / load testing (k6)

**Script:** `tests/k6/load-test.js` — 100 virtual users over 5 min (1 min ramp,
3 min hold, 1 min down), mixed read workload: dashboard stats, alert list, river
levels, water predictions, incidents list. **Thresholds:** p95 < 1,500 ms,
error rate < 1 %.

> **Table 5.x — k6 load test (100 VU, 5 min): before vs after the prediction-cache
> optimisation.**

| Metric | Before (first run) | **After** | Threshold | Verdict |
|---|---|---|---|---|
| Checks passed | 2,528 / 2,528 | **23,364 / 23,364** | — | ✓ |
| `http_req_failed` | 0.00 % | 0.00 % | < 1 % | ✓ |
| `http_req_duration` p95 | 25.96 s | **533 ms** | < 1,500 ms | ✓ |
| `water_predictions_duration` p95 | 35.2 s | **243 ms** | — | — |
| `dashboard_stats_duration` p95 | 20.9 s | **866 ms** | — | — |
| Throughput | 6.56 req/s | **64.2 req/s** | — | — |
| Total requests | 2,095 | **19,471** | — | — |

**Interpretation:** the first run met the *safety* thresholds (0 errors) but
breached the *latency* threshold because every request fanned out ≤ 50 serial ML
calls. After introducing the `WaterLevelPrediction` cache (§16 ALG-1), all
thresholds pass with a **10× throughput increase**. A targeted 50-VU / 70-s test
of `/api/water/predictions` alone: p95 **375 ms**, 0 errors, 287 req/s.

**Not re-run this session** (documented earlier): spike test (300 VU → 4.5 %
error, within the 10 % threshold), stress test (ramp to 200 VU), soak test
(50 VU / 30 min). August baseline records: `tests/k6/results/2026-08-23-baseline/`.

## 17.4 Resilience — offline-sync stress (mobile, RO5 / RQ3)

**Source:** `D:\Suraksha - Mobile App\offline_sync_results.json`, cross-checked by
`run-mobile.cjs` (test cases TC-M-027…031).

> **Table 5.x — Offline-sync stress results (queue size 50 unless noted).**

| Condition | Success | Deferred (retry) | **Data loss** | Mean latency | p95 |
|---|---|---|---|---|---|
| A. Reconnect (ideal), Q = 10 | 100.0 % | 0 % | **0.0 %** | 308 ms | 316 ms |
| A. Reconnect (ideal), Q = 50 | 100.0 % | 0 % | **0.0 %** | 313 ms | 327 ms |
| A. Reconnect (ideal), Q = 100 | 100.0 % | 0 % | **0.0 %** | 312 ms | 316 ms |
| B. Disconnect mid-sync | 76.9 % | 23.1 % | **0.0 %** | 313 ms | 316 ms |
| C. App restart | 100.0 % | 0 % | **0.0 %** | 307 ms | 315 ms |
| D. Latency 500 / 1000 / 2000 ms | 100.0 % | 0 % | **0.0 %** | 814 / 1319 / 2319 ms | ~+8 ms |
| E. Packet loss 5 / 10 / 20 % | 96.2 / 87.7 / 75.8 % | 3.8 / 12.3 / 24.2 % | **0.0 %** | ~308 ms | ~320 ms |
| F. Duplicate retry | 100.0 % | 0 % | 0.0 % loss, **10.0 % duplicates** | 312 ms | 339 ms |

**RQ3 answer:** **yes** — across every connectivity-failure condition the mobile
queue records **0 % data loss**. Items that fail transiently stay `pending` and
retry (bounded to 5 attempts). The **one weakness** is duplicate creation on
retry (F): 10 % of retried-but-already-accepted items produce a second server
record. Fix (future work): a client-generated idempotency key that the backend
upserts on.

## 17.5 Security review

> **Table 5.x — Security review findings.**

| # | Area | Finding | Status |
|---|---|---|---|
| S1 | RBAC | incident-status change unguarded (TC-027) | **fixed** |
| S2 | Input validation | 500 instead of 400 on missing fields; Prisma stack leaked to client | **fixed** (`apiError.ts`) |
| S3 | Data integrity | occupancy > capacity; donation amount 0 | **fixed** |
| S4 | Auth | passwords bcrypt-hashed; JWT on all protected routes; admin TOTP 2FA; injection input rejected safely (TC-011/098/099/100 pass) | verified OK |
| S5 | Mobile token storage | JWT in plaintext `AsyncStorage`, not `expo-secure-store` (TC-M-065) | **open — future work** |
| S6 | Idempotency | offline-sync retries can duplicate records (TC-M-030) | **open — future work** |
| S7 | Dead route | mobile `authService.getProfile()` → `GET /api/auth/profile` returns 404 | **open** (cosmetic — app uses `/users/me`) |

## 17.6 End-to-end testing (Playwright)

- **Harness defect found & fixed:** the E2E suite scored 43/234 only because the
  auth bootstrap never ran (`global-setup.ts` was wired as a `setup` *project*
  but contained no `test()` calls — it was written for the `globalSetup:` config
  key, so `.auth/*.json` was never created and every authenticated test threw).
  Replaced with `e2e/auth.setup.ts` (registers accounts → API login → writes
  proper `storageState`), native `storageState` fixtures, a dedicated non-2FA
  admin account, and longer timeouts.
- **Result after the fix — Chromium: 63 / 79 = 80 %.** Of the 16 failures, **15
  are stale test selectors** (guessed CSS classes / labels that no longer match
  the UI — the pages themselves render correctly, confirmed from the DOM
  snapshots) and **1 was a real backend finding** (`/api/water/predictions`
  latency, now fixed → TC-PW-M-015 passes at 247 ms).
- **Firefox / WebKit** fail *en masse* — not app bugs: the Vite dev server serves
  unbundled ESM (hundreds of module requests) which those browsers are far slower
  at, so they time out on heavy routes. Fix (future work): run the E2E suite
  against a production preview build. Chromium is the source of truth for local
  runs.

## 17.7 Evaluation against the non-functional requirements

> **Table 5.x — NFR verification summary.**

| NFR | Requirement | Result | Met? |
|---|---|---|---|
| NFR-1 | p95 ≤ 1.5 s, errors < 1 % @ 100 VU | p95 533 ms, 0 % | ✓ |
| NFR-2 | ML endpoint must not degrade the API under load | predictions p95 243 ms (was 35 s) | ✓ |
| NFR-3 | offline reports never lost | 0 % data loss × 6 conditions | ✓ |
| NFR-4 | graceful degradation if ML down | AI endpoints → 503; forecasts → cache | ✓ |
| NFR-5 | auth / RBAC / injection safety | verified (S4); RBAC gap fixed | ✓ (after fixes) |
| NFR-6 | trilingual + offline-viewable mobile UI | i18n en/si/ta; cached screens + offline banner | ✓ |
| NFR-7 | maintainable, typed, tested | `tsc` clean; 52 unit + 168 case + Playwright | ✓ |
| NFR-8 | data integrity + backup | FK schema, validation guards, daily `pg_dump` | ✓ |
| NFR-9 | Android + iOS from one codebase | Expo cross-platform | ✓ |
| NFR-10 | auditability | `AuditLog`, `UserSessionLog` | ✓ |
