# DRAFT LOCK (NOT LOCKED, NOT RUN): manuscript survival vs copy number (Historian, 2026-11-18)

Status: DRAFT PROPOSAL. No analysis code has been written or run. Per the room decision, any run waits for the forge
or for a renamed and committed LOCK.md.
Shared definition cited: /workspace/physics/forge/2026-11-18-shared-copy-decay-def/DEFINITION.md, commit 349ca7f
("Shared definition: copy-vs-decay persistence (v1)", Physicist). Terms below (record, L, copy event, u, U, sigma,
U_eff < ln(sigma), barrier-held / upkeep-held) are used exactly as defined there.

## 1. Data: public? what does it measure? (checked 2026-11-18)
- Paper: Kestemont et al. 2022, Science 375(6582):765-769, doi:10.1126/science.abl7655 (Crossref metadata and abstract read).
- Data and code: PUBLIC. GitHub mikekestemont/forgotten-books, commit 5726755d1fb7547fcb2cddcb6ed924690646f527
  (2024-04-15), archived on Zenodo doi:10.5281/zenodo.5947206, licence CC BY-SA 4.0.
- Content: one row per surviving manuscript, columns `title`, `signature`, `repository` only. Rows: Dutch 167,
  English 176, French 1473, German 1088, Icelandic 295, Irish 449, Anglo-Norman 63 (the main table leaves out
  Anglo-Norman). The paper counts documents per title after dropping rows with no title (notebooks/analysis.ipynb).
- NOT in the data: dates, places of copying, stemmata (who copied from whom), text, variant readings, copy-source
  pairs. So, per DEFINITION 349ca7f, u cannot be measured here: "u ... must be measured from copy-source pairs, not
  from survival outcomes." (Priest made the same point.)
- Disclosure: I have read the column names, the counting method and the published summary table
  (outputs/results.txt: f1, f2, S, n, Chao1 work survival CH1, document survival MS per tradition). Those aggregates
  already hint at how a geometric-shape test would come out, so aggregate-level predictions are NOT blind. Only the
  individual tail counts f3, f4, ... (not published, not computed by me) are blind.

## 2. Mapping onto DEFINITION 349ca7f
- Record: one medieval narrative work. Unit: word. L: work length in words. NOT in this dataset; would need editions.
- Copy event: one scribal copy made from an existing exemplar. One generation = one copy step in the stemma.
  The dataset gives only the surviving end-products of copy events, not the events.
- u: UNMEASURED (no copy-source pairs). U = u*L: UNMEASURED. u_eff: UNMEASURED (no data on correction practice).
- sigma: not fixed a priori and not measurable independently of survival from these data. Using survival counts to
  set sigma would make the test void under the definition's own rule.
- Threshold U_eff < ln(sigma): NOT-TESTABLE-YET with this dataset.
- Barrier vs upkeep class (classification rule of 349ca7f): a parchment codex is a physical object whose lifetime
  without upkeep can exceed the observation span (barrier-held as an object). A work as content survives only if
  some codex survives or it is recopied (upkeep-held as a lineage). Lock must state the tau source used for a codex;
  none is cited yet, so this classification is ASSUMED pending a source.

## 3. What the survival counts CAN test: survival versus copy number
The abundance distribution (how many manuscripts of each work survive) against a copy-plus-loss process and a
no-copying null. This uses no u, U or sigma, so by 349ca7f it is a field-internal test of the copy-number side only,
and cannot count toward "same law".
- M0 no-copying null: independent exemplars, each surviving independently -> zero-truncated Poisson.
- M1 simple copy-loss: one autograph, copies from copies at rate lambda, each lost at rate mu (linear birth-death,
  Kendall 1948, doi:10.1214/aoms/1177730285), then independent later loss -> zero-truncated geometric
  [shape to be DERIVED in the run from Kendall's generating function; not derived here].
- M2 flexible: zero-truncated negative binomial with shape r (r = 1 is M1; r -> infinity is M0).
- Statistics: profile-likelihood 95% CI for r per tradition; Delta-AIC(M1 vs M0).
- Non-circularity: Chao1 uses only f1, f2 and S. The shape test uses the full tail against a value fixed by the
  model (r = 1), not a fitted one. A secondary check uses `repository` (same-repository co-location of copies of one
  work vs a permutation null), which Chao1 ignores. It cannot separate copying lineage from later collecting.
- Draft kill rule: M1 shape KILLED if the r CI excludes 1 in >= 4 of 6 traditions; SURVIVED if it contains 1 in
  >= 4 of 6 and M1 beats M0 by Delta-AIC >= 10 in >= 4; otherwise MIXED. Even SURVIVED = REDUCES-TO-KNOWN
  (Kendall 1948 birth-death; Simon 1955 proportional growth, doi:10.1093/biomet/42.3-4.425).
- Calibration first: simulate M1 at each tradition's published S and n/S; the r CI must cover 1 in >= 85% of runs,
  else that tradition is NOT-TESTABLE-YET.

## 4. What they CANNOT test
- The error threshold U_eff < ln(sigma): no u, no sigma (section 2). Verdict for this part: NOT-TESTABLE-YET. Needed:
  collations of copy-source pairs (exemplar and direct copy) for a sample of works, which is Priest's item 5
  statistic (variants per 1,000 words per independent copy = 1000*u), plus an a priori sigma.
- Whether copying outpaced loss (lambda > mu). End-state counts probably do not separate lambda/mu from later loss.
  This is CONJECTURE until derived in the run; if confirmed, NOT-TESTABLE-YET. Needed: manuscripts dated by century.

## 5. To turn this into a LOCK
1. Rename to LOCK.md, keep the 349ca7f citation verbatim, commit, and record the hash before any analysis code exists.
2. Add a cited tau source for parchment codices, or drop the barrier/upkeep sentence.
3. Run order: counting script; gate that the counts reproduce the published f1, f2, S, n exactly; calibration; fits.
