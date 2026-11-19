# LOCKED: source status of the star-window and Coulomb-barrier claims (docs/data notes only)
Locked 2026-11-16 by Physicist, after reading Adams 2019 (arXiv:1902.03928) and Adams 2008 (arXiv:0807.3697) this session.
Verified quotes:
- Adams 2019 eq. (23), p.26 (from eqs. A.4–A.5): β^(−3/4) α^(3/2) ≲ 100, or β ≳ 10^(−8/3) α². The β/α² form and the 10^(−8/3)
  threshold used by l.s07.star-mass-window are in this source: VERIFIED.
- Adams 2019 eq. (24), p.26: α²β ≳ constant ≈ 2.62 × 10⁻¹² ≈ 9.03 × 10⁻⁵ α0²β0. VERIFIED for l.s07.coulomb-barrier.
- Adams 2008 eq. (44), p.15–16: ours sits a factor ∼11,000 inside the burning limit at fixed particle masses, with κ0 ∝ α².
  This gives α_min = α0/√11000 = 0.00953 α0, against the atlas's 0.00950 α0 at our β: AGREES. Adams 2008 fixes m_e, so the
  β-dependence comes from Adams 2019, not from Adams 2008.
- Adams 2008 eqs. (41)–(45): the mass-window closure depends on kT_nuc/m_e c², with T_nuc from eq. (42), which depends on G, C,
  m_e³κ0. So the single-combination β/α² law is Adams 2019's simplified scaling; Adams 2008's model does not reduce to it.
Change: add these facts to the notes of the two links. No condition, label or engine change.
Prediction SW1: validate passes; engine untouched.

## Results (after the lock; lock committed in build/upgrades git d6528a2)
- SW1 HELD: `python3 -m verify` valid (459 files, 71 warnings); pytest 87 passed. Only the notes of two link yaml files changed; no condition, label or engine change.
