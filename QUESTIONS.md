# Open decisions — 2026-10-26

Only decisions that `VISION.md`, `frontend/DESIGN.md` and `CLAUDE.md` don't already answer.
Each one says what the docs do say, the options, and my recommendation. The first five shape
everything else; 6–8 are quick calls.

---

## Q1. Who is AIRA for, and is it GO, NO-GO or PIVOT?

**Docs say:** VISION.md §3 sets up a go / no-go / pivot gate for ~late August 2026, fed by
the 15 research questions in §7. No outcome is recorded, and there are no research results in
the repo.

**Why it matters:** it decides whether the next big investment is accounts and hosting (GO),
depth features like conflict detection (NO-GO), or an API for publishers (PIVOT). It also
decides who the UI is written for.

**Options:**
- (a) **GO** — hosted multi-user beta. VISION estimates 4–6 months at the slower pace.
- (b) **NO-GO** — a polished, open-source single-user tool, plus conflict detection.
- (c) **PIVOT** — a screening API for publishers.
- (d) **Decide later** — ship the read-only public demo first (milestone M3), then decide with
  real feedback.

**Recommendation:** (d), with the **first audience being individual researchers checking
their own drafts before submission**. The competitor scan shows the publisher side is
crowded (Frontiers' AIRA, Clear Skies, Springer Nature's own checker). An author checking
their own references and reporting is underserved, and it carries the least legal risk
(VISION §7 Q13): it's your own paper and your results stay private. If you did run any of
the §7 research, drop the notes into `docs/research/` so they can inform this.

---

## Q2. What does "deployable" mean for the next milestone, and what's the budget?

**Docs say:** VISION.md §6 names a read-only hosted demo as worth doing "in both branches",
but sets no target and no budget.

**Options:**
- (a) **Read-only public demo** — 10–20 curated open-access papers, uploads off.
- (b) **Self-hostable** — anyone runs `docker compose up` (fits the AGPL license; costs you
  nothing, but needs a Docker build that actually works).
- (c) **Hosted multi-user beta** — only after a GO.

**Recommendation:** (a), then (b). **Budget check:** SPECTER needs roughly a 4 GB RAM server,
about $20–40/month (VISION §5). Is that OK? Free tiers won't fit. The cheaper alternative —
a smaller model or a hosted embeddings API — changes every stored vector (VISION F5), so it's
a bigger decision than it looks.

---

## Q3. The A0 design review: three design calls and one scope call

**Docs say:** `frontend/DESIGN.md` lists the first three as open questions for the A0
checkpoint, which hasn't happened yet. A 20-minute look at `/styleguide` and
`/styleguide/paper` (run `npm run dev` in `frontend/`) is enough to decide.

- **3a. Accent color:** (a) neutral only — the current proposal — or (b) one restrained
  accent such as deep indigo for main buttons.
  **Recommendation: (a) neutral.** The grade-B token is already blue (hue 217), so a blue or
  indigo accent would blur the "color always means something" rule. Express the brand through
  the logo and type instead.
- **3b. Paper titles:** (a) sans-serif everywhere, or (b) a serif for paper titles only.
  **Recommendation: (b).** It's a cheap way to feel scholarly and distinctive. Confine it to a
  single token so it can't spread.
- **3c. App frame:** (a) slim top bar, or (b) left sidebar.
  **Recommendation: (b) a left sidebar** with your projects listed (the Zotero / Elicit
  pattern). It scales when Discover or Chat come back.
- **3d. Small backend additions during the redesign?** The mocked paper screen needs a few
  things the API lacks: the analyzer version, delete-paper, and later a "re-run analysis"
  endpoint. VISION §4 allows no backend work during Track A beyond the pre-gate shortlist.
  **Recommendation: allow these** — they're additive and useful in every outcome.

---

## Q4. Keep a single 0–100 score and A–F grade?

**Docs say:** the score must be framed as "transparency signals, never a verdict" (VISION
§4, §8). But the UI still shows red and orange letter grades, and no doc decides whether a
single number or grade should exist at all, or whether citation checks should feed into it.
Today they don't.

**Options:**
- (a) Keep 0–100 + A–F as is.
- (b) Keep a number, drop the letter grades.
- (c) **No single score:** a checklist of signals ("limitations ✓, data statement ✓,
  pre-registration —") plus a separate reference-audit summary ("37 of 39 references found;
  2 need a look").

**Recommendation: (c), at least until the heuristic is validated** (backlog #9). An "F" next
to a named paper reads as a verdict, which is exactly the liability VISION §7 Q13 worries
about. Critics of Consensus's single evidence meter make the same point: one number hides the
nuance. If a number stays, keep citation results out of it until verification is recalibrated
(milestone M1).

---

## Q5. Keep the name "AIRA"?

**Docs say:** nothing about naming.

**Found tonight:**
- **Frontiers** has run a product called **AIRA** (Artificial Intelligence Review Assistant)
  since 2018. It's a publisher-side manuscript-integrity screener — the same niche.
- **Others:** NVIDIA's AI-Q research-assistant blueprint ships containers named "aira"; Duke
  published an "Aïra" research assistant in 2026; and Aira is a well-known visual-interpreting
  service.

**Options:** (a) keep it, or (b) rename before going public.

**Recommendation: (b), before the public demo (M3).** That's the cheapest moment: once a URL
and screenshots are out, renaming costs more. Check the domain and run a basic trademark
search; the repo and package names can follow later.

---

## Q6. Remove the legacy Streamlit apps?

**Docs say:** VISION §2 freezes `app_v2.py` and calls `app_legacy.py` archival. Backlog #12
recommends retiring the Smart Summary feature. Nothing says to delete them.

**Evidence:**
- `app_legacy.py` crashes on startup (it imports `PyPDF2`, which isn't installed).
- Streamlit and the packages it pulls in account for about 35 of the 160 Python security
  advisories.
- The `openai` and `pandas` dependencies exist only for these two apps.

**Recommendation: delete both** (git history keeps them), drop `streamlit`, `openai` and
`pandas` from the requirements, and update README and CLAUDE.md — all in one reviewable
commit.

---

## Q7. How much time is there now, and should correctness come before the redesign?

**Docs say:** VISION planned a focused window through mid-August with the UI redesign first,
then 5–8 hours/week. That window has passed.

**Options for order:**
- (a) M1 correctness → M2 redesign → M3 demo — my proposal in `GAP_ANALYSIS.md`.
- (b) Redesign first.
- (c) M1 → M3 demo with the current UI → M2 redesign.

**Recommendation: (a)** — unless you have a date (job applications, a talk), in which case
**(c)**: a trustworthy demo beats a pretty one. **Please share** how many hours a week are
realistic now, and any target date.

---

## Q8. Apply the non-major security updates?

**Docs say:** nothing on update policy. Tonight's instruction was "list only."

**Evidence (details in `HEALTH_CHECK.md`):**
- **Python:** `pypdf` 6.6.0 → 6.21.2 fixes 54 advisories, and it parses every uploaded PDF;
  `python-multipart` 0.0.18 → 0.0.31 fixes 6, and it parses every upload form. Eight more
  packages have patch or minor fixes.
- **npm:** `npm audit fix` resolves 13 of 14 issues without a major bump, including the
  critical `shell-quote`.

**Recommendation: yes, in small steps.** Start with `pypdf` and `python-multipart` and run the
tests. Follow the re-locking caveats in CLAUDE.md (Linux CUDA pins, loosely pinned
dependencies), then `npm audit fix`. Leave major upgrades (Pillow 13, FastAPI/Starlette 1.x,
React 19, Tailwind 4, Vite 8) for later, one at a time.
