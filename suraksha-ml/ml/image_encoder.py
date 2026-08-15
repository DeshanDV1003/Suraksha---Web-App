"""
R1 — Image Encoder for Multimodal Disaster Triage
Uses CLIP (openai/clip-vit-base-patch32) to extract visual embeddings
from disaster report images. Falls back gracefully if transformers unavailable.
"""
import base64
import io
import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Disaster-relevant CLIP text probes — used for zero-shot image scoring
# These probe the image for visual evidence of each disaster type
DISASTER_PROBES = {
    "FLOOD":             "flooded road with water covering the street",
    "LANDSLIDE":         "landslide with mud and rocks blocking road",
    "FIRE":              "building on fire with flames and smoke",
    "CYCLONE":           "storm damage with fallen trees and debris",
    "BUILDING_COLLAPSE": "collapsed building with rubble and destruction",
    "EARTHQUAKE":        "earthquake damage with cracked walls",
    "TSUNAMI":           "tsunami wave flooding coastal area",
    "DROUGHT":           "dry cracked land with no water",
}

URGENCY_PROBES = {
    "CRITICAL": "people trapped in disaster emergency needing immediate rescue",
    "HIGH":     "injured people needing urgent medical help",
    "MEDIUM":   "property damaged by disaster",
    "LOW":      "minor incident with no visible casualties",
}

DAMAGE_PROBES = {
    "road":     "damaged road blocked by disaster",
    "building": "damaged or collapsed building structure",
    "bridge":   "damaged bridge over river",
    "power":    "fallen power lines and electrical infrastructure",
}


class ImageEncoder:
    """
    Encodes disaster images using CLIP.
    Provides:
      - 512-dim visual embedding (for fusion)
      - Zero-shot disaster type scores
      - Zero-shot urgency scores
      - Infrastructure damage scores
    """

    def __init__(self):
        self._model = None
        self._processor = None
        self._available = False
        self._load()

    def _load(self):
        try:
            from transformers import CLIPProcessor, CLIPModel
            import torch
            self._model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self._processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self._model.eval()
            self._available = True
            logger.info("[ImageEncoder] CLIP loaded successfully.")
        except Exception as e:
            logger.warning(f"[ImageEncoder] CLIP unavailable ({e}). Image features disabled.")
            self._available = False

    @property
    def available(self) -> bool:
        return self._available

    def encode(self, image_b64: str) -> Optional[dict]:
        """
        Encode a base64 image.
        Returns dict with embedding + zero-shot scores, or None if CLIP unavailable.
        """
        if not self._available:
            return None

        try:
            import torch
            from PIL import Image

            # Decode base64 → PIL image
            if image_b64.startswith("data:"):
                image_b64 = image_b64.split(",", 1)[1]
            img_bytes = base64.b64decode(image_b64)
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

            # Build all probe texts
            all_probes = (
                list(DISASTER_PROBES.values()) +
                list(URGENCY_PROBES.values()) +
                list(DAMAGE_PROBES.values())
            )

            inputs = self._processor(
                text=all_probes,
                images=image,
                return_tensors="pt",
                padding=True,
                truncation=True,
            )

            with torch.no_grad():
                outputs = self._model(**inputs)
                image_embeds = outputs.image_embeds  # (1, 512)
                text_embeds = outputs.text_embeds     # (N, 512)

                # Cosine similarities between image and each text probe
                image_norm = image_embeds / image_embeds.norm(dim=-1, keepdim=True)
                text_norm = text_embeds / text_embeds.norm(dim=-1, keepdim=True)
                sims = (image_norm @ text_norm.T).squeeze(0).tolist()  # (N,)

            # Split similarities back into groups
            n_disaster = len(DISASTER_PROBES)
            n_urgency = len(URGENCY_PROBES)
            disaster_sims = sims[:n_disaster]
            urgency_sims = sims[n_disaster:n_disaster + n_urgency]
            damage_sims = sims[n_disaster + n_urgency:]

            # Softmax over disaster similarities → probabilities
            disaster_keys = list(DISASTER_PROBES.keys())
            disaster_probs = _softmax(disaster_sims)
            top_disaster = disaster_keys[int(np.argmax(disaster_probs))]
            top_disaster_conf = float(max(disaster_probs))

            # Urgency
            urgency_keys = list(URGENCY_PROBES.keys())
            urgency_probs = _softmax(urgency_sims)
            top_urgency = urgency_keys[int(np.argmax(urgency_probs))]
            top_urgency_conf = float(max(urgency_probs))

            # Infrastructure damage — threshold each probe
            damage_keys = list(DAMAGE_PROBES.keys())
            damage_detected = {
                k: float(s) for k, s in zip(damage_keys, damage_sims) if s > 0.20
            }

            # Raw embedding as list (for fusion layer)
            embedding = image_norm.squeeze(0).tolist()

            return {
                "embedding": embedding,                  # 512-dim float list
                "disaster_type": top_disaster,
                "disaster_confidence": round(top_disaster_conf, 4),
                "urgency": top_urgency,
                "urgency_confidence": round(top_urgency_conf, 4),
                "infrastructure_damage": damage_detected,
                "all_disaster_scores": {
                    k: round(float(p), 4) for k, p in zip(disaster_keys, disaster_probs)
                },
            }

        except Exception as e:
            logger.warning(f"[ImageEncoder] encode failed: {e}")
            return None


def _softmax(scores: list) -> list:
    arr = np.array(scores, dtype=np.float32)
    arr = arr - arr.max()  # numerical stability
    exp = np.exp(arr)
    return (exp / exp.sum()).tolist()


# Module-level singleton
_encoder: Optional[ImageEncoder] = None


def get_encoder() -> ImageEncoder:
    global _encoder
    if _encoder is None:
        _encoder = ImageEncoder()
    return _encoder


def encode_image(image_b64: str) -> Optional[dict]:
    """Convenience function — encode a single image."""
    return get_encoder().encode(image_b64)
