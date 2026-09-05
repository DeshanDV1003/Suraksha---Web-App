import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, cohen_kappa_score, recall_score
from imblearn.over_sampling import SMOTE
import sys

sys.path.append(r'D:\Suraksha - Web App\suraksha-ml')
from training.train_priority_v2 import build_features, LABEL_ORDER

CSV_PATH = r'D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv'

def calculate_under_triage(y_true, y_pred):
    # Under-triage: true HIGH/CRITICAL predicted as LOW/MEDIUM
    high_crit_mask = np.isin(y_true, ['HIGH', 'CRITICAL'])
    if np.sum(high_crit_mask) == 0: return 0.0
    under_triaged = np.isin(y_pred[high_crit_mask], ['LOW', 'MEDIUM'])
    return np.mean(under_triaged)

def run_ablation():
    print("=== GEO_RISK ABLATION EXPERIMENT ===")
    df = pd.read_csv(CSV_PATH)
    
    X_A, X_B, y = [], [], []
    for _, row in df.iterrows():
        feat = build_features(row)
        X_A.append(feat)  # Model A: All features
        # Geo_Risk is at index 7 in build_features
        # Incident_Type(6) [0-5], Affected(1) [6], Geo_Risk(1) [7]
        feat_B = feat[:7] + feat[8:]
        X_B.append(feat_B) # Model B: Without Geo_Risk
        y.append(row["Priority_Label"])
        
    X_A = np.array(X_A, dtype=np.float32)
    X_B = np.array(X_B, dtype=np.float32)
    y = np.array(y)
    
    le = LabelEncoder()
    le.fit(LABEL_ORDER)
    y_enc = le.transform(y)
    
    # 80/20 Stratified (simulated via sample/split for exact match)
    from sklearn.model_selection import train_test_split
    X_A_train, X_A_test, X_B_train, X_B_test, y_train, y_test = train_test_split(
        X_A, X_B, y_enc, test_size=0.20, stratify=y_enc, random_state=42
    )
    y_test_labels = le.inverse_transform(y_test)
    
    # Model A
    smote_A = SMOTE(random_state=42)
    X_A_train_bal, y_A_train_bal = smote_A.fit_resample(X_A_train, y_train)
    clf_A = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf_A.fit(X_A_train_bal, y_A_train_bal)
    preds_A_enc = clf_A.predict(X_A_test)
    preds_A = le.inverse_transform(preds_A_enc)
    
    # Model B
    smote_B = SMOTE(random_state=42)
    X_B_train_bal, y_B_train_bal = smote_B.fit_resample(X_B_train, y_train)
    clf_B = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf_B.fit(X_B_train_bal, y_B_train_bal)
    preds_B_enc = clf_B.predict(X_B_test)
    preds_B = le.inverse_transform(preds_B_enc)
    
    def report(name, preds):
        acc = accuracy_score(y_test_labels, preds)
        macro_f1 = f1_score(y_test_labels, preds, average='macro', labels=LABEL_ORDER)
        weighted_f1 = f1_score(y_test_labels, preds, average='weighted', labels=LABEL_ORDER)
        
        # QWK requires ordered encoding
        label_map = {'LOW':0, 'MEDIUM':1, 'HIGH':2, 'CRITICAL':3}
        y_test_ord = [label_map[l] for l in y_test_labels]
        preds_ord = [label_map[l] for l in preds]
        qwk = cohen_kappa_score(y_test_ord, preds_ord, weights='quadratic')
        
        # Per-class metrics
        from sklearn.metrics import classification_report
        cr = classification_report(y_test_labels, preds, labels=LABEL_ORDER, output_dict=True)
        crit_recall = cr['CRITICAL']['recall']
        high_recall = cr['HIGH']['recall']
        
        ut_rate = calculate_under_triage(y_test_labels, preds)
        
        print(f"\n--- {name} ---")
        print(f"Accuracy     : {acc:.4f}")
        print(f"Macro-F1     : {macro_f1:.4f}")
        print(f"Weighted-F1  : {weighted_f1:.4f}")
        print(f"QWK          : {qwk:.4f}")
        print(f"CRITICAL Rec : {crit_recall:.4f}")
        print(f"HIGH Recall  : {high_recall:.4f}")
        print(f"Under-triage : {ut_rate:.4f}")
        print("Confusion Matrix:")
        print(confusion_matrix(y_test_labels, preds, labels=LABEL_ORDER))
        return acc, macro_f1
        
    acc_A, f1_A = report("Model A (WITH Geo_Risk)", preds_A)
    acc_B, f1_B = report("Model B (WITHOUT Geo_Risk)", preds_B)
    
    print("\n=== ABSOLUTE PERFORMANCE DIFFERENCE ===")
    print(f"Accuracy Diff: {acc_A - acc_B:+.4f}")
    print(f"Macro-F1 Diff: {f1_A - f1_B:+.4f}")

if __name__ == "__main__":
    run_ablation()
