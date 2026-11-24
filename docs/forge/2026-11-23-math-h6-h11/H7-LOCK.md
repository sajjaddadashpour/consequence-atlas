# H7 LOCK — self-duality fixes the 2D Ising critical point; D2 (fixed M = 0) changes nothing
Locked by Physicist, 2026-11-23 ~21:30 CST. Source: seen/PROPOSALS.md §H7.
Code: **code/h7_ising_locked.py** (modified copy; original byte-identical at code/orig/h7_ising.py). Changes in §5, made before this commit.
Run (Mathematician, from code/): `<venv6 python> h7_ising_locked.py --locked-commit <this commit>` → out/h7_result.json.

## 1. Claims and labels
| # | Claim | Tag |
|---|---|---|
| 1 | Kramers–Wannier duality maps sinh 2K ↔ 1/sinh 2K*; the self-dual point K_c = ½ ln(1+√2) = 0.4406868 is the critical point | IMPORTED (KW 1941; Onsager 1944 confirms) |
| 2 | "A1's ±1 mirror symmetry fixes K_c" = the KW argument restated | REDUCES-TO-KNOWN by construction |
| 3 | D2 (pair creation conserves charge) ⇒ fixed-magnetization ensemble M = 0; ensemble equivalence ⇒ same K_c in the thermodynamic limit | IMPORTED (standard; conserved-order-parameter equilibrium) / ASSUMED that D2 ≡ fixed M = 0 |
| 4 | Numerical: the M = 0 stripe-Binder crossings extrapolate to K_c | CONJECTURE with expected outcome REDUCES-TO-KNOWN |
Label: **REDUCES-TO-KNOWN expected**; PRR link ANALOGY-ONLY (the ±1 alphabet is the Ising spin by fiat).

## 2. SEEN DATA (declared)
- seen/out_instrument_h7.txt: Metropolis canonical U4 at L = 8, 16, 32, K = 0.425–0.455, seed 11+L.
  **Instrument gate (16,32) crossing 0.4424, K_c + 0.0017 (|Δ| ≤ 0.005): PASSED — SEEN.** (8,16) crossing 0.4471 (+0.0065).
- Kawasaki L = 16 sanity: U_stripe = 0.537 (K = 0.2), 0.997 (K = 0.8). sinh(2K_c) = 1.0; dual of K_c = 0.4406868.
- These used seeds 11+L (orig scheme) and a narrower K grid; the locked run uses disjoint seeds (§5). No M = 0 crossing in the
  decisive window [0.40, 0.48] at L ≥ 16 pairs has been computed.

## 3. Locked procedure
- Ensembles (same code, same grid, same analysis):
  - **M0 (decisive):** fixed M = 0, balanced random init, non-local Kawasaki (swap any antiparallel pair), observable stripe
    order parameter S, ratio U_stripe = 2 − ⟨S²⟩/⟨S⟩².
  - **Canonical control:** random init, Metropolis, observable m = ⟨s⟩, U4 = 1 − ⟨m⁴⟩/(3⟨m²⟩²).
- L ∈ {16, 24, 32, 48}; K = 0.400, 0.404, …, 0.480 (21 points); 10⁴ thermalisation + 10⁵ measurement sweeps, measure every sweep;
  2 independent seeds per (ensemble, L, K), pooled; SE from 20 contiguous blocks.
- Crossings by linear interpolation for pairs (16,24), (24,32), (32,48); L_eff = √(ab).
- Two extrapolations, both locked: K×(L_eff) = K_∞ + a·L_eff^{−ω}, **ω = 1 and ω = 2**, OLS, SE_fit from residuals (1 dof).
- **Numeric "equivalent" rule (fixed):** a fit is EQUIVALENT iff |K_∞ − K_c| ≤ max(3·SE_fit, 0.005).
  An ensemble is EQUIVALENT if both fits are, SHIFTED if neither is, MIXED otherwise.
  **Precision guard:** if any crossing is NaN or any 3·SE_fit > 0.02, the ensemble is IMPRECISE.

## 4. Verdict mapping (fixed; implemented in run())
| Outcome | Verdict |
|---|---|
| canonical control not EQUIVALENT (SHIFTED/MIXED/IMPRECISE) | **NOT-TESTABLE-YET** (the pipeline cannot recover a known answer) |
| control EQUIVALENT, M0 EQUIVALENT | **REDUCES-TO-KNOWN** |
| control EQUIVALENT, M0 SHIFTED | **SURVIVED (provisional)** — a K_c shift under D2; L = 64 replication required before any atlas claim |
| control EQUIVALENT, M0 MIXED or IMPRECISE | **NOT-TESTABLE-YET** |
Physicist's and Mathematician's expectation: REDUCES-TO-KNOWN. KILLED is not a reachable outcome here: the hypothesis *is* the
known result plus "D2 changes nothing"; a shift would refute "changes nothing" and is recorded as SURVIVED (provisional) of
the alternative. (Stated so no one relabels after the run.) NOT-TESTABLE-AS-DEFINED: not used.

## 5. Code changes vs orig/h7_ising.py (all in run(); instrument(), measure(), metropolis, kawasaki_nonlocal, U_*, crossing unchanged)
1. **Seeds (bug).** orig: seed = 1000·L + s and measure() reseeds each sweep with seed+1+t ⇒ seed 1 and seed 2 replay the
   *same* random stream shifted by one sweep (not independent), and streams overlap across K and L.
   Locked: base = ((((mode·4 + Lidx)·21 + Kidx)·2 + (s−1)) + 1)·200 003; 336 bases, all distinct, gap 200 003 > 10⁵+2 seeds used
   per run (checked). ASSUMED: numba MT19937 streams from distinct integer seeds are effectively independent.
2. **Same-code canonical control added** (orig run() had none).
3. **Verdict vocabulary/guard:** orig mapping (both fits in tol → REDUCES-TO-KNOWN; both out → SURVIVED; else NOT-TESTABLE-YET)
   kept, plus the control gate and the precision guard (orig SE_fit has 1 dof and can be spuriously tiny or huge).
- Runtime estimate: ~0.5–1.5 h total (both ensembles; per-sweep Python call overhead dominates). Not run.
