// UI adapter. The maths is site/engine/atlas.js, unmodified.
import {
  DIAL_DEFS,
  OURS,
  dialPairGrid,
  dialStrips,
  dimensionPanel,
  evaluate,
  lambdaLine,
} from "../engine/atlas.js";

const id = "atlas";
const title = "Consequence atlas";
const family = "atlas";
const boardTitle = "Dials";
const summary = "Six recorded dials. The map, strips, and stage lights are the locked atlas rules.";
const cardIds = [];
const lockNote = "Locked values are the ours fields in dials/*.yaml. Link labels and sources are the atlas records. This page does not promote them.";
const fidelity = "engine";
const engine = { name: "atlas", version: "locked-2026-11-14" };

const LABEL = {
  alpha: "Fine-structure constant",
  beta: "Mass ratio m_e/m_p",
  strong: "Strong-force change",
  "cosmological-constant": "Cosmological constant",
  dimensions: "Number of space dimensions",
  arrow: "Arrow of time and records",
};

const params = [
  {
    name: "alpha",
    label: LABEL.alpha,
    symbol: "α",
    min: 1e-6,
    max: 1,
    free: { min: 1e-8, max: 10 },
    step: null,
    default: OURS.alpha,
    locked: OURS.alpha,
    unit: "dimensionless",
    type: "number",
    scale: "log",
    help: "Dial α. Not a Starter control.",
  },
  {
    name: "beta",
    label: LABEL.beta,
    symbol: "β",
    min: 1e-5,
    max: 100,
    free: { min: 1e-7, max: 1000 },
    step: null,
    default: OURS.beta,
    locked: OURS.beta,
    unit: "m_e/m_p, proton mass held fixed",
    type: "number",
    scale: "log",
    help: "Electron-to-proton mass ratio. Not the Starter gauge coupling.",
  },
  {
    name: "strong",
    label: LABEL.strong,
    symbol: "s",
    min: -0.2,
    max: 0.6,
    free: { min: -1, max: 2 },
    step: 0.005,
    default: OURS.strong,
    locked: OURS.strong,
    unit: "fractional change (0 = ours)",
    type: "number",
    scale: "linear",
  },
  {
    name: "cosmological-constant",
    label: LABEL["cosmological-constant"],
    symbol: "Λ",
    min: -1000,
    max: 1000,
    free: { min: -1e6, max: 1e6 },
    step: null,
    default: OURS.cosmological_constant,
    locked: OURS.cosmological_constant,
    unit: "rho_Lambda / rho_Lambda,ours",
    type: "number",
    scale: "symlog",
    linthresh: 0.1,
    help: "Symmetric-log axis, as the dial file asks. Negative is negative vacuum energy.",
  },
  {
    name: "dimensions",
    label: LABEL.dimensions,
    symbol: "n",
    min: 1,
    max: 5,
    free: { min: 1, max: 10 },
    step: 1,
    default: OURS.dimensions,
    locked: OURS.dimensions,
    unit: "space dimensions",
    type: "integer",
    scale: "discrete",
    help: "One time dimension stays fixed. It is not a dial.",
  },
  {
    name: "arrow",
    label: LABEL.arrow,
    symbol: "",
    min: 0,
    max: 2,
    step: 1,
    default: OURS.arrow,
    locked: OURS.arrow,
    unit: "",
    type: "integer",
    scale: "discrete",
    options: [
      { value: 0, label: "0 — reversible laws, equilibrium start" },
      { value: 1, label: "1 — reversible laws, low-entropy start (ours)" },
      { value: 2, label: "2 — irreversible laws" },
    ],
  },
];

const views = ["map", "lambda", "strips", "dimensions", "stages"];

function holdOf(params) {
  return {
    alpha: params.alpha,
    beta: params.beta,
    strong: params.strong,
    dimensions: params.dimensions,
    arrow: params.arrow,
    cosmological_constant: params["cosmological-constant"],
  };
}

function axisCount(dialId, n) {
  const def = DIAL_DEFS.find((d) => d.id === dialId || (dialId === "cosmological_constant" && d.id === "cosmological_constant"));
  if (def && def.scale === "discrete") return def.range[1] - def.range[0] + 1;
  return n;
}

function mapAt(params, xDial, yDial, n) {
  const x = xDial === "cosmological-constant" ? "cosmological_constant" : xDial;
  const y = yDial === "cosmological-constant" ? "cosmological_constant" : yDial;
  return dialPairGrid(x, y, {
    hold: holdOf(params),
    nx: axisCount(x, n),
    ny: axisCount(y, n),
  });
}

function run(params) {
  const hold = holdOf(params);
  const ev = evaluate(hold);
  return {
    example: false,
    fidelity: "engine",
    verdict: null,
    note: "Region colours follow the locked stage rules. The honesty label and sources on each region are the atlas records.",
    atlas: {
      hold,
      stages: ev.stages,
      links: ev.links,
      windows: ev.windows,
      map: mapAt(params, "alpha", "beta", 15),
      lambda: lambdaLine({ hold, n: 81 }),
      strips: dialStrips({ hold, n: 41 }),
      dimensions: dimensionPanel({ hold }),
    },
  };
}

export { id, title, family, boardTitle, summary, cardIds, lockNote, fidelity, engine, params, views, run, mapAt, LABEL, DIAL_DEFS };
