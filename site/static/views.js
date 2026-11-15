/* Renderers for the playground shell. Pictures only. No atlas conditions, no lattice engine. */

const VIEW_COPY = {
  map: {
    title: "Possible universes",
    blurb: "Axes are the recorded alpha and beta ranges. Dots are your dials and the recorded ours. Hatched patches are example geometry.",
  },
  timeline: {
    title: "What the strip can show",
    blurb: "Atoms, periodic table, stars, galaxies, life. Each chip cites one link. The label on the chip is that link's record. Lights are example data until a module computes them.",
  },
  lambda: {
    title: "Cosmological constant",
    blurb: "Symmetric-log axis. Ticks are window fields stored on the links, and the recorded ours. This line does not decide pass or fail.",
  },
  links: {
    title: "Recorded consequence links",
    blurb: "Every atlas link, coloured by its label. Drawn from the index. Nothing here is recomputed.",
  },
  lattice: {
    title: "Lattice",
    blurb: "Plus and minus in two colours. Example frames, not family P.",
  },
  phase: {
    title: "Phase field",
    blurb: "Hue wheel, with plus and minus marks. Example frames, not family F.",
  },
  spacetime: {
    title: "Space-time",
    blurb: "Example picture. Time runs downward. Not family C.",
  },
  series: {
    title: "Curves",
    blurb: "Slots the module filled. Read the legend before treating a line as a measure.",
  },
};

const LABEL_COLOR = {
  CONJECTURE: "#e0b15a",
  REPRODUCED: "#6fbfa3",
  DIFFERS: "#7eb4e0",
  ROBUST: "#8fd18b",
  "KNOWN-MECHANISM": "#b39ee0",
  "NOVEL-CANDIDATE": "#f0c36a",
  FAILED: "#e07a72",
  "DEAD-END": "#c4937a",
  "INERT-BY-CONSTRUCTION": "#8b9084",
  DERIVED: "#8fd18b",
  "DERIVED-UNDER-ASSUMPTION": "#c4c878",
  IMPORTED: "#7eb4e0",
  ASSUMED: "#e0b15a",
  CONTESTED: "#e08ab8",
};

const REAL_VIEWS = new Set(["links", "lambda"]);

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

function linkById(index, id) {
  return (index && index.links || []).find(function (item) { return item.id === id; }) || null;
}

function stageById(index, id) {
  return (index && index.stages || []).find(function (item) { return item.id === id; }) || null;
}

function dialById(index, id) {
  return (index && index.dials || []).find(function (item) { return item.id === id; }) || null;
}

function toSlider(param, value) {
  const n = Number(value);
  if (param.scale === "log") return Math.log(Math.max(n, Number.MIN_VALUE));
  if (param.scale === "symlog") {
    const lin = param.linthresh || 0.1;
    return Math.sign(n) * Math.log10(1 + Math.abs(n) / lin);
  }
  return n;
}

function fromSlider(param, slider) {
  const n = Number(slider);
  if (param.scale === "log") return Math.exp(n);
  if (param.scale === "symlog") {
    const lin = param.linthresh || 0.1;
    const sign = Math.sign(n);
    return sign * lin * (10 ** Math.abs(n) - 1);
  }
  if (param.type === "integer" || param.scale === "discrete") return Math.round(n);
  return n;
}

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e4)) return value.toExponential(3);
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1e6) / 1e6);
}

function cssWidth(node, fallback) {
  const rect = node.getBoundingClientRect();
  return Math.max(280, Math.floor(rect.width || fallback || 640));
}

function fitCanvas(canvas, cssW, cssH) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function frameCount(result) {
  if (!result) return 1;
  if (result.starter && result.starter.frames) return result.starter.frames.length;
  if (result.lattice && result.lattice.frames) return result.lattice.frames.length;
  if (result.phase && result.phase.frames) return result.phase.frames.length;
  return 1;
}

