// run-card: rerun an experiment card with the pinned Starter engine and compare output hashes.
// Usage: npx tsx cli/run-card.ts <path/to/card.json> [--seeds 1,2,3] [--null-seeds 6,7,8,9,10] [--out outputs.json]
// Arms: A/Ah = test full/half, C/Ch = control full/half, N = null (control.null_settings, full size) when null_settings is a JSON settings object.
import { makeSim, DEF } from "../src/engine";
import * as fs from "fs";
import * as crypto from "crypto";

const args = process.argv.slice(2);
if (!args[0]) { console.error("usage: run-card <card.json> [--seeds 1,2,3] [--out file]"); process.exit(2); }
const card = JSON.parse(fs.readFileSync(args[0], "utf8"));
const opt = (k: string): string | undefined => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
if (card.engine?.name !== "starter" || card.engine?.version !== "3.0.0") { console.error(`engine mismatch: card wants ${card.engine?.name} ${card.engine?.version}, this is starter 3.0.0`); process.exit(2); }
const seeds = (opt("--seeds") ?? "1,2,3,4,5").split(",").map(Number);

// Same half-size rule as the locked v3 sweep: Q halves steps, M halves popN (pop) or steps, others halve size.
const half = (c: any): any => { const f = c.family; if (f === "Q") return { ...c, steps: Math.floor(c.steps / 2) }; if (f === "M") return c.meta === "pop" ? { ...c, popN: Math.floor(c.popN / 2) } : { ...c, steps: Math.floor(c.steps / 2) }; return { ...c, size: Math.floor(c.size / 2) }; };
const run1 = (c: any) => { const s = makeSim(c); while (s.done < s.total) s.stepOnce(); const r: any = s.finish(); return { verdict: r.verdict, m: r.m }; };
const hash = (r: any): string => "sha256:" + crypto.createHash("sha256").update(JSON.stringify({ verdict: r.verdict, m: r.m })).digest("hex");

const T = { ...DEF, ...JSON.parse(card.rules.settings) };
const C = { ...DEF, ...JSON.parse(card.control.settings) };
const arms: Record<string, any> = { A: T, Ah: half(T), C, Ch: half(C) };
let nullCfg: any = null;
try { const ns = JSON.parse(card.control.null_settings); if (ns && typeof ns === "object") nullCfg = { ...DEF, ...ns }; } catch { /* legacy: null arm not run */ }
const nullSeeds = (opt("--null-seeds") ?? "6,7,8,9,10").split(",").map(Number);
const out: Record<string, any[]> = {};
let checked = 0, matched = 0;
const plan: [string, any, number[]][] = Object.entries(arms).map(([k, c]) => [k, c, seeds]);
if (nullCfg) plan.push(["N", nullCfg, nullSeeds]);
for (const [key, cfg, sd] of plan) {
  out[key] = [];
  for (const [idx, seed] of sd.entries()) {
    const r = run1({ ...cfg, seed });
    out[key].push(r);
    const want = (card.runs ?? []).find((x: any) => x.output_uri === `outputs.json#/${key}/${idx}`);
    const h = hash(r);
    if (want) { checked++; if (want.output_hash === h) matched++; else console.log(`MISMATCH ${key} seed ${seed}: ${h} != ${want.output_hash}`); }
  }
}
const o = opt("--out"); if (o) fs.writeFileSync(o, JSON.stringify(out));
console.log(JSON.stringify({ card: card.id, label_on_card: card.label, runs_checked: checked, runs_matched: matched, reproduced: checked > 0 && checked === matched }));
process.exit(checked > 0 && checked === matched ? 0 : 1);
