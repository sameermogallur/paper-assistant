"""
Tests for OpenAlex related-works: service layer (mocked httpx, no network)
and the GET /api/papers/{id}/related endpoint (service patched).
"""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.cache import related_works_cache
from app.db.database import Base, get_db
from app.db.models import Paper
from app.main import app
from app.services.openalex import fetch_related_works


class _Resp:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload


def _work(wid, title, doi=None, year=2020, cited=5, authors=("Smith",)):
    return {
        "id": f"https://openalex.org/{wid}",
        "title": title,
        "doi": f"https://doi.org/{doi}" if doi else None,
        "publication_year": year,
        "cited_by_count": cited,
        "authorships": [{"author": {"display_name": a}} for a in authors],
    }


@pytest.fixture(autouse=True)
def _clear_cache():
    related_works_cache.clear()
    yield
    related_works_cache.clear()


@pytest.fixture(autouse=True)
def _no_backoff_sleep():
    with patch("app.services.openalex.sleep_with_backoff", new=AsyncMock()):
        yield


# ---------------------------------------------------------------------------
# Service layer
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_related_happy_path_batched_and_ordered():
    resolve = _Resp(200, {"related_works": [
        "https://openalex.org/W3", "https://openalex.org/W1", "https://openalex.org/W2",
    ]})
    # Batch returns in a different order than related_works
    batch = _Resp(200, {"results": [
        _work("W1", "First", doi="10.1/w1"),
        _work("W2", "Second"),
        _work("W3", "Third", doi="10.1/w3"),
    ]})
    http = AsyncMock()
    http.get = AsyncMock(side_effect=[resolve, batch])

    items, reason = await fetch_related_works(http, "10.1234/abc", limit=10)

    assert reason is None
    assert [i.openalex_id for i in items] == ["W3", "W1", "W2"]
    assert items[0].title == "Third"
    assert items[0].doi == "10.1/w3"
    assert items[0].url == "https://doi.org/10.1/w3"
    assert items[1].authors == ["Smith"]
    # One batched request with a pipe-joined id filter
    batch_params = http.get.call_args_list[1].kwargs.get("params") \
        or http.get.call_args_list[1].args[1]
    assert batch_params["filter"] == "openalex_id:W3|W1|W2"


@pytest.mark.asyncio
async def test_related_skips_null_title_works():
    resolve = _Resp(200, {"related_works": [
        "https://openalex.org/W1", "https://openalex.org/W2",
    ]})
    withdrawn = _work("W2", None)
    withdrawn["title"] = None
    batch = _Resp(200, {"results": [_work("W1", "Kept"), withdrawn]})
    http = AsyncMock()
    http.get = AsyncMock(side_effect=[resolve, batch])

    items, reason = await fetch_related_works(http, "10.1234/abc")
    assert [i.openalex_id for i in items] == ["W1"]
    assert reason is None


@pytest.mark.asyncio
async def test_related_doi_not_in_openalex():
    http = AsyncMock()
    http.get = AsyncMock(return_value=_Resp(404))
    items, reason = await fetch_related_works(http, "10.1234/missing")
    assert items == []
    assert reason == "not_found_in_openalex"


@pytest.mark.asyncio
async def test_related_no_related_works():
    http = AsyncMock()
    http.get = AsyncMock(return_value=_Resp(200, {"related_works": []}))
    items, reason = await fetch_related_works(http, "10.1234/abc")
    assert items == []
    assert reason == "no_related_works"


@pytest.mark.asyncio
async def test_related_retry_exhaustion_is_unavailable():
    http = AsyncMock()
    http.get = AsyncMock(return_value=_Resp(500))
    items, reason = await fetch_related_works(http, "10.1234/abc")
    assert items == []
    assert reason == "openalex_unavailable"
    # Transient failure must not be cached
    assert "10.1234/abc" not in related_works_cache


@pytest.mark.asyncio
async def test_related_cache_hit_skips_http():
    resolve = _Resp(200, {"related_works": ["https://openalex.org/W1"]})
    batch = _Resp(200, {"results": [_work("W1", "Cached")]})
    http = AsyncMock()
    http.get = AsyncMock(side_effect=[resolve, batch])

    first, _ = await fetch_related_works(http, "10.1234/abc")
    assert http.get.call_count == 2
    second, reason = await fetch_related_works(http, "10.1234/ABC")  # case-insensitive key
    assert http.get.call_count == 2
    assert [i.openalex_id for i in second] == ["W1"]
    assert reason is None


# ---------------------------------------------------------------------------
# Endpoint layer
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(engine)


def _add_paper(doi=None) -> int:
    db: Session = next(app.dependency_overrides[get_db]())
    paper = Paper(sha256="a" * 64, doi=doi, word_count=0, extraction_method="native")
    db.add(paper)
    db.commit()
    pid = paper.id
    db.close()
    return pid


def test_related_endpoint_paper_without_doi_short_circuits(client):
    pid = _add_paper(doi=None)
    with patch("app.services.openalex.fetch_related_works", new=AsyncMock()) as mock_fetch:
        r = client.get(f"/api/papers/{pid}/related")
    assert r.status_code == 200
    assert r.json() == {"paper_id": pid, "results": [], "reason": "paper_has_no_doi"}
    mock_fetch.assert_not_called()


def test_related_endpoint_reason_passthrough(client):
    pid = _add_paper(doi="10.1234/abc")
    with patch("app.services.openalex.fetch_related_works",
               new=AsyncMock(return_value=([], "no_related_works"))):
        r = client.get(f"/api/papers/{pid}/related")
    assert r.status_code == 200
    assert r.json()["reason"] == "no_related_works"


def test_related_endpoint_unavailable_is_503(client):
    pid = _add_paper(doi="10.1234/abc")
    with patch("app.services.openalex.fetch_related_works",
               new=AsyncMock(return_value=([], "openalex_unavailable"))):
        r = client.get(f"/api/papers/{pid}/related")
    assert r.status_code == 503


def test_related_endpoint_paper_not_found(client):
    assert client.get("/api/papers/9999/related").status_code == 404
