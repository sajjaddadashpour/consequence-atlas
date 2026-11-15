/* Atlas shell. Models call site/engine. The page does not recompute a link. */
import { paintDimensions, paintEngineFrame, paintLambda, renderEngine } from "./engine-views.js";
import { frameCount, formatNumber, fromSlider, renderViews, toSlider } from "./views.js";
import {
  gridFromPreview,
  initDrawer,
  initLegend,
  openCellDrawer,
  openDialDrawer,
  openLinkDrawer,
  openStageDrawer,
  packEngineStrip,
  paintAxes,
  paintLinked,
  paintMap,
  paintSpine,
  paintStripBar,
  readPreview,
  stripById,
} from "./atlas-shell.js";
import { activeBounds, applyQuery, buildRunRecord, clampToBounds, commitExact, encodeHash, encodeValue, outsideLocked, parseHash } from "./run-record.js";
import { createLocalStorageAdapter, createMemoryStorage } from "./storage.js";

const $ = (id) => document.getElementById(id);

const state = {
  index: null,
  manifest: [],
  models: new Map(),
  currentId: null,
  params: {},
  atlasParams: null,
  result: null,
  frame: 0,
  playing: false,
  timer: 0,
  seq: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  freePlay: false,
  engineNote: "",
  suppressHash: false,
  store: null,
  runs: [],
  axisX: "alpha",
  axisY: "beta",
  stageId: null,
  compare: false,
  preview: null,
  strips: null,
  atlasEval: null,
  mapTimer: 0,
  stripTimer: 0,
  mapToken: 0,
  urlTimer: 0,
};

const ALIAS = {
  "atlas-map": "atlas",
  particles: "starter",
  "phase-field": "starter",
  "cellular-automaton": "starter",
};
const ALIAS_FAMILY = { particles: "P", "phase-field": "F", "cellular-automaton": "C" };

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

function atlasModel() {
  return state.models.get("atlas") || (model() && model().id === "atlas" ? model() : null);
}

function normalize(mod) {
  const src = mod && mod.id ? mod : (mod && mod.default);
  if (!src || typeof src.run !== "function" || !Array.isArray(src.params)) {
    throw new Error("Model module must export id, title, cardIds, params, views, and run");
  }
  return src;
}

