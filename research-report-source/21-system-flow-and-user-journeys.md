# 21 — Actual System Flow & User Journeys

> A narrative walkthrough of **what each user actually does** and **how data
> moves** through Suraksha during a real disaster event. Use this for Chapter 1
> (§1.1 context / workflow), Chapter 4 (§ "how the modules work together"), and
> viva question 1 ("what is your research / how does it work").
>
> Two clients: the **Mobile App** (`D:\Suraksha - Mobile App`, Expo/React Native)
> used by citizens, volunteers and field responders; the **Web Dashboard**
> (`d:\Suraksha - Web App\frontend`, React) used by DMC officers, administrators
> and hospital staff. Both talk to the same **Backend API** (`:3001`) and
> **PostgreSQL**; the backend calls the **ML microservice** (`:8000`).

---

## PART A — What each user does (role by role)

### A.1 Citizen (mobile app) — `role = CITIZEN`

The citizen is the primary field data source.

| Action | Screen | What happens end-to-end |
|---|---|---|
| **Open the app / grant location** | `LocationGateScreen` | On first launch the app asks for foreground location; the gate blocks the main tabs until granted/skipped. GPS is then available for every report. |
| **See alerts relevant to me** | `HomeScreen`, `AlertsScreen` | The app fetches alerts + connects a Socket.IO client. For each alert it runs `isAlertNearby(alert, myLat, myLng)` — shows it only if I'm inside the alert's broadcast radius or it's tagged "All Island". A new `new-alert` socket event fires a local notification. |
| **Report an incident** | `ReportScreen` | I pick a category, type/speak a description (any of Si/Ta/En), attach a photo (camera/gallery, auto-resized to base64), and my GPS is auto-filled. Submit → `useOfflineSubmit('INCIDENT_REPORT','/incidents')`: tries the network (8 s timeout). **Online** → 201, done. **Offline / server error** → the report is written to the local SQLite `sync_queue` and shown as "queued"; it syncs automatically later. |
| **Trigger SOS** | `HomeScreen` (SOS button) | One tap → `POST /api/incidents/sos` with my GPS → a high-priority incident is created for officers. If offline it's queued as `SOS_PANIC`. |
| **Check river levels near me** | `WaterLevelScreen` | `GET /api/water/river` + `/api/water/predictions` — shows the current level, trend, flood thresholds and the LSTM T+1h/T+2h forecast for gauges in my district. |
| **Request help** | `HelpRequestsScreen` | `POST /api/help-requests` (type, description, people count, location). Queued offline as `HELP_REQUEST`. |
| **Report a missing person** | `MissingPersonsScreen` | `POST /api/missing-persons` (name, age, description, last seen, photo). Also browse the public missing list. |
| **Report property damage** | `DamageReportScreen` | `POST /api/assessments/damage` (category, structural/crop/utility/road damage levels, photos, estimated loss). The ML service scores it and estimates a cost; it then routes through an officer review workflow toward compensation eligibility. Queued offline as `DAMAGE_ASSESSMENT`. |
| **Manage family safety** | `FamilySafetyScreen` | Add family members (name, relation, phone). During an alert, broadcast "I am SAFE / NEEDS_HELP" with my location → `POST /api/family/status` → linked members see my status. Queued offline as `FAMILY_SAFETY_UPDATE`. |
| **Find a safe zone / route** | `SafeZoneScreen`, `SafeRouteScreen` | `GET /api/safe-zones?lat&lng` returns nearby verified safe places; the safe-route service returns a path that avoids known hazards. |
| **Find a relief camp** | `ReliefCampsScreen` | `GET /api/camps` — name, district, occupancy, services. Cached locally so it still shows offline. |
| **Use a relief token** | `ReliefTokenScreen` | View my issued tokens (`GET /api/relief-tokens/my`, cached for offline). At a camp, the officer scans my QR — or I scan the camp's — → `POST /api/relief-tokens/claim` validates the token (ACTIVE, not expired, under usage limit) and records the claim with location. Queued offline as `RELIEF_TOKEN_CLAIM`. |
| **Donate** | `DonateScreen` | `POST /api/donations` (monetary or material). Queued offline as `DONATION_SUBMIT`. |
| **Get psychological support** | `SupportScreen`, `ChatbotScreen` | Request counselling (type, urgency, anonymous option); a counsellor is assigned; check-ins are scheduled; a live 1:1 chat session runs over Socket.IO. |
| **Learn / prepare** | `PreparednessScreen`, `EducationScreen` | Reads 6 first-aid guides and 7 emergency numbers **fully offline** (pre-seeded in SQLite). |
| **Switch language** | `LanguageScreen` | en / si / ta; the whole UI switches. |

