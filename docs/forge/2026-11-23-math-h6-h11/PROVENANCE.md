# Provenance: Mathematician H6–H11 (copied into the atlas 2026-11-23, America/Regina)

Source: Physicist's local forge repo `2026-11-23-math-h6-h11-locks` (not the atlas repo). Errata from Mathematician's working folder `hypotheses-2026-11-23/h6plus/`.

| commit | message (abridged) |
|---|---|
| `14e7826` | LOCK H6-H11: pre-registration (Mathematician proposals 01685e6c; h7/h8 locked copies; h11 on h3 pipeline 218a3a9) |
| `3b8fd8d` | OUT: Mathematician H6-H11 results scored by locked mappings (runs 21:25-22:35 CST Nov 23) … Executor interrupted after launch; H7 finished unattended; locked code untouched. |

## Checks (2026-11-23 ~22:45 CST, by the atlas PR author)
- Source working tree clean at `3b8fd8d` (HEAD).
- `git diff 14e7826 3b8fd8d -- . ':(exclude)out'` is empty. Between the two commits only `out/` files were added (12 files). Locks, README, `code/`, `code/orig/`, `seen/` and `data/` are byte-identical to the lock commit.
- All 32 sha256 values listed in `README.md` match their files (`sha256sum -c`).
- Every file copied here matches its source by sha256 (list below).
- Reruns on the box, in a separate clone, with Mathematician's environments (`h6plus/venv6`, `venv-h`):
  - H6 full locked run (`code/h6_run.py --locked-commit 14e7826`, 28 s): `out/h6_result.json` identical except the `started` timestamp.
  - H8 full locked run (`code/h8_berry_locked.py`, 7 s, with the local zero tables): `out/h8_result.json` byte-identical; console output identical to `out/logs/h8.log`.
  - H9 (`code/h9_petz.py`): `out/h9_result.json` byte-identical; console identical to `out/logs/h9.log`.
  - H10 (`code/h10_clifford.py`): output identical to `out/h10_output.txt`.
  - H11 smoke (`code/h11_run.py --smoke`): `out/h11_smoke.txt` byte-identical.
  - Not rerun: H7 (estimated 0.5–1.5 h) and the full H11 run (estimated 1–2 h).

## Left out
- `data/zeros3`, `data/zeros4`, `data/zeros5`: Odlyzko's zeta-zero tables (https://www-users.cse.umn.edu/~odlyzko/zeta_tables/). No redistribution licence is stated, so they are not copied (same as H1–H3). `code/h8_berry_locked.py` checks these sha256 values and aborts if they differ:
  ```
  75a1f1a978d5e3eddd16518f661d41a95a40b33782389ba02ec4ed0ce0764807  data/zeros3
  10d9f7dab2bbfff6b8befbe6f765969b0b3f38f6110ed1df423931addd52da8f  data/zeros4
  250ac4ba722c6face4d07c05777376fc2b9bc021b05232e8f53c91b1eb2b7e0d  data/zeros5
  ```
- `seen/refs/berry175.pdf` and `seen/refs/berry175.txt`: the full text of Berry, Nonlinearity 1, 399 (1988), doi:10.1088/0951-7715/1/3/001 (publisher copyright). sha256 `c0fe87b6edd907887d52df4dfbc26163b06e9f6c08fad840da783b7defbd8e31` (pdf) and `460d1044ca1349441302c7e17bf2b98f5bbcb7d97cf3a1ba391586aeb962523e` (txt; also listed in README.md).
- `code/__pycache__/` (compiled bytecode and numba caches) and the source repo's `.gitignore`.

## Added
- `PROPOSALS-errata.md` (Mathematician, sha256 `d381586003fb4b4c80af5f2da5bc98237216fc3c2e1309f7e3b4172ee1b53d8c`). It corrects wording in `seen/PROPOSALS.md` without editing the locked file: (a) Berry instrument label; (b) the "GUE 15–82%" figure is from Hess's GitHub README, not the Zenodo abstract; (c) the Bläser–Dell easy-point list comes from the Kotek–Makowsky–Ravve survey, and two scope questions are unverified; (d) y = −2 is ⊕P-hard by Mertens–Moore, not #P-hard; (e) `seen/refs/10.1137_S0097539798332152.json` is a failed lookup for a wrong DOI (correct Bürgisser DOI 10.1137/S0097539798367880).

