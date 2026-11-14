# LOCKED: single-factor control follow-up (F1) for consequence-atlas legacy cards
Lock stamp: 2026-11-14 13:18:15 -0600 (America/Regina). Written BEFORE any F1 run. No F1 result has been seen.
Engine: starter 3.0.0, engine/starter/src/engine.ts sha256 8487a8d2b8c7cfdd28a5487c32d7fac93c29e57b8f8bcd108a7141767264667d. Runner: engine/starter/cli/run-card.ts.

## Scope
A. Child cards. For every card under cards/starter/recipe-vs-baseline-*/ and dead-ends/starter/recipe-vs-baseline-*/ (70 parents), let K = settings where the test differs from its family-baseline control (seed excluded). For each k in K make one child card: test = parent test settings; control = parent test settings with k set to the baseline value (leave-one-out). Exactly one setting differs. Factors size, steps, dim, popN would violate the fair-control rule (same size and steps) and are skipped; none occur in K.
B. Null arms for the 21 legacy single-factor cards (cards/ and dead-ends/, factor folders other than recipe-vs-baseline-*): add the same null arm. Post hoc: the legacy outcome is already known, so the null can only demote.

## Arms (every child, and the null for B)
- test and control at full size and at half size (v3 half rule: Q halves steps, M halves popN in pop mode else steps, others halve size), seeds 1-5;
- null: control settings at full size, seeds 6-10 (seed-shuffled A/A null: a fresh random start and fresh noise under identical rules). It catches statistic artifacts. It is not a label shuffle; a rule-level shuffle is not definable generically in this engine.

## Measures and test
Family primary measures exactly as the v3 sweep (P: density, clustering, dS; F: density, xi, energy; Q: beta, sigma (+entropy if qn = 1); C: density, activity, dS (Potts: domFrac, walls); G: S/Sref, dipRel; M pop: fitEnd, fitSlope).
z = d / sqrt(sdA^2/5 + sdC^2/5). Bonferroni over the card's k measures: pass iff two-sided p < 0.0027/k.
Deterministic comparison (both arms SE = 0): pass iff |d| >= 1e-3 * max(|mean control|, 1e-12) (min_effect; fixes the v3 SE = 0 artifact). z is then reported as null.
Best measure = smallest corrected p at full size.

## Labels (ceiling DIFFERS; no self-promotion)
1. INERT-BY-CONSTRUCTION: test and control outputs byte-identical at every seed at both sizes.
2. DEAD-END: the null (null vs control, best measure, uncorrected 3 sigma or the deterministic min_effect rule) differs.
3. DIFFERS: full size passes, half size passes on the same measure with the same sign, null clean, Benjamini-Hochberg q <= 0.05 within the family (engine + changed factor, including legacy single-factor cards in that family, recomputed), and an independent run-card rerun reproduces every output hash.
4. FAILED: anything else (null result, one size only, or fails BH).
Legacy single-factor cards in a family are re-scored by the same rules (their data plus the new null arm); they can only stay or go down.

## Parents
A parent recipe card's control changes more than one setting, so it is not a fair control. A parent labelled DIFFERS becomes REPRODUCED (its outputs reproduce exactly, but it has no fair control). Its notes list its children and which of them DIFFER. FAILED parents stay FAILED. Fair claims live on the children.
