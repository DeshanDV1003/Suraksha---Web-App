"""
R1 — Multimodal Fusion for Disaster Triage
Fuses text predictions, image predictions, geographic context,
temporal context, and environmental context using a weighted
cross-attention-inspired fusion strategy.

Architecture:
  Text (XLM-R/keyword) + Image (CLIP) + Geo + Time + Env
        → Modality Confidence Weighting
        → Cross-Modal Agreement Scoring
        → Fused Multitask Output
        → Uncertainty Estimate

Five experimental models (M1–M5):
  M1 — Text only
  M2 — Image only
  M3 — Text + Image (simple average)
  M4 — Text + Geo/Temporal features
  M5 — Full cross-attention-inspired fusion (proposed)
"""
import math
import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
DISASTER_TYPES = [
    "FLOOD", "LANDSLIDE", "FIRE", "CYCLONE",
    "BUILDING_COLLAPSE", "EARTHQUAKE", "TSUNAMI", "DROUGHT", "UNKNOWN",
]


# ── Geo context ────────────────────────────────────────────────────────────────

DISTRICT_RISK = {
    "Colombo": 0.90, "Gampaha": 0.85, "Kalutara": 0.80,
    "Galle": 0.75, "Matara": 0.70, "Hambantota": 0.65,
    "Kandy": 0.60, "Ratnapura": 0.85, "Kegalle": 0.80,
    "Kurunegala": 0.55, "Puttalam": 0.60, "Anuradhapura": 0.50,
    "Polonnaruwa": 0.50, "Badulla": 0.65, "Monaragala": 0.60,
    "Nuwara Eliya": 0.70, "Trincomalee": 0.55, "Batticaloa": 0.55,
    "Ampara": 0.55, "Vavuniya": 0.45, "Mullaitivu": 0.45,
    "Kilinochchi": 0.45, "Mannar": 0.50, "Jaffna": 0.50,
}


def _geo_risk(district: Optional[str], latitude: Optional[float], longitude: Optional[float]) -> float:
    if district and district in DISTRICT_RISK:
        return DISTRICT_RISK[district]
    # Sri Lanka bounding box — rough coastal risk
    if latitude and longitude:
        if 5.9 <= latitude <= 9.8 and 79.7 <= longitude <= 81.9:
            return 0.60  # generic Sri Lanka risk
    return 0.50  # unknown


def _temporal_risk(hour: Optional[int], month: Optional[int]) -> float:
    """Night-time and monsoon months increase risk weight."""
    hour_risk = 0.0
    if hour is not None:
        # Night (22:00–06:00) = harder to respond
        if hour >= 22 or hour <= 6:
            hour_risk = 0.20
        elif hour <= 9 or hour >= 18:
            hour_risk = 0.10

    month_risk = 0.0
    if month is not None:
        # SW Monsoon: May–Sep; NE Monsoon: Oct–Jan
        if month in {5, 6, 7, 8, 9, 10, 11, 12, 1}:
            month_risk = 0.15

    return min(hour_risk + month_risk, 0.30)


# ── Environmental context ──────────────────────────────────────────────────────

def _env_urgency_boost(env: dict) -> float:
    boost = 0.0
    rain = env.get("rainfall_mm_last_hour", 0)
    if rain > 50:
        boost += 0.15
    elif rain > 20:
        boost += 0.08
    river_status = env.get("river_status_encoded", 0)
    if river_status >= 2:  # 2=warning, 3=critical
        boost += 0.10
    return min(boost, 0.20)


# ── Cross-modal agreement ──────────────────────────────────────────────────────

def _modal_agreement(text_disaster: str, image_disaster: Optional[str]) -> float:
    """Returns 1.0 if modalities agree, 0.5 if one is unknown, 0.0 if they disagree."""
    if image_disaster is None or image_disaster == "UNKNOWN":
        return 0.5
    if text_disaster == image_disaster:
        return 1.0
    if text_disaster == "UNKNOWN":
        return 0.5
    return 0.0


