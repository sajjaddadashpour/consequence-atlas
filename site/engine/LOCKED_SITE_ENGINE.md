# LOCKED: Site engine (browser physics layer for the Atlas + Universe Starter)

Lock stamp: 2026-11-14 17:16:50 -0600 (America/Regina). Written before any new site-engine code or parity run in this directory. No post-hoc calibration. No new physics claims. Every number and verdict keeps its existing label from the repo links, `atlas/derivations/`, or the locked Starter specs.

Sources already on disk (read before this stamp; not computed here):
- `/workspace/physics/atlas/derive.py` and `derived.json` (same content as `repo/atlas/derivations/`)
- `/workspace/physics/swarm/repo` at local `gate-prototype`; physics content compared to `origin/main` (014c5b9, includes site builder PR #4). Dials, stages, links, and `engine/starter/src/engine.ts` are identical on `origin/main` for this purpose. `site/MODELS.md` was not on `origin/main` or any fetchable branch at lock time; the module API below follows the Chief of Staff contract described in the room (to be reconciled with `site/MODELS.md` if it appears later).
- Atlas v0 page rules in `/workspace/physics/atlas/atlas_v0_live.tsx`, plus v0.1 addenda in the repo links (galaxies, Λ).
- Starter: pinned `engine/starter/src/engine.ts` (v3.0.0, sha256 `8487a8d2b8c7cfdd28a5487c32d7fac93c29e57b8f8bcd108a7141767264667d`), specs `LOCKED_UNIVERSE_STARTER_V2.md` and `LOCKED_UNIVERSE_STARTER_V3.md`. Look-view glyphs: `/workspace/physics/universe_starter_v2/look/look_code.tsx` (visual only).

This tree lives at `/workspace/physics/swarm/site-engine/` and is later a patch into the repo under `site/engine/` against current `origin/main`. It is not pushed by the Physicist.

## 0. What this is
A browser-ready physics layer the site UI can call. Two modules, no new theories, no invented dials (in particular: there is no parameter called "mirror ratio"; the closest existing Starter start is `start: "paired"`).

## 1. Constants (do not mix)

DERIVE set (used for every numeric table that must match `derived.json`):
- `A0_DERIVE = 1/137.035999`
- `B0_DERIVE = 1/1836.15267`

DIAL set (used for "our universe" and for any formula written with the yaml literal):
- `A0_DIAL = 0.0072973525693`   (`dials/alpha.yaml` ours)
- `B0_DIAL = 0.000544617021`    (`dials/beta.yaml` ours)
- `strong` ours = 0
- `dimensions` ours = 3
- `arrow` ours = 1
- `cosmological-constant` ours = 1
  Dial ids and ranges are exactly those in `dials/*.yaml`. Alias: `cosmological_constant` ≡ `cosmological-constant`.

Other imported numbers, already in `derived.json` or the derivations README / link notes:
- Liquid-drop: `a_s = 17.8` MeV, `a_c = 0.711` MeV; valley `Z = A/2 - 0.2 A^2/(A+200)`.
- `Z_cr = floor(1.24/alpha)`, `Z_dirac = floor(1/alpha)`.
- Coulomb-barrier floor: `alpha^2 * beta >= 2.62e-12`.
- Star-mass k: Adams 2019 `10**(-8/3)`, Tegmark 1998 `1/200`, Barnes 2012 `1/100`.
- Hydrogen (Borsanyi 2015, as in derive.py / page): `Q=2.52`, `E=-1.00`, `dQ=hypot(0.17,0.24)`, `dE=hypot(0.07,0.14)`; page/yaml rounded box uses `0.294` and `0.157`. Proton mass `938.272` MeV.
- Landauer: `k_B=1.380649e-23`, `e=1.602176634e-19`, T=300 K.
- Λ galaxy bound: `57.5` in dial units (derive.d10 / link).
- Λ recollapse: `t = 36.7 / sqrt(|x|)` Gyr for `x<0`; benchmarks `x>=-7.09` (13.787 Gyr) and `x>=-53.9` (5 Gyr) (derive.d11 / link).
- Water: `alpha <= 10 * A0_DIAL`.
- Hoyle: `|s|<=0.005` and `|alpha/A0_DIAL - 1|<=0.025` PASS; `|s|<=0.005` and `|alpha/A0_DIAL-1|<=0.04` still inside Oberhummer, CONTESTED vs Epelbaum; else CONTESTED.
- Nuclei-still: PASS `beta < 1/81`; CONTESTED `beta > 81`; else FAIL.
- Non-relativistic atoms: PASS `alpha < 0.2`; CONTESTED `0.2 <= alpha < 1/3`; FAIL `alpha >= 1/3`.
- pp-chain (Amendment 1, 2026-11-18): PASS `-0.04 <= s <= 0.06` (square-well edges, Adams 2019 §2.4); CONTESTED `s < -0.04` (deuteron may unbind; −4% square well to −6% Yukawa; dissent Adams & Grohs 2017) or `s > 0.06` (diproton may bind; +6% square well to +17% Yukawa; dissent MacDonald & Mullan 2009). Never FAIL.
- Carbon nuclei: PASS iff `0.1*(1+s) >= 0.3*sqrt(alpha)`.

Time dimensions are not a dial (fixed at one in v0). Gravity G is not a dial.

## 2. Numeric functions (must match derive.py / derived.json)

Port of derive.py, same control flow:
- `A_of_Z(Z)`: 60 bisections, `lo=Z`, `hi=4*Z+10`.
- `Z_fis(alpha, s)`: `crit = 2*17.8*(1+s)/(0.711*alpha/A0_DERIVE)`; increment Z from 1 while `Z<2000` and `Z^2/A_of_Z(Z) < crit`; return `Z-1`.
- `table(alpha, s)`: as derive.py (`Z_dirac`, `Z_cr`, `Z_fis`, `L=min(Z_cr,Z_fis)`, `L_point=min(Z_dirac,Z_fis)`).
- `thresh(Zneed, s, useCr)`: 60 bisections on alpha in `[1e-4, 1]`.
- D3, D6, D7, D9 closed forms as in derive.py (D9 critical ratios use exact `dQ`, `dE`, `A0_DERIVE`, `B0_DERIVE`).
- D1 and D2 are not recomputed in the browser (D1 used a 200,001-point grid; D2 needs a tridiagonal eigensolver). Their `derived.json` values are frozen and served as tables. Stage rules use only the qualitative D1/D2 verdicts already in the links: stable circular orbits and a hydrogen ground state only for the n=3 PASS case; n=4,5 FAIL; n=2 orbit WEAK (log potential) but gravity FAIL; n=1 orbit FAIL (no sideways direction, even though the 1D effective-potential minimum exists); n<=2 hydrogen WEAK.

Tolerance for a numeric compare: relative `1e-9` when both sides are nonzero; absolute `1e-15` when a side is zero; verdicts and integers must be identical.

## 3. `evaluate(dials)` (stage graph = repo, not the v0 page alone)

Dials in: `{ dimensions|n, alpha, beta, strong|s, arrow, cosmological_constant|cosmological-constant }`. Missing dials default to ours.

Stages, ids, names, `requires`, and link ids, labels, and source ids: exactly `atlas/stages/*.yaml` and `atlas/links/*.yaml`. Stage order is the yaml `order` field (s00=0 … s07g=7, s07=8, … s13=14).

Per-link test: the yaml `condition` is the PASS predicate only. The richer PASS / WEAK / CONTESTED / FAIL / OPEN mapping is the one already written in the link notes and (for pre-Λ rules) the v0 page. Locked mapping:

| link id | PASS | WEAK | CONTESTED | FAIL | OPEN |
|---|---|---|---|---|---|
| l.s01.hyperbolic-laws | always | | | | |
| l.s02.huygens | n∈{3,5} | n∈{1,2,4} | | | |
| l.s03.orbit-stability | n=3 | n=2 | | n∈{1,4,5} | |
| l.s03.hydrogen-ground-state | n=3 | n∈{1,2} | | n∈{4,5} | |
| l.s03.gravity-orbits | n=3 | | | n≠3 | |
| l.s04.atomic-scales | always (informational) | | | | |
| l.s04.nonrelativistic-atoms | α<0.2 | | 0.2≤α<1/3 | α≥1/3 | |
| l.s07.coulomb-barrier | α²β≥2.62e-12 | | | else | |
| l.s07.star-mass-window | β/α² ≥ 1/100 | | 10^(-8/3) ≤ β/α² < 1/100 | β/α² < 10^(-8/3) | |
| l.s07g.lambda-galaxies | Λ<57.5 (including Λ≤0) | | | Λ≥57.5 | |
| l.s05.carbon-nuclei | 0.1(1+s)≥0.3√α | | | else | |
| l.s05.hydrogen-stable | whole 1-σ box above m_e | | box straddles m_e | whole box below m_e | |
| l.s05.table-length | L≥26 | 8≤L<26 | | L<8 | |
| l.s06.nuclei-still | β<1/81 | | β>81 | 1/81≤β≤81 | |
| l.s06.water | α≤10·A0_DIAL | α>10·A0_DIAL (never FAIL) | | | |
| l.s08.hoyle-window | \|s\|≤0.005 and \|α/A0_DIAL−1\|≤0.025 | | otherwise (never FAIL) | | |
| l.s08.pp-chain | −0.04≤s≤0.06 | | s<−0.04 or s>0.06 (Yukawa limits −0.06 / +0.17; dissents Adams & Grohs 2017, MacDonald & Mullan 2009) | never | |
| l.s09.planet-orbits | n=3 | | | n≠3 | |
| l.s11.lambda-lifetime | Λ≥−7.09 (so every Λ≥0) | | −53.9≤Λ<−7.09 (the two stated benchmarks disagree) | Λ<−53.9 (fails both stated benchmarks) | |
| l.s10.landauer | always | | | | |
| l.s10.past-traces | arrow≥1 | | | arrow=0 | |
| l.s10.toy-arrow | arrow≥1 | | | arrow=0 | |
| l.s11.life, l.s12.minds, l.s13.carers | | | | | OPEN |

Hydrogen 1-σ box (evaluate, not D9 table): four corners with the yaml/page rounded errors `dQ=0.294`, `dE=0.157`, and `r=alpha/A0_DIAL`; `lo=min`, `hi=max` of `Q+E*r`; compare to `m_e=beta*938.272`. (D9 reported critical alphas stay on the derive.py hypot + A0_DERIVE path.)

Table length L for evaluate = `min(floor(1.24/alpha), Z_fis(alpha,s))` as in the link and the v0 page (finite-size Z_cr, not Z_dirac).

Honesty label and source ids on each link verdict are the yaml `label` and `sources` (no relabelling). `l.s11.lambda-lifetime` stays CONTESTED even when its test is PASS.

Stage aggregation (same rank as the v0 page, plus BLOCKED):
`PASS=0, OPEN=1, WEAK=2, CONTESTED=3, FAIL=4`.
A stage's `status` is the worst of its own links, or `BLOCKED` if any required upstream stage has `status` FAIL or BLOCKED. `upContested` is true if any upstream is CONTESTED or already `upContested`.

Coarse `verdict` (for the UI contract):
- `ok` if status is PASS, WEAK, or OPEN
- `CONTESTED` if status is CONTESTED
- `FAIL` if status is FAIL
- `BLOCKED` if status is BLOCKED

`evaluate` also returns, at the given dials and at ours:
- numeric windows and margins already in `derived.json` (D3 scales, D5 L and α maxima for C/O/Fe, D6 β minima and α bounds at our β, D7, D9 band, `beta_max_ordered=1/81` and its margin)
- Λ: galaxy threshold 57.5, lifetime thresholds −7.09 and −53.9, `t=36.7/sqrt(|Λ|)` for Λ<0, and the margin of ours (Λ=1) to 57.5
- each link and stage carries `label` + `sources`

## 4. Plot data (no new claims; shading uses existing labels)

All plots take the same dial object; unused axes are held at ours unless the caller overrides.

(a) `dialPairGrid(xDial, yDial, opts)` — ANY two of the six dials as axes (the α–β map is this function with `(alpha, beta)`). Locked default resolution: 41×41. Scale: yaml `scale` (log / linear / discrete). For Λ, sample a symmetric-log axis (linear in a signed log, linear near 0) over the yaml range; this is a UI axis, not a new parameter. Each cell: both dial values, `evaluate` summary (per-stage verdict + coarse verdict for s03, s05, s07, s07g, and the worst stage), a `region` tag (`ok` / `weak` / `open` / `contested` / `fail` / `blocked` from the worst of those featured stages, or from all stages if requested), and the honesty `label` of the governing (worst-rank) link among featured stages. Also the "our universe" point if the other four dials are at ours, or a flag if not.

Featured stages for the default "possible universes" map: s03 (atoms/orbits), s05 (hydrogen + table), s07 (stars), s07g (galaxies). The stage-strip can request others.

(b) `lambdaLine`: Λ sample (default 161 points, symmetric-log on [−1000,1000]), `t(Λ)` for Λ<0, thresholds at 57.5 (galaxy formation; l.s07g.lambda-galaxies, DERIVED-UNDER-ASSUMPTION) and −7.09 / −53.9 (recollapse lifetime; l.s11.lambda-lifetime, CONTESTED), plus the evaluate verdict at each point with other dials at ours (or caller). Our point Λ=1.

(c) `dialStrips`: for each of the six dials, a 1D sweep (default 81 points, or the discrete values for n and arrow) with the other dials held at ours (or caller). At each sample, every stage's status. Report the switch points (adjacent samples where a given stage's status changes).

