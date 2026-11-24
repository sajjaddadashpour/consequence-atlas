# SCORE — CH-BBN-NSTAR-1 (base lock f30de3e + A1 f2d3690)

Scored 2026-11-24 (America/Regina) by Chemist. Scoring follows the lock and A1 exactly. Nothing was relabelled.

Code: PRyMordial 725d8a8, PRIMAT rates, full network, τ_n = 878.4 s, Ω_b h² = 0.02230, ΔN_eff = 0. The code returned N_eff = 3.04439.

Patch (nstar_patch.diff, sha256 04c1029b…febc9) and runner were committed in d3e2b4a, before any model run.

## Control (A1.3): PASS, so scoring is allowed
| | Ours (central inputs) | Published PRyMordial Fig. 3, PRIMAT (MC mean) | Check | PDG 2025 2σ band | Check |
|---|---|---|---|---|---|
| Yp (YPBBN) | 0.246887 | 0.24689(11) | ΔYp = 3×10⁻⁶ ≤ 5×10⁻⁴ ✓ | 0.239–0.251 | ✓ |
| D/H ×10⁵ | 2.45449 | 2.459(26) | −0.18% (limit 1%) ✓ | 2.450–2.566 | ✓ (only 0.004 above the lower edge) |

YPCMB in the control = 0.245561.

Patch sanity test: with identity hooks, Yp and D/H match the pristine code exactly (relative difference 0.0, limit ≤ 10⁻⁶). ✓

## Step zero (A1.2)
Cut 2 passes at every point. Its largest value is τ_γ·H = 0.034, against a limit of 0.1.

Cut 1 fails at all τ_γ = 100 s points with ΔE = 10 or 30 keV. The minimum Γ_up/H, always found at T = 1 MeV, is:
- 1.48 for ΔE = 10 keV, g*/g = 1
- 2.96 for ΔE = 10 keV, g*/g = 2
- 0.489 for ΔE = 30 keV, g*/g = 1
- 0.977 for ΔE = 30 keV, g*/g = 2

That leaves 16 points scorable and 8 not scorable (NOT-TESTABLE-YET, non-equilibrium).

## Grid (Variant A scored; Variant B for D/H sensitivity only)
Yp is YPBBN.

| ΔE | g*/g | τ_e | A: Yp | A: D/H×10⁵ | B: Yp | B: D/H×10⁵ | τ_γ = 4 s | τ_γ = 100 s |
|---|---|---|---|---|---|---|---|---|
| 0.04 eV | 1 | 887 s | 0.2487 | 2.467 | 0.2434 | 3.306 | ALLOWED | ALLOWED |
| 0.04 eV | 1 | ∞ | 0.5751 | 6.426 | 0.5681 | 10.687 | EXCLUDED | EXCLUDED |
| 0.04 eV | 2 | 887 s | 0.2493 | 2.471 | 0.2402 | 4.445 | ALLOWED | ALLOWED |
| 0.04 eV | 2 | ∞ | 0.8146 | 30.18 | 0.7953 | 120.5 | EXCLUDED | EXCLUDED |
| 10 keV | 1 | 887 s | 0.2486 | 2.471 | 0.2440 | 3.167 | ALLOWED | not scorable |
| 10 keV | 1 | ∞ | 0.5682 | 6.232 | 0.5617 | 9.469 | EXCLUDED | not scorable |
| 10 keV | 2 | 887 s | 0.2492 | 2.474 | 0.2412 | 4.076 | ALLOWED | not scorable |
| 10 keV | 2 | ∞ | 0.8053 | 26.92 | 0.7883 | 85.02 | EXCLUDED | not scorable |
| 30 keV | 1 | 887 s | 0.2486 | 2.468 | 0.2449 | 2.955 | ALLOWED | not scorable |
| 30 keV | 1 | ∞ | 0.5547 | 5.895 | 0.5491 | 7.834 | EXCLUDED | not scorable |
| 30 keV | 2 | 887 s | 0.2492 | 2.470 | 0.2427 | 3.550 | ALLOWED | not scorable |
| 30 keV | 2 | ∞ | 0.7866 | 22.03 | 0.7729 | 48.12 | EXCLUDED | not scorable |

Using YPCMB instead of YPBBN gives the same status at every point.

## Verdict per locked rules: **MIXED (A1.1), split by region**
- **EXCLUDED, KILLED region.** Every scorable point with τ_e = ∞, at every scorable ΔE, g*/g and τ_γ (8 points). Yp ranges from 0.555 to 0.815.
- **ALLOWED, SURVIVED region.** Every scorable point with τ_e = τ_beam = 887 s (8 points). Yp ranges from 0.2486 to 0.2493, and D/H from 2.467 to 2.474 ×10⁻⁵.
- **NOT-TESTABLE-YET.** All τ_γ = 100 s points at ΔE = 10 and 30 keV (8 points), which fail Cut 1.
- **REDUCES-TO-KNOWN: not earned.** The minimal point (g*/g = 1, τ_e = ∞, 0.04 eV) gives Yp = 0.5751, outside the locked window [0.43, 0.52]. The g*/g = 1 τ_e = ∞ points therefore read **"KILLED, magnitude disagrees with Silagadze"**: ours is 0.555–0.575, his stated value is 0.46–0.49.
- Per A1.1, the SURVIVED region contradicts Silagadze §6, so **Physicist must re-check it before any card is written.**

## Problem found after scoring (declared; does not change the scored verdict)
I believe the SURVIVED region is an artifact of an error in my own base-lock mapping (§2), not physics. CONJECTURE, not yet run.

- **What the mapping did.** It scaled the n→p rate by f_n + (1−f_n)·τ_g/τ_e, so excited neutrons convert to protons at almost the ground-state rate when τ_e = 887 s. But it left p→n unchanged, so protons only ever feed the ground state.
- **Why that is inconsistent.** If n* has weak couplings at all (finite τ_e), microscopic reversibility requires p + e⁻ → n* + ν, with the rate fixed by detailed balance. Without that reverse channel, the code's equilibrium is n_tot/p = λ_pn/λ_np,eff, not e^{−Q/T}(1 + (g*/g)e^{−ΔE/T}). The n* level is then effectively never populated, and the result returns to the SM value.
- **Where it holds.** The mapping is consistent only for τ_e = ∞.
- **What a correct mapping gives.** With the reverse rate, the expectation is that the τ_e = 887 s points overproduce helium as well, since n* then acts like an extra neutron spin state.
- **Proposed fix.** A2, as a new lock with all of this run declared seen: p→n multiplier = 1 + (τ_g/τ_e)(g*/g)e^{−ΔE/T}.

## Other observations (unscored)
- From Silagadze's own stated inputs, (n/p)_f ≈ 0.198·(1+1) and S_eff = 0.89–0.95, the formula Yp = 2x/(1+x) gives 0.52–0.55, not the 0.46–0.49 he quotes. My arithmetic; I have not re-derived his calculation.
- Variant B (only ground-state neutrons react) raises D/H strongly at every point, by 2.96 up to 120 ×10⁻⁵. At the τ_e = 887 points that would exclude them via D/H, but Variant B is sensitivity-only by lock.
- The control D/H passes the PDG band by only 0.004 ×10⁻⁵, as predicted in A1.5.
