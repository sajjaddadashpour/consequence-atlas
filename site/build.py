#!/usr/bin/env python3
"""Build the static TOE Consequences Atlas site from repository data.

Reads cards, dead-ends, atlas links and stages. Excludes examples/.
Writes plain HTML, CSS, JS and a compact JSON index to --out.

Usage:
    python3 site/build.py --out dist/site
    python3 site/build.py --out dist/site --cname toeatlas.si
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from ruamel.yaml import YAML

SITE_DIR = Path(__file__).resolve().parent
REPO_ROOT = SITE_DIR.parent
GITHUB_BLOB = "https://github.com/sajjaddadashpour/consequence-atlas/blob/main"
GITHUB_REPO = "https://github.com/sajjaddadashpour/consequence-atlas"

# Wording taken from README.md and docs/CARD_SCHEMA_v0.md. Do not invent new meanings.
CARD_LABEL_MEANINGS = [
    ("CONJECTURE", "Agent claim, nothing checked (default)."),
    ("REPRODUCED", "Server rerun matches the raw output hashes for >=3 seeds."),
    ("DIFFERS", "|z| > 3 vs the fair control at the locked size."),
    ("ROBUST", "DIFFERS in the same direction at half size AND at 2x size (or 2x steps)."),
    (
        "KNOWN-MECHANISM",
        "ROBUST effect checked against the library of known mechanisms (annihilation scaling, coarsening, clustering under attraction, conservation, localization, etc.).",
    ),
    (
        "NOVEL-CANDIDATE",
        "ROBUST effect checked against the library of known mechanisms. NOVEL-CANDIDATE needs human+Physicist review before any 'new physics' wording.",
    ),
    ("FAILED", "Hypothesis locked and not met. Kept; not a promotion."),
    ("DEAD-END", "Branch abandoned with reason. Kept; not a promotion."),
    (
        "INERT-BY-CONSTRUCTION",
        "The control was identical by construction. It is not a promotion and it is not DIFFERS.",
    ),
]

LINK_LABEL_MEANINGS = [
    ("DERIVED", "A derived claim, with its sources."),
    ("DERIVED-UNDER-ASSUMPTION", "Derived, with the assumptions stated (non-empty assumptions array)."),
    ("IMPORTED", "Cites at least one source, and every cited id must exist under sources/."),
    ("ASSUMED", "An assumed claim, labelled as such."),
    ("CONJECTURE", "A conjectural link, not yet derived or imported."),
    ("CONTESTED", "A contested claim; disagreement is marked rather than hidden."),
]


def _yaml() -> YAML:
    loader = YAML(typ="safe")
    return loader


def git_commit(root: Path) -> str | None:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return out.strip() or None
    except (OSError, subprocess.CalledProcessError):
        return None


def is_legacy(null_settings: object) -> bool:
    return str(null_settings or "").startswith("NOT-RUN")


def load_stages(root: Path) -> dict[str, dict]:
    stages: dict[str, dict] = {}
    folder = root / "atlas" / "stages"
    if not folder.is_dir():
        return stages
    loader = _yaml()
    for path in sorted(folder.glob("*.yaml")):
        data = loader.load(path.read_text(encoding="utf-8")) or {}
        if isinstance(data, dict) and data.get("id"):
            stages[data["id"]] = {
                "id": data["id"],
                "name": data.get("name") or data["id"],
                "order": data.get("order"),
                "path": str(path.relative_to(root)).replace("\\", "/"),
            }
    return stages


def load_cards(root: Path) -> list[dict]:
    records: list[dict] = []
    for bucket, kind in (("cards", "card"), ("dead-ends", "dead-end")):
        base = root / bucket
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("card.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            rel = str(path.relative_to(root)).replace("\\", "/")
            control = data.get("control") or {}
            hypothesis = data.get("hypothesis") or {}
            engine = data.get("engine") or {}
            start = data.get("start") or {}
            result = data.get("result")
            compact_result = None
            if isinstance(result, dict):
                compact_result = {
                    "effect": result.get("effect"),
                    "se": result.get("se"),
                    "z": result.get("z"),
                    "deterministic": result.get("deterministic"),
                    "half_size_z": result.get("half_size_z"),
                    "double_size_z": result.get("double_size_z"),
                    "fdr_q": result.get("fdr_q"),
                }
            replications = data.get("replications") or []
            compact_reps = [
                {
                    "agent": item.get("agent"),
                    "lineage": item.get("lineage"),
                    "match": item.get("match"),
                }
                for item in replications
                if isinstance(item, dict)
            ]
            records.append(
                {
                    "type": "card",
                    "kind": kind,
                    "id": data["id"],
                    "label": data["label"],
                    "path": rel,
                    "github": f"{GITHUB_BLOB}/{rel}",
                    "author": data.get("author"),
                    "engine": engine.get("name"),
                    "engine_version": engine.get("version"),
                    "family": data.get("family"),
                    "factor": control.get("changed_factor"),
                    "topic": control.get("changed_factor"),
                    "measure": hypothesis.get("measure"),
                    "direction": hypothesis.get("direction"),
                    "sizes": hypothesis.get("sizes"),
                    "steps": hypothesis.get("steps"),
                    "n_seeds": hypothesis.get("n_seeds"),
                    "extra_measures": hypothesis.get("extra_measures") or [],
                    "start": start.get("kind"),
                    "settings": control.get("settings"),
                    "null_settings": control.get("null_settings"),
                    "legacy": is_legacy(control.get("null_settings")),
                    "lock": data.get("lock"),
                    "gate": data.get("gate"),
                    "label_set_by": data.get("label_set_by"),
                    "result": compact_result,
                    "replications": compact_reps,
                    "novelty": data.get("novelty"),
                    "parents": data.get("parents") or [],
                    "meanings": data.get("meanings") or [],
                    "notes": data.get("notes"),
                    "dead_end_reason": data.get("dead_end_reason"),
                    "schema_version": data.get("schema_version"),
                    "n_runs": len(data.get("runs") or []),
                }
            )
    return records


def load_links(root: Path, stages: dict[str, dict]) -> list[dict]:
    records: list[dict] = []
    folder = root / "atlas" / "links"
    if not folder.is_dir():
        return records
    loader = _yaml()
    for path in sorted(folder.glob("*.yaml")):
        data = loader.load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(data, dict) or not data.get("id"):
            continue
        rel = str(path.relative_to(root)).replace("\\", "/")
        src = data.get("from")
        dst = data.get("to")
        records.append(
            {
                "type": "link",
                "kind": "link",
                "id": data["id"],
                "label": data["label"],
                "path": rel,
                "github": f"{GITHUB_BLOB}/{rel}",
                "from": src,
                "to": dst,
                "from_name": (stages.get(src) or {}).get("name") or src,
                "to_name": (stages.get(dst) or {}).get("name") or dst,
                "topic": f"{src} → {dst}",
                "condition": data.get("condition"),
                "assumptions": data.get("assumptions") or [],
                "window": data.get("window"),
                "sources": data.get("sources") or [],
                "status": data.get("status"),
                "notes": data.get("notes"),
            }
        )
    return records


def count_labels(records: list[dict]) -> dict[str, int]:
    return dict(Counter(item["label"] for item in records))


def build_index(root: Path) -> dict:
    commit = git_commit(root)
    stages = load_stages(root)
    cards = load_cards(root)
    links = load_links(root, stages)
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    card_labels = count_labels(cards)
    link_labels = count_labels(links)
    kind_counts = dict(Counter(item["kind"] for item in cards))
    return {
        "format": "consequence-atlas-site-index",
        "format_version": "0.1.0",
        "generated_at": generated_at,
        "source_commit": commit,
        "repository": GITHUB_REPO,
        "note": (
            "Generated from cards/ and dead-ends/ (card.json only) and atlas/links/. "
            "examples/ are excluded. The repository files are the source of record. "
            "Runs and outputs.json are omitted from this compact index."
        ),
        "counts": {
            "cards": sum(1 for item in cards if item["kind"] == "card"),
            "dead_ends": sum(1 for item in cards if item["kind"] == "dead-end"),
            "cards_and_dead_ends": len(cards),
            "links": len(links),
            "legacy": sum(1 for item in cards if item.get("legacy")),
            "with_gate": sum(1 for item in cards if item.get("gate")),
            "card_labels": card_labels,
            "link_labels": link_labels,
            "kinds": kind_counts,
        },
        "stages": list(stages.values()),
        "cards": cards,
        "links": links,
    }


def render_count_pills(counts: dict[str, int], order: list[str]) -> str:
    parts: list[str] = []
    for label in order:
        n = counts.get(label)
        if not n:
            continue
        slug = label.lower().replace("_", "-")
        parts.append(
            f'<li><span class="pill pill-{slug}"><span class="pill-n">{n}</span> {label}</span></li>'
        )
    return "\n            ".join(parts)


def render_meaning_list(pairs: list[tuple[str, str]], css: str) -> str:
    items: list[str] = []
    for label, meaning in pairs:
        slug = label.lower()
        items.append(
            f'<dt><span class="pill pill-{slug}">{label}</span></dt>\n'
            f"          <dd>{_escape(meaning)}</dd>"
        )
    return "\n          ".join(items)


def _escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def render_html(template: str, index: dict) -> str:
    card_order = [name for name, _ in CARD_LABEL_MEANINGS]
    link_order = [name for name, _ in LINK_LABEL_MEANINGS]
    counts = index["counts"]
    commit = index.get("source_commit") or ""
    short = commit[:7] if commit else "local"
    replacements = {
        "{{GENERATED_AT}}": _escape(index["generated_at"]),
        "{{SOURCE_COMMIT}}": _escape(commit),
        "{{SOURCE_COMMIT_SHORT}}": _escape(short),
        "{{REPO_URL}}": GITHUB_REPO,
        "{{N_CARDS}}": str(counts["cards"]),
        "{{N_DEAD_ENDS}}": str(counts["dead_ends"]),
        "{{N_TOTAL_CARDS}}": str(counts["cards_and_dead_ends"]),
        "{{N_LINKS}}": str(counts["links"]),
        "{{N_LEGACY}}": str(counts["legacy"]),
        "{{N_GATES}}": str(counts["with_gate"]),
        "{{N_CONJECTURE}}": str(counts["card_labels"].get("CONJECTURE", 0)),
        "{{N_REPRODUCED}}": str(counts["card_labels"].get("REPRODUCED", 0)),
        "{{CARD_LABEL_PILLS}}": render_count_pills(counts["card_labels"], card_order),
        "{{LINK_LABEL_PILLS}}": render_count_pills(counts["link_labels"], link_order),
        "{{CARD_LABEL_MEANINGS}}": render_meaning_list(CARD_LABEL_MEANINGS, "card"),
        "{{LINK_LABEL_MEANINGS}}": render_meaning_list(LINK_LABEL_MEANINGS, "link"),
        "{{BOOT_JSON}}": json.dumps(
            {
                "generated_at": index["generated_at"],
                "source_commit": commit,
                "counts": counts,
                "repository": index["repository"],
            },
            separators=(",", ":"),
        ),
    }
    html = template
    for key, value in replacements.items():
        html = html.replace(key, value)
    return html


def copy_llms(root: Path, out: Path) -> None:
    src = (root / "llms.txt").read_text(encoding="utf-8")
    header = (
        "# Consequence Atlas — public site\n\n"
        "> Live site: https://toeatlas.si\n"
        "> Compact machine-readable index: https://toeatlas.si/data/index.json\n"
        "> Source repository: https://github.com/sajjaddadashpour/consequence-atlas\n\n"
        "The index lists every real card and atlas link, excluding examples/. "
        "The repository files are the source of record. Do not treat local verdicts "
        "in card notes as gate-signed promotions.\n\n"
        "---\n\n"
    )
    (out / "llms.txt").write_text(header + src, encoding="utf-8")


def write_site(root: Path, out: Path, cname: str | None) -> dict:
    index = build_index(root)
    out.mkdir(parents=True, exist_ok=True)
    (out / "data").mkdir(exist_ok=True)
    template = (SITE_DIR / "templates" / "index.html").read_text(encoding="utf-8")
    (out / "index.html").write_text(render_html(template, index), encoding="utf-8")
    for name in ("styles.css", "app.js", "favicon.svg"):
        src = SITE_DIR / "static" / name
        (out / name).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    (out / "data" / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    copy_llms(root, out)
    (out / ".nojekyll").write_text("", encoding="utf-8")
    if cname:
        (out / "CNAME").write_text(cname.strip() + "\n", encoding="utf-8")
    # Hash routes are client-side; a 404 should still load the app.
    (out / "404.html").write_text((out / "index.html").read_text(encoding="utf-8"), encoding="utf-8")
    return index


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the static TOE Consequences Atlas site.")
    parser.add_argument("--root", type=Path, default=None, help="Repository root (default: parent of site/).")
    parser.add_argument("--out", type=Path, required=True, help="Output directory for the generated site.")
    parser.add_argument("--cname", default=None, help="Write a CNAME file (e.g. toeatlas.si) into the output.")
    args = parser.parse_args(argv)
    root = (args.root or REPO_ROOT).resolve()
    out = args.out.resolve()
    index = write_site(root, out, args.cname)
    counts = index["counts"]
    print(
        f"Wrote site to {out} — "
        f"{counts['cards']} cards, {counts['dead_ends']} dead-ends, {counts['links']} links, "
        f"commit {index.get('source_commit') or 'local'}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
