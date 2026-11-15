// Build-time cache of site/engine/atlas.js at the locked dials.
// Calls the playground model, which calls the engine. Does not restate the rules.
import { explainSwitch, mapAt, params, stageAt, stripsAt, engine, SENSITIVITY_CAVEAT } from "./models/atlas.js";

const STATUS_CHAR = { PASS: "P", WEAK: "W", OPEN: "O", CONTESTED: "C", FAIL: "F", BLOCKED: "B" };
const RANK = { PASS: 0, OPEN: 1, WEAK: 2, CONTESTED: 3, FAIL: 4, BLOCKED: 5 };
const REGION_OF = { PASS: "ok", WEAK: "weak", OPEN: "open", CONTESTED: "contested", FAIL: "fail", BLOCKED: "blocked" };

const PAIR_IDS = ["alpha", "beta", "strong", "cosmological_constant", "dimensions", "arrow"];

function lockedParams() {
  const values = {};
  params.forEach((param) => { values[param.name] = param.locked; });
  return values;
}

function worstRegion(statuses) {
  let worst = "PASS";
  let rank = -1;
  statuses.forEach((status) => {
    const next = status === "BLOCKED" ? 5 : (RANK[status] ?? -1);
    if (next > rank) { rank = next; worst = status; }
  });
  return REGION_OF[worst] || "blocked";
}

function packMap(grid, stageIds) {
  let codes = "";
  grid.cells.forEach((cell) => {
    stageIds.forEach((id) => {
      const row = cell.featured && cell.featured[id];
      const status = row && row.status;
      const ch = STATUS_CHAR[status];
      if (!ch) throw new Error("missing status " + id + " on " + grid.x.id + "/" + grid.y.id);
      codes += ch;
    });
  });
  return {
    x: { id: grid.x.id, scale: grid.x.scale, symbol: grid.x.symbol || "", values: grid.x.values },
    y: { id: grid.y.id, scale: grid.y.scale, symbol: grid.y.symbol || "", values: grid.y.values },
    ours: grid.ours,
    stageIds,
    codes,
  };
}

function assertDefaultRegions(overview, detail, featured) {
  const stageIds = detail.cells[0] ? Object.keys(detail.cells[0].featured) : [];
  if (overview.cells.length !== detail.cells.length) {
    throw new Error("overview and detail grids differ in length");
  }
  for (let i = 0; i < overview.cells.length; i++) {
    const statuses = featured.map((id) => detail.cells[i].featured[id].status);
    const region = worstRegion(statuses);
    if (region !== overview.cells[i].region) {
      throw new Error("display summary diverges from dialPairGrid at cell " + i + ": " + region + " vs " + overview.cells[i].region);
    }
    if (!stageIds.length) throw new Error("detail grid has no stage statuses");
  }
}

function packStrip(strip, hold) {
  const stageIds = strip.points[0] ? Object.keys(strip.points[0].stages) : [];
  let codes = "";
  strip.points.forEach((point) => {
    stageIds.forEach((id) => {
      const ch = STATUS_CHAR[point.stages[id]];
      if (!ch) throw new Error("strip " + strip.id + " missing " + id);
      codes += ch;
    });
  });
  const switches = [];
  stageIds.forEach((stageId) => {
    if (stageId === "s00.rules") return;
    (strip.switches[stageId] || []).forEach((sw) => {
      const explained = explainSwitch(hold, strip.id, sw.from, sw.to, stageId);
      switches.push({
        stage: stageId,
        from: sw.from,
        to: sw.to,
        was: explained.was,
        now: explained.now,
        via: explained.via,
        links: explained.links,
        stageLinks: explained.stageLinks,
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

const hold = lockedParams();
const ev = stageAt(hold);
const stageIds = ev.stages.map((stage) => stage.id);
const featuredProbe = mapAt(hold, "alpha", "beta", 5);
const featured = featuredProbe.featured.slice();

const maps = [];
for (let i = 0; i < PAIR_IDS.length; i++) {
  for (let j = i + 1; j < PAIR_IDS.length; j++) {
    const x = PAIR_IDS[i];
    const y = PAIR_IDS[j];
    const n = x === "alpha" && y === "beta" ? 41 : 21;
    const detail = mapAt(hold, x, y, n, stageIds);
    if (n === 41) {
      const overview = mapAt(hold, x, y, n);
      assertDefaultRegions(overview, detail, featured);
    }
    maps.push(packMap(detail, stageIds));
    console.error("preview map " + x + " × " + y + " " + detail.x.values.length + "×" + detail.y.values.length);
  }
}

const rawStrips = stripsAt(hold, 41);
const strips = rawStrips.strips.map((strip) => packStrip(strip, hold));

const preview = {
  format: "consequence-atlas-preview",
  format_version: "1",
  note: "Build-time cache of site/engine/atlas.js at the locked dials. Not a stored claim. data/index.json is the record of cards, links, and dials. A live verdict does not promote a card.",
  engine: { name: engine.name, version: engine.version },
  caveat: SENSITIVITY_CAVEAT,
  featured,
  hold: ev.dials,
  dials: params.map((param) => ({
    name: param.name,
    id: param.name === "cosmological-constant" ? "cosmological_constant" : param.name,
    label: param.label,
    symbol: param.symbol || "",
  })),
  stages: ev.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    order: stage.order,
    requires: stage.requires,
    status: stage.status,
    verdict: stage.verdict,
    honesty: stage.honesty,
    sources: stage.sources,
    links: (stage.links || []).map((link) => ({
      id: link.id,
      from: link.from,
      to: link.to,
      label: link.label,
      sources: link.sources || [],
      status: link.status,
      reason: link.reason || "",
    })),
  })),
  maps,
  strips,
};

process.stdout.write(JSON.stringify(preview));