function hydrateAtlas(src, index) {
  if (!src || src.id !== "atlas" || !index || !index.dials) return src;
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

function onLock() {
  return !state.freePlay && isLocked();
}

function activeParam(param) {
  return Object.assign({}, param, activeBounds(param, state.freePlay));
}

function openStore() {
  try {
    const probe = window.localStorage;
    probe.getItem("toeatlas.runs.v1");
    return createLocalStorageAdapter(probe);
  } catch (err) {
    return createLocalStorageAdapter(createMemoryStorage());
  }
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

function isSlider(param) {
  if (param.type === "boolean" || param.type === "enum") return false;
  if (param.options && param.scale === "discrete" && param.options.length && param.type !== "integer") return false;
  if (param.options && param.type === "integer") return false;
  return true;
}

function exactBox(param) {
  return document.getElementById("exact-" + param.name);
}

function showExact(param, value) {
  const box = exactBox(param);
  if (!box || document.activeElement === box) return;
  box.value = encodeValue(value);
  box.classList.toggle("pg-offlock", !valuesEqual(param, value, param.locked) || outsideLocked(param, value));
}

function placeSlider(control, param, value) {
  const live = activeParam(param);
  control.dataset.writing = "1";
  control.min = String(toSlider(live, live.min));
  control.max = String(toSlider(live, live.max));
  control.step = String(sliderStep(live));
  control.value = String(toSlider(live, value));
  control.dataset.writing = "";
}

function oursFraction(param) {
  const live = activeParam(param);
  const a = toSlider(live, live.min);
  const b = toSlider(live, live.max);
  if (b === a) return 0;
  const mark = toSlider(live, param.locked);
  return Math.min(1, Math.max(0, (mark - a) / (b - a)));
}

function applyCommitted(param, committed) {
  const freeChanged = committed.freePlay !== state.freePlay;
  state.freePlay = committed.freePlay;
  state.params[param.name] = committed.value;
  const box = exactBox(param);
  if (box) {
    box.value = committed.canonical;
    box.classList.toggle("pg-offlock", !valuesEqual(param, committed.value, param.locked) || outsideLocked(param, committed.value));
  }
  if (freeChanged) syncDialOutputs();
  else {
    const control = document.getElementById("dial-" + param.name);
    const output = document.getElementById("out-" + param.name);
    if (control && control.type === "range") placeSlider(control, param, committed.value);
    if (output) {
      output.textContent = formatParam(param, committed.value);
      output.classList.toggle("pg-offlock", !valuesEqual(param, committed.value, param.locked) || outsideLocked(param, committed.value));
    }
  }
  renderBanner();
  scheduleRun();
}

function commitBox(param, raw, onlyWhenCanonical) {
  const text = String(raw).trim();
  const committed = commitExact(param, text, state.freePlay);
  if (!committed) return false;
  if (onlyWhenCanonical && committed.canonical !== text) return false;
  applyCommitted(param, committed);
  return true;
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
  if (!root) return;
  root.innerHTML = "";
  state.manifest.forEach(function (entry) {
    const src = state.models.get(entry.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pg-model";
    button.setAttribute("aria-pressed", entry.id === state.currentId ? "true" : "false");
    const title = (src && src.title) || entry.title || entry.id;
    button.textContent = title;
    button.addEventListener("click", function () {
      if (parseHash(location.hash).path === entry.id) return;
      location.hash = entry.id;
    });
    root.appendChild(button);
  });
}

function currentStages() {
  if (state.atlasEval && state.atlasEval.stages) return state.atlasEval.stages;
  return (state.preview && state.preview.stages) || [];
}

function axisDials() {
  if (state.preview && state.preview.dials) return state.preview.dials;
  const src = atlasModel();
  if (!src) return [];
  return src.params.map(function (param) {
    return {
      name: param.name,
      id: param.name === "cosmological-constant" ? "cosmological_constant" : param.name,
      label: param.label,
      symbol: param.symbol || "",
    };
  });
}

function paramNameForAxis(id) {
  return id === "cosmological_constant" ? "cosmological-constant" : id;
}

function atlasParams() {
  if (model() && model().id === "atlas") return state.params;
  if (state.atlasParams) return state.atlasParams;
  const src = atlasModel();
  if (!src) return null;
  const values = {};
  src.params.forEach(function (param) { values[param.name] = param.locked; });
  return values;
}

function paramsMatchLocked(params) {
  const src = atlasModel();
  if (src && params) {
    return src.params.every(function (param) {
      return valuesEqual(param, params[param.name], param.locked);
    });
  }
  if (!state.preview || !state.preview.hold || !params) return false;
  const hold = state.preview.hold;
  const named = {
    alpha: hold.alpha,
    beta: hold.beta,
    strong: hold.strong,
    "cosmological-constant": hold.cosmological_constant,
    dimensions: hold.dimensions,
    arrow: hold.arrow,
  };
  return Object.keys(named).every(function (key) {
    const got = Number(params[key]);
    const want = Number(named[key]);
    return Number.isFinite(got) && Math.abs(got - want) <= Math.max(1e-12, Math.abs(want) * 1e-9);
  });
}

function knownStage(id) {
  if (!id) return null;
  return currentStages().some(function (stage) { return stage.id === id; }) ? id : null;
}

function spineHeading() {
  return state.compare ? "These dials" : "Stages";
}

function onStage(id) {
  if (!knownStage(id) && id) return;
  const next = state.stageId === id ? null : id;
  state.stageId = next;
  const stage = currentStages().find(function (item) { return item.id === next; });
  if (stage) openStageDrawer(stage, state.index);
  paintStageChrome();
  scheduleMap();
  paintAllBars();
  scheduleUrl();
}

function paintStageChrome() {
  paintSpine($("spine"), currentStages(), {
    heading: spineHeading(),
    selectedId: state.stageId,
    onSelect: onStage,
  });
  const ours = $("spine-ours");
  const screen = $("atlas-screen");
  const button = $("pg-compare");
  if (button) button.setAttribute("aria-pressed", state.compare ? "true" : "false");
  if (screen) screen.classList.toggle("is-compare", Boolean(state.compare));
  if (ours) {
    ours.hidden = !state.compare;
    if (state.compare) {
      const lockedStages = (state.preview && state.preview.stages) || [];
      paintSpine(ours, lockedStages, {
        heading: "Ours",
        selectedId: state.stageId,
        onSelect: onStage,
      });
    }
  }
  const stages = currentStages();
  const selected = stages.find(function (stage) { return stage.id === state.stageId; });
  paintLinked($("linked-records"), state.index, state.stageId, selected && selected.name, function (link) {
    openLinkDrawer(link, state.index);
  });
}

function mapOpts() {
  return {
    readout: $("map-read"),
    onHover: function () {},
    onPick: function (cell) { openCell(cell); },
  };
}

function presentGrid(grid) {
  const cells = (grid.cells || []).map(function (cell) {
    const stageStatus = {};
    Object.keys(cell.featured || {}).forEach(function (id) {
      stageStatus[id] = cell.featured[id].status;
    });
    return {
      i: cell.i,
      j: cell.j,
      x: cell.x,
      y: cell.y,
      stageStatus: stageStatus,
      status: cell.worst_status,
      region: cell.region,
    };
  });
  return {
    x: grid.x,
    y: grid.y,
    ours: grid.ours,
    cells: cells,
    sample: grid.x.values.length + "×" + grid.y.values.length,
    lockedSample: false,
  };
}

function paintAxesNow() {
  paintAxes($("map-axes"), axisDials(), state.axisX, state.axisY, function (value) {
    setAxis("x", value);
  }, function (value) {
    setAxis("y", value);
  });
}

function setAxis(which, value) {
  if (which === "x") state.axisX = value;
  else state.axisY = value;
  if (state.axisX === state.axisY) {
    const ids = axisDials().map(function (dial) { return dial.id; });
    const other = ids.find(function (id) { return id !== value; }) || "beta";
    if (which === "x") state.axisY = other;
    else state.axisX = other;
  }
  paintAxesNow();
  scheduleMap();
  scheduleUrl();
}

function scheduleMap() {
  const token = ++state.mapToken;
  clearTimeout(state.mapTimer);
  const params = atlasParams();
  const src = atlasModel();
  if (params && paramsMatchLocked(params) && state.preview) {
    const grid = gridFromPreview(state.preview, state.axisX, state.axisY, state.stageId);
    if (grid) {
      paintMap($("map-stage"), grid, mapOpts());
      return;
    }
  }
  state.mapTimer = setTimeout(function () {
    if (token !== state.mapToken || !src || !src.mapAt || !params) return;
    const featured = state.stageId ? [state.stageId] : null;
    const grid = src.mapAt(params, state.axisX, state.axisY, 9, featured);
    if (token !== state.mapToken) return;
    paintMap($("map-stage"), presentGrid(grid), mapOpts());
  }, 20);
}

function scheduleStrips() {
  clearTimeout(state.stripTimer);
  const params = atlasParams();
  const src = atlasModel();
  if (params && paramsMatchLocked(params) && state.preview) {
    state.strips = state.preview.strips;
    paintAllBars();
    return;
  }
  state.stripTimer = setTimeout(function () {
    if (!src || !src.stripsAt || !params) return;
    const raw = src.stripsAt(params, 21);
    state.strips = (raw.strips || []).map(packEngineStrip);
    paintAllBars();
  }, 60);
}

function paintAllBars() {
  const src = model();
  if (!src || src.id !== "atlas") return;
  const stages = currentStages();
  src.params.forEach(function (param) {
    const host = document.getElementById("bar-" + param.name);
    if (!host) return;
    const strip = stripById(state.strips, param.name);
    if (strip && src.SENSITIVITY_CAVEAT) strip.caveat = src.SENSITIVITY_CAVEAT;
    paintStripBar(host, strip, state.stageId, stages, function (picked) {
      openDial(param, picked);
    });
  });
}

function openDial(param, strip) {
  const src = atlasModel() || model();
  const params = atlasParams() || state.params;
  let ready = strip;
  if (src && src.explainSwitch && strip && (strip.switches || []).some(function (sw) { return !sw.stageLinks; })) {
    ready = Object.assign({}, strip, {
      caveat: src.SENSITIVITY_CAVEAT,
      help: param.help || "",
      switches: strip.switches.map(function (sw) {
        if (sw.stageLinks) return sw;
        const explained = src.explainSwitch(params, strip.id, sw.from, sw.to, sw.stage);
        return Object.assign({}, sw, explained);
      }),
    });
  } else if (strip && param.help) {
    ready = Object.assign({}, strip, { help: param.help });
  }
  openDialDrawer(param.label, ready || { switches: [], caveat: src && src.SENSITIVITY_CAVEAT }, state.index, state.stageId, currentStages());
}

function openCell(cell) {
  const src = atlasModel();
  const params = Object.assign({}, atlasParams() || {});
  if (!src || !src.stageAt || !params) return;
  params[paramNameForAxis(state.axisX)] = cell.x;
  params[paramNameForAxis(state.axisY)] = cell.y;
  const ev = src.stageAt(params);
  const dials = axisDials();
  const xDial = dials.find(function (dial) { return dial.id === state.axisX; });
  const yDial = dials.find(function (dial) { return dial.id === state.axisY; });
  const featured = (state.preview && state.preview.featured) || [];
  openCellDrawer(cell, ev, state.stageId, featured, state.index, {
    xLabel: (xDial && (xDial.symbol || xDial.label)) || state.axisX,
    yLabel: (yDial && (yDial.symbol || yDial.label)) || state.axisY,
  });
}

function renderDials() {
  const src = model();
  const root = $("pg-dials");
  if (!root) return;
  root.innerHTML = "";
  const title = $("pg-board-title");
  if (title) title.textContent = (src && src.boardTitle) || "Dials";
  if (!src) return;
  src.params.forEach(function (param) {
    const row = document.createElement("div");
    row.className = "pg-dial";
    const live = activeParam(param);
    const value = state.params[param.name];
    const off = !valuesEqual(param, value, param.locked) || outsideLocked(param, value);
    const symbol = param.symbol ? '<span class="pg-symbol">' + escapeHtml(param.symbol) + "</span> " : "";
    const ours = typeof param.locked === "number" || typeof param.locked === "string"
      ? '<span class="ours-tag">ours <span class="mono">' + escapeHtml(formatParam(param, param.locked)) + "</span></span>"
      : "";
    row.innerHTML =
      '<div class="pg-dial-top"><button type="button" class="dial-name" id="name-' + escapeHtml(param.name) + '">' +
      symbol + escapeHtml(param.label) + "</button>" + ours +
      '<output id="out-' + escapeHtml(param.name) + '" class="' + (off ? "pg-offlock" : "") + '">' +
      escapeHtml(formatParam(param, value)) + "</output></div>";
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
      placeSlider(control, param, value);
    }
    control.id = "dial-" + param.name;
    control.dataset.name = param.name;
    const output = row.querySelector("output");
    const onInput = function () {
      if (control.dataset.writing === "1") return;
      state.params[param.name] = clampToBounds(param, readControl(live, control), state.freePlay);
      const next = state.params[param.name];
      output.textContent = formatParam(param, next);
      output.classList.toggle("pg-offlock", !valuesEqual(param, next, param.locked) || outsideLocked(param, next));
      showExact(param, next);
      scheduleRun();
    };
    control.addEventListener("input", onInput);
    control.addEventListener("change", onInput);
    if (!isSlider(param)) {
      row.appendChild(control);
    } else {
      const box = document.createElement("input");
      box.type = "text";
      box.inputMode = "decimal";
      box.className = "pg-exact";
      box.id = "exact-" + param.name;
      box.setAttribute("aria-label", "Exact " + param.label);
      box.autocomplete = "off";
      box.spellcheck = false;
      box.value = encodeValue(value);
      box.classList.toggle("pg-offlock", off);
      box.addEventListener("input", function () { commitBox(param, box.value, true); });
      box.addEventListener("change", function () {
        if (!commitBox(param, box.value, false)) box.value = encodeValue(state.params[param.name]);
      });
      box.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        box.blur();
      });
      const pair = document.createElement("div");
      pair.className = "pg-dial-slider";
      const wrap = document.createElement("div");
      wrap.className = "slider-wrap";
      wrap.appendChild(control);
      const tick = document.createElement("span");
      tick.className = "ours-tick";
      tick.title = "ours";
      tick.style.left = (oursFraction(param) * 100) + "%";
      wrap.appendChild(tick);
      pair.appendChild(wrap);
      pair.appendChild(box);
      row.appendChild(pair);
    }
    if (src.id === "atlas") {
      const bar = document.createElement("div");
      bar.id = "bar-" + param.name;
      bar.className = "sens-host";
      row.appendChild(bar);
    }
    const name = row.querySelector(".dial-name");
    if (name) {
      name.addEventListener("click", function () {
        if (src.id === "atlas") openDial(param, stripById(state.strips, param.name));
        else if (param.help) {
          openDialDrawer(param.label, { help: param.help, switches: [], caveat: "" }, state.index, null, []);
        }
      });
    }
    root.appendChild(row);
  });
  paintAllBars();
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
    else placeSlider(control, param, value);
    output.textContent = formatParam(param, value);
    output.classList.toggle("pg-offlock", !valuesEqual(param, value, param.locked) || outsideLocked(param, value));
    showExact(param, value);
    const tick = control.parentElement && control.parentElement.querySelector(".ours-tick");
    if (tick) tick.style.left = (oursFraction(param) * 100) + "%";
  });
}

