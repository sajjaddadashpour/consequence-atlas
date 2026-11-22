// 3D view of locked atlas links. Read-only: filters never change a stored label.
// Libraries are pinned: three@0.187.0 and 3d-force-graph@1.80.2.

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js";

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js";
const GRAPH_LIB_URL = "https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.2/dist/3d-force-graph.min.js";
const GRAPH_DATA_URL = "data/graph.json";
const GAP_LABEL = "no link recorded";
const NOTE = "This is a view of locked atlas links. Sparse regions show missing or weak connections. Live runs do not add or promote links.";
const LABEL_ORDER = [
  "DERIVED",
  "DERIVED-UNDER-ASSUMPTION",
  "IMPORTED",
  "ASSUMED",
  "CONJECTURE",
  "CONTESTED",
  "FAILED",
];
const SOLID_LABELS = new Set(["DERIVED", "DERIVED-UNDER-ASSUMPTION", "IMPORTED"]);

window.THREE = THREE;

const state = {
  graphDoc: null,
  graph: null,
  labels: new Set(),
  types: new Set(["stage", "dial"]),
  stage: "",
  dial: "",
  gaps: false,
  axis: true,
  pinned: null,
  hover: null,
  axisForce: null,
};

function cssColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function palette() {
  return {
    CONJECTURE: cssColor("--conjecture", "#e0b15a"),
    ASSUMED: cssColor("--assumed", "#e0b15a"),
    DERIVED: cssColor("--derived", "#8fd18b"),
    "DERIVED-UNDER-ASSUMPTION": cssColor("--derived-under-assumption", "#c4c878"),
    IMPORTED: cssColor("--imported", "#7eb4e0"),
    CONTESTED: cssColor("--contested", "#e08ab8"),
    FAILED: cssColor("--failed", "#e07a72"),
    "DEAD-END": cssColor("--dead-end", "#c4937a"),
    gap: cssColor("--faint", "#737065"),
    stage: "#f0e6cc",
    dial: "#b39ee0",
  };
}

