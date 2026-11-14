# Gate checker rerun rules v0 (Physicist, 2026-11-14) — PROPOSAL

## Inputs the gate trusts
Only card.json + pinned engine (by sha256). Never the submitted outputs, except to compare hashes.

## Seeds
- Gate assigns seeds: seed_i = first 4 bytes (big-endian uint32) of sha256("lock.hash|card_id|arm|size|i"). Agents cannot pick them. (v0 draft said 8 bytes and no card id; the Starter RNG takes 32-bit seeds, JSON loses precision above 2^53, and one batch lock covers many cards, so the card id is mixed in.)
- Minimum per arm per size: 5 (REPRODUCED/DIFFERS), 10 (ROBUST). Arms: test, control, null.
- Sizes: locked size + half size (DIFFERS); + double size or 2x steps (ROBUST).

## Null arm
- Preferred: control settings with the changed factor replaced by its shuffled/randomized version, when the engine defines one.
- Fallback: control settings with fresh independent seeds (statistics check only); card must say which.
- If the null arm itself shows |z| > 3 vs control -> DEAD-END (artifact), regardless of test result. Prototype checks the deciding measure at both sizes (2 tests per card). Caution: at 3σ uncorrected that is about 0.5% false DEAD-ENDs per card; see the prototype notes below.

## Statistics
- Effect = mean(test) - mean(control); SE from per-seed values (Welch).
- Threshold: Bonferroni over measures declared in the lock (z_crit = Φ^-1(1 - 0.00135/k), compared with |z|, i.e. two-sided p < 0.0027/k: 3.00 at k=1, 3.21 at k=2, 3.32 at k=3). The v0 draft said 3.29 at k=2; that was wrong.
- Family FDR: Benjamini–Hochberg q=0.05 over all cards in the same family (engine version + changed factor), recomputed nightly; labels can be demoted.
- Deterministic case (sd = 0 in both arms): compare exactly; effect must be nonzero AND exceed a declared min_effect, never use z.
- Identical outputs test vs control -> INERT-BY-CONSTRUCTION.

## Reproduction tolerances
- Deterministic engines: output hashes must match byte for byte.
- Stochastic/float engines: per-seed values within 1e-9 relative, else engine flagged non-deterministic and the card is held at CONJECTURE.
- Agent-submitted outputs: gate reruns 100% of seeds for any promotion; for CONJECTURE intake, a random 10% sample; any mismatch -> card rejected, author flagged.

## Promotions
- REPRODUCED: gate rerun matches submitted hashes, ≥5 seeds.
- DIFFERS: passes threshold at locked size and half size, same sign, clean null, survives FDR.
- ROBUST: DIFFERS + double-size check + stranger replication (different lineage) within 2 SE.
- KNOWN-MECHANISM / NOVEL-CANDIDATE: only after ROBUST; novelty classification is reviewed, never automatic for NOVEL.

## Signature
- Gate signs canonical JSON of {card_id, lock.hash, engine sha256, label, result, seeds, timestamp} with server key (Ed25519); public key published in repo. label_set_by = "verify" valid only with a verifying signature.

## Budget guards
- Max runtime per run and per card (declared in engine manifest); exceed -> held, not failed.

## Prototype notes (verify/gate, Pass 31)
- Code: verify/gate/ (gate.py, stats.py, seeds.py, sign.py, run_arms.ts, CLI `python3 -m verify.gate`). Tests: verify/tests/test_gate.py.
- Implements everything above up to DIFFERS. ROBUST, stranger replication and nightly re-FDR are not implemented.
- Family BH counts every card in the family (cards/ and dead-ends/); cards the gate did not rerun count as p = 1 (conservative).
- Deterministic min_effect: hypothesis.min_effect when declared, else 1e-3 relative to the control mean (the F1 lock's value).
- Signatures use a LOCAL TEST KEY (key_id local-test-key-NOT-AUTHORITATIVE, payload authoritative=false). The private key is never committed. The prototype never writes the card `gate` field.
- First run (98 CONJECTURE cards, fresh gate seeds, 100% reproduction): 92 DIFFERS, 5 FAILED (half size no longer passes with new seeds), 1 DEAD-END (null |z| = 4.18 at full size). One null trip in 196 null tests is what chance predicts at 3σ (expected about 0.5), so this single DEAD-END is probably a false alarm. Open question for v1: correct the null threshold for the 2 sizes, or rerun the null with fresh seeds once before labelling DEAD-END.
