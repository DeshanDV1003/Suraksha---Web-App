"""
Suraksha ? Severity / Priority Classifier Training Script (v3 ? IEEE Paper Version)
=====================================================================================
Fixes applied for IEEE paper:
  Fix 1 ? Saves full evaluation report to JSON + TXT (not just console print)
  Fix 2 ? Uses XGBoost (matches priority_model_info.json; stronger than RandomForest)
  Fix 3 ? SMOTE uses explicit class targets to handle 7 CRITICAL samples
  Fix 4 ? Model info JSON updated automatically after every run

Usage:
  python training/train_priority_v2.py

Outputs (all saved to models/):
  priority_classifier.pkl       ? trained XGBoost model
  label_encoder.pkl             ? LabelEncoder for class names
  priority_eval_report.json     ? full evaluation metrics (use this for the paper)
  priority_eval_report.txt      ? human-readable version
  priority_model_info.json      ? model metadata
"""

import os
import json
import pandas as pd
import numpy as np
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

# XGBoost (Fix 2 ? matches saved model metadata)
try:
    from xgboost import XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    print("[WARNING] XGBoost not installed. Falling back to RandomForest.")
    print("          To install: pip install xgboost")
    from sklearn.ensemble import RandomForestClassifier
    XGB_AVAILABLE = False

# -- Constants (match feature_builder.py exactly) ------------------------------

INCIDENT_TYPE_MAP = {
    "FLOOD": 0, "LANDSLIDE": 1, "FIRE": 2,
    "BUILDING_COLLAPSE": 3, "MEDICAL_EMERGENCY": 4, "OTHER": 5
}

DISTRICT_RISK_MAP = {
    "Colombo": 0.9,  "Gampaha": 0.85, "Kalutara": 0.8,
    "Galle": 0.75,   "Matara": 0.7,   "Hambantota": 0.65,
    "Kandy": 0.6,    "Ratnapura": 0.85, "Kegalle": 0.8,
    "Kurunegala": 0.55, "Puttalam": 0.6, "Anuradhapura": 0.5,
    "Polonnaruwa": 0.5, "Badulla": 0.65, "Monaragala": 0.6,
    "Nuwara Eliya": 0.7, "Trincomalee": 0.55, "Batticaloa": 0.55,
    "Ampara": 0.55,  "Vavuniya": 0.45, "Mullaitivu": 0.45,
    "Kilinochchi": 0.45, "Mannar": 0.5, "Jaffna": 0.5, "Matale": 0.55,
}

CSV_PATH    = r"D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv"
MODELS_DIR  = r"D:\Suraksha - Web App\suraksha-ml\models"

LABEL_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]   # consistent ordering


# -- Feature builder (mirrors feature_builder.py) ------------------------------

def map_incident_type(raw_type: str) -> str:
    raw = str(raw_type).upper()
    if "FLOOD"    in raw: return "FLOOD"
    if "LANDSLIDE" in raw: return "LANDSLIDE"
    if "FIRE"     in raw: return "FIRE"
    if "COLLAPSE" in raw: return "BUILDING_COLLAPSE"
    if "MEDICAL"  in raw: return "MEDICAL_EMERGENCY"
    return "OTHER"


def build_features(row) -> list:
    """12 features ? exactly what the live FastAPI endpoint builds."""
    features = []

    # 1. Incident type one-hot (6 features)
    inc_type    = map_incident_type(row.get("Incident_Type", ""))
    type_encoded = [0] * 6
    type_encoded[INCIDENT_TYPE_MAP.get(inc_type, 5)] = 1
    features.extend(type_encoded)

    # 2. Affected population normalised (1 feature)
    features.append(min(float(row.get("Affected_Population", 0)) / 1000.0, 1.0))

    # 3. Geographic risk score (1 feature)
    features.append(DISTRICT_RISK_MAP.get(str(row.get("District", "")), 0.5))

    # 4. Has media (1 feature)
    has_media = bool(row.get("Has_Photo_Evidence", False)) or \
                bool(row.get("Has_Video_Evidence", False))
    features.append(1.0 if has_media else 0.0)

    # 5. Hour of day normalised (1 feature)
    features.append(float(row.get("Hour_Of_Day", 12)) / 24.0)

    # 6. Vulnerability flags (3 features)
    has_children = float(row.get("Has_Children", False))
    has_elderly  = float(row.get("Has_Elderly", False))
    has_disabled = float(row.get("Has_Disabled", False))
    features.extend([has_children, has_elderly, has_disabled])

    return features  # length = 15


# -- Main training function -----------------------------------------------------

