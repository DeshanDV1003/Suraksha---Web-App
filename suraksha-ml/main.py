from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import os
from typing import List, Optional, Any, Dict

# Optional NLP modules — only needed for /process-report endpoint
try:
    import joblib
    from nlp.language_detector import detect_language
    from nlp.translator import translate_to_english
    from nlp.ner_extractor import extract_entities
    from ml.feature_builder import build_feature_vector
    from ml.damage_scorer import score_damage_assessment
    from ml.fake_report_detector import check_duplicate
    NLP_AVAILABLE = True
except ImportError as e:
    NLP_AVAILABLE = False
    print(f"[WARNING] NLP modules unavailable ({e}). /process-report endpoint disabled.")
    joblib = None
    detect_language = translate_to_english = extract_entities = None
    build_feature_vector = score_damage_assessment = check_duplicate = None

from ml.lstm_water_predictor import predictor as water_predictor
from ml.multitask_classifier import classify_multitask
from ml.uncertainty_triage import compute_uncertainty
from ml.clarification_generator import generate_clarification_questions
from ml.hotspot_forecaster import forecast_hotspots
from ml.resource_optimizer import optimize_allocation
from ml.team_composer import compose_team
from ml.situation_summarizer import generate_situation_summary
from ml.drift_detector import detect_drift

