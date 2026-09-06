# 06 — Database Design (Chapter 3/4 source — ER diagram)

> **Diagram to draw (Figure 3.x — Entity-Relationship Diagram).** The schema has
> **72 tables**; a single ER diagram with all of them is unreadable. Your
> lecturer allows a **core ER diagram in the chapter** + the **full breakdown in
> an appendix**. Recommendation:
> - **In Chapter 3:** a *core ER diagram* of ~18 central entities (§6.3).
> - **In Appendix C:** module ER fragments (one per subsystem, §6.4).
> Draw both in **draw.io**, crow's-foot notation, matching the exact
> table/column/key/relationship facts below. Do **not** use an AI-generated ER
> image.

DBMS: **PostgreSQL**. ORM: **Prisma** (`backend/prisma/schema.prisma`). All
primary keys are `String` UUID v4 (`@default(uuid())`) unless noted. `createdAt`
/ `updatedAt` timestamps are on most tables and omitted from the lists below for
brevity.

## 6.1 Entity groups (72 tables)

| # | Group | Tables |
|---|---|---|
| A | **Identity & access** | `User`, `UserSessionLog`, `RolePermission`, `LocalVerifier`, `AuditLog` |
| B | **Incidents** | `IncidentReport`, `IncidentHistory`, `ReportVerification`, `VerifierAction`, `IncidentDuplicateLink`, `MLLog`, `AfterActionReport` |
| C | **Alerts & notifications** | `Alert`, `Notification` |
| D | **Hydro-meteorological** | `RiverWaterLevel`, `RainfallReading`, `RainfallAlertLog`, `DownstreamMapping`, `WaterLevelPrediction`, `ThreatForecast`, `ThreatProjection` |
| E | **Help & rescue** | `HelpRequest`, `HelpRequestEscalation`, `RescueVehicle`, `RescueMission`, `SafeZoneCheckIn`, `EvacuationRoute` |
| F | **Relief camps & logistics** | `ReliefCamp`, `CampResident`, `CampInventory`, `CampSchedule`, `CampTransferRequest`, `CampSupplyRequest`, `Resource`, `ResourceRequestMatch` |
| G | **Relief tokens & donations** | `ReliefToken`, `ReliefTokenClaim`, `DonorCampaign`, `Donation` |
| H | **Damage & finance** | `DamageAssessment`, `DisasterBudget`, `ResourceExpenditure`, `ResourceCost`, `KPIBenchmark` |
| I | **Missing persons & safe places** | `MissingPerson`, `PublicSafePlace`, `AuthorityContact` |
| J | **Volunteers** | `VolunteerProfile`, `VolunteerSkill`, `VolunteerTraining`, `VolunteerCheckIn`, `VolunteerWellbeing`, `VolunteerBadge`, `VolunteerLocation`, `Task` |
| K | **Family safety** | `FamilyMember`, `SafetyCheckIn` |
| L | **Psychological support** | `PsychologicalSupportRequest`, `ChatSession`, `ChatMessage`, `GroupTherapySession`, `GroupTherapyParticipant`, `MentalHealthGuide` |
| M | **Hospitals** | `Hospital`, `HospitalWard`, `HospitalReferral` |
| N | **Geography & ops** | `Sector`, `LocationLog`, `ShiftHandover` |

## 6.2 Key entities in detail (attributes · keys · relationships)

### `User` (group A)
- **PK** `id`. **Unique:** `email`, `googleId`, `nic`.
- **Attrs:** `email`, `password?` (bcrypt; null for Google-only accounts), `name`,
  `phone?`, `pushToken?`, `role` (enum `Role`), `region?`, `hasMobileApp`,
  `isFieldActive`, `lastCheckInTime?`, `twoFactorEnabled`, `twoFactorSecret?`,
  `twoFactorGracePeriodEnds?`, `profilePicture?`, `currentSectorId?`, `hospitalId?`.
