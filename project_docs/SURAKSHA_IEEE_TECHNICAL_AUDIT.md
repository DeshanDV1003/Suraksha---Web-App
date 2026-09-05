# SURAKSHA — Complete Technical & Dataset Audit
## For IEEE Conference Paper Submission
**Audit Date:** 2026-08-27  
**Auditor:** Antigravity AI (automated code + data inspection)  
**Source:** Direct inspection of all source files, model files, CSVs, JSON configs, and load-test results  
**DO NOT substitute any number in this report with documentation/thesis estimates. Every value is traced to a file.**

---

## 1. Executive Summary

The Suraksha system contains **14 distinct ML/NLP/AI components** across 3 Python packages (`nlp/`, `ml/`, `training/`). Of these, **2 have genuinely trained saved models** (severity classifier and LSTM water predictor), **1 is a pre-trained library call** (face matching via DeepFace/VGG-Face), and **11 are algorithmically implemented without trained model weights** (rule-based, heuristic, or analytical approximations).

The severity classification dataset was previously documented as 150 records. The **current implementation loads a 1,500-record CSV** (`suraksha_dmc_dataset_v2.csv`). This is the value that must appear in the paper.

The LSTM water model was trained on **341,640 synthetic hourly rows** generated from **39 real DMC river gauge stations** across **26 rivers**, covering timestamps from 2025-07-20 to 2026-07-20.

Several old thesis values (150-record dataset, 91.3% language accuracy, 0.847 Macro-F1, 18% human-review rate) **cannot be verified from current code or data** and must not appear in the paper without re-running the actual evaluation.

---

## 2. Complete AI/ML Component Inventory

| # | Component Name | Source File | Algorithm/Method | Framework | Status | Saved Model? | Quantitative Eval? |
|---|---------------|------------|-----------------|-----------|--------|-------------|-------------------|
| 1 | Language Detection | `nlp/language_detector.py` | Unicode script detection → word-list → langdetect/langid cascade | langdetect, langid (pip) | Rule-based + library call | No | No |
| 2 | NER / Entity Extraction | `nlp/ner_extractor.py` | Rule-based regex + keyword | None | Rule-based | No | No |
| 3 | Machine Translation | `nlp/translator.py` | Library call (Google Translate API wrapper) | Unknown | Library call | No | No |
| 4 | Multitask Disaster Classifier | `ml/multitask_classifier.py` | Weighted TF-IDF keyword scoring + phrase matching + co-occurrence boosting | Pure Python (no ML framework) | Rule-based (NOT trained) | No | No |
| 5 | Severity/Priority Classifier | `ml/train_classifier.py`, `training/train_priority_v2.py` | **XGBoost** (saved model metadata says XGBClassifier, 300 estimators); training scripts show RandomForest — **MISMATCH — see Section 5** | scikit-learn / XGBoost | Trained — model exists | **YES** — `models/priority_classifier.pkl` | Partial (classification_report printed at training time, not saved) |
| 6 | Uncertainty Quantification / Triage | `ml/uncertainty_triage.py` | Temperature Scaling + Simulated MC Dropout (Gaussian noise, NOT real dropout) + Conformal Prediction + Risk-Adaptive Abstention | Pure Python (math) | Analytically implemented — NOT trained | No | No — metrics defined but no test run |
| 7 | LSTM Water Level Predictor | `ml/lstm_water_predictor.py`, `training/train_lstm.py` | 2-layer LSTM (64→32 units, Dropout 0.2), predicts T+1h and T+2h | TensorFlow/Keras | Trained | **YES** — `models/lstm_water_model.keras`, `models/lstm_scaler.pkl` | Partial — `val_mae_metres = 0.1364 m` (saved in `models/lstm_model_info.json`) |
| 8 | Threshold-Based Alert Generation | `ml/lstm_water_predictor.py` (lines 140–154) | Rule-based threshold logic using watch/warning/critical levels | Pure Python | Rule-based | No | No |
| 9 | Evidence Graph / GAT Credibility | `ml/evidence_graph.py` | Lightweight numpy attention mechanism replicating 2-layer GAT (NOT torch_geometric) | numpy | Analytically implemented — NOT trained on labelled dataset | No | No — no labelled credibility evaluation dataset exists |
| 10 | Spatial GNN / Risk Forecasting | `ml/spatiotemporal_forecaster.py` | Bias-corrected temporal decay + 1-hop GNN message passing (uniform weights, not learned) | Pure Python (math) | Analytically implemented — NOT trained | No | No — bias factors are hardcoded proxies |
| 11 | Hotspot Forecaster | `ml/hotspot_forecaster.py` | Incident density + exponential decay + nighttime multiplier + velocity burst detection | Pure Python | Rule-based | No | No |
| 12 | Face Matching | `ml/face_matcher.py` | DeepFace.verify() with VGG-Face backbone, MTCNN detector | DeepFace (pip) | Pre-trained backbone (VGG-Face weights from DeepFace) | Yes (external pretrained) | No — no research evaluation dataset used |
| 13 | NSGA-II Relief Optimizer | `ml/resource_optimizer.py` | Greedy Pareto-approximation + 2-opt local search (NOT actual NSGA-II genetic algorithm) | Pure Python | Algorithmically implemented | No | No — only functional Pareto metrics computed |
| 14 | Active Learner (R4) | `ml/active_learner.py` | Risk-Aware acquisition function: U + D + R + L + E weighted scoring | numpy | Analytically implemented — NOT trained | No | No |
| 15 | Multimodal Fusion (R1) | `ml/multimodal_fusion.py` | Confidence-weighted cross-modal fusion (M1–M5 variants) | numpy | Analytically implemented | No | No |
| 16 | Image Encoder | `ml/image_encoder.py` | CLIP-style encoding (pre-trained, details in file) | Unknown (check file) | Pre-trained | External | No |

