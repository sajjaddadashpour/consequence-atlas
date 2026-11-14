// Contract check for playground models. Example modules must not pretend to be the engine.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(readFileSync(join(root, "models/order.json"), "utf8"));

const required = {
  "atlas-map": {
    params: ["alpha", "beta", "strong", "cosmological-constant", "dimensions", "arrow"],
    views: ["map", "timeline", "lambda"],
  },
  particles: {
    params: ["dim", "size", "steps", "seed", "start", "attract", "temp", "expand", "light", "c"],
    views: ["lattice", "series"],
  },
  "phase-field": {
    params: ["size", "beta", "gauge", "noise", "disorder", "seed"],
    views: ["phase", "series"],
  },
  "cellular-automaton": {
    params: ["rule", "rev", "cstart"],
    views: ["spacetime", "series"],
  },
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (order.join(",") !== Object.keys(required).join(",")) {
  fail("order.json must list atlas-map, particles, phase-field, cellular-automaton");
}

for (const id of order) {
  const mod = await import(pathToFileURL(join(root, "models", id + ".js")).href);
  for (const key of ["id", "title", "cardIds", "params", "views", "run"]) {
    if (mod[key] === undefined) fail(id + " is missing export " + key);
  }
  if (mod.id !== id) fail(id + " exports id " + mod.id);
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
    const blob = JSON.stringify(param).toLowerCase();
    if (blob.includes("mirror ratio")) fail(id + " labels a control 'mirror ratio'");
  }
  const values = {};
  for (const param of mod.params) values[param.name] = param.default;
  const result = await mod.run(values);
  if (!result || result.example !== true || result.fidelity !== "example") {
    fail(id + " placeholder must return example: true and fidelity: 'example'");
  }
  if (result.verdict) fail(id + " placeholder must not emit a verdict");
  const edge = {};
  for (const param of mod.params) edge[param.name] = param.min !== undefined && param.min !== null ? param.min : param.default;
  await mod.run(edge);
}

if (!process.exitCode) console.log("model contract ok (" + order.length + " modules)");
