# Adding a playground model

The public site is a static shell. Each model is one JavaScript module. The shell draws the controls, the honesty banner, the locked-record panel, and the pictures. A model supplies parameters and a `run` function. It does not touch `cards/`, `dead-ends/`, `dials/`, or `atlas/`.

The Universe Starter lattice engine and the atlas condition evaluator are being ported separately and checked against the locked results. Until that module replaces a placeholder, `run` must set `example: true` and must not emit an engine verdict. The shell then stamps the picture **Example data** and refuses to present `verdict` as a result.

`engine_canvas.ts` is not in this repository yet. Parameter names below follow `Cfg` in `engine/starter/src/engine.ts` and the ids in `dials/*.yaml`. When `engine_canvas.ts` lands, change `params[].name` to its names before replacing `run`. Do not invent a name. Do not label any control "mirror ratio"; there is no such parameter. Family F's `beta` is the engine gauge field. The dial `beta` is the electron-to-proton mass ratio. They are different controls on different models.

## Contract

```js
export const id = "particles";          // file is site/models/particles.js
export const title = "Particles on a lattice";
export const cardIds = ["c.v3o.019.sticky-symmetry"]; // registry cards, or []
export const params = [
  {
    name: "temp",          // engine or dial field name
    label: "Temperature",  // words on the control
    min: 0,
    max: 2,
    step: 0.01,            // null for log / symlog; the shell divides the track
    default: 0.4,          // value when the model opens
    locked: 0.4,           // value that counts as on the lock
    unit: "",
    // optional:
    type: "number",        // "number" | "integer" | "boolean" | "enum"
    scale: "linear",       // "linear" | "log" | "symlog" | "discrete"
    linthresh: 0.1,        // symlog only
    symbol: "T",
    options: [{ value: "off", label: "off" }], // enum, or a discrete control with labels
    help: "Shown under the control.",
  },
];
export const views = ["lattice", "series"];

export function run(params) {
  return {
    example: true,                 // false only for a parity-checked engine port
    fidelity: "example",           // "example" | "engine"
    verdict: null,                 // string only when example is false and fidelity is "engine"
    note: "Shown under the pictures.",
    series: { t: [1, 2], entropy: [0.1, 0.2] },
    seriesLabels: { entropy: "Entropy" },
  };
}
```

`run` may return a promise. The shell passes a plain object of the current values, keyed by `name`.

Optional exports the shell already understands: `summary`, `family`, `boardTitle`, `lockNote`, `fidelity`, `engine`.

```js
export const engine = { name: "example", version: "0" };
```

Placeholders use `example@0`. A parity-checked port sets the real engine, such as `{ name: "starter", version: "3.0.0" }`, in the same change that sets `example: false`. The shell puts `engine`, every param, the seed, and free play into the URL. See `site/RUNS.md`.

A param may set `free: { min, max }` wider than `min` / `max`. Free play uses that outer range and is always marked exploration. Leave `free` off a control whose values are a fixed vocabulary, such as the arrow of time.

## What `run` may return

| Field | Used by view | Shape |
| --- | --- | --- |
| `lattice` | `lattice` | `{ w, h, frames }`. `frames[i]` is row-major, values `-1`, `0`, `1`. |
| `phase` | `phase` | `{ w, h, frames, vortices }`. Phase bytes `0–255` go once around the hue wheel. `vortices[i]` is `{ x, y, sign }[]` with `x` and `y` in `0–1`. |
| `spacetime` | `spacetime` | `{ w, h, cells }`. Row-major `0` or `1`. Time increases with the row. |
| `series` | `series` | `{ t: number[], [name]: number[] }` with equal lengths. |
| `seriesLabels` | `series` | Display names. Example modules should say that the slot is example data. |
| `map` | `map` | `{ x, y, regions }`. `x` and `y` are dial ids. A region is `{ linkId, x0, x1, y0, y1, caption }` in dial units. |
| `stages` | `timeline` | `{ stageId, linkId, lit, litAtLock }[]` in display order. |

`lit` is `"on"`, `"off"`, or `"unknown"`. The shell uses it only when `example` is false. While `example` is true, a locked dial position shows `litAtLock` (`"example-on"` or `"example-off"`), and any other position shows **not computed**.

