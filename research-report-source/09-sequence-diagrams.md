# 09 — Sequence Diagrams (Chapter 3 source — 3 main processes)

> **3 sequence diagrams for the 3 main processes**, drawn in draw.io with UML
> notation (lifelines, activation bars, solid arrows = calls, dashed arrows =
> returns, `alt`/`opt`/`loop` combined fragments). Explain each before the
> figure. These mirror the three activity diagrams in `08` so the report is
> internally consistent (lecturer guideline 30).

Participants used across all three (draw as lifelines):
`Citizen (Mobile)` · `Mobile App Logic` · `SQLite Queue` · `Web (Officer)` ·
`Backend API` · `Auth Middleware` · `Prisma / PostgreSQL` · `ML Service` ·
`Socket.IO` · `External Channels` · `System Scheduler`.

---

## SD-1 — Offline-First Incident Report & Later Sync

**What it shows:** the exact message exchange for the online path, the offline
(queue) path, and the deferred sync — the interaction view of AD-1.
**Assumptions:** authenticated user; validated form; 8 s request timeout; 4xx =
permanent, 5xx/timeout = retryable.

```
Citizen(Mobile) -> MobileAppLogic : submit(reportData)
MobileAppLogic -> MobileAppLogic : status = "submitting"; read token (AsyncStorage)
MobileAppLogic -> BackendAPI : POST /api/incidents  {Authorization: Bearer JWT}  (timeout 8s)

alt request completes with 2xx
    BackendAPI -> AuthMiddleware : verify JWT
    AuthMiddleware --> BackendAPI : { userId, role }
    BackendAPI -> BackendAPI : requireFields(title,description,location,category)
    opt no lat/lng
        BackendAPI -> Nominatim : geocode(location)         (external)
        Nominatim --> BackendAPI : { lat, lng }
    end
    BackendAPI -> BackendAPI : findZoneForCoordinates()  (turf point-in-polygon)
    BackendAPI -> Prisma/PostgreSQL : INSERT IncidentReport
    Prisma/PostgreSQL --> BackendAPI : incident{ id }
    par async enrichment
        BackendAPI -> MLService : POST /process-report { text, features }
        MLService --> BackendAPI : { severity, confidence, entities, language }
        BackendAPI -> Prisma/PostgreSQL : UPDATE IncidentReport (ML fields), INSERT MLLog
    and duplicate detection
        BackendAPI -> BackendAPI : detectAndSaveDuplicates(incident)
        BackendAPI -> Prisma/PostgreSQL : INSERT IncidentDuplicateLink (if score >= 50)
    end
    BackendAPI -> Socket.IO : emit "new-incident"
    BackendAPI --> MobileAppLogic : 201 { id, message }
    MobileAppLogic --> Citizen(Mobile) : status = "success"

else request 4xx (validation)
    BackendAPI --> MobileAppLogic : 400 { message }
    MobileAppLogic --> Citizen(Mobile) : status = "error", show message   (NOT queued)

else request 5xx OR timeout / network error
    MobileAppLogic -> SQLiteQueue : INSERT sync_queue { type:'INCIDENT_REPORT', payload, status:'pending' }
    SQLiteQueue --> MobileAppLogic : queueId
    MobileAppLogic --> Citizen(Mobile) : status = "queued"
end

== later: connectivity restored / 8s poll / background task ==
MobileAppLogic -> MobileAppLogic : syncPendingItems()  [guard: online && !isSyncing]
MobileAppLogic -> SQLiteQueue : SELECT pending ORDER BY created_at ASC
SQLiteQueue --> MobileAppLogic : [items]
loop for each item
    MobileAppLogic -> BackendAPI : POST SYNC_HANDLERS[type].endpoint  {X-Offline-Sync, X-Original-Timestamp}
    alt 2xx
        BackendAPI --> MobileAppLogic : 201
        MobileAppLogic -> SQLiteQueue : markSynced(id)
    else 4xx
        MobileAppLogic -> SQLiteQueue : markFailed(id)   (permanent)
    else 5xx / error
        MobileAppLogic -> SQLiteQueue : markFailed(id)   (attempts++, retry if < 5)
    end
    MobileAppLogic -> MobileAppLogic : wait 300ms
end
```

---

## SD-2 — Severity Triage with Human-in-the-Loop Routing

**What it shows:** the interaction between the backend, the ML service and a DMC
officer when a new incident is triaged and its confidence decides auto-accept vs
human review — the interaction view of AD-2.
**Assumptions:** XGBoost model + label encoder loaded; calibrated probabilities;
routing threshold tuned on a calibration set; ML unreachable ⇒ default MEDIUM +
manual-triage flag.

