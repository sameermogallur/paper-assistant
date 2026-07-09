from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class TextBody(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000000)


class PDFResponse(BaseModel):
    text: str
    pages: int
    sections: Dict[str, int]
    word_count: int
    extraction_method: str


class Citation(BaseModel):
    raw_text: str
    normalized: str
    status: str
    confidence: float = Field(ge=0, le=1)
    doi: Optional[str] = None
    title: Optional[str] = None
    authors: Optional[List[str]] = None
    explanation: str


class InTextCitations(BaseModel):
    numeric: List[str]
    author_year: List[str]
    total_count: int
    explanation: str


class StatisticsResult(BaseModel):
    p_values: List[str]
    sample_sizes: List[str]
    effect_sizes: List[str]
    cis: List[str]
    red_flags: List[str]
    summary: str


class TruthinessResult(BaseModel):
    score: int = Field(ge=0, le=100)
    reasons: List[str]
    grade: str
    disclaimer: str = "This is a heuristic analysis, not peer review"


class IntegrityReport(BaseModel):
    pages: int
    word_count: int
    sections_detected: List[str]
    extraction_method: str

    references_found: int
    references_verified: int
    references_suspicious: int
    references_not_found: int
    citations: List[Citation]

    statistics: StatisticsResult

    integrity_score: int = Field(ge=0, le=100)
    integrity_grade: str
    integrity_signals: List[str]

    intext_total: int
    intext_numeric: int
    intext_author_year: int

    analyzed_at: str
    disclaimer: str = "This is an automated heuristic analysis, not peer review."


class PaperIngestResponse(BaseModel):
    paper_id: int
    sha256: str
    was_duplicate: bool
    report: Optional[IntegrityReport]


class HealthResponse(BaseModel):
    status: str
    timestamp: str


class VersionResponse(BaseModel):
    app_version: str
    python_version: str
    dependencies: Dict[str, str]
