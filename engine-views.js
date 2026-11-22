/* Draw atlas.js and starter.js results. Wiring follows site/engine/demo.html. */

const COL = {
  ok: "#3dcf8e",
  weak: "#c9b44a",
  open: "#7eb4e0",
  contested: "#e0a14a",
  fail: "#e25c6a",
  blocked: "#8b9084",
};

const STATUS_REGION = {
  PASS: "ok",
  WEAK: "weak",
  OPEN: "open",
  CONTESTED: "contested",
  FAIL: "fail",
  BLOCKED: "blocked",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgEl(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function regionOfStatus(status) {
  return STATUS_REGION[status] || "blocked";
}

function section(title, blurb) {
  const el = document.createElement("section");
  el.className = "pg-view";
  el.innerHTML = "<h3>" + escapeHtml(title) + "</h3>" +
    (blurb ? '<p class="quiet pg-blurb">' + escapeHtml(blurb) + "</p>" : "");
  return el;
}

function paintMap(body, grid, readout) {
  body.innerHTML = "";
  const frame = document.createElement("div");
  frame.className = "pg-frame";
  const svg = svgEl("svg");
  svg.setAttribute("viewBox", "0 0 420 360");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Possible universes. Colour is the worst featured stage. The honesty label is the governing link.");
  svg.classList.add("pg-map-svg");
  const pad = 36;
  const W = 420;
  const H = 360;
  const pw = W - pad * 1.2;
  const ph = H - pad * 1.4;
  const xs = grid.x.values;
  const ys = grid.y.values;
  const nx = xs.length;
  const ny = ys.length;
  const cw = pw / nx;
  const ch = ph / ny;
  const pos = (i, j) => [pad + i * cw, pad * 0.4 + (ny - 1 - j) * ch];
  for (const cell of grid.cells) {
    const [x, y] = pos(cell.i, cell.j);
    const rect = svgEl("rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", cw + 0.4);
    rect.setAttribute("height", ch + 0.4);
    rect.setAttribute("fill", COL[cell.region] || "#333");
    rect.setAttribute("fill-opacity", "0.88");
    const sources = (cell.governing && cell.governing.sources) || [];
    rect.setAttribute("data-i", String(cell.i));
    rect.setAttribute("data-j", String(cell.j));
    const title = svgEl("title");
    title.textContent = (cell.label || "no label") + (sources.length ? " · " + sources.join(", ") : "");
    rect.appendChild(title);
    svg.appendChild(rect);
  }
  if (grid.ours && grid.ours.on_plane) {
    const xi = nearest(xs, grid.ours.x);
    const yi = nearest(ys, grid.ours.y);
    const [x, y] = pos(xi, yi);
    const dot = svgEl("circle");
    dot.setAttribute("cx", x + cw / 2);
    dot.setAttribute("cy", y + ch / 2);
    dot.setAttribute("r", "4.5");
    dot.setAttribute("fill", "none");
    dot.setAttribute("stroke", "#f3efe4");
    dot.setAttribute("stroke-width", "1.6");
    svg.appendChild(dot);
  }
  frame.appendChild(svg);
  body.appendChild(frame);
  const legend = document.createElement("p");
  legend.className = "pg-legend-line quiet";
  legend.textContent = "ok, weak, open, contested, fail, blocked. Ring: our universe, when the other dials are at ours.";
  body.appendChild(legend);
  const read = document.createElement("p");
  read.className = "pg-map-read";
  read.textContent = readout || "Move across the map. Each cell carries the governing link's honesty label and sources.";
  body.appendChild(read);
  svg.addEventListener("pointermove", (event) => {
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 420;
    const py = ((event.clientY - rect.top) / rect.height) * 360;
    const i = Math.floor((px - pad) / cw);
    const j = ny - 1 - Math.floor((py - pad * 0.4) / ch);
    const cell = grid.cells.find((item) => item.i === i && item.j === j);
    if (!cell) return;
    const sources = (cell.governing && cell.governing.sources) || [];
    const link = cell.governing ? cell.governing.id : "";
    read.textContent = (cell.label || "no label") +
      (link ? " · " + link : "") +
      (sources.length ? " · " + sources.join(", ") : "") +
      " · " + cell.region;
  });
}

function nearest(values, target) {
  let best = 0;
  let err = Infinity;
  values.forEach((value, index) => {
    const d = Math.abs(value - target);
    if (d < err) { err = d; best = index; }
  });
  return best;
}

function paintLambda(body, line) {
  body.innerHTML = "";
  const frame = document.createElement("div");
  frame.className = "pg-frame";
  const svg = svgEl("svg");
  svg.setAttribute("viewBox", "0 0 420 180");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Cosmological constant. Colour is galaxies and life at that Lambda.");
  const pad = 28;
  const W = 420;
  const H = 180;
  const pw = W - pad * 2;
  const ph = H - pad * 1.8;
  const n = line.values.length;
  line.points.forEach((point, i) => {
    const rect = svgEl("rect");
    rect.setAttribute("x", pad + (i / n) * pw);
    rect.setAttribute("y", pad);
    rect.setAttribute("width", pw / n + 0.4);
    rect.setAttribute("height", ph);
    rect.setAttribute("fill", COL[point.region] || "#333");
    svg.appendChild(rect);
  });
  const fwd = (x) => {
    const s = Math.sign(x) || 1;
    const ax = Math.abs(x);
    return ax <= 1 ? x : s * (1 + Math.log10(ax));
  };
  const lo = fwd(-1000);
  const hi = fwd(1000);
  const xpix = (x) => pad + ((fwd(x) - lo) / (hi - lo)) * pw;
  (line.thresholds || []).forEach((tick) => {
    const mark = svgEl("line");
    mark.setAttribute("x1", xpix(tick.x));
    mark.setAttribute("x2", xpix(tick.x));
    mark.setAttribute("y1", pad - 4);
    mark.setAttribute("y2", pad + ph + 4);
    mark.setAttribute("stroke", "#f3efe4");
    mark.setAttribute("stroke-dasharray", "3 3");
    svg.appendChild(mark);
  });
  const ours = svgEl("circle");
  ours.setAttribute("cx", xpix(1));
  ours.setAttribute("cy", pad + ph / 2);
  ours.setAttribute("r", "4");
  ours.setAttribute("fill", "none");
  ours.setAttribute("stroke", "#f3efe4");
  svg.appendChild(ours);
  frame.appendChild(svg);
  body.appendChild(frame);
  const list = document.createElement("ul");
  list.className = "pg-region-list";
  (line.thresholds || []).forEach((tick) => {
    const li = document.createElement("li");
    li.innerHTML = '<span class="pill pill-' + String(tick.label || "").toLowerCase() + '">' +
      escapeHtml(tick.label || "") + "</span> <code>" + escapeHtml(tick.link || "") + "</code> · " +
      escapeHtml(tick.kind || "") + " = " + escapeHtml(tick.x) +
      (tick.sources && tick.sources.length ? " · " + escapeHtml(tick.sources.join(", ")) : "");
    list.appendChild(li);
  });
  body.appendChild(list);
}

function paintStrips(body, strips) {
  body.innerHTML = "";
  const featured = ["s03.orbits-atoms-gravity", "s05.hydrogen-table", "s07.stars", "s07g.galaxies"];
  const names = {
    "s03.orbits-atoms-gravity": "orbits",
    "s05.hydrogen-table": "table",
    "s07.stars": "stars",
    "s07g.galaxies": "galaxies",
  };
  (strips.strips || []).forEach((strip) => {
    const block = document.createElement("div");
    block.className = "pg-strip-block";
    const heading = document.createElement("p");
    heading.className = "pg-strip-name";
    heading.textContent = strip.symbol || strip.id;
    block.appendChild(heading);
    const svg = svgEl("svg");
    svg.setAttribute("viewBox", "0 0 420 120");
    const pad = 52;
    const rowH = 18;
    const n = strip.values.length;
    featured.forEach((stageId, k) => {
      for (let i = 0; i < n; i++) {
        const status = strip.points[i].stages[stageId];
        const rect = svgEl("rect");
        rect.setAttribute("x", pad + (i / n) * (420 - pad - 8));
        rect.setAttribute("y", 8 + k * (rowH + 6));
        rect.setAttribute("width", (420 - pad - 8) / n + 0.4);
        rect.setAttribute("height", rowH);
        rect.setAttribute("fill", COL[regionOfStatus(status)] || "#333");
        svg.appendChild(rect);
      }
      const text = svgEl("text");
      text.setAttribute("x", "4");
      text.setAttribute("y", 21 + k * (rowH + 6));
      text.setAttribute("fill", "#a8a494");
      text.setAttribute("font-size", "10");
      text.textContent = names[stageId];
      svg.appendChild(text);
    });
    block.appendChild(svg);
    body.appendChild(block);
  });
}

function paintDimensions(body, panel) {
  body.innerHTML = "";
  const note = document.createElement("p");
  note.className = "quiet";
  note.textContent = panel.note || "";
  body.appendChild(note);
  const list = document.createElement("ul");
  list.className = "pg-dim-list";
  (panel.rows || []).forEach((row) => {
    const li = document.createElement("li");
    const bits = [
      ["orbits", row.orbit_stability],
      ["atoms", row.hydrogen_ground_state],
      ["gravity", row.gravity_orbits],
      ["planets", row.planet_orbits],
    ];
    const parts = bits.map(([name, link]) => {
      if (!link) return "";
      const sources = (link.sources || []).join(", ");
      return name + " " + link.status + " (" + link.label + (sources ? "; " + sources : "") + ")";
    }).filter(Boolean);
    li.innerHTML = "<strong>n=" + escapeHtml(row.n) + "</strong> · stage " +
      escapeHtml(row.s03 && row.s03.status) + "<br><span class=\"quiet\">" + escapeHtml(parts.join(" · ")) + "</span>";
    list.appendChild(li);
  });
  body.appendChild(list);
}

function paintStages(body, stages) {
  body.innerHTML = "";
  const list = document.createElement("ol");
  list.className = "pg-stage-list";
  (stages || []).forEach((stage) => {
    const li = document.createElement("li");
    li.className = "pg-stage";
    li.dataset.state = regionOfStatus(stage.status);
    const honesty = (stage.honesty || []).map((label) =>
      '<span class="pill pill-' + String(label).toLowerCase() + '">' + escapeHtml(label) + "</span>"
    ).join(" ");
    const sources = (stage.sources || []).join(", ");
    li.innerHTML = '<p class="pg-stage-kicker">' + escapeHtml(stage.status) + "</p>" +
      "<h4>" + escapeHtml(stage.name) + "</h4>" +
      "<p>" + honesty + "</p>" +
      (sources ? '<p class="quiet">' + escapeHtml(sources) + "</p>" : "");
    list.appendChild(li);
  });
  body.appendChild(list);
}

function paintLook(canvas, look) {
  const ctx = canvas.getContext("2d");
  const pal = {
    bg: "#06070f",
    plus: "#ff7ab6",
    minus: "#62d2ff",
    neutral: "#c9b8ff",
    light: "#fff3b0",
    record: "#ffffff",
    bond: "rgba(180,170,255,0.35)",
  };
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!look) return;
  if (look.glyphs) {
    ctx.strokeStyle = pal.bond;
    ctx.lineWidth = 1;
    for (const bond of look.bonds || []) {
      const x = look.ox + (bond.x + 0.5) * look.cell;
      const y = look.oy + (bond.y + 0.5) * look.cell;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (bond.to === "e" ? look.cell : 0), y + (bond.to === "s" ? look.cell : 0));
      ctx.stroke();
    }
    for (const glyph of look.glyphs) {
      ctx.fillStyle = glyph.glyph === "tri" ? pal.plus
        : glyph.glyph === "sq" ? pal.minus
          : glyph.glyph === "dia" ? pal.record
            : glyph.glyph === "spark" ? pal.light
              : pal.neutral;
      ctx.beginPath();
      const k = glyph.glyph === "tri" ? 3 : 4;
      const rot = glyph.glyph === "sq" || glyph.glyph === "tile" ? Math.PI / 4 : glyph.rot;
      for (let i = 0; i < k; i++) {
        const a = rot + (i * 2 * Math.PI) / k;
        const px = glyph.cx + glyph.s * Math.cos(a);
        const py = glyph.cy + glyph.s * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  } else if (look.vortices || look.phase) {
    const { w, h, ox, oy, cell, phase } = look;
    if (phase) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const th = phase[y * w + x];
          const hue = ((th / (2 * Math.PI)) % 1 + 1) % 1 * 360;
          ctx.fillStyle = "hsl(" + hue + " 70% 30%)";
          ctx.fillRect(ox + x * cell, oy + y * cell, cell + 0.5, cell + 0.5);
        }
      }
    }
    for (const vortex of look.vortices || []) {
      ctx.strokeStyle = vortex.sign > 0 ? pal.plus : pal.minus;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let j = 0; j <= 24; j++) {
        const r = (vortex.r * j) / 24;
        const a = vortex.sign * j * 0.45;
        const px = vortex.x + r * Math.cos(a);
        const py = vortex.y + r * Math.sin(a);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  } else if (look.streaks) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = pal.plus;
    for (const streak of look.streaks) {
      ctx.beginPath();
      ctx.moveTo(streak.x - streak.dx * look.cell * 0.8, streak.y - streak.dy * look.cell * 0.8);
      ctx.lineTo(streak.x, streak.y);
      ctx.stroke();
    }
  } else if (look.scalar) {
    const { w, h, ox, oy, cell, scalar } = look;
    for (let i = 0; i < w * h; i++) {
      const v = scalar[i];
      if (v < 0.02) continue;
      ctx.fillStyle = "rgba(255,122,182," + Math.min(1, v) + ")";
      ctx.fillRect(ox + (i % w) * cell, oy + Math.floor(i / w) * cell, cell, cell);
    }
  }
}

