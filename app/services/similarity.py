import logging
from typing import List, Optional, Tuple

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import EMBEDDING_DTYPE
from app.db.models import Embedding, Paper, ProjectPaper
from app.schemas.models import SimilarPaperItem

logger = logging.getLogger(__name__)

EMBEDDING_KIND = "title_abstract"


def find_similar_papers(
    db: Session,
    paper_id: int,
    top_k: int = 5,
    project_id: Optional[int] = None,
) -> Tuple[List[SimilarPaperItem], Optional[str]]:
    """Cosine similarity over stored SPECTER vectors (normalized at ingest,
    so cosine reduces to a dot product). Brute-force numpy is milliseconds
    at library scale; sqlite-vec/FAISS is the upgrade path past ~10k papers.
    """
    target_blob = db.execute(
        select(Embedding.vector).where(
            Embedding.paper_id == paper_id, Embedding.kind == EMBEDDING_KIND
        )
    ).scalar_one_or_none()
    if target_blob is None:
        return [], "no_embedding_for_paper"

    target = np.frombuffer(target_blob, dtype=EMBEDDING_DTYPE)

    query = (
        select(Embedding.paper_id, Embedding.vector, Paper.title, Paper.year)
        .join(Paper, Paper.id == Embedding.paper_id)
        .where(Embedding.kind == EMBEDDING_KIND, Embedding.paper_id != paper_id)
    )
    if project_id is not None:
        query = query.where(
            Embedding.paper_id.in_(
                select(ProjectPaper.paper_id).where(ProjectPaper.project_id == project_id)
            )
        )

    candidates = []
    vectors = []
    for row in db.execute(query).all():
        vec = np.frombuffer(row.vector, dtype=EMBEDDING_DTYPE)
        if vec.shape != target.shape:
            logger.warning(f"Skipping mismatched-length embedding for paper {row.paper_id}")
            continue
        candidates.append(row)
        vectors.append(vec)

    if not candidates:
        return [], None

    scores = np.stack(vectors) @ target
    top = np.argsort(scores)[::-1][:top_k]
    return [
        SimilarPaperItem(
            paper_id=candidates[i].paper_id,
            title=candidates[i].title,
            year=candidates[i].year,
            score=round(float(scores[i]), 4),
        )
        for i in top
    ], None
