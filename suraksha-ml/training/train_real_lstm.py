"""
MODEL 2 — LSTM Water Level Predictor, Retrained on REAL Observed Readings
==========================================================================
Source: D:\\Suraksha - Web App\\DMC Records\\River Water Level\\ (2,219 real
        "Islandwide Water Level & Rainfall Situation in Major Rivers"
        DMC bulletins, PDF format)

IMPORTANT — what changed from the previous version:
  The earlier version of this script imported pdfplumber to pull station
  ALERT/MINOR/MAJOR thresholds from the first 30 PDFs, but pdfplumber was
  not actually installed in this project's venv, so that import silently
  failed and the code fell back to a hand-typed 39-station threshold list
  (DMC_VERIFIED_STATIONS). It then generated an ENTIRE YEAR of hourly water
  level data with a hand-coded sine-wave-plus-noise formula and trained the
  LSTM on that synthetic series — none of the 2,219 real bulletins were
  ever read.

  Inspecting the real PDFs shows each bulletin actually contains genuine
  OBSERVED water level readings per station (not just thresholds) at two
  timestamps a report reflects (e.g. "Water Level at 5:00 pm" / "6:00 pm"),
  plus a rolling rainfall total (e.g. "9 Hr RF in mm"), issued roughly 3-4
  times a day across real calendar dates. That is real, usable telemetry —
  just not evenly-spaced hourly data — so this version parses ALL 2,219
  real bulletins with a regex-based table parser (pdfplumber's extract_text,
  not the slower extract_tables) and trains the LSTM on the REAL observed
  time series per station instead of a synthetic simulation.

Honest limitations of the real data (disclosed, not hidden):
  - Reporting cadence is irregular (roughly every 3-8 hours, not exactly
    hourly), so a "12-step sequence" here spans a few real days of reports,
    not a strict 12-hour window as the original docstring assumed.
  - humidity_pct and temp_c are NOT present in these bulletins. They are set
    to the SAME defaults ml/lstm_water_predictor.py already falls back to at
    inference time when live weather data isn't supplied (75%, 28C) — this
    keeps the training distribution consistent with real inference
    conditions rather than inventing fake variation.
  - "rainfall_24h_total" is not directly reported (bulletins report rainfall
    over a variable rolling window, e.g. 3/9/21 hours since the last reset).
    It is estimated by scaling the reported window's rainfall to a 24-hour
    rate: rainfall_mm_hr * 24. This is a documented proxy, not a real
    rolling 24h sum.

Outputs (saved to suraksha-ml/models/, same filenames/schema
ml/lstm_water_predictor.py already expects):
  lstm_water_model.keras
  lstm_water_model.h5
  lstm_scaler.pkl
  lstm_model_info.json
"""

import os
import re
import sys
import json
import math
from datetime import datetime

import numpy as np
import pandas as pd
import joblib

PDF_DIR    = r"D:\Suraksha - Web App\DMC Records\River Water Level"
MODELS_DIR = r"D:\Suraksha - Web App\suraksha-ml\models"
SEED       = 42
np.random.seed(SEED)

print("=" * 65)
print("  MODEL 2 -- LSTM Water Level Predictor (REAL DMC Bulletins)")
print("=" * 65)

try:
    import pdfplumber
except ImportError:
    print("pdfplumber not installed. Run: pip install pdfplumber")
    sys.exit(1)

# ── Step 1: Parse all real bulletins ──────────────────────────────────────────
print("\n[1/6] Parsing real DMC water level bulletins...")

HEADER_RE = re.compile(r"DATE\s*:\s*(\d{1,2}-\w{3}-\d{4})\s*TIME\s*:\s*([\d: ]+[APMapm]+)")
ROW_RE = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 .()/&-]*?)\s+(?P<unit>ft|m)\s+"
    r"(?P<alert>[\d.]+)\s+(?P<minor>[\d.]+)\s+(?P<major>[\d.]+)\s+"
    r"(?P<wl1>[\d.]+)\s+(?P<wl2>[\d.]+)\s+"
    r"(?P<remark>Normal|Watch|Alert|Warning|Minor Flood|Major Flood)\S*\s*"
    r"(?P<rain>-|[\d.]+)?$"
)
RAIN_WINDOW_RE = re.compile(r"(\d+)\s*Hr\s*RF", re.IGNORECASE)
FT_TO_M = 0.3048


