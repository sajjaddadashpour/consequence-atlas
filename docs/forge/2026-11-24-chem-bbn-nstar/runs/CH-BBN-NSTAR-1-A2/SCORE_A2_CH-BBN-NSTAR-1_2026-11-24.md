# SCORE_A2: CH-BBN-NSTAR-1 (base f30de3e + A1 f2d3690 + A2 89eece1 + note e95528d)

Scored 2026-11-24 (America/Regina) by Chemist.

**Rules applied.** Locked rules as written: A1.1 aggregation, A1.2 thermal cuts (step zero unchanged from run 1), PDG 2025 2σ bands (Yp 0.239–0.251; D/H 2.450–2.566 ×10⁻⁵), A1.3 published-control tolerance, A2 gates (G1 and G1b binding), and Yp = YPBBN. Variant A is scored; Variant B is sensitivity only.

**Code and runs.** Code: PRyMordial 725d8a8 with the A2 patch (45f325e). There were 24 runs: 12 configurations × Variants A and B. Each run took about 8 s.

## Control
The control was already seen (A2.1). This SM run used the A2-patched code with hooks None.

| | Value | Requirement | Pass |
|---|---|---|---|
| Yp | 0.246887 | within 0.0005 of published 0.24689 | ✓ |
| Yp | 0.246887 | inside PDG band | ✓ |
| D/H | 2.45449 ×10⁻⁵ | within 1% of published 2.459 (−0.18%) | ✓ |
| D/H | 2.45449 ×10⁻⁵ | inside PDG band | ✓ |

The run is bit-identical to the run-1 pristine control.

## Gates (A2.3)
- **G1** passes at all 24 runs. Max |dev| = 2.22×10⁻³ at every point (limit 1%). This is the code's own λ_pn/λ_np residual from e^{−Q/T}, the same value as in the SM.
- **G1b** passes at all 24 runs. Dev = 0.0025 (limit 1%).
- **G2_lit** (diagnostic, not binding): +0.6% to +40% across points. The SM alone ranges from +0.8% to +27%.

## ⚠ DRIFT FLAG (NOTE e95528d): raised at every configuration
Every configuration that passes G1 shows |G2_sm| > 3%. The maximum is always at T = 1.00 MeV and shrinks to < 0.4% near 3 MeV.

| Configuration | G2_sm range |
|---|---|
| τ_e = 887 s, g*/g = 1 | −2.9% to −3.2% |
| τ_e = 887 s, g*/g = 2 | −5.0% to −5.4% |
| τ_e = ∞, g*/g = 1 | +6.8% to +7.1% |
| τ_e = ∞, g*/g = 2 | +10.2% to +10.7% |

At τ_e = 887 s, g*/g = 1, the 30 keV point peaks at −2.86%, which is under the 3% line. The 0.04 eV and 10 keV points exceed it.

Diagnosis (CONJECTURE, unscored, post-hoc): this looks like differential weak-freeze-out lag, not extra action by the patch.
- **The τ_e = ∞ points run the same code path as run 1.** Their p→n multiplier is exactly 1.0, and they are bit-identical to run 1. Their drift therefore cannot come from the A2 change.
- **The sign follows the total weak relaxation rate Γ = λ_np·m_f + λ_pn·m_b.** For τ_e = ∞, Γ is slower than in the SM, so there is more lag and the drift is positive. For τ_e = 887 s, Γ is faster, so there is less lag and the drift is negative.
- **A first-order lag model fits the shape.** The model is δ ∝ 1/Γ, scaled from the SM's own lag. Its correlation with G2_sm over 1–3 MeV is ≥ 0.99 at all six configurations checked.
- **It fits the size only partly.** For τ_e = 887 s it reproduces the size to within about 15% (for example, predicted −3.7% vs observed −3.2%). For τ_e = ∞ it overpredicts by about ×2, where δ is large and first order breaks down.
- Physicist should judge whether this explanation is enough. **The flag does not change any verdict rule** (NOTE e95528d).

## Regression (A2.4)
All 12 τ_e = ∞ runs (Variants A and B) reproduce run 1 exactly. The relative difference is 0.0 in both Yp and D/H, against a limit of 10⁻⁶. ✓

