/* Atlas presentation. Status colours and copy only. The engine stays in site/engine/. */
import { formatNumber } from "./views.js";

const STATUS_CHAR = { PASS: "P", WEAK: "W", OPEN: "O", CONTESTED: "C", FAIL: "F", BLOCKED: "B" };
const CHAR_STATUS = { P: "PASS", W: "WEAK", O: "OPEN", C: "CONTESTED", F: "FAIL", B: "BLOCKED" };
const RANK = { PASS: 0, OPEN: 1, WEAK: 2, CONTESTED: 3, FAIL: 4, BLOCKED: 5 };
const REGION_OF = { PASS: "ok", WEAK: "weak", OPEN: "open", CONTESTED: "contested", FAIL: "fail", BLOCKED: "blocked" };
const REGION_COLOR = {
  ok: "#3dcf8e",
  weak: "#c9b44a",
  open: "#7eb4e0",
  contested: "#e0a14a",
  fail: "#e25c6a",
  blocked: "#8b9084",
};

const LEGEND_KEY = "toeatlas.legend.dismissed.v1";

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

function worstStatus(statuses) {
  let worst = "PASS";
  let rank = -1;
  (statuses || []).forEach((status) => {
    if (!status) return;
    const next = RANK[status] ?? -1;
    if (next > rank) { rank = next; worst = status; }
  });
  return worst;
}

function nearest(values, target) {
  let best = 0;
  let err = Infinity;
  values.forEach((value, index) => {
    const d = Math.abs(Number(value) - Number(target));
    if (d < err) { err = d; best = index; }
  });
  return best;
}

function readPreview() {
  const node = document.getElementById("preview");
  if (!node || !node.textContent) return null;
  try {
    const data = JSON.parse(node.textContent);
    if (!data || !data.maps || !data.stages) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function cellStatus(cell, stageId, featured) {
  if (stageId && cell.stageStatus && cell.stageStatus[stageId]) return cell.stageStatus[stageId];
  const ids = featured && featured.length ? featured : Object.keys(cell.stageStatus || {});
  return worstStatus(ids.map((id) => cell.stageStatus && cell.stageStatus[id]));
}

function gridFromPreview(preview, xId, yId, stageId) {
  if (!preview || !preview.maps) return null;
  let stored = null;
  let swap = false;
  for (const map of preview.maps) {
    if (map.x.id === xId && map.y.id === yId) { stored = map; break; }
    if (map.x.id === yId && map.y.id === xId) { stored = map; swap = true; }
  }
  if (!stored) return null;
  const nx = stored.x.values.length;
  const ny = stored.y.values.length;
  const stageIds = stored.stageIds;
  const stride = stageIds.length;
  const cells = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const stageStatus = {};
      stageIds.forEach((id, s) => {
        stageStatus[id] = CHAR_STATUS[stored.codes[k * stride + s]] || null;
      });
      const displayI = swap ? j : i;
      const displayJ = swap ? i : j;
      const x = swap ? stored.y.values[j] : stored.x.values[i];
      const y = swap ? stored.x.values[i] : stored.y.values[j];
      const status = cellStatus({ stageStatus }, stageId, preview.featured);
      cells.push({
        i: displayI,
        j: displayJ,
        x,
        y,
        stageStatus,
        status,
        region: REGION_OF[status] || "blocked",
      });
    }
  }
  const xMeta = swap ? stored.y : stored.x;
  const yMeta = swap ? stored.x : stored.y;
  const ours = stored.ours || {};
  return {
    x: xMeta,
    y: yMeta,
    ours: swap ? { x: ours.y, y: ours.x, on_plane: ours.on_plane } : ours,
    cells,
    sample: xMeta.values.length + "×" + yMeta.values.length,
    lockedSample: true,
  };
}

