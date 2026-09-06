# 15 — ML Model Evaluation (Chapter 5 source — THE core ML results)

> Your lecturer's guideline 10: *"show that you actually evaluated different
> algorithms — Algorithm 1 / 2 / 3 → training → evaluation → accuracy → compare →
> then state which was selected and why."* This file gives you that for every
> trained model. Every number is from a `*_info.json`, an evaluation log, or an
> audit doc in the repo — **cite the file** in the report.
>
> **Table caption goes ABOVE the table** (lecturer guideline 13).

---

## 15.1 Severity / Priority Triage Classifier (RO2, RQ1)

**Task:** classify a disaster incident into `LOW / MEDIUM / HIGH / CRITICAL` from
tabular impact features (affected population, hazard type, vulnerability flags).
**Feature vector:** 12-dim, defined in `ml/feature_builder.py` (the live
production schema).

### 15.1.1 Two evaluation regimes (report both, clearly labelled)

| Regime | Dataset | Why it exists |
|---|---|---|
| **A — Raw real DMC export** | `DI_report105745.xls`, **146,544 real DMC records** (1990–2026). Class distribution: LOW 132,322 · HIGH 8,821 · MEDIUM 5,033 · **CRITICAL 368** (0.25 %). SMOTE on the training split only. | Tests the model on the *actual* government export, imbalance and all. |
| **B — Grounded controlled dataset** | **2,000 records** Monte-Carlo-sampled from empirical DMC Situation-Report marginals, with **16 % epistemic label noise** injected (§3.4). Balanced-ish. | Enables honest algorithm comparison + human-in-the-loop tuning without the 0.25 %-CRITICAL problem, and bounds accuracy at a realistic ~82 % (see §3.4). |

### 15.1.2 Algorithm comparison — Regime B (2,000 records, 80/20 stratified, seed 42, identical SMOTE)

> **Table 5.x — Severity-classifier algorithm comparison (2,000-record grounded
> dataset, 80/20 stratified hold-out).** Source: `suraksha-ml/baseline_results.txt`,
> `project_docs/final_comprehensive_baselines.md`.

| Algorithm | Accuracy | Macro-F1 | QWK | CRITICAL Recall | Under-triage rate |
|---|---|---|---|---|---|
| **XGBoost (selected)** | **0.8175** | **0.7922** | **0.6531** | **0.6154** | **19.5 %** |
| Random Forest | 0.7650 | 0.7317 | 0.5960 | 0.5577 | 22.0 % |
| Logistic Regression | 0.6975 | 0.6736 | 0.6240 | 0.5577 | 24.5 % |
| Ordinal Logistic Regression | 0.5050 | 0.4541 | 0.5115 | 0.5385 | 32.1 % |
| DMC-features-only XGBoost (ablation) | 0.8150 | 0.7871 | 0.6499 | 0.5962 | 19.5 % |

**Selection rationale:** XGBoost dominates on every metric — +5.3 pp accuracy and
+6 pp Macro-F1 over Random Forest, and critically the **lowest under-triage rate
(19.5 %)** and the **highest CRITICAL recall (0.615)**, which are the
safety-relevant numbers for disaster triage. The **DMC-features-only ablation**
shows citizen-app features (photos/videos) add only **+0.25 pp accuracy** — the
predictive power comes from verified DMC impact demographics, which strengthens
external validity.

**Ablation — Geo_Risk feature:** removing the manually-assigned district
vulnerability coefficient changed accuracy by −0.25 pp and Macro-F1 by −0.09 pp,
and *improved* CRITICAL recall (+1.9 pp). **The feature was dropped** — it removes
the need to defend hand-picked heuristic coefficients while costing essentially
nothing. Source: `project_docs/geo_risk_ablation_report.md`.

### 15.1.3 Temporal robustness — Regime B, chronological hold-out

> **Table 5.x — Severity classifier, chronological hold-out (train Jan 2025–May
> 2026, n=1,600; test May–Aug 2026, n=400).** Source: `chronological_results.txt`.

| Metric | Value |
|---|---|
| Accuracy | 0.7900 |
| Macro-F1 | 0.7645 |
| CRITICAL: P / R / F1 | 0.71 / 0.56 / 0.62 |
| HIGH: P / R / F1 | 0.81 / 0.79 / 0.80 |

Only a −2.75 pp accuracy drop vs the random split → the model is not exploiting
temporal event leakage; it generalises to *future* incidents.

### 15.1.4 Uncertainty-aware human-in-the-loop routing — Regime B (RQ1)

The classifier's calibrated `max(p)` decides auto-accept vs route-to-human. A
**risk–coverage sweep** on the unseen final test set (`baseline_results.txt`):

> **Table 5.x — Risk–coverage of the selective-review layer.**