function renderBanner() {
  const banner = $("pg-banner");
  if (!banner) return;
  const example = isExample(state.result);
  const locked = onLock();
  const src = model();
  banner.classList.toggle("pg-banner-explore", !locked);
  let text = "";
  if (!src) text = "";
  else if (state.freePlay) {
    text = "Free play. Exploration. Values may leave the locked ranges. This is not a claim.";
  } else if (example && locked && src.id !== "atlas") {
    text = "On the locked settings. The picture is still example data — not a rerun and not a claim.";
  } else if (example && !locked) {
    text = "Exploration. These settings are off the lock. Example data only — not a claim.";
  } else if (!example && locked && src.id === "atlas") {
    text = "";
  } else if (!example && locked) {
    text = "On the locked settings. The live verdict is the engine's. The card label beside it is the atlas record.";
  } else if (src.id === "atlas") {
    text = "Exploration. These dials are off the lock. Status is the locked rules at these dials, not a new record.";
  } else {
    text = "Exploration. These settings are off the lock. This run is not the locked card.";
  }
  if (state.engineNote) text = (text ? text + " " : "") + state.engineNote;
  banner.hidden = !text;
  banner.textContent = text;
  const free = $("pg-free");
  if (free) free.setAttribute("aria-pressed", state.freePlay ? "true" : "false");
}