function esc(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escList(items) {
  if (!items || !items.length) return "—";
  return items.map((item) => esc(item)).join("<br>");
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

function makeSprite(text, options = {}) {
  const size = options.size || 42;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `600 ${size}px "Source Sans 3", sans-serif`;
  const width = Math.ceil(ctx.measureText(text).width) + 24;
  canvas.width = width;
  canvas.height = size + 20;
  const draw = canvas.getContext("2d");
  draw.font = `600 ${size}px "Source Sans 3", sans-serif`;
  draw.fillStyle = "rgba(12, 13, 10, 0.72)";
  draw.fillRect(0, 0, canvas.width, canvas.height);
  draw.fillStyle = options.color || "#f3efe4";
  draw.textBaseline = "middle";
  draw.fillText(text, 12, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: options.opacity ?? 1,
  });
  const sprite = new THREE.Sprite(material);
  const scale = options.scale || 18;
  sprite.scale.set((scale * canvas.width) / canvas.height, scale, 1);
  sprite.position.y = options.offsetY ?? 12;
  return sprite;
}

function shortName(node) {
  let name = node.name || node.id;
  name = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  return name.length > 26 ? `${name.slice(0, 24)}…` : name;
}

function linkColor(link) {
  const colors = palette();
  if (link.kind === "gap") return colors.gap;
  return colors[link.label] || "#a8a494";
}

function isDashed(link) {
  return link.kind === "gap" || link.style === "dashed" || !SOLID_LABELS.has(link.label);
}

function mentionsDial(link, dialId) {
  if (!dialId) return false;
  const condition = String(link.condition || "");
  if (condition.split(/[^a-z0-9._-]+/i).includes(dialId)) return true;
  const windowDial = link.window && link.window.dial;
  return windowDial === dialId;
}

function visibleSet() {
  const doc = state.graphDoc;
  const links = [];
  for (const edge of doc.edges) {
    if (!state.labels.has(edge.label)) continue;
    links.push(edge);
  }
  if (state.gaps) {
    for (const gap of doc.gaps) links.push({ ...gap, id: `gap:${gap.source}:${gap.target}` });
  }
  const wanted = new Set();
  if (state.stage) wanted.add(state.stage);
  if (state.dial) wanted.add(state.dial);
  if (state.stage || state.dial) {
    const keep = [];
    for (const link of links) {
      const stageHit = !state.stage || link.source === state.stage || link.target === state.stage;
      const dialHit = !state.dial || mentionsDial(link, state.dial);
      if (stageHit && dialHit) {
        keep.push(link);
        wanted.add(link.source);
        wanted.add(link.target);
      }
    }
    if (state.dial) wanted.add(state.dial);
    return { links: keep, wanted };
  }
  return { links, wanted: null };
}

function nodeVisible(node) {
  if (!state.types.has(node.type)) return false;
  const { wanted } = visibleSet();
  if (wanted && !wanted.has(node.id)) return false;
  return true;
}

function linkVisible(link) {
  const { links } = visibleSet();
  return links.some((item) => item.id === link.id);
}

function dimmed(nodeOrLink, kind) {
  const focus = state.hover || state.pinned;
  if (!focus) return false;
  if (kind === "node") {
    if (focus.nodes && focus.nodes.has(nodeOrLink.id)) return false;
    if (focus.id === nodeOrLink.id) return false;
    return true;
  }
  if (focus.links && focus.links.has(nodeOrLink.id)) return false;
  if (focus.id === nodeOrLink.id) return false;
  return true;
}

function neighborhood(item) {
  if (!item) return null;
  const nodes = new Set();
  const links = new Set();
  if (item.id && (item.type === "stage" || item.type === "dial")) {
    nodes.add(item.id);
    for (const link of state.graph.graphData().links) {
      if (!linkVisible(link)) continue;
      if (link.source.id === item.id || link.source === item.id || link.target.id === item.id || link.target === item.id) {
        links.add(link.id);
        nodes.add(typeof link.source === "object" ? link.source.id : link.source);
        nodes.add(typeof link.target === "object" ? link.target.id : link.target);
      }
    }
    return { id: item.id, nodes, links };
  }
  nodes.add(typeof item.source === "object" ? item.source.id : item.source);
  nodes.add(typeof item.target === "object" ? item.target.id : item.target);
  links.add(item.id);
  return { id: item.id, nodes, links };
}

function statusText() {
  const { links } = visibleSet();
  const real = links.filter((item) => item.kind !== "gap").length;
  const gaps = links.filter((item) => item.kind === "gap").length;
  const hidden = state.graphDoc.edges.length - real;
  const parts = [
    `${state.graphDoc.counts.nodes} stored nodes`,
    `${real} of ${state.graphDoc.counts.edges} locked links visible`,
  ];
  if (hidden) parts.push(`${hidden} hidden by filters`);
  if (state.gaps) parts.push(`${gaps} ghost edges (${GAP_LABEL})`);
  else parts.push(`${state.graphDoc.counts.gaps} gaps hidden`);
  parts.push("Drag to orbit, scroll to zoom, right-drag to pan.");
  return parts.join(" · ");
}

function pill(label) {
  if (!label) return "—";
  const slug = String(label).toLowerCase().replaceAll("_", "-");
  return `<span class="pill pill-${slug}">${esc(label)}</span>`;
}

function renderPanel(item) {
  const panel = document.getElementById("graph-panel");
  if (!item) {
    panel.innerHTML = `<p class="quiet">Hover or click a node or a link to read the stored registry record. This view does not change any label.</p>`;
    return;
  }
  if (item.kind === "gap") {
    const source = typeof item.source === "object" ? item.source.id : item.source;
    const target = typeof item.target === "object" ? item.target.id : item.target;
    panel.innerHTML = `
      <p class="eyebrow">Missing connection</p>
      <h2>${esc(GAP_LABEL)}</h2>
      <p class="quiet">This is not a stored link. Consecutive stages <code>${esc(source)}</code> and <code>${esc(target)}</code> have no atlas link recorded.</p>
      <dl>
        <dt>source</dt><dd>${esc(source)} — ${esc(item.from_name)}</dd>
        <dt>target</dt><dd>${esc(target)} — ${esc(item.to_name)}</dd>
        <dt>label</dt><dd>${esc(GAP_LABEL)}</dd>
      </dl>`;
    return;
  }
  if (item.type === "stage" || item.type === "dial") {
    const rows = [
      ["id", esc(item.id)],
      ["type", esc(item.type)],
      ["name", esc(item.name)],
      ["label", item.label ? pill(item.label) : "—"],
      ["status", esc(item.status)],
    ];
    if (item.type === "stage") {
      rows.push(["order", esc(item.order)], ["requires", escList(item.requires)], ["notes", esc(item.notes)]);
    } else {
      rows.push(
        ["symbol", esc(item.symbol)],
        ["units", esc(item.units)],
        ["ours", esc(item.ours)],
        ["range", esc((item.range || []).join(" … "))],
        ["scale", esc(item.scale)],
        ["sources", escList(item.sources)],
      );
    }
    rows.push(["path", item.github ? `<a href="${esc(item.github)}">${esc(item.path)}</a>` : esc(item.path)]);
    panel.innerHTML = `
      <p class="eyebrow">${esc(item.type)}</p>
      <h2>${esc(item.name || item.id)}</h2>
      <dl>${rows.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join("")}</dl>`;
    return;
  }
  const source = typeof item.source === "object" ? item.source.id : item.source;
  const target = typeof item.target === "object" ? item.target.id : item.target;
  const windowText = item.window ? esc(JSON.stringify(item.window)) : "—";
  panel.innerHTML = `
    <p class="eyebrow">Atlas link</p>
    <h2>${esc(item.id)}</h2>
    <p>${pill(item.label)}</p>
    <dl>
      <dt>id</dt><dd>${esc(item.id)}</dd>
      <dt>from</dt><dd>${esc(source)} — ${esc(item.from_name)}</dd>
      <dt>to</dt><dd>${esc(target)} — ${esc(item.to_name)}</dd>
      <dt>label</dt><dd>${pill(item.label)}</dd>
      <dt>status</dt><dd>${esc(item.status)}</dd>
      <dt>condition</dt><dd><code>${esc(item.condition)}</code></dd>
      <dt>assumptions</dt><dd>${escList(item.assumptions)}</dd>
      <dt>window</dt><dd>${windowText}</dd>
      <dt>sources</dt><dd>${escList(item.sources)}</dd>
      <dt>sources_count</dt><dd>${esc(item.sources_count)}</dd>
      <dt>notes</dt><dd>${esc(item.notes)}</dd>
      <dt>path</dt><dd>${item.github ? `<a href="${esc(item.github)}">${esc(item.path)}</a>` : esc(item.path)}</dd>
    </dl>`;
}

function renderLegend() {
  const colors = palette();
  const items = LABEL_ORDER.filter((label) => label !== "FAILED" || [...state.graphDoc.edges].some((edge) => edge.label === "FAILED")).map((label) => {
    const dashed = !SOLID_LABELS.has(label);
    return `<li style="color:${colors[label]}"><span class="swatch${dashed ? " dashed" : ""}"></span>${esc(label)}</li>`;
  });
  items.push(`<li><span class="swatch ghost"></span>${esc(GAP_LABEL)}</li>`);
  items.push(`<li><span class="node-swatch" style="background:${colors.stage}"></span>stage</li>`);
  items.push(`<li><span class="node-swatch dial" style="background:${colors.dial}"></span>dial</li>`);
  document.getElementById("graph-legend").innerHTML = `<h2>Legend</h2><ul>${items.join("")}</ul>`;
}

function renderFilters() {
  const used = new Set(state.graphDoc.edges.map((edge) => edge.label));
  const labels = LABEL_ORDER.filter((label) => used.has(label) || state.labels.has(label));
  const labelBox = document.getElementById("label-filters");
  const typeBox = document.getElementById("type-filters");
  labelBox.querySelectorAll("label").forEach((el) => el.remove());
  typeBox.querySelectorAll("label").forEach((el) => el.remove());
  for (const label of labels) {
    const colors = palette();
    const item = document.createElement("label");
    item.innerHTML = `<input type="checkbox" data-label="${esc(label)}" ${state.labels.has(label) ? "checked" : ""}><span style="color:${colors[label]}">${esc(label)}</span>`;
    item.querySelector("input").addEventListener("change", (event) => {
      if (event.target.checked) state.labels.add(label);
      else state.labels.delete(label);
      refresh();
    });
    labelBox.appendChild(item);
  }
  for (const type of ["stage", "dial"]) {
    const item = document.createElement("label");
    item.innerHTML = `<input type="checkbox" data-type="${type}" ${state.types.has(type) ? "checked" : ""}><span>${type}s</span>`;
    item.querySelector("input").addEventListener("change", (event) => {
      if (event.target.checked) state.types.add(type);
      else state.types.delete(type);
      refresh();
    });
    typeBox.appendChild(item);
  }
  const stageSelect = document.getElementById("stage-filter");
  const dialSelect = document.getElementById("dial-filter");
  const stages = state.graphDoc.nodes.filter((node) => node.type === "stage");
  const dials = state.graphDoc.nodes.filter((node) => node.type === "dial");
  stageSelect.innerHTML = `<option value="">All stages</option>` + stages.map((node) => `<option value="${esc(node.id)}">${esc(node.name)}</option>`).join("");
  dialSelect.innerHTML = `<option value="">All dials</option>` + dials.map((node) => `<option value="${esc(node.id)}">${esc(node.name)}</option>`).join("");
  stageSelect.value = state.stage;
  dialSelect.value = state.dial;
  stageSelect.onchange = () => {
    state.stage = stageSelect.value;
    refresh();
  };
  dialSelect.onchange = () => {
    state.dial = dialSelect.value;
    refresh();
  };
  const gaps = document.getElementById("gaps-mode");
  const axis = document.getElementById("axis-mode");
  gaps.checked = state.gaps;
  axis.checked = state.axis;
  gaps.onchange = () => {
    state.gaps = gaps.checked;
    refresh();
  };
  axis.onchange = () => {
    state.axis = axis.checked;
    if (state.axisForce) state.axisForce.enabled(state.axis);
    if (state.graph) state.graph.d3ReheatSimulation();
    writeHash();
  };
}

function hashState() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    labels: params.get("labels"),
    types: params.get("types"),
    stage: params.get("stage") || "",
    dial: params.get("dial") || "",
    gaps: params.get("gaps") === "1",
    axis: params.get("axis") !== "0",
    focus: params.get("focus") || "",
  };
}

