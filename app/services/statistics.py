import re
import logging
from app.schemas.models import StatisticsResult

logger = logging.getLogger(__name__)


async def extract_statistics(text: str) -> StatisticsResult:
    field_match = re.search(
        r"\[\s*field\s*:\s*(general|psychology|biology|clinical|cs)\s*\]",
        text,
        re.IGNORECASE,
    )
    field = field_match.group(1).lower() if field_match else "general"
    thresholds = {"general": 30, "psychology": 30, "biology": 20, "clinical": 50, "cs": 15}
    small_n_cutoff = thresholds.get(field, 30)

    normalized = re.sub(r"\s+", " ", text)

    p_values = re.findall(r"[pP]\s*[=<>≤≥]\s*0?\.\d+", normalized)
    p_values.extend(re.findall(r"[pP]\s*<\s*\.0\d+", normalized))
    p_values = p_values[:50]

    sample_sizes = re.findall(r"[nN]\s*=\s*\d+", normalized)[:50]

    effect_sizes = []
    effect_sizes.extend(re.findall(r"Cohen's\s*d\s*=\s*-?\d*\.\d+", normalized))
    effect_sizes.extend(re.findall(r"\br\s*=\s*-?\d*\.\d+", normalized))
    effect_sizes.extend(re.findall(r"η²\s*=\s*\d*\.\d+", normalized))
    effect_sizes.extend(re.findall(r"\bOR\s*=\s*-?\d*\.?\d+", normalized))
    effect_sizes.extend(re.findall(r"\bRR\s*=\s*-?\d*\.?\d+", normalized))
    effect_sizes.extend(re.findall(r"[βΒβ]\s*=\s*-?\d*\.?\d+", normalized))
    effect_sizes.extend(re.findall(r"\bt\s*\(\s*\d+\s*\)\s*=\s*-?\d*\.?\d+", normalized))
    effect_sizes.extend(re.findall(r"\bF\s*\(\s*\d+\s*,\s*\d+\s*\)\s*=\s*\d*\.?\d+", normalized))
    effect_sizes.extend(re.findall(r"[χχX]\s*\^?2\s*\(\s*\d+\s*\)\s*=\s*\d*\.?\d+", normalized))
    effect_sizes = effect_sizes[:50]

    cis = re.findall(r"CI\s*\[\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*\]", normalized)[:50]

    red_flags = []

    near = []
    for p in p_values:
        try:
            m = re.search(r"0?\.(\d+)", p)
            if m:
                val = float("0." + m.group(1))
                if 0.045 <= val <= 0.054:
                    near.append(p)
        except Exception:
            pass
    if len(near) >= 3:
        red_flags.append(f"🚩 {len(near)} p-values near 0.05 (0.045–0.054)")
    elif len(near) == 2:
        red_flags.append("⚠️ Two p-values near 0.05")

    small_samples = []
    for size_str in sample_sizes[:20]:
        nums = re.findall(r"\d+", size_str)
        if nums and int(nums[0]) < small_n_cutoff:
            small_samples.append(size_str)
    if small_samples:
        red_flags.append(f"⚠️ Small sample sizes (<{small_n_cutoff}): {', '.join(small_samples[:3])}")

    if not re.search(r"\blimitation", text, re.IGNORECASE):
        red_flags.append("❌ No limitations section found")
    if not re.search(r"conflict.*interest|disclosure", text, re.IGNORECASE):
        red_flags.append("❌ No conflict of interest statement")
    if not re.search(r"ethic.*approv|IRB|institutional.*review", text, re.IGNORECASE):
        red_flags.append("⚠️ No ethics approval mentioned")
    if re.search(r"pre-?register", text, re.IGNORECASE):
        red_flags.append("✅ Study was pre-registered")
    if re.search(r"power\s+analysis", text, re.IGNORECASE):
        red_flags.append("✅ Power analysis conducted")
    if re.search(r"data.*available|github\.com|osf\.io|figshare", text, re.IGNORECASE):
        red_flags.append("✅ Data/code availability statement")
    if re.search(r"replicat", text, re.IGNORECASE):
        red_flags.append("✅ Discusses replication")

    return StatisticsResult(
        p_values=p_values,
        sample_sizes=sample_sizes,
        effect_sizes=effect_sizes,
        cis=cis,
        red_flags=red_flags,
        summary=(
            f"Found {len(p_values)} p-values, {len(sample_sizes)} sample sizes, "
            f"{len(effect_sizes)} effects/test stats, {len(cis)} CIs"
        ),
    )
