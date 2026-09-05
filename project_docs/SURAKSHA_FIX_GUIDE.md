# SURAKSHA — Fix Guide for IEEE Submission
## How to Fix Every Critical Issue

---

## ISSUE 1 — Re-train and Save the Classification Report

**Problem:** `print(classification_report(...))` on line 110 of `train_priority_v2.py` throws the
report away to the console. Nothing is saved to disk. You have no numbers for the paper.

**Fix:** Edit `training/train_priority_v2.py`. Replace lines 108–123 with the block below.
No other lines need to change.

```python
# ─── EVALUATE & SAVE EVERYTHING ───────────────────────────────────────
import json
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, accuracy_score
)
from sklearn.preprocessing import label_binarize

print("Evaluating model...")
y_pred      = clf.predict(X_test)
y_pred_prob = clf.predict_proba(X_test)   # RandomForest gives probabilities

# 1. Per-class report (Precision, Recall, F1, Support)
report_dict = classification_report(y_test, y_pred, output_dict=True)
report_text = classification_report(y_test, y_pred)
print(report_text)

# 2. Confusion matrix
classes = clf.classes_
cm = confusion_matrix(y_test, y_pred, labels=classes)
print("Confusion Matrix (rows=actual, cols=predicted):")
print("Labels:", classes.tolist())
print(cm)

# 3. AUC-ROC (one-vs-rest macro)
y_bin = label_binarize(y_test, classes=classes)
auc   = roc_auc_score(y_bin, y_pred_prob, multi_class='ovr', average='macro')
print(f"Macro AUC-ROC (OvR): {auc:.4f}")

# 4. Overall accuracy
acc = accuracy_score(y_test, y_pred)
print(f"Overall Accuracy: {acc:.4f}")

# 5. Save everything to JSON (machine-readable for the paper)
eval_output = {
    "dataset":            "suraksha_dmc_dataset_v2.csv",
    "total_records":      len(df),
    "train_records":      len(X_train),
    "test_records":       len(X_test),
    "train_test_split":   "80/20 random stratified",
    "smote":              "applied to train only (not majority, k=3)",
    "model":              "RandomForestClassifier",
    "n_estimators":       100,
    "max_depth":          10,
    "random_state":       42,
    "overall_accuracy":   round(acc, 4),
    "macro_auc_roc":      round(auc, 4),
    "classification_report": report_dict,
    "confusion_matrix": {
        "labels":  classes.tolist(),
        "matrix":  cm.tolist()
    },
    "class_distribution_before_smote": pd.Series(y).value_counts().to_dict(),
    "class_distribution_after_smote":  pd.Series(y_train_balanced).value_counts().to_dict(),
    "trained_at": datetime.utcnow().isoformat()
}

from datetime import datetime
eval_path = os.path.join(models_dir, "priority_eval_report.json")
with open(eval_path, "w") as f:
    json.dump(eval_output, f, indent=2)
print(f"\nSaved evaluation report → {eval_path}")

# 6. Also save a plain text version for quick reading
txt_path = os.path.join(models_dir, "priority_eval_report.txt")
with open(txt_path, "w") as f:
    f.write(f"Dataset: suraksha_dmc_dataset_v2.csv  |  N={len(df)}\n")
    f.write(f"Split: 80/20 stratified  |  SMOTE on train only\n\n")
    f.write(report_text + "\n")
    f.write(f"Confusion Matrix (labels: {classes.tolist()})\n")
    f.write(str(cm) + "\n\n")
    f.write(f"Macro AUC-ROC (OvR): {auc:.4f}\n")
    f.write(f"Overall Accuracy:    {acc:.4f}\n")
print(f"Saved plain-text report → {txt_path}")
```

Then add `from datetime import datetime` at the top of the file (line 1 area).

**After running this, your paper numbers come from:**
- `models/priority_eval_report.json` — every F1, precision, recall, support
- `models/priority_eval_report.txt` — human-readable version

---

## ISSUE 2 — Algorithm Mismatch (XGBoost vs RandomForest)

**Problem:** `models/priority_classifier.pkl` was trained by a lost XGBoost script (300 trees,
20 features). The two current scripts use RandomForest (100 trees, 12 features). You cannot
claim XGBoost in the paper if you can't reproduce the training.

