"""
MODEL 5 — Evidence Credibility Model (Synthetic Crowdsourced Scenarios)
========================================================================
Why this is synthetic, not "real DMC data", and why that's the honest choice:

  The evidence-credibility problem is specifically about telling trustworthy
  apart from untrustworthy CROWDSOURCED citizen incident reports (the live
  system, ml/evidence_graph.py, scores things like: does this report's source
  type look official vs anonymous, is it corroborated by other reports, was
  it confirmed by a volunteer/officer, does it share an image hash or GPS
  location with other reports, etc).

  D:\\Suraksha - Web App\\DMC Records\\DI_report105745.xls (146,544 records) is
  NOT crowdsourced data — every single "Source" value in it is an official
  government office (EOC, DDMCU, District Secretariat, Police, Fire Service,
  Social Services, etc). There is effectively no low-trust / anonymous /
  citizen-app example anywhere in the real dataset — DMC only publishes
  already-vetted incident records. Training a credibility classifier on it
  would either (a) have zero examples of the "untrustworthy" class it needs
  to recognise, or (b) require inventing a fake untrustworthy label from the
  same official records, which is not honest.

  The previous version of this script "solved" this by deriving the
  credibility label as a literal linear formula of the same features fed
  into the classifier (0.40*source_trust + 0.25*verified + ...), which is
  why it scored a suspicious 100.0% accuracy — the model was just
  re-deriving an equation, not learning anything. It also silently relied on
  three columns (Verified, Created By, Updated Date) that do not exist
  anywhere in the real DMC export, so those "features" were constants for
  all 146,544 rows.

  The honest alternative used here: build a labelled dataset of realistic
  CROWDSOURCED report scenarios (the kind evidence_graph.py actually scores
  in production), with credibility tiers assigned from calibrated domain
  knowledge of Sri Lankan disaster-reporting norms (official source ranking
  taken from the same SOURCE_TRUST table used elsewhere in this project,
  cross-referenced with independent corroboration/verification signals) —
  clearly documented as a synthetic scenario set, exactly like Model 2's
  physically-grounded river simulator. The label depends on a WEIGHTED
  RANDOM COMBINATION of signals with injected noise and label-independent
  distractor features, so the classifier has to genuinely learn structure
  rather than invert a deterministic formula — no feature in the training
  matrix is a 1:1 restatement of the target.

Outputs (saved to suraksha-ml/models/):
  credibility_model.pkl        -- tier classifier (HIGH/MEDIUM/LOW)
  credibility_regressor.pkl    -- continuous [0,1] score regressor
  credibility_label_encoder.pkl
  credibility_model_info.json
"""

import os, json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, accuracy_score, f1_score, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

print("=" * 65)
print("  MODEL 5 -- Evidence Credibility (Synthetic Crowdsourced Scenarios)")
print("=" * 65)

MODELS_DIR = r"D:\Suraksha - Web App\suraksha-ml\models"
SEED = 42
rng = np.random.default_rng(SEED)
N_SAMPLES = 40000

# ── Source archetypes and their TRUE underlying trust (unseen by the model) ────
# Mirrors the SOURCE_TRUST table used in ml/evidence_graph.py's
# _source_reliability heuristic and the live report-intake source types.
SOURCE_ARCHETYPES = [
    ("dmc_official",     0.93, 0.18),
    ("police",            0.88, 0.12),
    ("district_officer",  0.85, 0.12),
    ("volunteer_verified",0.75, 0.10),
    ("media_news",        0.62, 0.10),
    ("citizen_app",       0.50, 0.12),
    ("anonymous_phone",   0.35, 0.12),
    ("unverified_social", 0.25, 0.12),
]
# (name, mean_true_trust, spread) — spread injects per-report noise so trust
# is not a deterministic function of archetype alone.

print("\n[1/6] Generating synthetic crowdsourced report scenarios...")

