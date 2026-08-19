import numpy as np

# Maps entity values to numeric codes for the XGBoost feature vector
INCIDENT_TYPE_MAP = {
    "FLOOD": 1, "LANDSLIDE": 2, "FIRE": 3, "CYCLONE": 4,
    "DROUGHT": 5, "EARTHQUAKE": 6, "TSUNAMI": 7, "OTHER": 8,
}
LOCATION_TYPE_MAP = {"URBAN": 1, "RURAL": 2, "COASTAL": 3, "UNKNOWN": 0}
SEVERITY_MAP = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "UNKNOWN": 0}


def build_feature_vector(entities: dict, metadata: dict) -> np.ndarray:
    """
    Build a fixed-length feature vector from NER entities and request metadata.
    Returns a 1-D float32 numpy array compatible with the XGBoost priority classifier.

    Feature layout (12 dimensions):
      0  incident_type code
      1  location_type code
      2  severity code
      3  person_count (capped at 1000, normalised /1000)
      4  has_media flag
      5  hour_of_day normalised (/ 24)
      6  has_children flag
      7  has_elderly flag
      8  has_disabled flag
      9  rainfall_mm (from environmental_data, capped at 300, normalised /300)
     10  river_level_m (from environmental_data, capped at 20, normalised /20)
     11  casualties_count (capped at 100, normalised /100)
    """
    env = metadata.get("environmental_data") or {}

    incident_code = INCIDENT_TYPE_MAP.get(
        str(entities.get("incident_type", "")).upper(), 0
    )
    location_code = LOCATION_TYPE_MAP.get(
        str(entities.get("location_type", "")).upper(), 0
    )
    severity_code = SEVERITY_MAP.get(
        str(entities.get("severity", "")).upper(), 0
    )
    person_count = min(int(entities.get("affected_persons", 0) or 0), 1000) / 1000.0
    casualties   = min(int(entities.get("casualties", 0) or 0), 100) / 100.0
    rainfall     = min(float(env.get("rainfall_mm", 0) or 0), 300) / 300.0
    river_level  = min(float(env.get("river_level_m", 0) or 0), 20) / 20.0
    hour         = min(int(metadata.get("hour_of_day", 12) or 12), 23) / 24.0

    features = np.array([
        incident_code,
        location_code,
        severity_code,
        person_count,
        1.0 if metadata.get("has_media") else 0.0,
        hour,
        1.0 if metadata.get("has_children") else 0.0,
        1.0 if metadata.get("has_elderly") else 0.0,
        1.0 if metadata.get("has_disabled") else 0.0,
        rainfall,
        river_level,
        casualties,
    ], dtype=np.float32)

    return features
