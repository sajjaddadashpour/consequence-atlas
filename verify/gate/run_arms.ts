// Batch runner for the gate: runs (cfg, seed) jobs on the pinned Starter engine and hashes each output
// exactly like run-card: sha256(JSON.stringify({verdict, m})).
// Usage: npx tsx verify/gate/run_arms.ts <job.json> <out.json>
import { makeSim, DEF } from "../../engine/starter/src/engine";
import * as fs from "fs";
import * as crypto from "crypto";

const [jobPath, outPath] = process.argv.slice(2);
const job = JSON.parse(fs.readFileSync(jobPath, "utf8")) as { arms: { key: string; settings: any; half?: boolean; seeds: number[] }[] };
// Same half-size rule as the locked v3 sweep and run-card.ts: Q halves steps, M halves popN (pop) or steps, others halve size.
const half = (c: any): any => { const f = c.family; if (f === "Q") return { ...c, steps: Math.floor(c.steps / 2) }; if (f === "M") return c.meta === "pop" ? { ...c, popN: Math.floor(c.popN / 2) } : { ...c, steps: Math.floor(c.steps / 2) }; return { ...c, size: Math.floor(c.size / 2) }; };
const out: Record<string, any[]> = {};
for (const a of job.arms) {
  const base = { ...DEF, ...a.settings };
  const cfg = a.half ? half(base) : base;
  out[a.key] = a.seeds.map((seed) => {
    const s = makeSim({ ...cfg, seed });
    while (s.done < s.total) s.stepOnce();
    const r: any = s.finish();
    const h = "sha256:" + crypto.createHash("sha256").update(JSON.stringify({ verdict: r.verdict, m: r.m })).digest("hex");
    return { seed, verdict: r.verdict, m: r.m, hash: h };
  });
}
fs.writeFileSync(outPath, JSON.stringify(out));
