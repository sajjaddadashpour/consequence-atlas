"""H8 a-priori power (THEORY ONLY, no V(L) from zeros). Run at lock time by Physicist; output is SEEN.
SE model (DERIVED, Gaussian-count approximation): SE(L)/V(L) = sqrt(2 L / N), N = 10^4 unfolded levels.
Heights E0 come from the file headers + median offset (no statistic of the zeros is used)."""
import sys, os, math, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h8_berry_locked as h
N = 1e4
for wi, name in enumerate(("zeros3", "zeros4", "zeros5")):
    off, d, _ = h.load(name); E0 = off + float(np.median(d)); LS, lmax = h.L_sat(E0)
    rng = np.random.default_rng([20261124, 99, wi]); X = math.exp(0.25 * math.log(E0 / (2 * np.pi)))
    for reg, Ls in (("G", h.L_GUE), ("S", LS)):
        vb, vg = h.V_berry(Ls, E0), h.V_gue(Ls); se = vb * np.sqrt(2 * Ls / N)
        pc = [h.zrms(vb, h.V_berry(Ls, E0, primes=h.cramer_primes(X, rng)), se) for _ in range(20)]
        print(f"{name} E0={E0:.4g} L_max={lmax:.3f} regime {reg} L=[{Ls[0]},{Ls[-1]}] n={len(Ls)}: "
              f"power Berry-vs-GUE={h.zrms(vb, vg, se):.2f}  Berry-vs-Cramer median={np.median(pc):.2f} (range {min(pc):.2f}-{max(pc):.2f}); "
              f"mean rel. gap Berry-GUE={np.mean(np.abs(vb - vg) / vb):.3f}")