**You have two choices. Pick ONE and be consistent everywhere:**

### Option A — Use RandomForest (Simpler, Fully Reproducible)
Just run the existing `train_priority_v2.py` with the fixes from Issue 1 above.
The new `priority_classifier.pkl` will be RandomForest (100 trees, 12 features).
Update `models/priority_model_info.json` manually after training:

```json
{
  "model": "RandomForestClassifier",
  "n_estimators": 100,
  "max_depth": 10,
  "features": 12,
  "smote": "k_neighbors=3, not_majority",
  "train_records": 1200,
  "test_records": 300,
  "trained_at": "auto-filled by script"
}
```

### Option B — Use XGBoost (Stronger, Better for Paper) ← RECOMMENDED
Replace the classifier in `train_priority_v2.py` line 104–106:

```python
# Replace RandomForestClassifier import and usage with:
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

# Encode string labels to integers (XGBoost requires this)
le = LabelEncoder()
y_train_enc = le.fit_transform(y_train_balanced)
y_test_enc  = le.transform(y_test)

clf = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric='mlogloss',
    random_state=42,
    n_jobs=-1
)
clf.fit(X_train_balanced, y_train_enc,
        eval_set=[(X_val_encoded, y_val_enc)],  # if you have a val set
        verbose=False)
# Note: also update the predict lines to use le.inverse_transform(...)
```

Install XGBoost if needed:
```
pip install xgboost
```

**For the paper, state ONE algorithm. Whichever you train last is the one you report. Re-run
`train_priority_v2.py` fresh and use the outputs of that run exclusively.**

---

## ISSUE 3 — LSTM Scaler Data Leakage

**Problem:** In `training/train_lstm.py`, the `preprocess()` function at line 172–173:

```python
scaler = MinMaxScaler()
scaled = scaler.fit_transform(features)  # ← fitted on ALL 341,640 rows
```

The scaler sees the future (validation) data before the train/val split at line 216.

**Fix:** Edit `training/train_lstm.py`, replace the `preprocess()` function and the `train()`
function's preprocessing block.

**Replace lines 163–181 (preprocess function) with:**

```python
def preprocess(df: pd.DataFrame, train_fraction: float = 0.80):
    """
    Builds sequences WITH correct scaler fitting.
    Scaler is fitted ONLY on the training portion to prevent leakage.
    """
    # Compute rate of change per station
    if "stationName" in df.columns:
        df["rate_of_change"] = df.groupby("stationName")["water_level_m"].diff().fillna(0)
    else:
        df["rate_of_change"] = df["water_level_m"].diff().fillna(0)

    features = df[FEATURE_COLS].values.astype(np.float32)

    # ── LEAKAGE FIX: determine train boundary BEFORE fitting scaler ──────
    n_rows          = len(features)
    train_row_split = int(n_rows * train_fraction)

    # Fit scaler ONLY on training rows
    scaler = MinMaxScaler()
    scaler.fit(features[:train_row_split])             # ← fit on train only
    scaled = scaler.transform(features)               # ← transform all rows

    # Build sequences
    X, y = [], []
    for i in range(SEQUENCE_LEN, len(scaled) - PREDICTION_LEN):
        X.append(scaled[i - SEQUENCE_LEN : i])
        y.append([scaled[i, 0], scaled[i + 1, 0]])

    X = np.array(X)
    y = np.array(y)

    # Chronological split (sequences, not raw rows)
    seq_split   = int(len(X) * train_fraction)
    X_train     = X[:seq_split]
    X_val       = X[seq_split:]
    y_train     = y[:seq_split]
    y_val       = y[seq_split:]

    return X_train, X_val, y_train, y_val, scaler
```

**Then update the `train()` function, replace lines 212–219:**

```python
print("\nPreprocessing with leakage-free scaler fitting...")
X_train, X_val, y_train, y_val, scaler = preprocess(df, train_fraction=1 - VALIDATION_SPLIT)
print(f"   Train sequences: {len(X_train)}  Val sequences: {len(X_val)}")
```

Remove the old `X, y, scaler = preprocess(df)` line and the four lines after it.

**Re-train the model after this fix** — the val_MAE will change slightly. Use the new value
in your paper.

---

## ISSUE 4 — Only 7 CRITICAL Samples

