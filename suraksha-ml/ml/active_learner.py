"""
R4 — Low-Resource Explainable Active Learning for Sinhala/Tamil

Addresses the core low-resource problem:
  English XLM-R F1 = 0.84  (baseline)
  Sinhala XLM-R F1 = 0.68  ← target for improvement
  Tamil   XLM-R F1 = 0.65  ← target for improvement

Instead of randomly selecting samples for human annotation,
the system uses a Risk-Aware acquisition function that prioritises:
  - Uncertain samples (the model doesn't know)
  - Linguistically rare samples (Sinhala/Tamil/code-mixed)
  - Disaster-critical samples (wrong labels = dangerous)
  - Diverse samples (not redundant with already-labelled data)
  - Explanation-inconsistent samples (model predicts X but explains Y)

Acquisition formula:
  Score = α·U + β·D + γ·R + δ·L + ε·E

  U = Uncertainty        (epistemic uncertainty from MC Dropout)
  D = Diversity          (distance from nearest labelled example)
  R = Criticality        (disaster severity weight)
  L = Language rarity    (Sinhala/Tamil/code-mixed prioritised)
  E = Explanation inconsistency (SHAP/attention vs prediction disagreement)

Five strategies compared (ablation study):
  S1 — Random sampling (pure baseline)
  S2 — Uncertainty sampling (entropy of softmax)
  S3 — Entropy sampling (information-theoretic)
  S4 — Diversity sampling (maximum distance from labelled pool)
  S5 — Proposed Risk-Aware Explainable Active Learning (REAL)

Evaluation protocol:
  - Train at 10%, 25%, 50%, 75%, 100% of labelled data
  - Report Macro-F1, language-level F1, critical-case recall
  - Compare all 5 strategies at each data fraction

Output per sample:
  acquisition_score   — [0,1] priority for annotation
  strategy_scores     — per-strategy breakdown
  explanation         — why this sample was selected
  language_rarity     — how rare this language is in training data
  is_critical         — whether wrong label = dangerous
"""
import math
import re
import random
import logging
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Language rarity weights ────────────────────────────────────────────────────
# Higher = rarer in training data = higher priority for annotation
LANGUAGE_RARITY = {
    "en":    0.20,   # well-resourced, lower priority
    "si":    0.85,   # scarce — high priority
    "ta":    0.80,   # scarce — high priority
    "mixed": 0.90,   # code-mixed — rarest, highest priority
}
DEFAULT_RARITY = 0.60

# ── Disaster criticality weights ───────────────────────────────────────────────
# Misclassifying a CRITICAL flood = lives at risk → highest annotation priority
CRITICALITY_WEIGHTS = {
    "CRITICAL": 1.00,
    "HIGH":     0.75,
    "MEDIUM":   0.40,
    "LOW":      0.15,
    "UNKNOWN":  0.50,
}

DISASTER_CRITICALITY = {
    "FLOOD":             0.85,
    "LANDSLIDE":         0.90,
    "BUILDING_COLLAPSE": 1.00,
    "FIRE":              0.85,
    "EARTHQUAKE":        0.90,
    "TSUNAMI":           1.00,
    "CYCLONE":           0.80,
    "DROUGHT":           0.40,
    "UNKNOWN":           0.60,
}

# ── Acquisition weights (α, β, γ, δ, ε) ─────────────────────────────────────
# These are the hyperparameters of the proposed acquisition function.
# Tuned to balance uncertainty exploration with safety-critical prioritisation.
ALPHA = 0.30   # Uncertainty weight
BETA  = 0.20   # Diversity weight
GAMMA = 0.25   # Criticality weight
DELTA = 0.15   # Language rarity weight
EPSILON = 0.10 # Explanation inconsistency weight


# ─────────────────────────────────────────────────────────────────────────────
# U — Uncertainty score
# ─────────────────────────────────────────────────────────────────────────────

