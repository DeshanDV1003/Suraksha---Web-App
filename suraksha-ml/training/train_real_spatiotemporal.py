"""
MODEL 4 — Spatiotemporal Risk Model Calibrated on REAL DMC Incident Data
=========================================================================
Source: D:\\Suraksha - Web App\\DMC Records\\DI_report105745.xls (105,744 records)

Strategy:
  The Spatiotemporal Risk Model computes a risk score for each district-month
  cell (25 districts x 12 months = 300 cells) from historical DMC data.

  Real calibration approach:
  1. Load the 105,744 real incident records
  2. Compute:
     - Incident frequency per (district, month)
     - Death rate per incident per (district, month)
     - People affected per incident per (district, month)
     - Infrastructure damage per incident per (district, month)
  3. Normalise each dimension to [0,1]
  4. Compute composite risk score = weighted sum of dimensions
  5. Fit an XGBoost regressor to predict risk scores from features
     (district_code, month, disaster_type_distribution, avg_rainfall_proxy)
  6. Save risk_score_matrix.json, spatiotemporal_model.pkl, and model_info.json

Outputs (saved to suraksha-ml/models/):
  risk_score_matrix.json          -- District x Month risk matrix
  spatiotemporal_model.pkl        -- XGBoost regressor
  spatiotemporal_model_info.json  -- Metrics and calibration stats
"""

import os, json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder

# ── Paths ─────────────────────────────────────────────────────────────────────
XLS_PATH   = r"D:\Suraksha - Web App\DMC Records\DI_report105745.xls"
MODELS_DIR = r"D:\Suraksha - Web App\suraksha-ml\models"

print("=" * 65)
print("  MODEL 4 — Spatiotemporal Risk Model (REAL 105,744 DMC Records)")
print("=" * 65)

# ── Step 1: Load and parse real DMC data ──────────────────────────────────────
print("\n[1/6] Loading real DMC data...")
try:
    df = pd.read_csv(XLS_PATH, sep="\t", on_bad_lines="skip", low_memory=False)
except Exception:
    df = pd.read_html(XLS_PATH, flavor="html5lib")[0]
col_map = {
    'Event': 'Disaster', 'Date (YMD)': 'Date of Commenced',
    'Houses Destroyed': 'Houses Fully', 'Houses Damaged': 'Houses Partial',
    'Affected': 'People', 'Losses $Local': 'Direct Loss LKR',
    'fichas.latitude': 'Latitude', 'fichas.longitude': 'Longitude'
}
df = df.rename(columns=col_map)
print(f"      Loaded {len(df):,} records with {df.shape[1]} columns.")

# Ensure numeric columns
for col in ["Deaths", "Injured", "Missing", "People",
            "Houses Fully", "Houses Partial", "Direct Loss LKR"]:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

# Parse dates
df["_date"] = pd.to_datetime(df["Date of Commenced"], errors="coerce")
df["_month"] = df["_date"].dt.month.fillna(0).astype(int)
df["_year"]  = df["_date"].dt.year.fillna(0).astype(int)

# Map disaster type
def map_disaster_simple(raw):
    r = str(raw).upper()
    if "FLOOD"     in r: return "FLOOD"
    if "LANDSLIDE" in r: return "LANDSLIDE"
    if "FIRE"      in r: return "FIRE"
    if "WIND"      in r or "CYCLONE" in r: return "WIND"
    if "DROUGHT"   in r: return "DROUGHT"
    return "OTHER"

df["_disaster"] = df["Disaster"].apply(map_disaster_simple)

print(f"      Date range: {df['_date'].min().date()} to {df['_date'].max().date()}")
print(f"      Districts:  {df['District'].nunique()}")
print(f"      Months represented: {sorted(df['_month'].unique().tolist())}")

SL_DISTRICTS = [
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
    "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
    "Mullaitivu", "Vavuniya", "Anuradhapura", "Polonnaruwa", "Badulla",
    "Monaragala", "Ratnapura", "Kegalle", "Puttalam", "Kurunegala",
    "Trincomalee", "Batticaloa", "Ampara",
]

# ── Step 2: Compute district-month risk matrix ─────────────────────────────────
print("\n[2/6] Computing district-month risk matrix from real incident data...")

# Filter out month=0 records
df_valid = df[(df["_month"] >= 1) & (df["_month"] <= 12)].copy()

# Normalise district names (match to SL_DISTRICTS list)
def match_district(raw_district):
    raw = str(raw_district).strip()
    for d in SL_DISTRICTS:
        if d.lower() in raw.lower() or raw.lower() in d.lower():
            return d
    return raw.split()[0] if raw else "Unknown"  # take first word

df_valid["_district_clean"] = df_valid["District"].apply(match_district)