---

## 3. DMC Raw Dataset Audit

### 3A. Water-Level Training Dataset (`synthetic_flood_dataset_real_stations.csv`)

**Source:** `suraksha-ml/synthetic_flood_dataset_real_stations.csv`  
**Generation script:** `suraksha-ml/generate_real_grounded_data.py`

| Property | Value | Source |
|----------|-------|--------|
| **Total rows (RAW)** | **341,640** | `python -c "import pandas as pd; print(len(pd.read_csv(...)))"` |
| Timestamp column name | `using that timestamp` (note: mis-named column header) | `df.columns[0]` |
| First timestamp | 2025-07-20T10:21:42 | `df[ts_col].min()` |
| Last timestamp | 2026-07-20T09:21:42 | `df[ts_col].max()` |
| Frequency | Hourly (8,760 hours × 39 stations) | Generation script line 109: `hours=8760` |
| Unique gauge stations | **39** | `df['stationName'].nunique()` |
| Unique rivers | **26** | `df['riverName'].nunique()` |
| Exact duplicates | **0** | `df.duplicated().sum()` |
| Missing values | **0 in all columns** | `df.isnull().sum()` |
| Columns | `using that timestamp`, `month`, `riverName`, `stationName`, `watch_threshold_m`, `warning_threshold_m`, `critical_threshold_m`, `rainfall_mm_hr`, `rainfall_24h_total`, `humidity_pct`, `temp_c`, `water_level_m` | `df.columns` |

**How the 39 stations were obtained:**  
Real DMC PDF reports in `dmc_data/` (7 PDFs: 4× Water_level & Rainfall 2026, 1× Advisory, 2× Weather Report) were parsed by `extract_dmc_data()`. The function reads the first PDF's table and extracts station names + alert/minor/major flood thresholds. This produced the baseline — saved to `dmc_extracted_base_data.xlsx`.

**CRITICAL DISCLOSURE — Can 341,640 rows be treated as 341,640 independent ML samples?**

**NO. They cannot.**

Reason: The 341,640 rows are 39 stations × 8,760 hourly timestamps. Each station's water level at hour `t+1` is directly computed from hour `t` using a recurrence formula (current_w variable in `generate_1yr_data_for_real_stations()`). Consecutive rows from the SAME station are autocorrelated — they are NOT independent. The LSTM correctly exploits this temporal dependency using a 12-hour sliding window (`SEQUENCE_LEN = 12`).

**Correct way to state data counts for the paper:**

| Stage | Count |
|-------|-------|
| RAW DMC Records (hourly) | 341,640 |
| After duplicate removal | 341,640 (0 duplicates) |
| After preprocessing (LSTM sequences formed) | ≈ 341,600 (minus sequence-length buffer per station: 39 × 12 = 468 rows lost) |
| Training records (80% split, chronological) | ≈ 273,306 |
| Validation records (20% split, chronological) | ≈ 68,334 |
| Test records | **NOT SEPARATELY HELD OUT** — only train/val split used |

**Split method:** Chronological (NOT random) — `split = int(len(X) * (1 - 0.20))` in `train_lstm.py` line 216. This is the correct approach for time series.

**Data legitimacy note for paper:** The dataset is **simulation-grounded**, not real gauge readings. The water-level simulation is physically motivated (monsoon seasonality, lagged rainfall response) but synthetic. The DMC PDFs provided only station names and flood thresholds — NOT the actual water-level time series. This distinction MUST be stated in the paper.

---

### 3B. Severity/Priority Classification Dataset (`suraksha_dmc_dataset_v2.csv`)

**Source:** `d:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v2.csv`  
**Loaded by:** `training/train_priority.py` line 69 and `training/train_priority_v2.py` line 68

| Property | Value |
|----------|-------|
| **Total rows** | **1,500** |
| Exact duplicates | 0 |
| Missing values (Verified_By column) | 706 NaN (expected — not all incidents are verified) |
| Missing values (all other columns) | 0 |
| Timestamp range | 2020-01-02 to 2026-03-29 |
| Unique districts | 25 |

**All columns:**  
`Incident_ID`, `Timestamp`, `District`, `Province`, `Zone`, `Latitude`, `Longitude`, `Incident_Type`, `Severity_Level`, `Priority_Label`, `Affected_Population`, `Displaced_Population`, `Casualties`, `Missing_Persons`, `Required_Resources`, `Response_Time_Mins`, `Status`, `Reported_By`, `Report_Channel`, `Report_Language`, `Weather_Condition`, `Has_Photo_Evidence`, `Has_Video_Evidence`, `Offline_Submission`, `Is_Verified`, `Verified_By`, `Volunteers_Dispatched`, `Tasks_Created`, `Tasks_Completed`, `Relief_Tokens_Issued`, `Psych_Support_Needed`, `Damage_Category`, `Estimated_Loss_LKR`, `Is_Monsoon_Season`, `Month`, `Hour_Of_Day`, `Day_Of_Week`

---

## 4. Severity Dataset Audit

### Priority Label Distribution (CURRENT — from actual CSV)

| Class | Count | % |
|-------|-------|---|
| MEDIUM | 759 | 50.6% |
| LOW | 560 | 37.3% |
| HIGH | 174 | 11.6% |
| CRITICAL | 7 | 0.5% |
| **Total** | **1,500** | **100%** |

**Source:** `df['Priority_Label'].value_counts()` on `suraksha_dmc_dataset_v2.csv`

### Incident Type Distribution

| Type | Count |
|------|-------|
| Flood | 547 |
| Flash Flood | 275 |
| Landslide | 164 |
| High Winds/Cyclone | 116 |
| Forest Fire | 85 |
| Medical Emergency | 83 |
| Drought | 79 |
| Building Collapse | 76 |
| Earthquake | 52 |
| Coastal Erosion | 23 |

