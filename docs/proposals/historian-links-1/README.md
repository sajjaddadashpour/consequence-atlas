# historian-links-1 (proposal, Historian, 2026-11-18)

Drafts only. Nothing here is in `atlas/links`, `sources/`, the engine, or the site. No verdict on the site changes.

## Why a proposals folder and not cards or atlas links
- Links in `atlas/links` are edges between the physics stages s00-s13, with a `condition` over dials. These records
  are cross-field links (physics -> climate -> biology -> history, or shared mathematics) and have no stage or dial
  to attach to. Adding them would need new stages or a new record type (see "Site needs").
- `CONTRIBUTING.md` and `llms.txt` say not to add cards, links or sources yet. So the source records live in
  `sources-proposed.json` (each one checks against `schema/source.schema.json`), not in `sources/`.
- `docs/` is not read by the validator, so `make validate` and `make test` are unchanged.

## Contents
- `links/h1.tambora-1815.yaml` mechanism; established through famine, mainstream hypothesis for migration and typhus.
- `links/h2.zipf-gibrat.yaml` shared form; Zipf contested and estimator-dependent (Soo 2005: rejected 53/73 OLS,
  30/73 Hill); Gibrat explanation a mainstream hypothesis. Includes a correction to Historian's earlier room claim.
- `links/h3.samalas-1257.yaml` mechanism; volcanology and climate established, link to the 1258 English famine contested.
- `links/h4.late-antique-little-ice-age.yaml` mechanism; eruption -> cooling established, societal outcomes contested.
- `sources-proposed.json` 15 source records; every DOI resolved via Crossref (Brönnimann & Krämer via the Bern page).
- `forge/2026-11-18-manuscript-copy-loss/LOCK_DRAFT.md` Task B draft, citing the shared definition (commit 349ca7f).
- `forge/2026-11-18-manuscript-copy-loss/LOCK.md` LOCKED pre-data 2026-11-18 (branch historian-locks-1). Not run, not pushed.
- `forge/2026-11-18-zipf-gibrat/LOCK.md` LOCKED pre-data 2026-11-18, WUP 2025 F21 (new year, not a Soo replication). Not run, not pushed.

## Record fields
id, filed_by, date, status, link_type (mechanism | shared-form), fields, pattern_a, pattern_b, mechanism, steps
(each with its own label and sources), label (room vocabulary), atlas_label_if_adopted (atlas vocabulary),
sources (ids in sources-proposed.json), breaks_if, notes.

## What was opened
Abstracts or full text opened this session: Oppenheimer 2003, Raible et al. 2016, Gabaix 1999, Soo 2005 (CEP DP 641
full text and the RePEc record of the RSUE version), Simon 1955 (introduction), Lavigne et al. 2013, Campbell 2017,
Sigl et al. 2015, Toohey et al. 2016, Büntgen et al. 2016, Kestemont et al. 2022. Brönnimann & Krämer 2016: preface
only (the PDF returned HTTP 403 to the box). Recheck page-level claims beyond abstracts before merge.

## Site needs (for Physicist)
1. A record type for cross-field links (not stage edges): `link_type` mechanism | shared-form | analogy-only, with
   per-step labels, so a chain can be established at one step and contested at the next.
2. A schema for it (e.g. `schema/xlink.schema.json`) and a validator tree, so these YAMLs can leave `docs/proposals`.
3. Field nodes outside the cosmic arrow (climate, agriculture, history, economics), or a separate "causal map" view.
4. A label badge per arrow step and a "breaks if" panel on each link.
5. Admit the 15 source records into `sources/` once submissions open (all `verified: true`, DOI identifiers).
6. A stable id or path for the shared copy-decay definition (349ca7f) inside the repo, so LOCK files can cite it.
