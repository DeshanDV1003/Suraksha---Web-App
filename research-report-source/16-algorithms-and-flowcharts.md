# 16 — Algorithms & Flowcharts (Chapter 4 source)

> Lecturer guideline 9: for each algorithm — **identify → main code snippet →
> explain (input / processing / decision / output / conditions) → flowchart**, and
> the four must be consistent. This file provides that for the six algorithms
> that matter to the research. Put 2–3 in the chapter, the rest in Appendix E.
> Draw each flowchart in draw.io (start/end rounded, process rectangles, decision
> diamonds).

---

## ALG-1 — Prediction Cache & Serve (river forecasts)

**Where:** `backend/src/routes/waterRoutes.ts`, `services/water-predictor.ts`.
**Why it's a research artefact:** it is the fix that made the ML-forecast endpoint
scale (p95 26 s → 533 ms) — a concrete performance-engineering contribution.

**Input:** an HTTP `GET /api/water/predictions` request.
**Output:** a JSON array — one object per gauge with current level, trend, and a
`prediction {predictedT1M, predictedT2M, confidence, alertLevel, reason}` +
`predictionStale` flag.

### Snippet (the serve path)

```ts
if (responseCache && Date.now() < responseCache.expires) return responseCache.body;  // 60 s TTL
if (!inFlight) inFlight = buildPayload().finally(() => inFlight = null);              // single-flight
return await inFlight;

async function buildPayload() {
  const gauges = await prisma.riverWaterLevel.findMany({ distinct:['gaugeId'], take:50 });
  const cached = await prisma.waterLevelPrediction.findMany({ where:{ gaugeId:{ in: ids }}});
  for (g of gauges) {
    c = cache.get(g.gaugeId);
    if (!c)              missing.push(g);                     // never forecast -> compute inline (bounded)
    else if (stale(c))  stale.push(g);                       // > 90 min -> serve now, refresh in background
  }
  await Promise.allSettled(missing.map(computeAndSave));
  if (stale.length) void refreshPredictions(stale);          // single-flight lock, no alert dispatch
  responseCache = { body: results, expires: Date.now() + 60_000 };
  return results;
}
```

### Explanation
- **Processing:** try the 60 s in-process cache → collapse concurrent misses onto
  one build → read the `WaterLevelPrediction` table (2 DB queries, no ML calls).
- **Decisions:** *response cache fresh?* · *cache row missing?* (compute inline) ·
  *cache row stale (>90 min)?* (return now, refresh async) · *background refresh
  already running?* (skip — single-flight).
- **Conditions:** the hourly cron `upsert`s every gauge, so the common path never
  touches the ML service. A 15 s post-boot warm-up populates the cache.

### Flowchart nodes
`(start) → cache fresh? ─yes→ return cached → (end)` /
`─no→ inFlight exists? ─yes→ await it → return` /
`─no→ query gauges + cache rows → for each gauge: missing? / stale? →
compute-inline missing (parallel) → fire background refresh for stale →
set 60 s cache → return → (end)`

---

## ALG-2 — LSTM River-Level Forecast (per gauge)

**Where:** `suraksha-ml/ml/lstm_water_predictor.py` (`predict()`),
`backend/src/services/water-predictor.ts` (`getPrediction()`).

**Input:** `gaugeId`, gauge thresholds `{watch_m, warning_m, critical_m}`, and the
last ≤ 12 readings (each: `water_level_m, rainfall_mm_hr, rainfall_24h_total,
humidity_pct, temp_c, month`).
**Output:** `{predicted_t1_m, predicted_t2_m, confidence, alert_level, reason}`.

### Snippet

```python
def predict(readings, gauge_thresholds):
    if len(readings) < 3: return None
    # 1. feature matrix: add rate_of_change = level[i] - level[i-1]
    X = build_features(readings)                       # (<=12, 7)
    # 2. pad/truncate to SEQUENCE_LENGTH=12, MinMax-scale with the fitted scaler
    Xs = scaler.transform(pad_or_truncate(X, 12))
    if model_loaded:
        y1, y2 = model.predict(Xs[np.newaxis, ...])[0]  # normalised
        t1, t2 = inverse_scale_level(y1), inverse_scale_level(y2)
        confidence = 1 - min(model_uncertainty(Xs), 0.25) / 0.25   # heuristic band
    else:
        t1, t2, confidence = rule_based_extrapolation(readings)    # documented fallback
    alert_level = classify(max(t1, t2), gauge_thresholds)          # NONE/WATCH/WARNING/CRITICAL
    return {predicted_t1_m: t1, predicted_t2_m: t2, confidence, alert_level, reason}
```

