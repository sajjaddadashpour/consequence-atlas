"""Gate checker v0 (local prototype). Implements docs/proposals/GATE_RERUN_RULES.md up to DIFFERS.

Pipeline per card:
  1. Engine pin: sha256(engine.ts) must equal rules.code_hash, else HELD.
  2. Reproduction: rerun the card's submitted runs (their own seeds) and compare output hashes
     byte for byte (Starter is deterministic). Any mismatch -> REJECTED (card stays CONJECTURE, author flagged).
  3. Gate arms: test, control, null at the locked size and half size, n seeds each, seeds derived from
     (lock.hash, card id, arm, size, i). Agents cannot pick them. Submitted outputs are never used for statistics.
  4. Per declared measure (hypothesis.measure + extra_measures): Welch z, Bonferroni z_crit(k);
     deterministic arms (sd = 0) use an exact compare against min_effect.
  5. INERT: test and control outputs byte-identical at every gate seed at both sizes.
  6. Null: deciding measure, null vs control at both sizes, |z| > 3. A stochastic trip gets ONE confirming rerun at that size
     with an independent seed stream (arm tag 'null-confirm'); DEAD-END only if the confirmation also trips (either sign).
     A deterministic trip (exact compare) is final: no confirmation.
Family pass: Benjamini-Hochberg q = 0.05 over every card in the family (cards not rerun count as p = 1).
"""
from __future__ import annotations

import hashlib
import json
import math
import subprocess
import tempfile
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

from . import stats
from .seeds import gate_seeds

ROOT = Path(__file__).resolve().parents[2]
ENGINE_TS = ROOT / "engine/starter/src/engine.ts"
LADDER = ["CONJECTURE", "REPRODUCED", "DIFFERS"]
FDR_Q = 0.05


def engine_sha() -> str:
    return "sha256:" + hashlib.sha256(ENGINE_TS.read_bytes()).hexdigest()


def half(cfg: dict) -> dict:
    """Same half-size rule as the locked v3 sweep and run-card.ts."""
    f = cfg.get("family")
    c = dict(cfg)
    if f == "Q":
        c["steps"] = c["steps"] // 2
    elif f == "M":
        if c.get("meta") == "pop":
            c["popN"] = c["popN"] // 2
        else:
            c["steps"] = c["steps"] // 2
    else:
        c["size"] = c["size"] // 2
    return c


def measure_value(m: dict, name: str) -> float | None:
    if name == "SS":
        if m.get("S") is None or not m.get("Sref"):
            return None
        return m["S"] / m["Sref"]
    v = m.get(name)
    if v is None or isinstance(v, bool) or (isinstance(v, float) and not math.isfinite(v)):
        return None
    return float(v)


def declared_measures(card: dict) -> list[str]:
    h = card["hypothesis"]
    return [h["measure"]] + [x for x in h.get("extra_measures", []) if x != h["measure"]]


@dataclass
class CardResult:
    card_id: str
    family: str
    label_on_card: str
    status: str = "ok"  # ok | HELD | REJECTED
    reasons: list[str] = field(default_factory=list)
    repro_checked: int = 0
    repro_matched: int = 0
    inert: bool = False
    k: int = 0
    z_crit: float = 0.0
    measure: str | None = None
    full: dict | None = None
    half: dict | None = None
    null_full: dict | None = None
    null_half: dict | None = None
    full_pass: bool = False
    half_pass: bool = False
    null_trip: bool = False
    null_pending: list = field(default_factory=list)  # sizes whose stochastic null tripped, awaiting confirmation
    null_full_confirm: dict | None = None
    null_half_confirm: dict | None = None
    null_confirmed: bool | None = None  # None: no stochastic trip; False: trip not confirmed (null passes); True: confirmed trip
    p_adj: float = 1.0
    q: float | None = None
    label: str = "CONJECTURE"
    seeds: dict = field(default_factory=dict)
    runtime_s: float = 0.0


