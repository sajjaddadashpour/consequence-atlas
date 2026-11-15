"""The site engine's stage list must match atlas/stages/*.yaml exactly."""
import shutil
from pathlib import Path

import pytest

from verify import gen_stages

ROOT = Path(__file__).resolve().parents[2]


def test_generated_stages_are_current():
    assert gen_stages.main(["--check"]) == 0


def test_engine_stages_equal_yaml():
    stages = gen_stages.load_stages()
    from importlib import util
    spec = util.spec_from_file_location("eval_ref", ROOT / "site/engine/parity/eval_ref.py")
    mod = util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert [(s["id"], s["order"], s["requires"]) for s in stages] == [(a, b, list(c)) for a, b, c in mod.STAGES]


def _copy(tmp_path):
    for rel in ("atlas/stages", "site/engine/atlas.js", "site/engine/parity/eval_ref.py"):
        src, dst = ROOT / rel, tmp_path / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        (shutil.copytree if src.is_dir() else shutil.copy)(src, dst)
    return tmp_path


def test_check_catches_yaml_edit(tmp_path):
    root = _copy(tmp_path)
    f = root / "atlas/stages/s10.records.yaml"
    f.write_text(f.read_text().replace("- s04.stable-atoms\n", ""))
    assert gen_stages.main(["--check", "--root", str(root)]) == 1
    assert gen_stages.main(["--root", str(root)]) == 0
    assert 'id: "s10.records", name: "Records and memory (arrow of time)", order: 11, requires: ["s01.predictable-laws"] }' in (root / "site/engine/atlas.js").read_text()


def test_rejects_requirement_that_comes_later(tmp_path):
    root = _copy(tmp_path)
    f = root / "atlas/stages/s04.stable-atoms.yaml"
    f.write_text(f.read_text() + "- s11.life\n")
    with pytest.raises(ValueError):
        gen_stages.main(["--check", "--root", str(root)])
