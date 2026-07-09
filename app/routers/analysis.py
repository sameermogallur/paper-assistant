import asyncio
import io
import logging
from datetime import datetime
from typing import List, Optional

import pypdf
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Query

from app.config import MAX_PDF_SIZE, MAX_PDF_PAGES
from app.schemas.models import (
    Citation,
    InTextCitations,
    IntegrityReport,
    StatisticsResult,
    TextBody,
    TruthinessResult,
)
from app.services import citations as citations_svc
from app.services import integrity as integrity_svc
from app.services import references as references_svc
from app.services import statistics as statistics_svc
from app.services.pdf import detect_sections

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/verify_references", response_model=List[Citation])
async def verify_references(request: Request, body: TextBody):
    return await references_svc.verify_references(request.app.state.http, body.text)


@router.post("/api/find_intext_citations", response_model=InTextCitations)
async def find_intext_citations(body: TextBody):
    return await citations_svc.find_intext_citations(body.text)


@router.post("/api/extract_statistics", response_model=StatisticsResult)
async def extract_statistics(body: TextBody):
    return await statistics_svc.extract_statistics(body.text)


@router.post("/api/truthiness_score", response_model=TruthinessResult)
async def calculate_truthiness(body: TextBody, field: Optional[str] = Query(None)):
    return await integrity_svc.calculate_truthiness(body.text, field)


@router.post("/api/analyze_pdf", response_model=IntegrityReport)
async def analyze_pdf(request: Request, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File must be a PDF")

    contents = await file.read()

    if not contents.startswith(b"%PDF"):
        raise HTTPException(400, "Invalid PDF file")

    if len(contents) > MAX_PDF_SIZE:
        raise HTTPException(400, f"PDF too large. Max: {MAX_PDF_SIZE / 1024 / 1024:.1f}MB")

    try:
        pdf_reader = pypdf.PdfReader(io.BytesIO(contents))

        if len(pdf_reader.pages) > MAX_PDF_PAGES:
            raise HTTPException(400, f"Too many pages. Max: {MAX_PDF_PAGES}")

        num_pages = len(pdf_reader.pages)
        full_text = ""
        for i, page in enumerate(pdf_reader.pages):
            try:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
            except Exception as e:
                logger.warning(f"Failed to extract page {i + 1}: {e}")

        sections = detect_sections(full_text)
        word_count = len(full_text.split())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF parsing error: {e}")
        raise HTTPException(500, "Failed to process PDF")

    if len(full_text) < 100:
        return IntegrityReport(
            pages=num_pages,
            word_count=0,
            sections_detected=[],
            extraction_method="failed_needs_ocr",
            references_found=0,
            references_verified=0,
            references_suspicious=0,
            references_not_found=0,
            citations=[],
            statistics=StatisticsResult(
                p_values=[],
                sample_sizes=[],
                effect_sizes=[],
                cis=[],
                red_flags=[],
                summary="OCR required - no text extracted",
            ),
            integrity_score=0,
            integrity_grade="N/A",
            integrity_signals=["OCR required - text extraction failed"],
            intext_total=0,
            intext_numeric=0,
            intext_author_year=0,
            analyzed_at=datetime.utcnow().isoformat(),
            disclaimer="This is an automated heuristic analysis, not peer review.",
        )

    cites, stats, truthiness, intext = await asyncio.gather(
        references_svc.verify_references(request.app.state.http, full_text),
        statistics_svc.extract_statistics(full_text),
        integrity_svc.calculate_truthiness(full_text),
        citations_svc.find_intext_citations(full_text),
    )

    verified_count = sum(1 for c in cites if c.status == "verified")
    suspicious_count = sum(1 for c in cites if c.status == "suspicious")
    not_found_count = sum(1 for c in cites if c.status == "not_found")

    return IntegrityReport(
        pages=num_pages,
        word_count=word_count,
        sections_detected=list(sections.keys()),
        extraction_method="native",
        references_found=len(cites),
        references_verified=verified_count,
        references_suspicious=suspicious_count,
        references_not_found=not_found_count,
        citations=cites,
        statistics=stats,
        integrity_score=truthiness.score,
        integrity_grade=truthiness.grade,
        integrity_signals=truthiness.reasons,
        intext_total=intext.total_count,
        intext_numeric=len(intext.numeric),
        intext_author_year=len(intext.author_year),
        analyzed_at=datetime.utcnow().isoformat(),
        disclaimer="This is an automated heuristic analysis, not peer review.",
    )
