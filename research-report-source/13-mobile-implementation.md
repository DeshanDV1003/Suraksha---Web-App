# 13 — Mobile Application Implementation (Chapter 4 source)

**Location:** `D:\Suraksha - Mobile App`. **Stack:** Expo SDK 54 · React Native
0.81 · TypeScript · React Navigation 7 · NativeWind (Tailwind) · React Native
Paper · Zustand · TanStack Query 5 · Socket.IO client · i18next.
**Device APIs:** Expo Location, Camera, Image Picker, Notifications, SecureStore,
SQLite, TaskManager, BackgroundFetch, Speech, Crypto, AuthSession, Network.
**Purpose:** the **offline-first citizen & volunteer field client**.

## 13.1 Navigation & screens (25)

`src/navigation/index.tsx` — a Native Stack (`Login`, `Register`,
`LocationGate`, `MainTabs`) wrapping a role-adaptive **bottom-tab** navigator.
The tab set is chosen from the stored `user.role`: `VOLUNTEER` /
`FIELD_RESPONDER` additionally get the **Tasks** tab.

| Category | Screens |
|---|---|
| Auth / gate | `LoginScreen`, `RegisterScreen`, `LocationGateScreen` |
| Home / alerts | `HomeScreen`, `AlertsScreen` |
| Reporting | `ReportScreen` (+ `VoiceReport`, `EvidenceUpload`, `LocationPicker`, `NeedsSelection`, `IncidentForm`), `DamageReportScreen` |
| Water / geo | `WaterLevelScreen`, `SafeZoneScreen`, `SafeRouteScreen` |
| Relief | `ReliefCampsScreen`, `ReliefTokenScreen`, `DonateScreen`, `ResourcesScreen`, `HelpRequestsScreen` |
| People | `FamilySafetyScreen`, `MissingPersonsScreen` |
| Support | `SupportScreen`, `ChatbotScreen`, `PreparednessScreen`, `EducationScreen` |
| Volunteer | `TasksScreen` |
| Account | `ProfileScreen`, `LanguageScreen` |

## 13.2 Offline-first architecture (the mobile research contribution — RO5)

> **Draw this as Figure 4.x — Mobile Offline-Sync Architecture.** Layout spec in
> `appendix-D §5`.

### Components

| Component | File | Role |
|---|---|---|
| **Local database** | `src/storage/localDB.ts` | Expo SQLite (`suraksha_offline.db`, WAL mode). Tables: `sync_queue` (the outbound queue), `incidents_cache`, `alerts_cache`, `relief_camps_cache`, `emergency_numbers_cache` (7 seeded), `first_aid_cache` (6 seeded), `app_meta`. |
| **Submit hook** | `src/hooks/useOfflineSubmit.ts` | Wraps every write. Tries the network first (8 s abort). 2xx → success. **4xx → surface the error, do NOT queue** (permanent). 5xx / timeout / network error → `addToSyncQueue(type, data)` → status `queued`. |
| **Sync service** | `src/services/syncService.ts` | `syncPendingItems()` — guard (online && !syncing), `SELECT pending ORDER BY created_at ASC` (**FIFO**), for each item POST to `SYNC_HANDLERS[type]` with headers `X-Offline-Sync: true` + `X-Original-Timestamp`, `markSynced` / `markFailed` (4xx permanent, 5xx retry, max 5 attempts → `failed`), 300 ms between items. |
| **Connectivity monitor** | `src/services/networkMonitor.ts` | Polls `expo-network` `isConnected` every 8 s + on app-foreground; toggles the `OfflineBanner`; on regain → `syncPendingItems()` immediately. |
| **Background sync** | `src/services/backgroundSync.ts` | `expo-background-fetch` + `expo-task-manager` — drains the queue periodically without the app open. |
| **Cache readers** | `localDB.getCachedIncidents/Alerts/ReliefCamps`, `getEmergencyNumbers`, `getFirstAidGuides` | serve read screens offline |

### `sync_queue` schema (state it in the report)

`id TEXT PK · type TEXT · payload TEXT(json) · status TEXT default 'pending' ·
attempts INT default 0 · max_attempts INT default 5 · created_at TEXT · synced_at
TEXT · error_msg TEXT`

### Queued mutation types (12)

`INCIDENT_REPORT`, `HELP_REQUEST`, `DAMAGE_ASSESSMENT`, `PSYCHOLOGICAL_SUPPORT`,
`TASK_STATUS_UPDATE`, `REPORT_VERIFICATION`, `RELIEF_TOKEN_CLAIM`,
`MISSING_PERSON_REPORT`, `RESOURCE_SUBMISSION`, `DONATION_SUBMIT`,
`FAMILY_SAFETY_UPDATE`, `SOS_PANIC` — each mapped to a backend endpoint + method
in `SYNC_HANDLERS`.

## 13.3 API layer

`src/services/api.ts` — one axios instance (`baseURL` from `src/config.ts`
ngrok static domain + `/api`, 10 s timeout, `ngrok-skip-browser-warning` header),
a request interceptor that injects `Authorization: Bearer <AsyncStorage token>`,
and a **response interceptor that rejects any `text/html` response** before JSON
parsing (guards against the ngrok interstitial page).
~25 typed service objects (`authService`, `incidentService`, `alertService`,
`waterService`, `familyService`, `reliefTokenService`, `safeZoneService`,
`sosService`, …) — one per backend domain.

## 13.4 Device features

| Feature | Implementation |
|---|---|
| GPS location | `expo-location` foreground + background; `LocationGateScreen` requests permission on first launch; `LocationContext` provides the current fix |
| Camera / gallery evidence | `expo-camera`, `expo-image-picker`, `expo-image-manipulator` (resize) → base64 data-URIs in `images` / `mediaUrls` |
| QR scanning (relief tokens) | `expo-camera` barcode scanner → `reliefTokenService.claimToken(code)` |
| Voice report | `expo-speech` |
| Push notifications | `expo-notifications` — **local** notifications work in Expo Go; **remote push tokens require a dev/APK build** (Expo Go SDK 53+ returns `undefined`) — documented in `notificationService.ts` |
| Realtime | `socket.io-client` to the socket ngrok domain; `new-alert` → local notification |
| Secure storage | `expo-secure-store` is a dependency but the JWT is currently stored in `AsyncStorage` — **security limitation, future work** |
| i18n | `i18next` / `react-i18next`, en / si / ta, `LanguageScreen` switcher |

## 13.5 Mobile testing coverage (Chapter 5 cross-reference)

- **68 documented test cases** (TC-M-001…068) appended to
  `Suraksha_Test_Cases.xlsx`, executed by `tests/test-cases/run-mobile.cjs`
  against the live backend: **57 Pass / 3 Fail / 8 N/A**.
- **Offline-sync stress** (from the app's own `offline_sync_results.json`,
  cross-checked by the runner): reconnect-ideal Q10/50/100 → **100% success, 0%
  data loss**; disconnect mid-sync → 76.9% (rest stay pending, 0% loss); app
  restart → 100%, 0% loss; latency 500/1000/2000 ms → 100%, 0% loss; packet loss
  5/10/20% → 96/88/76% (failed items retryable, **0% loss throughout**);
  **duplicate-retry → 10% duplicate server records** (the open idempotency gap).
- **3 findings:** dead `authService.getProfile()` route (404), duplicate-on-retry,
  JWT in plaintext AsyncStorage. See `17 §4` and `18 §5`.
