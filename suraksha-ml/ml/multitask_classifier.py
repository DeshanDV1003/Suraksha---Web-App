"""
F5 — Multitask Multilingual Disaster Classification
Rule-based + statistical multitask model:
Disaster category, urgency, information type, required resource,
vulnerable group, infrastructure damage, location entities.
Supports Sinhala (si), Tamil (ta), English (en), code-mixed.
"""
import re
from typing import Optional

# ── Keyword maps ───────────────────────────────────────────────────────────────

DISASTER_KEYWORDS = {
    "FLOOD": [
        "flood", "flooding", "inundated", "water level", "overflow", "flash flood",
        "submerged", "waterlogged", "banjir",
        # Sinhala transliterated
        "gala", "wessa", "uda watura", "vatura", "wedagath",
        # Tamil transliterated
        "vella", "vellam", "mezhugu",
    ],
    "LANDSLIDE": [
        "landslide", "mudslide", "mudflow", "rockfall", "earth slip", "soil erosion",
        "mountain", "slope", "collapsed hill",
        "mati", "galadari", "pramana",
        "manneliruchchi", "manniriyam",
    ],
    "FIRE": [
        "fire", "burning", "blaze", "smoke", "arson", "inferno", "wildfire",
        "aahinawa", "gini", "daha",
        "nerupppu", "theeyai",
    ],
    "CYCLONE": [
        "cyclone", "hurricane", "typhoon", "storm", "wind", "gale", "tornado",
        "seeruwa", "kaththa",
        "suthavali", "kayiru",
    ],
    "DROUGHT": [
        "drought", "water shortage", "no water", "dry", "crop failure",
        "vatura nathi", "balanakarana",
        "vellam illai", "varandam",
    ],
    "TSUNAMI": [
        "tsunami", "tidal wave", "sea surge",
        "maha weyo", "samudra",
        "tsunami", "kadal alai",
    ],
    "EARTHQUAKE": [
        "earthquake", "tremor", "seismic", "quake",
        "bhooma kampa",
        "nilanadukkam", "nilam adutha",
    ],
    "BUILDING_COLLAPSE": [
        "collapsed", "building collapse", "roof fell", "wall fell", "structure failed",
        "kade wathuna", "kotiya",
        "kattadam vizhunthathu",
    ],
}

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

INFO_TYPE_KEYWORDS = {
    "EYEWITNESS": ["i saw", "we saw", "just happened", "happening now", "i am", "we are"],
    "HELP_REQUEST": ["help", "need", "rescue", "save", "stuck", "trapped", "assist"],
    "RESOURCE_NEED": ["food", "water", "medicine", "shelter", "blanket", "clothes", "supply"],
    "SITUATION_REPORT": ["report", "update", "situation", "status", "condition"],
    "RUMOR_WARNING": ["heard", "rumour", "rumor", "someone said", "people say"],
}

RESOURCE_KEYWORDS = {
    "MEDICAL": ["medical", "doctor", "nurse", "medicine", "hospital", "ambulance", "injection", "first aid"],
    "FOOD": ["food", "rice", "hungry", "starvation", "meal", "nutrition", "eating"],
    "WATER": ["water", "drinking water", "clean water", "dehydrated", "thirst"],
    "SHELTER": ["shelter", "house", "roof", "homeless", "displaced", "nowhere to stay"],
    "RESCUE": ["rescue", "boat", "helicopter", "rope", "trapped", "extraction"],
    "CLOTHING": ["clothes", "blanket", "warm", "clothing", "underwear"],
    "TRANSPORT": ["transport", "vehicle", "road", "ambulance", "boat", "helicopter"],
}

