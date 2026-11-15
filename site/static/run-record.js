/* Canonical playground runs: URL state and the JSON that Save run stores.
   No DOM. The hash covers the run body, not the time it was saved. */

const FORMAT = "consequence-atlas-run";
const FORMAT_VERSION = "1";
const RESERVED = new Set(["v", "engine", "free"]);

function engineOf(model) {
  const engine = (model && model.engine) || {};
  return {
    name: engine.name || "example",
    version: engine.version == null ? "0" : String(engine.version),
  };
}

function engineToken(model) {
  const engine = engineOf(model);
  return engine.name + "@" + engine.version;
}

function stableString(value) {
  if (Array.isArray(value)) return "[" + value.map(stableString).join(",") + "]";
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map(function (key) {
      return JSON.stringify(key) + ":" + stableString(value[key]);
    }).join(",") + "}";
  }
  return JSON.stringify(value);
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(function (byte) {
    return byte.toString(16).padStart(2, "0");
  }).join("");
}

function encodeValue(value) {
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return JSON.stringify(value);
  return String(value);
}

function decodeValue(param, raw) {
  if (param.type === "boolean") return raw === "1" || raw === "true";
  if (param.type === "enum" && param.options && param.options.some(function (option) {
    return typeof option.value === "string" && String(option.value) === raw;
  })) return raw;
  const number = Number(raw);
  if (!Number.isFinite(number)) return param.default;
  if (param.type === "integer" || param.scale === "discrete") return Math.round(number);
  return number;
}

function orderedParams(model, params) {
  const ordered = {};
  (model.params || []).forEach(function (param) {
    if (Object.prototype.hasOwnProperty.call(params, param.name)) ordered[param.name] = params[param.name];
  });
  return ordered;
}

function runBody(model, params, result, freePlay) {
  const ordered = orderedParams(model, params);
  const example = !result || result.example !== false || result.fidelity !== "engine";
  return {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    model: model.id,
    engine: engineOf(model),
    seed: Object.prototype.hasOwnProperty.call(ordered, "seed") ? ordered.seed : null,
    params: ordered,
    freePlay: Boolean(freePlay),
    fidelity: example ? "example" : "engine",
    verdict: example ? null : (result.verdict || null),
  };
}

async function buildRunRecord(model, params, result, freePlay) {
  const body = runBody(model, params, result, freePlay);
  const hash = await sha256Hex(stableString(body));
  return Object.assign({ hash: hash }, body);
}

function encodeHash(model, params, freePlay) {
  const query = new URLSearchParams();
  query.set("v", FORMAT_VERSION);
  query.set("engine", engineToken(model));
  query.set("free", freePlay ? "1" : "0");
  (model.params || []).forEach(function (param) {
    query.set(param.name, encodeValue(params[param.name]));
  });
  return model.id + "?" + query.toString();
}

function parseHash(hash) {
  const raw = String(hash || "").replace(/^#/, "");
  const cut = raw.indexOf("?");
  const path = cut === -1 ? raw : raw.slice(0, cut);
  const query = new URLSearchParams(cut === -1 ? "" : raw.slice(cut + 1));
  return { path: path, query: query };
}

function outsideLocked(param, value) {
  if (typeof value !== "number" || typeof param.min !== "number" || typeof param.max !== "number") return false;
  return value < param.min || value > param.max;
}

function activeBounds(param, freePlay) {
  if (freePlay && param.free && typeof param.free.min === "number" && typeof param.free.max === "number") {
    return { min: param.free.min, max: param.free.max };
  }
  return { min: param.min, max: param.max };
}

function clampToBounds(param, value, freePlay) {
  const bounds = activeBounds(param, freePlay);
  if (typeof value !== "number" || typeof bounds.min !== "number" || typeof bounds.max !== "number") return value;
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

/* A typed box commits the number the URL would store.
   The slider's step and symlog axis are not applied here.
   A value outside the locked range turns free play on, then clamps to that wider range. */
function commitExact(param, raw, freePlay) {
  const text = String(raw).trim();
  if (!Number.isFinite(Number(text))) return null;
  const decoded = decodeValue(param, text);
  if (typeof decoded !== "number" || !Number.isFinite(decoded)) return null;
  let nextFree = Boolean(freePlay);
  if (outsideLocked(param, decoded)) nextFree = true;
  const value = clampToBounds(param, decoded, nextFree);
  return { value: value, freePlay: nextFree, canonical: encodeValue(value) };
}

/* Read a shared URL onto a model's defaults.
   A value outside the locked range turns free play on, so the link still reproduces. */
function applyQuery(model, query, defaults) {
  const params = Object.assign({}, defaults);
  let freePlay = query.get("free") === "1";
  let outside = false;
  (model.params || []).forEach(function (param) {
    if (!query.has(param.name) || RESERVED.has(param.name)) return;
    const value = decodeValue(param, query.get(param.name));
    if (outsideLocked(param, value)) outside = true;
    params[param.name] = value;
  });
  if (outside) freePlay = true;
  (model.params || []).forEach(function (param) {
    params[param.name] = clampToBounds(param, params[param.name], freePlay);
  });
  const named = query.get("engine");
  const token = engineToken(model);
  const engineNote = named && named !== token
    ? "This link names engine " + named + ". This page is running " + token + ", so the picture is not that run."
    : "";
  return { params: params, freePlay: freePlay, engineNote: engineNote };
}

export {
  FORMAT,
  FORMAT_VERSION,
  engineOf,
  engineToken,
  stableString,
  sha256Hex,
  encodeValue,
  encodeHash,
  parseHash,
  buildRunRecord,
  applyQuery,
  activeBounds,
  clampToBounds,
  outsideLocked,
  decodeValue,
  commitExact,
};