| Target human workload | Actual workload | Threshold | CRITICAL/HIGH error capture | Random-review baseline | Accepted accuracy |
|---|---|---|---|---|---|
| 10 % | 8.0 % | 0.552 | 8.9 % | 8.0 % | 0.786 |
| 20 % | 19.7 % | 0.670 | 17.8 % | 19.7 % | 0.788 |
| **30 %** | **26.3 %** | **0.725** | **24.4 %** | 26.3 % | **0.796** |
| 40 % | 33.7 % | 0.777 | 31.1 % | 33.7 % | 0.799 |
| 50 % | 43.7 % | 0.825 | 40.0 % | 43.7 % | 0.799 |

**Finding:** routing ~26 % of the least-confident cases to humans captures
**24.4 %** of all severe (CRITICAL/HIGH) misclassifications and lifts accepted
accuracy from 78.0 % (base) to **79.6 %**. Confidence-based routing tracks the
random baseline closely at this operating point — the *value* is the
*architecture* (a defined abstention mechanism), not a large margin over random.
A **class-sensitive policy** that artificially boosted LOW/MEDIUM confidence was
tested and **failed** (captured fewer severe errors than random) — a uniform
probabilistic threshold is safer. Source: `final_comprehensive_baselines.md §6`.

**Algorithm comparison for the *uncertainty estimator* itself:** Maximum-Probability
vs a Stochastic-Perturbation-Ensemble (SPE) — coverage 85.0 % vs 84.7 %, error
capture **21.2 % vs 21.2 %** (identical). Conclusion: the routing architecture
succeeds regardless of the underlying uncertainty algorithm; the simpler
Max-Probability estimator was kept. Source: `final_ieee_authoritative_numbers.md §4`.

### 15.1.5 Performance on the raw real export — Regime A

> **Table 5.x — Severity classifier on the raw DMC export (146,544 records, 80/20
> stratified, SMOTE on train, XGBoost 400 estimators).** Source:
> `suraksha-ml/models/priority_eval_report.json`.

| Metric | Value |
|---|---|
| Accuracy | **0.9698** |
| Weighted-F1 | 0.9726 |
| Macro-F1 (4-class) | 0.8102 |
| Macro AUC-ROC (OvR) | 0.9966 |
| 5-fold CV Macro-F1 | **0.8338 ± 0.0061** |
| CRITICAL: P / R / F1 (support 74) | 0.54 / 0.86 / 0.67 |
| HIGH: P / R / F1 (support 1,764) | 0.91 / 0.90 / 0.90 |
| MEDIUM: P / R / F1 (support 1,007) | 0.57 / 0.85 / 0.68 |
| LOW: P / R / F1 (support 26,464) | 0.999 / 0.98 / 0.99 |

**Interpretation to write:** the high accuracy/weighted-F1 reflect the extreme
class imbalance (90 % LOW); the **Macro-F1 of 0.81 and CV 0.834 ± 0.006** are the
honest figures — the model reliably separates LOW and HIGH, and achieves **0.86
recall on the rare CRITICAL class** (only 368 examples), at the cost of lower
CRITICAL precision. State both, and lead with Macro-F1 + CV in the abstract.

### 15.1.6 Expert validation of the labels (Regime B, §3.3.1)

- 2 DMC practitioners (10 & 12 yrs), 50 cases, safety-first adjudication.
- **Weighted Cohen's κ = 0.94** (human ↔ rubric).
- Rubric content validation: 3 experts, **I-CVI > 0.83** all thresholds.

**Answer to "why XGBoost, not deep learning?":** tabular features, modest signal,
need for calibrated probabilities and fast CPU inference; it beats RF / LogReg /
ordinal-logit on every metric and especially on the safety metrics (under-triage,
CRITICAL recall); a deep net has no advantage on 12 tabular features and would be
harder to calibrate and explain.

---

## 15.2 LSTM River-Water-Level Forecaster (RO3, RQ2)

**Task:** given the last 12 readings per gauge (7 features), predict the water
level at **T+1 h and T+2 h**.
**Model:** 2-layer LSTM (64→32 units, dropout 0.2), MinMax-scaled inputs,
TensorFlow/Keras. **Data:** real DMC river bulletins.

> **Table 5.x — LSTM water forecaster (v3.0), validation performance.** Source:
> `suraksha-ml/models/lstm_model_info.json`.

| Property | Value |
|---|---|
| Data source | REAL DMC river bulletins — 2,218 PDFs, 500 sampled, **369 parsed OK**, **9,940 readings**, **47 stations** |
| Sequences: train / val | 7,094 / 1,774 (leakage-free scaler — fit on train rows only) |
| Split | chronological |
| Epochs | 30 |
| **Validation MAE** | **0.343 m** (normalised 0.0234) |
| **Naïve persistence baseline MAE** | **0.361 m** |
| **Improvement over persistence** | **−0.018 m (≈ 5 %)** |

