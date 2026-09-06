# 04 — Requirements Specification (Chapter 3 source, part 2 / SRS)

## 4.1 Stakeholders & actors

| Actor | Role in the system | Primary client |
|---|---|---|
| **Citizen** (`CITIZEN`) | Reports incidents / damage / missing persons, requests help, checks water levels & alerts, manages family safety, claims relief tokens, donates | Mobile app (primary), public web portals |
| **Volunteer** (`VOLUNTEER`) | Accepts and updates field tasks, checks in/out of zones, logs wellbeing, sees recommended incidents | Mobile app + web |
| **Field Responder** (`FIELD_RESPONDER`) | Updates incident status on-site, EN_ROUTE/ON_SITE tracking | Mobile app |
| **DMC Officer** (`DMC_OFFICER`) | Verifies & triages incidents, creates/deactivates alerts, manages relief camps & resources, assigns tasks, runs analytics | Web command dashboard |
| **Administrator** (`ADMIN`) | Full control: user & role management, RBAC config, all officer functions, system audit, backups | Web command dashboard |
| **Hospital Staff** (`HOSPITAL_STAFF`) | Manages hospital bed capacity, accepts/updates patient referrals from camps | Web (hospital pages) |
| **Local Verifier** (Grama Niladhari / community leader — a `LocalVerifier` record on a user) | Confirms / rejects citizen reports in their jurisdiction | Mobile + web |
| **System / scheduler** (non-human) | Hourly water-data cron, 30-min rainfall cron, prediction cycle, daily DB backup, escalation checks | — |
| **External services** (non-human) | Twilio, Nodemailer, Expo Push, Telegram, Open-Meteo, Nominatim | — |

## 4.2 Functional requirements — by module

Numbering: **FR-<module>-<n>**. Each is implemented; the "route/screen" column is
the evidence anchor.

### 4.2.1 Authentication & User Management (`FR-AUTH`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-AUTH-1 | A user can register with name, e-mail, password, phone and role; passwords are stored bcrypt-hashed | `POST /api/auth/register`, `authService.registerUser` |
| FR-AUTH-2 | A user can log in with e-mail + password and receive a signed JWT (6 h expiry) carrying `userId` and `role` | `POST /api/auth/login`, `authService.loginUser` |
| FR-AUTH-3 | A user can log in with Google (OAuth) — citizens & volunteers only | `POST /api/auth/google`, `googleLoginUser` |
| FR-AUTH-4 | Administrators can enable **TOTP two-factor authentication**; a 2FA-enabled login returns `requires2FA` until a valid code is supplied | `POST /api/auth/2fa/setup`, `/2fa/verify`, `speakeasy` |
| FR-AUTH-5 | Every request to a protected route must present a valid JWT; invalid/absent → HTTP 401 | `authMiddleware` |
| FR-AUTH-6 | Role-gated routes reject the wrong role → HTTP 403 (`adminMiddleware`, `officerMiddleware`, `hospitalMiddleware`) | `middleware/auth.ts` |
| FR-AUTH-7 | A user can view and update their own profile; change their password | `GET /api/users/me`, `PATCH /api/users/profile`, `POST /api/auth/change-password` |
| FR-AUTH-8 | Administrators can list all users, change a user's role, and deactivate/delete a user | `GET /api/users`, `PATCH /api/users/:id/role`, `DELETE /api/users/:id` |
| FR-AUTH-9 | Login sessions are logged (IP, device, location) | `UserSessionLog` |
| FR-AUTH-10 | RBAC permissions per (role, module) are configurable | `RolePermission`, `GET/POST /api/users/rbac` |

### 4.2.2 Incident Management (`FR-INC`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-INC-1 | A citizen can report an incident (title, description, category, location text, lat/lng, optional images) | `POST /api/incidents` |
| FR-INC-2 | If lat/lng are omitted but a location string is given, the backend geocodes it (Nominatim) | `geocodeAddress` |
| FR-INC-3 | On creation the backend performs a **zone lookup** (which of the 25 SL districts contains the point) via point-in-polygon | `findZoneForCoordinates` (@turf) |
| FR-INC-4 | On creation the ML service is called asynchronously to classify **severity**, detect language, translate, and extract entities; results are written back to the incident | `processReport` → ML `/process-report` |
| FR-INC-5 | On creation a **duplicate-detection** pass links near-identical incidents (location + category + time + entity overlap ≥ score threshold) | `detectAndSaveDuplicates` |
| FR-INC-6 | An officer/admin can list, filter (by category/status) and view incidents | `GET /api/incidents`, `GET /api/incidents/:id` |
| FR-INC-7 | A citizen can list only their own incidents | `GET /api/incidents/my` |
| FR-INC-8 | Only officers/admins can change an incident's status; status changes are history-logged and notify the reporter | `PATCH /api/incidents/:id/status` (officer-gated), `IncidentHistory` |
| FR-INC-9 | Only admins can delete an incident | `DELETE /api/incidents/:id` (admin-gated) |
| FR-INC-10 | An officer/admin can review pending duplicate links and confirm/dismiss them | `GET /api/incidents/duplicates/pending`, `PATCH /api/incidents/duplicates/:linkId` |
| FR-INC-11 | A citizen can trigger an **SOS** which creates a high-priority incident from GPS | `POST /api/incidents/sos` |
| FR-INC-12 | A local verifier can confirm/reject an incident in their jurisdiction | `POST /api/incidents/verifier/verify`, `VerifierAction` |

