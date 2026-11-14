# atlas/

The Arrow: hand-edited YAML, checked against `schema/`.

- `stages/` — one file per stage (`id`, `name`, `order`, `requires`). Validated by `schema/stage.schema.json`.
- `links/` — one file per link, named `<from>__<to>__<slug>.yaml` (several links can share a stage pair). Each carries its label, condition, sources and, when DERIVED-UNDER-ASSUMPTION, its assumptions. Validated by `schema/link.schema.json`.
- `backward/` — the backward chain from "beings who can care", with every bridge premise labelled and the is/ought gap stated.
- `derivations/` — the arithmetic behind `derive.*` sources.

## Conditions
`condition` is the PASS condition, a Python-style expression over dial ids. Hyphens in dial ids become underscores (`cosmological-constant` → `cosmological_constant`). `true` means always PASS. WEAK, CONTESTED and FAIL bands are spelled out in `notes`, and `window` gives the main numeric edge.

A stage's status is the worst status of its own links, and it is BLOCKED if any required stage FAILs. Order: PASS < OPEN < WEAK < CONTESTED < FAIL.

## Dial values
`arrow`: 0 = reversible laws with an equilibrium start, 1 = reversible laws with a low-entropy start (ours), 2 = irreversible laws.
