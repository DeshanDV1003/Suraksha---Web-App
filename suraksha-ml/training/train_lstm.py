"""
Suraksha — LSTM Water Level Training Script
---------------------------------------------
Generates synthetic Sri Lanka monsoon data and trains an LSTM model
to predict water levels T+1hr and T+2hr ahead.

Usage:
  python training/train_lstm.py

To use REAL data from your database export:
  1. Set USE_REAL_DATA = True below
  2. Set REAL_DATA_CSV to the path of your exported CSV
  3. CSV must have columns: timestamp, water_level_m, rainfall_mm_hr,
     rainfall_24h_total, humidity_pct, temp_c, month

After training, models/ folder will contain:
  - lstm_water_model.h5
  - lstm_scaler.pkl
  - lstm_model_info.json
"""

import os
import json
import math
import random
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta

# ── Config ──────────────────────────────────────────
USE_REAL_DATA  = False
REAL_DATA_CSV  = "data/water_levels_export.csv"
OUTPUT_DIR     = os.path.join(os.path.dirname(__file__), "../models")
SEQUENCE_LEN   = 12   # 12 hours of input
PREDICTION_LEN = 2    # predict T+1 and T+2
EPOCHS         = 50
BATCH_SIZE     = 32
VALIDATION_SPLIT = 0.20
SEED           = 42
# ────────────────────────────────────────────────────

os.makedirs(OUTPUT_DIR, exist_ok=True)
random.seed(SEED)
np.random.seed(SEED)

# ── Check TensorFlow ────────────────────────────────
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
    from sklearn.preprocessing import MinMaxScaler
    tf.random.set_seed(SEED)
    print(f"✅  TensorFlow {tf.__version__} ready.")
except ImportError:
    print("❌  TensorFlow not installed.")
    print("    Run:  pip install tensorflow==2.16.1 scikit-learn")
    exit(1)


# ════════════════════════════════════════════
# STEP 1 — GENERATE SYNTHETIC TRAINING DATA
# ════════════════════════════════════════════
def generate_synthetic_data(hours: int = 8760) -> pd.DataFrame:
    """
    Generate ~1 year of realistic hourly water level data for Sri Lanka.
    Key behaviours modelled:
    - SW monsoon peak May–Sep (Western province rivers)
    - NE monsoon peak Oct–Jan
    - Water level lags rainfall by 2–4 hours (LSTM must learn this)
    - Daily temperature and evaporation cycle
    - Occasional flash flood spikes
    """
    print(f"📊  Generating {hours} hours of synthetic Sri Lanka water data...")
    start = datetime(2023, 1, 1)
    records = []
    rainfall_buffer = [0.0] * 4   # 4-hour rainfall lag buffer

    base_level   = 4.0    # normal dry-season river level (metres)
    current_level = base_level

    for h in range(hours):
        ts    = start + timedelta(hours=h)
        month = ts.month
        hour  = ts.hour
        doy   = ts.timetuple().tm_yday   # day of year

        # ── Monsoon rainfall pattern ──────────────────────
        # SW monsoon: May–Sep → months 5–9
        sw_factor = max(0, math.sin(math.pi * (month - 4) / 5)) if 5 <= month <= 9 else 0
        # NE monsoon: Oct–Jan → months 10–12, 1
        ne_factor = max(0, math.sin(math.pi * ((month - 9) % 12) / 4)) if month >= 10 or month <= 1 else 0
        monsoon   = max(sw_factor, ne_factor)

        # Base hourly rainfall driven by season
        base_rain = monsoon * random.gauss(35, 15)
        base_rain = max(0, base_rain)

        # Occasional flash flood event (2% chance per hour during monsoon)
        if monsoon > 0.3 and random.random() < 0.02:
            base_rain += random.uniform(80, 150)

        # Diurnal: afternoon rain (14:00–18:00) more common
        if 14 <= hour <= 18:
            base_rain *= 1.4

        rainfall_mm_hr = round(base_rain + random.gauss(0, 2), 2)
        rainfall_mm_hr = max(0, rainfall_mm_hr)

        # ── Cumulative 24h rainfall ──────────────────────
        rainfall_buffer.append(rainfall_mm_hr)
        rainfall_buffer = rainfall_buffer[-24:]
        rainfall_24h = sum(rainfall_buffer)

        # ── Humidity ──────────────────────────────────────
        humidity = 70 + monsoon * 20 + random.gauss(0, 3)
        humidity = max(50, min(99, humidity))

        # ── Temperature ───────────────────────────────────
        # Hotter in dry season, cooler in rain; daily cycle
        temp_base  = 30 - monsoon * 4
        temp_daily = math.sin(math.pi * (hour - 6) / 12) * 4
        temp_c     = temp_base + temp_daily + random.gauss(0, 1)
        temp_c     = max(20, min(38, temp_c))

        # ── Water level: responds to lagged rainfall ───────
        # Use 3-hour lagged rainfall to drive level change
        lag_rain = sum(rainfall_buffer[-3:]) / 3 if len(rainfall_buffer) >= 3 else 0
        level_delta = (lag_rain / 30) * 0.8  # 30mm/hr raises level ~0.8m/hr
        level_delta -= 0.05   # base drainage/evaporation
        level_delta += random.gauss(0, 0.03)

        current_level = max(0.5, current_level + level_delta)

        # Dry-season regression toward base
        if monsoon < 0.1:
            current_level = current_level * 0.995 + base_level * 0.005

        records.append({
            "timestamp":        ts.isoformat(),
            "month":            month,
            "hour_of_day":      hour,
            "water_level_m":    round(current_level, 3),
            "rainfall_mm_hr":   round(rainfall_mm_hr, 3),
            "rainfall_24h_total": round(rainfall_24h, 3),
            "humidity_pct":     round(humidity, 1),
            "temp_c":           round(temp_c, 1),
        })

    df = pd.DataFrame(records)
    print(f"   Generated {len(df)} rows. Water level range: {df.water_level_m.min():.2f}–{df.water_level_m.max():.2f}m")
    return df