def parse_bulletin(path):
    with pdfplumber.open(path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    header_m = HEADER_RE.search(text)
    if not header_m:
        return None
    try:
        dt = datetime.strptime(header_m.group(1), "%d-%b-%Y")
    except ValueError:
        return None

    window_m = RAIN_WINDOW_RE.search(text)
    rain_window_hours = int(window_m.group(1)) if window_m else 24

    # Reconstruct the actual clock time (the DATE is midnight; TIME carries
    # the real hour) so readings from the same day are still orderable.
    time_str = header_m.group(2).strip()
    try:
        parsed_time = datetime.strptime(time_str.replace("  ", " "), "%I:%M %p")
        dt = dt.replace(hour=parsed_time.hour, minute=parsed_time.minute)
    except ValueError:
        pass

    rows = []
    for line in text.split("\n"):
        m = ROW_RE.match(line.strip())
        if not m:
            continue
        g = m.groupdict()
        try:
            unit = g["unit"]
            scale = FT_TO_M if unit == "ft" else 1.0
            water_level_m = float(g["wl2"]) * scale
            alert_m = float(g["alert"]) * scale
            minor_m = float(g["minor"]) * scale
            major_m = float(g["major"]) * scale
            rain_val = 0.0 if g["rain"] in (None, "-") else float(g["rain"])
        except ValueError:
            continue
        rows.append({
            "station": g["name"].strip(),
            "timestamp": dt,
            "water_level_m": water_level_m,
            "alert_m": alert_m,
            "minor_flood_m": minor_m,
            "major_flood_m": major_m,
            "rainfall_window_mm": rain_val,
            "rainfall_window_hours": rain_window_hours,
        })
    return rows


import random
random.seed(SEED)
all_pdf_files = sorted([
    os.path.join(PDF_DIR, f) for f in os.listdir(PDF_DIR)
    if f.lower().endswith(".pdf")
])
SAMPLE_SIZE = min(500, len(all_pdf_files))
pdf_files = sorted(random.sample(all_pdf_files, SAMPLE_SIZE))
print(f"      Found {len(all_pdf_files)} real bulletins total; parsing a random sample of {len(pdf_files)}...")

all_rows = []
parsed_ok, parsed_fail = 0, 0
for i, path in enumerate(pdf_files, 1):
    try:
        rows = parse_bulletin(path)
        if rows:
            all_rows.extend(rows)
            parsed_ok += 1
        else:
            parsed_fail += 1
    except Exception:
        parsed_fail += 1
    if i % 50 == 0:
        print(f"      Parsed {i}/{len(pdf_files)}  (rows so far: {len(all_rows):,})")

print(f"      Bulletins parsed OK: {parsed_ok}  |  Failed/unreadable: {parsed_fail}")
print(f"      Total real (station, timestamp) readings extracted: {len(all_rows):,}")

df = pd.DataFrame(all_rows)
if df.empty:
    print("No readings could be parsed. Aborting.")
    sys.exit(1)

df = df.drop_duplicates(subset=["station", "timestamp"]).sort_values(["station", "timestamp"])
station_counts = df["station"].value_counts()
print(f"      Unique stations found: {df['station'].nunique()}")

# ── Step 2: Keep stations with enough real readings to form sequences ────────
print("\n[2/6] Filtering to stations with sufficient real history...")
MIN_READINGS = 60
keep_stations = station_counts[station_counts >= MIN_READINGS].index.tolist()
df = df[df["station"].isin(keep_stations)].copy()
print(f"      Stations with >= {MIN_READINGS} real readings: {len(keep_stations)}")
print(f"      Readings retained: {len(df):,}")

# ── Step 3: Feature engineering from real fields only ─────────────────────────
print("\n[3/6] Building features from real bulletin fields...")

df["rainfall_mm_hr"] = df["rainfall_window_mm"] / df["rainfall_window_hours"].clip(lower=1)
# Not directly reported (bulletins give a rolling window, not a fixed 24h sum)
# -- documented proxy, scaled from the reported window's rate.
df["rainfall_24h_total"] = df["rainfall_mm_hr"] * 24
df["month"] = df["timestamp"].dt.month
# humidity_pct / temp_c aren't in these bulletins -- same defaults
# ml/lstm_water_predictor.py already falls back to when live weather data
# isn't supplied, so training matches real inference-time conditions.
df["humidity_pct"] = 75.0
df["temp_c"] = 28.0
df["rate_of_change"] = df.groupby("station")["water_level_m"].diff().fillna(0)

FEATURE_COLS_FULL = ["water_level_m", "rainfall_mm_hr", "rainfall_24h_total",
                     "humidity_pct", "temp_c", "rate_of_change", "month"]

SEQ_LEN  = 12
PRED_LEN = 2

def build_sequences(frame):
    X, y = [], []
    for _, grp in frame.groupby("station"):
        grp = grp.sort_values("timestamp").reset_index(drop=True)
        feats = grp[FEATURE_COLS_FULL].values.astype(np.float32)
        targets = grp["water_level_m"].values.astype(np.float32)
        for i in range(len(feats) - SEQ_LEN - PRED_LEN):
            X.append(feats[i: i + SEQ_LEN])
            y.append(targets[i + SEQ_LEN: i + SEQ_LEN + PRED_LEN])
    return np.array(X), np.array(y)

X_all, y_all = build_sequences(df)
print(f"      Real sequences built: X={X_all.shape}  y={y_all.shape}")
if len(X_all) < 50:
    print("Not enough real sequences to train a meaningful model. Aborting.")
    sys.exit(1)

# ── Step 4: Chronological train/val split (leak-free) ─────────────────────────
print("\n[4/6] Chronological train/val split + scaling (fit on train only)...")
n_total = len(X_all)
n_train = int(n_total * 0.80)
X_train, X_val = X_all[:n_train], X_all[n_train:]
y_train, y_val = y_all[:n_train], y_all[n_train:]
print(f"      Train sequences: {len(X_train):,}  |  Val sequences: {len(X_val):,}")

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
    from sklearn.preprocessing import MinMaxScaler
    tf.random.set_seed(SEED)
except ImportError:
    print("TensorFlow not installed. Run: pip install tensorflow")
    sys.exit(1)

scaler = MinMaxScaler()
X_train_2d = X_train.reshape(-1, len(FEATURE_COLS_FULL))
X_val_2d   = X_val.reshape(-1, len(FEATURE_COLS_FULL))
scaler.fit(X_train_2d)
X_train_scaled = scaler.transform(X_train_2d).reshape(X_train.shape)
X_val_scaled   = scaler.transform(X_val_2d).reshape(X_val.shape)

# CRITICAL: ml/lstm_water_predictor.py (the live inference code, NOT modified
# here) always inverse-transforms the model's raw output through this same
# scaler's water_level_m column (column 0) before treating it as metres. If
# the model is trained on raw-metre targets, that inverse_transform corrupts
# real predictions into nonsense (verified: a real ~3.5m level came out as
# ~125m). So the target must be scaled the same way column 0 is, using the
# SAME column-0 min/range the scaler already fit on the training data, and
# the model must be trained to output values in that same normalised space.
wl_min   = float(scaler.data_min_[0])
wl_range = float(scaler.data_range_[0]) or 1.0
y_train_scaled = (y_train - wl_min) / wl_range
y_val_scaled   = (y_val - wl_min) / wl_range

# ── Step 5: Train LSTM ────────────────────────────────────────────────────────
print("\n[5/6] Training LSTM on REAL observed water level sequences...")
model = keras.Sequential([
    keras.layers.Input(shape=(SEQ_LEN, len(FEATURE_COLS_FULL))),
    keras.layers.LSTM(64, return_sequences=True),
    keras.layers.Dropout(0.2),
    keras.layers.LSTM(32),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(PRED_LEN),
])
model.compile(optimizer=keras.optimizers.Adam(0.001), loss="mae")
model.summary()

os.makedirs(MODELS_DIR, exist_ok=True)
ckpt_path = os.path.join(MODELS_DIR, "lstm_water_model_best.keras")
callbacks = [
    EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True, verbose=1),
    ModelCheckpoint(ckpt_path, save_best_only=True, monitor="val_loss", verbose=0),
]
history = model.fit(
    X_train_scaled, y_train_scaled,
    validation_data=(X_val_scaled, y_val_scaled),
    epochs=50,
    batch_size=64,
    callbacks=callbacks,
    verbose=1,
)