function writeHash() {
  const params = new URLSearchParams();
  const allLabels = [...new Set(state.graphDoc.edges.map((edge) => edge.label))];
  const defaultLabels = allLabels.length === state.labels.size && allLabels.every((label) => state.labels.has(label));
  if (!defaultLabels) params.set("labels", [...state.labels].join(","));
  const typeKey = [...state.types].sort().join(",");
  if (typeKey !== "dial,stage") params.set("types", typeKey);
  if (state.stage) params.set("stage", state.stage);
  if (state.dial) params.set("dial", state.dial);
  if (state.gaps) params.set("gaps", "1");
  if (!state.axis) params.set("axis", "0");
  const focus = state.pinned && state.pinned.id;
  if (focus) params.set("focus", focus);
  const next = params.toString();
  const hash = next ? `#${next}` : "";
  if (hash !== window.location.hash) history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
}

function applyHash() {
  const found = hashState();
  const allLabels = [...new Set(state.graphDoc.edges.map((edge) => edge.label))];
  state.labels = new Set(found.labels ? found.labels.split(",").filter(Boolean) : allLabels);
  state.types = new Set(found.types ? found.types.split(",").filter(Boolean) : ["stage", "dial"]);
  state.stage = found.stage;
  state.dial = found.dial;
  state.gaps = found.gaps;
  state.axis = found.axis;
  return found.focus;
}