function renderViews(root, api) {
  root.innerHTML = "";
  const views = (api.model && api.model.views) || [];
  views.forEach(function (name) {
    const section = document.createElement("section");
    section.className = "pg-view";
    section.dataset.view = name;
    const copy = VIEW_COPY[name] || { title: name, blurb: "This shell has no renderer for this view yet." };
    const example = api.result && api.result.example && !REAL_VIEWS.has(name);
    section.innerHTML =
      '<div class="pg-view-head"><h3>' + escapeHtml(copy.title) + "</h3>" +
      (example ? '<span class="pg-stamp">Example data</span>' : "") +
      "</div>" +
      '<p class="quiet pg-blurb">' + escapeHtml(copy.blurb) + "</p>";
    const body = document.createElement("div");
    body.className = "pg-view-body";
    section.appendChild(body);
    root.appendChild(section);
    const painter = PAINTERS[name];
    if (!painter) {
      body.innerHTML = '<p class="quiet">No renderer for <code>' + escapeHtml(name) + "</code> yet. Add it in site/static/views.js.</p>";
      return;
    }
    painter(body, api);
  });
  if (api.result && api.result.note) {
    const note = document.createElement("p");
    note.className = "pg-note";
    note.textContent = api.result.note;
    root.appendChild(note);
  }
}

function paintDynamic(root, api) {
  root.querySelectorAll(".pg-view").forEach(function (section) {
    const name = section.dataset.view;
    if (name !== "lattice" && name !== "phase" && name !== "series") return;
    const body = section.querySelector(".pg-view-body");
    const painter = PAINTERS[name];
    if (painter && body) painter(body, api);
  });
}

function paintMap(body, api) {
  const result = api.result || {};
  const map = result.map || { regions: [] };
  const xDial = dialById(api.index, map.x || "alpha") || paramAsDial(api.model, map.x || "alpha");
  const yDial = dialById(api.index, map.y || "beta") || paramAsDial(api.model, map.y || "beta");
  const cssW = cssWidth(body, 720);
  const cssH = Math.max(280, Math.min(460, Math.round(cssW * 0.62)));
  body.innerHTML = "";
  const frame = document.createElement("div");
  frame.className = "pg-frame";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Alpha-beta plane with example patches, our universe, and the current dials");
  frame.appendChild(canvas);
  body.appendChild(frame);
  const ctx = fitCanvas(canvas, cssW, cssH);
  drawMap(ctx, cssW, cssH, map, xDial, yDial, api);
  body.appendChild(mapCaption(map, xDial, yDial, api));
}

function paramAsDial(model, name) {
  const param = (model.params || []).find(function (item) { return item.name === name; });
  if (!param) return null;
  return {
    id: name,
    name: param.label,
    symbol: param.symbol || name,
    ours: param.locked,
    range: [param.min, param.max],
    scale: param.scale,
  };
}

