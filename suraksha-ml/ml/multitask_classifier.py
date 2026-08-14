"""
F5 — Multitask Multilingual Disaster Classification
Weighted TF-IDF keyword scoring + phrase matching + co-occurrence boosting.
Disaster category, urgency, information type, required resource,
vulnerable group, infrastructure damage, location entities.
Supports Sinhala (si), Tamil (ta), English (en), code-mixed.
"""
import re
from typing import Optional

# ── Negation handling ──────────────────────────────────────────────────────────
_NEGATION_WORDS = {
    "no", "not", "never", "without", "ended", "over", "cleared", "resolved",
    "stopped", "false", "fake", "hoax", "rumour", "rumor", "nothing",
    "nathi", "illai", "illa",
}

def _strip_negated_text(text: str) -> str:
    words = text.split()
    result = []
    skip_until = -1
    for i, word in enumerate(words):
        if word.lower().rstrip(".,!?") in _NEGATION_WORDS:
            skip_until = i + 4
        result.append("" if i <= skip_until else word)
    return " ".join(result)


# ── Weighted keyword maps (weight = IDF-style rarity score) ───────────────────
# Higher weight = rarer / more diagnostic word → contributes more to confidence.
# Common words (water, road) = 1.0 | rare words (tsunami, earthquake) = 3.0

DISASTER_KEYWORDS = {
    "FLOOD": {
        "flood": 2.0, "flooding": 2.0, "flash flood": 3.0, "inundated": 2.5,
        "overflow": 2.0, "submerged": 2.5, "waterlogged": 2.0, "banjir": 2.0,
        "water level": 1.5, "water rising": 2.0, "river overflow": 3.0,
        "gala": 2.0, "wessa": 2.0, "uda watura": 2.5, "vatura": 1.5, "wedagath": 2.0,
        "vella": 2.0, "vellam": 2.0, "mezhugu": 2.5,
    },
    "LANDSLIDE": {
        "landslide": 3.0, "mudslide": 3.0, "mudflow": 3.0, "rockfall": 3.0,
        "earth slip": 2.5, "soil erosion": 2.0, "collapsed hill": 3.0,
        "slope": 1.5, "mountain": 1.0,
        "mati": 1.5, "galadari": 2.5, "pramana": 1.5,
        "manneliruchchi": 3.0, "manniriyam": 3.0,
    },
    "FIRE": {
        "fire": 2.0, "burning": 2.0, "blaze": 2.5, "inferno": 3.0,
        "wildfire": 3.0, "arson": 3.0, "smoke": 1.5,
        "aahinawa": 2.0, "gini": 2.0, "daha": 2.0,
        "nerupppu": 2.5, "theeyai": 2.5,
    },
    "CYCLONE": {
        "cyclone": 3.0, "hurricane": 3.0, "typhoon": 3.0, "tornado": 3.0,
        "gale": 2.5, "storm": 2.0, "wind": 1.0,
        "seeruwa": 2.5, "kaththa": 2.0,
        "suthavali": 2.5, "kayiru": 2.0,
    },
    "DROUGHT": {
        "drought": 3.0, "water shortage": 2.5, "crop failure": 3.0,
        "no water": 2.0, "dry": 1.0,
        "vatura nathi": 2.5, "balanakarana": 2.0,
        "vellam illai": 2.5, "varandam": 2.5,
    },
    "TSUNAMI": {
        "tsunami": 3.0, "tidal wave": 3.0, "sea surge": 3.0,
        "maha weyo": 3.0, "samudra": 2.0,
        "kadal alai": 3.0,
    },
    "EARTHQUAKE": {
        "earthquake": 3.0, "tremor": 3.0, "seismic": 3.0, "quake": 3.0,
        "bhooma kampa": 3.0,
        "nilanadukkam": 3.0, "nilam adutha": 3.0,
    },
    "BUILDING_COLLAPSE": {
        "collapsed": 2.5, "building collapse": 3.0, "roof fell": 3.0,
        "wall fell": 3.0, "structure failed": 3.0,
        "kade wathuna": 2.5, "kotiya": 2.0,
        "kattadam vizhunthathu": 3.0,
    },
}

# ── High-impact phrases (matched as phrases, score 3× single word) ────────────
DISASTER_PHRASES = {
    "FLOOD":             ["flash flood", "water level rising", "river overflow", "roads flooded", "home submerged"],
    "LANDSLIDE":         ["land collapsed", "mud coming down", "hill sliding", "road blocked by mud"],
    "FIRE":              ["house on fire", "building burning", "fire spreading", "cannot control fire"],
    "CYCLONE":           ["strong winds", "roof blown off", "trees falling", "storm approaching"],
    "BUILDING_COLLAPSE": ["building collapsed", "people trapped inside", "roof caved in", "wall fell on"],
    "EARTHQUAKE":        ["earth shaking", "ground shaking", "buildings shaking"],
    "TSUNAMI":           ["sea waves", "huge waves", "ocean rising"],
    "DROUGHT":           ["no rainfall", "crops dying", "water dried up"],
}