function forceDials() {
  let nodes = [];
  function force(alpha) {
    const dials = nodes.filter((node) => node.type === "dial");
    const mid = (dials.length - 1) / 2;
    const strength = 0.16 * alpha;
    for (let i = 0; i < dials.length; i += 1) {
      const node = dials[i];
      node.vx += (120 - node.x) * strength;
      node.vy += ((i - mid) * 26 - node.y) * strength;
      node.vz += (0 - node.z) * strength;
    }
  }
  force.initialize = (next) => {
    nodes = next;
  };
  return force;
}

function forceStageAxis() {
  let nodes = [];
  let on = true;
  function force(alpha) {
    if (!on) return;
    const mid = (nodes.filter((node) => node.type === "stage").length - 1) / 2;
    const spacing = 26;
    const strength = 0.2;
    for (const node of nodes) {
      if (node.type !== "stage") continue;
      const targetY = (mid - Number(node.order)) * spacing;
      node.vy += (targetY - node.y) * strength * alpha;
    }
  }
  force.initialize = (next) => {
    nodes = next;
  };
  force.enabled = (value) => {
    if (value === undefined) return on;
    on = value;
    return force;
  };
  return force;
}

function nodeObject(node) {
  const colors = palette();
  const group = new THREE.Group();
  const color = node.type === "dial" ? colors.dial : colors.stage;
  const faded = dimmed(node, "node");
  const material = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: faded ? 0.16 : 1 });
  const geometry = node.type === "dial" ? new THREE.OctahedronGeometry(5.2, 0) : new THREE.SphereGeometry(node.type === "stage" ? 7.4 : 4, 24, 18);
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  const sprite = makeSprite(shortName(node), { offsetY: node.type === "dial" ? 7 : 9, scale: node.type === "stage" ? 7.2 : 6.2, opacity: faded ? 0.2 : 1 });
  group.add(sprite);
  group.__mesh = mesh;
  group.__sprite = sprite;
  return group;
}

