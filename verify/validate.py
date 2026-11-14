"""Validate atlas JSON and YAML against schema/ plus the honesty rules.

Rules enforced here, on top of JSON Schema:

- An unquoted YAML scalar yes/no/on/off/y/n (any case) is rejected. YAML 1.1
  would silently turn those words into booleans. Quote them.
- A card label above CONJECTURE requires a non-blank ``gate`` signature.
  Agents cannot self-promote. FAILED, DEAD-END, and INERT-BY-CONSTRUCTION
  are off the promotion ladder and do not require ``gate``. v0 checks shape
  only; it does not verify the signature cryptographically.
- IMPORTED links cite at least one source id, and every cited id exists in
  sources/. DERIVED-UNDER-ASSUMPTION links have a non-empty assumptions array.
- Card ids are unique across cards/, dead-ends/, and examples/cards/. Every
  parents entry resolves to one of those ids. The card path, relative to
  that tree, is ``<engine.name>/<control.changed_factor>/<id>.json`` or
  ``<engine.name>/<control.changed_factor>/<id>/card.json``.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError
from referencing import Registry, Resource
from ruamel.yaml import YAML
from ruamel.yaml.error import YAMLError as RuamelYAMLError
from yaml.scanner import ScannerError
from yaml.tokens import ScalarToken

# Words YAML 1.1 treats as booleans and YAML 1.2 leaves as strings.
# true/false are real booleans in both and are allowed.
YAML11_BOOL_WORDS = frozenset({"yes", "no", "on", "off", "y", "n"})

# Promotion ladder. CONJECTURE is the floor an agent may set.
ABOVE_CONJECTURE = frozenset(
    {
        "REPRODUCED",
        "DIFFERS",
        "ROBUST",
        "KNOWN-MECHANISM",
        "NOVEL-CANDIDATE",
    }
)

JSON_TREES: tuple[tuple[str, str], ...] = (
    ("cards", "card"),
    ("dead-ends", "card"),
    ("meanings", "meaning"),
    ("sources", "source"),
    ("examples/cards", "card"),
)
YAML_TREES: tuple[tuple[str, str], ...] = (
    ("dials", "dial"),
    ("atlas", "atlas"),
    ("examples/atlas", "atlas"),
)
JSON_SUFFIXES = frozenset({".json"})
YAML_SUFFIXES = frozenset({".json", ".yaml", ".yml"})
DATA_SUFFIXES = JSON_SUFFIXES | YAML_SUFFIXES

CARD_PREFIXES = ("examples/cards/", "dead-ends/", "cards/")


@dataclass(frozen=True)
class Issue:
    path: str
    message: str

    def __str__(self) -> str:
        return f"{self.path}: {self.message}"


@dataclass
class LoadedDocument:
    path: str
    kind: str
    bucket: str
    document: dict


@dataclass
class Report:
    issues: list[Issue] = field(default_factory=list)
    documents: list[LoadedDocument] = field(default_factory=list)
    files_checked: int = 0

    @property
    def ok(self) -> bool:
        return not self.issues


def repo_root() -> Path:
    """Directory that contains verify/ and schema/."""
    return Path(__file__).resolve().parents[1]


def validate_root(root: Path) -> Report:
    """Validate one atlas root. Fixture trees reuse this repo's schema/."""
    root = root.resolve()
    report = Report()
    try:
        validators = load_validators(schema_dir_for(root))
    except (OSError, json.JSONDecodeError, SchemaError, KeyError) as exc:
        report.issues.append(Issue("schema", f"could not load schemas: {exc}"))
        return report

    discovered: list[tuple[Path, str]] = []
    for relative, kind in JSON_TREES:
        discovered.extend(_discover(root, relative, kind, JSON_SUFFIXES, report))
    for relative, kind in YAML_TREES:
        discovered.extend(_discover(root, relative, kind, YAML_SUFFIXES, report))

    for path, kind in discovered:
        _validate_file(root, path, kind, validators, report)
    report.issues.extend(cross_check(report.documents))
    return report


