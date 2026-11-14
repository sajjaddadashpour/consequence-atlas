// EXAMPLE DATA. Not family P of Universe Starter. Replace `run` with the physicist's module.
// Parameter names match Cfg in engine/starter/src/engine.ts.

const id = "particles";
const title = "Particles on a lattice";
const family = "P";
const boardTitle = "Parameters";
const summary = "Family P controls. The grid and curves are an example pattern, not the engine.";
const cardIds = ["c.v3o.019.sticky-symmetry"];
const lockNote = "Locked dim, size, steps, start, attract, and temp follow c.v3o.019.sticky-symmetry. seed is 1, the card's first run. expand, light, and c are engine defaults because that card does not set them. The card also sets rho, ncons, a2, records, leak, and J, which are not on this board.";
const fidelity = "example";

const params = [
  {
    name: "dim",
    label: "Dimensions",
    min: 1,
    max: 2,
    step: 1,
    default: 2,
    locked: 2,
    unit: "count",
    type: "integer",
    scale: "discrete",
    help: "",
  },
  {
    name: "size",
    label: "Size",
    min: 32,
    max: 128,
    step: 1,
    default: 64,
    locked: 64,
    unit: "sites along an edge",
    type: "integer",
    scale: "discrete",
    help: "Sites along an edge, 32–128.",
  },
  {
    name: "steps",
    label: "Steps",
    min: 100,
    max: 2000,
    step: 1,
    default: 400,
    locked: 400,
    unit: "steps",
    type: "integer",
    scale: "discrete",
    help: "",
  },
  {
    name: "seed",
    label: "Seed",
    min: 1,
    max: 999,
    step: 1,
    default: 1,
    locked: 1,
    unit: "",
    type: "integer",
    scale: "discrete",
    help: "",
  },
  {
    name: "start",
    label: "Start",
    default: "scattered",
    locked: "scattered",
    unit: "",
    type: "enum",
    options: [
      { value: "paired", label: "paired" },
      { value: "scattered", label: "scattered" },
      { value: "blob", label: "blob" },
      { value: "hot", label: "hot" },
    ],
    help: "",
  },
  {
    name: "attract",
    label: "Attraction",
    default: "short",
    locked: "short",
    unit: "",
    type: "enum",
    options: [
      { value: "off", label: "off" },
      { value: "short", label: "short" },
      { value: "long", label: "long" },
    ],
    help: "",
  },
  {
    name: "temp",
    label: "Temperature",
    min: 0,
    max: 2,
    step: 0.01,
    default: 0.4,
    locked: 0.4,
    unit: "",
    type: "number",
    scale: "linear",
    help: "",
  },
  {
    name: "expand",
    label: "Expansion",
    default: false,
    locked: false,
    unit: "",
    type: "boolean",
    help: "",
  },
  {
    name: "light",
    label: "Light",
    default: false,
    locked: false,
    unit: "",
    type: "boolean",
    help: "",
  },
  {
    name: "c",
    label: "Light speed",
    symbol: "c",
    min: 1,
    max: 4,
    step: 1,
    default: 1,
    locked: 1,
    unit: "sites / step",
    type: "integer",
    scale: "discrete",
    help: "Sites per step, when light is on.",
  },
];

const views = ["lattice", "series"];

function lcg(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function run(params) {
  const dim = params.dim >= 2 ? 2 : 1;
  const size = Math.max(8, Math.min(160, Math.round(params.size)));
  const w = size;
  const h = dim === 1 ? 1 : size;
  const framesN = 24;
  const steps = Math.max(1, Math.round(params.steps) || 1);
  const rng = lcg((Math.round(params.seed) || 1) * 1009 + size + (params.start || "").length);
  const count = dim === 1
    ? Math.max(16, Math.min(64, Math.round(size * 0.4)))
    : Math.max(48, Math.min(200, Math.round(size * size * 0.05)));
  const specks = [];
  const startBoost = params.start === "blob" ? 0.25 : params.start === "hot" ? 0.9 : params.start === "paired" ? 0.15 : 0.45;
  const blob = params.start === "blob";
  for (let i = 0; i < count; i += 1) {
    specks.push({
      x: blob ? 0.35 + rng() * 0.3 : rng(),
      y: dim === 1 ? 0 : (blob ? 0.35 + rng() * 0.3 : rng()),
      vx: (rng() - 0.5) * 0.03 * (0.4 + startBoost),
      vy: (rng() - 0.5) * 0.03 * (0.4 + startBoost),
      q: rng() < 0.5 ? 1 : -1,
    });
  }
  const attract = params.attract === "long" ? 0.9 : params.attract === "short" ? 0.55 : 0.15;
  const frames = [];
  const series = { t: [], entropy: [], particles: [], clustering: [] };
  for (let f = 0; f < framesN; f += 1) {
    const cells = new Array(w * h).fill(0);
    for (const speck of specks) {
      speck.x = (speck.x + speck.vx + 1) % 1;
      speck.y = (speck.y + speck.vy + 1) % 1;
      const x = Math.min(w - 1, Math.floor(speck.x * w));
      const y = Math.min(h - 1, Math.floor(speck.y * h));
      cells[y * w + x] = speck.q;
    }
    frames.push(cells);
    const u = (f + 1) / framesN;
    const wobble = 0.04 * Math.sin(u * 6.28 + (params.c || 1));
    series.t.push(Math.max(1, Math.round(u * steps)));
    series.entropy.push(0.15 + u * (0.2 + (params.temp || 0) / 3) + wobble);
    series.particles.push(count * (1 - 0.1 * u * (params.light ? 0.4 : 1)));
    series.clustering.push(attract * (0.3 + 0.7 * u) + (params.expand ? -0.08 * u : 0));
  }
  return {
    example: true,
    fidelity: "example",
    verdict: null,
    note: "Example pattern in the lattice, entropy, particle-count, and clustering slots. Not a Universe Starter run, and not a verdict.",
    seriesLabels: {
      entropy: "Entropy slot (example)",
      particles: "Particle-count slot (example)",
      clustering: "Clustering slot (example)",
    },
    lattice: { w, h, frames },
    series,
  };
}

export { id, title, family, boardTitle, summary, cardIds, lockNote, fidelity, params, views, run };
