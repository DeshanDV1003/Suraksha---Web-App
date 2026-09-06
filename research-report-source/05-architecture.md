# 05 — System Architecture & Technology (Chapter 3/4 source)

> **Diagram to draw (Figure 3.x — System Architecture):** see the layout spec in
> `appendices/appendix-D-diagram-drawing-guide.md §1`. Caption goes **below** the
> figure.

## 5.1 Architectural style

Suraksha is a **layered, service-oriented architecture** with four tiers plus
external integrations:

```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  PRESENTATION — Web           │   │  PRESENTATION — Mobile        │
│  React 19 + Vite (dashboard)  │   │  Expo / React Native (citizen)│
│  RBAC routing, Leaflet maps,  │   │  Offline-first: SQLite queue  │
│  charts, i18n, Socket.IO      │   │  + FIFO sync + bg task + i18n │
└───────────────┬──────────────┘   └───────────────┬──────────────┘
                │ REST (JWT) + Socket.IO           │ REST (JWT, via ngrok tunnel)
                ▼                                   ▼
        ┌───────────────────────────────────────────────────┐
        │  APPLICATION — Node.js + Express + TypeScript      │
        │  31 route groups → controllers → services          │
        │  authMiddleware / RBAC, Socket.IO server,          │
        │  cron jobs (water, rainfall, backup, escalation),  │
        │  multi-channel dispatch, geocoding, zone lookup    │
        └───────┬───────────────────────────────┬───────────┘
                │ Prisma ORM                    │ HTTP (JSON)
                ▼                               ▼
     ┌────────────────────┐        ┌────────────────────────────────┐
     │  DATA — PostgreSQL  │        │  INTELLIGENCE — Python FastAPI  │
     │  72 tables, 24 enums│        │  22 endpoints, 16 ML components │
     │  Prisma migrations  │        │  5 trained models + heuristics  │
     └────────────────────┘        └────────────────────────────────┘
                                                 │
                     ┌───────────────────────────┴────────────────────┐
   EXTERNAL:  Twilio SMS · Nodemailer e-mail · Expo Push · Telegram Bot ·
              Open-Meteo rainfall · Nominatim geocoding · Google OAuth
```

## 5.2 Layer responsibilities

| Layer | Responsibility | Key files |
|---|---|---|
| **Presentation — Web** | DMC command dashboard: authenticated, role-gated pages; live map; charts; alert/incident/camp/resource management; AI research view; i18n | `frontend/src/App.tsx` (routing), `frontend/src/pages/*` (~35 pages), `hooks/useAuth.tsx`, `lib/api-client.ts`, `lib/socket.ts` |
| **Presentation — Mobile** | Citizen/volunteer field client: report capture (voice/photo/GPS), alerts, water levels, family safety, relief tokens, **offline-first** everything | `App.tsx`, `src/navigation/`, `src/screens/*` (25), `src/hooks/useOfflineSubmit.ts`, `src/services/{syncService,networkMonitor,backgroundSync}.ts`, `src/storage/localDB.ts` |
| **Application — Backend** | Stateless REST API + Socket.IO server; authentication & RBAC; business rules; orchestration of ML calls; scheduled jobs; multi-channel alert dispatch | `backend/src/index.ts`, `routes/*` (31), `controllers/*`, `services/*` (~45), `middleware/auth.ts` |
| **Data — PostgreSQL** | Single source of truth; referential integrity; migrations via Prisma; daily backup | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `services/backupService.ts` |
| **Intelligence — ML microservice** | Model inference for severity triage, water forecasting, NER/translation, credibility, spatiotemporal risk, resource optimisation, situation summary, face match, damage scoring | `suraksha-ml/main.py`, `suraksha-ml/ml/*`, `suraksha-ml/nlp/*`, `suraksha-ml/models/*` |

## 5.3 Cross-cutting mechanisms

