import sys
sys.path.insert(0, r"D:\Suraksha - Web App\suraksha-ml")

from ml.active_learner import rank_candidates

print("=" * 60)
print("  R4 - RISK-AWARE EXPLAINABLE ACTIVE LEARNING (REAL)")
print("=" * 60)

candidates = [
    {
        "text": "Minor puddle on road near school.",
        "language": "en", "urgency": "LOW", "disaster_type": "FLOOD",
        "has_vulnerable": False, "predicted_label": "LOW",
        "confidence_distribution": [0.05, 0.10, 0.20, 0.65],
        "embedding": [1.0, 0.0, 0.0, 0.0, 0.0],
    },
    {
        "text": "Gal Oya reservoire overflow wedi. Gama evacuate karana. Children trapped.",
        "language": "si", "urgency": "CRITICAL", "disaster_type": "FLOOD",
        "has_vulnerable": True, "predicted_label": "HIGH",
        "confidence_distribution": [0.30, 0.35, 0.25, 0.10],
        "embedding": [0.1, 0.9, 0.2, 0.1, 0.3],
    },
    {
        "text": "Idam vellathu thanneer padum. Marappu uyirodu irukkiraar.",
        "language": "ta", "urgency": "CRITICAL", "disaster_type": "LANDSLIDE",
        "has_vulnerable": True, "predicted_label": "CRITICAL",
        "confidence_distribution": [0.55, 0.25, 0.10, 0.10],
        "embedding": [0.2, 0.8, 0.5, 0.3, 0.1],
    },
    {
        "text": "Small crack in wall. No injuries reported. Everything fine.",
        "language": "en", "urgency": "LOW", "disaster_type": "BUILDING_COLLAPSE",
        "has_vulnerable": False, "predicted_label": "LOW",
        "confidence_distribution": [0.05, 0.05, 0.15, 0.75],
        "embedding": [0.9, 0.1, 0.1, 0.0, 0.0],
    },
    {
        "text": "Bridge collapse wedi but we cannot cross. Kataragama area flooding.",
        "language": "mixed", "urgency": "HIGH", "disaster_type": "BUILDING_COLLAPSE",
        "has_vulnerable": False, "predicted_label": "MEDIUM",
        "confidence_distribution": [0.20, 0.30, 0.30, 0.20],
        "embedding": [0.5, 0.5, 0.5, 0.5, 0.5],
    },
]

labelled_embeddings = [[1.0, 0.0, 0.0, 0.0, 0.0], [0.9, 0.1, 0.1, 0.0, 0.0]]

result = rank_candidates(candidates, labelled_embeddings, n_select=5)

print(f"\n  Total candidates : {result['total_candidates']}")
print(f"  Language dist    : {result['selection_language_distribution']}")
print(f"\n  RANKED (highest annotation priority first):")
for rank, c in enumerate(result["ranked_candidates"], 1):
    comps = c["components"]
    print(f"\n  [{rank}] {c['annotation_priority']:8s}  Score={c['acquisition_score']:.3f}")
    print(f"       Text : \"{c['text_preview']}\"")
    print(f"       U={comps['U_uncertainty']:.3f}  D={comps['D_diversity']:.3f}  "
          f"R={comps['R_criticality']:.3f}  L={comps['L_language_rarity']:.3f}  "
          f"E={comps['E_explanation_inconsistency']:.3f}")
    if c["annotation_drivers"]:
        print(f"       Why  : {c['annotation_drivers'][0]}")

print(f"\n  Strategy comparison (which indices selected):")
for strat, indices in result["strategy_comparison"].items():
    print(f"    {strat:25s}: {indices}")
