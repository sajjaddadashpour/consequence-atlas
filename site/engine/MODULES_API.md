# Site physics modules — API for the UI

For Chief of Staff. Locked in `LOCKED_SITE_ENGINE.md` (2026-11-14 17:16:50 −0600 America/Regina) before the code was written. No new physics. `site/MODELS.md` was not on `origin/main` at lock time; this file follows the contract you described in the room. If `MODELS.md` lands, we can rename fields to match it without changing the maths.

Intended repo path later: `site/engine/` (this tree is `/workspace/physics/swarm/site-engine/`). The Physicist does not push; a patch against current `origin/main` can be handed over.

There is **no “mirror ratio”**. The pairing setting is `start: "paired"`.

Both modules are plain ES modules, no npm dependencies.

```js
import { id, cards, dials, run, evaluate, dialPairGrid, lambdaLine, dialStrips, dimensionPanel, OURS } from "./atlas.js";
import { id, cards, dials, run, create, runSync, lookShapes, DEF, PALS } from "./starter.js";
```

Each module exports:

| field | atlas | starter |
|---|---|---|
| `id` | `"atlas"` | `"starter"` |
| `cards` | `[]` (atlas links are not experiment cards) | 139 ids under `cards/starter/` with `engine.name === "starter"` (`starter-cards.js`) |
| `dials` | the six yaml dials (below) | live-demo subset of `Cfg` (below); every other `Cfg` field is still accepted by `run`/`create` at engine defaults |
| `run(dialValues)` | the four views | the four views (`universeMap` and `stageStrip` are `null`; `lattice` is filled) |

## `run(dialValues)` shape

```js
{
  id,                    // module id
  dialBoard,             // current values, ours/defaults, windows or verdict
  universeMap,           // atlas: dialPairGrid (default α–β 41×41); starter: null
  stageStrip,            // atlas: all stages + featured atoms/table/stars/galaxies; starter: null
  lattice                // atlas: null; starter: frames + Look shapes + series + verdict
}
```

## Atlas dials

From `dials/*.yaml`. Alias `cosmological-constant` ≡ `cosmological_constant`. Each entry: `{ id, name, symbol, units, range, scale, default, locked: false, sources }`.

- `alpha` log [1e-6, 1], default 0.0072973525693
- `beta` log [1e-5, 100], default 0.000544617021  (this is m_e/m_p, not the Starter gauge coupling)
- `strong` linear [−0.2, 0.6], default 0
- `cosmological_constant` symlog [−1000, 1000], default 1  (UI axis only; not a new parameter)
- `dimensions` discrete 1..5, default 3
- `arrow` discrete 0,1,2, default 1

Not sliders (documented in `LOCKED_NOT_DIALS`): one time dimension, Newton’s G. Both are locked at “ours”.

Missing keys in `run`/`evaluate` default to ours.

## Atlas functions you will actually call

- `evaluate(dials)` → `{ dials, stages, links, windows }`
  - each stage: `id, name, order, requires, status` (PASS / WEAK / OPEN / CONTESTED / FAIL / BLOCKED), coarse `verdict` (`ok` / `CONTESTED` / `FAIL` / `BLOCKED`), `upContested`, `links[]`, `honesty[]`, `sources[]`
  - each link: `id, from, to, label` (yaml honesty label, unchanged), `sources`, `status`, `reason`
  - `windows`: derived tables (match `derived.json`), values at the current dials, margins at ours, locked thresholds (C/O/Fe α maxima, star bounds, Λ 189 / −7.09 / −53.9, …)
- `dialPairGrid(xDial, yDial, { hold, nx, ny, featured })` — **any two** of the six dials. Default 41×41 (discrete dials use their integer values). Each cell: `{ i, j, x, y, region, worst_status, label, governing, featured }`. `ours: { x, y, on_plane }`.
- `alphaBetaGrid(opts)` — shorthand for `dialPairGrid("alpha","beta", opts)`
- `lambdaLine({ hold, n })` — 161 symlog points, `t_Gyr` for Λ<0, thresholds with labels
- `dialStrips({ hold, n })` — six 1D sweeps, with `switches` where each stage changes
- `dimensionPanel({ hold })` — n=1..5; stable orbits and traditional atoms only at n=3 (existing links)

Featured stages for the default map: `s03.orbits-atoms-gravity`, `s05.hydrogen-table`, `s07.stars`, `s07g.galaxies`. `region` is the worst of those: `ok` / `weak` / `open` / `contested` / `fail` / `blocked`. `label` is the honesty label of the governing (worst-rank) link.

`run()` uses the current dials as the `hold` for the α–β map, so the map is a slice through the other four dials, not a reset to ours.

## Starter dials (live-demo subset)

Names are existing `Cfg` fields only: `family, dim, size, steps, seed, start, attract, temp, expand, light, c, gauge, beta, noise, rule, rev, cstart`.

Engine defaults stay in `DEF` (size 4096, steps 4096, dim 1, …). `run()` uses demo-friendly defaults when the caller omits size/steps (64 and 400, dim 2) so a live page does not start a 4096³ job. `create`/`runSync` use `DEF` unless you override.

`beta` on the Starter is the **family-F gauge coupling**, not m_e/m_p.

## Starter imperative API

```js
const sim = create(cfg);   // cfg merged onto DEF
sim.step(n);               // n stepOnce calls
sim.state();               // { done, total, finished, verdict, m } — mid-run, only progress
sim.finish();              // Res from the pinned engine (call once, at the end)
sim.renderData({ pal, W, H, t, bonds });
```

The pinned engine records frames internally and only returns them from `finish()`. Mid-run `state()` does not peek at the lattice, because calling `finish()` early would mis-compute the verdict. For a live view, `run()` to completion (keep size and steps modest) and animate `lattice.frames` / per-frame `lookShapes(frame, opts)`.

`renderData()` after `finish()` returns `{ ready, family, verdict, checks, ylabel, series, m, warn, frames, strip, look, legend, stars }`. `look` is a JSON shape list (glyphs, bonds, vortices, phase samples, gas streaks). Palettes and glyph rules are from the Look view. `stars` and rotation/halos are marked decoration-only.

`runSync(cfg)` runs to completion and returns the raw `Res`.

## Honesty

Do not relabel anything. Link labels stay DERIVED, DERIVED-UNDER-ASSUMPTION, IMPORTED, CONJECTURE, CONTESTED, ASSUMED as in `atlas/links/`. Life, minds and carers stay OPEN/CONJECTURE when not blocked. Most cards remain unsigned CONJECTURE; this layer does not sign them.

## Demo

`demo.html` is a static reference: six sliders, a two-axis map, a Λ line, an α strip, a dimension panel, and a canvas for Look shapes. Serve the directory over HTTP (ES modules).
