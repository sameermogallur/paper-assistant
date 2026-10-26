"""Exercise every AIRA API endpoint the way the React frontend does.

Sends the frontend's Origin header on every request so CORS is checked too.
Usage: python e2e_api.py <base_url> <fixtures_dir> <plos_pdf> <out_json>
"""
import json
import sys
import time
from pathlib import Path

import httpx

BASE, FIX, PLOS, OUT = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4])
ORIGIN = "http://localhost:5173"
rows = []
c = httpx.Client(base_url=BASE, timeout=300, headers={"Origin": ORIGIN})


def call(name, method, path, expect, **kw):
    t0 = time.perf_counter()
    r = c.request(method, path, **kw)
    ms = round((time.perf_counter() - t0) * 1000)
    cors = r.headers.get("access-control-allow-origin") == ORIGIN
    try:
        body = r.json()
    except ValueError:
        body = None
    ok = r.status_code == expect
    rows.append({"name": name, "method": method, "path": path, "status": r.status_code,
                 "expect": expect, "ok": ok, "ms": ms, "cors": cors, "note": ""})
    return body


def note(text):
    rows[-1]["note"] = text


def pdf(path, name=None):
    return {"files": {"file": (name or path.name, path.read_bytes(), "application/pdf")}}


# --- health
b = call("health", "GET", "/healthz", 200)
b = call("version", "GET", "/version", 200); note(f"py {b['python_version']}, deps {b['dependencies']}")

# --- pdf
b = call("parse_pdf (PLOS)", "POST", "/api/parse_pdf", 200, **pdf(PLOS))
note(f"{b['extraction_method']}, {b['pages']} pages, {b['word_count']} words, sections {list(b['sections'])}")
b = call("parse_pdf (scanned)", "POST", "/api/parse_pdf", 200, **pdf(FIX / "scanned.pdf"))
note(f"{b['extraction_method']}, text chars {len(b['text'])}")
b = call("parse_pdf_ocr (scanned)", "POST", "/api/parse_pdf_ocr", 200, **pdf(FIX / "scanned.pdf"))
note(f"{b['extraction_method']}, {b['pages']} pages, {b['word_count']} words")
b = call("parse_pdf (not a PDF)", "POST", "/api/parse_pdf", 400, **pdf(FIX / "not-a-pdf.pdf")); note(str(b))
b = call("parse_pdf (.txt name)", "POST", "/api/parse_pdf", 400, **pdf(FIX / "synthetic.pdf", "paper.txt")); note(str(b))

# --- stateless analysis on the synthetic paper's text
syn = call("parse_pdf (synthetic)", "POST", "/api/parse_pdf", 200, **pdf(FIX / "synthetic.pdf"))
text = {"json": {"text": syn["text"]}}
b = call("verify_references", "POST", "/api/verify_references", 200, **text)
note(", ".join(f"{x['status']}:{x['confidence']:.2f}" for x in b))
b = call("find_intext_citations", "POST", "/api/find_intext_citations", 200, **text); note(b["explanation"])
b = call("extract_statistics", "POST", "/api/extract_statistics", 200, **text)
note(f"{b['summary']} | flags {b['red_flags']}")
b = call("truthiness_score", "POST", "/api/truthiness_score", 200, **text)
note(f"{b['score']} {b['grade']} {b['reasons']}")
b = call("analyze_pdf (synthetic)", "POST", "/api/analyze_pdf", 200, **pdf(FIX / "synthetic.pdf"))
note(f"{b['integrity_score']} {b['integrity_grade']}, refs {b['references_found']} "
     f"(v{b['references_verified']}/s{b['references_suspicious']}/n{b['references_not_found']})")
b = call("analyze_pdf (scanned)", "POST", "/api/analyze_pdf", 200, **pdf(FIX / "scanned.pdf"))
note(f"{b['integrity_score']} {b['integrity_grade']} {b['extraction_method']}")
b = call("verify_references (empty)", "POST", "/api/verify_references", 422, json={"text": ""}); note("min_length=1")

# --- ingest
plos = call("ingest PLOS (new)", "POST", "/api/papers", 201, **pdf(PLOS))
r = plos["report"]
note(f"id {plos['paper_id']}, {r['integrity_score']} {r['integrity_grade']}, refs {r['references_found']} "
     f"(v{r['references_verified']}/s{r['references_suspicious']}/n{r['references_not_found']}), "
     f"signals {r['integrity_signals']}")
