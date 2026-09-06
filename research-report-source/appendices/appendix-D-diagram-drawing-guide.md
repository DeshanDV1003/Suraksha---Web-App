# Appendix D — Diagram Drawing Guide (draw.io)

> The lecturer explicitly forbids AI-generated diagrams as the final artefacts.
> Draw every diagram yourself in **draw.io / diagrams.net** using the exact
> content from the source files. This guide gives the layout for each. Figure
> caption **below** the figure; explanation paragraph **before** it (what / why /
> module / assumptions).

General draw.io settings: A4 landscape for large diagrams; grid on; export as PNG
at 300 DPI (or SVG) for the Word document; consistent font (e.g. Helvetica 11);
one colour per element type.

---

## 1. Figure 3.x — System Architecture (source: `05-architecture.md §5.1`)

- 4 horizontal bands top→bottom: **Presentation**, **Application**, **Data** +
  **Intelligence** (side by side), **External Services** (bottom strip).
- Presentation band: two boxes — "Web Dashboard (React 19 + Vite)" and "Mobile App
  (Expo / React Native — offline-first)".
- Application band: one wide box "Backend API (Node.js + Express + TypeScript)"
  with sub-labels: *31 route groups · Auth/RBAC · Socket.IO server · Cron jobs ·
  Multi-channel dispatch*.
- Data box: "PostgreSQL — 72 tables (Prisma ORM)". Intelligence box: "ML
  Microservice (Python FastAPI — 22 endpoints, 5 trained models)".
- Arrows: Web → Backend labelled "REST (JWT) + Socket.IO"; Mobile → Backend "REST
  (JWT, via ngrok)"; Backend → PostgreSQL "Prisma"; Backend → ML "HTTP (JSON)";
  ML/Backend → External strip.
- External strip: Twilio · Nodemailer · Expo Push · Telegram · Open-Meteo ·
  Nominatim · Google OAuth.

---

## 2. Figure 3.x — Core ER Diagram (source: `06-database-design.md §6.3`)

- Crow's-foot notation. ~18 entities: `User`, `IncidentReport`,
  `IncidentHistory`, `Alert`, `Notification`, `HelpRequest`, `Task`,
  `VolunteerProfile`, `ReliefCamp`, `ReliefToken`, `ReliefTokenClaim`,
  `DamageAssessment`, `MissingPerson`, `RiverWaterLevel`, `WaterLevelPrediction`,
  `FamilyMember`, `SafetyCheckIn`, `Hospital`, `HospitalReferral`.
- Each entity box: name header, then **PK** (underline `id`), key attributes,
  **FK** columns marked `(FK)`.
- Draw the exact relationships + multiplicities from the table in §6.3
  (e.g. `User ──< IncidentReport` = one-to-many; `IncidentReport >──< IncidentReport`
  self many-to-many via `IncidentDuplicateLink` as an associative entity).
- Put `User` centre-left (it touches the most entities).
- **Verify against `schema.prisma`** before finalising (§6.7).

### Appendix module ER fragments (source: `06 §6.4`)
Ten small ER diagrams, one per subsystem list — same notation, 4–8 entities each.

---

## 3. Figure 3.x — Use-Case Diagrams (source: `07-use-cases.md`)

- One diagram per module (UC-M1…M8). Chapter: M1, M2, M4. Appendix: M3, M5–M8.
- System boundary = a labelled rectangle; use cases = ovals inside; actors =
  stick figures outside (left = human initiators, right = system/external).
- Draw actor generalisation arrows (Volunteer ▷ Citizen, Administrator ▷ DMC
  Officer, Field Responder ▷ Volunteer).
- `<<include>>` = dashed arrow from base UC → included UC (arrow points to
  included). `<<extend>>` = dashed arrow from extension UC → base UC.
- Before each: the explanation template at the bottom of `07-use-cases.md`.

---

## 4. Figures 3.x — Activity Diagrams ×3 (source: `08-activity-diagrams.md`)

- AD-1 Offline report + sync · AD-2 Severity triage + routing · AD-3 River
  forecast → alert.
- **Swimlanes** (vertical partitions) for each actor listed under the diagram.
- Rounded rectangle = start / end (filled circle start, circled-dot end).
- Rectangle = action. Diamond = decision (label each outgoing edge with the
  guard). Black bar = fork / join (use for the parallel branches noted in each
  AD).