def build_plan(card: dict, n_seeds: int, repro_fraction: float = 1.0) -> tuple[list[dict], dict]:
    from_json = lambda s: json.loads(s)  # noqa: E731
    lock = card["lock"]["hash"]
    sizes = card["hypothesis"]["sizes"]
    T = from_json(card["rules"]["settings"])
    C = from_json(card["control"]["settings"])
    try:
        N = from_json(card["control"].get("null_settings") or "")
        if not isinstance(N, dict):
            N = None
    except (ValueError, TypeError):
        N = None
    if N is None:
        N = dict(C)  # fallback null: control settings with fresh independent gate seeds
    cfgs = {"test": T, "control": C, "null": N}
    arms, seeds = [], {}
    # half() needs DEF-merged values; the TS side merges DEF, so we send explicit halved fields computed there.
    for arm, cfg in cfgs.items():
        for tag, size in (("full", sizes[0]), ("half", sizes[1])):
            sd = gate_seeds(f"{lock}|{card['id']}", arm, int(size), n_seeds)
            key = f"{arm}:{tag}"
            seeds[key] = sd
            arms.append({"key": key, "settings": cfg, "half": tag == "half", "seeds": sd})
    # reproduction of submitted runs
    keymap = {"A": ("test", False), "Ah": ("test", True), "C": ("control", False), "Ch": ("control", True), "N": ("null", False)}
    by_key: dict[str, list[tuple[int, int, str]]] = {}
    for r in card.get("runs", []):
        uri = r.get("output_uri", "")
        if "#/" not in uri:
            continue
        k, idx = uri.split("#/")[1].split("/")
        if k in keymap:
            by_key.setdefault(k, []).append((int(idx), int(r["seed"]), r["output_hash"]))
    want = {}
    for k, rows in by_key.items():
        rows.sort()
        if repro_fraction < 1.0:
            # deterministic sample keyed on the lock hash, at least one run per arm
            n = max(1, round(len(rows) * repro_fraction))
            rows = sorted(rows, key=lambda t: hashlib.sha256(f"{lock}|{card['id']}|{k}|{t[0]}".encode()).hexdigest())[:n]
        arm, is_half = keymap[k]
        arms.append({"key": f"repro:{k}", "settings": cfgs[arm], "half": is_half, "seeds": [s for _, s, _ in rows]})
        want[f"repro:{k}"] = [h for _, _, h in rows]
    return arms, {"seeds": seeds, "want": want, "null_settings": N, "n_seeds": n_seeds}


def run_engine(arms: list[dict], timeout_s: float) -> dict:
    tsx = ROOT / "engine/starter/node_modules/.bin/tsx"
    if not tsx.exists():
        raise RuntimeError("tsx missing: run `npm install` in engine/starter first")
    with tempfile.TemporaryDirectory() as td:
        jp, op = Path(td) / "job.json", Path(td) / "out.json"
        jp.write_text(json.dumps({"arms": arms}))
        subprocess.run([str(tsx), str(ROOT / "verify/gate/run_arms.ts"), str(jp), str(op)], cwd=ROOT, check=True, timeout=timeout_s,
                       capture_output=True)
        return json.loads(op.read_text())


def _vals(rows: list[dict], m: str) -> list[float] | None:
    v = [measure_value(r["m"], m) for r in rows]
    return None if any(x is None for x in v) else v  # type: ignore[return-value]


def evaluate(card: dict, out: dict, meta: dict) -> CardResult:
    """Pure decision step given engine outputs (testable without the engine)."""
    res = CardResult(card["id"], card["family"], card["label"], seeds=meta["seeds"])
    # reproduction
    for key, hashes in meta["want"].items():
        got = [r["hash"] for r in out.get(key, [])]
        res.repro_checked += len(hashes)
        res.repro_matched += sum(1 for a, b in zip(got, hashes) if a == b)
    if res.repro_checked == 0:
        res.status = "HELD"
        res.reasons.append("No submitted runs to reproduce.")
    elif res.repro_matched != res.repro_checked:
        res.status = "REJECTED"
        res.reasons.append(f"Submitted outputs not reproduced ({res.repro_matched}/{res.repro_checked} hashes match): card rejected, author flagged.")
    # inert
    res.inert = all([a["hash"] for a in out[f"test:{t}"]] == [c["hash"] for c in out[f"control:{t}"]] for t in ("full", "half"))
    ms = declared_measures(card)
    res.k = len(ms)
    res.z_crit = stats.z_crit(res.k)
    min_eff = card["hypothesis"].get("min_effect")
    best = None
    for m in ms:
        a, c = _vals(out["test:full"], m), _vals(out["control:full"], m)
        if a is None or c is None:
            continue
        cmp_ = stats.compare(m, a, c, res.z_crit, min_eff)
        if best is None or cmp_.p < best.p or (cmp_.p == best.p and cmp_.deterministic and cmp_.differs and not best.differs):
            best = cmp_
    if best is None:
        res.reasons.append("No declared measure is defined for this engine output.")
        return res
    m = best.measure
    res.measure = m
    res.full = asdict(best)
    res.full_pass = best.differs
    res.p_adj = 0.0 if (best.deterministic and best.differs) else (min(1.0, res.k * best.p) if not best.deterministic else 1.0)
    ha, hc = _vals(out["test:half"], m), _vals(out["control:half"], m)
    if ha is not None and hc is not None:
        h = stats.compare(m, ha, hc, res.z_crit, min_eff)
        res.half = asdict(h)
        res.half_pass = h.differs and (h.effect > 0) == (best.effect > 0)
    for tag in ("full", "half"):
        na, nc = _vals(out[f"null:{tag}"], m), _vals(out[f"control:{tag}"], m)
        if na is None or nc is None:
            continue
        n = stats.compare(m, na, nc, stats.NULL_Z, min_eff)
        setattr(res, f"null_{tag}", asdict(n))
        if n.differs:
            if n.deterministic:
                res.null_trip = True  # exact compare: a rerun cannot change it, no confirmation
                res.reasons.append(f"Deterministic null differs exactly at {tag} size (no confirmation needed).")
            else:
                res.null_pending.append(tag)
    return res


