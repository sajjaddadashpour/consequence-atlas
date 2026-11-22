"""Generate the causal graph JSON from the locked atlas registry.

The YAML files under atlas/stages/, atlas/links/, and dials/ are the source
of record. This writes a lightweight graph for the 3D view. It does not
invent edges, and it does not promote or change any stored label.

    python3 -m verify.gen_graph --out dist/site/data/graph.json
    python3 -m verify.gen_graph --check --index dist/site/data/index.json

A gap is a pair of stages that are adjacent in the locked stage order and
have no atlas link from the earlier stage to the later one. Gaps are listed
separately, labelled "no link recorded". They are not links.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from ruamel.yaml import YAML

ROOT = Path(__file__).resolve().parents[1]
GITHUB_BLOB = "https://github.com/sajjaddadashpour/consequence-atlas/blob/main"
FORMAT = "consequence-atlas-graph"
FORMAT_VERSION = "0.1.0"
GAP_LABEL = "no link recorded"
GRAPH_NOTE = (
    "This is a view of locked atlas links. Sparse regions show missing or "
    "weak connections. Live runs do not add or promote links."
)
CONSECUTIVE_RULE = (
    "A gap is a pair of stages that are adjacent in the locked stage order "
    "and have no atlas link from the earlier stage to the later stage. "
    "Gaps are not links."
)
SOLID_LABELS = frozenset({"DERIVED", "DERIVED-UNDER-ASSUMPTION", "IMPORTED"})
DASHED_LABELS = frozenset({"CONJECTURE", "CONTESTED", "ASSUMED", "FAILED", "DEAD-END"})


def _yaml() -> YAML:
    return YAML(typ="safe")


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


def load_stages(root: Path) -> list[dict]:
    folder = root / "atlas" / "stages"
    loader = _yaml()
    stages: list[dict] = []
    for path in sorted(folder.glob("*.yaml")):
        data = loader.load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(data, dict) or not data.get("id"):
            continue
        rel = str(path.relative_to(root)).replace("\\", "/")
        stages.append(
            {
                "id": data["id"],
                "type": "stage",
                "name": data.get("name") or data["id"],
                "label": None,
                "status": None,
                "order": data.get("order"),
                "requires": list(data.get("requires") or []),
                "notes": data.get("notes"),
                "path": rel,
                "github": f"{GITHUB_BLOB}/{rel}",
            }
        )
    orders = [item["order"] for item in stages]
    if len(set(orders)) != len(orders):
        raise ValueError("duplicate stage order")
    return sorted(stages, key=lambda item: int(item["order"]))


def load_dials(root: Path) -> list[dict]:
    folder = root / "dials"
    loader = _yaml()
    dials: list[dict] = []
    for path in sorted(folder.glob("*.yaml")):
        data = loader.load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(data, dict) or not data.get("id"):
            continue
        rel = str(path.relative_to(root)).replace("\\", "/")
        rng = data.get("range") or [None, None]
        dials.append(
            {
                "id": data["id"],
                "type": "dial",
                "name": data.get("name") or data["id"],
                "label": None,
                "status": None,
                "symbol": data.get("symbol"),
                "units": data.get("units"),
                "ours": data.get("ours"),
                "range": [rng[0], rng[1]] if isinstance(rng, (list, tuple)) and len(rng) >= 2 else [],
                "scale": data.get("scale"),
                "sources": list(data.get("sources") or []),
                "sources_count": len(data.get("sources") or []),
                "path": rel,
                "github": f"{GITHUB_BLOB}/{rel}",
            }
        )
    return dials


def load_links(root: Path, stages: list[dict]) -> list[dict]:
    folder = root / "atlas" / "links"
    names = {item["id"]: item["name"] for item in stages}
    loader = _yaml()
    edges: list[dict] = []
    for path in sorted(folder.glob("*.yaml")):
        data = loader.load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(data, dict) or not data.get("id"):
            continue
        rel = str(path.relative_to(root)).replace("\\", "/")
        src = data.get("from")
        dst = data.get("to")
        sources = list(data.get("sources") or [])
        label = data["label"]
        edges.append(
            {
                "id": data["id"],
                "source": src,
                "target": dst,
                "from": src,
                "to": dst,
                "from_name": names.get(src) or src,
                "to_name": names.get(dst) or dst,
                "label": label,
                "style": "solid" if label in SOLID_LABELS else "dashed",
                "condition": data.get("condition"),
                "assumptions": list(data.get("assumptions") or []),
                "window": data.get("window"),
                "sources": sources,
                "sources_count": len(sources),
                "status": data.get("status"),
                "notes": data.get("notes"),
                "path": rel,
                "github": f"{GITHUB_BLOB}/{rel}",
            }
        )
    return edges


def consecutive_gaps(stages: list[dict], edges: list[dict]) -> list[dict]:
    linked = {(item["source"], item["target"]) for item in edges}
    gaps: list[dict] = []
    ordered = sorted(stages, key=lambda item: int(item["order"]))
    for earlier, later in zip(ordered, ordered[1:]):
        pair = (earlier["id"], later["id"])
        if pair in linked:
            continue
        gaps.append(
            {
                "source": earlier["id"],
                "target": later["id"],
                "from": earlier["id"],
                "to": later["id"],
                "from_name": earlier["name"],
                "to_name": later["name"],
                "label": GAP_LABEL,
                "kind": "gap",
            }
        )
    return gaps


def build_graph(root: Path) -> dict:
    """Return the graph dict for ``root``. Does not write any registry files."""
    stages = load_stages(root)
    dials = load_dials(root)
    edges = load_links(root, stages)
    gaps = consecutive_gaps(stages, edges)
    nodes = stages + dials
    return {
        "format": FORMAT,
        "format_version": FORMAT_VERSION,
        "generated_from": "locked registry (atlas/stages, atlas/links, dials/*.yaml)",
        "source_commit": git_commit(root),
        "note": GRAPH_NOTE,
        "consecutive_rule": CONSECUTIVE_RULE,
        "counts": {
            "nodes": len(nodes),
            "stages": len(stages),
            "dials": len(dials),
            "edges": len(edges),
            "gaps": len(gaps),
        },
        "nodes": nodes,
        "edges": edges,
        "gaps": gaps,
    }


def _index_link_key(item: dict) -> tuple:
    return (
        item["id"],
        item.get("from") or item.get("source"),
        item.get("to") or item.get("target"),
        item["label"],
        tuple(item.get("sources") or []),
        tuple(item.get("assumptions") or []),
        item.get("condition"),
        json.dumps(item.get("window"), sort_keys=True, default=str) if item.get("window") is not None else None,
        item.get("status"),
        item.get("notes"),
        item.get("path"),
    )


def assert_matches_registry(graph: dict, root: Path) -> None:
    """Raise AssertionError if the graph does not match the locked YAML registry."""
    expected = build_graph(root)
    if graph["counts"] != expected["counts"]:
        raise AssertionError(f"graph counts {graph['counts']} != registry {expected['counts']}")
    if [node["id"] for node in graph["nodes"]] != [node["id"] for node in expected["nodes"]]:
        raise AssertionError("graph node ids do not match the registry")
    for got, want in zip(graph["nodes"], expected["nodes"]):
        if got != want:
            raise AssertionError(f"graph node {got.get('id')} does not match the registry")
    if [edge["id"] for edge in graph["edges"]] != [edge["id"] for edge in expected["edges"]]:
        raise AssertionError("graph edge ids do not match the registry")
    for got, want in zip(graph["edges"], expected["edges"]):
        if got != want:
            raise AssertionError(f"graph edge {got.get('id')} does not match the registry")
    if graph["gaps"] != expected["gaps"]:
        raise AssertionError("graph gaps do not match consecutive unlocked stage pairs")
    if any(gap.get("label") != GAP_LABEL for gap in graph["gaps"]):
        raise AssertionError("every gap must be labelled 'no link recorded'")
    edge_ids = {edge["id"] for edge in graph["edges"]}
    if len(edge_ids) != len(graph["edges"]):
        raise AssertionError("duplicate edge ids")
    node_ids = {node["id"] for node in graph["nodes"]}
    for edge in graph["edges"]:
        if edge["source"] not in node_ids or edge["target"] not in node_ids:
            raise AssertionError(f"edge {edge['id']} points at a node that is not in the graph")


def assert_matches_index(graph: dict, index: dict) -> None:
    """Raise AssertionError if the graph disagrees with a built data/index.json."""
    stages = {item["id"]: item for item in index.get("stages") or []}
    dials = {item["id"]: item for item in index.get("dials") or []}
    links = {item["id"]: item for item in index.get("links") or []}
    graph_stages = [node for node in graph["nodes"] if node["type"] == "stage"]
    graph_dials = [node for node in graph["nodes"] if node["type"] == "dial"]
    if {node["id"] for node in graph_stages} != set(stages):
        raise AssertionError("graph stages do not match index.json stages")
    if {node["id"] for node in graph_dials} != set(dials):
        raise AssertionError("graph dials do not match index.json dials")
    if {edge["id"] for edge in graph["edges"]} != set(links):
        raise AssertionError("graph edges do not match index.json links")
    if len(graph["edges"]) != index.get("counts", {}).get("links", len(links)):
        raise AssertionError("graph edge count does not match index.json counts.links")
    for node in graph_stages:
        rec = stages[node["id"]]
        if node["name"] != rec["name"] or node["order"] != rec["order"] or node["path"] != rec["path"]:
            raise AssertionError(f"stage {node['id']} does not match index.json")
    for node in graph_dials:
        rec = dials[node["id"]]
        if (
            node["name"] != rec["name"]
            or node.get("symbol") != rec.get("symbol")
            or node.get("units") != rec.get("units")
            or node.get("ours") != rec.get("ours")
            or list(node.get("range") or []) != list(rec.get("range") or [])
            or node.get("scale") != rec.get("scale")
            or list(node.get("sources") or []) != list(rec.get("sources") or [])
            or node["path"] != rec["path"]
        ):
            raise AssertionError(f"dial {node['id']} does not match index.json")
    for edge in graph["edges"]:
        rec = links[edge["id"]]
        if _index_link_key(edge) != _index_link_key(rec):
            raise AssertionError(f"edge {edge['id']} does not match index.json link")
    if any(gap.get("kind") == "gap" and gap["label"] != GAP_LABEL for gap in graph["gaps"]):
        raise AssertionError("gaps must stay labelled 'no link recorded' and must not be stored as links")
    link_ids = set(links)
    if any(gap.get("id") in link_ids for gap in graph["gaps"]):
        raise AssertionError("a gap must not reuse a stored link id")


def dumps(graph: dict) -> str:
    return json.dumps(graph, ensure_ascii=False, indent=2) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=ROOT, help="Repository root.")
    parser.add_argument("--out", type=Path, default=None, help="Write graph JSON to this path.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check a graph file (or a freshly built graph) against the registry and optional index.",
    )
    parser.add_argument(
        "--graph",
        type=Path,
        default=None,
        help="Existing graph JSON to check (default: build from the registry).",
    )
    parser.add_argument(
        "--index",
        type=Path,
        default=None,
        help="Optional data/index.json to check consistency against.",
    )
    args = parser.parse_args(argv)
    root = args.root.resolve()
    built = build_graph(root)
    if args.check:
        if args.graph:
            graph = json.loads(args.graph.read_text(encoding="utf-8"))
        else:
            graph = built
        try:
            assert_matches_registry(graph, root)
            if args.index:
                index = json.loads(args.index.read_text(encoding="utf-8"))
                assert_matches_index(graph, index)
        except AssertionError as exc:
            print(str(exc), file=sys.stderr)
            return 1
        print(
            "graph ok — "
            f"{built['counts']['nodes']} nodes "
            f"({built['counts']['stages']} stages, {built['counts']['dials']} dials), "
            f"{built['counts']['edges']} edges, "
            f"{built['counts']['gaps']} gaps"
        )
        return 0
    text = dumps(built)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
        print(f"wrote {args.out}")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
