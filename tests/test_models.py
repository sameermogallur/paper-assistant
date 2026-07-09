"""
Round-trip tests for all ORM models against an in-memory SQLite database.
The Embedding test verifies byte-level vector fidelity, not just row presence.
"""
import json
import pytest
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import EMBEDDING_DTYPE
from app.db.database import Base
from app.db.models import (
    Paper, AnalysisReport, Reference, Project, ProjectPaper, Embedding,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    Base.metadata.drop_all(engine)


@pytest.fixture
def paper(db):
    p = Paper(
        sha256="a" * 64,
        title="Test Paper",
        authors=json.dumps(["Smith J", "Jones A"]),
        year=2024,
        doi="10.1234/test",
        pdf_path="data/pdfs/" + "a" * 64 + ".pdf",
        full_text="Lorem ipsum",
        sections=json.dumps({"Abstract": 0, "Methods": 100}),
        word_count=2,
        extraction_method="native",
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ---------------------------------------------------------------------------
# Paper
# ---------------------------------------------------------------------------

def test_paper_round_trip(db, paper):
    fetched = db.get(Paper, paper.id)
    assert fetched.sha256 == "a" * 64
    assert fetched.title == "Test Paper"
    assert json.loads(fetched.authors) == ["Smith J", "Jones A"]
    assert fetched.year == 2024


def test_paper_sha256_unique(db, paper):
    duplicate = Paper(sha256="a" * 64, title="Dupe")
    db.add(duplicate)
    with pytest.raises(Exception):
        db.commit()


# ---------------------------------------------------------------------------
# AnalysisReport
# ---------------------------------------------------------------------------

def test_analysis_report_round_trip(db, paper):
    report = AnalysisReport(
        paper_id=paper.id,
        report_json='{"integrity_score": 80}',
        integrity_score=80,
        integrity_grade="B",
        analyzer_version="1.0.0",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    fetched = db.get(AnalysisReport, report.id)
    assert fetched.paper_id == paper.id
    assert fetched.integrity_score == 80
    assert fetched.integrity_grade == "B"
    assert fetched.analyzer_version == "1.0.0"


# ---------------------------------------------------------------------------
# Reference
# ---------------------------------------------------------------------------

def test_reference_round_trip(db, paper):
    ref = Reference(
        paper_id=paper.id,
        raw_text="Smith J. Some title. Journal. 2020.",
        doi="10.5678/ref",
        matched_title="Some title",
        status="verified",
        confidence=0.92,
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)

    fetched = db.get(Reference, ref.id)
    assert fetched.status == "verified"
    assert abs(fetched.confidence - 0.92) < 1e-6


# ---------------------------------------------------------------------------
# Project + ProjectPaper
# ---------------------------------------------------------------------------

def test_project_round_trip(db):
    proj = Project(name="My Project", description="A test project")
    db.add(proj)
    db.commit()
    db.refresh(proj)

    fetched = db.get(Project, proj.id)
    assert fetched.name == "My Project"
    assert fetched.description == "A test project"


def test_project_paper_membership(db, paper):
    proj = Project(name="Proj")
    db.add(proj)
    db.commit()
    db.refresh(proj)

    link = ProjectPaper(project_id=proj.id, paper_id=paper.id)
    db.add(link)
    db.commit()

    fetched = db.get(ProjectPaper, (proj.id, paper.id))
    assert fetched is not None
    assert fetched.paper_id == paper.id


# ---------------------------------------------------------------------------
# Embedding — byte-level fidelity
# ---------------------------------------------------------------------------

def test_embedding_vector_fidelity(db, paper):
    original = np.array([0.1, 0.2, 0.3, -0.4, 0.5], dtype=EMBEDDING_DTYPE)

    emb = Embedding(
        paper_id=paper.id,
        kind="title_abstract",
        vector=original.tobytes(),
    )
    db.add(emb)
    db.commit()
    db.refresh(emb)

    blob = db.get(Embedding, emb.id).vector
    recovered = np.frombuffer(blob, dtype=EMBEDDING_DTYPE)

    assert np.allclose(original, recovered), (
        f"Vector round-trip failed.\nOriginal: {original}\nRecovered: {recovered}"
    )


def test_embedding_unique_per_kind(db, paper):
    emb1 = Embedding(paper_id=paper.id, kind="title_abstract", vector=b"\x00" * 4)
    emb2 = Embedding(paper_id=paper.id, kind="title_abstract", vector=b"\x01" * 4)
    db.add(emb1)
    db.commit()
    db.add(emb2)
    with pytest.raises(Exception):
        db.commit()