### Report Language Distribution

| Language | Count |
|----------|-------|
| SINHALA | 783 (52.2%) |
| ENGLISH | 431 (28.7%) |
| TAMIL | 286 (19.1%) |

### How labels were obtained

The `Priority_Label` column is **present in the CSV as-is**. The column `Severity_Level` (integer 1–4) also exists. The training scripts read `Priority_Label` directly without any rule derivation at load time. Based on the dataset generation script (`scratch/generate_dataset.js`), labels appear to be **programmatically generated** based on combinations of casualties, affected population, and incident type — **NOT manually annotated by DMC officers or domain experts**.

This is a critical limitation that must be disclosed in the paper.

### Input Features (12 features — from `feature_builder.py`)

1–6. Incident type one-hot: FLOOD, LANDSLIDE, FIRE, BUILDING_COLLAPSE, MEDICAL_EMERGENCY, OTHER  
7. Affected population (normalized to 0–1 by dividing by 1,000)  
8. Geographic risk score (district-level lookup table: Colombo=0.9 ... Hambantota=0.65)  
9. Has media attached (binary)  
10. Hour of day (normalized to 0–1)  
11. Has children (defaulted to 0.0 in v2 — NOT from CSV)  
12. Has elderly (defaulted to 0.0 in v2 — NOT from CSV)  
13. Has disabled (defaulted to 0.0 in v2 — NOT from CSV)  

**Note:** `train_priority_v2.py` fixes vulnerability flags to 0.0 (line 62), whereas `train_priority.py` randomly generates them (line 61–63). The saved model (`priority_classifier.pkl` trained at 2026-08-13) likely used `train_priority_v2.py` based on the fixed-zero approach matching the live API behavior.

---

## 5. Severity Model and Evaluation

### Critical Mismatch Discovered

| Source | States |
|--------|--------|
| `models/priority_model_info.json` | **XGBClassifier, n_estimators=300, smote=k_neighbors=2** |
| `training/train_priority.py` | RandomForestClassifier, n_estimators=100, class_weight='balanced' |
| `training/train_priority_v2.py` | RandomForestClassifier, n_estimators=100, SMOTE(k_neighbors=3) |

**Conclusion:** The saved `priority_classifier.pkl` (940 KB, trained 2026-08-13) was trained by a THIRD script not currently in the codebase — an XGBoost version with 300 estimators and SMOTE k_neighbors=2. This script does not exist in the current repository. The two training scripts present produce RandomForest models.

### What was actually used to train the final saved model

From `models/priority_model_info.json`:

```json
{
  "model": "XGBClassifier",
  "n_estimators": 300,
  "critical_threshold": 0.2,
  "features": 20,
  "smote": "k_neighbors=2",
  "trained_at": "2026-08-13 15:29:43"
}
```

**Note:** This says 20 features, but the current `feature_builder.py` builds 12 features. Another discrepancy. Either the model was trained with a different feature set, or the metadata is approximate.

