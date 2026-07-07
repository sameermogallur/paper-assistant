"""
Baseline test suite for AIRA backend.
Covers pure utility functions directly and one API smoke test via TestClient.
Intentionally minimal — skeleton to build on once SPECTER2 embeddings are added.
"""
import re
import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import parse_reference_list, title_similarity, extract_title_from_ref, semantic_title_similarity
from fastapi.testclient import TestClient
from backend import app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _old_parse_linebased(ref_text: str) -> list[str]:
    """Verbatim copy of the pre-fix O(n²) line-based path, for diff comparison.
    Does NOT include the numbered-format branch — only the fallback path,
    which is what the comparison test exercises."""
    if not ref_text:
        return []
    references = []
    lines = ref_text.split('\n')
    current = ""
    for line in lines:
        line = line.strip()
        if re.match(r'^[A-Z]', line) and current and len(current) > 20:
            references.append(current)
            current = line
        elif line:
            current += " " + line if current else line
    if current and len(current) > 20:
        references.append(current)
    return references[:50]


# ---------------------------------------------------------------------------
# parse_reference_list — numbered format
# ---------------------------------------------------------------------------

def test_parse_reference_list_numbered():
    text = (
        "\n[1]. Author A, Smith B. Title One: A study of things. "
        "Journal of Things, 5(1), 1-10. 2020.\n"
        "[2]. Author C, Jones D. Title Two: Another study. "
        "Another Journal, 3(2), 5-15. 2021.\n"
        "[3]. Author E, Brown F. Title Three here. Science, 10, 100-110. 2019.\n"
        "[4]. Author G. Title Four stands alone. Nature, 1, 1-5. 2022.\n"
        "[5]. Author H, Kim I. Title Five complete. Cell, 2, 20-30. 2023.\n"
        "[6]. Author J. Title Six final entry. PNAS, 3, 300-310. 2024.\n"
    )
    refs = parse_reference_list(text)
    assert len(refs) >= 5, f"Expected ≥5 numbered refs, got {len(refs)}: {refs}"


# ---------------------------------------------------------------------------
# parse_reference_list — line-based fallback
# ---------------------------------------------------------------------------

def test_parse_reference_list_linebased():
    text = (
        "Author A, Smith B. (2020). Title one spans multiple lines.\n"
        "Journal of Things, 5(1), 1-10.\n"
        "Baker C, Jones D. (2021). Title two is also multi-line and continues\n"
        "on this line. Another Journal, 3(2), 5-15.\n"
        "Carter E, Brown F. (2019). Third reference title. Science, 10, 100-110.\n"
    )
    refs = parse_reference_list(text)
    assert len(refs) >= 2, f"Expected ≥2 refs from line-based path, got {len(refs)}: {refs}"


def test_parse_reference_list_empty():
    assert parse_reference_list("") == []
    assert parse_reference_list(None) == []  # type: ignore[arg-type]


def test_parse_reference_list_limit():
    # 60 numbered references — hard cap is 50
    lines = "\n".join(
        f"[{i}]. Author Z. Title Number {i}: A complete reference entry here. Journal, 1, 1-5. 2020."
        for i in range(1, 61)
    )
    refs = parse_reference_list(lines)
    assert len(refs) <= 50, f"Expected ≤50 refs (hard limit), got {len(refs)}"


# ---------------------------------------------------------------------------
# parse_reference_list — O(n²) → O(n) equivalence check
# ---------------------------------------------------------------------------

def test_parse_reference_list_new_matches_old_impl():
    """Run the old O(n²) and new O(n) implementations on the same input and
    diff the output lists directly, confirming the length-tracking change
    does not shift where references get split.

    The sample is designed to exercise tricky cases for the line-based path:
    - continuation lines (lowercase start — must attach, not split)
    - a very short line ('short') that should attach to the current ref
    - a fresh reference starting mid-block (capital start)
    """
    sample = (
        "Author A, Smith B. (2020). Title one spans\n"
        "multiple lines here. Journal of Things, 5(1), 1-10.\n"
        "continuing line for first ref.\n"                        # lowercase — no split
        "Baker C, Jones D. (2021). Title two here is also multi-line.\n"
        "This line continues ref two. Another Journal, 3(2), 5-15.\n"
        "short\n"                                                  # short attach
        "Carter E, Brown F. (2019). Third reference title. Science, 10, 100-110.\n"
        "Davis G, Harris H. (2022). Fourth reference stands alone. Nature, 1, 1-5.\n"
    )

    old_result = _old_parse_linebased(sample)
    new_result = parse_reference_list(sample)

    assert old_result == new_result, (
        f"Output diverged after O(n²) → O(n) rewrite.\n"
        f"Old ({len(old_result)} refs):\n" +
        "\n".join(f"  [{i}] {r!r}" for i, r in enumerate(old_result)) +
        f"\nNew ({len(new_result)} refs):\n" +
        "\n".join(f"  [{i}] {r!r}" for i, r in enumerate(new_result))
    )


