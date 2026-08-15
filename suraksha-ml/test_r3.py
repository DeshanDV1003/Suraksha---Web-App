import sys
sys.path.insert(0, r"D:\Suraksha - Web App\suraksha-ml")

from ml.evidence_graph import verify_incident

print("=" * 60)
print("  R3 - EVIDENCE GRAPH VERIFICATION (GAT)")
print("=" * 60)

# Scenario: Bridge collapse — volunteer contradicts the claim
target = {
    "text": "Bridge collapsed near Kalutara. People cannot cross.",
    "latitude": 6.582, "longitude": 79.961,
    "district": "Kalutara",
    "disaster_type": "BUILDING_COLLAPSE",
    "timestamp_hour": 3,
    "image_hash": None,
    "user_verified": False,
    "is_volunteer": False,
    "is_officer": False,
    "reports_submitted": 2,
    "past_accuracy": 0.6,
}
related = [
    {
        "text": "Road near bridge is flooded with water.",
        "latitude": 6.581, "longitude": 79.960,
        "district": "Kalutara",
        "disaster_type": "FLOOD",
        "timestamp_hour": 3,
        "image_hash": None,
        "user_verified": False,
        "reports_submitted": 1,
        "past_accuracy": 0.5,
    },
    {
        "text": "Bridge is not collapsed but vehicles cannot cross due to water.",
        "latitude": 6.582, "longitude": 79.961,
        "district": "Kalutara",
        "disaster_type": "FLOOD",
        "timestamp_hour": 4,
        "image_hash": None,
        "user_verified": True,
        "reports_submitted": 8,
        "past_accuracy": 0.82,
    },
]
verifications = [
    {"verifier_type": "VOLUNTEER", "confirmed": False, "notes": "Road inaccessible. Bridge structure appears intact."}
]
weather = {"rainfall_mm": 48, "river_status": "WARNING", "district": "Kalutara"}

result = verify_incident(target, related, verifications, weather)

print(f"\n  Credibility label : {result['credibility_label']}")
print(f"  Credibility score : {result['credibility_score']:.0%}")
print(f"\n  Supporting evidence:")
for s in result["supporting_evidence"]:
    print(f"    + {s}")
print(f"\n  Contradicting evidence:")
for c in result["contradicting_evidence"]:
    print(f"    - {c}")
print(f"\n  Graph: {result['graph']['node_count']} nodes, {result['graph']['edge_count']} edges")
print(f"\n  Top attention weights (GAT XAI):")
for a in result["gat_details"]["top_attention_weights"][:5]:
    print(f"    {a['edge_type']:20s} from {a['from_node']}  att={a['attention_weight']:.4f}  contribution={a['contribution']:+.4f}")
print(f"\n  Narrative: {result['narrative']}")
print(f"\n  Baseline comparison:")
bc = result["baseline_comparison"]
print(f"    B1 rule-based : {bc['B1_rule_based']:.0%}")
print(f"    B2 XGBoost    : {bc['B2_xgboost']:.0%}")
print(f"    Proposed GAT  : {bc['proposed_GAT']:.0%}")
