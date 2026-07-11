import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
import joblib
import os
from .feature_builder import build_feature_vector

def train_priority_classifier(dataset_path: str):
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}")
        return None, 0

    df = pd.read_csv(dataset_path)
    
    # Build feature matrix
    X = []
    y = []
    
    for _, row in df.iterrows():
        nlp_output = {
            "incident_type": row["incident_type"],
            "affected_count": row["affected_count"],
            "locations": [row["district"]]
        }
        metadata = {
            "has_media": row["has_media"],
            "hour_of_day": row["hour_of_day"],
            "has_children": row.get("has_children", 0),
            "has_elderly": row.get("has_elderly", 0),
            "has_disabled": row.get("has_disabled", 0),
            "environmental_data": {
                "rainfall_mm_last_hour": row.get("rainfall_mm_last_hour", 0),
                "cumulative_rain_24h": row.get("cumulative_rain_24h", 0),
                "cumulative_rain_72h": row.get("cumulative_rain_72h", 0),
                "rainfall_risk_level": row.get("rainfall_risk_level", 0),
                "nearest_river_level_metres": row.get("nearest_river_level_metres", 0),
                "river_vs_alert_level": row.get("river_vs_alert_level", 0),
                "river_status_encoded": row.get("river_status_encoded", 0),
                "river_trend_encoded": row.get("river_trend_encoded", 0),
                "district_risk_score": row.get("district_risk_score", 0.5),
                "is_monsoon_season": row.get("is_monsoon_season", 0)
            }
        }
        features = build_feature_vector(nlp_output, metadata)
        X.append(features)
        y.append(row["priority_class"])
    
    X = np.array(X)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Try both models, keep the better one
    models = {
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=200, max_depth=6, random_state=42, class_weight="balanced"
        )
    }
    
    best_model = None
    best_f1 = 0
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        f1 = f1_score(y_test, y_pred, average="weighted")
        print(f"\n{name} F1: {f1:.4f}")
        print(classification_report(y_test, y_pred))
        
        if f1 > best_f1:
            best_f1 = f1
            best_model = model
    
    print(f"\nBest F1 score: {best_f1:.4f}")
    
    # Ensure models directory exists
    os.makedirs("models", exist_ok=True)
    
    # Save if target met
    if best_f1 >= 0.80:
        joblib.dump(best_model, "models/priority_classifier.pkl")
        print("Model saved — target F1 >= 0.80 achieved")
    else:
        print("WARNING: F1 below 0.80 target — consider more data or BERT upgrade")
        joblib.dump(best_model, "models/priority_classifier_draft.pkl")
    
    return best_model, best_f1