- Follow the numbered step list exactly — the activity diagram must match the
  sequence diagram of the same process (`09`).

---

## 5. Figures 3.x — Sequence Diagrams ×3 (source: `09-sequence-diagrams.md`)

- SD-1 / SD-2 / SD-3 mirror AD-1 / AD-2 / AD-3.
- Lifelines across the top in call order; activation bars while active.
- Solid arrow = synchronous call; dashed arrow = return.
- Combined fragments: **`alt`** (the 2xx/4xx/5xx and reachable/unreachable
  branches), **`par`** (parallel enrichment / multi-channel dispatch), **`loop`**
  (per-item sync / per-gauge forecast).
- Copy the pseudo-sequence blocks from `09` node-for-node.

---

## 6. Figure 4.x — Class Diagram (source: `10-class-diagram.md §10.2`)

- Chapter: the Incident + Alert + Water subsystem.
- Stereotype the classes: `«boundary»` controllers, `«control»` — actually use
  `«controller»` / `«service»` / `«entity»` / `«enumeration»`.
- Class box: name, attributes (`- name: Type`), operations (`+ method(): Return`).
- Draw: dependency arrows (dashed, controller → service), associations
  (service → entity with multiplicity), a shared dependency to `PrismaClient`,
  and a `«guard»` note on the role-gated operations.
- Appendix: the full domain class diagram (~18 core entities as `«entity»` classes
  + the enum classes, associations with multiplicities, no operations on entities).

---

## 7. Figures 4.x — Flowcharts ×6 (source: `16-algorithms-and-flowcharts.md`)

Chapter: ALG-1 (prediction cache), ALG-3 (severity + routing), ALG-6 (offline
sync). Appendix E: ALG-2, ALG-4, ALG-5.

- Rounded rectangle = start / end. Rectangle = process. Diamond = decision
  (label Yes / No branches). Parallelogram = input / output.
- Use the "Flowchart nodes" line at the end of each ALG as the skeleton.
- The flowchart must match its algorithm's pseudocode and its explanation
  (lecturer guideline 9 — Algorithm → Explanation → Flowchart → Implementation
  must all agree).

---

## 8. Figure 4.x — Mobile Offline-Sync Architecture (source: `13-mobile-implementation.md §13.2`)

- Centre: **SQLite `sync_queue`** cylinder.
- Feeding in: `useOfflineSubmit` hook (from every screen's submit button) — arrow
  labelled "queue on 5xx / timeout / offline".
- Draining out: `syncService.syncPendingItems()` → arrow "FIFO POST to
  SYNC_HANDLERS[type]" → **Backend API** box.
- Triggers into `syncService`: `networkMonitor` (8 s poll / on-reconnect),
  `backgroundSync` (Expo BackgroundFetch), app-foreground.
- Side box: read caches (`incidents_cache`, `alerts_cache`, `relief_camps_cache`,
  seeded `emergency_numbers_cache`, `first_aid_cache`) → screens (offline reads).
- Note box: "0 % data loss measured across 6 connectivity-failure conditions".

---

## 9. Optional — Figure 4.x — Trilingual Intake Pipeline (source: `14 §14.4`)

Simple left→right pipeline: `raw text` → `detect_language` → (`translate` if not
En) → `extract_entities (NER)` → `build_feature_vector` → `XGBoost predict_proba`
→ `{severity, confidence, entities, language}`. Show the three input languages
converging to one normalised English + entities output.

---

## 10. Consistency checklist (lecturer guideline 30) — do before submission

| Pair | Must match |
|---|---|
| ER diagram ↔ `schema.prisma` | table names, PK/FK, relationships, cardinality |
| Use cases ↔ `04-requirements.md` FR list | every FR appears as a use case |
| Activity diagrams ↔ Sequence diagrams | same 3 processes, same steps/decisions |
| Algorithm ↔ code snippet ↔ flowchart ↔ implementation | same logic, same decisions |
| ML comparison tables ↔ `suraksha-ml/models/*_info.json` | every metric traceable |
| Screenshots ↔ running system | exact same UI |
| In-text citations ↔ Reference list ↔ Zotero library | 1:1 |
