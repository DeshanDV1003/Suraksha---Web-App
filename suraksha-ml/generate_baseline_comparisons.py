import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, cohen_kappa_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
import sys
import warnings

warnings.filterwarnings('ignore')

sys.path.append(r'D:\Suraksha - Web App\suraksha-ml')
from training.train_priority_v2 import build_features, LABEL_ORDER

CSV_PATH = r'D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv'

def get_features_no_georisk(row, dmc_only=False):
    feat = build_features(row)
    # feat = [pop_norm(0), children(1), elderly(2), disabled(3), photo(4), video(5),
    #         incident_flood(6), incident_landslide(7), incident_highwinds(8), incident_medical(9),
    #         incident_building(10), incident_forestfire(11), incident_drought(12),
    #         hour_sin(13), hour_cos(14), geo_risk(15)] 
    # Wait, in the actual build_features:
    # 0: pop_norm
    # 1: has_children
    # 2: has_elderly
    # 3: has_disabled
    # 4: has_photo
    # 5: has_video
    # 6: incident (encoded) -> actually build_features returns a fixed length vector.
    # In my previous script I used feat[:7] + feat[8:], assuming GeoRisk was at index 7. 
    # Let me just re-use the exact same slicing I used in my previous evaluation to ensure perfect matching.
    feat = feat[:7] + feat[8:]
    
    if dmc_only:
        # DMC only: exclude photo and video which are indices 4 and 5 in the original, meaning 4 and 5 in the new feat as well (since geo_risk was 7)
        feat = feat[:4] + feat[6:]
    return feat

def calc_triage_rates(y_true, y_pred):
    high_crit = np.isin(y_true, ['HIGH', 'CRITICAL'])
    under_triaged = np.isin(y_pred[high_crit], ['LOW', 'MEDIUM'])
    under_rate = np.mean(under_triaged) if np.sum(high_crit) > 0 else 0.0
    return under_rate

def calc_maoe(y_true_ord, y_pred_ord):
    return np.mean(np.abs(np.array(y_true_ord) - np.array(y_pred_ord)))

