import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Constants matching feature_builder.py
INCIDENT_TYPE_MAP = {
    "FLOOD": 0, "LANDSLIDE": 1, "FIRE": 2,
    "BUILDING_COLLAPSE": 3, "MEDICAL_EMERGENCY": 4, "OTHER": 5
}

DISTRICT_RISK_MAP = {
    "Colombo": 0.9, "Gampaha": 0.85, "Kalutara": 0.8,
    "Galle": 0.75, "Matara": 0.7, "Hambantota": 0.65,
    "Kandy": 0.6, "Ratnapura": 0.85, "Kegalle": 0.8
}

def map_incident_type(raw_type):
    raw = str(raw_type).upper()
    if "FLOOD" in raw: return "FLOOD"
    if "LANDSLIDE" in raw: return "LANDSLIDE"
    if "FIRE" in raw: return "FIRE"
    if "COLLAPSE" in raw: return "BUILDING_COLLAPSE"
    if "MEDICAL" in raw: return "MEDICAL_EMERGENCY"
    return "OTHER"

def build_features(row):
    features = []
    
    # 1. Incident type (6 features)
    inc_type = map_incident_type(row.get('Incident_Type', ''))
    type_encoded = [0] * 6
    type_idx = INCIDENT_TYPE_MAP.get(inc_type, 5)
    type_encoded[type_idx] = 1
    features.extend(type_encoded)
    
    # 2. Affected count normalized (1 feature)
    affected = float(row.get('Affected_Population', 0))
    features.append(min(affected / 1000.0, 1.0))
    
    # 3. Geographic risk score (1 feature)
    district = str(row.get('District', ''))
    risk = DISTRICT_RISK_MAP.get(district, 0.5)
    features.append(risk)
    
    # 4. Has media attached (1 feature)
    has_media = row.get('Has_Photo_Evidence', False) or row.get('Has_Video_Evidence', False)
    features.append(1.0 if has_media else 0.0)
    
    # 5. Hour of day (1 feature)
    hour = float(row.get('Hour_Of_Day', 12))
    features.append(hour / 24.0)
    
    # 6. Vulnerability flags (3 features)
    # Since these aren't in the CSV, we simulate a slight random distribution for training stability, 
    # mostly 0.
    features.append(float(np.random.rand() > 0.8)) # has_children
    features.append(float(np.random.rand() > 0.8)) # has_elderly
    features.append(float(np.random.rand() > 0.9)) # has_disabled
    
    return features

def train_model():
    print("Loading dataset...")
    csv_path = r"D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v2.csv"
    df = pd.read_csv(csv_path)
    
    print(f"Loaded {len(df)} records. Building features...")
    
    X = []
    y = []
    
    for idx, row in df.iterrows():
        # Target
        priority = str(row.get('Priority_Label', 'MEDIUM')).upper()
        if priority not in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']:
            priority = 'MEDIUM'
            
        features = build_features(row)
        X.append(features)
        y.append(priority)
        
    X = np.array(X)
    
    print("Encoding labels...")
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    print(f"Feature shape: {X.shape}")
    print(f"Classes: {le.classes_}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
    clf.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    # Ensure models directory exists
    models_dir = r"D:\Suraksha - Web App\suraksha-ml\models"
    os.makedirs(models_dir, exist_ok=True)
    
    print("Saving models...")
    joblib.dump(clf, os.path.join(models_dir, 'priority_classifier.pkl'))
    joblib.dump(le, os.path.join(models_dir, 'label_encoder.pkl'))
    
    print(f"Successfully saved to {models_dir}!")

if __name__ == "__main__":
    train_model()
