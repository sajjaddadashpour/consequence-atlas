"""Good and bad fixtures for the atlas validator."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from verify.bundle import ValidationFailed, build_bundle, main as bundle_main
from verify.validate import main, validate_root, yaml11_bool_issues

REPO = Path(__file__).resolve().parents[2]
FIXTURES = Path(__file__).parent / "fixtures"

BAD = {
    "hydrogen-empty-assumptions": ("assumptions", "l.hydrogen-stable"),
    "yaml-no-trap": ("unquoted YAML scalar 'no'",),
    "self-promote": ("above CONJECTURE", "DIFFERS", "Agents cannot self-promote"),
    "blank-gate": ("above CONJECTURE", "non-blank"),
    "missing-parent": ("c.missing-parent", "does not resolve"),
    "duplicate-ids": ("duplicate card id 'c.dup-0001'",),
    "bad-path": ("card path must be",),
    "imported-missing-source": ("src.missing", "sources/"),
    "imported-empty-sources": ("at least one source id",),
    "legacy-past-differs": ("past DIFFERS", "shuffled null"),
    "factor-case": ("measT", "card path must be"),
    "unknown-condition": ("not_a_dial", "underscores"),
}

YAML11_WORDS = ["yes", "Yes", "YES", "no", "No", "NO", "on", "On", "off", "OFF", "y", "Y", "n", "N"]


def _text(report) -> str:
    return "\n".join(str(issue) for issue in report.issues)


def test_repository_is_valid():
    report = validate_root(REPO)
    assert report.issues == [], _text(report)
    paths = {doc.path for doc in report.documents}
    assert paths == {
        "examples/atlas/dial.json",
        "examples/atlas/link.json",
        "examples/cards/starter/attract/c.example-0001/card.json",
    }
    kinds = {doc.path: doc.kind for doc in report.documents}
    assert kinds["examples/atlas/link.json"] == "link"
    assert kinds["examples/atlas/dial.json"] == "dial"
    assert kinds["examples/cards/starter/attract/c.example-0001/card.json"] == "card"


def test_checked_in_examples_keep_their_labels():
    link = json.loads((REPO / "examples/atlas/link.json").read_text(encoding="utf-8"))
    assert link["id"] == "l.hydrogen-stable"
    assert link["label"] == "DERIVED-UNDER-ASSUMPTION"
    assert link["assumptions"]
    card = json.loads(
        (REPO / "examples/cards/starter/attract/c.example-0001/card.json").read_text(encoding="utf-8")
    )
    assert card["label"] == "CONJECTURE"
    assert "gate" not in card
    dial = json.loads((REPO / "examples/atlas/dial.json").read_text(encoding="utf-8"))
    assert dial["id"] == "cosmological-constant"


def test_good_fixtures_pass():
    good = FIXTURES / "good"
    roots = sorted(path for path in good.iterdir() if path.is_dir())
    assert roots, "expected at least one good fixture"
    for root in roots:
        report = validate_root(root)
        assert report.issues == [], (root.name, _text(report))


def test_legacy_card_is_unverified_and_not_rejected_for_missing_label_set_by():
    report = validate_root(FIXTURES / "good" / "mini")
    assert report.issues == [], _text(report)
    text = "\n".join(str(warning) for warning in report.warnings)
    assert "legacy, unverified" in text
    assert "c.good-legacy" in text
    assert "label_set_by" not in text
    paths = {doc.path for doc in report.documents}
    assert not any(path.endswith("outputs.json") for path in paths)
    assert any(doc.kind == "stage" for doc in report.documents)
    assert any(doc.kind == "backward" for doc in report.documents)
    assert any(doc.kind == "seed" for doc in report.documents)


@pytest.mark.parametrize("name", sorted(BAD))
def test_bad_fixtures_fail(name: str):
    report = validate_root(FIXTURES / "bad" / name)
    text = _text(report)
    assert report.issues, name
    for needle in BAD[name]:
        assert needle in text, (name, needle, text)


def test_hydrogen_link_with_empty_assumptions_fails():
    report = validate_root(FIXTURES / "bad" / "hydrogen-empty-assumptions")
    text = _text(report)
    assert "l.hydrogen-stable" in text
    assert "non-empty assumptions" in text


def test_yaml_no_trap_fails():
    report = validate_root(FIXTURES / "bad" / "yaml-no-trap")
    text = _text(report)
    assert "unquoted YAML scalar 'no'" in text
    assert "YAML 1.1" in text


@pytest.mark.parametrize("word", YAML11_WORDS)
def test_unquoted_yaml11_bool_word_is_rejected(word: str):
    issues = yaml11_bool_issues(f"flag: {word}\n", "trap.yaml")
    assert len(issues) == 1
    assert f"unquoted YAML scalar {word!r}" in issues[0].message


@pytest.mark.parametrize("word", ["yes", "no", "on", "off", "y", "n"])
def test_quoted_yaml11_bool_word_is_kept(word: str):
    assert yaml11_bool_issues(f'flag: "{word}"\n', "ok.yaml") == []
    assert yaml11_bool_issues(f"flag: '{word}'\n", "ok.yaml") == []


def test_true_false_comments_and_longer_words_are_not_traps():
    assert yaml11_bool_issues("flag: true\nother: false\n", "ok.yaml") == []
    assert yaml11_bool_issues("# no\nid: ok\n", "ok.yaml") == []
    assert yaml11_bool_issues("flag: no way\n", "ok.yaml") == []
    assert yaml11_bool_issues("flag: |\n  no\n", "ok.yaml") == []


def test_unquoted_off_fails_a_dial_tree(tmp_path: Path):
    dials = tmp_path / "dials"
    dials.mkdir()
    (dials / "trap.yaml").write_text(
        'id: dial.off-trap\nname: trap\nsymbol: "x"\nunits: OFF\nours: 1\nrange: [0, 1]\nscale: linear\n',
        encoding="utf-8",
    )
    report = validate_root(tmp_path)
    assert any("unquoted YAML scalar 'OFF'" in issue.message for issue in report.issues)


def test_yaml_rejects_a_second_document(tmp_path: Path):
    dials = tmp_path / "dials"
    dials.mkdir()
    (dials / "two.yaml").write_text("id: dial.one\n---\nid: dial.two\n", encoding="utf-8")
    report = validate_root(tmp_path)
    assert any("one YAML document" in issue.message for issue in report.issues)


def test_imported_link_rejects_an_unknown_id_beside_a_real_one(tmp_path: Path):
    source = tmp_path / "sources"
    links = tmp_path / "atlas" / "links"
    source.mkdir()
    links.mkdir(parents=True)
    (source / "src.fixture.json").write_text(
        json.dumps(
            {
                "id": "src.fixture",
                "title": "Fixture source, not a real citation",
                "year": 2026,
                "identifier": "doi:10.0000/fixture",
                "verified": False,
            }
        ),
        encoding="utf-8",
    )
    (links / "l.mixed.yaml").write_text(
        "id: l.mixed-source\nfrom: s.from-node\nto: s.to-node\nlabel: IMPORTED\n"
        'condition: "fixture == 1"\nsources:\n  - src.fixture\n  - src.missing\n',
        encoding="utf-8",
    )
    report = validate_root(tmp_path)
    text = _text(report)
    assert "src.missing" in text
    assert "not in sources/" in text


def test_yaml_card_in_json_tree_is_rejected(tmp_path: Path):
    target = tmp_path / "cards" / "starter" / "factor"
    target.mkdir(parents=True)
    (target / "c.not-json.yaml").write_text("label: CONJECTURE\n", encoding="utf-8")
    report = validate_root(tmp_path)
    assert any(".yaml files are not accepted" in issue.message for issue in report.issues)


def test_cli_accepts_the_repository(capsys: pytest.CaptureFixture[str]):
    assert main(["--root", str(REPO)]) == 0
    assert "valid" in capsys.readouterr().out


def test_cli_rejects_the_no_trap(capsys: pytest.CaptureFixture[str]):
    assert main(["--root", str(FIXTURES / "bad" / "yaml-no-trap")]) == 1
    captured = capsys.readouterr()
    assert "unquoted YAML scalar 'no'" in captured.err
    assert captured.out == ""


def test_bundle_of_the_repository_keeps_examples_apart(tmp_path: Path):
    output = tmp_path / "atlas-bundle.json"
    assert bundle_main(["--root", str(REPO), "--output", str(output)]) == 0
    payload = json.loads(output.read_text(encoding="utf-8"))
    assert payload["format"] == "consequence-atlas-bundle"
    assert payload["cards"] == []
    assert payload["links"] == []
    assert payload["counts"]["examples"] == 3
    paths = {item["path"]: item["kind"] for item in payload["examples"]}
    assert paths["examples/atlas/link.json"] == "link"
    assert "examples/cards/starter/attract/c.example-0001/card.json" in paths
    link = next(item for item in payload["examples"] if item["path"].endswith("link.json"))
    assert link["document"]["assumptions"]


def test_bundle_refuses_an_invalid_tree(tmp_path: Path):
    output = tmp_path / "atlas-bundle.json"
    bad = FIXTURES / "bad" / "hydrogen-empty-assumptions"
    assert bundle_main(["--root", str(bad), "--output", str(output)]) == 1
    assert not output.exists()
    with pytest.raises(ValidationFailed):
        build_bundle(bad)


def test_good_fixture_bundle_round_trip(tmp_path: Path):
    payload = build_bundle(FIXTURES / "good" / "mini", generated_at="2026-11-14T00:00:00Z")
    assert payload["generated_at"] == "2026-11-14T00:00:00Z"
    assert payload["counts"]["cards"] >= 1
    assert payload["counts"]["dead_ends"] >= 1
    assert payload["counts"]["links"] == 3
    assert payload["counts"]["sources"] == 2
    assert payload["counts"]["stages"] == 2
    assert any("legacy, unverified" in warning["message"] for warning in payload["warnings"])
    promoted = next(
        item["document"]
        for item in payload["cards"]
        if item["document"]["id"] == "c.good-promoted"
    )
    assert promoted["label"] == "DIFFERS"
    assert promoted["gate"]["checker"].strip()
    assert promoted["gate"]["signature"].strip()