# ── Urgency keywords ───────────────────────────────────────────────────────────
URGENCY_CRITICAL = [
    "trapped", "dying", "unconscious", "bleeding", "heart attack", "stroke",
    "critical", "life threatening", "emergency", "rescue now", "drowning",
    "galawela", "maranayak", "maranam",
    "sandanakku", "maranamai",
]
URGENCY_HIGH = [
    "urgent", "immediate", "help needed", "danger", "injured", "medical",
    "hospital", "ambulance", "evacuation", "escape", "children", "elderly",
    "aadharawa", "apayata",
    "udanadi", "urgentaaga",
]

# ── Co-occurrence boosts ───────────────────────────────────────────────────────
# If both keywords appear together → apply urgency/category boost
CO_OCCURRENCE_BOOSTS = [
    ({"flood", "trapped"},    "urgency", 0.20),
    ({"fire", "children"},    "urgency", 0.20),
    ({"landslide", "buried"}, "urgency", 0.25),
    ({"flood", "rising"},     "category_flood", 0.15),
    ({"collapsed", "people"}, "urgency", 0.20),
    ({"water", "neck"},       "urgency", 0.25),
    ({"rescue", "now"},       "urgency", 0.20),
]

INFO_TYPE_KEYWORDS = {
    "EYEWITNESS":       ["i saw", "we saw", "just happened", "happening now", "i am", "we are"],
    "HELP_REQUEST":     ["help", "need", "rescue", "save", "stuck", "trapped", "assist"],
    "RESOURCE_NEED":    ["food", "water", "medicine", "shelter", "blanket", "clothes", "supply"],
    "SITUATION_REPORT": ["report", "update", "situation", "status", "condition"],
    "RUMOR_WARNING":    ["heard", "rumour", "rumor", "someone said", "people say"],
}

RESOURCE_KEYWORDS = {
    "MEDICAL":   ["medical", "doctor", "nurse", "medicine", "hospital", "ambulance", "injection", "first aid"],
    "FOOD":      ["food", "rice", "hungry", "starvation", "meal", "nutrition", "eating"],
    "WATER":     ["water", "drinking water", "clean water", "dehydrated", "thirst"],
    "SHELTER":   ["shelter", "house", "roof", "homeless", "displaced", "nowhere to stay"],
    "RESCUE":    ["rescue", "boat", "helicopter", "rope", "trapped", "extraction"],
    "CLOTHING":  ["clothes", "blanket", "warm", "clothing", "underwear"],
    "TRANSPORT": ["transport", "vehicle", "road", "ambulance", "boat", "helicopter"],
}

VULNERABLE_KEYWORDS = {
    "CHILDREN": ["child", "children", "baby", "infant", "kid", "school", "lamayin", "lamai", "pillaigal"],
    "ELDERLY":  ["elderly", "old", "senior", "aged", "grandparent", "vayasa", "mahalla", "moodiyar"],
    "DISABLED": ["disabled", "wheelchair", "paralyzed", "bedridden", "vikalanga"],
    "PREGNANT": ["pregnant", "mother", "maternity", "newborn"],
    "INJURED":  ["injured", "wounded", "hurt", "bleeding"],
}

INFRA_KEYWORDS = [
    "road", "bridge", "school", "hospital", "power", "electricity", "water pipe",
    "telephone", "communication", "building", "dam", "railway", "railway track",
]

LOCATION_PATTERNS = [
    r'\b(district|DS division|grama|village|town|city|road|street|junction|river|lake|reservoir)\b',
    r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b',
]


def _score_category(lower_safe: str) -> tuple:
    """Returns (disaster_type, raw_score, confidence) using weighted + phrase scoring."""
    scores: dict = {}

    # Weighted keyword scoring
    for cat, kw_weights in DISASTER_KEYWORDS.items():
        raw = sum(w for kw, w in kw_weights.items() if kw in lower_safe)
        if raw > 0:
            scores[cat] = scores.get(cat, 0) + raw

    # Phrase matching (3× single-word weight)
    for cat, phrases in DISASTER_PHRASES.items():
        for phrase in phrases:
            if phrase in lower_safe:
                scores[cat] = scores.get(cat, 0) + 3.0

    if not scores:
        return "UNKNOWN", 0.0, 0.30

    best_cat = max(scores, key=lambda k: scores[k])
    raw_score = scores[best_cat]

    # Confidence: logistic curve — score of 3.0 → ~73%, score of 6.0 → ~90%, score of 9.0 → ~96%
    import math
    confidence = round(1 / (1 + math.exp(-0.5 * (raw_score - 3.0))), 3)
    confidence = max(0.30, min(confidence, 0.97))

    return best_cat, raw_score, confidence