### 4.2.3 Alert Management (`FR-ALT`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-ALT-1 | An administrator can create an alert (title, message, type INFO/WARNING/EMERGENCY, target locations, optional coordinates + broadcast radius, optional schedule) | `POST /api/alerts` (admin-gated) |
| FR-ALT-2 | Alert creation records it in PostgreSQL and dispatches via **in-app, push (Expo), SMS (Twilio), e-mail (Nodemailer) and Telegram** | `alert-generator.ts`, `channelDeliveryService.ts` |
| FR-ALT-3 | Alerts are translated to Sinhala & Tamil for storage | `translatedMsgSinhala`, `translatedMsgTamil` |
| FR-ALT-4 | Citizens see only alerts **relevant to their location** — inside the broadcast radius of the alert's coordinates, or tagged "All Island" | mobile `isAlertNearby` (`utils/distance.ts`) |
| FR-ALT-5 | An administrator can deactivate or delete an alert | `PATCH /api/alerts/:id/deactivate`, `DELETE /api/alerts/:id` |
| FR-ALT-6 | Alert delivery statistics (notified count, acknowledgement rate) are tracked | `Alert.notifiedCount`, `GET /api/alerts/:id/delivery` |
| FR-ALT-7 | A citizen can acknowledge an alert | `POST /api/alerts/:id/acknowledge` |

### 4.2.4 River & Rainfall Monitoring (`FR-WTR`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-WTR-1 | The system ingests river-gauge readings (level, flow, thresholds, status, trend) hourly | `water-data-fetcher` cron (`0 * * * *`), `RiverWaterLevel` |
| FR-WTR-2 | The system ingests district rainfall (mm/hr, 24 h/72 h cumulative, risk level) every 30 min from Open-Meteo | `rainfallWeatherCron`, `RainfallReading` |
| FR-WTR-3 | Any authenticated user can view latest river levels and rainfall | `GET /api/water/river`, `/api/water/rainfall` |
| FR-WTR-4 | The ML service forecasts each gauge's level **T+1 h and T+2 h** with a confidence and an alert level; forecasts are cached in `WaterLevelPrediction` and served from there | `water-predictor.ts`, ML `/predict-water-level` |
| FR-WTR-5 | When a forecast crosses a gauge threshold with confidence ≥ 0.75, an alert is generated and dispatched to the **downstream districts** mapped for that gauge | `runPredictionsForAllGauges`, `DownstreamMapping` |
| FR-WTR-6 | An officer can view/edit the gauge→downstream-district mapping | `GET/POST /api/water/downstream-mapping` |
| FR-WTR-7 | An officer can manually trigger a prediction cycle or a demo alert | `POST /api/water/trigger-prediction`, `/api/water/demo-alert` |
| FR-WTR-8 | Threshold breaches on raw readings also raise rainfall/river alerts (rate-limited per district) | `evaluateThresholdsAndAlerts`, `RainfallAlertLog` |

### 4.2.5 Help Requests & Rescue Coordination (`FR-HLP`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-HLP-1 | An authenticated citizen can submit a help request (type, description, location, lat/lng, people count) | `POST /api/help-requests` |
| FR-HLP-2 | The public can submit a help request without an account (name + phone + details) | `POST /api/help-requests/public` |
| FR-HLP-3 | Officers can list all help requests, assign a responder, and update status | `GET /api/help-requests`, `PATCH /api/help-requests/:id/assign`, `/:id/status` |
| FR-HLP-4 | Help requests can be **clustered** geographically for dispatch efficiency | `GET /api/help-requests/clusters` |
| FR-HLP-5 | Unattended help requests **escalate** automatically after a time window | `checkEscalations`, `HelpRequestEscalation` |
| FR-HLP-6 | Officers can manage rescue vehicles and missions (assign a vehicle to an area, track evacuated count) | `/api/rescue/*`, `RescueVehicle`, `RescueMission` |
| FR-HLP-7 | An evacuee can check in at a safe zone / camp | `SafeZoneCheckIn`, `/api/safe-zones/checkin` |

