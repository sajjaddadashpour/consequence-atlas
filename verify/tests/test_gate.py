"""Tests for the local gate-checker prototype (verify/gate). Run: python3 -m pytest verify/tests/test_gate.py"""
import json
import math
import shutil
from pathlib import Path

import pytest

from verify.gate import sign, stats
from verify.gate.gate import CardResult, apply_confirmation, assign_labels, build_plan, confirm_plan, decide, evaluate, half
from verify.gate.seeds import gate_seed, gate_seeds

ROOT = Path(__file__).resolve().parents[2]


# ---------- seeds ----------
def test_seeds_deterministic_and_distinct():
    a = gate_seeds("sha256:abc|c.x", "test", 64, 5)
    assert a == gate_seeds("sha256:abc|c.x", "test", 64, 5)
    assert len(set(a)) == 5
    assert a != gate_seeds("sha256:abc|c.x", "control", 64, 5)
    assert a != gate_seeds("sha256:abc|c.x", "test", 32, 5)
    assert a != gate_seeds("sha256:abd|c.x", "test", 64, 5)
    assert all(0 <= s < 2**32 for s in a)


def test_seed_known_value():
    import hashlib
    h = hashlib.sha256(b"L|test|64|0").digest()
    assert gate_seed("L", "test", 64, 0) == int.from_bytes(h[:4], "big")


# ---------- statistics ----------
def test_z_crit_values():
    assert stats.z_crit(1) == pytest.approx(3.0, abs=1e-4)
    assert stats.z_crit(2) == pytest.approx(3.2051, abs=1e-3)
    assert stats.z_crit(3) == pytest.approx(3.3201, abs=1e-3)
    with pytest.raises(ValueError):
        stats.z_crit(0)


def test_welch_matches_formula():
    a, b = [1.0, 2.0, 3.0, 4.0, 5.0], [0.0, 0.5, 1.0, 1.5, 2.0]
    d, se = stats.welch(a, b)
    assert d == pytest.approx(2.0)
    assert se == pytest.approx(math.sqrt(2.5 / 5 + 0.625 / 5))


def test_compare_stochastic_threshold():
    a = [10.0, 10.1, 9.9, 10.05, 9.95]
    b = [0.0, 0.1, -0.1, 0.05, -0.05]
    c = stats.compare("x", a, b, stats.z_crit(3))
    assert c.differs and not c.deterministic and c.z > 100
    same = stats.compare("x", a, list(a), 3.0)
    assert not same.differs


def test_compare_deterministic_exact_never_z():
    c = stats.compare("x", [2.0] * 5, [1.0] * 5, 3.0)
    assert c.deterministic and c.z is None and c.differs and c.p == 0.0
    tiny = stats.compare("x", [1.0 + 1e-6] * 5, [1.0] * 5, 3.0)
    assert tiny.deterministic and not tiny.differs  # below default min_effect 1e-3 relative
    declared = stats.compare("x", [1.0 + 1e-6] * 5, [1.0] * 5, 3.0, min_effect=1e-7)
    assert declared.differs
    zero = stats.compare("x", [1.0] * 5, [1.0] * 5, 3.0, min_effect=0.0)
    assert not zero.differs  # effect must be nonzero


def test_bh_qvalues_reference():
    # reference values computed by hand: p sorted 0.01,0.02,0.03,0.5 with m=4
    q = stats.bh_qvalues([0.03, 0.01, 0.5, 0.02])
    assert q == pytest.approx([0.04, 0.04, 0.5, 0.04])
    assert stats.bh_qvalues([]) == []


# ---------- decision logic ----------
def _r(**kw):
    r = CardResult("c.t", "fam", "CONJECTURE", k=1, z_crit=3.0, measure="x")
    for k, v in kw.items():
        setattr(r, k, v)
    return r


@pytest.mark.parametrize("kw,label", [
    (dict(full_pass=True, half_pass=True, q=0.01), "DIFFERS"),
    (dict(full_pass=True, half_pass=False, q=0.01), "FAILED"),
    (dict(full_pass=True, half_pass=True, q=0.2), "FAILED"),
    (dict(full_pass=False, half_pass=False, q=1.0), "FAILED"),
    (dict(full_pass=True, half_pass=True, q=0.0, null_trip=True), "DEAD-END"),
    (dict(full_pass=True, half_pass=True, q=0.0, inert=True), "INERT-BY-CONSTRUCTION"),
    (dict(full_pass=True, half_pass=True, q=0.0, status="REJECTED"), "CONJECTURE"),
    (dict(full_pass=True, half_pass=True, q=0.0, status="HELD"), "CONJECTURE"),
])
def test_decide(kw, label):
    assert decide(_r(**kw)) == label