function drawMap(ctx, width, height, map, xDial, yDial, api) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#10110d";
  ctx.fillRect(0, 0, width, height);
  const pad = { l: 58, r: 16, t: 16, b: 42 };
  const plot = { x: pad.l, y: pad.t, w: width - pad.l - pad.r, h: height - pad.t - pad.b };
  if (!xDial || !yDial || !(xDial.range && yDial.range)) {
    ctx.fillStyle = "#a8a494";
    ctx.font = "14px sans-serif";
    ctx.fillText("Dial ranges are not loaded.", plot.x, plot.y + 24);
    return;
  }
  const x0 = xDial.range[0];
  const x1 = xDial.range[1];
  const y0 = yDial.range[0];
  const y1 = yDial.range[1];
  function px(v) {
    const t = (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0));
    return plot.x + Math.min(1, Math.max(0, t)) * plot.w;
  }
  function py(v) {
    const t = (Math.log(v) - Math.log(y0)) / (Math.log(y1) - Math.log(y0));
    return plot.y + plot.h - Math.min(1, Math.max(0, t)) * plot.h;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.x, plot.y, plot.w, plot.h);
  ctx.clip();
  (map.regions || []).forEach(function (region, index) {
    const link = linkById(api.index, region.linkId);
    const color = LABEL_COLOR[(link && link.label) || ""] || "#a8a494";
    const left = px(Math.min(region.x0, region.x1));
    const right = px(Math.max(region.x0, region.x1));
    const top = py(Math.max(region.y0, region.y1));
    const bottom = py(Math.min(region.y0, region.y1));
    ctx.fillStyle = hexAlpha(color, 0.18);
    ctx.fillRect(left, top, Math.max(2, right - left), Math.max(2, bottom - top));
    ctx.strokeStyle = hexAlpha(color, 0.85);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(left, top, Math.max(2, right - left), Math.max(2, bottom - top));
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = "12px sans-serif";
    ctx.fillText(String(index + 1), left + 6, top + 14);
  });
  ctx.restore();
  drawDot(ctx, px(xDial.ours), py(yDial.ours), "#f3efe4", "ours");
  const userX = Number(api.params[xDial.id]);
  const userY = Number(api.params[yDial.id]);
  if (userX > 0 && userY > 0) {
    const same = Math.abs(Math.log(userX) - Math.log(xDial.ours)) < 0.02 && Math.abs(Math.log(userY) - Math.log(yDial.ours)) < 0.02;
    drawDot(ctx, px(userX), py(userY), "#e0b15a", same ? "" : "this setting");
  }
  ctx.strokeStyle = "#2b2d24";
  ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);
  ctx.fillStyle = "#a8a494";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText((xDial.symbol || xDial.name || "x") + "  (log)", plot.x + plot.w / 2, height - 14);
  ctx.save();
  ctx.translate(16, plot.y + plot.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText((yDial.symbol || yDial.name || "y") + "  (log)", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawDot(ctx, x, y, color, label) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#0c0d0a";
  ctx.stroke();
  if (label) {
    ctx.fillStyle = color;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 8, y - 8);
  }
}

function hexAlpha(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}

function mapCaption(map, xDial, yDial, api) {
  const wrap = document.createElement("div");
  const list = document.createElement("ol");
  list.className = "pg-region-list";
  (map.regions || []).forEach(function (region) {
    const link = linkById(api.index, region.linkId);
    const li = document.createElement("li");
    const label = link ? link.label : "label unavailable";
    li.innerHTML = pill(label) + " <code>" + escapeHtml(region.linkId) + "</code> · example patch";
    list.appendChild(li);
  });
  const dots = document.createElement("p");
  dots.className = "quiet";
  const ours = xDial && yDial
    ? "Our universe sits at " + (xDial.symbol || xDial.id) + " = " + formatNumber(Number(xDial.ours)) + ", " + (yDial.symbol || yDial.id) + " = " + formatNumber(Number(yDial.ours)) + "."
    : "Recorded ours could not be read.";
  const hereX = xDial ? Number(api.params[xDial.id]) : NaN;
  const hereY = yDial ? Number(api.params[yDial.id]) : NaN;
  const here = " This setting is " + formatNumber(hereX) + ", " + formatNumber(hereY) + ".";
  dots.textContent = ours + here;
  wrap.appendChild(list);
  wrap.appendChild(dots);
  return wrap;
}

function stageState(stage, result, locked) {
  if (!result || result.example) {
    if (locked && stage.litAtLock) return stage.litAtLock;
    return "unknown";
  }
  return stage.lit || "unknown";
}

function stateWord(state) {
  if (state === "example-on") return "Example illustration, lit";
  if (state === "example-off") return "Example illustration, grey";
  if (state === "on") return "On";
  if (state === "off") return "Off";
  return "Not computed";
}

