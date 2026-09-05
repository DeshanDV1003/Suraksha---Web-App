"""
MODEL 4 — Spatiotemporal Risk Model Calibrated on REAL DMC Incident Data
=========================================================================
Source: D:\\Suraksha - Web App\\DMC Records\\DI_report105745.xls (~105,744 records,
        disaster events 1988–2026).

v3.0 rationale — why this is a real forecasting model, not a lookup table
------------------------------------------------------------------------
v2.0 aggregated every year together into ~295 (district, month) cells, then
trained a regressor to predict a composite risk score from (district_code,
month, geography, CURRENT-month disaster mix). Two problems:

  1. Leakage: the composite risk score is a weighted sum of that month's
     deaths / incident-count / people-affected / loss / houses, and the
     "disaster mix" feature was computed from the *same* rows, so the model
     was partly reading its own target.
  2. No generalisation: 295 rows, district_code as the dominant signal ->
     the model just memorised per-district averages. 5-fold CV R2 was 0.05.

v3.0 restructures it as an honest one-month-ahead forecast:

  * Cells are (district, year, month) — ~4–6k non-empty cells over 1990–2026.
  * The target is the composite risk score for cell t.
  * Features use ONLY information available before month t: the previous
    month's risk / deaths / incident count, a trailing 3-month window, the
    same month one year earlier, a linear year term, calendar seasonality
    (month sin/cos + monsoon rainfall proxy), and static geography
    (district, coastal, mountain). No current-month outcome feeds the model.
  * Train/test split is chronological (train <= 2017, test >= 2018) and a
    5-fold CV is also reported. Risk here is genuinely predictable because
    disaster activity is seasonal and strongly autocorrelated month to month.

Outputs (saved to suraksha-ml/models/):
  risk_score_matrix.json          -- District x Month risk climatology
                                     (mean over years; same shape as before,
                                      consumed by ml/spatiotemporal_forecaster.py)
  spatiotemporal_model.pkl        -- GradientBoosting one-month-ahead regressor
  spatiotemporal_le_district.pkl  -- district LabelEncoder
  spatiotemporal_model_info.json  -- metrics and calibration stats
"""

import os, json, math
import numpy as np
import pandas as pd
import joblib
from datetime import datetime

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score

# ── Paths ─────────────────────────────────────────────────────────────────────
XLS_PATH   = r"D:\Suraksha - Web App\DMC Records\DI_report105745.xls"
MODELS_DIR = r"D:\Suraksha - Web App\suraksha-ml\models"
SEED = 42

print("=" * 65)
print("  MODEL 4 — Spatiotemporal Risk Model v3.0 (one-month-ahead forecast)")
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
}
df = df.rename(columns=col_map)
print(f"      Loaded {len(df):,} records with {df.shape[1]} columns.")

for col in ["Deaths", "Injured", "Missing", "People",
            "Houses Fully", "Houses Partial", "Direct Loss LKR"]:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

df["_date"]  = pd.to_datetime(df["Date of Commenced"], errors="coerce")
df["_month"] = df["_date"].dt.month
df["_year"]  = df["_date"].dt.year

def map_disaster_simple(raw):
    r = str(raw).upper()
    if "FLOOD"     in r: return "FLOOD"
    if "LANDSLIDE" in r: return "LANDSLIDE"
    if "FIRE"      in r: return "FIRE"
    if "WIND" in r or "CYCLONE" in r: return "WIND"
    if "DROUGHT"   in r: return "DROUGHT"
    return "OTHER"

df["_disaster"] = df["Disaster"].apply(map_disaster_simple)

SL_DISTRICTS = [
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
    "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
    "Mullaitivu", "Vavuniya", "Anuradhapura", "Polonnaruwa", "Badulla",
    "Monaragala", "Ratnapura", "Kegalle", "Puttalam", "Kurunegala",
    "Trincomalee", "Batticaloa", "Ampara",
]
COASTAL = {"Colombo", "Gampaha", "Kalutara", "Galle", "Matara", "Hambantota",
           "Puttalam", "Trincomalee", "Batticaloa", "Ampara", "Jaffna", "Mannar", "Mullaitivu"}
MOUNTAIN = {"Kandy", "Nuwara Eliya", "Badulla", "Matale", "Ratnapura", "Kegalle"}
DISASTER_TYPES = ["FLOOD", "LANDSLIDE", "FIRE", "WIND", "DROUGHT", "OTHER"]

def match_district(raw_district):
    raw = str(raw_district).strip()
    for d in SL_DISTRICTS:
        if d.lower() in raw.lower() or raw.lower() in d.lower():
            return d
    return raw.split()[0] if raw else "Unknown"