def test_family_fdr_counts_unrun_cards():
    rs = [_r(full_pass=True, half_pass=True, p_adj=0.02)]
    assign_labels(rs, {"fam": 1})
    assert rs[0].label == "DIFFERS"  # q = 0.02
    rs = [_r(full_pass=True, half_pass=True, p_adj=0.02)]
    assign_labels(rs, {"fam": 10})
    assert rs[0].q == pytest.approx(0.2) and rs[0].label == "FAILED"


def test_half_rule():
    assert half({"family": "Q", "steps": 100, "size": 50})["steps"] == 50
    assert half({"family": "M", "meta": "pop", "popN": 40, "steps": 10})["popN"] == 20
    assert half({"family": "M", "meta": "x", "popN": 40, "steps": 10})["steps"] == 5
    assert half({"family": "P", "size": 64})["size"] == 32


# ---------- evaluate() on synthetic engine outputs ----------
def _card():
    return {"id": "c.syn", "family": "fam", "label": "CONJECTURE",
            "lock": {"hash": "sha256:00"},
            "hypothesis": {"measure": "x", "sizes": [64, 32], "extra_measures": ["y"]},
            "rules": {"settings": "{\"family\":\"P\",\"a\":1}"},
            "control": {"settings": "{\"family\":\"P\",\"a\":0}", "null_settings": "{\"family\":\"P\",\"a\":0}"},
            "runs": [{"seed": i + 1, "output_uri": f"outputs.json#/A/{i}", "output_hash": f"h{i}"} for i in range(5)]}


def _rows(xs, tag):
    return [{"m": {"x": x, "y": 1.0}, "hash": f"{tag}{i}{x}"} for i, x in enumerate(xs)]


def _out(test, ctrl, null, repro_hashes=None):
    return {"test:full": _rows(test, "t"), "test:half": _rows(test, "t"),
            "control:full": _rows(ctrl, "c"), "control:half": _rows(ctrl, "c"),
            "null:full": _rows(null, "n"), "null:half": _rows(null, "n"),
            "repro:A": [{"hash": h} for h in (repro_hashes or [f"h{i}" for i in range(5)])]}


def test_build_plan_arms_and_repro():
    arms, meta = build_plan(_card(), 5)
    keys = [a["key"] for a in arms]
    assert keys == ["test:full", "test:half", "control:full", "control:half", "null:full", "null:half", "repro:A"]
    assert meta["want"]["repro:A"] == [f"h{i}" for i in range(5)]
    assert arms[-1]["seeds"] == [1, 2, 3, 4, 5]
    assert meta["seeds"]["test:full"] != [1, 2, 3, 4, 5]  # gate seeds, not author seeds
    arms2, meta2 = build_plan(_card(), 5, repro_fraction=0.2)
    assert len(meta2["want"]["repro:A"]) == 1


def test_evaluate_differs_path():
    c = _card()
    _, meta = build_plan(c, 5)
    out = _out([5, 5.1, 4.9, 5.05, 4.95], [1, 1.1, 0.9, 1.05, 0.95], [1.02, 0.98, 1.0, 1.01, 0.99])
    r = evaluate(c, out, meta)
    assign_labels([r], {"fam": 1})
    assert r.measure == "x" and r.k == 2 and r.full_pass and r.half_pass and not r.null_trip
    assert r.label == "DIFFERS"


TEST = [5, 5.1, 4.9, 5.05, 4.95]
CTRL = [1, 1.1, 0.9, 1.05, 0.95]
TRIP = [3, 3.1, 2.9, 3.05, 2.95]
CLEAN = [1.02, 0.98, 1.0, 1.01, 0.99]


def _tripped():
    c = _card()
    _, meta = build_plan(c, 5)
    out = _out(TEST, CTRL, TRIP)
    r = evaluate(c, out, meta)
    return c, meta, out, r


def test_null_trip_awaits_confirmation():
    c, meta, out, r = _tripped()
    assert r.null_pending == ["full", "half"] and not r.null_trip and r.null_confirmed is None
    with pytest.raises(ValueError):
        decide(r)


def test_confirm_plan_independent_seed_stream():
    c, meta, out, r = _tripped()
    arms = confirm_plan(c, r, meta)
    assert [a["key"] for a in arms] == ["null-confirm:full", "null-confirm:half"]
    assert [a["half"] for a in arms] == [False, True]
    for a, tag in zip(arms, ("full", "half")):
        assert len(a["seeds"]) == 5
        assert a["seeds"] != meta["seeds"][f"null:{tag}"]
        assert a["seeds"] == gate_seeds("sha256:00|c.syn", "null-confirm", 64 if tag == "full" else 32, 5)
    assert r.seeds["null-confirm:full"] == arms[0]["seeds"]


