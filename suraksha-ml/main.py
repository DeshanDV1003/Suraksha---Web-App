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

# R1 — Multimodal fusion modules
from ml.image_encoder import encode_image
from ml.multimodal_fusion import fuse_modalities

# R4 — Low-Resource Explainable Active Learning
from ml.active_learner import compute_acquisition_score, rank_candidates, evaluate_learning_curve

# R5 — Bias-Aware Spatiotemporal Risk Forecasting
from ml.spatiotemporal_forecaster import forecast_risk, multi_district_forecast, estimate_reporting_bias

# R6 — Multi-Objective Relief Coordination (NSGA-II)
from ml.relief_coordinator import coordinate_relief

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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    has_media: bool = False
    image_base64: Optional[str] = None       # R1: attached image (base64)
    hour_of_day: Optional[int] = None        # R1: temporal context
    month: Optional[int] = None              # R1: seasonal context
    has_children: bool = False
    has_elderly: bool = False
    has_disabled: bool = False
    environmental_data: Optional[Dict] = None  # R1: rainfall/river context
    model_variant: str = "M5"               # M1–M5 for ablation experiments

class ProcessedOutput(BaseModel):
    detected_language: str
    language_confidence: float
    translated_text: str
    nlp_entities: dict
    priority: str
    priority_confidence: float
    # R1 extended fields
    multimodal: Optional[Dict] = None        # full fusion output
    uncertainty: Optional[Dict] = None       # R2 uncertainty quantification

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

    import datetime

    # ── Step 1: Language detection ────────────────────────────────────────────
    lang_result = detect_language(data.raw_text)

    # ── Step 2: Translation ───────────────────────────────────────────────────
    translated = translate_to_english(data.raw_text, lang_result["language"])

    # ── Step 3: NER entity extraction ─────────────────────────────────────────
    entities = extract_entities(translated)

    # ── Step 4: Multitask text classification ─────────────────────────────────
    text_multitask = classify_multitask(translated, data.latitude, data.longitude)

    # ── Step 5: Feature vector + XGBoost priority (legacy, kept for compatibility)
    now = datetime.datetime.now()
    hour = data.hour_of_day if data.hour_of_day is not None else now.hour
    month = data.month if data.month is not None else now.month

    metadata = {
        "has_media": data.has_media or (data.image_base64 is not None),
        "hour_of_day": hour,
        "has_children": data.has_children,
        "has_elderly": data.has_elderly,
        "has_disabled": data.has_disabled,
        "environmental_data": data.environmental_data or {},
    }
    features = build_feature_vector(entities, metadata)

    priority = "MEDIUM"
    confidence = 0.0
    if classifier:
        features_2d = features.reshape(1, -1)
        prediction = classifier.predict(features_2d)[0]
        probabilities = classifier.predict_proba(features_2d)[0]
        confidence = float(max(probabilities))
        priority = str(prediction)
    else:
        if entities.get("incident_type") in ["FLOOD", "LANDSLIDE", "FIRE"]:
            priority = "HIGH"
            confidence = 0.6

    # ── Step 6 (R1): Image encoding ───────────────────────────────────────────
    image_result = None
    if data.image_base64:
        try:
            image_result = encode_image(data.image_base64)
        except Exception as e:
            print(f"[R1] Image encoding failed: {e}")

    # ── Step 7 (R1): Multimodal fusion ────────────────────────────────────────
    fused = fuse_modalities(
        text_result=text_multitask,
        image_result=image_result,
        latitude=data.latitude,
        longitude=data.longitude,
        district=data.district,
        hour=hour,
        month=month,
        env_data=data.environmental_data,
        has_children=data.has_children,
        has_elderly=data.has_elderly,
        has_disabled=data.has_disabled,
        model_variant=data.model_variant,
    )

    # ── Step 8 (R2): Calibrated uncertainty + risk-adaptive abstention ───────
    uncertainty = compute_uncertainty(
        priority_confidence=max(confidence, fused["urgency_confidence"]),
        category_confidence=fused["disaster_type_confidence"],
        text_length=len(data.raw_text),
        has_location=bool(data.latitude or fused["location_entities"]),
        detected_language=lang_result["language"],
        language_confidence=lang_result["confidence"],
        # R2 new parameters
        urgency=fused["urgency"],
        disaster_type=fused["disaster_type"],
        modal_agreement=fused["fusion"]["cross_modal_agreement"],
        has_vulnerable=(
            data.has_children or data.has_elderly or data.has_disabled or
            fused.get("vulnerable_group", "GENERAL_POPULATION") != "GENERAL_POPULATION"
        ),
        image_available=image_result is not None,
        environmental_available=bool(data.environmental_data),
    )

    # Use fused urgency as the final priority
    final_priority = fused["urgency"] if fused["urgency"] != "LOW" else priority
    final_confidence = max(confidence, fused["urgency_confidence"])

    return ProcessedOutput(
        detected_language=lang_result["language"],
        language_confidence=lang_result["confidence"],
        translated_text=translated,
        nlp_entities=entities,
        priority=final_priority,
        priority_confidence=round(final_confidence, 4),
        multimodal=fused,
        uncertainty=uncertainty,
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
# R3 — EVIDENCE GRAPH VERIFICATION
# ═══════════════════════════════════════════

from ml.evidence_graph import verify_incident

class VerificationReport(BaseModel):
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    disaster_type: Optional[str] = "UNKNOWN"
    timestamp_hour: Optional[int] = 12
    image_hash: Optional[str] = None
    user_verified: bool = False
    is_volunteer: bool = False
    is_officer: bool = False
    reports_submitted: int = 0
    past_accuracy: float = 0.5

class VerificationRequest(BaseModel):
    target_report: VerificationReport
    related_reports: Optional[List[VerificationReport]] = []
    verifications: Optional[List[Dict]] = []
    weather_obs: Optional[Dict] = None

@app.post("/verify-incident")
async def verify_incident_endpoint(data: VerificationRequest):
    """
    R3: Evidence-graph-based incident credibility verification.
    Compares GAT (proposed) vs rule-based (B1) vs XGBoost-proxy (B2).
    Returns credibility score, XAI narrative, and graph statistics.
    """
    result = verify_incident(
        target_report=data.target_report.dict(),
        related_reports=[r.dict() for r in (data.related_reports or [])],
        verifications=data.verifications or [],
        weather_obs=data.weather_obs,
    )
    return result


# ═══════════════════════════════════════════
# R4 — ACTIVE LEARNING ENDPOINTS
# ═══════════════════════════════════════════

class ActiveLearningCandidate(BaseModel):
    text: str
    language: str = "en"
    urgency: str = "MEDIUM"
    disaster_type: str = "UNKNOWN"
    has_vulnerable: bool = False
    predicted_label: str = "MEDIUM"
    confidence_distribution: List[float] = [0.25, 0.25, 0.25, 0.25]
    embedding: Optional[List[float]] = None
    top_features: Optional[List[Dict]] = None

class ActiveLearningQueryRequest(BaseModel):
    candidates: List[ActiveLearningCandidate]
    labelled_embeddings: Optional[List[List[float]]] = None
    n_select: Optional[int] = None

class SingleSampleScoreRequest(BaseModel):
    text: str
    language: str = "en"
    urgency: str = "MEDIUM"
    disaster_type: str = "UNKNOWN"
    has_vulnerable: bool = False
    predicted_label: str = "MEDIUM"
    confidence_distribution: List[float] = [0.25, 0.25, 0.25, 0.25]
    embedding: Optional[List[float]] = None
    top_features: Optional[List[Dict]] = None
    labelled_embeddings: Optional[List[List[float]]] = None

class EvaluationRequest(BaseModel):
    predictions: List[Dict]
    true_labels: List[str]
    data_fraction: float = 1.0
    strategy_name: str = "S5_REAL"

@app.post("/active-learning/query")
async def active_learning_query(data: ActiveLearningQueryRequest):
    """
    R4: Rank unlabelled candidates for human annotation using the
    Risk-Aware Explainable Active Learning (REAL) acquisition function.

    Score = α·Uncertainty + β·Diversity + γ·Criticality + δ·LanguageRarity + ε·ExplanationInconsistency

    Also returns all 5 baseline strategy rankings for ablation comparison.
    """
    candidates_list = [c.dict() for c in data.candidates]
    result = rank_candidates(
        candidates=candidates_list,
        labelled_embeddings=data.labelled_embeddings,
        n_select=data.n_select,
    )
    return result

@app.post("/active-learning/score")
async def active_learning_score(data: SingleSampleScoreRequest):
    """
    R4: Compute REAL acquisition score for a single unlabelled sample.
    Useful for real-time annotation priority display in the admin dashboard.
    """
    result = compute_acquisition_score(
        confidence_distribution=data.confidence_distribution,
        candidate_embedding=data.embedding or [0.0] * 10,
        labelled_embeddings=data.labelled_embeddings or [],
        urgency=data.urgency,
        disaster_type=data.disaster_type,
        has_vulnerable=data.has_vulnerable,
        language=data.language,
        text=data.text,
        predicted_label=data.predicted_label,
        top_features=data.top_features,
    )
    return result

@app.post("/active-learning/evaluate")
async def active_learning_evaluate(data: EvaluationRequest):
    """
    R4: Compute learning curve metrics at a given data fraction.
    Use to compare all 5 strategies (S1–S5) at 10/25/50/75/100% labelled data.
    """
    result = evaluate_learning_curve(
        predictions=data.predictions,
        true_labels=data.true_labels,
        data_fraction=data.data_fraction,
        strategy_name=data.strategy_name,
    )
    return result


# ═══════════════════════════════════════════
# R5 — SPATIOTEMPORAL RISK FORECASTING ENDPOINTS
# ═══════════════════════════════════════════

class IncidentHistoryEntry(BaseModel):
    hours_ago: float
    severity: str = "MEDIUM"
    count: int = 1

class DistrictForecastRequest(BaseModel):
    district: str
    incident_history: List[IncidentHistoryEntry] = []
    environmental_data: Optional[Dict] = None
    month: int = 6
    district_risk_context: Optional[Dict[str, float]] = None
    forecast_horizon_hours: float = 0.0

class MultiDistrictEntry(BaseModel):
    district: str
    incident_history: List[IncidentHistoryEntry] = []
    environmental_data: Optional[Dict] = None

class MultiDistrictForecastRequest(BaseModel):
    districts: List[MultiDistrictEntry]
    month: int = 6
    environmental_data: Optional[Dict] = None  # shared weather if per-district not provided

@app.post("/forecast/district-risk")
async def district_risk_forecast(data: DistrictForecastRequest):
    """
    R5: Bias-aware spatiotemporal risk forecast for a single district.

    Corrects raw incident counts for reporting bias (under-reporting in rural/
    remote districts). Applies temporal decay, seasonal adjustment, weather boost,
    and optional spatial propagation from neighbouring districts.

    Returns risk level, confidence interval (widened for high-bias districts),
    component breakdown, and baseline comparison (B1 naive, B2 seasonal ARIMA).
    """
    result = forecast_risk(
        district=data.district,
        incident_history=[e.dict() for e in data.incident_history],
        environmental_data=data.environmental_data,
        month=data.month,
        district_risk_context=data.district_risk_context,
        forecast_horizon_hours=data.forecast_horizon_hours,
    )
    return result

@app.post("/forecast/multi-district")
async def multi_district_risk_forecast(data: MultiDistrictForecastRequest):
    """
    R5: Bias-aware spatiotemporal risk forecast for multiple districts.

    Runs a 2-pass spatial GNN: first computes each district independently,
    then re-computes with neighbour risk propagation. Results are sorted by
    risk score descending. Includes a bias summary flagging districts likely
    to under-report.
    """
    districts_data = [
        {
            "district": e.district,
            "incident_history": [h.dict() for h in e.incident_history],
            "environmental_data": e.environmental_data,
        }
        for e in data.districts
    ]
    result = multi_district_forecast(
        districts_data=districts_data,
        month=data.month,
        environmental_data=data.environmental_data,
    )
    return result

@app.get("/forecast/bias-profile/{district}")
async def district_bias_profile(district: str):
    """
    R5: Return the reporting bias profile for a district — bias factor,
    bias level, correction multiplier, and explanation.
    Useful for displaying bias warnings in the admin dashboard.
    """
    return estimate_reporting_bias(district)


# ═══════════════════════════════════════════
# R6 — MULTI-OBJECTIVE RELIEF COORDINATION
# ═══════════════════════════════════════════

class IncidentSite(BaseModel):
    id: str
    severity: str = "MEDIUM"
    distance_km: float = 5.0
    affected_persons: int = 10
    resource_needs: Optional[Dict[str, int]] = None

class DepotInventory(BaseModel):
    volunteer_teams: int = 10
    medical_kits: int = 20
    boats: int = 5
    food_packages: int = 50
    shelters: int = 10
    rescue_equipment: int = 8

class ReliefCoordinationRequest(BaseModel):
    sites: List[IncidentSite]
    depot: DepotInventory
    available_teams: int = 10
    preferred_objective: str = "BALANCED"  # FASTEST_RESPONSE | MAX_COVERAGE | MOST_EFFICIENT | BALANCED
    seed: int = 42

@app.post("/relief/coordinate")
async def relief_coordinate(data: ReliefCoordinationRequest):
    """
    R6: Multi-objective relief coordination using NSGA-II.

    Returns a Pareto front of non-dominated allocation plans, each trading off:
      f1 — average response time (speed)
      f2 — unmet critical demand (coverage)
      f3 — resource utilisation (efficiency)

    The recommended plan is selected based on preferred_objective.
    Baseline comparison (greedy, proportional) is included for research ablation.
    """
    sites_list = []
    for s in data.sites:
        site_dict = s.dict()
        if site_dict["resource_needs"] is None:
            site_dict["resource_needs"] = {}
        sites_list.append(site_dict)

    result = coordinate_relief(
        sites=sites_list,
        depot=data.depot.dict(),
        available_teams=data.available_teams,
        preferred_objective=data.preferred_objective,
        seed=data.seed,
    )
    return result


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