**The offline guarantee:** anything the citizen submits while the network is
down is saved locally and delivered when connectivity returns — FIFO, retried up
to 5 times, with 0% measured data loss.

### A.2 Volunteer / Field Responder (mobile app) — `role = VOLUNTEER` / `FIELD_RESPONDER`

Everything a citizen can do, **plus** (the bottom-tab set adds a **Tasks** tab):

| Action | What happens |
|---|---|
| **See my assigned tasks** | `GET /api/volunteers/tasks/my` — tasks an officer created and assigned to me from an incident. |
| **Update a task** | `PATCH /api/volunteers/tasks/:id/status` — ASSIGNED → IN_PROGRESS → RESOLVED; my `totalHours` accrue on completion; I may earn a badge. Queued offline as `TASK_STATUS_UPDATE`. |
| **Check in / out of a zone** | GPS check-in accrues active hours and puts me on the officer's live map. |
| **Log wellbeing** | physical + mental rating; a distress flag alerts a welfare officer. |
| **See recommended incidents** | skill + proximity matched incidents I could help with. |
| **Field responder: update incident status on-site** | EN_ROUTE / ON_SITE status transitions. |
| **Maintain my profile** | skills, trainings, readiness score. |

### A.3 Local Verifier (mobile + web) — a `LocalVerifier` record attached to a citizen user

Grama Niladhari / village officer / community leader / NGO officer.

| Action | What happens |
|---|---|
| **Confirm or reject an incident / help request in my jurisdiction** | `POST /api/incidents/verifier/verify` or `/api/help-requests/verifier/verify` → a `VerifierAction` (CONFIRMED / REJECTED / NEEDS_INVESTIGATION). This is local ground-truth that raises an incident's credibility. Queued offline as `REPORT_VERIFICATION`. |

### A.4 DMC Officer (web dashboard) — `role = DMC_OFFICER`

The officer runs the response from the command dashboard.

