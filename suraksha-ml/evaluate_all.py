import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, cohen_kappa_score

CSV_PATH = r"D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv"
df = pd.read_csv(CSV_PATH)

LABEL_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
# Numerical mapping for ordinal metrics
ORDINAL_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}

# Evaluate Ordinal Metrics
y_true_all = []
y_pred_all = []

# Load models
le = joblib.load(r"D:\Suraksha - Web App\suraksha-ml\models\label_encoder.pkl")
clf = joblib.load(r"D:\Suraksha - Web App\suraksha-ml\models\priority_classifier.pkl")

# Recreate the exact test set
import sys
sys.path.append(r"D:\Suraksha - Web App\suraksha-ml")
from training.train_priority_v2 import build_features

X_list = []
y_list = []
rows = []
for _, row in df.iterrows():
    label = str(row.get("Priority_Label", "MEDIUM")).upper()
    if label not in LABEL_ORDER: label = "MEDIUM"
    X_list.append(build_features(row))
    y_list.append(label)
    rows.append(row)

X = np.array(X_list, dtype=np.float32)
y = np.array(y_list)
y_enc = le.transform(y)

X_train, X_test, y_train_enc, y_test_enc, rows_train, rows_test = train_test_split(
    X, y_enc, rows, test_size=0.2, random_state=42, stratify=y_enc
)

y_test_str = le.inverse_transform(y_test_enc)
preds_enc = clf.predict(X_test)
preds_str = le.inverse_transform(preds_enc)
probs = clf.predict_proba(X_test)

# Ordinal metrics
y_test_ord = np.array([ORDINAL_MAP[l] for l in y_test_str])
preds_ord = np.array([ORDINAL_MAP[l] for l in preds_str])

qwk = cohen_kappa_score(y_test_ord, preds_ord, weights='quadratic')
linear_kappa = cohen_kappa_score(y_test_ord, preds_ord, weights='linear')
mace = np.mean(np.abs(y_test_ord - preds_ord))

diff = np.abs(y_test_ord - preds_ord)
adj_err = np.mean(diff == 1) * 100
two_err = np.mean(diff == 2) * 100
three_err = np.mean(diff == 3) * 100
under_triage = np.mean(preds_ord < y_test_ord) * 100
over_triage = np.mean(preds_ord > y_test_ord) * 100

print(f"=== 11. ORDINAL METRICS ===")
print(f"Quadratic Weighted Kappa: {qwk:.4f}")
print(f"Weighted Cohen's Kappa (linear): {linear_kappa:.4f}")
print(f"Mean Absolute Class Error: {mace:.4f}")
print(f"Adjacent-class errors: {adj_err:.1f}%")
print(f"2-level errors: {two_err:.1f}%")
print(f"3-level errors: {three_err:.1f}%")
print(f"Under-triage rate: {under_triage:.1f}%")
print(f"Over-triage rate: {over_triage:.1f}%")

# Critical-class safety analysis
print(f"\n=== 10. CRITICAL-CLASS SAFETY ANALYSIS ===")
from ml.uncertainty_triage import compute_uncertainty

crit_wrong_idx = [i for i, (t, p) in enumerate(zip(y_test_str, preds_str)) if t == 'CRITICAL' and p != 'CRITICAL']
total_crit_wrong = len(crit_wrong_idx)
crit_to_human = 0
crit_to_clarify = 0
crit_auto_accepted = 0

crit_to_high = sum(1 for i in crit_wrong_idx if preds_str[i] == 'HIGH')
crit_to_med = sum(1 for i in crit_wrong_idx if preds_str[i] == 'MEDIUM')
crit_to_low = sum(1 for i in crit_wrong_idx if preds_str[i] == 'LOW')

for i in crit_wrong_idx:
    row = rows_test[i]
    pred_prob = probs[i].max()
    res = compute_uncertainty(
        priority_confidence=pred_prob,
        category_confidence=pred_prob,
        text_length=150, 
        has_location=True,
        detected_language='en',
        language_confidence=0.9,
        urgency=preds_str[i],
        disaster_type=row.get('Incident_Type', 'UNKNOWN').upper(),
        modal_agreement=1.0,
        has_vulnerable=bool(row.get('Has_Children') or row.get('Has_Elderly') or row.get('Has_Disabled')),
        image_available=bool(row.get('Has_Photo_Evidence'))
    )
    if res['decision'] == 'ESCALATE_TO_HUMAN':
        crit_to_human += 1
    elif res['decision'] == 'REQUEST_CLARIFICATION':
        crit_to_clarify += 1
    else:
        crit_auto_accepted += 1

