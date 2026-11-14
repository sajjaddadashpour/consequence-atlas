"""CLI: python3 -m verify.gate [card paths or dirs] [--label CONJECTURE] [--seeds 5] [--repro-fraction 1.0]
       [--jobs 8] [--key PATH] [--out DIR] [--sample N]

Writes report.json, labels.tsv and attestations.json (signed with the LOCAL TEST KEY) to --out.
Never edits cards: a local-test signature must not appear in a card's gate field.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from . import sign
from .gate import ROOT, assign_labels, check_card, engine_sha


def find_cards(paths: list[str]) -> list[Path]:
    out: list[Path] = []
    for p in paths:
        q = Path(p)
        out += sorted(q.rglob("card.json")) if q.is_dir() else [q]
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python3 -m verify.gate")
    ap.add_argument("paths", nargs="*", default=[str(ROOT / "cards")])
    ap.add_argument("--label", default="CONJECTURE")
    ap.add_argument("--seeds", type=int, default=5)
    ap.add_argument("--repro-fraction", type=float, default=1.0)
    ap.add_argument("--jobs", type=int, default=8)
    ap.add_argument("--sample", type=int, default=0, help="check only N cards chosen at random (seeded)")
    ap.add_argument("--key", default=str(Path.home() / ".consequence-atlas/LOCAL_TEST_KEY_NOT_AUTHORITATIVE.pem"))
    ap.add_argument("--out", default="gate-out")
    a = ap.parse_args(argv)

    cards = [p for p in find_cards(a.paths) if json.loads(p.read_text()).get("label") == a.label]
    if a.sample:
        cards = sorted(random.Random(0).sample(cards, min(a.sample, len(cards))))
    # family sizes over the whole repo (cards + dead-ends) for BH
    fam_sizes: dict[str, int] = {}
    for top in ("cards", "dead-ends"):
        for p in (ROOT / top).rglob("card.json"):
            f = json.loads(p.read_text()).get("family")
            fam_sizes[f] = fam_sizes.get(f, 0) + 1
    t0 = time.time()
    with ThreadPoolExecutor(a.jobs) as ex:
        results = list(ex.map(lambda p: check_card(p, a.seeds, a.repro_fraction), cards))
    assign_labels(results, fam_sizes)
    wall = time.time() - t0

    key = sign.load_or_create_private(Path(a.key))
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "LOCAL_TEST_KEY_NOT_AUTHORITATIVE.pub.pem").write_bytes(sign.public_pem(key))
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    esha = engine_sha()
    atts = []
    for r, p in zip(results, cards):
        card = json.loads(p.read_text())
        payload = {"card_id": r.card_id, "lock_hash": card["lock"]["hash"], "engine_sha256": esha, "label": r.label,
                   "result": {"measure": r.measure, "full": r.full, "half": r.half, "null_full": r.null_full, "null_half": r.null_half, "null_full_confirm": r.null_full_confirm, "null_half_confirm": r.null_half_confirm, "null_confirmed": r.null_confirmed,
                              "q": r.q, "repro": [r.repro_matched, r.repro_checked], "status": r.status},
                   "seeds": r.seeds, "timestamp": ts,
                   "notice": "LOCAL TEST SIGNATURE - NON-AUTHORITATIVE. Does not promote this card."}
        atts.append(sign.sign(payload, key))
    pub = sign.load_public(sign.public_pem(key))
    ok = sum(sign.verify(x, pub) for x in atts)
    (out / "attestations.json").write_text(json.dumps(atts, indent=1, allow_nan=False))
    (out / "report.json").write_text(json.dumps({"wall_s": wall, "n": len(results), "signatures_verified": ok,
                                                 "repro_fraction": a.repro_fraction, "seeds": a.seeds,
                                                 "results": [asdict(r) for r in results]}, indent=1, default=str))
    with open(out / "labels.tsv", "w") as f:
        f.write("card_id\tfamily\tmeasure\tz_full\tz_half\tz_null_full\tz_null_half\tz_null_confirm\tnull_confirmed\tq\trepro\tstatus\tgate_label\n")
        for r in results:
            z = lambda d: "" if not d else ("det" if d["z"] is None else f"{d['z']:.2f}")  # noqa: E731
            f.write(f"{r.card_id}\t{r.family}\t{r.measure}\t{z(r.full)}\t{z(r.half)}\t{z(r.null_full)}\t{z(r.null_half)}\t{z(r.null_full_confirm) or z(r.null_half_confirm)}\t{'' if r.null_confirmed is None else str(r.null_confirmed).lower()}\t"
                    f"{'' if r.q is None else f'{r.q:.3g}'}\t{r.repro_matched}/{r.repro_checked}\t{r.status}\t{r.label}\n")
    counts: dict[str, int] = {}
    for r in results:
        counts[r.label] = counts.get(r.label, 0) + 1
    print(json.dumps({"cards": len(results), "wall_s": round(wall, 1), "labels": counts, "signatures_verified": f"{ok}/{len(atts)}"}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
