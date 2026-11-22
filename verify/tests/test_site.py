"""The static site builds, and dial records are copied rather than rewritten."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
from ruamel.yaml import YAML

REPO = Path(__file__).resolve().parents[2]


def test_site_build_copies_dials_and_pages(tmp_path: Path):
    out = tmp_path / "site"
    subprocess.check_call(
        [sys.executable, "site/build.py", "--out", str(out), "--cname", "toeatlas.si"],
        cwd=REPO,
    )
    index = json.loads((out / "data" / "index.json").read_text(encoding="utf-8"))
    assert index["format_version"] == "0.2.0"
    loader = YAML(typ="safe")
    seen = set()
    for path in sorted((REPO / "dials").glob("*.yaml")):
        data = loader.load(path.read_text(encoding="utf-8"))
        match = next(item for item in index["dials"] if item["id"] == data["id"])
        assert match["ours"] == data["ours"]
        assert list(match["range"]) == list(data["range"])
        assert match["name"] == data["name"]
        seen.add(data["id"])
    assert seen == {
        "alpha",
        "beta",
        "strong",
        "cosmological-constant",
        "dimensions",
        "arrow",
    }
    html = (out / "index.html").read_text(encoding="utf-8")
    registry = (out / "registry.html").read_text(encoding="utf-8")
    assert "playground.js" in html
    assert 'id="browse"' in registry
    assert (out / "llms.txt").is_file()
    assert (out / "CNAME").read_text(encoding="utf-8").strip() == "toeatlas.si"
    manifest = json.loads((out / "models" / "manifest.json").read_text(encoding="utf-8"))
    assert [item["id"] for item in manifest] == ["atlas", "starter"]
    assert (out / "engine" / "atlas.js").is_file()
    assert (out / "engine" / "starter.js").is_file()
    for path in (REPO / "site").rglob("*"):
        if "engine" in path.parts:
            continue
        if path.suffix.lower() not in {".js", ".html", ".css"}:
            continue
        assert "mirror ratio" not in path.read_text(encoding="utf-8").lower()


def test_site_shows_card_file_labels_only(tmp_path: Path):
    out = tmp_path / "site"
    subprocess.check_call(
        [sys.executable, "site/build.py", "--out", str(out), "--cname", "toeatlas.si"],
        cwd=REPO,
    )
    index = json.loads((out / "data" / "index.json").read_text(encoding="utf-8"))
    by_id = {card["id"]: card for card in index["cards"]}
    for bucket in ("cards", "dead-ends"):
        for path in (REPO / bucket).rglob("card.json"):
            data = json.loads(path.read_text(encoding="utf-8"))
            listed = by_id[data["id"]]
            assert listed["label"] == data["label"]
            assert "gate_label" not in listed
    assert by_id["c.v3o.011.kibble-quench.sf-noise"]["label"] == "CONJECTURE"
    assert by_id["c.v3o.011.kibble-quench.sf-temp"]["label"] == "CONJECTURE"
    phrase = "unsigned prototype check, not a label"
    assert phrase in (out / "app.js").read_text(encoding="utf-8")
    assert phrase in (out / "playground.js").read_text(encoding="utf-8")
    assert phrase in (out / "registry.html").read_text(encoding="utf-8")


def test_exact_typed_value_round_trips_through_the_url():
    node = shutil.which("node")
    if not node:
        pytest.skip("node is not installed")
    subprocess.check_call([node, "site/check-exact.mjs"], cwd=REPO)
    source = (REPO / "site" / "static" / "playground.js").read_text(encoding="utf-8")
    assert "commitExact" in source
    assert "pg-exact" in source


def test_model_contract():
    node = shutil.which("node")
    if not node:
        pytest.skip("node is not installed")
    subprocess.check_call([node, "site/check-models.mjs"], cwd=REPO)
    subprocess.check_call([node, "site/check-runs.mjs"], cwd=REPO)


def test_front_page_carries_honesty_chrome_and_does_not_rewrite_labels(tmp_path: Path):
    out = tmp_path / "site"
    subprocess.check_call(
        [sys.executable, "site/build.py", "--out", str(out), "--cname", "toeatlas.si"],
        cwd=REPO,
    )
    html = (out / "index.html").read_text(encoding="utf-8")
    assert "Possible universes" in html
    assert 'id="spine"' in html
    assert "Locked evaluation, not a prediction" in html
    assert "Live · not a promotion" in html
    assert "Reading the atlas" in html
    assert "<details id=\"first-legend\"" in html or "<details id='first-legend'" in html or 'id="first-legend"' in html
    shell = (out / "atlas-shell.js").read_text(encoding="utf-8")
    assert "dominantLabel" in shell
    assert "toeatlas.legend.dismissed.v1" in shell
    play = (out / "playground.js").read_text(encoding="utf-8")
    assert "No experiment card is attached" in play
    assert "The picture does not change it" in play
    css = (out / "styles.css").read_text(encoding="utf-8")
    assert "--status-pass" in css
    assert "--ours-ring" in css
    # The compact index still carries only file labels.
    index = json.loads((out / "data" / "index.json").read_text(encoding="utf-8"))
    by_id = {card["id"]: card for card in index["cards"]}
    for bucket in ("cards", "dead-ends"):
        for path in (REPO / bucket).rglob("card.json"):
            data = json.loads(path.read_text(encoding="utf-8"))
            assert by_id[data["id"]]["label"] == data["label"]

