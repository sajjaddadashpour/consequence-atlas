"""Python oracle for atlas.js, written from LOCKED_SITE_ENGINE.md. Not a second theory."""
from __future__ import annotations
import json, math
from pathlib import Path

A0_DERIVE = 1 / 137.035999
B0_DERIVE = 1 / 1836.15267
A0_DIAL = 0.0072973525693
B0_DIAL = 0.000544617021
MP_MEV = 938.272
Q_NP, E_NP = 2.52, -1.00
DQ_HYPOT = math.hypot(0.17, 0.24)
DE_HYPOT = math.hypot(0.07, 0.14)
DQ_BOX, DE_BOX = 0.294, 0.157
AS_MEV, AC_MEV = 17.8, 0.711
BARRIER = 2.62e-12
K_ADAMS = 10 ** (-8 / 3)
K_TEGMARK = 1 / 200
K_BARNES = 1 / 100
LAMBDA_GALAXY = 189  # was 57.5 until atlas@locked-2026-11-16a
LAMBDA_LIFE = -7.09
LAMBDA_LIFE_LOOSE = -53.9
LAMBDA_T0 = 36.7
KB = 1.380649e-23
QE = 1.602176634e-19

OURS = dict(dimensions=3, alpha=A0_DIAL, beta=B0_DIAL, strong=0, arrow=1, cosmological_constant=1)

D1_TABLE = {
    "1": {"extrema": [["min", 1.0]], "stable_circular_orbit": True},
    "2": {"extrema": [["min", 1.0]], "stable_circular_orbit": True},
    "3": {"extrema": [["min", 1.0]], "stable_circular_orbit": True},
    "4": {"extrema": [], "stable_circular_orbit": False},
    "5": {"extrema": [["max", 2.99999133271615]], "stable_circular_orbit": False},
}
D2_TABLE = {
    "3": {"0.1": -0.2180189558317851, "0.03": -0.24105326481206374, "0.01": -0.24999843751947215},
    "4": {"0.1": 0.004528008209490574, "0.03": 0.00431992700075675, "0.01": 0.004077743983553367},
    "5": {"0.1": -4.0245791498697905, "0.03": -19427.3181157315, "0.01": -960116.2776528426},
}

RANK = {"PASS": 0, "OPEN": 1, "WEAK": 2, "CONTESTED": 3, "FAIL": 4}
VERDICT_OF = {"PASS": "ok", "OPEN": "ok", "WEAK": "ok", "CONTESTED": "CONTESTED", "FAIL": "FAIL", "BLOCKED": "BLOCKED"}

# BEGIN GENERATED STAGES (verify/gen_stages.py)
STAGES = [
    ("s00.rules", 0, []),
    ("s01.predictable-laws", 1, ["s00.rules"]),
    ("s02.sharp-signals", 2, ["s01.predictable-laws"]),
    ("s03.orbits-atoms-gravity", 3, ["s01.predictable-laws"]),
    ("s04.stable-atoms", 4, ["s03.orbits-atoms-gravity"]),
    ("s05.hydrogen-table", 5, ["s04.stable-atoms"]),
    ("s06.chemistry", 6, ["s05.hydrogen-table"]),
    ("s07g.galaxies", 7, ["s03.orbits-atoms-gravity"]),
    ("s07.stars", 8, ["s03.orbits-atoms-gravity", "s04.stable-atoms", "s07g.galaxies"]),
    ("s08.fusion-hoyle", 9, ["s07.stars"]),
    ("s09.planets", 10, ["s03.orbits-atoms-gravity", "s07.stars"]),
    ("s10.records", 11, ["s01.predictable-laws", "s04.stable-atoms"]),
    ("s11.life", 12, ["s06.chemistry", "s08.fusion-hoyle", "s09.planets", "s10.records"]),
    ("s12.minds", 13, ["s11.life"]),
    ("s13.carers", 14, ["s12.minds"]),
]
# END GENERATED STAGES


def A_of_Z(Z):
    lo, hi = Z, 4 * Z + 10
    for _ in range(60):
        A = (lo + hi) / 2
        z = A / 2 - 0.2 * A * A / (A + 200)
        lo, hi = (A, hi) if z < Z else (lo, A)
    return (lo + hi) / 2