**Problem:** With 7 CRITICAL samples in 1,500 records:
- Test set (20%) gets only ~1–2 CRITICAL samples
- CRITICAL-class F1 is statistically meaningless with n=1 or n=2
- SMOTE with k_neighbors=3 on 7 samples is on the edge of validity

**Fix options (do at least ONE):**

### Option A — Generate More CRITICAL Samples in the Dataset (Recommended)
Open `scratch/generate_dataset.js` and look at how Priority_Label is assigned.
Make the CRITICAL generation rules slightly more permissive so you get ~75 CRITICAL
records out of 1,500 (5% target). Then re-generate the CSV and re-train.

Target distribution for a credible paper:
```
CRITICAL:  ~75  (5%)
HIGH:      ~225 (15%)
MEDIUM:    ~600 (40%)
LOW:       ~600 (40%)
```

### Option B — Change SMOTE Strategy to Hit a Target Count
In `train_priority_v2.py` line 97, change `sampling_strategy`:

```python
# Instead of 'not majority', specify exact counts:
smote = SMOTE(
    sampling_strategy={
        'CRITICAL': 200,   # oversample CRITICAL to 200 in training
        'HIGH':     200,   # oversample HIGH to 200 in training
    },
    random_state=42,
    k_neighbors=3
)
```

This will force the training set to have 200 CRITICAL and 200 HIGH samples (all synthetic).

**IMPORTANT — Paper disclosure:** You MUST state in the paper that SMOTE was applied because
of class imbalance, and that CRITICAL-class results are heavily SMOTE-influenced and may not
reflect true generalization. This is honest and acceptable for a conference paper.

### Option C — Report Macro-F1 Without CRITICAL Class
If CRITICAL remains at 7 samples, compute and report a "3-class Macro-F1" (LOW, MEDIUM, HIGH
only) and separately note that the CRITICAL class was too rare for reliable evaluation in the
current dataset.

```python
# Add this after classification_report():
from sklearn.metrics import f1_score
three_class_mask = y_test != 'CRITICAL'
f1_3class = f1_score(
    y_test[three_class_mask],
    y_pred[three_class_mask],
    average='macro'
)
print(f"3-class Macro-F1 (excl. CRITICAL): {f1_3class:.4f}")
```

---

## ISSUE 5 — Spatial GNN Has Fixed Hardcoded Weights

**Problem:** `ml/spatiotemporal_forecaster.py` uses `SPATIAL_PROPAGATION_WEIGHT = 0.15`
for all district edges — uniform, not learned. This is not a GNN.

**Honest fix for the paper (no code change needed, just correct the narrative):**

**Do NOT call it a trained GNN.** Call it what it is.

**Correct paper wording:**
> *"We implement a bias-aware spatiotemporal risk model incorporating a 1-hop spatial message
> passing layer over the Sri Lanka district adjacency graph. District reporting bias factors
> are derived from internet penetration, mobile coverage, and population density proxies
> (per-district values in Table X). Edge propagation weights are set to a uniform value
> (w=0.15) in the current implementation; learned weights from historical inter-district
> incident correlation are deferred to future work."*

**If you want actual learned weights for the paper (optional but stronger):**

Add this to `spatiotemporal_forecaster.py` — it learns weights from the severity dataset:

```python
def learn_spatial_weights(incidents_df):
    """
    Compute Pearson correlation between districts' incident rates as
    a data-driven spatial weight matrix.
    incidents_df must have columns: District, Priority_Label, Timestamp
    """
    import pandas as pd
    import numpy as np

    # Monthly incident counts per district
    incidents_df['month_key'] = pd.to_datetime(
        incidents_df['Timestamp']
    ).dt.to_period('M')
    pivot = incidents_df.groupby(['District', 'month_key']).size().unstack(fill_value=0)

    # Pearson correlation matrix
    corr = pivot.T.corr()

    # Replace SPATIAL_PROPAGATION_WEIGHT per edge with corr value (clipped 0–1)
    return corr.clip(lower=0)
```

This gives you data-driven spatial weights from the 1,500-record dataset.

---

## ISSUE 6 — NSGA-II Is Not Actually NSGA-II

**Problem:** `ml/resource_optimizer.py` uses a greedy + 2-opt algorithm.
This is NOT NSGA-II (which needs populations, crossover, mutation, Pareto front ranking).