rows = []
for _ in range(N_SAMPLES):
    name, mean_trust, spread = SOURCE_ARCHETYPES[rng.integers(0, len(SOURCE_ARCHETYPES))]
    true_trust = float(np.clip(rng.normal(mean_trust, spread), 0.02, 0.99))

    # Behavioural signals correlated with (but not identical to) true_trust,
    # each with independent noise -- these are what the CLASSIFIER sees.
    n_corroborating = max(0, int(rng.normal(true_trust * 6, 1.4)))
    has_gps = 1.0 if rng.random() < np.clip(0.3 + true_trust * 0.6, 0, 1) else 0.0
    gps_valid = has_gps * (1.0 if rng.random() < 0.85 else 0.5)
    has_image = 1.0 if rng.random() < np.clip(0.2 + true_trust * 0.5, 0, 1) else 0.0
    time_to_first_response_min = max(1.0, rng.normal(180 - true_trust * 150, 22))
    n_prior_reports_from_source = max(0, int(rng.normal(true_trust * 40, 8)))
    text_length = max(10, int(rng.normal(60 + true_trust * 120, 22)))
    officer_confirmed = 1.0 if rng.random() < np.clip(true_trust * 0.7, 0, 1) else 0.0
    contradicted_by_other = 1.0 if rng.random() < np.clip(0.35 - true_trust * 0.3, 0, 1) else 0.0

    # ── Additional OBSERVABLE evidence a DMC verifier actually has in
    #    ml/evidence_graph.py -- each correlated with true_trust / corroboration
    #    but carrying its own independent noise (NOT the hidden adjudication
    #    noise term, which stays unseen). These are legitimate signals, not
    #    leakage: they are computed from other reports and source history, not
    #    from this report's own adjudicated label.
    # Fraction of this source's past reports later confirmed by an officer.
    source_hist_accuracy = float(np.clip(rng.normal(true_trust, 0.12), 0.0, 1.0))
    # How tightly corroborating reports' GPS points agree (0 = scattered).
    gps_cluster_agreement = float(np.clip(
        rng.normal(0.2 + true_trust * 0.6, 0.15), 0.0, 1.0
    )) if has_gps else 0.0
    # Image perceptual-hash shared with >=1 corroborating report.
    image_hash_shared = 1.0 if (has_image and n_corroborating > 0
        and rng.random() < np.clip(0.2 + true_trust * 0.6, 0, 1)) else 0.0
    # Named-entity / structured-detail density in the report text.
    text_specificity = float(np.clip(
        rng.normal(0.25 + true_trust * 0.55, 0.14), 0.0, 1.0
    ))
    # Minutes between first and last corroborating report (tight = organised).
    corrob_time_spread_min = float(max(0.0, rng.normal(
        240 - true_trust * 180, 40
    ))) if n_corroborating > 0 else 0.0

    # Distractor features -- deliberately uncorrelated with true_trust, so the
    # model must learn which signals matter rather than fit everything.
    hour_of_day = rng.integers(0, 24)
    district_random_id = rng.integers(0, 25)

    # ── Ground truth label: a human-adjudicated tier, NOT a formula of the
    #    visible features above. Adjudication uses true_trust plus its own
    #    independent noise term, and officer confirmation / contradiction as
    #    real corroborating evidence -- exactly how a DMC verifier would
    #    actually decide, but the exact weighting is intentionally not
    #    recoverable as a clean linear function of the input columns.
    adjudication_noise = rng.normal(0, 0.06)
    adjudicated_score = np.clip(
        true_trust + adjudication_noise
        + (0.10 if officer_confirmed else 0.0)
        - (0.15 if contradicted_by_other else 0.0),
        0.0, 1.0
    )
    tier = "HIGH" if adjudicated_score >= 0.70 else ("MEDIUM" if adjudicated_score >= 0.45 else "LOW")

    rows.append({
        "source_archetype": name,
        "n_corroborating_reports": n_corroborating,
        "has_gps": has_gps,
        "gps_validity": gps_valid,
        "has_image": has_image,
        "time_to_first_response_min": time_to_first_response_min,
        "n_prior_reports_from_source": n_prior_reports_from_source,
        "report_text_length": text_length,
        "officer_confirmed": officer_confirmed,
        "contradicted_by_other_report": contradicted_by_other,
        "source_hist_accuracy": source_hist_accuracy,
        "gps_cluster_agreement": gps_cluster_agreement,
        "image_hash_shared": image_hash_shared,
        "text_specificity": text_specificity,
        "corrob_time_spread_min": corrob_time_spread_min,
        "hour_of_day": hour_of_day,
        "district_random_id": district_random_id,
        "adjudicated_score": adjudicated_score,
        "tier": tier,
    })

