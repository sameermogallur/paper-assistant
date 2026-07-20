"""
Tests for paper read endpoints (GET /api/papers, GET /api/papers/{id})
and the ingest metadata heuristics (title / DOI extraction).
Uses FastAPI TestClient with an in-memory SQLite DB injected via dependency override.
"""
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db.models import AnalysisReport, Embedding, Paper, Project, ProjectPaper
from app.main import app
from app.schemas.models import IntegrityReport, StatisticsResult
from app.services.ingest import _extract_title
from app.utils.helpers import extract_first_doi


@pytest.fixture
def client():
    # StaticPool: all connections share one in-memory DB, so the schema
    # created here is visible to the sync threadpool that runs endpoint handlers.
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


def _report_json(score=80, grade="B") -> str:
    return IntegrityReport(
        pages=1,
        word_count=100,
        sections_detected=[],
        extraction_method="native",
        references_found=0,
        references_verified=0,
        references_suspicious=0,
        references_not_found=0,
        citations=[],
        statistics=StatisticsResult(
            p_values=[], sample_sizes=[], effect_sizes=[], cis=[], red_flags=[], summary=""
        ),
        integrity_score=score,
        integrity_grade=grade,
        integrity_signals=[],
        intext_total=0,
        intext_numeric=0,
        intext_author_year=0,
        analyzed_at="2026-01-01T00:00:00",
    ).model_dump_json()


def _make_paper(db: Session, sha_char: str, title=None, authors=None, doi=None,
                report_json=None, score=None, grade=None, with_embedding=False) -> int:
    paper = Paper(
        sha256=sha_char * 64,
        title=title,
        authors=json.dumps(authors) if authors is not None else None,
        doi=doi,
        word_count=100,
        extraction_method="native",
        full_text="should never appear in list responses",
    )
    db.add(paper)
    db.flush()
    if report_json is not None:
        db.add(AnalysisReport(
            paper_id=paper.id,
            report_json=report_json,
            integrity_score=score,
            integrity_grade=grade,
            analyzer_version="1.0.0",
        ))
    if with_embedding:
        vec = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float32)
        db.add(Embedding(paper_id=paper.id, kind="title_abstract", vector=vec.tobytes()))
    db.commit()
    pid = paper.id
    db.close()
    return pid


# ---------------------------------------------------------------------------
# GET /api/papers (list)
# ---------------------------------------------------------------------------

def test_list_papers_empty(client):
    r = client.get("/api/papers")
    assert r.status_code == 200
    assert r.json() == {"items": [], "total": 0, "limit": 50, "offset": 0}


def test_list_papers_metadata_no_full_text(client):
    _make_paper(_db(), "a", title="Paper A", authors=["Smith, J."], doi="10.1/x",
                report_json=_report_json(80, "B"), score=80, grade="B")
    r = client.get("/api/papers")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    item = data["items"][0]
    assert item["title"] == "Paper A"
    assert item["authors"] == ["Smith, J."]
    assert item["doi"] == "10.1/x"
    assert item["integrity_score"] == 80
    assert item["integrity_grade"] == "B"
    assert "full_text" not in item
    assert "sha256" not in item


def test_list_papers_latest_report_wins(client):
    db = _db()
    pid = _make_paper(db, "a", report_json=_report_json(50, "F"), score=50, grade="F")
    db = _db()
    db.add(AnalysisReport(
        paper_id=pid, report_json=_report_json(90, "A"),
        integrity_score=90, integrity_grade="A", analyzer_version="1.0.0",
    ))
    db.commit()
    db.close()
    item = client.get("/api/papers").json()["items"][0]
    assert item["integrity_score"] == 90
    assert item["integrity_grade"] == "A"


def test_list_papers_no_report_null_score(client):
    _make_paper(_db(), "a")
    item = client.get("/api/papers").json()["items"][0]
    assert item["integrity_score"] is None
    assert item["integrity_grade"] is None


