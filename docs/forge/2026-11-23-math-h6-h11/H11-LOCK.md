# H11 LOCK — stacked 4- and 5-dimensional growth rules: does d_s reach 4?
Locked by Physicist, 2026-11-23 ~21:30 CST. **Not in PROPOSALS.md** (which covers H6–H10); rule definitions from Physicist's
guidance relaying Mathematician's H11 proposal. Pipeline: H3 UNCHANGED.
Code: code/h11_run.py (new runner) imports **code/h3_run.py, byte-identical to the H1–H3 lock (218a3a9)**; h11_run.py asserts that
sha256 before running. Run (Mathematician): `<venv-h python> code/h11_run.py` → out/h11_output.{txt,json}. Smoke: `--smoke` (SEEN).

## 1. Rules (DERIVED definitions; one generator gen_stack(n, rng, k, mode))
- **R4a** (k=4, mode a): start = boundary of the 4-simplex (K5) with its 5 tetrahedral facets; each step picks a CURRENT facet
  uniformly, adds a vertex joined to its 4 vertices, and replaces that facet by the 4 new ones. (Random stacked 4-polytope.)
- **R4b** (k=4, mode b): random 4-tree: start K4; pick uniformly among ALL 4-cliques ever created; new vertex joins its 4
  vertices; the 4 new 4-cliques are appended; old cliques stay selectable.
- **R5a / R5b**: same with k = 5 (start K6 / K5; 5 links per new vertex).
- Consistency check (SEEN, at lock): gen_stack(k=3, 'a') reproduces H3's gen_R2 and gen_stack(k=2, 'b') reproduces gen_R1
  **graph-identically** for the same rng (n = 500). Mean degree → 2k (8 for R4, 10 for R5). Smoke (n=100) in out/h11_smoke.txt.
- Label: the rules **import the simplex dimension by hand** (k). ANALOGY-ONLY as PRR physics.

## 2. SEEN DATA (declared)
- a093cf4 (H3 run, seen/h3_output_a093cf4.txt): instruments Z4 d_s 4.1245, Z2 2.0154; R1 mean d_s 2.306 (10⁵; 2.50 at 10⁴);
  R2 mean 2.600 (10⁵; 2.81 + 2×SATURATED at 10⁴); R3 NO-WINDOW. Instrument geometry/seeds here are identical ⇒ instrument
  outputs are already SEEN and will be reproduced bit-for-bit (same seeds, same code).
- out/h11_smoke.txt: n = 100 edge counts / connectivity only. No spectral dimension of any R4/R5 graph has been computed.

## 3. Locked procedure (H3, unchanged)
Continuous-time walk, L = I − A D⁻¹, 64 sources, σ_lo = 24, σ_hi = min(256, 0.5/λ₂); NO-WINDOW if σ_hi < 48; SATURATED if
P(σ_hi) < 5·P∞; 24 log-spaced σ, OLS slope, halves d_lo/d_hi; no stationary subtraction. Band [3.7, 4.3] (Z2 instrument [1.7, 2.3]).
n = 10⁴ and 10⁵, seeds 1, 2, 3, rng `default_rng([20261124, rule_id, n, seed])`, rule ids R4a 11, R4b 12, R5a 13, R5b 14.
Instruments: Z4 torus side 24, Z2 torus side 316, analytic λ₂, rng [20261124, 7, d]. Scored at n = 10⁵ only.

## 4. Verdict mapping (H3 rule_verdict, fixed)
Per rule (n = 10⁵, 3 seeds): ≥ 2 seeds NO-WINDOW/SATURATED ⇒ **KILLED** (no window); mean d_s outside [3.7, 4.3] ⇒ **KILLED**;
all 3 seeds and both halves in band ⇒ **SURVIVED**; mean in band otherwise ⇒ **NOT-TESTABLE-YET**. Instrument fail ⇒ NOT-TESTABLE-YET.
PRR level: any rule SURVIVED ⇒ **"SURVIVED — not PRR-distinctive unless PRR fixes the dimension"** (k is put in by hand);
none ⇒ **NOT-TESTABLE-YET** (PRR still lacks a locality rule). NOT-TESTABLE-AS-DEFINED: not used.

## 5. Predictions (recorded before any run)
- **Physicist:** all four KILLED with d_s < 3.7; R4 ≈ 2.9, R5 ≈ 3.2 (extrapolating R1 2.31 → R2 2.60, ~+0.3 per simplex
  dimension). Low confidence; NO-WINDOW or SATURATED (higher mean degree ⇒ larger λ₂ ⇒ smaller σ_hi) also plausible.
  Caveat noted at lock: R1's d_s *fell* from 10⁴ to 10⁵ (2.50 → 2.31), which cuts against simple extrapolation.
- **Mathematician:** "unknown".
- Calibration note: Physicist's earlier "R1 ≫ 4" lean for H3 was wrong; the lock-time prior (~2) was closer.

## 6. Runtime
R2 at 10⁵ took 190–550 s per seed; R4/R5 are denser ⇒ expect ~1–2 h total for H11 (12 runs at 10⁵ + 12 at 10⁴ + instruments).
