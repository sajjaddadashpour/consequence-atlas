// URL state, canonical run hash, and the local storage adapter. No browser, no server.
import { createMemoryStorage, createLocalStorageAdapter } from "./static/storage.js";
import {
  applyQuery,
  buildRunRecord,
  encodeHash,
  parseHash,
  stableString,
} from "./static/run-record.js";

const model = {
  id: "particles",
  engine: { name: "example", version: "0" },
  params: [
    { name: "dim", type: "integer", min: 1, max: 2, default: 2, locked: 2 },
    { name: "size", type: "integer", min: 32, max: 128, default: 64, locked: 64, free: { min: 8, max: 192 } },
    { name: "seed", type: "integer", min: 1, max: 999, default: 1, locked: 1, free: { min: 1, max: 999999 } },
    { name: "expand", type: "boolean", default: false, locked: false },
    { name: "start", type: "enum", default: "scattered", locked: "scattered", options: [
      { value: "paired" }, { value: "scattered" },
    ] },
  ],
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const params = { dim: 2, size: 64, seed: 1, expand: false, start: "scattered" };
const hash = encodeHash(model, params, false);
const parsed = parseHash("#" + hash);
if (parsed.path !== "particles") fail("hash path");
const applied = applyQuery(model, parsed.query, {
  dim: 0, size: 0, seed: 0, expand: true, start: "paired",
});
if (applied.freePlay) fail("locked url must not turn on free play");
if (applied.params.seed !== 1 || applied.params.expand !== false || applied.params.start !== "scattered") {
  fail("url did not round-trip " + JSON.stringify(applied.params));
}
if (applied.engineNote) fail("same engine should not warn");

const wide = new URLSearchParams(parsed.query);
wide.set("size", "160");
wide.set("free", "0");
const widened = applyQuery(model, wide, params);
if (!widened.freePlay || widened.params.size !== 160) fail("out-of-range value must become free play");

const other = new URLSearchParams(parsed.query);
other.set("engine", "starter@3.0.0");
const mismatch = applyQuery(model, other, params);
if (!mismatch.engineNote.includes("starter@3.0.0")) fail("engine mismatch should be visible");

const example = await buildRunRecord(model, params, { example: true, fidelity: "example", verdict: "GROWS" }, false);
if (example.verdict !== null || example.fidelity !== "example") fail("example run must not keep a verdict");
if (example.seed !== 1) fail("seed should be lifted");
const again = await buildRunRecord(model, params, { example: true, fidelity: "example", verdict: "GROWS" }, false);
if (example.hash !== again.hash || example.hash.length !== 64) fail("hash should be stable sha256");
const played = await buildRunRecord(model, params, { example: true, fidelity: "example" }, true);
if (played.hash === example.hash || played.freePlay !== true) fail("free play must change the hash");

const engineRun = await buildRunRecord(model, params, { example: false, fidelity: "engine", verdict: "CLUMPS" }, false);
if (engineRun.verdict !== "CLUMPS") fail("engine verdict should be kept");

const store = createLocalStorageAdapter(createMemoryStorage());
await store.saveRun(example);
await store.saveRun(example);
const listed = await store.listRuns();
if (listed.length !== 1) fail("duplicate hash should be one run, got " + listed.length);
if (!listed[0].savedAt) fail("savedAt is storage metadata");
if (stableString(example).includes("savedAt")) fail("caller record should not need savedAt");
const got = await store.getRun(example.hash);
if (!got || got.params.seed !== 1) fail("getRun");
if (await store.getRun("missing")) fail("missing run should be null");

if (!process.exitCode) console.log("run record ok");