def test_list_papers_pagination(client):
    for ch in "abc":
        _make_paper(_db(), ch)
    r = client.get("/api/papers?limit=2&offset=0")
    data = r.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    r2 = client.get("/api/papers?limit=2&offset=2")
    data2 = r2.json()
    assert data2["total"] == 3
    assert len(data2["items"]) == 1
    ids = [i["id"] for i in data["items"]] + [i["id"] for i in data2["items"]]
    assert len(set(ids)) == 3


def test_list_papers_project_filter(client):
    db = _db()
    in_project = _make_paper(db, "a")
    _make_paper(_db(), "b")
    db = _db()
    project = Project(name="P")
    db.add(project)
    db.flush()
    db.add(ProjectPaper(project_id=project.id, paper_id=in_project))
    db.commit()
    project_id = project.id
    db.close()

    data = client.get(f"/api/papers?project_id={project_id}").json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == in_project


def test_list_papers_project_not_found(client):
    r = client.get("/api/papers?project_id=9999")
    assert r.status_code == 404


def test_list_papers_has_embedding(client):
    with_emb = _make_paper(_db(), "a", with_embedding=True)
    without_emb = _make_paper(_db(), "b")
    items = {i["id"]: i for i in client.get("/api/papers").json()["items"]}
    assert items[with_emb]["has_embedding"] is True
    assert items[without_emb]["has_embedding"] is False


# ---------------------------------------------------------------------------
# GET /api/papers/{id} (detail)
# ---------------------------------------------------------------------------

def test_get_paper_detail_with_report(client):
    pid = _make_paper(_db(), "a", title="Paper A",
                      report_json=_report_json(75, "C"), score=75, grade="C")
    r = client.get(f"/api/papers/{pid}")
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Paper A"
    assert data["sha256"] == "a" * 64
    assert data["integrity_score"] == 75
    assert data["report"]["integrity_score"] == 75
    assert data["report"]["integrity_grade"] == "C"
    assert "full_text" not in data
    assert "pdf_path" not in data


def test_get_paper_detail_corrupt_report(client):
    pid = _make_paper(_db(), "a", report_json="{not valid json", score=75, grade="C")
    r = client.get(f"/api/papers/{pid}")
    assert r.status_code == 200
    assert r.json()["report"] is None


def test_get_paper_detail_no_report(client):
    pid = _make_paper(_db(), "a")
    data = client.get(f"/api/papers/{pid}").json()
    assert data["report"] is None
    assert data["integrity_score"] is None


def test_get_paper_detail_not_found(client):
    r = client.get("/api/papers/9999")
    assert r.status_code == 404


def test_get_paper_detail_null_authors(client):
    pid = _make_paper(_db(), "a")
    assert client.get(f"/api/papers/{pid}").json()["authors"] == []


# ---------------------------------------------------------------------------
# Ingest metadata heuristics
# ---------------------------------------------------------------------------

def test_extract_title_from_text():
    text = (
        "Journal of Testing Vol. 12\n"
        "doi:10.1234/jot.2026.001\n"
        "Deep Learning Approaches to Citation Verification\n"
        "Jane Smith, John Doe\n"
        "Abstract\n"
        "We present..."
    )
    sections = {"Abstract": text.index("Abstract")}
    assert _extract_title(text, sections, "upload.pdf") == (
        "Deep Learning Approaches to Citation Verification"
    )


def test_extract_title_filename_fallback():
    assert _extract_title("", {}, "my-paper.pdf") == "my-paper"
    # All lines too short / non-title-like
    assert _extract_title("x\n123\ndoi:10.1/y", {}, "fallback.pdf") == "fallback"


def test_extract_first_doi():
    text = "See https://doi.org/10.1038/s41586-020-2649-2. Also 10.1093/nar/gkaa1100."
    assert extract_first_doi(text) == "10.1038/s41586-020-2649-2"
    assert extract_first_doi("no doi here") is None