### Explanation
- **Input guard:** need ≥ 3 readings; ideally 12.
- **Processing:** derive `rate_of_change`; scale; LSTM forward pass → 2 outputs
  (T+1, T+2); inverse-scale to metres.
- **Decision:** `max(predicted level) ≥ critical / warning / watch threshold?` →
  `alert_level`.
- **Output condition for alerting (in the orchestrator):** fire an alert only if
  `confidence ≥ 0.75` AND `alert_level ≠ NONE` AND not de-duped in the last 30 min.
- **Fallback:** if TensorFlow / model file is unavailable, a rule-based linear
  extrapolation is used (documented, lower confidence).

### Flowchart nodes
`(start) → readings ≥ 3? ─no→ return null` /
`─yes→ build features + rate_of_change → scale → model loaded? ─yes→ LSTM predict
T+1,T+2 → inverse-scale ─no→ rule-based extrapolate → classify alert_level vs
thresholds → return prediction → (end)`

---

## ALG-3 — Severity Triage + Uncertainty Routing

**Where:** `suraksha-ml/ml/uncertainty_triage.py`, `feature_builder.py`,
`train_classifier.py`; backend `incidentController` + review queue.

**Input:** incident features (affected population, hazard type, has_children /
has_elderly / has_disabled, …).
**Output:** `{severity ∈ {LOW,MEDIUM,HIGH,CRITICAL}, confidence, route ∈
{auto, human}}`.

### Snippet

```python
p_raw = xgb.predict_proba(x)[0]                  # 4-class probabilities
p = softmax(logit(p_raw) / T)                    # temperature scaling (T tuned on calibration set)
pred = classes[argmax(p)]
conf = max(p)                                    # (optionally: SPE spread, conformal set size)
route = "auto" if conf >= THRESHOLD else "human" # THRESHOLD ~0.73, tuned on calibration set
```

### Explanation
- **Input:** the 12-dim feature vector.
- **Processing:** XGBoost → raw class probabilities → **temperature scaling** for
  calibration → `argmax` = severity, `max(p)` = confidence.
- **Decision:** `confidence ≥ THRESHOLD` → **auto-accept**; else → **route to a
  DMC officer** for review; the officer's correction (if any) feeds an
  active-learning pool.
- **Conditions:** THRESHOLD is tuned on a held-out *calibration* set, not the test
  set; under-triage is weighted as more costly than over-triage.
- **Output metrics:** coverage, error-capture rate, accepted accuracy — see
  `15 §15.1.4`.

### Flowchart nodes
`(start) → build feature vector → XGBoost predict_proba → temperature-scale →
severity = argmax, conf = max(p) → conf ≥ threshold? ─yes→ auto-accept → (end)` /
`─no→ add to human-review queue → officer reviews → officer agrees? ─yes→ confirm
─no→ correct severity + add to re-annotation pool → write final severity → (end)`

---

## ALG-4 — Incident Duplicate Detection

**Where:** `backend/src/services/duplicateDetectionService.ts`.

**Input:** a newly-created incident; the set of recent incidents of the same
category within a 6-hour window.
**Output:** zero or more `IncidentDuplicateLink` rows (score ≥ 50).

### Snippet

```ts
for (const cand of candidates) {                       // same category, < 6h old, not RESOLVED
  let score = 0;
  if (bothHaveCoords) {
    const d = haversineMetres(new.lat,new.lng, cand.lat,cand.lng);
    if (d <= 1000) score += 40 * (1 - d/1000);         // LOCATION: up to 40, tapering
  }
  score += 30;                                          // CATEGORY: always (already filtered)
  const dt = |new.createdAt - cand.createdAt|;
  if (dt <= 6h) score += 20 * (1 - dt/6h);              // TIME: up to 20
  const ov = nlpEntityOverlap(new.nlpEntities, cand.nlpEntities);   // Jaccard-like on entity texts
  if (ov > 0) score += 10 * ov;                         // NLP: up to 10
  if (score >= 50)                                       // persist a link; older report = canonical
    createLink({ reportId, canonicalId, score, distanceM, reasons });
}
```

### Explanation
- **Weighted additive scoring:** LOCATION 40 (Haversine, linear taper to 1 km) +
  CATEGORY 30 (exact match, guaranteed by the candidate filter) + TIME 20 (linear
  taper over 6 h) + NLP 10 (entity-text overlap ratio).
- **Decision:** `score ≥ 50` → create a link; the **older** incident becomes the
  canonical, the newer the possible duplicate.
- **Conditions:** fire-and-forget (never blocks the create response); an officer
  confirms/dismisses each link (`PENDING → CONFIRMED / DISMISSED`).