function packEngineStrip(strip) {
  const stageIds = strip.points && strip.points[0] ? Object.keys(strip.points[0].stages) : [];
  let codes = "";
  (strip.points || []).forEach((point) => {
    stageIds.forEach((id) => {
      codes += STATUS_CHAR[point.stages[id]] || "?";
    });
  });
  const switches = [];
  stageIds.forEach((stageId) => {
    if (stageId === "s00.rules") return;
    ((strip.switches && strip.switches[stageId]) || []).forEach((sw) => {
      switches.push({
        stage: stageId,
        from: sw.from,
        to: sw.to,
        was: sw.was,
        now: sw.now,
        links: [],
      });
    });
  });
  return {
    id: strip.id,
    symbol: strip.symbol || "",
    scale: strip.scale,
    values: strip.values,
    ours: strip.ours,
    stageIds,
    codes,
    switches,
  };
}

function paintSpine(root, stages, opts) {
  if (!root) return;
  const selected = opts && opts.selectedId;
  const onSelect = (opts && opts.onSelect) || function () {};
  root.innerHTML = "";
  const heading = document.createElement("p");
  heading.className = "spine-heading";
  heading.textContent = (opts && opts.heading) || "Stages";
  root.appendChild(heading);
  const list = document.createElement("ol");
  list.className = "spine-list";
  (stages || []).forEach((stage) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "spine-node";
    button.dataset.status = stage.status || "";
    button.setAttribute("aria-pressed", selected === stage.id ? "true" : "false");
    button.innerHTML =
      '<span class="spine-status">' + escapeHtml(stage.status || "—") + "</span>" +
      '<span class="spine-name">' + escapeHtml(stage.name || stage.id) + "</span>";
    button.addEventListener("click", function () { onSelect(stage.id); });
    li.appendChild(button);
    list.appendChild(li);
  });
  root.appendChild(list);
}

function paintAxes(root, dials, xId, yId, onX, onY) {
  if (!root) return;
  root.innerHTML = "";
  root.appendChild(axisSelect("Horizontal", "pg-axis-x", dials, xId, onX));
  root.appendChild(axisSelect("Vertical", "pg-axis-y", dials, yId, onY));
}

function axisSelect(caption, id, dials, value, onChange) {
  const label = document.createElement("label");
  label.className = "pg-axis";
  const span = document.createElement("span");
  span.textContent = caption;
  label.appendChild(span);
  const select = document.createElement("select");
  select.id = id;
  (dials || []).forEach((dial) => {
    const option = document.createElement("option");
    option.value = dial.id;
    option.textContent = dial.symbol ? dial.symbol + "  " + dial.label : dial.label;
    if (dial.id === value) option.selected = true;
    select.appendChild(option);
  });
  select.addEventListener("change", function () { onChange(select.value); });
  label.appendChild(select);
  return label;
}

