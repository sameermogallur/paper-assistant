# AIRA — Project Brief

*Snapshot 2026-10-26 · Owner: Sameer Mogallur · github.com/sameermogallur/paper-assistant (local: `~/projects/paper-assistant`, WSL2) · License: AGPL-3.0*

## What it is
AIRA ("AI Research Assistant") checks research papers for integrity and reproducibility warning signs. Upload a PDF and it:
- **checks every reference** against Crossref (the public registry of published papers) and labels each one *verified*, *suspicious* or *not found*, with a confidence score;
- **pulls out statistics** (p-values, sample sizes, effect sizes, confidence intervals) and flags patterns like p-values bunched near 0.05;
- **scores transparency** from 0–100 with an A–F grade, using simple rules about open-science markers (limitations, conflict-of-interest and ethics statements, pre-registration, power analysis, data/code availability, replication). It is a signal, not a verdict, and it has never been validated;
- **keeps a library**: saved papers, projects, "similar papers you already have", and related work from OpenAlex (a free catalog of scholarly papers).

It's a single-user app that runs on your own computer (no accounts). It's a portfolio project for bioinformatics / AI-ML roles; the goal is a polished, deployable product.

## How it's built
A React website (port 5173) talks to a Python API (FastAPI, port 8000). The API keeps everything in one SQLite database file plus a folder of PDFs, calls Crossref and OpenAlex over the internet, and runs SPECTER locally — a free AI model that turns a paper into 768 numbers so similar papers can be found. It needs no API keys, only a contact email for Crossref. OpenAI is used only by the old, frozen Streamlit apps.

## Where things stand
- **Built:** analysis pipeline, library, projects, similar papers, related works, and a basic React UI. All backend tests pass.
- **UI redesign paused after step one ("A0", July 22–23):** design tokens (named colors and sizes), a `/styleguide` page and one mocked paper screen. The planned review of that step never happened, so the real redesign (A1–A3) hasn't started; the live pages still look like the original Base44 template.
- **Strategy decision overdue:** VISION.md planned a go / no-go / pivot call on becoming a hosted multi-user product for late August 2026, informed by 15 research questions (VISION.md §7). No decision or research results are recorded.
- **Activity:** last code change 2026-09-20. A "foundation" plan (health check, five small fixes, architecture docs, gap analysis) was proposed on 2026-10-26 and is awaiting approval.

## Key numbers
| | |
|---|---|
| Backend tests | 88, all passing (2026-10-26) |
| API endpoints / database tables | 21 / 6 |
| Code | ~2,100 lines Python app, ~1,550 lines tests, ~4,600 lines frontend (excluding the UI kit) |
| Frontend checks | TypeScript check passes; ESLint (style checker) reports 491 problems, mostly style; it isn't part of the automated GitHub checks |
| Limits | PDF up to 10 MB / 100 pages; only the first 20 references are checked |
| Citation labels | verified at ≥ 75% confidence, suspicious at ≥ 45%, otherwise not found |
| Score rules | Start at 100. −20 no limitations, −15 several p-values near 0.05, −10 no conflict-of-interest statement, −10 small samples, −5 no ethics approval; +10 pre-registration, +10 open data, +5 power analysis, +5 replication. A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, else F |
| Hosting estimate (VISION.md) | ~4 GB RAM server, about $20–40/month; SPECTER sets that floor |
| Waiting dependency updates | 12 automatic update branches (Dependabot) on GitHub |

## Known problems (confirmed, not yet fixed)
- A scanned PDF with no readable text still gets a confident **65 / C**.
- The **open data/code bonus never applies**: the scorer looks for the word "available", but the detector writes "availability".
- Citation results are under-used: the citation table re-labels them with its own thresholds (so its counts can disagree with the report), and the score ignores them entirely.
- Misleading UI: the progress screen is a fixed ~10-second animation that includes "Generating AI Summary" (no AI summary exists), the waitlist form saves nothing, and an error message mentions a "hosted demo" that doesn't exist.
- Titles are guessed from the PDF's first lines; authors and year are never filled in; papers can't be deleted.

## Open decisions
1. **Strategy:** hosted multi-user product, polished portfolio piece, or pivot to a screening API for publishers? Were the VISION.md §7 research questions ever run?
2. **What "deployable" means first:** a read-only public demo with preloaded open-access papers, a self-hostable Docker app, or a full multi-user service?
3. **Design (the A0 review):** one accent color or neutral only; serif or sans-serif paper titles; top bar or left sidebar.
4. **Score design:** should citation checks count toward the score, and should the letter grade stay or become a checklist of signals?

## Next steps (proposed, not yet approved)
1. Approve or adjust the 2026-10-26 foundation plan.
2. Make the numbers trustworthy: no grade for unreadable PDFs; fix the open-data bonus and the citation labels; add tests for the scoring code.
3. Hold the A0 review, then build the new app shell (opens on the library; upload becomes an action) and rebuild the Library and paper screens.
4. Make the strategy decision. A read-only hosted demo helps whatever the outcome.

## Dev machine
WSL2 Ubuntu 26.04. Python 3.11 lives in a `uv`-made `.venv` that has no pip: install with `uv pip install -r requirements-dev.lock.txt`, not `uv pip sync` (which would remove torch's CUDA libraries). Node 24, Tesseract and Poppler are installed; there's no Docker, so the Docker setup is untested. More detail: `CLAUDE.md` (technical), `VISION.md` (strategy), `frontend/DESIGN.md` (design).