VULNERABLE_KEYWORDS = {
    "CHILDREN": ["child", "children", "baby", "infant", "kid", "school", "lamayin", "lamai", "pillaigal"],
    "ELDERLY": ["elderly", "old", "senior", "aged", "grandparent", "vayasa", "mahalla", "moodiyar"],
    "DISABLED": ["disabled", "wheelchair", "paralyzed", "bedridden", "vikalanga"],
    "PREGNANT": ["pregnant", "mother", "maternity", "newborn"],
    "INJURED": ["injured", "wounded", "hurt", "bleeding"],
}

INFRA_KEYWORDS = [
    "road", "bridge", "school", "hospital", "power", "electricity", "water pipe",
    "telephone", "communication", "building", "dam", "railway", "railway track",
]

LOCATION_PATTERNS = [
    r'\b(district|DS division|grama|village|town|city|road|street|junction|river|lake|reservoir)\b',
    r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b',  # Title Case words
]


def classify_multitask(text: str, latitude: Optional[float] = None, longitude: Optional[float] = None) -> dict:
    lower = text.lower()
    words = lower.split()

    # ── 1. Disaster category ──────────────────────────────────────────────────
    category_scores: dict = {}
    for cat, kws in DISASTER_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in lower)
        if score > 0:
            category_scores[cat] = score
    if category_scores:
        disaster_type = max(category_scores, key=lambda k: category_scores[k])
        cat_confidence = min(category_scores[disaster_type] / 3.0, 1.0)
    else:
        disaster_type = "UNKNOWN"
        cat_confidence = 0.3

    # ── 2. Urgency ───────────────────────────────────────────────────────────
    crit_score = sum(1 for kw in URGENCY_CRITICAL if kw in lower)
    high_score = sum(1 for kw in URGENCY_HIGH if kw in lower)
    if crit_score >= 1:
        urgency = "CRITICAL"
        urgency_conf = min(0.6 + crit_score * 0.1, 0.95)
    elif high_score >= 2:
        urgency = "HIGH"
        urgency_conf = min(0.55 + high_score * 0.05, 0.9)
    elif high_score == 1:
        urgency = "MEDIUM"
        urgency_conf = 0.6
    else:
        urgency = "LOW"
        urgency_conf = 0.7

    # ── 3. Information type ──────────────────────────────────────────────────
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

    # ── 5. Vulnerable group ──────────────────────────────────────────────────
    vuln_found = []
    for group, kws in VULNERABLE_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            vuln_found.append(group)
    vulnerable_group = vuln_found[0] if vuln_found else "GENERAL_POPULATION"

    # ── 6. Infrastructure damage ─────────────────────────────────────────────
    infra_damage = any(kw in lower for kw in INFRA_KEYWORDS)

    # ── 7. Location entities ─────────────────────────────────────────────────
    location_entities = []
    for pat in LOCATION_PATTERNS:
        matches = re.findall(pat, text, re.IGNORECASE)
        location_entities.extend(matches)
    location_entities = list(set(location_entities))[:5]

    # ── 8. People count estimate ─────────────────────────────────────────────
    count_match = re.search(r'\b(\d+)\s*(?:people|persons|families|houses|homes)\b', lower)
    estimated_people = int(count_match.group(1)) if count_match else None

    # ── 9. Credibility signals ───────────────────────────────────────────────
    has_numbers = bool(re.search(r'\d', text))
    has_location_detail = len(location_entities) > 0
    text_length_score = min(len(text) / 100.0, 1.0)
    credibility_signals = sum([has_numbers, has_location_detail, text_length_score > 0.3])
    initial_credibility = round(0.3 + credibility_signals * 0.2, 2)

    return {
        "disaster_type": disaster_type,
        "disaster_type_confidence": round(cat_confidence, 3),
        "urgency": urgency,
        "urgency_confidence": round(urgency_conf, 3),
        "information_type": info_type,
        "required_resource": required_resource,
        "vulnerable_group": vulnerable_group,
        "infrastructure_damage": infra_damage,
        "location_entities": location_entities,
        "estimated_people_count": estimated_people,
        "initial_credibility_score": initial_credibility,
        "model": "multitask_keyword_v1",
    }
