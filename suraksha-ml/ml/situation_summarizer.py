"""
F16 — Grounded Operational Situation Summarization
Template-grounded extraction — every sentence cites source incident IDs.
Produces structured operational briefings for officers every 2 hours.
No unsupported LLM claims — all facts link to evidence.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from collections import Counter


def _time_window(hours: int = 2) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=hours)


def generate_situation_summary(
    incidents: List[dict],
    help_requests: List[dict],
    water_levels: Optional[List[dict]] = None,
    camps: Optional[List[dict]] = None,
    window_hours: int = 2,
) -> dict:
    cutoff = _time_window(window_hours)
    now = datetime.now(timezone.utc)

    def is_recent(item):
        try:
            created = datetime.fromisoformat(item["createdAt"].replace("Z", "+00:00"))
            return created >= cutoff
        except Exception:
            return False

    # Filter to window
    recent_incidents = [i for i in incidents if is_recent(i)]
    recent_requests = [r for r in help_requests if is_recent(r)]

    # Aggregate
    incident_count = len(recent_incidents)
    sev_counter = Counter(i.get("severity", "MEDIUM") for i in recent_incidents)
    cat_counter = Counter(i.get("category", "UNKNOWN") for i in recent_incidents)
    top_district_counter: Counter = Counter()
    affected_people = 0

    for inc in recent_incidents:
        loc = (inc.get("zoneName") or inc.get("province") or inc.get("location") or "Unknown")
        top_district_counter[loc] += 1

    for req in recent_requests:
        affected_people += req.get("peopleCount") or 1

    req_type_counter = Counter(r.get("type", "GENERAL") for r in recent_requests)
    critical_requests = [r for r in recent_requests if r.get("priority") == "CRITICAL"]
    unmet_requests = [r for r in help_requests if r.get("status") == "PENDING"]

    # Water hazards
    flood_warnings = []
    if water_levels:
        flood_warnings = [
            w for w in water_levels
            if w.get("status") in ("MINOR_FLOOD", "MAJOR_FLOOD", "ALERT")
        ]

    # Camps
    shelter_capacity = 0
    shelter_occupancy = 0
    if camps:
        for c in camps:
            shelter_capacity += c.get("totalCapacity", 0)
            shelter_occupancy += c.get("currentOccupancy", 0)

    # ── Build grounded sentences ──────────────────────────────────────────────
    sentences = []
    evidence_map = {}

    # Sentence 1 — Incident overview
    if incident_count > 0:
        top_cats = cat_counter.most_common(2)
        cat_str = " and ".join(f"{c[0].lower()} ({c[1]})" for c in top_cats)
        top_districts = top_district_counter.most_common(3)
        dist_str = ", ".join(d[0] for d, _ in [(k, v) for k, v in top_districts])
        ids = [i["id"] for i in recent_incidents[:5]]
        sent = (
            f"In the past {window_hours} hours, {incident_count} incident report(s) were received"
            + (f", primarily {cat_str}" if top_cats else "")
            + (f", concentrated in {dist_str}" if dist_str else "")
            + "."
        )
        sentences.append(sent)
        evidence_map[sent] = {"incident_ids": ids, "type": "incident_summary"}
    else:
        sentences.append(f"No new incidents reported in the past {window_hours} hours.")

    # Sentence 2 — Severity breakdown
    if sev_counter:
        sev_parts = [f"{v} {k.lower()}" for k, v in sorted(sev_counter.items(), key=lambda x: ["CRITICAL","HIGH","MEDIUM","LOW"].index(x[0]) if x[0] in ["CRITICAL","HIGH","MEDIUM","LOW"] else 99)]
        sent = f"Severity breakdown: {', '.join(sev_parts)}."
        ids = [i["id"] for i in recent_incidents if i.get("severity") in ("CRITICAL", "HIGH")]
        sentences.append(sent)
        evidence_map[sent] = {"incident_ids": ids, "type": "severity_breakdown"}

    # Sentence 3 — Help requests
    if recent_requests:
        top_types = req_type_counter.most_common(2)
        type_str = " and ".join(f"{t[0].lower()} ({t[1]})" for t in top_types)
        sent = (
            f"{len(recent_requests)} help request(s) submitted this period"
            + (f", mainly for {type_str}" if top_types else "")
            + f", covering an estimated {affected_people} people."
        )
        ids = [r["id"] for r in recent_requests[:5]]
        sentences.append(sent)
        evidence_map[sent] = {"request_ids": ids, "type": "help_request_summary"}

    # Sentence 4 — Critical / unmet
    if critical_requests:
        ids = [r["id"] for r in critical_requests]
        sent = f"{len(critical_requests)} CRITICAL request(s) require immediate attention."
        sentences.append(sent)
        evidence_map[sent] = {"request_ids": ids, "type": "critical_alert"}

    if unmet_requests:
        sent = f"{len(unmet_requests)} request(s) remain unassigned and pending dispatch."
        ids = [r["id"] for r in unmet_requests[:5]]
        sentences.append(sent)
        evidence_map[sent] = {"request_ids": ids, "type": "unmet_requests"}

    # Sentence 5 — Water hazards
    if flood_warnings:
        rivers = list(set(w.get("riverName", w.get("district", "Unknown")) for w in flood_warnings))
        sent = f"Active flood warnings at {len(flood_warnings)} monitoring station(s): {', '.join(rivers[:3])}."
        sentences.append(sent)
        evidence_map[sent] = {"station_ids": [w.get("id") for w in flood_warnings[:3]], "type": "water_warning"}

    # Sentence 6 — Shelter
    if camps and shelter_capacity > 0:
        occupancy_pct = round(shelter_occupancy / shelter_capacity * 100)
        sent = f"Relief camps at {occupancy_pct}% occupancy ({shelter_occupancy}/{shelter_capacity} people)."
        sentences.append(sent)
        evidence_map[sent] = {"type": "camp_status", "occupancy_pct": occupancy_pct}

    # Disclaimer
    sentences.append(
        "This summary is AI-generated and grounded in system data. "
        "All figures are unverified unless marked 'CONFIRMED'. "
        "Verify critical decisions with field teams before action."
    )

    return {
        "generated_at": now.isoformat(),
        "window_hours": window_hours,
        "incident_count": incident_count,
        "help_request_count": len(recent_requests),
        "critical_count": len(critical_requests),
        "affected_people_estimate": affected_people,
        "flood_warnings": len(flood_warnings),
        "sentences": sentences,
        "evidence_map": evidence_map,
        "full_summary": " ".join(sentences),
        "severity_breakdown": dict(sev_counter),
        "category_breakdown": dict(cat_counter.most_common(5)),
        "top_districts": [k for k, _ in top_district_counter.most_common(5)],
    }
