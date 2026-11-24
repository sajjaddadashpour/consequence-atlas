# AMENDMENT A1 to CH-BBN-NSTAR-1 (pre-run)

- Amends: LOCK_BBN_EXCITED_NEUTRON_HE4_2026-11-24.md, commit f30de3edabf3987b3d90c8eac28924ec189ac470, sha256 691a788a8c9ebdf6793a04842219299771127e9d358cb9bc83dffff8f2168bbb. The base file is not edited.
- Trigger: Physicist's review in the "Theory of everything" room, 2026-11-24.
- Written 2026-11-24 (America/Regina), **before any BBN run**. Still no BBN output produced or seen.
- New data seen for this amendment: the PRyMordial paper, arXiv:2307.07061 (PDF), §3.2 and Figure 3 including its inset table. Nothing else.
- Where A1 conflicts with the base lock, **A1 wins**.

---

## A1.1 Grid aggregation (replaces base §4 items 2–3; adds region split)

- A **scorable** point is one that passes both thermal-balance cuts in A1.2.
- A scorable point is **EXCLUDED** if its Yp lies outside the Yp 2σ band, **or** its D/H lies outside the D/H 2σ band. Bands are unchanged: Yp 0.239–0.251; D/H 2.450–2.566 ×10⁻⁵. It is **ALLOWED** if both lie inside.
- Scoring uses Variant A only. Variant B remains a D/H sensitivity and cannot change any verdict.
- **KILLED:** every scorable point is EXCLUDED.
- **SURVIVED:** every scorable point is ALLOWED.
- **MIXED:** some scorable points are ALLOWED and some EXCLUDED.
  - The overall verdict is reported **split by region**. I will list the ΔE, g*/g, τ_e and τ_γ values of every ALLOWED point and of every EXCLUDED point.
  - Any ALLOWED point means the KH equilibrium realization is not excluded **in that region**.
  - A SURVIVED or MIXED result contradicts Silagadze §6, and Physicist re-checks it before any card is written.
- Non-scorable points are listed as **NOT-TESTABLE-YET (non-equilibrium)** and never counted either way.
- If zero points are scorable, the verdict is NOT-TESTABLE-YET.
- **REDUCES-TO-KNOWN** is unchanged from base §4 item 4. It attaches only to the minimal-degeneracy points (g*/g = 1), and is tested on the Variant A point with τ_e = ∞, ΔE = 0.04 eV. If that point (or its τ_γ twin) is scorable, EXCLUDED, and has Yp in [0.43, 0.52], those g*/g = 1 points carry "KILLED — REDUCES-TO-KNOWN". g*/g = 2 points never carry it.
- **Yp quantity used.** For scoring and for the published comparison I use PRyMordial's `YPBBN` (nucleon mass fraction = 4·Y_α, results index 4). It is the quantity the paper's Fig. 3 and demo report against PDG. `YPCMB` is reported alongside. If the two would give different verdicts at any point, I report both, and the verdict uses `YPBBN`.

## A1.2 Thermal-balance cuts (both required; decided now)

Definitions:
- Γ_up(T) = (g*/g)·n̄(ΔE,T)/τ_γ, where n̄ = 1/(e^{ΔE/T} − 1).
- H(T) is PRyMordial's own Hubble rate. It is the code's `Hubble(Tg, Tν, Tν)` evaluated with the code's own Tν(Tγ) interpolation. I expose it as a read-only attribute in the patched copy, with no physics change.

**Cut 1 (base rule, kept):**
- Pass if Γ_up/H ≥ 10 at every point of a 200-point log grid in 0.07 ≤ T ≤ 1 MeV.
- Above 1 MeV, out-of-balance n* populations are irrelevant to the result, because weak equilibrium resets n/p (MAINSTREAM). So no condition is imposed above 1 MeV.

