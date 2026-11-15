// Universe Starter browser engine. Spec: LOCKED_SITE_ENGINE.md.
// Wraps the pinned v3 engine (sha256 8487a8d2b8c7cfdd28a5487c32d7fac93c29e57b8f8bcd108a7141767264667d).
// Look-view shapes are visual only (copied from look_code.tsx). No new physics.
// There is no "mirror ratio" parameter; pairing is start === "paired".

import { makeSim, DEF, baselineOf, sampleCfg, mulberry32 } from "./starter-engine.js";
import { cards as starterCards } from "./starter-cards.js";

export const id = "starter";
export const cards = starterCards;
export { makeSim, DEF, baselineOf, sampleCfg, mulberry32 };

export const PALS = [
  { name: "Nebula", bg: "#06070f", plus: "#ff7ab6", minus: "#62d2ff", neutral: "#c9b8ff", light: "#fff3b0", record: "#ffffff", bond: "rgba(180,170,255,0.35)", star: "#cfd8ff", hue0: 0, sat: 0.85 },
  { name: "Ember", bg: "#0d0604", plus: "#ffb347", minus: "#ff4e50", neutral: "#ffd8a8", light: "#fff7d6", record: "#ffffff", bond: "rgba(255,160,90,0.35)", star: "#ffe2c4", hue0: 0.02, sat: 0.9 },
  { name: "Ice", bg: "#03080d", plus: "#9ff5ff", minus: "#5a8cff", neutral: "#e0f7ff", light: "#ffffff", record: "#ffffff", bond: "rgba(150,220,255,0.3)", star: "#e6f7ff", hue0: 0.5, sat: 0.6 },
  { name: "Mono", bg: "#000000", plus: "#ffffff", minus: "#8a8a8a", neutral: "#cccccc", light: "#ffffff", record: "#ffffff", bond: "rgba(255,255,255,0.25)", star: "#bbbbbb", hue0: 0, sat: 0 },
];

export const dials = [
  { id: "family", name: "family", range: ["P", "F", "Q", "C", "G", "M"], default: "P", units: "P particles, F phase field, Q quantum walk, C cellular automata / Potts, G lattice gas, M meta", locked: false, scale: "discrete" },
  { id: "dim", name: "dim", range: [1, 3], default: DEF.dim, units: "space dimensions", locked: false, scale: "discrete" },
  { id: "size", name: "size", range: [8, 4096], default: DEF.size, units: "lattice side", locked: false, scale: "linear", demoDefault: 64 },
  { id: "steps", name: "steps", range: [1, 8000], default: DEF.steps, units: "time steps", locked: false, scale: "linear", demoDefault: 400 },
  { id: "seed", name: "seed", range: [0, 4294967295], default: DEF.seed, units: "uint32", locked: false, scale: "linear" },
  { id: "start", name: "start", range: ["paired", "scattered", "blob", "hot", "line", "light"], default: "paired", units: "initial condition (paired is the +/- pairing; there is no 'mirror ratio')", locked: false, scale: "discrete" },
  { id: "attract", name: "attract", range: ["off", "short", "long"], default: "off", units: "attraction", locked: false, scale: "discrete" },
  { id: "temp", name: "temp", range: [0, 2], default: DEF.temp, units: "temperature (model units)", locked: false, scale: "linear" },
  { id: "expand", name: "expand", range: [false, true], default: false, units: "on/off", locked: false, scale: "discrete" },
  { id: "light", name: "light", range: [false, true], default: DEF.light, units: "on/off", locked: false, scale: "discrete" },
  { id: "c", name: "c", range: [1, 4], default: DEF.c, units: "light speed in sites/step", locked: false, scale: "discrete" },
  { id: "gauge", name: "gauge", range: [false, true], default: false, units: "U(1) links (family F)", locked: false, scale: "discrete" },
  { id: "beta", name: "beta", range: [0, 2], default: DEF.beta, units: "gauge coupling (family F; not m_e/m_p)", locked: false, scale: "linear" },
  { id: "noise", name: "noise", range: ["off", "uniform", "cores"], default: DEF.noise, units: "phase-field noise", locked: false, scale: "discrete" },
  { id: "rule", name: "rule", range: [0, 255], default: DEF.rule, units: "elementary CA rule (family C)", locked: false, scale: "linear" },
  { id: "rev", name: "rev", range: [false, true], default: false, units: "reversible CA", locked: false, scale: "discrete" },
  { id: "cstart", name: "cstart", range: ["random", "blob", "seed"], default: "random", units: "CA start", locked: false, scale: "discrete" },
];

export function fillCfg(partial) {
  return { ...DEF, ...(partial || {}) };
}

function typedToArray(x) {
  if (x == null) return null;
  if (Array.isArray(x)) return x;
  if (ArrayBuffer.isView(x)) return Array.from(x);
  return x;
}

