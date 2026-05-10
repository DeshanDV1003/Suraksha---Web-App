DAMAGE_WEIGHT = {
    "NONE": 0, "MINOR": 1, "MODERATE": 2, "MAJOR": 3, "TOTAL_LOSS": 4
}

def score_damage_assessment(assessment: dict) -> dict:
    structural = DAMAGE_WEIGHT.get(assessment.get("structuralDamage", "NONE"), 0)
    crop = DAMAGE_WEIGHT.get(assessment.get("cropDamage", "NONE"), 0)
    utility = DAMAGE_WEIGHT.get(assessment.get("utilityDamage", "NONE"), 0)
    road = DAMAGE_WEIGHT.get(assessment.get("roadDamage", "NONE"), 0)
    
    affected = min(assessment.get("affectedPersons", 0) / 500, 4)
    
    # Weighted score — structural damage weighs most
    total_score = (
        structural * 0.35 +
        crop * 0.20 +
        utility * 0.20 +
        road * 0.15 +
        affected * 0.10
    )
    
    # Map score to severity
    if total_score >= 3.0:
        severity = "CRITICAL"
    elif total_score >= 2.0:
        severity = "HIGH"
    elif total_score >= 1.0:
        severity = "MEDIUM"
    else:
        severity = "LOW"
    
    return {
        "severity": severity,
        "score": round(total_score, 2),
        "breakdown": {
            "structural": structural,
            "crop": crop,
            "utility": utility,
            "road": road
        }
    }