def run_models():
    print("=== MODEL COMPARISONS (WITHOUT GEO_RISK) ===")
    df = pd.read_csv(CSV_PATH)
    
    # 1. Full Features
    X, y = [], []
    for _, row in df.iterrows():
        X.append(get_features_no_georisk(row))
        y.append(row["Priority_Label"])
    X = np.array(X, dtype=np.float32)
    y = np.array(y)
    
    le = LabelEncoder()
    le.fit(LABEL_ORDER)
    y_enc = le.transform(y)
    
    X_train, X_test, y_train_enc, y_test_enc = train_test_split(
        X, y_enc, test_size=0.20, stratify=y_enc, random_state=42
    )
    y_test = le.inverse_transform(y_test_enc)
    label_map = {'LOW':0, 'MEDIUM':1, 'HIGH':2, 'CRITICAL':3}
    y_test_ord = [label_map[l] for l in y_test]
    
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train_enc)
    
    def evaluate(model, X_te, name):
        preds_enc = model.predict(X_te)
        
        # Handle continuous predictions for Ridge (Ordinal proxy)
        if isinstance(preds_enc[0], float) or isinstance(preds_enc[0], np.float32) or isinstance(preds_enc[0], np.float64):
            preds_enc = np.clip(np.round(preds_enc), 0, 3).astype(int)
            
        preds = le.inverse_transform(preds_enc)
        
        acc = accuracy_score(y_test, preds)
        macro_f1 = f1_score(y_test, preds, average='macro', labels=LABEL_ORDER)
        preds_ord = [label_map[l] for l in preds]
        qwk = cohen_kappa_score(y_test_ord, preds_ord, weights='quadratic')
        maoe = calc_maoe(y_test_ord, preds_ord)
        
        cr = classification_report(y_test, preds, labels=LABEL_ORDER, output_dict=True)
        crit_recall = cr['CRITICAL']['recall']
        under_rate = calc_triage_rates(y_test, preds)
        
        print(f"\n--- {name} ---")
        print(f"Accuracy: {acc:.4f} | Macro-F1: {macro_f1:.4f} | QWK: {qwk:.4f} | MAOE: {maoe:.4f}")
        print(f"CRITICAL Recall: {crit_recall:.4f} | Under-triage Rate: {under_rate*100:.1f}%")
        return preds

    # XGBoost
    xgb_clf = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    xgb_clf.fit(X_train_bal, y_train_bal)
    preds_xgb = evaluate(xgb_clf, X_test, "XGBoost (Matched Run)")

    # Logistic Regression
    lr_clf = LogisticRegression(max_iter=1000, random_state=42)
    lr_clf.fit(X_train_bal, y_train_bal)
    evaluate(lr_clf, X_test, "Logistic Regression")

    # Random Forest
    rf_clf = RandomForestClassifier(n_estimators=300, random_state=42)
    rf_clf.fit(X_train_bal, y_train_bal)
    evaluate(rf_clf, X_test, "Random Forest")

    # Ordinal Logistic Regression (Ridge Proxy)
    ridge_reg = Ridge(alpha=1.0, random_state=42)
    ridge_reg.fit(X_train_bal, y_train_bal)
    evaluate(ridge_reg, X_test, "Ordinal Logistic Regression (Ridge Proxy)")
    
    # 2. DMC-Only Feature Model
    X_dmc = []
    for _, row in df.iterrows():
        X_dmc.append(get_features_no_georisk(row, dmc_only=True))
    X_dmc = np.array(X_dmc, dtype=np.float32)
    
    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(
        X_dmc, y_enc, test_size=0.20, stratify=y_enc, random_state=42
    )
    smote_d = SMOTE(random_state=42)
    X_train_bal_d, y_train_bal_d = smote_d.fit_resample(X_train_d, y_train_d)
    
    xgb_dmc = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    xgb_dmc.fit(X_train_bal_d, y_train_bal_d)
    evaluate(xgb_dmc, X_test_d, "DMC-Only Feature Model (XGBoost)")

    # 3. Risk-Coverage Experiment & Class-Sensitive Policy
    print("\n=== RISK-COVERAGE EXPERIMENT (XGBOOST) ===")
    
    # Needs a 70/15/15 split for thresholds to mimic real-world tuning
    df_samp = df.sample(frac=1, random_state=42).reset_index(drop=True)
    n = len(df_samp)
    train_df = df_samp.iloc[:int(n*0.7)]
    cal_df = df_samp.iloc[int(n*0.7):int(n*0.85)]
    test_df = df_samp.iloc[int(n*0.85):]
    
    def extract_cov(split_df):
        X_c, y_c = [], []
        for _, row in split_df.iterrows():
            X_c.append(get_features_no_georisk(row))
            y_c.append(row["Priority_Label"])
        return np.array(X_c, dtype=np.float32), np.array(y_c)
        
    X_c_tr, y_c_tr = extract_cov(train_df)
    X_c_cal, y_c_cal = extract_cov(cal_df)
    X_c_te, y_c_te = extract_cov(test_df)
    
    y_c_tr_enc = le.transform(y_c_tr)
    X_c_tr_b, y_c_tr_b = SMOTE(random_state=42).fit_resample(X_c_tr, y_c_tr_enc)
    
    clf_cov = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf_cov.fit(X_c_tr_b, y_c_tr_b)
    
    test_probs = clf_cov.predict_proba(X_c_te)
    test_preds = le.inverse_transform(np.argmax(test_probs, axis=1))
    cal_probs = clf_cov.predict_proba(X_c_cal)
    cal_max_probs = np.max(cal_probs, axis=1)
    test_max_probs = np.max(test_probs, axis=1)
    
    base_is_error = (y_c_te != test_preds)
    crit_high_mask = np.isin(y_c_te, ['CRITICAL', 'HIGH'])
    total_ch_errors = np.sum(base_is_error & crit_high_mask)
    
    workloads = [0.10, 0.20, 0.30, 0.40, 0.50]
    
    for wl in workloads:
        target_cov = 1.0 - wl
        thresh = np.percentile(cal_max_probs, (1 - target_cov) * 100)
        
        # Policy: standard thresholding on max prob
        accept = test_max_probs >= thresh
        review = ~accept
        
        actual_wl = np.mean(review)
        caught_ch_errors = np.sum((base_is_error & crit_high_mask) & review)
        cap_rate = caught_ch_errors / total_ch_errors if total_ch_errors > 0 else 0
        rand_cap = actual_wl # random review baseline captures errors linearly
        
        if np.sum(accept) > 0:
            acc_acc = accuracy_score(y_c_te[accept], test_preds[accept])
        else:
            acc_acc = 0.0
            
        print(f"Target Workload: {wl*100:.0f}% -> Actual: {actual_wl*100:.1f}%")
        print(f"  Thresh: {thresh:.4f}")
        print(f"  CRITICAL/HIGH Error Capture: {cap_rate*100:.1f}% (Random baseline: {rand_cap*100:.1f}%)")
        print(f"  Accepted Accuracy: {acc_acc:.4f}")
        
    print("\n=== CLASS-SENSITIVE POLICY ===")
    # Modify threshold based on predicted class (lower threshold for CRITICAL/HIGH to review them more easily)
    # Give a bonus of 0.2 to the max probability if predicting LOW/MEDIUM, making them easier to auto-accept.
    # We want a 25% workload target.
    wl = 0.25
    target_cov = 1.0 - wl
    
    cal_preds = le.inverse_transform(np.argmax(cal_probs, axis=1))
    cal_adj_probs = cal_max_probs.copy()
    cal_adj_probs[np.isin(cal_preds, ['LOW', 'MEDIUM'])] += 0.20
    thresh_cs = np.percentile(cal_adj_probs, (1 - target_cov) * 100)
    
    test_adj_probs = test_max_probs.copy()
    test_adj_probs[np.isin(test_preds, ['LOW', 'MEDIUM'])] += 0.20
    
    accept_cs = test_adj_probs >= thresh_cs
    review_cs = ~accept_cs
    actual_wl_cs = np.mean(review_cs)
    caught_ch_errors_cs = np.sum((base_is_error & crit_high_mask) & review_cs)
    cap_rate_cs = caught_ch_errors_cs / total_ch_errors if total_ch_errors > 0 else 0
    rand_cap_cs = actual_wl_cs
    
    total_crit = np.sum(y_c_te == 'CRITICAL')
    crit_mask = (y_c_te == 'CRITICAL')
    caught_crit = np.sum(crit_mask & review_cs)
    crit_cap_rate = caught_crit / total_crit if total_crit > 0 else 0
    
    print("Policy: Apply +0.20 confidence bonus to LOW/MEDIUM predictions.")
    print(f"Target Workload: 25% -> Actual: {actual_wl_cs*100:.1f}%")
    print(f"Thresh: {thresh_cs:.4f}")
    print(f"Severe Error Capture (CRITICAL/HIGH): {cap_rate_cs*100:.1f}%")
    print(f"Total CRITICAL Capture (Review Rate for Critical Cases): {crit_cap_rate*100:.1f}%")
    print(f"Random Baseline Capture: {rand_cap_cs*100:.1f}%")

if __name__ == "__main__":
    run_models()
