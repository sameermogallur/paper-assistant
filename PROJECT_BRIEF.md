# AIRA — Project Brief

*Snapshot 2026-10-26, end of the "foundation" pass · Owner: Sameer Mogallur ·
github.com/sameermogallur/paper-assistant (local: `~/projects/paper-assistant`, WSL2) ·
License: AGPL-3.0*

## What it is
AIRA ("AI Research Assistant") checks research papers for integrity and reproducibility
warning signs. Upload a PDF and it:
- **checks every reference** against Crossref (the public registry of published papers) and
  labels each *verified*, *suspicious* or *not found*;
- **pulls out statistics** (p-values, sample sizes, effect sizes, confidence intervals) and
  flags patterns like p-values bunched near 0.05;
- **scores transparency** from 0–100 with an A–F grade, using simple rules about
  open-science markers (limitations, conflict-of-interest and ethics statements,
  pre-registration, data/code availability). It's a signal, not a verdict, and it has never
  been validated;
- **keeps a library** of analyzed papers, with projects, "similar papers" via SPECTER (a free
  AI model that turns text into numbers) and related work from OpenAlex.

It's a single-user app that runs on your own computer: a React website talking to a Python
(FastAPI) API with a SQLite database. It's a portfolio project for bioinformatics / AI-ML
roles; the goal is a polished, deployable product.

## Where things stand
- **Works:** every API endpoint, the library, projects, similar/related papers, and the React
  UI (no console errors). 89 backend tests pass.
- **Tonight (branch `foundation`, not merged or pushed):**
  - a full health check, including the real UI in a headless browser;
  - six small fixes — open-data bonus never applied, citation table miscounting, blank page
    on slow uploads, a broken "🚩" character, a corrupted config example, and a template
    README;
  - new docs: ARCHITECTURE, GAP_ANALYSIS, QUESTIONS, HEALTH_CHECK.
- **Biggest problem:** the integrity results aren't trustworthy yet (see below).
- **UI redesign:** paused after step one (A0, July 22–23), awaiting a review. Live pages
  still look like the original Base44 template.
- **Strategy decision** (hosted product or not), due late August: not made.

## Key numbers
| | |
|---|---|
| Backend tests | 89, all passing |
| API endpoints / database tables | 21 / 6 (42 of 42 API checks passed tonight) |
| Frontend | builds and type-checks; ESLint shows 489 problems, mostly style (not in CI) |
| Upload time | ~4–11 s per paper (mostly waiting on Crossref); first 20 references checked |
| Analyzer version | 1.0.1 (bumped tonight because the score rules changed) |
| Security advisories | Python: 160 across 14 packages (103 fixable without major upgrades); npm: 14 packages (1 critical) |
| Hosting estimate | ~4 GB RAM server, about $20–40/month, driven by SPECTER |

## Biggest known problems (confirmed, not yet fixed)
1. **Fabricated references can be marked "verified."** SPECTER rates unrelated titles as
   fairly similar, and the thresholds were never recalibrated. Invented references scored
   0.75–0.91. The existing tests miss this because they turn SPECTER off.
2. **Scanned PDFs with no readable text get a confident 65 / C.**
3. **Transparency checks miss common wording** ("Competing interests"; "approved by the …
   Ethical Committee") and count words found in the reference list.
4. **Metadata is often wrong.** Your library's paper is titled with its arXiv license
   sentence; PLOS DOIs get truncated; authors and year are never filled in.
5. **Misleading UI:** a fixed ~10-second progress animation with a fake "Generating AI
   Summary" step, a waitlist form that saves nothing, and pop-up alerts.

## Open decisions (details in QUESTIONS.md)
1. **Who it's for, and GO / NO-GO / PIVOT.** Recommended: ship a read-only demo first; aim at
   researchers checking their own drafts.
2. **What "deployable" means first.** Recommended: a read-only public demo, then
   self-hostable Docker. Is $20–40/month OK?
3. **The A0 design calls.** Recommended: neutral colors, serif paper titles, left sidebar.
4. **Score design.** Recommended: a checklist of signals instead of a single grade, until the
   score is validated.
5. **The name.** Frontiers already runs an integrity tool called **AIRA**. Recommended: rename
   before going public.
6. Smaller calls: delete the legacy Streamlit apps; time budget and order; apply non-major
   security updates.

## Next steps (proposed in GAP_ANALYSIS.md)
1. **M1 — trustworthy numbers (2–3 sessions):** labelled test set, recalibrated reference
   checks, no grade for unreadable PDFs, wording fixes, test coverage in CI.
2. **M2 — A0 review → new app shell and paper screen (4–6 sessions):** opens on the library,
   a real upload status, a rebuilt Library and paper page on the new design tokens.
3. **M3 — read-only public demo (2–3 sessions):** verified Docker build, curated open-access
   papers, hosting, README screenshots.

**Dev machine:** WSL2 Ubuntu 26.04; Python 3.11 in a uv-made `.venv` with no pip (use
`uv pip install -r requirements-dev.lock.txt`, never `uv pip sync`); Node 24; no Docker.
More in `CLAUDE.md`, `ARCHITECTURE.md`, `VISION.md` and `frontend/DESIGN.md`.
