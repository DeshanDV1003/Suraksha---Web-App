import spacy
import os

# Load your fine-tuned model after training
# nlp_model = spacy.load("models/suraksha_ner")

# For initial testing, use a base model first
try:
    nlp_model = spacy.load("en_core_web_sm")
except OSError:
    # If not found, we'll need to download it: python -m spacy download en_core_web_sm
    nlp_model = None

INCIDENT_KEYWORDS = {
    "flood": "FLOOD",
    "landslide": "LANDSLIDE", 
    "fire": "FIRE",
    "collapse": "BUILDING_COLLAPSE",
    "medical": "MEDICAL_EMERGENCY",
    "drowning": "FLOOD",
    "inundated": "FLOOD"
}

def extract_entities(text: str) -> dict:
    entities = {
        "locations": [],
        "incident_type": None,
        "affected_count": None,
        "date_time": None
    }
    
    if nlp_model:
        doc = nlp_model(text)
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC"):
                entities["locations"].append(ent.text)
            elif ent.label_ == "CARDINAL":
                # likely an affected count
                entities["affected_count"] = int(ent.text) if ent.text.isdigit() else None
            elif ent.label_ == "DATE" or ent.label_ == "TIME":
                entities["date_time"] = ent.text
    
    # keyword match for incident type
    text_lower = text.lower()
    for keyword, incident_type in INCIDENT_KEYWORDS.items():
        if keyword in text_lower:
            entities["incident_type"] = incident_type
            break
    
    return entities