function linkObject(link) {
  if (!isDashed(link)) return undefined;
  const group = new THREE.Group();
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const material = new THREE.LineDashedMaterial({
    color: linkColor(link),
    transparent: true,
    opacity: dimmed(link, "link") ? 0.1 : (link.kind === "gap" ? 0.4 : 0.88),
    dashSize: link.kind === "gap" ? 2 : 1.1,
    gapSize: link.kind === "gap" ? 1.6 : 0.7,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  group.add(line);
  if (link.kind === "gap") {
    const sprite = makeSprite(GAP_LABEL, { size: 28, scale: 6.5, offsetY: 0, color: "#c4c0b4" });
    group.add(sprite);
    group.__sprite = sprite;
  }
  group.__line = line;
  return group;
}

function refresh() {
  if (!state.graph) return;
  state.graph
    .nodeVisibility((node) => nodeVisible(node))
    .linkVisibility((link) => linkVisible(link))
    .nodeThreeObject((node) => nodeObject(node));
  document.getElementById("graph-status").textContent = statusText();
  writeHash();
}

function show(item, pin) {
  if (pin) state.pinned = item;
  if (!pin && state.pinned) {
    state.hover = neighborhood(item);
    state.graph.refresh();
    return;
  }
  renderPanel(item || state.pinned);
  state.hover = neighborhood(item || state.pinned);
  if (state.graph) state.graph.refresh();
}

function defaultCamera() {
  if (!state.graph) return;
  state.graph.cameraPosition({ x: 0, y: 20, z: 260 }, { x: 0, y: 0, z: 0 }, 600);
}

async function start() {
  const status = document.getElementById("graph-status");
  status.textContent = "Loading locked graph…";
  try {
    await loadScript(GRAPH_LIB_URL);
  } catch (error) {
    status.textContent = `Could not load the 3D library from the pinned CDN (${GRAPH_LIB_URL}).`;
    throw error;
  }
  if (typeof ForceGraph3D !== "function") {
    status.textContent = "The 3D library loaded but ForceGraph3D was not available.";
    return;
  }
  const response = await fetch(GRAPH_DATA_URL);
  if (!response.ok) {
    status.textContent = "Could not load data/graph.json.";
    return;
  }
  const doc = await response.json();
  if (doc.format !== "consequence-atlas-graph") {
    status.textContent = "data/graph.json is not a locked atlas graph.";
    return;
  }
  state.graphDoc = doc;
  const focusId = applyHash();
  renderLegend();
  renderFilters();
  renderPanel(null);

  const nodes = doc.nodes.map((node) => ({ ...node }));
  const links = [
    ...doc.edges.map((edge) => ({ ...edge })),
    ...doc.gaps.map((gap) => ({ ...gap, id: `gap:${gap.source}:${gap.target}` })),
  ];
  const element = document.getElementById("graph");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const graph = ForceGraph3D({ controlType: "orbit", extraRenderers: [] })(element)
    .backgroundColor("#0a0b08")
    .showNavInfo(false)
    .graphData({ nodes, links })
    .nodeId("id")
    .nodeLabel((node) => `${esc(node.name || node.id)} <span class="quiet">(${esc(node.type)})</span>`)
    .linkLabel((link) => (link.kind === "gap" ? esc(GAP_LABEL) : `${esc(link.id)} ${esc(link.label)}`))
    .nodeThreeObject((node) => nodeObject(node))
    .nodeThreeObjectExtend(false)
    .linkColor((link) => linkColor(link))
    .linkWidth((link) => (isDashed(link) ? 0 : Math.max(0.7, 0.5 + 0.18 * (link.sources_count || 0))))
    .linkOpacity((link) => (dimmed(link, "link") ? 0.12 : 0.92))
    .linkThreeObject((link) => linkObject(link))
    .linkPositionUpdate((obj, { start, end }) => {
      if (!obj || !obj.__line) return;
      const positions = obj.__line.geometry.attributes.position;
      positions.setXYZ(0, start.x, start.y, start.z);
      positions.setXYZ(1, end.x, end.y, end.z);
      positions.needsUpdate = true;
      obj.__line.computeLineDistances();
      if (obj.__sprite) {
        obj.__sprite.position.set((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
      }
    })
    .linkVisibility((link) => linkVisible(link))
    .nodeVisibility((node) => nodeVisible(node))
    .onNodeHover((node) => show(node, false))
    .onLinkHover((link) => show(link, false))
    .onNodeClick((node) => {
      state.pinned = node;
      renderPanel(node);
      writeHash();
    })
    .onLinkClick((link) => {
      state.pinned = link;
      renderPanel(link);
      writeHash();
    })
    .onBackgroundClick(() => {
      state.pinned = null;
      state.hover = null;
      renderPanel(null);
      writeHash();
      if (state.graph) state.graph.refresh();
    })
    .warmupTicks(reduced ? 80 : 40)
    .cooldownTicks(reduced ? 0 : 120);
  state.axisForce = forceStageAxis();
  state.axisForce.enabled(state.axis);
  graph.d3Force("stage-axis", state.axisForce);
  graph.d3Force("dials", forceDials());
  const charge = graph.d3Force("charge");
  if (charge && charge.strength) charge.strength(-48);
  const linkForce = graph.d3Force("link");
  if (linkForce && linkForce.distance) linkForce.distance(28);
  state.graph = graph;
  refresh();
  const fit = () => {
    if (!state.graph) return;
    state.graph.zoomToFit(400, 90, (node) => nodeVisible(node));
  };
  defaultCamera();
  window.setTimeout(fit, 1400);
  document.getElementById("reset-view").onclick = () => {
    defaultCamera();
    window.setTimeout(fit, 200);
  };
  document.getElementById("reheat").onclick = () => graph.d3ReheatSimulation();
  document.getElementById("copy-link").onclick = async () => {
    writeHash();
    try {
      await navigator.clipboard.writeText(window.location.href);
      status.textContent = `${statusText()} · Link copied.`;
    } catch {
      status.textContent = `${statusText()} · Copy the address bar to share this view.`;
    }
  };
  window.addEventListener("hashchange", () => {
    const nextFocus = applyHash();
    renderFilters();
    refresh();
    if (nextFocus) {
      const node = nodes.find((item) => item.id === nextFocus);
      if (node) {
        state.pinned = node;
        renderPanel(node);
      }
    }
  });
  if (focusId) {
    const node = nodes.find((item) => item.id === focusId);
    if (node) {
      state.pinned = node;
      renderPanel(node);
      window.setTimeout(() => {
        if (node.x !== undefined) {
          graph.cameraPosition({ x: node.x + 80, y: node.y + 20, z: node.z + 80 }, { x: node.x, y: node.y, z: node.z }, 800);
        }
      }, 900);
    }
  }
  status.textContent = statusText();
  // Keep a handle for debugging and screenshots.
  window.__atlasGraph = { state, THREE, note: NOTE, three: THREE_URL, lib: GRAPH_LIB_URL, renderPanel, fitView: () => state.graph.zoomToFit(200, 90, (node) => nodeVisible(node)) };
}

start().catch((error) => {
  document.getElementById("graph-status").textContent = error.message || String(error);
  console.error(error);
});
