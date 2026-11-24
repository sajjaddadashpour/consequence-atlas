# AMENDMENT A2 to CH-BBN-NSTAR-1: detailed-balance correction (pre-run for A2)

- **Amends:**
  - Base lock f30de3e (sha256 691a788a…8bbb)
  - A1 f2d3690 (sha256 de89bf0e…2e801)
  - The base lock and A1 files are not edited.
- **Run 1 record (kept as is):**
  - Run-1 outputs and score: commit 0f15451; SCORE sha256 1d838514…24705.
  - Run-1 patch: d3e2b4a.
- **Trigger:** In the run-1 score file I found that the base-lock §2 mapping violates detailed balance when τ_e is finite. Physicist accepted this (room, 2026-11-24) and gave the corrected rate (DERIVED).
- **A2 code:** patch commit **45f325e23f3efc6cbba3384491526425d75d41da** (nstar_patch_A2.diff, sha256 8868dcb7…7d16), runner run_point_a2.py, gate script gate_score_a2.py.
- **Timing:** Written 2026-11-24 (America/Regina) **before any A2 model point is run.**
- **Precedence:** A2 wins over the base lock and A1 wherever they conflict.

## A2.1 Declared seen (everything below is known before A2 scoring)
1. **The entire run 1** (/workspace/chemist/locks/runs/CH-BBN-NSTAR-1/): every grid JSON for Variants A and B, the control, the patch check, step0.json and score_table.json. Values seen include:
   - Minimal point (0.04 eV, g*/g = 1, τ_e = ∞, Variant A): **Yp = 0.5751**, D/H = 6.426×10⁻⁵.
   - τ_e = ∞ points: Yp 0.5547–0.8146.
   - τ_e = 887 s points (artifact): Yp 0.2486–0.2493, D/H 2.467–2.474.
   - Variant B values.
   - Step-zero ratios: 8 points not scorable (τ_γ = 100 s at 10 and 30 keV).
2. **The run-1 SCORE file**, MIXED by τ_e.
3. **PRyMordial published SM values** (Burns, Tait & Valli, EPJC 84, 86 (2024), Fig. 3 inset, PRIMAT): Yp = 0.24689(11), D/H = 2.459(26)×10⁻⁵.
4. **NEW: one SM-only run of the A2-patched code with all hooks None** (SM_hooksNone_A2patch.json, committed in 45f325e). It is not a model point. It was run to check the patch and to design the gate in A2.3.
   - Yp = 0.24688731803869873 and D/H = 2.454486754073651×10⁻⁵, **bit-identical** to the run-1 pristine control.
   - Its high-temperature n/p trajectory gives the numbers quoted in A2.3.
5. **Silagadze arXiv:2611.29328 (full text) and Koch & Hummel v4**, as already declared.

## A2.2 Corrected mapping (replaces base §2 "Weak rates, patched" for p→n)

**DERIVED (Physicist, standard weak equilibrium).** While the weak rates are fast,

(n_g + n_e)/p = (1 + (g*/g)·e^{−ΔE/T})·e^{−Q/T}.

So every n*→p channel needs its detailed-balance reverse. With n* held in thermal balance with n, the total p→n rate is

λ_p→n,eff = λ_p→n · [1 + (λ_e/λ_g)·(g*/g)·e^{−ΔE/T}].

**ASSUMED.** n* rates scale by the same factor λ_e/λ_g = τ_g/τ_e in **all three** channels:
- p e⁻ ↔ n ν
- p ν̄ ↔ n e⁺
- free decay and its three-body inverse

This is justified because ΔE ≤ 30 keV ≪ Q and the energies involved, so the phase-space change is negligible.

**Implementation.**
- PRyMordial's `nTOp_bkwrd_{HT,MT,LT}` is one tabulated **total** p→n rate covering all channels. It is loaded as a single table in `PRyM_nTOp.InterpolateWeakRates`, with no per-channel split in the code path used.
- The multiplier m_b(T) = 1 + (τ_g/τ_e)(g*/g)e^{−ΔE/T} is therefore applied to that total rate in all three eras. That covers all three p→n channels at once.
- It is also applied to the high-temperature detailed-balance initial condition: Yn_i = λ_pn·m_b / (λ_pn·m_b + λ_np·m_f).
- The n→p multiplier is unchanged from run 1: m_f = f_n + (1 − f_n)·τ_g/τ_e, applied to the total n→p rate (all three channels).
- With both multipliers, λ_pn,eff/λ_np,eff = (1 + x)·λ_pn/λ_np, where x = (g*/g)e^{−ΔE/T}. That is the DERIVED equilibrium.
- **For τ_e = ∞:** τ_g/τ_e = 0, so m_b = 1.0 exactly. The mapping is identical to run 1.
- **Variant B:** unchanged from A1.4.

## A2.3 Sanity gates (decided now; evaluated by gate_score_a2.py from saved code outputs)

