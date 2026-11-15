// A typed dial value keeps the URL's spelling. The slider step is not applied.
import { applyQuery, commitExact, encodeHash, parseHash } from "./static/run-record.js";

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const alpha = {
  name: "alpha",
  type: "number",
  scale: "log",
  min: 1e-6,
  max: 1,
  default: 0.0072973525693,
  locked: 0.0072973525693,
  free: { min: 1e-8, max: 10 },
};
const model = {
  id: "atlas",
  engine: { name: "atlas", version: "locked-2026-11-14" },
  params: [alpha],
};

const typed = commitExact(alpha, "0.0146", false);
if (!typed || typed.freePlay) fail("0.0146 is inside the locked range");
if (typed.canonical !== "0.0146" || typed.value !== Number("0.0146")) {
  fail("typed alpha was changed to " + (typed && typed.canonical));
}
const hash = encodeHash(model, { alpha: typed.value }, typed.freePlay);
if (!hash.includes("alpha=0.0146")) fail("share link lost the typed spelling: " + hash);
const applied = applyQuery(model, parseHash("#" + hash).query, { alpha: alpha.default });
if (applied.freePlay) fail("reading the link turned free play on");
if (applied.params.alpha !== Number("0.0146")) {
  fail("link did not reproduce 0.0146, got " + applied.params.alpha);
}
const again = encodeHash(model, applied.params, applied.freePlay);
if (again !== hash) fail("a second pass changed the link");

const strong = {
  name: "strong",
  type: "number",
  scale: "linear",
  step: 0.005,
  min: -0.2,
  max: 0.6,
  default: 0,
  locked: 0,
  free: { min: -1, max: 2 },
};
const stepped = commitExact(strong, "0.013", false);
if (!stepped || stepped.canonical !== "0.013" || stepped.value !== Number("0.013")) {
  fail("a typed value must not snap to the slider step");
}

const lambda = {
  name: "cosmological-constant",
  type: "number",
  scale: "symlog",
  linthresh: 0.1,
  min: -1000,
  max: 1000,
  default: 1,
  locked: 1,
  free: { min: -1e6, max: 1e6 },
};
const sym = commitExact(lambda, "-12.5", false);
if (!sym || sym.freePlay || sym.canonical !== "-12.5" || sym.value !== -12.5) {
  fail("symlog belongs on the slider, not in the box");
}

const outside = commitExact(alpha, "2", false);
if (!outside || !outside.freePlay || outside.value !== 2 || outside.canonical !== "2") {
  fail("a value outside the locked range must turn free play on");
}
const wideHash = encodeHash(model, { alpha: outside.value }, outside.freePlay);
if (!wideHash.includes("free=1") || !wideHash.includes("alpha=2")) fail("free-play link: " + wideHash);
const widened = applyQuery(model, parseHash("#" + wideHash).query, { alpha: alpha.default });
if (!widened.freePlay || widened.params.alpha !== 2) fail("free-play link did not reproduce 2");

if (!process.exitCode) console.log("exact dial value ok");