function paintMap(host, grid, opts) {
  if (!host) return;
  host.innerHTML = "";
  const readout = opts && opts.readout;
  const onPick = (opts && opts.onPick) || function () {};
  const onHover = (opts && opts.onHover) || function () {};
  if (!grid || !grid.cells || !grid.cells.length) {
    if (readout) readout.textContent = "The map appears when the locked sample or a live sample is ready.";
    return;
  }
  const frame = document.createElement("div");
  frame.className = "map-frame";
  const svg = svgEl("svg");
  svg.setAttribute("viewBox", "0 0 640 560");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Possible universes. Colour is stage status under the locked rules. The ring marks our universe when the other dials are at ours.");
  svg.classList.add("map-svg");
  const padL = 54;
  const padB = 42;
  const padT = 18;
  const padR = 16;
  const W = 640;
  const H = 560;
  const pw = W - padL - padR;
  const ph = H - padT - padB;
  const xs = grid.x.values;
  const ys = grid.y.values;
  const nx = xs.length;
  const ny = ys.length;
  const cw = pw / nx;
  const ch = ph / ny;
  const pos = (i, j) => [padL + i * cw, padT + (ny - 1 - j) * ch];
  const byKey = new Map();
  grid.cells.forEach((cell) => { byKey.set(cell.i + "," + cell.j, cell); });
  grid.cells.forEach((cell) => {
    const [x, y] = pos(cell.i, cell.j);
    const rect = svgEl("rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", cw + 0.35);
    rect.setAttribute("height", ch + 0.35);
    rect.setAttribute("fill", REGION_COLOR[cell.region] || "#333");
    svg.appendChild(rect);
  });
  if (grid.ours && grid.ours.on_plane) {
    const xi = nearest(xs, grid.ours.x);
    const yi = nearest(ys, grid.ours.y);
    const [x, y] = pos(xi, yi);
    const cx = x + cw / 2;
    const cy = y + ch / 2;
    const ring = svgEl("circle");
    ring.setAttribute("cx", cx);
    ring.setAttribute("cy", cy);
    ring.setAttribute("r", String(Math.max(7, Math.min(cw, ch) * 0.72)));
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#e0b15a");
    ring.setAttribute("stroke-width", "2.6");
    svg.appendChild(ring);
    const halo = svgEl("circle");
    halo.setAttribute("cx", cx);
    halo.setAttribute("cy", cy);
    halo.setAttribute("r", String(Math.max(11, Math.min(cw, ch) * 1.15)));
    halo.setAttribute("fill", "none");
    halo.setAttribute("stroke", "#f3efe4");
    halo.setAttribute("stroke-width", "1.2");
    svg.appendChild(halo);
    const label = svgEl("text");
    const labelX = cx + 52 > padL + pw ? cx - 40 : cx + 14;
    label.setAttribute("x", labelX);
    label.setAttribute("y", cy - 12);
    label.setAttribute("fill", "#e0b15a");
    label.setAttribute("font-size", "13");
    label.setAttribute("font-family", "IBM Plex Mono, ui-monospace, monospace");
    label.textContent = "ours";
    svg.appendChild(label);
  }
  const axis = svgEl("text");
  axis.setAttribute("x", padL);
  axis.setAttribute("y", H - 12);
  axis.setAttribute("fill", "#a8a494");
  axis.setAttribute("font-size", "12");
  axis.setAttribute("font-family", "IBM Plex Mono, ui-monospace, monospace");
  axis.textContent = (grid.x.symbol || grid.x.id) + "  " + formatNumber(xs[0]) + " … " + formatNumber(xs[xs.length - 1]);
  svg.appendChild(axis);
  const yAxis = svgEl("text");
  yAxis.setAttribute("x", 8);
  yAxis.setAttribute("y", padT + 12);
  yAxis.setAttribute("fill", "#a8a494");
  yAxis.setAttribute("font-size", "12");
  yAxis.setAttribute("font-family", "IBM Plex Mono, ui-monospace, monospace");
  yAxis.textContent = grid.y.symbol || grid.y.id;
  svg.appendChild(yAxis);
  frame.appendChild(svg);
  host.appendChild(frame);

  function cellAt(event) {
    const bounds = svg.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    const px = ((event.clientX - bounds.left) / bounds.width) * W;
    const py = ((event.clientY - bounds.top) / bounds.height) * H;
    const i = Math.floor((px - padL) / cw);
    const j = ny - 1 - Math.floor((py - padT) / ch);
    return byKey.get(i + "," + j) || null;
  }

  const standing = (grid.lockedSample ? "Locked sample " : "Live sample ") + grid.sample +
    ". The ring is our universe when the other dials are at ours. Colour is stage status under the locked rules, not a prediction.";
  if (readout) readout.textContent = standing;

  svg.addEventListener("pointermove", function (event) {
    const cell = cellAt(event);
    if (!cell) return;
    onHover(cell);
    if (readout) {
      readout.textContent = (grid.x.symbol || grid.x.id) + " " + formatNumber(cell.x) +
        " · " + (grid.y.symbol || grid.y.id) + " " + formatNumber(cell.y) +
        " · " + (cell.status || cell.region);
    }
  });
  svg.addEventListener("pointerleave", function () {
    if (readout) readout.textContent = standing;
  });
  svg.addEventListener("click", function (event) {
    const cell = cellAt(event);
    if (cell) onPick(cell);
  });
}

function focusIds(strip, stageId) {
  if (stageId && strip.stageIds.includes(stageId)) return [stageId];
  return strip.stageIds.filter((id) => id !== "s00.rules");
}

