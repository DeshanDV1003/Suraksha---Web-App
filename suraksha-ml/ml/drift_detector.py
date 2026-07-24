"""
F15 — Concept-Drift & Emerging Event Detection
Monitors incoming report distribution for shifts from the training baseline.
Uses simple statistical measures (vocabulary shift, category distribution shift,
geographic novelty) to detect when model accuracy may be degrading.
"""
from collections import Counter
from typing import List
import math

# Baseline category distribution learned from training data
BASELINE_CATEGORY_DIST = {
    "FLOOD": 0.35,
    "LANDSLIDE": 0.20,
    "FIRE": 0.15,
    "CYCLONE": 0.10,
    "DROUGHT": 0.05,
    "BUILDING_COLLAPSE": 0.08,
    "EARTHQUAKE": 0.02,
    "TSUNAMI": 0.01,
    "UNKNOWN": 0.04,
}

# Baseline language distribution
BASELINE_LANG_DIST = {
    "en": 0.55,
    "si": 0.30,
    "ta": 0.15,
}


def _kl_divergence(p: dict, q: dict) -> float:
    """KL divergence D(P||Q) — measures how much P diverges from Q."""
    eps = 1e-9
    all_keys = set(p.keys()) | set(q.keys())
    total_p = max(sum(p.values()), eps)
    total_q = max(sum(q.values()), eps)
    kl = 0.0
    for k in all_keys:
        pk = p.get(k, eps) / total_p
        qk = q.get(k, eps) / total_q
        kl += pk * math.log(pk / qk + eps)
    return round(kl, 4)


def _top_novel_terms(recent_texts: List[str], baseline_vocab: List[str], top_n: int = 5) -> List[str]:
    """Find terms appearing frequently in recent reports but not in baseline vocab."""
    word_counts: Counter = Counter()
    for text in recent_texts:
        words = text.lower().split()
        word_counts.update(words)

    baseline_set = set(w.lower() for w in baseline_vocab)
    novel = [(w, c) for w, c in word_counts.most_common(50) if w not in baseline_set and len(w) > 3]
    return [w for w, _ in novel[:top_n]]


def detect_drift(
    recent_incidents: List[dict],
    window_hours: int = 24,
    baseline_vocab: List[str] = None,
) -> dict:
    """
    Analyse recent incidents for distribution shift.
    Returns drift score, detected anomalies, and recommended actions.
    """
    if not recent_incidents:
        return {
            "drift_detected": False,
            "drift_score": 0.0,
            "anomalies": [],
            "recommendation": "Insufficient data for drift analysis.",
        }

    # Category distribution
    cat_counts: Counter = Counter(i.get("category", "UNKNOWN") for i in recent_incidents)
    current_cat_dist = dict(cat_counts)
    cat_kl = _kl_divergence(current_cat_dist, BASELINE_CATEGORY_DIST)

    # Language distribution
    lang_counts: Counter = Counter(i.get("detectedLanguage", "en") for i in recent_incidents)
    current_lang_dist = dict(lang_counts)
    lang_kl = _kl_divergence(current_lang_dist, BASELINE_LANG_DIST)

    # Geographic novelty — districts with zero historical incidents
    districts = [i.get("province") or i.get("zoneName", "") for i in recent_incidents]
    district_counts = Counter(d for d in districts if d)
    novel_districts = [d for d, c in district_counts.items() if c >= 3 and d not in ("", None)]

    # Novel vocabulary
    texts = [i.get("description", "") + " " + i.get("title", "") for i in recent_incidents]
    baseline_vocab = baseline_vocab or list(BASELINE_CATEGORY_DIST.keys())
    novel_terms = _top_novel_terms(texts, baseline_vocab)

    # Confidence trend
    confidences = [i.get("mlConfidence", 0.5) for i in recent_incidents if i.get("mlConfidence") is not None]
    avg_confidence = round(sum(confidences) / len(confidences), 3) if confidences else 0.5
    confidence_drop = avg_confidence < 0.50

    # Overall drift score (0–1)
    drift_score = min(
        0.4 * min(cat_kl / 0.5, 1.0) +
        0.2 * min(lang_kl / 0.3, 1.0) +
        0.2 * min(len(novel_terms) / 5, 1.0) +
        0.2 * (1.0 if confidence_drop else 0.0),
        1.0,
    )
    drift_score = round(drift_score, 3)

    anomalies = []
    if cat_kl > 0.15:
        top_new = cat_counts.most_common(1)[0]
        anomalies.append(
            f"Category distribution shifted (KL={cat_kl:.3f}). "
            f"'{top_new[0]}' is now {round(top_new[1]/len(recent_incidents)*100)}% of reports "
            f"(baseline: {round(BASELINE_CATEGORY_DIST.get(top_new[0], 0)*100)}%)."
        )
    if lang_kl > 0.10:
        anomalies.append(
            f"Language distribution shifted (KL={lang_kl:.3f}). "
            f"Recent lang dist: {dict(lang_counts.most_common(3))}."
        )
    if novel_terms:
        anomalies.append(f"Novel terminology detected: {', '.join(novel_terms)}.")
    if confidence_drop:
        anomalies.append(f"Average model confidence dropped to {avg_confidence:.0%} — below 50% threshold.")
    if novel_districts:
        anomalies.append(f"Unusual activity in {', '.join(novel_districts[:3])} — not in historical baseline.")

    drift_detected = drift_score > 0.30

    recommendation = (
        "No significant drift detected — model performance likely stable."
        if not drift_detected
        else (
            "DRIFT DETECTED. "
            + ("Recommend model retraining with recent annotated examples. " if drift_score > 0.60 else "")
            + "Review flagged anomalies. Consider manual officer review for recent classifications."
        )
    )

    return {
        "drift_detected": drift_detected,
        "drift_score": drift_score,
        "drift_level": "HIGH" if drift_score > 0.60 else ("MEDIUM" if drift_score > 0.30 else "LOW"),
        "category_kl_divergence": cat_kl,
        "language_kl_divergence": lang_kl,
        "avg_model_confidence": avg_confidence,
        "novel_terms": novel_terms,
        "anomalies": anomalies,
        "recommendation": recommendation,
        "reports_analysed": len(recent_incidents),
        "window_hours": window_hours,
    }
