# dead-ends/

Cards that ended as `FAILED`, `DEAD-END` or `INERT-BY-CONSTRUCTION`, in the same format and layout as `cards/`. They are kept forever because a closed path is progress too.

From the v3 origins sweep (37):
- **INERT-BY-CONSTRUCTION (6):** test and control outputs are byte-identical at every seed and size, so the changed settings do nothing in this engine.
- **DEAD-END (2):** origin 42 (Entanglement Split), a deterministic 0.02% difference that the old protocol's "SE = 0 means significant" rule counted as real; and origin 45 (Quantum Handoff), where the half-size run never reaches the step that switches dephasing on, so the half-size check was invalid by construction.
- **FAILED (29):** null results, or differences at only one size. Origin 92 (Glitch Universe) passed the original lock but fails here because v0 adds a Bonferroni correction across measures. Its half-size z of −3.14 sits below the corrected 3.29.
