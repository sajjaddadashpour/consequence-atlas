// T-C: starter.js vs pinned engine.ts (tsx) and vs sim2.ts on v2-default configs.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSync, fillCfg, resultToJSON } from "../starter.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoEngine = "/workspace/physics/swarm/repo/engine/starter";
const engineTs = repoEngine + "/src/engine.ts";
const sim2 = "/workspace/physics/universe_starter_v2/sim2.ts";

function relClose(a, b, rtol = 1e-9, atol = 1e-15) {
  if (a == null && b == null) return true;
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    if (a === b) return true;
    const d = Math.abs(a - b);
    const den = Math.max(Math.abs(a), Math.abs(b));
    if (den === 0) return d <= atol;
    return d / den <= rtol || d <= atol;
  }
  return Object.is(a, b);
}

function walk(a, b, path = "") {
  const diffs = [];
  if (a && b && typeof a === "object" && typeof b === "object" && !ArrayBuffer.isView(a) && !ArrayBuffer.isView(b) && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) diffs.push(...walk(a[k], b[k], path + "." + k));
    return diffs;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [[path + ".len", a.length, b.length]];
    for (let i = 0; i < a.length; i++) diffs.push(...walk(a[i], b[i], path + "[" + i + "]"));
    return diffs;
  }
  if (ArrayBuffer.isView(a) || ArrayBuffer.isView(b)) {
    const aa = a ? Array.from(a) : a;
    const bb = b ? Array.from(b) : b;
    return walk(aa, bb, path);
  }
  if (!relClose(a, b)) diffs.push([path, a, b]);
  return diffs;
}

function bytesEqual(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const aa = ArrayBuffer.isView(a) ? a : Uint8Array.from(a);
  const bb = ArrayBuffer.isView(b) ? b : Uint8Array.from(b);
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
}

const SEEDS = [1, 2, 7, 42];
const BASES = [
  { name: "P1d", family: "P", dim: 1, size: 64, steps: 40 },
  { name: "P2d", family: "P", dim: 2, size: 16, steps: 40, start: "paired" },
  { name: "Pattr", family: "P", dim: 2, size: 16, steps: 40, start: "scattered", attract: "short", light: false },
  { name: "F", family: "F", size: 16, steps: 40, gauge: false },
  { name: "Fg", family: "F", size: 16, steps: 40, gauge: true, noise: "uniform", temp: 0.5 },
  { name: "Q1", family: "Q", dim: 1, steps: 40 },
  { name: "C1", family: "C", dim: 1, size: 64, steps: 40, rule: 30 },
  { name: "C2", family: "C", dim: 2, size: 16, steps: 40, cstart: "random" },
  { name: "G", family: "G", size: 16, steps: 40, gstart: "blob" },
];

function configs() {
  const out = [];
  for (const b of BASES) {
    for (const seed of SEEDS) out.push({ ...b, seed, label: b.name + ":s" + seed });
  }
  // one tiny M consist is heavy; one tiny pop
  out.push({ label: "Mpop", family: "M", meta: "pop", popN: 4, gens: 2, seed: 1, mut: 0.2, select: true, fitness: "clumps" });
  return out;
}