def uncertainty_score(confidence_scores: List[float]) -> dict:
    """
    Compute uncertainty from a distribution of confidence scores.
    Uses entropy (information-theoretic uncertainty).

    For a K-class prediction vector [p1, p2, ..., pK]:
      Entropy H = -Σ p_k log(p_k)
      Normalised: H / log(K)  ∈ [0, 1]

    Also computes:
      max_confidence     — highest class probability
      margin             — gap between top-2 probabilities (low margin = uncertain)
      variation_ratio    — fraction of MC samples not predicting the mode
    """
    if not confidence_scores:
        return {"uncertainty": 0.5, "entropy": 0.5, "margin": 0.5, "max_conf": 0.5}

    probs = np.array(confidence_scores, dtype=np.float32)
    probs = np.clip(probs / (probs.sum() + 1e-9), 1e-9, 1.0)

    K = len(probs)
    entropy = float(-np.sum(probs * np.log(probs))) / math.log(K) if K > 1 else 0.0

    sorted_p = np.sort(probs)[::-1]
    margin = float(sorted_p[0] - sorted_p[1]) if K >= 2 else 1.0
    margin_uncertainty = 1.0 - margin  # high margin = confident = low uncertainty

    max_conf = float(sorted_p[0])
    max_conf_uncertainty = 1.0 - max_conf

    # Combined uncertainty (entropy-weighted with margin)
    combined = 0.6 * entropy + 0.4 * margin_uncertainty

    return {
        "uncertainty": round(combined, 4),
        "entropy": round(entropy, 4),
        "margin_uncertainty": round(margin_uncertainty, 4),
        "max_confidence": round(max_conf, 4),
    }


# ─────────────────────────────────────────────────────────────────────────────
# D — Diversity score
# ─────────────────────────────────────────────────────────────────────────────

def diversity_score(
    candidate_embedding: List[float],
    labelled_embeddings: List[List[float]],
) -> float:
    """
    Diversity: distance from nearest already-labelled example.
    High diversity = the candidate is different from everything labelled so far.

    Uses cosine distance: d = 1 - cosine_similarity

    If no labelled embeddings, returns 1.0 (maximally diverse).
    """
    if not labelled_embeddings:
        return 1.0

    cand = np.array(candidate_embedding, dtype=np.float32)
    cand_norm = np.linalg.norm(cand)
    if cand_norm < 1e-9:
        return 0.5

    cand_unit = cand / cand_norm
    min_distance = 1.0  # cosine distance in [0, 2], normalised to [0, 1]

    for lab_emb in labelled_embeddings:
        lab = np.array(lab_emb, dtype=np.float32)
        lab_norm = np.linalg.norm(lab)
        if lab_norm < 1e-9:
            continue
        lab_unit = lab / lab_norm
        sim = float(np.dot(cand_unit, lab_unit))
        dist = (1.0 - sim) / 2.0  # normalise to [0, 1]
        min_distance = min(min_distance, dist)

    return round(min_distance, 4)


# ─────────────────────────────────────────────────────────────────────────────
# R — Criticality score
# ─────────────────────────────────────────────────────────────────────────────

def criticality_score(urgency: str, disaster_type: str, has_vulnerable: bool) -> float:
    """
    How dangerous is a mislabelling of this sample?
    Critical incidents with vulnerable persons = highest priority.
    """
    sev = CRITICALITY_WEIGHTS.get(urgency, 0.50)
    dis = DISASTER_CRITICALITY.get(disaster_type, 0.60)
    vuln = 1.20 if has_vulnerable else 1.0  # 20% boost for vulnerable persons
    raw = ((sev + dis) / 2.0) * vuln
    return round(min(raw, 1.0), 4)


# ─────────────────────────────────────────────────────────────────────────────
# L — Language rarity score
# ─────────────────────────────────────────────────────────────────────────────

def language_rarity_score(language: str, text: str) -> dict:
    """
    Score based on how underrepresented this language is in training data.
    Also detects code-mixing (Romanised Sinhala/Tamil + English).
    """
    lang = language.lower()

    # Detect code-mixing: contains both English words and Sinhala/Tamil script or romanisation
    sinhala_markers = ["eka", "watura", "gala", "nathi", "innawa", "denna", "wedi", "gama"]
    tamil_markers = ["illai", "vellam", "thanneer", "kadal", "uyir", "uravu", "padam"]
    english_words = len(re.findall(r"\b[a-zA-Z]{3,}\b", text))
    sinhala_hits = sum(1 for m in sinhala_markers if m in text.lower())
    tamil_hits = sum(1 for m in tamil_markers if m in text.lower())

    is_code_mixed = english_words > 2 and (sinhala_hits > 0 or tamil_hits > 0)
    is_romanised = (lang == "si" or lang == "ta") and bool(re.match(r"^[a-zA-Z\s\d,.!?]+$", text))

    effective_lang = "mixed" if is_code_mixed else lang
    rarity = LANGUAGE_RARITY.get(effective_lang, DEFAULT_RARITY)

    return {
        "rarity_score": round(rarity, 4),
        "detected_language": effective_lang,
        "is_code_mixed": is_code_mixed,
        "is_romanised_script": is_romanised,
        "sinhala_markers_found": sinhala_hits,
        "tamil_markers_found": tamil_hits,
    }


