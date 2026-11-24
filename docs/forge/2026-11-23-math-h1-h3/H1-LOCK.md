# H1 LOCK: do the zeta zeros force a complex PRR alphabet? (symmetry-class test)

Locked 2026-11-23 ~20:15 America/Regina (CST) by Physicist. Source: Mathematician, `/workspace/mathematician/hypotheses-2026-11-23/REPORT.md` §3 "H1" (approved by Sajjad via Mathematician, 2026-11-23 20:02 CST). Runner: `code/h1_run.py` (committed with this lock; do not edit). Runs: Mathematician. Nothing in this lock has been computed on any unseen window.

## 1. Claim, labelled
- C1 (IMPORTED, ESTABLISHED): high Riemann zeros follow GUE local statistics (Montgomery, Proc. Symp. Pure Math. 24, 181, 1973, as cited by Atas et al. 2013, no DOI checked; Odlyzko, Math. Comp. 48, 273, 1987, DOI 10.1090/S0025-5718-1987-0866115-0).
- C2 (IMPORTED, ESTABLISHED): Wigner matrices with independent sub-exponential entries, including Bernoulli ±1, have bulk GOE (real symmetric) or GUE (complex Hermitian) local statistics (Erdős–Yau–Yin, PTRF 154, 341, 2012, DOI 10.1007/s00440-011-0390-3; Tao–Vu, Acta Math. 206, 127, 2011, DOI 10.1007/s11511-011-0061-3). The sparse degree-4 ensemble (c) and the spin chains (d) are NOT covered by these theorems; for them GOE is expected but only by quantum-chaos lore (Bohigas–Giannoni–Schmit 1984), so (c) and (d) are genuinely open here.
- C3 (DERIVED): a real symmetric operator commutes with complex conjugation (an antiunitary T with T² = +1), so its generic class is GOE, not GUE. Entries in {±1, ±i} with E h² = (1+1−1−1)/4 = 0 and E|h|² = 1 match GUE second moments.
- C4 (CONJECTURE, the only PRR content): IF the zeros are the spectrum of a PRR operator (Hilbert–Pólya), THEN that operator cannot be real ±1; the alphabet must break time reversal (be complex, e.g. Z4 = {±1, ±i}). The antecedent is currently ANALOGY-ONLY: Mathematician's score of lock 03ced66 (RH Hilbert–Pólya) found no operator in the Alpöge proof.
- Honest expectation, written before running: **REDUCES-TO-KNOWN**. C1 + C2 + C3 already imply the outcome. A confirmation adds nothing PRR-distinctive. Nothing in this test can make H1 SURVIVED.

## 2. SEEN DATA (cannot count as confirmation)
From REPORT.md, `c1_output.txt`, `c3_output.txt` (seed 20261123):
- Zeros 10^12+1 … 10^12+10^4 (`zeros3`): ⟨r⟩ = 0.6000 ± 0.0023 (computed on Riemann–von Mangoldt-unfolded heights). KS to GUE surmise 0.0058, GOE 0.0694, Poisson 0.2830 (crit 0.0136). Pair-corr RMS vs GUE 0.0371, vs Poisson 0.3370. Fraction of spacings < 0.1: 0.00060. Mean unfolded spacing 1.00011.
- First 10^5 zeros (`zeros1`): ⟨r⟩ = 0.6109 ± 0.0007. KS GUE 0.0193, GOE 0.0866, Poisson 0.2982 (crit 0.0043). Pair-corr RMS vs GUE 0.0276, vs Poisson 0.3464. Fraction < 0.1: 0.00079. Zeros #1, #1000, #100000 match mpmath to 9 digits. **So the "first 10^5 zeros" window proposed in the brief is already seen and is not used as the unseen datum.**
- Simulated references, N=1000 middle half: c1 (20 reps) Poisson 0.3837 ± 0.0027, GOE 0.5288 ± 0.0038, GUE 0.6019 ± 0.0031; c3 (10 reps) Poisson 0.3828 ± 0.0040, GOE 0.5322 ± 0.0036, GUE 0.6008 ± 0.0033.
- ±1 operators, N=1000, 10 reps, middle half (c3): A dense real ±1, zero diagonal 0.5369 ± 0.0036; B dense {±1,±i}, zero diagonal 0.5970 ± 0.0033; F sparse real ±1 deg≈4 0.5267 ± 0.0037; C real chain L=12 0.5039 ± 0.0029 (4 samples); D chain + complex XY−YX 0.6000 ± 0.0026 (4 samples); E hypercube Z2^12: 13 distinct levels (degenerate, not RMT).
- Literature-seen: Atas et al. 2013 Fig. 4 already showed the r-histogram of the 10^4 zeros from the 10^22nd zero agreeing with GUE (no ⟨r⟩ number quoted). Hence `zeros5` is secondary, `zeros4` primary.
- Lock-time smoke test (this lock, not statistics): every generator built an 8×8 (chains: L=4) matrix and the three zero files parse to 10,000 values each. No ⟨r⟩ was computed on anything.

