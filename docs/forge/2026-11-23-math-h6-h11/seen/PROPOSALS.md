# H6–H10: proposed lock drafts (Mathematician, 2026-11-23, written 20:55–21:10 CST)

Status: **DRAFTS for Physicist to lock. No decisive statistic has been computed.** Each decisive script refuses to run
without `--locked-commit <sha>`. Only instrument/control cases with known answers were run (listed in §7, outputs in
`out_instrument_h*.txt`). Nothing was posted, pushed, PR'd or messaged. The H1–H3 directory
(`/workspace/physics/forge/2026-11-23-math-h1-h3-locks/`) was not touched.

PRR commitments used: A1 alphabet {+1,−1} (Z2), 0 only as their sum; A2 no all-empty state; D2 pair creation conserves
charge. Already settled by us and not redone: complex phases forced (H2), zeta zeros GUE-like (seen data), naive branching
tree fails d_s = 4 (H3), projection chain REDUCES-TO-KNOWN, 4 ln2 area quantum NOT-TESTABLE-YET, Alpöge RH proof analytic
(Hilbert–Pólya stays ANALOGY-ONLY).

Labels: ESTABLISHED / MAINSTREAM-HYPOTHESIS / CONJECTURE / ANALOGY-ONLY, by weakest step. Steps tagged DERIVED / ASSUMED /
IMPORTED. Verdicts: SURVIVED / KILLED / REDUCES-TO-KNOWN / NOT-TESTABLE-YET (+ VOID if an instrument gate fails).

Ranking (most useful first): **H6** (sharp, mostly decided by theorems, one genuinely open numerical claim) > **H8**
(quantitative "primes as a spectrum" test, but literature-SEEN) > **H7** (clean D2 test, expected REDUCES-TO-KNOWN) >
**H9** (theorem check; kills a PRR uniqueness claim for mixed states) > **H10** (weakest; derivation audit only).

---

## H6 — The sign hypothesis: the −1 is the unique tractable cycle weight, but cancellation is not what makes it tractable

### Context (VP ≠ VNP claim)
Anthropic's claimed proof of VP ≠ VNP over every field (hexagonmath.org/2611.00954v1; Lean + Comparator + nanoda accept
it; **Anthropic states no human has checked it**, in particular whether `Statement.lean` faithfully encodes the definitions;
bound m^{c(log m)^{1/3}}; in characteristic 2 per = det, so the paper uses the Hamiltonian-cycle polynomial). **H6 does not
depend on that claim.** Every step below uses older, refereed results. If the VP ≠ VNP proof survives human review it adds
an unconditional algebraic separation on top; if it fails, H6 is unaffected.

### Statement
Let Z_y(A) = Σ_{π∈S_n} y^{c(π)} Π_i A_{i,π(i)}, where c(π) is the number of cycles. Then Z_{+1} = per A and
Z_{−1} = (−1)^n det A. Write imm_λ(A) = Σ_π χ_λ(π) Π A_{iπ(i)} for the immanant of the irreducible character χ_λ.
1. **(IMPORTED, ESTABLISHED under FP ≠ #P)** Among all y ∈ ℂ, exact evaluation of Z_y is #P-hard except at y = 0 (trivially
   zero for n ≥ 1) and y = −1 (det). This is the x = 0 line of the Chung–Graham cover polynomial C(D;x,y), whose only easy
   points are (0,0), (0,−1), (1,−1) (Bläser & Dell 2007; Bläser, Dell & Fouz 2011). So **the mirror weight −1 is the unique
   non-trivial tractable cycle weight.** Sharper statements: Mertens & Moore 2013: Ferm_k (y = −k) #P-hard for k > 2,
   ⊕P-hard for k = 2. Valiant 1979: per #P-complete and VNP-complete.