app = FastAPI(title="Suraksha ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
PRIORITY_MODEL_PATH = "models/priority_classifier.pkl"
LABEL_ENCODER_PATH = "models/label_encoder.pkl"

# Global model variables (for NLP classifier)
classifier = None
label_encoder = None

@app.on_event("startup")
async def load_models():
    global classifier, label_encoder
    if not NLP_AVAILABLE:
        return
    try:
        import joblib as jl
        if os.path.exists(PRIORITY_MODEL_PATH):
            classifier = jl.load(PRIORITY_MODEL_PATH)
        if os.path.exists(LABEL_ENCODER_PATH):
            label_encoder = jl.load(LABEL_ENCODER_PATH)
    except Exception as e:
        print(f"Warning: Could not load classifier: {e}")

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
    if not NLP_AVAILABLE:
        raise HTTPException(status_code=503, detail="NLP modules not installed on this server.")
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
    if not NLP_AVAILABLE:
        raise HTTPException(status_code=503, detail="NLP modules not installed.")
    return score_damage_assessment(data.dict())

@app.post("/check-duplicate")
async def check_dup(text: str, existing_texts: list[str]):
    if not NLP_AVAILABLE:
        raise HTTPException(status_code=503, detail="NLP modules not installed.")
    return check_duplicate(text, existing_texts)


# ═══════════════════════════════════════════
# WATER LEVEL PREDICTION ENDPOINTS
# ═══════════════════════════════════════════

class WaterReading(BaseModel):
    water_level_m: float
    rainfall_mm_hr: float = 0.0
    rainfall_24h_total: float = 0.0
    humidity_pct: float = 75.0
    temp_c: float = 28.0
    month: int = 1

class GaugeThresholds(BaseModel):
    watch_m: float = 4.5
    warning_m: float = 6.0
    critical_m: float = 8.0

class WaterPredictionInput(BaseModel):
    gauge_id: str
    gauge_thresholds: Optional[GaugeThresholds] = None
    readings: List[WaterReading]   # last N hourly readings, newest last

class WaterPredictionOutput(BaseModel):
    gauge_id: str
    predicted_t1_m: float
    predicted_t2_m: float
    confidence: float
    alert_level: str
    model_used: str
    reason: str
    predicted_at: str


@app.post("/predict-water-level", response_model=WaterPredictionOutput)
async def predict_water_level(data: WaterPredictionInput):
    """
    Core LSTM prediction endpoint.
    Called by Node.js backend every hour after a new reading is saved.
    Accepts last 12 hourly readings, returns T+1hr and T+2hr predictions
    with confidence score and alert level.
    Alert is suppressed if confidence < 75% to prevent false alarms.
    """
    if len(data.readings) < 3:
        raise HTTPException(
            status_code=400,
            detail="Minimum 3 readings required. Provide up to 12 for best accuracy."
        )

    readings_list = [r.dict() for r in data.readings]
    thresholds    = data.gauge_thresholds.dict() if data.gauge_thresholds else None

    result = water_predictor.predict(
        readings=readings_list,
        gauge_thresholds=thresholds
    )

    return WaterPredictionOutput(
        gauge_id       = data.gauge_id,
        predicted_t1_m = result["predicted_t1_m"],
        predicted_t2_m = result["predicted_t2_m"],
        confidence     = result["confidence"],
        alert_level    = result["alert_level"],
        model_used     = result["model_used"],
        reason         = result["reason"],
        predicted_at   = result["predicted_at"]
    )


@app.get("/water-model-status")
async def water_model_status():
    """Returns the LSTM water model load status and metadata."""
    return {
        "model_loaded": water_predictor.model_loaded,
        "model_info":   water_predictor.model_info,
        "status":       "LSTM" if water_predictor.model_loaded else "RULE_BASED_FALLBACK"
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "models_loaded": classifier is not None,
        "water_model_loaded": water_predictor.model_loaded
    }


# ═══════════════════════════════════════════════════════════════════════════════
# RESEARCH FEATURES — F3, F4, F5, F7, F8, F10, F12, F15, F16
# ═══════════════════════════════════════════════════════════════════════════════

# ── F5 + F3 — Combined Full Analysis (multitask + uncertainty) ─────────────────

class FullAnalysisInput(BaseModel):
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    detected_language: str = "en"
    language_confidence: float = 0.7
    priority_confidence: float = 0.5

@app.post("/analyze-report")
async def analyze_report(data: FullAnalysisInput):
    """
    F5 + F3: Full multitask classification + uncertainty triage.
    Returns disaster type, urgency, info type, resource needs, vulnerable group,
    infrastructure flag, uncertainty score, and abstention decision.
    """
    multitask = classify_multitask(data.text, data.latitude, data.longitude)

    uncertainty = compute_uncertainty(
        priority_confidence=data.priority_confidence,
        category_confidence=multitask["disaster_type_confidence"],
        text_length=len(data.text),
        has_location=bool(data.latitude and data.longitude),
        detected_language=data.detected_language,
        language_confidence=data.language_confidence,
    )

    return {
        "multitask": multitask,
        "uncertainty": uncertainty,
    }


# ── F4 — Clarification Questions ──────────────────────────────────────────────

class ClarificationInput(BaseModel):
    text: str
    disaster_type: str = "DEFAULT"
    urgency: str = "MEDIUM"
    detected_language: str = "en"

@app.post("/clarification-questions")
async def clarification_questions(data: ClarificationInput):
    """F4: Generate targeted slot-filling clarification questions."""
    return generate_clarification_questions(
        text=data.text,
        disaster_type=data.disaster_type,
        urgency=data.urgency,
        detected_language=data.detected_language,
    )


# ── F7 + F8 — Hotspot Forecast + Bias Correction ──────────────────────────────

class HotspotInput(BaseModel):
    incidents: List[Dict[str, Any]]
    water_levels: Optional[List[Dict[str, Any]]] = None

@app.post("/hotspot-forecast")
async def hotspot_forecast(data: HotspotInput):
    """F7 + F8: Spatiotemporal hotspot forecasting with reporting-bias correction."""
    return forecast_hotspots(data.incidents, data.water_levels)


# ── F10 — Resource Optimization ───────────────────────────────────────────────

class AllocationInput(BaseModel):
    help_requests: List[Dict[str, Any]]
    resources: List[Dict[str, Any]]
    volunteers: List[Dict[str, Any]]

@app.post("/optimize-allocation")
async def optimize_allocation_endpoint(data: AllocationInput):
    """F10: Multi-objective relief resource allocation (NSGA-II approximation)."""
    return optimize_allocation(
        help_requests=data.help_requests,
        resources=data.resources,
        volunteers=data.volunteers,
    )


# ── F12 — Team Composition ────────────────────────────────────────────────────

class TeamInput(BaseModel):
    volunteers: List[Dict[str, Any]]
    disaster_type: str = "DEFAULT"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    team_size: int = 4

@app.post("/compose-team")
async def compose_team_endpoint(data: TeamInput):
    """F12: Adaptive responder team composition via bipartite skill matching."""
    return compose_team(
        volunteers=data.volunteers,
        disaster_type=data.disaster_type,
        incident_latitude=data.latitude,
        incident_longitude=data.longitude,
        team_size=data.team_size,
    )


# ── F16 — Situation Summarization ─────────────────────────────────────────────

class SummaryInput(BaseModel):
    incidents: List[Dict[str, Any]]
    help_requests: List[Dict[str, Any]]
    water_levels: Optional[List[Dict[str, Any]]] = None
    camps: Optional[List[Dict[str, Any]]] = None
    window_hours: int = 2

@app.post("/situation-summary")
async def situation_summary(data: SummaryInput):
    """F16: Grounded operational situation summarization with evidence citations."""
    return generate_situation_summary(
        incidents=data.incidents,
        help_requests=data.help_requests,
        water_levels=data.water_levels,
        camps=data.camps,
        window_hours=data.window_hours,
    )


# ── F15 — Concept Drift Detection ─────────────────────────────────────────────

class DriftInput(BaseModel):
    recent_incidents: List[Dict[str, Any]]
    window_hours: int = 24

@app.post("/detect-drift")
async def detect_drift_endpoint(data: DriftInput):
    """F15: Concept-drift and emerging-event detection via distribution monitoring."""
    return detect_drift(
        recent_incidents=data.recent_incidents,
        window_hours=data.window_hours,
    )


# ── Face Matching ──────────────────────────────────────────────────────────────

class FaceCandidate(BaseModel):
    person_id: str
    photo: str  # base64 encoded image

class FaceMatchInput(BaseModel):
    query_image: str          # base64 encoded query photo
    candidates: List[FaceCandidate]

@app.post("/match-face")
async def match_face_endpoint(data: FaceMatchInput):
    """
    AI face matching — compare query photo against candidate missing-person photos.
    Returns list of {person_id, confidence, verified} sorted by confidence descending.
    """
    try:
        from ml.face_matcher import match_faces
        results = match_faces(
            query_b64=data.query_image,
            candidates=[c.dict() for c in data.candidates],
        )
        return {"matches": results, "total_candidates": len(data.candidates)}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face matching failed: {str(e)}")
