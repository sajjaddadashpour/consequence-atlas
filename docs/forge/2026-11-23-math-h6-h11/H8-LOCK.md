# H8 LOCK — Berry's number-variance saturation for zeta zeros (replication)
Locked by Physicist, 2026-11-23 ~21:30 CST. Source: seen/PROPOSALS.md §H8.
Code: **code/h8_berry_locked.py** (modified copy; original byte-identical at code/orig/h8_berry.py). Changes in §5.
A-priori power: code/h8_power_prior.py → out/h8_power_prior.txt (theory only; run at lock time; SEEN).
Run (Mathematician): `<venv6 python> code/h8_berry_locked.py --locked-commit <this commit>` → out/h8_result.json.

## 1. Claims and labels
| # | Claim | Tag |
|---|---|---|
| 1 | Σ²(L) of unfolded zeros follows GUE for L ≪ L_max and saturates for L ≫ L_max, with the Berry formula (primes as periodic orbits, p^r ≤ (E/2π)^τ, τ* = ¼) | IMPORTED (Berry 1988, Nonlinearity 1, 399; full text read: refs/berry175.txt) |
| 2 | L_max = ln(E/2π)/(2π ln 2); saturation mean π⁻²(ln ln(E/2π) + 1.4009) | IMPORTED (**Berry 1988**, not 1985; 1985 is the general semiclassical rigidity paper) |
| 3 | Berry fits better than GUE beyond L_max and better than "Cramér random primes" | CONJECTURE here; already reported by Hess (Zenodo, not peer-reviewed) ⇒ this is a **replication** |
| 4 | PRR link ("primes as a spectrum") | ANALOGY-ONLY (Hilbert–Pólya stays ANALOGY-ONLY) |
Label: **CONJECTURE (replication of literature-SEEN result)**; expected verdict REDUCES-TO-KNOWN or NOT-TESTABLE-YET (power).

## 2. SEEN DATA (declared)
- (a) Hess, Zenodo doi:10.5281/zenodo.23815327 (2026 preprint, **not peer-reviewed**): DataCite abstract — Berry 0.26–1.21 %,
  random primes 5–10 %, saturation 0.34 → 0.56, t ~ 10⁴ … 10²¹. Our run is a replication, not a discovery.
- (b) zeros3/4/5 (same files, same sha256 as the H1 lock) seen via a093cf4 for **gap ratios only** (H1: 0.6000 / 0.5972 / 0.6019).
  Σ²(L) was not computed on them by Physicist or (per PROPOSALS) Mathematician.
- (c) seen/out_instrument_h8.txt: Berry constants at Berry's own point (x = 10¹², E = 2.677×10¹¹; PROPOSALS mislabels it "x=1e11"):
  L_max 5.62, longest wavelength 35.31, eq.(23) 0.4659, eq.(21) 0.4663, largest p^r = 449; small-L Berry vs GUE; GUE-matrix Σ²
  (N = 400, 200 samples) matches exact GUE to ≤ 0.0023 at L = 0.5–3 (first attempt had a wrong radius, refixed — SEEN).
- (d) out/h8_power_prior.txt (Physicist, theory only, no zeros statistic; heights from file headers + median):
| window | L_max | saturation grid | power Berry vs GUE | Berry vs Cramér (median of 20) | GUE regime Berry vs GUE |
|---|---|---|---|---|---|
| zeros3 (~2.7e11) | 5.62 | 11.5–50 (78) | 6.25 | 1.10 | 1.10 |
| zeros4 (~1.4e20) | 10.24 | 20.5–50 (60) | 3.36 | 0.83 | 0.41 |
| zeros5 (~1.4e21) | 10.75 | 22.0–50 (57) | 3.14 | 0.88 | 0.38 |
  (Gaussian SE model SE/V = √(2L/N), N = 10⁴; DERIVED approximation.)
  **Declared up front:** with 10⁴ zeros per window, Berry vs GUE in the saturation regime is only marginally powered (~3σ RMS),
  and **Berry vs Cramér is underpowered (< 1σ) ⇒ that sub-question is expected NOT-TESTABLE-YET.**

