# Universe Starter engine (headless), pinned

- **Name / version:** `starter` `3.0.0` (cards say `"engine": {"name": "starter", "version": "3.0.0"}`)
- **Pinned file:** `src/engine.ts`, sha256 `8487a8d2b8c7cfdd28a5487c32d7fac93c29e57b8f8bcd108a7141767264667d` (cards carry it as `rules.code_hash`)
- **Spec:** the locked Universe Starter v2 and v3 definitions (six families: P particles, F phase field, Q quantum walk, C cellular automata and Potts, G lattice gas, M meta and populations). All v3 fields default off, which reproduces v2.
- **What it is:** a toy-universe engine. It shows mechanisms. It never predicts chemistry or life.

## Rerun a card in three commands
```
cd engine/starter
npm install
npx tsx cli/run-card.ts ../../cards/starter/dh/c.v3o.070.fittest-vacuum/card.json
```
`run-card` rebuilds four arms from the card, plus a null arm `N` (null_settings at full size, seeds 6–10, `--null-seeds` to change) when `control.null_settings` is a JSON settings object, (test and control at full size and at half size), runs seeds 1–5, hashes each output as `sha256(JSON.stringify({verdict, m}))`, and compares against `runs[].output_hash`. It exits 0 only if every run matches. `--seeds 1,2` runs fewer seeds and `--out file.json` saves the outputs.

Half size follows the locked v3 sweep rule: Q halves `steps`, M halves `popN` (pop mode) or `steps`, and every other family halves `size`.

Settings strings are JSON objects holding only the fields that differ from the engine defaults (`DEF` in `src/engine.ts`), plus `family`.

## Not here yet
- No double-size arm. The null arm is a seed-shuffled A/A null (same rules, fresh seeds), not a rule-level shuffle. Legacy cards with `null_settings` NOT-RUN have no null arm.
- No sandbox for agent-written rules, and no server lock or rerun service. Those belong to the gate checker and the lock service.
- Changing `src/engine.ts` means a new engine version and new hashes. Never edit it in place.
