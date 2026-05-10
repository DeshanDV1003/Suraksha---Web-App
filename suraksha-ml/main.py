from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os

from nlp.language_detector import detect_language
from nlp.translator import translate_to_english
from nlp.ner_extractor import extract_entities
from ml.feature_builder import build_feature_vector
from ml.damage_scorer import score_damage_assessment
from ml.fake_report_detector import check_duplicate

app = FastAPI(title="Suraksha ML Service")

# Model paths
PRIORITY_MODEL_PATH = "models/priority_classifier.pkl"
LABEL_ENCODER_PATH = "models/label_encoder.pkl"

# Global model variables
classifier = None
label_encoder = None

@app.on_event("startup")
async def load_models():
    global classifier, label_encoder
    if os.path.exists(PRIORITY_MODEL_PATH):
        classifier = joblib.load(PRIORITY_MODEL_PATH)
    else:
        print(f"Warning: Priority classifier not found at {PRIORITY_MODEL_PATH}")
    
    if os.path.exists(LABEL_ENCODER_PATH):
        label_encoder = joblib.load(LABEL_ENCODER_PATH)

class ReportInput(BaseModel):
    raw_text: str
    latitude: float = None
    longitude: float = None
    has_media: bool = False
    hour_of_day: int = 12
    has_children: bool = False
    has_elderly: bool = False
    has_disabled: bool = False

class ProcessedOutput(BaseModel):
    detected_language: str
    language_confidence: float
    translated_text: str
    nlp_entities: dict
    priority: str
    priority_confidence: float

class DamageInput(BaseModel):
    structuralDamage: str = "NONE"
    cropDamage: str = "NONE"
    utilityDamage: str = "NONE"
    roadDamage: str = "NONE"
    affectedPersons: int = 0

@app.post("/process-report", response_model=ProcessedOutput)
async def process_report(data: ReportInput):
    # Step 1 — detect language
    lang_result = detect_language(data.raw_text)
    
    # Step 2 — translate if needed
    translated = translate_to_english(data.raw_text, lang_result["language"])
    
    # Step 3 — extract entities
    entities = extract_entities(translated)
    
    # Step 4 — build feature vector
    metadata = {
        "has_media": data.has_media,
        "hour_of_day": data.hour_of_day,
        "has_children": data.has_children,
        "has_elderly": data.has_elderly,
        "has_disabled": data.has_disabled
    }
    features = build_feature_vector(entities, metadata)
    
    # Step 5 — classify priority
    priority = "MEDIUM"
    confidence = 0.0
    
    if classifier:
        features_2d = features.reshape(1, -1)
        prediction = classifier.predict(features_2d)[0]
        probabilities = classifier.predict_proba(features_2d)[0]
        confidence = float(max(probabilities))
        priority = str(prediction)
    else:
        # Fallback simple logic if model not trained
        if entities.get("incident_type") in ["FLOOD", "LANDSLIDE", "FIRE"]:
            priority = "HIGH"
            confidence = 0.6
    
    return ProcessedOutput(
        detected_language=lang_result["language"],
        language_confidence=lang_result["confidence"],
        translated_text=translated,
        nlp_entities=entities,
        priority=priority,
        priority_confidence=confidence
    )

@app.post("/score-damage")
async def score_damage(data: DamageInput):
    return score_damage_assessment(data.dict())

@app.post("/check-duplicate")
async def check_dup(text: str, existing_texts: list[str]):
    return check_duplicate(text, existing_texts)

@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": classifier is not None}
