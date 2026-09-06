# Mobile App Test Cases — 2026-09-06

`D:\Suraksha - Mobile App` — the Expo / React Native client for this platform.
It talks to the **same backend** (`:3001`, tunnelled via the ngrok static domains
in `src/config.ts`).

68 mobile test cases (**TC-M-001 … TC-M-068**) were added to
`tests/test-cases/Suraksha_Test_Cases.xlsx` — appended after the 100 web cases,
which are **untouched** (still 85 Pass / 0 Fail / 15 N/A). Runner:
`tests/test-cases/run-mobile.cjs`.

## Result

| Section | Pass | Fail | N/A | Total |
|---|---|---|---|---|
| Web (TC-001–100) | 85 | 0 | 15 | 100 |
| **Mobile (TC-M-*)** | **57** | **3** | **8** | 68 |
| **Workbook total** | **142** | **3** | **23** | **168** — 98% of executed |

Records: `results.json`, `results.tsv` (this folder). Per-module breakdown in the
workbook's **Summary** sheet (now 26 modules).

## How the mobile cases were executed

- **API contract** (≈ 33 cases) — the runner calls the backend with the exact
  requests from the app's `src/services/api.ts` / `syncService.ts` and checks the
  response shape the app relies on.
- **Offline-sync logic** (12) — `useOfflineSubmit` decision tree + `localDB`
  queue schema/order/retry logic verified against the source; queue-drain
  scenarios scored from the app's own `offline_sync_results.json`.
- **Geo / alert-targeting** (6) — `src/utils/distance.ts` (`haversineKm`,
  `isAlertNearby`, `isWithinRadius`) is pure TS with no native imports; the runner
  transpiles and executes it directly.
- **Device / platform** (8) — camera, maps, push-token registration, background
  fetch, permission gates → **N/A** (need a real device / emulator); the
  underlying logic is verified by inspection where possible.

## The 3 failures — all genuine

| TC | Finding | Severity |
|---|---|---|
| **TC-M-030** | **Offline-sync retries create duplicate server records** — the "Duplicate Retry" scenario in `offline_sync_results.json` shows **10% duplicates**. `syncService` sends `X-Original-Timestamp` but the backend does not use it (or any client idempotency key) to dedup, so a retried SOS / incident / help-request that the server already accepted is written twice. For a disaster app this means duplicate emergency reports. | **High** |
| **TC-M-003** | `mobile authService.getProfile()` calls **`GET /api/auth/profile`, which returns 404** — the route doesn't exist. Dead code; the app works only because it uses `userService.getMe()` (`/api/users/me`) instead. Remove the method or add the alias. | Low |
| **TC-M-065** | **JWT stored in plaintext `AsyncStorage`** (`LoginScreen`, `api.ts` interceptor) rather than `expo-secure-store` — which is already a project dependency. On a rooted / jailbroken or backed-up device the token is readable. | Medium (security) |

## Notable deviations recorded in the Notes column (not failures)

- `POST /api/family/members` and `POST /api/assessments/damage` return **HTTP 500**
  (leaked Prisma validation error) when a required field is missing — the same
  class as the web TC-024 / TC-050 / TC-059, in controllers that weren't part of
  that fix (`familyController`, `damageAssessmentController`, and `locationController`).
  With the payloads the app actually sends they succeed (201), so these are
  scored **Pass** with a note.
- `POST /api/auth/google` returns 5xx for an invalid `idToken` (can't fully
  exercise without a real Google token) — scored N/A.
- Remote push notifications: `notificationService.ts` itself documents that Expo
  Go SDK 53+ returns `undefined`; only a dev build / APK gets a real token.

## The 8 N/A cases

Device / emulator required: voice report (TC-M-016), QR camera scan (TC-M-046),
push token (TC-M-056), permission gates (TC-M-058/059), background fetch
(TC-M-060), maps (TC-M-062), socket live connection (TC-M-066), plus the
un-exercisable Google OAuth path (TC-M-006).

## Re-running

```bash
# backend on :3001 (+ ML :8000 for a couple of checks)
node tests/test-cases/run-mobile.cjs
```
Idempotent — appends the TC-M-* rows once, then overwrites their results and
rebuilds the Summary each run. Run `run-and-update.cjs` (web) first if you want
both refreshed; whichever runs last rebuilds the shared Summary from all rows.