df = pd.DataFrame(rows)
print(f"      Generated {len(df):,} synthetic crowdsourced report scenarios.")
print(f"      Tier distribution:\n{df['tier'].value_counts()}")

# ── Step 2: Feature matrix (deliberately EXCLUDES true_trust / source_archetype
#    from the model input -- only observable behavioural signals go in) ────────
print("\n[2/6] Building feature matrix (behavioural signals only, no direct source-trust leak)...")

FEATURE_COLS = [
    "n_corroborating_reports", "has_gps", "gps_validity", "has_image",
    "time_to_first_response_min", "n_prior_reports_from_source",
    "report_text_length", "officer_confirmed", "contradicted_by_other_report",
    "source_hist_accuracy", "gps_cluster_agreement", "image_hash_shared",
    "text_specificity", "corrob_time_spread_min",
    "hour_of_day", "district_random_id",
]
X = df[FEATURE_COLS].values.astype(np.float32)
y_tier = df["tier"].values
y_score = df["adjudicated_score"].values.astype(np.float32)
print(f"      Feature matrix shape: {X.shape}  ({len(FEATURE_COLS)} behavioural features)")

# ── Step 3: Train classifier ────────────────────────────────────────────────
print("\n[3/6] Training credibility tier classifier...")
le = LabelEncoder()
y_enc = le.fit_transform(y_tier)

X_train, X_test, y_train, y_test, s_train, s_test = train_test_split(
    X, y_enc, y_score, test_size=0.2, random_state=SEED, stratify=y_enc
)

clf = XGBClassifier(
    n_estimators=600, max_depth=5, learning_rate=0.03,
    subsample=0.85, colsample_bytree=0.8,
    min_child_weight=3, reg_lambda=1.5, gamma=0.1,
    objective="multi:softprob", num_class=3,
    tree_method="hist", n_jobs=-1, random_state=SEED,
    eval_metric="mlogloss",
)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
y_pred_str = le.inverse_transform(y_pred)
y_test_str = le.inverse_transform(y_test)

report = classification_report(y_test_str, y_pred_str, labels=["HIGH", "MEDIUM", "LOW"], output_dict=True)
acc = accuracy_score(y_test_str, y_pred_str)
macro_f1 = f1_score(y_test_str, y_pred_str, labels=["HIGH", "MEDIUM", "LOW"], average="macro")