function shownCardId(src) {
  const family = src && src.id === "starter" ? state.params.family : "P";
  if (family === "P") return "c.v3o.019.sticky-symmetry";
  if (family === "F") return "c.v3o.014.gauge-crystallization";
  if (family === "C") return "c.v3o.035.sierpinski-seed.sf-rule";
  if (src && src.id === "starter") return null;
  return "c.v3o.019.sticky-symmetry";
}

function prototypeMentions(notes) {
  if (!notes) return [];
  const found = [];
  const re = /F1 local verdict:?\s*([A-Z][A-Z-]*)/g;
  let match;
  while ((match = re.exec(notes))) {
    if (found.indexOf(match[1]) < 0) found.push(match[1]);
  }
  return found;
}

function prototypeCallout(card) {
  const mentions = prototypeMentions(card.notes);
  if (!mentions.length) return "";
  return '<p class="prototype-check">unsigned prototype check, not a label. The notes mention ' +
    escapeHtml(mentions.join(", ")) +
    ". The label on this card is " + escapeHtml(card.label) + ", the value stored in the card file.</p>";
}

function findCard(id) {
  return (state.index && state.index.cards || []).find(function (card) { return card.id === id; }) || null;
}

function renderVerdict() {
  const root = $("honesty");
  if (!root) return;
  const src = model();
  const result = state.result;
  const example = isExample(result);
  const locked = onLock();
  let live = "";
  if (src && src.id === "starter") {
    if (example) {
      live = "<p class=\"quiet\">No engine verdict is being computed.</p>";
    } else if (result && result.verdict) {
      live = "<p class=\"live-verdict mono\">" + escapeHtml(result.verdict) + "</p>" +
        "<p class=\"quiet\">Engine verdict for these controls. It is not the card's label.</p>";
    }
  }
  const cardId = shownCardId(src);
  const card = cardId ? findCard(cardId) : null;
  let record;
  if (!state.index) {
    record = "<p class=\"lock-kicker\">Locked record</p><p class=\"quiet\">The card label loads with the index.</p>";
  } else if (!card) {
    record = "<p class=\"lock-kicker\">Locked record</p><p class=\"quiet\">No experiment card is attached.</p>";
  } else {
    const effect = card.result || {};
    const legacy = card.legacy ? ' <span class="badge-legacy">legacy, unverified</span>' : "";
    record =
      "<p class=\"lock-kicker\">Locked record" + legacy + "</p>" +
      "<p>" + pill(card.label) + "</p>" +
      "<p class=\"quiet\">Label stored in the card file. The picture does not change it.</p>" +
      prototypeCallout(card) +
      '<p><a href="registry.html#card/' + encodeURIComponent(card.id) + '"><code>' + escapeHtml(card.id) + "</code></a></p>" +
      "<p class=\"mono quiet\">effect " + escapeHtml(formatNumber(effect.effect)) +
      " · se " + escapeHtml(formatNumber(effect.se)) +
      " · z " + escapeHtml(formatNumber(effect.z)) + "</p>";
  }
  const note = src && src.lockNote
    ? '<details class="pg-details"><summary>What is locked</summary><p class="quiet">' + escapeHtml(src.lockNote) + "</p></details>"
    : "";
  root.innerHTML = live + record + note;
  if (src && src.id === "starter" && result && result.verdict && !example) {
    root.classList.add("has-live");
  } else {
    root.classList.remove("has-live");
  }
  if (!locked && src && src.id === "starter") {
    /* the live panel already says the run is not the card */
  }
}