def classify_multitask(text: str, latitude: Optional[float] = None, longitude: Optional[float] = None) -> dict:
    lower = text.lower()
    lower_safe = _strip_negated_text(lower)
    words = set(lower_safe.split())

    # ── 1. Disaster category ──────────────────────────────────────────────────
    disaster_type, raw_cat_score, cat_confidence = _score_category(lower_safe)

    # ── 2. Urgency ───────────────────────────────────────────────────────────
    crit_score = sum(1 for kw in URGENCY_CRITICAL if kw in lower_safe)
    high_score = sum(1 for kw in URGENCY_HIGH if kw in lower_safe)

    # Co-occurrence boosts
    co_urgency_boost = 0.0
    for kw_set, boost_type, boost_val in CO_OCCURRENCE_BOOSTS:
        if kw_set.issubset(words) and boost_type == "urgency":
            co_urgency_boost += boost_val

    if crit_score >= 1:
        urgency = "CRITICAL"
        urgency_conf = min(0.65 + crit_score * 0.10 + co_urgency_boost, 0.97)
    elif high_score >= 2:
        urgency = "HIGH"
        urgency_conf = min(0.60 + high_score * 0.05 + co_urgency_boost, 0.93)
    elif high_score == 1 or co_urgency_boost > 0:
        urgency = "MEDIUM"
        urgency_conf = min(0.65 + co_urgency_boost, 0.80)
    else:
        urgency = "LOW"
        urgency_conf = 0.72

    # ── 3. Information type ───────────────────────────────────────────────────
    info_scores: dict = {}
    for itype, kws in INFO_TYPE_KEYWORDS.items():
        info_scores[itype] = sum(1 for kw in kws if kw in lower)
    info_type = max(info_scores, key=lambda k: info_scores[k]) if max(info_scores.values()) > 0 else "GENERAL"

    # ── 4. Required resource ─────────────────────────────────────────────────
    res_scores: dict = {}
    for res, kws in RESOURCE_KEYWORDS.items():
        res_scores[res] = sum(1 for kw in kws if kw in lower)
    top_resources = sorted(res_scores, key=lambda k: res_scores[k], reverse=True)
    required_resource = top_resources[0] if res_scores[top_resources[0]] > 0 else "GENERAL_AID"

    # ── 5. Vulnerable group ───────────────────────────────────────────────────
    vuln_found = [g for g, kws in VULNERABLE_KEYWORDS.items() if any(kw in lower for kw in kws)]
    vulnerable_group = vuln_found[0] if vuln_found else "GENERAL_POPULATION"

    # ── 6. Infrastructure damage ──────────────────────────────────────────────
    infra_damage = any(kw in lower for kw in INFRA_KEYWORDS)

    # ── 7. Location entities ──────────────────────────────────────────────────
    location_entities = list(set(
        m for pat in LOCATION_PATTERNS for m in re.findall(pat, text, re.IGNORECASE)
    ))[:5]

    # ── 8. People count estimate ──────────────────────────────────────────────
    count_match = re.search(r'\b(\d+)\s*(?:people|persons|families|houses|homes)\b', lower)
    estimated_people = int(count_match.group(1)) if count_match else None

    # ── 9. Credibility signals ────────────────────────────────────────────────
    has_numbers = bool(re.search(r'\d', text))
    has_location_detail = len(location_entities) > 0
    text_length_score = min(len(text) / 100.0, 1.0)
    credibility_signals = sum([has_numbers, has_location_detail, text_length_score > 0.3])
    initial_credibility = round(0.3 + credibility_signals * 0.2, 2)

    return {
        "disaster_type": disaster_type,
        "disaster_type_confidence": cat_confidence,
        "urgency": urgency,
        "urgency_confidence": round(urgency_conf, 3),
        "information_type": info_type,
        "required_resource": required_resource,
        "vulnerable_group": vulnerable_group,
        "infrastructure_damage": infra_damage,
        "location_entities": location_entities,
        "estimated_people_count": estimated_people,
        "initial_credibility_score": initial_credibility,
        "model": "multitask_weighted_v2",
    }
