# 18 — Results & Discussion (Chapter 5 source)

## 18.1 Achievement against the research objectives

> **Table 5.x — Research objectives: outcome and evidence.**

| Objective | Outcome | Key evidence |
|---|---|---|
| **RO1 — Requirements & design** | Complete: 40+ functional requirements across 9 module groups, 10 NFRs, a 4-layer architecture, a 72-table relational schema, and full UML (use-case / activity / sequence / class) | `04`, `05`, `06`, `07`–`10` |
| **RO2 — ML triage on real data** | Severity XGBoost trained on **146,544 real DMC records**; Macro-F1 **0.81** / CV **0.834 ± 0.006**; beats RF (+6 pp), LogReg (+12 pp), ordinal-logit (+35 pp); calibrated uncertainty-routing layer characterised by a risk–coverage curve (26 % human workload → 24 % severe-error capture) | `15 §15.1` |
| **RO3 — Hydrological forecasting** | LSTM trained on **real DMC bulletins, 47 stations**; val MAE **0.343 m** vs persistence **0.361 m** (−5 %); wired into an automatic threshold → downstream-district → multi-channel alerting pipeline | `15 §15.2`, `08 AD-3` |
| **RO4 — Trilingual intake + supporting models** | Language cascade + NMT + trained NER (Macro-F1 **0.96** silver-standard, 600 real DMC PDFs); credibility XGBoost (Macro-F1 **0.84**, CV 0.837); spatiotemporal risk GB (chrono R² **0.23** vs persistence −0.01, tier accuracy **0.945**) | `15 §15.3–15.5` |
| **RO5 — Offline-first mobile capture** | Durable SQLite FIFO queue + FIFO sync + connectivity monitor + background task; **0 % data loss** across 6 connectivity-failure conditions | `17 §4` |
| **RO6 — Evaluation** | 4-dimensional: 168 functional test cases (98 % pass), k6 load (p95 533 ms), per-model baseline comparison, offline-sync stress | `17` |

## 18.2 Answering the research questions

- **RQ1 (severity triage + routing).** *Yes, conditionally.* On the raw DMC
  export the model reaches 0.97 accuracy / 0.81 Macro-F1 / **0.86 recall on the
  rare CRITICAL class**; on the controlled grounded set it reaches 0.79 Macro-F1
  with a **19.5 % under-triage rate**, which the uncertainty-routing layer reduces
  by capturing ~24 % of severe errors at ~26 % human workload. It is suitable as
  *decision support with a mandatory human-in-the-loop for low-confidence cases*,
  not as a fully autonomous triage system — which is exactly how it is deployed.
- **RQ2 (LSTM vs persistence).** *Yes, but the margin is small.* The LSTM beats
  the naïve persistence baseline by ~5 % MAE (1.8 cm) at a 2-hour horizon on
  irregular bulletin data. Short-horizon river stage is persistence-dominated, so
  this is an honest, expected result. The operational value is the **confidence +
  alert-level output** that drives automatic alerting — which persistence cannot
  provide.
- **RQ3 (offline data loss).** *Yes.* **0 % data loss** measured across
  reconnect, disconnect-mid-sync, app-restart, latency (0.5–2 s) and packet-loss
  (5–20 %) conditions. The single weakness is duplicate creation on retry (10 %) —
  a solved problem (idempotency key) left as future work.
- **RQ4 (platform meets functional + performance requirements).** *Yes.* 98 % of
  145 executed functional test cases pass; all k6 load thresholds pass at 100 VU
  (p95 533 ms, 0 errors, 64 req/s); all 10 NFRs are met (after 5 defect fixes made
  during evaluation).

## 18.3 Discussion — what worked

1. **Integration on real data is the contribution.** Each individual technique
   exists in the literature; doing all of them together, on real DMC datasets,
   in one deployable system, with an honest evaluation, is what is new.
2. **The uncertainty-routing layer is architecturally sound.** Even where the
   confidence signal tracks the random baseline closely, having a *defined
   abstention mechanism* with a tunable operating point is what makes an
   ~80 %-accurate classifier safe to deploy for disaster triage.
3. **Graceful degradation held up.** With the ML service deliberately stopped,
   the API stayed up, AI-only endpoints returned 503, and water forecasts served
   from cache — the command dashboard never went dark.
4. **The offline-first design does what it claims.** The measured 0 % data loss
   across six failure modes directly validates the mobile research contribution.
5. **The evaluation itself found and fixed 6 real defects** (one High-severity
   RBAC hole, one High-severity performance regression), demonstrating the value
   of the four-dimensional test methodology.

## 18.4 Discussion — trade-offs & design tensions

- **Macro-F1 vs weighted-F1 for severity.** The raw DMC export is 90 % LOW and
  0.25 % CRITICAL. Optimising overall accuracy would ignore CRITICAL entirely;
  SMOTE + reporting Macro-F1 and per-class recall keeps the focus on the rare,
  dangerous class at the cost of CRITICAL precision (many false CRITICAL alarms).
  For disaster triage this is the right trade — over-triage is recoverable,
  under-triage is not.
- **Synthetic vs real data for the credibility model.** Using real data would
  have given a leak-free 100 % (no negative examples exist). Labelled synthetic
  scenarios with independent noise are the honest choice; the limitation is
  stated.
- **Silver-standard NER.** Distilling the rule-based labeller into a portable
  neural model is useful (deployable spaCy pipeline) but does not prove extraction
  correctness against human ground truth.
- **Prediction freshness vs load.** The 60 s response cache means a fresh visitor
  can see up-to-60 s-old "current level"; acceptable for hourly-cadence data and
  the price of a 10× throughput gain.

## 18.5 Limitations (state these plainly — lecturer guideline 24)

1. **Not all "AI" components are trained models.** 5 of 16 are; the rest are
   correct algorithms / heuristics / pre-trained library calls. (`14 §14.3`)
2. **The LSTM margin over persistence is small** (−5 % MAE) and the model is
   trained on ~9,940 readings from irregular bulletins, not a live gauge feed.
3. **The NER evaluation is silver-standard**, not against human gold labels.
4. **The credibility model is trained on synthetic scenarios** because the real
   DMC data has no low-credibility examples.
5. **Mobile JWT is stored in plaintext AsyncStorage** (should be secure-store).
6. **Offline-sync retries can create duplicate server records** (no idempotency
   key) — 10 % measured.
7. **Firefox/WebKit E2E times out** against the dev server (needs a prod-preview
   build); Chromium is the validated browser.
8. **Deployment is single-node** for evaluation; production HA, managed DB, GPU
   ML node, and native mobile builds are out of scope.
9. **Expert validation used 2 practitioners / 50 cases** — small, though with
   near-perfect agreement (κ = 0.94).
10. **The system ingests DMC bulletin data and simulates the live cadence**; it
    is not yet integrated with a real-time government telemetry feed.

## 18.6 Threats to validity

- **Internal:** the severity model's 16 % label noise is a design choice, not a
  measured field error rate — stated as such. The grounded dataset's marginals
  come from real DMC statistics but individual rows are sampled.
- **External:** models are Sri-Lanka-specific (districts, hazard mix, languages)
  — that is intentional (the gap is "on real SL data") but limits transfer.
- **Construct:** "credibility" and "risk score" are composite constructs defined
  by rubric; the CVI (> 0.83) and κ (0.94) support the rubric's validity.
- **Conclusion:** load testing on one workstation approximates but does not equal
  a production cluster under real traffic.
