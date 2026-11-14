// EXAMPLE DATA. Not family F of Universe Starter. Replace `run` with the physicist's module.
// `beta` is the engine gauge field, not the dial β = m_e/m_p.

const id = "phase-field";
const title = "Phase field";
const family = "F";
const boardTitle = "Parameters";
const summary = "Family F controls. The hue wheel and vortex marks are an example picture, not the engine.";
const cardIds = ["c.v3o.014.gauge-crystallization"];
const lockNote = "Locked size, beta, gauge, and noise follow c.v3o.014.gauge-crystallization. seed is 1. disorder is the engine default 0; that card does not set it. The card also sets steps and temp, which are not on this board. beta here is the engine gauge field, not the dial β = m_e/m_p.";
const fidelity = "example";

const params = [
  {
    name: "size",
    label: "Size",
    min: 16,
    max: 96,
    step: 1,
    default: 48,
    locked: 48,
    unit: "sites along an edge",
    type: "integer",
    scale: "discrete",
    help: "Sites along an edge, 16–96.",
  },
  {
    name: "beta",
    label: "Gauge beta",
    symbol: "",
    min: 0,
    max: 4,
    step: 0.05,
    default: 2,
    locked: 2,
    unit: "",
    type: "number",
    scale: "linear",
    help: "Gauge coupling. Not the dial β = m_e/m_p.",
  },
  {
    name: "gauge",
    label: "Gauge links",
    default: true,
    locked: true,
    unit: "",
    type: "boolean",
    help: "",
  },
  {
    name: "noise",
    label: "Noise",
    default: "uniform",
    locked: "uniform",
    unit: "",
    type: "enum",
    options: [
      { value: "off", label: "off" },
      { value: "uniform", label: "uniform" },
      { value: "cores", label: "cores" },
    ],
    help: "",
  },
  {
    name: "disorder",
    label: "Disorder",
    min: 0,
    max: 2,
    step: 0.05,
    default: 0,
    locked: 0,
    unit: "",
    type: "number",
    scale: "linear",
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
];

const views = ["phase", "series"];

function run(params) {
  const L = Math.max(8, Math.min(96, Math.round(params.size) || 48));
  const framesN = 12;
  const frames = [];
  const vortices = [];
  const series = { t: [], vortices: [] };
  const noiseShift = params.noise === "cores" ? 1.4 : params.noise === "uniform" ? 0.6 : 0;
  const tint = (params.beta || 0) * 0.35 + (params.disorder || 0) + noiseShift;
  const swirl = params.gauge ? 1 : 0.35;
  const seed = Math.round(params.seed) || 1;
  for (let f = 0; f < framesN; f += 1) {
    const phase = new Array(L * L);
    const ang = (f / framesN) * Math.PI * 2 + seed * 0.01;
    const cx = L * (0.38 + 0.08 * Math.cos(ang));
    const cy = L * (0.48 + 0.06 * Math.sin(ang));
    const cx2 = L * (0.68 + 0.05 * Math.sin(ang));
    const cy2 = L * (0.42 + 0.05 * Math.cos(ang * 0.8));
    for (let y = 0; y < L; y += 1) {
      for (let x = 0; x < L; x += 1) {
        const a = Math.atan2(y - cy, x - cx) + swirl * 0.35 * Math.atan2(y - cy2, x - cx2);
        const wrapped = (a + tint) / (Math.PI * 2);
        const frac = wrapped - Math.floor(wrapped);
        phase[y * L + x] = Math.floor(frac * 255);
      }
    }
    frames.push(phase);
    vortices.push([
      { x: cx / L, y: cy / L, sign: 1 },
      { x: cx2 / L, y: cy2 / L, sign: -1 },
    ]);
    series.t.push(f + 1);
    series.vortices.push(2);
  }
  return {
    example: true,
    fidelity: "example",
    verdict: null,
    note: "Example hue field with two marks. The vortex-count slot is the number of marks, not a winding count from the engine.",
    seriesLabels: { vortices: "Vortex-count slot (example)" },
    phase: { w: L, h: L, frames, vortices },
    series,
  };
}

export { id, title, family, boardTitle, summary, cardIds, lockNote, fidelity, params, views, run };
