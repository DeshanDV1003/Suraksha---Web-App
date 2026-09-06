# Suraksha — Documented Test Cases

`Suraksha_Test_Cases.xlsx` — 168 test cases: **TC-001 … TC-100** (web / API) plus
**TC-M-001 … TC-M-068** (the mobile app). Columns for Status / Tested By /
Test Date / Notes, and a **Summary** sheet with a per-module breakdown.

This is the human-readable test-case catalogue. It is distinct from:
- `tests/unit/` — Vitest unit tests
- `tests/playwright/` — automated E2E specs (`TC-PW-*`)
- `tests/k6/` — load / performance scripts

## Executing the cases against a running system

```bash
# Prereqs: PostgreSQL + backend :3001 + frontend :5173 + ML :8000 all up
node tests/test-cases/run-and-update.cjs    # web / API   (TC-001..100)
node tests/test-cases/run-mobile.cjs        # mobile app  (TC-M-001..068)
```

`run-and-update.cjs`:
- registers the test accounts it needs (citizen ×2, DMC officer, volunteer,
  hospital, a fresh admin — the seeded `admin@suraksha.gov` has 2FA on),
- calls the real API for every case that can be exercised that way,
- marks each case **Pass / Fail / N/A** with a note,
- writes the four result columns back into the workbook and rebuilds the
  **Summary** sheet (colour-coded: green / red / amber),
- drops `results.json` + `results.tsv` into `tests/runs/<date>/test-cases/`.

Idempotent — safe to re-run; each run overwrites the result columns.

## Regenerating the workbook structure (loses results)

```bash
cd backend && npx tsx scripts/generate-test-cases.ts
```
Writes a fresh workbook to `tests/test-cases/Suraksha_Test_Cases.xlsx`.

## Two suites in one workbook

- **Web / API — TC-001 … TC-100** — `run-and-update.cjs`
- **Mobile app — TC-M-001 … TC-M-068** — `run-mobile.cjs` (the Expo/RN client at
  `D:\Suraksha - Mobile App`, which uses the same backend). The mobile rows are
  *appended*; the web rows and their results are never touched.

The **Summary** sheet is rebuilt from every row by whichever runner runs last.

## Latest run — 2026-09-06

| | Pass | Fail | N/A |
|---|---|---|---|
| Web (TC-001–100) | 85 | 0 | 15 |
| Mobile (TC-M-*) | 57 | 3 | 8 |
| **Total (168)** | **142** | **3** | **23** — 98% |

Web: first pass 76/8/16 → all 8 failures fixed the same session (RBAC guard,
400-not-500 validation, category filter, camp-capacity, donation amount, and the
`/water/predictions` cache).
Mobile: 3 genuine findings (offline-retry duplicates, dead `getProfile()` route,
JWT in plaintext AsyncStorage).
Details: `tests/runs/2026-09-06/test-cases/SUMMARY.md` and
`tests/runs/2026-09-06/mobile-test-cases/SUMMARY.md`.
