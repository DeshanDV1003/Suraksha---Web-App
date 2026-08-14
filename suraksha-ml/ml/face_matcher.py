"""
Face matching using DeepFace.
Compares a query face against a list of candidate photos stored as base64.
Returns matches above the confidence threshold.
"""
import base64
import io
import os
import tempfile
from typing import List, Optional

CONFIDENCE_THRESHOLD = 0.40  # Minimum match confidence to include in results
MODEL_NAME = "VGG-Face"       # Fast and accurate; alternatives: "Facenet", "ArcFace"
DETECTOR = "mtcnn"            # More accurate than opencv; mtcnn is installed as a deepface dep


def _base64_to_tempfile(b64_str: str) -> str:
    """Write a base64 image to a temp file, return the path."""
    if b64_str.startswith("data:"):
        b64_str = b64_str.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_str)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    tmp.write(img_bytes)
    tmp.close()
    return tmp.name


def match_faces(query_b64: str, candidates: List[dict]) -> List[dict]:
    """
    Compare query_b64 against each candidate photo.

    candidates: list of {"person_id": str, "photo": base64_str}
    Returns: list of {"person_id": str, "confidence": float, "verified": bool}
             sorted by confidence descending, only entries above CONFIDENCE_THRESHOLD.
    """
    try:
        from deepface import DeepFace
    except ImportError:
        raise RuntimeError("deepface not installed. Run: pip install deepface")

    if not candidates:
        return []

    # Filter candidates that have a photo
    candidates = [c for c in candidates if c.get("photo")]
    if not candidates:
        return []

    query_path = None
    candidate_paths = []
    results = []

    try:
        query_path = _base64_to_tempfile(query_b64)

        for cand in candidates:
            cand_path = None
            try:
                cand_path = _base64_to_tempfile(cand["photo"])
                candidate_paths.append(cand_path)

                result = DeepFace.verify(
                    img1_path=query_path,
                    img2_path=cand_path,
                    model_name=MODEL_NAME,
                    detector_backend=DETECTOR,
                    enforce_detection=False,  # don't crash if no face detected
                )

                # DeepFace returns distance; convert to confidence (0–1)
                distance = result.get("distance", 1.0)
                threshold = result.get("threshold", 0.4)
                # Confidence: 1 when distance=0, 0 when distance=threshold*2
                confidence = max(0.0, 1.0 - (distance / (threshold * 2)))
                verified = result.get("verified", False)

                if confidence >= CONFIDENCE_THRESHOLD:
                    results.append({
                        "person_id": cand["person_id"],
                        "confidence": round(confidence, 4),
                        "verified": verified,
                        "distance": round(distance, 4),
                    })
            except Exception:
                # Skip candidates that cause errors (no face, corrupt image, etc.)
                pass
            finally:
                if cand_path and os.path.exists(cand_path):
                    os.unlink(cand_path)

    finally:
        if query_path and os.path.exists(query_path):
            os.unlink(query_path)

    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results
