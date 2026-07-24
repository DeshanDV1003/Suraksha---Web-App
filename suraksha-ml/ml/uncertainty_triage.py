"""
F3 — Uncertainty-Aware Triage & AI Abstention
Computes calibrated uncertainty from prediction confidence.
Returns: decision (AUTO_CLASSIFY | REQUEST_CLARIFICATION | ESCALATE_TO_HUMAN),
prediction set (conformal-style), and explanation.
"""
from typing import Optional


def compute_uncertainty(
    priority_confidence: float,
    category_confidence: float,
    text_length: int,
    has_location: bool,
    detected_language: str,
    language_confidence: float,
) -> dict:
    """
    Combine multiple uncertainty signals into a calibrated uncertainty score
    and return a triage decision.

    Uncertainty model:
      U = 1 - (0.35·priority_conf + 0.25·category_conf + 0.15·lang_conf
               + 0.15·text_length_score + 0.10·location_score)
    """
    text_length_score = min(text_length / 150.0, 1.0)
    location_score = 1.0 if has_location else 0.0

    calibrated_confidence = (
        0.35 * priority_confidence +
        0.25 * category_confidence +
        0.15 * language_confidence +
        0.15 * text_length_score +
        0.10 * location_score
    )
    uncertainty = round(1.0 - calibrated_confidence, 3)
    calibrated_confidence = round(calibrated_confidence, 3)

    # ── Decision thresholds ───────────────────────────────────────────────────
    # These thresholds are tunable via Settings in the frontend
    AUTO_THRESHOLD = 0.65       # ≥ 65% confidence → auto-classify
    ESCALATE_THRESHOLD = 0.45   # < 45% confidence → escalate to human

    if calibrated_confidence >= AUTO_THRESHOLD:
        decision = "AUTO_CLASSIFY"
        decision_label = "Auto-classified with high confidence"
    elif calibrated_confidence >= ESCALATE_THRESHOLD:
        decision = "REQUEST_CLARIFICATION"
        decision_label = "Request follow-up from reporter"
    else:
        decision = "ESCALATE_TO_HUMAN"
        decision_label = "Escalated to officer — insufficient evidence"

    # ── Conformal prediction set ─────────────────────────────────────────────
    # Simulates a prediction set with coverage guarantee.
    # In a real system this uses conformal calibration on a held-out set.
    SEVERITY_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    prediction_set = []
    if calibrated_confidence >= 0.70:
        # High confidence — single-element set
        prediction_set = [_priority_from_confidence(calibrated_confidence)]
    elif calibrated_confidence >= 0.50:
        # Medium — two-element set
        p = _priority_from_confidence(calibrated_confidence)
        idx = SEVERITY_LEVELS.index(p)
        prediction_set = [p]
        if idx + 1 < len(SEVERITY_LEVELS):
            prediction_set.append(SEVERITY_LEVELS[idx + 1])
    else:
        # Low — wider set
        prediction_set = SEVERITY_LEVELS[:3]

    # ── Explanation ───────────────────────────────────────────────────────────
    factors = []
    if priority_confidence < 0.5:
        factors.append("low priority classifier confidence")
    if category_confidence < 0.5:
        factors.append("ambiguous disaster type")
    if text_length < 30:
        factors.append("very short report text")
    if not has_location:
        factors.append("no location information")
    if detected_language != "en" and language_confidence < 0.7:
        factors.append(f"uncertain language detection ({detected_language})")

    explanation = (
        f"Calibrated confidence {calibrated_confidence:.0%}."
        + (f" Uncertainty drivers: {', '.join(factors)}." if factors else " All signals strong.")
    )

    return {
        "calibrated_confidence": calibrated_confidence,
        "uncertainty": uncertainty,
        "decision": decision,
        "decision_label": decision_label,
        "prediction_set": prediction_set,
        "explanation": explanation,
        "thresholds": {
            "auto_classify": AUTO_THRESHOLD,
            "request_clarification": ESCALATE_THRESHOLD,
        },
    }


def _priority_from_confidence(conf: float) -> str:
    if conf >= 0.85:
        return "CRITICAL"
    if conf >= 0.70:
        return "HIGH"
    if conf >= 0.50:
        return "MEDIUM"
    return "LOW"