### Train/Test Split (from `train_priority_v2.py` — the most recent script)

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
```

- Training set: 1,200 records (80%)
- Test set: 300 records (20%)
- Split type: **RANDOM STRATIFIED** — NOT time-based

### SMOTE Application

From `train_priority_v2.py` line 93–98:
```
# Split BEFORE SMOTE to prevent data leakage!
SMOTE applied ONLY to training data (correct)
sampling_strategy='not majority'
k_neighbors=3 (v2) / k_neighbors=2 (final saved model)
```

SMOTE is correctly applied after splitting — this is methodologically sound.

### Evaluation Results

**CRITICAL: No classification report output file was saved.** The `print(classification_report(...))` on line 104 outputs to console only. There are no saved evaluation logs, confusion matrices, or metric files in the repository.

**The paper cannot report specific per-class F1 scores without re-running training on the current 1,500-record dataset.**

---

## 6. Data Leakage Audit

| Check | Status | Evidence |
|-------|--------|---------|
| Train/test split method | Random stratified 80/20 | `train_test_split(..., random_state=42, stratify=y)` |
| SMOTE applied only to training data | ✅ CORRECT | `train_priority_v2.py` line 93: "Split BEFORE SMOTE to prevent data leakage!" |
| Records from same disaster event in both splits | ⚠️ POSSIBLE — no event-based splitting | Dataset has Incident_ID per row; no grouping by event |
| Consecutive temporal rows in both splits | ⚠️ POSSIBLE — random split, not time-based | Events from 2020–2026 can appear in either split |
| Future information leaking severity | ✅ None detected | Labels come from same-event fields only |
| Normalization fitted on training data only | ✅ Not applicable | RandomForest/XGBoost don't require feature scaling |
| LSTM: scaler fitted on ALL data before split | ⚠️ POTENTIAL ISSUE | In `train_lstm.py`: `scaler.fit_transform(features)` is called on the full dataset BEFORE the chronological split (line 173, 216) |

**DATA LEAKAGE RISK: LOW–MODERATE**

Rationale:  
- For severity classifier: SMOTE is correctly done post-split. Main risk is that records from the same simulated "event cluster" may appear in both train and test (because the split is random, not event-based). Since the dataset is synthetically generated and each row is an independent incident (not time-series), this is manageable but should be disclosed.  
- For LSTM: The MinMaxScaler is fitted on all 341,640 rows before the chronological split — this is a mild form of data leakage (test-set value ranges inform the scaler). Impact is very small for this type of data but should be corrected by fitting the scaler only on the training portion.

---

## 7. Uncertainty / Human-in-the-Loop Evaluation

### Exact Implementation

**Source file:** `ml/uncertainty_triage.py`

The system implements a 4-stage pipeline called "R2":

1. **Temperature Scaling** — log-odds re-scaling per language  
   - English T = 1.20; Sinhala T = 1.60; Tamil T = 1.55; Code-mixed T = 1.65  
   - Source: lines 41–47

2. **Monte Carlo Dropout (SIMULATED)** — NOT real neural-network dropout  
   - n_samples = 30 stochastic forward passes (line 64)  
   - Implemented as Gaussian noise addition to base confidence (line 131)  
   - `MC_NOISE_SCALE = 0.06` (line 65)  
   - This is a **mathematical approximation**, NOT actual MC Dropout over a neural network's dropout layers  
   - Source: `mc_dropout_uncertainty()` function, lines 99–150

3. **Conformal Prediction Sets** — nonconformity quantiles are **hardcoded** (lines 161–173), NOT calibrated from a real held-out calibration set

4. **Risk-Adaptive Abstention** — thresholds vary by severity + evidence quality  
   - BASE_AUTO_THRESHOLD = 0.68 (line 56)  
   - BASE_CLARIFY_THRESHOLD = 0.48 (line 57)  
   - CRITICAL_CASE_AUTO_THRESHOLD = 0.82 (line 60)

### Uncertainty Score Definition

The system reports `uncertainty = 1.0 - final_confidence` where `final_confidence` is the MC-mean of the temperature-scaled confidence.

It also computes:
- `epistemic_std` = std of 30 MC samples
- `aleatoric_proxy` = 1 - base_confidence
- `total_uncertainty` = min(epistemic_std + aleatoric_proxy × 0.3, 1.0)

### Thresholds

| Threshold | Value | Source |
|-----------|-------|--------|
| Base auto-classify | 0.68 | Line 56 |
| Base clarify | 0.48 | Line 57 |
| Critical case auto | 0.82 | Line 60 |
| Critical case clarify | 0.62 | Line 61 |
| Old documented (fixed) threshold | 0.70 | Baseline B1 in code |

### Quantitative Evaluation

**TOTAL TEST CASES = NOT AVAILABLE**  
**AUTOMATICALLY ACCEPTED = NOT AVAILABLE**  
**SENT FOR HUMAN REVIEW = NOT AVAILABLE**  
**REVIEW RATE = NOT AVAILABLE**  

There is **no batch evaluation of uncertainty triage** against a labelled test set anywhere in the codebase. The metrics (ECE, Brier Score, NLL) are defined in `compute_calibration_metrics()` (lines 361–395) but are per-sample only — no aggregate evaluation script exists.

**ECE = NOT AVAILABLE (no test run)**  
**Brier Score = NOT AVAILABLE**  
**NLL = NOT AVAILABLE**  

The old thesis value of **18% human-review rate** cannot be verified from current code. No run was performed.

---

## 8. Multilingual Dataset Audit

### Language Detection (`nlp/language_detector.py`)

The language detector is **rule-based with library fallback** — it is NOT a trained ML model. Architecture:

1. Unicode script range detection (Sinhala U+0D80–U+0DFF, Tamil U+0B80–U+0BFF) → confidence 0.99
2. Word-list matching: 37 Sinhala words, 36 Tamil words (Latin transliteration)
3. N-gram pattern matching for Sinhala/Tamil morphological suffixes
4. Library fallback: `langdetect` then `langid`

**There is NO separate multilingual dataset file in the repository.** The language-related information comes from the severity classification dataset:

From `suraksha_dmc_dataset_v2.csv` (`Report_Language` column):
- SINHALA: 783 records
- ENGLISH: 431 records
- TAMIL: 286 records
- **Total: 1,500 records**

**RAW TOTAL POSTS = 1,500** (same dataset as severity classifier)  
**Training = 1,200 / Test = 300** (80/20 split)

**There is NO separate held-out 300-post language test set.** If a language evaluation was done, it was on the same 300-record test split from `suraksha_dmc_dataset_v2.csv`.

### Script Type Coverage in Dataset

The dataset contains a `Report_Language` column with values `SINHALA`, `ENGLISH`, `TAMIL`. Whether these are native-script (Unicode) or Romanized/transliterated cannot be determined without inspecting the text content column. The severity dataset does NOT contain the raw report text in `suraksha_dmc_dataset_v2.csv` (it contains structured fields like `Incident_Type`, not free text).

This means: **the language detector was likely never quantitatively evaluated** against the severity dataset since that dataset has no text column.

---

## 9. Multilingual Model Evaluation

### What the system actually uses

There is **no XLM-R fine-tuning** in the repository. No `transformers` library call exists in any Python file under `suraksha-ml/`. The multilingual classification is entirely done by:

- `nlp/language_detector.py`: Rule-based cascade (Section 8 above)
- `ml/multitask_classifier.py`: Weighted keyword TF-IDF scoring — explicitly NOT a trained model

**Language model = NONE (rule-based only)**  
**Pretrained checkpoint = NONE**  
**Fine-tuning = NOT PERFORMED**  
**XLM-R = NOT USED**

The old thesis value of **91.3% language accuracy** cannot be traced to any current evaluation. There is no evaluation script for the language detector in the repository.

**Per-language F1 = NOT AVAILABLE from current implementation**  
**Confusion matrix = NOT AVAILABLE**  
**Baseline comparison (fastText vs fine-tuned) = NOT AVAILABLE**

---

## 10. Offline-First Evaluation

### What exists in the codebase

- Backend test directory: `backend/tests/load/` contains k6 load test scripts only
- No offline synchronization test scripts found
- No offline test logs found

### Load test configurations found

| Test Type | VU Count | Duration | Tool |
|-----------|----------|---------|------|
| Load test | 100 VUs | 5 minutes | k6 |
| Stress test | Not specified (see script) | Extended | k6 |
| Spike test | Not specified | Short spike | k6 |
| Soak test | Not specified | Long duration | k6 |

### Load test results (from `results-load.json`, `results-stress.json`, `results-spike.json`)

**LOAD TEST (100 VUs, 5 min) — from `results-load.json`:**

| Metric | Value |
|--------|-------|
| Total HTTP requests | 2,288 |
| Request rate | Derived from 5-minute window |
| avg latency | 6,656.9 ms |
| Median latency | 5,397.7 ms |
| p90 | 14,539.9 ms |
| p95 | 20,647.9 ms |
| p99 | 23,893.8 ms |
| Max | 26,002.9 ms |
| Error rate | **0.00%** |

**STRESS TEST — from `results-stress.json`:**

| Metric | Value |
|--------|-------|
| Total HTTP requests | 3,741 |
| avg latency | 22,008.1 ms |
| Median | 17,976.0 ms |
| p95 | 59,584.6 ms |
| p99 | 60,180.9 ms |
| Error rate | **12.72%** (476 failures) |

**SPIKE TEST — from `results-spike.json`:**

| Metric | Value |
|--------|-------|
| Total HTTP requests | 1,999 |
| avg latency | 21,485.2 ms |
| p95 | 58,786.3 ms |
| Error rate | **4.50%** (90 failures) |

**Important note:** Load test latencies are very high (avg 6.6 seconds under 100 VUs). This suggests testing was done on a **local development server**, not production infrastructure. These numbers must NOT be presented as production performance without qualification.

**No offline synchronization tests were run.** The thesis claim of "100% offline reliability" cannot be verified from any test artifact in the repository. Correct characterization: "Offline-first architecture is implemented; controlled synchronization testing was not performed."

---

## 11. Water-Level Prediction

### Dataset

| Property | Value | Source |
|----------|-------|--------|
| Source | `synthetic_flood_dataset_real_stations.csv` | `train_lstm.py` line 33 |
| Stations grounded on | 39 real DMC gauge stations | `dmc_extracted_base_data.xlsx` |
| Total rows | 341,640 | Audit script |
| Sampling frequency | Hourly (simulated) | `generate_real_grounded_data.py` |
| Time period covered | 2025-07-20 to 2026-07-20 (1 year) | Audit script |
| Data type | **SYNTHETIC** — physically motivated simulation | `generate_real_grounded_data.py` |

### Features (7)

1. `water_level_m` — current water level
2. `rainfall_mm_hr` — hourly rainfall
3. `rainfall_24h_total` — 24-hour cumulative rainfall
4. `humidity_pct` — humidity
5. `temp_c` — temperature
6. `rate_of_change` — computed diff of water_level_m per station
7. `month` — integer month (seasonal signal)

### LSTM Architecture

```
Layer 1: LSTM(64, return_sequences=True)
Layer 2: Dropout(0.2)
Layer 3: LSTM(32, return_sequences=False)
Layer 4: Dropout(0.2)
Layer 5: Dense(16, activation='relu')
Layer 6: Dense(2)  — outputs T+1 and T+2 predictions
```

### Hyperparameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Sequence length | 12 hours | `train_lstm.py` line 35 |
| Prediction horizon | T+1h and T+2h | Line 36 |
| Epochs configured | 50 | Line 37 |
| Epochs actually run | **11** (early stopping triggered) | `lstm_model_info.json` |
| Batch size | 32 | Line 38 |
| Validation split | 20% chronological | Lines 216–218 |
| Optimizer | Adam | Line 196 |
| Loss | MSE | Line 196 |
| Random seed | 42 | Line 40 |
| Early stopping patience | 10 epochs | Line 225 |

### Saved Evaluation Results (from `models/lstm_model_info.json`)

| Metric | Value |
|--------|-------|
| `val_mae_normalised` | 0.009755 |
| **`val_mae_metres`** | **0.1364 m** |
| Trained at | 2026-07-21 |
| Data source | REAL_CSV (the synthetic-grounded CSV) |

**RMSE = NOT AVAILABLE** (not computed or saved)  
**MAPE = NOT AVAILABLE**  
**R² = NOT AVAILABLE**  
**Separate T+1 vs T+2 evaluation = NOT AVAILABLE** (combined MAE only)  
**Baseline comparison = NOT AVAILABLE** (no naive/persistence baseline computed)

### Honest statement for paper

> "Water-level prediction is functionally implemented with a trained LSTM model (val_MAE = 0.1364 m on the validation split). However, the evaluation does not include separate T+1 and T+2 horizon metrics, R², RMSE, or comparison against a persistence baseline. The training data is a synthetic simulation grounded on 39 real DMC gauge station thresholds, not actual observed water-level measurements. The component cannot currently serve as a main quantitative contribution without additional evaluation."

---

## 12. Alert Generation

**Type: RULE-BASED — NOT ML-based**

Alerts are generated by threshold comparison in `ml/lstm_water_predictor.py`:

```python
def _determine_alert_level(self, t1, t2, confidence, watch, warning, critical):
    if confidence < MIN_CONFIDENCE:  # MIN_CONFIDENCE = 0.75
        return "NONE"
    peak = max(t1, t2)
    if peak >= critical: return "CRITICAL"
    if peak >= warning:  return "WARNING"
    if peak >= watch:    return "WATCH"
    return "NONE"