**Option A — Rename It (Fastest Fix)**

Change the paper description and the docstring. In `resource_optimizer.py` line 2, change:
```python
# FROM:
# F10 — Multi-Objective Relief Resource Optimization (NSGA-II simplified)
# TO:
# F10 — Multi-Objective Relief Resource Optimization
#        Algorithm: Priority-Weighted Greedy Assignment with 2-opt Local Search
#        Objectives: minimize distance, maximize beneficiaries, critical-request
#        fulfilment, and geographic fairness
```

**Paper wording:**
> *"Resource allocation is formulated as a multi-objective optimization problem over four
> objectives (travel distance, beneficiaries served, critical-request fulfilment, geographic
> fairness). We solve it using a priority-weighted greedy assignment followed by a 2-opt
> local search swap step. The resulting Pareto metrics are reported per allocation run."*

**Option B — Implement Real NSGA-II (Stronger Paper)**

Install `pymoo`:
```
pip install pymoo
```

Then create `training/run_nsga2_eval.py`:

```python
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.core.problem import Problem
from pymoo.optimize import minimize
import numpy as np

class ResourceAllocationProblem(Problem):
    """
    Binary assignment: x[i,j] = 1 if request i gets resource j
    Objectives (all minimized — negate maximization objectives):
      f1: total distance (minimize)
      f2: -beneficiaries served (maximize → minimize negative)
      f3: -critical fulfilment rate (maximize)
      f4: -geographic fairness (maximize)
    """
    def __init__(self, requests, resources):
        n = len(requests) * len(resources)
        super().__init__(n_var=n, n_obj=4, n_constr=1,
                         xl=0.0, xu=1.0)
        self.requests  = requests
        self.resources = resources

    def _evaluate(self, X, out, *args, **kwargs):
        # Decode binary assignments, compute 4 objectives
        # ... (implement per your data schema)
        pass

# Run NSGA-II
algorithm = NSGA2(pop_size=100)
res = minimize(problem, algorithm, ('n_gen', 200), seed=42, verbose=True)
# res.F = Pareto front objective values
# res.X = Pareto front solutions
```

This produces a real Pareto front. You then report Hypervolume (HV) and compare it to
the greedy baseline. This makes for a much stronger contribution.

---

## ISSUE 7 — MC Dropout Is Simulated (Gaussian Noise)

**Problem:** `ml/uncertainty_triage.py` adds Gaussian noise (std=0.06) to simulate MC Dropout.
Real MC Dropout requires a neural network with actual Dropout layers kept active at inference time.

**Option A — Rename It (Fastest Fix)**

Change the name in comments and the paper. In `uncertainty_triage.py`:

```python
# Change:
# Monte Carlo Dropout
# To:
# Stochastic Perturbation Ensemble (SPE)
# n=30 perturbation samples with additive Gaussian noise (σ=0.06) to
# approximate epistemic uncertainty — a lightweight alternative to MC Dropout
# suitable for non-neural-network models.
```

**Paper wording:**
> *"Since the severity classifier is a gradient-boosted tree rather than a neural network,
> standard MC Dropout is inapplicable. We instead apply a Stochastic Perturbation Ensemble
> (SPE): 30 forward passes with additive Gaussian noise (σ=0.06) on the classifier's output
> probabilities, generating a distribution from which epistemic uncertainty (std of samples)
> and aleatoric proxy (1 − confidence) are derived."*

This is honest and academically defensible. It is NOT wrong — it is an approximation that
the paper should describe accurately.

**Option B — Implement Real MC Dropout (Stronger Paper)**

This requires re-implementing the classifier as a neural network. Use:

```python
# Replace RandomForest/XGBoost with a small MLP with Dropout:
import tensorflow as tf

def build_classifier(input_dim, n_classes, dropout_rate=0.3):
    inputs = tf.keras.Input(shape=(input_dim,))
    x = tf.keras.layers.Dense(64, activation='relu')(inputs)
    x = tf.keras.layers.Dropout(dropout_rate)(x, training=True)  # MC Dropout: training=True always
    x = tf.keras.layers.Dense(32, activation='relu')(x)
    x = tf.keras.layers.Dropout(dropout_rate)(x, training=True)
    outputs = tf.keras.layers.Dense(n_classes, activation='softmax')(x)
    return tf.keras.Model(inputs, outputs)

# MC Dropout inference: run N forward passes with Dropout ACTIVE
def mc_predict(model, X, n_passes=30):
    preds = np.stack([model(X, training=True).numpy() for _ in range(n_passes)])
    mean   = preds.mean(axis=0)
    std    = preds.std(axis=0)
    return mean, std   # mean = confidence, std = epistemic uncertainty
```

