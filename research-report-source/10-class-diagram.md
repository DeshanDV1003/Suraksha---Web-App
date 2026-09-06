# 10 — Class Diagram (Chapter 3 source — actual system structure)

> The lecturer wants a class diagram **based on the actual system structure**. The
> backend is layered (routes → controllers → services → Prisma models) rather
> than classic OOP classes, so model the diagram as **layers of collaborating
> modules** plus the **domain entity classes** (the Prisma models). Draw in
> draw.io. Two options:
> - **Chapter 3:** a *layered class diagram* of the incident + alert + water
>   subsystem (§10.2) — enough to show the pattern.
> - **Appendix C:** the full domain-entity class diagram (all 72 entities is too
>   much — draw the ~18 core entities from `06 §6.3` with their methods-as-
>   operations = the service functions that act on them).

## 10.1 Layered structure (the pattern to show)

```
«boundary»            «control»                 «service / business logic»     «entity (Prisma model)»
Route (Express Router) → Controller (req/res)  → Service (domain function)   → PostgreSQL table
        │ authMiddleware / RBAC middleware
        │
  e.g. incidentRoutes  → incidentController    → incidentService              → IncidentReport
                                              → duplicateDetectionService     → IncidentDuplicateLink
                                              → mlService (HTTP → ML)          → MLLog
                                              → notificationService           → Notification
                                              → geocodingService / zoneService
```

### Cross-cutting classes (shared)
- `AuthMiddleware` — `authMiddleware()`, `adminMiddleware()`, `officerMiddleware()`, `hospitalMiddleware()`
- `PrismaClient` (singleton, `utils/prisma.ts`) — one instance injected everywhere
- `SocketInstance` (`utils/socketInstance.ts`) — `getIO()`
- `ApiError` (`utils/apiError.ts`) — `HttpError`, `requireFields()`, `sendError()`
- Cron classes — `WaterDataCron`, `RainfallWeatherCron`, `BackupService`

## 10.2 Class diagram to put in Chapter 3 — Incident + Alert + Water subsystem

### Boundary / control classes

| Class | Key operations |
|---|---|
| `IncidentController` | `createIncident(req,res)`, `getIncidents(req,res)`, `getIncidentById()`, `updateIncidentStatus()`, `deleteIncident()`, `triggerSOS()`, `getPendingDuplicates()`, `resolveDuplicateLink()` |
| `AlertController` | `createAlert()`, `getAlerts()`, `deactivateAlert()`, `deleteAlert()`, `acknowledgeAlert()`, `getDeliveryStats()` |
| `WaterController` *(route-level handlers)* | `getRiver()`, `getRainfall()`, `getPredictions()`, `getGaugePrediction()`, `triggerPrediction()`, `demoAlert()`, `get/postDownstreamMapping()` |

### Service classes

| Class | Key operations | Acts on |
|---|---|---|
| `IncidentService` | `createIncident(data)`, `getAllIncidents(filter)`, `getIncidentById(id)`, `updateIncidentStatus(id,status)` | `IncidentReport`, `IncidentHistory` |
| `DuplicateDetectionService` | `detectAndSaveDuplicates(incident)`, `getDuplicateLinksForIncident(id)`, `getAllPendingDuplicateLinks()`, `updateDuplicateLinkStatus(id,status)` — internals: `haversineMetres()`, `nlpEntityOverlap()` | `IncidentDuplicateLink` |
| `MlService` | `processReport(data)`, `scoreDamage(data)` — HTTP to the ML microservice | (writes `MLLog`) |
| `GeocodingService` | `isInSriLanka(lat,lng)`, `geocodeAddress(text)`, `reverseGeocode(lat,lng)` | — |
| `ZoneService` | `findZoneForCoordinates(lat,lng)` — turf point-in-polygon over the 25-district GeoJSON | — |
| `AlertGeneratorService` | `createAndEmitAlert(title,message,type,locations,source)`, `evaluateThresholdsAndAlerts()` | `Alert`, `Notification`, `RainfallAlertLog` |
| `ChannelDeliveryService` | `dispatch(alert)` → push / SMS / e-mail / Telegram | — |
| `WaterPredictorService` | `getPrediction(gaugeId,thresholds)`, `runPredictionsForAllGauges(opts)`, `savePrediction(p)`, `refreshPredictions(gauges)`, `checkMLServiceOnline()` | `RiverWaterLevel`, `WaterLevelPrediction`, `Alert` |
| `NotificationService` | `sendNotification(userId,title,body)`, `notifyAdmins(title,body)`, `sendExpoPush(token,…)` | `Notification` |

### Entity classes (Prisma models — show attributes + the enum types)

`IncidentReport`, `IncidentHistory`, `IncidentDuplicateLink`, `MLLog`, `Alert`,
`Notification`, `RiverWaterLevel`, `WaterLevelPrediction`, `DownstreamMapping`,
`RainfallReading`, `RainfallAlertLog`.
(Use the attribute lists from `06-database-design.md §6.2`.)

### Relationships to draw

- `IncidentController --> IncidentService` (dependency)
- `IncidentController --> DuplicateDetectionService`, `--> MlService`, `--> GeocodingService`, `--> ZoneService`, `--> NotificationService`
- `IncidentService --> IncidentReport` (CRUD), `--> IncidentHistory`
- `DuplicateDetectionService --> IncidentDuplicateLink`, reads `IncidentReport`
- `AlertController --> AlertGeneratorService --> ChannelDeliveryService`
- `AlertGeneratorService --> Alert`, `--> Notification`
- `WaterPredictorService --> WaterLevelPrediction` (upsert), reads `RiverWaterLevel`, `--> Alert`
- all services `--> PrismaClient` (shared singleton) — draw one shared dependency
- `AuthMiddleware` guards `IncidentController.updateIncidentStatus`,
  `.deleteIncident`, `AlertController.createAlert` — show as a `«guard»` note.

## 10.3 Full domain class diagram (Appendix)

Draw the ~18 core entities from `06 §6.3` as classes with:
- **attributes** = the columns in `06 §6.2`
- **associations** = the FK relationships with multiplicities from `06 §6.3`
- **enum classes** = `Role`, `Status`, `Severity`, `AlertType`, `SafetyStatus`,
  `TokenStatus`, `DamageLevel`, `RiverStatus` (as `«enumeration»`)
- no operations on the entity classes themselves (they are persistence models);
  the operations live on the service classes.

## 10.4 Frontend / mobile structure (optional extra class diagram)

If you want a client-side class diagram:

- **Web:** `AuthProvider` (context) → `useAppStore` (Zustand) → page components
  (`IncidentsPage`, `WaterMonitorPage`, `MapPage`, …) → `apiClient` (axios) +
  `socket` (Socket.IO client) → POM: `LoginPage`, `DashboardPage` (for tests).
- **Mobile:** `useAuthStore` (Zustand) → screen components → `api.ts` services
  (`authService`, `incidentService`, …) + `useOfflineSubmit` hook →
  `syncService` → `localDB` (SQLite) ; `networkMonitor` ↔ `backgroundSync`.