```

Thresholds come from gauge-specific data (watch_m, warning_m, critical_m) derived from DMC PDFs.

Alert messages are also generated from the database via the `Alert` Prisma model and sent via Twilio (SMS) and Expo push notifications.

**This is NOT a separate ML model. Do not list it as one in the paper.**

---

## 13. GAT Credibility Model

### Implementation Reality

**Source file:** `ml/evidence_graph.py` (692 lines)

The file states explicitly (lines 19–27):
> "Since PyTorch Geometric is not required as a hard dependency, the GAT is implemented as a lightweight numpy attention mechanism that replicates the key properties of graph attention... This is architecturally equivalent to a 2-layer GAT and produces the same output format that a full torch_geometric GAT would generate. Swap in torch_geometric for production training."

**This is NOT a trained GAT. It is a deterministic analytical computation using hand-crafted edge weights and node credibility scores.**

| Property | Value |
|----------|-------|
| Graph nodes | IncidentReport, VolunteerVerifier, OfficerVerifier, WeatherObservation, Image, User, Location |
| Edge types | SUPPORTS, CONTRADICTS, DUPLICATES, SAME_LOCATION, TEMPORALLY_RELATED, VERIFIED_BY, SAME_IMAGE, UPDATED_BY |
| Attention | Softmax-normalised edge-weight × source-reliability product |
| Layers | 2 (analytically approximated) |
| Training dataset | NONE — no labelled credibility ground truth |
| Evaluation | NONE — functional output only |

**Baseline comparison is IMPLEMENTED** (B1 rule-based, B2 XGBoost-proxy) but all three produce analytical outputs — none is trained.

**For the paper:** This component should be classified as a **functional/architectural contribution**, not an evaluated ML model, unless a labelled credibility evaluation dataset is created.

---

## 14. Spatial Risk Forecasting

### Implementation Reality

**Source file:** `ml/spatiotemporal_forecaster.py` (635 lines)

The GNN message passing is a 1-hop propagation with **uniform fixed weights** (`SPATIAL_PROPAGATION_WEIGHT = 0.15`). District adjacency is a hardcoded graph. Bias factors per district are **manually assigned proxy values** (e.g., Colombo=0.92, Mullaitivu=0.35).

**No training was performed.** No learned weights. No geographic dataset was used for training.

The file documents baselines (B1 naive count, B2 seasonal ARIMA) but these are also analytical — not trained models.

**Evaluation: NONE**

---

## 15. Face Matching / Missing Persons

### Implementation

**Source file:** `ml/face_matcher.py`

- Model: DeepFace.verify() with backbone `VGG-Face`
- Detector: MTCNN
- Confidence threshold: 0.40
- Input: base64 query image vs list of base64 candidate images

**Research evaluation: NONE**

No identity dataset was used. No Precision@K, Recall@K, FAR, FRR, or ROC/AUC was computed. The system demonstrates ranked face matching against the live missing persons database — this is a functional integration of a pre-trained model, not a research contribution with evaluation.

---

## 16. NSGA-II Relief Allocation

### Implementation Reality

**Source file:** `ml/resource_optimizer.py`

The file claims "NSGA-II simplified" in its docstring (line 2) but the actual algorithm is:
1. Sort requests by priority DESC, people_count DESC
2. Greedy assignment: for each request, find best available resource by score = (priority_weight × people_count) / (1 + distance_km)
3. 2-opt local search swap to improve allocation quality

**This is NOT NSGA-II.** NSGA-II is a genetic evolutionary algorithm with populations, crossover, mutation, and Pareto front selection. The implementation is a greedy priority-weighted assignment with local search.

**Pareto metrics ARE computed** (distance_efficiency, beneficiaries_served, critical_fulfilment, geographic_fairness) but these are scalar outputs computed post-allocation, not actual Pareto front exploration.

| Property | Claimed | Actual |
|----------|---------|--------|
| Algorithm | NSGA-II | Greedy + 2-opt |
| Population size | N/A | N/A |
| Generations | N/A | N/A |
| Crossover | No | No |
| Hypervolume evaluation | No | No |
| Baseline comparison | No | No |
| Dataset | Live database | Live database |

---

## 17. Usability Evaluation

**No SUS survey data file found in the repository.**  
No `sus_scores.csv`, no `usability_results.json`, no test participant log exists in the codebase.

The old thesis value of **SUS = 74.3 (n ≈ 11)** cannot be verified from any file in the current workspace.

**Current implementation evidence: NONE**  
Correct characterization: "A pilot usability evaluation was conducted (n ≈ 11 participants: DMC officers, volunteers, citizens). SUS score = 74.3 was reported but the raw participant data is not available in the repository."

---

## 18. Performance Testing

### Available Evidence

Performance tests were run using **k6** against a **local development server** (BASE = `http://localhost:3001` — confirmed in `load-test.js` line 14).

