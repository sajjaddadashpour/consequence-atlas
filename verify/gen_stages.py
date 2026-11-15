"""Generate the stage list in the site engine from atlas/stages/*.yaml.

The YAML files are the single source of truth. This writes the block between
the GENERATED STAGES markers in site/engine/atlas.js and
site/engine/parity/eval_ref.py. Physics is unchanged: only ids, names, order
and requires are copied.

    python -m verify.gen_stages          # rewrite both files
    python -m verify.gen_stages --check  # exit 1 if either file is stale
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "site/engine/atlas.js"
PY = ROOT / "site/engine/parity/eval_ref.py"
BEGIN, END = "BEGIN GENERATED STAGES (verify/gen_stages.py)", "END GENERATED STAGES"


def load_stages(root: Path = ROOT) -> list[dict]:
    stages = []
    for f in sorted((root / "atlas/stages").glob("*.yaml")):
        d = yaml.safe_load(f.read_text())
        stages.append({"id": d["id"], "name": d["name"], "order": int(d["order"]), "requires": list(d.get("requires") or [])})
    ids = {s["id"] for s in stages}
    orders = [s["order"] for s in stages]
    if len(set(orders)) != len(orders):
        raise ValueError("duplicate stage order")
    by_id = {s["id"]: s for s in stages}
    for s in stages:
        for r in s["requires"]:
            if r not in ids:
                raise ValueError(f"{s['id']} requires unknown stage {r}")
            if by_id[r]["order"] >= s["order"]:
                raise ValueError(f"{s['id']} requires {r}, which does not come earlier in order")
    return sorted(stages, key=lambda s: s["order"])


def js_block(stages: list[dict]) -> str:
    rows = [
        f'  {{ id: {json.dumps(s["id"])}, name: {json.dumps(s["name"])}, order: {s["order"]}, requires: {json.dumps(s["requires"])} }},'
        for s in stages
    ]
    return "export const STAGES = [\n" + "\n".join(rows) + "\n];\n"


def py_block(stages: list[dict]) -> str:
    rows = [f'    ({json.dumps(s["id"])}, {s["order"]}, {json.dumps(s["requires"])}),' for s in stages]
    return "STAGES = [\n" + "\n".join(rows) + "\n]\n"


def splice(text: str, comment: str, block: str) -> str:
    b, e = f"{comment} {BEGIN}\n", f"{comment} {END}\n"
    i, j = text.index(b) + len(b), text.index(e)
    return text[:i] + block + text[j:]


def render(root: Path = ROOT) -> dict[Path, str]:
    stages = load_stages(root)
    js, py = root / JS.relative_to(ROOT), root / PY.relative_to(ROOT)
    return {
        js: splice(js.read_text(), "//", js_block(stages)),
        py: splice(py.read_text(), "#", py_block(stages)),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--root", type=Path, default=ROOT)
    a = ap.parse_args(argv)
    stale = []
    for path, new in render(a.root).items():
        if path.read_text() != new:
            stale.append(path)
            if not a.check:
                path.write_text(new)
    if a.check and stale:
        print("stale generated stages in: " + ", ".join(str(p.relative_to(a.root)) for p in stale), file=sys.stderr)
        return 1
    print("stages ok" if not stale else "rewrote: " + ", ".join(str(p.relative_to(a.root)) for p in stale))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