function barTitle(strip, stageId, stages) {
  const caveat = strip.caveat ||
    "Holds only while the other dials stay at the values on this board, under the locked atlas rules. A change of status is not a range that unconditionally breaks a stage.";
  const focus = focusIds(strip, stageId);
  const switches = (strip.switches || []).filter((sw) => focus.includes(sw.stage));
  const bits = [caveat];
  switches.slice(0, 3).forEach((sw) => {
    const name = stageName(stages, sw.stage);
    const labels = (sw.links || []).map((link) => link.id + " (" + link.label + ")").join(", ");
    bits.push(name + " " + sw.was + " → " + sw.now + (labels ? " · " + labels : "") + ".");
  });
  if (!switches.length) bits.push("In this sample, with the other dials held, no later stage changes status.");
  bits.push("Open the bar for the link label and the assumptions stored on it.");
  let text = bits.join(" ");
  if (text.length > 420) text = text.slice(0, 417) + "…";
  return text;
}

function paintStripBar(host, strip, stageId, stages, onOpen) {
  if (!host) return;
  host.innerHTML = "";
  if (!strip || !strip.values || !strip.values.length) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sens-bar";
  const n = strip.values.length;
  const stride = strip.stageIds.length;
  const focus = focusIds(strip, stageId);
  for (let i = 0; i < n; i++) {
    const statuses = focus.map((id) => {
      const s = strip.stageIds.indexOf(id);
      return CHAR_STATUS[strip.codes[i * stride + s]];
    });
    const seg = document.createElement("span");
    seg.className = "sens-seg";
    seg.style.background = REGION_COLOR[REGION_OF[worstStatus(statuses)]] || "#333";
    button.appendChild(seg);
  }
  const tick = document.createElement("span");
  tick.className = "sens-ours";
  tick.style.left = ((nearest(strip.values, strip.ours) + 0.5) / n * 100) + "%";
  tick.title = "ours";
  button.appendChild(tick);
  const title = barTitle(strip, stageId, stages);
  button.title = title;
  button.setAttribute("aria-label", title);
  button.addEventListener("click", function () { onOpen(strip); });
  host.appendChild(button);
}

function stageName(stages, id) {
  const found = (stages || []).find((stage) => stage.id === id);
  return found ? found.name : id;
}

function assumptionsFor(index, id) {
  if (!index || !index.links) return null;
  const link = index.links.find((item) => item.id === id);
  if (!link) return null;
  return link.assumptions || [];
}

function linkBlock(link, index) {
  const label = link.label || "—";
  const slug = String(label).toLowerCase();
  const assumptions = assumptionsFor(index, link.id);
  let assume = "";
  if (assumptions === null) {
    assume = "<p class=\"quiet\">Assumptions are stored on the link. The index is not on this page yet.</p>";
  } else if (!assumptions.length) {
    assume = "<p class=\"quiet\">This link records no assumptions.</p>";
  } else {
    assume = "<p class=\"quiet\">Assumptions stored on this link:</p><ul class=\"assume\">" +
      assumptions.map((line) => "<li>" + escapeHtml(line) + "</li>").join("") + "</ul>";
  }
  const sources = (link.sources || []).length
    ? "<p class=\"mono quiet\">" + escapeHtml(link.sources.join(", ")) + "</p>"
    : "";
  const status = link.was
    ? "<p class=\"mono\">" + escapeHtml(link.was) + " → " + escapeHtml(link.now || "") + "</p>"
    : (link.status ? "<p class=\"mono\">" + escapeHtml(link.status) + "</p>" : "");
  const reason = link.reason
    ? "<details class=\"link-fold\"><summary>Rule note</summary><p class=\"quiet\">" + escapeHtml(link.reason) + "</p></details>"
    : "";
  return "<div class=\"link-block\"><p><span class=\"pill pill-" + slug + "\">" +
    escapeHtml(label) + "</span> <code>" + escapeHtml(link.id) + "</code></p>" +
    status + assume + sources + reason + "</div>";
}

function openDrawer(title, html) {
  const dialog = document.getElementById("drawer");
  if (!dialog) return;
  const heading = dialog.querySelector("[data-drawer-title]");
  const body = dialog.querySelector("[data-drawer-body]");
  if (heading) heading.textContent = title || "";
  if (body) body.innerHTML = html || "";
  if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  else dialog.setAttribute("open", "");
}

