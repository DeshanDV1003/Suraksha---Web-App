import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score
from imblearn.over_sampling import SMOTE
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from training.train_priority_v2 import build_features, LABEL_ORDER
except ImportError:
    pass

CSV_PATH = r"D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv"

def run_3way_eval():
    print("=== 3-WAY TRAIN/CALIBRATION/TEST EVALUATION ===")
    df = pd.read_csv(CSV_PATH)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # 70/15/15 Split
    n = len(df)
    train_idx = int(n * 0.70)
    cal_idx = int(n * 0.85)
    
    train_df = df.iloc[:train_idx]
    cal_df = df.iloc[train_idx:cal_idx]
    test_df = df.iloc[cal_idx:]
    
    print(f"Train Size: {len(train_df)} | Cal Size: {len(cal_df)} | Test Size: {len(test_df)}")
    
    # Build Features
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
    y_cal_enc = le.transform(y_cal)
    y_test_enc = le.transform(y_test)
    
    # SMOTE only on Train
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
    
    # Train Model
    clf = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf.fit(X_train_bal, y_train_bal_enc)
    
    # -----------------------------------------------------
    # CALIBRATION PHASE (Tuning Abstention Thresholds)
    # -----------------------------------------------------
    print("\n[CALIBRATION PHASE]")
    # We want to find thresholds that yield ~85% coverage
    target_coverage = 0.85
    
    # 1. Max Probability Baseline
    cal_probs = clf.predict_proba(X_cal)
    max_probs = np.max(cal_probs, axis=1)
    max_prob_thresh = np.percentile(max_probs, (1 - target_coverage) * 100)
    
    # 2. Predictive Entropy Baseline
    entropy = -np.sum(cal_probs * np.log(cal_probs + 1e-9), axis=1)
    entropy_thresh = np.percentile(entropy, target_coverage * 100) # Accept if entropy < thresh
    
    # 3. Margin Baseline
    sorted_probs = np.sort(cal_probs, axis=1)
    margin = sorted_probs[:, -1] - sorted_probs[:, -2]
    margin_thresh = np.percentile(margin, (1 - target_coverage) * 100)
    
    # -----------------------------------------------------
    # TEST PHASE (Untouched Evaluation)
    # -----------------------------------------------------
    print("\n[TEST PHASE]")
    test_probs = clf.predict_proba(X_test)
    test_preds_enc = np.argmax(test_probs, axis=1)
    test_preds = le.inverse_transform(test_preds_enc)
    
    print(f"Base Test Accuracy: {accuracy_score(y_test, test_preds):.4f}")
    
    def evaluate_abstention(name, accept_mask):
        coverage = np.mean(accept_mask)
        review_rate = 1.0 - coverage
        
        # Accepted accuracy
        if coverage > 0:
            accepted_y = y_test[accept_mask]
            accepted_preds = test_preds[accept_mask]
            acc = accuracy_score(accepted_y, accepted_preds)
            f1 = f1_score(accepted_y, accepted_preds, average='macro', labels=LABEL_ORDER)
        else:
            acc, f1 = 0, 0
            
        # Error Capture
        # Total errors in dataset
        is_error = (y_test != test_preds)
        total_errors = np.sum(is_error)
        
        # Errors routed to human review
        errors_captured = np.sum(is_error & ~accept_mask)
        capture_rate = errors_captured / total_errors if total_errors > 0 else 0
        
        print(f"\n{name} Baseline:")
        print(f"  Coverage       : {coverage*100:.1f}%")
        print(f"  Review Rate    : {review_rate*100:.1f}%")
        print(f"  Error Capture  : {capture_rate*100:.1f}% ({errors_captured}/{total_errors})")
        print(f"  Accepted Acc   : {acc:.4f}")
        print(f"  Accepted F1    : {f1:.4f}")

    # Evaluate Max Prob
    evaluate_abstention("Maximum Probability", np.max(test_probs, axis=1) >= max_prob_thresh)
    
    # Evaluate Entropy
    test_entropy = -np.sum(test_probs * np.log(test_probs + 1e-9), axis=1)
    evaluate_abstention("Predictive Entropy", test_entropy <= entropy_thresh)
    
    # Evaluate Margin
    test_sorted_probs = np.sort(test_probs, axis=1)
    test_margin = test_sorted_probs[:, -1] - test_sorted_probs[:, -2]
    evaluate_abstention("Top-Two Margin", test_margin >= margin_thresh)
    
    # Simulated SPE (For comparison)
    # Since SPE is expensive, we approximate it by adding small Gaussian noise to logits
    print("\nSPE Approximation:")
    np.random.seed(42)
    ensemble_preds = []
    # Logits trick
    p = np.clip(test_probs, 1e-9, 1 - 1e-9)
    logits = np.log(p / (1 - p))
    for _ in range(30):
        noisy_logits = logits + np.random.normal(0, 0.5, logits.shape)
        noisy_probs = np.exp(noisy_logits) / np.sum(np.exp(noisy_logits), axis=1, keepdims=True)
        ensemble_preds.append(noisy_probs)
    mean_probs = np.mean(ensemble_preds, axis=0)
    spe_entropy = -np.sum(mean_probs * np.log(mean_probs + 1e-9), axis=1)
    
    # SPE Cal threshold
    cal_p = np.clip(cal_probs, 1e-9, 1 - 1e-9)
    cal_logits = np.log(cal_p / (1 - cal_p))
    spe_cal_preds = []
    for _ in range(30):
        noisy_logits = cal_logits + np.random.normal(0, 0.5, cal_logits.shape)
        noisy_probs = np.exp(noisy_logits) / np.sum(np.exp(noisy_logits), axis=1, keepdims=True)
        spe_cal_preds.append(noisy_probs)
    spe_mean_cal_probs = np.mean(spe_cal_preds, axis=0)
    spe_cal_entropy = -np.sum(spe_mean_cal_probs * np.log(spe_mean_cal_probs + 1e-9), axis=1)
    spe_thresh = np.percentile(spe_cal_entropy, target_coverage * 100)
    
    evaluate_abstention("Stochastic Perturbation Ensemble (SPE)", spe_entropy <= spe_thresh)

if __name__ == "__main__":
    run_3way_eval()
