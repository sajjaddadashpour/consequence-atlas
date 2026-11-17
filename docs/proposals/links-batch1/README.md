# Links batch 1 (proposal, Physicist, 2026-11-15)

Drafts only. Not in atlas/links, not in the engine, no label changes. Nothing here changes any verdict on the site.

## Method
Listed every `requires` edge in atlas/stages and checked which have no link (25 links today). Six edges have none:

| edge | outcome |
|---|---|
| s04 -> s10 (records need atoms) | drafted `l.s10.record-carrier`, DERIVED-UNDER-ASSUMPTION, informational |
| s07g -> s07 (stars need galaxies) | drafted `l.s07.gas-cooling`, IMPORTED, informational |
| s06 -> s11 (life needs chemistry) | drafted `l.s11.chemistry-for-life`, CONJECTURE |
| s08 -> s11 (life needs C/O) | drafted `l.s11.carbon-oxygen`, CONJECTURE |
| s04 -> s07 (stars need atoms) | no new link: `l.s07.star-mass-window` (d6, beta/alpha^2) already uses electron degeneracy, i.e. atomic physics. Proposal: change its `from` to s04 instead of adding a duplicate. |
| s03 -> s09 (planets need orbits) | no new link: `l.s03.orbit-stability` (d1) already carries the n = 3 cut and S9 inherits it. |

## Honest limits
- None of the four drafts adds a new dial cut. Every "which dial ranges break it" answer is "nothing beyond what upstream already breaks". Real new cuts need new dials (temperature, fluctuation amplitude Q) and a locked derivation each.
- Two candidate cuts worth locking next: (a) atomic cooling threshold vs alpha, beta and Q (Rees-Ostriker / Tegmark-Rees); (b) record lifetime vs barrier/kT once a temperature scale exists.
- The cited papers' content is quoted from my knowledge; it was not re-read this session. Check before merge.
- All four files pass link.schema.json and cite only ids in sources/sources.json.