function initDrawer() {
  const dialog = document.getElementById("drawer");
  if (!dialog || dialog.dataset.bound) return;
  dialog.dataset.bound = "1";
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
  const close = dialog.querySelector("[data-drawer-close]");
  if (close) close.addEventListener("click", function () { dialog.close(); });
}

function openStageDrawer(stage, index) {
  const parts = [
    "<p class=\"mono\" data-status=\"" + escapeHtml(stage.status || "") + "\">" + escapeHtml(stage.status || "—") + "</p>",
    "<p class=\"quiet\">Status from the locked rules at the dials on the board. The pills are the honesty labels stored on the links. A status is not a label. Opening this does not promote a link.</p>",
  ];
  (stage.links || []).forEach((link) => { parts.push(linkBlock(link, index)); });
  if (!stage.links || !stage.links.length) {
    parts.push("<p class=\"quiet\">This stage has no incoming link in the engine result.</p>");
  }
  openDrawer(stage.name || stage.id, parts.join(""));
}

function openCellDrawer(cell, ev, stageId, featured, index, axes) {
  const xLabel = (axes && axes.xLabel) || "x";
  const yLabel = (axes && axes.yLabel) || "y";
  const parts = [
    "<p class=\"mono\">" + escapeHtml(xLabel) + " " + escapeHtml(formatNumber(cell.x)) +
      " · " + escapeHtml(yLabel) + " " + escapeHtml(formatNumber(cell.y)) + "</p>",
    "<p class=\"quiet\">These two dials are the cell. The other dials stay at the values on the board. Status is the engine's, under those settings and the locked rules. It is not a prediction, and it does not promote a link.</p>",
  ];
  const ids = stageId ? [stageId] : (featured || []);
  const stages = (ev && ev.stages || []).filter((stage) => !ids.length || ids.indexOf(stage.id) >= 0);
  stages.forEach((stage) => {
    parts.push("<h3 class=\"drawer-h\">" + escapeHtml(stage.name) + " <span class=\"mono\">" + escapeHtml(stage.status) + "</span></h3>");
    (stage.links || []).forEach((link) => { parts.push(linkBlock(link, index)); });
  });
  openDrawer("This cell", parts.join(""));
}

function openDialDrawer(label, strip, index, stageId, stages) {
  const focus = focusIds(strip, stageId);
  const switches = (strip.switches || []).filter((sw) => focus.includes(sw.stage));
  const caveat = strip.caveat || ((strip.switches && strip.switches.length) || strip.stageIds
    ? "Holds only while the other dials stay at the values on this board, under the locked atlas rules. A change of status is not a range that unconditionally breaks a stage. The link keeps the honesty label and the assumptions stored on that link."
    : "");
  const parts = [
    strip.help ? "<p class=\"quiet\">" + escapeHtml(strip.help) + "</p>" : "",
  ];
  if (caveat) {
    parts.push("<p>" + escapeHtml(caveat) + "</p>");
    parts.push("<p class=\"quiet\">The bar samples this dial with the other dials held. A mark is where a later stage's reported status changes between neighbouring samples. It is not a range that unconditionally breaks a stage.</p>");
  }
  if (!switches.length) {
    parts.push("<p>In this sample, no later stage changes status.</p>");
  }
  switches.forEach((sw) => {
    parts.push("<h3 class=\"drawer-h\">" + escapeHtml(stageName(stages, sw.stage)) + "</h3>");
    parts.push("<p class=\"mono\">" + escapeHtml(sw.was || "—") + " → " + escapeHtml(sw.now || "—") +
      " · " + escapeHtml(formatNumber(sw.from)) + " … " + escapeHtml(formatNumber(sw.to)) + "</p>");
    if (sw.via === "upstream") {
      parts.push("<p class=\"quiet\">No link into this stage changed status between these samples. The stage can still change when a required earlier stage is FAIL or BLOCKED. The earlier links that changed are below, each with the label and assumptions stored on it.</p>");
    } else if (sw.links && sw.links.length) {
      parts.push("<p class=\"quiet\">Under these dials, these links changed status. Each keeps the label and assumptions stored on it.</p>");
    }
    (sw.links || []).forEach((link) => { parts.push(linkBlock(link, index)); });
    if (sw.via === "upstream" && sw.stageLinks && sw.stageLinks.length) {
      parts.push("<p class=\"quiet\">Links into this stage at the right-hand sample. Their stored labels did not have to change for the stage status to move.</p>");
      sw.stageLinks.forEach((link) => { parts.push(linkBlock(link, index)); });
    } else if (!sw.links || !sw.links.length) {
      parts.push("<p class=\"quiet\">Links recorded into this stage:</p>");
      (sw.stageLinks || []).forEach((link) => { parts.push(linkBlock(link, index)); });
    }
  });
  openDrawer(label || "This dial", parts.join(""));
}

