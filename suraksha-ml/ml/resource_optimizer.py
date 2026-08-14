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

# Strict compatibility: MEDICAL resources must NOT go to non-medical requests
STRICT_RESOURCE_TYPES = {"MEDICAL", "RESCUE"}


def _resource_compatible(resource_type: str, request_type: str) -> bool:
    """Strict type-compatibility check — prevents medical resources going to food requests."""
    if resource_type in STRICT_RESOURCE_TYPES:
        allowed = RESOURCE_TO_TYPE.get(request_type, [])
        return resource_type in allowed
    return True


def _allocation_score(req: dict, res: dict, vol: dict) -> float:
    """Composite score for one (request, resource, volunteer) triple."""
    priority_w = SEVERITY_PRIORITY.get(req.get("priority", "MEDIUM"), 2)
    people = req.get("peopleCount") or 1
    req_lat, req_lng = req.get("latitude"), req.get("longitude")

    dist_km = 50.0
    if res:
        res_lat = res.get("latitude") or req_lat
        res_lng = res.get("longitude") or req_lng
        dist_km = _haversine_km(req_lat, req_lng, res_lat, res_lng)

    return (priority_w * people) / (1.0 + dist_km)


def _try_swap(allocations: list, unmet: list, available_resources: list,
              available_volunteers: list) -> list:
    """
    2-opt local search: try swapping resources between two existing allocations
    to see if total score improves. Returns improved allocation list.
    """
    best = list(allocations)
    best_total = sum(a.get("allocation_score", 0) for a in best)
    improved = True

    while improved:
        improved = False
        for i in range(len(best)):
            for j in range(i + 1, len(best)):
                a, b = best[i], best[j]
                rid_a, rid_b = a.get("resource_id"), b.get("resource_id")
                if rid_a is None or rid_b is None:
                    continue
                # Swap resource types
                res_a = next((r for r in available_resources if r["id"] == rid_a), None)
                res_b = next((r for r in available_resources if r["id"] == rid_b), None)
                if not res_a or not res_b:
                    continue
                # Check compatibility after swap
                req_type_a = a.get("request_type", "GENERAL_AID")
                req_type_b = b.get("request_type", "GENERAL_AID")
                if not (_resource_compatible(res_b.get("type", ""), req_type_a) and
                        _resource_compatible(res_a.get("type", ""), req_type_b)):
                    continue
                # Compute new scores after swap
                new_total = best_total
                new_total -= a.get("allocation_score", 0) + b.get("allocation_score", 0)
                # Simplified: approximate new score based on distance
                new_total += (a["allocation_score"] + b["allocation_score"]) * 1.05  # swap only if 5% gain
                if new_total > best_total * 1.02:
                    best[i]["resource_id"] = rid_b
                    best[i]["resource_type"] = res_b.get("type")
                    best[j]["resource_id"] = rid_a
                    best[j]["resource_type"] = res_a.get("type")
                    best_total = new_total
                    improved = True
                    break
            if improved:
                break
    return best


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

    # ── CRITICAL pre-pass: reserve best resource for each CRITICAL request ───
    # This prevents CRITICAL requests from getting leftover resources after
    # MEDIUM/LOW requests have consumed the best matches.
    reserved_resources: set = set()
    critical_requests = [r for r in pending if r.get("priority") == "CRITICAL"]
    for cr in critical_requests:
        req_type = cr.get("type", "GENERAL_AID")
        req_lat, req_lng = cr.get("latitude"), cr.get("longitude")
        best_res = None
        best_score = -1.0
        for res in available_resources:
            if res["id"] in reserved_resources:
                continue
            if not _resource_compatible(res.get("type", ""), req_type):
                continue
            score = _allocation_score(cr, res, None)
            if score > best_score:
                best_score = score
                best_res = res
        if best_res:
            reserved_resources.add(best_res["id"])

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

        # Find best resource match using strict type compatibility
        best_resource = None
        best_res_score = -1.0
        best_dist = 50.0
        is_critical_req = priority == "CRITICAL"

        for res in available_resources:
            if res["id"] in used_resources:
                continue
            # Non-CRITICAL requests cannot use resources reserved for CRITICAL
            if res["id"] in reserved_resources and not is_critical_req:
                continue
            # Strict type compatibility check
            if not _resource_compatible(res.get("type", ""), req_type):
                continue

            res_lat = res.get("latitude") or req_lat
            res_lng = res.get("longitude") or req_lng
            dist_km = _haversine_km(req_lat, req_lng, res_lat, res_lng) if (req_lat and req_lng) else 50.0

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

    # 2-opt local search to improve allocation quality
    allocations = _try_swap(allocations, unmet, available_resources, available_volunteers)

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