function paintTimeline(body, api) {
  const stages = (api.result && api.result.stages) || [];
  body.innerHTML = "";
  const row = document.createElement("ol");
  row.className = "pg-timeline";
  stages.forEach(function (stage) {
    const record = stageById(api.index, stage.stageId);
    const link = linkById(api.index, stage.linkId);
    const state = stageState(stage, api.result, api.locked);
    const li = document.createElement("li");
    li.className = "pg-stage";
    li.dataset.state = state;
    li.innerHTML =
      '<p class="pg-stage-kicker">' + escapeHtml(stateWord(state)) + "</p>" +
      "<h4>" + escapeHtml((record && record.name) || stage.stageId) + "</h4>" +
      (link ? pill(link.label) : pill("label unavailable")) +
      '<p class="quiet"><code>' + escapeHtml(stage.linkId || "") + "</code></p>";
    row.appendChild(li);
  });
  body.appendChild(row);
  if (!stages.length) {
    body.innerHTML = '<p class="quiet">This module did not return a stage strip.</p>';
  }
}

function lambdaMarks(index) {
  const marks = [];
  (index && index.links || []).forEach(function (link) {
    const window = link.window;
    if (!window) return;
    const dial = window.dial;
    if (dial !== "cosmological-constant" && dial !== "cosmological_constant") return;
    if (typeof window.lo === "number") marks.push({ link: link, value: window.lo, side: "lo" });
    if (typeof window.hi === "number") marks.push({ link: link, value: window.hi, side: "hi" });
  });
  return marks;
}

function paintLambda(body, api) {
  const dial = dialById(api.index, "cosmological-constant") || paramAsDial(api.model, "cosmological-constant");
  body.innerHTML = "";
  if (!dial) {
    body.innerHTML = '<p class="quiet">The cosmological-constant dial is not in this index.</p>';
    return;
  }
  const cssW = cssWidth(body, 720);
  const cssH = 168;
  const frame = document.createElement("div");
  frame.className = "pg-frame";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Symmetric-log cosmological constant with recorded window ticks");
  frame.appendChild(canvas);
  body.appendChild(frame);
  const ctx = fitCanvas(canvas, cssW, cssH);
  const param = (api.model.params || []).find(function (item) { return item.name === "cosmological-constant"; }) || { scale: "symlog", linthresh: 0.1, min: dial.range[0], max: dial.range[1] };
  drawLambda(ctx, cssW, cssH, dial, param, api);
  const list = document.createElement("ul");
  list.className = "pg-region-list";
  const ours = document.createElement("li");
  ours.textContent = "ours = " + formatNumber(Number(dial.ours)) + " (recorded)";
  list.appendChild(ours);
  lambdaMarks(api.index).forEach(function (mark) {
    const li = document.createElement("li");
    li.innerHTML = pill(mark.link.label) + " <code>" + escapeHtml(mark.link.id) + "</code> · recorded " + escapeHtml(mark.side) + " = " + formatNumber(mark.value);
    list.appendChild(li);
  });
  const here = document.createElement("li");
  here.textContent = "This setting = " + formatNumber(Number(api.params["cosmological-constant"]));
  list.appendChild(here);
  body.appendChild(list);
}

