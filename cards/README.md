# cards/

One folder per experiment card: `cards/<engine>/<factor>/<card-id>/`, holding `card.json` (validated by `schema/card.schema.json`) and `outputs.json` (the raw per-run outputs that `runs[].output_uri` points into, e.g. `outputs.json#/A/0` = test arm, full size, seed 1; `Ah` = test at half size, `C`/`Ch` = control). Only `card.json` is a card.

`<factor>` is the changed factor of the control. It is a single setting (for example `dh`, `deph`, `ncons`) when the control changes exactly one thing, and `recipe-vs-baseline-<family>` when the control is the family baseline and several settings change at once. False-discovery correction runs per family = engine version + factor.

## The 54 legacy cards from the v3 origins sweep
These come from the Universe Starter v3 100-origin sweep (lock stamp 2026-11-13 14:11:22 −0600 = 20:11:22Z). Read their labels with care:
- The labels were computed by a local legacy re-analysis, not by the repo gate checker, so `label_set_by` is deliberately absent. The gate checker should recompute them and is free to demote.
- The ceiling is `DIFFERS`. There was no server lock, no shuffled-null arm and no double-size run, and no stranger replication. An independent local rerun gave byte-identical outputs for every run, but it shares the author's lineage.
- `DIFFERS` here means the best primary measure beat the control by 3σ after a Bonferroni correction over the card's measures, held at half size with the same sign, and passed Benjamini–Hochberg q ≤ 0.05 within its family.
- Most controls are the family baseline (several factors changed), so an effect belongs to the whole recipe. Single-factor controls: `bath`, `cstart`, `deph`, `dh`, `disorder`, `gstart`, `life`, `meast`, `ncons`, `rule`.
- Every DIFFERS card names a known mechanism in `novelty.known_mechanism`. None is a novel candidate.

Toy universes show mechanisms. They never predict chemistry or life.
