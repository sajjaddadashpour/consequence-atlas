# Amendment 1 to DEFINITION.md (349ca7f) — shared kill tolerance
Status: LOCKED pre-data, 2026-11-18 ~19:45 America/Regina. No record in any field has been scored.
Origin: Biologist B1 (2daeb9a) proposed it for B1; generalized here so "same law" uses one tolerance.

1. Upkeep-threshold tests (sigma*e^{-U_eff} > 1): a case whose observed persistence/loss
   contradicts the threshold prediction by a factor <= 2 in U_eff (or in the predicted
   lifetime) is NOT-TESTABLE-YET, not KILLED. Reason (ASSUMED): finite-population and
   sigma-range limits declared in 349ca7f.
2. A miss by > 2x counts as stated in the field's own lock.
3. Field locks with their own explicit, stricter thresholds (e.g. Philosopher's 1000x
   barrier-vs-upkeep and 10x upkeep-outlives-decay rules, lock 13af067e…3c76) keep them;
   this tolerance does not loosen any threshold larger than 2x.
4. Applies identically to every field. No per-field tolerances.