- **FK:** `currentSectorId → Sector.id` (nullable); `hospitalId → Hospital.id`
  (nullable — hospital staff).
- **Relationships (cardinality):**
  - `User 1─* IncidentReport` (reporter)
  - `User 1─* HelpRequest`, `1─* DamageAssessment`, `1─* Donation`,
    `1─* Notification`, `1─* LocationLog`, `1─* UserSessionLog`,
    `1─* SafetyCheckIn`, `1─* FamilyMember` (as primary user),
    `1─* ReliefToken`, `1─* PsychologicalSupportRequest`,
    `1─* SafeZoneCheckIn`, `1─* CampSupplyRequest` (requester),
    `1─* RescueMission` (assignedBy)
  - `User 1─* Task` twice: created-tasks and assigned-tasks
  - `User 1─0..1 VolunteerProfile`, `1─0..1 LocalVerifier`
  - `User *─1 Sector` (currentSector), `User *─0..1 Hospital`

### `IncidentReport` (group B)
- **PK** `id`. **FK** `reporterId → User.id`.
- **Attrs:** `title`, `description`, `location`, `latitude?`, `longitude?`,
  `status` (enum `Status`, default `PENDING`), `severity` (enum `Severity`,
  default `MEDIUM`), `category`, `images String[]`, `province?`, `zoneId?`,
  `zoneName?`, and the ML write-back fields: `mlConfidence?`, `detectedLanguage?`,
  `languageConfidence?`, `translatedText?`, `nlpEntities Json?`.
- **Relationships:**
  - `IncidentReport 1─* IncidentHistory`, `1─* ReportVerification`,
    `1─* VerifierAction`, `1─* Task`, `1─* DamageAssessment`
  - `IncidentReport 1─0..1 AfterActionReport` (`incidentId` unique)
  - `IncidentReport *─* IncidentReport` via `IncidentDuplicateLink`
    (self-relation: `reportId` and `canonicalId`, both FK → `IncidentReport.id`,
    `onDelete: Cascade`)

### `Alert` (group C)
- **PK** `id`. **Attrs:** `title`, `message`, `type` (enum `AlertType`, default
  `INFO`), `active` (default true), `latitudes Float[]`, `longitudes Float[]`,
  `locations String[]`, `targetSectors String[]`, `broadcastRadiusKm?`,
  `notifiedCount` (default 0), `acknowledgementRate?`, `channels Json?`,
  `scheduledTime?`, `translatedMsgSinhala?`, `translatedMsgTamil?`.
- **Relationship:** `Alert 1─* Notification` (`Notification.alertId` FK,
  `onDelete: SetNull`).

### `RiverWaterLevel` (group D)
- **PK** `id`. **Attrs:** `gaugeId`, `riverName`, `stationName`, `district`,
  `latitude`, `longitude`, `waterLevelMetres`, `flowRateCumecs`, `alertLevel`
  (watch threshold), `minorFloodLevel`, `majorFloodLevel`, `status` (enum
  `RiverStatus`), `changeFromLastHour`, `trend` (enum `WaterTrend`), `recordedAt`,
  `fetchedAt`, `source`.
- No FK — time-series table keyed logically by `(gaugeId, recordedAt)`.

### `WaterLevelPrediction` (group D) — added for this research (prediction cache)
- **PK** `id`. **Unique:** `gaugeId`.
- **Attrs:** `predictedT1M`, `predictedT2M`, `confidence`, `alertLevel`,
  `modelUsed`, `reason`, `predictedAt`, `computedAt`, `updatedAt`.
- One row per gauge; refreshed by the hourly prediction cycle; `GET
  /api/water/predictions` reads from here (see `16 §1` and
  `project_docs/water_predictions_caching.md`).

### `HelpRequest` (group E)
- **PK** `id`. **FK** `userId → User.id` (nullable — public requests).
- **Attrs:** `type`, `description`, `location`, `latitude?`, `longitude?`,
  `priority` (enum `Severity`), `status` (enum `Status`), `peopleCount?`,
  `assignedVolunteerId?`, `escalationLevel` (default `NONE`), `phone?`.
