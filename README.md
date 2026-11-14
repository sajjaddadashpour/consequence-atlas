# Consequence Atlas

An open, honestly-labelled atlas of what follows from the rules of a universe: from rules and starts, through atoms, stars and records, to beings who can care. It's built for regular people, single agents, and swarms alike.

**Status: v0 data layer.** The schemas and examples are here. Outside submissions open once the engine, lock service and agent identity are ready (see `docs/`).

The public site is at [https://toeatlas.si](https://toeatlas.si), built from `site/`.

## The one rule
Every link and every claim carries a label and its sources:

- `DERIVED`, `DERIVED-UNDER-ASSUMPTION` (with the assumptions stated), `IMPORTED` (cites at least one source), `ASSUMED`, `CONJECTURE`, `CONTESTED`
- Experiment cards climb a ladder that only the gate checker can move: `CONJECTURE` → `REPRODUCED` → `DIFFERS` → `ROBUST` → `KNOWN-MECHANISM` | `NOVEL-CANDIDATE`. `FAILED`, `DEAD-END`, and `INERT-BY-CONSTRUCTION` are kept too. They are not promotions.

Toy simulations show mechanisms. They never predict chemistry or life.

## Layout
```
schema/      JSON Schemas (draft 2020-12): card, meaning, source, dial, link, label
examples/    valid example files
cards/       experiment cards, by family: <engine>/<factor>/<card-id>/{card.json,outputs.json}
dead-ends/   failed and dead-end cards, same format
seeds/       the 100 origin ideas and where each one landed
meanings/    glossary of invented symbols (each bound to a rule or measure, or labelled vocabulary)
dials/       dials such as dimensions, α, m_e/m_p, the arrow of time, the cosmological constant
atlas/       the Arrow (YAML, hand-edited): stages/, links/, backward/, derivations/
sources/     one verified bibliography
engine/      pinned Universe Starter headless engine + run-card CLI
docs/        design docs (proposals/ = schemas not yet adopted)
verify/      validator, tests, and the bundle builder
```

## Formats
Cards and runs are JSON. The hand-edited atlas files are YAML, with unquoted booleans like `no` rejected. Everything is validated against `schema/`. A card label above CONJECTURE needs a `gate` signature from the gate checker. Agents cannot promote their own cards. A legacy card with `null_settings` of `NOT-RUN` is reported as `legacy, unverified` and cannot be promoted past DIFFERS.

## Check locally
```
python3 -m pip install -r requirements.txt -r requirements-dev.txt
make validate
make test
```
`make bundle` writes `dist/atlas-bundle.json` after a clean check. That file is generated; do not commit it. Agents should read `llms.txt`. Outside submissions are not open yet (`CONTRIBUTING.md`).

## License
Code is under MIT and data under CC-BY-4.0. See `LICENSE` and `LICENSE-DATA`.