def test_trip_then_confirm_trip_is_dead_end():
    c, meta, out, r = _tripped()
    confirm_plan(c, r, meta)
    neg = [-1 * x for x in TRIP]  # opposite sign still counts (either sign)
    apply_confirmation(c, r, out, {"null-confirm:full": _rows(neg, "k"), "null-confirm:half": _rows(CLEAN, "k")})
    assign_labels([r], {"fam": 1})
    assert r.null_confirmed is True and r.null_trip and r.label == "DEAD-END"
    assert r.null_full["z"] > 3 and r.null_full_confirm["z"] < -3


def test_trip_then_confirm_pass_proceeds():
    c, meta, out, r = _tripped()
    confirm_plan(c, r, meta)
    apply_confirmation(c, r, out, {"null-confirm:full": _rows(CLEAN, "k"), "null-confirm:half": _rows(CLEAN, "k")})
    assign_labels([r], {"fam": 1})
    assert r.null_confirmed is False and not r.null_trip
    assert r.null_full["z"] > 3 and abs(r.null_full_confirm["z"]) <= 3  # both z values recorded
    assert r.label == "DIFFERS"


def test_deterministic_null_trip_needs_no_confirmation():
    c = _card()
    _, meta = build_plan(c, 5)
    out = _out([5.0] * 5, [1.0] * 5, [2.0] * 5)
    r = evaluate(c, out, meta)
    assert r.null_pending == [] and r.null_trip and r.null_confirmed is None
    assert confirm_plan(c, r, meta) == []
    assign_labels([r], {"fam": 1})
    assert r.label == "DEAD-END" and r.null_full["deterministic"]


def test_no_trip_no_confirmation():
    c = _card()
    _, meta = build_plan(c, 5)
    r = evaluate(c, _out(TEST, CTRL, CLEAN), meta)
    assert r.null_pending == [] and r.null_confirmed is None and confirm_plan(c, r, meta) == []


def test_evaluate_repro_mismatch_rejected():
    c = _card()
    _, meta = build_plan(c, 5)
    out = _out([5, 5.1, 4.9, 5.05, 4.95], [1, 1.1, 0.9, 1.05, 0.95], [1, 1, 1, 1, 1.01], repro_hashes=["h0", "h1", "BAD", "h3", "h4"])
    r = evaluate(c, out, meta)
    assign_labels([r], {"fam": 1})
    assert r.status == "REJECTED" and r.label == "CONJECTURE" and r.repro_matched == 4


def test_evaluate_inert():
    c = _card()
    _, meta = build_plan(c, 5)
    xs = [1, 1.1, 0.9, 1.05, 0.95]
    out = _out(xs, xs, xs)
    out["control:full"], out["control:half"] = out["test:full"], out["test:half"]
    r = evaluate(c, out, meta)
    assign_labels([r], {"fam": 1})
    assert r.inert and r.label == "INERT-BY-CONSTRUCTION"


# ---------- signatures ----------
def test_sign_verify_and_tamper():
    k = sign.new_key()
    att = sign.sign({"card_id": "c.x", "label": "DIFFERS", "seeds": {"a": [1]}}, k)
    pub = sign.load_public(sign.public_pem(k))
    assert sign.verify(att, pub)
    assert att["payload"]["authoritative"] is False
    assert att["payload"]["key_id"] == sign.LOCAL_KEY_ID
    bad = json.loads(json.dumps(att))
    bad["payload"]["label"] = "ROBUST"
    assert not sign.verify(bad, pub)
    other = sign.load_public(sign.public_pem(sign.new_key()))
    assert not sign.verify(att, other)


def test_canonical_is_order_independent():
    assert sign.canonical({"b": 1, "a": [1, 2]}) == sign.canonical({"a": [1, 2], "b": 1}) == b'{"a":[1,2],"b":1}'


def test_key_file_roundtrip(tmp_path):
    p = tmp_path / "k.pem"
    k1 = sign.load_or_create_private(p)
    k2 = sign.load_or_create_private(p)
    assert sign.public_pem(k1) == sign.public_pem(k2)
    assert oct(p.stat().st_mode & 0o777) == "0o600"


# ---------- integration with the real engine (one small card) ----------
@pytest.mark.skipif(not (ROOT / "engine/starter/node_modules/.bin/tsx").exists(), reason="run npm install in engine/starter")
def test_real_card_end_to_end():
    from verify.gate.gate import check_card
    cards = sorted((ROOT / "cards/starter/dh").rglob("card.json"))
    assert cards, "expected at least one dh card"
    r = check_card(cards[0], n_seeds=3)
    assert r.status == "ok" and r.repro_matched == r.repro_checked > 0
