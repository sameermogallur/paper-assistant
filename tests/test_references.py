"""
Tests for the DOI fast path in reference verification (_verify_one).

The DOI branch must not blindly trust a resolvable DOI: a typo'd DOI can
resolve to an unrelated article, and title agreement has to carry the
confidence. Crossref is mocked; USE_SEMANTIC is patched off so title
similarity uses the deterministic difflib fallback.
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.cache import reference_cache
from app.services.references import _verify_one


class _Resp:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload


def _http_returning(payload, status_code=200):
    http = AsyncMock()
    http.get = AsyncMock(return_value=_Resp(status_code, payload))
    return http


@pytest.fixture(autouse=True)
def _clear_cache():
    reference_cache.clear()
    yield
    reference_cache.clear()


REFERENCE = "Smith, J. (2020). Deep Learning for Citation Analysis. https://doi.org/10.1234/abc."


@pytest.mark.asyncio
async def test_doi_lookup_strips_trailing_punctuation():
    http = _http_returning({"message": {}})
    with patch("app.services.references.USE_SEMANTIC", False):
        await _verify_one(http, REFERENCE)
    called_url = http.get.call_args_list[0].args[0]
    assert called_url == "https://api.crossref.org/works/10.1234/abc"


@pytest.mark.asyncio
async def test_doi_match_with_title_agreement_is_verified():
    payload = {"message": {
        "DOI": "10.1234/abc",
        "title": ["Deep Learning for Citation Analysis"],
        "author": [{"family": "Smith"}],
        "issued": {"date-parts": [[2020]]},
    }}
    with patch("app.services.references.USE_SEMANTIC", False):
        result = await _verify_one(_http_returning(payload), REFERENCE)
    assert result.status == "verified"
    assert result.doi == "10.1234/abc"


@pytest.mark.asyncio
async def test_wrong_but_resolvable_doi_is_not_verified():
    # DOI resolves, but to an unrelated article: no title/year/author agreement.
    payload = {"message": {
        "DOI": "10.1234/abc",
        "title": ["Migration Patterns of Pacific Sea Turtles"],
        "author": [{"family": "Jones"}],
        "issued": {"date-parts": [[1999]]},
    }}
    with patch("app.services.references.USE_SEMANTIC", False):
        result = await _verify_one(_http_returning(payload), REFERENCE)
    assert result.status != "verified"
