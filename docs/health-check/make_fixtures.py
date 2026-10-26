"""Build two local test fixtures for the AIRA health check.

1. synthetic.pdf - a small text PDF with controlled content (clustered
   p-values, a data-availability statement, PLOS-style "competing interests"
   wording, no limitations section, real + fabricated references).
2. scanned.pdf   - an image-only PDF made by rasterizing pages of a real paper,
   so native text extraction finds nothing (exercises the OCR paths).

Usage: python make_fixtures.py <source_pdf_for_scan> <out_dir>
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

LINES = [
    "Synthetic Fixture: Effects of Morning Light on Reaction Time",
    "A. Researcher, B. Scientist",
    "doi: 10.5555/aira-fixture-001",
    "",
    "Abstract",
    "We tested whether morning light exposure shortens simple reaction time in adults.",
    "Participants (N = 24) completed a within-subject protocol across two sessions.",
    "",
    "Introduction",
    "Prior work links light exposure to alertness [1], although reproducibility concerns",
    "in behavioral research are well documented [2, 3] and small samples are common [4-6].",
    "Open research practices can mitigate these risks (Nosek, 2015).",
    "",
    "Methods",
    "The study was approved by the Institutional Review Board of the host university.",
    "Twenty-four adults took part (N = 24); a pilot subgroup (n = 12) repeated the task.",
    "Reaction times were analyzed with paired t-tests and Pearson correlations.",
    "",
    "Results",
    "Light exposure shortened reaction time, t(23) = 2.10, p = 0.049, Cohen's d = 0.45.",
    "The pilot subgroup showed a similar effect, p = 0.047, and accuracy improved, p = 0.051.",
    "Sleep quality correlated with the benefit, r = 0.31, 95% CI [0.12, 0.78], p < 0.001.",
    "",
    "Discussion",
    "Morning light may modestly improve reaction time. Effects were small and should be",
    "interpreted alongside the broader literature on behavioral effect sizes [2].",
    "",
    "Data Availability: All data are available at https://osf.io/abcde/.",
    "Competing interests: The authors have declared that no competing interests exist.",
    "",
    "References",
    "1. Vaswani A, Shazeer N, Parmar N, Uszkoreit J, Jones L, Gomez AN, et al. Attention is all you need.",
    "Advances in Neural Information Processing Systems. 2017;30.",
    "2. Simmons JP, Nelson LD, Simonsohn U. False-positive psychology: Undisclosed flexibility in data",
    "collection and analysis allows presenting anything as significant. Psychological Science.",
    "2011;22(11):1359-1366. doi:10.1177/0956797611417632",
    "3. Open Science Collaboration. Estimating the reproducibility of psychological science. Science.",
    "2015;349(6251):aac4716.",
    "4. Button KS, Ioannidis JPA, Mokrysz C, Nosek BA, Flint J, Robinson ESJ, et al. Power failure: why",
    "small sample size undermines the reliability of neuroscience. Nature Reviews Neuroscience.",
    "2013;14(5):365-376.",
    "5. Harlan DT, Voss K. Statistical rigor and the replication economy in synthetic chronobiology.",
    "Annals of Behavioral Data Science. 2018;12:44-61.",
    "6. Mercer S, Okafor P. Meta-analytic drift in morning light research: a ten-year audit of",
    "unregistered trials. Review of Quantitative Psychology. 2020;3:201-219.",
    "7. Nosek BA, Alter G, Banks GC, Borsboom D, Bowman SD, Breckler SJ, et al. Promoting an open",
    "research culture. Science. 2015;348(6242):1422-1425.",
]


def _pdf_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def write_text_pdf(lines, path: Path, per_page: int = 48) -> None:
    pages = [lines[i:i + per_page] for i in range(0, len(lines), per_page)]
    objects = []  # index 0 -> object 1

    def add(body: str) -> int:
        objects.append(body)
        return len(objects)

    catalog = add("")  # placeholder, filled below
    pages_obj = add("")
    font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    page_ids = []
    for page_lines in pages:
        ops = ["BT", "/F1 10 Tf", "14 TL", "50 760 Td"]
        for line in page_lines:
            ops.append(f"({_pdf_escape(line)}) Tj T*")
        ops.append("ET")
        stream = "\n".join(ops)
        content = add(f"<< /Length {len(stream.encode('latin-1'))} >>\nstream\n{stream}\nendstream")
        page_ids.append(add(
            f"<< /Type /Page /Parent {pages_obj} 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content} 0 R /Resources << /Font << /F1 {font} 0 R >> >> >>"
        ))
    objects[catalog - 1] = f"<< /Type /Catalog /Pages {pages_obj} 0 R >>"
    kids = " ".join(f"{p} 0 R" for p in page_ids)
    objects[pages_obj - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>"

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n{body}\nendobj\n".encode("latin-1")
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects) + 1} /Root {catalog} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    path.write_bytes(bytes(out))


def write_scanned_pdf(source_pdf: Path, path: Path, first: int = 1, last: int = 3) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["pdftoppm", "-r", "110", "-f", str(first), "-l", str(last), "-png", str(source_pdf), f"{tmp}/pg"],
            check=True,
        )
        images = [Image.open(p).convert("RGB") for p in sorted(Path(tmp).glob("pg*.png"))]
        images[0].save(path, save_all=True, append_images=images[1:])


if __name__ == "__main__":
    src, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    write_text_pdf(LINES, out_dir / "synthetic.pdf")
    write_scanned_pdf(src, out_dir / "scanned.pdf")
    (out_dir / "not-a-pdf.pdf").write_bytes(b"hello, I am plain text pretending to be a PDF\n")
    print("wrote", sorted(p.name for p in out_dir.iterdir()))
