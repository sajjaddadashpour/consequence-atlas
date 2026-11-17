# LOCKED: backward chain 'carers' made consistent with the forward engine (docs/data only)
Locked 2026-11-16 by Physicist, before editing. Evidence: slate A5 (build/slateA/a5_backward.json, a5_R_not_F_list.txt).
Four bugs, where the bridge text disagrees with the forward links:
1. Hydrogen is given as an α-only bound (0.0108–0.0199 "at our β") plus β < 1/81. Forward l.s05.hydrogen-stable is joint in
   (α, β): stable iff m_n − m_p (= Q + E·α/α0) > m_e = β m_p. At our α this needs β ≲ 0.0021 (FAIL above; CONTESTED from 0.00114).
2. The pp chain is given only as the contested range −4% to +3.4%. It omits the forward hard FAIL at s ≥ +0.5 (l.s08.pp-chain).
3. Negative Λ is given only as "above about −7 × ours (CONTESTED)". It omits the forward hard FAIL below −53.9 (l.s11.lambda-lifetime, 5 Gyr benchmark).
4. The α window is stated at our β only. Forward bounds move with β: the stellar lower bound is α²β ≥ 2.62e-12, and the hydrogen
   upper bound is α < α0·(Q+ΔQ − β m_p)/(−E−ΔE) at the FAIL edge, i.e. 0.0199 at our β and 0.0243 as β → 0.
Change: rewrite B4 and B5 text to state each condition in its general form, with the forward link id and label. Λ is referenced
to the l.s07g.lambda-galaxies bound by id, with no number, so this patch does not depend on the Λ revision. No engine, stage or
link change.
Prediction BW1: re-running the A5 comparison with the region read from the new text gives 0 points in the backward region but
forward-blocked, and 0 points forward-reached but outside the backward region, on the 3150 grid (firm conditions vs forward
s11 reached), at both the current Λ bound and 189. BW2: validate passes.

## Results (after the lock; lock committed in build/upgrades git d6528a2 at 22:59:22 −0600)
- BW1 HELD. A region read literally from the new B4 and B5 firm conditions was compared with forward "s11 reached" on the 3150 grid:
  - current engine (Λ bound 57.5): 127 points in both, 0 backward-only, 0 forward-only;
  - with the Λ = 189 revision: 140 points in both, 0 backward-only, 0 forward-only.
  Before the fix, the same comparison found 31 backward-only and 6 forward-only points (slate A5).
- BW2 HELD: `python3 -m verify` valid (459 files, 71 warnings); gen_stages ok; pytest 87 passed. No engine file touched.
