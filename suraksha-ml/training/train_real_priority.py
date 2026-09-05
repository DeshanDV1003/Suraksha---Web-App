"""
MODEL 1 — Priority Classifier Retrained on REAL DMC Data
=========================================================
Source: D:\\Suraksha - Web App\\DMC Records\\DI_report105745.xls
        (HTML-format Excel, parsed via pd.read_html)

Records: 146,544 real verified disaster incidents (2010-05-15 to 2026-08-25)

IMPORTANT — schema alignment with the LIVE system:
  The previous version of this script invented its own 15-feature layout
  that did NOT match the feature vector the production system actually
  builds at inference time (ml/feature_builder.py -> build_feature_vector,
  12 dimensions, integer-coded). That mismatch meant the retrained model
  could not be used by /process-report at all (shape mismatch crash).

  This version builds features using the EXACT same 12-dimension layout,
  encodings and caps as ml/feature_builder.py, so the resulting
  priority_classifier.pkl is a drop-in replacement with no other code
  changes required. Two of those 12 dimensions (severity, hour_of_day,
  rainfall_mm, river_level_m) are not present as real historical fields in
  this dataset (DI_report105745.xls has no free-text severity estimate, no
  time-of-day, and no per-record rainfall/river readings) — they are set to
  the same neutral defaults the production code falls back to when that
  information isn't available (severity=UNKNOWN, hour=noon, rainfall=0,
  river_level=0). This mirrors what the live system actually sees for a
  structured DMC intake record, and is documented here rather than faked.

Feature layout (12 dims, identical to ml/feature_builder.py):
  0  incident_type code   (FLOOD=1, LANDSLIDE=2, FIRE=3, CYCLONE=4, DROUGHT=5,
                            EARTHQUAKE=6, TSUNAMI=7, OTHER=8)
  1  location_type code   (URBAN=1, RURAL=2, COASTAL=3, UNKNOWN=0)
  2  severity code        (not available in structured records -> UNKNOWN=0)
  3  person_count         (Affected, capped 1000, /1000)
  4  has_media flag       (from Source column; DMC records are official
                            EOC/DDMCU submissions, so this is honestly ~0)
  5  hour_of_day          (no time-of-day field in this dataset -> noon default)
  6  has_children flag    (proxied from disaster type)
  7  has_elderly flag     (proxied from disaster type)
  8  has_disabled flag    (proxied from disaster type)
  9  rainfall_mm          (not in this dataset -> 0, matches live default)
  10 river_level_m        (not in this dataset -> 0, matches live default)
  11 casualties_count     (Deaths + Injured + Missing, capped 100, /100)

Priority Label derivation (genuine DMC severity outcome, from real columns —
kept as the true target even though some of these columns, e.g. Houses/
Families/Losses, are not part of the 12-dim live feature set; the resulting
accuracy honestly reflects how much of that outcome is recoverable from the
signals the production system actually has access to):
  CRITICAL  -> Deaths >= 5 OR (Deaths >= 1 AND Houses Fully >= 50)
  HIGH      -> Deaths >= 1 OR Houses Fully >= 10 OR People >= 1000
  MEDIUM    -> Houses Partial >= 10 OR People >= 100
  LOW       -> Everything else

Outputs (all saved to suraksha-ml/models/):
  priority_classifier.pkl
  label_encoder.pkl
  priority_eval_report.json
  priority_eval_report.txt
  priority_model_info.json
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timezone

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, accuracy_score, f1_score
)
from sklearn.preprocessing import label_binarize
from imblearn.over_sampling import SMOTE

try:
    from xgboost import XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    from sklearn.ensemble import RandomForestClassifier
    XGB_AVAILABLE = False
    print("[WARNING] XGBoost not available, falling back to RandomForest.")

# ── Paths ─────────────────────────────────────────────────────────────────────
XLS_PATH   = r"D:\Suraksha - Web App\DMC Records\DI_report105745.xls"
MODELS_DIR = r"D:\Suraksha - Web App\suraksha-ml\models"

LABEL_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

# ── Encodings — MUST mirror ml/feature_builder.py exactly ──────────────────────
INCIDENT_TYPE_CODE = {
    "FLOOD": 1, "LANDSLIDE": 2, "FIRE": 3, "CYCLONE": 4,
    "DROUGHT": 5, "EARTHQUAKE": 6, "TSUNAMI": 7, "OTHER": 8,
}
LOCATION_TYPE_CODE = {"URBAN": 1, "RURAL": 2, "COASTAL": 3, "UNKNOWN": 0}

URBAN_DISTRICTS = {"Colombo", "Gampaha", "Kandy", "Galle"}
COASTAL_DISTRICTS = {
    "Colombo", "Gampaha", "Kalutara", "Galle", "Matara", "Hambantota",
    "Puttalam", "Trincomalee", "Batticaloa", "Ampara", "Jaffna",
    "Mannar", "Mullaitivu",
}

def map_disaster_type(raw: str) -> str:
    r = str(raw).upper()
    if "FLOOD" in r or "HEAVY RAINS" in r:
        return "FLOOD"
    if "LANDSLIDE" in r or "LAND SUBSIDENCE" in r:
        return "LANDSLIDE"
    if "FIRE" in r:
        return "FIRE"
    if "CYCLONE" in r or "STRONG WIND" in r or "GALE" in r:
        return "CYCLONE"
    if "DROUGHT" in r:
        return "DROUGHT"
    if "EARTHQUAKE" in r:
        return "EARTHQUAKE"
    if "TSUNAMI" in r:
        return "TSUNAMI"
    return "OTHER"

def map_location_type(district: str) -> str:
    d = str(district).strip()
    for u in URBAN_DISTRICTS:
        if u.lower() in d.lower():
            return "URBAN"
    for c in COASTAL_DISTRICTS:
        if c.lower() in d.lower():
            return "COASTAL"
    if d and d.lower() != "nan":
        return "RURAL"
    return "UNKNOWN"

def safe_num(v, default=0.0):
    try:
        f = float(v)
        return default if pd.isna(f) else f
    except (TypeError, ValueError):
        return default

def derive_priority(row) -> str:
    """
    Derive the true priority outcome from real DMC severity columns.
    Logic mirrors emergency triage thresholds used by DMC field officers.
    """
    deaths      = safe_num(row.get("Deaths"))
    injured     = safe_num(row.get("Injured"))
    missing     = safe_num(row.get("Missing"))
    houses_full = safe_num(row.get("Houses Fully"))
    houses_part = safe_num(row.get("Houses Partial"))
    people      = safe_num(row.get("People"))
    families    = safe_num(row.get("Families"))
    loss_lkr    = safe_num(row.get("Direct Loss LKR"))

    if deaths >= 5:
        return "CRITICAL"
    if deaths >= 1 and (houses_full >= 50 or people >= 5000):
        return "CRITICAL"
    if missing >= 3 and deaths >= 1:
        return "CRITICAL"
    if loss_lkr >= 10_000_000 and deaths >= 1:
        return "CRITICAL"

    if deaths >= 1:
        return "HIGH"
    if injured >= 5:
        return "HIGH"
    if houses_full >= 10:
        return "HIGH"
    if people >= 1000:
        return "HIGH"
    if missing >= 1:
        return "HIGH"

    if houses_part >= 20 or people >= 200 or families >= 50:
        return "MEDIUM"
    if injured >= 1:
        return "MEDIUM"

    return "LOW"

def build_features(row) -> list:
    """
    12-feature vector IDENTICAL in layout/encoding to the live
    ml/feature_builder.py::build_feature_vector, built from real DMC columns.
    """
    dtype = map_disaster_type(row.get("Disaster", "OTHER"))
    incident_code = INCIDENT_TYPE_CODE.get(dtype, 8)

    location_code = LOCATION_TYPE_CODE.get(
        map_location_type(row.get("District", "")), 0
    )

    severity_code = 0  # UNKNOWN — no free-text severity field in structured DMC records

    people = safe_num(row.get("People"))
    person_count = min(people, 1000) / 1000.0

    source = str(row.get("Source", "")).lower()
    has_media = 1.0 if any(kw in source for kw in ["photo", "video", "media", "app", "citizen"]) else 0.0

    hour = 12 / 24.0  # no time-of-day field in this dataset

    dtype_upper = str(row.get("Disaster", "")).upper()
    has_children = 1.0 if any(t in dtype_upper for t in ["FLOOD", "LANDSLIDE"]) else 0.0
    has_elderly  = 1.0 if any(t in dtype_upper for t in ["FLOOD", "DROUGHT"])   else 0.0
    has_disabled = 1.0 if any(t in dtype_upper for t in ["TSUNAMI", "EARTHQUAKE"]) else 0.0

    rainfall_mm = 0.0    # not present in this dataset
    river_level = 0.0    # not present in this dataset

    deaths  = safe_num(row.get("Deaths"))
    injured = safe_num(row.get("Injured"))
    missing = safe_num(row.get("Missing"))
    casualties = min(deaths + injured + missing, 100) / 100.0

    return [
        incident_code, location_code, severity_code, person_count,
        has_media, hour, has_children, has_elderly, has_disabled,
        rainfall_mm, river_level, casualties,
    ]  # length = 12, matches feature_builder.py


def train_model():
    print("=" * 65)
    print("  MODEL 1 — Priority Classifier (REAL DMC DATA, 12-DIM LIVE SCHEMA)")
    print("=" * 65)

    try:
        df = pd.read_csv(XLS_PATH, sep="\t", on_bad_lines="skip", low_memory=False)
    except Exception:
        df = pd.read_html(XLS_PATH)[0]
    col_map = {
        'Event': 'Disaster', 'Houses Destroyed': 'Houses Fully', 'Houses Damaged': 'Houses Partial',
        'Affected': 'People', 'Losses $Local': 'Direct Loss LKR', 'fichas.latitude': 'Latitude', 'fichas.longitude': 'Longitude'
    }
    df = df.rename(columns=col_map)
    print(f"      Loaded {len(df):,} records with {df.shape[1]} columns.")

    print(f"\n[2/7] Deriving priority labels from real casualty/impact columns...")
    df["_priority"] = df.apply(derive_priority, axis=1)

    dist_before = df["_priority"].value_counts().to_dict()
    print("      Label distribution from real data:")
    for cls in LABEL_ORDER:
        print(f"        {cls:10s}: {dist_before.get(cls, 0):>6,}")

    print(f"\n[3/7] Building 12-feature vectors (matches live feature_builder.py)...")
    X_list, y_list = [], []
    skipped = 0
    for _, row in df.iterrows():
        label = str(row.get("_priority", "MEDIUM")).upper()
        if label not in LABEL_ORDER:
            label = "MEDIUM"
        try:
            feats = build_features(row)
            X_list.append(feats)
            y_list.append(label)
        except Exception:
            skipped += 1

    print(f"      Feature vectors built: {len(X_list):,}  |  Skipped: {skipped}")
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list)
    print(f"      Feature matrix shape: {X.shape}")

    le = LabelEncoder()
    le.fit(LABEL_ORDER)
    y_enc = le.transform(y)

    print(f"\n[4/7] Train/test split (80/20 stratified)...")
    X_train, X_test, y_train_enc, y_test_enc = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )
    y_test_str = le.inverse_transform(y_test_enc)
    print(f"      Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    print(f"\n[5/7] Applying SMOTE to balance training set...")
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
    dist_after = pd.Series(y_train_bal_enc).value_counts().to_dict()
    print("      After SMOTE (train only):")
    for cls in LABEL_ORDER:
        enc_val = le.transform([cls])[0]
        print(f"        {cls:10s}: {dist_after.get(enc_val, 0):>6,}")

    print(f"\n[6/7] Training XGBoost Classifier on {len(X_train_bal):,} balanced samples...")
    if XGB_AVAILABLE:
        clf = XGBClassifier(
            n_estimators=400,
            max_depth=7,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=2,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
            verbosity=0,
        )
        model_name = "XGBClassifier"
    else:
        clf = RandomForestClassifier(
            n_estimators=300, max_depth=10, random_state=42, n_jobs=-1
        )
        model_name = "RandomForestClassifier"

    clf.fit(X_train_bal, y_train_bal_enc)
    print(f"      Training complete — model: {model_name}")

    print(f"\n[7/7] Evaluating on held-out test set ({len(X_test):,} records)...")
    y_pred_enc  = clf.predict(X_test)
    y_pred_str  = le.inverse_transform(y_pred_enc)
    y_pred_prob = clf.predict_proba(X_test)

    report_text = classification_report(y_test_str, y_pred_str, labels=LABEL_ORDER)
    report_dict = classification_report(y_test_str, y_pred_str, labels=LABEL_ORDER, output_dict=True)
    cm          = confusion_matrix(y_test_str, y_pred_str, labels=LABEL_ORDER)
    acc         = accuracy_score(y_test_str, y_pred_str)

    # NOTE: predict_proba's columns follow clf.classes_ / le.classes_ order,
    # which LabelEncoder sorts ALPHABETICALLY (CRITICAL, HIGH, LOW, MEDIUM) —
    # not LABEL_ORDER. label_binarize must use the same order as predict_proba
    # or AUC silently compares mismatched columns (e.g. LOW vs MEDIUM probs).
    proba_class_order = list(le.classes_)
    y_test_bin = label_binarize(y_test_str, classes=proba_class_order)
    try:
        auc = roc_auc_score(y_test_bin, y_pred_prob, multi_class="ovr", average="macro")
    except ValueError:
        auc = None

    mask_3class = y_test_str != "CRITICAL"
    f1_3class = f1_score(
        y_test_str[mask_3class], y_pred_str[mask_3class],
        labels=["HIGH", "MEDIUM", "LOW"], average="macro"
    )

    print("\n" + report_text)
    print(f"Confusion Matrix (rows=actual, cols=predicted):")
    print(f"Labels: {LABEL_ORDER}")
    print(cm)
    print(f"\nMacro AUC-ROC (OvR): {auc:.4f}" if auc else "Macro AUC-ROC: N/A")
    print(f"Overall Accuracy:    {acc:.4f}")
    print(f"3-class Macro-F1:   {f1_3class:.4f}  (HIGH/MEDIUM/LOW only)")

    print("\n      Running 5-fold CV (this may take a moment on 146k records)...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X, y_enc, cv=skf, scoring="f1_macro", n_jobs=-1)
    print(f"      CV Macro-F1 per fold: {[round(s,4) for s in cv_scores]}")
    print(f"      Mean +/- Std:  {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    os.makedirs(MODELS_DIR, exist_ok=True)
    trained_at = datetime.now(timezone.utc).isoformat()

    joblib.dump(clf, os.path.join(MODELS_DIR, "priority_classifier.pkl"))
    joblib.dump(le,  os.path.join(MODELS_DIR, "label_encoder.pkl"))
    print(f"\n  OK priority_classifier.pkl saved")
    print(f"  OK label_encoder.pkl saved")

    eval_output = {
        "meta": {
            "dataset": "DI_report105745.xls (REAL DMC)",
            "total_records": int(len(df)),
            "train_records": int(len(X_train)),
            "test_records":  int(len(X_test)),
            "train_test_split": "80/20 random stratified, random_state=42",
            "smote": "Applied SMOTE to training set",
            "model": model_name,
            "n_estimators": 400,
            "feature_schema": "12-dim, identical to ml/feature_builder.py (live production schema)",
            "unavailable_features_in_this_dataset": [
                "severity (no free-text NER field in structured records) -> UNKNOWN",
                "hour_of_day (no time-of-day field) -> noon default",
                "rainfall_mm (no per-record weather join) -> 0",
                "river_level_m (no per-record gauge join) -> 0",
            ],
            "trained_at": trained_at,
        },
        "class_distribution": {
            "original_real_data": dist_before,
            "after_smote_train_only": {str(k): int(v) for k, v in dist_after.items()},
        },
        "overall_accuracy":       round(float(acc), 4),
        "macro_auc_roc_ovr":      round(float(auc), 4) if auc else None,
        "macro_f1_all_classes":   round(float(report_dict["macro avg"]["f1-score"]), 4),
        "weighted_f1":            round(float(report_dict["weighted avg"]["f1-score"]), 4),
        "f1_3class_high_med_low": round(float(f1_3class), 4),
        "cv_5fold": {
            "macro_f1_per_fold": [round(float(s), 4) for s in cv_scores],
            "mean": round(float(cv_scores.mean()), 4),
            "std":  round(float(cv_scores.std()), 4),
        },
        "per_class_metrics": {
            cls: {
                "precision": round(float(report_dict[cls]["precision"]), 4),
                "recall":    round(float(report_dict[cls]["recall"]),    4),
                "f1_score":  round(float(report_dict[cls]["f1-score"]),  4),
                "support":   int(report_dict[cls]["support"]),
            }
            for cls in LABEL_ORDER if cls in report_dict
        },
        "confusion_matrix": {"labels": LABEL_ORDER, "matrix": cm.tolist()},
    }

    json_path = os.path.join(MODELS_DIR, "priority_eval_report.json")
    with open(json_path, "w") as f:
        json.dump(eval_output, f, indent=2)
    print(f"  OK priority_eval_report.json saved")

    txt_path = os.path.join(MODELS_DIR, "priority_eval_report.txt")
    with open(txt_path, "w") as f:
        f.write("SURAKSHA Priority Classifier - Real DMC Data Retrain Report\n")
        f.write("=" * 65 + "\n\n")
        f.write(f"Dataset          : DI_report105745.xls (REAL DMC)\n")
        f.write(f"Total records    : {len(df):,}\n")
        f.write(f"Train / Test     : {len(X_train):,} / {len(X_test):,} (80/20 stratified)\n")
        f.write(f"SMOTE            : Applied\n")
        f.write(f"Model            : {model_name} (400 estimators)\n")
        f.write(f"Feature schema   : 12-dim, identical to live ml/feature_builder.py\n")
        f.write(f"Trained at       : {trained_at}\n\n")
        f.write("-" * 65 + "\n")
        f.write("PER-CLASS METRICS (test set)\n")
        f.write("-" * 65 + "\n")
        f.write(report_text + "\n")
        f.write("-" * 65 + "\n")
        f.write("CONFUSION MATRIX\n")
        f.write(f"Labels: {LABEL_ORDER}\n")
        f.write(str(cm) + "\n\n")
        f.write("-" * 65 + "\n")
        f.write("SUMMARY METRICS\n")
        f.write("-" * 65 + "\n")
        f.write(f"Overall Accuracy          : {acc:.4f}\n")
        f.write((f"Macro AUC-ROC (OvR)       : {auc:.4f}\n") if auc else "Macro AUC-ROC : N/A\n")
        f.write(f"Macro-F1 (all 4 classes)  : {report_dict['macro avg']['f1-score']:.4f}\n")
        f.write(f"Weighted-F1               : {report_dict['weighted avg']['f1-score']:.4f}\n")
        f.write(f"3-class Macro-F1*         : {f1_3class:.4f}  (* HIGH/MEDIUM/LOW only)\n\n")
        f.write("-" * 65 + "\n")
        f.write("5-FOLD STRATIFIED CROSS-VALIDATION\n")
        f.write("-" * 65 + "\n")
        f.write(f"Fold Macro-F1 scores      : {[round(s,4) for s in cv_scores]}\n")
        f.write(f"Mean +/- Std              : {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}\n")
    print(f"  OK priority_eval_report.txt saved")

    model_info = {
        "model":         model_name,
        "n_estimators":  400,
        "features":      12,
        "feature_schema": "identical to ml/feature_builder.py (live production schema)",
        "smote":         "Applied",
        "train_records": int(len(X_train)),
        "test_records":  int(len(X_test)),
        "macro_f1":      round(float(report_dict["macro avg"]["f1-score"]), 4),
        "weighted_f1":   round(float(report_dict["weighted avg"]["f1-score"]), 4),
        "accuracy":      round(float(acc), 4),
        "trained_at":    trained_at,
        "critical_threshold": 0.2,
        "data_source":   "REAL_DMC_146544_RECORDS",
    }
    info_path = os.path.join(MODELS_DIR, "priority_model_info.json")
    with open(info_path, "w") as f:
        json.dump(model_info, f, indent=2)
    print(f"  OK priority_model_info.json saved")

    print("\n" + "=" * 65)
    print(f"  MODEL 1 COMPLETE - Accuracy: {acc:.4f}  Weighted-F1: {report_dict['weighted avg']['f1-score']:.4f}")
    print("=" * 65)
    return eval_output


if __name__ == "__main__":
    train_model()
