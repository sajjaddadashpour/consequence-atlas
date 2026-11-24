# H3 LOCK: must any PRR geometry have large-scale spectral dimension ≈ 4? Three candidate locality rules

Locked 2026-11-23 ~20:25 America/Regina (CST) by Physicist. Source: Mathematician, REPORT.md §3 "H4" (REPORT numbers it H4; Mathematician's message calls it H3; same item). Approved by Sajjad via Mathematician, 2026-11-23 20:02 CST. Runner: `code/h3_run.py` (committed with this lock; do not edit). Runs: Mathematician.

## 1. Claim, labelled
- F (CONJECTURE as a PRR requirement; DERIVED as mathematics for any given graph): a geometry built from ±1 readings must show d_s ≈ 4 over a scaling window at large scale, as a random walk on 4D space does. CDT is the template (Ambjørn–Jurkiewicz–Loll, PRL 95, 171301, 2005).
- PRR's commitments A1 (alphabet ±1, 0 only as a sum), A2 (no all-empty state), D2 (pair creation conserves charge) do not fix a graph (REPORT, DERIVED). So F can only be tested on a *named* locality rule. A rule counts as PRR-distinctive only if 4 is not an input.

## 2. SEEN DATA (cannot count as confirmation)
From REPORT.md and `c4_output.txt` (discrete-time walk, not this lock's continuous-time walk):
- 3-regular tree ("each reading branches into + and −"): d_s = 3.1, 8.3, 14.4, 61.8, 120.7, 474.0 at t = 10, 50, 100, 500, 1000, 4000; P(t)^{1/t} = 0.94041 at t=4000 vs 2√2/3 = 0.94281. Naive branching tree **KILLED (DERIVED)**.
- Z^d lattices: Z^1 0.999 (t=1000), 0.999 (t=500); Z^2 1.999, 1.998; Z^3 2.992 (t=200), 2.985 (t=100); Z^4 3.990 (t=200), 3.981 (t=100).
- Hypercube Z2^4: max d_s 1.36 at t=2; Z2^12: max 4.94 at t=6; both → 0 (finite).
- Lock-time smoke test (Physicist, `out/h3_smoke.txt`, all SEEN):
  - n=100 generators: R1 197 edges, connected; R2 294 edges, connected; R3 308 edges, largest component 90%; all symmetric. Z4 torus side 4: all degrees 8.
  - Pipeline on R1 n=100: NO-WINDOW (λ2 = 0.0428, σ_hi = 11.70).
  - Pipeline code-path check on a Z2 torus side 60 (an instrument geometry, not a locked size): d_s = 2.018 (halves 2.028 / 2.009). A first version that subtracted the stationary value gave 2.158 (halves 2.101 / 2.235) on the same torus; that subtraction biases d_s upward when P is not ≫ 1/N, so it was removed BEFORE this lock. No PRR graph (R1/R2/R3 at a locked size) has been measured.
- Lock-time DERIVED instrument expectations (exact infinite-lattice heat kernel, P = [e^{−σ/d} I_0(σ/d)]^d, same window rule): Z4, σ ∈ [24, 58.7]: d_s = 4.125 (halves 4.160 / 4.093). Z2, σ ∈ [24, 256]: 2.015 (2.026 / 2.007).

## 3. Fixed method (all rules and instruments)
- Graph: undirected, unweighted, no self-loops or multi-edges; measured on its largest connected component (fraction reported).
- Walk: continuous-time random walk, dp/dσ = −(I − A D^{−1}) p (total jump rate 1, uniform over neighbours). σ is in units of mean jumps.
- Return probability: P(σ) = mean over 64 source nodes (uniform without replacement, seeded) of [e^{−σ(I − A D^{−1})} e_s]_s, computed with `scipy.sparse.linalg.expm_multiply`, stepping between consecutive σ. **No stationary subtraction**; P∞ = mean_s deg_s / 2E is reported only.
- λ2 = smallest non-zero eigenvalue of L_sym = I − D^{−1/2} A D^{−1/2}: tori use the analytic value (1 − cos(2π/side))/d; other graphs use `eigsh(2I − L_sym, k=2, which='LA', tol=1e−8, maxiter=50000, seeded v0)`.
- Window: σ_lo = 24, σ_hi = min(256, 0.5/λ2). If σ_hi < 2·σ_lo = 48 → **NO-WINDOW**. If P(σ_hi) < 5·P∞ → **SATURATED** (counts as NO-WINDOW). 24 log-spaced σ in [σ_lo, σ_hi].
- Fit: OLS of ln P on ln σ over all 24 points: d_s = −2·slope. Halves: points 1–12 → d_lo, 13–24 → d_hi.
- "In band" for one graph: d_s, d_lo and d_hi all in **[3.7, 4.3]** (Z2 instrument: [1.7, 2.3]).
- Seeds: `default_rng([20261124, rule_id, n, seed])`, rule_id R1=1, R2=2, R3=3, seed ∈ {1, 2, 3}; the same generator feeds graph growth, source choice and v0. Instruments: `default_rng([20261124, 7, d])`.
- Sizes: R1, R2: n = 10^4 and 10^5; R3: n = 5000 and 10^4 (dense causal matrix; 10^5 is out of reach in minutes). 3 seeds each. Verdicts use the largest size; the smaller is a trend report.

## 4. Rules (fully algorithmic; see `code/h3_run.py`)
- **R1 — "born together, with closure" (random 2-tree).** Start: one link {0,1} (the first ± pair). Each step adds node w and picks a link (u, v) uniformly from all links made so far; w links to both u and v (closing a triangle). Reading (ASSUMED): "a new reading must be supported by a further reading" = the new reading is sustained by both ends of an existing link; the "pair" is the pair of new links. No dimension is input.
- **R2 — stacked-simplex growth (random Apollonian network; boundary of a random stacked 3-polytope).** Start: K4 and its 4 faces. Each step picks a current face (a, b, c) uniformly; new node w links to a, b, c; the face is replaced by (a,b,w), (a,c,w), (b,c,w). Uses only the triangle/tetrahedron rule; no dimension is input. (The alternative "random 3-tree" that keeps old faces selectable was considered and NOT chosen; Physicist's brief says "stacked-polytope growth".)
- **R3 — CONTROL, imports d = 4 by hand: causal set.** n points uniform in the 4D Minkowski diamond |t| + |x| ≤ 1 (c = 1; fixed n, no Poisson count). x ≺ y iff t_y − t_x > |x_y − x_x|. Undirected link graph (Hasse diagram: x ≺ y with nothing between). Not PRR. Literature (IMPORTED, verified this turn on arXiv:1311.2530 and Crossref): Eichhorn & Mizera, CQG 31, 125007 (2014), DOI 10.1088/0264-9381/31/12/125007 — undirected walks on sprinkled causal sets show d_s *above* the topological dimension at small σ (nonlocality: links per element grow with N), approach d only at intermediate σ when an infrared cutoff is imposed, and drop to 0 at the boundary; 3+1 runs were computationally limited to small cutoffs.
- **Instruments:** Z4 torus side 24 (331,776 nodes) must be in [3.7, 4.3]; Z2 torus side 316 (99,856 nodes) must be in [1.7, 2.3] (shows the band discriminates).

## 5. Predictions (written before any locked-size run)
- Instruments: Z4 ≈ 4.12 (halves ≈ 4.16 / 4.09); Z2 ≈ 2.02. PASS expected (DERIVED; finite-torus images are < 1e−3 of P in the window).
- **R1** — brief prior (Physicist): planar-like, d_s ≈ 2. Lock-time reasoning: a random 2-tree is a "thickened" random recursive tree: small-world (depth ∝ log n), heavy-tailed degrees, with bottleneck links, so λ2 should be small and a window should exist; on tree-like hyperbolic graphs P(σ) decays faster than any power once hubs are left, so the fitted d_s should be large and rising (d_hi > d_lo), not ≈ 2 and not ≈ 4. **Prediction: outside [3.7, 4.3] → KILLED.** Direction (≈2 vs ≫4) honestly uncertain; I lean ≫ 4 with d_hi > d_lo.
- **R2** — prior unknown, stated honestly. Apollonian networks are planar and small-world with power-law degrees (Zhou, Yan, Wang, PRE 71, 046141, 2005, Crossref-verified metadata; claims not re-read). Planarity does not give d_s = 2 on a small-world graph. **Prediction: outside [3.7, 4.3] → KILLED**, low confidence on the value.
- **R3** — **Prediction: NO-WINDOW or d_s > 4.3** at n ≤ 10^4 (nonlocal links ⇒ large λ2 and/or small-σ d_s above 4, per Eichhorn & Mizera). So even the imported-dimension control is expected NOT to show 4 with this method at this size. That would be a statement about the method on Lorentzian graphs, not about PRR.

## 6. Verdict mapping (fixed; evaluated by the runner)
- Instrument FAIL (Z4 or Z2 not in band) → **NOT-TESTABLE-YET**, nothing scored, no recalibration.
- Per rule, at its largest size, 3 seeds:
  - NO-WINDOW/SATURATED in ≥ 2 seeds → **KILLED** (no diffusive scaling regime of one octave at a size where Z4 has 1.3 octaves cannot be 4D).
  - mean d_s outside [3.7, 4.3] → **KILLED**.
  - all 3 seeds OK and in band (d_s, d_lo, d_hi) → **SURVIVED**.
  - otherwise → **NOT-TESTABLE-YET** for that rule.
- PRR level:
  - R1 or R2 SURVIVED → **SURVIVED** (a no-dimension-input rule yields d_s ≈ 4; that this rule *is* PRR's stays CONJECTURE).
  - Neither SURVIVED → **NOT-TESTABLE-YET for PRR** (PRR still lacks a locality rule giving 4); R1/R2 individually carry their KILLED/NTY verdicts. This holds whether or not R3 hits 4 — R3 is context: if R3 is in band, the method can see an imported 4 on a Lorentzian graph; if not, the undirected link-graph walk cannot see it at n ≤ 10^4 (consistent with Eichhorn & Mizera), and R3 cannot be used as a 4D reference.
- NOT-TESTABLE-AS-DEFINED (proposed, pending Sajjad) would describe "the PRR geometry" itself until PRR names a locality rule; not used as a verdict.

## 7. Non-negotiables
No change to σ_lo, the 0.5/λ2 cap, the 256 cap, the band, sources, seeds or sizes after any locked-size output is seen. Runtime target: minutes (largest items: Z4 torus 3.3×10^5 nodes; R1/R2 at 10^5; R3 dense 10^4×10^4 float32 causal matrix, ~0.4 GB).