export function frameToJSON(f) {
  if (!f) return null;
  return {
    w: f.w, h: f.h, kind: f.kind,
    data: typedToArray(f.data),
    vort: typedToArray(f.vort),
    aux: typedToArray(f.aux),
  };
}

export function resultToJSON(r) {
  if (!r) return null;
  return {
    family: r.family,
    verdict: r.verdict,
    checks: r.checks,
    ts: r.ts, ns: r.ns, ss: r.ss, cs: r.cs,
    m: r.m,
    frames: (r.frames || []).map(frameToJSON),
    strip: frameToJSON(r.strip),
    warn: r.warn,
    ylabel: r.ylabel,
  };
}

const TWO = 2 * Math.PI;
const isMat = (v) => v === 1 || v === 2 || v === 4;
function glyphOf(fam, v) {
  if (fam === "C") return v === 1 ? "tile" : null;
  return v === 1 ? "tri" : v === 2 ? "sq" : v === 4 ? "dia" : v === 3 ? "spark" : null;
}
function occ4(d, w, h, x, y) {
  const o = (xx, yy) => (isMat(d[(((yy + h) % h) * w + ((xx + w) % w))]) ? 1 : 0);
  return o(x + 1, y) + o(x - 1, y) + o(x, y + 1) + o(x, y - 1);
}

/** Look-view shape lists for one frame. Geometry only; no canvas. Decoration fields are marked. */
export function lookShapes(frame, opts = {}) {
  if (!frame) return null;
  const fam = opts.fam || "P";
  const t = opts.t || 0;
  const pal = opts.pal || PALS[0];
  const W = opts.W || 640, H = opts.H || 480;
  const cell = Math.min((W * 0.94) / frame.w, (H * 0.94) / frame.h);
  const ox = (W - frame.w * cell) / 2, oy = (H - frame.h * cell) / 2;
  const d = frame.data;
  const out = { kind: frame.kind, fam, w: frame.w, h: frame.h, ox, oy, cell, pal: pal.name, decoration: ["starfield", "halos", "twinkle", "rotation"] };

  if (frame.kind === "phase") {
    const st = Math.max(1, Math.ceil(frame.w / 36));
    const arrows = [];
    for (let y = 0; y < frame.h; y += st) {
      for (let x = 0; x < frame.w; x += st) {
        const th = d[y * frame.w + x];
        arrows.push({ x: ox + (x + 0.5) * cell, y: oy + (y + 0.5) * cell, th, len: cell * st * 0.38 });
      }
    }
    const vortices = [];
    if (frame.vort) {
      for (let k = 0; k < frame.w * frame.h; k++) {
        const sign = frame.vort[k];
        if (!sign) continue;
        vortices.push({ x: ox + ((k % frame.w) + 1) * cell, y: oy + (Math.floor(k / frame.w) + 1) * cell, sign, r: Math.max(5, cell * 1.4) });
      }
    }
    out.phase = typedToArray(d);
    out.arrows = arrows;
    out.vortices = vortices;
    return out;
  }

  if (frame.kind === "scalar") {
    out.scalar = typedToArray(d);
    out.aux = typedToArray(frame.aux);
    if (fam === "G" && frame.aux) {
      const streaks = [];
      const dx = [1, 0, -1, 0], dy = [0, 1, 0, -1];
      const n = frame.w * frame.h;
      for (let b = 0; b < 4; b++) {
        for (let k = 0; k < n; k++) {
          const v = frame.aux[k];
          if (!v || !(v & (1 << b))) continue;
          streaks.push({
            x: ox + (k % frame.w + 0.5) * cell,
            y: oy + (Math.floor(k / frame.w) + 0.5) * cell,
            dx: dx[b], dy: dy[b], dir: b,
          });
        }
      }
      out.streaks = streaks;
    }
    return out;
  }

  // categorical
  const glyphs = [];
  const bonds = [];
  const n = frame.w * frame.h;
  if (opts.bonds !== false) {
    for (let k = 0; k < n; k++) {
      if (!isMat(d[k])) continue;
      const x = k % frame.w, y = Math.floor(k / frame.w);
      if (x + 1 < frame.w && isMat(d[k + 1])) bonds.push({ x, y, to: "e" });
      if (y + 1 < frame.h && isMat(d[k + frame.w])) bonds.push({ x, y, to: "s" });
    }
  }
  for (let k = 0; k < n; k++) {
    const gl = glyphOf(fam, d[k]);
    if (!gl) continue;
    const x = k % frame.w, y = Math.floor(k / frame.w);
    const nb = gl === "spark" ? 0 : occ4(d, frame.w, frame.h, x, y);
    glyphs.push({
      glyph: gl,
      i: k, x, y,
      cx: ox + (x + 0.5) * cell,
      cy: oy + (y + 0.5) * cell,
      s: Math.max(1.2, cell * (0.3 + 0.06 * nb)),
      rot: gl === "dia" ? 0 : t * (0.9 - 0.2 * nb) + x * 0.7 + y * 1.3,
      neighbours: nb,
      value: d[k],
    });
  }
  out.glyphs = glyphs;
  out.bonds = bonds;
  out.legend = lookLegend(fam, !!opts.strip);
  return out;
}

