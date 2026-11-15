// UI adapter. The lattice is site/engine/starter.js, unmodified.
// run() finishes the engine, then hands back the recorded frames for playback.
import { run as engineRun, lookShapes, PALS } from "../engine/starter.js";

const id = "starter";
const title = "Universe Starter";
const family = "starter";
const boardTitle = "Parameters";
const summary = "Pinned Universe Starter. The page runs a modest lattice, then plays the recorded frames.";
const cardIds = [
  "c.v3o.019.sticky-symmetry",
  "c.v3o.014.gauge-crystallization",
  "c.v3o.035.sierpinski-seed.sf-rule",
];
const lockNote = "Locked values are the live-demo defaults (size 64, steps 200, dim 2, family P, start paired). The engine default size is 4096; this page does not start that. The card labels beside the verdict are the atlas records. They are not changed to match this run.";
const fidelity = "engine";
const engine = { name: "starter", version: "3.0.0" };

const params = [
  {
    name: "family",
    label: "Family",
    default: "P",
    locked: "P",
    type: "enum",
    options: [
      { value: "P", label: "P — particles" },
      { value: "F", label: "F — phase field" },
      { value: "C", label: "C — cellular automaton" },
      { value: "G", label: "G — lattice gas" },
      { value: "Q", label: "Q — quantum walk" },
      { value: "M", label: "M — meta" },
    ],
    help: "Existing Cfg field family.",
  },
  {
    name: "dim",
    label: "Dimensions",
    min: 1,
    max: 2,
    step: 1,
    default: 2,
    locked: 2,
    type: "integer",
    scale: "discrete",
    help: "Cfg field dim. This page runs 1 or 2 so the live lattice stays modest.",
  },
  {
    name: "size",
    label: "Size",
    min: 16,
    max: 64,
    free: { min: 8, max: 96 },
    step: 1,
    default: 64,
    locked: 64,
    type: "integer",
    scale: "discrete",
    help: "Sites along an edge. The pinned engine default is 4096; the live page stops at 96.",
  },
  {
    name: "steps",
    label: "Steps",
    min: 40,
    max: 200,
    free: { min: 20, max: 400 },
    step: 1,
    default: 200,
    locked: 200,
    type: "integer",
    scale: "discrete",
  },
  {
    name: "seed",
    label: "Seed",
    min: 1,
    max: 999,
    free: { min: 0, max: 999999 },
    step: 1,
    default: 1,
    locked: 1,
    type: "integer",
    scale: "discrete",
  },
  {
    name: "start",
    label: "Start",
    default: "paired",
    locked: "paired",
    type: "enum",
    options: ["paired", "scattered", "blob", "hot", "line", "light"].map((value) => ({ value, label: value })),
    help: "Cfg field start. paired is the +/- pairing.",
  },
  {
    name: "attract",
    label: "Attraction",
    default: "off",
    locked: "off",
    type: "enum",
    options: ["off", "short", "long"].map((value) => ({ value, label: value })),
  },
  {
    name: "temp",
    label: "Temperature",
    min: 0,
    max: 2,
    free: { min: 0, max: 8 },
    step: 0.01,
    default: 0.5,
    locked: 0.5,
    type: "number",
    scale: "linear",
  },
  {
    name: "expand",
    label: "Expansion",
    default: false,
    locked: false,
    type: "boolean",
  },
  {
    name: "light",
    label: "Light",
    default: true,
    locked: true,
    type: "boolean",
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
    type: "integer",
    scale: "discrete",
    help: "Sites per step, when light is on.",
  },
  {
    name: "gauge",
    label: "Gauge links",
    default: false,
    locked: false,
    type: "boolean",
    help: "Cfg field gauge. Family F.",
  },
  {
    name: "beta",
    label: "Gauge coupling beta",
    min: 0,
    max: 2,
    free: { min: 0, max: 8 },
    step: 0.05,
    default: 1,
    locked: 1,
    type: "number",
    scale: "linear",
    help: "Cfg field beta on family F. Not the mass ratio m_e/m_p.",
  },
  {
    name: "noise",
    label: "Noise",
    default: "cores",
    locked: "cores",
    type: "enum",
    options: ["off", "uniform", "cores"].map((value) => ({ value, label: value })),
  },
  {
    name: "rule",
    label: "Rule",
    min: 0,
    max: 255,
    step: 1,
    default: 30,
    locked: 30,
    type: "integer",
    scale: "discrete",
    help: "Cfg field rule. Family C.",
  },
  {
    name: "rev",
    label: "Reversible",
    default: false,
    locked: false,
    type: "boolean",
  },
  {
    name: "cstart",
    label: "CA start",
    default: "random",
    locked: "random",
    type: "enum",
    options: ["random", "blob", "seed"].map((value) => ({ value, label: value })),
  },
];

const views = ["look", "series"];

function modest(params) {
  const family = params.family || "P";
  let dim = params.dim >= 2 ? 2 : 1;
  let size = Math.round(Number(params.size));
  let steps = Math.round(Number(params.steps));
  if (family === "Q") {
    dim = 1;
    size = Math.min(size, 48);
    steps = Math.min(steps, 80);
  }
  if (family === "M") {
    size = Math.min(size, 32);
    steps = Math.min(steps, 40);
  }
  size = Math.max(8, Math.min(family === "Q" ? 48 : 96, size));
  steps = Math.max(20, Math.min(family === "Q" ? 80 : 400, steps));
  const applied = {
    family,
    dim,
    size,
    steps,
    seed: Math.round(Number(params.seed)) || 0,
    start: params.start,
    attract: params.attract,
    temp: params.temp,
    expand: Boolean(params.expand),
    light: Boolean(params.light),
    c: params.c,
    gauge: Boolean(params.gauge),
    beta: params.beta,
    noise: params.noise,
    rule: Math.round(Number(params.rule)),
    rev: Boolean(params.rev),
    cstart: params.cstart,
  };
  if (family === "M") {
    applied.popN = 4;
    applied.gens = 2;
  }
  return applied;
}

function run(params) {
  const applied = modest(params);
  const rd = engineRun(applied);
  const lattice = rd.lattice;
  const frames = lattice.frames || [];
  const pal = PALS[0];
  const looks = frames.map((frame, i) => lookShapes(frame, {
    fam: lattice.family,
    pal,
    W: 640,
    H: 480,
    t: i * 0.15,
  }));
  const series = lattice.series || {};
  const t = series.ts || [];
  return {
    example: false,
    fidelity: "engine",
    verdict: lattice.verdict || null,
    appliedParams: {
      family: applied.family,
      dim: applied.dim,
      size: applied.size,
      steps: applied.steps,
    },
    note: "The engine ran to the end, then these frames were played back. A mid-run snapshot would finish early and spoil the verdict. Stars, halos, and twinkle in the Look legend are decoration.",
    seriesLabels: {
      ns: lattice.ylabel || "ns",
      ss: "ss",
      cs: "cs",
    },
    series: {
      t,
      ns: series.ns || [],
      ss: series.ss || [],
      cs: series.cs || [],
    },
    starter: {
      family: lattice.family,
      verdict: lattice.verdict,
      checks: lattice.checks || [],
      legend: lattice.legend || [],
      frames: looks,
      pal,
      applied,
    },
  };
}

export { id, title, family, boardTitle, summary, cardIds, lockNote, fidelity, engine, params, views, run };
