import asyncio
import difflib
import hashlib
import logging
import random
import re
from typing import List, Optional

logger = logging.getLogger(__name__)


async def sleep_with_backoff(attempt: int, max_delay: float = 5.0) -> None:
    delay = min(1.0 * (2 ** attempt) + random.random() * 0.5, max_delay)
    await asyncio.sleep(delay)


def get_cache_key(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


# Crossref-recommended DOI shape. Kept shared so reference verification and
# ingest metadata extraction can't drift apart. Deliberately excludes <, >, #
# (legal in rare SICI-era DOIs): including them would slurp HTML/XML fragments
# from PDF-extracted text, a worse failure than truncating legacy DOIs.
DOI_PATTERN = re.compile(r"10\.\d{4,9}/[-._;()/:A-Za-z0-9]+")


def extract_first_doi(text: str) -> Optional[str]:
    match = DOI_PATTERN.search(text)
    if not match:
        return None
    # The character class admits sentence-ending punctuation; strip it.
    return match.group(0).rstrip(".,;:")


def get_year_from_item(item: dict) -> Optional[str]:
    for field in ["issued", "published-online", "published-print"]:
        if item.get(field) and item[field].get("date-parts"):
            year = item[field]["date-parts"][0][0]
            if year:
                return str(year)
    return None


def first_year(item: dict) -> Optional[str]:
    for field in ["published-print", "published-online", "issued"]:
        if item.get(field) and item[field].get("date-parts"):
            year = item[field]["date-parts"][0][0]
            if year:
                return str(year)
    return None


def title_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    a_norm = re.sub(r"\s+", " ", a).strip().lower()
    b_norm = re.sub(r"\s+", " ", b).strip().lower()
    return difflib.SequenceMatcher(None, a_norm, b_norm).ratio()


def extract_title_from_ref(ref: str) -> str:
    """Extract likely title from a citation string.

    Handles APA-style (Author. (YEAR). Title. Journal.) and Vancouver-style
    (Author. Title. Journal. YEAR;). The previous regex captured author list
    (everything before the first period) instead of the title.
    """
    if not ref:
        return ref

    # APA-style: "(YEAR[anything]). Title. Journal..."
    m = re.search(r"\(\d{4}[^)]*\)\.\s*(.+)", ref)
    if m:
        candidate = m.group(1).strip()
        title_end = re.search(r"\.\s+[A-Z]", candidate)
        if title_end:
            candidate = candidate[: title_end.start()]
        if len(candidate.split()) >= 2:
            return candidate

    # Vancouver fallback: first segment after authors that looks like a title
    parts = re.split(r"\.\s+", ref)
    for part in parts[1:]:
        part = part.strip()
        if part and part[0].isalpha() and len(part.split()) >= 3:
            return part

    m = re.match(r"^[^.]+", ref)
    return m.group(0).strip() if m else ref


def parse_reference_list(ref_text: str) -> List[str]:
    if not ref_text:
        return []

    references = []

    numbered = re.split(r"\n\s*\[?\d+\]?[\.\)]\s+", ref_text)
    if len(numbered) > 5:
        references = [r.strip() for r in numbered if 20 < len(r.strip()) < 500]
    else:
        lines = ref_text.split("\n")
        current_parts: list = []
        current_len = 0
        for line in lines:
            line = line.strip()
            if re.match(r"^[A-Z]", line) and current_parts and current_len > 20:
                references.append(" ".join(current_parts))
                current_parts = [line]
                current_len = len(line)
            elif line:
                current_parts.append(line)
                current_len += len(line) + 1
        if current_parts and current_len > 20:
            references.append(" ".join(current_parts))

    return references[:50]