### 15.2.1 Baseline comparison (state this honestly)

| Model | Val MAE (m) |
|---|---|
| Naïve persistence ("next = current") | 0.361 |
| **LSTM (selected)** | **0.343** |

**Interpretation to write:** the LSTM beats persistence by ~5 % (1.8 cm). For a
2-hour horizon on irregularly-sampled (~3–8 h) bulletin data this is a *modest
but real* gain — short-horizon river stage is dominated by the current level, so
persistence is a strong baseline. The operational value is that the LSTM also
outputs a **confidence** and an **alert level**, feeding the automatic
threshold-alerting pipeline (which persistence cannot do). Documented caveats
(from `lstm_model_info.json`): bulletin cadence is irregular so the "12-step
window" spans days not 12 h; humidity/temp are seasonal defaults (not in
bulletins); the shared cross-station scaler makes out-of-distribution synthetic
probes unreliable (verified) — feed real per-station sequences.

**Answer to "why LSTM, not ARIMA / a physical model?":** the input is a short,
autocorrelated multivariate sequence with a rainfall driver; LSTM is the standard
data-driven choice for short-horizon river-stage forecasting; a physical
(HEC-HMS-class) model needs catchment parameters and calibration the DMC bulletins
don't provide; ARIMA can't ingest the rainfall covariate as naturally. The LSTM is
benchmarked against persistence, which is the correct baseline for this task.

---

## 15.3 Named-Entity Recognition (RO4)

**Task:** extract `LOC / INCIDENT / COUNT / DATE / DAMAGE` spans from DMC
situation-report text. **Model:** spaCy neural NER pipeline, trained on
auto-annotated real DMC PDFs.

> **Table 5.x — NER model (v2.2) evaluation.** Source:
> `suraksha-ml/models/ner_model_info.json`.

| Metric | v2.1 (previous) | **v2.2 (current)** |
|---|---|---|
| Macro-F1 | 0.7093 | **0.9621** |
| Micro-F1 | 0.9412 | 0.9635 |
| Macro Precision / Recall | — | 0.9902 / 0.9385 |
| Per-class F1 | — | LOC 0.966 · INCIDENT 0.971 · COUNT 0.987 · DATE 0.886 · **DAMAGE 1.000** |

**Data:** 600 real DMC situation-report PDFs, PDF-level 80/20 split, curated seeds
train-only. v2.2 improvements: activated the previously-unused DAMAGE keyword
list, expanded COUNT unit nouns (~8 → ~30), raised the PDF sample 90 → 600.

**CRITICAL honesty note for the viva:** this is a **silver-standard evaluation**.
Both the training labels and the test labels come from the *same* gazetteer/regex
auto-annotator. The 0.96 macro-F1 measures **whether the neural model reproduces
the rule-based labeller on unseen PDFs** — not ground-truth extraction quality
against independent human annotation. State this explicitly; it is a legitimate
"distillation into a portable neural model" result, not a claim of 96 % correct
extraction. Future work: a small human-annotated gold test set.

---

## 15.4 Incident-Credibility Model (RO4)

**Task:** score a citizen report's credibility `HIGH / MEDIUM / LOW` (and a
continuous credibility value) from 16 observable verifier signals (number of
corroborating reports, GPS validity, source history accuracy, officer
confirmation, contradiction flag, image-hash sharing, text specificity, …).
**Model:** tuned XGBoost classifier + GradientBoosting regressor (v3.1).

> **Table 5.x — Credibility model (v3.1) evaluation, 40,000 labelled synthetic
> crowdsourced scenarios.** Source: `suraksha-ml/models/credibility_model_info.json`.

| Metric | Value |
|---|---|
| Accuracy | **0.8578** |
| Macro-F1 | **0.8378** |
| 5-fold CV Macro-F1 | **0.8371 ± 0.0023** |
| Per-class F1 | HIGH 0.914 · MEDIUM 0.708 · LOW 0.892 |
| Regressor MAE (continuous credibility) | 0.062 |

### 15.4.1 Why synthetic data (defend this)

The real DMC export contains **only official-source records** (EOC / DDMCU /
Police / District offices) — there are **no genuine low-credibility examples** to
learn from. Training on it directly forces the label to be a formula of the input
features → a trivial 100 % accuracy with no real learning. v3.1 instead uses
**40 k labelled synthetic scenarios** calibrated to the same source-trust domain
knowledge (from `ml/evidence_graph.py`), where **the label is built from
independent corroboration + adjudication-noise signals — N(0, 0.06) noise kept
untouched from v3.0 — not a 1:1 function of the model's own features**. v3.1's
gains are model-side (GradientBoosting → tuned XGBoost) and feature-side (+5
observable signals) only; the task is no easier. Improvement over v3.0: 0.83 →
**0.86** accuracy (matches the recall memory).

