# 01 — Introduction (Chapter 1 source)

## 1.1 Background

Sri Lanka is among the countries most exposed to hydro-meteorological hazards.
The South-Western wet zone (Colombo, Gampaha, Kalutara, Ratnapura) experiences
recurrent monsoonal flooding and rain-triggered landslides; the Kelani, Kalu and
Gin river basins routinely breach minor- and major-flood gauge thresholds during
the South-West (May–September) and North-East (December–February) monsoons. The
Disaster Management Centre (DMC) coordinates the national response, issuing
situation reports and river/rainfall bulletins.

Disaster response in practice is constrained by four persistent problems:

1. **Fragmentation.** Incident intake (hotline, social media, field officers),
   river monitoring, relief-camp management, and resource allocation are handled
   by separate tools and spreadsheets, so a common operating picture has to be
   assembled manually.
2. **Language.** Citizens report in Sinhala, Tamil or English; triage staff must
   read and normalise all three under time pressure.
3. **Triage load.** During a large event the volume of unverified citizen reports
   overwhelms the officers who must assign severity and dispatch resources.
4. **Connectivity.** The moment a citizen most needs to report — during a flood,
   in a rural area, on a congested cell network — is exactly when the network is
   least reliable, so reports are lost.

## 1.2 Problem statement

> Sri Lanka lacks a single, connectivity-resilient platform that lets citizens
> report disasters in their own language, automatically triages and forecasts
> those events using models trained on real DMC data, and presents a live
> command picture to DMC officers — with every layer validated against
> operational data rather than toy datasets.

## 1.3 Research gap

Existing work and existing systems each cover *part* of the space:

| Covered by prior work | Not covered together, on real SL data, in one deployable system |
|---|---|
| Social-media disaster classification (English-centric) | Trilingual (Si/Ta/En) citizen intake with NER on real DMC bulletins |
| Flood forecasting research (basin-specific, offline) | Operational per-gauge short-horizon forecasting wired into a live alerting pipeline |
| Crowdsourcing platforms (Ushahidi-style) | Offline-first mobile capture with a durable local queue and guaranteed-eventually sync |
| ML severity triage papers (small labelled sets) | Severity triage trained on **146,544 real DMC records** with a calibrated human-in-the-loop routing layer |
| Command dashboards (proprietary, closed) | An open, reproducible React command dashboard with role-based access and real-time maps |

**The gap this research addresses:** no published system unifies *trilingual
citizen reporting + offline-first mobile capture + ML triage/forecasting + a DMC
command dashboard*, built and evaluated end-to-end on **real Sri Lanka DMC
datasets**.

## 1.4 Aim

To design, implement and evaluate **Suraksha**, an integrated disaster-management
platform (web command dashboard + offline-first mobile app + ML microservice)
that improves the speed, coverage and consistency of disaster response in Sri
Lanka, using models trained and validated on authentic DMC data.

## 1.5 Research objectives

- **RO1 — Requirements & design.** Elicit the functional and non-functional
  requirements of a unified disaster-management platform from DMC operational
  practice, and produce a modular architecture (command dashboard, mobile app,
  data layer, ML microservice).
- **RO2 — Data & ML triage.** Collect and preprocess real DMC incident records
  (**146,544 records**) and develop a severity-triage classifier with an
  uncertainty-aware human-in-the-loop routing layer; compare it against baseline
  classifiers.
- **RO3 — Hydrological forecasting.** Build a short-horizon (T+1 h / T+2 h)
  river-water-level forecaster from real DMC river bulletins (**47 stations**) and
  wire it into an automatic threshold-alerting pipeline; compare it against a
  naïve persistence baseline.
- **RO4 — Trilingual intake & supporting models.** Implement a Sinhala/Tamil/
  English intake pipeline (language detection → translation → named-entity
  extraction) and supporting AI services (incident-credibility scoring,
  district-level spatiotemporal risk forecasting, geo-targeted alerting).
- **RO5 — Offline-first mobile capture.** Implement a mobile client with a durable
  local SQLite queue that captures reports offline and synchronises them on
  reconnection with no data loss, and evaluate it under connectivity stress.
- **RO6 — Evaluation.** Evaluate the platform across four dimensions: functional
  correctness (test cases), performance/scalability (load testing), model
  quality (per-model metrics vs baselines), and resilience (offline-sync stress).

## 1.6 Research questions

- **RQ1.** Can a severity-triage classifier trained on real DMC records, combined
  with an uncertainty-based routing layer, reach a level of accuracy and
  under-triage safety acceptable for operational decision support?