# ---------------------------------------------------------------------------
# title_similarity
# ---------------------------------------------------------------------------

def test_title_similarity_exact():
    assert title_similarity("attention is all you need", "attention is all you need") == 1.0


def test_title_similarity_empty():
    assert title_similarity("", "anything") == 0.0
    assert title_similarity("anything", "") == 0.0


def test_title_similarity_partial():
    score = title_similarity(
        "attention is all you need",
        "attention mechanisms in neural networks",
    )
    assert 0.0 < score < 1.0, f"Expected partial match between 0 and 1, got {score}"


# ---------------------------------------------------------------------------
# extract_title_from_ref
# ---------------------------------------------------------------------------

def test_extract_title_from_ref_apa():
    """APA-style citation: extract title, not author list."""
    ref = "Baker C, Johnson AK. (2020). COVID-19 vaccine efficacy in elderly populations. N Engl J Med, 383, 2603."
    result = extract_title_from_ref(ref)
    assert "COVID-19 vaccine efficacy" in result
    assert "Baker" not in result

def test_extract_title_from_ref_vancouver():
    """Vancouver-style citation: second segment is the title."""
    ref = "Vaswani A, Shazeer N. Attention is all you need. Advances in Neural Information Processing Systems. 2017."
    result = extract_title_from_ref(ref)
    assert "Attention is all you need" in result
    assert "Vaswani" not in result

def test_extract_title_from_ref_does_not_return_authors():
    """Regression: old regex returned the author list ('Smith J, Jones A'), not the title."""
    ref = "Smith J, Jones A. (2021). CRISPR-Cas9 knockout efficiency in mammalian cells. Nature Biotechnology, 15, 45."
    result = extract_title_from_ref(ref)
    assert result != "Smith J, Jones A"
    assert len(result.split()) >= 3

def test_extract_title_from_ref_empty():
    assert extract_title_from_ref("") == ""


# ---------------------------------------------------------------------------
# semantic_title_similarity (SPECTER embeddings)
# ---------------------------------------------------------------------------

def test_semantic_similarity_synonyms():
    """SPECTER scores medical synonym pairs much higher than difflib would."""
    score = semantic_title_similarity(
        "Myocardial infarction mortality outcomes",
        "Heart attack and death rates in elderly patients",
    )
    assert score > 0.7, f"Expected > 0.7 for medical synonyms, got {score:.3f}"

def test_semantic_similarity_unrelated_papers():
    """Genuinely unrelated papers score lower than synonyms."""
    score_synonyms = semantic_title_similarity(
        "Myocardial infarction mortality outcomes",
        "Heart attack and death rates in elderly patients",
    )
    score_unrelated = semantic_title_similarity(
        "Myocardial infarction mortality outcomes",
        "CRISPR-Cas9 genome editing in plant cells",
    )
    assert score_synonyms > score_unrelated, (
        f"Synonyms ({score_synonyms:.3f}) should outscore unrelated ({score_unrelated:.3f})"
    )

def test_semantic_beats_difflib_on_synonyms():
    """The case where difflib fails: SPECTER similarity > difflib similarity."""
    a = "Myocardial infarction mortality outcomes"
    b = "Heart attack and death rates in elderly patients"
    assert semantic_title_similarity(a, b) > title_similarity(a, b), (
        "SPECTER should beat difflib on medical synonym pairs"
    )

def test_semantic_similarity_empty():
    assert semantic_title_similarity("", "anything") == 0.0
    assert semantic_title_similarity("anything", "") == 0.0


# ---------------------------------------------------------------------------
# API smoke test
# ---------------------------------------------------------------------------

def test_healthz():
    with TestClient(app) as client:
        response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