function setFoot(src) {
  const note = $("foot-note");
  if (!note) return;
  const stages = (state.preview && state.preview.stages) || currentStages();
  const first = stages.length ? stages[0].name : "Chosen rules";
  const last = stages.length ? stages[stages.length - 1].name : "Beings who can care";
  const atlas = (state.preview && state.preview.engine) || { name: "atlas", version: "" };
  const atlasToken = atlas.name + "@" + atlas.version;
  const active = (src && src.engine) || atlas;
  const activeToken = (active.name || "atlas") + "@" + (active.version || "");
  let claim;
  if (src && src.id === "starter") {
    claim = "Active engine: " + activeToken + ". It runs the pinned Universe Starter and returns a toy verdict for the frames. That verdict is not the card's label, and it does not predict chemistry or life. The map uses " + atlasToken + " under the locked rules.";
  } else {
    claim = "Active engine: " + activeToken + ". It reports stage status under the locked rules at the dials on this page. It cannot promote a card, and it is not a prediction of our universe's history.";
  }
  note.textContent =
    "Dials covered: fine-structure α, mass ratio β, strong-force change s, cosmological constant Λ, space dimensions n, arrow of time. " +
    "Stages covered: " + first + " through " + last + ". " +
    claim + " Live verdicts never promote cards. The map shows relative consequences under the stated assumptions.";
}

function viewApi() {
  return {
    model: model(),
    result: state.result,
    index: state.index,
    params: state.params,
    frame: state.frame,
    locked: onLock(),
    playing: state.playing,
    onFrame: function (frame) {
      state.playing = false;
      stopLoop();
      state.frame = frame;
      const host = $("starter-view");
      if (state.result && state.result.starter) paintEngineFrame(host, viewApi());
    },
    onToggle: function () {
      state.playing = !state.playing;
      if (state.playing) startLoop();
      else stopLoop();
    },
  };
}

