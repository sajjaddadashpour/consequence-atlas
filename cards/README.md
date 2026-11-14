# cards/

One folder per experiment card: `cards/<engine>/<factor>/<card-id>/`, holding `card.json` (validated by `schema/card.schema.json`) and `outputs.json` (the raw per-run outputs that `runs[].output_uri` points into: `A`/`Ah` = test full/half size, `C`/`Ch` = control full/half, `N` = null arm). Only `card.json` is a card.

`<factor>` is exactly `control.changed_factor` (case-sensitive, e.g. `measT`, `dephT`, `H`, `J`). Recipe cards whose control is the family baseline, with several settings changed at once, live in `recipe-vs-baseline-<family>`. False-discovery correction runs per family = engine version + factor.

Labels here: CONJECTURE, REPRODUCED and DIFFERS. FAILED, DEAD-END and INERT-BY-CONSTRUCTION cards live in `dead-ends/`. Toy universes show mechanisms. They never predict chemistry or life.

## Legacy recipe cards (v3 origins sweep), now REPRODUCED
The 41 recipe cards that were DIFFERS in content v0 are now **REPRODUCED**. Their outputs reproduce exactly, but their control changes several settings at once, so it is not a fair control. They are still legacy (`null_settings` NOT-RUN). Each one's notes list its single-factor children.

## Single-factor follow-up F1 (lock 2026-11-14 13:18:15 −0600, `docs/locks/LOCKED_SINGLE_FACTOR_F1.md`)
For every recipe card (70 parents) and every setting where its test differs from the baseline, a child card was made whose control is the parent's test with only that setting reset (307 children). Each child ran 25 runs: test and control at full and half size with seeds 1–5, plus a null arm (control settings, seeds 6–10, a seed-shuffled A/A null). The 21 legacy single-factor cards got the same null arm, added post hoc. All 328 cards (8,200 runs) reproduced byte for byte in an independent `run-card` rerun.

F1 local verdicts: **85 children DIFFERS**, 179 FAILED, 41 INERT-BY-CONSTRUCTION, 2 DEAD-END (the null arm failed). The 13 legacy single-factor DIFFERS cards all kept the DIFFERS verdict, and the 8 legacy FAILED stayed FAILED.

**Why the DIFFERS verdicts are labelled CONJECTURE.** A card with a real null arm is not legacy, and the repo rule is that only the gate checker may put a non-legacy card above CONJECTURE. So these 98 cards (85 children and 13 legacy single-factor cards) carry `label: CONJECTURE`. Their notes say "F1 local verdict: DIFFERS", and `novelty.known_mechanism` is filled in. The gate checker should rerun and sign them.

| changed factor | children | DIFFERS | FAILED | INERT | DEAD-END |
|---|---|---|---|---|---|
| `records` | 42 | 5 | 37 | 0 | 0 |
| `a2` | 39 | 0 | 1 | 38 | 0 |
| `leak` | 39 | 0 | 39 | 0 | 0 |
| `light` | 37 | 2 | 35 | 0 | 0 |
| `start` | 19 | 12 | 7 | 0 | 0 |
| `temp` | 11 | 6 | 4 | 1 | 0 |
| `ncons` | 10 | 10 | 0 | 0 | 0 |
| `pc` | 9 | 9 | 0 | 0 | 0 |
| `expand` | 7 | 5 | 1 | 0 | 1 |
| `pr` | 6 | 0 | 6 | 0 | 0 |
| `rule` | 5 | 3 | 2 | 0 | 0 |
| `noise` | 5 | 3 | 1 | 1 | 0 |
| `alphabet` | 5 | 2 | 3 | 0 | 0 |
| `feedback` | 5 | 4 | 1 | 0 | 0 |
| `attract` | 5 | 5 | 0 | 0 | 0 |
| `d3` | 4 | 2 | 2 | 0 | 0 |
| `H` | 4 | 0 | 3 | 0 | 1 |
| `cstart` | 3 | 0 | 3 | 0 | 0 |
| `rho` | 3 | 1 | 2 | 0 | 0 |
| `forget` | 3 | 2 | 1 | 0 | 0 |
| `gamma` | 3 | 0 | 3 | 0 | 0 |
| `grow` | 3 | 2 | 1 | 0 | 0 |
| `sched` | 3 | 2 | 1 | 0 | 0 |
| `life` | 2 | 1 | 1 | 0 | 0 |
| `fstart` | 2 | 0 | 2 | 0 | 0 |
| `gauge` | 2 | 2 | 0 | 0 | 0 |
| `nlight` | 2 | 0 | 2 | 0 | 0 |
| `jr` | 2 | 2 | 0 | 0 | 0 |
| `J` | 2 | 0 | 1 | 1 | 0 |
| `ncyc` | 2 | 0 | 2 | 0 | 0 |
| `pa` | 2 | 0 | 2 | 0 | 0 |
| `c` | 2 | 0 | 2 | 0 | 0 |
| `beta` | 1 | 1 | 0 | 0 | 0 |
| `gnoise` | 1 | 1 | 0 | 0 | 0 |
| `gstart` | 1 | 1 | 0 | 0 | 0 |
| `rcode` | 1 | 0 | 1 | 0 | 0 |
| `gs` | 1 | 0 | 1 | 0 | 0 |
| `rsp` | 1 | 0 | 1 | 0 | 0 |
| `rev` | 1 | 0 | 1 | 0 | 0 |
| `bias` | 1 | 0 | 1 | 0 | 0 |
| `c2` | 1 | 0 | 1 | 0 | 0 |
| `open` | 1 | 0 | 1 | 0 | 0 |
| `pedge` | 1 | 0 | 1 | 0 | 0 |
| `attention` | 1 | 0 | 1 | 0 | 0 |
| `satt` | 1 | 0 | 1 | 0 | 0 |
| `holes` | 1 | 0 | 1 | 0 | 0 |
| `hfill` | 1 | 1 | 0 | 0 | 0 |
| `qn` | 1 | 0 | 1 | 0 | 0 |
| `qent` | 1 | 0 | 1 | 0 | 0 |
| `deph` | 1 | 0 | 1 | 0 | 0 |
| `dephT` | 1 | 1 | 0 | 0 | 0 |

What this says: the effects in the recipes come mostly from `ncons`, `pc`, `start`, `attract`, `temp` and `expand`. The PRR-flavoured settings rarely carry them: `a2` (the A2 veto) is byte-identical to its control in 38 of 39 recipes, because the lattice never empties; `leak` never matters (0/39); `records` matters in 5 of 42.