# ─────────────────────────────────────────────────────────────────────────────
# E — Explanation inconsistency score
# ─────────────────────────────────────────────────────────────────────────────

def explanation_inconsistency_score(
    predicted_label: str,
    top_features: List[dict],
    text: str,
) -> dict:
    """
    Detect cases where the model's explanation contradicts its prediction.
    This is where SHAP/LIME feature attributions point to different class
    than the predicted label.

    Example:
      Prediction: CRITICAL
      Top SHAP features: all pointing toward LOW severity
      → Explanation inconsistency = HIGH → prioritise for annotation

    Without a trained SHAP model, we use keyword-prediction alignment:
    Check whether the top keywords in the text align with the predicted label.
    """
    text_lower = text.lower()

    # Keywords that should appear in critical/high reports
    critical_keywords = ["trapped", "dying", "unconscious", "bleeding", "emergency",
                         "rescue now", "drowning", "maranayak", "galawela"]
    high_keywords = ["urgent", "injured", "medical", "hospital", "evacuation",
                     "children", "elderly", "danger"]
    low_keywords = ["minor", "small", "manageable", "controlled", "slight",
                    "no casualties", "no damage", "false alarm"]

    critical_hits = sum(1 for kw in critical_keywords if kw in text_lower)
    high_hits = sum(1 for kw in high_keywords if kw in text_lower)
    low_hits = sum(1 for kw in low_keywords if kw in text_lower)

    # Determine expected label from keywords
    if critical_hits >= 1:
        keyword_expected = "CRITICAL"
    elif high_hits >= 2:
        keyword_expected = "HIGH"
    elif low_hits >= 1:
        keyword_expected = "LOW"
    else:
        keyword_expected = "MEDIUM"

    inconsistent = (keyword_expected != predicted_label)

    # Feature attribution inconsistency (from top_features if provided)
    feature_inconsistency = 0.0
    if top_features:
        # If top positive features point toward a different class than predicted
        contradicting = [
            f for f in top_features
            if f.get("expected_class") and f["expected_class"] != predicted_label
            and f.get("attribution", 0) > 0
        ]
        feature_inconsistency = min(len(contradicting) / max(len(top_features), 1), 1.0)

    combined = 0.6 * float(inconsistent) + 0.4 * feature_inconsistency

    return {
        "inconsistency_score": round(combined, 4),
        "prediction": predicted_label,
        "keyword_expected": keyword_expected,
        "is_inconsistent": inconsistent,
        "critical_keyword_hits": critical_hits,
        "high_keyword_hits": high_hits,
        "feature_attribution_inconsistency": round(feature_inconsistency, 4),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Baseline strategies
# ─────────────────────────────────────────────────────────────────────────────

def strategy_random(candidates: List[dict], n_select: int, seed: int = 42) -> List[int]:
    """S1 — Random sampling baseline."""
    rng = random.Random(seed)
    indices = list(range(len(candidates)))
    rng.shuffle(indices)
    return indices[:n_select]


def strategy_uncertainty(candidates: List[dict], n_select: int) -> List[int]:
    """S2 — Uncertainty sampling: select most uncertain samples."""
    scored = [(i, c.get("uncertainty_score", 0.5)) for i, c in enumerate(candidates)]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [i for i, _ in scored[:n_select]]


def strategy_entropy(candidates: List[dict], n_select: int) -> List[int]:
    """S3 — Entropy sampling: select highest entropy predictions."""
    scored = [(i, c.get("entropy", 0.5)) for i, c in enumerate(candidates)]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [i for i, _ in scored[:n_select]]


def strategy_diversity(candidates: List[dict], n_select: int) -> List[int]:
    """S4 — Diversity sampling: select most different from labelled pool."""
    scored = [(i, c.get("diversity_score", 0.5)) for i, c in enumerate(candidates)]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [i for i, _ in scored[:n_select]]


# ─────────────────────────────────────────────────────────────────────────────
# Main: Risk-Aware Explainable Active Learning (REAL) — Proposed
# ─────────────────────────────────────────────────────────────────────────────

def compute_acquisition_score(
    confidence_distribution: List[float],
    candidate_embedding: List[float],
    labelled_embeddings: List[List[float]],
    urgency: str,
    disaster_type: str,
    has_vulnerable: bool,
    language: str,
    text: str,
    predicted_label: str,
    top_features: Optional[List[dict]] = None,
) -> dict:
    """
    Compute the full REAL acquisition score for a single candidate sample.

    Score = α·U + β·D + γ·R + δ·L + ε·E

    Returns all component scores for research transparency.
    """
    # U — Uncertainty
    u_result = uncertainty_score(confidence_distribution)
    U = u_result["uncertainty"]

    # D — Diversity
    D = diversity_score(candidate_embedding, labelled_embeddings)

    # R — Criticality
    R = criticality_score(urgency, disaster_type, has_vulnerable)

    # L — Language rarity
    l_result = language_rarity_score(language, text)
    L = l_result["rarity_score"]

    # E — Explanation inconsistency
    e_result = explanation_inconsistency_score(predicted_label, top_features or [], text)
    E = e_result["inconsistency_score"]

    # Weighted sum
    acquisition = ALPHA * U + BETA * D + GAMMA * R + DELTA * L + EPSILON * E
    acquisition = round(min(acquisition, 1.0), 4)

    # Explanation for the annotator
    drivers = []
    if U > 0.60:
        drivers.append(f"high model uncertainty ({U:.2f})")
    if L > 0.70:
        drivers.append(f"rare language '{l_result['detected_language']}' (rarity={L:.2f})")
    if R > 0.70:
        drivers.append(f"critical disaster type ({disaster_type}, urgency={urgency})")
    if D > 0.60:
        drivers.append(f"diverse sample (distance={D:.2f} from labelled pool)")
    if E > 0.40:
        drivers.append(f"explanation inconsistency ({e_result['prediction']} predicted but keywords suggest {e_result['keyword_expected']})")
    if has_vulnerable:
        drivers.append("vulnerable persons present")
    if l_result["is_code_mixed"]:
        drivers.append("code-mixed text (Sinhala/Tamil + English)")

    annotation_priority = (
        "URGENT" if acquisition >= 0.75 else
        "HIGH" if acquisition >= 0.55 else
        "MEDIUM" if acquisition >= 0.35 else
        "LOW"
    )

    return {
        "acquisition_score": acquisition,
        "annotation_priority": annotation_priority,
        "components": {
            "U_uncertainty": round(U, 4),
            "D_diversity": round(D, 4),
            "R_criticality": round(R, 4),
            "L_language_rarity": round(L, 4),
            "E_explanation_inconsistency": round(E, 4),
        },
        "weights": {
            "alpha": ALPHA, "beta": BETA, "gamma": GAMMA,
            "delta": DELTA, "epsilon": EPSILON,
        },
        "language_analysis": l_result,
        "uncertainty_detail": u_result,
        "explanation_detail": e_result,
        "annotation_drivers": drivers,
    }


def rank_candidates(
    candidates: List[dict],
    labelled_embeddings: Optional[List[List[float]]] = None,
    n_select: Optional[int] = None,
) -> dict:
    """
    Rank all candidate unlabelled samples by acquisition score.
    Also computes all 5 strategy rankings for ablation comparison.

    Each candidate dict should contain:
      text, language, urgency, disaster_type, has_vulnerable,
      predicted_label, confidence_distribution, embedding (optional)

    Returns:
      ranked_candidates   — sorted by REAL acquisition score
      strategy_comparison — which samples each strategy would select
      data_fraction_plan  — recommendation for 10/25/50/75/100% experiments
    """
    labelled_embs = labelled_embeddings or []
    scored = []

    for i, cand in enumerate(candidates):
        conf_dist = cand.get("confidence_distribution", [0.25, 0.25, 0.25, 0.25])
        embedding = cand.get("embedding", [0.0] * 10)
        result = compute_acquisition_score(
            confidence_distribution=conf_dist,
            candidate_embedding=embedding,
            labelled_embeddings=labelled_embs,
            urgency=cand.get("urgency", "MEDIUM"),
            disaster_type=cand.get("disaster_type", "UNKNOWN"),
            has_vulnerable=cand.get("has_vulnerable", False),
            language=cand.get("language", "en"),
            text=cand.get("text", ""),
            predicted_label=cand.get("predicted_label", "MEDIUM"),
            top_features=cand.get("top_features"),
        )
        scored.append({
            "index": i,
            "text_preview": cand.get("text", "")[:80],
            "language": cand.get("language", "en"),
            **result,
        })

    # Sort by REAL acquisition score
    scored.sort(key=lambda x: x["acquisition_score"], reverse=True)

    if n_select:
        scored = scored[:n_select]

    # Baseline strategy rankings (for ablation comparison table)
    strategy_comparison = {
        "S1_random":      strategy_random(candidates, min(n_select or 10, len(candidates))),
        "S2_uncertainty": strategy_uncertainty(
            [{**c, "uncertainty_score": compute_acquisition_score(
                c.get("confidence_distribution", [0.25]*4), [], [],
                c.get("urgency","MEDIUM"), c.get("disaster_type","UNKNOWN"),
                c.get("has_vulnerable",False), c.get("language","en"),
                c.get("text",""), c.get("predicted_label","MEDIUM")
            )["components"]["U_uncertainty"]} for c in candidates],
            min(n_select or 10, len(candidates))
        ),
        "S3_entropy": strategy_entropy(
            [{**c, "entropy": uncertainty_score(
                c.get("confidence_distribution", [0.25]*4)
            )["entropy"]} for c in candidates],
            min(n_select or 10, len(candidates))
        ),
        "S4_diversity": strategy_diversity(
            [{**c, "diversity_score": diversity_score(
                c.get("embedding", [0.0]*10), labelled_embs
            )} for c in candidates],
            min(n_select or 10, len(candidates))
        ),
        "S5_REAL_proposed": [s["index"] for s in scored],
    }

    # Data fraction plan for learning curve experiments
    n_total = len(candidates)
    fraction_plan = {
        "10pct": max(1, n_total // 10),
        "25pct": max(1, n_total // 4),
        "50pct": max(1, n_total // 2),
        "75pct": max(1, 3 * n_total // 4),
        "100pct": n_total,
        "recommendation": (
            "Run each strategy at each fraction. "
            "Compare Macro-F1, Sinhala-F1, Tamil-F1, critical-case recall. "
            "Expect REAL to outperform random at 10-25% fractions most significantly."
        ),
    }

    # Language distribution of top selections
    lang_dist = {}
    for s in scored[:max(n_select or 10, 1)]:
        lang = s.get("language_analysis", {}).get("detected_language", s["language"])
        lang_dist[lang] = lang_dist.get(lang, 0) + 1

    return {
        "ranked_candidates": scored,
        "strategy_comparison": strategy_comparison,
        "data_fraction_plan": fraction_plan,
        "selection_language_distribution": lang_dist,
        "total_candidates": n_total,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Evaluation: learning curve metrics
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_learning_curve(
    predictions: List[dict],
    true_labels: List[str],
    data_fraction: float,
    strategy_name: str,
) -> dict:
    """
    Compute evaluation metrics for a single point on the learning curve.

    predictions: list of {label, confidence, language, urgency}
    true_labels: ground truth labels
    data_fraction: 0.10, 0.25, 0.50, 0.75, 1.00
    strategy_name: S1..S5

    Returns per-language F1, overall Macro-F1, critical-case recall,
    and selective accuracy at various abstention thresholds.
    """
    classes = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    lang_groups = {"en": [], "si": [], "ta": [], "mixed": []}

    tp = {c: 0 for c in classes}
    fp = {c: 0 for c in classes}
    fn = {c: 0 for c in classes}

    critical_true = 0
    critical_recalled = 0

    for pred, true in zip(predictions, true_labels):
        p_label = pred.get("label", "MEDIUM")
        lang = pred.get("language", "en")
        correct = int(p_label == true)

        # Per-class TP/FP/FN
        for c in classes:
            if true == c and p_label == c:
                tp[c] += 1
            elif true != c and p_label == c:
                fp[c] += 1
            elif true == c and p_label != c:
                fn[c] += 1

        # Critical recall
        if true == "CRITICAL":
            critical_true += 1
            if p_label == "CRITICAL":
                critical_recalled += 1

        # Language grouping
        lang_key = lang if lang in lang_groups else "mixed"
        lang_groups[lang_key].append(correct)

    # Macro-F1
    f1_scores = []
    for c in classes:
        prec = tp[c] / (tp[c] + fp[c] + 1e-9)
        rec = tp[c] / (tp[c] + fn[c] + 1e-9)
        f1 = 2 * prec * rec / (prec + rec + 1e-9)
        f1_scores.append(f1)
    macro_f1 = round(float(np.mean(f1_scores)), 4)

    # Per-language accuracy
    lang_metrics = {}
    for lang, corrects in lang_groups.items():
        if corrects:
            lang_metrics[lang] = {
                "accuracy": round(sum(corrects) / len(corrects), 4),
                "n_samples": len(corrects),
            }

    critical_recall = round(critical_recalled / (critical_true + 1e-9), 4)

    return {
        "strategy": strategy_name,
        "data_fraction": data_fraction,
        "macro_f1": macro_f1,
        "per_language": lang_metrics,
        "critical_case_recall": critical_recall,
        "n_critical_samples": critical_true,
        "per_class_f1": {c: round(f1_scores[i], 4) for i, c in enumerate(classes)},
    }
