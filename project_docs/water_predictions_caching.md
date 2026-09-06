# Water predictions — caching (2026-09-06)

## Problem

`GET /api/water/predictions` called the ML service **once per gauge** (up to 50)
on every request. The ML service (`uvicorn`, single worker, synchronous TF/LSTM
inference) serialised them → **p95 ≈ 26 s** under load, and it timed out the
Playwright mobile contract test (TC-PW-M-015) and breached the k6 load threshold
(TC-096). The hourly prediction cycle already computed the same values but threw
them away.

## Fix — persist predictions, serve from DB

### New table: `WaterLevelPrediction`

One row per gauge (`gaugeId @unique`): `predictedT1M/T2M`, `confidence`,
`alertLevel`, `modelUsed`, `reason`, `predictedAt`, `computedAt`, `updatedAt`.

Added to `backend/prisma/schema.prisma`. The table was created with an explicit
additive `CREATE TABLE` (no `prisma migrate` — the project tracks schema via
`prisma db push`, and a `migrate dev` here would have prompted a reset). A DB
backup was taken first: `D:\SurakshaBackups\manual_before_predictions_table_20260906-1249.sql`.
Verified: **zero rows changed in any existing table.**

```sql
CREATE TABLE "WaterLevelPrediction" (
  "id" TEXT PRIMARY KEY, "gaugeId" TEXT NOT NULL,
  "predictedT1M" DOUBLE PRECISION NOT NULL, "predictedT2M" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL, "alertLevel" TEXT NOT NULL,
  "modelUsed" TEXT NOT NULL, "reason" TEXT NOT NULL,
  "predictedAt" TIMESTAMP(3) NOT NULL,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "WaterLevelPrediction_gaugeId_key" ON "WaterLevelPrediction"("gaugeId");
```

### Write path

- `runPredictionsForAllGauges()` (`water-predictor.ts`) now `upsert`s each result
  into `WaterLevelPrediction`. It gained an `{ dispatchAlerts }` option — the
  hourly cron keeps `true`; the read-path background refresh and the startup
  warm-up pass `false` (compute + cache only, no Telegram / mobile alerts).
- `index.ts` fires one `runPredictionsForAllGauges({ dispatchAlerts: false })`
  ~15 s after boot to warm the cache.

### Read path (`GET /api/water/predictions`)

1. In-process response cache, 60 s TTL — the payload only changes hourly.
2. On a miss: read the gauge list + `WaterLevelPrediction` rows (2 DB queries).
3. Gauge with **no** row → compute inline (bounded; first-ever call only).
4. Gauge with a **stale** row (> 90 min) → return it now, refresh in the
   background (single-flight lock, no alert dispatch).
5. Concurrent misses are collapsed onto one build (single-flight promise).

`GET /api/water/predictions/:gaugeId` serves the cached row if fresh, else
computes live and caches it.

Response shape is unchanged; one field added: `predictionStale: boolean`.

## Result

| | Before | After |
|---|---|---|
| `GET /predictions` single call | ~4–26 s | **~5 ms** (cached) / ~0.2 s (miss) |
| k6 load 100 VU, 5 min — `http_req_duration` p95 | 26 s ❌ | **533 ms** ✅ |
| k6 — `water_predictions_duration` p95 | 35 s | **243 ms** |
| k6 — throughput | 6.5 req/s | **64 req/s** |
| k6 — error rate | 0% | 0% |
| TC-096 / TC-PW-M-015 | Fail | **Pass** |

## Files

`backend/prisma/schema.prisma`, `backend/src/services/water-predictor.ts`,
`backend/src/routes/waterRoutes.ts`, `backend/src/index.ts`.
