# LOCKED: C1b + C2b — engine edits for the Hoyle window and pp-chain (Chemist, 2026-11-18 ~20:20 CST)

Written before any code is changed. Follows Physicist's C1/C2 results (658d498, 87993ed): the physics held, the kills came from unchanged engine code. Scope: data + engine + tests only. No stage changes (open PRs #13–#17 touch stages; the two-stage version stays on branch chemist-c2-stages).

## C1b Hoyle window (l.s08.hoyle-window)
Change, in YAML condition, site/engine/atlas.js and site/engine/parity/eval_ref.py identically:
- PASS iff |s| <= 0.005 AND |alpha/alpha0 - 1| <= 0.02. Else CONTESTED. Never FAIL.
- Text credits: strong ±0.5% = Oberhummer, Csótó & Schlattl 2000; alpha ±2% = Epelbaum et al. 2013 (PRL 110, 112502). Remove "±2.5% (Epelbaum 2013)".
- CONTESTED band "alpha 2–4%: outside Epelbaum 2013, inside Oberhummer 2000's Coulomb window" (was 2.5–4%).
Kill tests (scored after the change):
- K1: alpha = 1.022·alpha0, s = 0 → CONTESTED in both engines. (Point inside the old 2–2.5% gap.)
- K2: alpha = 1.018·alpha0, s = 0 → PASS in both engines.
- K3: no "2.5" / "0.025" left in hoyle-window code or text.
- K4: JS/Python parity report has 0 mismatches.

## C2b pp-chain (l.s08.pp-chain)
- Never FAIL. Delete the s >= 0.5 FAIL branch and the "most hydrogen burned in the Big Bang (MacDonald & Mullan 2009)" string (MacDonald & Mullan say substantial H survives for G < 1.5, i.e. s < 1.25, outside the dial range).
- PASS iff -0.04 <= s <= +0.06 (square-well edges, Adams 2019 §2.4, arXiv PDF p.31). The untraceable +0.034 edge is dropped.
- CONTESTED outside, with model ranges named: deuteron may unbind for s in [-0.06,-0.04] or below (dissent Adams & Grohs 2017); diproton may bind for s in [+0.06,+0.17] or above (dissent MacDonald & Mullan 2009). ASSUMED: well depth ∝ alpha_s.
- Sources: add adams-grohs2017 (doi:10.1016/j.astropartphys.2017.03.009, Crossref-checked) to sources.json and to the link.
Kill tests:
- K5: zero grid points FAIL on l.s08.pp-chain (was 15/3150).
- K6: s = 0.05 → PASS; s = 0.07 → CONTESTED; s = -0.05 → CONTESTED; s = 0.55 → CONTESTED.
- K7: validate passes; gen_stages --check passes; full test suite passes (count reported as-is).
- K8: K4 parity holds for pp-chain too.
Any failure of K1–K8 is reported as a failure, not fixed by editing this lock.
