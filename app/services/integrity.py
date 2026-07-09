import re
import logging
from typing import Optional
from app.schemas.models import TruthinessResult
from app.services import statistics as stats_svc

logger = logging.getLogger(__name__)


async def calculate_truthiness(text: str, field: Optional[str] = None) -> TruthinessResult:
    stats = await stats_svc.extract_statistics(text)
    flags = stats.red_flags

    has_no_limits = any("No limitations" in f for f in flags)
    has_no_coi = any("conflict of interest" in f.lower() for f in flags)
    has_no_ethics = any("No ethics" in f for f in flags)
    is_preregistered = any("pre-registered" in f.lower() for f in flags)
    has_power_analysis = any("Power analysis" in f for f in flags)
    has_open_data = any(
        ("data" in f.lower() and "available" in f.lower())
        or "github.com" in f.lower()
        or "osf.io" in f.lower()
        for f in flags
    )
    discusses_replication = any("replication" in f.lower() for f in flags)

    field_multipliers = {"psychology": 1.0, "clinical": 1.2, "cs": 0.8, "biology": 1.1}
    multiplier = field_multipliers.get(field, 1.0) if field else 1.0

    score = 100
    reasons = []

    suspicious_p = [p for p in stats.p_values if any(x in p for x in ["0.04", "0.05", "0.06"])]
    if len(suspicious_p) > 2:
        penalty = int(15 * multiplier)
        score -= penalty
        reasons.append(f"Multiple p-values near threshold ({len(suspicious_p)} found)")

    small_n_count = 0
    for size_str in stats.sample_sizes[:10]:
        match = re.findall(r"\d+", size_str)
        if match:
            n = int(match[0])
            threshold = int(30 * multiplier)
            if n < threshold:
                small_n_count += 1

    if small_n_count > 0:
        score -= int(10 * multiplier)
        reasons.append(f"Small sample sizes detected ({small_n_count} instances)")

    if has_no_limits:
        score -= 20
        reasons.append("No limitations discussed (major concern)")
    if has_no_coi:
        score -= 10
        reasons.append("No conflict of interest statement")
    if has_no_ethics:
        score -= 5
        reasons.append("No ethics approval mentioned")
    if is_preregistered:
        score += 10
        reasons.append("✅ Pre-registered study")
    if has_power_analysis:
        score += 5
        reasons.append("✅ Power analysis conducted")
    if has_open_data:
        score += 10
        reasons.append("✅ Open data/code available")
    if discusses_replication:
        score += 5
        reasons.append("✅ Discusses replication")

    score = max(0, min(100, score))

    if score >= 85:
        grade = "A"
    elif score >= 70:
        grade = "B"
    elif score >= 55:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"

    return TruthinessResult(
        score=score,
        reasons=reasons,
        grade=grade,
        disclaimer="This is a heuristic analysis, not peer review. Use as a preliminary signal only.",
    )
