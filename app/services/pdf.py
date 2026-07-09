import io
import logging
import re
from typing import Dict, Tuple

import pypdf

logger = logging.getLogger(__name__)

SECTION_PATTERNS = {
    "Abstract": re.compile(r"\b(?:Abstract|ABSTRACT|Summary)\b", re.IGNORECASE | re.MULTILINE),
    "Introduction": re.compile(r"\b(?:Introduction|INTRODUCTION|Background)\b", re.IGNORECASE | re.MULTILINE),
    "Methods": re.compile(r"\b(?:Methods?|METHODS?|Methodology|Materials and Methods)\b", re.IGNORECASE | re.MULTILINE),
    "Results": re.compile(r"\b(?:Results?|RESULTS?|Findings)\b", re.IGNORECASE | re.MULTILINE),
    "Discussion": re.compile(r"\b(?:Discussion|DISCUSSION|Conclusions?)\b", re.IGNORECASE | re.MULTILINE),
    "References": re.compile(r"\b(?:References|REFERENCES|Bibliography|Works Cited)\b", re.IGNORECASE | re.MULTILINE),
}


def detect_sections(text: str) -> Dict[str, int]:
    sections = {}
    for name, pattern in SECTION_PATTERNS.items():
        match = pattern.search(text)
        if match:
            sections[name] = match.start()
    return dict(sorted(sections.items(), key=lambda x: x[1]))


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> Tuple[str, int]:
    """Return (full_text, num_pages) from raw PDF bytes. Raises on corrupt input."""
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    num_pages = len(reader.pages)
    parts = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text()
            if text:
                parts.append(text)
        except Exception as e:
            logger.warning(f"Failed to extract page {i + 1}: {e}")
    return "\n".join(parts), num_pages


def extract_references_section(text: str) -> str:
    pattern = r"(?mi)^\s*(references|bibliography|works cited|literature cited)\s*:?\s*$"
    match = re.search(pattern, text)
    if match:
        return text[match.start():]
    return ""
