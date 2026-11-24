# Provenance: CH-BBN-NSTAR-1 (copied into the atlas 2026-11-24, America/Regina)

Source: Chemist's local locks repo `/workspace/chemist/locks`, which is not the atlas repo and was not pushed. Author: Chemist <chemist@local>.

| commit | message |
|---|---|
| `f30de3e` | Lock CH-BBN-NSTAR-1: Koch-Hummel excited neutron vs He-4/D, pre-run, PRyMordial 725d8a8 |
| `f2d3690` | CH-BBN-NSTAR-1 A1: grid aggregation, two thermal cuts, control tolerance vs PRyMordial Fig.3; pre-run |
| `d3e2b4a` | CH-BBN-NSTAR-1: patch diff + runner, committed before model runs |
| `0f15451` | CH-BBN-NSTAR-1: run outputs + SCORE (MIXED by tau_e; mapping detailed-balance flaw declared) |
| `45f325e` | CH-BBN-NSTAR-1 A2 patch: detailed-balance p->n multiplier on total p->n rate, gate exports, A2 runner + gate script; SM-only check run (no model points) |
| `89eece1` | CH-BBN-NSTAR-1 A2: detailed-balance p->n correction, run 1 declared seen, G1/G1b gates (G2 diagnostic), regression rule; pre-run |
| `e95528d` | CH-BBN-NSTAR-1 A2 note: 3% G2_sm drift flag (reporting only), pre-run |
| `b3c1eb0` | CH-BBN-NSTAR-1 A2: 24 runs + SCORE_A2 (KILLED equilibrium realization; 8 NTY; drift flag raised, diagnosed as freeze-out lag) |
| `9fc2211` | CH-BBN-NSTAR-1: drift flag cleared by Physicist (lag reading CONJECTURE) |

Checks done before copying:
- Every copied lock, note and run file was compared byte for byte (`cmp`) with the source repo at `9fc2211`, and the source working tree was clean.
- Lock sha256s match those recorded at lock time: base `691a788a…8bbb`, A1 `de89bf0e…2801`, A2 `90f084a0…0411`, drift note `48eb1801…4462`.
- Code: PRyMordial pinned at `725d8a8db3ad5ea2630580d825c9d0d69ed76533` (not copied here). Only the patch diffs and runners are included.
- Nothing was rerun for this copy.

