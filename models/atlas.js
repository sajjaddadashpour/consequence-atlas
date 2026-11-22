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
const engine = { name: "atlas", version: "locked-2026-11-16a" };

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

function mapAt(params, xDial, yDial, n, featured) {
  const x = xDial === "cosmological-constant" ? "cosmological_constant" : xDial;
  const y = yDial === "cosmological-constant" ? "cosmological_constant" : yDial;
  const opts = {
    hold: holdOf(params),
    nx: axisCount(x, n),
    ny: axisCount(y, n),
  };
  if (featured && featured.length) opts.featured = featured;
  return dialPairGrid(x, y, opts);
}

function stageAt(params) {
  return evaluate(holdOf(params));
}

function stripsAt(params, n) {
  return dialStrips({ hold: holdOf(params), n: n || 41 });
}

function lambdaAt(params) {
  return lambdaLine({ hold: holdOf(params), n: 81 });
}

function dimensionsAt(params) {
  return dimensionPanel({ hold: holdOf(params) });
}

// Display copy for the sensitivity bar. The statuses themselves come from the engine.
const SENSITIVITY_CAVEAT =
  "Holds only while the other dials stay at the values on this board, under the locked atlas rules. A change of status is not a range that unconditionally breaks a stage. The link keeps the honesty label and the assumptions stored on that link.";

function dialKey(dialId) {
  return dialId === "cosmological-constant" ? "cosmological_constant" : dialId;
}

function diffLinks(leftLinks, rightLinks) {
  const prev = new Map(leftLinks.map((link) => [link.id, link]));
  const out = [];
  for (const link of rightLinks) {
    const before = prev.get(link.id);
    if (before && before.status === link.status) continue;
    out.push({
      id: link.id,
      label: link.label,
      from: link.from,
      to: link.to,
      was: before ? before.status : null,
      now: link.status,
      sources: link.sources || [],
    });
  }
  return out;
}

function linkBrief(link) {
  return {
    id: link.id,
    label: link.label,
    from: link.from,
    to: link.to,
    status: link.status,
    sources: link.sources || [],
  };
}

// Which links moved between two samples, according to evaluate().
// via "stage" means a link into the stage changed status.
// via "upstream" means the stage status moved because an earlier stage did.
function explainSwitch(params, dialId, from, to, stageId) {
  const id = dialKey(dialId);
  const hold = holdOf(params);
  const left = evaluate({ ...hold, [id]: from });
  const right = evaluate({ ...hold, [id]: to });
  const stage = right.stages.find((item) => item.id === stageId) || null;
  const before = left.stages.find((item) => item.id === stageId) || null;
  const changes = diffLinks(left.links, right.links);
  let relevant = changes.filter((link) => link.to === stageId);
  let via = "stage";
  if (!relevant.length) {
    const upstream = new Set();
    const pending = ((stage && stage.requires) || []).slice();
    const byId = new Map(right.stages.map((item) => [item.id, item]));
    while (pending.length) {
      const id = pending.pop();
      if (upstream.has(id)) continue;
      upstream.add(id);
      const earlier = byId.get(id);
      (earlier && earlier.requires || []).forEach((parent) => pending.push(parent));
    }
    relevant = changes.filter((link) => upstream.has(link.to));
    via = "upstream";
  }
  return {
    caveat: SENSITIVITY_CAVEAT,
    stageId,
    from,
    to,
    was: before ? before.status : null,
    now: stage ? stage.status : null,
    via,
    links: relevant,
    stageLinks: ((stage && stage.links) || []).map(linkBrief),
  };
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

export {
  id, title, family, boardTitle, summary, cardIds, lockNote, fidelity, engine, params, views, run,
  mapAt, stageAt, stripsAt, lambdaAt, dimensionsAt, explainSwitch, SENSITIVITY_CAVEAT, LABEL, DIAL_DEFS,
};
