"""
R5 — Bias-Aware Spatiotemporal Risk Forecasting

Problem:
  Historical incident reports are NOT uniformly distributed — they reflect
  both actual disaster frequency AND reporting behaviour. Rural, low-connectivity,
  or socioeconomically disadvantaged areas systematically under-report, meaning
  a naive hotspot model sees fewer reports → lower risk → fewer resources sent
  → worse outcomes. This is the crowdsourcing reporting bias problem.

Solution:
  1. Estimate reporting bias per district using connectivity/population proxies
  2. Correct historical incident counts for this bias
  3. Build a spatiotemporal risk model on bias-corrected data
  4. Propagate bias uncertainty to output confidence intervals

Research components:
  B1 — Naive count model (baseline): hotspot = raw report density
  B2 — Seasonal ARIMA model (baseline): time series without bias correction
  Proposed — Bias-corrected GNN spatiotemporal model with:
    - Reporting bias estimation using internet penetration + population density proxies
    - Bias-corrected incident rates per district
    - Spatial GNN message passing: risk propagates to neighbouring districts
    - Temporal decay: recent incidents weighted more than old ones
    - Weather covariate integration: rainfall, river status
    - Confidence intervals that widen in high-bias districts

Key formula:
  True rate estimate:
    λ̂_d = (n_d + α) / (bias_factor_d × exposure_time_d)
    where bias_factor_d ∈ (0, 1] — high bias → small factor → inflated λ̂

  Spatiotemporal risk score:
    Risk_d(t) = Σ_{τ≤t} λ̂_d(τ) · exp(-κ(t-τ)) · weather_boost_d(t)
                + Σ_{d'∈N(d)} w_dd' · Risk_d'(t-1)  [spatial propagation]

  Bias uncertainty:
    CI_width_d ∝ (1 / bias_factor_d) · sqrt(1 / n_d)

Output:
  risk_level    — CRITICAL / HIGH / MEDIUM / LOW
  risk_score    — [0, 1]
  bias_factor   — [0, 1] how much reporting bias affects this district
  bias_flag     — True if this district likely under-reports (bias < 0.5)
  ci_lower/upper — 90% confidence interval on risk score
  narrative     — XAI explanation including bias warning if applicable
"""

import math
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# District geography: adjacency graph (Sri Lanka districts)
# Edges represent shared borders — used for spatial GNN message passing
# ─────────────────────────────────────────────────────────────────────────────
DISTRICT_ADJACENCY: Dict[str, List[str]] = {
    "Colombo":        ["Gampaha", "Kalutara"],
    "Gampaha":        ["Colombo", "Kalutara", "Kegalle", "Kurunegala"],
    "Kalutara":       ["Colombo", "Gampaha", "Ratnapura", "Galle"],
    "Kandy":          ["Matale", "Nuwara Eliya", "Kegalle", "Badulla", "Kurunegala"],
    "Matale":         ["Kandy", "Kurunegala", "Polonnaruwa", "Dambulla"],
    "Nuwara Eliya":   ["Kandy", "Badulla", "Ratnapura", "Monaragala"],
    "Galle":          ["Kalutara", "Ratnapura", "Matara"],
    "Matara":         ["Galle", "Hambantota", "Monaragala"],
    "Hambantota":     ["Matara", "Monaragala", "Ampara"],
    "Jaffna":         ["Kilinochchi", "Mannar"],
    "Mannar":         ["Jaffna", "Kilinochchi", "Vavuniya"],
    "Vavuniya":       ["Mannar", "Kilinochchi", "Mullaitivu", "Anuradhapura"],
    "Mullaitivu":     ["Vavuniya", "Kilinochchi", "Trincomalee", "Batticaloa"],
    "Kilinochchi":    ["Jaffna", "Mannar", "Vavuniya", "Mullaitivu"],
    "Batticaloa":     ["Mullaitivu", "Trincomalee", "Ampara"],
    "Ampara":         ["Batticaloa", "Hambantota", "Monaragala"],
    "Trincomalee":    ["Mullaitivu", "Batticaloa", "Polonnaruwa", "Anuradhapura"],
    "Kurunegala":     ["Gampaha", "Kandy", "Matale", "Puttalam", "Anuradhapura", "Kegalle"],
    "Puttalam":       ["Kurunegala", "Anuradhapura", "Mannar"],
    "Anuradhapura":   ["Puttalam", "Kurunegala", "Matale", "Polonnaruwa", "Vavuniya", "Trincomalee"],
    "Polonnaruwa":    ["Anuradhapura", "Matale", "Trincomalee", "Ampara"],
    "Badulla":        ["Kandy", "Nuwara Eliya", "Monaragala", "Ampara"],
    "Monaragala":     ["Badulla", "Nuwara Eliya", "Matara", "Hambantota", "Ampara"],
    "Ratnapura":      ["Kalutara", "Nuwara Eliya", "Galle", "Kegalle"],
    "Kegalle":        ["Gampaha", "Kandy", "Ratnapura", "Kurunegala"],
    "Dambulla":       ["Matale"],  # town-level, maps to Matale district
}