## Notes for readers
- Verdict words in these files (SURVIVED, KILLED, REDUCES-TO-KNOWN, NOT-TESTABLE-YET, NO-WINDOW, SATURATED, IMPRECISE) are forge verdicts, not atlas labels. Atlas records are listed in `docs/forge/results-2026-11-23-h6-h11.md`.
- Absolute `/workspace/...` paths in the locks point at the forge machine and are kept verbatim.
- H11 is not in `seen/PROPOSALS.md`; its rules come from Physicist relaying Mathematician's proposal (H11-LOCK §1).

## sha256 of the copied files
```
644eafbe2545e4a58f06d5a9a9f4f0a3682411cb3ee8fc30b12b4dc4e54a1850  H10-LOCK.md
590cbed400f71a7dd295629905b11ac24c093b447fd43cbfe20358d928d53a27  H11-LOCK.md
d44886e01c772ba5e1755f1acd8bed807afb1721d6c476400ca83e779b9cbc0d  H6-LOCK.md
f8e4d98c4226301715e705b38d247dc5f039810707408440779e4c3f7387af80  H7-LOCK.md
075c0edf8d760401916e31bb49b35339031ad33a4dc9e47914d36380b2136c53  H8-LOCK.md
acb7ce318d55bc8dfd7d3828d403ffd8fc51f0f0b36a2244eee6c86e3b25d58a  H9-LOCK.md
d4c3fc3df92dadc532c878f1a8b5cff38ed4229542a2ace7e9dc6054df486ff6  README.md
9024fe910a9b1e5d92e72cd7d9a74358a9dc57b315ea31db55acc2b86343a29d  code/h10_clifford.py
d2145ac5c923f191b73c68d239e98035bae8815c2624a6aa6738f76ca0e85114  code/h11_run.py
6fb03b95e3eb4e07a3b34025ec00062f767c5dc668764469235f93b6f3c84895  code/h3_run.py
fa6ca1d3f8a909de67d5652131e2c35b1740e7b3745c6c6126cd07df43faa379  code/h6_instrument.py
023e62f64bfcbccaf9799c8f9d9aa159206fc9543031cabd807249b1a0e67674  code/h6_run.py
7a1f1e438e071c1010c33922eaaab59e628d7ec830a4aa7214d4654995f33d84  code/h7_ising_locked.py
2e200444775cf56b4177ec500839ffafc4af341d8c1139dc993e21968ca9aa7b  code/h8_berry_locked.py
c1ed3ee51b3f7c14276de30fd4471cd87e91500be5fb582af2e6b47b18dc3a86  code/h8_power_prior.py
071e232b24c95bf2f3fbf6dea27d5d56438b1c2be5bf5a69a1123c91492290e8  code/h9_petz.py
120115f2f54d1a5d5f76b184b7606e265bc25099f56e96d1567b151647bd94af  code/orig/h7_ising.py
3b50f1cf443d9894270c0dfc874b3c6f06a419ad2676a020e67bb40a758a0c4e  code/orig/h8_berry.py
ba098a029a45d8c9849f4a29708839c5fe0fbbc3422bd4cced9f50999b424ed2  code/symn.py
d520e5ebbb662f5ec02863ab47ef72bc10a2e80bb90a3877178ffc8bb6bb89cf  out/h10_output.txt
a1ca106106717db290cfc6fc291320d14541410abc7b493bb93f8f3d04dace30  out/h11_output.json
e3e4e193b98c4780a3650973b1c04aa790fee528382f153a558be108cd912f67  out/h11_output.txt
4abc6f2d00653c158f3fee61a09a7c931b51bbe780d61d5f81948ddb4cb4397a  out/h11_smoke.txt
60cc56bf27de3563838b389abd00c2266afbb405eb9bfd6b6c782fd7f773dd9f  out/h6_result.json
6d224d7e6d446063d6422867c0f64f17dd8c05c21af68150ef1919709e63f5fb  out/h7_result.json
a269e8cbe4a5fe0dc40abe69a6be2cd1e049b4530830bc8701aa49a715c8a45a  out/h8_power_prior.txt
b409326e2f7c2c12a138f4e1eed83c9c767bd7823fe2517fc5ab2ff5789f8431  out/h8_result.json
25839d36ff0478444d6006eed7e401c1b2f2b66dcbc86c7284765e9da10e2e04  out/h9_result.json
e3e4e193b98c4780a3650973b1c04aa790fee528382f153a558be108cd912f67  out/logs/h11.log
0a5681289bb4bc86dc81ff0b95e8e61c7e8e61ec9e0620bc269fd410f7388de3  out/logs/h6.log
5606d2e41d01f0bbc7526657ffd3ff2911fdfbf96a7afd40684f68fcce7e239b  out/logs/h7.log
331f8a50091be05dda28a3e11bd942fedc5ef1402071db578bf5a7ead8cfaeab  out/logs/h8.log
f84f631e4d3557348e3fdcb56b24a4b103023eefdbe0d81744b1bfef853e4d86  out/logs/h9.log
01685e6cd1b5b35e2f0c7ac8a00acbd0fa6abad507abdd249fc1a9bff3c5de05  seen/PROPOSALS.md
fc3b6a2f5934567bea5c5ee0d44cba355b09603a8e9d01bc0845c504bf618855  seen/SHA256SUMS.txt
b187e112e9e4e598d2a153618b98dcfd0547bd1777346f03d97662ca59fb43ba  seen/h3_output_a093cf4.txt
d520e5ebbb662f5ec02863ab47ef72bc10a2e80bb90a3877178ffc8bb6bb89cf  seen/out_instrument_h10.txt
b3c25ba1ad030fec7eefd0f9d446b7b2f3f8b9f5bf7804a6d41af9a62a669eab  seen/out_instrument_h6.txt
4a1e463503224812dac702443ccd94857cd3cd70b3491a71b99d481b97821e16  seen/out_instrument_h7.txt
a8beaa3c9f7594449df7c1d4c00278c42b028bb58b3d1362692a53b7bcc528ef  seen/out_instrument_h8.txt
16b7cec6423f5ef8d688312414208858161d963ac4158f119798eedafda4b93c  seen/out_instrument_h9.txt
d0e09071885dd9b551315af00168ef446fa5161b9cd08303914fa03f280ed78a  seen/refs/10.1016_0024-3795_94_00211-8.json
3b4bc049c60a8987ff452534450995f7e0b9b22c39189e3634063fe0ff446ac2  seen/refs/10.1016_0304-3975_79_90044-6.json
76369197094089bc96a6b6a5ae390b5a656c58b995db8e0316e3c1edec7a5527  seen/refs/10.1063_1.1665530.json
e70a827accc211cd2f9a30cf025b69ec71f95a85a775bf38fbf5f891943b280d  seen/refs/10.1088_0264-9381_14_4_002.json
6c3f2978179b9935c5aca1f5e9c0d8a0f4ae6107c28e51fc7c99d19e5b8560cc  seen/refs/10.1088_0951-7715_1_3_001.json
e6a942b6f23a26b36ae2df9d399acd7a64bfe4022636a35bb51880094dc17e3c  seen/refs/10.1090_S0002-9939-1986-0848890-5.json
ba0ebd8f338af03c27eee51e8dc509056adabf268f283fcd38daf16efb70725a  seen/refs/10.1098_rspa.1985.0078.json
de00b783c2d98f690ef3a7413d76bbc569e1e708c299590b71197d0f0f106fd6  seen/refs/10.1103_PhysRev.60.252.json
c455c7fc7554a8b3149d99a4c31f40560d53bb8b685add647c0eb385f1c516dd  seen/refs/10.1103_PhysRev.65.117.json
2c6f46527551f67603e39468eaf4f969705ddd63c86a9b3c51be2eeb4111947d  seen/refs/10.1103_PhysRevLett.94.170201.json
ae8462e3af85ca7577aaa97ff22a194f9dfd7fada58cf4944b53d2fdfa7b1f92  seen/refs/10.1137_S0097539798332152.json
984e4d3c56423a650d7492bcf55417d6b4f122fe11469c18ea77530392ba7e40  seen/refs/10.1142_S0129055X01000922.json
56fa9e0f788b9e8313d7ad0359be8a0ed5cd7e0f74b061244b18169db89e3501  seen/refs/10.1145_3406325.3451124.json
1f1679e407d15c389dfd810d2336ee591501079a5e84245730c0ae83977994bd  seen/refs/10.1145_800135.804419.json
15c849172aa92f3ac4b872d530c03207671230a4f6e9698bd31dc85175bd6430  seen/refs/10.4086_toc.2013.v009a004.json
b234b8d1f23125e11585c825c305ce6531bea6d39e8e5c3ff49e0ff1e29997a0  seen/refs/10.4086_toc.2013.v009a006.json
```