def confirm_plan(card: dict, res: CardResult, meta: dict) -> list[dict]:
    """Arms for the ONE confirming null rerun per tripped size: same size, same seed count, seed tag 'null-confirm'."""
    sizes = card["hypothesis"]["sizes"]
    arms = []
    for tag in res.null_pending:
        size = int(sizes[0] if tag == "full" else sizes[1])
        sd = gate_seeds(f"{card['lock']['hash']}|{card['id']}", "null-confirm", size, meta["n_seeds"])
        meta["seeds"][f"null-confirm:{tag}"] = sd
        res.seeds[f"null-confirm:{tag}"] = sd
        arms.append({"key": f"null-confirm:{tag}", "settings": meta["null_settings"], "half": tag == "half", "seeds": sd})
    return arms


def apply_confirmation(card: dict, res: CardResult, out: dict, conf: dict) -> CardResult:
    """DEAD-END only if the confirmation also trips (|z| > 3, either sign). Otherwise the null passes, flagged null_confirmed=False."""
    if not res.null_pending:
        return res
    m = res.measure
    min_eff = card["hypothesis"].get("min_effect")
    confirmed = False
    for tag in res.null_pending:
        na, nc = _vals(conf[f"null-confirm:{tag}"], m), _vals(out[f"control:{tag}"], m)
        if na is None or nc is None:
            confirmed = True  # cannot confirm a pass: treat conservatively as confirmed trip
            res.reasons.append(f"Confirming null at {tag} size has undefined {m}.")
            continue
        n = stats.compare(m, na, nc, stats.NULL_Z, min_eff)
        setattr(res, f"null_{tag}_confirm", asdict(n))
        if n.differs:
            confirmed = True
    res.null_confirmed = confirmed
    if confirmed:
        res.null_trip = True
    else:
        res.reasons.append("Null tripped once but the independent confirming rerun passed: null counts as passed (null_confirmed=false).")
    res.null_pending = []
    return res


def assign_labels(results: list[CardResult], family_sizes: dict[str, int]) -> None:
    """Family BH-FDR, then the promotion ladder up to DIFFERS."""
    fams: dict[str, list[CardResult]] = {}
    for r in results:
        fams.setdefault(r.family, []).append(r)
    for fam, rs in fams.items():
        m_total = max(family_sizes.get(fam, len(rs)), len(rs))
        p = [r.p_adj for r in rs] + [1.0] * (m_total - len(rs))
        q = stats.bh_qvalues(p)
        for r, qq in zip(rs, q):
            r.q = qq
    for r in results:
        r.label = decide(r)


def decide(r: CardResult) -> str:
    if r.status in ("HELD", "REJECTED"):
        return "CONJECTURE"
    if r.inert:
        r.reasons.append("Test and control outputs are byte-identical at every gate seed at both sizes.")
        return "INERT-BY-CONSTRUCTION"
    if r.null_pending:
        raise ValueError("null trip awaiting confirmation: call apply_confirmation first")
    if r.null_trip:
        r.reasons.append(f"Null arm differs from control on {r.measure}" + (" and the confirming rerun also tripped" if r.null_confirmed else "") + ": artifact of the statistic.")
        return "DEAD-END"
    if r.full_pass and r.half_pass and r.q is not None and r.q <= FDR_Q:
        return "DIFFERS"
    if r.full_pass and not r.half_pass:
        r.reasons.append("Passes at the locked size but not at half size (or the sign flips).")
    elif r.full_pass:
        r.reasons.append(f"Fails family BH-FDR (q = {r.q:.3g}).")
    else:
        r.reasons.append(f"No declared measure beats control after Bonferroni k = {r.k}.")
    return "FAILED"


def check_card(path: Path, n_seeds: int = 5, repro_fraction: float = 1.0, timeout_s: float = 600) -> CardResult:
    t0 = time.time()
    card = json.loads(path.read_text())
    if card.get("rules", {}).get("code_hash") != engine_sha():
        r = CardResult(card["id"], card["family"], card["label"], status="HELD", reasons=["Engine sha256 does not match rules.code_hash."])
        r.runtime_s = time.time() - t0
        return r
    arms, meta = build_plan(card, n_seeds, repro_fraction)
    try:
        out = run_engine(arms, timeout_s)
    except subprocess.TimeoutExpired:
        r = CardResult(card["id"], card["family"], card["label"], status="HELD", reasons=[f"Budget guard: exceeded {timeout_s}s (held, not failed)."])
        r.runtime_s = time.time() - t0
        return r
    r = evaluate(card, out, meta)
    if r.null_pending:
        try:
            conf = run_engine(confirm_plan(card, r, meta), timeout_s)
        except subprocess.TimeoutExpired:
            r.status = "HELD"
            r.reasons.append(f"Budget guard: confirming null exceeded {timeout_s}s (held, not failed).")
            r.runtime_s = time.time() - t0
            return r
        apply_confirmation(card, r, out, conf)
    r.runtime_s = time.time() - t0
    return r
