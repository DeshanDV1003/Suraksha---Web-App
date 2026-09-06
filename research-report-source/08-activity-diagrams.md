# 08 — Activity Diagrams (Chapter 3 source — 3 main processes)

> Your lecturer requires **3 activity diagrams for the 3 main processes**, drawn
> in draw.io with proper UML notation (rounded start/end, action rectangles,
> diamond decisions, fork/join bars, swimlanes for actors). Each must be
> explained *before* the diagram with its assumptions.
>
> The three chosen processes are the ones central to the research contribution:
> **AD-1 Offline-first citizen incident report + sync**, **AD-2 ML severity
> triage with human-in-the-loop routing**, **AD-3 Automated river forecast →
> threshold alert dispatch**.

---

## AD-1 — Offline-First Citizen Incident Report & Synchronisation

**Process / module:** Mobile Incident Reporting + Offline Sync (`FR-INC-1`,
`FR-MOB-1..4`).
**What it represents:** the complete path a citizen's incident report takes from
the form on the phone to a persisted record in PostgreSQL, covering both the
online path and the offline-queue-and-later-sync path.
**Assumptions:** (1) the user is authenticated (token in local storage); (2) the
form is already validated client-side; (3) "offline" means the network request
fails or times out after 8 s — the app does not rely on a cached online flag;
(4) a 4xx response is a permanent failure (bad data) and is *not* queued; (5) the
local SQLite queue survives app restarts; (6) the connectivity monitor polls
every 8 s and a background task also drains the queue.
**Why designed this way:** the field reality is that the network fails exactly
when a citizen needs to report; a durable local queue with FIFO eventual sync
guarantees the report is never lost (`NFR-3`).

### Swimlanes: `Citizen (UI)` · `Mobile App Logic` · `Local SQLite Queue` · `Backend API` · `PostgreSQL`

### Steps

1. **(start)** Citizen taps "Submit report".
2. `Mobile App Logic`: set status = *submitting*; read auth token.
3. `Mobile App Logic`: **POST /api/incidents** with a 8 s abort timeout.
4. **Decision — did the request return?**
   - **Yes, HTTP 2xx** → step 5.
   - **Yes, HTTP 4xx** → set status = *error*, show the server message, **(end — not queued)**.
   - **Yes, HTTP 5xx** OR **No (timeout / network error)** → step 8 (queue).
5. `Backend API`: validate required fields (title, description, location, category).
   **Decision — valid?** No → return 400 → (back to step 4, 4xx branch).
6. `Backend API` **fork**:
   - branch A: geocode if no GPS → district zone lookup → **INSERT IncidentReport** (`PostgreSQL`).
   - branch B (after insert, async): call ML `/process-report` → write back severity/language/entities; run duplicate detection.
   **join.**
7. `Backend API`: emit `new-incident` on Socket.IO; return 201. `Mobile App Logic`: set status = *success*. **(end)**
8. `Local SQLite Queue`: **INSERT into `sync_queue`** (`type='INCIDENT_REPORT'`, `payload=JSON`, `status='pending'`, `attempts=0`).
9. `Mobile App Logic`: set status = *queued*; show "saved, will send when online". **(end of the submit flow)**
10. **(later — triggered by: connectivity restored / 8 s poll / background task / app foreground)**
    `Mobile App Logic`: `syncPendingItems()` — guard: only if `getIsOnline()` and not already syncing.
11. `Local SQLite Queue`: `SELECT * FROM sync_queue WHERE status='pending' AND attempts < max_attempts ORDER BY created_at ASC` (FIFO).
12. **Loop — for each pending item:**
    a. `Backend API`: **POST** the item to its mapped endpoint (`SYNC_HANDLERS[type]`) with headers `X-Offline-Sync: true`, `X-Original-Timestamp`.
    b. **Decision — response?**
       - 2xx → `Local SQLite Queue`: `markSynced(id)` (status='synced').
       - 4xx → `markFailed(id)` (permanent — status='failed').
       - 5xx / network error → `markFailed(id)` → `attempts++`; if `attempts >= 5` status='failed' else stays 'pending'.
    c. wait 300 ms (rate-limit).
13. **(end)** log remaining pending count.

### Key decision nodes to draw as diamonds
`request returned?` · `HTTP class (2xx / 4xx / 5xx)` · `fields valid?` ·
`online & not already syncing?` · `per-item response class` · `attempts >= max?`

---

## AD-2 — ML Severity Triage with Human-in-the-Loop Routing

**Process / module:** Incident enrichment + severity triage (`FR-INC-4`, RO2).
**What it represents:** how a new incident's severity is predicted, how the
prediction's *confidence* decides whether the system auto-accepts it or routes it
to a human reviewer, and how the reviewer's decision closes the loop.
**Assumptions:** (1) the XGBoost severity model and its label encoder are loaded;
(2) the model outputs calibrated class probabilities (temperature-scaled); (3)
the routing threshold (≈ 0.72–0.74) was tuned on a held-out calibration set, not
the test set; (4) under-triage (predicting a lower tier than truth) is treated as
more dangerous than over-triage; (5) if the ML service is unreachable the
incident keeps its default `MEDIUM` severity and is flagged for manual triage.
**Why designed this way:** a purely automatic classifier at ~80 % accuracy is not
safe for disaster triage on its own; routing the ~15–26 % least-confident cases
to a human captures a disproportionate share of the dangerous errors while still
automating the majority (RQ1).

### Swimlanes: `Backend` · `ML Service` · `DMC Officer (reviewer)` · `PostgreSQL`

### Steps

1. **(start)** `Backend`: new incident inserted (severity = MEDIUM default).
2. `Backend`: build the feature vector (affected population, hazard type,
   vulnerability flags: has_children / has_elderly / has_disabled, …) and
   **POST ML `/process-report`** (or `/analyze-report`).