## 3. Locked procedure
- Data: local data/zeros{3,4,5}; sha256 verified in code or ABORT; 10 000 zeros each. Unfolding unchanged from orig
  (second-order local Riemann–von Mangoldt about the median height E₀).
- Σ²(L): `sigma2(x, L, ngrid=20000)` (overlapping window starts, unchanged).
- Two regimes, fixed now:
  - **G (GUE regime):** L = 0.25, 0.50, …, 2.00 (8 points; ≥ 5000 non-overlapping windows each).
  - **S (saturation regime):** L from ceil(4·L_max)/2 (i.e. ≥ 2 L_max, rounded up to 0.5) to 50, step 0.5 →
    11.5 / 20.5 / 22.0 starts for zeros3/4/5 (computed from headers, above).
- SE(L): 10 contiguous batches, sigma2(batch, L, 4000), SE = std(ddof=1)/√10.
- Statistic per model M: z_M = √(mean_L ((V_data − V_M)/SE)²), separately in G and S.
  Models: Berry (τ = ¼; τ = 0.15 reported only), GUE, 20 Cramér prime sets (`default_rng([20261124, window_idx])`).
- Power (from the theory curves and the *data* SE): P_BG = z(V_Berry vs V_GUE) in S; P_BC = median z(V_Berry vs V_Cramér) in S.

## 4. Verdict mapping (fixed; implemented)
Instrument gate (Berry constants + small-L Berry ≈ GUE) fails ⇒ **NOT-TESTABLE-YET**.
Decisive windows: **zeros4 and zeros5 only.** zeros3 is a SEEN-height replication, reported, not scored.
Per window: G_consistent = z_B,G ≤ 2 and z_GUE,G ≤ 2; powered = P_BG ≥ 3;
kill = z_B,G > 3 or (powered and (z_B,S > 3 or z_B,S ≥ z_GUE,S));
confirmed = G_consistent and powered and z_B,S ≤ 2 and z_GUE,S ≥ 3.
| Outcome | Verdict |
|---|---|
| kill in zeros4 or zeros5 | **KILLED** |
| confirmed in both | **REDUCES-TO-KNOWN** (Berry 1988 confirmed; replication of Hess) |
| anything else (incl. P_BG < 3 in either window) | **NOT-TESTABLE-YET** (reason recorded) |
Sub-question Berry vs Cramér, per window: P_BC < 3 ⇒ NOT-TESTABLE-YET (expected); else "Berry beats every Cramér set" iff
z_B,S ≤ 2 and min z_Cramér,S ≥ 3. PROPOSALS' relative-RMS D is computed and reported but is **not** scored.
NOT-TESTABLE-AS-DEFINED: not used.

## 5. Code changes vs orig/h8_berry.py (V_gue, V_berry, prime_powers, cramer_primes, sigma2, unfold, instrument: unchanged)
1. orig mixed GUE and saturation regimes in one unweighted relative RMS over L = 0.5–50 ⇒ split into G and S, SE-weighted.
2. orig verdict required the SEEN zeros3 ⇒ removed from scoring.
3. orig reseeded the Cramér rng with the same seed 2026 in every window (identical draws) ⇒ per-window seeds.
4. orig downloaded data if absent ⇒ local files, sha256-checked.
5. No power gate in orig ⇒ added (P_BG ≥ 3). orig's "VOID" ⇒ NOT-TESTABLE-YET.
6. Instrument gate enforced in code (orig only printed it).

## 6. Citation checks
Berry, Proc. R. Soc. A 400, 229 (1985) — Crossref + abstract (general rigidity, L_max ~ ħ^{−(N−1)}).
Berry, Nonlinearity 1, 399 (1988) — full text; L_max formula, x = 10¹², E = 2.677×10¹¹, eq.(21)/(23) constants, τ* range 0.028 ≪ τ* ≪ 1: all match.
Bogomolny & Keating, Nonlinearity 9, 911 (1996) — Crossref OK. Hess Zenodo — DataCite record OK (preprint).
Odlyzko tables — sha256 as H1 lock.
