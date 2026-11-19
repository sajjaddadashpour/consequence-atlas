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
- A legacy card (``null_settings`` of ``NOT-RUN``, lock written locally) is
  reported as ``legacy, unverified``. Missing ``label_set_by`` is not an error.
  The label needs recomputation by the gate checker. It may sit at REPRODUCED
  or DIFFERS without ``gate``, and it cannot be promoted past DIFFERS until it
  is rerun with a shuffled null and a server lock.
- IMPORTED links cite at least one source id, and every cited id exists in
  sources/ (one object per file, or an array of them). DERIVED-UNDER-ASSUMPTION
  links have a non-empty assumptions array.
- Card ids are unique. Every ``parents`` id resolves. Only ``card.json`` is
  read under cards/, dead-ends/, and examples/cards/; ``outputs.json`` is not
  validated. The path is ``<engine>/<factor>/<card-id>/card.json`` (flat
  ``.json`` is also accepted). ``factor`` is ``control.changed_factor`` when
  that is one path segment, and the slug in ``family`` when the changed factor
  lists several names.
- A condition may spell a hyphenated dial id with underscores, and may call
  ``Z_fission``.
- atlas/derivations/ has no schema yet and is skipped with a warning.
- Cross-field links live in atlas/crosslinks/ and use schema/crosslink.schema.json.
  A link with claim=cause must have support=mechanism and cite at least one
  source id that exists in sources/ with verified: true. A link with
  support=analogy must be labelled ANALOGY-ONLY with claim=pattern. Every cited
  id must exist in sources/.
