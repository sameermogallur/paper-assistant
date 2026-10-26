# Morning report — 2026-10-26

**TL;DR**
- **It all runs.** I ran AIRA end to end: every API endpoint, the real UI in a headless
  browser, and Streamlit. All 42 API checks and all 89 tests pass.
- **I fixed six clear-cut bugs** (one commit each), refreshed CLAUDE.md, and wrote the docs
  you asked for. There are 16 commits on `foundation`. Nothing is pushed or merged.
- **The big finding isn't a crash.** In its default setup, **AIRA can mark fabricated
  references as "verified."** That undercuts its main promise, so it's the first thing I'd fix.

## Read in this order (~15 min)
1. **`QUESTIONS.md`** — 8 decisions only you can make; Q1–Q5 matter most.
2. **`GAP_ANALYSIS.md`** — "The short version", then (d), the three proposed milestones.
3. `HEALTH_CHECK.md` for details; `ARCHITECTURE.md` when you want the map.
4. `PROJECT_BRIEF.md` is up to date — that's the version for your Claude project.

## Fixed tonight
| Commit | What was wrong | Proof |
|--------|----------------|-------|
| `c1925ea8` | Open-data/code bonus could never apply (word mismatch). Analyzer version → 1.0.1 | new test; live 50/D → 60/C |
| `8e3d46cd` | Citation table counted 17/2/1 while the report said 17/3/0 | browser, before/after |
| `3264d0f4` | Blank page when analysis outlasted the 10-second animation | browser timeline |
| `91c4ed8a` | The "🚩 p-values near 0.05" flag showed as "�" | browser |
| `d483c83a` | Hidden control characters in `.env.example` | byte check |
| `583f0e6a` | Frontend README was Base44 template text | — |

## Found, not fixed (needs a decision, or bigger than a fix)
1. **Fabricated references verified at 0.75–0.91.** SPECTER makes unrelated titles look
   similar, and the thresholds were never recalibrated. The tests didn't catch it because
   they switch SPECTER off. I corrected CLAUDE.md's "do not re-raise" note about this.
2. **Scanned PDFs get a confident 65/C** (backlog #1).
3. **Missed wording:** "Competing interests" and "approved by the Ethical Committee" aren't
   recognized, and words in the reference list count as transparency signals. The PLOS test
   paper lost 15 points.
4. **Wrong metadata:** your library's one paper is titled *"Provided proper attribution is
   provided, Google hereby grants permission to"*, and PLOS DOIs get truncated.
5. **`app_legacy.py` crashes on startup** (`PyPDF2` isn't installed). It's archival, so I
   only flagged it.
6. **Dependencies:** 160 Python advisories (`pypdf` alone has 54, and it reads every upload)
   and 14 vulnerable npm packages (1 critical). Listed only, as agreed.

## Good to know
- **`.env`:** `OPENAI_API_KEY` is blanked; `.env` was never committed and is still ignored.
- **Your data:** `data/` wasn't modified. I tested against scratch copies; your database only
  got read-only queries.
- **Setup:** CLAUDE.md's setup no longer worked on this machine. It now documents the uv
  commands, warns that `uv pip sync` would break torch, and adds the missing
  `alembic upgrade head` step.
- **Name:** Frontiers already runs an integrity tool called **AIRA** (Q5).
- **Servers:** all stopped. To run the app:
  `source .venv/bin/activate && alembic upgrade head && uvicorn backend:app --reload --port 8000`,
  then `cd frontend && npm run dev`, then open http://localhost:5173.

## Suggested agenda for today (~60–90 min)
1. **10 min:** Q7 (time and order) and Q1 (audience; GO/NO-GO).
2. **20 min:** the A0 review — open `/styleguide/paper` and decide Q3a–d.
3. **15 min:** Q4 (score or checklist) and Q5 (name).
4. **5 min:** Q8 — OK to patch `pypdf` and `python-multipart`?
5. **Then:** start M1 by building the labelled reference test set.

**Branch:** review with `git log --oneline main..foundation`, then `git checkout main && git
merge foundation` when you're happy. Each commit is small, so it's easy to drop one you don't
want.