- **RQ2.** Does an LSTM river-level forecaster trained on real DMC bulletins beat
  a naïve persistence baseline for a 2-hour horizon, and is the margin
  operationally useful?
- **RQ3.** Can a mobile client with a local queue guarantee zero data loss for
  citizen reports across realistic connectivity failures (disconnect mid-sync,
  app restart, packet loss, high latency)?
- **RQ4.** Does the integrated platform meet functional and performance
  requirements suitable for a DMC-scale operating load?

## 1.7 Scope

**In scope:** the web command dashboard, the mobile citizen/volunteer app, the
PostgreSQL data layer, the FastAPI ML microservice, real-time updates (Socket.IO),
multi-channel alerting (in-app, push, SMS, e-mail, Telegram), and the evaluation
described above. Hazards covered: **flood, landslide, and related monsoon
hazards**, with a schema general enough for other incident types.

**Out of scope:** production hardening for national rollout (HA infrastructure,
formal security certification), a native (non-Expo) mobile build, real-time
integration with live government gauge telemetry feeds (the system ingests DMC
bulletin data and simulates the live cadence for demonstration), and clinical
validation of the psychological-support workflow.

## 1.8 Novelty / contributions

1. **An integrated, reproducible reference implementation** of a trilingual,
   offline-first, ML-assisted disaster-management platform for Sri Lanka —
   72-table relational schema, 31 REST route groups, 25 mobile screens, 22 ML
   endpoints — released as source.
2. **A severity-triage pipeline trained on 146,544 real DMC records** with a
   *calibrated* uncertainty-routing layer whose behaviour is characterised by a
   risk–coverage sweep (how much human workload buys how much error capture).
3. **A per-gauge short-horizon river forecaster trained on real DMC bulletins**
   (47 stations) with an honest comparison to a persistence baseline, wired into
   a live threshold-alerting and downstream-district mapping pipeline.
4. **A durable offline-first capture design** (local SQLite FIFO queue + FIFO
   sync handler + connectivity monitor + background task) evaluated under six
   connectivity-failure conditions with **0% data loss** measured throughout.
5. **A geo-targeted alerting model** that decides per-user alert relevance from
   alert coordinates + broadcast radius + an "All Island" override, keeping
   irrelevant alerts off citizens' phones.
6. **A four-dimensional evaluation methodology** (functional / performance /
   model / resilience) with 168 documented test cases, load testing, per-model
   baseline comparisons and offline-sync stress testing — reusable by other
   crisis-informatics projects.

## 1.9 Report structure

- **Chapter 2** reviews related disaster-management systems and the ML techniques
  used, and states the gap precisely.
- **Chapter 3** covers the research methodology, data sources, and the system
  analysis & design (requirements, architecture, database, use-case / activity /
  sequence / class diagrams).
- **Chapter 4** describes the implementation of each layer and the key algorithms.
- **Chapter 5** presents the testing, the ML evaluation, and the results.
- The **Conclusion** summarises the contributions, limitations and future work.

---

## Viva preparation — answers you must give without reading

**"What is your research?"**
An integrated disaster-management platform for Sri Lanka: a web command dashboard
for DMC officers, an offline-first mobile app for citizens and volunteers, and a
Python ML microservice — all sharing one PostgreSQL database. The research
contribution is doing this *end to end on real DMC data*: severity triage trained
on 146,544 real incident records with an uncertainty-routing safety layer, river
forecasting trained on real DMC bulletins for 47 stations, and an offline capture
design proven to lose no data under connectivity failure.

**"What is your research gap?"**
Prior work covers pieces — English social-media classification, basin-specific
flood models, generic crowdsourcing tools, small-dataset triage papers — but
nothing unifies *trilingual citizen intake + offline-first mobile capture + ML
triage/forecasting + a DMC command dashboard*, evaluated on real Sri Lanka DMC
data, in one deployable system.

**"What is your methodology?"**
Design Science Research: (1) problem identification from DMC operational practice,
(2) requirements + architecture design, (3) iterative build across web/mobile/ML,
(4) data collection & preprocessing of real DMC datasets, (5) four-dimensional
evaluation (functional test cases, load testing, per-model baseline comparison,
offline-sync stress).

**"What is novel?"**
The integration itself, on real data, with an *honest* evaluation: a calibrated
human-in-the-loop routing layer characterised by a risk–coverage curve; a river
forecaster benchmarked against persistence; and an offline design measured at 0%
data loss across six connectivity-failure scenarios.

**"Why this problem / methodology / technology?"** — see `03-methodology.md §3.7`.
**"Limitations?"** — see `18-results-discussion.md §5`.
