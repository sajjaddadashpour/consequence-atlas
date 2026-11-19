"""Lock C1b/C2b (docs/locks/LOCKED_C1b_C2b_ENGINE.md): fixed test points for the Hoyle alpha band and the pp-chain edges."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "site/engine/parity"))
from eval_ref import A0_DIAL, OURS, links_of  # noqa: E402


def status(link_id, **dials):
    d = dict(OURS)
    d.update(dials)
    return {l["id"]: l["status"] for l in links_of(d)[0]}[link_id]


def test_hoyle_alpha_band():
    assert status("l.s08.hoyle-window", alpha=1.022 * A0_DIAL) == "CONTESTED"
    assert status("l.s08.hoyle-window", alpha=1.018 * A0_DIAL) == "PASS"


def test_pp_chain_never_fails():
    assert status("l.s08.pp-chain", strong=0.05) == "PASS"
    assert status("l.s08.pp-chain", strong=0.07) == "CONTESTED"
    assert status("l.s08.pp-chain", strong=-0.05) == "CONTESTED"
    assert status("l.s08.pp-chain", strong=0.55) == "CONTESTED"