3. **Decision — ML service reachable?**
   - No → `Backend`: keep MEDIUM, set `needsManualTriage = true`, write `MLLog`
     (prediction='UNAVAILABLE'). **(end)**
   - Yes → step 4.
4. `ML Service`: language detect → (translate if not English) → feature build →
   **XGBoost predict** → class probabilities `p`.
5. `ML Service`: apply **temperature scaling** to `p`; compute `max(p)` (and,
   optionally, a Stochastic-Perturbation-Ensemble spread and a conformal set).
6. `ML Service`: return `{ severity = argmax(p), confidence = max(p), entities,
   detected_language, translated_text }`.
7. `Backend`: **UPDATE IncidentReport** severity/mlConfidence/nlpEntities/…;
   write `MLLog`.
8. **Decision — confidence ≥ routing threshold?**
   - **Yes** → status stays as ML-assigned severity; incident enters the normal
     officer queue **auto-accepted**. **(end)**
   - **No** → step 9.
9. `Backend`: flag the incident `awaitingReview = true`; add it to the
   **human-review queue**; notify officers.
10. `DMC Officer`: opens the incident, reviews description + entities + map.
11. **Decision — officer agrees with ML severity?**
    - Yes → confirm; `reviewOutcomeAgree = true`.
    - No → officer sets the correct severity; `reviewOutcomeAgree = false`; the
      corrected case is added to the **active-learning re-annotation pool**.
12. `Backend`: **UPDATE IncidentReport** with the final severity; log history.
    **(end)**

### Metrics this process produces (report them in Chapter 5)
Auto-coverage (fraction auto-accepted), error-capture rate (share of all errors
caught by the routed cases), accepted accuracy, under-triage rate before vs after
routing. See `15-ml-evaluation.md §2`.

---

## AD-3 — Automated River Forecast → Threshold Alert Dispatch

**Process / module:** Hydrological monitoring + alerting (`FR-WTR-1..8`, RO3).
**What it represents:** the fully automated hourly cycle that ingests river data,
forecasts each gauge 2 hours ahead, and — only when a forecast crosses a
threshold with sufficient confidence — generates and multi-channel-dispatches an
alert to the correct downstream districts.
**Assumptions:** (1) the cron fires every hour on the hour; (2) each gauge needs
≥ 3 recent readings to be forecastable (≥ 12 is ideal); (3) an alert fires only
if `confidence ≥ 0.75` **and** either `predictedT1` or `predictedT2 ≥` the watch
threshold; (4) a per-(gauge, alert-level) 30-minute de-duplication window
prevents alert spam; (5) if a gauge has no `DownstreamMapping`, the alert targets
the gauge's own district only.
**Why designed this way:** a threshold breach 1–2 hours *before* it happens gives
downstream communities usable lead time; automating it removes the officer from
the time-critical loop while the confidence gate + de-dup window keep false
alarms low (RQ2).

### Swimlanes: `System Scheduler` · `Backend` · `ML Service` · `PostgreSQL` · `External Channels` · `Citizen`

### Steps

1. **(start — cron `0 * * * *`)** `System Scheduler` → `Backend`: begin hourly cycle.
2. `Backend`: `simulateDataFetch()` — pull/refresh river-gauge readings and store
   in `RiverWaterLevel`.
3. `Backend`: `evaluateThresholdsAndAlerts()` — check raw readings against
   watch/warning/critical; **decision — raw breach?** → generate a
   reading-based alert (rate-limited via `RainfallAlertLog`).
4. `Backend`: `runPredictionsForAllGauges()` — get the distinct active gauges.
5. **Loop — for each gauge (500 ms stagger):**
   a. `Backend`: fetch last ≤ 12 readings + matching rainfall; build the 7-feature
      sequence.
   b. **Decision — ≥ 3 readings?** No → skip gauge.
   c. `Backend` → `ML Service` **POST `/predict-water-level`** (sequence + gauge
      thresholds).
   d. `ML Service`: LSTM forward pass (or rule-based fallback) → `{ predicted_t1_m,
      predicted_t2_m, confidence, alert_level, reason }`.
   e. `Backend`: **UPSERT `WaterLevelPrediction`** (the cache row served to clients).
   f. **Decision — `confidence ≥ 0.75` AND threat within 2 h AND `alert_level ≠ NONE`?**
      - No → next gauge.
      - Yes → step 6.
   g. **Decision — same (gauge, alert-level) alerted in the last 30 min?**
      Yes → suppress, next gauge. No → step 6.
6. `Backend`: look up `DownstreamMapping[gauge]` → target district list
   (fallback: `[gauge.district]`).
7. `Backend`: fetch nearby `PublicSafePlace` safe zones for the message.
8. `Backend`: **INSERT `Alert`** (type WARNING/EMERGENCY, locations = target
   districts) + translate to Si/Ta.
9. `Backend` **fork — dispatch:**
   - `PostgreSQL`: INSERT `Notification` rows for affected users.
   - `External Channels`: Expo push · Twilio SMS · Nodemailer e-mail · Telegram.
   - Socket.IO: emit `new-alert` (+ safe-zone payload).
   **join.**
10. `Citizen` (mobile): receives the alert **only if** `isAlertNearby()` is true
    (inside the broadcast radius, or "All Island").
11. `Backend`: record `notifiedCount`; update the 30-min de-dup key.
12. **(end)** log cycle summary (`N gauges processed, M alerts fired`).

### Fork/join to draw
Step 6 in AD-1 (geocode ∥ ML enrichment) and step 9 in AD-3 (in-app ∥ push ∥ SMS
∥ e-mail ∥ Telegram) are true parallel branches — draw them with UML fork/join
bars.