MIN_YEAR, MAX_YEAR = 1990, 2026
mask = (
    df["_month"].between(1, 12) & df["_year"].between(MIN_YEAR, MAX_YEAR)
    & df["_date"].notna()
)
df_valid = df[mask].copy()
df_valid["_district_clean"] = df_valid["District"].apply(match_district)
df_valid = df_valid[df_valid["_district_clean"].isin(SL_DISTRICTS)]
print(f"      Usable event rows (1990–2026, known district): {len(df_valid):,}")
print(f"      Date range: {df_valid['_date'].min().date()} to {df_valid['_date'].max().date()}")

# ── Step 2: Build (district, year, month) cells ───────────────────────────────
print("\n[2/6] Aggregating into (district, year, month) cells...")

agg = df_valid.groupby(["_district_clean", "_year", "_month"]).agg(
    incident_count    = ("Deaths", "count"),
    total_deaths      = ("Deaths", "sum"),
    total_injured     = ("Injured", "sum"),
    total_people      = ("People", "sum"),
    total_houses_full = ("Houses Fully", "sum"),
    total_loss_lkr    = ("Direct Loss LKR", "sum"),
).reset_index()

# Dense grid: every district x every year x 12 months (missing => zero activity)
years = list(range(int(df_valid["_year"].min()), int(df_valid["_year"].max()) + 1))
grid = pd.MultiIndex.from_product(
    [SL_DISTRICTS, years, range(1, 13)],
    names=["_district_clean", "_year", "_month"],
).to_frame(index=False)
cells = grid.merge(agg, on=["_district_clean", "_year", "_month"], how="left").fillna(0.0)
print(f"      Dense cells: {len(cells):,}  ({len(SL_DISTRICTS)} districts x {len(years)} years x 12 months)")
print(f"      Non-empty cells (>=1 incident): {(cells['incident_count'] > 0).sum():,}")

# ── Step 3: Composite risk score per cell (global log-scaled min-max) ─────────
print("\n[3/6] Computing composite risk score per cell...")

def log_norm(series):
    v = np.log1p(series.clip(lower=0).astype(float))
    mn, mx = v.min(), v.max()
    return (v - mn) / (mx - mn) if mx > mn else v * 0.0

cells["freq_score"]   = log_norm(cells["incident_count"])
cells["death_score"]  = log_norm(cells["total_deaths"])
cells["people_score"] = log_norm(cells["total_people"])
cells["loss_score"]   = log_norm(cells["total_loss_lkr"])
cells["house_score"]  = log_norm(cells["total_houses_full"])

RISK_WEIGHTS = {"death_score": 0.30, "freq_score": 0.25, "people_score": 0.20,
                "loss_score": 0.15, "house_score": 0.10}
cells["risk_score"] = sum(w * cells[k] for k, w in RISK_WEIGHTS.items())
print(f"      Risk score range: {cells['risk_score'].min():.4f} to {cells['risk_score'].max():.4f}"
      f"  mean {cells['risk_score'].mean():.4f}")

# Disaster-type ratio per cell (trailing use only — see feature builder)
dist_mix = (df_valid.groupby(["_district_clean", "_year", "_month", "_disaster"])
            .size().unstack(fill_value=0).reindex(columns=DISASTER_TYPES, fill_value=0))
dist_mix = dist_mix.div(dist_mix.sum(axis=1).replace(0, np.nan), axis=0).fillna(0.0)

# ── Step 4: Feature matrix — one-month-ahead, no current-month leakage ────────
print("\n[4/6] Building lag / seasonal / geography features (no current-month leak)...")

cells = cells.sort_values(["_district_clean", "_year", "_month"]).reset_index(drop=True)
cells["t"] = cells["_year"] * 12 + (cells["_month"] - 1)   # absolute month index

# per-district lag lookups
by_d = {d: g.set_index("t") for d, g in cells.groupby("_district_clean")}

from sklearn.preprocessing import LabelEncoder
le_district = LabelEncoder().fit(SL_DISTRICTS)

def rainfall_proxy(month):
    sw = max(0.0, math.sin(math.pi * (month - 4) / 5)) if 5 <= month <= 9 else 0.0
    ne = max(0.0, math.sin(math.pi * ((month - 9) % 12) / 4)) if (month >= 10 or month <= 1) else 0.0
    return round(max(sw, ne), 4)