## sha256 of the copied files
```
b5a81c8258d51452c3e6f5a4f6dbadefaa73342bf689c5620efb1a1e4a74a2ab  README.md
de89bf0e7bd9c7416f0af32c60804cfbf1a41081287151c9d95804e2e33e2801  locks/AMENDMENT_A1_BBN_EXCITED_NEUTRON_2026-11-24.md
90f084a01ec590db97d9235cea7c5aa452230145bda44dd8ad9759a983d60411  locks/AMENDMENT_A2_BBN_EXCITED_NEUTRON_2026-11-24.md
691a788a8c9ebdf6793a04842219299771127e9d358cb9bc83dffff8f2168bbb  locks/LOCK_BBN_EXCITED_NEUTRON_HE4_2026-11-24.md
48eb1801cfd5e5ab18e64bda01fca6c26ed72788ab0e72f7aecfaa2895d94462  locks/NOTE_A2_DRIFT_FLAG_2026-11-24.md
a850471ee478e28ca9929cbddd63dccc8e715216cdcd61ae4397d4afec5a7467  locks/NOTE_A2_DRIFT_FLAG_CLEARED_2026-11-24.md
53fcc3ee277a13cd7ea4e4c28337c461020b4a5bcc1f600c05c4893b5054dd3e  runs/CH-BBN-NSTAR-1-A2/SCORE_A2_CH-BBN-NSTAR-1_2026-11-24.md
0728a7217bf15e970369429f83a072df8e13f03f35b941f6f91b9537b12874c3  runs/CH-BBN-NSTAR-1-A2/SM_hooksNone_A2patch.json
c08d94fef36d5cbd4933aa485ba0173bb9d59c21a3939416a59fb0453864d404  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g1_tr0.990304_A.json
a4cefa812bcf85878cf9f230c69be0dd6b101eaa22adccf341ec7c016d530c4b  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g1_tr0.990304_B.json
371836024357f7586452e1f8100321481e9d1dcb14e7b19c7b0feeb6df6ab1ab  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g1_tr0_A.json
67beacbc70bcf6356082143232c3685e76776c602cd51407b9233e87e267d50f  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g1_tr0_B.json
219e1bc342d75e97ef225a55e61a07a51567435cb81dc22508d5ada3fe9891d9  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g2_tr0.990304_A.json
9f4c35dce35f8c17efdf7311132154b70e1899068327595f76dc5e21cb61d58f  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g2_tr0.990304_B.json
5cd7576f0398be74957e1027cee47af8c0f958c82b23632ac960b6772761342b  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g2_tr0_A.json
190a9009cc06c915d00c6ed79d572386759723c7b02f591cdf4207f821f2843e  runs/CH-BBN-NSTAR-1-A2/grid_dE0.04_g2_tr0_B.json
b05cb3d0cd51c054083468013779f70d4df16d0e908504e91c9064ae138d5c41  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g1_tr0.990304_A.json
ddb00970607d41dc8884893027fbd019712fa722c64a4cdaafa02df47433226d  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g1_tr0.990304_B.json
8076dd7591132d5c391456c6fc72fcef5af1291d863fcfe73c87aabc2439740e  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g1_tr0_A.json
e6744cebb215a9f31ebebdfc8bc49e227bb79982d5a0710170ca0ce66cd2c90a  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g1_tr0_B.json
498f32e1be9b3244e5316937de02da489a2c4a8683369f86b5581997a823d3c8  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g2_tr0.990304_A.json
11ec60e0a4ed6aa5d12825f5ea61d5b0b31735feb8468e60a99c9b1eaa9f9f3f  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g2_tr0.990304_B.json
73cf2e0acf14070b48531724ade2e641704dd645f97cc81a37fc1ea4cd17d9f3  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g2_tr0_A.json
ccef88156718bef1779092f2a10213223bdb6cc9b9a00226343a08c03d869ffa  runs/CH-BBN-NSTAR-1-A2/grid_dE10000_g2_tr0_B.json
51ba14f82fea8959f4ff15503c1eefd2f5ab292d31d43678b094e627ce96075a  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g1_tr0.990304_A.json
a15c50eecba4cf29966592b045dbc94316b153812120b244d2a629a25df42abb  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g1_tr0.990304_B.json
245ab1d0c7978f31164e1a8f6e90722addcab7d7ef7f2b763acc08f1abfe1d53  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g1_tr0_A.json
f3d34fb4072cc00b05f251b27ee16b28445c0429407703a367e936be1e193d1b  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g1_tr0_B.json
8e9fcb51d52905a0c6e0307afbc8a386f67b67a292603b2dbdbdfc14bd9d1b2b  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g2_tr0.990304_A.json
ca5105377cf5466a51556f0f22ede19dfe3a8ce071442ad36c629d4318eb3749  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g2_tr0.990304_B.json
cdfcc2b16619fed22e5099bf4e1cf8811f3b847fefc77f6715350e387dc6711e  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g2_tr0_A.json
da0eb7c1499c58a0a7938fcca46bf7f099b1e2fee5d83ad7185dfeefbf6691fa  runs/CH-BBN-NSTAR-1-A2/grid_dE30000_g2_tr0_B.json
470889fb62772f1681160c8a97962422b32a172d3d6968b406600dabdc2258a3  runs/CH-BBN-NSTAR-1-A2/score_table_A2.json
1d83851493098b22a1fab743d82bc91013c8053052c97e60444630003aa24705  runs/CH-BBN-NSTAR-1/SCORE_CH-BBN-NSTAR-1_2026-11-24.md
13af813dbc652ee66f9d4d34303a00b99df0b8075f719d19a502304de18a0d02  runs/CH-BBN-NSTAR-1/control.log
639e883b98451d3059768029495b11c19f9917db9685a6f78b14a015a7826cc8  runs/CH-BBN-NSTAR-1/control_SM_pristine.json
ebb5eae80834eae9004d1aa6338ab2059e37f0ace0696e71b04b690eef9c85e9  runs/CH-BBN-NSTAR-1/gate_score_a2.py
29bb24ceaa968772c7a08e6f4eff0a622b542bb8ea5c13e4a59ab972bfeda317  runs/CH-BBN-NSTAR-1/grid.txt
51787b1774cf63213240723760c016a0b6a195a8270e2d0516aaa97502b6dc7c  runs/CH-BBN-NSTAR-1/grid_dE0.04_g1_tr0.990304_A.json
ef9e334daef477bef16156e70e87b3418e25c15ab6108f51a055dfafae193bb0  runs/CH-BBN-NSTAR-1/grid_dE0.04_g1_tr0.990304_B.json
8f36eff239f59114b046861c9002db148cb79e9b74368a74c148d8aff99749b0  runs/CH-BBN-NSTAR-1/grid_dE0.04_g1_tr0_A.json
ae9a06e221008bd98f25b1cd9fc4e5126573abc33c5ab07bce8ad48ca034eb87  runs/CH-BBN-NSTAR-1/grid_dE0.04_g1_tr0_B.json
85ac9577e5c8d34b57671f62e5556fc0c1c4faebbdf89bf096d4db74d6983c38  runs/CH-BBN-NSTAR-1/grid_dE0.04_g2_tr0.990304_A.json
4fac3a9cb68e25ce0968c92064644b8239dea2e8e2f5e288f024f7058544ba5c  runs/CH-BBN-NSTAR-1/grid_dE0.04_g2_tr0.990304_B.json
d26f697b48cb0e51a677b17adfcf9e4795fe20fd081beb3229ed834fd052665b  runs/CH-BBN-NSTAR-1/grid_dE0.04_g2_tr0_A.json
323fca579aeef6cc9a4a13c4c5b17cc7398ff6dd38c16685f3c71fe864b5ed4a  runs/CH-BBN-NSTAR-1/grid_dE0.04_g2_tr0_B.json
b8c135fabf0aa4122f8287c7bff89b953e0442be6b51cb6f829aa787bf7f3a5c  runs/CH-BBN-NSTAR-1/grid_dE10000_g1_tr0.990304_A.json
e64d123b92bd31ae5e0cbb839116257471ffd0ddf4b6c2c046ddf8161caa2070  runs/CH-BBN-NSTAR-1/grid_dE10000_g1_tr0.990304_B.json
26e6aaab9ee335bc28865d82750eb14392b6d8f448e0773f220826e16ce0afc3  runs/CH-BBN-NSTAR-1/grid_dE10000_g1_tr0_A.json
67737d0cdb7c62c3a02be177123684640ba542860f26805dd74da6d1369953c7  runs/CH-BBN-NSTAR-1/grid_dE10000_g1_tr0_B.json
2f7ca489be33b7a9fceb6e9ba8f801f88388618faa3b506cb1db9c35b8ea9f17  runs/CH-BBN-NSTAR-1/grid_dE10000_g2_tr0.990304_A.json
5c2915154adc3a3d19747f934ac66d1ce6a20332969659438e495072b5e82ef9  runs/CH-BBN-NSTAR-1/grid_dE10000_g2_tr0.990304_B.json
3617e1735abee4afc52eb38774da41ea2b73a2f6df3350b9943829f7aeb3c48e  runs/CH-BBN-NSTAR-1/grid_dE10000_g2_tr0_A.json
a682758a803e605abdc7da400c367fcef74ff6c26f030ffc702427f44ae02eb2  runs/CH-BBN-NSTAR-1/grid_dE10000_g2_tr0_B.json
f910f8a53fd2c7a6e0b286a6dabfc0d17315c7e74f3e7a319a25192292da0cef  runs/CH-BBN-NSTAR-1/grid_dE30000_g1_tr0.990304_A.json
023f9e206e76ae9e5a3d071de0ed2cec7e2bcc9af87d4e6066908adac5c63042  runs/CH-BBN-NSTAR-1/grid_dE30000_g1_tr0.990304_B.json
171d8de4739921fbec776a0da078e188eeb82a111cce5ca132a50c8afced90e8  runs/CH-BBN-NSTAR-1/grid_dE30000_g1_tr0_A.json
5c7a0b7af74bc95be7e2d125c583e91284936c1b5d1e6473ad0264b2d02dd789  runs/CH-BBN-NSTAR-1/grid_dE30000_g1_tr0_B.json
ba05164ec9b315baeeb8b90dad61077fda6a9c3357da46386e8abbd457b4a350  runs/CH-BBN-NSTAR-1/grid_dE30000_g2_tr0.990304_A.json
a8ca43d491ae1c976c1580347def1f186844098d1f5b5a67588f4dc105b8e54f  runs/CH-BBN-NSTAR-1/grid_dE30000_g2_tr0.990304_B.json
b51a3c57a6152c781bf825e27086fd5742eb1b6238b66faa14fa2d9904ef68dc  runs/CH-BBN-NSTAR-1/grid_dE30000_g2_tr0_A.json
91f5ee865998130beea9ddb76207e4f2eecdeb73a2396dfea47461151e324691  runs/CH-BBN-NSTAR-1/grid_dE30000_g2_tr0_B.json
04c1029b80735ddb249143b3e9a8d0c92e6f20d74675263937c2ad8f8a8febc9  runs/CH-BBN-NSTAR-1/nstar_patch.diff
8868dcb7499cbbec5478ab24f2c2d0dc9a68a9251cab33a624075ab969687d16  runs/CH-BBN-NSTAR-1/nstar_patch_A2.diff
070469766b55a5d16680e5cb08f2782e95ca47c3910c49542b9b576f6bf5a1d2  runs/CH-BBN-NSTAR-1/patchcheck_identity.json
bac3405ed3eec594cd687aa11f8480e308c9584563341a487945697c42147d9c  runs/CH-BBN-NSTAR-1/run_point.py
0c8e61bcc807d9269d20ae96502cd2fc630b832bfbb7d0f4fdf7a313acf5c077  runs/CH-BBN-NSTAR-1/run_point_a2.py
cc9a68d38e1418bac74bcf5c8e5c58f32184f9d88fd655dfbec310655817be22  runs/CH-BBN-NSTAR-1/score_table.json
262756b0910e2b3aa15a764c0b3c33f2e6cec0baee7874d8b00abef9894e939f  runs/CH-BBN-NSTAR-1/step0.json
efa2f41c3ef465a9b36f4ae6e7b5aed6d4b4e6bd2d7597f9435e3f201e313f27  runs/CH-BBN-NSTAR-1/step0.py
```