# ─────────────────────────────────────────────────────────────────────────────
# Reporting bias factors per district
# Estimated from: internet penetration rate, mobile coverage, literacy,
# population density, and urban/rural classification.
# Values are research proxies — in a real deployment, calibrate against
# ground-truth incident data from official sources (DMC, survey data).
#
# bias_factor ∈ (0, 1]:
#   1.0  — fully-observed district (every incident gets reported)
#   0.3  — heavily under-observed (70% of incidents likely unreported)
# ─────────────────────────────────────────────────────────────────────────────
DISTRICT_BIAS_FACTORS: Dict[str, float] = {
    # Western Province — high connectivity, densely populated, low bias
    "Colombo":        0.92,
    "Gampaha":        0.88,
    "Kalutara":       0.80,
    # Central Province — moderate connectivity, hilly terrain
    "Kandy":          0.75,
    "Matale":         0.62,
    "Nuwara Eliya":   0.55,  # remote estate areas, significant under-reporting
    # Southern Province
    "Galle":          0.78,
    "Matara":         0.72,
    "Hambantota":     0.65,
    # Northern Province — post-conflict, connectivity still recovering
    "Jaffna":         0.60,
    "Mannar":         0.42,  # sparse population, poor connectivity
    "Vavuniya":       0.48,
    "Mullaitivu":     0.35,  # remote, historically low connectivity
    "Kilinochchi":    0.40,
    # Eastern Province
    "Batticaloa":     0.55,
    "Ampara":         0.50,
    "Trincomalee":    0.58,
    # North Western Province
    "Kurunegala":     0.70,
    "Puttalam":       0.60,
    # North Central Province
    "Anuradhapura":   0.58,
    "Polonnaruwa":    0.55,
    # Uva Province — remote, forested
    "Badulla":        0.52,
    "Monaragala":     0.40,  # most remote district, high under-reporting
    # Sabaragamuwa Province
    "Ratnapura":      0.65,
    "Kegalle":        0.68,
}
DEFAULT_BIAS_FACTOR = 0.55  # for unknown districts

# ─────────────────────────────────────────────────────────────────────────────
# Base disaster risk per district (historical flood/landslide hazard zones)
# Source: DMC Sri Lanka hazard maps — encoded as research proxy values
# ─────────────────────────────────────────────────────────────────────────────
DISTRICT_BASE_HAZARD: Dict[str, float] = {
    "Colombo": 0.55, "Gampaha": 0.60, "Kalutara": 0.80,
    "Kandy": 0.65, "Matale": 0.55, "Nuwara Eliya": 0.70,
    "Galle": 0.70, "Matara": 0.65, "Hambantota": 0.45,
    "Jaffna": 0.35, "Mannar": 0.40, "Vavuniya": 0.40,
    "Mullaitivu": 0.50, "Kilinochchi": 0.40, "Batticaloa": 0.65,
    "Ampara": 0.60, "Trincomalee": 0.55, "Kurunegala": 0.60,
    "Puttalam": 0.50, "Anuradhapura": 0.45, "Polonnaruwa": 0.55,
    "Badulla": 0.75, "Monaragala": 0.70, "Ratnapura": 0.85,
    "Kegalle": 0.80, "Dambulla": 0.45,
}

