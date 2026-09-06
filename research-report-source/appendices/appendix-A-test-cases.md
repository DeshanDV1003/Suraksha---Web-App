# Appendix A — Test Cases

> Referenced from Chapter 5. In the report body write, e.g.:
> *"The platform was validated with 168 documented test cases across 26 modules;
> the complete catalogue with steps, expected results and outcomes is provided in
> **Appendix A**."* and hyperlink "Appendix A".

## A.1 Source of truth

`d:\Suraksha - Web App\tests\test-cases\Suraksha_Test_Cases.xlsx`

| Sheet | Contents |
|---|---|
| **Test Cases** | 168 rows — `TC-001…TC-100` (web/API) + `TC-M-001…TC-M-068` (mobile). Columns: TC ID · Module · Test Case Name · Description · Pre-Conditions · Test Steps · Expected Result · Priority · Type · Status · Tested By · Test Date · Notes. Status colour-coded (green Pass / red Fail / amber N/A). |
| **Summary** | Per-module Pass / Fail / N/A + overall totals. |
| **Load Testing Guide** | k6 commands and thresholds. |

Machine-readable results: `tests/runs/2026-09-06/test-cases/results.tsv`
(web) and `tests/runs/2026-09-06/mobile-test-cases/results.tsv` (mobile).

## A.2 How to reproduce

```bash
# from d:\Suraksha - Web App  — backend :3001, ML :8000, PostgreSQL :5432 running
node tests/test-cases/run-and-update.cjs     # web / API  (TC-001..100)
node tests/test-cases/run-mobile.cjs         # mobile app (TC-M-001..068)
```
Both runners register the accounts they need, call the live system as the client
would, score each case, write the Status/Notes columns back into the workbook,
and rebuild the Summary sheet.

## A.3 Results summary (2026-09-06 run)

| Section | Pass | Fail | N/A | Total |
|---|---|---|---|---|
| Web / API (TC-001–100) | 85 | 0 | 15 | 100 |
| Mobile (TC-M-001–068) | 57 | 3 | 8 | 68 |
| **Total** | **142** | **3** | **23** | **168** |
| Pass rate of the 145 executed | **98 %** | | | |

### Per-module (from the Summary sheet)

| Module | Pass | Fail | N/A | Module | Pass | Fail | N/A |
|---|---|---|---|---|---|---|---|
| Authentication | 12 | 0 | 0 | Mobile: Auth | 8 | 1 | 0 |
| Alerts | 9 | 0 | 1 | Mobile: Home | 4 | 0 | 0 |
| Incidents | 10 | 0 | 2 | Mobile: Reporting | 5 | 0 | 1 |
| Water Monitoring | 11 | 0 | 0 | Mobile: Offline Sync | 12 | 1 | 0 |
| Help Requests | 8 | 0 | 1 | Mobile: Alerts/Geo | 6 | 0 | 0 |
| Missing Persons | 8 | 0 | 0 | Mobile: Water | 3 | 0 | 0 |
| Relief Camps | 5 | 0 | 3 | Mobile: Family Safety | 3 | 0 | 0 |
| Users | 5 | 0 | 0 | Mobile: Relief Tokens | 2 | 0 | 1 |
| Volunteers | 3 | 0 | 2 | Mobile: API Contract | 9 | 0 | 0 |
| Resources | 3 | 0 | 1 | Mobile: Device | 2 | 0 | 5 |
| Donations | 4 | 0 | 0 | Mobile: i18n | 1 | 0 | 0 |
| AI Services | 6 | 0 | 1 | Mobile: Config | 1 | 1 | 0 |
| Performance | 1 | 0 | 4 | Mobile: Realtime | 1 | 0 | 1 |

## A.4 The 3 open findings (mobile)

| TC | Finding | Severity |
|---|---|---|
| TC-M-030 | Offline-sync retries create duplicate server records (10 % measured); `X-Original-Timestamp` sent but not used for de-dup | High |
| TC-M-003 | `authService.getProfile()` → `GET /api/auth/profile` returns 404 (dead code; app uses `/users/me`) | Low |
| TC-M-065 | JWT stored in plaintext `AsyncStorage`, not `expo-secure-store` | Medium (security) |

## A.5 Sample rows (paste 8–10 into the appendix as a formatted table; export the rest)

| TC ID | Module | Test Case | Expected Result | Priority | Type | Status |
|---|---|---|---|---|---|---|
| TC-001 | Authentication | Successful citizen login | HTTP 200, `{ token, user:{ role:'CITIZEN' } }` | High | Functional | Pass |
| TC-007 | Authentication | Access protected route without token | HTTP 401 | High | Security | Pass |
| TC-011 | Authentication | SQL injection in login email | HTTP 401, no crash / data leak | High | Security | Pass |
| TC-027 | Incidents | Citizen cannot update incident status | HTTP 403 | High | Security | Pass *(after fix)* |
| TC-037 | Water Monitoring | Get water-level predictions | HTTP 200, array with `predicted_t1_m`, `confidence`, `alert_level` | High | Functional | Pass |
| TC-047 | Help Requests | Public help request (no auth) | HTTP 201, request created | High | Functional | Pass |
| TC-096 | Performance | Dashboard/API load, 100 VU, 5 min | p95 < 1,500 ms, errors < 1 % | High | Performance | Pass *(after cache)* |
| TC-M-018 | Mobile: Reporting | Report incident while offline → queued | Row in SQLite `sync_queue` (`status='pending'`), UI shows "queued" | High | Functional | Pass |
| TC-M-027 | Mobile: Offline Sync | Reconnect (ideal) — queue drains 100 % | 100 % success, 0 % data loss (Q=10/50/100) | High | Performance | Pass |
| TC-M-030 | Mobile: Offline Sync | Duplicate on retry | No duplicate server records | High | Negative | **Fail** (10 % dup) |

> **For the full 168-row appendix:** open the workbook, copy the *Test Cases*
> sheet into the Word appendix as a table (landscape, small font), or export it
> to PDF and attach. Keep the heading **right-aligned** ("Appendix A") per the
> lecturer's guideline 26.