export function lookLegend(fam, hasStrip) {
  if (fam === "P") return [
    ...(hasStrip ? [["The ring", "the 1D universe itself (it is periodic); history fades inward, newest on the outer circle"]] : []),
    ["Triangle", "+ charge (or a particle if the alphabet is 0/1)"],
    ["Square", "− charge"],
    ["Glowing diamond", "particle holding a copy of the tracked record"],
    ["Four-ray spark", "light quantum"],
    ["Glyph size", "number of occupied nearest neighbours (0–4)"],
    ["Thin bonds", "two occupied neighbouring sites"],
    ["Stars drifting outward", "decoration, or the real lattice growth if expand is on"],
  ];
  if (fam === "F") return [
    ["Background hue", "phase angle θ at each site"],
    ["White strokes", "the arrow direction θ, sampled on a grid"],
    ["Spirals", "vortices: one colour and turning direction per winding sign"],
  ];
  if (fam === "Q") return [
    ["Brightness", "probability (square-root scaled)"],
    ["Hue", "phase of the first coin amplitude"],
  ];
  if (fam === "C") return [
    ["Pale tile", "live cell"],
    ["Bright tile / ghost", "born / died since the previous frame (when a previous frame is supplied)"],
  ];
  return [
    ["Streak", "a gas particle; its direction is its real velocity (one of 4)"],
    ["Streak colour", "which of the 4 directions"],
  ];
}

export function makeStars(n, seed) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => ({ ang: r() * TWO, r0: r(), tw: r() * TWO }));
}

export function create(partial) {
  const cfg = fillCfg(partial);
  const sim = makeSim(cfg);
  let finished = null;
  const api = {
    cfg,
    step(n = 1) {
      const k = Math.max(1, n | 0);
      for (let i = 0; i < k && sim.done < sim.total; i++) sim.stepOnce();
      return api.state();
    },
    state() {
      return {
        family: cfg.family,
        done: sim.done,
        total: sim.total,
        finished: finished != null,
        verdict: finished ? finished.verdict : null,
        m: finished ? finished.m : null,
        note: finished
          ? null
          : "Lattice frames and measures are recorded inside the pinned engine and are returned by finish(); mid-run peeking would call finish early and mis-compute the verdict, so state() only reports progress until finish().",
      };
    },
    finish() {
      if (!finished) finished = sim.finish();
      return finished;
    },
    renderData(opts = {}) {
      const r = finished || (sim.done >= sim.total ? (finished = sim.finish()) : null);
      if (!r) {
        return { ready: false, done: sim.done, total: sim.total, frames: [], look: null, note: "Call finish() or run to completion to obtain frames. The pinned engine does not expose a mid-run lattice snapshot." };
      }
      const frames = (r.frames || []).map(frameToJSON);
      const last = r.frames && r.frames.length ? r.frames[r.frames.length - 1] : r.strip;
      return {
        ready: true,
        family: r.family,
        verdict: r.verdict,
        checks: r.checks,
        ylabel: r.ylabel,
        series: { ts: r.ts, ns: r.ns, ss: r.ss, cs: r.cs },
        m: r.m,
        warn: r.warn,
        frames,
        strip: frameToJSON(r.strip),
        look: lookShapes(last, { fam: r.family, pal: PALS[opts.pal || 0], W: opts.W, H: opts.H, t: opts.t || 0, strip: !!r.strip, bonds: opts.bonds !== false }),
        legend: lookLegend(r.family, !!r.strip),
        stars: makeStars(80, cfg.seed), // decoration only
      };
    },
    get done() { return sim.done; },
    get total() { return sim.total; },
  };
  return api;
}

export function runSync(partial) {
  const api = create(partial);
  while (api.done < api.total) api.step(64);
  return api.finish();
}

export function run(dialValues) {
  const raw = dialValues || {};
  // Demo-friendly defaults only when the caller did not set size/steps/dim; engine DEF is unchanged.
  const demo = {
    ...DEF,
    dim: raw.dim ?? (raw.family === "F" || raw.family === "G" || raw.family === "C" ? 2 : 2),
    size: raw.size ?? 64,
    steps: raw.steps ?? 400,
    ...raw,
  };
  if (demo.family === "Q" && demo.dim == null) demo.dim = 1;
  const api = create(demo);
  while (api.done < api.total) api.step(128);
  const r = api.finish();
  const rd = api.renderData();
  return {
    id,
    dialBoard: { cfg: demo, ours_defaults: { ...DEF }, verdict: r.verdict, checks: r.checks, m: r.m, ylabel: r.ylabel, warn: r.warn },
    universeMap: null,
    stageStrip: null,
    lattice: rd,
  };
}

export default { id, cards, dials, run, create, runSync, lookShapes, DEF, makeSim };