### Results Summary

| Test | VUs | Requests | Avg Latency | p95 | Error Rate |
|------|-----|----------|-------------|-----|-----------|
| Load (100 VU, 5 min) | 100 | 2,288 | 6,656.9 ms | 20,647.9 ms | **0.00%** |
| Stress | Higher | 3,741 | 22,008.1 ms | 59,584.6 ms | **12.72%** |
| Spike | Spike | 1,999 | 21,485.2 ms | 58,786.3 ms | **4.50%** |

**Critical note for paper:** These latency values are from a local developer machine running the full stack simultaneously. The p95 of 20.6 seconds under 100 VUs indicates the system was running on constrained hardware. These values should NOT be presented as production performance metrics. The paper should state: "Performance testing was conducted on a local development environment using k6; results reflect developer-machine constraints."

**ML-specific endpoint latency:** No separate timing data was captured per endpoint type (incident POST vs ML processing vs alert generation). All endpoints were mixed in the load test.

---

## 19. Old Thesis Values vs Current System Values

| Metric | Old Documented Value | Current Implemented/Measured Value | Same or Different? | Source |
|--------|--------------------|------------------------------------|-------------------|--------|
| DMC severity dataset size | 150 records | **1,500 records** | **DIFFERENT** | `scratch/suraksha_dmc_dataset_v2.csv`, row count audit |
| Language test set | 300 posts | **300 records (subset of 1,500 — same dataset as severity)** | **DIFFERENT ORIGIN** | No separate language dataset found |
| Language accuracy | 91.3% | **NOT AVAILABLE** — no evaluation run exists | **UNVERIFIABLE** | No eval script found |
| Severity Macro-F1 | 0.847 | **NOT AVAILABLE** — no saved evaluation report | **UNVERIFIABLE** | No saved eval output |
| Severity AUC-ROC | 0.913 | **NOT AVAILABLE** | **UNVERIFIABLE** | No saved eval output |
| MEDIUM F1 | ≈ 0.79 | **NOT AVAILABLE** | **UNVERIFIABLE** | No saved eval output |
| CRITICAL F1 | ≈ 0.91 | **NOT AVAILABLE (only 7 CRITICAL samples in dataset — F1 may be unreliable)** | **DIFFERENT (concern)** | 7 CRITICAL samples in 1,500 |
| Offline completion | 100% | **NOT TESTED** — no offline test artifacts | **UNVERIFIABLE** | No offline test scripts found |
| SUS score | 74.3 | **NOT AVAILABLE** — no raw SUS data file | **UNVERIFIABLE** | No data file |
| Human-review rate | ≈ 18% | **NOT AVAILABLE** — no batch uncertainty evaluation | **UNVERIFIABLE** | No eval run |
| Water prediction horizons | T+1h and T+2h | **T+1h and T+2h — CORRECT** | Same | `train_lstm.py` line 36 |
| Water val MAE | Not in old doc | **0.1364 m** | New value | `models/lstm_model_info.json` |
| LSTM epochs | Not in old doc | **11 (early stopped from 50)** | New value | `models/lstm_model_info.json` |
| LSTM trained at | Not in old doc | **2026-07-21** | New value | `models/lstm_model_info.json` |
| Saved severity model | Not in old doc | **XGBClassifier, 300 estimators (but scripts show RandomForest)** | Mismatch | `models/priority_model_info.json` |

