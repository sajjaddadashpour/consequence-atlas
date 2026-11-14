"""Build dist/atlas-bundle.json from a tree that already validates.

The bundle is a generated release artifact. Do not commit it.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from verify.validate import Report, repo_root, validate_root

BUCKET_KEYS = {
    "cards": "cards",
    "dead-ends": "dead_ends",
    "meanings": "meanings",
    "sources": "sources",
    "dials": "dials",
    "links": "links",
    "examples": "examples",
}


class ValidationFailed(Exception):
    def __init__(self, report: Report) -> None:
        super().__init__(f"{len(report.issues)} problem(s)")
        self.report = report


def build_bundle(root: Path, *, generated_at: str | None = None) -> dict:
    """Return the bundle for ``root``. Raise ``ValidationFailed`` if it is not valid."""
    report = validate_root(root)
    if report.issues:
        raise ValidationFailed(report)
    groups: dict[str, list[dict]] = {key: [] for key in BUCKET_KEYS.values()}
    for doc in sorted(report.documents, key=lambda item: item.path):
        item = {"document": doc.document, "path": doc.path}
        if doc.bucket == "examples":
            item["kind"] = doc.kind
        groups[BUCKET_KEYS[doc.bucket]].append(item)
    when = generated_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return {
        "format": "consequence-atlas-bundle",
        "format_version": "0.1.0",
        "generated_at": when,
        "note": "Generated from validated files. The repository files are the source of record.",
        "counts": {key: len(value) for key, value in groups.items()},
        **groups,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="verify.bundle",
        description="Write dist/atlas-bundle.json from validated atlas data.",
    )
    parser.add_argument("--root", type=Path, default=None, help="Atlas root (default: the repository).")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path (default: <root>/dist/atlas-bundle.json).",
    )
    args = parser.parse_args(argv)
    root = (args.root or repo_root()).resolve()
    output = (args.output or (root / "dist" / "atlas-bundle.json")).resolve()
    try:
        payload = build_bundle(root)
    except ValidationFailed as exc:
        for issue in exc.report.issues:
            print(issue, file=sys.stderr)
        print(f"{len(exc.report.issues)} problem(s); bundle not written", file=sys.stderr)
        return 1
    _write_json(output, payload)
    print(f"wrote {output}")
    return 0


def _write_json(output: Path, payload: dict) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    temporary.replace(output)


if __name__ == "__main__":
    sys.exit(main())