**Cut 2 (Physicist's, added):**
- Pass if τ_γ < 0.1 × (1/H) evaluated at T = ΔE.
- **How it is applied, decided now.** My judgement is that Cut 2 is well defined but physically weaker than Cut 1 for this grid. It uses only the spontaneous rate and ignores the n̄ ≫ 1 stimulated enhancement. It also probes a time at or after BBN, when 1/H is large. So it can only remove points, never add any.
- **ΔE = 0.04 eV case.** T = ΔE lies far below PRyMordial's lowest background temperature (T_end = 1 keV), and below matter–radiation equality, which the code does not model. For ΔE below the code's lowest tabulated Tγ, Cut 2 is evaluated at that lowest tabulated Tγ, using the code's H there. This is conservative: 1/H only increases toward later times, so a pass there implies a pass at T = ΔE.
- **10 keV and 30 keV.** Cut 2 is evaluated directly at T = ΔE from the code's background.

**Combining the cuts.** A point is scorable only if it passes **Cut 1 AND Cut 2**. Both cuts are reported per point, with the minimum Γ_up/H over the Cut 1 range and the Cut 2 ratio τ_γ·H(ΔE).

## A1.3 Control tolerance (replaces base §4 "channel VALID" logic)

**Published reference (seen for this amendment).** Burns, Tait & Valli, EPJC 84, 86 (2024), arXiv:2307.07061, Figure 3 inset "Mean ± 1σ". For `nacreii_flag = False` (PRIMAT key rates, our locked setting) it gives:
- Yp = **0.24689(11)**
- D/H = **2.459(26) ×10⁻⁵**
- For reference only: the NACRE II column gives 0.24680(14) and 2.53(10) ×10⁻⁵.

**Their setting, per Fig. 3 caption and §3.2 code:**
- a Monte Carlo of 10⁴ samples, using the large network (63 reactions, log-normal nuisance rates);
- τ_n = 878.4 ± 0.5 s;
- Ω_b h² = 0.02230 ± 0.00020;
- SM, compared with PDG 23.

**Difference from ours, and how I compare.**
- Our control is a single run at the **central values** of the same inputs: τ_n = 878.4 s, Ω_b h² = 0.02230, full network, nominal rates (all p_X = 0), PRIMAT. I compare our central-value output with their **MC means**.
- The code version also differs: commit 725d8a8 (2026) against the 2023 release used in the paper.
- The tolerances absorb mean-versus-central and version differences:

| Check | Requirement |
|---|---|
| Yp vs published | \|Yp_ctrl − 0.24689\| ≤ 0.0005 |
| D/H vs published | \|D/H_ctrl − 2.459e-5\| / 2.459e-5 ≤ 1%, i.e. 2.434–2.484 ×10⁻⁵ |
| Yp vs PDG 2025 | 0.239 ≤ Yp_ctrl ≤ 0.251 |
| D/H vs PDG 2025 | 2.450 ≤ D/H_ctrl ≤ 2.566 ×10⁻⁵ |

- **All four must hold.** If any fails, the verdict is **NOT-TESTABLE-YET and nothing is scored**. The grid is still run and reported as unscored output. This supersedes the base lock's per-channel validity rule.
- Note, CONJECTURE: the published PRIMAT D/H mean of 2.459 sits only 0.009 above the PDG 2025 lower 2σ edge of 2.450. A control near the published value could fail the PDG check, and that outcome is accepted in advance.

**Patch sanity test (kept).** The patched copy with f_n ≡ 1 (and Variant B scaling ≡ 1) must reproduce the pristine-code control to a relative difference ≤ 10⁻⁶ in Yp and D/H. Otherwise the verdict is NOT-TESTABLE-YET.

## A1.4 Implementation details fixed now (no knobs)

**Code copies.**
- Pristine clone: /workspace/chemist/bbn-code/PRyMordial at 725d8a8, untouched.
- Patched copy: /workspace/chemist/bbn-code/PRyMordial-nstar. Its diff is committed before the model runs.

**The patch.**
- A hook `PRyM_init.nstar_weak(T_K)` returns λ_np multiplier = f_n + (1 − f_n)·τ_g/τ_e.
- It is applied in the three weak-rate wrappers (HT, MT, LT eras) and in the HT detailed-balance initial condition: Yn_i = λ_pn / (λ_pn + mult·λ_np).
- The hook is `None` → multiplier 1.

**Variant B.**
- A hook `PRyM_init.nstar_nucl(T_K)` returns f_n. Each nuclear rate is multiplied by f_n^k, where k = number of free neutrons consumed in that direction.
- Forward rates: npdg, He3ntp, Be7nLi7p, Be7naa, B8naap, B8nLi6He3, B8nBe7d, dntg, He3nag, Li6nta, anpLi6g, Li6nLi7g, Li7nLi8g and ppndp take k = 1; annHe6g takes k = 2.
- Backward rates: ddHe3n, tdan, Li6taan, Li7daan, He3tanp, Li7taan, Li7He3aanp, Be7taanp, Li6dBe7n and Li8paan take k = 1; ttann and Li7taann take k = 2.
- All other rates: k = 0.

**Other fixed choices.**
- τ_e = ∞ is implemented as τ_g/τ_e = 0.
- Physical constants: f_n uses T = k_B·T_K in MeV and ΔE in MeV.
- The grid is the base §2 grid, unchanged (24 points). τ_γ affects only A1.2, so the 12 distinct (ΔE, g*/g, τ_e) BBN runs are each reported under both τ_γ values.
- Raw outputs go to /workspace/chemist/bbn-code/runs/CH-BBN-NSTAR-1/. They are copied into the locks repo under runs/CH-BBN-NSTAR-1/ together with a SCORE file.

## A1.5 Prediction addendum (CONJECTURE)

- Control: Yp ≈ 0.2469; D/H ≈ 2.46 ×10⁻⁵. This is close to the PDG D/H lower edge; I expect a narrow pass.
- Cut 1 fails for ΔE = 30 keV with τ_γ = 100 s, and possibly for ΔE = 10 keV with τ_γ = 100 s. Cut 2 passes everywhere.
- All scorable points are EXCLUDED by Yp.
- Expected verdict: **KILLED** (with REDUCES-TO-KNOWN on the g*/g = 1 points), plus a NOT-TESTABLE-YET non-equilibrium corner.