function engineApi() {
  const api = viewApi();
  api.axisX = state.axisX;
  api.axisY = state.axisY;
  return api;
}

function showFidelity() {
  const fidelity = $("pg-fidelity");
  const src = model();
  if (!fidelity || !src) return;
  const kind = isExample(state.result) ? "example data" : "engine";
  const engine = src.engine || { name: "example", version: "0" };
  fidelity.textContent = engine.name + "@" + engine.version + " · " + kind + (state.freePlay ? " · free play" : "");
}

function refreshAtlas() {
  const dialog = $("drawer");
  if (dialog && dialog.open) dialog.close();
  const src = atlasModel();
  const params = atlasParams();
  if (src && src.stageAt && params && model() && model().id === "atlas") {
    state.atlasEval = src.stageAt(params);
    state.atlasParams = Object.assign({}, params);
    state.result = {
      example: false,
      fidelity: "engine",
      verdict: null,
      atlas: { stages: state.atlasEval.stages },
    };
  }
  paintStageChrome();
  scheduleMap();
  scheduleStrips();
  showFidelity();
  renderBanner();
  renderVerdict();
  setFoot(model());
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
      if (state.result && state.result.starter) paintEngineFrame($("starter-view"), viewApi());
      last = time;
    }
    state.timer = requestAnimationFrame(tick);
  };
  state.timer = requestAnimationFrame(tick);
}

async function applyParams() {
  const src = model();
  if (!src) return;
  if (src.id === "atlas") {
    refreshAtlas();
    scheduleUrl();
    return;
  }
  const seq = ++state.seq;
  let result;
  try {
    result = await Promise.resolve(src.run(Object.assign({}, state.params)));
  } catch (err) {
    if (seq !== state.seq) return;
    const banner = $("pg-banner");
    if (banner) {
      banner.hidden = false;
      banner.textContent = "This module failed to run. " + err.message;
    }
    scheduleUrl();
    return;
  }
  if (seq !== state.seq) return;
  if (result.appliedParams) {
    Object.keys(result.appliedParams).forEach(function (key) {
      if (state.params[key] !== result.appliedParams[key]) state.params[key] = result.appliedParams[key];
    });
    renderDials();
  }
  state.result = result;
  state.frame = 0;
  state.playing = !state.reducedMotion && frameCount(result) > 1;
  const host = $("starter-view");
  if (host && result.starter) renderEngine(host, engineApi());
  else if ($("pg-views")) renderViews($("pg-views"), viewApi());
  const run = $("run-lattice");
  if (run && result.starter) run.hidden = true;
  showFidelity();
  renderBanner();
  renderVerdict();
  setFoot(src);
  scheduleUrl();
  if (state.playing) startLoop();
  else stopLoop();
}

function writeUrl() {
  const src = model();
  if (!src) return;
  const base = encodeHash(src, state.params, state.freePlay);
  const query = new URLSearchParams(base.slice(base.indexOf("?") + 1));
  if (state.axisX) query.set("x", state.axisX);
  if (state.axisY) query.set("y", state.axisY);
  if (state.stageId) query.set("stage", state.stageId);
  else query.delete("stage");
  if (state.compare) query.set("compare", "1");
  else query.delete("compare");
  const next = src.id + "?" + query.toString();
  const current = (location.hash || "").replace(/^#/, "");
  if (current === next) return;
  state.suppressHash = true;
  history.replaceState(null, "", "#" + next);
  setTimeout(function () { state.suppressHash = false; }, 0);
}

function scheduleUrl() {
  clearTimeout(state.urlTimer);
  state.urlTimer = setTimeout(writeUrl, 30);
}

function hashMatchesState() {
  const src = model();
  if (!src) return false;
  const parsed = parseHash(location.hash);
  if (parsed.path !== state.currentId) return false;
  const applied = applyQuery(src, parsed.query, defaultsOf(src));
  if (applied.freePlay !== state.freePlay) return false;
  if ((parsed.query.get("x") || "alpha") !== state.axisX) return false;
  if ((parsed.query.get("y") || "beta") !== state.axisY) return false;
  if ((parsed.query.get("stage") || "") !== (state.stageId || "")) return false;
  if ((parsed.query.get("compare") === "1") !== Boolean(state.compare)) return false;
  return src.params.every(function (param) {
    return applied.params[param.name] === state.params[param.name];
  });
}

let runTimer = 0;
function scheduleRun() {
  const src = model();
  if (src && src.id === "atlas") {
    applyParams();
    return;
  }
  clearTimeout(runTimer);
  runTimer = setTimeout(applyParams, 40);
}

function readView(query) {
  if (!query) return;
  const x = query.get("x");
  const y = query.get("y");
  if (x) state.axisX = x;
  if (y) state.axisY = y;
  if (state.axisX === state.axisY) state.axisY = state.axisX === "alpha" ? "beta" : "alpha";
  state.stageId = knownStage(query.get("stage"));
  state.compare = query.get("compare") === "1";
}

function dialsAreOurs(query) {
  if (!state.preview || !state.preview.hold) return true;
  if (query.get("free") === "1") return false;
  const hold = state.preview.hold;
  const named = {
    alpha: hold.alpha,
    beta: hold.beta,
    strong: hold.strong,
    "cosmological-constant": hold.cosmological_constant,
    dimensions: hold.dimensions,
    arrow: hold.arrow,
  };
  const keys = Object.keys(named);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!query.has(key)) continue;
    const got = Number(query.get(key));
    const want = Number(named[key]);
    if (!Number.isFinite(got) || Math.abs(got - want) > Math.max(1e-12, Math.abs(want) * 1e-9)) return false;
  }
  return true;
}