(d) `dimensionPanel`: n=1..5, other dials at ours (or caller). Per n: orbit-stability, hydrogen-ground-state, gravity-orbits, huygens, planet-orbits, and stage s03/s02/s09 verdicts. Locked statement, already in the links: stable planetary orbits and traditional atoms only at n=3.

## 5. Module API (Chief of Staff contract)

Each module exports:
- `id` (string)
- `cards` (array of experiment-card ids this module belongs to; atlas: empty, because atlas links are not cards; starter: every card under `cards/starter/` with `engine.name=="starter"` as of this lock, listed in `starter-cards.json` generated from the repo without editing cards)
- `dials`: `{ name, range, default, units, locked, scale, id, symbol }` with `locked: true` only for values that are not user-settable here (none of the six atlas dials; the fixed one-time-dimension and fixed G are documented, not exported as sliders). Starter dials are the live-demo subset listed below; all other `Cfg` fields remain available to `run`/`create` at their engine defaults.
- `run(dialValues)` → data for the four views: (1) dial board (current values + ours + windows/margins + per-link verdicts), (2) possible-universes map (`dialPairGrid`, axes overridable), (3) stage strip (atoms / periodic table / stars / galaxies on-off, plus the other stages), (4) live Universe Starter lattice (`null` on the atlas module).

