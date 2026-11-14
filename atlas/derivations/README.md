# Derivations

In-repo computations cited by atlas links as `derive.*` sources. They are not publications.
Rerun: `pip install numpy scipy && python3 derive.py` (writes `derived.json`; values below are from that file). `derived.json` has no adopted schema yet; a proposal is in `docs/proposals/derived.schema.json`.

Inputs that come from papers are IMPORTED and cited on the link that uses them; only the arithmetic is DERIVED here.

## d1
Orbit stability vs space dimensions n. Effective potential L²/2r² + φ_n(r) with φ = r (n=1), ln r (n=2), −r^(2−n) (n≥3).
Result: stable circular orbit for n = 1, 2, 3 (a minimum); n = 4 no extremum; n = 5 only a maximum (r ≈ 3). (n = 1 has no sideways direction, so the link marks it FAIL anyway.)

## d2
Lowest radial eigenvalue of a hydrogen-like operator as the inner cutoff shrinks (0.1 → 0.01):
n = 3: −0.218 → −0.2500 (converges to −1/4); n = 4: stays ≈ +0.004 (no bound state at the critical 1/r² pull); n = 5: −4.0 → −960,116 (no ground state; collapse).

## d3
Atomic size ∝ 1/(α β) and Rydberg ∝ α² β at fixed proton mass; v/c = α in the ground state.

## d5
Periodic-table end = min(relativistic limit, fission limit). Ours: Z_Dirac = 137, Z_cr ≈ 169, fission ≈ 134, so L = 134.
Largest α that keeps Fe: 0.0308; O: 0.0942; C: 0.1247. Liquid-drop coefficients (17.8, 0.711 MeV) are scaled naively with α and s: an assumption.

## d6
Stellar mass window. With β fixed at ours, the window closes at α > 0.233 (Barnes 2012 limit), 0.330 (Tegmark 1998), 0.503 (Adams 2019), and the Coulomb-barrier condition α²β ≥ 2.62e-12 needs α > 6.94e-5.

## d7
Landauer: k_B T ln 2 at 300 K = 0.0179 eV per erased bit.

## d9
Hydrogen stability: m_n − m_p = Q + E·(α/α₀), Q = 2.52 ± 0.29 MeV, E = −1.00 ± 0.16 MeV (Borsanyi et al. 2015). Stable iff m_n − m_p > m_e.
Critical α at β = ours: central 2.01 × ours (0.01466), 1σ band 1.48–2.73 × ours. Assumptions are listed on the link.

## d10
Cosmological-constant galaxy bound in dial units. MSW 1998: earliest galaxies (z ≈ 4) need ρ_Λ < (1+z)³ ρ_m0 ≈ 125 ρ_m0.
Planck 2018: Ω_m = 0.315, so Ω_Λ ≈ 0.685 and ρ_Λ,ours = 2.17 ρ_m0. Bound: 125 / 2.17 ≈ 57.5 × ours. Assumptions are listed on the link.

## us27
Universe Starter v3, lattice-gas arrow-of-time toy, 5 seeds (log Pass 27). Low-entropy start: entropy 0.84 → 3.26 of a maximum 3.74, and the backward run recovers the start exactly. Equilibrium start: stays at 1.965, its maximum. With 2% noise: reaches 3.74 and the backward run misses 21.6% of sites. A mechanism demonstration in a toy, not a prediction about our universe.

## d11
Lifetime of a flat universe with matter and a negative cosmological constant. The Friedmann equation gives a(t) ∝ sin^(2/3)((3/2) H_L t) with H_L = sqrt(8πG|ρ_Λ|/3), so recollapse comes at t = (2π/3)/H_L, whatever the matter density.
Our numbers (Planck 2018): H0 = 67.4 km/s/Mpc, so 1/H0 = 14.51 Gyr. Ω_Λ = 0.685 gives 1/H_L,ours = 14.51/√0.685 = 17.53 Gyr. For a dial value x < 0: t = 2.094 × 17.53 / √|x| = 36.7 Gyr / √|x|.
Benchmarks (assumptions, not results): t ≥ 13.787 Gyr (our observers, Planck 2018) gives x ≥ −7.09; t ≥ 5 Gyr gives x ≥ −53.9.
