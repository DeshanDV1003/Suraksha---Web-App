import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix, roc_auc_score
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import label_binarize
import sys
import os

# Add parent directory to path so we can import from training module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from training.train_priority_v2 import build_features, LABEL_ORDER
except ImportError:
    # Fallback if import fails
    LABEL_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
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
    INCIDENT_TYPE_MAP = {
        "FLOOD": 0, "LANDSLIDE": 1, "FIRE": 2,
        "BUILDING_COLLAPSE": 3, "MEDICAL_EMERGENCY": 4, "OTHER": 5
    }
    def map_incident_type(raw_type: str) -> str:
        raw = str(raw_type).upper()
        if "FLOOD"    in raw: return "FLOOD"
        if "LANDSLIDE" in raw: return "LANDSLIDE"
        if "FIRE"     in raw: return "FIRE"
        if "COLLAPSE" in raw: return "BUILDING_COLLAPSE"
        if "MEDICAL"  in raw: return "MEDICAL_EMERGENCY"
        return "OTHER"
    def build_features(row) -> list:
        features = []
        inc_type = map_incident_type(row.get("Incident_Type", ""))
        type_encoded = [0] * 6
        type_encoded[INCIDENT_TYPE_MAP.get(inc_type, 5)] = 1
        features.extend(type_encoded)
        features.append(min(float(row.get("Affected_Population", 0)) / 1000.0, 1.0))
        features.append(DISTRICT_RISK_MAP.get(str(row.get("District", "")), 0.5))
        has_media = bool(row.get("Has_Photo_Evidence", False)) or bool(row.get("Has_Video_Evidence", False))
        features.append(1.0 if has_media else 0.0)
        features.append(float(row.get("Hour_Of_Day", 12)) / 24.0)
        has_children = float(row.get("Has_Children", False))
        has_elderly  = float(row.get("Has_Elderly", False))
        has_disabled = float(row.get("Has_Disabled", False))
        features.extend([has_children, has_elderly, has_disabled])
        return features

CSV_PATH = r"D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv"

def run_chronological_eval():
    print("=== CHRONOLOGICAL HOLDOUT EVALUATION ===")
    df = pd.read_csv(CSV_PATH)
    
    # Sort by Timestamp
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df = df.sort_values(by='Timestamp').reset_index(drop=True)
    
    # 80/20 Chronological Split
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    print(f"Train Period: {train_df['Timestamp'].min()} to {train_df['Timestamp'].max()} (Size: {len(train_df)})")
    print(f"Test Period : {test_df['Timestamp'].min()} to {test_df['Timestamp'].max()} (Size: {len(test_df)})")
    
    # Build Features
    X_train_list, y_train_list = [], []
    for _, row in train_df.iterrows():
        X_train_list.append(build_features(row))
        y_train_list.append(row["Priority_Label"])
        
    X_test_list, y_test_list = [], []
    for _, row in test_df.iterrows():
        X_test_list.append(build_features(row))
        y_test_list.append(row["Priority_Label"])
        
    X_train = np.array(X_train_list, dtype=np.float32)
    y_train = np.array(y_train_list)
    X_test = np.array(X_test_list, dtype=np.float32)
    y_test = np.array(y_test_list)
    
    le = LabelEncoder()
    le.fit(LABEL_ORDER)
    y_train_enc = le.transform(y_train)
    y_test_enc = le.transform(y_test)
    
    # SMOTE
    smote = SMOTE(random_state=42)
    X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
    
    # Train
    clf = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="mlogloss",
        random_state=42, n_jobs=-1, verbosity=0
    )
    clf.fit(X_train_bal, y_train_bal_enc)
    
    # Evaluate
    y_pred_enc = clf.predict(X_test)
    y_pred = le.inverse_transform(y_pred_enc)
    y_pred_prob = clf.predict_proba(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average='macro', labels=LABEL_ORDER)
    weighted_f1 = f1_score(y_test, y_pred, average='weighted', labels=LABEL_ORDER)
    
    y_test_bin = label_binarize(y_test, classes=LABEL_ORDER)
    try:
        auc = roc_auc_score(y_test_bin, y_pred_prob, multi_class="ovr", average="macro")
    except:
        auc = 0.0
        
    print(f"\nAccuracy: {acc:.4f}")
    print(f"Macro-F1: {macro_f1:.4f}")
    print(f"Weighted-F1: {weighted_f1:.4f}")
    print(f"Macro AUC: {auc:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, labels=LABEL_ORDER))
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred, labels=LABEL_ORDER))

if __name__ == "__main__":
    run_chronological_eval()