print(f"Total CRITICAL wrong: {total_crit_wrong}")
print(f"Routed to human review: {crit_to_human}")
print(f"Routed to clarification: {crit_to_clarify}")
print(f"Wrongly auto-accepted: {crit_auto_accepted}")
print(f"CRITICAL ERROR CAPTURE RATE: {((crit_to_human + crit_to_clarify) / total_crit_wrong * 100) if total_crit_wrong else 0:.1f}%")
print(f"CRITICAL AUTO-ACCEPTED ERROR RATE: {(crit_auto_accepted / total_crit_wrong * 100) if total_crit_wrong else 0:.1f}%")
print(f"CRITICAL -> HIGH: {crit_to_high}")
print(f"CRITICAL -> MEDIUM: {crit_to_med}")
print(f"CRITICAL -> LOW: {crit_to_low}")

# SPE BASELINE COMPARISON
print(f"\n=== 8. SPE UNCERTAINTY BASELINE COMPARISON ===")
# Generate results for SPE vs Max Prob vs Entropy vs Margin
# For simplicity, we just calculate the error capture at specific thresholds for Max Prob and SPE

def get_spe_decision(pred_prob, pred_class, row):
    res = compute_uncertainty(
        priority_confidence=pred_prob,
        category_confidence=pred_prob,
        text_length=150, 
        has_location=True,
        detected_language='en',
        language_confidence=0.9,
        urgency=pred_class,
        disaster_type=row.get('Incident_Type', 'UNKNOWN').upper(),
        modal_agreement=1.0,
        has_vulnerable=bool(row.get('Has_Children') or row.get('Has_Elderly') or row.get('Has_Disabled')),
        image_available=bool(row.get('Has_Photo_Evidence'))
    )
    return res['decision']

spe_decisions = [get_spe_decision(probs[i].max(), preds_str[i], rows_test[i]) for i in range(len(X_test))]
spe_auto_accepted = sum(1 for d in spe_decisions if d == 'AUTO_CLASSIFY')
spe_coverage = spe_auto_accepted / len(X_test)
total_wrong = sum(1 for t, p in zip(y_test_str, preds_str) if t != p)
spe_wrong_captured = sum(1 for i, (t, p) in enumerate(zip(y_test_str, preds_str)) if t != p and spe_decisions[i] != 'AUTO_CLASSIFY')

print(f"SPE Coverage: {spe_coverage*100:.1f}%")
print(f"SPE Error Capture %: {spe_wrong_captured / total_wrong * 100 if total_wrong else 0:.1f}%")

# Max Prob at exactly the same coverage
sorted_probs = sorted([p.max() for p in probs])
thresh_idx = int(len(X_test) * (1 - spe_coverage))
max_prob_thresh = sorted_probs[thresh_idx]
max_prob_wrong_captured = sum(1 for i, (t, p) in enumerate(zip(y_test_str, preds_str)) if t != p and probs[i].max() < max_prob_thresh)
print(f"Max Prob (Baseline 1) Error Capture at {spe_coverage*100:.1f}% Coverage: {max_prob_wrong_captured / total_wrong * 100 if total_wrong else 0:.1f}%")

# Margin at same coverage
margins = sorted([np.sort(p)[-1] - np.sort(p)[-2] for p in probs])
margin_thresh = margins[thresh_idx]
margin_wrong_captured = sum(1 for i, (t, p) in enumerate(zip(y_test_str, preds_str)) if t != p and (np.sort(probs[i])[-1] - np.sort(probs[i])[-2]) < margin_thresh)
print(f"Margin (Baseline 3) Error Capture at {spe_coverage*100:.1f}% Coverage: {margin_wrong_captured / total_wrong * 100 if total_wrong else 0:.1f}%")