function paintLinked(root, index, stageId, stageNameText, onOpen) {
  if (!root) return;
  root.innerHTML = "";
  if (!stageId) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const heading = document.createElement("h2");
  heading.className = "linked-heading";
  heading.textContent = "Linked records";
  root.appendChild(heading);
  const note = document.createElement("p");
  note.className = "quiet";
  note.textContent = (stageNameText || "This stage") + ". These are the atlas links that name the stage. Their labels are the stored records.";
  root.appendChild(note);
  const list = document.createElement("div");
  list.className = "linked-list";
  const links = ((index && index.links) || []).filter((link) => link.from === stageId || link.to === stageId);
  if (!index) {
    const wait = document.createElement("p");
    wait.className = "quiet";
    wait.textContent = "The link list loads with the index.";
    root.appendChild(wait);
    return;
  }
  if (!links.length) {
    const empty = document.createElement("p");
    empty.className = "quiet";
    empty.textContent = "No atlas link names this stage.";
    root.appendChild(empty);
    return;
  }
  links.forEach((link) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "linked-chip";
    const slug = String(link.label || "").toLowerCase();
    button.innerHTML = '<span class="pill pill-' + slug + '">' + escapeHtml(link.label || "—") +
      '</span> <code>' + escapeHtml(link.id) + "</code>";
    button.addEventListener("click", function () { onOpen(link); });
    list.appendChild(button);
  });
  root.appendChild(list);
}

function openLinkDrawer(link, index) {
  const parts = [
    "<p><span class=\"pill pill-" + String(link.label || "").toLowerCase() + "\">" + escapeHtml(link.label || "—") +
      "</span></p>",
    "<p class=\"quiet\">Label stored on the link. The map does not change it.</p>",
    "<p class=\"mono\">" + escapeHtml(link.from_name || link.from || "") + " → " + escapeHtml(link.to_name || link.to || "") + "</p>",
    linkBlock(link, index),
    '<p><a href="registry.html#link/' + encodeURIComponent(link.id) + '">Open the full record</a></p>',
  ];
  openDrawer(link.id, parts.join(""));
}

function initLegend() {
  const el = document.getElementById("first-legend");
  const skip = document.getElementById("legend-skip");
  if (!el || !skip || el.dataset.bound) return;
  el.dataset.bound = "1";
  let seen = false;
  try { seen = window.localStorage.getItem(LEGEND_KEY) === "1"; } catch (err) { seen = false; }
  if (!seen) el.hidden = false;
  skip.addEventListener("click", function () {
    el.hidden = true;
    try { window.localStorage.setItem(LEGEND_KEY, "1"); } catch (err) { /* session only */ }
    const map = document.getElementById("universe-map");
    if (map) map.focus();
  });
}

function stripById(strips, paramName) {
  const id = paramName === "cosmological-constant" ? "cosmological_constant" : paramName;
  return (strips || []).find((strip) => strip.id === id) || null;
}

export {
  readPreview,
  gridFromPreview,
  packEngineStrip,
  paintSpine,
  paintAxes,
  paintMap,
  paintStripBar,
  paintLinked,
  openStageDrawer,
  openCellDrawer,
  openDialDrawer,
  openLinkDrawer,
  openDrawer,
  initDrawer,
  initLegend,
  stripById,
  escapeHtml,
};
