import sys
sys.path.insert(0, r"D:\Suraksha - Web App\suraksha-ml")

from ml.spatiotemporal_forecaster import forecast_risk, multi_district_forecast

print("=" * 60)
print("  R5 - BIAS-AWARE SPATIOTEMPORAL RISK FORECASTING")
print("=" * 60)

MONTH = 7  # July - SW monsoon peak
history = [
    {"hours_ago": 1.0,  "severity": "HIGH",   "count": 2},
    {"hours_ago": 4.0,  "severity": "MEDIUM", "count": 3},
    {"hours_ago": 10.0, "severity": "HIGH",   "count": 1},
    {"hours_ago": 22.0, "severity": "LOW",    "count": 4},
]
weather = {"rainfall_mm_hr": 65, "river_status": "WARNING"}

print("\n  Same raw incident count, two districts:")
print("  (Monaragala=remote/high-bias vs Colombo=urban/low-bias)")

for district in ["Monaragala", "Colombo"]:
    r = forecast_risk(district, history, weather, MONTH)
    b = r["bias_info"]
    ci = r["confidence_interval"]
    bc = r["baseline_comparison"]
    print(f"\n  -- {district} --")
    print(f"     Risk          : {r['risk_level']} ({r['risk_score']:.0%})")
    print(f"     CI 90%        : [{ci['lower']:.0%}, {ci['upper']:.0%}]")
    print(f"     Bias factor   : {b['bias_factor']} ({b['bias_level']})")
    print(f"     High bias flag: {b['is_high_bias']}")
    print(f"     B1 naive      : {bc['B1_naive_count']['risk_level']} ({bc['B1_naive_count']['score']:.3f})")
    print(f"     B2 seasonal   : {bc['B2_seasonal_arima']['risk_level']} ({bc['B2_seasonal_arima']['score']:.3f})")
    print(f"     Proposed      : {bc['proposed_bias_corrected_GNN']['risk_level']} ({bc['proposed_bias_corrected_GNN']['score']:.3f})")

print("\n\n  MULTI-DISTRICT (2-pass spatial GNN):")
districts_data = [
    {"district": "Kalutara",   "incident_history": [{"hours_ago": 2, "severity": "CRITICAL", "count": 1}, {"hours_ago": 6, "severity": "HIGH", "count": 2}], "environmental_data": weather},
    {"district": "Colombo",    "incident_history": history, "environmental_data": weather},
    {"district": "Galle",      "incident_history": [{"hours_ago": 5, "severity": "MEDIUM", "count": 2}]},
    {"district": "Ratnapura",  "incident_history": [{"hours_ago": 3, "severity": "HIGH",   "count": 1}]},
    {"district": "Monaragala", "incident_history": history},
]
multi = multi_district_forecast(districts_data, month=MONTH, environmental_data=weather)
s = multi["summary"]
print(f"\n  Total: {s['total_districts']}  Critical/High: {s['critical_or_high']}  Highest risk: {s['highest_risk']}")
print(f"  Bias warning: {s['bias_warning']}")
print(f"\n  Rankings:")
for rank, f in enumerate(multi["forecasts"], 1):
    b = f["bias_info"]
    sp = f["spatial_detail"]
    flag = " [HIGH BIAS]" if b["is_high_bias"] else ""
    sn = f"  spatial+{sp['propagated_risk']:.3f}" if sp["n_active_neighbours"] > 0 else ""
    print(f"    [{rank}] {f['district']:15s} {f['risk_level']:8s} {f['risk_score']:.0%}  bias={b['bias_factor']:.2f}{flag}{sn}")
