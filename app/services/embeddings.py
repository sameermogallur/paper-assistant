import logging
import numpy as np

logger = logging.getLogger(__name__)

_specter_model = None


def get_specter_model():
    global _specter_model
    if _specter_model is None:
        from sentence_transformers import SentenceTransformer
        _specter_model = SentenceTransformer("allenai-specter")
    return _specter_model


def semantic_title_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    model = get_specter_model()
    vecs = model.encode([a, b], normalize_embeddings=True)
    return float(np.dot(vecs[0], vecs[1]))
