"""
Face matching with DeepFace.

Strategy for speed:
  * embed the query ONCE with DeepFace.represent (not verify-per-pair)
  * embed each candidate ONCE, cached by a hash of its photo bytes
  * compare with a plain cosine distance in NumPy
Repeat scans over the same missing-persons DB are then near-instant.
"""
import base64
import hashlib
import os
import sys
import tempfile
from typing import List, Optional

# ── Keep model weights off the (often full) C: drive ─────────────────────────
_DF_HOME = os.environ.get("DEEPFACE_HOME") or os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "deepface_home"
)
os.makedirs(os.path.join(_DF_HOME, ".deepface", "weights"), exist_ok=True)
os.environ["DEEPFACE_HOME"] = _DF_HOME

# DeepFace's info logs contain an emoji that crashes a cp1252 Windows console
# mid-download — force UTF-8 stdout and quiet DeepFace to WARNING.
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
os.environ.setdefault("DEEPFACE_LOG_LEVEL", "30")
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

MODEL_NAME = "SFace"          # ~37 MB (VGG-Face is ~580 MB and won't fit on a full disk)
DETECTOR = "opencv"           # bundled with opencv — no extra download
CONFIDENCE_THRESHOLD = 0.40   # minimum match confidence to return
MIN_PHOTO_BYTES = 512         # anything smaller can't be a real photo — skip it
_EMB_CACHE: dict = {}         # photo-hash -> embedding (list[float]) | None
_MODEL_READY = False


def _b64_bytes(b64_str: str) -> bytes:
    if b64_str.startswith("data:"):
        b64_str = b64_str.split(",", 1)[1]
    return base64.b64decode(b64_str)


def _tempfile(img_bytes: bytes) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    tmp.write(img_bytes)
    tmp.close()
    return tmp.name


def _embed(img_bytes: bytes) -> Optional[list]:
    """Return the face embedding for an image, or None if the image is unusable."""
    from deepface import DeepFace
    path = None
    try:
        path = _tempfile(img_bytes)
        # Try with face detection first; if no face is found fall back to the
        # whole frame so a slightly-cropped photo still produces an embedding.
        for enforce in (True, False):
            try:
                reps = DeepFace.represent(
                    img_path=path,
                    model_name=MODEL_NAME,
                    detector_backend=DETECTOR,
                    enforce_detection=enforce,
                    align=True,
                )
                if reps:
                    return reps[0]["embedding"]
            except Exception:
                continue
        return None
    finally:
        if path and os.path.exists(path):
            try:
                os.unlink(path)
            except OSError:
                pass


def _cosine_distance(a, b) -> float:
    import numpy as np
    a = np.asarray(a, dtype=np.float32)
    b = np.asarray(b, dtype=np.float32)
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) or 1e-9
    return float(1.0 - (np.dot(a, b) / denom))


def warmup() -> None:
    """Build the model once (downloads weights if needed) ahead of first use."""
    global _MODEL_READY
    if _MODEL_READY:
        return
    from deepface import DeepFace
    DeepFace.build_model(MODEL_NAME)
    _MODEL_READY = True


def match_faces(query_b64: str, candidates: List[dict]) -> List[dict]:
    """
    candidates: [{"person_id": str, "photo": base64_str}, ...]
    Returns matches above CONFIDENCE_THRESHOLD, sorted by confidence desc:
      [{"person_id", "confidence", "verified", "distance"}, ...]
    """
    try:
        from deepface import DeepFace  # noqa: F401  (import check + triggers weight load)
    except ImportError:
        raise RuntimeError("deepface not installed. Run: pip install deepface")

    warmup()

    # Only keep candidates whose photo is plausibly a real image
    usable = []
    for c in candidates:
        photo = c.get("photo")
        if not photo:
            continue
        try:
            raw = _b64_bytes(photo)
        except Exception:
            continue
        if len(raw) < MIN_PHOTO_BYTES:
            continue
        usable.append((c["person_id"], raw))

    if not usable:
        return []

    # Embed the query once
    try:
        q_emb = _embed(_b64_bytes(query_b64))
    except Exception:
        q_emb = None
    if q_emb is None:
        # No detectable face in the uploaded photo
        return []

    # SFace's own verified-threshold on cosine distance
    try:
        from deepface.modules import verification as _v
        VERIFY_THRESHOLD = _v.find_threshold(MODEL_NAME, "cosine")
    except Exception:
        VERIFY_THRESHOLD = 0.593  # SFace cosine default

    # Embed candidates sequentially (TensorFlow's predict is not thread-safe —
    # running it in a pool silently returns nothing). The photo-hash cache means
    # a repeat scan over the same DB still costs almost nothing.
    results = []
    for person_id, raw in usable:
        key = hashlib.sha1(raw).hexdigest()
        if key not in _EMB_CACHE:
            _EMB_CACHE[key] = _embed(raw)
        c_emb = _EMB_CACHE[key]
        if c_emb is None:
            continue
        dist = _cosine_distance(q_emb, c_emb)
        # confidence: 1 at distance 0, 0 at 2x the verify threshold
        confidence = max(0.0, 1.0 - (dist / (VERIFY_THRESHOLD * 2)))
        if confidence >= CONFIDENCE_THRESHOLD:
            results.append({
                "person_id": person_id,
                "confidence": round(confidence, 4),
                "verified": dist <= VERIFY_THRESHOLD,
                "distance": round(dist, 4),
            })

    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results