# Seasonal risk multipliers by month (Sri Lanka monsoon patterns)
# SW Monsoon: May–Sep affects Western/Southern. NE Monsoon: Oct–Jan affects Eastern/Northern.
SEASONAL_MULTIPLIERS: Dict[int, float] = {
    1: 1.20,   # Jan — NE monsoon peak
    2: 1.05,   # Feb — NE monsoon tail
    3: 0.80,   # Mar — inter-monsoon, lower risk
    4: 0.90,   # Apr — first inter-monsoon rains
    5: 1.15,   # May — SW monsoon onset
    6: 1.40,   # Jun — SW monsoon peak
    7: 1.45,   # Jul — SW monsoon peak
    8: 1.35,   # Aug — SW monsoon
    9: 1.20,   # Sep — SW monsoon tail
    10: 1.30,  # Oct — second inter-monsoon (heavy, unpredictable)
    11: 1.25,  # Nov — NE monsoon onset
    12: 1.30,  # Dec — NE monsoon peak
}

# Temporal decay constant (κ): how fast old incidents lose relevance
# κ = 0.1 → incident 10 hours ago still has e^(-1) ≈ 37% weight
TEMPORAL_DECAY_KAPPA = 0.08

# Spatial propagation weight: how much a neighbour's risk contributes
SPATIAL_PROPAGATION_WEIGHT = 0.15


# ─────────────────────────────────────────────────────────────────────────────
# Bias estimation and correction
# ─────────────────────────────────────────────────────────────────────────────

def estimate_reporting_bias(district: str) -> dict:
    """
    Return the reporting bias factor for a district and a human-readable
    explanation of why this district may under-report.
    """
    factor = DISTRICT_BIAS_FACTORS.get(district, DEFAULT_BIAS_FACTOR)

    if factor >= 0.80:
        level = "LOW"
        reason = "High internet/mobile penetration; incidents likely well-reported."
    elif factor >= 0.60:
        level = "MODERATE"
        reason = "Mixed urban/rural coverage; moderate likelihood of under-reporting."
    elif factor >= 0.45:
        level = "HIGH"
        reason = "Limited connectivity or remote terrain; significant under-reporting expected."
    else:
        level = "SEVERE"
        reason = ("Very remote area with poor connectivity, sparse population, or post-conflict "
                  "infrastructure gaps. Raw report counts severely underestimate true incident rate.")

    return {
        "district": district,
        "bias_factor": round(factor, 3),
        "bias_level": level,
        "bias_reason": reason,
        "correction_multiplier": round(1.0 / factor, 3),  # inflate counts by this
        "is_high_bias": factor < 0.50,
    }


