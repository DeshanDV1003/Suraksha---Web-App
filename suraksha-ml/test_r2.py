import sys
sys.path.insert(0, r"D:\Suraksha - Web App\suraksha-ml")

from ml.uncertainty_triage import compute_uncertainty

print("=" * 60)
print("  R2 - CALIBRATED UNCERTAINTY + RISK-ADAPTIVE ABSTENTION")
print("=" * 60)

# Scenario: Sinhala report, CRITICAL flood, elderly trapped
# Model is uncertain (confidence 0.58) -- should escalate, not just ask
print("\nScenario: Sinhala CRITICAL flood, elderly trapped, low confidence")
r = compute_uncertainty(
    priority_confidence=0.58,
    category_confidence=0.61,
    text_length=45,
    has_location=True,
    detected_language="si",
    language_confidence=0.72,
    urgency="CRITICAL",
    disaster_type="FLOOD",
    has_vulnerable=True,
)

print(f"\n  Decision            : {r['decision']}")
print(f"  Confidence          : {r['calibrated_confidence']:.0%}")
print(f"  Epistemic std       : {r['mc_dropout']['epistemic_std']:.4f}")
ar = r["abstention_risk"]
print(f"  Abstention risk     : {ar['abstention_risk']:.4f} ({ar['risk_label']})")
print(f"  Critical case       : {ar['is_critical_case']}")
print(f"  Auto threshold      : {ar['auto_threshold']:.0%}")
print(f"  Conformal pred set  : {r['conformal']['prediction_set']}")
print(f"\n  Baseline comparison:")
bc = r["baselines"]
print(f"    B1 fixed threshold : {bc['B1_fixed_threshold']['decision']}")
print(f"    B2 temperature only: {bc['B2_temperature_only']['decision']}")
print(f"    Proposed R2        : {r['decision']}")
print(f"\n  Explanation: {r.get('explanation', 'N/A')}")
