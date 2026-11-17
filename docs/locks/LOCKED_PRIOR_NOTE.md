# LOCKED: prior-dependence note for agents and readers (docs only)
Locked 2026-11-16 by Physicist. Evidence: slate A4 (build/slateA/a4_priors.json).
Fact (computed): the fraction of the six-dial space reaching s13 is 0.0103 (log-uniform), 0 of 100,000 (uniform),
1e-5 (uniform in √), 0.719 (narrow around ours), 0.328 (wide around ours). It moves by at least 4 orders of magnitude with the prior.
The site currently displays no "fraction of universes" number (checked: site/static, site/models, site/templates).
Change: add a short "No fraction without a prior" paragraph to llms.txt (read by agents) and to docs/analysis/SLATE_A_2026-11-16.md
(a summary of A1–A5 with numbers). If a fraction display is ever added, it must state its prior.
Prediction PN1: validate passes; engine untouched.

## Results (after the lock; lock committed in build/upgrades git d6528a2)
- PN1 HELD: `python3 -m verify` valid (459 files, 71 warnings); pytest 87 passed; site builds and the served llms.txt carries the new paragraph. No engine file touched.
- Note: docs/analysis/SLATE_A_2026-11-16.md refers to LOCKED_LAMBDA_GALAXY_189.md and LOCKED_BACKWARD_CARERS_FIX.md, which arrive with those two patches.