def bias_corrected_rate(
    raw_count: int,
    district: str,
    exposure_hours: float,
    alpha_prior: float = 0.5,  # Bayesian smoothing (avoid zero-count collapse)
) -> dict:
    """
    Estimate true incident rate corrected for reporting bias.

    λ̂_d = (n_d + α) / (bias_factor_d × exposure_time_d)

    Higher bias_factor → less correction needed (already well-observed).
    Lower bias_factor → more inflation (many incidents unreported).

    Returns point estimate + uncertainty interval.
    """
    bias = DISTRICT_BIAS_FACTORS.get(district, DEFAULT_BIAS_FACTOR)
    exposure = max(exposure_hours, 1.0)

    # Point estimate (incidents per hour, bias-corrected)
    lambda_hat = (raw_count + alpha_prior) / (bias * exposure)

    # 90% confidence interval using Poisson approximation
    # CI widens as bias_factor decreases (less information per report)
    ci_halfwidth = 1.645 * math.sqrt((raw_count + alpha_prior) / (bias * exposure) / exposure)
    ci_lower = max(0.0, lambda_hat - ci_halfwidth)
    ci_upper = lambda_hat + ci_halfwidth

    return {
        "raw_count": raw_count,
        "bias_factor": round(bias, 3),
        "corrected_rate_per_hour": round(lambda_hat, 4),
        "ci_lower": round(ci_lower, 4),
        "ci_upper": round(ci_upper, 4),
        "ci_width": round(ci_upper - ci_lower, 4),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Temporal risk: decay-weighted incident history
# ─────────────────────────────────────────────────────────────────────────────

def temporal_risk_score(
    incident_history: List[dict],
    current_hour_offset: float = 0.0,
    district: str = "UNKNOWN",
) -> dict:
    """
    Compute bias-corrected temporally-decayed risk score.

    incident_history: list of {"hours_ago": float, "severity": str, "count": int}
    current_hour_offset: how many hours into the future to forecast (0 = now)

    Risk_d(t) = Σ_τ λ̂_d(τ) · exp(-κ · (t - τ)) · severity_weight(τ)
    """
    SEVERITY_WEIGHTS = {"CRITICAL": 1.0, "HIGH": 0.7, "MEDIUM": 0.4, "LOW": 0.2, "UNKNOWN": 0.5}
    bias = DISTRICT_BIAS_FACTORS.get(district, DEFAULT_BIAS_FACTOR)

    weighted_sum = 0.0
    bias_corrected_sum = 0.0

    for inc in incident_history:
        hours_ago = max(inc.get("hours_ago", 0.0), 0.0) + current_hour_offset
        sev = inc.get("severity", "UNKNOWN")
        count = inc.get("count", 1)

        decay = math.exp(-TEMPORAL_DECAY_KAPPA * hours_ago)
        sev_w = SEVERITY_WEIGHTS.get(sev, 0.5)

        # Raw (biased) contribution
        raw_contrib = count * decay * sev_w
        # Bias-corrected contribution: inflate by 1/bias
        corrected_contrib = (count / bias) * decay * sev_w

        weighted_sum += raw_contrib
        bias_corrected_sum += corrected_contrib

    return {
        "raw_temporal_score": round(weighted_sum, 4),
        "bias_corrected_temporal_score": round(bias_corrected_sum, 4),
        "bias_factor": round(bias, 3),
        "n_incidents": len(incident_history),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Spatial GNN: propagate risk to/from neighbouring districts
# ─────────────────────────────────────────────────────────────────────────────

def spatial_gnn_propagation(
    district: str,
    district_risk_scores: Dict[str, float],
    propagation_weight: float = SPATIAL_PROPAGATION_WEIGHT,
) -> dict:
    """
    Simple 1-hop GNN message passing: the target district receives a weighted
    average of its neighbours' current risk scores.

    In a full GNN, weights would be learned from data. Here they are uniform
    with a base distance decay — capturing the real physical reality that
    floods/landslides propagate across district borders.
    """
    neighbours = DISTRICT_ADJACENCY.get(district, [])
    if not neighbours:
        return {"propagated_risk": 0.0, "neighbour_contributions": [], "n_neighbours": 0}

    contributions = []
    for nb in neighbours:
        nb_risk = district_risk_scores.get(nb, 0.0)
        contrib = propagation_weight * nb_risk
        if nb_risk > 0.2:  # only propagate meaningful risk
            contributions.append({
                "neighbour": nb,
                "neighbour_risk": round(nb_risk, 3),
                "contribution": round(contrib, 4),
            })

    propagated = sum(c["contribution"] for c in contributions)

    return {
        "propagated_risk": round(propagated, 4),
        "neighbour_contributions": sorted(contributions, key=lambda x: x["contribution"], reverse=True),
        "n_neighbours": len(neighbours),
        "n_active_neighbours": len(contributions),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Weather covariate boost
# ─────────────────────────────────────────────────────────────────────────────

def weather_risk_boost(environmental_data: Optional[dict]) -> dict:
    """
    Compute multiplicative weather boost from current environmental conditions.
    No weather data → neutral boost of 1.0.
    """
    if not environmental_data:
        return {"boost": 1.0, "drivers": []}

    boost = 1.0
    drivers = []

    rainfall = environmental_data.get("rainfall_mm_hr", 0) or environmental_data.get("rainfall_mm", 0)
    river = (environmental_data.get("river_status") or "").upper()
    wind_kmh = environmental_data.get("wind_speed_kmh", 0)

    if rainfall >= 75:
        boost *= 1.60
        drivers.append(f"extreme rainfall ({rainfall:.0f} mm/hr)")
    elif rainfall >= 50:
        boost *= 1.35
        drivers.append(f"heavy rainfall ({rainfall:.0f} mm/hr)")
    elif rainfall >= 25:
        boost *= 1.15
        drivers.append(f"moderate rainfall ({rainfall:.0f} mm/hr)")

    if river == "CRITICAL":
        boost *= 1.50
        drivers.append("river at CRITICAL level")
    elif river == "WARNING":
        boost *= 1.25
        drivers.append("river at WARNING level")
    elif river == "WATCH":
        boost *= 1.10
        drivers.append("river at WATCH level")

    if wind_kmh >= 80:
        boost *= 1.30
        drivers.append(f"strong winds ({wind_kmh:.0f} km/h)")
    elif wind_kmh >= 50:
        boost *= 1.10
        drivers.append(f"elevated winds ({wind_kmh:.0f} km/h)")

    return {"boost": round(boost, 3), "drivers": drivers}


# ─────────────────────────────────────────────────────────────────────────────
# Baselines (for ablation comparison)
# ─────────────────────────────────────────────────────────────────────────────

def baseline_naive_count(raw_count: int, exposure_hours: float = 24.0) -> float:
    """B1: Naive hotspot = raw report density. No bias correction, no temporal decay."""
    return round(raw_count / max(exposure_hours, 1.0), 4)


def baseline_seasonal_arima(district: str, month: int, raw_rate: float) -> float:
    """B2: Seasonal model — multiply raw rate by seasonal factor. No bias correction."""
    seasonal = SEASONAL_MULTIPLIERS.get(month, 1.0)
    base_hazard = DISTRICT_BASE_HAZARD.get(district, 0.50)
    # Simple combination: seasonal * hazard * rate
    return round(min(seasonal * base_hazard * raw_rate * 2.0, 1.0), 4)


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────

def forecast_risk(
    district: str,
    incident_history: List[dict],
    environmental_data: Optional[dict] = None,
    month: int = 6,
    district_risk_context: Optional[Dict[str, float]] = None,
    forecast_horizon_hours: float = 0.0,
) -> dict:
    """
    Full bias-aware spatiotemporal risk forecast for a district.

    Args:
        district:               Target district name
        incident_history:       List of {"hours_ago": float, "severity": str, "count": int}
        environmental_data:     Current weather {"rainfall_mm_hr", "river_status", ...}
        month:                  Current month (1–12) for seasonal adjustment
        district_risk_context:  Current risk scores of all districts (for spatial propagation)
        forecast_horizon_hours: How many hours ahead to forecast (0 = now)

    Returns:
        risk_level, risk_score, bias information, CI, narrative, and baseline comparison.
    """
    # ── Step 1: Bias estimation ───────────────────────────────────────────────
    bias_info = estimate_reporting_bias(district)
    bias_factor = bias_info["bias_factor"]

    # ── Step 2: Bias-corrected temporal risk ──────────────────────────────────
    temporal = temporal_risk_score(incident_history, forecast_horizon_hours, district)
    base_score = min(temporal["bias_corrected_temporal_score"], 1.0)

    # ── Step 3: Base hazard prior ─────────────────────────────────────────────
    base_hazard = DISTRICT_BASE_HAZARD.get(district, 0.50)

    # ── Step 4: Seasonal adjustment ───────────────────────────────────────────
    seasonal = SEASONAL_MULTIPLIERS.get(month, 1.0)

    # ── Step 5: Weather boost ─────────────────────────────────────────────────
    weather = weather_risk_boost(environmental_data)
    weather_boost = weather["boost"]

    # ── Step 6: Spatial propagation ───────────────────────────────────────────
    spatial_context = district_risk_context or {}
    spatial = spatial_gnn_propagation(district, spatial_context)
    propagated_risk = spatial["propagated_risk"]

    # ── Step 7: Combine into final score ──────────────────────────────────────
    # Weighted combination:
    #   50% incident-based (bias-corrected, temporally decayed)
    #   20% base hazard prior
    #   15% spatial propagation from neighbours
    #   15% weather boost applied as multiplier
    incident_component = 0.50 * base_score
    hazard_component = 0.20 * base_hazard
    spatial_component = 0.15 * propagated_risk

    raw_risk = (incident_component + hazard_component + spatial_component) * seasonal * weather_boost
    risk_score = round(min(max(raw_risk, 0.0), 1.0), 4)

    # ── Step 8: Confidence interval (widened for high-bias districts) ─────────
    # CI width is inversely proportional to bias_factor and sqrt(n_incidents)
    n_inc = max(len(incident_history), 1)
    ci_halfwidth = 1.645 * (1.0 / bias_factor) * (1.0 / math.sqrt(n_inc)) * 0.15
    ci_lower = round(max(risk_score - ci_halfwidth, 0.0), 4)
    ci_upper = round(min(risk_score + ci_halfwidth, 1.0), 4)

    # ── Step 9: Risk level classification ─────────────────────────────────────
    if risk_score >= 0.70:
        risk_level = "CRITICAL"
    elif risk_score >= 0.50:
        risk_level = "HIGH"
    elif risk_score >= 0.30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # ── Step 10: Baselines for ablation comparison ────────────────────────────
    raw_count = sum(inc.get("count", 1) for inc in incident_history)
    exposure = max(forecast_horizon_hours + 24.0, 24.0)
    b1_naive = baseline_naive_count(raw_count, exposure)
    b1_risk_level = "HIGH" if b1_naive > 0.5 else "MEDIUM" if b1_naive > 0.2 else "LOW"
    b2_seasonal = baseline_seasonal_arima(district, month, b1_naive)
    b2_risk_level = "HIGH" if b2_seasonal > 0.50 else "MEDIUM" if b2_seasonal > 0.30 else "LOW"

    # ── Step 11: Narrative (XAI) ──────────────────────────────────────────────
    narrative_parts = [
        f"Risk forecast for {district}: {risk_level} ({risk_score:.0%}).",
    ]

    if bias_info["is_high_bias"]:
        narrative_parts.append(
            f"WARNING: {district} has a high reporting bias (factor={bias_factor:.2f}). "
            f"Raw incident counts are inflated {bias_info['correction_multiplier']:.1f}× to correct "
            f"for estimated {(1-bias_factor)*100:.0f}% under-reporting. "
            f"CI is wide: [{ci_lower:.0%}, {ci_upper:.0%}]."
        )

    if weather["drivers"]:
        narrative_parts.append(
            f"Weather factors: {'; '.join(weather['drivers'])} (boost ×{weather_boost:.2f})."
        )

    if spatial["n_active_neighbours"] > 0:
        top_nb = spatial["neighbour_contributions"][0]
        narrative_parts.append(
            f"Spatial propagation: risk spreading from {top_nb['neighbour']} "
            f"(neighbour risk={top_nb['neighbour_risk']:.0%}, contribution={top_nb['contribution']:.3f})."
        )

    seasonal_desc = "peak monsoon" if seasonal >= 1.35 else "elevated seasonal" if seasonal >= 1.10 else "normal"
    narrative_parts.append(f"Seasonal context: {seasonal_desc} risk period (multiplier ×{seasonal:.2f}).")

    if forecast_horizon_hours > 0:
        narrative_parts.append(
            f"Forecast horizon: {forecast_horizon_hours:.0f} hours ahead "
            f"(temporal decay applied at κ={TEMPORAL_DECAY_KAPPA})."
        )

    # Bias correction impact statement
    if bias_info["is_high_bias"]:
        b1_level = b1_risk_level
        proposed_level = risk_level
        if b1_level != proposed_level:
            narrative_parts.append(
                f"Bias correction changed classification from B1={b1_level} to Proposed={proposed_level}. "
                f"Without correction, resources may have been misallocated."
            )

    return {
        # Core output
        "district": district,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "confidence_interval": {"lower": ci_lower, "upper": ci_upper, "level": "90%"},
        # Bias information
        "bias_info": bias_info,
        # Component breakdown (XAI)
        "components": {
            "incident_component": round(incident_component, 4),
            "hazard_prior": round(hazard_component, 4),
            "spatial_propagation": round(spatial_component, 4),
            "seasonal_multiplier": round(seasonal, 3),
            "weather_boost": round(weather_boost, 3),
        },
        "temporal_detail": temporal,
        "spatial_detail": spatial,
        "weather_detail": weather,
        # Research baselines
        "baseline_comparison": {
            "B1_naive_count": {"score": b1_naive, "risk_level": b1_risk_level},
            "B2_seasonal_arima": {"score": b2_seasonal, "risk_level": b2_risk_level},
            "proposed_bias_corrected_GNN": {"score": risk_score, "risk_level": risk_level},
        },
        # XAI narrative
        "narrative": " ".join(narrative_parts),
        # Forecast metadata
        "forecast_horizon_hours": forecast_horizon_hours,
        "month": month,
        "raw_incident_count": raw_count,
    }


def multi_district_forecast(
    districts_data: List[dict],
    month: int = 6,
    environmental_data: Optional[dict] = None,
) -> dict:
    """
    Forecast risk for multiple districts simultaneously, with full
    spatial GNN propagation across the district network.

    districts_data: list of {"district": str, "incident_history": [...],
                              "environmental_data": {...} (optional)}

    Two-pass algorithm:
      Pass 1: compute each district's risk without spatial propagation
      Pass 2: re-compute with neighbour risks from pass 1 (1-hop GNN)
    """
    # Pass 1: independent scores
    pass1_scores = {}
    for d in districts_data:
        dist_name = d["district"]
        p1 = forecast_risk(
            district=dist_name,
            incident_history=d.get("incident_history", []),
            environmental_data=d.get("environmental_data", environmental_data),
            month=month,
            district_risk_context=None,
        )
        pass1_scores[dist_name] = p1["risk_score"]

    # Pass 2: with spatial propagation
    results = []
    for d in districts_data:
        dist_name = d["district"]
        p2 = forecast_risk(
            district=dist_name,
            incident_history=d.get("incident_history", []),
            environmental_data=d.get("environmental_data", environmental_data),
            month=month,
            district_risk_context=pass1_scores,
        )
        results.append(p2)

    # Sort by risk_score descending
    results.sort(key=lambda x: x["risk_score"], reverse=True)

    # Aggregate bias summary
    high_bias_districts = [r["district"] for r in results if r["bias_info"]["is_high_bias"]]
    critical_districts = [r["district"] for r in results if r["risk_level"] in ("CRITICAL", "HIGH")]

    return {
        "forecasts": results,
        "summary": {
            "total_districts": len(results),
            "critical_or_high": len(critical_districts),
            "high_bias_districts": high_bias_districts,
            "highest_risk": results[0]["district"] if results else None,
            "bias_warning": (
                f"{len(high_bias_districts)} district(s) have high reporting bias — "
                f"risk may be underestimated in: {', '.join(high_bias_districts)}"
            ) if high_bias_districts else "No high-bias districts in this query.",
        },
        "month": month,
        "spatial_passes": 2,
    }
