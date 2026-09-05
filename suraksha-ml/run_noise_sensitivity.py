import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score
from imblearn.over_sampling import SMOTE
import sys
import random

sys.path.append(r'D:\Suraksha - Web App\suraksha-ml')
from training.train_priority_v2 import build_features, LABEL_ORDER

CSV_PATH = r'D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv'
df_base = pd.read_csv(CSV_PATH)

def generate_labels_with_noise(df, noise_ratio):
    np.random.seed(42)
    random.seed(42)
    labels = []
    
    for _, row in df.iterrows():
        affected = row['Affected_Population']
        incident = row['Incident_Type']
        has_children = row['Has_Children']
        has_elderly = row['Has_Elderly']
        has_disabled = row['Has_Disabled']
        
        score = 0
        if affected >= 1000: score += 4
        elif affected >= 500: score += 3
        elif affected >= 100: score += 2
        else: score += 1
        
        if incident in ['Landslide', 'Building Collapse']: score += 2
        elif incident == 'Flood': score += 1
        
        if has_disabled: score += 2
        elif has_children or has_elderly: score += 1
        
        if score >= 7: label = 'CRITICAL'
        elif score >= 5: label = 'HIGH'
        elif score >= 3: label = 'MEDIUM'
        else: label = 'LOW'
            
        if random.random() < noise_ratio:
            available = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
            available.remove(label)
            label = random.choice(available)
            
        labels.append(label)
    return labels

def evaluate_noise_level(noise_ratio):
    df = df_base.copy()
    df['Priority_Label'] = generate_labels_with_noise(df, noise_ratio)
    
    X, y = [], []
    for _, row in df.iterrows():
        X.append(build_features(row))
        y.append(row['Priority_Label'])
        
    X = np.array(X, dtype=np.float32)
    y = np.array(y)
    
    # 80/20 split
    split_idx = int(len(X) * 0.8)
    X_train, y_train = X[:split_idx], y[:split_idx]
    X_test, y_test = X[split_idx:], y[split_idx:]
    
    le = LabelEncoder()
    le.fit(LABEL_ORDER)
    y_train_enc = le.transform(y_train)
    y_test_enc = le.transform(y_test)
    
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
    
    clf = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric='mlogloss',
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf.fit(X_train_bal, y_train_bal_enc)
    
    test_preds_enc = clf.predict(X_test)
    test_preds = le.inverse_transform(test_preds_enc)
    
    acc = accuracy_score(y_test, test_preds)
    macro_f1 = f1_score(y_test, test_preds, average='macro', labels=LABEL_ORDER)
    
    return acc, macro_f1

if __name__ == "__main__":
    print("=== NOISE SENSITIVITY TEST ===")
    noise_levels = [0.0, 0.08, 0.16, 0.24]
    
    for noise in noise_levels:
        acc, f1 = evaluate_noise_level(noise)
        print(f"Noise {int(noise*100)}%: Accuracy = {acc:.4f} | Macro-F1 = {f1:.4f}")
