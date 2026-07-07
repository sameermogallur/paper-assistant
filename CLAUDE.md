# AIRA — AI Research Assistant

AIRA analyzes research papers for integrity and reproducibility signals. Upload a PDF and it extracts text (with OCR fallback via Tesseract + Poppler), verifies every citation against the Crossref database with confidence scoring, extracts statistical indicators (p-values, sample sizes, effect sizes, confidence intervals), detects in-text citation markers, and returns a structured `IntegrityReport` with a heuristic integrity score (0–100, letter-grade A–F) based on open-science transparency markers.

## Architecture

```
User → React frontend (Vite)   port 5173 ──┐
User → Streamlit app_v2.py     port 8501 ──┤──▶ FastAPI backend.py  port 8000 ──▶ Crossref API
```

### Key files

| File | Role |
|------|------|
| `backend.py` | FastAPI entry point — all analysis logic (945 lines) |
| `frontend/` | React + Vite + Tailwind + shadcn/ui — primary UI |
| `app_v2.py` | Legacy Streamlit frontend — calls FastAPI backend; still functional, secondary path |
| `app_legacy.py` | Original standalone Streamlit app (pre-API architecture, OpenAI-dependent, no Crossref, no OCR). Kept as reference only — do not run in production. |

## Prerequisites (one-time)

```bash
# macOS
brew install tesseract poppler

# Ubuntu/Debian
sudo apt-get install tesseract-ocr poppler-utils
```

## Local Development

### Venv setup

```bash
python3.11 -m venv .venv --clear
source .venv/bin/activate
pip install -r requirements.txt
```

### Backend

```bash
source .venv/bin/activate
uvicorn backend:app --reload --port 8000
# Verify: curl http://localhost:8000/healthz
```

### React frontend (primary)

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

### Streamlit frontend (legacy)

```bash
source .venv/bin/activate
streamlit run app_v2.py    # → http://localhost:8501
```

### Tests

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `CROSSREF_EMAIL` | **Yes** | `test@example.com` | Sent in Crossref User-Agent header for API politeness |
| `OPENAI_API_KEY` | No | — | AI summary in `app_v2.py` only; `backend.py` does not use it |
| `MAX_PDF_SIZE_MB` | No | `10` | |
| `MAX_PDF_PAGES` | No | `100` | |
| `MAX_OCR_PAGES` | No | `20` | |
| `CROSSREF_CONCURRENT_REQUESTS` | No | `3` | Semaphore limit for concurrent Crossref calls |
| `POPPLER_PATH` | No | — | Windows only: path to poppler `bin/` directory |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins |
| `USE_SEMANTIC_MATCHING` | No | `1` | Set to `0` to fall back to difflib `title_similarity()` for citation scoring |

## API Endpoints

Base URL: `http://localhost:8000`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/healthz` | Health check |
| GET | `/version` | Dependency version info |
| POST | `/api/parse_pdf` | Extract text from PDF (native pypdf) |
| POST | `/api/parse_pdf_ocr` | Extract text via OCR (Tesseract, for scanned PDFs) |
| POST | `/api/verify_references` | Verify reference list against Crossref (fuzzy + DOI matching) |
| POST | `/api/find_intext_citations` | Extract in-text citation markers |
| POST | `/api/extract_statistics` | Extract p-values, sample sizes, effect sizes, CIs |
| POST | `/api/truthiness_score` | Compute heuristic integrity score |
| POST | `/api/analyze_pdf` | Full pipeline — combined endpoint used by the frontend |

## Git Conventions

- **No AI attribution in commits.** Do not add `Co-Authored-By: Claude` or any AI co-author trailer to commit messages.
- Commit messages should be imperative-mood, concise, and describe the *why* not just the *what*.
- Do not commit `.venv/`, `venv/`, `.env`, or `node_modules/`. These are in `.gitignore`; if they appear tracked, run `git rm -r --cached <path>`.

## Roadmap / Backlog

### Done
- **`asyncio.gather()` parallelization** in `/api/analyze_pdf` (`backend.py:910`) — all four sub-analyses run concurrently
- **Regex precompilation** at module level (`backend.py:61–68`) — `SECTION_PATTERNS` compiled once on import, not per request
- **`requirements.txt` security updates + venv rebuild** — pypdf → 6.6.0, python-multipart → 0.0.18, fastapi → 0.128.0. Installed and confirmed.
- **O(n²) string concat fix** in `parse_reference_list` (`backend.py:270–278`) — replaced loop concatenation with list accumulation + `" ".join()`
- **Test skeleton + CI** — `tests/test_backend.py` (17 tests) + `.github/workflows/test.yml`
- **`extract_title_from_ref()` fix** (`backend.py`) — old regex captured the author list (everything before the first period) instead of the paper title. New function handles APA-style `(YEAR). Title.` and Vancouver-style `Author. Title. Journal.` patterns.
- **SPECTER semantic embeddings** for citation matching — replaced `difflib.SequenceMatcher` in `verify_references()` with `allenai-specter` (sentence-transformers). Encodes all Crossref candidates for a reference in a single batched forward pass. Controllable via `USE_SEMANTIC_MATCHING` env var (default `1`). Old `title_similarity()` kept as fallback. Model loads at startup via lifespan hook.

### Planned next

### Deferred (documented — stubbed as "Coming Soon" in the UI)

The following are already wired into the frontend as disabled/placeholder elements (`FeatureGrid.jsx`, `ContentTypeSelector.jsx`, `UrlInput.jsx`). Captured here so they don't get re-discovered from scratch:

| Feature | Where stubbed | Notes |
|---------|---------------|-------|
| Frontend memoization / React Query / virtualization | `CitationTable.jsx`, `airaApi.js` | `useMemo`/`useCallback`, `@tanstack/react-query`, `@tanstack/react-virtual` |
| OpenAlex related-papers | `app_v2.py:563` | Natural follow-on to SPECTER2; OpenAlex has 250M+ scholarly works via free API |
| AI Research Chat | `FeatureGrid.jsx` (`comingSoon: true`) | Ask questions about the analyzed paper |
| Synthesis Matrix | `FeatureGrid.jsx` (`comingSoon: true`) | Multi-paper side-by-side comparison + literature review |
| URL-based input (arXiv links) | `UrlInput.jsx` | Analyze by URL rather than file upload |
| News article analysis | `ContentTypeSelector.jsx`, `Home.jsx:200` | Different content-type path, UI button disabled |
| Citation network visualization | `app_v2.py:563` | |
| Paper library with search | `app_v2.py:563` | |
