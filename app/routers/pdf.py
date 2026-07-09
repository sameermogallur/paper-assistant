import asyncio
import io
import logging

import pypdf
import pytesseract
from fastapi import APIRouter, HTTPException, UploadFile, File
from pdf2image import convert_from_bytes

from app.config import MAX_PDF_SIZE, MAX_PDF_PAGES, MAX_OCR_PAGES, POPPLER_PATH
from app.cache import OCR_SEMAPHORE
from app.schemas.models import PDFResponse
from app.services.pdf import detect_sections

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/parse_pdf", response_model=PDFResponse)
async def parse_pdf(file: UploadFile = File(...)):
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

        full_text = ""
        for i, page in enumerate(pdf_reader.pages):
            try:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
            except Exception as e:
                logger.warning(f"Failed to extract page {i + 1}: {e}")

        if len(full_text) < 100:
            return PDFResponse(
                text="",
                pages=len(pdf_reader.pages),
                sections={},
                word_count=0,
                extraction_method="failed_needs_ocr",
            )

        sections = detect_sections(full_text)
        return PDFResponse(
            text=full_text,
            pages=len(pdf_reader.pages),
            sections=sections,
            word_count=len(full_text.split()),
            extraction_method="native",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF parsing error: {e}")
        raise HTTPException(500, "Failed to process PDF")


@router.post("/api/parse_pdf_ocr", response_model=PDFResponse)
async def parse_pdf_ocr(file: UploadFile = File(...)):
    contents = await file.read()

    if not contents.startswith(b"%PDF"):
        raise HTTPException(400, "Invalid PDF file")

    if len(contents) > MAX_PDF_SIZE:
        raise HTTPException(400, "PDF too large for OCR")

    async with OCR_SEMAPHORE:
        try:
            kwargs = {"dpi": 150, "thread_count": 2}
            if POPPLER_PATH:
                kwargs["poppler_path"] = POPPLER_PATH

            images = convert_from_bytes(contents, **kwargs)

            if len(images) > MAX_OCR_PAGES:
                images = images[:MAX_OCR_PAGES]
                logger.warning(f"Truncated OCR to {MAX_OCR_PAGES} pages")

            full_text = ""
            loop = asyncio.get_running_loop()
            for i, image in enumerate(images):
                page_text = await loop.run_in_executor(None, pytesseract.image_to_string, image)
                full_text += f"\n--- Page {i + 1} ---\n{page_text}"

            if len(full_text) < 100:
                raise HTTPException(400, "OCR failed to extract text")

            sections = detect_sections(full_text)
            return PDFResponse(
                text=full_text,
                pages=len(images),
                sections=sections,
                word_count=len(full_text.split()),
                extraction_method="ocr",
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"OCR error: {e}")
            raise HTTPException(500, "OCR processing failed")