## Grid
Yp is YPBBN; D/H is ×10⁻⁵. Statuses are given for τ_γ = 4 s / τ_γ = 100 s.

| ΔE | g*/g | τ_e | A Yp | A D/H | B Yp | B D/H | Status (4 s / 100 s) |
|---|---|---|---|---|---|---|---|
| 0.04 eV | 1 | 887 s | 0.3966 | 3.549 | 0.3879 | 5.015 | EXCLUDED / EXCLUDED |
| 0.04 eV | 1 | ∞ | 0.5751 | 6.426 | 0.5681 | 10.69 | EXCLUDED / EXCLUDED |
| 0.04 eV | 2 | 887 s | 0.4993 | 4.814 | 0.4792 | 10.31 | EXCLUDED / EXCLUDED |
| 0.04 eV | 2 | ∞ | 0.8146 | 30.18 | 0.7953 | 120.5 | EXCLUDED / EXCLUDED |
| 10 keV | 1 | 887 s | 0.3951 | 3.532 | 0.3875 | 4.742 | EXCLUDED / not scorable |
| 10 keV | 1 | ∞ | 0.5682 | 6.232 | 0.5617 | 9.469 | EXCLUDED / not scorable |
| 10 keV | 2 | 887 s | 0.4971 | 4.779 | 0.4794 | 9.152 | EXCLUDED / not scorable |
| 10 keV | 2 | ∞ | 0.8053 | 26.92 | 0.7883 | 85.02 | EXCLUDED / not scorable |
| 30 keV | 1 | 887 s | 0.3923 | 3.507 | 0.3863 | 4.323 | EXCLUDED / not scorable |
| 30 keV | 1 | ∞ | 0.5547 | 5.895 | 0.5491 | 7.834 | EXCLUDED / not scorable |
| 30 keV | 2 | 887 s | 0.4928 | 4.706 | 0.4789 | 7.543 | EXCLUDED / not scorable |
| 30 keV | 2 | ∞ | 0.7866 | 22.03 | 0.7729 | 48.12 | EXCLUDED / not scorable |

YPCMB gives the same status at every scorable point.

## Verdict
- **KILLED (equilibrium realization).** All 16 scorable points are EXCLUDED, and each fails both bands: Yp 0.392–0.815, D/H 3.51–30.2 ×10⁻⁵.
- **NOT-TESTABLE-YET.** The 8 points with τ_γ = 100 s at ΔE = 10 and 30 keV fail thermal Cut 1 (unchanged from run 1).
- **REDUCES-TO-KNOWN: not earned.** The minimal point (g*/g = 1, τ_e = ∞, 0.04 eV) gives Yp = 0.5751, outside the window [0.43, 0.52]. So the g*/g = 1 points read **KILLED, magnitude disagrees with Silagadze**: ours is 0.555–0.575 at τ_e = ∞ and 0.392–0.397 at τ_e = 887 s, against his 0.46–0.49.
- **Run-1 record.** The run-1 τ_e = 887 s SURVIVED half is recorded as a **lock artifact** (detailed-balance violation in the base §2 mapping) and is superseded by this score. No card comes from it.
- **Scope.** This kills only the thermally coupled realization mapped in the lock. It does not cover n* without photon coupling or with dark-sector de-excitation. Koch & Hummel do not specify either.

## Predictions vs outcome
- **Physicist (~0.45 at g* = g, 887 s half KILLED).** The KILLED call is right. The number is off: 0.392–0.397 at τ_e = 887 s and 0.555–0.575 at τ_e = ∞.
- **Chemist (finite τ_e between 0.45 and 0.575 at g*/g = 1, higher at g*/g = 2, all KILLED).** KILLED is right, and g*/g = 2 is higher (0.493–0.499). The g*/g = 1 range **missed**: it came out 0.392–0.397, below 0.45. The decay-shelter explanation for τ_e = ∞ > τ_e = 887 s is consistent with the ordering, but it was not tested directly.
- **Chemist's other expectations.** D/H well above the band: ✓. G1 and G1b pass: ✓. Bit-identical regression: ✓. My expectation of clean gates did not anticipate the G2_sm drift flag.
