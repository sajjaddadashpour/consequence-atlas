# H10 LOCK (formality; derivation audit) — can PRR's sign choice force one time dimension?
Locked by Physicist, 2026-11-23 ~21:30 CST. Source: seen/PROPOSALS.md §H10 (which says "no lock needed"; locked anyway on
Physicist's instruction, so the verdict cannot drift). Code: code/h10_clifford.py, BYTE-IDENTICAL.

## 1. Convention (stated)
Cl(p,q): p generators with e² = +1, q with e² = −1. Then Cl(p,q) ≅ M_k(ℝ) or M_k(ℝ)⊕M_k(ℝ) iff (p − q) mod 8 ∈ {0, 1, 2}; ≅ M(ℝ)
(simple real matrix algebra) iff (p − q) mod 8 ∈ {0, 2}. Cl(3,1) (+++−) ≅ M₄(ℝ) (real Majorana spinors, "mostly plus");
Cl(1,3) (+−−−) ≅ M₂(ℍ). IMPORTED (Lounesto 2001; Berg et al. 2001). Under the opposite convention the labels swap — the physics
statement "the signature with real 4×4 rep is the mostly-plus one" does not.

## 2. Claims and labels
| # | Claim | Tag |
|---|---|---|
| 1 | mod-8 periodicity table | IMPORTED |
| 2 | PRR criterion "real (Majorana) spinor structure": p − q ≡ 0, 2 mod 8 | ASSUMED (not derived from A1) |
| 3 | q = 1 and 2 ≤ p+q ≤ 11 (p ≤ 10): p − 1 ≡ 0, 2 mod 8 ⇒ **p ∈ {1, 3, 9}** | DERIVED |
| 4 | Choosing p = 3 needs Tegmark's stability / complexity arguments | IMPORTED (Tegmark 1997, CQG 14, L69) |
| 5 | q = 1 itself (hyperbolicity / predictability) | IMPORTED (Tegmark 1997) |
| 6 | p + q = 4 | ASSUMED (by hand) |

## 3. SEEN DATA
seen/out_instrument_h10.txt: p+q = 4 table: Cl(0,4) M(ℍ), Cl(1,3) M(ℍ), Cl(2,2) M(ℝ), Cl(3,1) M(ℝ), Cl(4,0) M(ℍ); real 4×4 rep found
exactly for (2,2), (3,1). The q = 1, p ≤ 10 enumeration was done on sight (SEEN). Nothing unseen remains.

## 4. Verdicts (recorded as already decided)
- "PRR's sign choice + realness + one time **forces** 3+1": **KILLED** ((1,1), (3,1), (9,1) all survive the criterion).
- "PRR is **compatible** with 3+1 and gives the sign convention spinor-level content (Pin(3,1) ≠ Pin(1,3))": SURVIVES as
  **REDUCES-TO-KNOWN / ANALOGY-ONLY**.
- Numerology flag: the criterion was chosen after seeing it picks (3,1) at p+q = 4 — post-hoc; any future PRR-internal argument
  for p = 3 must be locked before anyone checks it against (1,1)/(9,1).
- Tension with H2 (complex QM forced) noted: Majorana reality sits inside complex QM; compatible, but must be stated.
## 5. Citation checks
Tegmark, Class. Quantum Grav. 14, L69 (1997), arXiv gr-qc/9702052 — abstract read: one time dimension (hyperbolicity /
predictability); >3 space unstable, <3 too simple. OK. Lounesto, Clifford Algebras and Spinors, CUP 2001, 2nd ed. — OK.
Berg, DeWitt-Morette, Gwo & Kramer, Rev. Math. Phys. 13, 953 (2001) — Crossref OK.
