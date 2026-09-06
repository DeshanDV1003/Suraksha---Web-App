# 19 — Conclusion (Conclusion chapter source)

## 19.1 Summary

This research designed, implemented and evaluated **Suraksha**, an integrated
disaster-management platform for Sri Lanka comprising (1) a React command
dashboard for DMC officers, (2) an Expo / React Native offline-first mobile client
for citizens and volunteers, (3) a PostgreSQL data layer of 72 relational
entities, and (4) a Python FastAPI machine-learning microservice. The
contribution is the **integration** — trilingual citizen intake, offline-resilient
mobile capture, ML triage and forecasting, and a real-time command picture — built
and evaluated **end to end on real Sri Lanka DMC data**, which no prior published
system does together.

The platform was evaluated along four dimensions:

- **Functional:** 168 documented test cases across 26 modules — **98 % of the 145
  executed cases pass**; the test process itself found and fixed six defects,
  including a high-severity RBAC hole and a high-severity performance regression.
- **Performance:** k6 load testing at 100 concurrent users — **p95 533 ms, 0 %
  errors, 64 req/s**, all thresholds met after a prediction-cache optimisation
  that cut the water-forecast endpoint from 26 s to 0.5 s.
- **Model quality:** five models trained on real (or DMC-grounded) data, each
  compared to a baseline — severity XGBoost (Macro-F1 0.81 / CV 0.834, beating RF,
  LogReg, ordinal-logit), LSTM river forecaster (val MAE 0.343 m vs persistence
  0.361 m), NER (Macro-F1 0.96 silver-standard), credibility XGBoost (Macro-F1
  0.84), spatiotemporal risk GB (chronological R² 0.23 vs persistence −0.01, tier
  accuracy 0.945).
- **Resilience:** offline-sync stress testing across six connectivity-failure
  conditions — **0 % data loss** in every condition.

## 19.2 Contributions

1. **An integrated, reproducible reference implementation** of a trilingual,
   offline-first, ML-assisted disaster-management platform for a low-resource,
   connectivity-constrained context, released as source.
2. **A severity-triage pipeline on 146,544 real DMC records** with a calibrated
   uncertainty-routing layer whose safety behaviour is characterised by an
   explicit risk–coverage curve.
3. **A per-gauge short-horizon river forecaster on real DMC bulletins** with an
   honest persistence-baseline comparison, wired into a live automatic alerting
   and downstream-district-mapping pipeline.
4. **A durable offline-first capture design** validated at **0 % data loss** under
   disconnect, restart, latency and packet-loss stress.
5. **A geo-targeted alert-relevance model** that keeps irrelevant alerts off
   citizens' devices.
6. **A four-dimensional evaluation methodology** (functional / performance /
   model / resilience) with reusable tooling — 168 documented cases driven into a
   living workbook, a scripted load-test suite, per-model baseline harnesses, and
   an offline-sync stress harness.

## 19.3 Future work

| Area | Item |
|---|---|
| **ML — severity** | replace the 16 % synthetic label noise with a measured field error rate from a live pilot; add a human-annotated gold set |
| **ML — NER** | build a small human-annotated gold test set to measure true extraction quality (currently silver-standard) |
| **ML — credibility** | collect real citizen-sourced reports (with app rollout) to replace the synthetic training scenarios |
| **ML — LSTM** | integrate a real-time government gauge telemetry feed; per-station scalers; longer horizons |
| **Mobile — security** | move the JWT from `AsyncStorage` to `expo-secure-store` |
| **Mobile — sync** | add a client-generated idempotency key + server-side upsert to eliminate the 10 % duplicate-on-retry |
| **Web — testing** | run the Playwright E2E suite against a production preview build so Firefox / WebKit are meaningful; modernise the ~15 stale POM selectors |
| **Deployment** | production HA topology (reverse proxy, managed PostgreSQL, dedicated ML node), native (EAS) mobile builds, formal security certification |
| **Validation** | larger practitioner cohort for label validation; a field pilot with a DMC district office |
| **Models not yet trained** | train the currently-heuristic components (language detector, hotspot forecaster) on labelled data, or replace with pre-trained models |

## 19.4 Closing statement

Suraksha demonstrates that a single, connectivity-resilient, multilingual,
ML-assisted disaster-management platform can be built and evaluated on real
national data with modest resources. The models are honest about their limits —
a small margin over persistence for river forecasting, a silver-standard NER, a
synthetically-trained credibility model — and the system is honest about its
architecture: five trained models doing the research-critical work, wrapped in a
robust engineering platform. The measured results (98 % functional pass rate,
sub-second load latency, 0 % offline data loss, five models beating their
baselines) show the approach is sound and deployable, and the future-work list
maps a clear path from this research prototype to an operational national system.