function drawLambda(ctx, width, height, dial, param, api) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#10110d";
  ctx.fillRect(0, 0, width, height);
  const padL = 16;
  const padR = 16;
  const axisY = 78;
  const scaleParam = { scale: "symlog", linthresh: param.linthresh || 0.1, min: dial.range[0], max: dial.range[1] };
  const s0 = toSlider(scaleParam, dial.range[0]);
  const s1 = toSlider(scaleParam, dial.range[1]);
  function xOf(value) {
    const t = (toSlider(scaleParam, value) - s0) / (s1 - s0);
    return padL + Math.min(1, Math.max(0, t)) * (width - padL - padR);
  }
  ctx.strokeStyle = "#2b2d24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padL, axisY);
  ctx.lineTo(width - padR, axisY);
  ctx.stroke();
  function tick(value, color, label, above) {
    const x = xOf(value);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, axisY - 16);
    ctx.lineTo(x, axisY + 16);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x, above ? axisY - 22 : axisY + 32);
  }
  tick(Number(dial.ours), "#f3efe4", "ours", true);
  lambdaMarks(api.index).forEach(function (mark, index) {
    const color = LABEL_COLOR[mark.link.label] || "#a8a494";
    tick(mark.value, color, mark.side + " " + formatNumber(mark.value), index % 2 === 1);
  });
  const current = Number(api.params["cosmological-constant"]);
  const x = xOf(current);
  ctx.fillStyle = "#e0b15a";
  ctx.beginPath();
  ctx.arc(x, axisY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a8a494";
  ctx.textAlign = "left";
  ctx.font = "12px sans-serif";
  ctx.fillText(formatNumber(dial.range[0]), padL, height - 18);
  ctx.textAlign = "right";
  ctx.fillText(formatNumber(dial.range[1]), width - padR, height - 18);
  ctx.textAlign = "center";
  ctx.fillText("Λ  (symmetric log)", width / 2, height - 18);
}

function paintLinks(body, api) {
  const index = api.index || { stages: [], links: [] };
  const stages = (index.stages || []).slice().sort(function (a, b) {
    return (a.order || 0) - (b.order || 0) || String(a.id).localeCompare(String(b.id));
  });
  body.innerHTML = "";
  if (!stages.length) {
    body.innerHTML = '<p class="quiet">Stages are not in this index.</p>';
    return;
  }
  const rowH = 48;
  const width = Math.max(640, cssWidth(body, 720));
  const height = stages.length * rowH + 28;
  const yOf = {};
  stages.forEach(function (stage, i) { yOf[stage.id] = 22 + i * rowH; });
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Graph of recorded atlas links between stages");
  svg.classList.add("pg-graph");
  const groups = {};
  (index.links || []).forEach(function (link) {
    const key = link.from + "→" + link.to;
    if (!groups[key]) groups[key] = [];
    groups[key].push(link);
  });
  Object.keys(groups).forEach(function (key) {
    groups[key].forEach(function (link, i) {
      const y1 = yOf[link.from];
      const y2 = yOf[link.to];
      if (y1 === undefined || y2 === undefined) return;
      const spread = (i - (groups[key].length - 1) / 2) * 18;
      const x1 = 210;
      const x2 = width - 28;
      const c = 210 + 80 + spread;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M " + x1 + " " + y1 + " C " + c + " " + y1 + ", " + c + " " + y2 + ", " + x2 + " " + y2);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", LABEL_COLOR[link.label] || "#a8a494");
      path.setAttribute("stroke-width", "1.6");
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = link.label + " · " + link.id;
      path.appendChild(title);
      svg.appendChild(path);
    });
  });
  stages.forEach(function (stage) {
    const y = yOf[stage.id];
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "8");
    text.setAttribute("y", String(y + 4));
    text.setAttribute("fill", "#f3efe4");
    text.setAttribute("font-size", "12");
    const full = stage.name || stage.id;
    text.textContent = full.length > 34 ? full.slice(0, 32) + "…" : full;
    const tip = document.createElementNS("http://www.w3.org/2000/svg", "title");
    tip.textContent = full;
    text.appendChild(tip);
    svg.appendChild(text);
  });
  const frame = document.createElement("div");
  frame.className = "pg-frame pg-scroll";
  frame.appendChild(svg);
  body.appendChild(frame);
  const details = document.createElement("details");
  details.className = "pg-details";
  const summary = document.createElement("summary");
  summary.textContent = "Every link, with its label";
  const list = document.createElement("ul");
  list.className = "pg-region-list";
  (index.links || []).forEach(function (link) {
    const li = document.createElement("li");
    const href = "registry.html#link/" + encodeURIComponent(link.id);
    li.innerHTML = pill(link.label) + ' <a href="' + href + '"><code>' + escapeHtml(link.id) + "</code></a>";
    list.appendChild(li);
  });
  details.appendChild(summary);
  details.appendChild(list);
  body.appendChild(details);
}

