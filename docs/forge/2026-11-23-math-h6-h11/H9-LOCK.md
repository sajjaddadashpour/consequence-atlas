# H9 LOCK (formality; theorem-fixed) — "the geometry of ±1 possibilities is unique"
Locked by Physicist, 2026-11-23 ~21:30 CST. Source: seen/PROPOSALS.md §H9. Code: code/h9_petz.py, BYTE-IDENTICAL.
Run: `<venv6 python> code/h9_petz.py --locked-commit <this commit>` (illustration only; the verdict is fixed by theorems).

## 1. Claims and labels
| # | Claim | Tag |
|---|---|---|
| 1 | Classical: on probability simplices, the Fisher metric is the unique (up to scale) metric monotone under Markov maps | IMPORTED (Čencov 1972/AMS transl. 1982; Campbell 1986) |
| 2 | Quantum mixed states: monotone metrics ↔ operator-monotone f (f(1)=1, f(x)=x f(1/x)); an infinite family (SLD/Bures, Wigner–Yanase, Kubo–Mori/BKM, RLD, …) | IMPORTED (Petz 1996, LAA 244, 81) |
| 3 | All agree on commuting (classical/radial) directions and at the maximally mixed state; they differ on tangential directions of mixed qubit states | DERIVED from 2 (c(x,y) = 1/(y f(x/y))) |
| 4 | Pure states: Fubini–Study is unique **given unitary invariance** | IMPORTED (homogeneity of CP^n); the uniqueness is bought by the imported symmetry, not by ±1 |
Label: ESTABLISHED (theorems). PRR "uniqueness" claim: **KILLED for mixed states; SURVIVES classically (REDUCES-TO-KNOWN: Čencov);
on pure states REDUCES-TO-KNOWN only with IMPORTED unitary invariance.**

## 2. SEEN DATA
seen/out_instrument_h9.txt: radial direction equals Fisher 1/(1−r²) at r = 0, 0.3, 0.9 (1.0, 1.098901, 5.263158) for all four f;
tangential at r = 0 all equal 1. The decisive outcome (tangential spread at r > 0) is fixed by claim 2–3; "unseen" is formal only.

## 3. Locked procedure (as code)
f ∈ {SLD (1+x)/2, WY ((1+√x)/2)², KM (x−1)/ln x, RLD 2x/(1+x)}; tangential metric ratio to SLD at r ∈ {0.1,0.3,0.5,0.7,0.9,0.99};
spread > 1e-6 ⇒ "KILLED (quantum uniqueness)", else SURVIVED.
## 4. Verdict (recorded as already decided)
Quantum mixed-state uniqueness: **KILLED** (expected code output; if the code printed SURVIVED that would be a code bug, not news —
the theorem governs; run then = NOT-TESTABLE-YET for the instrument). Classical uniqueness: **REDUCES-TO-KNOWN**.
Use: atlas guard rail — any "PRR fixes a unique geometry" link must be restricted to classical/pure-state readings and name its assumption.
## 5. Citation checks
Campbell, PAMS 98, 135 (1986) Crossref OK. Petz, LAA 244, 81 (1996) Crossref title OK (no abstract in Crossref; characterization
confirmed via author PDF summary / Grasselli–Streater). Čencov, AMS Transl. Math. Monographs 53 (Crossref lists 2000 reprint; orig. 1982).
Braunstein & Caves, PRL 72, 3439 (1994) OK.
