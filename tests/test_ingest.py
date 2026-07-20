"""
Tests for the paper ingest pipeline (POST /api/papers).
Crossref calls are mocked — only local parsing and DB persistence are exercised.
"""
import hashlib
import io
import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.db.database import Base
from app.db.models import AnalysisReport, Embedding, Paper, Reference
from app.schemas.models import Citation
from app.services.ingest import ingest_paper


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    Base.metadata.drop_all(engine)


def _minimal_pdf() -> bytes:
    """Minimal valid PDF — one blank page, no extractable text."""
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Dedup
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ingest_dedup_returns_existing(db, tmp_path):
    """Re-ingesting the same PDF returns was_duplicate=True and the original paper_id."""
    pdf_bytes = _minimal_pdf()
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()

    existing = Paper(sha256=sha256, title="Existing", word_count=0, extraction_method="native")
    db.add(existing)
    db.flush()
    db.add(AnalysisReport(
        paper_id=existing.id,
        report_json="{}",
        integrity_score=50,
        integrity_grade="C",
        analyzer_version="1.0.0",
    ))
    db.commit()

    with patch("app.services.references.verify_references", new=AsyncMock(return_value=[])), \
         patch("app.services.ingest.USE_SEMANTIC", False):
        result = await ingest_paper(db=db, http=None, pdf_bytes=pdf_bytes,
                                    filename="test.pdf", pdf_dir=tmp_path / "pdfs")

    assert result.was_duplicate is True
    assert result.paper_id == existing.id
    assert result.sha256 == sha256

    # No new Paper rows created
    assert db.execute(select(Paper)).scalars().all().__len__() == 1


@pytest.mark.asyncio
async def test_ingest_dedup_with_multiple_reports(db, tmp_path):
    """Dedup must return the latest report, not raise, when a paper has several."""
    pdf_bytes = _minimal_pdf()
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()

    existing = Paper(sha256=sha256, title="Existing", word_count=0, extraction_method="native")
    db.add(existing)
    db.flush()
    for score in (50, 90):
        db.add(AnalysisReport(
            paper_id=existing.id,
            report_json="{}",
            integrity_score=score,
            integrity_grade="C",
            analyzer_version="1.0.0",
        ))
    db.commit()

    with patch("app.services.references.verify_references", new=AsyncMock(return_value=[])), \
         patch("app.services.ingest.USE_SEMANTIC", False):
        result = await ingest_paper(db=db, http=None, pdf_bytes=pdf_bytes,
                                    filename="test.pdf", pdf_dir=tmp_path / "pdfs")

    assert result.was_duplicate is True
    assert result.paper_id == existing.id


@pytest.mark.asyncio
async def test_ingest_dedup_no_extra_rows(db, tmp_path):
    """Duplicate ingest must not create any new DB rows."""
    pdf_bytes = _minimal_pdf()
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()

    existing = Paper(sha256=sha256, word_count=0, extraction_method="native")
    db.add(existing)
    db.flush()
    db.add(AnalysisReport(
        paper_id=existing.id, report_json="{}",
        integrity_score=0, integrity_grade="F", analyzer_version="1.0.0",
    ))
    db.commit()

    with patch("app.services.references.verify_references", new=AsyncMock(return_value=[])), \
         patch("app.services.ingest.USE_SEMANTIC", False):
        await ingest_paper(db=db, http=None, pdf_bytes=pdf_bytes,
                           filename="test.pdf", pdf_dir=tmp_path / "pdfs")

    assert len(db.execute(select(Paper)).scalars().all()) == 1
    assert len(db.execute(select(AnalysisReport)).scalars().all()) == 1