function paintLattice(body, api) {
  const lattice = api.result && api.result.lattice;
  if (!lattice || !lattice.frames || !lattice.frames.length) {
    body.innerHTML = '<p class="quiet">No lattice frames in this result.</p>';
    return;
  }
  const frameIndex = Math.min(lattice.frames.length - 1, Math.max(0, api.frame || 0));
  const cells = lattice.frames[frameIndex];
  const existing = body.querySelector("canvas");
  if (!existing || Number(body.dataset.w) !== lattice.w || Number(body.dataset.h) !== lattice.h) {
    body.innerHTML = "";
    body.dataset.w = String(lattice.w);
    body.dataset.h = String(lattice.h);
    const frame = document.createElement("div");
    frame.className = "pg-frame";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Example lattice of plus and minus marks");
    frame.appendChild(canvas);
    body.appendChild(frame);
    const caption = document.createElement("p");
    caption.className = "quiet pg-frame-caption";
    body.appendChild(caption);
    mountTransport(body, api, lattice.frames.length);
  } else {
    const transport = body.querySelector(".pg-transport");
    if (transport) updateTransport(transport, api, lattice.frames.length);
  }
  const canvas = body.querySelector("canvas");
  const avail = Math.min(cssWidth(body, 640), 640);
  const cell = lattice.h === 1
    ? Math.max(8, Math.min(18, Math.floor(avail / lattice.w)))
    : Math.max(4, Math.floor(Math.min(avail / lattice.w, 520 / lattice.h)));
  const cssW = cell * lattice.w;
  const cssH = lattice.h === 1 ? 56 : cell * lattice.h;
  const ctx = fitCanvas(canvas, cssW, cssH);
  ctx.fillStyle = "#10110d";
  ctx.fillRect(0, 0, cssW, cssH);
  if (cell >= 8 && lattice.h > 1) {
    ctx.strokeStyle = "rgba(243,239,228,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= lattice.w; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * cell + 0.5, 0);
      ctx.lineTo(x * cell + 0.5, cssH);
      ctx.stroke();
    }
    for (let y = 0; y <= lattice.h; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell + 0.5);
      ctx.lineTo(cssW, y * cell + 0.5);
      ctx.stroke();
    }
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = Math.max(8, cell * 0.72) + "px sans-serif";
  let plus = 0;
  let minus = 0;
  for (let i = 0; i < cells.length; i += 1) {
    const q = cells[i];
    if (!q) continue;
    if (q > 0) plus += 1;
    else minus += 1;
    const x = i % lattice.w;
    const y = Math.floor(i / lattice.w);
    ctx.fillStyle = q > 0 ? "#e0b15a" : "#6fbfa3";
    if (cell >= 9) ctx.fillText(q > 0 ? "+" : "−", (x + 0.5) * cell, (y + 0.5) * cell);
    else ctx.fillRect(x * cell + 1, y * cell + 1, Math.max(2, cell - 2), Math.max(2, cell - 2));
  }
  const caption = body.querySelector(".pg-frame-caption");
  if (caption) {
    caption.textContent = "Example frame " + (frameIndex + 1) + " of " + lattice.frames.length + ". Marks in this frame: " + plus + " plus, " + minus + " minus.";
  }
}

