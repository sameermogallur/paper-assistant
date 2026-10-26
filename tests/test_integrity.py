"""
Tests for the heuristic integrity score (app/services/integrity.py).
"""
import pytest

from app.services.integrity import calculate_truthiness

# Has COI and ethics statements but no limitations section, so the baseline
# lands below the 100 cap and a bonus shows up in the score.
BASE_TEXT = (
    "Conflict of interest: none declared. "
    "Ethics approval was granted by the institutional review board. "
)
DATA_STATEMENT = "All data are available at https://osf.io/abcde/. "


@pytest.mark.asyncio
async def test_open_data_statement_earns_bonus():
    """The data/code availability flag from statistics.py must earn the +10 bonus."""
    without = await calculate_truthiness(BASE_TEXT)
    with_data = await calculate_truthiness(BASE_TEXT + DATA_STATEMENT)

    assert with_data.score == without.score + 10
    assert "✅ Open data/code available" in with_data.reasons
    assert "✅ Open data/code available" not in without.reasons