def schema_dir_for(root: Path) -> Path:
    local = root / "schema"
    if (local / "card.schema.json").is_file():
        return local
    packaged = repo_root() / "schema"
    if (packaged / "card.schema.json").is_file():
        return packaged
    raise FileNotFoundError(f"no schema directory under {root} or {repo_root()}")


def load_validators(schema_dir: Path) -> dict[str, Draft202012Validator]:
    resources: list[tuple[str, Resource]] = []
    schemas: dict[str, dict] = {}
    for path in sorted(schema_dir.glob("*.json")):
        contents = json.loads(path.read_text(encoding="utf-8"))
        schemas[path.name] = contents
        schema_id = contents.get("$id")
        if isinstance(schema_id, str):
            resources.append((schema_id, Resource.from_contents(contents)))
    registry = Registry().with_resources(resources)
    checker = FormatChecker()
    names = {
        "card": "card.schema.json",
        "meaning": "meaning.schema.json",
        "source": "source.schema.json",
        "dial": "dial.schema.json",
        "link": "link.schema.json",
    }
    return {
        kind: Draft202012Validator(schemas[filename], registry=registry, format_checker=checker)
        for kind, filename in names.items()
    }


def cross_check(documents: list[LoadedDocument]) -> list[Issue]:
    issues: list[Issue] = []
    cards = [doc for doc in documents if doc.kind == "card"]
    issues.extend(_unique_card_ids(cards))
    known_ids = {
        doc.document["id"]
        for doc in cards
        if isinstance(doc.document.get("id"), str)
    }
    for doc in cards:
        issues.extend(_card_rules(doc, known_ids))
    source_ids = {
        doc.document["id"]
        for doc in documents
        if doc.kind == "source" and isinstance(doc.document.get("id"), str)
    }
    for doc in documents:
        if doc.kind == "link":
            issues.extend(_link_rules(doc, source_ids))
    return issues


def yaml11_bool_issues(text: str, path: str) -> list[Issue]:
    """Plain scalars YAML 1.1 would coerce to bool. Quoted scalars are kept.

    ``true`` and ``false`` are real booleans in YAML 1.2 and are not flagged.
    """
    issues: list[Issue] = []
    try:
        tokens = list(yaml.scan(text))
    except (ScannerError, yaml.YAMLError) as exc:
        return [Issue(path, f"YAML parse error: {exc}")]
    for token in tokens:
        if not isinstance(token, ScalarToken) or not token.plain:
            continue
        if token.value.lower() not in YAML11_BOOL_WORDS:
            continue
        line = token.start_mark.line + 1
        column = token.start_mark.column + 1
        issues.append(
            Issue(
                path,
                (
                    f"line {line}, column {column}: unquoted YAML scalar {token.value!r} "
                    "would be a boolean under YAML 1.1 (yes/no/on/off/y/n, any case); quote it"
                ),
            )
        )
    return issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="verify",
        description="Validate the Consequence Atlas data layer.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Atlas root to validate (default: the repository that contains verify/).",
    )
    args = parser.parse_args(argv)
    root = (args.root or repo_root()).resolve()
    report = validate_root(root)
    if report.issues:
        for issue in report.issues:
            print(issue, file=sys.stderr)
        print(f"{len(report.issues)} problem(s) in {root}", file=sys.stderr)
        return 1
    print(f"valid ({report.files_checked} files)")
    return 0


def _discover(
    root: Path,
    relative: str,
    kind: str,
    allowed: frozenset[str],
    report: Report,
) -> list[tuple[Path, str]]:
    directory = root.joinpath(*relative.split("/"))
    if not directory.is_dir():
        return []
    found: list[tuple[Path, str]] = []
    for path in sorted(p for p in directory.rglob("*") if p.is_file()):
        rel = path.relative_to(root)
        if any(part.startswith(".") for part in rel.parts):
            continue
        suffix = path.suffix.lower()
        if suffix not in allowed:
            if suffix in DATA_SUFFIXES:
                report.files_checked += 1
                report.issues.append(
                    Issue(
                        rel.as_posix(),
                        f"{suffix} files are not accepted here; expected {' or '.join(sorted(allowed))}",
                    )
                )
            continue
        found.append((path, kind))
    return found