- **Rel:** `HelpRequest 1─* HelpRequestEscalation`, `1─* VerifierAction`.

### `ReliefCamp` (group F)
- **PK** `id`. **Attrs:** `name`, `location`, `latitude?`, `longitude?`,
  `currentOccupancy` (default 0, ≤ `totalCapacity` — app-enforced),
  `totalCapacity`, `services String[]`, `status` (default `OPEN`), `waitTime?`.
- **Rel:** `1─* CampResident`, `1─* CampInventory`, `1─* CampSchedule`,
  `1─* CampSupplyRequest`, `1─* Donation`, `1─* HospitalReferral`,
  `1─* CampTransferRequest` twice (`TransfersOut` / `TransfersIn`).

### `ReliefToken` / `ReliefTokenClaim` (group G)
- `ReliefToken`: **PK** `id`; **Unique** `code`. **FK** `userId → User.id`,
  `donorId → DonorCampaign.id?`, `campId?`. **Attrs:** `qrCodeData`, `status`
  (enum `TokenStatus`), `usageCount`, `maxUsage`, `issuedAt`, `expiresAt?`,
  `categories TokenCategory[]`, `fraudRiskScore` (default 0), `householdId?`,
  `isHouseholdBundle`.
- `ReliefTokenClaim`: **PK** `id`; **FK** `tokenId → ReliefToken.id`. **Attrs:**
  `claimedAt`, `claimedBy`, `itemType`, `quantity`, `proofImage?`, `campId?`,
  `locationLat?`, `locationLng?`.
- **Cardinality:** `ReliefToken 1─* ReliefTokenClaim`.

### `DamageAssessment` (group H)
- **PK** `id`. **FK** `reportedById → User.id`, `incidentId → IncidentReport.id?`.
- **Attrs:** `location`, `latitude?`, `longitude?`, `category` (enum
  `DamageCategory`), `structuralDamage` / `cropDamage` / `utilityDamage` /
  `roadDamage` (enum `DamageLevel`), `affectedPersons?`, `estimatedLoss?`,
  `mediaUrls String[]`, `status` (enum `DamageStatus`),
  `aiEstimatedCost?`, `aiEstimatedDamage?`, `compensationEligibilityScore?`,
  `compensationEligible`, `familyVulnerabilityScore?`, `incomeBracket?`,
  `propertyOwnershipStatus?`, `reviewerNotes?`.

### `Hospital` / `HospitalWard` / `HospitalReferral` (group M)
- `Hospital`: **PK** `id`; **Unique** `email`. **Attrs:** `name`, `location`,
  `latitude?`, `longitude?`, `phone?`, `specialties String[]`, `totalBeds`,
  `availableBeds`, `isActive`. **Rel:** `1─* User` (staff), `1─* HospitalWard`,
  `1─* HospitalReferral`.
- `HospitalReferral`: **FK** `campId → ReliefCamp.id`, `hospitalId → Hospital.id?`.
  **Attrs:** `patientName`, `patientAge?`, `conditionSeverity` (enum `Severity`),
  `transportMethod?`, `status` (enum `ReferralStatus`), `admittedAt?`,
  `dischargedAt?`.

### `VolunteerProfile` (group J)
- **PK** `id`; **Unique** `userId` (FK → `User.id`).
- **Attrs:** `incidentsJoined`, `readinessScore` (default 100), `totalHours`.
- **Rel:** `1─* VolunteerSkill`, `1─* VolunteerTraining`, `1─* VolunteerCheckIn`,
  `1─* VolunteerWellbeing`, `1─* VolunteerBadge`.

### `FamilyMember` / `SafetyCheckIn` (group K)
- `FamilyMember`: **FK** `primaryUserId → User.id`. **Attrs:** `name`, `relation`,
  `age?`, `status` (enum `SafetyStatus`), `notes?`, `phone?`.
