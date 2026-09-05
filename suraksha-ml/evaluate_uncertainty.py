import os
import json
import pandas as pd
import numpy as np
import joblib
import math
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

# Ensure paths
import sys
sys.path.append(r"D:\Suraksha - Web App\suraksha-ml")

# --- PART 1: UNCERTAINTY EVALUATION ---
from ml.uncertainty_triage import compute_uncertainty

# Load dataset and model
CSV_PATH = r"D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v3.csv"
MODELS_DIR = r"D:\Suraksha - Web App\suraksha-ml\models"

df = pd.read_csv(CSV_PATH)

from training.train_priority_v2 import build_features, LABEL_ORDER

X_list, y_list, raw_rows = [], [], []
for _, row in df.iterrows():
    label = str(row.get("Priority_Label", "MEDIUM")).upper()
    if label not in LABEL_ORDER:
        label = "MEDIUM"
    X_list.append(build_features(row))
    y_list.append(label)
    raw_rows.append(row)

X = np.array(X_list, dtype=np.float32)
y = np.array(y_list)

le = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
y_enc = le.transform(y)

# Get exactly the test set used (random_state=42)
X_train, X_test, y_train_enc, y_test_enc, rows_train, rows_test = train_test_split(
    X, y_enc, raw_rows, test_size=0.2, random_state=42, stratify=y_enc
)

y_test_str = le.inverse_transform(y_test_enc)

clf = joblib.load(os.path.join(MODELS_DIR, "priority_classifier.pkl"))
probs = clf.predict_proba(X_test)
preds_enc = clf.predict(X_test)
preds_str = le.inverse_transform(preds_enc)

results = []
for i in range(len(X_test)):
    pred_prob = probs[i].max()
    pred_class = preds_str[i]
    true_class = y_test_str[i]
    row = rows_test[i]
    
    # We pass the XGBoost confidence as both priority and category confidence for the simulation
    res = compute_uncertainty(
        priority_confidence=pred_prob,
        category_confidence=pred_prob,
        text_length=150, # average
        has_location=True,
        detected_language=row.get('Report_Language', 'en')[:2].lower(),
        language_confidence=0.9,
        urgency=pred_class,
        disaster_type=row.get('Incident_Type', 'UNKNOWN').upper(),
        modal_agreement=1.0,
        has_vulnerable=bool(row.get('Has_Children') or row.get('Has_Elderly') or row.get('Has_Disabled')),
        image_available=bool(row.get('Has_Photo_Evidence')),
        true_label=true_class
    )
    
    results.append({
        'true_class': true_class,
        'pred_class': pred_class,
        'correct': true_class == pred_class,
        'pred_prob': pred_prob,
        'decision': res['decision'],
        'abstention_risk': res['abstention_risk']['abstention_risk'],
        'nll': res['research_metrics']['nll'],
        'brier': res['research_metrics']['brier_score'] if 'brier_score' in res['research_metrics'] else 0
    })

total_cases = len(results)
auto_accepted = sum(1 for r in results if r['decision'] == 'AUTO_CLASSIFY')
human_review = sum(1 for r in results if r['decision'] == 'ESCALATE_TO_HUMAN')
clarify = sum(1 for r in results if r['decision'] == 'REQUEST_CLARIFICATION')

auto_coverage = auto_accepted / total_cases * 100
review_rate = human_review / total_cases * 100

total_wrong = sum(1 for r in results if not r['correct'])
wrong_sent_to_review = sum(1 for r in results if not r['correct'] and r['decision'] in ['ESCALATE_TO_HUMAN', 'REQUEST_CLARIFICATION'])
error_capture_rate = wrong_sent_to_review / total_wrong * 100 if total_wrong > 0 else 0

acc_all = sum(1 for r in results if r['correct']) / total_cases
macro_f1_all = f1_score(y_test_str, preds_str, average='macro')

auto_correct = sum(1 for r in results if r['correct'] and r['decision'] == 'AUTO_CLASSIFY')
acc_auto = auto_correct / auto_accepted if auto_accepted > 0 else 0

y_test_auto = [r['true_class'] for r in results if r['decision'] == 'AUTO_CLASSIFY']
preds_auto = [r['pred_class'] for r in results if r['decision'] == 'AUTO_CLASSIFY']
macro_f1_auto = f1_score(y_test_auto, preds_auto, average='macro') if len(y_test_auto) > 0 else 0

print(f"PART 1 RESULTS")
print(f"TOTAL TEST CASES = {total_cases}")
print(f"AUTO-ACCEPTED = {auto_accepted}")
print(f"HUMAN REVIEW = {human_review}")
print(f"CLARIFICATION = {clarify}")
print(f"AUTOMATIC COVERAGE (%) = {auto_coverage:.1f}")
print(f"HUMAN REVIEW RATE (%) = {review_rate:.1f}")
print(f"TOTAL WRONG PREDICTIONS = {total_wrong}")
print(f"WRONG PREDICTIONS SENT FOR REVIEW = {wrong_sent_to_review}")
print(f"ERROR CAPTURE RATE (%) = {error_capture_rate:.1f}")
print(f"Accuracy of all model predictions = {acc_all:.4f}")
print(f"Macro-F1 before uncertainty filtering = {macro_f1_all:.4f}")
print(f"Accuracy on AUTO-ACCEPTED cases only = {acc_auto:.4f}")
print(f"Macro-F1 on AUTO-ACCEPTED cases only = {macro_f1_auto:.4f}")

# Threshold analysis (simulation)
print("\nTHRESHOLD ANALYSIS")
for thresh in [0.50, 0.60, 0.70, 0.80]:
    auto = sum(1 for r in results if r['pred_prob'] >= thresh)
    cov = auto / total_cases * 100
    rev = (total_cases - auto) / total_cases * 100
    wrong_cap = sum(1 for r in results if not r['correct'] and r['pred_prob'] < thresh)
    cap_pct = wrong_cap / total_wrong * 100 if total_wrong > 0 else 0
    auto_acc = sum(1 for r in results if r['correct'] and r['pred_prob'] >= thresh) / auto if auto > 0 else 0
    print(f"Threshold: {thresh} | Cov: {cov:.1f}% | Rev: {rev:.1f}% | Wrong Cap: {cap_pct:.1f}% | Auto Acc: {auto_acc:.4f}")

