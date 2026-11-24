# H6 LOCK — the cycle weight −1 (sign homomorphism) vs "cancellation makes it easy"
Locked by Physicist, 2026-11-23 ~21:30 CST. Source: seen/PROPOSALS.md §H6 (sha256 01685e6c…5de05), Mathematician.
Code: code/h6_run.py + code/symn.py, BYTE-IDENTICAL to Mathematician's (sha256 in README). No change.
Run (Mathematician, from code/): `<venv6 python> h6_run.py --locked-commit <this commit>` → out/h6_result.json.

## 1. Claims and labels (by weakest step)
| # | Claim | Tag |
|---|---|---|
| 1 | Σ_π y^{c(π)} = y(y+1)…(y+n−1); zeros at y = 0, −1, …, −(n−1); on |y|=1 only y = −1 | DERIVED (Stirling numbers of the 1st kind; checked n=1..8, SEEN) |
| 2 | Z_{+1} = per, Z_{−1} = (−1)^n det | DERIVED |
| 3 | Z_y is #P-hard except at y ∈ {0, −1} (x=0 line of the Chung–Graham cover polynomial; easy points (0,0),(0,−1),(1,−1)) | IMPORTED (Bläser–Dell 2007; Bläser–Dell–Fouz 2011). **Verified from abstracts only** — see §6 |
| 4 | Z_{−2}: ⊕P-hard; Z_{−k}, k>2: #P-hard, even for planar adjacency matrices | IMPORTED (Mertens–Moore 2013) |
| 5 | Immanant complexity governed by b(λ) = n − #parts: bounded ⇒ P; unbounded ⇒ not P unless FPT = #W[1]; poly-growing ⇒ #P/VNP-hard | IMPORTED (Curticapean 2021) |
| 6 | **The slogan "exact cancellation makes evaluation easy" is KILLED**: the uniform average vanishes at y = −2…−(n−1) (claim 1), all #P-hard (claims 3–4); and Σ_π χ_λ(π) = 0 for every λ ≠ (n) while complexity varies with b(λ) | DERIVED from 1, 3, 4, 5. Verdict already decided; not a run outcome |
| 7 | What singles out −1: (−1)^{n−c(π)} = sgn(π) is a group character S_n → {±1} ⇒ det multiplicative ⇒ Gaussian elimination | DERIVED (multiplicativity) + IMPORTED (elimination) |
| 8 | T1/T2 numerical conjecture (§3) | CONJECTURE — the only unseen outcome |
| 9 | PRR link ("A1's −1 matters as the sign homomorphism") | ANALOGY-ONLY |

Label of H6 as a whole: **CONJECTURE** (math, via T1/T2); **PRR link ANALOGY-ONLY**.
H6 does NOT depend on the unrefereed VP ≠ VNP claim (hexagonmath 2611.00954); every step uses older refereed results.

## 2. SEEN DATA (declared; Mathematician ran these before the lock)
- seen/out_instrument_h6.txt (sha256 b3c25ba1…a669eab): character orthogonality n=2..7 (err 0); imm/det/per/Z identity checks (err ≤ 5e-14);
  rising-factorial identity n=1..8; exhaustive ±1 matrices n=2,3 (P(per=0), P(det=0), E[imm²]=n!, Kräuter–Seifter divisibility);
  `--smoke` OK; timing n=10 ≈ 0.063 s/matrix.
- None of these touches the T1/T2 ensembles (0/1 Bernoulli, seeds below). No T1/T2 statistic has been computed by anyone.

## 3. Locked procedure (exactly as PROPOSALS §H6 and h6_run.py)
- **Instrument gate:** Z_{−1}(J) = 0 and Z_{−1}(A) = (−1)^n det A on 3 random 0/1 matrices per n (rng seed 1). Failure prints "VOID".
- **T1 ensemble:** iid Bernoulli(½) 0/1 (not ±1). n = 6,7,8,9 with N = 2000, n = 10 with N = 500. Seed `default_rng(20261123+n)`.
  per = 0 matrices discarded and counted. θ_k = kπ/12, k = 0..12. Statistic: median of log(|Z_{e^{iθ}}|/per), exact zeros kept as −∞.
  Mean field m_n(θ) = Re[logΓ(n+y) − logΓ(y) − logΓ(n+1)], y = e^{iθ}.
  - T1a: |median − m_10(θ_k)| ≤ 0.5 nat for all k = 0..10 at n = 10.
  - T1b: for each n ∈ {8,9,10}: median(π) < median(θ_k) for every k = 0..11, AND the upper end of the percentile-bootstrap
    95% CI (1000 resamples of matrices, seed `7+n`) of median(π) − median(11π/12) is < 0.