def _validate_file(
    root: Path,
    path: Path,
    kind: str,
    validators: dict[str, Draft202012Validator],
    report: Report,
) -> None:
    rel = path.relative_to(root).as_posix()
    report.files_checked += 1
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        report.issues.append(Issue(rel, f"not valid UTF-8: {exc}"))
        return

    suffix = path.suffix.lower()
    if suffix in {".yaml", ".yml"}:
        traps = yaml11_bool_issues(text, rel)
        if traps:
            report.issues.extend(traps)
            return
        try:
            data = _load_yaml(text)
        except (RuamelYAMLError, ValueError) as exc:
            report.issues.append(Issue(rel, f"YAML parse error: {exc}"))
            return
    else:
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            report.issues.append(Issue(rel, f"JSON parse error: line {exc.lineno}: {exc.msg}"))
            return

    if not isinstance(data, dict):
        report.issues.append(Issue(rel, "document must be a JSON object"))
        return

    if kind == "atlas":
        kind = _classify_atlas(data) or ""
        if not kind:
            report.issues.append(
                Issue(
                    rel,
                    "no matching schema; atlas files must be a link (from, to) or a dial (range, scale)",
                )
            )
            return

    validator = validators[kind]
    for error in sorted(validator.iter_errors(data), key=lambda err: list(err.absolute_path)):
        location = "/" + "/".join(str(part) for part in error.absolute_path)
        if not location.strip("/"):
            location = "(root)"
        report.issues.append(Issue(rel, f"{location}: {error.message}"))

    report.documents.append(
        LoadedDocument(path=rel, kind=kind, bucket=_bucket(rel, kind), document=data)
    )


def _load_yaml(text: str) -> object:
    loader = YAML(typ="safe")
    documents = list(loader.load_all(text))
    while documents and documents[-1] is None:
        documents.pop()
    if len(documents) != 1:
        raise ValueError(f"expected one YAML document, found {len(documents)}")
    return documents[0]


def _classify_atlas(document: dict) -> str | None:
    if "from" in document and "to" in document:
        return "link"
    if "range" in document and "scale" in document:
        return "dial"
    return None


def _bucket(path: str, kind: str) -> str:
    if path.startswith("examples/"):
        return "examples"
    if path.startswith("dead-ends/"):
        return "dead-ends"
    if path.startswith("cards/"):
        return "cards"
    if path.startswith("meanings/"):
        return "meanings"
    if path.startswith("sources/"):
        return "sources"
    if path.startswith("dials/") or kind == "dial":
        return "dials"
    if kind == "link":
        return "links"
    return "atlas"


def _unique_card_ids(cards: list[LoadedDocument]) -> list[Issue]:
    by_id: dict[str, list[str]] = {}
    for doc in cards:
        card_id = doc.document.get("id")
        if isinstance(card_id, str):
            by_id.setdefault(card_id, []).append(doc.path)
    issues: list[Issue] = []
    for card_id, paths in sorted(by_id.items()):
        if len(paths) > 1:
            listed = ", ".join(paths)
            issues.append(Issue(paths[0], f"duplicate card id {card_id!r} at {listed}"))
    return issues


def _card_rules(doc: LoadedDocument, known_ids: set[str]) -> list[Issue]:
    issues: list[Issue] = []
    data = doc.document
    issues.extend(_gate_rule(doc))
    parents = data.get("parents", [])
    if isinstance(parents, list):
        for parent in parents:
            if isinstance(parent, str) and parent not in known_ids:
                issues.append(
                    Issue(doc.path, f"parent id {parent!r} does not resolve to a card")
                )
    issues.extend(_path_rule(doc))
    return issues


def _gate_rule(doc: LoadedDocument) -> list[Issue]:
    label = doc.document.get("label")
    if label not in ABOVE_CONJECTURE:
        return []
    if _gate_ok(doc.document.get("gate")):
        return []
    return [
        Issue(
            doc.path,
            (
                f"label {label!r} is above CONJECTURE and requires a non-blank "
                "gate-checker signature (gate.checker and gate.signature). "
                "Agents cannot self-promote."
            ),
        )
    ]


