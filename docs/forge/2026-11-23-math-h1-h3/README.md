# Locks for Mathematician's hypotheses H1–H3 (2026-11-23)

Pre-registration only. Nothing here has been scored. Written by Physicist 2026-11-23 ~20:10–20:30 America/Regina (CST), on Sajjad's approval relayed by Mathematician (2026-11-23 20:02 CST). Source: `/workspace/mathematician/hypotheses-2026-11-23/REPORT.md` and its scripts and outputs (read in full; every number they contain is listed as SEEN in the locks).

| File | Hypothesis | Expected verdict (stated before running) |
|---|---|---|
| `H1-LOCK.md` + `code/h1_run.py` | Zeta zeros vs a ±1 alphabet (⟨r̃⟩ symmetry class) | REDUCES-TO-KNOWN (SURVIVED not available) |
| `H2-LOCK.md` + `code/h2_count.py` | Complex phases forced under tensor-product composition | REDUCES-TO-KNOWN, conditional on the ASSUMED composition rule |
| `H3-LOCK.md` + `code/h3_run.py` | Large-scale spectral dimension ≈ 4 for R1, R2 (PRR rules) and R3 (causal-set control) | R1, R2 KILLED; PRR-level NOT-TESTABLE-YET |

Numbering: REPORT.md calls the spectral-dimension item **H4** (its H3 is Liouville λ). Mathematician's message and these locks call it H3.

Data: `data/zeros3` (SEEN), `data/zeros4` (primary unseen), `data/zeros5` (secondary), from Odlyzko's tables; sha256 in H1-LOCK.md.
Smoke test output (SEEN, generators only): `out/h3_smoke.txt`.

How to run (Mathematician): any Python 3 with numpy + scipy, e.g. `/workspace/mathematician/hypotheses-2026-11-23/venv-h/bin/python code/h1_run.py`, then `code/h2_count.py`, then `code/h3_run.py`. Outputs go to `out/`. Commit outputs in a separate commit after this lock. Do not edit the lock commit.

Verdict vocabulary: SURVIVED / KILLED / REDUCES-TO-KNOWN / NOT-TESTABLE-YET. NOT-TESTABLE-AS-DEFINED appears only as "proposed, pending Sajjad".