- **T2 ensemble:** n = 7, 8, 9; N = 2000 0/1 matrices each, seed `20261123+100+n`; every λ ⊢ n.
  R_λ = imm_λ² / E[imm_λ²], E[imm_λ²] = n!·imm_λ(I+J)/(d_λ 4^n) (DERIVED). Statistic: Spearman ρ between b(λ) and median log R_λ
  over λ ≠ (n): **14 / 21 / 29 partitions at n = 7 / 8 / 9**. CI: percentile bootstrap, 1000 resamples of matrices,
  seed `99+n`, 2.5/97.5 nanpercentiles. **Decisive n = 9 only**; n = 7, 8 are reported, not scored.
  - PASS |ρ| ≤ 0.6; FAIL |ρ| > 0.6 and CI excludes 0; else AMBIGUOUS.

## 4. Verdict mapping (fixed)
| Outcome | Verdict |
|---|---|
| instrument gate fails ("VOID" in the code) | **NOT-TESTABLE-YET** (instrument). "VOID" is not house vocabulary; this lock maps it. |
| T1b fails | **KILLED** — "the mirror is not the point of maximal typical cancellation" |
| T2 FAIL | **KILLED** (decoupling) — report prominently: this is the *PRR-friendlier* surprise ("cancellation tracks tractability") |
| T2 AMBIGUOUS, or T1a fails | **NOT-TESTABLE-YET** |
| otherwise | **SURVIVED** (math conjecture); PRR-level **REDUCES-TO-KNOWN** |
Claim 6 (slogan) is **KILLED** independent of the run. NOT-TESTABLE-AS-DEFINED: not used.

## 5. Notes / weaknesses fixed in advance
- Order of checks is the code's: T1b before T2. T1a failing alone gives NOT-TESTABLE-YET, never KILLED.
- If median log R_λ is −∞ for some λ (more than half exact zeros) Spearman ranks it lowest; a NaN ρ ⇒ AMBIGUOUS ⇒ NOT-TESTABLE-YET.
- No parameter in §3 may be changed after this commit. Any rerun with other seeds is exploratory and cannot change the verdict.

## 6. Citation checks (2026-11-23, by Physicist)
- Valiant, Theor. Comput. Sci. 8, 189 (1979) — Crossref OK. Valiant, STOC '79, 249–261 — OK.
- Bläser & Dell, ICALP 2007, LNCS 4596, 801–812 — Crossref OK; **abstract read**: "#P-hard in almost the whole plane … only three points are easy".
  Bläser, Dell & Fouz, Comput. Complexity 21, 359–419 (2012; online 2011) — abstract read: three easy points (cover polynomial),
  two (geometric version), Turing reductions; the abstract speaks of the "(weighted) number" of covers.
  **Not read: the paper body.** The exact point list (0,0), (0,−1), (1,−1) is taken from Mathematician + secondary summaries.
  **Unverified and flagged:** (i) whether hardness is proven for complex y (T1 scans the unit circle — PROPOSALS' "among all y ∈ ℂ"
  over-reaches what I verified); (ii) whether hardness holds for simple unweighted 0/1 digraphs or needs weights/multigraphs.
  Neither affects T1/T2 (they are numerical on 0/1 matrices), only the wording of claim 3.
- Mertens & Moore, Theory of Computing 9, 273 (2013) — abstract read; supports claim 4 (⊕P at k = 2 only, not #P).
- Curticapean, STOC 2021, 1770–1783 (arXiv 2102.04340) — abstract read; b(λ) = boxes right of the first column = n − #parts. OK.