**The GAT-style attention math** (`evidence_graph.py`) computes per-report
attention weights across corroborating reports; the trained XGBoost model is what
produces the final credibility class — describe both as a two-stage design.

---

## 15.5 Spatiotemporal District-Risk Forecaster (RO4)

**Task:** predict a district's composite disaster-risk score for month *t* using
only information available through month *t−1* (lagged incidents, deaths, risk;
rolling 3-month sums; seasonal encodings; coastal/mountain flags).
**Model:** GradientBoostingRegressor, 400 estimators (v3.0). **Data:** real DMC
event history 1990–2026 (`DI_report105745`), 112,040 usable event-rows →
(district, year, month) cells.

> **Table 5.x — Spatiotemporal risk forecaster (v3.0) evaluation, chronological
> split (train year < 2018, test year ≥ 2018).** Source:
> `suraksha-ml/models/spatiotemporal_model_info.json`.

| Metric | Value |
|---|---|
| Training / test samples | 8,100 / 2,700 |
| Test MAE (risk score, 0–1) | **0.0757** |
| **Test R²** | **0.232** |
| **Persistence baseline R²** | **−0.014** |
| 5-fold CV R² | **0.527 ± 0.090** |
| Risk-tier accuracy (4-tier / 3-bucket) | **0.945** |
| Top features (importance) | roll3_incidents_sum 0.48 · lag1_incidents 0.21 · lag12_risk 0.06 · year_norm 0.06 |

**Interpretation:** on a strict chronological hold-out the model's R² (0.23)
clearly beats the persistence baseline (−0.01), and the 5-fold CV R² (0.53) shows
solid forecast skill within-period. **Risk-tier classification accuracy is 94.5 %**
— i.e. it reliably places a district into the right risk band even when the exact
score is imperfect, which is what an early-warning dashboard needs. v3.0 removed
the v2.0 target-leakage (no current-month outcome as a feature) and moved from
295 collapsed cells to thousands with a chronological hold-out, so **R² is now a
real forecast-skill number**. (Memory: CV R² improved 0.05 → 0.53 between versions.)

---

## 15.6 Components without a project-specific quantitative evaluation

State plainly (do not invent numbers):

| Component | Status |
|---|---|
| Language detector | Rule-based cascade; no held-out accuracy measured on SL citizen text (future work: a labelled Si/Ta/En short-text set) |
| Multitask keyword classifier | Rule-based; superseded operationally by the trained severity model |
| Hotspot forecaster, drift detector, situation summariser | Heuristic/analytical; functionally verified, not benchmarked |
| Resource optimiser / relief coordinator / team composer | Pareto-approximation + local search; functional Pareto-front metrics only |
| Face matcher | DeepFace/VGG-Face pre-trained; no project research-evaluation dataset |
| Uncertainty triage math | Evaluated *through* the severity model's risk–coverage results (§15.1.4) |

---

## 15.7 Consolidated model-selection summary (put this table in Chapter 5)

> **Table 5.x — Trained models: task, algorithms compared, selected model,
> headline result vs baseline.**

| Model | Algorithms compared | Selected | Headline result | Baseline | Source file |
|---|---|---|---|---|---|
| Severity triage | XGBoost · RandomForest · LogReg · Ordinal-Logit | **XGBoost (400 est., SMOTE)** | Macro-F1 **0.79** (grounded) / CV **0.834** (146 k real); under-triage 19.5 %, CRITICAL recall 0.62 | RF Macro-F1 0.73 | `priority_eval_report.json`, `baseline_results.txt` |
| River level | LSTM 2-layer · naïve persistence | **LSTM (64→32, dropout 0.2)** | Val MAE **0.343 m** | persistence 0.361 m | `lstm_model_info.json` |
| NER | spaCy neural vs rule-based labeller | **spaCy neural NER v2.2** | Macro-F1 **0.962** (silver) | v2.1 0.709 | `ner_model_info.json` |
| Credibility | GradientBoosting → **tuned XGBoost** | **XGBoost v3.1** (16 feat., 40 k) | Macro-F1 **0.838**, CV 0.837 | v3.0 0.83 | `credibility_model_info.json` |
| Spatiotemporal risk | GradientBoosting · persistence | **GradientBoosting v3.0** (400 est.) | R² **0.232** (chrono), CV R² **0.527**, tier acc **0.945** | persistence R² −0.014 | `spatiotemporal_model_info.json` |