The shell looks up `linkId` and `cardIds` in `data/index.json` and prints those records' labels. Do not copy a label into the module.

## Views the shell can draw

| View | What it is |
| --- | --- |
| `map` | Log–log dial plane. Your setting and the recorded `ours` are dots. Regions are whatever `run` returned. Example regions are hatched and captioned. |
| `timeline` | Stage chips. The honesty label is the cited link's label. |
| `lambda` | Symmetric-log line for `cosmological-constant`. Ticks are `window` fields on links whose dial is that id, plus the recorded `ours`. The shell does not decide pass or fail. |
| `links` | The recorded stage-and-link graph, coloured by atlas label. Not produced by `run`. |
| `lattice` | Animated charges, `+` and `−` in two colours. |
| `phase` | Animated hue field and vortex marks. |
| `spacetime` | One space-time image. |
| `series` | Line chart of every key in `series` except `t`. |

An unknown view name is left visible as "no renderer yet" so a new module does not fail silently. Add the renderer in `site/static/views.js`.

The shell always draws the verdict strip. It is not a view name.

- **This run.** If `example` is true, or `fidelity` is not `"engine"`, the strip says there is no verdict, even if `verdict` is set. If the module is a real port (`example: false`, `fidelity: "engine"`), the strip prints `verdict` exactly.
- **Locked record.** The first `cardIds` entry, with its label, effect, standard error, and z from the index. Further ids are links. A model with no cards shows the recorded `ours` values instead.
- **On the lock** means free play is off and every param equals its `locked` value (numeric values within half a step, or half a slider step for log and symlog). Anything else is marked **Exploration**. Free play is exploration even when every value sits on the lock.

Card labels and engine verdicts are different words. The shell does not turn one into the other.

## How to add a model

1. Add `site/models/<id>.js` exporting the contract. `<id>` is `export const id`.
2. Append `"<id>"` to `site/models/order.json`. That order is the picker order.
3. Point `cardIds` at real card ids. Leave the array empty if the model is not an experiment card.
4. Set `locked` from the card's settings, or from `ours` for a dial. Say in `lockNote` which card fields are not on the board.
5. Keep `example: true` until the port has been checked against the locked outputs.
6. Rebuild:

```
python3 site/build.py --out dist/site --cname toeatlas.si
```

The builder writes `models/manifest.json` and copies each module. It refuses a module that contains the words "mirror ratio". `make site` runs the same build.

Check the contract without a browser:

```
node site/check-models.mjs
```

## How to replace a placeholder

Overwrite `run` in the existing file, or replace the file and keep the same `id`. Set `example: false` and `fidelity: "engine"` only when the numbers match the locked Python or TypeScript outputs. Return the same `series` keys the view already plots (`entropy`, `particles`, `clustering` for family P; `vortices` for family F; `entropy` for family C) so the chart does not need a shell change. Lattice frames stay row-major charges. Phase frames stay hue bytes plus fractional vortex marks.

Dial ranges for the atlas model are read again from `dials/*.yaml` at build time into `data/index.json`. The shell prefers those records over the numbers copied into `atlas-map.js`. A symmetric-log axis is used when the dial's `units` text says so, which is how `cosmological-constant` is written.

## Modules in this tree

`site/engine/` is the physicist's browser layer (`atlas.js`, `starter.js`, `starter-engine.js`). Those files are not edited here. `site/models/atlas.js` and `site/models/starter.js` are the playground adapters: they call that layer and do not reimplement it.

| Adapter | Engine | What it draws |
| --- | --- | --- |
| `atlas` | `site/engine/atlas.js` | Any two dials as map axes, a Lambda line, a strip per dial, the dimensions panel, and the stage list with each link's honesty label and sources. |
| `starter` | `site/engine/starter.js` at engine `3.0.0` | A modest lattice, run to completion, then the recorded frames. The live verdict is the engine verdict. Card labels stay the atlas records. |

`beta` on the atlas adapter is labelled "Mass ratio m_e/m_p". `beta` on the starter adapter is labelled "Gauge coupling beta".

Toy runs are not claims about chemistry or life.