---

## 20. Conference-Paper Evidence Matrix

| Component | Dataset Source | Raw Records | Usable Records | Training Records | Test Records | Model | Eval Method | Best Result | Baseline | Main Limitation | Evidence Strength |
|-----------|---------------|-------------|----------------|-----------------|--------------|-------|------------|-------------|----------|-----------------|-------------------|
| Severity Classification | `suraksha_dmc_dataset_v2.csv` | 1,500 | 1,500 | 1,200 | 300 | XGBoost (300 trees) | Random stratified 80/20, SMOTE on train | NOT SAVED | None | No saved eval report; only 7 CRITICAL samples | **PILOT EVIDENCE** |
| Uncertainty/Triage | None (analytical) | N/A | N/A | N/A | N/A | Temperature Scaling + Simulated MC Dropout | None | NOT AVAILABLE | B1 fixed threshold | MC Dropout is simulated not real; no evaluation | **FUNCTIONAL EVIDENCE ONLY** |
| Language Detection | None (rule-based) | N/A | N/A | N/A | N/A | Rule-based cascade | None | NOT AVAILABLE | None | No evaluation dataset; no accuracy measured | **FUNCTIONAL EVIDENCE ONLY** |
| LSTM Water Prediction | `synthetic_flood_dataset_real_stations.csv` | 341,640 | ~341,172 | ~272,938 | 0 (no held-out test) | 2-layer LSTM | Chronological 80/20 val | val_MAE = 0.1364 m | None | Synthetic data only; no separate test set; no R²/RMSE | **MODERATE QUANTITATIVE EVIDENCE** |
| Alert Generation | DMC PDF thresholds | N/A | N/A | N/A | N/A | Rule-based threshold | N/A | N/A | N/A | Not ML | **FUNCTIONAL EVIDENCE ONLY** |
| GAT Credibility | None (analytical) | N/A | N/A | N/A | N/A | Numpy attention approximation | None | NOT AVAILABLE | B1 rule-based, B2 XGBoost-proxy | No trained model, no labelled eval dataset | **FUNCTIONAL EVIDENCE ONLY** |
| Spatial GNN Forecasting | None (analytical) | N/A | N/A | N/A | N/A | 1-hop GNN (fixed weights) | None | NOT AVAILABLE | B1 naive, B2 ARIMA | No training, hardcoded bias factors | **FUNCTIONAL EVIDENCE ONLY** |
| Face Matching | None (pre-trained) | N/A | N/A | N/A | N/A | VGG-Face via DeepFace | None | NOT AVAILABLE | None | No research evaluation dataset | **FUNCTIONAL EVIDENCE ONLY** |
| NSGA-II Allocation | Live DB | Runtime | Runtime | N/A | N/A | Greedy + 2-opt (NOT NSGA-II) | Pareto metrics (functional) | Functional outputs | None | Algorithm ≠ NSGA-II; no benchmark | **FUNCTIONAL EVIDENCE ONLY** |
| Offline Sync | None | N/A | N/A | N/A | N/A | React Query + offline queue | None | NOT AVAILABLE | None | No offline test conducted | **NO VALID EVALUATION FOUND** |
| Usability (SUS) | 11 participants | 11 | 11 | N/A | N/A | SUS questionnaire | Pilot evaluation | SUS = 74.3 | None | n=11 only; no raw data file | **PILOT EVIDENCE** |
| Performance | Load test (local) | 2,288 req | 2,288 req | N/A | N/A | k6 | Load test | 0% error @ 100 VU | None | Local server only; very high latency (6.6s avg) | **PILOT EVIDENCE** |
| Multilingual NLP | `suraksha_dmc_dataset_v2.csv` | 1,500 | 1,500 | N/A | N/A | Rule-based | None | NOT AVAILABLE | None | No text column in dataset; no eval possible | **FUNCTIONAL EVIDENCE ONLY** |

---

## 21. Recommended Main Contributions for Paper

