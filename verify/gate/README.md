# Gate checker (local prototype, NON-AUTHORITATIVE)

Implements [docs/proposals/GATE_RERUN_RULES.md](../../docs/proposals/GATE_RERUN_RULES.md) up to DIFFERS.

```
(cd engine/starter && npm install)
python3 -m verify.gate cards --label CONJECTURE --out gate-out     # all CONJECTURE cards
python3 -m verify.gate cards --sample 10 --out gate-out            # 10 random cards
python3 -m pytest verify/tests/test_gate.py
```

Per card it:
1. checks the engine sha256 against `rules.code_hash`;
2. reruns the submitted runs and compares output hashes byte for byte (any mismatch rejects the card);
3. runs test, control and null arms at the locked size and half size with gate-assigned seeds;
4. applies Welch z with a Bonferroni threshold over the declared measures (exact compare when deterministic), INERT and null checks;
5. applies BH-FDR q = 0.05 per family, then labels the card.

Outputs: `report.json`, `labels.tsv`, `attestations.json` and the public test key.

**Signatures here are made with a LOCAL TEST KEY.** They have `authoritative: false` and do not promote anything. The prototype never edits cards. A real promotion needs the private key on a server that agents cannot reach.