```
BackendAPI -> Prisma/PostgreSQL : INSERT IncidentReport (severity = MEDIUM default)
BackendAPI -> BackendAPI : buildFeatureVector(incident)
BackendAPI -> MLService : POST /analyze-report { text, lat, lng }

alt ML service reachable
    MLService -> MLService : detect_language(text)
    opt language != "en"
        MLService -> MLService : translate_to_english(text)
    end
    MLService -> MLService : extract_entities(text)          (NER)
    MLService -> MLService : build_feature_vector(features)
    MLService -> MLService : xgb.predict_proba(x)  ->  p
    MLService -> MLService : temperature_scale(p);  conf = max(p);  (opt: SPE spread, conformal set)
    MLService --> BackendAPI : { severity, confidence, entities, detected_language, translated_text }
    BackendAPI -> Prisma/PostgreSQL : UPDATE IncidentReport (severity, mlConfidence, nlpEntities), INSERT MLLog

    alt confidence >= routingThreshold (~0.73)
        BackendAPI -> BackendAPI : auto-accept  (incident enters normal officer queue)
    else confidence < routingThreshold
        BackendAPI -> Prisma/PostgreSQL : UPDATE IncidentReport (awaitingReview = true)
        BackendAPI -> Socket.IO : emit "review-required"
        Web(Officer) -> BackendAPI : GET /api/incidents/:id
        BackendAPI --> Web(Officer) : incident + entities + duplicate links
        alt officer agrees
            Web(Officer) -> BackendAPI : PATCH /api/incidents/:id/status { confirm }
        else officer corrects
            Web(Officer) -> BackendAPI : PATCH /api/incidents/:id/status { severity: <corrected> }
            BackendAPI -> BackendAPI : add case to active-learning re-annotation pool
        end
        BackendAPI -> Prisma/PostgreSQL : UPDATE IncidentReport (final severity), INSERT IncidentHistory
    end

else ML service unreachable
    MLService --> BackendAPI : (timeout / connection refused)
    BackendAPI -> Prisma/PostgreSQL : UPDATE IncidentReport (needsManualTriage = true), INSERT MLLog(prediction='UNAVAILABLE')
end
```

---

## SD-3 — River Forecast → Threshold Alert Dispatch (hourly)

**What it shows:** the scheduler-driven interaction that turns raw gauge readings
into a forecast, then (conditionally) into a multi-channel alert delivered to the
right citizens — the interaction view of AD-3.
**Assumptions:** cron `0 * * * *`; ≥ 3 readings per gauge; alert only if
`confidence ≥ 0.75` and a threat within 2 h; 30-min per-(gauge, level) de-dup;
downstream-district mapping fallback = gauge's own district.

```
SystemScheduler -> BackendAPI : cron tick (hourly)
BackendAPI -> BackendAPI : simulateDataFetch()
BackendAPI -> Prisma/PostgreSQL : INSERT RiverWaterLevel[] (latest readings)
BackendAPI -> BackendAPI : evaluateThresholdsAndAlerts()   (raw-reading breaches)

BackendAPI -> Prisma/PostgreSQL : SELECT DISTINCT gauges (recent)
Prisma/PostgreSQL --> BackendAPI : [gauges]

loop for each gauge  (500ms stagger)
    BackendAPI -> Prisma/PostgreSQL : SELECT last 12 readings + rainfall (district)
    Prisma/PostgreSQL --> BackendAPI : readings
    opt readings >= 3
        BackendAPI -> MLService : POST /predict-water-level { gauge_id, thresholds, readings[12] }
        MLService -> MLService : scaler.transform(seq);  lstm.predict(seq)   (or rule-based fallback)
        MLService --> BackendAPI : { predicted_t1_m, predicted_t2_m, confidence, alert_level, reason }
        BackendAPI -> Prisma/PostgreSQL : UPSERT WaterLevelPrediction (gaugeId unique)

        alt confidence >= 0.75 AND (t1 or t2 >= watch) AND alert_level != NONE AND not de-duped (30 min)
            BackendAPI -> Prisma/PostgreSQL : SELECT DownstreamMapping[gauge]  (fallback [gauge.district])
            BackendAPI -> Prisma/PostgreSQL : SELECT nearby PublicSafePlace
            BackendAPI -> BackendAPI : translate message -> Si, Ta
            BackendAPI -> Prisma/PostgreSQL : INSERT Alert (locations = target districts)
            par dispatch
                BackendAPI -> Prisma/PostgreSQL : INSERT Notification[]
            and
                BackendAPI -> ExternalChannels : Expo push / Twilio SMS / Nodemailer / Telegram
            and
                BackendAPI -> Socket.IO : emit "new-alert" (+ safeZones)
            end
            Socket.IO --> Citizen(Mobile) : "new-alert"
            Citizen(Mobile) -> Citizen(Mobile) : isAlertNearby(alert, userLat, userLng) ?
            opt nearby OR "All Island"
                Citizen(Mobile) -> Citizen(Mobile) : show local notification
            end
            BackendAPI -> BackendAPI : update 30-min de-dup key; notifiedCount++
        end
    end
end
BackendAPI --> SystemScheduler : cycle summary { gauges, alertsFired }
```

---

## Drawing notes

- Use an **`alt`** combined fragment for the 2xx / 4xx / 5xx branching in SD-1 and
  the reachable / unreachable branching in SD-2.
- Use **`par`** for the parallel enrichment (SD-1), and the multi-channel dispatch
  (SD-3).
- Use **`loop`** for the per-item sync (SD-1) and per-gauge forecast (SD-3).
- Put activation bars on every lifeline while it is "doing work"; return arrows
  dashed.
- Keep participant order left→right roughly matching call flow to minimise
  crossing lines.
