# 03 — Research Methodology (Chapter 3 source, part 1)

## 3.1 Research approach — Design Science Research (DSR)

The work follows the **Design Science Research** paradigm (Hevner et al.): the
research contribution is an *artefact* (the Suraksha platform) whose design and
evaluation generate knowledge about building crisis-informatics systems for a
low-resource, connectivity-constrained, multilingual context.

DSR activities as applied here:

| DSR activity | In this project |
|---|---|
| **Problem identification & motivation** | §1.1–1.3: fragmentation, language, triage load, connectivity — derived from DMC operational practice and disaster-response literature |
| **Objectives of a solution** | RO1–RO6 (§1.5) |
| **Design & development** | Architecture (`05`), database (`06`), UML (`07`–`10`), implementation (`11`–`14`), algorithms (`16`) |
| **Demonstration** | A running platform: web dashboard, mobile app, ML service, seeded with real DMC data |
| **Evaluation** | Four-dimensional evaluation (§3.6) |
| **Communication** | This report + the IEEE-track paper |

## 3.2 Development methodology — iterative / incremental

The software was built in short iterations, one feature-module at a time
(auth → incidents → alerts → water monitoring → relief → ML integration →
mobile offline sync → hardening). Each iteration: implement → smoke-test →
document test cases → fix defects → integrate. This matches the DSR
build–evaluate loop and is evidenced by the version tags in the three git
repositories (web `v16`, mobile `v18`, ML retrained Sept 2026).

## 3.3 Data collection

All model training and system seeding use **real Sri Lanka DMC data**. Sources:

| Dataset | Content | Size | Used for |
|---|---|---|---|
| **DMC official incident records** (`DI_report105745`) | Government-sourced disaster events 1990–2026 (EOC / DDMCU / Police / District offices): hazard type, district, deaths, affected people, houses damaged, economic loss | **146,544 records** used for the severity model; **112,040 usable event-rows** for the spatiotemporal model | Severity triage classifier (RO2); spatiotemporal district-risk forecaster (RO4) |
| **DMC river-level bulletins** (PDF) | Per-station water level, flood thresholds (alert / minor / major), reporting timestamp | 2,218 real bulletin PDFs; **500 sampled**, **369 parsed OK**, **9,940 readings**, **47 stations** | LSTM river-level forecaster (RO3) |
| **DMC situation reports** (PDF) | Narrative incident descriptions | **600 PDFs** auto-annotated | NER entity-extraction model (RO4) |
| **DMC rainfall bulletins** | District rainfall mm/hr, 24 h & 72 h cumulative, risk level | Ingested live via Open-Meteo for the operational dashboard; DMC values for training context | Rainfall context features; threshold alerting |
| **Domain-expert rubric** | Severity-scoring rubric (population scaling, hazard type, vulnerability flags, thresholds) | Reviewed by **3 domain specialists** (Content Validity Index) | Severity label definition |

### 3.3.1 Labelling and expert validation (severity model)

- **Labellers:** 2 practitioners — anonymised as *Senior Disaster Management
  Officer* (10 yrs) and *Emergency Response Coordinator* (12 yrs), both with daily
  DMC situation-report triage experience.
- **Cases reviewed:** 50.
- **Adjudication:** disagreements resolved by a "Safety-First" rule — on a tie the
  higher severity tier wins.
- **Inter-rater agreement:** **weighted Cohen's κ = 0.94** (near-perfect on the
  rubric logic).
- **Rubric content validation:** 3 independent domain experts, Content Validity
  Index; **Item-level CVI > 0.83** across all thresholds. One rubric change
  resulted: "Building Collapse" was elevated to trigger a baseline HIGH/CRITICAL
  modifier regardless of population, reflecting localised structural lethality.

### 3.3.2 Data authenticity notes (state these in Chapter 3)

- The **severity dataset** is built by Monte-Carlo sampling *grounded on empirical
  DMC Situation Report statistics* — the marginal distributions (hazard mix,
  affected-population ranges, vulnerability prevalence) come from real DMC
  reports; individual synthetic rows are sampled from those distributions. Label
  noise (16 %) is injected deliberately (§3.4).
- The **LSTM water data** are **real** DMC bulletin readings; the only synthetic
  elements are humidity/temperature (not in bulletins — set to seasonal defaults)
  and the 24 h rainfall total (estimated from the reported rate).
- The **credibility model** is trained on **labelled synthetic crowdsourced
  scenarios**, because the real DMC export contains only official-source records
  and therefore no genuine low-credibility examples. The synthetic label is built
  from independent corroboration + adjudication-noise signals, not a function of
  the model's own input features (which would give a trivial 100 %).
