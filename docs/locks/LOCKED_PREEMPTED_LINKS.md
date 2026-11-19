# LOCKED: mark pre-empted links (docs/data notes only)
Locked 2026-11-16 by Physicist. Evidence: slate A1 knockout (build/slateA/a1_knockout.json) plus a DERIVED range argument.
Definition: a link is PRE-EMPTED if it can FAIL somewhere in the dial ranges, but whenever it FAILs another link already makes the
same stage, or an ancestor stage, FAIL. So forcing it to PASS never changes any reach verdict, anywhere in the ranges.
Pre-empted (DERIVED from code constants):
- l.s05.carbon-nuclei: FAIL needs α > 0.071; l.s05.hydrogen-stable FAILs for all α > 0.0244 at any β in range.
- l.s05.table-length: FAIL (L < 8) needs α > 0.075; same shadow.
- l.s06.nuclei-still: FAIL needs 1/81 ≤ β ≤ 81, i.e. m_e ≥ 11.6 MeV > 2.81 MeV (hydrogen box max), so hydrogen FAILs.
- l.s09.planet-orbits: FAIL iff n ≠ 3, where l.s03.gravity-orbits FAILs, so s09 is already BLOCKED.
- l.s03.orbit-stability and l.s03.hydrogen-ground-state: FAIL only when n ≠ 3, where gravity-orbits FAILs in the same stage.
Mutually redundant pair (each alone never cuts; together they do): l.s10.past-traces and l.s10.toy-arrow (identical condition arrow ≥ 1).
Change: append one sentence to each listed link's `notes` (schema allows notes). Pre-empted links stay in the atlas: they record
real physics and would cut if their shadowing link were relaxed. No status, condition, label or engine change.
Predictions PE1: engine outputs byte-identical on the 3150 grid (no engine files touched). PE2: validate passes.

## Results (after the lock; lock committed in build/upgrades git d6528a2)
- PE1 HELD: no engine file touched (git diff covers only 8 link yaml notes plus this lock), so engine outputs are unchanged by construction.
- PE2 HELD: `python3 -m verify` valid (459 files, 71 warnings); pytest 87 passed; site builds.
- Where it shows: the notes reach data/index.json (machine-readable registry). The front page's stage drawer shows the engine's own reason strings, not yaml notes, so a visible "pre-empted" badge needs a front-end change (Chief of Staff's lane). Not done here.