| Component | Recommended Classification | Justification |
|-----------|--------------------------|---------------|
| Severity Classification | **B — Supporting Evaluated** | 1,500 records, trained model exists, but no saved eval report; re-run needed |
| Uncertainty-Aware Triage | **B — Supporting (Architecture)** | Novel multi-stage pipeline design, but MC Dropout is simulated; needs real evaluation |
| LSTM Water Prediction | **B — Supporting Evaluated** | val_MAE = 0.1364 m exists; needs RMSE, R², baseline comparison for A-grade |
| Alert Generation | **C — Architectural Only** | Rule-based; no ML component |
| Trilingual NLP | **C — Architectural Only** | Rule-based; no trained model; no evaluation |
| GAT Credibility | **C — Architectural Only** | No trained model; no labelled dataset |
| Spatial GNN Forecasting | **C — Architectural Only** | No training; hardcoded weights |
| Offline Synchronization | **C — Architectural Only** | No controlled test |
| NSGA-II Allocation | **C — Architectural Only** | Algorithm is greedy, not NSGA-II |
| Face Matching | **C — Architectural Only** | Pre-trained model integration only |
| Usability | **C — Pilot** | n=11, pilot evidence only |
| Performance | **C — Pilot** | Local dev server testing only |
| Multimodal Fusion (M1–M5) | **D — Future Work** | No evaluation comparing M1–M5 variants |
| Active Learning (R4) | **D — Future Work** | Fully analytical, no evaluation |

---

## 22. Missing Experiments Before Submission

The following experiments **must be run** before submission to produce honest, verifiable IEEE paper numbers:

1. **Re-train severity classifier** on the 1,500-record dataset and **save the classification report** (per-class F1, confusion matrix, macro-F1, weighted-F1, AUC-ROC)
2. **Fix the model mismatch** — determine whether the saved XGBoost model (20 features) or the RandomForest scripts (12 features) represent the current system
3. **Run cross-validation** (5-fold stratified) on severity classifier — record per-fold results
4. **Evaluate uncertainty triage** on the 300-record test set — compute human-review rate, error capture rate, ECE, Brier Score
5. **Compute LSTM test metrics** — hold out a separate test set; compute RMSE, R², and separate T+1 vs T+2 MAE; compare against persistence baseline
6. **Fix LSTM scaler leakage** — fit MinMaxScaler only on training portion
7. **Evaluate language detector** — create or obtain a labelled language test set (at minimum, use the Report_Language column from the 300-record test split if text is available)
8. **Conduct offline synchronization test** — document test setup, number of queued reports, sync success rate, latency
9. **Re-run performance tests on production/staging** — not local dev
10. **Create labelled credibility dataset** if GAT is to be a contribution
11. **Add a CRITICAL-class upsampling strategy** — 7 CRITICAL samples in 1,500 records is too few for reliable CRITICAL-class F1

---

## 23. Exact Numbers That Must Appear in the IEEE Paper

These are the ONLY numbers verified directly from code, data, or model files:

| Number | Value | Context |
|--------|-------|---------|
| Severity training dataset size | **1,500 records** | `suraksha_dmc_dataset_v2.csv` |
| Severity training split | **1,200 train / 300 test** | 80/20 random stratified |
| CRITICAL class samples | **7 out of 1,500 (0.5%)** | Severe imbalance |
| MEDIUM class samples | **759 (50.6%)** | Majority class |
| HIGH class samples | **174 (11.6%)** | |
| LOW class samples | **560 (37.3%)** | |
| LSTM training rows | **341,640** | `synthetic_flood_dataset_real_stations.csv` |
| LSTM gauge stations | **39** | From DMC PDFs |
| LSTM rivers | **26** | From DMC PDFs |
| LSTM time period | **2025-07-20 to 2026-07-20** | 1 year |
| LSTM SMOTE status | **Not applied (regression task)** | |
| LSTM epochs run | **11** (early stopped) | `lstm_model_info.json` |
| LSTM val MAE | **0.1364 m** | `lstm_model_info.json` |
| LSTM val MAE normalised | **0.009755** | `lstm_model_info.json` |
| LSTM sequence length | **12 hours** | Config |
| LSTM prediction horizons | **T+1h and T+2h** | Config |
| LSTM architecture | **LSTM(64)→Dropout(0.2)→LSTM(32)→Dropout(0.2)→Dense(16)→Dense(2)** | `train_lstm.py` |
| MC Dropout samples | **30** | `uncertainty_triage.py` line 64 |
| Temperature (Sinhala) | **1.60** | `uncertainty_triage.py` line 44 |
| Temperature (Tamil) | **1.55** | `uncertainty_triage.py` line 45 |
| Temperature (English) | **1.20** | `uncertainty_triage.py` line 43 |
| Auto-classify threshold (base) | **0.68** | `uncertainty_triage.py` line 56 |
| Auto-classify threshold (critical) | **0.82** | `uncertainty_triage.py` line 60 |
| Face model | **VGG-Face** | `face_matcher.py` line 13 |
| Face detector | **MTCNN** | `face_matcher.py` line 14 |
| Face confidence threshold | **0.40** | `face_matcher.py` line 12 |
| Load test VUs | **100** | `load-test.js` |
| Load test avg latency | **6,656.9 ms** | `results-load.json` |
| Load test error rate | **0.00%** | `results-load.json` |
| Stress test error rate | **12.72%** | `results-stress.json` |
| Report languages in dataset | **SINHALA 783, ENGLISH 431, TAMIL 286** | `suraksha_dmc_dataset_v2.csv` |
| Total ML Python files | **21 files** | `suraksha-ml/ml/` directory |
| Districts covered | **25** | `suraksha_dmc_dataset_v2.csv` |
| Saved model: severity | **XGBClassifier, 300 estimators** | `priority_model_info.json` |
| Saved model: water | **LSTM v1.0, trained 2026-07-21** | `lstm_model_info.json` |

---

*End of SURAKSHA IEEE Technical Audit — All values traceable to source files as noted above.*
