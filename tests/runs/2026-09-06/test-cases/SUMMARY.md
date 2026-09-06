# Excel Test-Case Execution — 2026-09-06

Live execution of all 100 documented test cases from
`tests/test-cases/Suraksha_Test_Cases.xlsx` against the running stack
(PostgreSQL + backend :3001 + frontend :5173 + ML :8000), **after** the code
fixes described below.

Runner: `tests/test-cases/run-and-update.cjs` — hits the real API, scores each
case Pass / Fail / N/A, writes Status / Tested By / Test Date / Notes back into
the workbook and rebuilds the **Summary** sheet.

## Result (post-fix)

| | Count |
|---|---|
| Total | 100 |
| **Pass** | **85** |
| **Fail** | **0** |
| N/A (not executable via API in this env) | 15 |
| Pass rate (of the 85 executed) | **100%** |

Progression this session: 76/8/16 (first run) → 84/1/15 (after the RBAC +
validation fixes) → **85/0/15** (after caching `GET /api/water/predictions`).
Per-module breakdown is in the workbook's **Summary** sheet. Machine-readable:
`results.json`, `results.tsv`.

## Fixes applied this session

| Was failing | Fix | File(s) |
|---|---|---|
| **TC-027** — any citizen could change any incident's status | Added `officerMiddleware` to `PATCH /api/incidents/:id/status` (ADMIN / DMC_OFFICER only); controller now also rejects an invalid `status` value with 400 | `backend/src/routes/incidentRoutes.ts`, `backend/src/controllers/incidentController.ts` |
| **TC-024 / TC-050 / TC-059** — missing required field returned HTTP 500 (`PrismaClientValidationError` leaked) | New `backend/src/utils/apiError.ts` (`HttpError`, `requireFields()`, `sendError()`); create controllers now validate required fields up-front and every affected `catch` maps validation-class errors to 400 (Prisma known-request errors → 400/404/409) | `apiError.ts` + incident / help-request / missing-person / donation controllers |
| **TC-030** — `?category=` filter ignored | `getIncidents` now passes `category` / `status` query params through to `getAllIncidents({...})`, which applies them as a Prisma `where` | `incidentController.ts`, `incidentService.ts` |
| **TC-066** — camp occupancy could exceed capacity | `updateOccupancy` now loads the camp and rejects `currentOccupancy` > `totalCapacity` (and negatives) with 400 | `backend/src/controllers/campController.ts` |
| **TC-087** — donation `amount: 0` accepted | `createDonation` rejects a non-positive `amount`, and requires a positive amount when `type === 'MONETARY'` | `backend/src/controllers/donationController.ts` |
| **TC-096** — k6 load p95 = 26 s (`/api/water/predictions` called the ML service once per gauge) | New `WaterLevelPrediction` cache table; endpoint serves from DB + a 60 s in-process response cache; hourly cycle persists results; startup warm-up. **k6 p95 26 s → 533 ms ✅** | `schema.prisma`, `water-predictor.ts`, `waterRoutes.ts`, `index.ts` — see `project_docs/water_predictions_caching.md` |

Regression checks (still pass): TC-014/TC-019 (admin alert create/deactivate),
TC-023/TC-025/TC-026 (incident create + officer status update), TC-063–TC-065
(camp list / create / occupancy 80), TC-046–TC-048 (help requests),
TC-085/TC-086 (donations), TC-037/038/040/041/042 (water predictions —
served from cache, same payload), plus the 52-test Vitest unit suite.
**No existing DB rows were modified** by the new table (backup taken first).

## Remaining failures: none

All 85 executable cases pass. The 15 N/A are genuinely not exercisable through
the API in this environment (see below).

## The 15 N/A cases

Mobile-app / offline / websocket behaviours (TC-034, TC-053, TC-070, TC-100);
features with no matching API route (TC-017, TC-068, TC-084); flows not wired in
the test env (TC-032, TC-077, TC-080); client-side sorting (TC-069); the ML-down
path while ML is up (TC-092); and the long / not-rerun k6 scenarios
(TC-097 stress, TC-098 spike, TC-099 soak — see `tests/k6/results/2026-08-23-baseline/`).

## Deviations recorded in the Notes column (not failures)

- Alert create / deactivate require **ADMIN** (`adminMiddleware`), not `DMC_OFFICER`.
- Route names differ from several steps: `/api/users/profile` (not `/me`);
  `…/my` not `…/mine` (incidents, help-requests, volunteer tasks);
  `/api/ai/analyze-report`, `/drift-status`, `/situation-summary`, `/optimize-resources`.
- Incident / HelpRequest `status` use the shared `Status` enum
  (`PENDING/ASSIGNED/IN_PROGRESS/RESOLVED/EN_ROUTE/ON_SITE`) — `DISPATCHED` is invalid.
- Prediction `confidence` is under `prediction.confidence`; flood levels are on the list payload.
- Seeded `admin@suraksha.gov` has 2FA on → the runner registers a fresh ADMIN.
- Duplicate detection is fire-and-forget after incident create (no inline `isDuplicate` flag).

## Re-running

```bash
# stack up: PG + backend :3001 + frontend :5173 + ML :8000
node tests/test-cases/run-and-update.cjs
```
Idempotent — overwrites the Status columns and Summary sheet each run.