function paintPhase(body, api) {
  const phase = api.result && api.result.phase;
  if (!phase || !phase.frames || !phase.frames.length) {
    body.innerHTML = '<p class="quiet">No phase frames in this result.</p>';
    return;
  }
  const frameIndex = Math.min(phase.frames.length - 1, Math.max(0, api.frame || 0));
  if (!body.querySelector("canvas") || Number(body.dataset.w) !== phase.w) {
    body.innerHTML = "";
    body.dataset.w = String(phase.w);
    const frame = document.createElement("div");
    frame.className = "pg-frame";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Example phase field on a hue wheel with vortex marks");
    frame.appendChild(canvas);
    body.appendChild(frame);
    mountTransport(body, api, phase.frames.length);
  } else {
    const transport = body.querySelector(".pg-transport");
    if (transport) updateTransport(transport, api, phase.frames.length);
  }
  const canvas = body.querySelector("canvas");
  const avail = Math.min(cssWidth(body, 680), 640);
  const cell = Math.max(4, Math.floor(avail / phase.w));
  const cssW = phase.w * cell;
  const cssH = phase.h * cell;
  const ctx = fitCanvas(canvas, cssW, cssH);
  const bytes = phase.frames[frameIndex];
  for (let i = 0; i < bytes.length; i += 1) {
    const x = i % phase.w;
    const y = Math.floor(i / phase.w);
    const hue = (bytes[i] / 255) * 360;
    ctx.fillStyle = "hsl(" + hue + " 42% 42%)";
    ctx.fillRect(x * cell, y * cell, cell, cell);
  }
  const marks = (phase.vortices && phase.vortices[frameIndex]) || [];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = Math.max(11, cell * 1.4) + "px sans-serif";
  marks.forEach(function (mark) {
    const x = mark.x * cssW;
    const y = mark.y * cssH;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(7, cell * 0.9), 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#f3efe4";
    ctx.stroke();
    ctx.fillStyle = "#f3efe4";
    ctx.fillText(mark.sign < 0 ? "−" : "+", x, y);
  });
}

function paintSpacetime(body, api) {
  const grid = api.result && api.result.spacetime;
  body.innerHTML = "";
  if (!grid || !grid.cells) {
    body.innerHTML = '<p class="quiet">No space-time image in this result.</p>';
    return;
  }
  const scale = 3;
  const cssW = grid.w * scale;
  const cssH = grid.h * scale;
  const frame = document.createElement("div");
  frame.className = "pg-frame pg-scroll";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Example space-time diagram");
  frame.appendChild(canvas);
  body.appendChild(frame);
  const ctx = fitCanvas(canvas, cssW, cssH);
  ctx.fillStyle = "#14150f";
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#e0b15a";
  for (let i = 0; i < grid.cells.length; i += 1) {
    if (!grid.cells[i]) continue;
    const x = i % grid.w;
    const y = Math.floor(i / grid.w);
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }
}

function paintSeries(body, api) {
  const series = (api.result && api.result.series) || null;
  if (!series || !series.t || !series.t.length) {
    body.innerHTML = '<p class="quiet">No curves in this result.</p>';
    return;
  }
  const keys = Object.keys(series).filter(function (key) { return key !== "t" && Array.isArray(series[key]); });
  const cssW = cssWidth(body, 720);
  const cssH = 220;
  if (!body.querySelector("canvas") || body.dataset.keys !== keys.join(",")) {
    body.innerHTML = "";
    body.dataset.keys = keys.join(",");
    const frame = document.createElement("div");
    frame.className = "pg-frame";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Line chart of the module's series slots");
    frame.appendChild(canvas);
    body.appendChild(frame);
    const legend = document.createElement("ul");
    legend.className = "pg-legend";
    body.appendChild(legend);
  }
  const canvas = body.querySelector("canvas");
  const ctx = fitCanvas(canvas, cssW, cssH);
  drawSeries(ctx, cssW, cssH, series, keys, api);
  const legend = body.querySelector(".pg-legend");
  const labels = (api.result && api.result.seriesLabels) || {};
  const colors = ["#e0b15a", "#6fbfa3", "#7eb4e0", "#c4c878"];
  legend.innerHTML = keys.map(function (key, i) {
    const name = labels[key] || key;
    return '<li><span class="pg-swatch" style="background:' + colors[i % colors.length] + '"></span>' + escapeHtml(name) + "</li>";
  }).join("");
}

