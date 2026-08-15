import sys
sys.path.insert(0, r"D:\Suraksha - Web App\suraksha-ml")

print("Testing R1-R6 module imports...")

try:
    from ml.image_encoder import encode_image
    from ml.multimodal_fusion import fuse_modalities
    print("[OK] R1 - Multimodal Fusion")
except Exception as e:
    print(f"[FAIL] R1 - {e}")

try:
    from ml.uncertainty_triage import compute_uncertainty
    print("[OK] R2 - Uncertainty Triage")
except Exception as e:
    print(f"[FAIL] R2 - {e}")

try:
    from ml.evidence_graph import verify_incident
    print("[OK] R3 - Evidence Graph")
except Exception as e:
    print(f"[FAIL] R3 - {e}")

try:
    from ml.active_learner import rank_candidates
    print("[OK] R4 - Active Learner")
except Exception as e:
    print(f"[FAIL] R4 - {e}")

try:
    from ml.spatiotemporal_forecaster import forecast_risk
    print("[OK] R5 - Spatiotemporal Forecaster")
except Exception as e:
    print(f"[FAIL] R5 - {e}")

try:
    from ml.relief_coordinator import coordinate_relief
    print("[OK] R6 - Relief Coordinator")
except Exception as e:
    print(f"[FAIL] R6 - {e}")

print()
print("Done.")