def _urgency_max(u1: str, u2: Optional[str]) -> str:
    """Return the higher urgency of two."""
    if u2 is None:
        return u1
    idx1 = SEVERITY_ORDER.index(u1) if u1 in SEVERITY_ORDER else 3
    idx2 = SEVERITY_ORDER.index(u2) if u2 in SEVERITY_ORDER else 3
    return SEVERITY_ORDER[min(idx1, idx2)]


# ── Vulnerability boost ────────────────────────────────────────────────────────

def _vulnerability_boost(has_children: bool, has_elderly: bool, has_disabled: bool) -> float:
    count = sum([has_children, has_elderly, has_disabled])
    return min(count * 0.08, 0.20)


# ── Main fusion function ───────────────────────────────────────────────────────

def fuse_modalities(
    text_result: dict,
    image_result: Optional[dict],
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    district: Optional[str] = None,
    hour: Optional[int] = None,
    month: Optional[int] = None,
    env_data: Optional[dict] = None,
    has_children: bool = False,
    has_elderly: bool = False,
    has_disabled: bool = False,
    model_variant: str = "M5",
) -> dict:
    """
    Fuse text + image + geo + temporal + environmental signals.

    model_variant:
      M1 — text only
      M2 — image only (requires image_result)
      M3 — text + image simple average
      M4 — text + geo/temporal
      M5 — full proposed fusion (default)
    """
    env = env_data or {}

    # ── M1: Text only ──────────────────────────────────────────────────────────
    if model_variant == "M1":
        return _build_output(
            disaster_type=text_result.get("disaster_type", "UNKNOWN"),
            disaster_conf=text_result.get("disaster_type_confidence", 0.30),
            urgency=text_result.get("urgency", "LOW"),
            urgency_conf=text_result.get("urgency_confidence", 0.50),
            text_result=text_result,
            image_result=None,
            modalities_used=["text"],
            model_variant="M1",
            agreement=1.0,
            geo_boost=0.0,
            env_boost=0.0,
            vuln_boost=0.0,
        )

    # ── M2: Image only ─────────────────────────────────────────────────────────
    if model_variant == "M2":
        if image_result is None:
            return _build_output(
                disaster_type="UNKNOWN", disaster_conf=0.20,
                urgency="LOW", urgency_conf=0.30,
                text_result=text_result, image_result=None,
                modalities_used=[], model_variant="M2",
                agreement=0.0, geo_boost=0.0, env_boost=0.0, vuln_boost=0.0,
            )
        return _build_output(
            disaster_type=image_result.get("disaster_type", "UNKNOWN"),
            disaster_conf=image_result.get("disaster_confidence", 0.30),
            urgency=image_result.get("urgency", "LOW"),
            urgency_conf=image_result.get("urgency_confidence", 0.30),
            text_result=text_result,
            image_result=image_result,
            modalities_used=["image"],
            model_variant="M2",
            agreement=1.0,
            geo_boost=0.0, env_boost=0.0, vuln_boost=0.0,
        )

    # ── M3: Text + Image simple average ───────────────────────────────────────
    if model_variant == "M3":
        text_d = text_result.get("disaster_type", "UNKNOWN")
        text_dc = text_result.get("disaster_type_confidence", 0.30)
        text_u = text_result.get("urgency", "LOW")
        text_uc = text_result.get("urgency_confidence", 0.50)

        if image_result:
            img_d = image_result.get("disaster_type", "UNKNOWN")
            img_dc = image_result.get("disaster_confidence", 0.30)
            img_u = image_result.get("urgency", "LOW")
            img_uc = image_result.get("urgency_confidence", 0.30)

            # Simple average of confidences; pick highest-confidence disaster
            if img_dc > text_dc:
                final_d, final_dc = img_d, (text_dc + img_dc) / 2
            else:
                final_d, final_dc = text_d, (text_dc + img_dc) / 2

            final_u = _urgency_max(text_u, img_u)
            final_uc = (text_uc + img_uc) / 2
            modalities = ["text", "image"]
            agreement = _modal_agreement(text_d, img_d)
        else:
            final_d, final_dc = text_d, text_dc
            final_u, final_uc = text_u, text_uc
            modalities = ["text"]
            agreement = 1.0

        return _build_output(
            disaster_type=final_d, disaster_conf=final_dc,
            urgency=final_u, urgency_conf=final_uc,
            text_result=text_result, image_result=image_result,
            modalities_used=modalities, model_variant="M3",
            agreement=agreement, geo_boost=0.0, env_boost=0.0, vuln_boost=0.0,
        )

    # ── M4: Text + Geo/Temporal ────────────────────────────────────────────────
    if model_variant == "M4":
        geo_risk = _geo_risk(district, latitude, longitude)
        temp_risk = _temporal_risk(hour, month)
        geo_boost = (geo_risk - 0.5) * 0.15 + temp_risk * 0.10

        text_d = text_result.get("disaster_type", "UNKNOWN")
        text_dc = min(text_result.get("disaster_type_confidence", 0.30) + geo_boost, 0.97)
        text_u = text_result.get("urgency", "LOW")
        text_uc = min(text_result.get("urgency_confidence", 0.50) + geo_boost * 0.5, 0.97)

        return _build_output(
            disaster_type=text_d, disaster_conf=text_dc,
            urgency=text_u, urgency_conf=text_uc,
            text_result=text_result, image_result=None,
            modalities_used=["text", "geo", "temporal"],
            model_variant="M4",
            agreement=1.0, geo_boost=geo_boost, env_boost=0.0, vuln_boost=0.0,
        )

    # ── M5: Full proposed cross-attention fusion (default) ────────────────────
    # Step 1: collect modality scores
    text_d = text_result.get("disaster_type", "UNKNOWN")
    text_dc = text_result.get("disaster_type_confidence", 0.30)
    text_u = text_result.get("urgency", "LOW")
    text_uc = text_result.get("urgency_confidence", 0.50)

    geo_risk = _geo_risk(district, latitude, longitude)
    temp_risk = _temporal_risk(hour, month)
    env_boost = _env_urgency_boost(env)
    vuln_boost = _vulnerability_boost(has_children, has_elderly, has_disabled)
    geo_boost = (geo_risk - 0.5) * 0.15 + temp_risk * 0.10

    modalities_used = ["text", "geo", "temporal"]

    if image_result:
        img_d = image_result.get("disaster_type", "UNKNOWN")
        img_dc = image_result.get("disaster_confidence", 0.30)
        img_u = image_result.get("urgency", "LOW")
        img_uc = image_result.get("urgency_confidence", 0.30)
        agreement = _modal_agreement(text_d, img_d)
        modalities_used.append("image")

        # Step 2: confidence-weighted disaster type
        # Weight text higher when it has more context; image when text is ambiguous
        text_weight = text_dc / (text_dc + img_dc + 1e-6)
        img_weight = img_dc / (text_dc + img_dc + 1e-6)

        if agreement == 1.0:
            # Both agree — boost confidence
            final_d = text_d
            final_dc = min(text_dc * text_weight + img_dc * img_weight + 0.08, 0.97)
        elif agreement == 0.5:
            # One is unknown — use the known one
            final_d = text_d if img_d == "UNKNOWN" else img_d
            final_dc = max(text_dc, img_dc)
        else:
            # Disagreement — pick higher-confidence but reduce confidence
            if img_dc > text_dc:
                final_d, final_dc = img_d, img_dc * 0.80
            else:
                final_d, final_dc = text_d, text_dc * 0.80

        # Step 3: urgency — take max urgency, weighted confidence
        final_u = _urgency_max(text_u, img_u)
        final_uc = max(text_uc, img_uc)

    else:
        agreement = 1.0
        final_d, final_dc = text_d, text_dc
        final_u, final_uc = text_u, text_uc

    if env_data:
        modalities_used.append("environmental")

    # Step 4: apply context boosts
    final_dc = min(final_dc + geo_boost * 0.5, 0.97)
    final_uc = min(final_uc + env_boost + vuln_boost, 0.97)

    # Urgency escalation: if geo + env evidence is very strong, escalate urgency
    combined_context_boost = geo_boost + env_boost + vuln_boost
    if combined_context_boost > 0.30 and final_u == "MEDIUM":
        final_u = "HIGH"
    elif combined_context_boost > 0.45 and final_u in ("MEDIUM", "HIGH"):
        final_u = "CRITICAL"

    return _build_output(
        disaster_type=final_d, disaster_conf=final_dc,
        urgency=final_u, urgency_conf=final_uc,
        text_result=text_result, image_result=image_result,
        modalities_used=modalities_used, model_variant="M5",
        agreement=agreement, geo_boost=geo_boost, env_boost=env_boost, vuln_boost=vuln_boost,
    )


