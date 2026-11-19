#!/usr/bin/env python3
"""Build the locked grid, evaluate in Python and (via node) in atlas.js, report mismatches."""
from __future__ import annotations
import json, math, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parent
sys.path.insert(0, str(HERE))
from eval_ref import (
    A0_DERIVE, A0_DIAL, B0_DIAL, OURS, derived_tables, evaluate, walk_diff, table,
)

def logspace(lo, hi, n, snap=None):
    a, b = math.log(lo), math.log(hi)
    xs = [math.exp(a + (i / (n - 1)) * (b - a)) for i in range(n)]
    if snap is not None and lo <= snap <= hi:
        j = min(range(n), key=lambda i: abs(math.log(xs[i]) - math.log(snap)))
        xs[j] = snap
    xs[0], xs[-1] = lo, hi
    return xs

def linspace_inc(lo, hi, n, include):
    xs = [lo + (i / (n - 1)) * (hi - lo) for i in range(n)]
    for v in include:
        if v < lo or v > hi:
            continue
        if any(x == v for x in xs):
            continue
        j = min(range(n), key=lambda i: abs(xs[i] - v))
        xs[j] = v
    return xs

def symlog_fwd(x, t=1.0):
    s = 1 if x >= 0 else -1
    ax = abs(x)
    if ax <= t:
        return x / t
    return s * (1 + math.log10(ax / t))

def symlog_inv(u, t=1.0):
    s = 1 if u >= 0 else -1
    au = abs(u)
    if au <= 1:
        return u * t
    return s * t * 10 ** (au - 1)

def symlogspace(lo, hi, n, include, t=1.0):
    u0, u1 = symlog_fwd(lo, t), symlog_fwd(hi, t)
    us = [u0 + (i / (n - 1)) * (u1 - u0) for i in range(n)]
    xs = [symlog_inv(u, t) for u in us]
    for v in include:
        if v < lo or v > hi:
            continue
        tv = symlog_fwd(v, t)
        j = min(range(n), key=lambda i: abs(symlog_fwd(xs[i], t) - tv))
        xs[j] = v
    xs[0], xs[-1] = lo, hi
    return xs


def build_grid():
    pts = []
    def add(tag, **kw):
        d = dict(OURS)
        d.update(kw)
        pts.append((tag, d))

    # G1
    alphas = logspace(1e-6, 1, 21, A0_DIAL)
    betas = logspace(1e-5, 100, 21, B0_DIAL)
    for a in alphas:
        for b in betas:
            add("G1", alpha=a, beta=b)
    # G2
    a11 = logspace(1e-6, 1, 11, A0_DIAL)
    # Amendment 1 (Physicist, 2026-11-18, post-C2-run, future runs only): 0.034 -> 0.06 and 0.5 -> 0.55 per LOCKED_C1b_C2b_ENGINE.md
    s_must = [-0.2, -0.04, -0.005, 0, 0.005, 0.06, 0.55, 0.6]
    ss = linspace_inc(-0.2, 0.6, 11, s_must)
    # ensure required s values present: if 11 slots and 8 must + maybe 0 already
    for s in ss:
        for a in a11:
            add("G2", alpha=a, strong=s)
    # G3
    must_L = [-1000, -53.9, -7.09, -1, 0, 1, 57.5, 100, 1000]
    for L in symlogspace(-1000, 1000, 21, must_L):
        add("G3", cosmological_constant=L)
    # G4
    for n in (1, 2, 3, 4, 5):
        for a in a11:
            add("G4", dimensions=n, alpha=a)
    # G5
    for ar in (0, 1, 2):
        add("G5", arrow=ar)
    # G6 D5 grid
    for a in (A0_DERIVE, 0.02, 0.05, 0.1, 1 / 8, 0.2):
        for s in (0, -0.2, 0.3):
            add("G6", alpha=a, strong=s)
    # yaml endpoints one at a time
    add("G6", alpha=1e-6)
    add("G6", alpha=1.0)
    add("G6", beta=1e-5)
    add("G6", beta=100.0)
    add("G6", strong=-0.2)
    add("G6", strong=0.6)
    add("G6", cosmological_constant=-1000)
    add("G6", cosmological_constant=1000)
    add("G6", dimensions=1)
    add("G6", dimensions=5)
    add("G6", arrow=0)
    add("G6", arrow=2)
    # Amendment 1: a point inside the old 2-2.5% Hoyle alpha gap (C1b K1)
    add("G8", alpha=1.022 * A0_DIAL)
    # G7
    for n in (1, 3, 5):
        for ar in (0, 1):
            for a in (1e-4, A0_DIAL, 0.02, 0.1, 0.2, 1 / 3, 0.5):
                for b in (1e-5, B0_DIAL, 1 / 81, 1, 81):
                    for s in (-0.2, 0, 0.06, 0.55):  # Amendment 1: was (-0.2, 0, 0.034, 0.5)
                        for L in (-53.9, 1, 57.5):
                            add("G7", dimensions=n, arrow=ar, alpha=a, beta=b, strong=s, cosmological_constant=L)

    # dedup by exact tuple of values, keep first tag
    seen = {}
    uniq = []
    for tag, d in pts:
        key = (d["dimensions"], d["alpha"], d["beta"], d["strong"], d["arrow"], d["cosmological_constant"])
        if key in seen:
            continue
        seen[key] = tag
        uniq.append((tag, d))
    return uniq