Atlas `id = "atlas"`. Starter `id = "starter"`.

Starter live-demo dials (names are existing `Cfg` fields only):
- family ∈ {P,F,Q,C,G,M}, default P
- dim 1..3 (demo default 2 for P lattice view; engine default remains 1)
- size 32..128 (2D default 64; engine default 4096 is 1D and too large for a live demo)
- steps 100..2000, default 400
- seed, integer, default 1
- start ∈ {paired, scattered, blob, hot, line, light}, default paired
- attract ∈ {off, short, long}, default off
- temp 0..2, default 0.5
- expand on/off, default off
- light on/off, default on
- c ∈ {1,2,3,4}, default 1
- gauge on/off (F), default off
- beta (F gauge coupling), default 1
- noise ∈ {off, uniform, cores}, default cores (engine default)
- rule 0..255 (C), default 30
- rev on/off (C), default off
- cstart ∈ {random, blob, seed}, default random
- Plus family-appropriate start/display fields already on `Cfg`.

No "mirror ratio". `start: "paired"` is the pairing setting.

Starter imperative API (besides `run`):
- `create(cfg)` → sim with `step()`, `state()`, `renderData()`, `finish()` wrapping `makeSim`.
- `state()`: done/total, optional mid-run observables if already sampled, current lattice snapshot when the family exposes one; otherwise `null` until `finish`.
- `renderData()`: current or last frame as JSON-friendly lattice data plus Look-view *shape lists* (glyphs, bonds, vortices, phase samples, gas streaks, 1D ring), not a canvas. Glyph rules and palettes copied from `look_code.tsx`. Decorative starfield/twinkle/halos stay marked decoration-only, as in the Look legend.