**Exports.** The A2 patch exports, read-only, without changing the solver call:
- the high-temperature (HT) solver trajectory: t, Yn (total neutrons), Yp and T(t);
- the HT rate functions, together with m_f and m_b.

**Gate G1: binding, at the rate level.** This is Physicist's formula.
- Evaluated at 200 log-spaced temperatures with 1 ≤ T ≤ 3 MeV.
- Requirement: |[λ_pn·m_b/(λ_np·m_f)] / [(1+x)·e^{−Q/T}] − 1| ≤ 1% at every temperature, with Q = m_n − m_p = 1.29333 MeV from PRyM_init.
- In the SM check, the code's own λ_pn/λ_np matches e^{−Q/T} to within 0.22% (max |dev| = 0.0022), so this literal Q form is usable.
- This gate catches the run-1 flaw: run-1 τ_e = 887 s points would give about 1/(1 + 0.99x), which is −50% for g*/g = 1.

**Gate G1b: binding, abundance at T_start = 10 MeV**, the first HT point.
- Requirement: |(Yn/Yp)/[(1+x)e^{−Q/T}] − 1| ≤ 1%.
- The SM check gives 0.25%.

**Gate G2: Physicist's abundance form over 1–3 MeV. Computed and reported, but NOT binding.**
- **Reason, from the declared SM check:** the SM control itself fails it. The SM (n/p)/e^{−Q/T} − 1 is between +0.83% (at 2.98 MeV) and +26.8% (at 1.06 MeV). It exceeds 1% for every T < 2.816 MeV.
- This is ordinary weak freeze-out lag (MAINSTREAM), not a mapping error.
- Applied literally, G2 would declare every point NOT-TESTABLE-YET, the SM included. So it cannot discriminate.
- Reported per point:
  - G2_lit, the literal formula;
  - G2_sm = (n_tot/p)_model / [(1+x)·(n/p)_SM] − 1, the SM-normalized form, which removes the code's corrections and SM lag but not the model-specific lag.
- **If Physicist requires a binding abundance-level gate,** that needs an A3 before scoring.

**Failures.** Any point failing G1 or G1b is NOT-TESTABLE-YET.

**Kept from earlier.**
- Switched-off reproduction: hooks None gives Yp and D/H within 10⁻⁶ relative of the pristine control. It was already met bit-identically in A2.1(4).
- The A1.3 published-control tolerance and PDG bands are unchanged. The control is already seen to pass.

## A2.4 Grid, bands, cuts, aggregation, regression

**Unchanged from earlier:**
- the 24-point grid;
- the PDG 2025 2σ bands: Yp 0.239–0.251, D/H 2.450–2.566×10⁻⁵;
- the two thermal cuts and the step-zero results (the cuts do not depend on the p→n mapping);
- the A1.1 aggregation, using YPBBN, with Variant A scored and Variant B as sensitivity only.

**Points to run.** All 12 distinct (ΔE, g*/g, τ_e) configurations, for both variants, with the A2 code: 24 runs. Each is reported under both τ_γ values.

**Finite τ_e (887 s) points.**
- Scored under A2.
- Their run-1 scores stay on record, labelled **"lock artifact (detailed-balance violation in base §2 mapping), superseded by A2"**.
- No card is written from the run-1 SURVIVED half.

**τ_e = ∞ points: regression check.**
- A2 values must reproduce run-1 Yp and D/H within 10⁻⁶ relative (bit-identical expected, since m_b ≡ 1.0).
- If any differs, it is flagged. The point is then scored from the A2 value, and the discrepancy is investigated before any card is written.

**Overall verdict.** Per A1.1, over all 16 scorable points, combining A2 finite-τ_e scores with the τ_e = ∞ scores. REDUCES-TO-KNOWN is unchanged: the minimal point (τ_e = ∞) already reads "KILLED, magnitude disagrees with Silagadze".

**Outputs.** Written to runs/CH-BBN-NSTAR-1-A2/, plus a SCORE_A2 file.

## A2.5 Predictions (CONJECTURE, written before any A2 model point)

**Physicist's prediction.**
- For ΔE ≪ 0.7 MeV, n* acts as extra neutron degeneracy. With g* = g, n/p goes from about 1/7 to about 2/7, which gives Yp ≈ 0.45.
- So the 887 s half collapses to KILLED.
- If it instead stays near 0.249, that is anomalous and needs a proper look.

**Chemist's prediction.**
- Run 1's τ_e = ∞ minimal point gave 0.575, above 0.45. Plausibly this is because n* that cannot convert also escapes free decay after freeze-out.
- With τ_e = 887 s, n* decays at about the ground-state rate. Freeze-out n/p is still roughly doubled, but there is no decay shelter.
- I predict the finite-τ_e points land between **about 0.45 and 0.575** for g*/g = 1, and higher for g*/g = 2, **all KILLED**.
- D/H rises well above the band.
- G1 and G1b pass at all points, and the τ_e = ∞ regression is bit-identical.