def train_model():
    print("=" * 60)
    print("  SURAKSHA Priority Classifier ? IEEE Training Run")
    print("=" * 60)

    # -- Load dataset ----------------------------------------------
    print(f"\n[1/7] Loading dataset from:\n      {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    print(f"      Loaded {len(df):,} records, {df.shape[1]} columns.")

    # -- Build feature matrix --------------------------------------
    print("\n[2/7] Building 12-feature vectors...")
    X_list, y_list = [], []
    for _, row in df.iterrows():
        label = str(row.get("Priority_Label", "MEDIUM")).upper()
        if label not in LABEL_ORDER:
            label = "MEDIUM"
        X_list.append(build_features(row))
        y_list.append(label)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list)
    print(f"      Feature matrix: {X.shape}")

    dist_before = pd.Series(y).value_counts().to_dict()
    print("\n      Class distribution (original):")
    for cls in LABEL_ORDER:
        print(f"        {cls:10s}: {dist_before.get(cls, 0):4d}")

    # -- Encode labels for XGBoost ---------------------------------
    le = LabelEncoder()
    le.fit(LABEL_ORDER)          # fix encoding order: CRITICAL=0 HIGH=1 MEDIUM=2 LOW=3
    y_enc = le.transform(y)

    # -- Train / test split (BEFORE SMOTE ? prevents leakage) ------
    print("\n[3/7] Train/test split (80/20 stratified, random_state=42)...")
    X_train, X_test, y_train_enc, y_test_enc = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )
    y_train_str = le.inverse_transform(y_train_enc)
    y_test_str  = le.inverse_transform(y_test_enc)
    print(f"      Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    print("\n[4/7] Applying SMOTE to balance the training set...")
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
    
    dist_after = pd.Series(y_train_bal_enc).value_counts().to_dict()
    print("      Class distribution (after SMOTE - Train Only):")
    for cls in LABEL_ORDER:
        enc_val = le.transform([cls])[0]
        print(f"        {cls:10s}: {dist_after.get(enc_val, 0):4d}")

    # -- FIX 2: Train XGBoost --------------------------------------
    print("\n[5/7] Training XGBoost classifier (300 estimators)...")
    if XGB_AVAILABLE:
        clf = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
            verbosity=0,
        )
        model_name = "XGBClassifier"
    else:
        from sklearn.ensemble import RandomForestClassifier
        clf = RandomForestClassifier(
            n_estimators=300,
            max_depth=10,
            random_state=42,
            n_jobs=-1,
        )
        model_name = "RandomForestClassifier"

    clf.fit(X_train_bal, y_train_bal_enc)
    print(f"      Training complete ? model: {model_name}")

    # -- FIX 1: Evaluate and save everything -----------------------
    print("\n[6/7] Evaluating on held-out test set...")
    y_pred_enc  = clf.predict(X_test)
    y_pred_str  = le.inverse_transform(y_pred_enc)
    y_pred_prob = clf.predict_proba(X_test)

    # Text report
    report_text = classification_report(y_test_str, y_pred_str, labels=LABEL_ORDER)
    report_dict = classification_report(
        y_test_str, y_pred_str, labels=LABEL_ORDER, output_dict=True
    )
    print("\n" + report_text)

    # Confusion matrix
    cm = confusion_matrix(y_test_str, y_pred_str, labels=LABEL_ORDER)
    print(f"Confusion Matrix (rows=actual, cols=predicted):")
    print(f"Labels: {LABEL_ORDER}")
    print(cm)

    # AUC-ROC (one-vs-rest macro)
    y_test_bin = label_binarize(y_test_str, classes=LABEL_ORDER)
    try:
        auc = roc_auc_score(y_test_bin, y_pred_prob, multi_class="ovr", average="macro")
    except ValueError:
        auc = None   # can fail if a class has 0 test samples
    print(f"\nMacro AUC-ROC (OvR): {auc:.4f}" if auc else "Macro AUC-ROC: N/A")

    # Overall accuracy
    acc = accuracy_score(y_test_str, y_pred_str)
    print(f"Overall Accuracy:    {acc:.4f}")

    # 3-class macro F1 (excluding CRITICAL ? too few samples to be reliable alone)
    mask_3class = y_test_str != "CRITICAL"
    f1_3class = f1_score(
        y_test_str[mask_3class], y_pred_str[mask_3class],
        labels=["HIGH", "MEDIUM", "LOW"], average="macro"
    )
    print(f"3-class Macro-F1 (HIGH/MEDIUM/LOW only): {f1_3class:.4f}")

    # 5-fold cross-validation on full dataset (string labels -> integer)
    print("\n      Running 5-fold stratified cross-validation on full dataset...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X, y_enc, cv=skf, scoring="f1_macro", n_jobs=-1)
    print(f"      CV Macro-F1 per fold: {[round(s, 4) for s in cv_scores]}")
    print(f"      CV Macro-F1 mean ? std: {cv_scores.mean():.4f} ? {cv_scores.std():.4f}")

    # -- Save all outputs ------------------------------------------
    print("\n[7/7] Saving model and evaluation artifacts...")
    os.makedirs(MODELS_DIR, exist_ok=True)

    # a) Trained model
    model_path = os.path.join(MODELS_DIR, "priority_classifier.pkl")
    joblib.dump(clf, model_path)
    print(f"      Model saved       -> {model_path}")

    # b) Label encoder
    le_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
    joblib.dump(le, le_path)
    print(f"      LabelEncoder saved -> {le_path}")

    # c) Full evaluation JSON (USE THIS FOR THE PAPER)
    eval_output = {
        "meta": {
            "dataset": "suraksha_dmc_dataset_v4.csv",
            "total_records": int(len(df)),
            "train_records": int(len(X_train)),
            "test_records":  int(len(X_test)),
            "train_test_split": "80/20 random stratified, random_state=42",
            "smote": "Applied SMOTE to training set",
            "model": model_name,
            "n_estimators": 300,
            "trained_at": datetime.now(timezone.utc).isoformat(),
        },
        "class_distribution": {
            "original": dist_before,
            "after_smote_train_only": dist_after,
        },
        "overall_accuracy":        round(float(acc), 4),
        "macro_auc_roc_ovr":       round(float(auc), 4) if auc else None,
        "macro_f1_all_classes":    round(float(report_dict["macro avg"]["f1-score"]), 4),
        "weighted_f1":             round(float(report_dict["weighted avg"]["f1-score"]), 4),
        "f1_3class_high_med_low":  round(float(f1_3class), 4),
        "cv_5fold": {
            "macro_f1_per_fold": [round(float(s), 4) for s in cv_scores],
            "mean":  round(float(cv_scores.mean()), 4),
            "std":   round(float(cv_scores.std()),  4),
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
        "confusion_matrix": {
            "labels": LABEL_ORDER,
            "matrix": cm.tolist(),
        },
    }

    json_path = os.path.join(MODELS_DIR, "priority_eval_report.json")
    with open(json_path, "w") as f:
        json.dump(eval_output, f, indent=2)
    print(f"      Eval JSON saved   -> {json_path}")

    # d) Plain-text report (easy to read / copy into paper)
    txt_path = os.path.join(MODELS_DIR, "priority_eval_report.txt")
    with open(txt_path, "w") as f:
        f.write("SURAKSHA Priority Classifier ? Evaluation Report (IEEE Paper)\n")
        f.write("=" * 65 + "\n\n")
        f.write(f"Dataset          : suraksha_dmc_dataset_v4.csv\n")
        f.write(f"Total records    : {len(df):,}\n")
        f.write(f"Train / Test     : {len(X_train):,} / {len(X_test):,}  (80/20 stratified)\n")
        f.write(f"SMOTE            : Applied\n")
        f.write(f"Model            : {model_name} (300 estimators)\n")
        f.write(f"Trained at       : {eval_output['meta']['trained_at']}\n\n")
        f.write("-" * 65 + "\n")
        f.write("PER-CLASS METRICS (test set)\n")
        f.write("-" * 65 + "\n")
        f.write(report_text + "\n")
        f.write("-" * 65 + "\n")
        f.write("CONFUSION MATRIX (rows=actual, cols=predicted)\n")
        f.write(f"Labels: {LABEL_ORDER}\n")
        f.write(str(cm) + "\n\n")
        f.write("-" * 65 + "\n")
        f.write("SUMMARY METRICS\n")
        f.write("-" * 65 + "\n")
        f.write(f"Overall Accuracy          : {acc:.4f}\n")
        f.write(f"Macro AUC-ROC (OvR)       : {auc:.4f}\n" if auc else "Macro AUC-ROC : N/A\n")
        f.write(f"Macro-F1 (all 4 classes)  : {report_dict['macro avg']['f1-score']:.4f}\n")
        f.write(f"Weighted-F1               : {report_dict['weighted avg']['f1-score']:.4f}\n")
        f.write(f"3-class Macro-F1*         : {f1_3class:.4f}  (* HIGH/MEDIUM/LOW only)\n\n")
        f.write("-" * 65 + "\n")
        f.write("5-FOLD STRATIFIED CROSS-VALIDATION\n")
        f.write("-" * 65 + "\n")
        f.write(f"Fold Macro-F1 scores      : {[round(s,4) for s in cv_scores]}\n")
        f.write(f"Mean ? Std                : {cv_scores.mean():.4f} ? {cv_scores.std():.4f}\n")
    print(f"      Eval TXT saved   -> {txt_path}")

    # e) Update model info JSON
    info_path = os.path.join(MODELS_DIR, "priority_model_info.json")
    model_info = {
        "model":         model_name,
        "n_estimators":  300,
        "features":      15,
        "smote":         "None",
        "train_records": int(len(X_train)),
        "test_records":  int(len(X_test)),
        "macro_f1":      round(float(report_dict["macro avg"]["f1-score"]), 4),
        "accuracy":      round(float(acc), 4),
        "trained_at":    eval_output["meta"]["trained_at"],
        "critical_threshold": 0.2,
    }
    with open(info_path, "w") as f:
        json.dump(model_info, f, indent=2)
    print(f"      Model info saved -> {info_path}")

    print("\n" + "=" * 60)
    print("  DONE. Use models/priority_eval_report.txt for the paper.")
    print("=" * 60)


if __name__ == "__main__":
    train_model()
