# 14 — ML Microservice: Component Inventory (Chapter 4 source)

**Location:** `d:\Suraksha - Web App\suraksha-ml`. **Stack:** Python 3 · FastAPI ·
scikit-learn · XGBoost · TensorFlow/Keras · spaCy · NumPy.
**Entry point:** `main.py` (22 REST endpoints). Started with `uvicorn main:app`.
**Consumed by:** the Node backend over HTTP (`ML_SERVICE_URL`, default
`http://localhost:8000`). If the ML service is down, the backend returns HTTP 503
for AI-only endpoints and serves the last cached forecast for water predictions.

## 14.1 Package layout

```
suraksha-ml/
├── main.py                  22 FastAPI endpoints
├── nlp/
│   ├── language_detector.py   Unicode-script → word-list → langdetect/langid cascade
│   ├── ner_extractor.py       spaCy neural NER (trained) + regex/gazetteer fallback
│   └── translator.py          Si/Ta → En translation (library call)
├── ml/
│   ├── feature_builder.py       12-dim feature vector for the severity model
│   ├── train_classifier.py      severity XGBoost training
│   ├── uncertainty_triage.py    temperature scaling + MC-dropout-style + conformal + abstention
│   ├── lstm_water_predictor.py  2-layer LSTM river-level forecaster (trained)
│   ├── evidence_graph.py        incident-credibility model (GAT-style attention + trained XGB v3.1)
│   ├── spatiotemporal_forecaster.py  district monthly-risk forecaster (trained GB v3.0)
│   ├── hotspot_forecaster.py    incident-density + decay + night multiplier (rule-based)
│   ├── resource_optimizer.py    Pareto / 2-opt relief allocation (NSGA-II-style)
│   ├── relief_coordinator.py    multi-objective relief routing
│   ├── team_composer.py         volunteer skill + proximity optimiser
│   ├── situation_summarizer.py  template + aggregation natural-language brief
│   ├── drift_detector.py        KL-divergence + novel-term detection
│   ├── active_learner.py        acquisition-score ranking (U+D+R+L+E)
│   ├── damage_scorer.py         structural/asset damage → cost estimate
│   ├── face_matcher.py          DeepFace / VGG-Face verify (pre-trained library)
│   ├── multitask_classifier.py  TF-IDF keyword scoring (rule-based)
│   ├── multimodal_fusion.py     confidence-weighted text+image+geo+time fusion
│   └── image_encoder.py         CLIP-style image embedding (pre-trained)
├── training/                  training pipelines
└── models/                    saved weights + *_info.json metadata
```

## 14.2 Endpoints (22)

| Endpoint | Purpose | Backend caller |
|---|---|---|
| `POST /process-report` | Full intake: language → translate → NER → severity | `/api/incidents` create |
| `POST /analyze-report` | Combined multitask + uncertainty analysis | `/api/ai/analyze-report` |
| `POST /score-damage` | Damage → cost/severity estimate | `/api/assessments/damage` |
| `POST /check-duplicate` | Text-similarity duplicate check | duplicate detection |
| `POST /verify-incident` | Credibility / evidence-graph score | `/api/ai/verify-incident/:id` |
| `POST /predict-water-level` | LSTM T+1h / T+2h gauge forecast | `water-predictor` |
| `GET /water-model-status` | Model load status | `/api/water/ml-status` |
| `GET /health` | Service health | — |
| `POST /clarification-questions` | Suggest follow-up questions for a vague report | `/api/ai/clarification-questions` |
| `POST /hotspot-forecast` / `GET /hotspots` | District incident-risk forecast | `/api/ai/hotspots` |
| `POST /optimize-allocation` | Resource allocation across districts | `/api/ai/optimize-resources` |
| `POST /compose-team` | Volunteer team composition | `/api/ai/compose-team` |
| `POST /situation-summary` | Natural-language situation brief | `/api/ai/situation-summary` |
| `POST /detect-drift` / `GET /drift-status` | Concept-drift report | `/api/ai/drift-status` |
| `POST /match-face` | Missing-person face match | `/api/missing-persons/search-face` |
| `POST /forecast/district-risk`, `/forecast/multi-district`, `GET /forecast/bias-profile/{district}` | Spatiotemporal risk forecasting | `/api/ai/bias-risk-forecast` |
| `POST /active-learning/query`, `/score`, `/evaluate` | Active-learning sample ranking | `/api/ai/annotation-queue` |
| `POST /relief/coordinate` | Multi-objective relief coordination | `/api/ai/relief-coordination` |

## 14.3 Honest component classification (state this in the report)

Of **16 ML/AI components**, the training/model status is:

| Category | Components | Notes |
|---|---|---|
| **Genuinely trained saved models (5)** | (1) Severity XGBoost `priority_classifier.pkl` · (2) LSTM water `lstm_water_model.keras` · (3) NER `en_pipeline` spaCy model · (4) Credibility XGBoost `credibility_model.pkl` (v3.1) · (5) Spatiotemporal GradientBoosting `spatiotemporal_model.pkl` (v3.0) | Each has a `*_info.json` with metrics — see `15-ml-evaluation.md` |
| **Pre-trained library models (2)** | Face matching (DeepFace / VGG-Face weights) · Image encoder (CLIP-style) | No project-specific training/eval; used as-is |
| **Analytically implemented — not trained (6)** | Uncertainty triage (temperature scaling + Gaussian-noise MC + conformal + abstention math) · Evidence-graph attention math · Resource optimiser (Pareto + 2-opt) · Relief coordinator · Team composer · Multimodal fusion | Correct algorithms, computed at request time, no learned weights beyond the trained models they wrap |
| **Rule-based / heuristic (3)** | Language detector (script + word-list cascade) · Multitask classifier (weighted TF-IDF keyword scoring) · Hotspot forecaster (density + exponential decay + night multiplier + burst detection) · Drift detector (KL divergence + novel-term spotting) · Situation summariser (aggregation + templates) | |

> **Why this matters for the viva.** Examiners will ask "how many models did you
> actually train?" — the answer is **five**, on real (or grounded) DMC data, each
> compared to a baseline. The rest are engineering: correct algorithms wired into
> the pipeline. Present the inventory table above openly; it is a strength, not a
> weakness, because the five that are trained are the ones the research questions
> depend on (RQ1 severity, RQ2 water).

## 14.4 The trilingual intake pipeline (`/process-report`)

```
raw citizen text
  → detect_language()      Unicode-script check → Sinhala/Tamil/English word list → langdetect/langid
  → translate_to_english() if not English  (library NMT)
  → extract_entities()     spaCy NER model → {LOC, INCIDENT, COUNT, DATE, DAMAGE}
  → build_feature_vector() affected population, hazard type, has_children/elderly/disabled, ...
  → XGBoost.predict_proba() → severity + calibrated confidence
  → return { severity, confidence, detected_language, translated_text, entities }
```
Everything downstream (dashboard, alerting, duplicate detection) then operates on
the normalised English text + structured entities regardless of the input
language — this is the mechanism that removes the "read three languages under
pressure" burden from DMC officers.

## 14.5 Serving & resilience

- `uvicorn` single worker; TF inference is synchronous. Under load the Node
  backend used to fan out one HTTP call per gauge — fixed by the
  `WaterLevelPrediction` cache (see `11 §11.9`, `16 §1`).
- Models load lazily at FastAPI `startup`; `GET /water-model-status` reports load
  state; if a model file is missing the component falls back to a documented
  rule-based path (e.g. threshold logic instead of the LSTM).