# ════════════════════════════════════════════
# STEP 2 — PREPROCESSING
# ════════════════════════════════════════════
FEATURE_COLS = [
    "water_level_m", "rainfall_mm_hr", "rainfall_24h_total",
    "humidity_pct", "temp_c", "rate_of_change", "month"
]

def preprocess(df: pd.DataFrame):
    # Compute rate of change
    df["rate_of_change"] = df["water_level_m"].diff().fillna(0)

    features = df[FEATURE_COLS].values.astype(np.float32)

    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(features)

    X, y = [], []
    for i in range(SEQUENCE_LEN, len(scaled) - PREDICTION_LEN):
        X.append(scaled[i - SEQUENCE_LEN : i])                  # (12, 7)
        # Target: normalised water_level_m at t+1 and t+2
        y.append([scaled[i, 0], scaled[i + 1, 0]])              # (2,)

    return np.array(X), np.array(y), scaler


# ════════════════════════════════════════════
# STEP 3 — BUILD LSTM MODEL
# ════════════════════════════════════════════
def build_model(input_shape):
    model = keras.Sequential([
        keras.layers.LSTM(64, return_sequences=True, input_shape=input_shape),
        keras.layers.Dropout(0.2),
        keras.layers.LSTM(32, return_sequences=False),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(16, activation="relu"),
        keras.layers.Dense(PREDICTION_LEN)   # 2 outputs: T+1 and T+2
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    model.summary()
    return model


# ════════════════════════════════════════════
# STEP 4 — TRAIN
# ════════════════════════════════════════════
def train():
    print("\n🧪  Loading / generating training data...")
    if USE_REAL_DATA and os.path.exists(REAL_DATA_CSV):
        df = pd.read_csv(REAL_DATA_CSV)
        print(f"   Loaded real data: {len(df)} rows from {REAL_DATA_CSV}")
    else:
        df = generate_synthetic_data(hours=8760)

    print("\n🔧  Preprocessing...")
    X, y, scaler = preprocess(df)
    print(f"   X shape: {X.shape}  y shape: {y.shape}")

    split = int(len(X) * (1 - VALIDATION_SPLIT))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    print(f"   Train: {len(X_train)}  Val: {len(X_val)}")

    print("\n🏗️   Building LSTM model...")
    model = build_model((SEQUENCE_LEN, len(FEATURE_COLS)))

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True, verbose=1),
        ModelCheckpoint(
            filepath=os.path.join(OUTPUT_DIR, "lstm_water_model.h5"),
            monitor="val_loss", save_best_only=True, verbose=1
        )
    ]

    print(f"\n🚀  Training ({EPOCHS} epochs, batch {BATCH_SIZE})...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )

    # ── Evaluate ────────────────────────────────────
    val_loss, val_mae = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n📈  Final Validation — Loss: {val_loss:.5f}  MAE: {val_mae:.5f}")

    # Inverse-transform MAE to metres
    dummy = np.zeros((1, len(FEATURE_COLS)))
    dummy[0, 0] = val_mae
    mae_m = scaler.inverse_transform(dummy)[0, 0] - scaler.inverse_transform(np.zeros((1, len(FEATURE_COLS))))[0, 0]
    print(f"   MAE in metres: ±{abs(mae_m):.3f}m")

    # ── Save artefacts ──────────────────────────────
    scaler_path = os.path.join(OUTPUT_DIR, "lstm_scaler.pkl")
    joblib.dump(scaler, scaler_path)
    print(f"💾  Scaler saved to {scaler_path}")

    info = {
        "version":        "v1.0",
        "trained_at":     datetime.utcnow().isoformat(),
        "epochs_run":     len(history.history["loss"]),
        "val_mae_normalised": round(float(val_mae), 6),
        "val_mae_metres": round(float(abs(mae_m)), 4),
        "sequence_length": SEQUENCE_LEN,
        "features":        FEATURE_COLS,
        "data_source":     "REAL_CSV" if USE_REAL_DATA else "SYNTHETIC"
    }
    info_path = os.path.join(OUTPUT_DIR, "lstm_model_info.json")
    with open(info_path, "w") as f:
        json.dump(info, f, indent=2)
    print(f"📋  Model info saved to {info_path}")
    print("\n✅  Training complete! Model ready for predictions.")
    print(f"    Model: {os.path.join(OUTPUT_DIR, 'lstm_water_model.h5')}")


if __name__ == "__main__":
    train()
