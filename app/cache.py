import asyncio
from cachetools import TTLCache
from app.config import CROSSREF_CONCURRENT, OPENALEX_CONCURRENT

CROSSREF_SEMAPHORE = asyncio.Semaphore(CROSSREF_CONCURRENT)
OPENALEX_SEMAPHORE = asyncio.Semaphore(OPENALEX_CONCURRENT)
OCR_SEMAPHORE = asyncio.Semaphore(2)

# 24-hour TTL, max 5 000 entries
reference_cache: TTLCache = TTLCache(maxsize=5000, ttl=86400)

# Related-works lookups keyed by lowercased DOI, storing (items, reason)
related_works_cache: TTLCache = TTLCache(maxsize=1000, ttl=86400)