"""

from __future__ import annotations

import argparse
import json
import re
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
# Legacy NOT-RUN cards stop here. Higher labels need a shuffled null and a server lock.
PAST_DIFFERS = frozenset({"ROBUST", "KNOWN-MECHANISM", "NOVEL-CANDIDATE"})
# Names a condition may use besides dial ids. Z_fission is the table-length helper.
CONDITION_HELPERS = frozenset(
    {"min", "floor", "abs", "sqrt", "Z_fission", "true", "false", "and", "or", "not"}
)
# Don't treat the exponent in 2.62e-12 as a name.
CONDITION_IDENT = re.compile(r"(?<![\d.])[A-Za-z_][A-Za-z0-9_-]*")

JSON_TREES: tuple[tuple[str, str], ...] = (
    ("cards", "card"),
    ("dead-ends", "card"),
    ("meanings", "meaning"),
    ("sources", "source"),
    ("examples/cards", "card"),
    ("seeds", "seed"),
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
    warnings: list[Issue] = field(default_factory=list)
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
    errors, warnings = cross_check(report.documents)
    report.issues.extend(errors)
    report.warnings.extend(warnings)
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
        "stage": "stage.schema.json",
        "backward": "backward.schema.json",
        "seed": "seed.schema.json",
        "crosslink": "crosslink.schema.json",
    }
    return {
        kind: Draft202012Validator(schemas[filename], registry=registry, format_checker=checker)
        for kind, filename in names.items()
    }


def cross_check(documents: list[LoadedDocument]) -> tuple[list[Issue], list[Issue]]:
    issues: list[Issue] = []
    warnings: list[Issue] = []
    cards = [doc for doc in documents if doc.kind == "card"]
    issues.extend(_unique_card_ids(cards))
    known_ids = {
        doc.document["id"]
        for doc in cards
        if isinstance(doc.document.get("id"), str)
    }
    card_paths = {doc.path for doc in cards}
    for doc in cards:
        card_issues, card_warnings = _card_rules(doc, known_ids)
        issues.extend(card_issues)
        warnings.extend(card_warnings)
    source_ids = {
        doc.document["id"]
        for doc in documents
        if doc.kind == "source" and isinstance(doc.document.get("id"), str)
    }
    dial_ids = {
        doc.document["id"]
        for doc in documents
        if doc.kind == "dial" and isinstance(doc.document.get("id"), str)
    }
    stage_ids = {
        doc.document["id"]
        for doc in documents
        if doc.kind == "stage" and isinstance(doc.document.get("id"), str)
    }
    verified_source_ids = {
        doc.document["id"]
        for doc in documents
        if doc.kind == "source"
        and isinstance(doc.document.get("id"), str)
        and doc.document.get("verified") is True
    }
    for doc in documents:
        if doc.kind == "crosslink":
            issues.extend(_crosslink_rules(doc, source_ids, verified_source_ids))
        elif doc.kind == "link":
            issues.extend(_link_rules(doc, source_ids, dial_ids))
        elif doc.kind == "backward":
            issues.extend(_citation_rules(doc, source_ids, "backward chain"))
        elif doc.kind == "stage":
            issues.extend(_stage_rules(doc, stage_ids))
        elif doc.kind == "seed":
            issues.extend(_seed_rules(doc, card_paths))
    return issues, warnings


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
    for warning in report.warnings:
        print(f"warning: {warning}")
    if report.issues:
        for issue in report.issues:
            print(issue, file=sys.stderr)
        print(f"{len(report.issues)} problem(s) in {root}", file=sys.stderr)
        return 1
    if report.warnings:
        print(f"valid ({report.files_checked} files, {len(report.warnings)} warnings)")
    else:
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
        if kind == "card" and path.name == "outputs.json":
            continue
        suffix = path.suffix.lower()
        rel_posix = rel.as_posix()
        if rel_posix.startswith("atlas/derivations/") and suffix in DATA_SUFFIXES:
            report.files_checked += 1
            report.warnings.append(Issue(rel_posix, "no schema yet; skipped"))
            continue
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

    if kind == "source" and isinstance(data, list):
        _validate_source_list(rel, data, validators["source"], report)
        return

    if not isinstance(data, dict):
        report.issues.append(Issue(rel, "document must be a JSON object"))
        return

    if kind == "atlas":
        parts = Path(rel).parts
        if "crosslinks" in parts:
            kind = "crosslink"
        elif "stages" in parts:
            kind = "stage"
        elif "backward" in parts:
            kind = "backward"
        else:
            kind = _classify_atlas(data) or ""
            if not kind:
                report.issues.append(
                    Issue(
                        rel,
                        "no matching schema; atlas files must be a link (from, to), a dial (range, scale), a stage, or a backward chain",
                    )
                )
                return

    _schema_issues(validators[kind], data, rel, report)
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
    if path.startswith("sources/") or kind == "source":
        return "sources"
    if path.startswith("seeds/") or kind == "seed":
        return "seeds"
    if path.startswith("dials/") or kind == "dial":
        return "dials"
    if kind == "stage":
        return "stages"
    if kind == "backward":
        return "backward"
    if kind == "link":
        return "links"
    if kind == "crosslink":
        return "crosslinks"
    return "atlas"


def _schema_issues(validator: Draft202012Validator, document: object, path: str, report: Report) -> None:
    for error in sorted(validator.iter_errors(document), key=lambda err: list(err.absolute_path)):
        location = "/" + "/".join(str(part) for part in error.absolute_path)
        if not location.strip("/"):
            location = "(root)"
        report.issues.append(Issue(path, f"{location}: {error.message}"))


def _validate_source_list(
    path: str,
    entries: list,
    validator: Draft202012Validator,
    report: Report,
) -> None:
    for index, item in enumerate(entries):
        item_path = f"{path}#/{index}"
        if not isinstance(item, dict):
            report.issues.append(Issue(item_path, "source entry must be a JSON object"))
            continue
        source_id = item.get("id")
        if isinstance(source_id, str):
            item_path = f"{path}#/{source_id}"
        _schema_issues(validator, item, item_path, report)
        report.documents.append(
            LoadedDocument(path=item_path, kind="source", bucket="sources", document=item)
        )


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


def _card_rules(doc: LoadedDocument, known_ids: set[str]) -> tuple[list[Issue], list[Issue]]:
    issues: list[Issue] = []
    warnings: list[Issue] = []
    data = doc.document
    gate_issues, gate_warnings = _gate_rule(doc)
    issues.extend(gate_issues)
    warnings.extend(gate_warnings)
    parents = data.get("parents", [])
    if isinstance(parents, list):
        for parent in parents:
            if isinstance(parent, str) and parent not in known_ids:
                issues.append(
                    Issue(doc.path, f"parent id {parent!r} does not resolve to a card")
                )
    issues.extend(_path_rule(doc))
    return issues, warnings


def _gate_rule(doc: LoadedDocument) -> tuple[list[Issue], list[Issue]]:
    label = doc.document.get("label")
    if _legacy_unverified(doc.document):
        warning = Issue(doc.path, _legacy_message(label))
        if label in PAST_DIFFERS:
            return [Issue(doc.path, _past_differs_message(label))], [warning]
        return [], [warning]
    if label not in ABOVE_CONJECTURE:
        return [], []
    if _gate_ok(doc.document.get("gate")):
        return [], []
    return [
        Issue(
            doc.path,
            (
                f"label {label!r} is above CONJECTURE and requires a non-blank "
                "gate-checker signature (gate.checker and gate.signature). "
                "Agents cannot self-promote."
            ),
        )
    ], []


def _legacy_unverified(card: dict) -> bool:
    """A sweep card whose null arm was not run. Its lock is local, not a server lock."""
    control = card.get("control")
    if not isinstance(control, dict):
        return False
    null_settings = control.get("null_settings")
    if not isinstance(null_settings, str):
        return False
    return null_settings == "NOT-RUN" or null_settings.startswith("NOT-RUN:") or null_settings.startswith("NOT-RUN ")


def _legacy_message(label: object) -> str:
    shown = label if isinstance(label, str) else "unset"
    return (
        f"legacy, unverified: label {shown!r} needs recomputation by the gate checker. "
        "null_settings is NOT-RUN and the lock is local, so this label is not a promotion "
        "and the card cannot be promoted past DIFFERS until it is rerun with a shuffled null and a server lock."
    )


def _past_differs_message(label: object) -> str:
    return (
        f"label {label!r} is past DIFFERS, but null_settings is NOT-RUN and the lock is local. "
        "This card cannot be promoted past DIFFERS until it is rerun with a shuffled null and a server lock."
    )


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
    raw_factor = _segment(data, ("control", "changed_factor"))
    card_id = data.get("id")
    if not isinstance(engine, str) or not isinstance(raw_factor, str) or not isinstance(card_id, str):
        return [
            Issue(
                doc.path,
                "card path cannot be checked until id, engine.name, and control.changed_factor are strings",
            )
        ]
    if not _single_segment(engine) or not _single_segment(card_id):
        return [
            Issue(
                doc.path,
                "engine.name and id must each be a single path segment so the card can live at <engine>/<factor>/<card-id>",
            )
        ]
    factor = _factor_segment(data)
    if factor is None:
        return [
            Issue(
                doc.path,
                "card path needs one path segment for the factor: control.changed_factor, "
                "or the slug after / in family when that factor lists several names",
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
            (
                f"card path must be {shown} "
                f"(engine.name={engine!r}, factor={factor!r}, control.changed_factor={raw_factor!r}, id={card_id!r}); "
                f"found {relative!r}"
            ),
        )
    ]


def _factor_segment(card: dict) -> str | None:
    """Directory factor. A comma- or colon-separated changed_factor is not a path segment."""
    raw = _segment(card, ("control", "changed_factor"))
    if isinstance(raw, str) and _path_segment(raw):
        return raw
    family = card.get("family")
    if isinstance(family, str) and "/" in family:
        slug = family.split("/", 1)[1]
        if _path_segment(slug):
            return slug
    return None


def _path_segment(value: str) -> bool:
    if not _single_segment(value):
        return False
    return not any(char in value for char in ",: \t")


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


def _link_rules(doc: LoadedDocument, source_ids: set[str], dial_ids: set[str]) -> list[Issue]:
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
    issues.extend(_condition_rules(doc, dial_ids))
    return issues


def _crosslink_rules(
    doc: LoadedDocument, source_ids: set[str], verified_source_ids: set[str]
) -> list[Issue]:
    """claim=cause needs a mechanism and a verified source; analogy stays a pattern.

    The schema enforces the same shape. This repeats it in plain words and adds
    the checks a schema cannot do: cited ids must exist in sources/, and a cause
    link needs at least one of them marked verified.
    """
    data = doc.document
    link_id = data.get("id")
    who = link_id if isinstance(link_id, str) else doc.path
    claim = data.get("claim")
    support = data.get("support")
    label = data.get("label")
    sources = data.get("sources")
    cited = [item for item in sources if isinstance(item, str)] if isinstance(sources, list) else []
    issues: list[Issue] = []
    unknown = [item for item in cited if item not in source_ids]
    if unknown:
        listed = ", ".join(repr(item) for item in unknown)
        issues.append(
            Issue(doc.path, f"crosslink {who!r} cites source ids that are not in sources/: {listed}")
        )
    if claim == "cause":
        if support != "mechanism":
            issues.append(
                Issue(
                    doc.path,
                    (
                        f"crosslink {who!r} has claim=cause but support={support!r}; "
                        "a cause link needs support=mechanism (shared mathematics or analogy "
                        "shows a pattern, not a cause)"
                    ),
                )
            )
        if not any(item in verified_source_ids for item in cited):
            issues.append(
                Issue(
                    doc.path,
                    (
                        f"crosslink {who!r} has claim=cause but cites no source id that exists "
                        "in sources/ with verified: true"
                    ),
                )
            )
    if support == "analogy" and (label != "ANALOGY-ONLY" or claim != "pattern"):
        issues.append(
            Issue(
                doc.path,
                (
                    f"crosslink {who!r} has support=analogy, so it must be label ANALOGY-ONLY "
                    f"with claim=pattern (found label={label!r}, claim={claim!r})"
                ),
            )
        )
    steps = data.get("steps")
    if isinstance(steps, list) and steps:
        rank = {"ESTABLISHED": 0, "MAINSTREAM-HYPOTHESIS": 1, "CONJECTURE": 2, "ANALOGY-ONLY": 3}
        step_ranks = [rank[s.get("label")] for s in steps if isinstance(s, dict) and s.get("label") in rank]
        if step_ranks and label in rank and rank[label] < max(step_ranks):
            weakest = [k for k, r in rank.items() if r == max(step_ranks)][0]
            issues.append(
                Issue(
                    doc.path,
                    (
                        f"crosslink {who!r} has label={label!r} but its weakest step is {weakest!r}; "
                        "a chain's label cannot be stronger than its weakest step"
                    ),
                )
            )
        for step in steps:
            if isinstance(step, dict):
                bad = [i for i in step.get("sources", []) if isinstance(i, str) and i not in source_ids]
                if bad:
                    issues.append(Issue(doc.path, f"crosslink {who!r} step cites unknown source ids: {bad}"))
    return issues


def _condition_rules(doc: LoadedDocument, dial_ids: set[str]) -> list[Issue]:
    # examples/ may name a dial that is not shipped beside the illustration.
    if doc.path.startswith("examples/"):
        return []
    condition = doc.document.get("condition")
    if not isinstance(condition, str):
        return []
    allowed = set(dial_ids)
    allowed.update(dial_id.replace("-", "_") for dial_id in dial_ids)
    allowed.update(CONDITION_HELPERS)
    unknown: list[str] = []
    for name in CONDITION_IDENT.findall(condition):
        if name not in allowed and name not in unknown:
            unknown.append(name)
    if not unknown:
        return []
    listed = ", ".join(repr(name) for name in unknown)
    return [
        Issue(
            doc.path,
            (
                f"condition uses unknown name(s) {listed}. "
                "A hyphenated dial id may be written with underscores. The helper Z_fission is allowed."
            ),
        )
    ]


def _citation_rules(doc: LoadedDocument, source_ids: set[str], kind: str) -> list[Issue]:
    who = doc.document.get("id")
    name = who if isinstance(who, str) else doc.path
    sources = doc.document.get("sources")
    if not isinstance(sources, list) or len(sources) == 0:
        return [
            Issue(
                doc.path,
                f"{kind} {name!r} must cite at least one source id that exists in sources/",
            )
        ]
    unknown = [item for item in sources if not isinstance(item, str) or item not in source_ids]
    if not unknown:
        return []
    listed = ", ".join(repr(item) for item in unknown)
    return [
        Issue(
            doc.path,
            f"{kind} {name!r} cites source ids that are not in sources/: {listed}",
        )
    ]


def _stage_rules(doc: LoadedDocument, stage_ids: set[str]) -> list[Issue]:
    requires = doc.document.get("requires")
    if not isinstance(requires, list):
        return []
    issues: list[Issue] = []
    for required in requires:
        if isinstance(required, str) and required not in stage_ids:
            issues.append(Issue(doc.path, f"stage requires {required!r}, which is not a stage id"))
    return issues


def _seed_rules(doc: LoadedDocument, card_paths: set[str]) -> list[Issue]:
    seeds = doc.document.get("seeds")
    if not isinstance(seeds, list):
        return []
    issues: list[Issue] = []
    for seed in seeds:
        if not isinstance(seed, dict):
            continue
        card = seed.get("card")
        if isinstance(card, str) and card not in card_paths:
            issues.append(
                Issue(
                    doc.path,
                    f"seed {seed.get('n')!r} card path {card!r} does not resolve to a card.json",
                )
            )
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
