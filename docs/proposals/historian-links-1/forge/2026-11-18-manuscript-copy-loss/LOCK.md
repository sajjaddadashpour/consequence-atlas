# LOCK: manuscript survival vs copy number (Historian, 2026-11-18)

Status: LOCKED pre-data, 2026-11-18 20:15 America/Regina. No analysis code has been written or run. Individual tail counts f3, f4, … have not been computed. Not pushed.
This finalises the draft at docs/proposals/historian-links-1/forge/2026-11-18-manuscript-copy-loss/LOCK_DRAFT.md (historian-links-1, 02f74f6).

Shared definition cited: /workspace/physics/forge/2026-11-18-shared-copy-decay-def/DEFINITION.md, commit 349ca7f ("Shared definition: copy-vs-decay persistence (v1)", Physicist). Amendment 1 (shared 2× tolerance, commit d7f9e2f) is adopted by reference. Terms below (record, L, copy event, u, U, sigma, U_eff < ln(sigma), barrier-held / upkeep-held) are used exactly as defined there. Amendment 1 applies only if a U_eff threshold test later becomes possible; it does not loosen the r or dAIC rules in §6.

Labels used: established / mainstream hypothesis / CONJECTURE.
Verdicts used: SURVIVED / KILLED / REDUCES-TO-KNOWN / NOT-TESTABLE-YET, plus MIXED as defined in §6 (an explicit extra verdict; the draft used MIXED, and it is kept and defined rather than silently mapped).

## 1. Data: public? what does it measure? (re-checked 2026-11-18)

