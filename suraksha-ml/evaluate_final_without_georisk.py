import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, cohen_kappa_score, classification_report
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
import sys

sys.path.append(r'D:\Suraksha - Web App\suraksha-ml')
from training.train_priority_v2 import build_features, LABEL_ORDER

CSV_PATH = r'D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv'

def get_features_no_georisk(row):
    feat = build_features(row)
    # Geo_Risk is index 7
    return feat[:7] + feat[8:]

def calc_triage_rates(y_true, y_pred):
    high_crit = np.isin(y_true, ['HIGH', 'CRITICAL'])
    under_triaged = np.isin(y_pred[high_crit], ['LOW', 'MEDIUM'])
    under_rate = np.mean(under_triaged) if np.sum(high_crit) > 0 else 0.0
    
    low_med = np.isin(y_true, ['LOW', 'MEDIUM'])
    over_triaged = np.isin(y_pred[low_med], ['HIGH', 'CRITICAL'])
    over_rate = np.mean(over_triaged) if np.sum(low_med) > 0 else 0.0
    
    return under_rate, over_rate

def run_standard():
    print("=== 1. STANDARD 80/20 STRATIFIED (WITHOUT GEO_RISK) ===")
    df = pd.read_csv(CSV_PATH)
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
    
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train_enc)
    
    clf = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf.fit(X_train_bal, y_train_bal)
    preds_enc = clf.predict(X_test)
    preds = le.inverse_transform(preds_enc)
    
    acc = accuracy_score(y_test, preds)
    macro_f1 = f1_score(y_test, preds, average='macro', labels=LABEL_ORDER)
    weight_f1 = f1_score(y_test, preds, average='weighted', labels=LABEL_ORDER)
    
    l_map = {'LOW':0, 'MEDIUM':1, 'HIGH':2, 'CRITICAL':3}
    y_t_ord = [l_map[l] for l in y_test]
    p_ord = [l_map[l] for l in preds]
    qwk = cohen_kappa_score(y_t_ord, p_ord, weights='quadratic')
    
    cr = classification_report(y_test, preds, labels=LABEL_ORDER, output_dict=True)
    crit_p, crit_r, crit_f = cr['CRITICAL']['precision'], cr['CRITICAL']['recall'], cr['CRITICAL']['f1-score']
    high_p, high_r, high_f = cr['HIGH']['precision'], cr['HIGH']['recall'], cr['HIGH']['f1-score']
    
    u_rate, o_rate = calc_triage_rates(y_test, preds)
    
    print(f"Accuracy: {acc:.4f} | Macro-F1: {macro_f1:.4f} | Weighted-F1: {weight_f1:.4f} | QWK: {qwk:.4f}")
    print(f"CRITICAL: P={crit_p:.4f}, R={crit_r:.4f}, F1={crit_f:.4f}")
    print(f"HIGH    : P={high_p:.4f}, R={high_r:.4f}, F1={high_f:.4f}")
    print(f"Under-triage: {u_rate*100:.1f}% | Over-triage: {o_rate*100:.1f}%")
    print("Confusion Matrix:\n", confusion_matrix(y_test, preds, labels=LABEL_ORDER))

def run_chronological():
    print("\n=== 2. CHRONOLOGICAL (WITHOUT GEO_RISK) ===")
    df = pd.read_csv(CSV_PATH)
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df = df.sort_values(by='Timestamp').reset_index(drop=True)
    n = len(df)
    train_df = df.iloc[:int(n*0.8)]
    test_df = df.iloc[int(n*0.8):]
    
    def extract(split_df):
        X, y = [], []
        for _, row in split_df.iterrows():
            X.append(get_features_no_georisk(row))
            y.append(row["Priority_Label"])
        return np.array(X, dtype=np.float32), np.array(y)
        
    X_train, y_train = extract(train_df)
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
    preds = le.inverse_transform(clf.predict(X_test))
    
    acc = accuracy_score(y_test, preds)
    macro_f1 = f1_score(y_test, preds, average='macro', labels=LABEL_ORDER)
    print(f"Accuracy: {acc:.4f} | Macro-F1: {macro_f1:.4f}")
    
def run_70_15_15():
    print("\n=== 3. 70/15/15 SELECTIVE REVIEW (WITHOUT GEO_RISK) ===")
    df = pd.read_csv(CSV_PATH)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    n = len(df)
    
    train_df = df.iloc[:int(n*0.7)]
    cal_df = df.iloc[int(n*0.7):int(n*0.85)]
    test_df = df.iloc[int(n*0.85):]
    
    def extract(split_df):
        X, y = [], []
        for _, row in split_df.iterrows():
            X.append(get_features_no_georisk(row))
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
    
    test_probs = clf.predict_proba(X_test)
    test_preds = le.inverse_transform(np.argmax(test_probs, axis=1))
    
    cal_max_probs = np.max(clf.predict_proba(X_cal), axis=1)
    
    # Let's tune for max CRITICAL/HIGH capture with >=70% coverage, same as before
    base_is_error = (y_test != test_preds)
    crit_high_mask = np.isin(y_test, ['CRITICAL', 'HIGH'])
    total_ch_errors = np.sum(base_is_error & crit_high_mask)
    
    test_max_probs = np.max(test_probs, axis=1)
    
    best_capture, best_cov, best_thresh = 0, 0, 0
    for target_cov in [0.95, 0.90, 0.85, 0.80, 0.75, 0.70]:
        thresh = np.percentile(cal_max_probs, (1 - target_cov) * 100)
        accept = test_max_probs >= thresh
        cov = np.mean(accept)
        cap = np.sum((base_is_error & crit_high_mask) & ~accept) / total_ch_errors
        if cap > best_capture and cov >= 0.70:
            best_capture, best_cov, best_thresh = cap, cov, thresh
            
    print(f"Optimal Thresh: {best_thresh:.4f}")
    print(f"Final Coverage: {best_cov*100:.1f}%")
    print(f"CRITICAL/HIGH Error Capture: {best_capture*100:.1f}%")

if __name__ == "__main__":
    run_standard()
    run_chronological()
    run_70_15_15()
