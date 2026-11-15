# LOCKED: Records and memory require stable atoms (atlas engine revision)

Locked 2026-11-14 21:50 CST by Physicist, approved in principle by Sajjad (room answer "Yes, Physicist should prepare the records-and-memory revision"). Written before any code was changed or run.

## Problem (found in the 10-set site test, Pass 33)
`s10.records` required only `s01.predictable-laws`. With `dimensions = 4` (orbits FAIL, every matter stage BLOCKED) it still read PASS: records with nothing to write them in.

## Rule (the only change)
`s10.records.requires` becomes `[s01.predictable-laws, s04.stable-atoms]`.

- ASSUMED (bridge): a record is a long-lived, distinguishable physical state of some carrier. In this atlas the only bound-matter carrier is stable atoms (S4). Exotic carriers (nuclear matter, black-hole hair, field configurations) are not modelled; if someone adds one as its own stage, this requirement should become "S4 or that stage".
- No link statuses change. No thresholds change. No new links. Propagation is unchanged: a stage is BLOCKED when any required stage is FAIL or BLOCKED; CONTESTED upstream does not block.
- Engine version string bumps from `atlas@locked-2026-11-14` to `atlas@locked-2026-11-14b` so old share links remain identifiable.

## Files touched
`atlas/stages/s10.records.yaml`, `site/engine/atlas.js` (STAGES), `site/engine/parity/eval_ref.py` (STAGES), `site/models/atlas.js` (version), plus this lock.

## Predictions, written before running (checked on the 3150-point parity grid, old vs new)
P1. Only `s10.records` changes, in status and verdict. No other stage, link, table or box value changes. (Reason: s11 already requires s06, which descends from s04, so s11 and below are already BLOCKED whenever s04 is FAIL/BLOCKED.)
P2. s10 changes exactly at the points where s04 is FAIL or BLOCKED and old s10 was not BLOCKED; there it becomes BLOCKED.
P3. Python and JS still agree at every point (0 mismatches).
P4. Of the 10 site sets from Pass 33, only n = 4 changes (s10 PASS -> BLOCKED). alpha x3 and beta x10 fail at hydrogen (S5), not S4, so they are unchanged.

If any prediction fails, it is reported as failed, not adjusted.

## Results (run 2026-11-14 ~21:55 CST, after the lock above)
- Parity grid, new engine: 3150 points, 0 Python/JS mismatches in stages, verdicts, links, tables, hydrogen box. P3 holds.
- Old vs new (Python reference): only `s10.records` changed, at 2015 of 3150 points; 0 link/table/box diffs. P1 holds.
- P2: 0 violations. Every changed point has old s04 FAIL (293) or BLOCKED (1722) and new s10 BLOCKED.
  - Transitions: PASS -> BLOCKED 1055; FAIL -> BLOCKED 960.
  - By dimensions: n=1 850, n=5 850, n=2 11, n=4 11, n=3 293 (the n=3 points are alpha large enough that S4 itself FAILs).
- P4: of the 10 Pass-33 sets, only n = 4 changed (s10 PASS -> BLOCKED). Holds.
- Side effect, stated plainly: the 960 FAIL -> BLOCKED points are arrow = 0 universes with no atoms. Under the existing propagation rule a BLOCKED stage hides its own failure, so these now read "blocked (no atoms)" rather than "fail (no arrow)". Both are true; the board shows only the upstream one. Changing that display is a separate decision, not part of this revision.
- Validator: valid (459 files, 71 pre-existing warnings). Tests: 82 passed. check-models, check-runs ok.