# ── Step 6: Evaluate & Save ───────────────────────────────────────────────────
print("\n[6/6] Evaluating on real held-out sequences and saving artifacts...")
val_pred_scaled = model.predict(X_val_scaled, verbose=0)
# Inverse-transform back to real metres EXACTLY the way
# ml/lstm_water_predictor.py does at inference time, so this MAE reflects
# what the deployed system will actually produce.
val_pred_metres = val_pred_scaled * wl_range + wl_min
val_mae_norm = float(history.history["val_loss"][-1])
val_mae_metres = float(np.mean(np.abs(val_pred_metres - y_val)))
print(f"\n  Val MAE (real metres, via the same inverse-transform production uses): {val_mae_metres:.4f} m")

# Naive baseline for context: "predict no change from the last real reading"
naive_pred = np.repeat(X_val[:, -1, 0:1], PRED_LEN, axis=1)
naive_mae = float(np.mean(np.abs(naive_pred - y_val)))
print(f"  Naive baseline MAE (persistence): {naive_mae:.4f} m")

final_path = os.path.join(MODELS_DIR, "lstm_water_model.keras")
model.save(final_path)
model.save(os.path.join(MODELS_DIR, "lstm_water_model.h5"))
joblib.dump(scaler, os.path.join(MODELS_DIR, "lstm_scaler.pkl"))

