import re
import logging
from app.schemas.models import InTextCitations

logger = logging.getLogger(__name__)


async def find_intext_citations(text: str) -> InTextCitations:
    numeric = []
    numeric_patterns = [
        r"\[(\d+)\]",
        r"\[(\d+[-–]\d+)\]",
        r"\[(\d+(?:,\s*\d+)+)\]",
    ]
    for pattern in numeric_patterns:
        numeric.extend(re.findall(pattern, text))

    author_year = []
    author_patterns = [
        r"\(([A-Z][a-z]+(?:\s+et\s+al\.)?),?\s+(\d{4})\)",
        r"\(([A-Z][a-z]+\s+(?:&|and)\s+[A-Z][a-z]+),?\s+(\d{4})\)",
    ]
    for pattern in author_patterns:
        author_year.extend([f"{m[0]}, {m[1]}" for m in re.findall(pattern, text)])

    numeric = list(set(numeric))[:100]
    author_year = list(set(author_year))[:100]
    total = len(numeric) + len(author_year)

    return InTextCitations(
        numeric=numeric,
        author_year=author_year,
        total_count=total,
        explanation=f"Found {len(numeric)} numeric and {len(author_year)} author-year citations",
    )