function paintInitial() {
  state.preview = readPreview();
  initDrawer();
  initLegend();
  const parsed = parseHash(location.hash);
  readView(parsed.query);
  const path = parsed.path || "atlas";
  const showLocked = path !== "atlas" || dialsAreOurs(parsed.query);
  if (state.preview && showLocked) {
    state.atlasEval = { stages: state.preview.stages, dials: state.preview.hold };
    state.strips = state.preview.strips;
    paintStageChrome();
    const grid = gridFromPreview(state.preview, state.axisX, state.axisY, state.stageId);
    paintMap($("map-stage"), grid, mapOpts());
  } else if (state.preview) {
    paintSpine($("spine"), state.preview.stages.map(function (stage) {
      return { id: stage.id, name: stage.name, status: "" };
    }), { heading: "Stages", selectedId: null, onSelect: onStage });
  }
  paintAxesNow();
  setFoot(null);
}

async function loadModel(id, query) {
  const known = state.manifest.some(function (entry) { return entry.id === id; });
  const nextId = known ? id : (state.manifest[0] && state.manifest[0].id);
  if (!nextId) return;
  if (!known) history.replaceState(null, "", "#" + nextId);
  if (state.currentId === "atlas" && nextId !== "atlas") {
    state.atlasParams = Object.assign({}, state.params);
  }
  const entry = state.manifest.find(function (item) { return item.id === nextId; });
  if (!state.models.has(nextId)) {
    const mod = await import("./" + entry.src);
    state.models.set(nextId, hydrateAtlas(normalize(mod), state.index));
  }
  if (nextId !== "atlas" && !state.models.has("atlas")) {
    const atlasEntry = state.manifest.find(function (item) { return item.id === "atlas"; });
    if (atlasEntry) {
      const mod = await import("./" + atlasEntry.src);
      state.models.set("atlas", hydrateAtlas(normalize(mod), state.index));
    }
  }
  const src = state.models.get(nextId);
  const dialog = $("drawer");
  if (dialog && dialog.open) dialog.close();
  state.currentId = nextId;
  state.freePlay = false;
  state.engineNote = "";
  state.params = defaultsOf(src);
  if (query && Array.from(query.keys()).some(function (key) { return key !== "v"; })) {
    const applied = applyQuery(src, query, state.params);
    state.params = applied.params;
    state.freePlay = applied.freePlay;
    state.engineNote = applied.engineNote;
  }
  readView(query);
  const title = $("pg-title");
  if (title && src.id === "atlas") title.textContent = "Possible universes";
  stopLoop();
  renderPicker();
  renderDials();
  paintAxesNow();
  if (src.id === "atlas") {
    state.atlasParams = Object.assign({}, state.params);
    refreshAtlas();
  } else {
    paintStageChrome();
    scheduleMap();
    await applyParams();
  }
}

function renderRuns() {
  const list = $("pg-run-list");
  if (!list) return;
  const runs = state.runs || [];
  list.innerHTML = "";
  if (!runs.length) {
    list.innerHTML = '<li class="quiet">None saved in this browser.</li>';
    return;
  }
  runs.forEach(function (run) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pg-run";
    const known = state.manifest.find(function (entry) { return entry.id === run.model; });
    const title = (known && known.title) || run.model;
    const engine = run.engine || {};
    const when = run.savedAt ? String(run.savedAt).slice(0, 16).replace("T", " ") : "";
    button.innerHTML =
      '<span class="pg-model-title">' + escapeHtml(title) + "</span>" +
      '<span class="quiet">' + escapeHtml(engine.name || "example") + "@" + escapeHtml(engine.version || "0") +
      (run.seed == null ? "" : " · seed " + escapeHtml(run.seed)) +
      (run.freePlay ? " · free play" : "") +
      (run.fidelity ? " · " + escapeHtml(run.fidelity) : "") +
      " · " + escapeHtml(String(run.hash || "").slice(0, 12)) +
      (when ? " · " + escapeHtml(when) : "") + "</span>";
    button.addEventListener("click", function () {
      const shape = {
        id: run.model,
        engine: run.engine || { name: "example", version: "0" },
        params: Object.keys(run.params || {}).map(function (name) { return { name: name }; }),
      };
      location.hash = encodeHash(shape, run.params || {}, Boolean(run.freePlay));
    });
    li.appendChild(button);
    list.appendChild(li);
  });
}

