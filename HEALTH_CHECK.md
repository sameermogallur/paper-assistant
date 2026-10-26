# Health check — 2026-10-26

Full results of tonight's end-to-end check. **Summary:** everything runs and every API
endpoint behaves as designed. Six clear-cut bugs were fixed (one commit each). The serious
problems that remain are about **accuracy**, not crashes — fabricated references can come
back "verified" — and those need design decisions, so they're ranked in `GAP_ANALYSIS.md`
rather than patched.

| Area | Result |
|------|--------|
| Backend tests | ✅ 88/88 before → 89/89 after (new regression test), ~15 s |
| Frontend build / typecheck | ✅ both pass (one 549 kB JS bundle, size warning only) |
| Frontend lint | ⚠️ 491 → 489 problems, mostly `react/prop-types`; not run in CI |
| API, all 21 endpoints (42 checks incl. errors and CORS) | ✅ 42/42 returned the expected status |
| Real UI in headless Chromium (10 scenarios) | ✅ all ran; 4 bugs reproduced, then confirmed fixed |
| Streamlit `app_v2.py` with blank OpenAI key | ✅ degrades gracefully |
| `app_legacy.py` | ❌ crashes on import (`PyPDF2` not installed) — archival, flagged only |
| Your real library (read-only) | ✅ migrations at head; 1 paper, 0 projects |
| Dependencies | ⚠️ Python: 160 advisories / 14 packages; npm: 14 vulnerable (1 critical). Listed only. |

## How this was tested

- **Isolation:** the backend ran from a scratch folder with its own SQLite file and PDF
  folder, so your real `data/` was never written to. Your real database only got read-only
  queries. The OpenAI key line in `.env` was blanked (the key was revoked) and `.env` stayed
  untracked.
- **Test PDFs:**
  - a real open-access PLOS ONE trial (CC-BY; 11 pages, 39 references);
  - the arXiv "Attention Is All You Need" paper (15 pages);
  - a *scanned* version of three PLOS pages (images only, no text layer);
  - a small synthetic paper with known content: three p-values just around 0.05, a
    data-availability statement, PLOS-style "competing interests" wording, no limitations
    section, and five real plus two **fabricated** references.
- **Tools:** `httpx` for the API (sending the React app's `Origin` header, so CORS was
  exercised), Playwright 1.64.1 with headless Chromium for the UI, and Streamlit's `AppTest`
  plus the browser for Streamlit. Playwright lived only in the session scratchpad, so nothing
  was added to the project. The three scripts are saved in `docs/health-check/` for reuse.

### Re-running it

Point these at a **scratch** backend: run `alembic upgrade head` and `uvicorn` from an empty
folder, with `PYTHONPATH` set to the repo and `--app-dir` pointing at it. The API script
ingests papers and creates and deletes a project.

```bash
# Build the synthetic, scanned and not-a-PDF fixtures from any real text PDF
.venv/bin/python docs/health-check/make_fixtures.py some-paper.pdf <scratch>/gen
# Exercise all 21 endpoints (42 checks) with the React app's Origin header
.venv/bin/python docs/health-check/e2e_api.py http://127.0.0.1:8000 <scratch>/gen some-paper.pdf out.json
# Drive the real UI. Needs Playwright installed in <pw_dir> and the Vite dev server on :5173.
# <scratch> must contain gen/, dl/arxiv/paper.pdf and shots/.
# On this machine Chromium also needed libasound2: `apt-get download libasound2t64`,
# extract it with dpkg-deb -x, and pass the folder via LD_LIBRARY_PATH.
node docs/health-check/ui_e2e.mjs <pw_dir> <scratch> fresh,slow,stats,library,detail
```

## Environment

