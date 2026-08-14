from langdetect import detect, DetectorFactory
from langid import classify as langid_classify
import re

DetectorFactory.seed = 42

SUPPORTED = {'si', 'ta', 'en'}

# ── Unicode script ranges ──────────────────────────────────────────────────────
# If actual Sinhala/Tamil unicode chars are present → instant detection
_SINHALA_UNICODE = re.compile(r'[඀-෿]')
_TAMIL_UNICODE   = re.compile(r'[஀-௿]')

# ── Expanded Sinhala disaster word list (Latin transliteration) ───────────────
_SINHALA_WORDS = {
    # Disaster types
    "gala", "galawela", "wessa", "wathura", "vatura", "uda", "wedagath",
    "gini", "daha", "aahinawa", "seeruwa", "kaththa", "mati", "galadari",
    "pramana", "bhooma", "kampa", "kotiya", "kade", "wathuna", "balanakarana",
    # People / body
    "lamayin", "lamai", "mahalla", "vikalanga", "nathi", "maranayak", "maranam",
    "raththa", "atha", "oluwa", "kakula", "hadapathiyanawa",
    # Actions / urgency
    "sahaya", "karanna", "api", "ganna", "denna", "enna", "apayata", "aadharawa",
    "galawela", "bohoma", "aththata", "pennanna", "hithala", "dunna",
    # Locations / infrastructure
    "paarawak", "palama", "gedara", "gammana", "nagaraya", "gama", "wathura",
    "nadiya", "wewa", "ela", "kanda", "thenna", "pita",
    # Weather / environment
    "wessa", "wahina", "seethe", "rana", "hot", "theth",
    # Time
    "dawasaka", "atha", "rata", "pehe",
    # Common verbs used in reports
    "thiyanawa", "wenawa", "yanawa", "enawa", "karannaw", "dunna",
    # Numbers/quantifiers
    "deka", "thuna", "hathara", "pahak", "deka", "ganak", "dennek",
}

# ── Expanded Tamil disaster word list (Latin transliteration) ─────────────────
_TAMIL_WORDS = {
    # Disaster types
    "vella", "vellam", "mezhugu", "manneliruchchi", "manniriyam",
    "nerupppu", "theeyai", "suthavali", "kayiru", "kadal", "alai",
    "nilanadukkam", "nilam", "kattadam", "vizhunthathu",
    "sandanakku", "maranamai", "urgentaaga",
    # People / body
    "pillaigal", "moodiyar", "avan", "aval", "naan", "ungal", "engal",
    "kuzhanthai", "peiyar", "manidhar", "makkal", "uyir",
    # Actions / urgency
    "varuga", "sellungal", "udanadi", "thavarugal", "kaappathunga",
    "udhavi", "thaaga", "vendum", "mudiyalai", "seyya",
    # Locations
    "ooru", "nagar", "theru", "kadai", "paalai", "kundru", "aaral",
    "kurichi", "patti", "salai",
    # Weather
    "mazhai", "katru", "veyil", "aarukal", "puyal",
    # Common verbs
    "vandhuchu", "irukku", "poguthu", "varugindra", "seithom",
    # Numbers
    "onnu", "rendu", "moonu", "naalu", "anju", "palar", "sila",
}

# ── Sinhala-specific transliteration n-gram patterns ─────────────────────────
# Distinctive character sequences common in Sinhala-transliterated text
_SINHALA_NGRAMS = [
    r'\b\w*[aeiou]{2,}\w*\b',         # double vowels: aa, ee, oo, uu
    r'\b\w*(th|dh|sh|ng|nk)\w*\b',    # Sinhala consonant clusters
    r'\b\w*awa\b', r'\b\w*awa\b',      # -awa suffix common in Sinhala
    r'\b\w*nawa\b', r'\b\w*yata\b',    # verb suffixes
]
_SINHALA_NGRAM_PATTERN = re.compile(
    # Sinhala-specific suffixes/patterns — NOT generic double vowels (flood, book, food are English)
    r'\b\w*(nawa|yata|karanna|wenawa|genawa|dunna|kiyala|thiyanawa|keruwa)\b',
    re.IGNORECASE
)

# ── Tamil-specific transliteration patterns ───────────────────────────────────
_TAMIL_NGRAM_PATTERN = re.compile(
    r'(\b\w*(thal|kal|gal|ngal|chu|thu|vu|ku|du)\b)',
    re.IGNORECASE
)


def _unicode_detect(text: str):
    """Instant detection from actual unicode script characters."""
    si_count = len(_SINHALA_UNICODE.findall(text))
    ta_count = len(_TAMIL_UNICODE.findall(text))
    if si_count == 0 and ta_count == 0:
        return None
    if si_count >= ta_count:
        return {"language": "si", "confidence": 0.99}
    return {"language": "ta", "confidence": 0.99}


def _wordlist_detect(text: str):
    """Word-list pass for Latin-script transliterated Sinhala/Tamil."""
    words = set(text.lower().split())
    si_hits = len(words & _SINHALA_WORDS)
    ta_hits = len(words & _TAMIL_WORDS)

    # N-gram pattern scoring
    si_ngram = len(_SINHALA_NGRAM_PATTERN.findall(text))
    ta_ngram = len(_TAMIL_NGRAM_PATTERN.findall(text))

    si_score = si_hits * 2 + si_ngram
    ta_score = ta_hits * 2 + ta_ngram

    if si_score == 0 and ta_score == 0:
        return None

    if si_score >= ta_score:
        conf = round(min(0.60 + si_score * 0.06, 0.95), 2)
        return {"language": "si", "confidence": conf}
    conf = round(min(0.60 + ta_score * 0.06, 0.95), 2)
    return {"language": "ta", "confidence": conf}


def detect_language(text: str) -> dict:
    # 1. Unicode script detection — instant, highest confidence
    result = _unicode_detect(text)
    if result:
        return result

    # 2. Word-list + n-gram detection for Latin-script transliteration
    result = _wordlist_detect(text)
    if result:
        return result

    # 3. Library detection
    try:
        lang = detect(text)
        if lang in SUPPORTED:
            return {"language": lang, "confidence": 0.90}

        lang2, conf2 = langid_classify(text)
        if lang2 in SUPPORTED:
            return {"language": lang2, "confidence": round(float(abs(conf2)), 2)}

        return {"language": "en", "confidence": 0.50}
    except Exception:
        return {"language": "en", "confidence": 0.50}