Then replace uncertainty_triage.py's MC simulation with real MC Dropout calls.
This is a 1–2 day effort but produces a genuine, verifiable MC Dropout implementation.

---

## ISSUE 8 — Multilingual Classifier Is Rule-Based

**Problem:** `ml/multitask_classifier.py` uses keyword matching, NOT XLM-R or any trained model.
The paper may claim multilingual NLP but there is no fine-tuned model.

**Option A — Describe It Correctly (Fastest, Honest)**

**Paper wording:**
> *"Disaster type and urgency classification is performed using a weighted keyword-scoring
> approach: each term is assigned a TF-IDF-motivated weight based on disaster-type specificity
> (rare terms such as 'tsunami' w=3.0; common terms such as 'water' w=1.5). Phrase matching
> with a 3× weight bonus is applied for compound disaster indicators. A negation handling
> pre-processor strips context following negation words. The classifier supports English,
> Sinhala (native Unicode and Latin transliteration), and Tamil (native Unicode and Latin
> transliteration) through language-specific keyword lexicons."*

This is accurate, honest, and still a valid engineering contribution — it is just not deep learning.

**Option B — Fine-Tune XLM-R for Real (Stronger but Weeks of Work)**

If you want a genuine multilingual ML model:

1. Export the text from your PostgreSQL incidents table — you need raw report text, not the
   structured CSV (the current CSV has no text column)
2. Label each text with `Priority_Label` (LOW/MEDIUM/HIGH/CRITICAL)
3. Fine-tune XLM-RoBERTa:

```python
pip install transformers datasets torch

from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification, Trainer, TrainingArguments

tokenizer = XLMRobertaTokenizer.from_pretrained('xlm-roberta-base')
model     = XLMRobertaForSequenceClassification.from_pretrained('xlm-roberta-base', num_labels=4)

# Tokenize your text dataset, train with Trainer API
# This requires actual text data — the current CSV does not have it
```

This is only feasible if you have actual incident text. If you do not have text data,
Option A is the right path.

---

## Summary: What to Actually Do Right Now

**Ranked by impact and effort:**

| Priority | Fix | Time Needed | Paper Impact |
|----------|-----|------------|-------------|
| 🔴 URGENT | Issue 1: Save classification report | 15 minutes | Essential — no numbers without this |
| 🔴 URGENT | Issue 2: Decide RandomForest or XGBoost, re-train | 30 minutes | Essential — model identity must be clear |
| 🔴 URGENT | Issue 4, Option B: Increase CRITICAL samples via SMOTE | 10 minutes | Essential — 7 samples is not publishable |
| 🟡 IMPORTANT | Issue 3: Fix LSTM scaler leakage, re-train | 30 minutes + training time | Methodological correctness |
| 🟡 IMPORTANT | Issue 5, 6, 7, 8: Fix paper wording (rename components correctly) | 1–2 hours writing | Academic honesty — reviewers will catch these |
| 🟢 OPTIONAL | Issue 6, Option B: Real NSGA-II | 2–3 days | Stronger contribution |
| 🟢 OPTIONAL | Issue 7, Option B: Real MC Dropout (MLP) | 2 days | Stronger contribution |
| 🟢 OPTIONAL | Issue 8, Option B: Fine-tune XLM-R | Weeks | Strongest contribution — needs text data |

**Minimum viable path to honest submission:**
1. Fix Issue 1 → run `python training/train_priority_v2.py` → get real F1 numbers
2. Fix Issue 4 (SMOTE targets) → ensure CRITICAL has enough samples
3. Fix Issue 3 (scaler) → re-run `python training/train_lstm.py` → get updated MAE
4. Fix wording for Issues 5, 6, 7, 8 in the paper text
5. Done — you have real, verifiable, honest numbers