function runTs(entry, cfg) {
  const script = `
    import { makeSim, DEF } from ${JSON.stringify(entry)};
    const partial = ${JSON.stringify(cfg)};
    const c = { ...DEF, ...partial };
    delete c.name; delete c.label;
    const s = makeSim(c);
    while (s.done < s.total) s.stepOnce();
    const r = s.finish();
    const enc = (f) => f && ({ w: f.w, h: f.h, kind: f.kind, data: f.data && Array.from(f.data), vort: f.vort && Array.from(f.vort), aux: f.aux && Array.from(f.aux) });
    const out = { family: r.family, verdict: r.verdict, checks: r.checks, ts: r.ts, ns: r.ns, ss: r.ss, cs: r.cs, m: r.m, warn: r.warn, ylabel: r.ylabel, frames: (r.frames||[]).map(enc), strip: enc(r.strip) };
    process.stdout.write(JSON.stringify(out));
  `;
  const tmp = path.join(here, "_tmp_run.mts");
  fs.writeFileSync(tmp, script);
  const r = spawnSync("npx", ["tsx", tmp], { cwd: repoEngine, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (r.status !== 0) {
    return { error: r.stderr || r.stdout, status: r.status };
  }
  return JSON.parse(r.stdout);
}

const cfgs = configs();
const report = { engine_vs_js: [], sim2_vs_js: [], counts: {} };
let vM = 0, nM = 0, sM = 0, fM = 0, eM = 0, nRun = 0;
let v2m = 0, n2m = 0, s2m = 0, f2m = 0, e2m = 0, n2 = 0;

for (const cfg of cfgs) {
  nRun++;
  const js = resultToJSON(runSync(cfg));
  const ts = runTs(engineTs, cfg);
  if (ts.error) {
    eM++;
    report.engine_vs_js.push({ label: cfg.label, error: String(ts.error).slice(0, 400) });
    continue;
  }
  const vd = js.verdict !== ts.verdict;
  const md = walk(js.m, ts.m);
  const sd = walk({ ts: js.ts, ns: js.ns, ss: js.ss, cs: js.cs }, { ts: ts.ts, ns: ts.ns, ss: ts.ss, cs: ts.cs });
  let fd = 0;
  const nf = Math.max(js.frames.length, ts.frames.length);
  if (js.frames.length !== ts.frames.length) fd++;
  else {
    for (let i = 0; i < nf; i++) {
      if (js.frames[i].w !== ts.frames[i].w || js.frames[i].h !== ts.frames[i].h || js.frames[i].kind !== ts.frames[i].kind) fd++;
      else if (!bytesEqual(js.frames[i].data, ts.frames[i].data)) fd++;
      else if (!bytesEqual(js.frames[i].vort, ts.frames[i].vort)) fd++;
      else if (!bytesEqual(js.frames[i].aux, ts.frames[i].aux)) fd++;
    }
  }
  const stripD = walk(js.strip, ts.strip);
  if (vd) vM++;
  if (md.length) nM++;
  if (sd.length) sM++;
  if (fd || stripD.length) fM++;
  if (vd || md.length || sd.length || fd || stripD.length) {
    report.engine_vs_js.push({
      label: cfg.label, verdict: [js.verdict, ts.verdict],
      m_diffs: md.slice(0, 5), series_diffs: sd.slice(0, 5), frame_byte_mismatches: fd, strip_diffs: stripD.slice(0, 3),
    });
  }
}

// v2 regression: v3 defaults, configs that sim2 can run (no v3-only fields needed; fillCfg uses v3 DEF which includes v3 keys — strip them for sim2 by only passing v2 keys? sim2 DEF is smaller; extra keys are ignored if we spread into sim2 DEF.
const v2cfgs = cfgs.filter((c) => c.family !== "M");
for (const cfg of v2cfgs) {
  n2++;
  const js = resultToJSON(runSync(cfg));
  const ts = runTs(sim2, cfg);
  if (ts.error) {
    e2m++;
    report.sim2_vs_js.push({ label: cfg.label, error: String(ts.error).slice(0, 500) });
    continue;
  }
  const vd = js.verdict !== ts.verdict;
  // v3 reports extra measures (stalls, ccc*, holes, recS, ...). Compare only keys present in sim2.
  const shared = {};
  const jsShared = {};
  for (const k of Object.keys(ts.m || {})) { shared[k] = ts.m[k]; jsShared[k] = (js.m || {})[k]; }
  const md = walk(jsShared, shared);
  const sd = walk({ ts: js.ts, ns: js.ns, ss: js.ss, cs: js.cs }, { ts: ts.ts, ns: ts.ns, ss: ts.ss, cs: ts.cs });
  let fd = 0;
  if (js.frames.length !== ts.frames.length) fd += 1000 + Math.abs(js.frames.length - ts.frames.length);
  else {
    for (let i = 0; i < js.frames.length; i++) {
      if (js.frames[i].kind !== ts.frames[i].kind || js.frames[i].w !== ts.frames[i].w || js.frames[i].h !== ts.frames[i].h) fd++;
      else if (!bytesEqual(js.frames[i].data, ts.frames[i].data)) fd++;
      else if ((js.frames[i].vort || ts.frames[i].vort) && !bytesEqual(js.frames[i].vort, ts.frames[i].vort)) fd++;
      else if ((js.frames[i].aux || ts.frames[i].aux) && !bytesEqual(js.frames[i].aux, ts.frames[i].aux)) fd++;
    }
  }
  const stripD = walk(js.strip, ts.strip);
  if (vd) v2m++;
  if (md.length) n2m++;
  if (sd.length) s2m++;
  if (fd || stripD.length) f2m++;
  if (vd || md.length || sd.length || fd || stripD.length) {
    report.sim2_vs_js.push({
      label: cfg.label, verdict: [js.verdict, ts.verdict],
      m_diffs: md.slice(0, 5), series_diffs: sd.slice(0, 5), frame_byte_mismatches: fd, strip_diffs: stripD.slice(0, 3),
    });
  }
}

report.counts = {
  vs_engine_ts: { runs: nRun, verdict_mismatches: vM, m_mismatches: nM, series_mismatches: sM, frame_byte_mismatches_runs: fM, errors: eM },
  vs_sim2_ts: { runs: n2, verdict_mismatches: v2m, m_mismatches: n2m, series_mismatches: s2m, frame_byte_mismatches_runs: f2m, errors: e2m },
};
fs.writeFileSync(path.join(here, "starter_parity_report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.counts, null, 2));
console.log("examples engine", report.engine_vs_js.length, "sim2", report.sim2_vs_js.length);
if (report.engine_vs_js[0]) console.log("first engine", JSON.stringify(report.engine_vs_js[0], null, 2).slice(0, 800));
if (report.sim2_vs_js[0]) console.log("first sim2", JSON.stringify(report.sim2_vs_js[0], null, 2).slice(0, 800));
process.exit((vM + nM + sM + fM + eM + v2m + n2m + s2m + f2m + e2m) === 0 ? 0 : 2);
