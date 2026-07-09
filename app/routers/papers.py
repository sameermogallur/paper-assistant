import logging

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from sqlalchemy.orm import Session

from app.config import MAX_PDF_SIZE
from app.db.database import get_db
from app.schemas.models import PaperIngestResponse
from app.services import ingest as ingest_svc

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/papers", response_model=PaperIngestResponse)
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
