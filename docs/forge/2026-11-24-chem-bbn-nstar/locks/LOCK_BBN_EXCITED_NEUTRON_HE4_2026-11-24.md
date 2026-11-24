# LOCK — Does the Koch–Hummel excited-neutron model overproduce primordial He-4?

- Lock ID: CH-BBN-NSTAR-1
- Author: Chemist (TOE Consequences Atlas). Assigned by Physicist in the "Theory of everything" room, 2026-11-24.
- Written: 2026-11-24, before any BBN calculation (America/Regina, UTC-6).
- Status: **PRE-RUN.** No BBN output has been produced or seen. PRyMordial has been cloned and **imported only**; no solver, class instance or rate recomputation was executed.
- Labels: ESTABLISHED (textbook or measured), MAINSTREAM (standard practice), ASSUMED (my choice, locked here), CONJECTURE (my expectation).

---

## 0. What is being tested

Koch & Hummel (2024) propose that free neutrons fresh from nuclear reactions can sit in long-lived **excited states** n* that beta-decay more slowly than the ground state n, then drop to n by photon emission with a cumulative time τ_γ between beam and bottle timescales. This would make beam lifetimes longer than bottle lifetimes.

Silagadze (arXiv:2611.29328, §6) argues that in the early universe, n* is held in **thermal equilibrium** with n by the photon bath. If n* exists, the total neutron pool at weak freeze-out is boosted by a factor (1 + (g*/g) e^{−ΔE/T}), and the pool's effective decay rate is reduced. That would overproduce He-4.

This lock checks that claim with a full open BBN network rather than the instantaneous-freeze-out estimate, and with a standard-model control run in the same code.

---

## 1. Measured ranges (locked; values only from sources I opened)

### 1a. He-4 mass fraction Yp. PRIMARY channel.
- **Scoring source:** Particle Data Group, Review 24 "Big-Bang Nucleosynthesis", B.D. Fields, P. Molaro, S. Sarkar, revised August 2025 (RPP 2025 PDF dated 1 Dec 2025). URL: https://pdg.lbl.gov/2025/reviews/rpp2025-rev-bbang-nucleosynthesis.pdf. Eq. (24.3): **Yp = 0.245 ± 0.003** (1σ). ESTABLISHED.
- **Locked 2σ band:** **0.239 ≤ Yp ≤ 0.251**.
- **Cross-check, not used for scoring:** Aver, E. et al., "Improving helium abundance determinations with Leo P as a case study", JCAP 2021(03), 027, arXiv:2010.04180, DOI 10.1088/1475-7516/2021/03/027 (title and DOI checked on Crossref). Abstract: **Yp = 0.2453 ± 0.0034**, giving a 2σ band of [0.2385, 0.2521]. If Aver and PDG give different verdicts, both are reported and the PDG verdict stands.

### 1b. Deuterium D/H. SECOND, independent channel.
- **Scoring source:** the same PDG 2025 review, Eq. (24.2): **D/H|p = (25.08 ± 0.29) × 10⁻⁶**. This is the weighted mean of 12 systems with the error scaled by S = 1.08. ESTABLISHED.
- **Locked 2σ band:** **2.450 × 10⁻⁵ ≤ D/H ≤ 2.566 × 10⁻⁵**.
- **Cross-check, not used for scoring:** Cooke, Pettini & Steidel, "One percent determination of the primordial deuterium abundance", ApJ 855, 102 (2018), arXiv:1710.11129, DOI 10.3847/1538-4357/aaab53 (checked on Crossref). Abstract: **(D/H)_P = (2.527 ± 0.030) × 10⁻⁵**, giving a 2σ band of [2.467, 2.587] × 10⁻⁵.

### 1c. Baryon density
- **Ω_b h² = 0.02230** (PRyMordial default). The PDG 2025 review (§24.4) quotes this as the Planck TT,TE,EE+lowE+lensing value **without BBN theory**: 0.02230 ± 0.00021, equivalent to η₁₀ = 6.104 ± 0.058. ESTABLISHED. I chose the no-BBN value on purpose, so that the baryon density is not itself tuned by a BBN prior (avoids circularity). ASSUMED.
- For reference only, not used: the PDG gives (Ω_b h²)_CMB = 0.02237 ± 0.00015 (Eq. 24.7). The Planck 2018 VI abstract (arXiv:1807.06209) gives Ω_b h² = 0.0224 ± 0.0001.

---

## 2. Excited-neutron model parameters, from the ORIGINAL paper

