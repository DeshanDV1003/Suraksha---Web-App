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

def run_rolling_chronological():
    print("=== ROLLING TEMPORAL VALIDATION ===")
    df = pd.read_csv(CSV_PATH)
    
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df = df.sort_values(by='Timestamp').reset_index(drop=True)
    
    n = len(df)
    splits = [
        (0, int(n*0.4), int(n*0.6)),   # Split 1: Train 0-40%, Test 40-60%
        (0, int(n*0.6), int(n*0.8)),   # Split 2: Train 0-60%, Test 60-80%
        (0, int(n*0.8), n)             # Split 3: Train 0-80%, Test 80-100%
    ]
    
    for i, (start_train, end_train, end_test) in enumerate(splits, 1):
        train_df = df.iloc[start_train:end_train]
        test_df = df.iloc[end_train:end_test]
        
        train_start = train_df['Timestamp'].min().strftime('%Y-%m-%d')
        train_end = train_df['Timestamp'].max().strftime('%Y-%m-%d')
        test_start = test_df['Timestamp'].min().strftime('%Y-%m-%d')
        test_end = test_df['Timestamp'].max().strftime('%Y-%m-%d')
        
        print(f"\n--- Split {i} ---")
        print(f"Train Period: {train_start} to {train_end} (Size: {len(train_df)})")
        print(f"Test Period : {test_start} to {test_end} (Size: {len(test_df)})")
        
        def extract(split_df):
            X, y = [], []
            for _, row in split_df.iterrows():
                X.append(build_features(row))
                y.append(row["Priority_Label"])
            return np.array(X, dtype=np.float32), np.array(y)
            
        X_train, y_train = extract(train_df)
        X_test, y_test = extract(test_df)
        
        le = LabelEncoder()
        le.fit(LABEL_ORDER)
        y_train_enc = le.transform(y_train)
        y_test_enc = le.transform(y_test)
        
        smote = SMOTE(random_state=42)
        X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
        
        clf = xgb.XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
            random_state=42, n_jobs=-1, verbosity=0
        )
        clf.fit(X_train_bal, y_train_bal_enc)
        
        test_preds_enc = clf.predict(X_test)
        test_preds = le.inverse_transform(test_preds_enc)
        
        acc = accuracy_score(y_test, test_preds)
        macro_f1 = f1_score(y_test, test_preds, average='macro', labels=LABEL_ORDER)
        
        print(f"Accuracy: {acc:.4f} | Macro-F1: {macro_f1:.4f}")

if __name__ == "__main__":
    run_rolling_chronological()