- Paper: Kestemont et al. 2022, *Science* 375(6582):765–769, doi:10.1126/science.abl7655 (Crossref metadata and abstract read).
- Data and code: PUBLIC. GitHub mikekestemont/forgotten-books, commit 5726755d1fb7547fcb2cddcb6ed924690646f527 (2024-04-15), licence CC BY-SA 4.0. Archived on Zenodo, doi:10.5281/zenodo.5947206 (the DOI redirected to https://zenodo.org/record/5947206 this session; the Zenodo file inventory itself returned 403 from this box, so file names were verified from the GitHub commit and the local clone at that exact hash, not from a fresh Zenodo listing).
- Official data files for this lock, all present at that commit under `datasets/master/`, each a one-sheet `.xlsx` whose first-row header is exactly `title`, `signature`, `repository`:
  - `datasets/master/dutch.xlsx`
  - `datasets/master/english.xlsx`
  - `datasets/master/french.xlsx`
  - `datasets/master/german.xlsx`
  - `datasets/master/icelandic.xlsx`
  - `datasets/master/irish.xlsx`
- Present at the same commit but not part of the six-tradition test: `datasets/master/anglo-norman.xlsx` (same three headers; the paper's main table leaves Anglo-Norman out, as does `notebooks/analysis.ipynb`). Also present and unused here: `datasets/abundance.rds`; `datasets/geolocated/{dutch,english,french,german}.xlsx`; notebooks and `outputs/*`.
- Content: one row per surviving manuscript. NOT in the data: dates, places of copying, stemmata, text, variant readings, copy-source pairs. So, per DEFINITION 349ca7f, u cannot be measured here: "u … must be measured from copy-source pairs, not from survival outcomes."
- Counting rule (locked, from `notebooks/analysis.ipynb`, not re-run): `pd.read_excel(path, engine="openpyxl").dropna(subset=["title"])`. Each remaining row is one document. A work's copy count k is the number of remaining rows with that exact `title` string. S is the number of distinct titles; n is the number of remaining rows; f_k is the number of titles with exactly k rows.
- Gate, using the already-disclosed published aggregates in `outputs/results.txt` (read before the draft, repeated here as the gate only). After counting, these must match exactly, or the run stops and the overall verdict is NOT-TESTABLE-YET:

  | tradition  | f1 | f2 | S   | n    |
  |------------|----|----|-----|------|
  | dutch      | 45 | 13 | 75  | 167  |
  | english    | 42 |  8 | 69  | 176  |
  | french     | 90 | 21 | 222 | 1473 |
  | german     | 36 | 19 | 128 | 1088 |
  | icelandic  | 44 | 28 | 117 | 295  |
  | irish      | 69 | 54 | 188 | 449  |

- Disclosure: I have read the column names, the counting method, and that published summary table (f1, f2, S, n, Chao1 work survival CH1, document survival MS per tradition). Those aggregates already hint at how a geometric-shape test on the full distribution would come out, so a test that can be decided from f1, f2, S, n alone is NOT blind. Only the individual tail counts f3, f4, … (not published, not computed by me) are blind. See §5.

## 2. Mapping onto DEFINITION 349ca7f

- Record: one medieval narrative work. Unit: word. L: work length in words. NOT in this dataset; would need editions.
- Copy event: one scribal copy made from an existing exemplar. One generation = one copy step in the stemma. The dataset gives only the surviving end-products of copy events, not the events.
- u: UNMEASURED (no copy-source pairs). U = u*L: UNMEASURED. u_eff: UNMEASURED (no data on correction practice).
- sigma: not fixed a priori and not measurable independently of survival from these data. Using survival counts to set sigma would make the test void under the definition's own rule.
- Threshold U_eff < ln(sigma): NOT-TESTABLE-YET with this dataset. Needed: collations of copy-source pairs (Priest's item 5 statistic, variants per 1,000 words per independent copy = 1000*u), plus an a priori sigma.
- Barrier vs upkeep class: a parchment codex is a physical object (predicted barrier-held); a work as content survives only if some codex survives or it is recopied (upkeep-held as a lineage). The storage-condition lifetime τ for parchment is still an empty slot: the only published extrapolated lifetime I have verified (Budrugeac 2009, L = 41,200 years at 40 °C for 2.25% mass loss) is for high-T thermo-oxidation, which the author says is not the main natural-ageing path; Badea et al. 2012 give accelerated T/RH outcomes but no Arrhenius fit and no ambient lifetime (see /workspace/historian/parchment-row.md). This classification is therefore ASSUMED and is not used in any kill rule below.

This copy-number test uses no u, U or sigma, so by 349ca7f it is a field-internal test and cannot count toward "same law".

## 3. Models (shape of the per-work abundance distribution)

- M0, no-copying null: independent exemplars, each surviving independently → zero-truncated Poisson, one parameter λ. Mean among observed works is λ / (1 − e^{−λ}).
- M1, simple copy-loss: one autograph, copies from copies at rate lambda, each lost at rate mu (linear birth-death, Kendall 1948, *Ann. Math. Statist.* 19(1):1–15, doi:10.1214/aoms/1177730285), then independent later loss → zero-truncated geometric (negative binomial with shape r = 1). The geometric is written on {1, 2, …}: P(K = k) = (1 − p)^{k−1} p, mean 1/p. [The derivation of this shape from Kendall's generating function is to be written out in the run; it is not re-derived here. If that derivation fails, M1's geometric form is reclassified as ASSUMED and the run still proceeds, but a SURVIVED cannot be called DERIVED from Kendall.]
- M2, flexible: zero-truncated negative binomial with shape r > 0 and a second parameter (r = 1 is M1; r → ∞ is M0).

Likelihood, for every model: the product over works of P(K = k_j | K ≥ 1). AIC = 2k − 2 ln L, with k = 1 for M0, k = 1 for M1, k = 2 for M2. Define dAIC := AIC(M0) − AIC(M1); a value ≥ 10 means M1 beats M0 by the usual Burnham–Anderson margin.

Profile-likelihood 95% CI for r from M2: r values satisfying 2(ℓ(r̂, θ̂) − ℓ(r, θ̂(r))) ≤ 3.841 (the 0.95 quantile of χ²_1), where θ is the other NB parameter. Use a numerical grid or a bracketed search; report the interval endpoints.

## 4. Software and seeds (fixed)

- Software: Python 3, with pandas, openpyxl, numpy and scipy. MLE and profile likelihood via `scipy.optimize`. The `copia` package is not required (it was used by Kestemont for Chao1, which is not this test). An equivalent R implementation of the same models and the same CI/AIC definitions is acceptable if the gate in §1 still passes.
- Six traditions, in this locked order: dutch, english, french, german, icelandic, irish.
- Calibration seed stream: for tradition index t = 0…5 in that order and simulation s = 0…999, use `numpy.random.Generator(numpy.random.PCG64(20261118 + (t + 1) * 10000 + s))`. N_cal = 1000 datasets per tradition. No other random numbers are used in the official test.
- Calibration design (uses only already-disclosed S and n/S, not f3+): under M1, set p = S/n so that the geometric mean is the published n/S. Draw S independent copies from that zero-truncated geometric, fit M2, and ask whether the 95% profile CI for r contains 1. A tradition passes calibration if that coverage is ≥ 85% (at least 850 of 1000). A tradition that fails is NOT-TESTABLE-YET and casts neither a kill vote nor a survive vote in §6.

## 5. Two tests: full sample (partly leaked) and k ≥ 3 (blind)

The official majority rule in §6 is evaluated twice.

- Full-sample test: fit M0, M1 and M2 to the whole abundance distribution of all titled works, including f1 and f2. This is the usual statistical object, but f1, f2, S and n were already seen, so it is only partly blind.
- Blind k ≥ 3 test: repeat the same M0 / M1 / M2 fits and the r CI / dAIC comparison using only works with k ≥ 3 copies (the distribution is then truncated at 3, not at 0; M0/M1/M2 are the same families conditioned on K ≥ 3). f1 and f2 do not enter the likelihood. This is the test that "only works with ≥ 3 copies blind." If a tradition has fewer than 10 works with k ≥ 3, that tradition is NOT-TESTABLE-YET for the blind test (the threshold 10 is locked; the k ≥ 3 counts have not been computed and must not be inspected before the run).

Chao1 uses only f1, f2 and S and is not this test. A secondary diagnostic, not a kill statistic, may compare same-repository co-location of copies of one work, using the `repository` column in the master files, against a permutation null; it cannot separate copying lineage from later collecting.

## 6. Kill / survive rules (numeric, fixed in advance)

Applied separately to the full-sample test and to the blind k ≥ 3 test, among the six named traditions. A tradition that failed calibration, failed the k ≥ 3 minimum, or cannot return a finite profile CI is NOT-TESTABLE-YET and is not a vote.

Let N_ok be the number of traditions that remain testable (0–6).

- If N_ok < 4, the overall verdict for that test is NOT-TESTABLE-YET (a 4-of-6 rule cannot be met).
- M1 is KILLED if the 95% profile CI for r excludes 1 in ≥ 4 of the 6 named traditions.
- M1 is SURVIVED if that CI contains 1 in ≥ 4 of the 6 and M1 beats M0 by dAIC ≥ 10 in ≥ 4 of the 6.
- Otherwise MIXED: neither the KILLED rule nor the SURVIVED rule was met (for example 3 and 3, or the CI rule is met but dAIC is not). MIXED is an allowed overall verdict for this lock. It is not mapped to KILLED, SURVIVED, or NOT-TESTABLE-YET.
- Even a SURVIVED is recorded as REDUCES-TO-KNOWN (Kendall 1948 birth-death; Simon 1955 proportional growth, doi:10.1093/biomet/42.3-4.425). It does not count toward "same law" under 349ca7f.
- The two tests may disagree. If they do, report both. The blind k ≥ 3 verdict is the one that may be called a test of unseen tail counts. The full-sample verdict is reported as a leaked, comparable check.

The error-threshold part (U_eff < ln(sigma)) remains NOT-TESTABLE-YET (§2). Whether copying outpaced loss (lambda > mu) is probably not separable from later loss in end-state counts; that is CONJECTURE until derived in the run, and if the derivation confirms non-identification it is also NOT-TESTABLE-YET. Needed for that: manuscripts dated by century.

## 7. Run order

1. Counting script on the six official files, with the §1 rule.
2. Gate: f1, f2, S, n must match the table in §1 exactly. If not, stop; NOT-TESTABLE-YET.
3. Calibration (§4), before any real f3+ is used in a likelihood.
4. Full-sample fits, then blind k ≥ 3 fits, then §6.
5. No widening of "reading," no fitting of sigma from survival, and no use of f3+ before step 3.

No code for those steps is included in this commit.
