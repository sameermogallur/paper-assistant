import re
import logging
from typing import Dict

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


def extract_references_section(text: str) -> str:
    pattern = r"(?mi)^\s*(references|bibliography|works cited|literature cited)\s*:?\s*$"
    match = re.search(pattern, text)
    if match:
        return text[match.start():]
    return ""
