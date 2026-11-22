"""The causal graph JSON is generated from the locked registry and nothing else."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from verify.gen_graph import (
    GAP_LABEL,
    GRAPH_NOTE,
    assert_matches_index,
    assert_matches_registry,
    build_graph,
    consecutive_gaps,
    load_links,
    load_stages,
)

REPO = Path(__file__).resolve().parents[2]


def test_graph_matches_locked_registry():
    graph = build_graph(REPO)
    assert_matches_registry(graph, REPO)
    assert graph["format"] == "consequence-atlas-graph"
    assert graph["note"] == GRAPH_NOTE
    assert graph["counts"]["stages"] == 15
    assert graph["counts"]["dials"] == 6
    assert graph["counts"]["nodes"] == 21
    assert graph["counts"]["edges"] == 25
    assert graph["counts"]["nodes"] == graph["counts"]["stages"] + graph["counts"]["dials"]
    assert all(gap["label"] == GAP_LABEL for gap in graph["gaps"])
    assert all(gap.get("kind") == "gap" for gap in graph["gaps"])
    # Five consecutive-order pairs currently have no recorded link.
    gap_pairs = {(gap["source"], gap["target"]) for gap in graph["gaps"]}
    assert gap_pairs == {
        ("s02.sharp-signals", "s03.orbits-atoms-gravity"),
        ("s06.chemistry", "s07g.galaxies"),
        ("s07g.galaxies", "s07.stars"),
        ("s08.fusion-hoyle", "s09.planets"),
        ("s09.planets", "s10.records"),
    }
    assert graph["counts"]["gaps"] == 5


def test_graph_does_not_invent_edges():
    graph = build_graph(REPO)
    stages = load_stages(REPO)
    edges = load_links(REPO, stages)
    assert [item["id"] for item in graph["edges"]] == [item["id"] for item in edges]
    linked = {(item["source"], item["target"]) for item in edges}
    for gap in consecutive_gaps(stages, edges):
        assert (gap["source"], gap["target"]) not in linked
        assert gap["label"] == GAP_LABEL
        assert gap not in graph["edges"]


def test_site_build_writes_graph_consistent_with_index(tmp_path: Path):
    out = tmp_path / "site"
    subprocess.check_call(
        [sys.executable, "site/build.py", "--out", str(out), "--cname", "toeatlas.si"],
        cwd=REPO,
    )
    graph_path = out / "data" / "graph.json"
    index_path = out / "data" / "index.json"
    assert graph_path.is_file()
    graph = json.loads(graph_path.read_text(encoding="utf-8"))
    index = json.loads(index_path.read_text(encoding="utf-8"))
    assert_matches_registry(graph, REPO)
    assert_matches_index(graph, index)
    html = (out / "graph.html").read_text(encoding="utf-8")
    assert GRAPH_NOTE in html
    assert 'src="graph.js"' in html
    assert (out / "graph.js").is_file()
    assert (out / "graph.css").is_file()
    index_html = (out / "index.html").read_text(encoding="utf-8")
    registry = (out / "registry.html").read_text(encoding="utf-8")
    assert 'href="graph.html"' in index_html
    assert 'href="graph.html"' in registry
    # The generator and the page must not rewrite a stored label.
    for path in (REPO / "atlas" / "links").glob("*.yaml"):
        original = path.read_text(encoding="utf-8")
        # Re-running the build in a temp dir must leave the registry untouched.
        assert path.read_text(encoding="utf-8") == original


def test_gen_graph_check_cli(tmp_path: Path):
    graph_path = tmp_path / "graph.json"
    subprocess.check_call(
        [sys.executable, "-m", "verify.gen_graph", "--out", str(graph_path)],
        cwd=REPO,
    )
    subprocess.check_call(
        [sys.executable, "-m", "verify.gen_graph", "--check", "--graph", str(graph_path)],
        cwd=REPO,
    )