## 3. Fixed parameters
- Statistic: r̃_n = min(s_n, s_{n+1}) / max(s_n, s_{n+1}), s_n consecutive spacings; ⟨r̃⟩ = mean over all ratios pooled. No unfolding (Atas et al.: r̃ is independent of the local density).
- Reference values (IMPORTED, Atas et al., PRL 110, 084101, 2013, Table I, checked against arXiv:1212.5611 this turn): Poisson 2ln2−1 = 0.3863; GOE 0.5307(1); GUE 0.5996(1). Not re-simulated for the decision.
- Decision rule (per ensemble/window): tol = max(3·SE, 0.010). Class = the single reference within tol of ⟨r̃⟩; otherwise INDETERMINATE. The 0.010 floor is fixed now because REPORT already showed finite-N offsets of up to 0.006 (A: 0.5369 vs 0.5307) and SE shrinks with more samples; the GOE–GUE gap is 0.069, so the floor cannot merge classes.
- Ensembles (`code/h1_run.py`):
  - (a) real symmetric, iid ±1 entries including the diagonal. Kill-eligible.
  - (a0) REPORT A exactly (zero diagonal). Kill-eligible, seen replication.
  - (b) complex Hermitian, off-diagonal iid uniform on {+1, −1, +i, −i}, diagonal real ±1. Must be GUE for REDUCES-TO-KNOWN.
  - (c) REPORT F exactly: sparse real symmetric, edge probability 4/N (mean degree ≈ 4), ±1 signs, zero diagonal. Kill-eligible.
  - (d1) REPORT C exactly: H = Σ J_i Z_iZ_{i+1} + Σ h_i X_i + Σ 0.5·g_i Z_i, open chain, J,h,g iid ±1. Kill-eligible. (Note: REPORT's docstring says g ∈ {±1}; its code multiplies by 0.5. The code is what produced the seen number, so the 0.5 is kept.)
  - (d2) REPORT D exactly: d1 + Σ k_i (X_iY_{i+1} − Y_iX_{i+1}), k_i ±1. Complex control, reported only.
  - Instrument: Gaussian GOE (A+Aᵀ)/2 and GUE (A+A†)/2.
- Sizes and samples: matrix ensembles N = 500 / 1000 / 2000 with 40 / 20 / 10 samples. Chains L = 10 / 12 (dim 1024 / 4096) with 20 / 4 samples. Classification uses the largest size only (N=2000; L=12); smaller sizes are reported as a trend.
- Spectrum: middle 50% of each sorted spectrum (indices ⌊n/4⌋ … ⌊3n/4⌋−1). Spacings ≤ 1e−10 dropped and counted (degeneracy guard).
- SE for ensembles: standard deviation of per-sample means / √samples.
- Seeds: numpy `default_rng([20261124, ensemble_id, size])`, ids a=1, a0=2, b=3, c=4, d1=5, d2=6, GOE=7, GUE=8; samples drawn sequentially. (REPORT used 20261123; the new seed gives new draws.)
- Zeros (Odlyzko, www-users.cse.umn.edu/~odlyzko/zeta_tables/, downloaded 2026-11-23 20:0x CST, stored in `data/`):
  - PRIMARY `zeros4`: zeros #10^21+1 … #10^21+10^4 (heights ≈ 1.4418×10^20), sha256 10d9f7dab2bbfff6b8befbe6f765969b0b3f38f6110ed1df423931addd52da8f.
  - SECONDARY `zeros5`: #10^22+1 … #10^22+10^4, sha256 250ac4ba722c6face4d07c05777376fc2b9bc021b05232e8f53c91b1eb2b7e0d.
  - SEEN replication `zeros3`: #10^12+1 … #10^12+10^4, sha256 75a1f1a978d5e3eddd16518f661d41a95a40b33782389ba02ec4ed0ce0764807.
  - All 10^4 zeros of each file, no bulk cut. The file values are γ − offset; the offset is NOT added (float64 cannot resolve 10^20-sized heights; differences are exact as given). Odlyzko states zeros4/5 are "probably accurate to within 10^(-6)"; mean spacing there ≈ 0.14, so this is harmless.
  - SE for zeros: batch means over 20 contiguous blocks (consecutive ratios are correlated). The naive SE is also printed, not used.

## 4. Predictions (written before running)
- zeros4, zeros5: GUE, ⟨r̃⟩ in [0.595, 0.607] (DERIVED expectation from C1; finite-height corrections shrink with height, and the seen low-height excess 0.6109 should not reappear at 10^21).
- (a), (a0), (c): GOE. (d1): GOE or INDETERMINATE (seen 0.5039 sits between Poisson and GOE at L=12; the L=10→12 trend will be reported). (b), (d2): GUE. Instruments: correct.

## 5. Verdict mapping (fixed; evaluated by `verdict()` in the runner)
1. Instrument: Gaussian GOE must classify GOE and Gaussian GUE must classify GUE at N=2000. Otherwise **NOT-TESTABLE-YET** (no recalibration, no re-run with new settings).
2. **KILLED** if `zeros4` or `zeros5` classifies GOE, OR any real ±1 class (a, a0, c, d1) classifies GUE at its largest size. (Mathematician's kill conditions.)
3. **REDUCES-TO-KNOWN** if `zeros4` AND `zeros5` classify GUE, no real ±1 class is GUE, and (b) classifies GUE. Card text: "Real-±1 PRR operators sit in GOE; the zeros sit in GUE; complexified ±1 sits in GUE. Known physics (Wigner–Dyson universality + Montgomery–Odlyzko). PRR content is conditional only: IF a Hilbert–Pólya operator exists and is PRR's, its alphabet must be complex. Antecedent ANALOGY-ONLY."
4. Otherwise **NOT-TESTABLE-YET** (no kill fired, but a required GUE classification came out INDETERMINATE).
- SURVIVED is not an available outcome: confirming GUE is already implied by imported theorems.
- NOT-TESTABLE-AS-DEFINED (proposed, pending Sajjad) would apply to C4 itself, since its antecedent (a PRR operator with the zeros as spectrum) is not defined; it is NOT used as a verdict here.

## 6. Non-negotiables
No post-hoc change of tol, seeds, sizes, windows or references. `zeros3` and (a0) are seen replications and cannot confirm anything. Any deviation from the runner = a new lock.