- The **spatiotemporal model** uses real DMC event history (1990–2026); the target
  is a composite risk score computed only from *past* months (no current-month
  leakage).

## 3.4 Epistemic-noise justification (severity model)

At 0 % label noise the XGBoost classifier trivially reverse-engineers the
deterministic rubric proxy (100 % accuracy — not real learning). A sensitivity
analysis over noise ratios:

| Injected label noise | Accuracy | Macro-F1 |
|---|---|---|
| 0 % | 1.0000 | 1.0000 |
| 8 % | 0.9175 | 0.9081 |
| **16 % (selected)** | **0.8025** | **0.7824** |
| 24 % | 0.7150 | 0.6973 |

16 % was chosen not as a measured field error rate but as a *simulated
information-asymmetry constraint* that forces the model to operate under
uncertainty analogous to unverified crowdsourced reporting, bounding accuracy at
a realistic ≈ 80 %.

## 3.5 Tools & environment

| Layer | Tools |
|---|---|
| Backend | Node.js, TypeScript, Express 4, Prisma ORM 6, PostgreSQL 17 |
| Web frontend | React 19, Vite 6, Tailwind CSS 4, Zustand, TanStack Query 5, React Leaflet, ApexCharts/Recharts, i18next |
| Mobile | Expo SDK 54, React Native 0.81, React Navigation 7, Expo SQLite / Location / Notifications / Camera / BackgroundFetch |
| ML service | Python 3, FastAPI, scikit-learn, XGBoost, TensorFlow/Keras (LSTM), spaCy (NER), NumPy |
| Realtime | Socket.IO |
| External | Twilio (SMS), Nodemailer (e-mail), Expo push, Telegram Bot, Open-Meteo (rainfall), Nominatim (geocoding) |
| Testing | Vitest (unit), Playwright (E2E), k6 (load), a custom Node runner driving 168 documented cases into an Excel workbook |
| Diagramming | draw.io / diagrams.net (all report diagrams) |
| Reference management | Zotero |

## 3.6 Evaluation design — four dimensions

| Dimension | Question | Method | Where reported |
|---|---|---|---|
| **Functional correctness** | Do the features behave to spec? | 168 documented test cases (100 web/API + 68 mobile) executed by a scripted runner against the live system; results written back to `Suraksha_Test_Cases.xlsx` | `17-testing-and-evaluation.md §2`; Appendix A |
| **Performance / scalability** | Does it hold up at DMC-scale load? | k6 load test (100 virtual users, 5 min, mixed endpoints), plus targeted endpoint load tests | `17 §3` |
| **Model quality** | Is each ML model better than a sensible baseline? | Per-model: chronological / stratified hold-out, k-fold CV, baseline comparison (persistence, RF, LogReg, majority), calibration + risk–coverage for triage | `15-ml-evaluation.md` |
| **Resilience** | Does offline capture lose data? | Offline-sync stress: reconnect-ideal (Q=10/50/100), disconnect mid-sync, app restart, 500/1000/2000 ms latency, 5/10/20 % packet loss, duplicate retry | `17 §4`; test cases TC-M-027…031 |

Supporting: **static verification** (`tsc --noEmit`, ESLint), **52 unit tests**
(pure logic), **Playwright E2E** (63/79 Chromium after harness fix), and a
**security review** of authentication/RBAC.

## 3.7 Justifications (viva)

- **Why DSR?** The deliverable is a working system; DSR is the standard paradigm
  for research whose contribution is a designed artefact plus the design
  knowledge from building and evaluating it.
- **Why real DMC data (not a public benchmark)?** The gap is precisely
  *"evaluated on real Sri Lanka data"* — external validity for the target
  deployment requires the local hazard mix, districts, languages and reporting
  style.
- **Why a microservice for ML (not in-process)?** Python/TensorFlow/XGBoost
  ecosystem for the models; independent scaling and deployment; the Node backend
  degrades gracefully (HTTP 503 / cached predictions) if the ML service is down.
- **Why offline-first mobile?** The field constraint: the network fails exactly
  when a citizen needs to report. A durable local queue makes the report survive.
- **Why XGBoost for severity (not deep learning)?** Tabular features (affected
  population, hazard type, vulnerability flags), modest signal, need for
  calibrated probabilities and fast inference — gradient-boosted trees are the
  right tool and beat RF / LogReg / ordinal-logit here (see `15`).
- **Why LSTM for water level?** Sequential, autocorrelated gauge readings with a
  rainfall driver; LSTM is the standard data-driven choice for short-horizon
  river-stage forecasting and is compared honestly against persistence.