**Citation (verified):** B. Koch and F. Hummel, "Exciting hint toward the solution of the neutron lifetime puzzle", *Phys. Rev. D* **110**, 073004 (2024). arXiv:2403.00914 (v4, 20 Sep 2024, read in full). DOI 10.1103/PhysRevD.110.073004 (Crossref: Koch, Hummel; PRD vol 110, art. 073004; issued 2024-10-10).

What Koch & Hummel actually give (quotes are from v4):

| Quantity | KH value / statement | Where |
|---|---|---|
| Beam − bottle gap | Δτ = τ_beam − τ_bottle = **(8.6 ± 2.2) s** | Eq. (2) |
| Rate equations | ṅ_e = −n_e/τ_γ − n_e/τ_e ; ṅ_g = +n_e/τ_γ − n_g/τ_g | Eq. (4) |
| Timescale hierarchy | t_beam (≈ 2×10⁻² s) ≪ τ_γ ≪ t_bottle < τ_g < τ_e, with t_bottle > 300 s | Eq. (7), §II |
| Example τ_γ | "we arbitrarily chose τ_γ = 4 s" | Fig. 1 |
| Bottle = ground state | τ_bottle = τ_g | Eq. (9) |
| Excited beta lifetime | τ_e ≥ τ_beam (condition b); Δτ_e ≡ τ_e − τ_g ≥ Δτ | Eq. (8), (10) |
| Initial excited fraction (lab) | n_e(0)/n_g(0) = Δτ/(Δτ_e − Δτ) | Eq. (10) |
| Energy gap, upper bounds | ΔE_WB < 3×10⁴ eV (qBounce, P = 1/3, 𝓔 = 10⁻⁵); ΔE_KS < 5×10⁴ eV; ΔE_IE < 3×10⁶ eV | Eqs. (34)–(36) |
| Toy-model example gap | about 40 meV for a 1 Å extent | §III.1 |
| Toy-model cascade | ΔE ≈ 1 MeV of nuclear excitation, shared across nodes; E1/M1/E2/M2 cascade formulas | Eqs. (26)–(29), Fig. 3 |
| Bound neutrons | n* is not populated inside nuclei | condition (f) |
| KH on BBN | "the early universe during Big Bang Nucleosynthesis ... [is] probably insensitive to the excited states due to the immense red shift" | §IV.4 |

**What KH do NOT give.** They give no spin J* or degeneracy g* for n*, no single ΔE value, and no single τ_γ value. The model is a parameter space, not a point. The g*/g ≥ 1 argument and the τ_γ < 139 s bound (from UCNτ) come from **Silagadze, not KH**. I keep them out of the KH parameter list and enter g* below as an explicit grid.

**Mapping into BBN. ASSUMED, locked.** This is the equilibrium realization that Silagadze analyses:
- Two neutron levels: n (g = 2) and n* (g*). Above ~T_f, radiative exchange keeps n*/n = (g*/g) e^{−ΔE/T}. Ground-state fraction of the total neutron pool: f_n(T) = [1 + (g*/g) e^{−ΔE/T}]⁻¹.
- **Weak rates, patched.** n→p rate (PRyMordial `nTOp_frwrd`): λ_np,eff(T) = λ_np(T)·[f_n(T) + (1 − f_n(T))·τ_g/τ_e]. The p→n rate (`nTOp_bkwrd`) is unchanged, because protons convert into ground-state neutrons and those re-equilibrate. Initial condition: Yn_i = λ_pn/(λ_pn + λ_np,eff), which is the detailed-balance total-pool value. The same wrapper is applied in all three eras that the code defines (HT, MT, LT; `PRyM_main.py` lines ~339, 466, 531).
- **Nuclear network.** Variant **A**, PRIMARY: n* takes part in nuclear reactions exactly like n, so only the weak rates change. Variant **B**, sensitivity, scored only for D/H: every nuclear rate with a neutron in the initial state is multiplied by f_n(T). If I cannot patch Variant B cleanly, I will report it as not done. Variant A is still scored.
- **Energy density.** n* is a non-relativistic baryon level, so it adds no ΔN_eff. ASSUMED (ESTABLISHED in magnitude).

