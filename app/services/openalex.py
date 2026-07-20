import logging
from typing import List, Optional, Tuple

import httpx

from app.cache import OPENALEX_SEMAPHORE, related_works_cache
from app.config import OPENALEX_MAILTO
from app.schemas.models import RelatedPaperItem
from app.utils.helpers import sleep_with_backoff

logger = logging.getLogger(__name__)

OPENALEX_BASE = "https://api.openalex.org"
OPENALEX_ID_PREFIX = "https://openalex.org/"
DOI_URL_PREFIX = "https://doi.org/"

# The openalex_id filter accepts ~50 IDs; we fetch the max the API pages at
# once and slice per request so the cache serves any limit.
MAX_RELATED = 25


async def _get_json(
    http: httpx.AsyncClient, url: str, params: dict
) -> Tuple[str, Optional[dict]]:
    """Returns (status, payload) with status in {"ok", "not_found", "error"}."""
    for attempt in range(3):
        try:
            resp = await http.get(url, params=params)
            if resp.status_code == 200:
                try:
                    return "ok", resp.json()
                except ValueError:
                    return "error", None
            if resp.status_code == 404:
                return "not_found", None
            if resp.status_code in (429, 500, 502, 503, 504):
                await sleep_with_backoff(attempt)
                continue
            return "error", None
        except httpx.HTTPError:
            await sleep_with_backoff(attempt)
    return "error", None


def _to_related_item(work: dict) -> Optional[RelatedPaperItem]:
    title = work.get("title") or work.get("display_name")
    if not title:
        # related_works can list withdrawn/merged works with no title
        return None
    doi_url = work.get("doi")
    authors = [
        a.get("author", {}).get("display_name")
        for a in work.get("authorships", [])[:5]
        if a.get("author", {}).get("display_name")
    ]
    return RelatedPaperItem(
        openalex_id=(work.get("id") or "").removeprefix(OPENALEX_ID_PREFIX),
        title=title,
        authors=authors,
        year=work.get("publication_year"),
        doi=doi_url.removeprefix(DOI_URL_PREFIX) if doi_url else None,
        cited_by_count=work.get("cited_by_count"),
        url=doi_url or work.get("id"),
    )


async def fetch_related_works(
    http: httpx.AsyncClient, doi: str, limit: int = 10
) -> Tuple[List[RelatedPaperItem], Optional[str]]:
    """Resolve a DOI in OpenAlex and return its related works.

    Reasons ("not_found_in_openalex", "no_related_works") are data conditions
    and are cached; "openalex_unavailable" is transient and never cached.
    """
    cache_key = doi.lower()
    if cache_key in related_works_cache:
        items, reason = related_works_cache[cache_key]
        return items[:limit], reason

    async with OPENALEX_SEMAPHORE:
        status, work = await _get_json(
            http, f"{OPENALEX_BASE}/works/{DOI_URL_PREFIX}{doi}", {"mailto": OPENALEX_MAILTO}
        )
    if status == "not_found":
        related_works_cache[cache_key] = ([], "not_found_in_openalex")
        return [], "not_found_in_openalex"
    if status != "ok" or work is None:
        return [], "openalex_unavailable"

    related_ids = [
        rid.removeprefix(OPENALEX_ID_PREFIX) for rid in (work.get("related_works") or [])
    ][:MAX_RELATED]
    if not related_ids:
        related_works_cache[cache_key] = ([], "no_related_works")
        return [], "no_related_works"

    async with OPENALEX_SEMAPHORE:
        status, batch = await _get_json(
            http,
            f"{OPENALEX_BASE}/works",
            {
                "filter": "openalex_id:" + "|".join(related_ids),
                "per-page": len(related_ids),
                "mailto": OPENALEX_MAILTO,
            },
        )
    if status != "ok" or batch is None:
        return [], "openalex_unavailable"

    # The filter endpoint does not preserve order; restore related_works order.
    by_id = {
        (w.get("id") or "").removeprefix(OPENALEX_ID_PREFIX): w
        for w in batch.get("results", [])
    }
    items = []
    for rid in related_ids:
        item = _to_related_item(by_id[rid]) if rid in by_id else None
        if item:
            items.append(item)

    reason = None if items else "no_related_works"
    related_works_cache[cache_key] = (items, reason)
    return items[:limit], reason