2. **(IMPORTED, ESTABLISHED conditional on FPT ≠ #W[1])** Along the immanant ladder the controlling quantity is
   b(λ) = n − (number of rows), "how many boxes away from the sign character": bounded b ⇒ polynomial time; unbounded b ⇒
   not polynomial (and #P/VNP-hard if b grows polynomially) (Curticapean 2021; earlier partial results Hartmann 1985,
   Barvinok 1990, Bürgisser 2000).
3. **(DERIVED)** Σ_π y^{c(π)} = y(y+1)…(y+n−1). On the unit circle |y| = 1 its only zero is y = −1. So −1 is the unique
   unit-modulus weight whose uniform average cancels exactly — the "+ and − born together, summing to zero" point.
4. **(DERIVED)** That same average also vanishes at y = −2, −3, …, −(n−1), where evaluation is #P-hard (point 1). And for
   every λ ≠ (n), Σ_π χ_λ(π) = 0 (orthogonality with the trivial character), yet complexity varies with b(λ) (point 2).
   **So exact cancellation is not sufficient for tractability.** What singles out −1 is that (−1)^n y^{c(π)} = sgn(π) is a
   group homomorphism S_n → {±1}, which makes det multiplicative (det AB = det A det B) and allows Gaussian elimination.
   The defensible PRR reading is: "the −1 matters because it is the sign homomorphism", not "minus signs make things easy".
5. **(IMPORTED, ESTABLISHED) The physics tension, resolved.** Two different tasks:
   - *Exact amplitudes of non-interacting particles:* free fermions ↔ determinants, classically simulable (Valiant 2002
     matchgates; Terhal & DiVincenzo 2002). Free bosons ↔ permanents; exact permanents are #P-hard (Valiant 1979), and
     boson-sampling hardness (Aaronson & Arkhipov 2013) rests on **#P-hardness of the permanent plus conjectures**
     (anti-concentration, Gaussian permanent estimation), **not on VP ≠ VNP**. There the sign *helps*.
   - *Stochastic sampling (QMC):* positive weights are easy. A non-negative permanent has an FPRAS (Jerrum, Sinclair &
     Vigoda 2004). Signs destroy positivity: Troyer & Wiese 2005 show that a generic solution of the QMC sign problem would
     put NP in P. **Citation checked; caveat:** their NP-hard instance is a classical ±J Ising spin glass written as a
     sign-problem QMC, not a general fermion model. There the sign *hurts*.
   - Combined (ESTABLISHED): the −1 is the exact-algebra resource and the sampling obstruction at the same time. Free-fermion
     thermodynamics (det(1+e^{−βH})) and free-boson thermodynamics (1/det(1−e^{−βH})) are both easy, so "bosons ↔
     permanents" is about *n-particle amplitudes*, not partition functions.
6. **(CONJECTURE — the only part with an unseen numerical outcome) Cancellation is decoupled from complexity.** For random
   0/1 Bernoulli(½) matrices:
   - (T1) The typical ratio |Z_{e^{iθ}}|/per follows the mean-field law m_n(θ) = log|Γ(n+e^{iθ}) / (Γ(e^{iθ}) n!)| for
     θ ≤ 5π/6, and θ = π is the strict point of maximal typical cancellation.
   - (T2) Across all immanants λ ≠ (n), the typical normalized size log(imm_λ² / E[imm_λ²]) does **not** track b(λ).
     E[imm_λ²] = n!·imm_λ(I+J) / (d_λ 4^n) is DERIVED (character convolution χ*χ = (n!/d)χ).

**Label by weakest step: CONJECTURE** (point 6). Points 1–5 are ESTABLISHED or DERIVED. **The PRR link is ANALOGY-ONLY**
(see "PRR-distinctive" below).

### What would KILL it
- **The math claim "−1 is the unique non-trivial tractable cycle weight":** a polynomial algorithm for Z_y at any
  y ∉ {0, −1}, which would imply FP = #P. Not expected.
- **T1b:** at n = 8, 9 or 10, some θ < π has a median log-ratio ≤ the θ = π value, or the bootstrap 95% CI of
  median(π) − median(11π/12) is not entirely < 0. Verdict: KILLED ("the mirror is not the point of maximal cancellation").
- **T2:** at n = 9, the Spearman correlation |ρ(b(λ), median log R_λ)| > 0.6 over λ ≠ (n), with a bootstrap CI excluding 0.
  Verdict: KILLED (decoupling). That outcome would actually be the *PRR-friendlier* surprise ("cancellation tracks
  tractability"), so it must be reported prominently, not buried.

### Exact computation to run after locking
Script: `code/h6_run.py --locked-commit <sha>`, using shared `code/symn.py` (S_n enumeration, Murnaghan–Nakayama
characters, numba cycle-type sums).
- **Instrument gate (must pass or the run is VOID):** Z_{−1}(J) = 0 for all n; Z_{−1}(A) = (−1)^n det A on 3 random 0/1
  matrices for each n.
- **T1:** iid Bernoulli(½) 0/1 matrices, n = 6, 7, 8, 9 (N = 2000 each) and n = 10 (N = 500). Seed 20261123+n. Matrices
  with per = 0 are discarded and counted. θ_k = kπ/12, k = 0…12. Statistic: per-n median of log(|Z_{θ}|/per). Exact zeros
  are kept as −∞ (fraction reported).
  - T1a pass: |median − m_10(θ_k)| ≤ 0.5 nat for k = 0…10 at n = 10.
  - T1b pass: for n ∈ {8, 9, 10}, the median at π is below every other θ_k, and the bootstrap (1000) 95% CI of
    median(π) − median(11π/12) is < 0.
- **T2:** n = 7, 8, 9, N = 2000 random 0/1 matrices each (seed 20261123+100+n), every λ ⊢ n. R_λ = imm_λ² / E[imm_λ²]
  (DERIVED). Statistic: median log R_λ; Spearman ρ between b(λ) and that median over λ ≠ (n) at n = 9, with a 1000-resample
  bootstrap CI.
  - PASS: |ρ| ≤ 0.6.
  - FAIL: |ρ| > 0.6 and the CI excludes 0.
  - Else: AMBIGUOUS.
- **Verdict mapping:**
  - instrument fail → VOID.
  - T1b fail → KILLED.
  - T2 FAIL → KILLED (decoupling).
  - T2 AMBIGUOUS, or T1a fail → NOT-TESTABLE-YET.
  - all pass → SURVIVED as a math conjecture; **PRR-level verdict REDUCES-TO-KNOWN** (the complexity content is
    established literature).
- Expected runtime: a few minutes (n = 10 is about 0.06 s per matrix).

### Already SEEN (declare in lock)
- All of points 1–5 (literature).
- Exhaustive ±1 matrices at n = 2, 3:
  - n = 2: P(per=0) = P(det=0) = 0.5.
  - n = 3: P(per=0) = 0, P(det=0) = 0.625.
  - E[imm_λ²] = n! for every λ.
- The heuristic expectation that T1 holds (the mean term y^{(n)}/n! is known analytically).
- **Not seen:** any random-matrix statistic for n ≥ 4, any T1/T2 number.

### Could it ever be PRR-distinctive?
**No, as it stands.** It is pure mathematics; PRR can only *motivate* the reading ("−1 as the sign homomorphism"). The
honest gain for PRR is a **correction of its own slogan**: "the mirror makes the world tractable" is false as stated
(points 3–4). The true version needs the −1 to act as a group homomorphism. It becomes physics only if PRR derives
*why* exchange of identical particles is represented by a 1-dim character of S_n (bosons/fermions) rather than a
higher-dim one (parastatistics; cf. Wang & Hazzard 2025). That is a possible future lock and is currently ANALOGY-ONLY.
Side note for a possible later lock (ESTABLISHED arithmetic, SEEN): for ±1 matrices, det is divisible by 2^{n−1}, and per
by 2^{n−⌊log₂(n+1)⌋} (Kräuter & Seifter 1983/84). Per never vanishes at n = 2^k − 1 (Simion–Schmidt; Kräuter–Seifter),
while det vanishes with probability ~2^{−n} (Tikhomirov 2020). This is the characteristic-2 shadow of "+1 = −1 mod 2".
**I flag any numerical coincidence-hunting with these powers of 2 as numerology-risk.**

---

## H7 — Mirror self-duality fixes the 2D Ising critical point; D2 charge conservation fixes nothing new

### Statement
1. **(IMPORTED, ESTABLISHED)** The ±1 Ising model on the square lattice is Kramers–Wannier self-dual. Its critical point is
   the self-dual point, sinh 2K_c = 1, K_c = ½ ln(1+√2) = 0.4406868 (Kramers & Wannier 1941; Onsager 1944).
2. **(DERIVED from 1 + IMPORTED Wegner 1971)** The number comes from **self-duality of the lattice** (the square lattice is
   its own planar dual), not from the Z2 (+↔−) symmetry alone. In 3D the Ising model is dual to the Z2 *gauge* theory
   (Wegner 1971), not to itself. So no closed-form K_c is fixed. "PRR mirroring fixes numbers" holds exactly where a
   self-duality exists and fails elsewhere.
3. **(CONJECTURE to be tested, PRR-motivated)** Imposing D2 literally (+ and − created together ⇒ total charge Σs = 0
   exactly, the fixed-magnetization ensemble) leaves the critical coupling unchanged: K_c(M=0) = K_c(Onsager). Standard
   physics (ensemble equivalence) predicts this. A shift would be PRR-distinct.

**Label: ESTABLISHED for 1–2. The tested claim 3 is a MAINSTREAM-HYPOTHESIS** (ensemble equivalence at a critical
isochore), and its PRR reading is ANALOGY-ONLY.

### KILL
- **Of the "D2 fixes a new number" reading:** K_∞(M=0) consistent with 0.440687 (→ REDUCES-TO-KNOWN).
- **Of standard physics** (would need L = 64 replication before anyone believes it): both extrapolations exclude 0.440687
  by more than max(3·SE, 0.005).

### Computation after locking
`code/h7_ising.py --locked-commit <sha>`.
- **Algorithm:** non-local Kawasaki (swap a random +/− pair anywhere; samples the exact fixed-M = 0 canonical ensemble).
  Periodic L × L with L ∈ {16, 24, 32, 48}; K from 0.400 to 0.480 in steps of 0.004 (21 points). 10⁴ thermalization sweeps,
  10⁵ measurement sweeps, 2 seeds.
- **Observable:** stripe order S = |m̃(2π/L,0)|² + |m̃(0,2π/L)|², ratio U = 2 − ⟨S²⟩/⟨S⟩². U = ½ for Gaussian disorder and
  1 for an ordered stripe. SE from 20 blocks.
- **Estimate:** crossings K_× for the pairs (16,24), (24,32), (32,48), then a fit K_× = K_∞ + a·L_eff^{−ω} with ω = 1 and
  ω = 2 (L_eff = √(ab)).
- **Verdict:**
  - both fits within max(3·SE, 0.005) of 0.440687 → REDUCES-TO-KNOWN.
  - both exclude → SURVIVED (flag: replicate at L = 64 first).
  - mixed → NOT-TESTABLE-YET.
- **Instrument gate (lock should require it):** a canonical Metropolis Binder crossing for L = 16, 32 within 0.005 of K_c.
  Kawasaki U at K = 0.2 near 0.5 and at K = 0.8 near 1. Both were run; see §7.
- **Suggested lock addition:** also run the identical pipeline in the canonical ensemble as a same-code control.

### SEEN
- Points 1–2 (textbook).
- The canonical Binder crossings and the far-from-critical Kawasaki limits (§7).
- **Not seen:** any fixed-M = 0 data near K_c.

### PRR-distinctive?
- Only if the D2 ensemble shifted K_c, which would contradict ensemble equivalence. **Expected verdict:
  REDUCES-TO-KNOWN.** The value of the test is that it gives D2 an operational meaning and a clean kill.
- **Numerology flag:** do not attempt to "derive" the 3D K_c ≈ 0.22165 from ±1 symmetry. No self-duality exists there, and
  any closed form would be a fit.

---

## H8 — Primes as periodic orbits: Berry's number-variance saturation, parameter-free

### Statement
**(IMPORTED, ESTABLISHED as a semiclassical formula; MAINSTREAM-HYPOTHESIS as physics)** Treat zeta zeros as energy levels
of a chaotic system without time-reversal symmetry whose primitive periodic orbits are the primes (period ln p). Then the
number variance V(L) of the unfolded zeros at height E follows Berry's formula, **with no free parameter**:
- GUE growth for L ≪ L_max = ln(E/2π)/(2π ln 2);
- then saturation with quasi-random oscillations of wavelength ln(E/2π)/(r ln p) about π^{−2}[ln ln(E/2π) + 1.4009]
  (Berry 1985, 1988).

This is the most quantitative form of "primes act as a physical spectrum" available.

Formula used (my reconstruction of Berry 1988 eq. 19, **verified** against his quoted constants; see §7):
V(L) = V_GUE(L) − π^{−2}[ln(2πLτ*) + γ − Ci(2πLτ*)] + (2/π²) Σ_{p^r ≤ (E/2π)^{τ*}} sin²(πLr ln p / ln(E/2π)) / (r² p^r),
with τ* = ¼ (sensitivity check τ* = 0.15).

**Label: MAINSTREAM-HYPOTHESIS** (Hilbert–Pólya/periodic-orbit reading). As PRR: **ANALOGY-ONLY**.

### KILL
At the 10²¹ or 10²² window: D_Berry ≥ D_GUE, or D_Berry > 0.05, where
D = RMS over L ∈ [0.5, 50] of (V_data − V_model)/V_model.

### Computation after locking
`code/h8_berry.py --locked-commit <sha>`.
- **Data:** downloads its own copies of Odlyzko's `zeros3` (10¹²), `zeros4` (10²¹) and `zeros5` (10²²) into `data/` and
  records sha256. Compare against the H1 lock's quoted prefixes (zeros4 10d9f7da…, zeros5 250ac4ba…) without touching that
  directory.
- **Method:** unfold with the local Riemann–von Mangoldt density (2nd order). V(L) for L = 0.5…50 in steps of 0.5, from
  20,000 window starts; SE from 10 blocks.
- **Models:**
  - Berry at the window's median height, τ* = ¼ (and 0.15 reported);
  - GUE;
  - Cramér control: Berry's formula with 20 random-prime sets of the same density (m included with probability 1/ln m).
- **Verdict:**
  - all three windows have D_Berry ≤ 0.03, D_Berry < D_GUE and D_Berry < min Cramér → REDUCES-TO-KNOWN;
  - the kill condition above → KILLED;
  - otherwise NOT-TESTABLE-YET.

### SEEN — declare clearly
- Berry 1988 compared with Odlyzko's 10⁵ zeros near x = 10¹¹ and confirmed it.
- **A Zenodo deposit (D. Hess, 2026, doi:10.5281/zenodo.23815327; not peer-reviewed, abstract read only) reports exactly
  this comparison at 10¹²/10²¹/10²² heights:** Berry 0.26–1.21% RMS, Cramér 5–10%, GUE 15–82%. So the outcome is
  **literature-seen.** This lock is a replication, not a blind test.
- We used `zeros3` earlier for spacing statistics only, never for V(L).

### PRR-distinctive?
- **No.** It is the strongest *established* quantitative bridge between arithmetic and spectra. Including it guards the
  atlas against weaker "primes ↔ physics" claims.
- It cannot support PRR unless PRR produces the orbit amplitudes −ln p · p^{−r/2} from its own commitments. Nothing
  currently does.

---

## H9 — "The geometry of ±1 possibilities is unique": true classically, false for quantum mixed states

### Statement
1. **(IMPORTED, ESTABLISHED)** On the classical two-outcome (±1) simplex, the Fisher metric is the unique metric, up to
   scale, that is monotone under all Markov maps (Čencov 1972/1982; Campbell 1986 extension). This upgrades our earlier H5
   ("possibility is geometry", Wootters 1981) from "a natural metric" to "the only one".
2. **(IMPORTED, ESTABLISHED)** For a qubit (the quantum ±1 system), monotone metrics form an infinite family, one for each
   operator-monotone f with f(1) = 1 (Petz 1996): SLD/Bures (minimal), Wigner–Yanase, Kubo–Mori, RLD (maximal), and so on.
   They agree on commuting (classical) directions and at the maximally mixed state, and differ elsewhere.
3. **(DERIVED from 1–2)** So **PRR's "the geometry of possibility is unique" holds for classical ±1 readings and fails for
   quantum mixed ±1 states.** PRR would need an extra rule to pick one metric. The operationally favoured choice is SLD,
   because it saturates the quantum Cramér–Rao bound (Braunstein & Caves 1994). That choice is IMPORTED, not derived.

**Label: ESTABLISHED** (theorem check). As a PRR claim: KILLED for mixed quantum states, REDUCES-TO-KNOWN for classical
ones.

### KILL
- Of the uniqueness claim: two monotone metrics differing on a tangential direction at some 0 < r < 1. The Petz theorem
  guarantees this, so the lock is formal.
- Of the code: the ratios all equal 1.

### Computation after locking
`code/h9_petz.py --locked-commit <sha>`.
- **Statistic:** ratio of tangential metric components to SLD for the four f, at r ∈ {0.1, 0.3, 0.5, 0.7, 0.9, 0.99}.
- **Verdict:** a spread > 10⁻⁶ → KILLED (quantum uniqueness); otherwise SURVIVED.

### SEEN
- The classical-direction equality and the r = 0 equality (instrument, §7).
- **Honest note:** the decisive outcome is fixed by a theorem, so the "unseen" status is formal only.

### PRR-distinctive?
- **No.** Its use is as a guard rail: any atlas link saying "PRR determines a unique geometry of possibilities" must be
  restricted to classical readings or pure states, or must name its extra assumption.
- (On pure states the unitarily invariant metric is Fubini–Study, unique by homogeneity. That is a different uniqueness
  theorem, IMPORTED.)

---

## H10 — Can PRR's sign choice force one time dimension? (weakest; derivation audit)

### Statement
Let each basic direction e_μ "read itself" as e_μ² = +1 or −1 (A1 alphabet).
1. **(IMPORTED, ESTABLISHED)** The real Clifford algebra Cl(p,q) depends on (p − q) mod 8. Cl(3,1) ≅ M₄(ℝ) but Cl(1,3) ≅
   M₂(ℍ), so the sign convention is physical at the spinor level. Pin(3,1) and Pin(1,3) differ and treat P and T
   differently (Lounesto 2001; Berg, DeWitt-Morette, Gwo & Kramer 2001).
2. **(ASSUMED)** Proposed PRR criterion: spinor observables can be represented with real ±1-valued (Majorana) structure,
   i.e. Cl(p,q) ≅ M(ℝ), i.e. p − q ≡ 0, 2 (mod 8). For p + q = 4 this selects only (3,1) and (2,2).
3. **(IMPORTED, Tegmark 1997)** With more or fewer than one time dimension, the field equations lose the hyperbolicity
   needed for prediction. This removes (2,2) and leaves (3,1): three directions squaring to +1 and one to −1.
4. **(ASSUMED)** p + q = 4 itself is put in by hand.

**Label: ANALOGY-ONLY** (the weakest step is the ASSUMED criterion in 2, plus the hand-set dimension and an anthropic-style
import in 3). There is a possible tension with H2: complex Hilbert space is forced, while step 2 asks for real spinor
structure. The two are compatible (a Majorana condition sits inside complex QM), but this must be stated in any lock.

### KILL
Showing that criterion 2 is not motivated by A1, or that it selects more than (3,1) once p + q is not fixed by hand. The
second has already happened (see Computation): with q = 1 the survivors are (1,1), (3,1) and (9,1).

### Computation
- None empirical; it is pure arithmetic, and I did it on sight while drafting (so it is **SEEN**).
- With q = 1, the criterion p − q ≡ 0, 2 (mod 8) means p ≡ 1 or 3 (mod 8). For 2 ≤ p + q ≤ 11 (p ≤ 10), the survivors
  are (1,1), (3,1) and (9,1). (DERIVED)
- **Verdict already determined: KILLED as a forcing claim.** "PRR's sign choice + realness + one time" does not single out
  3+1. Picking p = 3 needs a further IMPORTED input: Tegmark's stability argument against more than three space
  dimensions, and his "no gravity / too simple" argument against fewer. The downgraded claim is "PRR is compatible with
  3+1 and gives the sign convention physical content (Pin(3,1) ≠ Pin(1,3))": ANALOGY-ONLY / REDUCES-TO-KNOWN.
- No lock is needed unless someone proposes a PRR-internal reason for p = 3.

### SEEN
The p + q = 4 rows (instrument, §7).

### PRR-distinctive?
- Not as stated. Every step except the ±1 alphabet is imported or assumed.
- **Numerology flag:** choosing the criterion *after* seeing that it picks (3,1) would be post-hoc. The p + q = 4 table is
  already seen.

---

## 7. What was actually run (instrument/control only), with real outputs
All in the venv `h6plus/venv6` (numpy 2.5.5, numba 0.68.1). Full outputs are in `out_instrument_h6.txt` … `out_instrument_h10.txt`.

**H6** (`code/h6_instrument.py`) — ALL INSTRUMENT CHECKS PASS:
- S_n character orthogonality, n = 2…7: max error 0.
- imm_(1ⁿ) = det, imm_(n) = per, Z_{−1} = (−1)ⁿ det, Z_{+1} = per on Gaussian matrices, n = 2…7: errors ≤ 5×10⁻¹⁴
  (against numpy det and Ryser).
- Σ_π y^{c} equals the rising factorial for n = 1…8 at y ∈ {−1, −2, −3, ½, e^{2πi/3}, i}. E.g. y = −2 gives 0 for n ≥ 3.
- Exhaustive ±1 matrices:
  - n = 2: P(per=0) = 0.5, P(det=0) = 0.5.
  - n = 3: P(per=0) = 0.0000, P(det=0) = 0.6250.
  - E[imm_λ²] = n! exactly for every λ (2 and 6).
  - Kräuter–Seifter divisibility holds (per divisible by 2, det by 2^{n−1}).
- `h6_run.py --smoke` (deterministic all-ones/identity inputs only): OK. Timing on the all-ones n = 10 worst case:
  0.063 s per matrix.

**H7** (`code/h7_ising.py --instrument`):
- Canonical Metropolis Binder U₄ at K = 0.425…0.455:
  - L = 8: 0.5895 … 0.6301.
  - L = 16: 0.5362 … 0.643.
  - L = 32: 0.4342 … 0.6564.
- Crossings: (8,16) at K = 0.4471 (+0.0065 from K_c, small-L correction); **(16,32) at K = 0.4424 (+0.0017)**. The
  proposed gate passes.
- Kawasaki M = 0, L = 16: U_stripe = 0.537 at K = 0.2 (limit 0.5) and 0.997 at K = 0.8 (limit 1.0).
- KW: sinh(2K_c) = 1.0 and the dual of K_c is 0.4406868 (self-dual).

**H8** (`code/h8_berry.py --instrument`). Theory side plus GUE matrices; **no zeta data touched**. My formula reproduces
every number Berry quotes for x = 10¹¹:

| Quantity | Mine | Berry |
|---|---|---|
| L_max | 5.62 | 5.62 |
| Longest wavelength | 35.31 | 35.31 |
| Eq. (23) | 0.4659 | 0.4659 |
| Eq. (21) with sin² = ½ | 0.4663 | 0.4663 |
| Largest prime power at τ* = ¼ | 449 | p^r ≤ 449 |

- The mean of the full formula over L ∈ [200, 1000) is 0.4659.
- Small L: Berry formula [0.0900, 0.2791, 0.3400, 0.4017] against GUE [0.0901, 0.2802, 0.3442, 0.4157] at L = 0.1, 0.5, 1, 2.
- GUE matrices (N = 400, 200 samples, bulk half) give Σ² = [0.2799, 0.3419, 0.4134, 0.4561] against the exact GUE formula
  [0.2802, 0.3442, 0.4157, 0.4571] at L = 0.5, 1, 2, 3.
- (The first GUE run used a wrong semicircle radius, √(2N) instead of 2√N, and failed. It was fixed and re-run; the output
  file is from the fixed run.)

**H9** (`code/h9_petz.py --instrument`): on the radial (classical) direction, SLD = WY = KM = RLD = Fisher 1/(1−r²) at
r = 0, 0.3, 0.9 (1.000000, 1.098901, 5.263158). The tangential direction at r = 0: all equal 1.0. Čencov reproduced.
Tangential values for r > 0 were **not** computed.

**H10** (`code/h10_clifford.py`), p + q = 4:

| Algebra | (p−q) mod 8 | Type | Real 4×4 rep found |
|---|---|---|---|
| Cl(0,4) | 4 | M(ℍ) | no |
| Cl(1,3) | 6 | M(ℍ) | no |
| Cl(2,2) | 0 | M(ℝ) | yes |
| Cl(3,1) | 2 | M(ℝ) | yes |
| Cl(4,0) | 4 | M(ℍ) | no |

Explicit real 4×4 generators were found and verified for Cl(2,2) and Cl(3,1). The search failure for the others is
consistent with the classification but is not itself a proof.

## 8. References (DOIs checked against Crossref on 2026-11-23 unless marked)
- Valiant, Theor. Comput. Sci. 8, 189–201 (1979), 10.1016/0304-3975(79)90044-6 — per #P-complete.
- Valiant, "Completeness classes in algebra", STOC '79, 249–261, 10.1145/800135.804419 — VP/VNP, per VNP-complete.
- Valiant, SIAM J. Comput. 31, 1229–1254 (2002), 10.1137/S0097539700377025 — matchgates.
- Terhal & DiVincenzo, PRA 65, 032325 (2002), 10.1103/PhysRevA.65.032325.
- Troyer & Wiese, PRL 94, 170201 (2005), 10.1103/PhysRevLett.94.170201. The abstract (via Semantic Scholar) confirms the
  NP-hardness claim; the instance caveat is from the paper's construction (arXiv cond-mat/0408370).
- Aaronson & Arkhipov, Theory of Computing 9, 143–252 (2013), 10.4086/toc.2013.v009a004 (STOC'11 version
  10.1145/1993636.1993682).
- Jerrum, Sinclair & Vigoda, J. ACM 51, 671–697 (2004), 10.1145/1008731.1008738.
- Mertens & Moore, Theory of Computing 9, 273–282 (2013), 10.4086/toc.2013.v009a006 (abstract read on the journal site).
- Curticapean, STOC 2021, 1770–1783, 10.1145/3406325.3451124 (abstract read; arXiv 2102.04340). Note that the arXiv
  "Our results" paragraph contains a typo ("iff b(Λ) is unbounded"). The abstract states it correctly: bounded ⇒
  polynomial.
- Bürgisser, SIAM J. Comput. 30, 1023–1040 (2000), 10.1137/S0097539798367880. Cited as part of the series only; I could
  not read the abstract (publisher elided it).
- Hartmann, Linear Multilinear Algebra 18, 127–140 (1985), 10.1080/03081088508817680 (cited as part of the series; content
  not read).
- Barvinok, Funct. Anal. Appl. 24, 144–145 (1990), 10.1007/BF01077707 (cited as part of the series; content not read).
- Bläser & Dell, ICALP 2007, LNCS 4596, 801–812, 10.1007/978-3-540-73420-8_69. Bläser, Dell & Fouz, Comput. Complexity
  21, 359–419 (2011), 10.1007/s00037-011-0018-0. The easy points (0,0), (0,−1), (1,−1) are from the ACM abstract plus
  Kotek–Makowsky–Ravve's survey summary; the paper itself was not read.
- Kräuter & Seifter, Israel J. Math. 45, 53–62 (1983), 10.1007/BF02760670; Linear Multilinear Algebra 15, 207–223 (1984),
  10.1080/03081088408817591. Statements were read via Kräuter's 1983 SLC survey (B09b) and Ingram–Razborov,
  arXiv 2507.09433.
- Tikhomirov, Ann. Math. 191, 593–634 (2020), 10.4007/annals.2020.191.2.6.
- Wang & Hazzard, Nature 637, 314–318 (2025), 10.1038/s41586-024-08262-7.
- Kramers & Wannier, Phys. Rev. 60, 252–262 (1941), 10.1103/PhysRev.60.252.
- Onsager, Phys. Rev. 65, 117–149 (1944), 10.1103/PhysRev.65.117.
- Wegner, J. Math. Phys. 12, 2259–2272 (1971), 10.1063/1.1665530.
- Berry, Proc. R. Soc. A 400, 229–251 (1985), 10.1098/rspa.1985.0078.
- Berry, Nonlinearity 1, 399–407 (1988), 10.1088/0951-7715/1/3/001. The full text was read from Berry's site and is saved
  in `refs/berry175.*`.
- Bogomolny & Keating, Nonlinearity 9, 911–935 (1996), 10.1088/0951-7715/9/4/006; PRL 77, 1472 (1996),
  10.1103/PhysRevLett.77.1472.
- Hess, Zenodo (2026), 10.5281/zenodo.23815327 (checked via DataCite; not peer-reviewed).
- Čencov, Statistical Decision Rules and Optimal Inference, AMS Transl. Math. Monographs 53, 10.1090/mmono/053 (Crossref
  lists 2000 for the reprint; the AMS translation is 1982 and the Russian original 1972).
- Campbell, Proc. AMS 98, 135–141 (1986), 10.1090/S0002-9939-1986-0848890-5.
- Petz, Linear Algebra Appl. 244, 81–96 (1996), 10.1016/0024-3795(94)00211-8.
- Braunstein & Caves, PRL 72, 3439–3443 (1994), 10.1103/PhysRevLett.72.3439.
- Wootters, PRD 23, 357 (1981), 10.1103/PhysRevD.23.357 (from REPORT.md).
- Tegmark, Class. Quantum Grav. 14, L69–L75 (1997), 10.1088/0264-9381/14/4/002 (abstract read).
- Lounesto, Clifford Algebras and Spinors, 2nd ed., CUP (2001), 10.1017/CBO9780511526022.
- Berg, DeWitt-Morette, Gwo & Kramer, Rev. Math. Phys. 13, 953–1034 (2001), 10.1142/S0129055X01000922.
- VP ≠ VNP claim: hexagonmath.org/2611.00954v1 (as relayed; **not human-verified**). It is not used as a premise.