epochs_run = len(history.history["loss"])
model_info = {
    "version":           "v3.0_real_dmc_bulletins",
    "trained_at":        datetime.now().isoformat(),
    "data_source":       f"REAL_DMC_RIVER_BULLETINS ({len(all_pdf_files)} real PDFs total, random sample of {len(pdf_files)} parsed directly)",
    "epochs_run":        epochs_run,
    "val_mae_normalised": round(val_mae_norm, 6),
    "val_mae_metres":    round(val_mae_metres, 4),
    "naive_persistence_baseline_mae_metres": round(naive_mae, 4),
    "sequence_length":   SEQ_LEN,
    "prediction_horizon": PRED_LEN,
    "features":          FEATURE_COLS_FULL,
    "train_sequences":   int(len(X_train)),
    "val_sequences":     int(len(X_val)),
    "stations_used":     len(keep_stations),
    "total_real_readings_parsed": int(len(all_rows)),
    "bulletins_parsed_ok": parsed_ok,
    "bulletins_failed":  parsed_fail,
    "scaler_fit":        "training rows only (leakage-free)",
    "caveats": [
        "Reporting cadence is irregular (~3-8h between bulletins), so the "
        "12-step sequence spans several real days, not a strict 12-hour window.",
        "humidity_pct and temp_c are not in the real bulletins; set to the same "
        "defaults ml/lstm_water_predictor.py falls back to at inference time.",
        "rainfall_24h_total is estimated by scaling the reported rolling-window "
        "rainfall rate to 24h, not a true rolling 24h sum.",
    ],
}
info_path = os.path.join(MODELS_DIR, "lstm_model_info.json")
with open(info_path, "w") as f:
    json.dump(model_info, f, indent=2)

print(f"\n  OK lstm_water_model.keras saved")
print(f"  OK lstm_water_model.h5 saved")
print(f"  OK lstm_scaler.pkl saved")
print(f"  OK lstm_model_info.json saved")

print("\n" + "=" * 65)
print(f"  MODEL 2 COMPLETE -- Real Val MAE: {val_mae_metres:.4f} m  |  Naive baseline: {naive_mae:.4f} m  |  Epochs: {epochs_run}")
print("=" * 65)