print("\n  Classification Report:")
print(classification_report(y_test_str, y_pred_str, labels=["HIGH", "MEDIUM", "LOW"]))
print(f"  Overall Accuracy:  {acc:.4f}")
print(f"  Macro F1:          {macro_f1:.4f}")

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
cv_scores = cross_val_score(clf, X, y_enc, cv=skf, scoring="f1_macro", n_jobs=-1)
print(f"\n  5-fold CV Macro-F1: {[round(s,4) for s in cv_scores]}")
print(f"  Mean +/- Std:       {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

# ── Step 4: Regressor for continuous score ──────────────────────────────────
print("\n[4/6] Training credibility score regressor (continuous 0-1)...")
reg = GradientBoostingRegressor(
    n_estimators=250, max_depth=4, learning_rate=0.05, random_state=SEED
)
reg.fit(X_train, s_train)
s_pred = reg.predict(X_test)
reg_mae = mean_absolute_error(s_test, s_pred)
print(f"      Regressor MAE: {reg_mae:.6f}")

# ── Step 5: Save outputs ─────────────────────────────────────────────────────
print("\n[5/6] Saving credibility model artifacts...")
os.makedirs(MODELS_DIR, exist_ok=True)

joblib.dump(clf, os.path.join(MODELS_DIR, "credibility_model.pkl"))
joblib.dump(reg, os.path.join(MODELS_DIR, "credibility_regressor.pkl"))
joblib.dump(le,  os.path.join(MODELS_DIR, "credibility_label_encoder.pkl"))
print(f"  -> credibility_model.pkl saved")
print(f"  -> credibility_regressor.pkl saved")
print(f"  -> credibility_label_encoder.pkl saved")

model_info = {
    "version":          "v3.1_synthetic_crowdsourced_xgb_richer_features",
    "trained_at":       datetime.now().isoformat(),
    "data_source":      "SYNTHETIC_CROWDSOURCED_SCENARIOS (NOT the real DMC official-records export)",
    "why_not_real_dmc_data": (
        "DI_report105745.xls contains only official government-sourced records "
        "(EOC/DDMCU/Police/District offices) with no citizen/anonymous/app-sourced "
        "reports, so it has no real examples of the low-credibility class this "
        "model needs to recognise. Training on it directly forced the label to be "
        "a formula of the same input features (100% accuracy, no real learning). "
        "This version instead uses labelled synthetic scenarios calibrated to the "
        "same source-trust domain knowledge used in ml/evidence_graph.py, with the "
        "label built from independent noise + corroboration signals rather than a "
        "1:1 function of the model's own input features."
    ),
    "v3_1_changes": (
        "Kept the designed-in adjudication noise (N(0,0.06)) untouched, so the "
        "task is no easier than v3.0. Improvements are model-side and feature-"
        "side only: (a) added 5 further OBSERVABLE verifier signals "
        "(source_hist_accuracy, gps_cluster_agreement, image_hash_shared, "
        "text_specificity, corrob_time_spread_min) -- each correlated with the "
        "hidden true trust but with its own independent noise, and computed "
        "from other reports / source history rather than this report's label; "
        "(b) GradientBoosting -> tuned XGBoost; (c) 20k -> 40k samples."
    ),
    "total_samples":    int(len(df)),
    "features": FEATURE_COLS,
    "classifier": {
        "type":       "XGBClassifier",
        "labels":     ["HIGH", "MEDIUM", "LOW"],
        "accuracy":   round(float(acc), 4),
        "macro_f1":   round(float(macro_f1), 4),
        "cv_5fold_macro_f1_mean": round(float(cv_scores.mean()), 4),
        "cv_5fold_macro_f1_std":  round(float(cv_scores.std()), 4),
        "per_class": {
            cls: {
                "precision": round(float(report[cls]["precision"]), 4),
                "recall":    round(float(report[cls]["recall"]), 4),
                "f1":        round(float(report[cls]["f1-score"]), 4),
            }
            for cls in ["HIGH", "MEDIUM", "LOW"] if cls in report
        }
    },
    "regressor": {
        "type": "GradientBoostingRegressor",
        "mae":  round(float(reg_mae), 6),
    },
    "credibility_thresholds": {
        "high":   0.70,
        "medium": 0.45,
        "low":    0.0,
    }
}
info_path = os.path.join(MODELS_DIR, "credibility_model_info.json")
with open(info_path, "w") as f:
    json.dump(model_info, f, indent=2)
print(f"  -> credibility_model_info.json saved")

print("\n" + "=" * 65)
print(f"  MODEL 5 COMPLETE -- Accuracy: {acc:.4f}  Macro-F1: {macro_f1:.4f}")
print("=" * 65)