### 4.2.6 Relief Camps, Resources, Tokens & Donations (`FR-RLF`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-RLF-1 | Officers can create camps and update occupancy (occupancy may not exceed capacity) | `POST /api/camps`, `PATCH /api/camps/:id/occupancy` (capacity-guarded) |
| FR-RLF-2 | Camps track residents (check-in/out), inventory (per item type, with threshold), schedules, and inter-camp transfer requests | `CampResident`, `CampInventory`, `CampSchedule`, `CampTransferRequest` |
| FR-RLF-3 | A camp can raise a supply request; officers fulfil/track it | `CampSupplyRequest`, `/api/supply-requests` |
| FR-RLF-4 | The ML service can recommend an **optimal resource allocation** across districts (multi-objective) | ML `/optimize-allocation`, `resource_optimizer.py` |
| FR-RLF-5 | Officers can issue **digital relief tokens** (QR-coded, category-scoped, usage-limited, optionally household-bundled) | `POST /api/relief-tokens/issue`, `ReliefToken` |
| FR-RLF-6 | A token is claimed at a camp (scan QR → validate ACTIVE / not expired / under usage limit); each claim is recorded with location; a fraud-risk score is maintained | `POST /api/relief-tokens/claim`, `ReliefTokenClaim`, `fraudRiskScore` |
| FR-RLF-7 | Citizens can view their own tokens (works offline via cache) | `GET /api/relief-tokens/my` |
| FR-RLF-8 | A donor can submit a monetary or material donation; officers see donation history | `POST /api/donations` (positive-amount validated), `GET /api/donations` |
| FR-RLF-9 | Donor campaigns fund token issuance | `DonorCampaign` |

### 4.2.7 Missing Persons, Damage, Hospital, Psychological Support (`FR-SUP`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-SUP-1 | A citizen can report a missing person (name, age, description, last seen, optional photo) | `POST /api/missing-persons` |
| FR-SUP-2 | The public can browse the missing-persons list without login | `GET /api/missing-persons/public` |
| FR-SUP-3 | The ML service can match a face against reported missing persons | ML `/match-face`, `face_matcher.py` |
| FR-SUP-4 | A citizen can submit a damage assessment (category, structural/crop/utility/road damage levels, media, estimated loss); the ML service scores it and estimates cost | `POST /api/assessments/damage`, ML `/score-damage` |
| FR-SUP-5 | Damage assessments route through a review workflow (PENDING_REVIEW → VERIFIED/REJECTED/SENIOR_REVIEW → APPROVED) with a compensation-eligibility score | `DamageStatus`, `compensationEligibilityScore` |
| FR-SUP-6 | Hospital staff manage bed capacity per ward; camps refer patients; referral status is tracked (PENDING → IN_TRANSIT → ADMITTED → DISCHARGED) | `Hospital`, `HospitalWard`, `HospitalReferral` |
| FR-SUP-7 | A citizen can request psychological support (type, urgency, anonymous option); a counsellor is assigned; check-ins are scheduled | `PsychologicalSupportRequest`, `/api/psych-support` |
| FR-SUP-8 | Group-therapy sessions can be scheduled and joined; a live 1:1 chat session is supported | `GroupTherapySession`, `ChatSession`, Socket.IO chat rooms |

### 4.2.8 Family Safety, Volunteers, Analytics, Notifications (`FR-OPS`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-OPS-1 | A citizen can add family members and see each member's safety status | `POST /api/family/members`, `GET /api/family/my-status` |
| FR-OPS-2 | During an alert a citizen can broadcast "I am SAFE / NEEDS_HELP" with location to linked members | `POST /api/family/status`, `SafetyCheckIn` |
| FR-OPS-3 | A volunteer maintains a profile (skills, trainings, readiness score, hours), checks in/out of zones, and logs physical/mental wellbeing | `VolunteerProfile`, `VolunteerCheckIn`, `VolunteerWellbeing` |
| FR-OPS-4 | Officers assign tasks to volunteers; volunteers see and update only their own tasks | `POST /api/volunteers/tasks`, `GET /api/volunteers/tasks/my` |
| FR-OPS-5 | Volunteers earn gamification badges; hours accrue on task completion | `VolunteerBadge`, `readinessScore` |
| FR-OPS-6 | The dashboard shows aggregate statistics (active incidents, alerts, camps, water status) | `GET /api/dashboard/stats` |
| FR-OPS-7 | An operational-intelligence analytics feed summarises trends | `GET /api/analytics/operational-intelligence` |
| FR-OPS-8 | The ML service produces a natural-language **situation summary** and a district **hotspot forecast** and a **drift** report | ML `/situation-summary`, `/hotspot-forecast`, `/detect-drift` |
| FR-OPS-9 | Every user has an in-app notification inbox (mark-as-read) | `Notification`, `GET /api/notifications/my` |
| FR-OPS-10 | Administrators can view the audit log and trigger a manual DB backup | `AuditLog`, `POST /api/admin/backup` |
| FR-OPS-11 | The UI is available in English, Sinhala and Tamil on both web and mobile | i18next (web), i18n (mobile) |

