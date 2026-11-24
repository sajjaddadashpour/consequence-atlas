# Provenance: Mathematician H1–H3 (copied into the atlas 2026-11-23, America/Regina)

Source: Physicist's local forge repo `2026-11-23-math-h1-h3-locks` (not the atlas repo).

| commit | message |
|---|---|
| `218a3a9` | LOCK: Mathematician H1-H3 (zeta symmetry class, complex phases, spectral dimension) - pre-registration, nothing scored |
| `a093cf4` | OUT: Mathematician H1-H3 results scored by locked verdict mappings (runs 20:15-20:54 CST Nov 23) |

Checks done before copying (2026-11-23 ~21:10 CST):
- `git diff 218a3a9 a093cf4 -- H1-LOCK.md H2-LOCK.md H3-LOCK.md code/` is empty: the locks and runners did not change after the lock commit.
- The source working tree was clean at `a093cf4`; `out/` here is byte-identical to `out/` at `a093cf4`.
- Every copied file was checked against the source with `sha256sum -c` (list below).
- `code/h2_count.py` was rerun on the box; its stdout matches `out/h2_output.txt` byte for byte. H1 and H3 were not rerun here (H3 takes minutes and H1 needs the zero tables, see below).

## sha256 of the copied files
```
bfd4950745684a40c5680ae37226cb1003a35c1bab1400071f75bfb740721f19  H1-LOCK.md
4191b51660e43d39fd21018590812446ac03eb21b655292d8fbbb492c7d71bb4  H2-LOCK.md
a8b13461ea5d2994c92c31aababab9ec07f99962a1418a59238074ac84af1a68  H3-LOCK.md
fbdcc3deb5f06bd105cc732dd51a9652da434f1abc5288d1974cd511d1e914f0  README.md
86cbe214f31c7522acdf33b65873a15e723c4b3b681f2a94f2808447fd90f457  code/h1_run.py
75ceedc2d0ca927701b9265d5a38f015aeab60cdb949349c4e7c194c60b92cd1  code/h2_count.py
6fb03b95e3eb4e07a3b34025ec00062f767c5dc668764469235f93b6f3c84895  code/h3_run.py
8be7cf2f41bbeaa5c49b45f8be22b6cad26b7a2ccc3a63121c1a362874361763  out/h1_console.log
570471837b3d50e7c7ab8508b499bf92df5842854d6ec06f7bb16c8d8b7c5788  out/h1_output.json
8be7cf2f41bbeaa5c49b45f8be22b6cad26b7a2ccc3a63121c1a362874361763  out/h1_output.txt
c714fa364a82e02bc68a2a9cf041526b69d66bac6cd1b920b592022f9c564fb9  out/h2_output.txt
b187e112e9e4e598d2a153618b98dcfd0547bd1777346f03d97662ca59fb43ba  out/h3_console.log
2c19cacf9d0f73f4c1ee2e9614b8eae96ce8377ff6761ecb309164cf6c34732e  out/h3_output.json
b187e112e9e4e598d2a153618b98dcfd0547bd1777346f03d97662ca59fb43ba  out/h3_output.txt
b1b4893e5afea14baaf307daf0af4bd29f46143ac231dfddead9667f90671cdf  out/h3_smoke.txt
```

## Left out
- `data/zeros3`, `data/zeros4`, `data/zeros5` (Odlyzko's zeta-zero tables, about 0.5 MB together). They are Odlyzko's files, not atlas data, so they are not relicensed here. To rerun H1, download them from https://www-users.cse.umn.edu/~odlyzko/zeta_tables/ into `data/` next to `code/` and check:
  ```
  75a1f1a978d5e3eddd16518f661d41a95a40b33782389ba02ec4ed0ce0764807  data/zeros3
  10d9f7dab2bbfff6b8befbe6f765969b0b3f38f6110ed1df423931addd52da8f  data/zeros4
  250ac4ba722c6face4d07c05777376fc2b9bc021b05232e8f53c91b1eb2b7e0d  data/zeros5
  ```
- `code/__pycache__/` (compiled bytecode).

Absolute paths in README.md and the locks (`/workspace/...`) point at the forge machine and are kept as written; the locks are copied verbatim.

## Notes for readers
- Verdict words in these files (REDUCES-TO-KNOWN, NOT-TESTABLE-YET, NO-WINDOW, SATURATED) are forge verdicts. They are not atlas labels. Atlas records that use these results are listed in `docs/forge/results-2026-11-23.md`.
- `out/h3_output.txt` prints "RULE R3: KILLED -- NO-WINDOW in 3/3 seeds". R3 is a causal-set control that imports d = 4 by hand. Under H3-LOCK §6 it is context only, so the atlas reports it as NO-WINDOW 3/3, not as a PRR verdict.
- REPORT.md numbers the spectral-dimension item H4; the locks call it H3.