def main():
    grid = build_grid()
    print(f"grid points (deduped): {len(grid)}")
    from collections import Counter
    print("by tag", dict(Counter(t for t, _ in grid)))

    py_rows = []
    for i, (tag, d) in enumerate(grid):
        ev = evaluate(d)
        py_rows.append({"i": i, "tag": tag, "dials": d, "stages": ev["stages"], "verdicts": ev["verdicts"], "links": ev["links"], "table": ev["table"], "box": ev["box"]})

    grid_path = HERE / "grid.json"
    py_path = HERE / "py_eval.json"
    js_path = HERE / "js_eval.json"
    grid_path.write_text(json.dumps([{"i": i, "tag": t, "dials": d} for i, (t, d) in enumerate(grid)]))
    py_path.write_text(json.dumps(py_rows))

    js_script = HERE / "eval_js.mjs"
    js_script.write_text(f"""
import {{ evaluate, derivedTables, table, hydrogenBox }} from "../atlas.js";
import fs from "node:fs";
const grid = JSON.parse(fs.readFileSync({json.dumps(str(grid_path))}, "utf8"));
const rows = grid.map((g) => {{
  const ev = evaluate(g.dials);
  const tab = ev.windows.at_dials;
  const box = {{ lo: tab.mn_mp_lo, hi: tab.mn_mp_hi, me: tab.me }};
  return {{
    i: g.i, tag: g.tag, dials: ev.dials,
    stages: Object.fromEntries(ev.stages.map(s => [s.id, s.status])),
    verdicts: Object.fromEntries(ev.stages.map(s => [s.id, s.verdict])),
    links: Object.fromEntries(ev.links.map(l => [l.id, l.status])),
    table: {{ alpha: ev.dials.alpha, s: ev.dials.strong, Z_dirac: tab.Z_dirac, Z_cr: tab.Z_cr, Z_fis: tab.Z_fis, L: tab.L, L_point: tab.L_point }},
    box,
  }};
}});
fs.writeFileSync({json.dumps(str(js_path))}, JSON.stringify({{ derived: derivedTables(), rows }}));
""")
    r = subprocess.run(["node", str(js_script)], cwd=str(SITE), capture_output=True, text=True)
    if r.returncode != 0:
        print("JS failed:", r.stdout, r.stderr)
        sys.exit(1)
    js = json.loads(js_path.read_text())

    # T-A derived
    gold = json.loads(Path("/workspace/physics/swarm/repo/atlas/derivations/derived.json").read_text())
    d_py = walk_diff(derived_tables(), gold)
    d_js = walk_diff(js["derived"], gold)
    d_pyjs = walk_diff(js["derived"], derived_tables())
    print(f"T-A derived.json vs Python: {len(d_py)} mismatches")
    print(f"T-A derived.json vs JS:     {len(d_js)} mismatches")
    print(f"T-A JS vs Python tables:    {len(d_pyjs)} mismatches")
    for d in (d_py + d_js + d_pyjs)[:12]:
        print("  ", d)

    # T-B verdicts
    js_rows = {r["i"]: r for r in js["rows"]}
    n = len(py_rows)
    stage_mm = link_mm = verdict_mm = table_mm = box_mm = 0
    examples = []
    for row in py_rows:
        jr = js_rows[row["i"]]
        # stages
        if row["stages"] != jr["stages"]:
            stage_mm += 1
            if len(examples) < 8:
                examples.append(("stage", row["tag"], row["dials"], row["stages"], jr["stages"]))
        if row["verdicts"] != jr["verdicts"]:
            verdict_mm += 1
        if row["links"] != jr["links"]:
            link_mm += 1
            if len(examples) < 8:
                examples.append(("link", row["tag"], row["dials"], row["links"], jr["links"]))
        td = walk_diff(row["table"], jr["table"])
        if td:
            table_mm += 1
            if len(examples) < 8:
                examples.append(("table", row["tag"], row["dials"], td[:3]))
        bd = walk_diff(row["box"], jr["box"])
        if bd:
            box_mm += 1
            if len(examples) < 8:
                examples.append(("box", row["tag"], row["dials"], bd[:3]))

    report = {
        "grid_points": n,
        "T-A": {"derived_json_vs_python": len(d_py), "derived_json_vs_js": len(d_js), "js_vs_python_tables": len(d_pyjs)},
        "T-B": {
            "points": n,
            "stage_status_mismatches": stage_mm,
            "stage_verdict_mismatches": verdict_mm,
            "link_status_mismatches": link_mm,
            "table_mismatches": table_mm,
            "box_mismatches": box_mm,
        },
        "examples": examples[:8],
    }
    (HERE / "atlas_parity_report.json").write_text(json.dumps(report, indent=2, default=str))
    print("T-B points", n)
    print("  stage status mismatches:", stage_mm)
    print("  stage verdict mismatches:", verdict_mm)
    print("  link status mismatches:", link_mm)
    print("  table mismatches:", table_mm)
    print("  hydrogen-box mismatches:", box_mm)
    for e in examples[:8]:
        print("  example:", e[0], e[1], e[2] if not isinstance(e[2], dict) else {k: e[2][k] for k in e[2]})
        if len(e) > 4:
            print("    py/js or diff truncated")
    print("report:", HERE / "atlas_parity_report.json")
    ok = all(v == 0 for v in report["T-A"].values()) and all(
        report["T-B"][k] == 0 for k in report["T-B"] if k != "points"
    )
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
