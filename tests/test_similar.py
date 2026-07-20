"""
Tests for GET /api/papers/{id}/similar — cosine over stored embedding vectors.
Uses small fabricated normalized float32 vectors; the SPECTER model is never loaded.
"""
import numpy as np
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db.models import Embedding, Paper, Project, ProjectPaper
from app.main import app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(engine)


def _db() -> Session:
    return next(app.dependency_overrides[get_db]())


_SHAS = iter("abcdefghij")


def _add_paper(db, title, vector=None) -> int:
    paper = Paper(sha256=next(_SHAS) * 64, title=title, word_count=0,
                  extraction_method="native")
    db.add(paper)
    db.flush()
    if vector is not None:
        blob = np.array(vector, dtype=np.float32).tobytes()
        db.add(Embedding(paper_id=paper.id, kind="title_abstract", vector=blob))
    db.commit()
    pid = paper.id
    db.close()
    return pid


@pytest.fixture(autouse=True)
def _reset_shas():
    global _SHAS
    _SHAS = iter("abcdefghij")


def test_similar_ranking_deterministic(client):
    target = _add_paper(_db(), "Target", [1, 0, 0, 0])
    close = _add_paper(_db(), "Close", [0.6, 0.8, 0, 0])
    identical = _add_paper(_db(), "Identical", [1, 0, 0, 0])
    orthogonal = _add_paper(_db(), "Orthogonal", [0, 1, 0, 0])

    r = client.get(f"/api/papers/{target}/similar")
    assert r.status_code == 200
    data = r.json()
    assert data["reason"] is None
    ids = [item["paper_id"] for item in data["results"]]
    assert ids == [identical, close, orthogonal]
    scores = [item["score"] for item in data["results"]]
    assert scores[0] == pytest.approx(1.0)
    assert scores[1] == pytest.approx(0.6)
    assert scores[2] == pytest.approx(0.0)
    # Self excluded
    assert target not in ids


def test_similar_excludes_embeddingless_papers(client):
    target = _add_paper(_db(), "Target", [1, 0, 0, 0])
    _add_paper(_db(), "No embedding")
    data = client.get(f"/api/papers/{target}/similar").json()
    assert data["results"] == []
    assert data["reason"] is None


def test_similar_top_k_caps_results(client):
    target = _add_paper(_db(), "Target", [1, 0, 0, 0])
    for i in range(3):
        _add_paper(_db(), f"Candidate {i}", [1, 0, 0, 0])
    data = client.get(f"/api/papers/{target}/similar?top_k=2").json()
    assert len(data["results"]) == 2


def test_similar_project_scope(client):
    target = _add_paper(_db(), "Target", [1, 0, 0, 0])
    in_project = _add_paper(_db(), "Member", [1, 0, 0, 0])
    _add_paper(_db(), "Non-member", [1, 0, 0, 0])

    db = _db()
    project = Project(name="P")
    db.add(project)
    db.flush()
    db.add(ProjectPaper(project_id=project.id, paper_id=in_project))
    db.commit()
    project_id = project.id
    db.close()

    data = client.get(f"/api/papers/{target}/similar?project_id={project_id}").json()
    assert [item["paper_id"] for item in data["results"]] == [in_project]


def test_similar_target_without_embedding(client):
    target = _add_paper(_db(), "Target")
    _add_paper(_db(), "Candidate", [1, 0, 0, 0])
    r = client.get(f"/api/papers/{target}/similar")
    assert r.status_code == 200
    data = r.json()
    assert data["results"] == []
    assert data["reason"] == "no_embedding_for_paper"


def test_similar_paper_not_found(client):
    assert client.get("/api/papers/9999/similar").status_code == 404


def test_similar_project_not_found(client):
    target = _add_paper(_db(), "Target", [1, 0, 0, 0])
    assert client.get(f"/api/papers/{target}/similar?project_id=9999").status_code == 404


def test_similar_skips_wrong_length_vector(client):
    target = _add_paper(_db(), "Target", [1, 0, 0, 0])
    _add_paper(_db(), "Bad vector", [1, 0])  # 2-dim vs target's 4-dim
    ok = _add_paper(_db(), "Good", [1, 0, 0, 0])
    data = client.get(f"/api/papers/{target}/similar").json()
    assert [item["paper_id"] for item in data["results"]] == [ok]