function drawSeries(ctx, width, height, series, keys, api) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#10110d";
  ctx.fillRect(0, 0, width, height);
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  let ymin = Infinity;
  let ymax = -Infinity;
  keys.forEach(function (key) {
    series[key].forEach(function (value) {
      if (typeof value !== "number") return;
      ymin = Math.min(ymin, value);
      ymax = Math.max(ymax, value);
    });
  });
  if (!Number.isFinite(ymin) || !Number.isFinite(ymax)) return;
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const t = series.t;
  const t0 = t[0];
  const t1 = t[t.length - 1];
  function xOf(i) {
    if (t1 === t0) return pad.l + plotW / 2;
    return pad.l + ((t[i] - t0) / (t1 - t0)) * plotW;
  }
  function yOf(v) {
    return pad.t + plotH - ((v - ymin) / (ymax - ymin)) * plotH;
  }
  ctx.strokeStyle = "#2b2d24";
  ctx.strokeRect(pad.l, pad.t, plotW, plotH);
  ctx.fillStyle = "#737065";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(formatNumber(ymax), pad.l - 6, pad.t + 8);
  ctx.fillText(formatNumber(ymin), pad.l - 6, pad.t + plotH);
  ctx.textAlign = "left";
  ctx.fillText(formatNumber(t0), pad.l, height - 8);
  ctx.textAlign = "right";
  ctx.fillText(formatNumber(t1), pad.l + plotW, height - 8);
  const colors = ["#e0b15a", "#6fbfa3", "#7eb4e0", "#c4c878"];
  keys.forEach(function (key, k) {
    ctx.beginPath();
    ctx.strokeStyle = colors[k % colors.length];
    ctx.lineWidth = 1.6;
    series[key].forEach(function (value, i) {
      const x = xOf(i);
      const y = yOf(value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  const n = t.length;
  if (n > 1 && api.frame !== undefined && frameCount(api.result) === n) {
    const i = Math.min(n - 1, Math.max(0, api.frame || 0));
    ctx.strokeStyle = "rgba(243,239,228,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xOf(i), pad.t);
    ctx.lineTo(xOf(i), pad.t + plotH);
    ctx.stroke();
  }
}

function mountTransport(body, api, count) {
  const bar = document.createElement("div");
  bar.className = "pg-transport";
  const play = document.createElement("button");
  play.type = "button";
  play.className = "pg-play";
  play.textContent = api.playing ? "Pause" : "Play";
  play.addEventListener("click", function () {
    if (api.onToggle) api.onToggle();
  });
  const scrub = document.createElement("input");
  scrub.type = "range";
  scrub.min = "0";
  scrub.max = String(Math.max(0, count - 1));
  scrub.value = String(api.frame || 0);
  scrub.setAttribute("aria-label", "Example frame");
  scrub.addEventListener("input", function () {
    if (api.onFrame) api.onFrame(Number(scrub.value));
  });
  const label = document.createElement("span");
  label.className = "pg-frame-label quiet";
  bar.appendChild(play);
  bar.appendChild(scrub);
  bar.appendChild(label);
  body.appendChild(bar);
  updateTransport(bar, api, count);
}

function updateTransport(bar, api, count) {
  const play = bar.querySelector(".pg-play");
  const scrub = bar.querySelector("input");
  const label = bar.querySelector(".pg-frame-label");
  if (play) play.textContent = api.playing ? "Pause" : "Play";
  if (scrub && document.activeElement !== scrub) {
    scrub.max = String(Math.max(0, count - 1));
    scrub.value = String(api.frame || 0);
  }
  if (label) label.textContent = "Example frame " + ((api.frame || 0) + 1) + " / " + count;
}

const PAINTERS = {
  map: paintMap,
  timeline: paintTimeline,
  lambda: paintLambda,
  links: paintLinks,
  lattice: paintLattice,
  phase: paintPhase,
  spacetime: paintSpacetime,
  series: paintSeries,
};

export { renderViews, paintDynamic, toSlider, fromSlider, formatNumber, frameCount };
