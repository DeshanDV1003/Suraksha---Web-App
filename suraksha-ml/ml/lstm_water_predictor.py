"""
Suraksha — LSTM Water Level Predictor
--------------------------------------
Loads a trained LSTM model and predicts water levels T+1hr and T+2hr ahead.
Falls back to rule-based logic if model file not found.
"""

import os
import json
import numpy as np
import joblib
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

# Gracefully import tensorflow (may not be installed on this Python)
try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("[INFO] TensorFlow not installed. Predictor will use rule-based fallback.")

MODEL_PATH  = os.path.join(os.path.dirname(__file__), "../models/lstm_water_model.keras")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "../models/lstm_scaler.pkl")
INFO_PATH   = os.path.join(os.path.dirname(__file__), "../models/lstm_model_info.json")

SEQUENCE_LENGTH = 12  # 12 hourly readings = 12-hour window
FEATURE_COLS    = [
    "water_level_m", "rainfall_mm_hr", "rainfall_24h_total",
    "humidity_pct", "temp_c", "rate_of_change", "month"
]

# Alert thresholds — the orchestrator passes gauge-specific ones,
# but these are used as safe defaults.
DEFAULT_WATCH_M    = 4.5
DEFAULT_WARNING_M  = 6.0
DEFAULT_CRITICAL_M = 8.0
MIN_CONFIDENCE     = 0.75  # Don't fire alerts below this threshold