b = call("ingest PLOS (duplicate)", "POST", "/api/papers", 200, **pdf(PLOS)); note(f"was_duplicate={b['was_duplicate']}")
synp = call("ingest synthetic", "POST", "/api/papers", 201, **pdf(FIX / "synthetic.pdf"))
r = synp["report"]; note(f"id {synp['paper_id']}, {r['integrity_score']} {r['integrity_grade']}, signals {r['integrity_signals']}")
scan = call("ingest scanned", "POST", "/api/papers", 201, **pdf(FIX / "scanned.pdf"))
r = scan["report"]; note(f"id {scan['paper_id']}, {r['integrity_score']} {r['integrity_grade']}, {r['extraction_method']}")
b = call("ingest (not a PDF)", "POST", "/api/papers", 400, **pdf(FIX / "not-a-pdf.pdf")); note(str(b))

# --- read
b = call("list papers", "GET", "/api/papers", 200); note(f"total {b['total']}: " + "; ".join(
    f"#{p['id']} {p['integrity_grade']} {p['integrity_score']} doi={p['doi']} title={(p['title'] or '')[:40]!r}" for p in b["items"]))
b = call("list papers (page 2, limit 1)", "GET", "/api/papers?limit=1&offset=1", 200); note(f"items {len(b['items'])}, total {b['total']}")
b = call("list papers (bad project)", "GET", "/api/papers?project_id=999", 404)
b = call("paper detail", "GET", f"/api/papers/{plos['paper_id']}", 200)
note(f"title={(b['title'] or '')[:60]!r}, authors={b['authors']}, year={b['year']}, doi={b['doi']}, has_embedding={b['has_embedding']}")
b = call("paper detail (missing)", "GET", "/api/papers/9999", 404)
b = call("similar", "GET", f"/api/papers/{plos['paper_id']}/similar", 200)
note(f"reason={b['reason']}, " + ", ".join(f"#{x['paper_id']}:{x['score']}" for x in b["results"]))
b = call("related (PLOS, has DOI)", "GET", f"/api/papers/{plos['paper_id']}/related", 200)
note(f"reason={b['reason']}, {len(b['results'])} results")
b = call("related (synthetic, fake DOI)", "GET", f"/api/papers/{synp['paper_id']}/related", 200); note(f"reason={b['reason']}")
b = call("related (scanned, no DOI)", "GET", f"/api/papers/{scan['paper_id']}/related", 200); note(f"reason={b['reason']}")

# --- projects
proj = call("create project", "POST", "/api/projects", 201, json={"name": "Health check", "description": "temp"})
pid = proj["id"]
call("list projects", "GET", "/api/projects", 200)
call("get project", "GET", f"/api/projects/{pid}", 200)
b = call("update project", "PUT", f"/api/projects/{pid}", 200, json={"name": "Health check (renamed)"}); note(b["name"])
call("add paper to project", "POST", f"/api/projects/{pid}/papers", 201, json={"paper_id": plos["paper_id"]})
call("add paper again", "POST", f"/api/projects/{pid}/papers", 409, json={"paper_id": plos["paper_id"]})
b = call("list papers in project", "GET", f"/api/papers?project_id={pid}", 200); note(f"total {b['total']}")
b = call("similar (project scope)", "GET", f"/api/papers/{plos['paper_id']}/similar?project_id={pid}", 200)
note(f"reason={b['reason']}, {len(b['results'])} results")
call("remove paper from project", "DELETE", f"/api/projects/{pid}/papers/{plos['paper_id']}", 204)
call("delete project", "DELETE", f"/api/projects/{pid}", 204)
call("get deleted project", "GET", f"/api/projects/{pid}", 404)

# --- CORS preflight (what the browser sends before a JSON POST)
pre = {"Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"}
call("CORS preflight (allowed origin)", "OPTIONS", "/api/projects", 200, headers=pre)
r = c.options("/api/projects", headers={**pre, "Origin": "http://evil.example"})
rows.append({"name": "CORS preflight (other origin)", "method": "OPTIONS", "path": "/api/projects",
             "status": r.status_code, "expect": 400, "ok": r.status_code == 400, "ms": 0,
             "cors": "access-control-allow-origin" in r.headers, "note": "should be refused"})

OUT.write_text(json.dumps(rows, indent=2))
for x in rows:
    flag = "OK " if x["ok"] else "!! "
    cors = "cors" if x["cors"] else "----"
    print(f"{flag}{x['status']:>3} {x['ms']:>6}ms {cors} {x['method']:<7} {x['name']:<34} {x['note'][:260]}")
print(f"\n{sum(x['ok'] for x in rows)}/{len(rows)} matched expected status")
