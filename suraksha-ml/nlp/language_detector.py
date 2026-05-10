from langdetect import detect, DetectorFactory
from langid import classify as langid_classify

DetectorFactory.seed = 42  # makes results consistent

SUPPORTED = {'si', 'ta', 'en'}

def detect_language(text: str) -> dict:
    try:
        lang = detect(text)
        # langdetect sometimes confuses si/ta — use langid as fallback
        if lang not in SUPPORTED:
            lang, confidence = langid_classify(text)
            return {"language": lang, "confidence": float(confidence)}
        return {"language": lang, "confidence": 0.90}
    except Exception:
        return {"language": "en", "confidence": 0.50}
