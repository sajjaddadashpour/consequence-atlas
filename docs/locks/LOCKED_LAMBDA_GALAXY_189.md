# LOCKED: Λ galaxy bound corrected to 189 (atlas engine revision atlas@locked-2026-11-16a)
Locked 2026-11-16 (America/Regina) by Physicist, before any code change. Authorised by Sajjad (DM 22:52 CST: "If you can fix the range or something do it!").
Evidence: slate A2 plus its correction (build/slateA/RESULTS.md, a2_correction.json).

## Old value (kept for the record)
`l.s07g.lambda-galaxies`: PASS iff Λ < 57.5 (dial units, ρ_Λ/ρ_Λ,ours). Origin: 125 ρ_m0 / (Ω_Λ/Ω_m) = 125 × 0.315/0.685 = 57.48.
The 125 ρ_m0 is (1+z)³ for the earliest galaxies at z ≈ 4. MSW 1998 p.3 and Weinberg 1996 p.3 give it as a density the bound
"cannot be much less than", not as the bound itself.

## New value
Martel, Shapiro & Weinberg 1998 (astro-ph/9701099) eq. (4), p.6, credited to Weinberg 1987: a spherical fluctuation recollapses iff
ρ_V ≤ (500/729) δ³ ρ̄, with δ the linear growing-mode overdensity at recombination. MSW insert the growing-mode σ (eq. 57),
and Weinberg 1996 eq. (18) pairs 729/500 with the linear critical overdensity. A z = 4 collapse corresponds to δ_lin = 1.686
(EdS spherical collapse, IMPORTED). δ³ρ̄ stays constant under linear growth, so
ρ_V,max = (500/729)·1.686³·125 ρ_m0 = 411.2 ρ_m0, which is **189 dial units** (411.2 / 2.1746).
DERIVED-UNDER-ASSUMPTION: spherical top-hat; Λ negligible until z = 4; Q, ξ fixed; earliest galaxies at z ≈ 4 (MSW).
Cross-checks already run: an energy-argument coefficient check and an ODE check (agree to 0.2%), plus Planck Ω_m = 0.315 ± 0.007.
The label stays DERIVED-UNDER-ASSUMPTION. No other link, stage or threshold changes. The propagation rule is unchanged.

## Files
atlas/links/s03...lambda-galaxies.yaml (condition, window, notes, assumptions); site/engine/atlas.js (LAMBDA_GALAXY, text,
lambdaLine sample point); site/engine/parity/eval_ref.py (LAMBDA_GALAXY); site/models/atlas.js (version);
atlas/derivations/README.md (d10); site/engine/LOCKED_SITE_ENGINE.md (threshold lines, history note); site/engine/demo.html (legend).
The parity grid spec (run_atlas_parity.py) is NOT changed, so old and new are compared on the same 3150 points.

## Predictions (written before running)
U1a. On the 3150-point grid (Python reference, old vs new), the link l.s07g.lambda-galaxies changes FAIL→PASS at exactly the
     points with 57.5 ≤ Λ < 189, and nowhere else. No other link, table or box value changes.
U1b. Stage changes occur only at those points, only in s07g and its descendants (s07, s08, s09, s11, s12, s13), and only in the
     direction FAIL/BLOCKED → reached.
U1c. Python vs JS parity: 0 mismatches on 3150 points (stages, verdicts, links, tables, box).
U1d. `make validate` passes; pytest passes (87); site builds.
U1e. Of the 10 Pass-33 site sets, only Λ = 99.9075 changes: galaxies FAIL→PASS, with stars, Hoyle, planets and life no longer BLOCKED.

## Results (run 2026-11-16 after the lock; lock committed in build/upgrades git d6528a2 at 22:59:22 −0600)
- U1a HELD: l.s07g.lambda-galaxies goes FAIL→PASS at exactly the 841 grid points with 57.5 ≤ Λ < 189 (Λ = 57.5 and 100 in the grid). No other link changes; 0 table or box diffs.
- U1b FAILED as worded. All stage changes are in s07g and its descendants at those 841 points, but not all of them are FAIL/BLOCKED→reached. 68 are BLOCKED→FAIL: s07 at 24 points, where the star window or Coulomb barrier now shows its own failure, and s08 at 44 points, where pp FAILs at s ≥ 0.5. That is unblocking exposing a downstream failure, not a new cut. Full stage transitions:
  - s07g FAIL→PASS 281
  - s07: BLOCKED→PASS 177, BLOCKED→FAIL 24
  - s08: BLOCKED→PASS 11, BLOCKED→CONTESTED 122, BLOCKED→FAIL 44
  - s09 BLOCKED→PASS 177
  - s11, s12, s13 BLOCKED→OPEN 13 each
- U1c HELD: Python and JS parity, 3150 points, 0 mismatches (stages, verdicts, links, tables, box). The derived-table check also shows 0 mismatches.
- U1d HELD: `python3 -m verify` valid (459 files, 71 warnings, unchanged); gen_stages --check ok; pytest 87 passed; site builds.
- U1e HELD: of the 10 Pass-33 sets, only "Lambda 100" (99.9075) changes. Galaxies go FAIL→PASS, stars, Hoyle and planets go to PASS, and life, minds and carers go to OPEN.


## Amendment (Physicist, 2026-11-18 21:01 CST, America/Regina; after PR #19)

The U1a–U1e results above were computed on the pre-#19 engine (atlas@locked-2026-11-16a on the 3150-point grid; pp-chain FAILed at s ≥ 0.5). Those numbers are not edited.

The same old-vs-new Λ comparison was re-run on 2026-11-18 against main f9b9d9b plus this bound change, using `site/engine/parity/eval_ref.py` and `run_atlas_parity.build_grid()` (post-#19 grid). Grid size is 3151 points (the previous 3150 plus the new G8 point). The comparison set `LAMBDA_GALAXY` to 57.5 vs 189 and left every other engine constant unchanged.

- U1a still HELD: `l.s07g.lambda-galaxies` goes FAIL→PASS at exactly the 841 grid points with 57.5 ≤ Λ < 189 (Λ = 57.5 at 840 points and Λ = 100 at 1 point). No other link changes; 0 table or box diffs.
- Stage transitions at those 841 points:
  - s07g FAIL→PASS 281 (unchanged from the 2026-11-16 run)
  - s07: BLOCKED→PASS 177, BLOCKED→FAIL 24 (unchanged)
  - s08: BLOCKED→PASS 11, BLOCKED→CONTESTED 166 (the 44 BLOCKED→FAIL counts at s ≥ 0.5 in the 2026-11-16 run are now BLOCKED→CONTESTED, because pp-chain never FAILs after PR #19; 122 + 44 = 166)
  - s09 BLOCKED→PASS 177 (unchanged)
  - s11, s12, s13 BLOCKED→OPEN 17 each (was 13 each on the pre-#19 engine)