| Item | Found |
|------|-------|
| OS | WSL2, Ubuntu 26.04.1 LTS, 16 cores, 23 GB RAM |
| Python | 3.11.16 in a uv-built `.venv` (no pip inside); system `python3` is 3.14.4 |
| Node / npm | 24.21.0 / 11.19.0 |
| Tesseract / Poppler | 5.5.0 / 26.01.0 |
| Docker, gh CLI | not installed |
| SPECTER model | already cached (~420 MB) |
| venv vs lockfile | `uv pip install -r requirements-dev.lock.txt` → "no changes". `uv pip sync` would **uninstall 22 packages** (torch's CUDA libs, `triton`, `watchdog`, …): the lock was compiled off-Linux |
| Re-locking | `pip-compile` via `uvx` fails on Python 3.14 (Pillow 10.3 has no wheel); works pinned to 3.11. A fresh Linux resolve adds 24 pins and bumps loose deps (`sentence-transformers` 5.6 → 6.2, `huggingface-hub` 1 → 2, `torch` 2.12 → 2.14) |
| npm tree | `npm ls` consistent |

## Tests and static checks

- `pytest tests/`: 88 passed (12.9 s) before; 89 passed (17.4 s) after. Note: all three
  reference-verification tests run with SPECTER **off** (`USE_SEMANTIC=False`), so the default
  configuration's matching is untested (see "not fixed" below).
- `npm run typecheck`: passes. Only the TypeScript dev pages are checked (`checkJs: false`).
- `vite build`: passes in ~3–6 s; a single 549 kB JS chunk.
- ESLint, 491 problems before fixes:
  - 423 `react/prop-types` — 333 of them in the shadcn `ui/` kit
  - 39 `no-unused-vars` and 15 `react/no-unescaped-entities`
  - 6 `react-refresh/only-export-components`
  - 3 `no-undef` — Node globals in `tailwind.config.js` and `vite.config.js`
  - 2 `react/no-unknown-property` — cmdk/toast attributes; false positives
  - 1 `react-hooks/exhaustive-deps`
  - 2 `no-misleading-character-class` — **a real bug**, now fixed (see below)

## API walkthrough (42 checks, all matched)

Timings come from the scratch backend. "Cold" means the reference cache was empty.

| Check | Result |
|-------|--------|
| `/healthz`, `/version` | 200; Python 3.11.16, FastAPI 0.128.0 |
| `parse_pdf` (PLOS) | native, 11 pages, 5,871 words, 6 sections, 0.3 s |
| `parse_pdf` (scanned) | `failed_needs_ocr`, 0 characters |
| `parse_pdf_ocr` (scanned, 3 pages) | OCR, 1,615 words, 7.4 s |
| Bad input | not a PDF → 400 "Invalid PDF file"; `.txt` name → 400; empty text → 422 |
| `verify_references` (synthetic) | **7 of 7 "verified" — including both fabricated references (0.76, 0.75)** |
| `extract_statistics` (synthetic) | 4 p-values, 3 sample sizes, 3 effect sizes, 1 CI; flags as designed |
| `truthiness_score` (synthetic) | 50/D before the fix → 60/C after (data statement now earns +10) |
| `analyze_pdf` (scanned) | score 0, grade "N/A" |
| Ingest PLOS (new) | 201; 75/B; 20 of 39 references checked (17 verified, 3 suspicious); 4.5 s warm, 8.4 s cold |
| Ingest PLOS again | 200, `was_duplicate: true`, 10 ms |
| Ingest scanned | 201, **65/C** for a paper with no readable text (inconsistent with `analyze_pdf`'s 0/"N/A") |
| List / detail / similar | 13 / 5 / 6 ms; pagination and 404s correct |
| `related` | PLOS: "no related works" — its stored DOI was **truncated to `10.1371/j`**. Fake DOI: `not_found_in_openalex`. No DOI: `paper_has_no_doi` |
| Projects (create, list, get, rename, add, add again → 409, list in project, remove, delete, 404 after) | all as designed |
| CORS | every response allowed `http://localhost:5173`; a preflight from another origin was refused (400) |

## Real UI in headless Chromium

| Scenario | Before fixes | After fixes |
|----------|--------------|-------------|
| Landing → upload the arXiv paper (fresh) | progress → dashboard at 11.0 s (API took ~11 s, right at the animation's length) | — |
| Upload with analysis held for 15 s (simulating slow Crossref) | **blank page from 10.7 s to 15.1 s** | "Still analyzing…" at 10.7 s, dashboard at 15.5 s |
| Citation table, PLOS paper | **17 / 2 / 1**, while the backend says 17 / 3 / 0; a 0.45 "suspicious" shown as red "Unverified" | 17 / 3 / 0 |
| Verified rows at 75–76% | **amber** confidence bars next to green "Verified" badges | green |
| Red flag "🚩 3 p-values near 0.05" | **rendered as "� 3 p-values…"** | renders cleanly |
| Library | 3 cards; the scanned paper shows **C, 65/100** | unchanged (open bug) |
| Paper detail (PLOS) | similar papers 61% / 57% — the 57% is the scanned paper, whose embedding came from empty text; related: "OpenAlex lists no related works" (truncated DOI) | — |
| Project: create → add paper → remove | works; no way to rename or delete a project in the UI | — |
| Upload a scanned PDF | browser `alert()`: "OCR is not enabled in the hosted demo" — there is no hosted demo, and the paper was already saved as 65/C | — |
| Dark mode on `/library` | page background turns dark (rgb 10,10,10) but content and header stay light | — |
| `/styleguide`, `/styleguide/paper` | render correctly in light and dark | — |
| Browser console | no errors in any scenario | no errors |

Other UI observations:

- Uploading takes three clicks after choosing a file: "Start Analysis" (which uploads
  nothing), then "Research Paper", then waiting.
- The progress animation always runs ~10 s even when the analysis finishes in 4 s, and one
  of its steps is "Generating AI Summary" — no AI summary exists.
- Home-page uploads are titled with the filename (e.g. "synthetic"). Library titles come
  from a first-line guess.

## Blank OpenAI key

- **FastAPI backend:** never uses OpenAI.
- **`app_v2.py` (Streamlit):** starts cleanly; the "AI Summary" tab shows "OpenAI API key not
  configured…" (checked with `AppTest` and in the browser).
- **`app_legacy.py`:** crashes on import with `ModuleNotFoundError: No module named 'PyPDF2'`,
  before it ever reads the key. The project depends on `pypdf`, PyPDF2's successor. The file is
  archival, so this is flagged, not fixed — see `QUESTIONS.md` on retiring both Streamlit apps.

## Your real library (read-only)

Alembic is at head (`cd28c00f66a0`). The library holds 1 paper (the arXiv Transformer paper:
6,141 words, 55/C, analyzer 1.0.0, no DOI detected, 20 references, 1 embedding) and 0
projects. Its stored title is **"Provided proper attribution is provided, Google hereby
grants permission to"** — the arXiv license line, picked by the title heuristic.

## Fixed tonight (one commit each, on `foundation`)

| Commit | Fix | How it was verified |
|--------|-----|---------------------|
| `d483c83a` | `.env.example` line 10 contained TAB and backspace bytes (`\t`, `\b` from a Windows path) | byte check; it was the only tracked file with control characters |
| `c1925ea8` | Open-data/code bonus never fired (`"available"` vs "availability"); `ANALYZER_VERSION` → 1.0.1 | new test fails on old code, passes on new; live API 50/D → 60/C |
| `3264d0f4` | Blank page when analysis outlasts the progress animation | browser timeline, before and after |
| `8e3d46cd` | Citation table re-derived status with a 0.5 cutoff | browser counts 17/2/1 → 17/3/0; bar colors |
| `91c4ed8a` | 🚩 red flag rendered as "�" (regex without the `u` flag) | browser text check; lint warning gone |
| `583f0e6a` | Frontend README was Base44 boilerplate | — |

## Found but not fixed

These need product or methodology decisions, or are bigger than a fix. They're ranked in
`GAP_ANALYSIS.md`.

1. **Fabricated references can come back "verified."** SPECTER similarity between unrelated
   titles is ~0.5–0.9, and the thresholds were never recalibrated after switching from difflib:
   - an invented reference with no DOI → verified at 0.75–0.76;
   - a reference whose DOI belongs to a different paper → verified at 0.79 (the exact scenario
     of `test_wrong_but_resolvable_doi_is_not_verified`, which only passes because it turns
     SPECTER off);
   - a live fabricated reference carrying a real DOI → 0.91.
2. **Unreadable PDFs get 65/C on ingest** (backlog #1), and an embedding of empty text that
   then shows up in "similar papers."
3. **Transparency checks miss common wording:**
   - "Competing interests" isn't recognized as a conflict-of-interest statement (−10);
   - "approved by the … Ethical Committee" fails because the regex expects "ethic" *before*
     "approv" (−5);
   - pypdf inserts spaces inside words ("Author s", "do i.org"), which breaks matching.
   A typical PLOS paper loses 15 points it shouldn't.
4. **Markers are detected anywhere in the text, including the reference list.** A cited title
   containing "replication" earns "Discusses replication." "N = 6" (layers in a CS paper)
   counts as a small sample.
5. **DOI extraction breaks on line-wrapped DOIs** (PLOS → `10.1371/j`). OpenAlex has a junk
   record with that exact DOI, so related works could silently belong to a different paper.
6. **Titles** come from the first plausible line; authors and year are never filled in.
7. **Only the first 20 references are checked**, and `references_found` reports 20, not 39.
8. **Ingest skips the 100-page limit** that the stateless endpoints enforce.
9. **UI honesty:**
   - the fake progress animation with its "AI Summary" step;
   - the waitlist form that stores nothing but says "You're on the list!";
   - the "hosted demo" message, and `alert()` popups;
   - a missing grade defaulting to "C" in the gauge;
   - a score breakdown whose points don't add up to the real score.

## Dependencies (listed only — nothing was upgraded)

### Python: known vulnerabilities

Source: `pip-audit` against both lockfiles. The table shows the version that fixes all
advisories for each package.

| Package | Installed | Advisories | Fixed in | Bump | Why it matters |
|---------|-----------|-----------:|----------|------|----------------|
| pypdf | 6.6.0 | 54 | 6.21.2 | minor | **parses every uploaded PDF** — highest priority |
| pillow | 10.3.0 | 48 | 13.0.0 | **major** | OCR path (images) |
| gitpython | 3.1.50 | 25 | 3.2.1 | minor | only via Streamlit |
| python-multipart | 0.0.18 | 6 | 0.0.31 | patch | parses every upload form |
| tornado | 6.5.7 | 6 | 6.5.9 | patch | only via Streamlit |
| starlette | 0.50.0 | 5 | 1.3.1 | **major** | FastAPI's core; needs a FastAPI upgrade (0.128 pins `<0.51`) |
| anyio | 4.14.1 | 3 | 4.14.2 | patch | async runtime |
| filelock | 3.29.6 | 3 | 4.2.1 | **major** | via torch / Hugging Face |
| streamlit | 1.35.0 | 3 | 1.54.0 | minor | legacy UI only |
| urllib3 | 2.7.0 | 3 | 2.8.0 | minor | via requests |
| certifi | 2026.6.17 | 1 | 2026.10.19 | date-based | TLS root certificates |
| protobuf | 4.25.9 | 1 | 6.33.5 | **major** | via Streamlit |
| python-dotenv | 1.0.1 | 1 | 1.2.2 | minor | |
| torch | 2.12.1 | 1 | 2.13.0 | minor | |

Totals:

- **160 advisories across 14 packages.** 103 of them (10 packages) can be fixed without a
  major version bump.
- Retiring the two Streamlit apps would drop Streamlit, gitpython, tornado and protobuf —
  about 35 advisories — plus the `openai` and `pandas` dependencies.

### Python: outdated direct dependencies

There are 18 outdated direct dependencies (84 packages are outdated in total).

- **Minor or patch:** alembic 1.18.5 → 1.20.1, fastapi 0.128.0 → 0.162.0, httpx 0.27.0 →
  0.28.1, pydantic 2.7.1 → 2.14.1, pypdf 6.6.0 → 6.21.2, pytesseract 0.3.10 → 0.3.13,
  pytest-asyncio 1.4.0 → 1.4.1, python-dotenv 1.0.1 → 1.2.4, python-multipart 0.0.18 →
  0.0.32, sqlalchemy 2.0.51 → 2.1.6, streamlit 1.35.0 → 1.66.1, uvicorn 0.29.0 → 0.54.0.
- **Major:** cachetools 5 → 7, openai 1 → 3, pandas 2 → 3, pillow 10 → 13,
  sentence-transformers 5 → 6, watchfiles 0.21 → 1.3.

### npm: known vulnerabilities

`npm audit` finds 14 vulnerable packages: 1 critical, 10 high, 3 moderate. Every one except
`zod` is fixable without a major bump (`npm audit fix`).

- **Direct dependencies:**
  - `vite` ≤ 6.4.3 (high; dev-server `launch-editor` issues)
  - `postcss` ≤ 8.5.22 (high)
  - `react-router-dom` 7.18.1 (high; the advisory concerns RSC mode, which AIRA doesn't use)
  - `zod` < 4.6.6 (high; **major** to fix)
- **Transitive:** `shell-quote` (**critical**, command injection in `quote()`),
  `brace-expansion`, `browserslist`, `js-yaml`, `nanoid`, `source-map-js` (high),
  `@humanfs/node`, `baseline-browser-mapping`, `postcss-selector-parser` (moderate).
- Most of these are build-time tooling rather than code shipped to the browser.

### npm: outdated

56 packages are behind; 20 of them by a major version. The notable majors are React 19,
Tailwind 4, Vite 8, ESLint 10, zod 4, `react-router-dom` (patch only), `lucide-react` 1.x,
`date-fns` 4, `framer-motion` 14 and `recharts` 3.

### Already proposed by Dependabot

There are 12 open branches on GitHub:

- **GitHub Actions:** `actions/checkout` 7, `actions/setup-python` 7.
- **npm:** autoprefixer, globals 17, postcss, radix dialog, zod 4.4.3.
- **pip:** hf-xet, huggingface-hub 1.25.1, openai 2.49.0, typer, watchfiles 1.2.0.
