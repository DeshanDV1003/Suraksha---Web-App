# 11 — Backend Implementation (Chapter 4 source)

**Location:** `d:\Suraksha - Web App\backend`. **Stack:** Node.js · Express 4 ·
TypeScript 5.6 · Prisma ORM 6 · PostgreSQL · Socket.IO 4 · `node-cron`.
**Entry point:** `src/index.ts`. **Dev:** `ts-node-dev --transpile-only`.
**Build:** `tsc` → `dist/`.

## 11.1 Request pipeline

```
HTTP request
  → express.json() (body parse)
  → CORS
  → Router  (31 groups mounted under /api/*)
      → authMiddleware        (JWT verify → req.user = { userId, role })
      → RBAC middleware        (adminMiddleware / officerMiddleware / hospitalMiddleware)
      → Controller            (validate input, orchestrate)
          → Service(s)        (business logic)
              → Prisma        (typed DB access)
              → ML Service    (HTTP, best-effort)
              → external APIs (Twilio / Nodemailer / Expo / Telegram / Nominatim)
          → Socket.IO emit    (real-time fan-out)
      → sendError()           (uniform error → 400/401/403/404/409/500)
  → HTTP response (JSON)
```

## 11.2 Route groups (31) mounted in `index.ts`

`/api/auth`, `/api/incidents`, `/api/alerts`, `/api/camps`, `/api/users`,
`/api/resources`, `/api/tokens`, `/api/volunteers`, `/api/help-requests`,
`/api/relief-tokens`, `/api/assessments`, `/api/missing-persons`, `/api/support`,
`/api/psych-support`, `/api/dashboard`, `/api/analytics`, `/api/audit`,
`/api/notifications`, `/api/location`, `/api/map`, `/api/donations`,
`/api/family`, `/api/water`, `/api/reports`, `/api/ai`, `/api/safe-zones`,
`/api/rescue`, `/api/chatbot`, `/api/supply-requests`, `/api/weather`,
`/api/hospital`.

Total individual endpoints: ~210 (documented earlier audit).

## 11.3 Layering — the three tiers of code

| Tier | Folder | Responsibility | Example |
|---|---|---|---|
| **Routes** | `src/routes/*.ts` | URL → middleware chain → handler. No logic. | `incidentRoutes.ts`: `router.patch('/:id/status', authMiddleware, officerMiddleware, updateIncidentStatus)` |
| **Controllers** | `src/controllers/*.ts` | Parse & validate the request, call services, shape the response, map errors. | `incidentController.createIncident` — `requireFields(...)`, geocode, zone lookup, insert, fire async ML + duplicate detection, emit socket event, `sendError` on failure |
| **Services** | `src/services/*.ts` (~45) | Pure business logic + persistence. Reusable, testable. | `incidentService.getAllIncidents({category,status})`, `duplicateDetectionService.detectAndSaveDuplicates()`, `water-predictor.runPredictionsForAllGauges()` |

### Notable services

| Service | Purpose |
|---|---|
| `authService` | register/login/2FA/Google/change-password; JWT signing |
| `incidentService`, `helpRequestService`, `missingPersonService`, `campService`, `donationService`, … | CRUD + rules per domain |
| `duplicateDetectionService` | scores incident pairs on location (Haversine ≤ 1 km, 40 pts), category (30 pts), time (≤ 6 h, 20 pts), NLP-entity overlap (10 pts); persists a link if score ≥ 50 |
| `mlService` | HTTP client to the FastAPI ML service (`/process-report`, `/score-damage`) — wrapped, non-fatal |
| `geocodingService` | Nominatim forward/reverse geocode + Sri-Lanka bounding-box check |
| `zoneService` | loads `data/srilanka_districts.geojson`; `findZoneForCoordinates` = turf `booleanPointInPolygon` |
| `alert-generator` + `channelDeliveryService` | create `Alert`, translate, fan out to 5 channels |
| `water-predictor` | orchestrates per-gauge LSTM forecasts, caches to `WaterLevelPrediction`, fires threshold alerts, maps downstream districts, Telegram + mobile push |
| `water-data-fetcher` / `data-simulator` | hourly ingest of gauge readings |
| `rainfallWeatherService` / `rainfallWeatherCron` | 30-min Open-Meteo district rainfall ingest |
| `notificationService` | in-app `Notification` rows + Expo push helper |
| `backupService` | daily `pg_dump` to `D:\SurakshaBackups`, 7-day retention, manual trigger endpoint |
| `priority_escalator` | re-evaluates open-incident severity against current severe weather |
| `safeRouteService` | Bézier candidate routes + hazard-proximity scoring → safest path |
| `safeZoneService` | nearest `PublicSafePlace`, danger-radius by alert level |
| `duplicateDetectionService`, `chatbotService`, `analyticsService`, `auditService`, `reliefTokenService`, `damageAssessmentService`, `supportService`, `volunteerService`, … | remaining domains |

## 11.4 Authentication & security implementation

- **JWT:** `jsonwebtoken`, HS256, secret from `JWT_SECRET` env (server refuses to
  start if unset). Payload `{ userId, role, hospitalId? }`, `expiresIn: '6h'`.
