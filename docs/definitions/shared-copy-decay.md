# Shared definition: copy-vs-decay persistence (v1, locked 2026-11-18, Physicist)
Every field's lock MUST cite this file's commit hash and fill in only the field-specific numbers below. No field may change a formula after seeing data.

## Objects
- Record: a sequence of L units (bases, words/letters, qubits, monomers). State the unit and L.
- Copy event: production of a new instance from an existing one (replication, scribal copy, recitation to a new pupil, protein resynthesis). State what counts as one generation.
- u: per-unit error probability per copy (substitutions + insertions + deletions, counted against the source at the same unit). Must be measured from copy-source pairs, not from survival outcomes.
- U = u*L: expected errors per whole-record copy.
- sigma (superiority, >=1): ratio of the rate at which an intact record produces surviving copies to the mean rate of corrupted ones. MUST be fixed a priori or measured from data independent of the survival/decay outcome being tested; otherwise the test is void.
- Error correction: if a scheme (redundancy, checksums, proofreading, multi-order recitation) is used, report raw u and corrected u_eff separately, measured independently.

## Upkeep-held persistence (Eigen 1971 threshold, IMPORTED; single-peak approximation)
Record content persists across generations iff  sigma * exp(-U_eff) > 1,  i.e.  U_eff < ln(sigma).
Prediction form: lineages/traditions with U_eff > ln(sigma) lose the master sequence (error catastrophe); those below keep it.
Stated limits: single-peak landscape, infinite population; finite-population and smooth-landscape corrections must be declared in the lock if used.

## Barrier-held persistence (Eyring, IMPORTED)
Lifetime without upkeep  tau = (h / k_B T) * exp(dG_act / k_B T). State dG_act and T with sources.

## Classification rule (decided before data)
A record is barrier-held if tau(no upkeep) > observation span; upkeep-held otherwise. When upkeep stops:
- upkeep-held: content decays at the raw degradation rate (field-specific, cited).
- barrier-held: content persists ~tau.

## Cross-field claim and its kill
"Same law" holds only if, using THIS u, U, sigma definition, every field's records sort correctly (threshold side and barrier/upkeep class). A single field needing a different formula = same shape, not same law. Universal D3 ("persists only by re-reading") is KILLED by any barrier-held record outlasting stopped upkeep.