| Mechanism | How it works |
|---|---|
| **Authentication** | JWT (HS256), 6 h expiry, payload `{ userId, role, hospitalId? }`; bearer token on every request; verified by `authMiddleware`. Web stores token in `localStorage`; mobile in `AsyncStorage` (documented limitation — should be `expo-secure-store`). |
| **Authorisation (RBAC)** | Route-level middleware: `adminMiddleware` (ADMIN), `officerMiddleware` (ADMIN∪DMC_OFFICER), `hospitalMiddleware` (HOSPITAL_STAFF); plus a configurable `RolePermission` table for module-level view/edit/delete. |
| **Real-time** | One Socket.IO server; a default namespace for global events (`new-alert`, `new-incident`, `incident-updated`, `help-request-updated`) and a `/water` namespace for `water_data_updated`; a `hospital:<id>` room per hospital; chat session rooms. |
| **Scheduled jobs** (`node-cron`) | Hourly `0 * * * *`: water-data fetch → threshold eval → incident priority re-eval → prediction cache warm. Every 30 min: district rainfall from Open-Meteo. Daily `02:00`: `pg_dump` backup with 7-day retention. On demand: help-request escalation checks. |
| **Graceful degradation** | ML calls are wrapped; on failure the AI endpoints return HTTP 503 and the water-forecast endpoint serves the last cached `WaterLevelPrediction` row. The backend never blocks on the ML service. |
| **Geospatial** | `@turf/turf` point-in-polygon for the 25-district boundary GeoJSON (zone tagging); `ngeohash` length-5 sector IDs for location logging; the Haversine formula for radius checks and safe-route scoring. |
| **Multi-channel dispatch** | An alert fans out to: `Notification` rows (in-app), Expo push (`expo-server-sdk`), Twilio SMS, Nodemailer e-mail, Telegram Bot — best-effort, failures logged not fatal. |

## 5.4 Technology choices & rationale (for Chapter 4 §4.1)

| Choice | Alternatives considered | Why chosen |
|---|---|---|
| **PostgreSQL + Prisma** | MongoDB; raw SQL; TypeORM | The domain is highly relational (72 interlinked entities, referential integrity matters for a command system). Prisma gives a typed schema, migrations, and a single source of truth shared by web + mobile via the API. |
| **Node.js + Express + TypeScript** | Django; Spring Boot; NestJS | One language across backend + both frontends (TypeScript) → shared types & mental model; large real-time/geospatial library ecosystem; fast iteration. |
| **React 19 + Vite (web)** | Angular; Vue; Next.js | Component ecosystem for maps (React Leaflet) and charts; Vite's fast dev loop; SSR not needed for an authenticated internal dashboard. |
| **Expo / React Native (mobile)** | Native Android/iOS; Flutter | Cross-platform from one codebase; Expo modules for Location/Camera/Notifications/SQLite/BackgroundFetch cover every device need; shares state/data-fetching stack (Zustand + React Query) with web. |
| **Python FastAPI for ML** | ML in-process in Node (onnxruntime); Flask | The scientific Python stack (XGBoost, TensorFlow, spaCy, scikit-learn) is where the models live; FastAPI gives typed request/response models and async endpoints; independent deploy/scale; the backend degrades gracefully if it's down. |
| **Socket.IO** | Raw WebSocket; SSE; polling | Rooms/namespaces, auto-reconnect, fallback transport — the command dashboard needs many targeted real-time streams. |
| **SQLite (expo-sqlite) for the offline queue** | AsyncStorage only; WatermelonDB; Realm | A real transactional store with a queryable queue table, WAL mode, and durable persistence across app restarts — exactly what a guaranteed-delivery queue needs. |
| **XGBoost for severity** | Deep net; RandomForest; LogReg | Tabular features, need for calibrated probabilities + fast CPU inference; empirically beats RF / LogReg / ordinal-logit (see `15`). |
| **LSTM for river level** | ARIMA; GRU; Transformer; physical model | Sequential autocorrelated gauge series with a rainfall driver; standard data-driven choice for short-horizon river-stage; benchmarked against persistence. |

## 5.5 Deployment topology (as evaluated)

- All four tiers run on one workstation for development/evaluation: PostgreSQL
  (`:5432`), backend (`:3001`), web dev server (`:5173`), ML service (`:8000`).
- The mobile app reaches the backend and Socket.IO through **two static ngrok
  tunnels** (`src/config.ts`) so a physical phone running Expo Go can talk to the
  local backend without rebuilding on IP change.
- Production topology (future work): backend + ML behind a reverse proxy, managed
  PostgreSQL, ML on a GPU/CPU node, web as static assets on a CDN.