def Z_fis(alpha, s):
    crit = 2 * AS_MEV * (1 + s) / (AC_MEV * alpha / A0_DERIVE)
    Z = 1
    while Z < 2000 and Z * Z / A_of_Z(Z) < crit:
        Z += 1
    return Z - 1


def table(alpha, s):
    zd = math.floor(1 / alpha)
    zc = math.floor(1.24 / alpha)
    zf = Z_fis(alpha, s)
    return dict(alpha=alpha, s=s, Z_dirac=zd, Z_cr=zc, Z_fis=zf, L=min(zc, zf), L_point=min(zd, zf))


def thresh(Zneed, s, useCr=True):
    lo, hi = 1e-4, 1.0
    for _ in range(60):
        m = (lo + hi) / 2
        t = table(m, s)
        L = t["L"] if useCr else t["L_point"]
        lo, hi = (m, hi) if L >= Zneed else (lo, m)
    return lo


def r_crit(Qv, Ev, beta):
    return (beta * MP_MEV - Qv) / Ev


def d3_row(alpha):
    return dict(alpha=alpha, a0_rel=A0_DERIVE / alpha, Ry_rel=(alpha / A0_DERIVE) ** 2, v_over_c=alpha)


def derived_tables():
    D3_ALPHAS = [1e-4, 1e-3, 1 / 137.036, 0.02, 0.05, 0.1, 0.2, 1 / 3, 0.5]
    J = KB * 300 * math.log(2)
    ks = {"Adams2019": K_ADAMS, "Tegmark1998": K_TEGMARK, "Barnes2012": K_BARNES}
    D6_ours = {k: {"beta_min": v * A0_DERIVE ** 2, "margin": B0_DERIVE / (v * A0_DERIVE ** 2)} for k, v in ks.items()}
    D6_ours["alpha2beta"] = {"value": A0_DERIVE ** 2 * B0_DERIVE, "min": BARRIER, "margin": A0_DERIVE ** 2 * B0_DERIVE / BARRIER}
    return {
        "D1": D1_TABLE,
        "D2_ground_vs_cutoff": D2_TABLE,
        "D3": [d3_row(a) for a in D3_ALPHAS],
        "D5_ours": table(A0_DERIVE, 0),
        "D5_grid": [table(a, s) for a in (A0_DERIVE, 0.02, 0.05, 0.1, 1 / 8, 0.2) for s in (0, -0.2, 0.3)],
        "D5_alpha_max_for_O": {"finite_size": thresh(8, 0, True), "point": thresh(8, 0, False)},
        "D5_alpha_max_for_C": {"finite_size": thresh(6, 0, True), "point": thresh(6, 0, False)},
        "D5_alpha_max_for_Fe": {"finite_size": thresh(26, 0, True), "point": thresh(26, 0, False)},
        "D6_ours": D6_ours,
        "D6_alpha_max_at_our_beta": {k: math.sqrt(B0_DERIVE / v) for k, v in ks.items()},
        "D6_alpha_min_at_our_beta": math.sqrt(BARRIER / B0_DERIVE),
        "beta_max_ordered": 1 / 81,
        "beta_margin_ordered": (1 / 81) / B0_DERIVE,
        "D7_landauer_300K_J": J,
        "D7_eV": J / QE,
        "D9": {
            "dQ": DQ_HYPOT, "dE": DE_HYPOT,
            "r_crit_central": r_crit(Q_NP, E_NP, B0_DERIVE),
            "r_crit_lo": r_crit(Q_NP - DQ_HYPOT, E_NP - DE_HYPOT, B0_DERIVE),
            "r_crit_hi": r_crit(Q_NP + DQ_HYPOT, E_NP + DE_HYPOT, B0_DERIVE),
            "alpha_crit_central": A0_DERIVE * r_crit(Q_NP, E_NP, B0_DERIVE),
            "lattice_mn_mp_ours": Q_NP + E_NP,
            "beta_crit_at_alpha0": (Q_NP + E_NP) / MP_MEV,
        },
    }


