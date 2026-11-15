import { run as atlasRun, evaluate, OURS, dialPairGrid, lambdaLine, dialStrips, dimensionPanel, id as atlasId, dials, cards } from "../atlas.js";
import { run as starterRun, create, id as starterId, cards as sCards, dials as sDials } from "../starter.js";

const ev = evaluate(OURS);
const a = atlasRun(OURS);
const keys = Object.keys(a);
const need = ["dialBoard", "universeMap", "stageStrip", "lattice"];
const missing = need.filter((k) => !(k in a));
console.log("atlas id", atlasId, "cards", cards.length, "dials", dials.length);
console.log("atlas run keys", keys, "missing", missing);
console.log("ours carers", ev.stages.find(s=>s.id==="s13.carers").status);
console.log("map cells", a.universeMap.cells.length, "ours on plane", a.universeMap.ours.on_plane);
const pair = dialPairGrid("strong", "cosmological_constant", { nx: 11, ny: 11 });
console.log("arbitrary pair strong-Λ cells", pair.cells.length);
console.log("lambda points", lambdaLine().points.length, "thresholds", lambdaLine().thresholds.map(t=>t.x));
console.log("strips", dialStrips().strips.map(s=>s.id+":"+s.switches["s07.stars"].length+" star-switches"));
console.log("dims", dimensionPanel().rows.map(r=>r.n+":"+r.s03.status).join(" "));

const st = starterRun({ family: "P", dim: 2, size: 16, steps: 16, seed: 1 });
console.log("starter id", starterId, "cards", sCards.length, "dials", sDials.length);
console.log("starter run keys", Object.keys(st), "lattice ready", st.lattice.ready, "verdict", st.lattice.verdict);
const sim = create({ family: "C", dim: 2, size: 12, steps: 8, seed: 2 });
sim.step(3);
console.log("mid state done", sim.state().done, "finished", sim.state().finished);
sim.step(100);
const fin = sim.finish();
console.log("after finish", fin.verdict, "render frames", sim.renderData().frames.length);
if (missing.length) process.exit(2);