# Aggregate by district + month
agg = df_valid.groupby(["_district_clean", "_month"]).agg(
    incident_count = ("Deaths", "count"),
    total_deaths   = ("Deaths", "sum"),
    total_injured  = ("Injured", "sum"),
    total_people   = ("People", "sum"),
    total_houses_full  = ("Houses Fully", "sum"),
    total_houses_part  = ("Houses Partial", "sum"),
    total_loss_lkr     = ("Direct Loss LKR", "sum"),
).reset_index()

print(f"      District-month cells with data: {len(agg):,}")

# Normalise dimensions
def norm(series):
    mn, mx = series.min(), series.max()
    if mx == mn:
        return pd.Series([0.0] * len(series), index=series.index)
    return (series - mn) / (mx - mn)

agg["freq_score"]   = norm(agg["incident_count"])
agg["death_score"]  = norm(agg["total_deaths"])
agg["people_score"] = norm(agg["total_people"])
agg["loss_score"]   = norm(agg["total_loss_lkr"])
agg["house_score"]  = norm(agg["total_houses_full"])

# Weighted composite risk score
agg["risk_score"] = (
    0.30 * agg["death_score"]  +
    0.25 * agg["freq_score"]   +
    0.20 * agg["people_score"] +
    0.15 * agg["loss_score"]   +
    0.10 * agg["house_score"]
)

print(f"      Risk score range: {agg['risk_score'].min():.4f} to {agg['risk_score'].max():.4f}")

# Top 10 highest risk district-months
top10 = agg.nlargest(10, "risk_score")[["_district_clean", "_month", "risk_score", "incident_count", "total_deaths"]]
print("\n      Top 10 highest risk district-months:")
print(f"      {'District':20s} {'Month':>6} {'RiskScore':>10} {'Incidents':>10} {'Deaths':>7}")
print("      " + "-" * 60)
for _, row in top10.iterrows():
    print(f"      {str(row['_district_clean']):20s} {int(row['_month']):>6} {row['risk_score']:>10.4f} "
          f"{int(row['incident_count']):>10} {int(row['total_deaths']):>7}")

# ── Step 3: Build full 25x12 matrix with zero-fill for missing cells ───────────
print("\n[3/6] Building complete 25x12 district-month risk matrix...")

all_districts = list(set(SL_DISTRICTS + agg["_district_clean"].unique().tolist()))
all_districts = sorted(set(d for d in all_districts if d != "Unknown"))

risk_matrix = {}
for d in all_districts:
    risk_matrix[d] = {}
    for m in range(1, 13):
        row = agg[(agg["_district_clean"] == d) & (agg["_month"] == m)]
        risk_matrix[d][str(m)] = round(float(row["risk_score"].values[0]), 4) if len(row) > 0 else 0.0

# ── Step 4: Build ML feature matrix for the regressor ─────────────────────────
print("\n[4/6] Building regressor training data...")

DISASTER_TYPES = ["FLOOD", "LANDSLIDE", "FIRE", "WIND", "DROUGHT", "OTHER"]
le_district = LabelEncoder()
le_district.fit(all_districts)

# Disaster type distribution per district-month
disaster_dist = df_valid.groupby(["_district_clean", "_month", "_disaster"]).size().unstack(fill_value=0)
disaster_dist = disaster_dist.reindex(columns=DISASTER_TYPES, fill_value=0)

# Seasonal rainfall proxy (simple sinusoidal — calibrated to SL monsoon)
def rainfall_proxy(month):
    """Estimated monthly normalised rainfall (SW+NE monsoon pattern)."""
    import math
    sw = max(0, math.sin(math.pi * (month - 4) / 5)) if 5 <= month <= 9 else 0
    ne = max(0, math.sin(math.pi * ((month - 9) % 12) / 4)) if month >= 10 or month <= 1 else 0
    return round(max(sw, ne), 4)

# Coastal district flag
COASTAL = {"Colombo", "Gampaha", "Kalutara", "Galle", "Matara", "Hambantota",
           "Puttalam", "Trincomalee", "Batticaloa", "Ampara", "Jaffna", "Mannar", "Mullaitivu"}
MOUNTAIN = {"Kandy", "Nuwara Eliya", "Badulla", "Matale", "Ratnapura", "Kegalle"}

X_rows, y_rows = [], []
for d in all_districts:
    for m in range(1, 13):
        district_code = int(le_district.transform([d])[0])
        coastal  = 1.0 if d in COASTAL  else 0.0
        mountain = 1.0 if d in MOUNTAIN else 0.0
        rain_prx = rainfall_proxy(m)
        
        # Disaster type proportions for this district-month
        if (d, m) in disaster_dist.index:
            d_counts = disaster_dist.loc[(d, m)].values.astype(float)
            total    = d_counts.sum()
            d_ratios = (d_counts / total).tolist() if total > 0 else [0.0] * 6
        else:
            d_ratios = [0.0] * 6
        
        feature_row = [district_code, m, coastal, mountain, rain_prx] + d_ratios
        X_rows.append(feature_row)
        y_rows.append(risk_matrix[d][str(m)])