def hydrogen_box(alpha, beta):
    r = alpha / A0_DIAL
    corners = [
        (Q_NP - DQ_BOX) + (E_NP - DE_BOX) * r,
        (Q_NP + DQ_BOX) + (E_NP + DE_BOX) * r,
        (Q_NP - DQ_BOX) + (E_NP + DE_BOX) * r,
        (Q_NP + DQ_BOX) + (E_NP - DE_BOX) * r,
    ]
    return min(corners), max(corners), beta * MP_MEV


def lambda_lifetime_gyr(x):
    if not (x < 0):
        return math.inf
    return LAMBDA_T0 / math.sqrt(abs(x))


def links_of(d):
    n, a, b, s, arr, L = d["dimensions"], d["alpha"], d["beta"], d["strong"], d["arrow"], d["cosmological_constant"]
    lo, hi, me = hydrogen_box(a, b)
    tab = table(a, s)
    Ltab = tab["L"]
    xstar = b / (a * a)
    da = abs(a / A0_DIAL - 1)
    ds = abs(s)
    out = []

    def add(i, status):
        out.append({"id": i, "status": status})

    add("l.s01.hyperbolic-laws", "PASS")
    add("l.s02.huygens", "PASS" if n in (3, 5) else "WEAK")
    add("l.s03.orbit-stability", "PASS" if n == 3 else ("WEAK" if n == 2 else "FAIL"))
    add("l.s03.hydrogen-ground-state", "PASS" if n == 3 else ("FAIL" if n >= 4 else "WEAK"))
    add("l.s03.gravity-orbits", "PASS" if n == 3 else "FAIL")
    add("l.s04.atomic-scales", "PASS")
    add("l.s04.nonrelativistic-atoms", "PASS" if a < 0.2 else ("CONTESTED" if a < 1 / 3 else "FAIL"))
    add("l.s07.coulomb-barrier", "PASS" if a * a * b >= BARRIER else "FAIL")
    add("l.s07.star-mass-window", "PASS" if xstar >= 1 / 100 else ("FAIL" if xstar < K_ADAMS else "CONTESTED"))
    add("l.s07g.lambda-galaxies", "PASS" if L < LAMBDA_GALAXY else "FAIL")
    add("l.s05.carbon-nuclei", "PASS" if 0.1 * (1 + s) >= 0.3 * math.sqrt(a) else "FAIL")
    add("l.s05.hydrogen-stable", "PASS" if lo > me else ("FAIL" if hi < me else "CONTESTED"))
    add("l.s05.table-length", "PASS" if Ltab >= 26 else ("WEAK" if Ltab >= 8 else "FAIL"))
    add("l.s06.nuclei-still", "PASS" if b < 1 / 81 else ("CONTESTED" if b > 81 else "FAIL"))
    add("l.s06.water", "PASS" if a <= 10 * A0_DIAL else "WEAK")
    add("l.s08.hoyle-window", "PASS" if ds <= 0.005 and da <= 0.02 else "CONTESTED")
    if s > 0.06 or s < -0.04:
        pp = "CONTESTED"
    else:
        pp = "PASS"
    add("l.s08.pp-chain", pp)
    add("l.s09.planet-orbits", "PASS" if n == 3 else "FAIL")
    if L >= LAMBDA_LIFE:
        ll = "PASS"
    elif L >= LAMBDA_LIFE_LOOSE:
        ll = "CONTESTED"
    else:
        ll = "FAIL"
    add("l.s11.lambda-lifetime", ll)
    add("l.s10.landauer", "PASS")
    add("l.s10.past-traces", "PASS" if arr >= 1 else "FAIL")
    add("l.s10.toy-arrow", "PASS" if arr >= 1 else "FAIL")
    add("l.s11.life", "OPEN")
    add("l.s12.minds", "OPEN")
    add("l.s13.carers", "OPEN")
    return out, tab, (lo, hi, me)


