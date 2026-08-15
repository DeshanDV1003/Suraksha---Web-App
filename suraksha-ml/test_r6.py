import sys
sys.path.insert(0, r"D:\Suraksha - Web App\suraksha-ml")

from ml.relief_coordinator import coordinate_relief

print("=" * 60)
print("  R6 - MULTI-OBJECTIVE RELIEF COORDINATION (NSGA-II)")
print("=" * 60)

sites = [
    {"id": "Kalutara-North", "severity": "CRITICAL", "distance_km": 12.0, "affected_persons": 85,
     "resource_needs": {"medical_kits": 4, "boats": 2, "food_packages": 10, "shelters": 3, "rescue_equipment": 2}},
    {"id": "Ratnapura-A",    "severity": "CRITICAL", "distance_km": 45.0, "affected_persons": 120,
     "resource_needs": {"medical_kits": 5, "boats": 3, "food_packages": 15, "shelters": 4, "rescue_equipment": 3}},
    {"id": "Galle-Coast",    "severity": "HIGH",     "distance_km": 25.0, "affected_persons": 60,
     "resource_needs": {"medical_kits": 3, "boats": 1, "food_packages": 8,  "shelters": 2, "rescue_equipment": 1}},
    {"id": "Matara-River",   "severity": "HIGH",     "distance_km": 30.0, "affected_persons": 40,
     "resource_needs": {"medical_kits": 2, "boats": 1, "food_packages": 6,  "shelters": 2, "rescue_equipment": 1}},
    {"id": "Hambantota-B",   "severity": "MEDIUM",   "distance_km": 60.0, "affected_persons": 25,
     "resource_needs": {"medical_kits": 1, "boats": 0, "food_packages": 4,  "shelters": 1, "rescue_equipment": 0}},
]
depot = {
    "volunteer_teams": 8, "medical_kits": 12, "boats": 5,
    "food_packages": 30, "shelters": 8, "rescue_equipment": 5,
}

result = coordinate_relief(sites, depot, available_teams=8, preferred_objective="BALANCED")
meta = result["nsga2_metadata"]
rec  = result["recommended_plan"]
bc   = result["baseline_comparison"]

print(f"\n  NSGA-II: {meta['generations']} generations x {meta['population_size']} population")
print(f"  Pareto solutions found: {meta['n_pareto_solutions']}")

print(f"\n  Recommended plan (BALANCED):")
print(f"    f1 avg response time : {rec['f1_avg_response_time_min']:.1f} min")
print(f"    f2 unmet demand      : {rec['f2_unmet_demand_fraction']:.0%}")
print(f"    f3 resource use      : {rec['f3_resource_utilisation']:.0%}")
print(f"    profile              : {rec['profile']}")

print(f"\n  Site allocations:")
for a in rec["site_allocations"]:
    r = a["resources"]
    print(f"    {a['site_id']:20s} {a['severity']:8s} teams={a['volunteer_teams']}  "
          f"med={r.get('medical_kits',0)} boats={r.get('boats',0)} "
          f"food={r.get('food_packages',0)} shelter={r.get('shelters',0)}")

print(f"\n  Pareto front (top 5 trade-offs):")
for i, s in enumerate(result["pareto_front"][:5]):
    print(f"    [{i+1}] f1={s['f1_avg_response_time_min']:5.1f}min  "
          f"f2={s['f2_unmet_demand_fraction']:.2f}  "
          f"f3={s['f3_resource_utilisation']:.2f}  "
          f"{s['profile']}")

print(f"\n  Baseline comparison:")
b1 = bc["B1_greedy"]
b2 = bc["B2_proportional"]
print(f"    B1 greedy       : f1={b1['f1_avg_response_time_min']:5.1f}min  f2={b1['f2_unmet_demand_fraction']:.2f}  f3={b1['f3_resource_utilisation']:.2f}")
print(f"    B2 proportional : f1={b2['f1_avg_response_time_min']:5.1f}min  f2={b2['f2_unmet_demand_fraction']:.2f}  f3={b2['f3_resource_utilisation']:.2f}")
print(f"    Proposed NSGA-II: f1={rec['f1_avg_response_time_min']:5.1f}min  f2={rec['f2_unmet_demand_fraction']:.2f}  f3={rec['f3_resource_utilisation']:.2f}")

print(f"\n  Narrative:")
print(f"    {result['narrative']}")
