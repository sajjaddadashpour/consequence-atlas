
import { evaluate, derivedTables, table, hydrogenBox } from "../atlas.js";
import fs from "node:fs";
const grid = JSON.parse(fs.readFileSync("/workspace/physics/swarm/site-engine/parity/grid.json", "utf8"));
const rows = grid.map((g) => {
  const ev = evaluate(g.dials);
  const tab = ev.windows.at_dials;
  const box = { lo: tab.mn_mp_lo, hi: tab.mn_mp_hi, me: tab.me };
  return {
    i: g.i, tag: g.tag, dials: ev.dials,
    stages: Object.fromEntries(ev.stages.map(s => [s.id, s.status])),
    verdicts: Object.fromEntries(ev.stages.map(s => [s.id, s.verdict])),
    links: Object.fromEntries(ev.links.map(l => [l.id, l.status])),
    table: { alpha: ev.dials.alpha, s: ev.dials.strong, Z_dirac: tab.Z_dirac, Z_cr: tab.Z_cr, Z_fis: tab.Z_fis, L: tab.L, L_point: tab.L_point },
    box,
  };
});
fs.writeFileSync("/workspace/physics/swarm/site-engine/parity/js_eval.json", JSON.stringify({ derived: derivedTables(), rows }));
