// EXAMPLE DATA. This module does not evaluate atlas conditions.
// Replace `run` with the physicist's atlas module when it lands.
// Dial names match dials/*.yaml. Locked values are the recorded `ours`.

const id = "atlas-map";
const title = "Consequence atlas";
const family = "atlas";
const boardTitle = "Dials";
const summary = "Six recorded dials. Patches and stage lights are example data; labels are the atlas records.";
const cardIds = [];
const lockNote = "Locked values are the ours fields in dials/*.yaml. This module does not decide which stages survive.";
const fidelity = "example";
const engine = { name: "example", version: "0" };

const params = [
  {
    name: "alpha",
    label: "Fine-structure constant",
    symbol: "α",
    min: 1.0e-6,
    max: 1.0,
    free: { min: 1.0e-8, max: 10 },
    step: null,
    default: 0.0072973525693,
    locked: 0.0072973525693,
    unit: "dimensionless",
    type: "number",
    scale: "log",
    help: "Dimensionless. The locked value is ours.",
  },
  {
    name: "beta",
    label: "Electron-to-proton mass ratio",
    symbol: "β",
    min: 1.0e-5,
    max: 100.0,
    free: { min: 1.0e-7, max: 1000 },
    step: null,
    default: 0.000544617021,
    locked: 0.000544617021,
    unit: "dimensionless (proton mass held fixed)",
    type: "number",
    scale: "log",
    help: "m_e/m_p, proton mass held fixed. Not the engine gauge field.",
  },
  {
    name: "strong",
    label: "Strong-force change",
    symbol: "s",
    min: -0.2,
    max: 0.6,
    free: { min: -1, max: 2 },
    step: 0.005,
    default: 0,
    locked: 0,
    unit: "fractional change of the strong coupling (0 = ours)",
    type: "number",
    scale: "linear",
    help: "Fractional change of the strong coupling. Zero is ours.",
  },
  {
    name: "cosmological-constant",
    label: "Cosmological constant",
    symbol: "Λ",
    min: -1000,
    max: 1000,
    free: { min: -1e6, max: 1e6 },
    step: null,
    default: 1,
    locked: 1,
    unit: "rho_Lambda / rho_Lambda,ours (signed; negative = negative vacuum energy)",
    type: "number",
    scale: "symlog",
    linthresh: 0.1,
    help: "Relative to our vacuum energy. Negative means negative vacuum energy. The slider is symmetric-log.",
  },
  {
    name: "dimensions",
    label: "Number of space dimensions",
    symbol: "n",
    min: 1,
    max: 5,
    free: { min: 1, max: 10 },
    step: 1,
    default: 3,
    locked: 3,
    unit: "count (one time dimension fixed in v0)",
    type: "integer",
    scale: "discrete",
    help: "Space dimensions. One time dimension stays fixed.",
  },
  {
    name: "arrow",
    label: "Arrow of time and records",
    symbol: "",
    min: 0,
    max: 2,
    step: 1,
    default: 1,
    locked: 1,
    unit: "0 = reversible laws, equilibrium start; 1 = reversible laws, low-entropy start (ours); 2 = irreversible laws",
    type: "integer",
    scale: "discrete",
    options: [
      { value: 0, label: "0 — reversible laws, equilibrium start" },
      { value: 1, label: "1 — reversible laws, low-entropy start (ours)" },
      { value: 2, label: "2 — irreversible laws" },
    ],
    help: "0 equilibrium start, 1 low-entropy start (ours), 2 irreversible laws.",
  },
];

const views = ["map", "timeline", "lambda", "links"];

// Patch corners are arbitrary sample geometry so the map renderer has something to draw.
// They are not pass regions. Honesty labels are joined from the link records at runtime.
const regions = [
  { linkId: "l.s05.hydrogen-stable", x0: 0.02, x1: 0.25, y0: 0.02, y1: 4, caption: "Example patch" },
  { linkId: "l.s04.nonrelativistic-atoms", x0: 0.04, x1: 0.5, y0: 0.08, y1: 12, caption: "Example patch" },
  { linkId: "l.s05.table-length", x0: 0.00005, x1: 0.0015, y0: 0.004, y1: 0.4, caption: "Example patch" },
  { linkId: "l.s07.star-mass-window", x0: 0.0002, x1: 0.002, y0: 0.00008, y1: 0.008, caption: "Example patch" },
];

const stages = [
  { stageId: "s04.stable-atoms", linkId: "l.s04.nonrelativistic-atoms", litAtLock: "example-on" },
  { stageId: "s05.hydrogen-table", linkId: "l.s05.hydrogen-stable", litAtLock: "example-on" },
  { stageId: "s07.stars", linkId: "l.s07.star-mass-window", litAtLock: "example-on" },
  { stageId: "s07g.galaxies", linkId: "l.s07g.lambda-galaxies", litAtLock: "example-on" },
  { stageId: "s11.life", linkId: "l.s11.life", litAtLock: "example-off" },
];

function run() {
  return {
    example: true,
    fidelity: "example",
    verdict: null,
    note: "Shaded patches and stage lights are example data. They are not the atlas conditions. Dots, dial ranges, link labels, and Lambda ticks are records.",
    map: { x: "alpha", y: "beta", regions },
    stages,
  };
}

export { id, title, family, boardTitle, summary, cardIds, lockNote, fidelity, engine, params, views, run };
