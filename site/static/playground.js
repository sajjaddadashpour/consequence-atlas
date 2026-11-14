/* Playground shell. Loads model modules, draws controls, and keeps the locked record in view. */
import { renderViews, paintDynamic, toSlider, fromSlider, formatNumber, frameCount } from "./views.js";

const $ = (id) => document.getElementById(id);

const state = {
  index: null,
  manifest: [],
  models: new Map(),
  currentId: null,
  params: {},
  result: null,
  frame: 0,
  playing: false,
  timer: 0,
  seq: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pill(label) {
  const slug = String(label || "").toLowerCase();
  return '<span class="pill pill-' + slug + '">' + escapeHtml(label || "—") + "</span>";
}

function model() {
  return state.models.get(state.currentId) || null;
}

function normalize(mod) {
  const src = mod && mod.id ? mod : (mod && mod.default);
  if (!src || typeof src.run !== "function" || !Array.isArray(src.params)) {
    throw new Error("Model module must export id, title, cardIds, params, views, and run");
  }
  return src;
}

function hydrateAtlas(src, index) {
  if (!src || src.id !== "atlas-map" || !index || !index.dials) return src;
  const byId = {};
  index.dials.forEach(function (dial) { byId[dial.id] = dial; });
  const params = src.params.map(function (param) {
    const dial = byId[param.name];
    if (!dial || !dial.range) return param;
    const symlog = /symmetric-log/i.test(dial.units || "");
    let scale = dial.scale || param.scale;
    if (symlog) scale = "symlog";
    if (param.type === "integer") scale = "discrete";
    const recordedSymbol = dial.symbol && String(dial.symbol).length <= 2 ? dial.symbol : "";
    const symbol = recordedSymbol || (param.symbol && String(param.symbol).length <= 2 ? param.symbol : "");
    return Object.assign({}, param, {
      label: dial.name || param.label,
      symbol: symbol,
      unit: dial.units || param.unit,
      min: dial.range[0],
      max: dial.range[1],
      default: dial.ours,
      locked: dial.ours,
      scale: scale,
    });
  });
  return Object.assign({}, src, { params: params });
}

function defaultsOf(src) {
  const values = {};
  src.params.forEach(function (param) { values[param.name] = param.default; });
  return values;
}

function numericEnum(param) {
  return param.type === "enum" && param.options && param.options.every(function (option) {
    return typeof option.value === "number";
  });
}

function valuesEqual(param, a, b) {
  if (typeof a === "number" && typeof b === "number") {
    if (param.scale === "log" || param.scale === "symlog") {
      const span = Math.abs(toSlider(param, param.max) - toSlider(param, param.min)) || 1;
      return Math.abs(toSlider(param, a) - toSlider(param, b)) <= span / 800 + 1e-9;
    }
    const step = Number(param.step) || 0;
    const tol = step ? step / 2 : 1e-9;
    return Math.abs(a - b) <= tol + 1e-12;
  }
  return a === b;
}

function isLocked() {
  const src = model();
  if (!src) return false;
  return src.params.every(function (param) {
    return valuesEqual(param, state.params[param.name], param.locked);
  });
}

function isExample(result) {
  if (!result) return true;
  if (result.example) return true;
  return result.fidelity !== "engine";
}

function readControl(param, el) {
  if (param.type === "boolean") return el.checked;
  if (param.type === "enum" && !numericEnum(param)) return el.value;
  if (param.type === "enum") {
    const value = Number(el.value);
    return param.type === "integer" || param.scale === "discrete" ? Math.round(value) : value;
  }
  return fromSlider(param, el.value);
}

function formatParam(param, value) {
  if (typeof value === "boolean") return value ? "on" : "off";
  if (param.options) {
    const match = param.options.find(function (option) { return option.value === value; });
    if (match) return match.label;
  }
  if (typeof value === "number") {
    if (param.type === "integer" || param.scale === "discrete") return String(Math.round(value));
    return formatNumber(value);
  }
  return String(value);
}

function sliderStep(param) {
  if (param.scale === "log" || param.scale === "symlog") {
    const span = toSlider(param, param.max) - toSlider(param, param.min);
    return span / 400;
  }
  if (param.step) return param.step;
  return (param.max - param.min) / 200;
}

function renderPicker() {
  const root = $("pg-models");
  root.innerHTML = "";
  state.manifest.forEach(function (entry) {
    const src = state.models.get(entry.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pg-model";
    button.setAttribute("aria-pressed", entry.id === state.currentId ? "true" : "false");
    const title = (src && src.title) || entry.title || entry.id;
    const summary = (src && src.summary) || entry.summary || "";
    const family = (src && src.family) || entry.family || "";
    button.innerHTML =
      '<span class="pg-model-title">' + escapeHtml(title) + "</span>" +
      (family ? '<span class="pg-model-family">' + escapeHtml(family) + "</span>" : "") +
      (summary ? '<span class="pg-model-summary">' + escapeHtml(summary) + "</span>" : "");
    button.addEventListener("click", function () {
      if (location.hash.replace("#", "") !== entry.id) location.hash = entry.id;
    });
    root.appendChild(button);
  });
}

function renderDials() {
  const src = model();
  const root = $("pg-dials");
  root.innerHTML = "";
  $("pg-board-title").textContent = (src && src.boardTitle) || "Parameters";
  if (!src) return;
  src.params.forEach(function (param) {
    const row = document.createElement("div");
    row.className = "pg-dial";
    const value = state.params[param.name];
    const off = !valuesEqual(param, value, param.locked);
    const symbol = param.symbol ? '<span class="pg-symbol">' + escapeHtml(param.symbol) + "</span> " : "";
    row.innerHTML =
      '<div class="pg-dial-top"><label for="dial-' + escapeHtml(param.name) + '">' + symbol + escapeHtml(param.label) + "</label>" +
      '<output id="out-' + escapeHtml(param.name) + '" class="' + (off ? "pg-offlock" : "") + '">' + escapeHtml(formatParam(param, value)) + "</output></div>";
    let control;
    if (param.type === "boolean") {
      control = document.createElement("input");
      control.type = "checkbox";
      control.checked = Boolean(value);
    } else if (param.type === "enum" || (param.options && param.scale === "discrete" && param.options.length && param.type !== "integer")) {
      control = document.createElement("select");
      param.options.forEach(function (option) {
        const opt = document.createElement("option");
        opt.value = String(option.value);
        opt.textContent = option.label;
        if (option.value === value) opt.selected = true;
        control.appendChild(opt);
      });
    } else if (param.options && param.type === "integer") {
      control = document.createElement("select");
      param.options.forEach(function (option) {
        const opt = document.createElement("option");
        opt.value = String(option.value);
        opt.textContent = option.label;
        if (option.value === value) opt.selected = true;
        control.appendChild(opt);
      });
    } else {
      control = document.createElement("input");
      control.type = "range";
      const min = toSlider(param, param.min);
      const max = toSlider(param, param.max);
      control.min = String(min);
      control.max = String(max);
      control.step = String(sliderStep(param));
      control.value = String(toSlider(param, value));
    }
    control.id = "dial-" + param.name;
    control.dataset.name = param.name;
    const output = row.querySelector("output");
    const onInput = function () {
      state.params[param.name] = readControl(param, control);
      const next = state.params[param.name];
      output.textContent = formatParam(param, next);
      output.classList.toggle("pg-offlock", !valuesEqual(param, next, param.locked));
      scheduleRun();
    };
    control.addEventListener("input", onInput);
    control.addEventListener("change", onInput);
    row.appendChild(control);
    if (param.help) {
      const help = document.createElement("p");
      help.className = "quiet pg-help";
      help.textContent = param.help;
      row.appendChild(help);
    }
    root.appendChild(row);
  });
}

function syncDialOutputs() {
  const src = model();
  if (!src) return;
  src.params.forEach(function (param) {
    const control = document.getElementById("dial-" + param.name);
    const output = document.getElementById("out-" + param.name);
    const value = state.params[param.name];
    if (!control || !output) return;
    if (control.type === "checkbox") control.checked = Boolean(value);
    else if (control.tagName === "SELECT") control.value = String(value);
    else control.value = String(toSlider(param, value));
    output.textContent = formatParam(param, value);
    output.classList.toggle("pg-offlock", !valuesEqual(param, value, param.locked));
  });
}

function renderBanner() {
  const banner = $("pg-banner");
  const example = isExample(state.result);
  const locked = isLocked();
  banner.classList.toggle("pg-banner-explore", !locked);
  let text;
  if (example && locked) {
    text = "On the locked settings. The picture is still example data — not a rerun and not a claim.";
  } else if (example && !locked) {
    text = "Exploration. These settings are off the lock. Example data only — not a claim.";
  } else if (!example && locked) {
    text = "On the locked settings. The live verdict is from the engine module. The card label beside it is the atlas record.";
  } else {
    text = "Exploration. These settings are off the lock. This run is not the locked card.";
  }
  banner.textContent = text;
}

function findCard(id) {
  return (state.index && state.index.cards || []).find(function (card) { return card.id === id; }) || null;
}

function renderVerdict() {
  const root = $("pg-verdict");
  const src = model();
  const result = state.result;
  const example = isExample(result);
  const locked = isLocked();
  let live;
  if (example) {
    live = "<h3>This run</h3><p class=\"pg-verdict-value\">Example — no verdict</p><p class=\"quiet\">No GROWS, CLUMPS, DECAYS, STEADY, or other engine verdict is being computed.</p>";
  } else {
    live = "<h3>This run</h3><p class=\"pg-verdict-value\">" + escapeHtml(result && result.verdict ? result.verdict : "—") + "</p>" +
      (locked ? "" : "<p class=\"quiet\">Off the locked settings. This is not the card's result.</p>");
  }
  let record;
  const ids = (src && src.cardIds) || [];
  if (!ids.length) {
    const byId = {};
    ((state.index && state.index.dials) || []).forEach(function (dial) { byId[dial.id] = dial; });
    const lines = (src.params || []).map(function (param) {
      const dial = byId[param.name];
      if (!dial) return "";
      const mark = param.symbol ? escapeHtml(param.symbol) + "  " : "";
      return "<li><span>" + mark + escapeHtml(dial.name || param.label) + "</span><span>" + escapeHtml(formatNumber(Number(dial.ours))) + "</span></li>";
    }).join("");
    record = "<h3>Recorded ours</h3><ul class=\"pg-ours\">" + lines + "</ul><p class=\"quiet\">No experiment card is attached. Labels on the strip and the graph are the atlas records.</p>";
  } else {
    const card = findCard(ids[0]);
    if (!card) {
      record = "<h3>Locked record</h3><p class=\"quiet\">Card <code>" + escapeHtml(ids[0]) + "</code> is not in this index.</p>";
    } else {
      const effect = card.result || {};
      const legacy = card.legacy ? ' <span class="badge-legacy">legacy, unverified</span>' : "";
      const more = ids.slice(1).map(function (id) {
        return '<a href="registry.html#card/' + encodeURIComponent(id) + '"><code>' + escapeHtml(id) + "</code></a>";
      }).join(", ");
      record =
        "<h3>Locked record" + legacy + "</h3>" +
        "<p>" + pill(card.label) + "</p>" +
        '<p><a href="registry.html#card/' + encodeURIComponent(card.id) + '"><code>' + escapeHtml(card.id) + "</code></a></p>" +
        "<p class=\"quiet\">effect " + escapeHtml(formatNumber(effect.effect)) +
        " · se " + escapeHtml(formatNumber(effect.se)) +
        " · z " + escapeHtml(formatNumber(effect.z)) + "</p>" +
        (more ? "<p class=\"quiet\">Also " + more + "</p>" : "") +
        "<p class=\"quiet\">This label is the atlas record. The picture does not change it.</p>";
    }
  }
  const note = src && src.lockNote
    ? '<details class="pg-details"><summary>What is locked</summary><p class="pg-lock-note quiet">' + escapeHtml(src.lockNote) + "</p></details>"
    : "";
  root.innerHTML =
    '<article class="pg-card">' + live + "</article>" +
    '<article class="pg-card">' + record + note + "</article>";
}

function viewApi() {
  return {
    model: model(),
    result: state.result,
    index: state.index,
    params: state.params,
    frame: state.frame,
    locked: isLocked(),
    playing: state.playing,
    onFrame: function (frame) {
      state.playing = false;
      stopLoop();
      state.frame = frame;
      paintDynamic($("pg-views"), viewApi());
    },
    onToggle: function () {
      state.playing = !state.playing;
      if (state.playing) startLoop();
      else stopLoop();
      paintDynamic($("pg-views"), viewApi());
    },
  };
}

function renderAllViews() {
  const src = model();
  $("pg-title").textContent = src ? src.title : "Playground";
  const fidelity = $("pg-fidelity");
  if (fidelity) {
    const kind = isExample(state.result) ? "example data" : "engine module";
    fidelity.textContent = (src && src.family ? "Family " + src.family + " · " : "") + kind;
  }
  renderBanner();
  renderVerdict();
  renderViews($("pg-views"), viewApi());
}

function stopLoop() {
  if (state.timer) cancelAnimationFrame(state.timer);
  state.timer = 0;
}

function startLoop() {
  stopLoop();
  if (!state.playing) return;
  const n = frameCount(state.result);
  if (n <= 1) return;
  let last = 0;
  const tick = function (time) {
    if (!state.playing || document.hidden) {
      state.timer = requestAnimationFrame(tick);
      return;
    }
    if (time - last > 90) {
      state.frame = (state.frame + 1) % n;
      paintDynamic($("pg-views"), viewApi());
      last = time;
    }
    state.timer = requestAnimationFrame(tick);
  };
  state.timer = requestAnimationFrame(tick);
}

async function applyParams() {
  const src = model();
  if (!src) return;
  const seq = ++state.seq;
  let result;
  try {
    result = await Promise.resolve(src.run(Object.assign({}, state.params)));
  } catch (err) {
    if (seq !== state.seq) return;
    $("pg-banner").textContent = "This module failed to run. " + err.message;
    return;
  }
  if (seq !== state.seq) return;
  state.result = result;
  state.frame = 0;
  state.playing = !state.reducedMotion && frameCount(result) > 1;
  renderAllViews();
  if (state.playing) startLoop();
  else stopLoop();
}

let runTimer = 0;
function scheduleRun() {
  clearTimeout(runTimer);
  runTimer = setTimeout(applyParams, 40);
}

async function loadModel(id) {
  const known = state.manifest.some(function (entry) { return entry.id === id; });
  const nextId = known ? id : (state.manifest[0] && state.manifest[0].id);
  if (!nextId) return;
  if (!known) history.replaceState(null, "", "#" + nextId);
  const entry = state.manifest.find(function (item) { return item.id === nextId; });
  if (!state.models.has(nextId)) {
    const mod = await import("./" + entry.src);
    state.models.set(nextId, hydrateAtlas(normalize(mod), state.index));
  }
  state.currentId = nextId;
  state.params = defaultsOf(model());
  stopLoop();
  renderPicker();
  renderDials();
  await applyParams();
}

function registryHash(raw) {
  return raw.startsWith("card/") || raw.startsWith("link/") || raw === "browse" || raw === "labels" || raw === "contribute" || raw === "top";
}

function onHash() {
  const raw = (location.hash || "").replace(/^#/, "");
  if (registryHash(raw)) {
    location.replace("registry.html#" + (raw === "top" ? "browse" : raw));
    return;
  }
  const id = raw || "atlas-map";
  if (id === state.currentId) return;
  loadModel(id).catch(function (err) {
    $("pg-banner").textContent = "Could not load that model. " + err.message;
  });
}

async function boot() {
  $("pg-reset").addEventListener("click", function () {
    const src = model();
    if (!src) return;
    state.params = {};
    src.params.forEach(function (param) { state.params[param.name] = param.locked; });
    syncDialOutputs();
    applyParams();
  });
  window.addEventListener("hashchange", onHash);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.playing) startLoop();
  });
  try {
    const [manifestRes, indexRes] = await Promise.all([
      fetch("models/manifest.json", { credentials: "same-origin" }),
      fetch("data/index.json", { credentials: "same-origin" }),
    ]);
    if (!manifestRes.ok) throw new Error("models/manifest.json (" + manifestRes.status + ")");
    if (!indexRes.ok) throw new Error("data/index.json (" + indexRes.status + ")");
    state.manifest = await manifestRes.json();
    state.index = await indexRes.json();
  } catch (err) {
    $("pg-banner").textContent = "The playground could not load its data. " + err.message;
    return;
  }
  const raw = (location.hash || "").replace(/^#/, "");
  if (registryHash(raw)) {
    location.replace("registry.html#" + (raw === "top" ? "browse" : raw));
    return;
  }
  const id = raw || "atlas-map";
  if (!location.hash) history.replaceState(null, "", "#atlas-map");
  try {
    await loadModel(id);
  } catch (err) {
    $("pg-banner").textContent = "Could not load the playground. " + err.message;
  }
}

boot();
