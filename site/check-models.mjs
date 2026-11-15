// Contract check for playground models. Example modules must not pretend to be the engine.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(readFileSync(join(root, "models/order.json"), "utf8"));

const required = {
  atlas: {
    params: ["alpha", "beta", "strong", "cosmological-constant", "dimensions", "arrow"],
    views: ["map", "lambda", "strips", "dimensions", "stages"],
    engine: "atlas",
  },
  starter: {
    params: ["family", "dim", "size", "steps", "seed", "start", "attract", "temp", "expand", "light", "c", "gauge", "beta", "noise", "rule", "rev", "cstart"],
    views: ["look", "series"],
    engine: "starter",
  },
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (order.join(",") !== Object.keys(required).join(",")) {
  fail("order.json must list atlas, starter");
}

for (const id of order) {
  const mod = await import(pathToFileURL(join(root, "models", id + ".js")).href);
  for (const key of ["id", "title", "cardIds", "params", "views", "run"]) {
    if (mod[key] === undefined) fail(id + " is missing export " + key);
  }
  if (mod.id !== id) fail(id + " exports id " + mod.id);
  if (!mod.engine || mod.engine.name !== required[id].engine) {
    fail(id + " must name engine " + required[id].engine);
  }
  if (!Array.isArray(mod.cardIds)) fail(id + " cardIds must be an array");
  if (typeof mod.run !== "function") fail(id + " run must be a function");
  const names = mod.params.map((param) => param && param.name);
  for (const name of required[id].params) {
    if (!names.includes(name)) fail(id + " is missing param " + name);
  }
  for (const view of required[id].views) {
    if (!mod.views.includes(view)) fail(id + " is missing view " + view);
  }
  for (const param of mod.params) {
    for (const key of ["name", "label", "default", "locked"]) {
      if (param[key] === undefined) fail(id + " param " + param.name + " missing " + key);
    }
    const blob = JSON.stringify(param);
    if (/mirror ratio/i.test(blob)) fail(id + " labels a control mirror ratio");
    if (param.name === "beta" && !/mass ratio|gauge coupling/i.test(param.label)) {
      fail(id + " beta must be labelled mass ratio or gauge coupling, not left bare");
    }
  }
  const values = {};
  for (const param of mod.params) values[param.name] = param.default;
  const result = await mod.run(values);
  if (!result || result.example !== false || result.fidelity !== "engine") {
    fail(id + " must call the site engine (example false, fidelity engine)");
  }
  if (id === "atlas") {
    if (!result.atlas || !result.atlas.map || !result.atlas.stages) fail("atlas run missing views");
    if (result.verdict) fail("atlas run must not invent a single verdict");
    if (typeof mod.stageAt !== "function" || typeof mod.explainSwitch !== "function") {
      fail("atlas must export stageAt and explainSwitch");
    }
    const at4 = mod.stageAt(Object.assign({}, values, { dimensions: 4 }));
    const records = at4.stages.find((stage) => stage.id === "s10.records");
    if (!records || records.status !== "BLOCKED" || !/Records and memory/.test(records.name)) {
      fail("at 4 dimensions Records and memory must be BLOCKED, got " + (records && records.status));
    }
    const explained = mod.explainSwitch(values, "dimensions", 3, 4, "s10.records");
    if (!explained || explained.now !== "BLOCKED") fail("explainSwitch at n=4 must report BLOCKED for records");
    if (!/not a range that unconditionally breaks/.test(explained.caveat || "")) {
      fail("a dial-sensitivity explanation must say the range is not an unconditional break");
    }
    if (!/assumptions/.test(explained.caveat || "")) fail("sensitivity explanation must carry assumptions");
    if (!(explained.links || []).some((link) => link.id && link.label)) {
      fail("explainSwitch must name the link whose status changed, with its honesty label");
    }
  }
  if (id === "starter") {
    if (!result.starter || !result.verdict) fail("starter run missing verdict or frames");
    if (!result.starter.frames || !result.starter.frames.length) fail("starter run must return recorded frames");
  }
}

if (!process.exitCode) console.log("model contract ok (" + order.length + " modules)");