### 4.2.9 Mobile-specific (`FR-MOB`)

| ID | Requirement | Evidence |
|---|---|---|
| FR-MOB-1 | Any submission (incident, help request, damage, missing person, family status, SOS, token claim, resource, donation, psychological support) made while offline is **queued locally** in SQLite and shown as "queued" | `useOfflineSubmit`, `localDB.sync_queue` |
| FR-MOB-2 | The queue drains **FIFO** on reconnection; each item is marked synced or failed; failed items retry up to 5 times then move to `failed` | `syncService`, `markFailed` |
| FR-MOB-3 | A connectivity monitor polls every 8 s and shows an offline banner; regaining connectivity triggers an immediate sync | `networkMonitor` |
| FR-MOB-4 | A background task drains the queue periodically without the app being open | `backgroundSync` (Expo BackgroundFetch + TaskManager) |
| FR-MOB-5 | Emergency numbers (7) and first-aid guides (6) are pre-seeded and available fully offline | `localDB.seedEmergencyNumbers`, `seedFirstAid` |
| FR-MOB-6 | Read data (incidents, alerts, relief camps, tokens) is cached locally for offline viewing | `incidents_cache`, `alerts_cache`, `relief_camps_cache` |
| FR-MOB-7 | The bottom-tab set adapts to the user's role (volunteers/responders get a Tasks tab) | `navigation/index.tsx` |
| FR-MOB-8 | Incident reporting supports voice input, camera/gallery evidence and GPS auto-fill | `VoiceReport`, `EvidenceUpload`, `LocationPicker` |

## 4.3 Non-functional requirements (`NFR`)

| ID | Category | Requirement | Verified by |
|---|---|---|---|
| NFR-1 | **Performance** | Under 100 concurrent users on the mixed read workload, 95th-percentile API latency ≤ 1.5 s and error rate < 1 % | k6 load test — **p95 533 ms, 0% errors, 64 req/s** (`17 §3`) |
| NFR-2 | **Scalability** | The ML-forecast endpoint must not degrade the whole API under load | Prediction caching (`WaterLevelPrediction` + 60 s response cache) — `water_predictions_duration` p95 **243 ms** vs 35 s before |
| NFR-3 | **Reliability / resilience** | Citizen reports submitted offline must never be lost | Offline-sync stress — **0% data loss** across 6 conditions (`17 §4`) |
| NFR-4 | **Availability (graceful degradation)** | If the ML service is down, the API stays up and returns cached forecasts / HTTP 503 for AI-only endpoints | Verified: AI endpoints return 503; predictions serve from cache |
| NFR-5 | **Security** | Passwords bcrypt-hashed; JWT auth on all protected routes; RBAC enforced; admin 2FA (TOTP); injection input rejected safely | Test cases TC-007/008/011/074/075/099/100; security review (`17 §5`) |
| NFR-6 | **Usability / accessibility** | Trilingual UI (Si/Ta/En); the mobile UI must render meaningful content with no network | i18n coverage; offline banner + cached screens |
| NFR-7 | **Maintainability** | Strongly-typed codebase; `tsc --noEmit` clean; automated unit + E2E + case tests | 52 unit tests, 168 case tests, Playwright suite |
| NFR-8 | **Data integrity** | Referential integrity via FK constraints; occupancy/amount/quantity validated; daily automated DB backup | 72-model relational schema, validation guards, `backupService` (02:00 cron) |
| NFR-9 | **Portability** | Mobile app runs on Android & iOS from one Expo codebase; web runs in any modern browser | Expo cross-platform; Vite build |
| NFR-10 | **Auditability** | Security-relevant actions and session logins are recorded | `AuditLog`, `UserSessionLog` |

## 4.4 Consistency check (do before submission)

- **SRS ↔ Use cases:** every FR above maps to a use case in `07-use-cases.md`.
- **SRS ↔ Database:** every FR's data lives in a table in `06-database-design.md`.
- **NFR ↔ Evaluation:** every NFR has a verification row pointing at Chapter 5.