- Unit-tested: `haversineMetres` (Colombo→Kandy ≈ 94 km, symmetry, monotonic),
  `nlpEntityOverlap` (identical→1, partial→intersection/max, case-insensitive).

### Flowchart nodes
`(start) → fetch candidates (same category, <6h, not resolved) → for each: score=0
→ both have coords & dist ≤1km? +LOCATION → +CATEGORY → Δt ≤6h? +TIME → entity
overlap >0? +NLP → score ≥ 50? ─yes→ create duplicate link (older=canonical)
─no→ skip → next → (end)`

---

## ALG-5 — Geo-Targeted Alert Relevance (`isAlertNearby`)

**Where:** mobile `src/utils/distance.ts`.

**Input:** an alert `{latitudes[], longitudes[], locations[], broadcastRadiusKm?}`
and the user's `(userLat, userLng)`.
**Output:** boolean — show this alert to this user?

### Snippet

```ts
if (alert.locations.includes('All Island')) return true;      // explicit island-wide override
if (alert.latitudes.length === 0) return false;               // no coords, not island-wide -> hide
const radius = alert.broadcastRadiusKm ?? 10;                 // conservative default
for (let i = 0; i < alert.latitudes.length; i++)
  if (haversineKm(userLat, userLng, alert.latitudes[i], alert.longitudes[i]) <= radius)
    return true;
return false;
```

### Explanation
- **Decisions in order:** (1) tagged "All Island"? → show everyone. (2) no
  coordinates? → hide (don't spam untargeted alerts). (3) within `radius` km
  (default 10) of *any* alert coordinate? → show.
- **Why:** keeps irrelevant alerts off citizens' phones — a Colombo flood warning
  should not notify a user in Jaffna. Unit-tested (TC-M-032…036).

### Flowchart nodes
`(start) → "All Island" tag? ─yes→ return true` /
`─no→ has coordinates? ─no→ return false` /
`─yes→ radius = broadcastRadiusKm or 10 → for each coord: haversineKm ≤ radius?
─yes→ return true → after loop → return false → (end)`

---

## ALG-6 — Offline Sync Queue Drain (FIFO with bounded retry)

**Where:** mobile `src/services/syncService.ts`, `src/storage/localDB.ts`.

**Input:** the `sync_queue` SQLite table; the current connectivity state.
**Output:** each queued item ends `synced` or `failed`; server records created;
0 % data loss.

### Snippet

```ts
async function syncPendingItems() {
  if (isSyncing || !getIsOnline()) return;                     // guards
  isSyncing = true;
  const pending = await db.getAllAsync(
    `SELECT * FROM sync_queue WHERE status='pending' AND attempts<max_attempts ORDER BY created_at ASC`); // FIFO
  for (const item of pending) {
    const h = SYNC_HANDLERS[item.type];                         // {method, endpoint}
    const res = await fetch(API + endpoint(item.payload), {
      method: h.method, headers: { Authorization, 'X-Offline-Sync':'true', 'X-Original-Timestamp': item.created_at },
      body: item.payload });
    if (res.ok)                       await markSynced(item.id);
    else if (res.status >= 400 && res.status < 500) await markFailed(item.id, `HTTP ${res.status}`);  // permanent
    else                              await markFailed(item.id, `HTTP ${res.status}`);                 // retry (attempts++)
    await sleep(300);                                           // rate-limit
  }
  isSyncing = false;
}
// markFailed: attempts++; status = attempts >= max_attempts ? 'failed' : 'pending'
```

### Explanation
- **Guards:** never run twice concurrently; never run offline.
- **Ordering:** strict FIFO by `created_at` — reports are delivered in the order
  they were made.
- **Decision per item:** 2xx → `synced`; 4xx → `failed` (bad data, never retry);
  5xx / network → `failed`-then-`pending` with `attempts++`, giving up after 5.
- **Triggers:** connectivity restored, 8 s poll, app foreground, background task.
- **Known gap:** a retried item the server already accepted is written twice (10 %
  duplicates measured) — `X-Original-Timestamp` is sent but not used server-side
  for de-dup. Future work: a client idempotency key + server upsert. (TC-M-030.)

### Flowchart nodes
`(start / trigger) → online & not syncing? ─no→ (end)` /
`─yes→ SELECT pending ORDER BY created_at → for each item: POST to mapped endpoint
→ 2xx? ─yes→ markSynced ─no→ 4xx? ─yes→ markFailed(permanent) ─no→ attempts++;
attempts ≥ 5? ─yes→ failed ─no→ stays pending → wait 300ms → next → (end)`
