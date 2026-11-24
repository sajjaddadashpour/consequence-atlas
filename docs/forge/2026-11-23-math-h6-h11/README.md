# H6–H11 pre-registration locks (Physicist, 2026-11-23)
Source: /workspace/mathematician/hypotheses-2026-11-23/h6plus/ — PROPOSALS.md sha256 01685e6c…5de05 verified; SHA256SUMS.txt (7 code files) verified; all match the copies below.
House rules: steps tagged DERIVED / ASSUMED / IMPORTED / CONJECTURE; verdicts SURVIVED / KILLED / REDUCES-TO-KNOWN / NOT-TESTABLE-YET
(NOT-TESTABLE-AS-DEFINED only as "proposed, pending Sajjad" — not used in any lock). Parameters fixed; no post-hoc calibration.
No decisive statistic was computed by Physicist. Only Sajjad merges. Nothing was sent, posted or pushed.

| Lock | Code (decisive) | Byte-identical to Mathematician? | Expected / recorded verdict |
|---|---|---|---|
| H6-LOCK.md | code/h6_run.py + code/symn.py | yes | slogan KILLED (derived); T1/T2 open |
| H7-LOCK.md | code/h7_ising_locked.py | no — seed bug, canonical control, guard (orig in code/orig/) | REDUCES-TO-KNOWN expected |
| H8-LOCK.md | code/h8_berry_locked.py | no — regimes, SE weighting, power gate, local data (orig in code/orig/) | REDUCES-TO-KNOWN or NOT-TESTABLE-YET (power) |
| H9-LOCK.md | code/h9_petz.py | yes | KILLED (quantum mixed-state uniqueness), theorem-fixed |
| H10-LOCK.md | code/h10_clifford.py | yes | "forces 3+1" KILLED; "compatible" REDUCES-TO-KNOWN |
| H11-LOCK.md | code/h11_run.py + code/h3_run.py (=218a3a9) | h3_run.py yes; h11_run.py new | predictions recorded; open |

Run order suggestion (Mathematician): instruments are inside each script. H6 from code/ (writes ../out). Environments: h6plus/venv6 (H6–H9), venv-h (H11).

## sha256
```
d44886e01c772ba5e1755f1acd8bed807afb1721d6c476400ca83e779b9cbc0d  H6-LOCK.md
f8e4d98c4226301715e705b38d247dc5f039810707408440779e4c3f7387af80  H7-LOCK.md
075c0edf8d760401916e31bb49b35339031ad33a4dc9e47914d36380b2136c53  H8-LOCK.md
acb7ce318d55bc8dfd7d3828d403ffd8fc51f0f0b36a2244eee6c86e3b25d58a  H9-LOCK.md
644eafbe2545e4a58f06d5a9a9f4f0a3682411cb3ee8fc30b12b4dc4e54a1850  H10-LOCK.md
590cbed400f71a7dd295629905b11ac24c093b447fd43cbfe20358d928d53a27  H11-LOCK.md
9024fe910a9b1e5d92e72cd7d9a74358a9dc57b315ea31db55acc2b86343a29d  code/h10_clifford.py
d2145ac5c923f191b73c68d239e98035bae8815c2624a6aa6738f76ca0e85114  code/h11_run.py
6fb03b95e3eb4e07a3b34025ec00062f767c5dc668764469235f93b6f3c84895  code/h3_run.py
fa6ca1d3f8a909de67d5652131e2c35b1740e7b3745c6c6126cd07df43faa379  code/h6_instrument.py
023e62f64bfcbccaf9799c8f9d9aa159206fc9543031cabd807249b1a0e67674  code/h6_run.py
7a1f1e438e071c1010c33922eaaab59e628d7ec830a4aa7214d4654995f33d84  code/h7_ising_locked.py
2e200444775cf56b4177ec500839ffafc4af341d8c1139dc993e21968ca9aa7b  code/h8_berry_locked.py
c1ed3ee51b3f7c14276de30fd4471cd87e91500be5fb582af2e6b47b18dc3a86  code/h8_power_prior.py
071e232b24c95bf2f3fbf6dea27d5d56438b1c2be5bf5a69a1123c91492290e8  code/h9_petz.py
ba098a029a45d8c9849f4a29708839c5fe0fbbc3422bd4cced9f50999b424ed2  code/symn.py
120115f2f54d1a5d5f76b184b7606e265bc25099f56e96d1567b151647bd94af  code/orig/h7_ising.py
3b50f1cf443d9894270c0dfc874b3c6f06a419ad2676a020e67bb40a758a0c4e  code/orig/h8_berry.py
75a1f1a978d5e3eddd16518f661d41a95a40b33782389ba02ec4ed0ce0764807  data/zeros3
10d9f7dab2bbfff6b8befbe6f765969b0b3f38f6110ed1df423931addd52da8f  data/zeros4
250ac4ba722c6face4d07c05777376fc2b9bc021b05232e8f53c91b1eb2b7e0d  data/zeros5
4abc6f2d00653c158f3fee61a09a7c931b51bbe780d61d5f81948ddb4cb4397a  out/h11_smoke.txt
a269e8cbe4a5fe0dc40abe69a6be2cd1e049b4530830bc8701aa49a715c8a45a  out/h8_power_prior.txt
01685e6cd1b5b35e2f0c7ac8a00acbd0fa6abad507abdd249fc1a9bff3c5de05  seen/PROPOSALS.md
fc3b6a2f5934567bea5c5ee0d44cba355b09603a8e9d01bc0845c504bf618855  seen/SHA256SUMS.txt
d520e5ebbb662f5ec02863ab47ef72bc10a2e80bb90a3877178ffc8bb6bb89cf  seen/out_instrument_h10.txt
b3c25ba1ad030fec7eefd0f9d446b7b2f3f8b9f5bf7804a6d41af9a62a669eab  seen/out_instrument_h6.txt
4a1e463503224812dac702443ccd94857cd3cd70b3491a71b99d481b97821e16  seen/out_instrument_h7.txt
a8beaa3c9f7594449df7c1d4c00278c42b028bb58b3d1362692a53b7bcc528ef  seen/out_instrument_h8.txt
16b7cec6423f5ef8d688312414208858161d963ac4158f119798eedafda4b93c  seen/out_instrument_h9.txt
b187e112e9e4e598d2a153618b98dcfd0547bd1777346f03d97662ca59fb43ba  seen/h3_output_a093cf4.txt
460d1044ca1349441302c7e17bf2b98f5bbcb7d97cf3a1ba391586aeb962523e  seen/refs/berry175.txt
```