class WaterLevelPredictor:

    def __init__(self):
        self.model        = None
        self.scaler       = None
        self.model_info   = {}
        self.model_loaded = False
        self._mc_fn       = None  # cached dropout-active inference fn (traced once)
        self._load_model()

    # ──────────────────────────────────────────
    # Load model artifacts
    # ──────────────────────────────────────────
    def _load_model(self):
        if not TF_AVAILABLE:
            print("[INFO] TensorFlow unavailable -- rule-based fallback active.")
            return

        try:
            if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
                self.model  = keras.models.load_model(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                if os.path.exists(INFO_PATH):
                    with open(INFO_PATH) as f:
                        self.model_info = json.load(f)
                self.model_loaded = True
                print(f"[OK] LSTM water model loaded. Version: {self.model_info.get('version', 'v1.0')}")
            else:
                print(f"[INFO] Model files not found at {MODEL_PATH}")
                print("    Run: python training/train_lstm.py  to generate them.")
        except Exception as e:
            print(f"[ERROR] Failed to load LSTM model: {e}")
            self.model_loaded = False

    # ──────────────────────────────────────────
    # Prepare feature matrix from readings list
    # ──────────────────────────────────────────
    def _prepare_features(self, readings: List[Dict]) -> np.ndarray:
        """
        readings: list of dicts, newest last, keys:
            water_level_m, rainfall_mm_hr, rainfall_24h_total,
            humidity_pct, temp_c, month
        Returns numpy array shape (SEQUENCE_LENGTH, 7)
        """
        rows = []
        levels = [r.get("water_level_m", 0) for r in readings]
        for i, r in enumerate(readings):
            roc = levels[i] - levels[i - 1] if i > 0 else 0.0
            rows.append([
                r.get("water_level_m", 0),
                r.get("rainfall_mm_hr", 0),
                r.get("rainfall_24h_total", 0),
                r.get("humidity_pct", 75),
                r.get("temp_c", 28),
                roc,
                r.get("month", datetime.now().month)
            ])
        arr = np.array(rows, dtype=np.float32)

        # Pad with first row if fewer than SEQUENCE_LENGTH readings
        if len(arr) < SEQUENCE_LENGTH:
            pad = np.tile(arr[0], (SEQUENCE_LENGTH - len(arr), 1))
            arr = np.vstack([pad, arr])
        else:
            arr = arr[-SEQUENCE_LENGTH:]  # keep last 12

        return arr  # shape (12, 7)

    # ──────────────────────────────────────────
    # Confidence calculation
    # ──────────────────────────────────────────
    def _calculate_confidence(
        self, readings: List[Dict], model_spread_m: Optional[float] = None
    ) -> float:
        """
        Genuine per-gauge confidence in [0.20, 0.97]. Every input is a real,
        gauge-specific signal — nothing is fixed:
          1. Sequence coverage — how many of the 12 hourly slots we actually have
          2. Recent volatility — hour-to-hour movement over the last ~6 readings
          3. Rainfall regime   — heavy / spiking rain makes the river less predictable
          4. Model spread      — std of Monte-Carlo-Dropout samples (metres),
                                 passed in by predict(); absent on the rule-based path
        """
        n = len(readings)
        if n == 0:
            return 0.20

        levels = [float(r.get("water_level_m", 0.0)) for r in readings]

        # Start from a high ceiling and subtract real, additive penalties.
        conf = 0.97

        # 1. Coverage: missing hourly slots → up to -0.25 at 3 readings
        coverage = min(n, SEQUENCE_LENGTH) / SEQUENCE_LENGTH
        conf -= 0.25 * (1.0 - coverage)

        # 2. Volatility: mean absolute hour-to-hour delta over the recent window
        window = levels[-7:] if n >= 7 else levels
        deltas = [abs(window[i] - window[i - 1]) for i in range(1, len(window))]
        vol = float(np.mean(deltas)) if deltas else 0.0
        conf -= min(0.30, 0.6 * vol)  # ~0.5 m/hr sustained movement → -0.30

        # 3. Rainfall regime over the recent window
        peak_rain = max((float(r.get("rainfall_mm_hr", 0.0)) for r in readings[-6:]), default=0.0)
        if   peak_rain > 120: conf -= 0.22
        elif peak_rain > 60:  conf -= 0.13
        elif peak_rain > 25:  conf -= 0.05

        # 4. Model spread (MC-Dropout std, metres) relative to current level
        if model_spread_m is not None:
            rel = model_spread_m / max(abs(levels[-1]), 0.5)
            conf -= min(0.35, 1.5 * rel)
        else:
            conf -= 0.07  # rule-based path: no ensemble to measure

        return float(min(max(conf, 0.35), 0.97))

    # ──────────────────────────────────────────
    # Monte-Carlo Dropout — epistemic uncertainty
    # ──────────────────────────────────────────
    def _mc_dropout_spread(
        self, seq: np.ndarray, passes: int = 20
    ) -> Tuple[np.ndarray, Optional[float]]:
        """
        Estimate epistemic uncertainty with Monte-Carlo Dropout: replicate the
        input `passes` times into one batch and run a single stochastic forward
        pass with dropout left active. Returns (mean_scaled_pred, spread_m) where
        spread_m is the mean (over T+1/T+2) std of the samples in metres.
        Falls back to a plain deterministic predict if anything goes wrong.
        """
        try:
            if self._mc_fn is None:
                # trace once with dropout active; reused for every later call
                self._mc_fn = tf.function(
                    lambda x: self.model(x, training=True),
                    reduce_retracing=True,
                )
            batch = np.repeat(seq, passes, axis=0).astype(np.float32)  # (passes, 12, 7)
            samples = np.asarray(self._mc_fn(batch))                   # (passes, 2), scaled
            # inverse-transform every sample's T+1/T+2 to metres in one shot
            flat = samples.reshape(-1)                              # (passes*2,)
            dummy = np.zeros((flat.size, len(FEATURE_COLS)), dtype=np.float32)
            dummy[:, 0] = flat
            metres = self.scaler.inverse_transform(dummy)[:, 0].reshape(passes, 2)
            spread = float(metres.std(axis=0).mean())
            return samples.mean(axis=0), spread
        except Exception as e:
            print(f"[WARN] MC-dropout failed ({e}); using deterministic predict.")
            return self.model.predict(seq, verbose=0)[0], None

    # ──────────────────────────────────────────
    # Determine alert level
    # ──────────────────────────────────────────
    def _determine_alert_level(
        self,
        t1: float, t2: float, confidence: float,
        watch: float, warning: float, critical: float
    ) -> str:
        if confidence < MIN_CONFIDENCE:
            return "NONE"
        peak = max(t1, t2)
        if peak >= critical:
            return "CRITICAL"
        if peak >= warning:
            return "WARNING"
        if peak >= watch:
            return "WATCH"
        return "NONE"

    # ──────────────────────────────────────────
    # Build human-readable reason string
    # ──────────────────────────────────────────
    def _build_reason(self, readings: List[Dict], t1: float, t2: float) -> str:
        if not readings:
            return "Insufficient data"
        latest = readings[-1]
        current = latest.get("water_level_m", 0)
        rain    = latest.get("rainfall_mm_hr", 0)
        # rate of change
        roc = (readings[-1].get("water_level_m", 0) - readings[-2].get("water_level_m", 0)) \
              if len(readings) >= 2 else 0.0
        trend  = "rising" if roc > 0.05 else ("falling" if roc < -0.05 else "stable")
        parts  = [f"Current level {current:.2f}m is {trend}"]
        if rain > 40:
            parts.append(f"heavy rainfall {rain:.0f}mm/hr")
        elif rain > 15:
            parts.append(f"moderate rainfall {rain:.0f}mm/hr")
        change = ((t2 - current) / current * 100) if current > 0 else 0
        if abs(change) > 5:
            direction = "rise" if change > 0 else "fall"
            parts.append(f"projected to {direction} {abs(change):.1f}% in 2hrs")
        return ". ".join(parts) + "."

    # ──────────────────────────────────────────
    # RULE-BASED FALLBACK (no model)
    # ──────────────────────────────────────────
    def _fallback_predict(
        self, readings: List[Dict],
        watch: float, warning: float, critical: float
    ) -> Dict:
        if not readings:
            return self._empty_result()
        latest  = readings[-1]
        current = latest.get("water_level_m", 0)
        rain    = latest.get("rainfall_mm_hr", 0)
        roc     = (readings[-1].get("water_level_m", 0) - readings[-2].get("water_level_m", 0)) \
                  if len(readings) >= 2 else 0.0

        # Simple rule: rising + heavy rain → 15% increase, else flat
        if roc > 0.3 and rain > 30:
            t1 = current * 1.10
            t2 = current * 1.20
        elif roc > 0.1:
            t1 = current + 0.15
            t2 = current + 0.25
        else:
            t1 = current
            t2 = current

        confidence   = self._calculate_confidence(readings)  # data-quality only (no model)
        alert_level  = self._determine_alert_level(t1, t2, confidence, watch, warning, critical)
        return {
            "predicted_t1_m": round(t1, 3),
            "predicted_t2_m": round(t2, 3),
            "confidence":     round(confidence, 3),
            "alert_level":    alert_level,
            "model_used":     "RULE_BASED_FALLBACK",
            "reason":         self._build_reason(readings, t1, t2),
            "predicted_at":   datetime.utcnow().isoformat()
        }

    def _empty_result(self) -> Dict:
        return {
            "predicted_t1_m": 0.0, "predicted_t2_m": 0.0, "confidence": 0.0,
            "alert_level": "NONE", "model_used": "NO_DATA",
            "reason": "No readings available.", "predicted_at": datetime.utcnow().isoformat()
        }

    # ──────────────────────────────────────────
    # MAIN PREDICT — public entry point
    # ──────────────────────────────────────────
    def predict(
        self,
        readings: List[Dict],
        gauge_thresholds: Optional[Dict] = None
    ) -> Dict:
        """
        readings: list of hourly reading dicts (at least 6, ideally 12)
        gauge_thresholds: dict with keys watch_m, warning_m, critical_m
        Returns: prediction dict ready to store and send
        """
        watch    = (gauge_thresholds or {}).get("watch_m",    DEFAULT_WATCH_M)
        warning  = (gauge_thresholds or {}).get("warning_m",  DEFAULT_WARNING_M)
        critical = (gauge_thresholds or {}).get("critical_m", DEFAULT_CRITICAL_M)

        if not readings:
            return self._empty_result()

        if not self.model_loaded:
            return self._fallback_predict(readings, watch, warning, critical)

        try:
            features = self._prepare_features(readings)  # (12, 7)
            # Normalize
            flat     = features.reshape(-1, len(FEATURE_COLS))
            flat_scaled = self.scaler.transform(flat)
            seq      = flat_scaled.reshape(1, SEQUENCE_LENGTH, len(FEATURE_COLS))

            # Predict with MC-Dropout — mean prediction + epistemic spread (metres)
            pred_scaled, model_spread_m = self._mc_dropout_spread(seq)  # shape (2,), float|None

            # Inverse transform — only need water_level_m column (index 0)
            dummy        = np.zeros((2, len(FEATURE_COLS)), dtype=np.float32)
            dummy[:, 0]  = pred_scaled
            dummy_inv    = self.scaler.inverse_transform(dummy)
            t1 = float(dummy_inv[0, 0])
            t2 = float(dummy_inv[1, 0])

            # Clamp negative predictions
            t1 = max(t1, 0.0)
            t2 = max(t2, 0.0)

            confidence  = self._calculate_confidence(readings, model_spread_m)
            alert_level = self._determine_alert_level(t1, t2, confidence, watch, warning, critical)
            reason      = self._build_reason(readings, t1, t2)
            version     = self.model_info.get("version", "v1.0")

            return {
                "predicted_t1_m": round(t1, 3),
                "predicted_t2_m": round(t2, 3),
                "confidence":     round(confidence, 3),
                "alert_level":    alert_level,
                "model_used":     f"LSTM_{version}",
                "reason":         reason,
                "predicted_at":   datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"[ERROR] LSTM predict error: {e}. Using fallback.")
            return self._fallback_predict(readings, watch, warning, critical)


# Singleton instance — loaded once on FastAPI startup
predictor = WaterLevelPredictor()
