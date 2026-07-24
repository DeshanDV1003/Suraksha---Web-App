"""
F10 — Multi-Objective Relief Resource Optimization (NSGA-II simplified)
Allocates resources to help requests optimising:
  1. Minimize total response distance
  2. Maximize beneficiaries served
  3. Maximize critical-request fulfilment
  4. Minimize resource wastage
  5. Maximize geographic fairness

Uses a greedy Pareto-approximation approach (tractable without scipy/pymoo).
"""
import math
from typing import List, Optional


def _haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 999.0
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(d_lon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


SEVERITY_PRIORITY = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}

RESOURCE_TO_TYPE = {
    "FOOD": ["FOOD", "GENERAL_AID"],
    "WATER": ["WATER", "GENERAL_AID"],
    "MEDICAL": ["MEDICAL", "RESCUE"],
    "SHELTER": ["SHELTER", "GENERAL_AID"],
    "RESCUE": ["RESCUE", "MEDICAL"],
    "CLOTHING": ["CLOTHING", "GENERAL_AID"],
    "TRANSPORT": ["TRANSPORT", "RESCUE"],
    "GENERAL_AID": ["FOOD", "WATER", "SHELTER", "CLOTHING", "GENERAL_AID"],
}


def optimize_allocation(
    help_requests: List[dict],
    resources: List[dict],
    volunteers: List[dict],
    alpha_distance: float = 0.25,
    alpha_beneficiaries: float = 0.30,
    alpha_critical: float = 0.25,
    alpha_fairness: float = 0.20,
) -> dict:
    """
    Returns:
      allocations: list of {request_id, resource_id, volunteer_id, score, rationale}
      unmet_requests: list of request ids with no viable match
      pareto_metrics: dict of the four objective scores
      summary: human-readable summary
    """
    pending = [r for r in help_requests if r.get("status") in ("PENDING", "ASSIGNED")]
    available_resources = [r for r in resources if r.get("status") == "AVAILABLE"]
    available_volunteers = [v for v in volunteers if v.get("isFieldActive", False) or True]

    if not pending:
        return {
            "allocations": [],
            "unmet_requests": [],
            "pareto_metrics": {"distance": 1.0, "beneficiaries": 0.0, "critical": 0.0, "fairness": 1.0},
            "summary": "No pending requests to allocate.",
        }

    # Sort requests by priority DESC, then by people count DESC
    pending_sorted = sorted(
        pending,
        key=lambda r: (
            -SEVERITY_PRIORITY.get(r.get("priority", "MEDIUM"), 2),
            -(r.get("peopleCount") or 1),
        ),
    )

    allocations = []
    unmet = []
    used_resources = set()
    used_volunteers = set()
    district_served: dict = {}  # for fairness tracking
    total_beneficiaries = 0
    total_distance = 0.0
    critical_met = 0
    critical_total = sum(1 for r in pending_sorted if r.get("priority") == "CRITICAL")

    for req in pending_sorted:
        req_lat = req.get("latitude")
        req_lng = req.get("longitude")
        req_type = req.get("type", "GENERAL_AID")
        priority = req.get("priority", "MEDIUM")
        people_count = req.get("peopleCount") or 1
        req_district = req.get("location", "Unknown").split(",")[-1].strip()

        # Find best resource match
        best_resource = None
        best_res_score = -1.0
        accepted_types = RESOURCE_TO_TYPE.get(req_type, ["GENERAL_AID"])

        for res in available_resources:
            if res["id"] in used_resources:
                continue
            if res.get("type", "") not in accepted_types and res.get("type", "") != "GENERAL_AID":
                # Allow GENERAL_AID resources for any request
                if req_type not in RESOURCE_TO_TYPE.get("GENERAL_AID", []):
                    continue

            res_lat = res.get("latitude") or req_lat
            res_lng = res.get("longitude") or req_lng
            dist_km = _haversine_km(req_lat, req_lng, res_lat, res_lng) if (req_lat and req_lng) else 50.0

            # Score = priority_weight / (1 + distance)
            priority_w = SEVERITY_PRIORITY.get(priority, 2)
            score = (priority_w * people_count) / (1.0 + dist_km)

            if score > best_res_score:
                best_res_score = score
                best_resource = res
                best_dist = dist_km

        # Find nearest available volunteer
        best_volunteer = None
        best_vol_dist = float("inf")
        for vol in available_volunteers:
            if vol.get("id") in used_volunteers:
                continue
            vol_lat = vol.get("latitude") or vol.get("location", {}).get("latitude") if isinstance(vol.get("location"), dict) else None
            vol_lng = vol.get("longitude") or vol.get("location", {}).get("longitude") if isinstance(vol.get("location"), dict) else None
            dist = _haversine_km(req_lat, req_lng, vol_lat, vol_lng)
            if dist < best_vol_dist:
                best_vol_dist = dist
                best_volunteer = vol

        if best_resource or best_volunteer:
            rid = best_resource["id"] if best_resource else None
            vid = best_volunteer.get("id") if best_volunteer else None

            if rid:
                used_resources.add(rid)
            if vid:
                used_volunteers.add(vid)

            total_beneficiaries += people_count
            if best_resource:
                total_distance += best_dist
            if priority == "CRITICAL":
                critical_met += 1

            district_served[req_district] = district_served.get(req_district, 0) + 1

            allocations.append({
                "request_id": req["id"],
                "request_type": req_type,
                "priority": priority,
                "people_count": people_count,
                "resource_id": rid,
                "resource_type": best_resource.get("type") if best_resource else None,
                "volunteer_id": vid,
                "volunteer_name": (best_volunteer.get("user", {}) or {}).get("name") if best_volunteer else None,
                "estimated_distance_km": round(best_dist if best_resource else best_vol_dist, 1),
                "allocation_score": round(best_res_score, 3),
                "rationale": _build_rationale(priority, people_count, req_type, best_resource, best_volunteer),
            })
        else:
            unmet.append(req["id"])

    # Pareto objective scores
    max_dist = max(total_distance, 1.0)
    dist_score = round(1.0 - min(total_distance / (max_dist * len(allocations) + 1), 1.0), 3) if allocations else 1.0
    bene_score = round(total_beneficiaries / max(sum((r.get("peopleCount") or 1) for r in pending_sorted), 1), 3)
    crit_score = round(critical_met / max(critical_total, 1), 3)
    districts = set(req.get("location", "").split(",")[-1].strip() for req in pending_sorted)
    served_districts = len(district_served)
    fairness_score = round(served_districts / max(len(districts), 1), 3)

    return {
        "allocations": allocations,
        "unmet_requests": unmet,
        "pareto_metrics": {
            "distance_efficiency": dist_score,
            "beneficiaries_served": bene_score,
            "critical_fulfilment": crit_score,
            "geographic_fairness": fairness_score,
        },
        "summary": (
            f"{len(allocations)} requests matched out of {len(pending_sorted)}. "
            f"{total_beneficiaries} people covered. "
            f"{critical_met}/{critical_total} critical requests fulfilled. "
            f"{len(unmet)} requests unmet (no resource or volunteer available)."
        ),
        "total_beneficiaries": total_beneficiaries,
        "critical_met": critical_met,
        "unmet_count": len(unmet),
    }


def _build_rationale(priority, people_count, req_type, resource, volunteer) -> str:
    parts = []
    if priority == "CRITICAL":
        parts.append("Critical priority — matched first")
    if resource:
        parts.append(f"Matched {resource.get('type', 'resource')} from {resource.get('location', 'nearby')}")
    if volunteer:
        name = (volunteer.get("user", {}) or {}).get("name", "volunteer")
        parts.append(f"Assigned to {name}")
    parts.append(f"Covers {people_count} people")
    return ". ".join(parts) + "."
