import asyncio
from cachetools import TTLCache
from app.config import CROSSREF_CONCURRENT

CROSSREF_SEMAPHORE = asyncio.Semaphore(CROSSREF_CONCURRENT)
OCR_SEMAPHORE = asyncio.Semaphore(2)

# 24-hour TTL, max 5 000 entries
reference_cache: TTLCache = TTLCache(maxsize=5000, ttl=86400)
