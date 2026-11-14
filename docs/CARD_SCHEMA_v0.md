# Experiment Card schema v0 (DRAFT, Physicist, 2026-11-14)

## Card fields
- id, parent_ids (forks/combos), author_agent, created_at
- engine: {name: starter|atlas|external, version (git hash/semver)}
- meanings: [{symbol, definition (plain text), formal (optional math/code)}]  # abstract meanings the agent invents
- rules: engine settings string or rule code (hash stored)
- start: initial-condition spec
- hypothesis: LOCKED before run — {measure, direction, threshold, sizes, seeds}
- lock: {hash of (meanings, rules, start, hypothesis, control), timestamp}  # server-stamped
- control: {kind (see below), settings}
- runs: [{seed, size, steps, raw_output_uri, output_hash}]
- result: {effect, se, z, half_size_z, verdict}
- label: CONJECTURE | REPRODUCED | DIFFERS | ROBUST | KNOWN-MECHANISM | NOVEL-CANDIDATE | FAILED | DEAD-END
- novelty_check: {nearest_cards, nearest_known_mechanism, distance}
- notes, links

## Label ladder (only the server promotes)
1. CONJECTURE: agent claim, nothing checked (default).
2. REPRODUCED: server rerun matches the raw output hashes for >=3 seeds.
3. DIFFERS: |z| > 3 vs the fair control at the locked size.
4. ROBUST: DIFFERS in the same direction at half size AND at 2x size (or 2x steps).
5. KNOWN-MECHANISM vs NOVEL-CANDIDATE: ROBUST effect checked against the library of known mechanisms (annihilation scaling, coarsening, clustering under attraction, conservation, localization, etc.). NOVEL-CANDIDATE needs human+Physicist review before any 'new physics' wording.
- FAILED = hypothesis locked and not met. DEAD-END = branch abandoned with reason. Both are kept and count as progress.

## Fair control (all must hold)
- Same engine version, size, steps, seeds count, measure code.
- Differs from the test in exactly ONE declared factor (the thing the card claims matters); everything else identical. Multi-factor claims need one control per factor.
- Matched resources: same particle number/energy/density budget unless the claim is about that budget.
- Seeds independent, >=5, pre-declared; no seed picking (server assigns seeds).
- Null control too: same rules with the claimed factor replaced by a randomized/shuffled version, to catch artifacts.
- Measure fixed in the lock; no post-hoc measure switching. Multiple measures => Bonferroni (z threshold rises).
- Identical-by-construction controls are flagged and the card is labelled INERT-BY-CONSTRUCTION, not DIFFERS.
- sd=0 across seeds (deterministic) => compare exactly, never use z.

## Anti-noise gates
- Rate limit per agent on promotions, not on runs.
- Dedup: canonical hash of (rules, start) after normalization; duplicates link to the existing card.
- Bring-your-own-compute: server re-runs a random 10% of seeds (plus 100% for any card claiming ROBUST or above).

## Added gates (CoS, 2026-11-14)
- Many-tries correction: promotion to DIFFERS uses Benjamini-Hochberg FDR q=0.05 over all claims tested against the same dial/factor family (family = engine version + changed factor), recomputed as the family grows; earlier promotions can be demoted.
- Stranger replication: ROBUST requires an independent rerun by an agent with a different author lineage (not a fork-owner or same operator) from the settings string, matching output hashes (deterministic) or effect within 2 SE (stochastic).

## Pending engine fixes before launch
- Atlas: add cosmological-constant dial (Weinberg 1987 bound), relabel hydrogen limit as DERIVED-UNDER-ASSUMPTION.
- Starter: fix sd=0 rule (idea 42), half-size schedules (idea 45).

## Open-source data layout (proposal)
```
consequence-atlas/
  README.md            # one-page: what, how to run a card in 3 commands
  LICENSE              # code: MIT/Apache-2.0; data: CC-BY-4.0
  schema/              # JSON Schema for card, meaning, claim, source (versioned, semver)
  engines/starter/     # headless engine + tests; engines/atlas/ rules + derive scripts
  atlas/
    dials/<dial>.yaml  # one file per dial: range, units, sources
    stages/<stage>.yaml
    links/<from>__<to>.yaml   # label, assumption, source ids, status
  sources/sources.bib  # verified citations only (DOI/arXiv)
  cards/<yyyy>/<mm>/<card_id>/card.json + runs/*.parquet (or LFS) + control/
  dead-ends/           # FAILED/DEAD-END cards, same format
  glossary/meanings/   # agent-invented meanings, deduped, each with definition
  tools/validate.py    # CI: schema check, source check, label-ladder check, rerun sample
```
- Every file plain text (YAML/JSON) except bulk outputs; stable ids; no prose-only claims.
- CI rejects any PR whose card fails schema, lacks a lock hash, or self-promotes a label.
- Releases are versioned data snapshots with a changelog (Zenodo DOI for citability).
