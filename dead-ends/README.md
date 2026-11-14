# dead-ends/

Cards that ended as `FAILED`, `DEAD-END` or `INERT-BY-CONSTRUCTION`, in the same format and layout as `cards/`. They are kept forever because a closed path is progress too.

- **From the v3 origins sweep (37 legacy cards):** 6 INERT-BY-CONSTRUCTION (test and control outputs byte-identical); 2 DEAD-END (origin 42, a deterministic 0.02% difference counted by the old "SE = 0 means significant" rule; origin 45, a half-size run that never reaches the step where dephasing switches on); 29 FAILED. Origin 92 (Glitch Universe) fails because v0 adds a Bonferroni correction across measures: its half-size z of −3.14 is below the corrected 3.29.
- **From the single-factor follow-up F1 (222 children):** 179 FAILED, 41 INERT-BY-CONSTRUCTION, and 2 DEAD-END where the seed-shuffled null arm itself differed from the control: `c.v3o.029.inflating-lattice.sf-h` (factor `H`) (null z = −3.08) and `c.v3o.056.big-bounce.sf-expand` (null z = 3.40). Those measures are not reliable for those setups. See `cards/README.md` for the protocol.
