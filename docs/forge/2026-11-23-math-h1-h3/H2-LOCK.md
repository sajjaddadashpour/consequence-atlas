# H2 LOCK: are complex phases forced on PRR (±1 read as the phases 0 and π)?

Locked 2026-11-23 ~20:20 America/Regina (CST) by Physicist. Source: Mathematician, REPORT.md §3 "H2" (approved by Sajjad via Mathematician, 2026-11-23 20:02 CST). This is a literature + theorem check, not a simulation. Runner for the one computational item: `code/h2_count.py` (committed, not run by Physicist).

## 1. Claim, stated precisely
- H2 (as locked): *If* PRR composes independent systems by the tensor product of real Hilbert spaces *and* independent sources prepare product states, *then* real-amplitude PRR is excluded by experiment, so PRR's amplitudes must be complex. On that reading ±1 = {e^{i0}, e^{iπ}}, the real slice of U(1), and "mirroring to zero" = destructive interference at phase difference π.
- Label of the whole: IMPORTED constraint (the exclusion) + CONJECTURE (that this is what PRR's ±1 means).

## 2. Steps, labelled
- S1 (IMPORTED): In the entanglement-swapping network with two independent sources, real quantum theory obeys 𝒯 ≤ 7.6605 (Renou et al., Nature 600, 625–629, 2021, DOI 10.1038/s41586-021-04160-4; arXiv:2101.10873 text: "the inequality 𝒯 ≤ 7.6605 nonetheless holds at every experimental round"). Complex QT reaches 3β_CHSH = 6√2 ≈ 8.485 (same text: "The maximal violation … is 3β_CHSH = 6√2, which can be attained with complex measurements on qubits").
- S2 (IMPORTED): Chen et al., PRL 128, 040403 (2022), DOI 10.1103/PhysRevLett.128.040403 (superconducting qubits, swapping fidelity 0.952): score 𝒯 = 8.09(1), violating the real bound 7.66 by **43 standard deviations** (abstract, APS/arXiv:2103.08123).
- S3 (IMPORTED): Li et al., PRL 128, 040402 (2022), DOI 10.1103/PhysRevLett.128.040402 (photons, two independent EPR sources): tested a *different, tailored* Bell-type function W, real-QT bound W_RQT ≲ 0.7486; measured W_EXP = 0.8508 ± 0.0218, i.e. **4.70 standard deviations** (abstract: "over 4.5"). NB: Li et al. did not test the 7.66 𝒯-bound.
- S4 (IMPORTED): Renou et al. also state (abstract) that real QT reproduces any multipartite experiment if the parts may share arbitrary real states. The exclusion therefore needs BOTH tensor-product composition AND source independence. Li et al. define "real quantum theory" as one in which "real Hilbert spaces of independent systems are combined by the tensor product".
- S5 (DERIVED, local-tomography count). K = number of real parameters of an *unnormalised* state (Hardy's convention, used by Masanes–Müller, NJP 13, 063001, 2011, DOI 10.1088/1367-2630/13/6/063001; Hardy–Wootters, Found. Phys. 42, 454, 2012, DOI 10.1007/s10701-011-9616-6). Local tomography ⇔ K_AB = K_A·K_B.
  - Real, one ±1 system (d=2): K_A = d(d+1)/2 = 3. Joint d=4: K_AB = 4·5/2 = 10. Products: 3·3 = 9. **10 ≠ 9 → FAILS.** The missing direction is σ_y⊗σ_y: real symmetric, but not a sum of products of real symmetric single-system operators (σ_y is imaginary).
  - Normalised convention (subtract the trace): real 10−1 = 9 vs (3·3)−1 = 8 → **9 ≠ 8**, same failure. (The REPORT's "10 ≠ 9" is the unnormalised count; "9 vs 8" is the normalised one; they agree.)
  - Complex: K_A = d² = 4, K_AB = 16 = 4·4 → HOLDS (normalised: 15 = 4·4 − 1).
  - Real, d=3: K_AB = 45 vs 6·6 = 36 → FAILS (matches REPORT).
- S6 (IMPORTED): local tomography is one of Masanes–Müller's five requirements; the PRR uniqueness check (earlier forge) found it missing. Real QT is the standard example that satisfies the others and fails this one (Hardy–Wootters).
- S7 (ASSUMED — FLAGGED LOUDLY): **PRR composes systems by the tensor product, and PRR's sources are independent.** PRR has not stated its combination rule. If composition is not the tensor product (e.g. real QT with a shared extra rebit, or any non-product gluing), the constraint does not bind. This is exactly Philosopher's open question in the TOE room (2026-11-23): does PRR join pairs Peirce-style (irreducible combination), or do pairs nest as pairs-of-pairs (set-theoretic, Quine-style reduction)? H2 binds only once PRR answers it with "tensor product of independent parts".
- S8 (CONJECTURE): ±1 = phases 0 and π; mirroring to zero = destructive interference.

## 3. SEEN DATA (cannot count as confirmation)
- REPORT.md: bound 7.66 vs 6√2 ≈ 8.49; Chen 43σ; Li ">4.5σ"; c5_output.txt: "N=2: real K_AB=10 vs K_A*K_B=9 → FAILS; complex 16 vs 16 → holds"; "N=3: real 45 vs 36 → FAILS; complex 81 vs 81 → holds"; Wootters check max gap 3.74e−3 (H5 item, not used here).
- Lock-time citation checks done by Physicist this turn (they are now SEEN, so the citation part of H2 is effectively decided at lock time; said openly):
  - Renou: Crossref title/journal/volume/pages/year match; 7.6605 and 6√2 read from arXiv:2101.10873.
  - Chen: abstract text (via search snippet of the APS page and arXiv:2103.08123): 8.09(1), "violate the real-number bound of 7.66 by 43 standard deviations". The APS page itself returned HTTP 403 to the fetcher.
  - Li: arXiv:2111.15128 PDF: W_RQT ≲ 0.7486, W_EXP = 0.8508 ± 0.0218, "by 4.70 standard deviations"; abstract "over 4.5 standard deviations".
  - Masanes–Müller, Hardy–Wootters: Crossref metadata match.

## 4. What Mathematician runs
- `code/h2_count.py`: explicit real-rank count of span{A⊗B} vs the full joint space, real and complex, d = 2, 3. Prediction (DERIVED above): R d=2 → K_A 3, K_AB 10, span 9, FAILS; R d=3 → 6, 45, 36, FAILS; C d=2 → 4, 16, 16, HOLDS; C d=3 → 9, 81, 81, HOLDS.
- Optional independent re-read of the three experimental papers' numbers (no new data exists to run).

## 5. Verdict mapping (fixed)
- If S1–S3 citations check out (they did at lock time) AND `h2_count.py` reproduces S5 → **REDUCES-TO-KNOWN**. Carried on the atlas as a *requirement on PRR's ±1 → Hilbert map*, conditional on S7: "If PRR composes independent systems by tensor product, its amplitudes must be complex (Renou 2021; Chen 2022, 43σ; Li 2022, 4.7σ on a different inequality). ±1 as phases 0, π is CONJECTURE." Not a PRR prediction.
- If any of S1–S3 fails on re-read (number, bound or significance materially different) → **KILLED as stated** (H2 rewritten from scratch under a new lock).
- If `h2_count.py` disagrees with S5 → the local-tomography leg is KILLED; the experimental leg stands alone.
- SURVIVED is not available (nothing PRR-distinctive is predicted). NOT-TESTABLE-AS-DEFINED (proposed, pending Sajjad) would describe the S7-dependent link "this is what PRR's ±1 means" until PRR states its composition rule; not used as a verdict.
