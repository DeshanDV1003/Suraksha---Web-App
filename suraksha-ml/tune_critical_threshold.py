import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score
from imblearn.over_sampling import SMOTE
import sys

sys.path.append(r'D:\Suraksha - Web App\suraksha-ml')
from training.train_priority_v2 import build_features, LABEL_ORDER

CSV_PATH = r'D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv'

def tune_critical_threshold():
    print("=== TUNING THRESHOLD FOR CRITICAL ERROR CAPTURE ===")
    df = pd.read_csv(CSV_PATH)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    n = len(df)
    train_idx = int(n * 0.70)
    cal_idx = int(n * 0.85)
    
    train_df = df.iloc[:train_idx]
    cal_df = df.iloc[train_idx:cal_idx]
    test_df = df.iloc[cal_idx:]
    
    def extract(split_df):
        X, y = [], []
        for _, row in split_df.iterrows():
            X.append(build_features(row))
            y.append(row["Priority_Label"])
        return np.array(X, dtype=np.float32), np.array(y)

    X_train, y_train = extract(train_df)
    X_cal, y_cal = extract(cal_df)
    X_test, y_test = extract(test_df)
    
    le = LabelEncoder()
    le.fit(LABEL_ORDER)
    y_train_enc = le.transform(y_train)
    
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
    
    clf = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf.fit(X_train_bal, y_train_bal_enc)
    
    # Base Test
    test_probs = clf.predict_proba(X_test)
    test_preds_enc = np.argmax(test_probs, axis=1)
    test_preds = le.inverse_transform(test_preds_enc)
    base_is_error = (y_test != test_preds)
    
    # Evaluate Critical/High Errors
    crit_high_mask = np.isin(y_test, ['CRITICAL', 'HIGH'])
    crit_high_errors = base_is_error & crit_high_mask
    total_crit_high_errors = np.sum(crit_high_errors)
    print(f"Total CRITICAL/HIGH errors in base test set: {total_crit_high_errors}")
    
    # Tuning on Calibration Set using Maximum Probability
    cal_probs = clf.predict_proba(X_cal)
    cal_max_probs = np.max(cal_probs, axis=1)
    
    # Test possible coverage targets to find the best tradeoff for CRITICAL capture
    test_max_probs = np.max(test_probs, axis=1)
    
    best_capture_rate = 0
    best_coverage = 0
    best_thresh = 0
    
    for coverage_target in [0.95, 0.90, 0.85, 0.80, 0.75, 0.70]:
        thresh = np.percentile(cal_max_probs, (1 - coverage_target) * 100)
        
        accept_mask = test_max_probs >= thresh
        coverage = np.mean(accept_mask)
        
        captured = np.sum(crit_high_errors & ~accept_mask)
        capture_rate = captured / total_crit_high_errors if total_crit_high_errors > 0 else 0
        
        print(f"Target Coverage {coverage_target*100:.0f}% -> Actual {coverage*100:.1f}% | Thresh: {thresh:.4f} | CRIT/HIGH Capture: {capture_rate*100:.1f}% ({captured}/{total_crit_high_errors})")
        
        if capture_rate > best_capture_rate and coverage >= 0.70:
            best_capture_rate = capture_rate
            best_coverage = coverage
            best_thresh = thresh
            
    print("\n=== OPTIMAL SAFETY THRESHOLD ===")
    print(f"Optimal Max-Prob Threshold: {best_thresh:.4f}")
    
    final_accept = test_max_probs >= best_thresh
    
    if np.sum(final_accept) > 0:
        acc_acc = accuracy_score(y_test[final_accept], test_preds[final_accept])
        acc_f1 = f1_score(y_test[final_accept], test_preds[final_accept], average='macro', labels=LABEL_ORDER)
    else:
        acc_acc, acc_f1 = 0, 0
        
    print(f"Resulting Coverage: {best_coverage*100:.1f}% (Review Rate: {(1-best_coverage)*100:.1f}%)")
    print(f"CRITICAL/HIGH Error Capture: {best_capture_rate*100:.1f}%")
    print(f"Accepted Accuracy: {acc_acc:.4f}")
    print(f"Accepted Macro-F1: {acc_f1:.4f}")

if __name__ == "__main__":
    tune_critical_threshold()