function paintSeries(body, series, labels) {
  body.innerHTML = "";
  if (!series || !series.t || !series.t.length) {
    body.textContent = "This run did not return a series.";
    return;
  }
  const keys = Object.keys(series).filter((key) => key !== "t" && Array.isArray(series[key]) && series[key].some((v) => typeof v === "number" && Number.isFinite(v)));
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 220;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#10110d";
  ctx.fillRect(0, 0, 720, 220);
  const pad = { l: 48, r: 12, t: 16, b: 28 };
  let ymin = Infinity;
  let ymax = -Infinity;
  keys.forEach((key) => series[key].forEach((value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      ymin = Math.min(ymin, value);
      ymax = Math.max(ymax, value);
    }
  }));
  if (!Number.isFinite(ymin)) return;
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const t = series.t;
  const xOf = (i) => pad.l + (t.length < 2 ? 0.5 : i / (t.length - 1)) * (720 - pad.l - pad.r);
  const yOf = (v) => pad.t + (1 - (v - ymin) / (ymax - ymin)) * (220 - pad.t - pad.b);
  const colors = ["#e0b15a", "#6fbfa3", "#7eb4e0"];
  keys.forEach((key, k) => {
    ctx.beginPath();
    ctx.strokeStyle = colors[k % colors.length];
    ctx.lineWidth = 1.6;
    series[key].forEach((value, i) => {
      if (typeof value !== "number") return;
      const x = xOf(i);
      const y = yOf(value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  const legend = document.createElement("ul");
  legend.className = "pg-legend";
  legend.innerHTML = keys.map((key, i) =>
    '<li><span class="pg-swatch" style="background:' + colors[i % colors.length] + '"></span>' +
    escapeHtml((labels && labels[key]) || key) + "</li>"
  ).join("");
  body.appendChild(legend);
}

function renderEngine(root, api) {
  root.innerHTML = "";
  const result = api.result || {};
  if (result.atlas) renderAtlas(root, api);
  if (result.starter) renderStarter(root, api);
  if (result.note) {
    const note = document.createElement("p");
    note.className = "pg-note";
    note.textContent = result.note;
    root.appendChild(note);
  }
}

function renderAtlas(root, api) {
  const atlas = api.result.atlas;
  const axes = section("Possible universes", "Pick any two dials. Colour is the worst of orbits, the periodic table, stars, and galaxies. The label is the governing link.");
  const controls = document.createElement("div");
  controls.className = "pg-axes";
  const dials = api.dials || [];
  controls.appendChild(axisSelect("Horizontal", "pg-axis-x", dials, api.axisX, api.onAxisX));
  controls.appendChild(axisSelect("Vertical", "pg-axis-y", dials, api.axisY, api.onAxisY));
  const full = document.createElement("button");
  full.type = "button";
  full.className = "pg-text-button";
  full.textContent = "41×41";
  full.title = "The locked sampling is 41 by 41. The page draws a coarser grid while the dials move.";
  full.addEventListener("click", () => { if (api.onFullMap) api.onFullMap(); });
  controls.appendChild(full);
  axes.appendChild(controls);
  const mapBody = document.createElement("div");
  mapBody.className = "pg-view-body";
  mapBody.dataset.view = "map";
  axes.appendChild(mapBody);
  paintMap(mapBody, atlas.map);
  root.appendChild(axes);

  const stages = section("Stages at these dials", "Status from the locked rules. The pills are the link labels. The line under each name is the source ids.");
  const stageBody = document.createElement("div");
  stages.appendChild(stageBody);
  paintStages(stageBody, atlas.stages);
  root.appendChild(stages);

  const lambda = section("Cosmological constant", "Symmetric-log line. Ticks are the recorded thresholds, with their honesty labels and sources.");
  const lambdaBody = document.createElement("div");
  lambda.appendChild(lambdaBody);
  paintLambda(lambdaBody, atlas.lambda);
  root.appendChild(lambda);

  const strips = section("A strip for each dial", "Other dials are held at the current settings. Each row is a featured stage.");
  const stripBody = document.createElement("div");
  strips.appendChild(stripBody);
  paintStrips(stripBody, atlas.strips);
  root.appendChild(strips);

  const dims = section("Dimensions", "Stable orbits and traditional atoms only at n = 3, from the existing links.");
  const dimBody = document.createElement("div");
  dims.appendChild(dimBody);
  paintDimensions(dimBody, atlas.dimensions);
  root.appendChild(dims);
}

function axisSelect(caption, id, dials, value, onChange) {
  const label = document.createElement("label");
  label.className = "pg-axis";
  label.appendChild(document.createTextNode(caption + " "));
  const select = document.createElement("select");
  select.id = id;
  dials.forEach((dial) => {
    const option = document.createElement("option");
    option.value = dial.id;
    option.textContent = dial.label;
    if (dial.id === value) option.selected = true;
    select.appendChild(option);
  });
  select.addEventListener("change", () => onChange(select.value));
  label.appendChild(select);
  return label;
}

function renderStarter(root, api) {
  const starter = api.result.starter;
  const look = document.createElement("div");
  look.className = "lattice-play";
  const kicker = document.createElement("p");
  kicker.className = "live-kicker";
  kicker.textContent = "Live · not a promotion";
  look.appendChild(kicker);
  const frame = document.createElement("div");
  frame.className = "pg-frame lattice-frame";
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Universe Starter lattice, recorded frames");
  frame.appendChild(canvas);
  look.appendChild(frame);
  const transport = document.createElement("p");
  transport.className = "quiet pg-frame-caption";
  transport.dataset.role = "frame-caption";
  look.appendChild(transport);
  root.appendChild(look);
  paintEngineFrame(root, api);

  const extra = document.createElement("details");
  extra.className = "pg-details";
  const summary = document.createElement("summary");
  summary.textContent = "Frame legend, curves, and checks";
  extra.appendChild(summary);
  const legend = document.createElement("ul");
  legend.className = "pg-region-list";
  (starter.legend || []).forEach((row) => {
    const li = document.createElement("li");
    li.textContent = Array.isArray(row) ? row.join(" — ") : String(row);
    legend.appendChild(li);
  });
  extra.appendChild(legend);
  const curves = document.createElement("div");
  extra.appendChild(curves);
  paintSeries(curves, api.result.series, api.result.seriesLabels);
  if (starter.checks && starter.checks.length) {
    const ul = document.createElement("ul");
    ul.className = "pg-region-list";
    starter.checks.forEach((check) => {
      const li = document.createElement("li");
      li.textContent = check.name + ": " + check.detail;
      ul.appendChild(li);
    });
    extra.appendChild(ul);
  }
  const note = document.createElement("p");
  note.className = "quiet";
  note.textContent = "Stars, halos, and twinkle in the Look legend are decoration. The checks come back with the verdict. They do not change the card label.";
  extra.appendChild(note);
  root.appendChild(extra);
}

function paintEngineFrame(root, api) {
  const starter = api.result && api.result.starter;
  if (!starter) return;
  const canvas = root.querySelector("canvas");
  const caption = root.querySelector("[data-role=frame-caption]");
  const frames = starter.frames || [];
  if (!canvas || !frames.length) {
    if (caption) caption.textContent = "This run returned no frames.";
    return;
  }
  const index = Math.min(frames.length - 1, Math.max(0, api.frame || 0));
  paintLook(canvas, frames[index]);
  if (caption) {
    caption.textContent = "Recorded frame " + (index + 1) + " of " + frames.length +
      ". Engine verdict " + (starter.verdict || "—") + ". The card label is separate.";
  }
}

export { renderEngine, paintEngineFrame, paintMap, paintLambda, paintDimensions };