function registryHash(raw) {
  return raw.startsWith("card/") || raw.startsWith("link/") || raw === "browse" || raw === "labels" || raw === "contribute" || raw === "top";
}

function onHash() {
  if (state.suppressHash) return;
  const parsed = parseHash(location.hash);
  if (registryHash(parsed.path)) {
    location.replace("registry.html#" + (parsed.path === "top" ? "browse" : parsed.path));
    return;
  }
  let id = parsed.path || "atlas";
  if (ALIAS[id]) {
    const family = ALIAS_FAMILY[id];
    id = ALIAS[id];
    if (family && !parsed.query.has("family")) parsed.query.set("family", family);
  }
  if (id === state.currentId && hashMatchesState()) return;
  loadModel(id, parsed.query).catch(function (err) {
    const banner = $("pg-banner");
    if (banner) {
      banner.hidden = false;
      banner.textContent = "Could not load that model. " + err.message;
    }
  });
}

function openMore() {
  const box = $("more-views");
  const body = $("more-body");
  if (!box || !body || !box.open) return;
  const src = atlasModel();
  const params = atlasParams();
  if (!src || !src.lambdaAt || !params) return;
  body.innerHTML = "";
  const lambda = document.createElement("div");
  const dims = document.createElement("div");
  body.appendChild(lambda);
  body.appendChild(dims);
  paintLambda(lambda, src.lambdaAt(params));
  paintDimensions(dims, src.dimensionsAt(params));
}

async function boot() {
  paintInitial();
  state.store = openStore();
  try {
    state.runs = await state.store.listRuns();
  } catch (err) {
    state.store = createLocalStorageAdapter(createMemoryStorage());
    state.runs = [];
  }
  renderRuns();
  $("pg-reset").addEventListener("click", function () {
    const src = model();
    if (!src) return;
    state.freePlay = false;
    state.params = {};
    src.params.forEach(function (param) { state.params[param.name] = param.locked; });
    renderDials();
    applyParams();
  });
  $("pg-free").addEventListener("click", function () {
    const src = model();
    if (!src) return;
    state.freePlay = !state.freePlay;
    if (!state.freePlay) {
      src.params.forEach(function (param) {
        state.params[param.name] = clampToBounds(param, state.params[param.name], false);
      });
    }
    renderDials();
    applyParams();
  });
  $("pg-compare").addEventListener("click", function () {
    state.compare = !state.compare;
    paintStageChrome();
    scheduleUrl();
  });
  const lattice = $("run-lattice");
  if (lattice) {
    lattice.addEventListener("click", function () {
      if (state.currentId === "starter") applyParams();
      else location.hash = "starter";
    });
  }
  const more = $("more-views");
  if (more) more.addEventListener("toggle", openMore);
  $("pg-save").addEventListener("click", function () {
    const src = model();
    const note = $("pg-save-note");
    if (!src || !state.result) return;
    buildRunRecord(src, state.params, state.result, state.freePlay).then(function (record) {
      return state.store.saveRun(record).then(function () { return record; });
    }).then(function (record) {
      return state.store.listRuns().then(function (runs) {
        state.runs = runs;
        renderRuns();
        const mine = $("pg-my-runs");
        if (mine) mine.open = true;
        if (note) note.textContent = "Saved in this browser. Hash " + record.hash.slice(0, 12) + "…";
      });
    }).catch(function (err) {
      if (note) note.textContent = "Could not save this run. " + err.message;
    });
  });
  $("pg-copy").addEventListener("click", function () {
    const note = $("pg-save-note");
    const href = location.href;
    const done = function (ok) {
      if (note) note.textContent = ok ? "Link copied." : "The address bar is the link.";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(href).then(function () { done(true); }).catch(function () { done(false); });
    } else done(false);
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
    const banner = $("pg-banner");
    if (banner) {
      banner.hidden = false;
      banner.textContent = "The atlas could not load its index. " + err.message;
    }
    return;
  }
  paintStageChrome();
  renderVerdict();
  const parsed = parseHash(location.hash);
  if (registryHash(parsed.path)) {
    location.replace("registry.html#" + (parsed.path === "top" ? "browse" : parsed.path));
    return;
  }
  let id = parsed.path || "atlas";
  if (ALIAS[id]) {
    const family = ALIAS_FAMILY[id];
    id = ALIAS[id];
    if (family && !parsed.query.has("family")) parsed.query.set("family", family);
  }
  if (!parsed.path) history.replaceState(null, "", "#atlas");
  try {
    await loadModel(id, parsed.query);
  } catch (err) {
    const banner = $("pg-banner");
    if (banner) {
      banner.hidden = false;
      banner.textContent = "Could not load the atlas. " + err.message;
    }
  }
}

boot();