| Action | Page | What happens end-to-end |
|---|---|---|
| **Log in** | `/login` | e-mail + password → JWT (6 h). Lands on `/` (the officer dashboard). |
| **Assess the situation** | `/` `DashboardPage` | `GET /api/dashboard/stats` — active incidents, live alerts, camp occupancy, river status + trend charts. Everything updates live over Socket.IO (no refresh). |
| **Watch the map** | `/map` `MapPage` | Severity-coloured incident markers, relief camps, live volunteer/citizen positions, an incident-density heat layer. New incidents/alerts appear in real time. |
| **Triage incoming incidents** | `/incidents` `IncidentsPage` | Each new citizen incident arrives already enriched: the ML service has set its **severity**, detected/translated the language, and extracted entities (location, hazard, counts). Incidents the model was **confident** about are auto-accepted; **low-confidence** ones are flagged for my review. I open one, read the (English-normalised) description + entities + map + any duplicate links, and either **confirm** the severity or **correct** it (my correction feeds an active-learning pool). |
| **Handle duplicates** | `/incidents` | The backend has already linked near-identical reports (`GET /api/incidents/duplicates/pending`). I confirm or dismiss each link so I'm not dispatching resources twice for the same event. |
| **Update incident status & dispatch** | `/incidents` | `PATCH /api/incidents/:id/status` (officer-gated) — PENDING → ASSIGNED → IN_PROGRESS → RESOLVED. The reporter is notified automatically; the change is history-logged. I create a **Task** from the incident and assign it to a volunteer. |
| **Author an alert** *(alert creation is admin-gated; officers view + manage)* | `/suraksha-alerts` | View live alerts, delivery stats (notified count, acknowledgement rate), deactivate stale ones. |
| **Monitor rivers & manage forecasting** | `/water-monitor`, `/river-mappings` | See each gauge's level, trend, thresholds and LSTM forecast. Edit the **gauge → downstream-district mapping** so a forecast breach at an upstream gauge alerts the right downstream communities. Trigger a manual prediction cycle or a demo alert. |
| **Coordinate help requests** | `/help-requests` | See all requests (authenticated + public), view geographic **clusters** for efficient dispatch, assign responders, update status. Unattended requests escalate automatically. |
| **Manage rescue** | `/rescue` (via help-requests / map) | Register rescue vehicles, create missions (vehicle → area), track evacuated counts. |
| **Run relief camps** | `/camps` | Create camps, update occupancy (can't exceed capacity), manage residents (check-in/out), inventory (per item type + reorder threshold), schedules, inter-camp transfers, supply requests. |
| **Issue & track relief tokens** | `/tokens` | Issue QR-coded, category-scoped, usage-limited tokens (optionally a household bundle); see claim history and each token's fraud-risk score. |
| **Resource allocation** | `/resources` | Ask the ML service for an optimal multi-objective allocation across districts. |
| **Damage review** | `/damage-assessment` | Review citizen damage assessments (the ML cost estimate is attached): VERIFIED / REJECTED / SENIOR_REVIEW → APPROVED, with a compensation-eligibility decision. |
| **Missing persons** | `/missing-persons` | Manage reports, mark found/reunified, run a face match against shelter check-in photos. |
| **Hospital referrals** | (from camps) | Raise a patient referral from a camp to a hospital (patient, severity, transport). Hospital staff accept it. |
| **Analytics & briefing** | `/ai-research`, `/reports` | The AI research view shows model confidence, the uncertainty-routing threshold, and the district hotspot-risk forecast. The ML service produces a natural-language **situation summary** and a **drift** report. Export PDF/Excel reports. |

### A.5 Administrator (web dashboard) — `role = ADMIN`

Everything a DMC officer can do, **plus**:

| Action | Page | What happens |
|---|---|---|
| **Create / broadcast alerts** | `/suraksha-alerts` | `POST /api/alerts` (title, message, type INFO/WARNING/EMERGENCY, target districts, optional coordinates + broadcast radius, optional schedule). The backend stores it, **translates it to Sinhala & Tamil**, and fans it out over **five channels** simultaneously: in-app `Notification` rows, Expo push, Twilio SMS, Nodemailer e-mail, Telegram. Citizens receive it only if it's relevant to their location. |
| **User & role management** | `/users` | List all users, change a user's role, deactivate/delete a user, configure RBAC (per role × module: view/edit/delete). |
| **Delete incidents** | `/incidents` | admin-only. |
| **Enable 2FA** | `/settings` | TOTP via an enrolment QR; subsequent logins require the code. |
| **Audit & backups** | `/settings` / audit view | View the audit log and session logs; trigger a manual `pg_dump` backup (also runs daily at 02:00). |

### A.6 Hospital Staff (web dashboard) — `role = HOSPITAL_STAFF`

| Action | Page | What happens |
|---|---|---|
| **Manage bed capacity** | `/hospital/capacity` | Update `availableBeds` per ward. |
| **Accept & track patient referrals** | `/hospital/referrals` | A camp raised a referral (patient, condition severity, transport). I accept it and move it through PENDING → IN_TRANSIT → ADMITTED → DISCHARGED. Updates broadcast to the `hospital:<id>` Socket.IO room. |
| **Hospital dashboard** | `/hospital` | Overview of my hospital's load and incoming referrals. |

### A.7 The System itself (schedulers — no human)

| Job | Schedule | What it does |
|---|---|---|
| Water-data cron | hourly (`0 * * * *`) | Ingest gauge readings → check raw thresholds → re-evaluate open-incident priorities against current severe weather → run per-gauge LSTM forecasts → cache them → fire threshold alerts to downstream districts → emit `water_data_updated`. |
| Rainfall cron | every 30 min | Pull district rainfall (mm/hr, 24h/72h cumulative, risk level) from Open-Meteo into `RainfallReading`. |
| Prediction warm-up | 15 s after boot | Populate the forecast cache so the first user request is fast. |
| Escalation check | periodic | Unattended help requests → `HelpRequestEscalation` + notify officers. |
| DB backup | daily 02:00 | `pg_dump` → `D:\SurakshaBackups`, keep 7 days. |

---

## PART B — End-to-end operational flows (the "actual flow")

### FLOW 1 — A citizen reports a flood (online)

```
1. Citizen (mobile) opens ReportScreen, category = FLOOD, speaks a Sinhala description,
   attaches a photo, GPS auto-filled (6.9271, 79.8612).
2. Mobile → POST /api/incidents  (Bearer JWT).
3. Backend: authMiddleware verifies the token → requireFields OK.
4. Backend: (GPS present, skip geocoding) → zoneService.findZoneForCoordinates()
   = "Colombo" district (turf point-in-polygon).
5. Backend: INSERT IncidentReport (status PENDING, severity MEDIUM default).
6. Backend (async, non-blocking):
   a. → ML /process-report:  detect_language = "si" → translate to English →
      NER extracts {LOC: "Kelani River", INCIDENT: "flood", COUNT: "40 families"} →
      feature vector → XGBoost → severity = HIGH, confidence = 0.88.
   b. Backend: UPDATE IncidentReport (severity HIGH, mlConfidence 0.88, nlpEntities,
      detectedLanguage "si", translatedText) + INSERT MLLog.
   c. duplicateDetectionService: finds a report 800 m away, same category, 20 min old,
      shared entity "Kelani" → score 78 → INSERT IncidentDuplicateLink.
7. Backend: emit Socket.IO "new-incident" + "new-high-priority-incident";
   notifyAdmins("HIGH Incident Classified ...").
8. Backend → 201 to the mobile app → status "success".
9. Web dashboard (officer): the incident pops onto /map and /incidents live.
   confidence 0.88 ≥ threshold → auto-accepted into the queue.
10. Officer reviews it, sees the duplicate link, dismisses/confirms it, creates a
    Task, assigns it to a nearby volunteer.
11. Volunteer (mobile): sees the task, sets it IN_PROGRESS, then RESOLVED on-site;
    hours accrue.
12. Officer sets the incident RESOLVED → the citizen gets a notification
    "Your report 'Flood near Kelani' has been resolved."
```

### FLOW 2 — The same report, but the citizen is offline

```
1–2. Citizen submits; POST /api/incidents times out after 8 s (no signal).
3. useOfflineSubmit catches the AbortError → addToSyncQueue('INCIDENT_REPORT', payload)
   → INSERT sync_queue (status 'pending', attempts 0). UI shows "queued".
4. 25 minutes later the phone regains signal.
5. networkMonitor (8 s poll) detects isConnected = true → calls syncPendingItems().
6. syncService: SELECT * FROM sync_queue WHERE status='pending' ORDER BY created_at ASC.
7. For the item: POST /api/incidents with headers X-Offline-Sync: true,
   X-Original-Timestamp: <when it was actually made>.
8. Backend processes it exactly as FLOW 1 steps 3–8 → 201.
9. syncService: markSynced(id). The report is now in the system, in the right order,
   with its original timestamp. 0% data loss.
   (Known gap: if step 7 had succeeded but the response was lost, a retry would
    create a second record — the open idempotency issue, TC-M-030.)
```

### FLOW 3 — Automated river forecast → early warning (no human until the alert lands)

```
1. Cron fires (top of the hour). Backend ingests new gauge readings into RiverWaterLevel.
2. Backend: for gauge RG-KELANI-NAGALAGAM, current level 2.02 m (minor-flood level 1.52,
   major 2.13). Build the last 12 readings + Colombo rainfall into a 7-feature sequence.
3. Backend → ML /predict-water-level.
4. ML: LSTM → predicted_t1_m 2.18, predicted_t2_m 2.31, confidence 0.82,
   alert_level = WARNING (2.31 ≥ minor, < major), reason "rising 14% in 2h".
5. Backend: UPSERT WaterLevelPrediction (this row is what the dashboard + mobile
   WaterLevelScreen read — served in ~5 ms).
6. Backend: confidence 0.82 ≥ 0.75  AND  predicted level ≥ watch threshold  AND
   this (gauge, WARNING) was NOT alerted in the last 30 min  → generate an alert.
7. Backend: DownstreamMapping[RG-KELANI-NAGALAGAM] = ["Colombo", "Gampaha"].
   Fetch nearby PublicSafePlace safe zones. Translate the message to Si + Ta.
8. Backend: INSERT Alert (type WARNING, locations = ["Colombo","Gampaha"]).
9. Backend fans out in parallel:
   - INSERT Notification rows for affected users.
   - Expo push  +  Twilio SMS  +  Nodemailer e-mail  +  Telegram.
   - Socket.IO emit "new-alert" (+ safe-zone payload).
10. Citizen (mobile) in Gampaha: receives "new-alert"; isAlertNearby() = true
    (Gampaha is in the target list / within radius) → local notification:
    "⚠️ ML Flood Prediction — Gampaha. Kelani @ Nagalagam: 2.02 m now, AI predicts
     2.31 m in 2 hrs (82% confidence). Nearest safe zone: ...".
11. Citizen in Jaffna: also receives the socket event, but isAlertNearby() = false
    → nothing shown. (Geo-targeting keeps irrelevant alerts off phones.)
12. Officer (web): the alert and its delivery stats appear on /suraksha-alerts;
    the forecast chart on /water-monitor updates via the /water namespace.
```

### FLOW 4 — Relief token issuance and claim (fraud-resistant distribution)

```
1. A donor submits a monetary donation → funds a DonorCampaign.
2. Administrator/officer issues relief tokens from the campaign to affected citizens:
   POST /api/relief-tokens/issue → ReliefToken (unique code, QR data URI,
   categories [FOOD, MEDICAL], maxUsage 1, expiresAt +14 days, status ACTIVE).
3. Citizen (mobile): the token appears in ReliefTokenScreen; cached locally so it
   shows even with no signal at the camp.
4. At the relief camp, the officer scans the citizen's QR (expo-camera):
   POST /api/relief-tokens/claim { code, itemType: 'FOOD', quantity: 1, campId, location }.
5. Backend validates: token exists · status ACTIVE/PARTIALLY_USED · not expired ·
   usageCount < maxUsage.
6. Backend fraud heuristic: >1 claim in the last hour? +0.3 each. Large jump between
   consecutive claim locations (>~50 km)? +0.5. Updates fraudRiskScore.
7. Backend: INSERT ReliefTokenClaim (with location) · increment usageCount ·
   set status FULLY_USED (usage limit reached).
8. Officer sees the claim + the running fraud-risk score on /tokens.
```

### FLOW 5 — Family safety check-in during an alert

```
1. Citizen A has added family members B and C (with phone numbers) in FamilySafetyScreen.
2. An EMERGENCY alert for their district is broadcast (FLOW 3 / admin).
3. Citizen A taps "I am SAFE" → POST /api/family/status { status: SAFE, lat, lng }
   → INSERT SafetyCheckIn. (Queued as FAMILY_SAFETY_UPDATE if offline.)
4. Family members linked to A see A's status = SAFE with a location + timestamp on
   their FamilySafetyScreen (GET /api/family/my-status).
5. If a member reports NEEDS_HELP instead, that status is highlighted and can be
   escalated to a help request.
```

### FLOW 6 — Hospital referral from a camp

```
1. A relief-camp resident needs hospital care.
2. Officer (web /camps): raise a referral → POST /api/camps/:id/referrals
   { patientName, patientAge, conditionSeverity: HIGH, transportMethod: AMBULANCE }
   → HospitalReferral (status PENDING).
3. Socket.IO notifies the hospital:<id> room.
4. Hospital staff (web /hospital/referrals): accept → status IN_TRANSIT →
   on arrival ADMITTED (admittedAt set) → later DISCHARGED (dischargedAt).
5. Ward availableBeds decremented on admission, incremented on discharge.
6. The camp officer sees the referral status update live.
```

---

## PART C — How the pieces connect (one paragraph for Chapter 1)

> A citizen opens the **mobile app**, which sends their GPS periodically and lets
> them report incidents, request help, or check river levels in any of three
> languages — and if the network fails, every submission is saved to a local
> SQLite queue and delivered automatically on reconnection. Each report reaches
> the **backend**, which stores it in **PostgreSQL** and asks the **ML
> microservice** to classify its severity, translate it, and extract its
> entities; near-duplicate reports are linked automatically. **DMC officers** on
> the **web dashboard** see every incident, alert and camp on a live map that
> updates over Socket.IO; the ML model triages the queue for them, routing only
> the uncertain cases for human review. Every hour the system forecasts each
> river gauge two hours ahead and, when a forecast crosses a flood threshold with
> enough confidence, automatically issues a translated warning to the correct
> downstream districts across five channels — in-app, push, SMS, e-mail and
> Telegram — but only to citizens whose location makes the warning relevant.
> Administrators manage users, roles and broadcast alerts; hospital staff manage
> bed capacity and accept patient referrals from relief camps; volunteers pick up
> field tasks on the same mobile app. One database, one API, four cooperating
> layers.
