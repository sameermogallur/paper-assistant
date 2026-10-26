# AIRA gap analysis — 2026-10-26

Where AIRA stands against its own plans (`VISION.md`, `frontend/DESIGN.md`, `CLAUDE.md`),
how it compares with six well-known research tools, and the next three milestones. Evidence
comes from tonight's health check (`HEALTH_CHECK.md`) and from reading the code.

**Legend:** ✅ works · 🟡 rough (works, with real problems) · ❌ broken (runs, but gives wrong
results or can't be used) · ⬜ not started

## The short version

- **The plumbing is solid.** Every endpoint works, the library and projects persist, 89
  tests pass, and the UI runs without console errors.
- **The integrity claims are not yet trustworthy.** That's the core of the product, so it
  matters most. The four biggest gaps:
  1. **Fabricated references can come back "verified."** SPECTER rates even unrelated titles
     as 0.5–0.9 similar, and the confidence thresholds were never recalibrated after
     switching to it. Two invented references scored 0.75–0.76 ("verified"). A reference
     whose DOI points at a different paper scored 0.79–0.91. The existing tests pass only
     because they turn SPECTER off.
  2. **Unreadable (scanned) PDFs get a confident 65/C.**
  3. **The transparency checks miss common wording** ("Competing interests"; "approved by
     the Ethical Committee") and pick up words from the reference list. The PLOS test paper
     lost 15 points it shouldn't have (PLOS always uses the "competing interests" wording).
  4. **Paper metadata is often wrong.** Your library's one paper is titled with its arXiv
     license sentence. PLOS DOIs get truncated, so "related works" can come from the wrong
     paper.
- **The UI redesign stopped at A0** (tokens, a styleguide and one mocked screen, July 23).
  The live app still looks and behaves like the original template, including a fake progress
  animation and a waitlist form that stores nothing.
- **Strategy decision overdue.** The go / no-go gate (due late August) has no recorded
  outcome.

## (a) Vision features vs today

### Core analysis (VISION.md §1)

| Feature | Status | Evidence / notes |
|---------|--------|------------------|
| PDF text extraction | ✅ | 0.3 s for 11 pages. Caveat: pypdf sometimes inserts spaces inside words ("Author s", "do i.org"), which hurts later pattern matching. |
| OCR for scanned PDFs | 🟡 | `/api/parse_pdf_ocr` works (3 pages in 7.4 s) but isn't part of upload. The UI tells users "OCR is not enabled in the hosted demo" — there is no hosted demo. |
| Reference verification vs Crossref | ❌ | Runs fast and labels every reference, but can't be trusted to flag fabricated ones (see "short version", item 1). Only the first 20 references are checked (`references.py:206`), and the report says "20 found" for a 39-reference paper. |
| Statistics extraction | 🟡 | Finds p-values, sample sizes, effect sizes and CIs by pattern. No surrounding sentence is captured (the planned `StatClaim` work). "N = 6" layers in a CS paper counts as a small sample. |
| Integrity score | 🟡 | Open-data bonus fixed tonight. Still: COI and ethics wording misses; markers counted from the reference list; ignores the citation results entirely; never validated (backlog #9). |
| Score for unreadable PDFs | ❌ | Ingest gives 65/C; the stateless endpoint gives 0/"N/A" for the same file (backlog #1). |
| In-text citation detection | ✅ | Counts `[12]` and `(Smith, 2020)` markers; simple but correct on the fixtures. |
| Persistent library + dedup | ✅ | Same file twice → stored result in 10 ms. Dedup is by file bytes, so the same paper from two sources becomes two entries (backlog #10). |
| Projects | 🟡 | Backend: full create/read/update/delete, verified. UI: create, add and remove only — no rename or delete; the add-paper picker loads the whole library (backlog #11). |
| Similar papers (SPECTER) | ✅ | 6 ms. Unreadable papers get an embedding of empty text and still appear as "57% similar." |
| Related works (OpenAlex) | 🟡 | Works when a DOI is found. arXiv papers often have none, and PLOS DOIs get truncated (`10.1371/j` — which OpenAlex actually resolves to an unrelated junk record). |
| Title / authors / year | ❌ | Title is a first-line guess (your library: the arXiv license sentence; PLOS: only the first line of a two-line title). Authors and year are never filled in (backlog #8). |
| Delete a paper | ⬜ | No endpoint, no UI. |
| Export a report | 🟡 | JSON download only right after a fresh upload; not from the Library or a paper page. |

### Track A — UI redesign (VISION.md §4)

| Item | Status | Notes |
|------|--------|-------|
| A0: tokens, `/styleguide`, mocked PaperDetail | ✅ | Done 2026-07-22/23; the review checkpoint never happened, so A1 is blocked. |
| A1: app shell + IA, library-first, upload as an action, async-shaped upload | ⬜ | `/` is still a marketing landing page; upload is the homepage flow. |
| A2: Library → PaperDetail → upload rebuilt | ⬜ | |
| A3: ProjectDetail, panels, a11y/responsive/dark polish, screenshots + GIF | ⬜ | |
| Delete list (landing, waitlist, news panels, mock code in `Home.jsx`) | ⬜ | All still present. The waitlist says "You're on the list!" but saves nothing. |
| TypeScript for rebuilt surfaces | 🟡 | Strict `tsconfig` and the two dev pages only. |
| "Professional, not vibe-coded" bar | 🟡 | See part (b). |

### Pre-gate backend shortlist (VISION.md §3)

| Item | Status | Notes |
|------|--------|-------|
| SPECTER encode off the event loop | ✅ | |
| Dockerfile + compose | 🟡 | Written, never built: no Docker on the dev machine. |
| Lockfiles + Dependabot | 🟡 | Lockfiles aren't reproducible on Linux (missing torch's CUDA pins; `uv pip sync` would break torch). 12 Dependabot branches are waiting. |
| CORS / env hygiene | ✅ | Verified tonight: explicit origins, foreign origins refused. No validation that required settings are present. |

### Strategy, forks and hardening

| Item | Status | Notes |
|------|--------|-------|
| Track B research (VISION §7, 15 questions) | ? | No results in the repo. |
| Go / no-go / pivot gate | ⬜ | Due ~late Aug 2026; overdue. |
| F1–F5: multi-tenant, Postgres, object storage, auth, background jobs | ⬜ | Post-gate by design. |
| Security headers, structured logging, Sentry/metrics | ⬜ | |
| Secrets | 🟡 | `.env` was never committed. The OpenAI key was revoked and blanked tonight. |
| Upload hardening | 🟡 | Size cap only. Ingest skips the 100-page cap that the other endpoints enforce; OCR has no timeout. |
| Read-only hosted demo (VISION §6 "either-way hedge") | ⬜ | |
| Conflict detection (NO-GO depth feature) | ⬜ | |

### Risk-register items (VISION.md §8)

| Item | Status | Notes |
|------|--------|-------|
| Show `analyzer_version` in the UI, with a re-run option | ⬜ | Stored on every report but not returned by the API; no re-run endpoint. |
| Embedding-model identifier | ⬜ | Needed before any model swap, including the `sentence-transformers` 6 upgrade a re-lock would pull in. |
| Persistent reference cache | ⬜ | In-memory only; lost on restart. |
| "Transparency signals" framing, private by default | 🟡 | Private by construction (local). The UI still says "Quality Grade" and shows red/orange letter grades on library cards. |

### Long-term ideas (CLAUDE.md)

All ⬜: statistics with context sentences (`StatClaim`), conflict detection, PDF viewer and
annotations, RAG chat / LLM takeaways, citation-network view, URL/arXiv ingestion, BibTeX
export, full-text search, tags and reading status, Zotero import.

## (b) A0 design work vs the current frontend

**In one line:** A0 is a clean, well-documented foundation that has waited three months for
review. No production page uses it yet.

| DESIGN.md rule | A0 dev pages | Production today |
|----------------|--------------|------------------|
| Opens into the workspace (library-first) | Mock assumes Library / Projects navigation | `/` is a hero + features + waitlist landing page |
| Color only where it means something | Neutral surfaces; status + grade tokens | Indigo/violet gradients; ad-hoc emerald/amber/red; old `grades.js` palette |
| Status taxonomy: verified / suspicious / not found, icon + label | Yes | "Verified / Partial Match / Unverified" — now driven by the backend's status (fixed tonight); wording differs |
| Type scale 12–24 px, `tabular-nums` for numbers | Yes | `text-3xl` headings, mixed sizes; tabular numbers rare |
| Borders, not shadows | Yes | Hover shadows on cards, large shadows on buttons |
| Motion: 150 ms state changes only, no framer-motion | Yes | framer-motion entrance animations on most components |
| Dark mode parity | Light + dark tokens; toggle works | ThemeProvider is active, but pages hardcode light colors: in dark mode only the page background changes (verified in the browser) |
| Designed loading / empty / error states; no `alert()` | n/a (static) | Spinners, a few empty/error states, three `alert()` calls |
| Copy: "transparency signals", never verdicts | "heuristic score · not peer review" | "Quality Grade", "AI Summary", "Want more features? Join Waitlist" |
| Accessibility floor (sortable tables, focus rings) | `aria-sort` in the mock | Not audited; tables can't be sorted |

**What the mocked paper screen assumes that the backend doesn't provide yet:**

- **Authors, year, venue** in the header — never populated (backlog #8).
- **"analyzer v1.0.0"** in the header — stored, but not returned by the API (small addition).
- **"Re-run analysis"** button — no endpoint (new feature).
- **"Export report"** — JSON export exists only in the upload flow (frontend-only change).
- **"Add to project"** on the paper page — the API exists; only the project page has the UI.
- **"Citations verified 31 of 38"** in the transparency-signals rail — the score ignores
  citations today, and verification needs recalibration first.

**Open A0 checkpoint questions** (accent color, title font, shell shape) are in
`QUESTIONS.md` Q3, with recommendations.

## (c) Competitor scan

Public information gathered on 2026-10-26 from official product, pricing and help pages and
dated reviews. Anything not confirmable is marked *unverified*. Prices are USD.

| Tool | What it is | Does especially well | Integrity features | Price (Oct 2026) |
|------|-----------|----------------------|--------------------|------------------|
| **scite** (Research Solutions since 2023) | Search and AI assistant built on citation statements | Every citing sentence is labelled supporting / contrasting / mentioning, shown in context; badges on publisher pages; 1.6B+ citations; MCP integration (Feb 2026) | **Reference Check:** upload a manuscript and get each reference's editorial notices (retractions, corrections) and citation tallies, ranked by concern. Fabricated or non-existent references aren't documented; no statistics or transparency checks | Basic $20/mo, Pro $50/mo; 7-day trial |
| **Elicit** | AI search, data extraction, reports, systematic reviews | Table-first workspace with user-defined extraction columns and sentence-level citations; ~138M papers; Research Agent, API and MCP (2025–26) | None found. Mixed results flagging retractions in 2025 tests | Free Basic; Pro $49/user/mo (industry list, annual) |
| **Consensus** | AI answers to research questions from the literature | Results page shows evidence status: a yes/possibly/mixed/no "Consensus Meter", colour-coded citations, rigor badges, filters by design and sample size; runs inside ChatGPT, Claude and Copilot | "Verify Citations" skill (Oct 2026) checks whether each cited source *supports a claim* in your draft. It doesn't say it checks existence or retractions | Free tier; Pro $20/mo, Deep $65/mo |
| **Semantic Scholar** (Ai2, nonprofit) | Free literature search and open data API (200M+ papers) | The open data layer others build on; "highly influential" citation flags; Semantic Reader; Ai2's Asta agents (Aug 2025) | None | Free, including the API |
| **ResearchRabbit** (Litmaps since May 2025) | Citation-network discovery | Seed-paper "rabbit hole" exploration with similar/earlier/later works and graphs; rebuilt Oct 2025 | Retraction filter (paid tier only) | Free; RR+ $12.50/mo |
| **Connected Papers** | One-shot visual map of papers similar to a seed paper | Similarity by co-citation; instant overview of a field | None | 5 free graphs/month; Academic $6/mo; no announcements since 2022 |

**Other integrity tools worth knowing:**

- **GPTZero Hallucination Check** flags citations it can't find. It found at least one
  confirmed fake citation in 50 of 300 sampled ICLR 2026 submissions.
- **Springer Nature's irrelevant-reference checker** (2025) runs in-house across its journals.
- **Problematic Paper Screener** flags papers that cite retracted work.
- **STM Integrity Hub + Clear Skies** screen for paper mills, for publishers.
- **statcheck** recomputes reported p-values.
- **SciScore** scores methods sections for rigor and transparency.

**⚠️ Name collision:** Frontiers runs a product called **AIRA** (Artificial Intelligence
Review Assistant). It's a publisher-side manuscript-integrity screener with 40+ checks, live
since 2018 — the same niche. "Aira" is also an NVIDIA research-assistant blueprint, a 2026
Duke research-assistant prototype, and a visual-interpreting service for blind and
low-vision people. See `QUESTIONS.md` Q5.

### What this means for AIRA (my assessment)

- **The gap AIRA targets is real but narrowing.** No tool in this set gives an individual
  researcher one report on their own PDF that combines all three of:
  - "does each reference actually exist and match?";
  - statistics red flags;
  - open-science transparency markers.

  But each piece is being picked up elsewhere: scite checks retractions, Consensus checks
  claim support, GPTZero catches fake citations, statcheck and SciScore cover statistics and
  rigor. Most integrity tooling is sold to publishers, not to researchers.
- **Where AIRA can stand out:**
  1. **A trustworthy reference audit for the LLM era.** For every reference: does it exist,
     do title/authors/year agree, has it been retracted — with the evidence shown per line.
     This is the wedge, and today's calibration gap is exactly what would sink it. Fix that
     first.
  2. **Open, explainable, private.** AGPL source, local-first (papers never leave the
     machine except for reference lookups), and every signal traceable to a rule or a
     sentence. The commercial tools above are closed products, and the integrity community
     values methods anyone can inspect.
  3. **An author's pre-submission check.** Reference audit + statcheck-style consistency +
     reporting checklist in one report, aimed at individuals (publisher tools are B2B).
     Checking your own paper also avoids publishing scores about other people's work (the
     liability concern in VISION §7 Q13).
  4. **A biomedical / bioinformatics angle** that matches your career target: research
     resource IDs (RRIDs), data-deposition accessions (GEO, SRA), code availability — checks
     generic tools skip.
- **Where not to compete:** broad search and discovery (Semantic Scholar, Elicit, Consensus
  have huge indexes and funding) and citation graphs (ResearchRabbit, Connected Papers).
  AIRA's similar/related panels are useful context, not the product.
- **Patterns worth borrowing:**
  - scite's status badges — `DESIGN.md` already does this;
  - Elicit's table-first density and sentence-level citations;
  - Consensus's at-a-glance evidence summary, and the lesson from its critics: a single meter
    hides nuance;
  - Semantic Scholar's paper-page anatomy — `DESIGN.md` already does this too.

<details>
<summary>Sources (gathered 2026-10-26)</summary>

- scite: [home](https://scite.ai/), [pricing](https://scite.ai/pricing.md), [Feb 2026 release notes](https://scite.ai/blog/february-2026-release-notes), [Reference Check help](https://help.scite.ai/zh/article/how-do-i-use-the-scite-reference-check-u52q0w), [CUHK guide](https://libguides.lib.cuhk.edu.hk/scite/reference), [acquisition PR](https://researchsolutions.investorroom.com/2023-11-27-Research-Solutions-Announces-Acquisition-of-scite), [Bakker et al.](https://journals.indianapolis.iu.edu/index.php/hypothesis/article/view/26528)
- Elicit: [home](https://elicit.com/), [pricing](https://elicit.com/pricing), [blog](https://elicit.com/blog), [sources](https://support.elicit.com/en/articles/553025), [Lau & Golder 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12483133/)
- Consensus: [Summer '26 changes](https://consensus.app/home/blog/what-has-changed-in-consensus-summer-26/), [Skills](https://consensus.app/home/blog/introducing-skills/), [plans](https://intercom.help/consensus-d118a252369c/en/articles/10087865-subscription-plans), [Tay deep dive](https://aarontay.substack.com/p/a-2025-deep-dive-of-consensus-promises)
- Semantic Scholar: [about](https://www.semanticscholar.org/about), [API](https://www.semanticscholar.org/product/api), [Asta](https://allenai.org/blog/asta)
- ResearchRabbit: [Litmaps acquisition](https://itbrief.news/story/litmaps-acquires-researchrabbit-raises-1-million-for-ai), [new version](https://learn.researchrabbit.ai/en/articles/12440130-welcome-to-the-new-researchrabbit), [pricing](https://www.researchrabbit.ai/pricing), [Tay review](https://aarontay.substack.com/p/researchrabbits-2025-revamp-iterative)
- Connected Papers: [about](https://www.connectedpapers.com/about), [LMU guide](https://libguides.lmu.edu/AIresearchtools/CP)
- Others: [GPTZero](https://gptzero.me/news/iclr-2026/), [Springer Nature](https://group.springernature.com/fr/group/media/press-releases/new-research-integrity-ai-tool/27769148), [Retraction Watch](https://retractionwatch.com/2025/01/31/sage-journal-retracts-another-400-papers/), [STM Integrity Hub](https://stm-assoc.org/stm-integrity-hub-in-action-a-chronicle/), [statcheck](https://statcheck.io/), [SciScore](https://sciscore.com/)
- Name: [Frontiers AIRA](https://www.frontiersin.org/about/artificial-intelligence), [Frontiers Jul 2025](https://www.frontiersin.org/news/2025/07/07/frontiers-broadens-ai-driven-integrity-checks-with-integration-of-cactus), [NVIDIA AI-Q](https://catalog.ngc.nvidia.com/orgs/nvidia/blueprint/collections/ai-research-assistant-blueprint/-), [Duke Aïra](https://arxiv.org/abs/2607.12736), [aira.io](https://www.aira.io)

Unverified at the time of writing: which scite plan includes Reference Check, Elicit's
academic price list, Consensus's 2026 funding, and Connected Papers' business pricing.
</details>

## (d) Next three milestones

A **session** here means one focused 2–4 hour block (for example, one evening with Claude
Code). At the post-window pace VISION.md describes (5–8 hours/week), that's about two
sessions a week, so all three milestones (8–12 sessions) come to roughly 4–6 calendar weeks.

**Order note:** this puts correctness before the redesign, which differs from VISION.md's
Track-A-first plan. A polished UI on top of wrong "verified" labels would cost more
credibility than an older-looking UI with right answers, and M1 is small. M2 doesn't depend
on M1, so they can swap if you prefer — that's `QUESTIONS.md` Q7.

### M1 — Make the numbers trustworthy (2–3 sessions)

**Goal:** every number AIRA shows is either right or honestly marked as unknown.

1. **Build a labelled test set.** About 40 references (real, wrong-DOI, fabricated) and 6–8
   papers (including a scanned one), each with the expected outcome. Turn tonight's scripts
   into repeatable checks.
2. **Recalibrate verification with SPECTER on.** For example, require lexical title
   agreement for "verified", or rescale SPECTER similarity. Measure how many fabricated
   references are caught and how many real ones are wrongly flagged, and make the existing
   tests run in the default configuration.
3. **Unreadable PDFs: no grade, no embedding** (backlog #1). Show "needs OCR" instead, with
   the same behavior in `/api/analyze_pdf`.
4. **Wording fixes:** "competing interests", either word order for ethics approval, ignore
   the reference list when looking for transparency markers, and accept spaced or wrapped
   DOIs.
5. **Coverage in CI + unit tests for the scoring core** (backlog #2–3). Bump
   `ANALYZER_VERSION`.
6. **Non-major security patches**, if approved (`QUESTIONS.md` Q8) — `pypdf` first.

**Done when:** the test set shows fabricated references caught at a stated rate; scanned
PDFs say "needs OCR"; CI reports coverage.

**You'd learn:** how to evaluate a heuristic (precision and recall, labelled fixtures,
calibration), why tests must run in the configuration users get, the realities of PDF text
extraction, and CI.

### M2 — A0 review → new app shell and the paper screen (4–6 sessions)

**Starts with** a 20-minute review of `/styleguide/paper` to answer `QUESTIONS.md` Q3.

1. **App shell**, per the Q3 decision. `/` opens the Library; upload becomes a dialog with
   real status (uploading → analyzing → done / failed) instead of a timer.
2. **Library rebuilt** as a dense, sortable table with search, filters and delete.
3. **Paper detail rebuilt** on the tokens: Semantic Scholar-style header, citations table,
   transparency-signals rail, analyzer version, add-to-project.
4. **Remove** the landing page, waitlist, news panels and mock code.
5. **Quality bar:** TypeScript; designed loading / empty / error states; dark-mode pass.
6. **Small backend additions** it needs: delete a paper, `analyzer_version` in responses.

**Done when:** the app opens into your library, and no screen shows fake progress, `alert()`
popups or marketing copy.

**You'd learn:** React component architecture, routing and information architecture,
design tokens, accessibility, TypeScript, and modelling async UI as explicit states.

### M3 — A demo the world can see (2–3 sessions)

VISION.md §6's "either-way hedge": a **read-only hosted demo** with 10–20 curated
open-access papers and uploads disabled.

1. **Build and verify the Docker image.** Needs Docker Desktop or a CI job that builds it.
   Keep it CPU-only and bake in the SPECTER model.
2. **Seed and lock it down:** a seed script for the curated papers, and a read-only switch
   that turns off write endpoints.
3. **Host it** on a Render / Fly / Railway-class service with ~4 GB RAM (about $20–40/month,
   per VISION.md). Add basic logging and error tracking.
4. **Show it off:** README link, screenshots, a short GIF.

**Needs first:** `QUESTIONS.md` Q1/Q2 (what "deployable" means, budget) and Q5 (the name).

**Done when:** a public URL shows the library and paper reports, and monthly cost is known.

**You'd learn:** containers, deployment, configuration and secrets, hosting costs (why
SPECTER sets the memory floor), and basic observability.

**After these three:** the strategy gate becomes a real decision informed by people using
the demo. GO leads to VISION.md's P1–P4 (Postgres, accounts, multi-tenancy, background
jobs); NO-GO leads to conflict detection as the depth feature.