**Locked grid:**
- ΔE ∈ {0.04 eV (KH's own toy example), 10 keV, 30 keV (KH qBounce bound, Eq. 34)}
- g*/g ∈ {1 (the minimum for any single excited level, since g* = 2J*+1 ≥ 2), 2 (J* = 3/2)}
- τ_e ∈ {τ_beam = 887.0 s (KH's extremal case b; = 878.4 + 8.6), ∞ (β-stable n*, as Silagadze assumes)}
- τ_γ ∈ {4 s (KH's Fig. 1), 100 s}. This only enters the equilibrium validity check below.
- That gives 3 × 2 × 2 × 2 = 24 points.

**Stage-0 equilibrium validity check.** Locked rule; this is arithmetic, not BBN. For each point, compute Γ_up(T) = (g*/g)·n̄(ΔE,T)/τ_γ, with n̄ = 1/(e^{ΔE/T} − 1). Compare it with PRyMordial's own H(T) on 0.07 MeV ≤ T ≤ 1 MeV. A point is **SCORED** only if Γ_up/H ≥ 10 over that entire range. Otherwise it is **NOT-SCORED (non-equilibrium corner)**. I am not building a three-species non-equilibrium solver in this lock.
- Pre-run note, CONJECTURE (back-of-envelope only, not a run): Γ/H ≈ 2.6/(ΔE[MeV]·τ_γ[s]·T[MeV]) for T ≫ ΔE. At ΔE = 30 keV and τ_γ = 100 s this is about 1 near T ≈ 0.8 MeV. So Silagadze's "entire parameter space" claim may not hold in that corner, and Stage 0 decides it.

---

## 3. Code setup (locked)

- **Code:** PRyMordial. Burns, Tait & Valli, "PRyMordial: the first three minutes, within and beyond the standard model", *Eur. Phys. J. C* **84**, 86 (2024), DOI 10.1140/epjc/s10052-024-12442-0, arXiv:2307.07061 (title confirmed on arXiv and Crossref). License GPLv3.
- **Repo / commit:** https://github.com/vallima/PRyMordial at **725d8a8db3ad5ea2630580d825c9d0d69ed76533** (HEAD, "Merge pull request #3 from tim-launders/main", 2026-05-08 06:07 America/Regina). Clone: /workspace/chemist/bbn-code/PRyMordial.
- **Environment:** venv /workspace/chemist/bbn-code/venv; Python 3.13.5, numpy 2.5.5, scipy 1.18.1, numba 0.68.1, numdifftools 0.11.2. No Julia (`julia_flag = False`), no vegas.
- **Build check done:** `import PRyM.PRyM_init, PRyM.PRyM_main` succeeds. Defaults read back: tau_n = 878.4 s, Omegabh2 = 0.0223, DeltaNeff = 0.0, rates_dir = key_primat_rates/.
- **Locked flags:** default PRIMAT nuclear-rate compilation (`nacreii_flag = False`); full network (`smallnet_flag = False`); `tau_n_flag = True` (weak rates normalized to τ_n); `nTOpBorn_flag = False`; `compute_nTOp_thermal_flag = False` (stored thermal corrections); `NP_nTOp_flag = False` (my patch is a wrapper, not the built-in constant shift); `NP_thermo_flag = NP_nu_flag = NP_e_flag = NP_nuclear_flag = False`; T_start = 10 MeV, T_end = 1 keV (defaults).
- **Neutron lifetime:** τ_g = τ_bottle = **878.4 s**. This is the PDG value, and the PDG 2025 BBN review quotes τ_n = 878.4 ± 0.5 s; it is also the code default. The excited lifetime τ_e is set by the grid above.
- **N_eff:** Standard Model, DeltaNeff = 0. PRyMordial computes N_eff itself and I report the value it prints.
- **SM control:** same code, same flags, same Ω_b h² and τ_n, with no patch. It gives Yp_SM and D/H_SM.
- **Patch sanity test, required before any model point.** With f_n ≡ 1, the patched code must reproduce the SM control to a relative difference ≤ 10⁻⁶ in both Yp and D/H. If it fails, the result is NOT-TESTABLE-YET (code cannot implement the model).
- The patch is committed in a separate file or diff before the model runs. It contains no tuning knobs beyond the grid in §2.

---

## 4. Verdict rules (every outcome)

Per channel c ∈ {Yp, D/H}: the channel is **VALID** only if the SM control for c lies inside the locked 2σ band for c. An invalid channel is not used.

Per scored grid point (Variant A): the point is **EXCLUDED** if, in at least one VALID channel, the model value lies outside the band. It is **ALLOWED** if the model value is inside the band in all VALID channels.

Overall verdict for the KH equilibrium realization:
1. **NOT-TESTABLE-YET**, if any of these holds: (a) both channels are invalid because the SM control misses both bands (Yp-invalid alone is enough if Yp, the primary channel, is the claim under test, so if Yp is invalid the verdict is NOT-TESTABLE-YET even when D/H is valid; D/H then becomes a reported side result only); (b) the patch sanity test fails or the code cannot carry the wrapper; (c) zero grid points pass Stage 0.
2. **KILLED**, if Yp is VALID and **every** scored point is EXCLUDED. If some points were NOT-SCORED, the verdict reads "KILLED (equilibrium region); non-equilibrium corner NOT-TESTABLE-YET", and the unscored points are listed.
3. **SURVIVED**, if at least one scored point is ALLOWED. That point is reported. This would contradict Silagadze §6 and must be re-checked by Physicist before any card is written.
4. **REDUCES-TO-KNOWN**, an overlay on KILLED. Silagadze has already published the KILLED answer (§6: Yp ≈ 0.46–0.49 for g*/g = 1 and ≳ 0.62 for g*/g ≥ 2, against Yp_obs = 0.245 ± 0.003). If our run is KILLED **and** our Variant A, τ_e = ∞, ΔE = 0.04 eV, g*/g = 1 value of Yp lies in [0.43, 0.52], the verdict is **KILLED — REDUCES-TO-KNOWN** (independent confirmation, no new information). That window is his range widened by ±0.03 for the network-versus-instant-freeze-out difference, ASSUMED. If KILLED but that value lies outside [0.43, 0.52], the verdict is "KILLED, magnitude disagrees with Silagadze", and both numbers are reported.
5. **Cross-check sources** (Aver 2021, Cooke 2018) do not change the verdict. Any disagreement they produce is reported.
6. **Variant B** is reported as sensitivity only and cannot flip the verdict.
7. **Scope note.** A KILLED verdict kills only the **equilibrium realization** mapped in §2. It does not kill a variant where n* does not couple to thermal photons, or one with a dark-sector de-excitation. KH do not specify either.

---

## 5. Prediction, written before any run (CONJECTURE)

- SM control: Yp_SM ≈ 0.247 (inside the band). D/H_SM in the range (2.40–2.55) × 10⁻⁵. I am **not confident** D/H_SM lands inside the PDG band with PRIMAT rates. If it misses, D/H is invalid and only Yp scores.
- Model, scored points with ΔE ≪ T_f (0.04 eV, 10 keV), τ_e = ∞:
  - g*/g = 1: Yp ≈ 0.40–0.50.
  - g*/g = 2: Yp ≥ 0.50.
  - Reasoning: freeze-out n/p is roughly doubled, then roughly halved decay. Yp = 2x/(1+x).
- τ_e = τ_beam changes Yp by < 0.01 compared with τ_e = ∞.
- ΔE = 30 keV, where scored, still gives Yp ≥ 0.35.
- D/H rises in the model, because a higher neutron excess leaves more D.
- Expected overall: **KILLED — REDUCES-TO-KNOWN**, possibly with an unscored non-equilibrium corner at ΔE = 30 keV, τ_γ = 100 s.
- Honesty note: I read Silagadze's §6 numbers before writing this prediction, so it is not blind. Its value is only in fixing the scoring window in advance.

---

## 6. Seen data (declared)

Opened before this lock:
- Silagadze, "Neutron lifetime puzzle and Dicke coherence in spontaneous decays", arXiv:2611.29328. **Full text read, not only the abstract**, including §6 BBN estimates: S_std ≈ 0.815, S_eff ≈ 0.89–0.95, Yp ≈ 0.46–0.49 (g* = g), Yp ≳ 0.62 (g* ≥ 4), τ_γ < 139 s from UCNτ, ΔE ≤ 30 keV.
- Koch & Hummel, arXiv:2403.00914 v4, full text.
- PDG 2025 BBN review PDF (Yp, D/H, τ_n, Ω_b h², η values quoted above).
- arXiv abstracts: Aver et al. 2010.04180; Cooke et al. 1710.11129; Planck 2018 VI 1807.06209; PRyMordial 2307.07061 (title only).
- Crossref metadata for the DOIs above.
- PRyMordial source: README, `PRyM_init.py` flag block and defaults, the `PRyM_main.py` weak-rate wrapper locations.

**NOT opened:**
- `PRyM_Yp_DH_cosmoMC_2023.dat` (precomputed SM Yp and D/H tables). It stays unopened until after the SM control run.
- No PRyMordial demo notebook outputs.
- No BBN output of any kind.

---

## 7. Run plan (after this lock is committed)

1. Stage 0 equilibrium check.
2. SM control.
3. Patch sanity test.
4. 24-point Variant A grid.
5. Variant B for D/H.
6. Score per §4.
7. Log raw outputs to /workspace/chemist/bbn-code/runs/CH-BBN-NSTAR-1/ with the code commit and the patch hash.

Any deviation from this lock gets a dated amendment **before** the affected step is run.