## 6. Parity tests (locked before running)

T-A. Numeric: `atlas.js` vs `derived.json` / a Python port of `derive.py` functions for every key in `derived.json` that we recompute (all except D1 extrema positions and D2 eigenvalues, which are frozen). Integers identical; floats to 1e-9 relative. Also `table()` on the exact `D5_grid` inputs.

T-B. Verdicts: `atlas.js` `evaluate` vs a Python reference that implements §3, on a locked grid of at least 1000 dial points, listed below. Identical per-link statuses, identical per-stage statuses, floats in windows to 1e-9 relative. Report the real mismatch counts. Grid (other dials at ours unless named):

- G1: 21 log α in [1e-6,1] (endpoints and A0_DIAL included by snapping the nearest of the 21 to A0_DIAL if not already exact) × 21 log β in [1e-5,100] (snap nearest to B0_DIAL). n=3,s=0,arrow=1,Λ=1. (441)
- G2: 11 log α (snap ours) × 11 linear s in [−0.2,0.6] including {−0.2,−0.04,−0.005,0,0.005,0.06,0.55,0.6} (Amendment 1; was 0.034, 0.5). n=3,β=ours,arrow=1,Λ=1. (121)
- G3: 21 Λ samples on a symmetric-log of [−1000,1000] forced to include {−1000,−53.9,−7.09,−1,0,1,57.5,100,1000}. other dials ours. (21)
- G4: n∈{1,2,3,4,5} × 11 log α (snap ours). β,s,arrow,Λ at ours. (55)
- G5: arrow∈{0,1,2} at ours. (3)
- G6: the 18 `D5_grid` (α,s) pairs at β=ours,n=3,arrow=1,Λ=1; plus each yaml range endpoint for every dial, one at a time. (18+12=30)
- G7: n∈{1,3,5} × arrow∈{0,1} × α∈{1e-4,A0_DIAL,0.02,0.1,0.2,1/3,0.5} × β∈{1e-5,B0_DIAL,1/81,1,81} × s∈{−0.2,0,0.06,0.55} (Amendment 1; was 0.034, 0.5) × Λ∈{−53.9,1,57.5}. (3*2*7*5*4*3=2520, but this is the fill; the required minimum is the union, deduplicated, which is well above 1000)