- `SafetyCheckIn`: **FK** `userId → User.id`. **Attrs:** `status` (enum
  `SafetyStatus`), `message?`, `latitude?`, `longitude?`.

## 6.3 Core ER diagram (put THIS one in Chapter 3)

Include these **~18 entities** and their relationships:

`User`, `IncidentReport`, `IncidentHistory`, `Alert`, `Notification`,
`HelpRequest`, `Task`, `VolunteerProfile`, `ReliefCamp`, `ReliefToken`,
`ReliefTokenClaim`, `DamageAssessment`, `MissingPerson`, `RiverWaterLevel`,
`WaterLevelPrediction`, `FamilyMember`, `SafetyCheckIn`, `Hospital` /
`HospitalReferral`.

Relationships to show (crow's-foot):

| From | Relationship | To | Cardinality |
|---|---|---|---|
| User | reports | IncidentReport | 1 : 0..* |
| IncidentReport | has history | IncidentHistory | 1 : 0..* |
| IncidentReport | linked-as-duplicate | IncidentReport (self) | 0..* : 0..* (via IncidentDuplicateLink) |
| Alert | generates | Notification | 1 : 0..* |
| User | receives | Notification | 1 : 0..* |
| User | submits | HelpRequest | 0..1 : 0..* (nullable — public) |
| IncidentReport | spawns | Task | 1 : 0..* |
| User | assigned | Task | 0..1 : 0..* |
| User | has profile | VolunteerProfile | 1 : 0..1 |
| ReliefCamp | issues at | ReliefToken | 0..1 : 0..* |
| User | owns | ReliefToken | 1 : 0..* |
| ReliefToken | claimed via | ReliefTokenClaim | 1 : 0..* |
| User | files | DamageAssessment | 1 : 0..* |
| RiverWaterLevel | forecast cached in | WaterLevelPrediction | (logical, by gaugeId) 1 : 1 |
| User | lists | FamilyMember | 1 : 0..* |
| User | broadcasts | SafetyCheckIn | 1 : 0..* |
| ReliefCamp | refers to | HospitalReferral | 1 : 0..* |
| Hospital | receives | HospitalReferral | 0..1 : 0..* |

## 6.4 Module ER fragments (Appendix)

One small ER per subsystem, drawn separately:
1. **Identity** — `User`, `UserSessionLog`, `RolePermission`, `LocalVerifier`, `Sector`, `Hospital`.
2. **Incident lifecycle** — `IncidentReport`, `IncidentHistory`, `ReportVerification`, `VerifierAction`, `IncidentDuplicateLink`, `MLLog`, `Task`, `AfterActionReport`.
3. **Alerting** — `Alert`, `Notification`, `RainfallAlertLog`.
4. **Hydrology** — `RiverWaterLevel`, `RainfallReading`, `DownstreamMapping`, `WaterLevelPrediction`, `ThreatForecast`, `ThreatProjection`.
5. **Relief logistics** — `ReliefCamp`, `CampResident`, `CampInventory`, `CampSchedule`, `CampTransferRequest`, `CampSupplyRequest`, `Resource`.
6. **Tokens & donations** — `ReliefToken`, `ReliefTokenClaim`, `DonorCampaign`, `Donation`.
7. **Volunteers** — `VolunteerProfile` + its 5 child tables + `Task`.
8. **Support & health** — `PsychologicalSupportRequest`, `ChatSession`, `ChatMessage`, `GroupTherapySession`, `GroupTherapyParticipant`, `Hospital`, `HospitalWard`, `HospitalReferral`.
9. **Family & missing** — `FamilyMember`, `SafetyCheckIn`, `MissingPerson`, `PublicSafePlace`.
10. **Damage & finance** — `DamageAssessment`, `DisasterBudget`, `ResourceExpenditure`, `ResourceCost`, `KPIBenchmark`.

## 6.5 Enumerations (24) — list in the report

`Role` {CITIZEN, VOLUNTEER, ADMIN, DMC_OFFICER, FIELD_RESPONDER, HOSPITAL_STAFF} ·
`Status` {PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, EN_ROUTE, ON_SITE} ·
`Severity` {LOW, MEDIUM, HIGH, CRITICAL} ·
`AlertType` {INFO, WARNING, EMERGENCY} ·
`TokenStatus` {ACTIVE, PARTIALLY_USED, FULLY_USED, EXPIRED, REVOKED} ·
`DamageCategory` {RESIDENTIAL, AGRICULTURAL, INFRASTRUCTURE, COMMERCIAL, UTILITY, OTHER} ·
`DamageLevel` {NONE, MINOR, MODERATE, MAJOR, TOTAL_LOSS} ·
`DamageStatus` {PENDING_REVIEW, VERIFIED, REJECTED, SENIOR_REVIEW, APPROVED} ·
`VerifierRole` {GRAMA_NILADHARI, VILLAGE_OFFICER, COMMUNITY_LEADER, NGO_OFFICER, LOCAL_AUTHORITY} ·
`VerificationResult` {CONFIRMED, REJECTED, NEEDS_INVESTIGATION} ·
`SupportType` {COUNSELING, CHILD_SUPPORT, TRAUMA_CARE, GRIEF_SUPPORT, GENERAL} ·
`SupportUrgency` / `SupportStatus` ·
`InventoryItemType` {FOOD, WATER, MEDICAL, BLANKETS, HYGIENE} ·
`ReferralStatus` {PENDING, IN_TRANSIT, ADMITTED, DISCHARGED, TRANSFERRED, DECEASED} ·
`TokenCategory` {MEDICAL, FOOD, CLOTHING, SHELTER, TRANSPORT, EDUCATION, MENTAL_HEALTH} ·
`DonationType` {MONETARY, MATERIAL} · `DonationStatus` {PENDING, RECEIVED, ALLOCATED} ·
`SafetyStatus` {SAFE, NEEDS_HELP, UNKNOWN, MISSING, INJURED, EVACUATED, TRAPPED, SHELTERED} ·
`WaterRiskLevel` {NORMAL, WATCH, WARNING, DANGER} ·
`RiverStatus` {NORMAL, ALERT, MINOR_FLOOD, MAJOR_FLOOD} ·
`WaterTrend` {RISING, FALLING, STABLE} ·
`VehicleType` {BUS, VAN, BOAT, TRUCK, HELICOPTER, AMBULANCE} ·
`MissionStatus` {PENDING, IN_PROGRESS, COMPLETED, CANCELLED}.

## 6.6 Design decisions to state (Chapter 4 §4.4)

- **UUID PKs everywhere** — client-generatable, non-enumerable (security), safe
  for offline-created records that sync later.
- **Soft references for time-series** (`RiverWaterLevel`, `RainfallReading` have no
  FK) — they are append-only telemetry, not entities in a relationship.
- **JSON columns** for irregular structured data (`nlpEntities`, `Alert.channels`,
  `AfterActionReport.timeline`, `Sector.polygonData`) — avoids over-normalising
  ML output whose shape evolves.
- **`onDelete` policies** — `IncidentDuplicateLink` cascades with its incidents;
  `Notification.alertId` is `SetNull` so deleting an alert keeps the notification.
- **The `WaterLevelPrediction` cache table** was added specifically for this
  research to fix an O(N-gauges) ML-call performance problem — see `16 §1`.

## 6.7 Consistency check (before submission)

Run this and paste the count into the report as evidence the ER matches the DB:

```bash
# from d:\Suraksha - Web App
grep -c "^model " backend/prisma/schema.prisma          # -> 72
"D:/PostgreSQL/pgsql/bin/psql.exe" -h localhost -U odoo -d suraksha_db \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
```
The ER diagram you draw must contain the same table names, PK/FK columns and
relationship directions as `schema.prisma`.
