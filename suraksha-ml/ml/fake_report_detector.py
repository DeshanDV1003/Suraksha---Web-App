from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np

# Load model lazily
_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    return _embedder

def check_duplicate(new_text: str, existing_texts: list, threshold=0.85) -> dict:
    if not existing_texts:
        return {"is_duplicate": False, "similarity": 0}
    
    embedder = get_embedder()
    new_embedding = embedder.encode([new_text])
    existing_embeddings = embedder.encode(existing_texts)
    
    similarities = cosine_similarity(new_embedding, existing_embeddings)[0]
    max_similarity = float(np.max(similarities))
    most_similar_idx = int(np.argmax(similarities))
    
    return {
        "is_duplicate": max_similarity >= threshold,
        "similarity": round(max_similarity, 4),
        "matched_index": most_similar_idx if max_similarity >= threshold else None
    }
