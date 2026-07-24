"""
F7 — Spatiotemporal Disaster Hotspot Forecasting
F8 — Reporting-Bias & Disaster-Visibility Correction

Grid-based hotspot forecasting using incident density + temporal decay.
Produces risk scores per district cell with bias-adjusted severity.
"""
import math
from datetime import datetime, timedelta, timezone
from typing import List, Optional


# Sri Lanka district centroids (lat, lng)
DISTRICT_CENTROIDS = {
    "Colombo":      (6.9271, 79.8612),
    "Gampaha":      (7.0917, 79.9997),
    "Kalutara":     (6.5854, 79.9607),
    "Kandy":        (7.2906, 80.6337),
    "Matale":       (7.4718, 80.6234),
    "Nuwara Eliya": (6.9497, 80.7891),
    "Galle":        (6.0535, 80.2210),
    "Hambantota":   (6.1429, 81.1212),
    "Matara":       (5.9549, 80.5550),
    "Jaffna":       (9.6615, 80.0255),
    "Kilinochchi":  (9.3967, 80.4005),
    "Mannar":       (8.9810, 79.9044),
    "Mullaitivu":   (9.2671, 80.8120),
    "Vavuniya":     (8.7514, 80.4971),
    "Trincomalee":  (8.5874, 81.2152),
    "Batticaloa":   (7.7102, 81.6924),
    "Ampara":       (7.2978, 81.6724),
    "Kurunegala":   (7.4868, 80.3647),
    "Puttalam":     (8.0408, 79.8394),
    "Anuradhapura": (8.3114, 80.4037),
    "Polonnaruwa":  (7.9403, 81.0188),
    "Badulla":      (6.9934, 81.0550),
    "Monaragala":   (6.8728, 81.3507),
    "Ratnapura":    (6.6828, 80.3992),
    "Kegalle":      (7.2513, 80.3464),
}

# Reporting bias factors — urban areas over-report
# Based on population density and smartphone penetration proxies
URBAN_BIAS = {
    "Colombo": 2.8, "Gampaha": 2.2, "Kalutara": 1.6,
    "Kandy": 1.8, "Galle": 1.5, "Matara": 1.4,
    "Jaffna": 1.3,
}
DEFAULT_BIAS = 1.0

# Historical base risk (based on Sri Lanka disaster frequency data)
HISTORICAL_BASE_RISK = {
    "Colombo": 0.25, "Gampaha": 0.30, "Kalutara": 0.45,
    "Kandy": 0.35, "Nuwara Eliya": 0.55, "Ratnapura": 0.65,
    "Kegalle": 0.60, "Galle": 0.40, "Matara": 0.45,
    "Hambantota": 0.30, "Trincomalee": 0.35, "Batticaloa": 0.40,
    "Ampara": 0.35, "Kurunegala": 0.30, "Puttalam": 0.25,
    "Anuradhapura": 0.20, "Polonnaruwa": 0.25, "Badulla": 0.50,
    "Monaragala": 0.40, "Matale": 0.35, "Kilinochchi": 0.20,
    "Mannar": 0.20, "Mullaitivu": 0.20, "Vavuniya": 0.20, "Jaffna": 0.25,
}


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _severity_weight(severity: str) -> float:
    return {"CRITICAL": 4.0, "HIGH": 2.5, "MEDIUM": 1.0, "LOW": 0.4}.get(severity, 1.0)


def _temporal_decay(created_at_iso: str, now: datetime, decay_hours: float = 24.0) -> float:
    """Exponential decay: incident weight halves every `decay_hours`."""
    try:
        dt = datetime.fromisoformat(created_at_iso.replace("Z", "+00:00"))
        age_hours = max((now - dt).total_seconds() / 3600.0, 0)
        return math.exp(-0.693 * age_hours / decay_hours)
    except Exception:
        return 0.5


def forecast_hotspots(incidents: List[dict], water_levels: Optional[List[dict]] = None) -> List[dict]:
    """
    Compute risk score per district from recent incidents.
    Returns list of {district, lat, lng, raw_density, bias_factor,
                     adjusted_severity, risk_level, incident_count, top_category}.
    """
    now = datetime.now(timezone.utc)
    district_scores: dict = {}

    for inc in incidents:
        lat = inc.get("latitude")
        lng = inc.get("longitude")
        if lat is None or lng is None:
            continue

        # Find nearest district
        nearest_dist = None
        nearest_km = float("inf")
        for dist_name, (dlat, dlng) in DISTRICT_CENTROIDS.items():
            km = _haversine_km(lat, lng, dlat, dlng)
            if km < nearest_km:
                nearest_km = km
                nearest_dist = dist_name

        if nearest_dist is None or nearest_km > 100:
            continue

        weight = _severity_weight(inc.get("severity", "MEDIUM")) * _temporal_decay(
            inc.get("createdAt", now.isoformat()), now
        )

        if nearest_dist not in district_scores:
            district_scores[nearest_dist] = {
                "raw_score": 0.0,
                "count": 0,
                "categories": {},
            }
        district_scores[nearest_dist]["raw_score"] += weight
        district_scores[nearest_dist]["count"] += 1
        cat = inc.get("category", "UNKNOWN")
        district_scores[nearest_dist]["categories"][cat] = (
            district_scores[nearest_dist]["categories"].get(cat, 0) + 1
        )

    # Add water level contribution
    if water_levels:
        for wl in water_levels:
            dist = wl.get("district", "")
            status = wl.get("status", "NORMAL")
            if dist in DISTRICT_CENTROIDS and status in ("MINOR_FLOOD", "MAJOR_FLOOD", "ALERT"):
                bonus = {"MAJOR_FLOOD": 3.0, "MINOR_FLOOD": 1.5, "ALERT": 0.8}.get(status, 0)
                if dist not in district_scores:
                    district_scores[dist] = {"raw_score": 0.0, "count": 0, "categories": {}}
                district_scores[dist]["raw_score"] += bonus

    results = []
    for district, (dlat, dlng) in DISTRICT_CENTROIDS.items():
        data = district_scores.get(district, {"raw_score": 0.0, "count": 0, "categories": {}})
        raw_score = data["raw_score"]
        bias = URBAN_BIAS.get(district, DEFAULT_BIAS)
        historical = HISTORICAL_BASE_RISK.get(district, 0.25)

        # Bias-adjusted score: divide by bias factor to correct for over-reporting
        adjusted_score = (raw_score / bias) + historical

        # Normalise to 0–1 (cap at 10 weighted incidents = full risk)
        normalised = min(adjusted_score / 10.0, 1.0)

        if normalised >= 0.75:
            risk_level = "CRITICAL"
        elif normalised >= 0.55:
            risk_level = "HIGH"
        elif normalised >= 0.35:
            risk_level = "MEDIUM"
        elif normalised >= 0.15:
            risk_level = "LOW"
        else:
            risk_level = "MINIMAL"

        categories = data["categories"]
        top_cat = max(categories, key=categories.get) if categories else "NONE"

        results.append({
            "district": district,
            "latitude": dlat,
            "longitude": dlng,
            "raw_density": round(raw_score, 3),
            "bias_factor": bias,
            "adjusted_severity": round(normalised, 3),
            "risk_level": risk_level,
            "incident_count": data["count"],
            "top_category": top_cat,
            "historical_base": historical,
        })

    # Sort by adjusted severity descending
    results.sort(key=lambda x: x["adjusted_severity"], reverse=True)
    return results
