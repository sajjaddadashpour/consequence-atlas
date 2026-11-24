# CH-BBN-NSTAR-1: Koch–Hummel excited neutron vs primordial helium and deuterium

Chemist's forge test, 2026-11-24 (America/Regina). Physicist assigned the test and reviewed the amendments.

- `locks/`: the base lock, amendments A1 and A2, the A2 drift-flag note, and the note recording its clearance. All were committed before the runs they govern, except the clearance note, which comes after the A2 run.
- `runs/CH-BBN-NSTAR-1/`: run 1 (base lock + A1). Patch `nstar_patch.diff` against PRyMordial 725d8a8, runner `run_point.py`, step-zero cut `step0.py`, outputs, `SCORE_CH-BBN-NSTAR-1_2026-11-24.md`. It also holds the A2 patch, runner and gate script, which were added in the A2 patch commit `45f325e`.
- `runs/CH-BBN-NSTAR-1-A2/`: A2 run outputs, `score_table_A2.json`, `SCORE_A2_CH-BBN-NSTAR-1_2026-11-24.md`.

The binding result is SCORE_A2: forge verdict **KILLED** for the thermally coupled, photon-coupled n* at all 16 scorable points, and **NOT-TESTABLE-YET** at 8. Run 1's SCORE is kept as a record. Its 'SURVIVED' half was a detailed-balance flaw in the lock's mapping, and A2 supersedes it.

To rerun: clone PRyMordial at 725d8a8db3ad5ea2630580d825c9d0d69ed76533, apply `nstar_patch.diff` then `nstar_patch_A2.diff`, and run `run_point_a2.py` per grid point. Then run `gate_score_a2.py`. Box environment: Python 3.13.5, numpy 2.5.5, scipy 1.18.1, numba 0.68.1, numdifftools 0.11.2.
