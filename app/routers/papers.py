import json
import logging
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
)
from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.config import MAX_PDF_SIZE
from app.db.database import get_db
from app.db.models import AnalysisReport, Embedding, Paper, ProjectPaper
from app.routers.projects import _get_project_or_404
from app.schemas.models import (
    IntegrityReport,
    PaperDetailResponse,
    PaperIngestResponse,
    PaperListItem,
    PaperListResponse,
    RelatedPapersResponse,
    SimilarPapersResponse,
)
from app.services import ingest as ingest_svc
from app.services import openalex as openalex_svc
from app.services.similarity import find_similar_papers

router = APIRouter(prefix="/api/papers", tags=["papers"])
logger = logging.getLogger(__name__)


def _get_paper_or_404(db: Session, paper_id: int) -> Paper:
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(404, f"Paper {paper_id} not found")
    return paper


def _decode_authors(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    try:
        authors = json.loads(raw)
    except ValueError:
        return []
    return authors if isinstance(authors, list) else []


@router.post("", response_model=PaperIngestResponse)
async def ingest_paper(
    request: Request,
    response: Response,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File must be a PDF")

    contents = await file.read()

    if not contents.startswith(b"%PDF"):
        raise HTTPException(400, "Invalid PDF file")

    if len(contents) > MAX_PDF_SIZE:
        raise HTTPException(400, f"PDF too large. Max: {MAX_PDF_SIZE / 1024 / 1024:.1f}MB")

    result = await ingest_svc.ingest_paper(
        db=db,
        http=request.app.state.http,
        pdf_bytes=contents,
        filename=file.filename,
    )

    response.status_code = 200 if result.was_duplicate else 201
    return result


@router.get("", response_model=PaperListResponse)
def list_papers(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    # Latest report per paper by max id (monotonic; created_at can tie within a second).
    latest_report = (
        select(AnalysisReport.paper_id, func.max(AnalysisReport.id).label("latest_id"))
        .group_by(AnalysisReport.paper_id)
        .subquery()
    )

    # Explicit columns only — full_text must never be loaded for a list.
    query = (
        select(
            Paper.id,
            Paper.title,
            Paper.authors,
            Paper.year,
            Paper.doi,
            Paper.word_count,
            Paper.extraction_method,
            Paper.created_at,
            AnalysisReport.integrity_score,
            AnalysisReport.integrity_grade,
            exists().where(Embedding.paper_id == Paper.id).label("has_embedding"),
        )
        .outerjoin(latest_report, latest_report.c.paper_id == Paper.id)
        .outerjoin(AnalysisReport, AnalysisReport.id == latest_report.c.latest_id)
    )
    count_query = select(func.count(Paper.id))

    if project_id is not None:
        _get_project_or_404(db, project_id)
        members = select(ProjectPaper.paper_id).where(ProjectPaper.project_id == project_id)
        query = query.where(Paper.id.in_(members))
        count_query = count_query.where(Paper.id.in_(members))

    total = db.execute(count_query).scalar_one()
    rows = db.execute(
        query.order_by(Paper.created_at.desc(), Paper.id.desc()).limit(limit).offset(offset)
    ).all()

    return PaperListResponse(
        items=[
            PaperListItem(
                id=row.id,
                title=row.title,
                authors=_decode_authors(row.authors),
                year=row.year,
                doi=row.doi,
                word_count=row.word_count,
                extraction_method=row.extraction_method,
                created_at=row.created_at.isoformat(),
                integrity_score=row.integrity_score,
                integrity_grade=row.integrity_grade,
                has_embedding=bool(row.has_embedding),
            )
            for row in rows
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{paper_id}/similar", response_model=SimilarPapersResponse)
def similar_papers(
    paper_id: int,
    top_k: int = Query(5, ge=1, le=50),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    _get_paper_or_404(db, paper_id)
    if project_id is not None:
        _get_project_or_404(db, project_id)
    results, reason = find_similar_papers(db, paper_id, top_k=top_k, project_id=project_id)
    return SimilarPapersResponse(paper_id=paper_id, results=results, reason=reason)


@router.get("/{paper_id}/related", response_model=RelatedPapersResponse)
async def related_papers(
    request: Request,
    paper_id: int,
    limit: int = Query(10, ge=1, le=25),
    db: Session = Depends(get_db),
):
    paper = _get_paper_or_404(db, paper_id)
    if not paper.doi:
        return RelatedPapersResponse(paper_id=paper_id, results=[], reason="paper_has_no_doi")

    results, reason = await openalex_svc.fetch_related_works(
        request.app.state.http, paper.doi, limit=limit
    )
    if reason == "openalex_unavailable":
        raise HTTPException(503, "OpenAlex unavailable")
    return RelatedPapersResponse(paper_id=paper_id, results=results, reason=reason)


@router.get("/{paper_id}", response_model=PaperDetailResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = _get_paper_or_404(db, paper_id)

    report_row = db.execute(
        select(AnalysisReport)
        .where(AnalysisReport.paper_id == paper_id)
        .order_by(AnalysisReport.id.desc())
        .limit(1)
    ).scalar_one_or_none()

    report = None
    if report_row:
        try:
            report = IntegrityReport.model_validate_json(report_row.report_json)
        except Exception:
            logger.warning(f"Corrupt report_json for paper {paper_id}; returning report=null")

    has_embedding = db.execute(
        select(exists().where(Embedding.paper_id == paper_id))
    ).scalar_one()

    return PaperDetailResponse(
        id=paper.id,
        sha256=paper.sha256,
        title=paper.title,
        authors=_decode_authors(paper.authors),
        year=paper.year,
        doi=paper.doi,
        word_count=paper.word_count,
        extraction_method=paper.extraction_method,
        created_at=paper.created_at.isoformat(),
        integrity_score=report_row.integrity_score if report_row else None,
        integrity_grade=report_row.integrity_grade if report_row else None,
        has_embedding=bool(has_embedding),
        report=report,
    )
