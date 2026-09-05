import os
import re
import spacy

# ── Load the trained Suraksha NER model (falls back to stock spaCy if the
#    custom model isn't present, e.g. before training/train_real_ner.py has
#    been run) ────────────────────────────────────────────────────────────────
_CUSTOM_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "suraksha_ner")

nlp_model = None
USING_CUSTOM_MODEL = False
try:
    if os.path.isdir(_CUSTOM_MODEL_PATH):
        nlp_model = spacy.load(_CUSTOM_MODEL_PATH)
        USING_CUSTOM_MODEL = True
        print("[OK] Loaded trained Suraksha NER model.")
except Exception as e:
    print(f"[WARNING] Failed to load trained Suraksha NER model: {e}")

if nlp_model is None:
    try:
        nlp_model = spacy.load("en_core_web_sm")
        print("[INFO] Using fallback stock spaCy model (en_core_web_sm).")
    except OSError:
        nlp_model = None
        print("[WARNING] No spaCy model available. Run: python -m spacy download en_core_web_sm")

INCIDENT_KEYWORDS = {
    "flood": "FLOOD",
    "landslide": "LANDSLIDE",
    "fire": "FIRE",
    "collapse": "BUILDING_COLLAPSE",
    "medical": "MEDICAL_EMERGENCY",
    "drowning": "FLOOD",
    "inundated": "FLOOD",
    "cyclone": "CYCLONE",
    "gale": "CYCLONE",
    "strong wind": "CYCLONE",
    "drought": "DROUGHT",
    "earthquake": "EARTHQUAKE",
    "tsunami": "TSUNAMI",
}

SEVERITY_KEYWORDS = {
    "catastrophic": "CRITICAL", "devastating": "CRITICAL", "critical": "CRITICAL",
    "severe": "HIGH", "extensive": "HIGH", "significant": "HIGH", "major": "HIGH",
    "moderate": "MEDIUM",
    "minor": "LOW", "limited": "LOW", "small-scale": "LOW",
}

URBAN_DISTRICTS = {"colombo", "gampaha", "kandy", "galle"}
COASTAL_DISTRICTS = {
    "colombo", "gampaha", "kalutara", "galle", "matara", "hambantota",
    "puttalam", "trincomalee", "batticaloa", "ampara", "jaffna",
    "mannar", "mullaitivu",
}

_COUNT_CONTEXT_RE = re.compile(
    r"(\d{1,3}(?:,\d{3})*|\d+)\s+(families?|people|persons?|deaths?|injured|missing|displaced|evacuated|houses?|buildings?)",
    re.IGNORECASE,
)
CASUALTY_WORDS = {"death", "deaths", "injured", "missing"}


def _parse_count_entities(text: str) -> dict:
    """Sum numeric mentions into affected_persons vs casualties by context word."""
    affected = 0
    casualties = 0
    for m in _COUNT_CONTEXT_RE.finditer(text):
        try:
            value = int(m.group(1).replace(",", ""))
        except ValueError:
            continue
        word = m.group(2).lower().rstrip("s")
        if word in CASUALTY_WORDS or word == "death":
            casualties += value
        else:
            affected += value
    return {"affected_persons": affected, "casualties": casualties}


def _detect_incident_type(text_lower: str) -> str:
    for keyword, incident_type in INCIDENT_KEYWORDS.items():
        if keyword in text_lower:
            return incident_type
    return None


def _detect_severity(text_lower: str) -> str:
    for keyword, tier in SEVERITY_KEYWORDS.items():
        if keyword in text_lower:
            return tier
    return "UNKNOWN"


def _detect_location_type(locations: list) -> str:
    for loc in locations:
        loc_l = loc.lower()
        if any(u in loc_l for u in URBAN_DISTRICTS):
            return "URBAN"
        if any(c in loc_l for c in COASTAL_DISTRICTS):
            return "COASTAL"
    return "RURAL" if locations else "UNKNOWN"


def extract_entities(text: str) -> dict:
    """
    Extract structured entities from report text.

    Returns a dict compatible with both legacy consumers (locations,
    incident_type, affected_count, date_time) and
    ml/feature_builder.py::build_feature_vector, which additionally reads
    location_type, severity, affected_persons and casualties.
    """
    entities = {
        "locations": [],
        "incident_type": None,
        "affected_count": None,
        "date_time": None,
        "location_type": "UNKNOWN",
        "severity": "UNKNOWN",
        "affected_persons": 0,
        "casualties": 0,
        "damage_mentions": [],
    }

    if nlp_model:
        doc = nlp_model(text)
        for ent in doc.ents:
            if USING_CUSTOM_MODEL:
                if ent.label_ == "LOC":
                    entities["locations"].append(ent.text)
                elif ent.label_ == "DATE":
                    entities["date_time"] = entities["date_time"] or ent.text
                elif ent.label_ == "DAMAGE":
                    entities["damage_mentions"].append(ent.text)
                # COUNT entities are parsed with context below via regex,
                # since the raw span alone doesn't say affected vs casualty.
            else:
                if ent.label_ in ("GPE", "LOC"):
                    entities["locations"].append(ent.text)
                elif ent.label_ == "CARDINAL":
                    entities["affected_count"] = int(ent.text) if ent.text.isdigit() else None
                elif ent.label_ in ("DATE", "TIME"):
                    entities["date_time"] = ent.text

    text_lower = text.lower()
    entities["incident_type"] = _detect_incident_type(text_lower)
    entities["severity"] = _detect_severity(text_lower)
    entities["location_type"] = _detect_location_type(entities["locations"])

    counts = _parse_count_entities(text)
    entities["affected_persons"] = counts["affected_persons"]
    entities["casualties"] = counts["casualties"]
    if entities["affected_count"] is None and counts["affected_persons"]:
        entities["affected_count"] = counts["affected_persons"]

    return entities