LINK_TO = {
    "l.s01.hyperbolic-laws": "s01.predictable-laws",
    "l.s02.huygens": "s02.sharp-signals",
    "l.s03.orbit-stability": "s03.orbits-atoms-gravity",
    "l.s03.hydrogen-ground-state": "s03.orbits-atoms-gravity",
    "l.s03.gravity-orbits": "s03.orbits-atoms-gravity",
    "l.s04.atomic-scales": "s04.stable-atoms",
    "l.s04.nonrelativistic-atoms": "s04.stable-atoms",
    "l.s07.coulomb-barrier": "s07.stars",
    "l.s07.star-mass-window": "s07.stars",
    "l.s07g.lambda-galaxies": "s07g.galaxies",
    "l.s05.carbon-nuclei": "s05.hydrogen-table",
    "l.s05.hydrogen-stable": "s05.hydrogen-table",
    "l.s05.table-length": "s05.hydrogen-table",
    "l.s06.nuclei-still": "s06.chemistry",
    "l.s06.water": "s06.chemistry",
    "l.s08.hoyle-window": "s08.fusion-hoyle",
    "l.s08.pp-chain": "s08.fusion-hoyle",
    "l.s09.planet-orbits": "s09.planets",
    "l.s11.lambda-lifetime": "s11.life",
    "l.s10.landauer": "s10.records",
    "l.s10.past-traces": "s10.records",
    "l.s10.toy-arrow": "s10.records",
    "l.s11.life": "s11.life",
    "l.s12.minds": "s12.minds",
    "l.s13.carers": "s13.carers",
}


def evaluate(raw):
    d = dict(OURS)
    d.update(raw)
    d["dimensions"] = int(round(d["dimensions"]))
    d["arrow"] = int(round(d["arrow"]))
    rows, tab, box = links_of(d)
    by = {s: [] for s, _, _ in STAGES}
    for ln in rows:
        by[LINK_TO[ln["id"]]].append(ln)
    stage_map = {}
    for sid, order, req in sorted(STAGES, key=lambda t: t[1]):
        lines = by[sid] if sid != "s00.rules" else [{"id": "s00.rules", "status": "PASS"}]
        own = "PASS"
        for l in lines:
            if RANK[l["status"]] > RANK[own]:
                own = l["status"]
        ups = [stage_map[p] for p in req]
        blocked = any(u["status"] in ("FAIL", "BLOCKED") for u in ups)
        status = "BLOCKED" if blocked else own
        stage_map[sid] = {"id": sid, "status": status, "verdict": VERDICT_OF[status]}
    return {
        "dials": d,
        "stages": {k: v["status"] for k, v in stage_map.items()},
        "verdicts": {k: v["verdict"] for k, v in stage_map.items()},
        "links": {r["id"]: r["status"] for r in rows},
        "table": tab,
        "box": {"lo": box[0], "hi": box[1], "me": box[2]},
    }


def rel_close(a, b, rtol=1e-9, atol=1e-15):
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b or a == b
    if isinstance(a, int) and isinstance(b, int) and not isinstance(a, bool):
        return a == b
    try:
        fa, fb = float(a), float(b)
    except (TypeError, ValueError):
        return a == b
    if math.isnan(fa) and math.isnan(fb):
        return True
    if fa == fb:
        return True
    denom = max(abs(fa), abs(fb))
    if denom == 0:
        return abs(fa - fb) <= atol
    return abs(fa - fb) / denom <= rtol or abs(fa - fb) <= atol


def walk_diff(a, b, path=""):
    diffs = []
    if isinstance(a, dict) and isinstance(b, dict):
        keys = set(a) | set(b)
        for k in keys:
            if k not in a:
                diffs.append((path + "." + str(k), "missing in a", b[k]))
            elif k not in b:
                diffs.append((path + "." + str(k), a[k], "missing in b"))
            else:
                diffs.extend(walk_diff(a[k], b[k], path + "." + str(k)))
        return diffs
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            diffs.append((path + ".len", len(a), len(b)))
            return diffs
        for i, (x, y) in enumerate(zip(a, b)):
            diffs.extend(walk_diff(x, y, path + f"[{i}]"))
        return diffs
    if not rel_close(a, b):
        diffs.append((path, a, b))
    return diffs
