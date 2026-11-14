"""Statistics for the gate: Welch SE, Bonferroni threshold, deterministic compare, BH-FDR."""
from __future__ import annotations

import math
import statistics as st
from dataclasses import dataclass
from statistics import NormalDist

ALPHA_ONE_SIDED = 0.00135  # 3 sigma per tail; the comparison is two-sided, so p_two_sided < 0.0027 / k
DEFAULT_MIN_EFFECT_REL = 1e-3  # used when a deterministic card declares no hypothesis.min_effect
NULL_Z = 3.0


def z_crit(k: int) -> float:
    """Bonferroni over k declared measures: z_crit = Phi^-1(1 - 0.00135/k)."""
    if k < 1:
        raise ValueError("k must be >= 1")
    return NormalDist().inv_cdf(1 - ALPHA_ONE_SIDED / k)


def p_two_sided(z: float) -> float:
    return math.erfc(abs(z) / math.sqrt(2))


@dataclass
class Comparison:
    measure: str
    mean_a: float
    mean_b: float
    effect: float
    se: float
    z: float | None  # None in the deterministic case
    deterministic: bool
    differs: bool  # at the threshold it was compared with
    p: float  # two-sided p; 0/1 in the deterministic case


def welch(a: list[float], b: list[float]) -> tuple[float, float]:
    """Effect mean(a)-mean(b) and Welch SE sqrt(sa^2/na + sb^2/nb)."""
    if len(a) < 2 or len(b) < 2:
        raise ValueError("need at least 2 values per arm")
    d = st.mean(a) - st.mean(b)
    se = math.sqrt(st.variance(a) / len(a) + st.variance(b) / len(b))
    return d, se


def compare(measure: str, a: list[float], b: list[float], zthr: float, min_effect: float | None = None) -> Comparison:
    """Compare two arms on one measure. Deterministic (sd = 0 in both arms): exact compare against min_effect, never z."""
    d, se = welch(a, b)
    ma, mb = st.mean(a), st.mean(b)
    if se == 0:
        thr = min_effect if min_effect is not None else DEFAULT_MIN_EFFECT_REL * max(abs(mb), 1e-12)
        diff = d != 0 and abs(d) >= thr
        return Comparison(measure, ma, mb, d, 0.0, None, True, diff, 0.0 if diff else 1.0)
    z = d / se
    return Comparison(measure, ma, mb, d, se, z, False, abs(z) > zthr, p_two_sided(z))


def bh_qvalues(pvals: list[float]) -> list[float]:
    """Benjamini-Hochberg adjusted q-values, same order as input."""
    m = len(pvals)
    order = sorted(range(m), key=lambda i: pvals[i])
    q = [1.0] * m
    running = 1.0
    for rank in range(m, 0, -1):
        i = order[rank - 1]
        running = min(running, pvals[i] * m / rank)
        q[i] = min(1.0, running)
    return q