def _gate_ok(gate: object) -> bool:
    if not isinstance(gate, dict):
        return False
    checker = gate.get("checker")
    signature = gate.get("signature")
    return (
        isinstance(checker, str)
        and bool(checker.strip())
        and isinstance(signature, str)
        and bool(signature.strip())
    )


def _path_rule(doc: LoadedDocument) -> list[Issue]:
    relative = _card_relative(doc.path)
    if relative is None:
        return [Issue(doc.path, "card is outside cards/, dead-ends/, and examples/cards/")]
    data = doc.document
    engine = _segment(data, ("engine", "name"))
    factor = _segment(data, ("control", "changed_factor"))
    card_id = data.get("id")
    if not isinstance(engine, str) or not isinstance(factor, str) or not isinstance(card_id, str):
        return [
            Issue(
                doc.path,
                "card path cannot be checked until id, engine.name, and control.changed_factor are strings",
            )
        ]
    problems = [
        name
        for name, value in (("engine.name", engine), ("control.changed_factor", factor), ("id", card_id))
        if not _single_segment(value)
    ]
    if problems:
        return [
            Issue(
                doc.path,
                f"{', '.join(problems)} must be a single path segment so the card can live at <engine>/<factor>/<card-id>",
            )
        ]
    expected = {
        f"{engine}/{factor}/{card_id}.json",
        f"{engine}/{factor}/{card_id}/card.json",
    }
    if relative in expected:
        return []
    shown = " or ".join(sorted(expected))
    return [
        Issue(
            doc.path,
            f"card path must be {shown} (engine.name={engine!r}, control.changed_factor={factor!r}, id={card_id!r}); found {relative!r}",
        )
    ]


def _card_relative(path: str) -> str | None:
    for prefix in CARD_PREFIXES:
        if path.startswith(prefix):
            return path[len(prefix) :]
    return None


def _segment(document: dict, keys: tuple[str, ...]) -> object:
    current: object = document
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def _single_segment(value: str) -> bool:
    return bool(value) and value not in {".", ".."} and "/" not in value and "\\" not in value


def _link_rules(doc: LoadedDocument, source_ids: set[str]) -> list[Issue]:
    data = doc.document
    label = data.get("label")
    link_id = data.get("id")
    who = link_id if isinstance(link_id, str) else doc.path
    issues: list[Issue] = []
    if label == "DERIVED-UNDER-ASSUMPTION":
        assumptions = data.get("assumptions")
        if not isinstance(assumptions, list) or len(assumptions) == 0:
            issues.append(
                Issue(
                    doc.path,
                    f"DERIVED-UNDER-ASSUMPTION link {who!r} must list a non-empty assumptions array",
                )
            )
    if label == "IMPORTED":
        issues.extend(_imported_sources(doc.path, who, data.get("sources"), source_ids))
    return issues


def _imported_sources(path: str, who: str, sources: object, source_ids: set[str]) -> list[Issue]:
    if not isinstance(sources, list) or len(sources) == 0:
        return [
            Issue(
                path,
                f"IMPORTED link {who!r} must cite at least one source id that exists in sources/",
            )
        ]
    unknown = [item for item in sources if not isinstance(item, str) or item not in source_ids]
    known = [item for item in sources if isinstance(item, str) and item in source_ids]
    if not known:
        listed = ", ".join(repr(item) for item in unknown)
        return [
            Issue(
                path,
                (
                    f"IMPORTED link {who!r} must cite at least one source id that exists "
                    f"in sources/; unknown: {listed}"
                ),
            )
        ]
    if unknown:
        listed = ", ".join(repr(item) for item in unknown)
        return [
            Issue(
                path,
                f"IMPORTED link {who!r} cites source ids that are not in sources/: {listed}",
            )
        ]
    return []


if __name__ == "__main__":
    sys.exit(main())
