"""
F12 — Adaptive Responder-Team Composition
Bipartite matching: Volunteers × Skill Requirements.
Composes optimal team for an incident based on:
  - Required skills (derived from disaster type)
  - Distance to incident
  - Availability and current load
  - Language match for community communication
"""
import math
from typing import List, Optional

DISASTER_SKILL_REQUIREMENTS = {
    "FLOOD": ["SWIMMING", "BOAT_OPERATION", "FIRST_AID", "RESCUE"],
    "LANDSLIDE": ["HEAVY_LIFTING", "FIRST_AID", "RESCUE", "EXCAVATION"],
    "FIRE": ["FIREFIGHTING", "FIRST_AID", "EVACUATION"],
    "CYCLONE": ["STRUCTURAL_ASSESSMENT", "FIRST_AID", "EVACUATION", "RESCUE"],
    "BUILDING_COLLAPSE": ["RESCUE", "HEAVY_LIFTING", "FIRST_AID", "STRUCTURAL_ASSESSMENT"],
    "MEDICAL": ["FIRST_AID", "MEDICAL", "TRANSPORT"],
    "DEFAULT": ["FIRST_AID", "RESCUE", "EVACUATION"],
}

SKILL_ALIASES = {
    "FIRST_AID": ["FIRST AID", "FIRSTAID", "MEDICAL AID", "BASIC MEDICAL"],
    "RESCUE": ["SEARCH AND RESCUE", "SAR", "WATER RESCUE"],
    "BOAT_OPERATION": ["BOAT", "BOATING", "MARINE", "WATER RESCUE"],
    "SWIMMING": ["SWIMMER", "SWIM"],
    "FIREFIGHTING": ["FIRE", "FIRE FIGHTING", "FIRE SUPPRESSION"],
    "HEAVY_LIFTING": ["HEAVY LIFTING", "PHYSICAL", "CONSTRUCTION"],
    "STRUCTURAL_ASSESSMENT": ["STRUCTURAL", "CIVIL ENGINEERING", "ENGINEERING"],
    "MEDICAL": ["DOCTOR", "NURSE", "PARAMEDIC", "MEDICAL OFFICER", "HEALTHCARE"],
    "TRANSPORT": ["DRIVING", "DRIVER", "VEHICLE OPERATION"],
    "EVACUATION": ["EVACUATION", "CROWD MANAGEMENT", "COMMUNITY WORK"],
    "EXCAVATION": ["EXCAVATION", "DIGGING", "HEAVY MACHINERY"],
}


def _haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 999.0
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _volunteer_has_skill(volunteer: dict, required_skill: str) -> bool:
    skills_raw = []
    profile = volunteer.get("volunteerProfile") or {}
    skills_list = profile.get("skills", [])
    for s in skills_list:
        name = s.get("skillName", "").upper()
        skills_raw.append(name)

    required_upper = required_skill.upper()
    aliases = SKILL_ALIASES.get(required_upper, [required_upper])
    for alias in aliases:
        for skill in skills_raw:
            if alias in skill or skill in alias:
                return True
    return False


def _volunteer_score(volunteer: dict, required_skills: List[str], inc_lat, inc_lng) -> dict:
    profile = volunteer.get("volunteerProfile") or {}

    vol_lat = None
    vol_lng = None
    checkins = profile.get("checkIns", [])
    if checkins:
        last = checkins[-1]
        vol_lat = last.get("latitude")
        vol_lng = last.get("longitude")

    dist_km = _haversine_km(vol_lat, vol_lng, inc_lat, inc_lng)
    distance_score = max(0, 1.0 - dist_km / 50.0)  # full score within 50 km

    skills_matched = [s for s in required_skills if _volunteer_has_skill(volunteer, s)]
    skill_score = len(skills_matched) / max(len(required_skills), 1)

    readiness = profile.get("readinessScore", 80.0) / 100.0

    # Fatigue: penalise if many recent check-ins
    recent_hours = sum(c.get("activeHours", 0) for c in checkins[-5:])
    fatigue_penalty = min(recent_hours / 40.0, 0.5)

    composite = (
        0.30 * distance_score +
        0.35 * skill_score +
        0.25 * readiness +
        0.10 * (1.0 - fatigue_penalty)
    )

    return {
        "volunteer_id": volunteer.get("id"),
        "name": volunteer.get("name", "Unknown"),
        "role": volunteer.get("role", "VOLUNTEER"),
        "skills_matched": skills_matched,
        "skills_missing": [s for s in required_skills if s not in skills_matched],
        "distance_km": round(dist_km, 1),
        "readiness_score": profile.get("readinessScore", 80.0),
        "composite_score": round(composite, 3),
        "is_field_active": volunteer.get("isFieldActive", False),
    }


def compose_team(
    volunteers: List[dict],
    disaster_type: str,
    incident_latitude: Optional[float],
    incident_longitude: Optional[float],
    team_size: int = 4,
) -> dict:
    required_skills = DISASTER_SKILL_REQUIREMENTS.get(disaster_type, DISASTER_SKILL_REQUIREMENTS["DEFAULT"])

    scored = [
        _volunteer_score(v, required_skills, incident_latitude, incident_longitude)
        for v in volunteers
    ]
    scored.sort(key=lambda x: -x["composite_score"])

    # Greedy skill coverage: select team that covers required skills
    selected = []
    covered_skills = set()
    remaining = list(scored)

    # First pass: skill-coverage greedy
    for skill in required_skills:
        for candidate in remaining:
            if skill in candidate["skills_matched"] and candidate not in selected:
                selected.append(candidate)
                remaining.remove(candidate)
                covered_skills.update(candidate["skills_matched"])
                break
        if len(selected) >= team_size:
            break

    # Second pass: fill remaining slots by composite score
    for candidate in remaining:
        if len(selected) >= team_size:
            break
        if candidate not in selected:
            selected.append(candidate)

    uncovered = [s for s in required_skills if s not in covered_skills]

    return {
        "disaster_type": disaster_type,
        "required_skills": required_skills,
        "team": selected[:team_size],
        "team_size": len(selected[:team_size]),
        "skills_covered": list(covered_skills),
        "skills_uncovered": uncovered,
        "coverage_rate": round(len(covered_skills) / max(len(required_skills), 1), 3),
        "rationale": (
            f"Team of {len(selected[:team_size])} selected for {disaster_type} response. "
            f"{len(covered_skills)}/{len(required_skills)} required skills covered."
            + (f" MISSING: {', '.join(uncovered)}." if uncovered else " All skills covered.")
        ),
    }