FEATURES = [
    "district_code", "month", "month_sin", "month_cos", "year_norm",
    "coastal", "mountain", "rainfall_proxy",
    "lag1_risk", "lag1_incidents", "lag1_deaths",
    "lag2_risk", "lag12_risk",
    "roll3_risk_mean", "roll3_incidents_sum",
    "trail_flood_ratio", "trail_landslide_ratio", "trail_wind_ratio",
]

rows, targets, meta = [], [], []
for _, r in cells.iterrows():
    d, y, m, t = r["_district_clean"], int(r["_year"]), int(r["_month"]), int(r["t"])
    g = by_d[d]

    def cell_at(idx, col, default=0.0):
        try:
            return float(g.loc[idx, col])
        except (KeyError, TypeError):
            return default

    lag1_risk   = cell_at(t - 1, "risk_score")
    lag2_risk   = cell_at(t - 2, "risk_score")
    lag12_risk  = cell_at(t - 12, "risk_score")
    roll3_risk  = np.mean([cell_at(t - k, "risk_score") for k in (1, 2, 3)])
    roll3_inc   = sum(cell_at(t - k, "incident_count") for k in (1, 2, 3))

    # trailing disaster mix: average of the 3 previous months for this district
    tr = []
    for k in (1, 2, 3):
        yy, mm = divmod((t - k), 12)
        key = (d, yy, mm + 1)
        if key in dist_mix.index:
            tr.append(dist_mix.loc[key].values.astype(float))
    tr = np.mean(tr, axis=0) if tr else np.zeros(len(DISASTER_TYPES))
    trail = dict(zip(DISASTER_TYPES, tr))

    # skip the first year per district (no 12-month lag history yet)
    if y == years[0]:
        continue

    rows.append([
        int(le_district.transform([d])[0]),
        m,
        math.sin(2 * math.pi * m / 12),
        math.cos(2 * math.pi * m / 12),
        (y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR),
        1.0 if d in COASTAL else 0.0,
        1.0 if d in MOUNTAIN else 0.0,
        rainfall_proxy(m),
        lag1_risk,
        cell_at(t - 1, "incident_count"),
        cell_at(t - 1, "total_deaths"),
        lag2_risk,
        lag12_risk,
        roll3_risk,
        roll3_inc,
        trail["FLOOD"], trail["LANDSLIDE"], trail["WIND"],
    ])
    targets.append(float(r["risk_score"]))
    meta.append((d, y, m))

X = np.array(rows, dtype=np.float32)
y_all = np.array(targets, dtype=np.float32)
years_arr = np.array([mm[1] for mm in meta])
print(f"      Feature matrix: {X.shape}  |  target: {y_all.shape}")

# ── Step 5: Chronological train/test + CV ────────────────────────────────────
print("\n[5/6] Training one-month-ahead GradientBoosting regressor...")
SPLIT_YEAR = 2018
tr_mask = years_arr < SPLIT_YEAR
te_mask = ~tr_mask
X_train, y_train = X[tr_mask], y_all[tr_mask]
X_test,  y_test  = X[te_mask], y_all[te_mask]
print(f"      Train (<{SPLIT_YEAR}): {len(y_train):,}   Test (>={SPLIT_YEAR}): {len(y_test):,}")

reg = GradientBoostingRegressor(
    n_estimators=400, max_depth=3, learning_rate=0.05,
    subsample=0.8, random_state=SEED,
)
reg.fit(X_train, y_train)

y_pred = reg.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2  = r2_score(y_test, y_pred)

cv_scores = cross_val_score(reg, X, y_all, cv=5, scoring="r2")

# persistence baseline: predict lag1_risk
base_pred = X_test[:, FEATURES.index("lag1_risk")]
base_r2 = r2_score(y_test, base_pred)