# ---------------------------------------------------------------------------
# New paper persistence
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ingest_new_paper_creates_paper_row(db, tmp_path):
    """Fresh ingest creates exactly one Paper row with the correct sha256."""
    pdf_bytes = _minimal_pdf()
    expected_sha256 = hashlib.sha256(pdf_bytes).hexdigest()

    with patch("app.services.references.verify_references", new=AsyncMock(return_value=[])), \
         patch("app.services.ingest.USE_SEMANTIC", False):
        result = await ingest_paper(db=db, http=None, pdf_bytes=pdf_bytes,
                                    filename="test.pdf", pdf_dir=tmp_path / "pdfs")

    assert result.was_duplicate is False
    assert result.sha256 == expected_sha256
    assert result.paper_id is not None

    paper = db.get(Paper, result.paper_id)
    assert paper is not None
    assert paper.sha256 == expected_sha256


@pytest.mark.asyncio
async def test_ingest_new_paper_creates_report_row(db, tmp_path):
    """Fresh ingest creates one AnalysisReport with correct analyzer_version."""
    pdf_bytes = _minimal_pdf()

    with patch("app.services.references.verify_references", new=AsyncMock(return_value=[])), \
         patch("app.services.ingest.USE_SEMANTIC", False):
        result = await ingest_paper(db=db, http=None, pdf_bytes=pdf_bytes,
                                    filename="test.pdf", pdf_dir=tmp_path / "pdfs")

    reports = db.execute(
        select(AnalysisReport).where(AnalysisReport.paper_id == result.paper_id)
    ).scalars().all()
    assert len(reports) == 1
    assert reports[0].analyzer_version == "1.0.0"
    assert reports[0].integrity_grade in ("A", "B", "C", "D", "F", "N/A")


@pytest.mark.asyncio
async def test_ingest_saves_pdf_to_disk(db, tmp_path):
    """PDF bytes are written to pdf_dir/<sha256>.pdf."""
    pdf_bytes = _minimal_pdf()
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()
    pdf_dir = tmp_path / "pdfs"

    with patch("app.services.references.verify_references", new=AsyncMock(return_value=[])), \
         patch("app.services.ingest.USE_SEMANTIC", False):
        await ingest_paper(db=db, http=None, pdf_bytes=pdf_bytes,
                           filename="test.pdf", pdf_dir=pdf_dir)

    saved = pdf_dir / f"{sha256}.pdf"
    assert saved.exists()
    assert saved.read_bytes() == pdf_bytes


# ---------------------------------------------------------------------------
# Reference persistence
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ingest_stores_references(db, tmp_path):
    """Citations returned by verify_references are persisted as Reference rows."""
    pdf_bytes = _minimal_pdf()
    mock_cites = [
        Citation(
            raw_text="Smith J. Title. Journal. 2020.",
            normalized="Title",
            status="verified",
            confidence=0.9,
            doi="10.1234/test",
            title="Title",
            authors=["Smith"],
            explanation="base:60 title_sim:0.90 year:✓ authors:✓ doi:—",
        ),
        Citation(
            raw_text="Jones A. Another. Journal. 2021.",
            normalized="Another",
            status="not_found",
            confidence=0.1,
            explanation="base:0 title_sim:0.10 year:— authors:— doi:—",
        ),
    ]

    fake_text = "A" * 200  # long enough to trigger the full analysis path

    with patch("app.services.references.verify_references", new=AsyncMock(return_value=mock_cites)), \
         patch("app.services.ingest.extract_text_from_pdf_bytes", return_value=(fake_text, 1)), \
         patch("app.services.ingest.USE_SEMANTIC", False):
        result = await ingest_paper(db=db, http=object(), pdf_bytes=pdf_bytes,
                                    filename="test.pdf", pdf_dir=tmp_path / "pdfs")

    refs = db.execute(
        select(Reference).where(Reference.paper_id == result.paper_id)
    ).scalars().all()
    assert len(refs) == 2
    statuses = {r.status for r in refs}
    assert "verified" in statuses
    assert "not_found" in statuses

    verified_ref = next(r for r in refs if r.status == "verified")
    assert abs(verified_ref.confidence - 0.9) < 1e-6
    assert verified_ref.doi == "10.1234/test"