The Python reference is a test oracle written from this lock, not a second theory.

T-C. Starter: `starter.js` vs `engine/starter/src/engine.ts` (tsx) on a locked set of fixed seeds and small configs, covering families P,F,Q,C,G (M pop is slow; one tiny pop config only). Compare `verdict` identically and every finite numeric field of `m` plus series `ts,ns,ss,cs` to 1e-9 relative (or exact for integers). Frame bytes compared exactly when both sides have them (byte identity). Also a v2-regression subset: v3 defaults, configs that exist in `sim2.ts` / the 17 v2 presets if they can be run small; those must match `sim2.ts` to the same tolerance (v3 with defaults off reproduces v2). Report real mismatch counts. Seeds locked: 1, 2, 7, 42.

T-D. `demo.html` loads both modules. A node smoke test imports the modules and, if jsdom is available, loads the page; otherwise module-import plus a pure function check that `run` returns the four view keys.

## 7. Out of scope
No new stages, dials, or thresholds. No gate signing. No push. No hosting. Usage kept modest (no large Starter sweeps).

## Amendment 1 (Physicist, 2026-11-18 ~20:30 CST, America/Regina; written after the C2 run 87993ed, applies to future runs only)
Follows Chemist's lock docs/locks/LOCKED_C1b_C2b_ENGINE.md (a2bd5c9). Earlier parity reports and verdicts are not re-scored by this amendment.
- pp-chain thresholds above: PASS −0.04 ≤ s ≤ +0.06; CONTESTED outside, with the Yukawa limits (−0.06, +0.17) and both dissents named; never FAIL.
- Parity grid: G2 and G7 strong values 0.034 → 0.06 and 0.5 → 0.55 (the C1b/C2b lock drops the +0.034 edge and the s ≥ 0.5 FAIL;
  0.55 is its K6 point). New G8: α = 1.022·A0_DIAL, other dials ours (inside the old 2–2.5% Hoyle gap; C1b K1). Grid size is reported as run.
- Not changed here: the Hoyle line (§ above, still 0.025 in this document); that belongs to C1b's own scope.