print(f"      Chronological test  MAE: {mae:.6f}   R2: {r2:.4f}")
print(f"      Persistence baseline R2 (predict last month): {base_r2:.4f}")
print(f"      5-fold CV R2: {[round(s, 4) for s in cv_scores]}")
print(f"      CV R2 mean: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

def to_tier(s):
    if s >= 0.70: return "CRITICAL"
    if s >= 0.50: return "HIGH"
    if s >= 0.30: return "MEDIUM"
    return "LOW"

tier_true = np.array([to_tier(s) for s in y_test])
tier_pred = np.array([to_tier(s) for s in y_pred])
tier_acc  = float((tier_true == tier_pred).mean())
# 3-bucket coarse accuracy (LOW / MEDIUM / HIGH+CRITICAL)
def coarse(s): return 0 if s < 0.30 else (1 if s < 0.50 else 2)
coarse_acc = float((np.array([coarse(s) for s in y_test]) ==
                    np.array([coarse(s) for s in y_pred])).mean())
print(f"      Risk-tier accuracy (4-tier): {tier_acc:.4f}   (3-bucket): {coarse_acc:.4f}")

# feature importances
imp = sorted(zip(FEATURES, reg.feature_importances_), key=lambda x: -x[1])
print("\n      Top features:")
for name, val in imp[:8]:
    print(f"        {name:22s} {val:.3f}")

# ── Step 6: Save artifacts ──────────────────────────────────────────────────
print("\n[6/6] Saving model + risk climatology matrix...")
os.makedirs(MODELS_DIR, exist_ok=True)

# Backward-compatible risk_score_matrix.json = per-district-month climatology
clim = (cells.groupby(["_district_clean", "_month"])["risk_score"].mean()
        .reset_index())
risk_matrix = {d: {str(m): 0.0 for m in range(1, 13)} for d in SL_DISTRICTS}
for _, rr in clim.iterrows():
    risk_matrix[rr["_district_clean"]][str(int(rr["_month"]))] = round(float(rr["risk_score"]), 4)

with open(os.path.join(MODELS_DIR, "risk_score_matrix.json"), "w") as f:
    json.dump({
        "generated_at": datetime.now().isoformat(),
        "data_source":  "REAL_DMC_DI_report105745 (1990-2026 events)",
        "semantics":    "risk_matrix[district][month] = mean composite risk score "
                        "for that calendar month across all years 1990-2026 "
                        "(climatology). Used as a prior by ml/spatiotemporal_forecaster.py.",
        "districts":    SL_DISTRICTS,
        "months":       list(range(1, 13)),
        "risk_matrix":  risk_matrix,
        "district_order": SL_DISTRICTS,
    }, f, indent=2)
print("  -> risk_score_matrix.json saved")

joblib.dump(reg, os.path.join(MODELS_DIR, "spatiotemporal_model.pkl"))
joblib.dump(le_district, os.path.join(MODELS_DIR, "spatiotemporal_le_district.pkl"))
print("  -> spatiotemporal_model.pkl / spatiotemporal_le_district.pkl saved")

model_info = {
    "version":        "v3.0_real_dmc_one_month_ahead",
    "trained_at":     datetime.now().isoformat(),
    "data_source":    "REAL_DMC_DI_report105745 (events 1990-2026)",
    "task":           "Predict a district's composite disaster-risk score for month "
                      "t using only information available through month t-1.",
    "usable_event_rows":  int(len(df_valid)),
    "cells_total":        int(len(cells)),
    "cells_non_empty":    int((cells["incident_count"] > 0).sum()),
    "training_samples":   int(len(y_train)),
    "test_samples":       int(len(y_test)),
    "split":              f"chronological: train year < {SPLIT_YEAR}, test year >= {SPLIT_YEAR}",
    "model_type":         "GradientBoostingRegressor",
    "n_estimators":       400,
    "test_mae":           round(float(mae), 6),
    "test_r2":            round(float(r2), 4),
    "persistence_baseline_r2": round(float(base_r2), 4),
    "cv_r2_mean":         round(float(cv_scores.mean()), 4),
    "cv_r2_std":          round(float(cv_scores.std()), 4),
    "risk_tier_accuracy_4tier":  round(tier_acc, 4),
    "risk_tier_accuracy_3bucket": round(coarse_acc, 4),
    "features":           FEATURES,
    "top_features":       [{"name": n, "importance": round(float(v), 4)} for n, v in imp[:8]],
    "risk_weights":       RISK_WEIGHTS,
    "notes": (
        "v3.0 removes the two v2.0 problems: (1) no current-month outcome is a "
        "feature, so the target is not leaked; (2) ~thousands of (district,year,"
        "month) cells instead of 295 collapsed cells, with a chronological "
        "hold-out. R2 is now a real forecast skill number and is compared "
        "against a persistence baseline. risk_score_matrix.json is unchanged in "
        "shape (district -> month -> score) and now holds the multi-year "
        "climatology consumed by ml/spatiotemporal_forecaster.py."
    ),
}
with open(os.path.join(MODELS_DIR, "spatiotemporal_model_info.json"), "w") as f:
    json.dump(model_info, f, indent=2, default=float)
print("  -> spatiotemporal_model_info.json saved")

print("\n" + "=" * 65)
print(f"  MODEL 4 v3.0 COMPLETE — test R2 {r2:.4f} (baseline {base_r2:.4f}), "
      f"tier acc {tier_acc:.4f}")
print("=" * 65)