- **Password hashing:** `bcryptjs`, cost 10.
- **2FA:** `speakeasy` TOTP; `qrcode` to render the enrolment QR; a login on a
  2FA-enabled account returns `{ requires2FA: true, userId }` until `/2fa/verify`
  succeeds.
- **RBAC:** `middleware/auth.ts` — `authMiddleware` (any valid token),
  `adminMiddleware` (`role === 'ADMIN'`), `officerMiddleware` (`ADMIN` or
  `DMC_OFFICER`), `hospitalMiddleware` (`HOSPITAL_STAFF`). Applied per route.
- **Input validation:** `utils/apiError.ts` — `requireFields(body, [...])` throws
  `HttpError(400)`; `sendError(res, err)` maps `PrismaClientValidationError` → 400,
  `P2025` → 404, `P2002` → 409, `HttpError` → its status, else 500. Added during
  this research to fix a class of "missing field → HTTP 500 (Prisma stack leaked)"
  defects (see `17 §2`, test cases TC-024/050/059).
- **Session logging:** `UserSessionLog` per login (IP, device, location).
- **Audit:** `AuditLog` for security-relevant mutations.
- **Injection safety:** all DB access via Prisma parameterised queries — SQL
  injection attempts return 401/400 with no crash (TC-011, TC-098/099).

### Security findings from the review (state honestly in Chapter 5)

| Finding | Status |
|---|---|
| `PATCH /api/incidents/:id/status` had no role guard — any citizen could change any incident's status | **FIXED** — `officerMiddleware` added |
| Missing required fields returned HTTP 500 with a leaked Prisma stack, not 400 | **FIXED** — `requireFields` / `sendError` |
| Camp occupancy could exceed capacity | **FIXED** — capacity guard |
| Donation amount 0 accepted | **FIXED** — positive-amount validation |
| Mobile JWT stored in plaintext `AsyncStorage` (should be `expo-secure-store`) | **open — future work** |
| Offline-sync retries can create duplicate server records (no idempotency key) | **open — future work** |
| Seeded `admin@suraksha.gov` had 2FA enabled but was the only admin — headless tooling had to register a fresh admin | operational note |

## 11.5 Real-time (Socket.IO)

- Server created in `index.ts`, exposed via `getIO()` (`utils/socketInstance.ts`).
- **Default namespace events:** `new-alert`, `new-incident`, `incident-updated`,
  `new-high-priority-incident`, `help-request-updated`, `new-help-request`,
  `new-missing-person`, `review-required`.
- **`/water` namespace:** `water_data_updated` (WaterMonitorPage auto-refresh).
- **Rooms:** `hospital:<hospitalId>` (referral updates), chat session rooms
  (`join_hospital`, `send_message`).

## 11.6 Scheduled jobs (`node-cron`)

| Cron | Schedule | Chain |
|---|---|---|
| Water data | `0 * * * *` (hourly) | `simulateDataFetch()` → `evaluateThresholdsAndAlerts()` → `reevaluateIncidentPriorities()` → `runPredictionsForAllGauges()` (via simulator) → emit `water_data_updated` |
| Rainfall weather | every 30 min | Open-Meteo → `RainfallReading` (25 districts) |
| DB backup | `0 2 * * *` (02:00) | `pg_dump` → `D:\SurakshaBackups\suraksha_<date>_<time>.sql`; delete backups > 7 days |
| Prediction warm-up | 15 s after boot | `runPredictionsForAllGauges({ dispatchAlerts: false })` — populates the cache so the first client request is fast |
| Escalation | on-demand / periodic | `checkEscalations()` — unattended help requests → `HelpRequestEscalation` + notify officers |

## 11.7 Prisma / database access

- One `PrismaClient` singleton (`utils/prisma.ts`), `log: ['error','warn']`.
- Schema: `prisma/schema.prisma` (72 models). Client generated to
  `prisma/generated/client`.
- Migration history exists but the team primarily uses `prisma db push`; the
  `WaterLevelPrediction` table was added with an explicit additive `CREATE TABLE`
  + schema edit + `prisma generate` (a `migrate dev` would have prompted a reset),
  after a verified `pg_dump` backup — **zero existing rows modified**.

## 11.8 Configuration / environment (`.env`)

`DATABASE_URL` (Postgres), `JWT_SECRET`, `ML_SERVICE_URL` (default
`http://localhost:8000`), `GOOGLE_CLIENT_ID`, Twilio creds, SMTP creds, Telegram
bot token + chat id, `MAPBOX_TOKEN` (optional geocoding fallback).

## 11.9 Performance engineering done for this research

`GET /api/water/predictions` originally called the ML service **once per gauge**
(up to 50) on every request; the single-worker ML service serialised them → p95
≈ 26 s under load, breaching NFR-1. Fix:
1. New `WaterLevelPrediction` cache table — one row per gauge.
2. The hourly cycle `upsert`s each forecast.
3. The endpoint reads from the table + a 60 s in-process response cache; cold
   gauges computed inline (bounded); stale rows returned immediately and
   refreshed in the background (single-flight lock); a 15 s post-boot warm-up.

**Result:** k6 100-VU / 5-min load — `http_req_duration` p95 **26 s → 533 ms**,
`water_predictions_duration` p95 **35 s → 243 ms**, throughput **6.5 → 64 req/s**,
0% errors. See `project_docs/water_predictions_caching.md` and `17 §3`.
