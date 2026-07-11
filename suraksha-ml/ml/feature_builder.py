import numpy as np
import joblib

INCIDENT_TYPE_MAP = {
    "FLOOD": 0, "LANDSLIDE": 1, "FIRE": 2,
    "BUILDING_COLLAPSE": 3, "MEDICAL_EMERGENCY": 4, "OTHER": 5
}

DISTRICT_RISK_MAP = {
    # Higher = higher flood/disaster risk based on DMC historical data
    "Colombo": 0.9, "Gampaha": 0.85, "Kalutara": 0.8,
    "Galle": 0.75, "Matara": 0.7, "Hambantota": 0.65,
    "Kandy": 0.6, "Ratnapura": 0.85, "Kegalle": 0.8
}

def build_feature_vector(nlp_output: dict, metadata: dict) -> np.ndarray:
    features = []
    
    # Incident type (one-hot encoded, 6 features)
    incident_type = nlp_output.get("incident_type", "OTHER")
    type_encoded = [0] * 6
    type_encoded[INCIDENT_TYPE_MAP.get(incident_type, 5)] = 1
    features.extend(type_encoded)
    
    # Affected count (normalized, 1 feature)
    affected = nlp_output.get("affected_count") or 0
    features.append(min(affected / 1000, 1.0))  # normalize to 0-1
    
    # Geographic risk score (1 feature)
    location = nlp_output.get("locations", [""])[0] if nlp_output.get("locations") else ""
    risk = DISTRICT_RISK_MAP.get(location, 0.5)
    features.append(risk)
    
    # Has media attached (1 feature)
    features.append(1 if metadata.get("has_media") else 0)
    
    # Hour of day — disasters at night = higher urgency (1 feature)
    hour = metadata.get("hour_of_day", 12)
    features.append(hour / 24)
    
    # Vulnerability flags from help request (3 features)
    features.append(1 if metadata.get("has_children") else 0)
    features.append(1 if metadata.get("has_elderly") else 0)
    features.append(1 if metadata.get("has_disabled") else 0)
    
    # --- NEW ENVIRONMENTAL FEATURES (Water Data) --- (10 features)
    env_data = metadata.get("environmental_data", {})
    
    # Rainfall
    features.append(min(env_data.get("rainfall_mm_last_hour", 0) / 100.0, 1.0))
    features.append(min(env_data.get("cumulative_rain_24h", 0) / 300.0, 1.0))
    features.append(min(env_data.get("cumulative_rain_72h", 0) / 600.0, 1.0))
    features.append(env_data.get("rainfall_risk_level", 0) / 3.0)
    
    # River Levels
    features.append(env_data.get("nearest_river_level_metres", 0) / 15.0)
    features.append(np.clip(env_data.get("river_vs_alert_level", 0) / 5.0, -1.0, 1.0))
    features.append(env_data.get("river_status_encoded", 0) / 3.0)
    features.append(env_data.get("river_trend_encoded", 0)) # -1, 0, 1
    
    # Composite & Seasonality
    features.append(env_data.get("district_risk_score", risk)) # fallback to geographic risk
    features.append(1.0 if env_data.get("is_monsoon_season") else 0.0)

    return np.array(features)