def _build_output(
    disaster_type: str,
    disaster_conf: float,
    urgency: str,
    urgency_conf: float,
    text_result: dict,
    image_result: Optional[dict],
    modalities_used: list,
    model_variant: str,
    agreement: float,
    geo_boost: float,
    env_boost: float,
    vuln_boost: float,
) -> dict:
    """Build the standardised fusion output."""
    # Cross-modal agreement explanation
    if len(modalities_used) > 1 and image_result:
        if agreement == 1.0:
            agreement_label = "text and image agree"
        elif agreement == 0.5:
            agreement_label = "one modality inconclusive"
        else:
            agreement_label = "text and image disagree — lower confidence"
    else:
        agreement_label = "single modality"

    context_boosts = []
    if geo_boost > 0.05:
        context_boosts.append(f"high-risk district (+{geo_boost:.2f})")
    if env_boost > 0.0:
        context_boosts.append(f"adverse weather (+{env_boost:.2f})")
    if vuln_boost > 0.0:
        context_boosts.append(f"vulnerable persons (+{vuln_boost:.2f})")

    fusion_explanation = (
        f"Model {model_variant} | Modalities: {', '.join(modalities_used) or 'none'} | "
        f"{agreement_label}"
        + (f" | Context: {'; '.join(context_boosts)}" if context_boosts else "")
    )

    # Preserve all multitask outputs from text classifier
    return {
        # Fused primary outputs
        "disaster_type": disaster_type,
        "disaster_type_confidence": round(float(disaster_conf), 4),
        "urgency": urgency,
        "urgency_confidence": round(float(urgency_conf), 4),

        # Multitask outputs from text (preserved)
        "information_type": text_result.get("information_type", "GENERAL"),
        "required_resource": text_result.get("required_resource", "GENERAL_AID"),
        "vulnerable_group": text_result.get("vulnerable_group", "GENERAL_POPULATION"),
        "infrastructure_damage": (
            image_result.get("infrastructure_damage", {}) if image_result
            else text_result.get("infrastructure_damage", False)
        ),
        "location_entities": text_result.get("location_entities", []),
        "estimated_people_count": text_result.get("estimated_people_count"),
        "initial_credibility_score": text_result.get("initial_credibility_score", 0.5),

        # Image analysis (if available)
        "image_analysis": {
            "available": image_result is not None,
            "disaster_type": image_result.get("disaster_type") if image_result else None,
            "disaster_confidence": image_result.get("disaster_confidence") if image_result else None,
            "urgency": image_result.get("urgency") if image_result else None,
            "all_disaster_scores": image_result.get("all_disaster_scores", {}) if image_result else {},
        },

        # Fusion metadata
        "fusion": {
            "model_variant": model_variant,
            "modalities_used": modalities_used,
            "cross_modal_agreement": round(float(agreement), 3),
            "geo_context_boost": round(float(geo_boost), 3),
            "env_urgency_boost": round(float(env_boost), 3),
            "vulnerability_boost": round(float(vuln_boost), 3),
            "explanation": fusion_explanation,
        },
    }