X = np.array(X_rows, dtype=np.float32)
y = np.array(y_rows, dtype=np.float32)
print(f"      Feature matrix: {X.shape}  |  Target shape: {y.shape}")

# ── Step 5: Train regressor ────────────────────────────────────────────────────
print("\n[5/6] Training Gradient Boosting Regressor for risk prediction...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

reg = GradientBoostingRegressor(
    n_estimators=200, max_depth=4, learning_rate=0.05,
    subsample=0.8, random_state=42
)
reg.fit(X_train, y_train)

y_pred = reg.predict(X_test)
mae   = mean_absolute_error(y_test, y_pred)
r2    = r2_score(y_test, y_pred)

cv_scores = cross_val_score(reg, X, y, cv=5, scoring="r2")

print(f"      Test MAE:  {mae:.6f}")
print(f"      Test R2:   {r2:.4f}")
print(f"      CV R2 per fold: {[round(s,4) for s in cv_scores]}")
print(f"      CV R2 mean:  {cv_scores.mean():.4f}  +/- {cv_scores.std():.4f}")

# ── Tier-classification accuracy (same thresholds ml/spatiotemporal_forecaster.py
#    uses for risk_level: CRITICAL>=0.70, HIGH>=0.50, MEDIUM>=0.30, else LOW) ──
def to_tier(score):
    if score >= 0.70: return "CRITICAL"
    if score >= 0.50: return "HIGH"
    if score >= 0.30: return "MEDIUM"
    return "LOW"

tier_true = np.array([to_tier(s) for s in y_test])
tier_pred = np.array([to_tier(s) for s in y_pred])
tier_accuracy = float((tier_true == tier_pred).mean())
print(f"      Risk-tier classification accuracy (derived from regressor output): {tier_accuracy:.4f}")

# ── Step 6: Save all outputs ──────────────────────────────────────────────────
print("\n[6/6] Saving model and risk matrix artifacts...")
os.makedirs(MODELS_DIR, exist_ok=True)

# Save risk matrix JSON
matrix_path = os.path.join(MODELS_DIR, "risk_score_matrix.json")
with open(matrix_path, "w") as f:
    json.dump({
        "generated_at":   datetime.now().isoformat(),
        "data_source":    "REAL_DMC_105744_RECORDS",
        "districts":      all_districts,
        "months":         list(range(1, 13)),
        "risk_matrix":    risk_matrix,
        "district_order": all_districts,
    }, f, indent=2)
print(f"  -> risk_score_matrix.json saved")

# Save trained regressor
model_path = os.path.join(MODELS_DIR, "spatiotemporal_model.pkl")
joblib.dump(reg, model_path)
le_path    = os.path.join(MODELS_DIR, "spatiotemporal_le_district.pkl")
joblib.dump(le_district, le_path)
print(f"  -> spatiotemporal_model.pkl saved")
print(f"  -> spatiotemporal_le_district.pkl saved")

# Save model info
model_info = {
    "version":       "v2.0_real_dmc",
    "trained_at":    datetime.now().isoformat(),
    "data_source":   "REAL_DMC_105744_RECORDS",
    "total_records": int(len(df)),
    "valid_records": int(len(df_valid)),
    "district_month_cells": int(len(agg)),
    "districts":     len(all_districts),
    "model_type":    "GradientBoostingRegressor",
    "n_estimators":  200,
    "test_mae":      round(float(mae), 6),
    "test_r2":       round(float(r2), 4),
    "cv_r2_mean":    round(float(cv_scores.mean()), 4),
    "cv_r2_std":     round(float(cv_scores.std()), 4),
    "risk_tier_classification_accuracy": round(tier_accuracy, 4),
    "caveat": (
        f"Only {len(agg):,} district-month cells with real incident data "
        f"({len(all_districts)} districts x 12 months), so the 20% test split "
        "is a small sample and R2/accuracy can vary noticeably by random_state. "
        "district_code is a plain categorical feature, so the model can largely "
        "learn per-district historical baselines rather than deeper spatiotemporal "
        "dynamics -- this is expected given the data volume, not a training bug."
    ),
    "features":      ["district_code", "month", "coastal", "mountain", "rainfall_proxy",
                      "flood_ratio", "landslide_ratio", "fire_ratio", "wind_ratio",
                      "drought_ratio", "other_ratio"],
    "risk_weights":  {
        "death_score":  0.30,
        "freq_score":   0.25,
        "people_score": 0.20,
        "loss_score":   0.15,
        "house_score":  0.10,
    }
}
info_path = os.path.join(MODELS_DIR, "spatiotemporal_model_info.json")
with open(info_path, "w") as f:
    json.dump(model_info, f, indent=2)
print(f"  -> spatiotemporal_model_info.json saved")

print("\n" + "=" * 65)
print(f"  MODEL 4 COMPLETE — Test R2: {r2:.4f}  MAE: {mae:.6f}")
print("=" * 65)
